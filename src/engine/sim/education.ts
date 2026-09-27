import { skillMod } from '../balance'
import { evalCond } from '../conditions'
import { addMoney, applyEffects } from '../effects'
import { modAdd } from '../mods'
import { C } from '../registry'
import { d20 } from '../rng'
import { notify } from '../text'
import type { GameState, ProgramId, RollRecord } from '../types'
import { shiftsOverlap } from './jobs'
import { rebuildFixedSlots } from './schedule'

export interface EnrollResult {
  ok: boolean
  reason?: string
  roll?: RollRecord
}

export function enroll(state: GameState, id: ProgramId, force = false): EnrollResult {
  const prog = C.programs.get(id)
  if (!prog) return { ok: false, reason: 'Unknown program.' }
  if (state.edu.enrolled) return { ok: false, reason: 'Already enrolled.' }
  if (state.edu.degrees.includes(id)) return { ok: false, reason: 'You already graduated.' }
  if (!force) {
    if (!evalCond(state, prog.req)) return { ok: false, reason: 'Requirements not met.' }
    if (state.stats.money < prog.tuitionPerSemester) return { ok: false, reason: 'Not enough money for tuition.' }
    if (state.job) {
      const job = C.jobs.get(state.job)
      if (job && shiftsOverlap(job.shiftStart, job.hours, prog.classStart, prog.classHours)) {
        return { ok: false, reason: 'Classes overlap your job shift.' }
      }
    }
  }
  let roll: RollRecord | undefined
  if (prog.exam && !force) {
    const die = d20(state)
    const mod = skillMod(state.skills[prog.exam.skill].level) + modAdd(state, `check.${prog.exam.skill}`) + modAdd(state, 'check.all')
    const total = die + mod
    const success = die === 20 || (die !== 1 && total >= prog.exam.dc)
    roll = { skill: prog.exam.skill, d20: die, mod, dc: prog.exam.dc, total, success }
    state.flags[`edu.exam_tried.${id}`] = true
    if (!success) {
      state.flags[`edu.exam_failed.${id}`] = true
      notify(state, `Entrance exam failed (${total} vs DC ${prog.exam.dc}). Try again next year.`, 'bad')
      state.flags[`edu.exam_retry_day.${id}`] = state.time.day + 180
      return { ok: false, reason: 'Entrance exam failed.', roll }
    }
  }
  if (!force) addMoney(state, -prog.tuitionPerSemester)
  state.edu.enrolled = { program: id, semester: 1, hours: 0 }
  rebuildFixedSlots(state)
  notify(state, `Enrolled: ${prog.name}`, 'good')
  return { ok: true, ...(roll ? { roll } : {}) }
}

export function dropout(state: GameState): void {
  const e = state.edu.enrolled
  if (!e) return
  state.flags[`edu.dropout.${e.program}`] = true
  state.edu.enrolled = null
  rebuildFixedSlots(state)
  notify(state, 'You dropped out of university.', 'bad')
}

export function grantDegree(state: GameState, id: ProgramId): void {
  if (!state.edu.degrees.includes(id)) state.edu.degrees.push(id)
  if (state.edu.enrolled?.program === id) {
    state.edu.enrolled = null
    rebuildFixedSlots(state)
  }
  const prog = C.programs.get(id)
  notify(state, `Graduated: ${prog?.name ?? id}!`, 'good')
  applyEffects(state, prog?.onGraduate)
}

/** Called per class hour attended. */
/** Called per class hour attended; `hours` = calendar class-hours it stands for (weekly turns). */
export function attendClass(state: GameState, hours = 1): void {
  const e = state.edu.enrolled
  if (!e) return
  const prog = C.programs.get(e.program)
  if (!prog) return
  e.hours += hours
  if (e.hours >= prog.hoursPerSemester) {
    if (e.semester >= prog.semesters) {
      grantDegree(state, prog.id)
      return
    }
    if (state.stats.money < prog.tuitionPerSemester) {
      notify(state, `Can't pay tuition for semester ${e.semester + 1}. You were expelled.`, 'bad')
      state.flags[`edu.expelled.${prog.id}`] = true
      dropout(state)
      return
    }
    addMoney(state, -prog.tuitionPerSemester)
    e.semester += 1
    e.hours = 0
    notify(state, `${prog.name}: semester ${e.semester}/${prog.semesters} begins.`, 'info')
  }
}

export function buyCourse(state: GameState, id: string): boolean {
  const c = C.courses.get(id)
  if (!c) return false
  if (state.edu.courses.includes(id) || state.edu.coursesOwned.includes(id)) return false
  if (!evalCond(state, c.req) || state.stats.money < c.price) return false
  addMoney(state, -c.price)
  state.edu.coursesOwned.push(id)
  state.edu.courseProgress[id] = 0
  state.focus.study = { kind: 'course', course: id }
  notify(state, `Bought course: ${c.name}. Set as study focus.`, 'good')
  return true
}

export function completeCourse(state: GameState, id: string): void {
  const c = C.courses.get(id)
  if (!c) return
  if (!state.edu.courses.includes(id)) state.edu.courses.push(id)
  state.edu.coursesOwned = state.edu.coursesOwned.filter(x => x !== id)
  if (state.focus.study.kind === 'course' && state.focus.study.course === id) {
    state.focus.study = { kind: 'skill', skill: 'programming' }
  }
  notify(state, `Course completed: ${c.name}`, 'good')
  applyEffects(state, c.onComplete)
}
