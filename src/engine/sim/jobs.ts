import { JOB_MAX_LEVEL_DEFAULT, JOB_PAY_GROWTH, jobXpToNext } from '../balance'
import { evalCond } from '../conditions'
import { modMult, worldMult } from '../mods'
import { C } from '../registry'
import { log, notify } from '../text'
import type { GameState, JobDef, JobId, JobProgress } from '../types'
import { rebuildFixedSlots } from './schedule'

export function jobProgress(state: GameState, id: JobId): JobProgress {
  let p = state.jobs[id]
  if (!p) {
    p = { level: 0, xp: 0, days: 0 }
    state.jobs[id] = p
  }
  return p
}

/** IT tracks are affected by the world IT salary multiplier. */
const IT_TRACKS = new Set(['support', 'dev', 'sysadmin', 'network', 'security', 'management', 'startup'])

export function dailyPay(state: GameState, job: JobDef): number {
  const level = state.jobs[job.id]?.level ?? 0
  let pay = job.pay * (1 + JOB_PAY_GROWTH * level) * modMult(state, 'pay')
  if (IT_TRACKS.has(job.track)) pay *= worldMult(state, 'w.itSalary')
  return Math.round(pay)
}

export function canTakeJob(state: GameState, job: JobDef): { ok: boolean; reason?: string } {
  if (state.jail) return { ok: false, reason: 'You are in jail.' }
  if (!evalCond(state, job.req)) return { ok: false, reason: 'Requirements not met.' }
  const enrolled = state.edu.enrolled
  if (enrolled) {
    const prog = C.programs.get(enrolled.program)
    if (prog && shiftsOverlap(job.shiftStart, job.hours, prog.classStart, prog.classHours)) {
      return { ok: false, reason: 'Shift overlaps your university classes.' }
    }
  }
  return { ok: true }
}

export function shiftsOverlap(aStart: number, aLen: number, bStart: number, bLen: number): boolean {
  const a = new Set<number>()
  for (let i = 0; i < aLen; i++) a.add((aStart + i) % 24)
  for (let i = 0; i < bLen; i++) if (a.has((bStart + i) % 24)) return true
  return false
}

/** Hire (or with id null, quit). `force` skips requirement checks (story effects). */
export function setJob(state: GameState, id: JobId | null, force = false): boolean {
  if (id === null) {
    if (state.job) log(state, `You no longer work as ${C.jobs.get(state.job)?.title ?? state.job}.`, 'info')
    state.job = null
    rebuildFixedSlots(state)
    return true
  }
  const job = C.jobs.get(id)
  if (!job) return false
  if (!force) {
    const check = canTakeJob(state, job)
    if (!check.ok) return false
  }
  state.job = id
  jobProgress(state, id)
  rebuildFixedSlots(state)
  notify(state, `New job: ${job.title} at ${job.employer}`, 'good')
  return true
}

export function addJobXp(state: GameState, id: JobId, amount: number): void {
  const job = C.jobs.get(id)
  if (!job) return
  const p = jobProgress(state, id)
  const max = job.maxLevel ?? JOB_MAX_LEVEL_DEFAULT
  if (p.level >= max) return
  p.xp += amount
  let need = jobXpToNext(p.level)
  while (p.xp >= need && p.level < max) {
    p.xp -= need
    p.level += 1
    notify(state, `Promotion! ${job.title} level ${p.level} (pay ${dailyPay(state, job)}/day)`, 'good')
    need = jobXpToNext(p.level)
  }
}

export function jobLevelProgress(state: GameState, id: JobId): number {
  const p = state.jobs[id]
  if (!p) return 0
  return p.xp / jobXpToNext(p.level)
}
