import {
  ACTIVITY,
  EXHAUSTION_ENERGY,
  JOB_XP_PER_HOUR,
  NEWS_AMBIENT_EVERY_DAYS,
  PRACTICE_XP_PER_HOUR,
  SOCIAL_AFFINITY_PER_HOUR,
  REAL_SECONDS_PER_GAME_HOUR,
  STUDY_XP,
  efficiencyFrom,
  DAYS_PER_STEP,
  incomeTax,
} from './balance'
import { addMoney, addStat } from './effects'
import { directorTick } from './events'
import { clamp } from './format'
import { modAdd, modMult } from './mods'
import { C } from './registry'
import { npcState } from './state'
import { ambientNews, dailyForum, deliverPending, expireThreads } from './story'
import { checkQuests, checkTriggers, hasTimedQuest } from './quests'
import { log } from './text'
import type { ActivityId, GameState, SkillId } from './types'
import { addJobXp, dailyPay, jobProgress } from './sim/jobs'
import { attendClass, completeCourse } from './sim/education'
import { dailyContracts, practiceHour, refreshBoard, workHour } from './sim/contracts'
import { dailyHeat, dailyJail } from './sim/heat'
import { endOfDayLife } from './sim/life'
import { addSkillXp } from './sim/skills'

// ────────────────────────────────────────────────────────────────────────────
// Speed control (with the story "speed governor")
// ────────────────────────────────────────────────────────────────────────────

export function pause(state: GameState): void {
  if (state.time.speed > 0) state.time.lastSpeed = state.time.speed
  state.time.speed = 0
}

/** Highest speed currently allowed: 2x while a timed quest stage is running. */
export function maxSpeed(state: GameState): number {
  return hasTimedQuest(state) ? 2 : 10
}

export function setSpeed(state: GameState, speed: number): void {
  const s = Math.min(speed, maxSpeed(state))
  if (s > 0) state.time.lastSpeed = s
  state.time.speed = s
}

export function resume(state: GameState): void {
  setSpeed(state, state.time.lastSpeed > 0 ? state.time.lastSpeed : 1)
}

// ────────────────────────────────────────────────────────────────────────────
// Main tick
// ────────────────────────────────────────────────────────────────────────────

/** Advance real time. Returns the number of game hours simulated. */
export function tick(state: GameState, realSeconds: number): number {
  if (state.time.speed <= 0) return 0
  if (state.ending && !state.flags['sys.postgame']) return 0
  if (state.time.speed > maxSpeed(state)) state.time.speed = maxSpeed(state)
  state.time.frac += (realSeconds * state.time.speed) / REAL_SECONDS_PER_GAME_HOUR
  let hours = 0
  // Guard against huge frame gaps (tab switch): cap at 2 simulated days per tick.
  if (state.time.frac > 48) state.time.frac = 48
  while (state.time.frac >= 1) {
    state.time.frac -= 1
    simulateHour(state)
    hours++
    if (state.time.speed <= 0) {
      state.time.frac = 0
      break
    }
  }
  return hours
}

/** Simulate N game hours at once (tests, bots, debug fast-forward). Stops early when paused by story. */
export function simulateHours(state: GameState, n: number, stopOnPause = true): number {
  let done = 0
  for (; done < n; done++) {
    simulateHour(state)
    if (stopOnPause && state.time.speed <= 0) {
      done++
      break
    }
  }
  return done
}

export function currentActivity(state: GameState): ActivityId | 'jail' | 'hospital' {
  if (state.hospital) return 'hospital'
  if (state.jail) return 'jail'
  return state.schedule[state.time.hour] ?? 'relax'
}

export function efficiency(state: GameState): number {
  const s = state.stats
  return efficiencyFrom(s.energy, s.stress, s.health, s.mood) * modMult(state, 'efficiency')
}

export function simulateHour(state: GameState): void {
  const act = currentActivity(state)
  // Gains accumulate for the whole week this simulated hour stands for.
  const eff = efficiency(state) * DAYS_PER_STEP
  runActivity(state, act, eff)

  state.time.totalHours += 1
  state.time.hour += 1
  if (state.time.hour >= 24) {
    state.time.hour = 0
    endOfDay(state)
    state.time.day += DAYS_PER_STEP
    startOfDay(state)
  }
  deliverPending(state)
  checkQuests(state)
  checkTriggers(state)
}

function drainEnergy(state: GameState, amount: number): void {
  // amount < 0 = drain
  if (amount < 0) addStat(state, 'energy', amount * modMult(state, 'energy.drain'))
  else addStat(state, 'energy', amount)
}

function changeStress(state: GameState, amount: number): void {
  if (amount > 0) addStat(state, 'stress', amount * modMult(state, 'stress.gain'))
  else addStat(state, 'stress', amount * modMult(state, 'stress.relief'))
}

function studyXp(state: GameState, skill: SkillId, eff: number, base = STUDY_XP): void {
  const xp = (base * modMult(state, `xp.${skill}`) * modMult(state, 'xp.all') + modAdd(state, `xp.${skill}`)) * eff
  addSkillXp(state, skill, xp)
}

