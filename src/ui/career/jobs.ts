/** Career Center helpers (display math around engine job functions). */
import { balance, C, canTakeJob, dailyPay, type ActivityId, type GameState, type JobDef } from '@/engine'
import { activityLabel, hoursSet } from './labels'

export function maxLevel(job: JobDef): number {
  return job.maxLevel ?? balance.JOB_MAX_LEVEL_DEFAULT
}

export function levelOf(state: GameState, job: JobDef): number {
  return state.jobs[job.id]?.level ?? 0
}

export interface PayInfo {
  total: number
  perHour: number
  /** Tooltip text explaining the number. */
  why: string
  /** Pay at the next level, or null at the cap. */
  next: number | null
}

export function payInfo(state: GameState, job: JobDef): PayInfo {
  const level = levelOf(state, job)
  const total = dailyPay(state, job)
  const levelMult = 1 + balance.JOB_PAY_GROWTH * level
  const baseAtLevel = job.pay * levelMult
  const other = baseAtLevel > 0 ? total / baseAtLevel : 1
  const lines = [`Base pay: $${job.pay}/day`, `Level ${level}: ×${levelMult.toFixed(2)} (+${Math.round(balance.JOB_PAY_GROWTH * 100)}% per level)`]
  if (Math.abs(other - 1) > 0.005) lines.push(`Gear, perks & market: ×${other.toFixed(2)}`)
  lines.push(`= $${total}/day for a full ${job.hours}h shift`)
  const next = level >= maxLevel(job) ? null : Math.round((total * (1 + balance.JOB_PAY_GROWTH * (level + 1))) / levelMult)
  return { total, perHour: job.hours > 0 ? total / job.hours : 0, why: lines.join('\n'), next }
}

/** Painted planner hours a shift would take over, e.g. [{ label: 'Study', hours: 3 }]. */
export function shiftTakes(state: GameState, job: JobDef): { act: ActivityId; label: string; hours: number }[] {
  const counts = new Map<ActivityId, number>()
  for (const h of hoursSet(job.shiftStart, job.hours)) {
    const a = state.schedule[h]
    if (a === undefined || a === 'work' || a === 'class') continue
    counts.set(a, (counts.get(a) ?? 0) + 1)
  }
  return [...counts.entries()].map(([act, hours]) => ({ act, label: activityLabel(act), hours })).sort((a, b) => b.hours - a.hours)
}

export type ApplyStatus = 'current' | 'ok' | 'locked'

export function applyStatus(state: GameState, job: JobDef): { status: ApplyStatus; reason: string } {
  if (state.job === job.id) return { status: 'current', reason: 'Your current job' }
  const check = canTakeJob(state, job)
  return check.ok ? { status: 'ok', reason: '' } : { status: 'locked', reason: check.reason ?? 'Not available.' }
}

export function currentJob(state: GameState): JobDef | undefined {
  return state.job ? C.jobs.get(state.job) : undefined
}
