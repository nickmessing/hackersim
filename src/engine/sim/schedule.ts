import { C } from '../registry'
import type { ActivityId, GameState, PaintableActivity } from '../types'

/** Hours occupied by the current job shift. */
export function jobHours(state: GameState): Set<number> {
  const out = new Set<number>()
  if (!state.job) return out
  const job = C.jobs.get(state.job)
  if (!job) return out
  for (let i = 0; i < job.hours; i++) out.add((job.shiftStart + i) % 24)
  return out
}

/** Hours occupied by university classes. */
export function classHours(state: GameState): Set<number> {
  const out = new Set<number>()
  const e = state.edu.enrolled
  if (!e) return out
  const prog = C.programs.get(e.program)
  if (!prog) return out
  for (let i = 0; i < prog.classHours; i++) out.add((prog.classStart + i) % 24)
  return out
}

/** Re-place work/class slots after a job/enrollment change. Freed slots become 'relax'. */
export function rebuildFixedSlots(state: GameState): void {
  const work = jobHours(state)
  const cls = classHours(state)
  for (let h = 0; h < 24; h++) {
    const cur = state.schedule[h]
    if (work.has(h)) state.schedule[h] = 'work'
    else if (cls.has(h)) state.schedule[h] = 'class'
    else if (cur === 'work' || cur === 'class') state.schedule[h] = 'relax'
  }
}

/** Paint a player activity onto an hour (work/class hours are locked). */
export function setSlot(state: GameState, hour: number, activity: PaintableActivity): boolean {
  const cur = state.schedule[hour]
  if (cur === undefined || cur === 'work' || cur === 'class') return false
  state.schedule[hour] = activity
  state.flags['sys.schedule_edited'] = true
  return true
}

export function countSlots(state: GameState, activity: ActivityId): number {
  return state.schedule.filter(a => a === activity).length
}

/** Built-in routine presets. */
export const PRESETS: Record<string, { label: string; build: (free: number[]) => Record<number, PaintableActivity> }> = {
  balanced: {
    label: 'Balanced',
    build: free => spread(free, [
      ['sleep', 8],
      ['study', 3],
      ['relax', 2],
      ['exercise', 1],
      ['social', 1],
      ['hack', 2],
      ['freelance', 2],
    ]),
  },
  grind: {
    label: 'Grind',
    build: free => spread(free, [
      ['sleep', 7],
      ['study', 5],
      ['hack', 3],
      ['freelance', 3],
      ['relax', 1],
    ]),
  },
  hacker: {
    label: 'Night owl hacker',
    build: free => spread(free, [
      ['sleep', 7],
      ['hack', 6],
      ['study', 2],
      ['relax', 2],
    ]),
  },
  recover: {
    label: 'Recover',
    build: free => spread(free, [
      ['sleep', 10],
      ['relax', 5],
      ['social', 2],
      ['exercise', 1],
    ]),
  },
}

/**
 * Fill free hours with blocks in order. Iteration starts at 23:00 when free (so the sleep block
 * straddles midnight), otherwise at the earliest free hour; leftover hours become 'relax'.
 */
function spread(free: number[], plan: [PaintableActivity, number][]): Record<number, PaintableActivity> {
  const out: Record<number, PaintableActivity> = {}
  const sorted = [...free].sort((x, y) => x - y)
  const startIdx = Math.max(0, sorted.indexOf(23))
  const order = [...sorted.slice(startIdx), ...sorted.slice(0, startIdx)]
  let i = 0
  for (const [act, n] of plan) {
    for (let k = 0; k < n; k++) {
      const h = order[i]
      if (h === undefined) return out
      out[h] = act
      i++
    }
  }
  for (const h of order.slice(i)) out[h] = 'relax'
  return out
}

export function applyPreset(state: GameState, preset: string): void {
  const p = PRESETS[preset]
  if (!p) return
  const free: number[] = []
  for (let h = 0; h < 24; h++) {
    const cur = state.schedule[h]
    if (cur !== 'work' && cur !== 'class') free.push(h)
  }
  state.flags['sys.schedule_edited'] = true
  const plan = p.build(free)
  for (const [h, act] of Object.entries(plan)) state.schedule[Number(h)] = act
}