function runActivity(state: GameState, act: ActivityId | 'jail' | 'hospital', eff: number): void {
  if (act === 'hospital') {
    addStat(state, 'energy', 6)
    addStat(state, 'health', 0.6)
    changeStress(state, -0.5)
    return
  }
  if (act === 'jail') {
    const sleeping = state.schedule[state.time.hour] === 'sleep'
    if (sleeping) addStat(state, 'energy', ACTIVITY.sleep.energy * 0.7)
    else addStat(state, 'energy', -1)
    changeStress(state, 0.4)
    return
  }
  const p = ACTIVITY[act]
  if (act === 'sleep') {
    const house = C.housing.get(state.housing)
    addStat(state, 'energy', p.energy * (house?.comfort ?? 1) * modMult(state, 'energy.regen'))
    changeStress(state, p.stress)
    addStat(state, 'health', p.health)
    return
  }

  // Awake: exhaustion hurts.
  if (state.stats.energy <= EXHAUSTION_ENERGY) addStat(state, 'health', -0.3)

  switch (act) {
    case 'work': {
      const job = state.job ? C.jobs.get(state.job) : undefined
      if (!job) break
      addJobXp(state, job.id, JOB_XP_PER_HOUR * eff * modMult(state, 'jobXp'))
      for (const [skill, xp] of Object.entries(job.skillXp) as [SkillId, number][]) addSkillXp(state, skill, xp * eff)
      drainEnergy(state, -job.energyPerHour)
      changeStress(state, job.stressPerHour)
      addStat(state, 'mood', p.mood)
      state.workedToday += 1
      return
    }
    case 'class': {
      const e = state.edu.enrolled
      const prog = e ? C.programs.get(e.program) : undefined
      if (prog) {
        for (const [skill, xp] of Object.entries(prog.skillXp) as [SkillId, number][]) addSkillXp(state, skill, xp * eff)
        attendClass(state, DAYS_PER_STEP)
      }
      break
    }
    case 'study': {
      const f = state.focus.study
      if (f.kind === 'course') {
        const course = C.courses.get(f.course)
        if (course && state.edu.coursesOwned.includes(course.id)) {
          for (const [skill, xp] of Object.entries(course.skillXp) as [SkillId, number][]) studyXp(state, skill, eff, xp)
          const prog = (state.edu.courseProgress[course.id] ?? 0) + eff
          state.edu.courseProgress[course.id] = prog
          if (prog >= course.hours) completeCourse(state, course.id)
          break
        }
        state.focus.study = { kind: 'skill', skill: 'programming' }
      }
      const skill = state.focus.study.kind === 'skill' ? state.focus.study.skill : 'programming'
      studyXp(state, skill, eff)
      break
    }
    case 'hack':
      if (!workHour(state, 'hack', eff)) practiceHour(state, 'hack', eff, PRACTICE_XP_PER_HOUR)
      break
    case 'freelance':
      if (!workHour(state, 'freelance', eff)) practiceHour(state, 'freelance', eff, PRACTICE_XP_PER_HOUR)
      break
    case 'exercise':
      studyXp(state, 'fitness', eff)
      break
    case 'social': {
      const target = state.focus.social
      if (target) {
        const s = npcState(state, target)
        const ok = s.met && !['dead', 'missing', 'gone', 'jailed', 'arrested'].includes(s.fate)
        if (ok) {
          // ≈ +1.5/day for 2-3 social hours at social 0 (bible §4.7).
          const gain = SOCIAL_AFFINITY_PER_HOUR * (1 + state.skills.social.level / 60) * eff
          s.affinity = clamp(s.affinity + gain, -100, 100)
          touchNpc(state, target)
        }
      }
      addSkillXp(state, 'social', PRACTICE_XP_PER_HOUR * eff * 0.8)
      break
    }
    case 'relax':
      break
  }
  drainEnergy(state, p.energy)
  changeStress(state, p.stress)
  addStat(state, 'mood', p.mood)
  addStat(state, 'health', p.health)
}

function endOfDay(state: GameState): void {
  // Salary, prorated by hours actually worked.
  if (state.job) {
    const job = C.jobs.get(state.job)
    if (job && state.workedToday > 0) {
      const gross = Math.round((dailyPay(state, job) * Math.min(state.workedToday, job.hours)) / job.hours)
      // Tax brackets are per working day; the paycheck covers the whole week.
      const tax = incomeTax(gross)
      const net = (gross - tax) * DAYS_PER_STEP
      addMoney(state, net)
      jobProgress(state, job.id).days += DAYS_PER_STEP
      log(state, `Weekly paycheck: +$${net} (${job.title}; $${tax * DAYS_PER_STEP} tax)`, 'money')
    }
  }
  state.workedToday = 0
  endOfDayLife(state)
  dailyHeat(state)
  dailyJail(state)
  expireThreads(state)
}

function startOfDay(state: GameState): void {
  dailyContracts(state)
  directorTick(state)
  ambientNews(state, NEWS_AMBIENT_EVERY_DAYS)
  dailyForum(state)
  affinityDrift(state)
}

/**
 * Neglect is mechanized (bible §4.7): weekly, NPCs with `decay` lose affinity if you spent no
 * social time with them and got no scene from them in the last 7 days.
 */
function affinityDrift(state: GameState): void {
  for (const [id, s] of Object.entries(state.npcs)) {
    if (!s.met || s.affinity <= 0) continue
    const decay = C.npcs.get(id)?.decay ?? 0
    if (decay <= 0 || ['dead', 'missing', 'gone'].includes(s.fate)) continue
    const last = state.vars[`aff.last.${id}`] ?? -999
    // Contact during the previous turn counts (touch day = start of that turn, 7 days ago).
    if (state.time.day - last > DAYS_PER_STEP) s.affinity = Math.max(0, s.affinity - decay * (DAYS_PER_STEP / 7))
  }
}

/** Mark contact with an NPC (resets the neglect clock). */
export function touchNpc(state: GameState, id: string): void {
  state.vars[`aff.last.${id}`] = state.time.day
}

/** Call once when a new game starts. */
export function bootstrap(state: GameState): void {
  refreshBoard(state, true)
  dailyForum(state)
  checkQuests(state)
  checkTriggers(state)
}
