/**
 * Planner estimates: per-hour energy/stress/mood/health deltas of each activity (from
 * `balance.ACTIVITY`, the job profile and the player's modifiers) and a 24-hour projection of
 * energy & stress. These are *estimates* for the UI — the simulation itself lives in the engine
 * (random events, efficiency and story effects are not modeled here).
 */
import { ACTIVITIES, balance, C, clamp, modAdd, modMult, type ActivityId, type GameState } from '@/engine'

export interface Delta {
  energy: number
  stress: number
  mood: number
  health: number
}

interface Mults {
  drain: number
  regen: number
  gain: number
  relief: number
  comfort: number
}

function mults(state: GameState): Mults {
  return {
    drain: modMult(state, 'energy.drain'),
    regen: modMult(state, 'energy.regen'),
    gain: modMult(state, 'stress.gain'),
    relief: modMult(state, 'stress.relief'),
    comfort: C.housing.get(state.housing)?.comfort ?? 1,
  }
}

function stressOf(m: Mults, s: number): number {
  return s > 0 ? s * m.gain : s * m.relief
}

function deltaWith(state: GameState, act: ActivityId, m: Mults): Delta {
  const p = balance.ACTIVITY[act]
  if (act === 'sleep') {
    return { energy: p.energy * m.comfort * m.regen, stress: stressOf(m, p.stress), mood: 0, health: p.health }
  }
  if (act === 'work') {
    const job = state.job ? C.jobs.get(state.job) : undefined
    if (job) return { energy: -job.energyPerHour * m.drain, stress: stressOf(m, job.stressPerHour), mood: p.mood, health: 0 }
  }
  return {
    energy: p.energy < 0 ? p.energy * m.drain : p.energy,
    stress: stressOf(m, p.stress),
    mood: p.mood,
    health: p.health,
  }
}

/** Per-hour effect of one activity for this player right now. */
export function hourDelta(state: GameState, act: ActivityId): Delta {
  return deltaWith(state, act, mults(state))
}

export interface DaySummary {
  hours: Record<ActivityId, number>
  /** Sum of the activity deltas over the scheduled day, per activity. */
  byActivity: Record<ActivityId, Delta>
  /** Once-a-day effects: lifestyle, housing comfort, daily modifiers. */
  daily: Delta
  total: Delta
}

function zero(): Delta {
  return { energy: 0, stress: 0, mood: 0, health: 0 }
}

export function daySummary(state: GameState): DaySummary {
  const m = mults(state)
  const hours = {} as Record<ActivityId, number>
  const byActivity = {} as Record<ActivityId, Delta>
  for (const a of ACTIVITIES) {
    hours[a] = 0
    byActivity[a] = zero()
  }
  const perHour = {} as Record<ActivityId, Delta>
  for (const a of ACTIVITIES) perHour[a] = deltaWith(state, a, m)
  for (const a of state.schedule) {
    hours[a] += 1
    const d = perHour[a]
    const acc = byActivity[a]
    acc.energy += d.energy
    acc.stress += d.stress
    acc.mood += d.mood
    acc.health += d.health
  }
  const life = C.lifestyles.get(state.lifestyle)
  const house = C.housing.get(state.housing)
  const daily: Delta = {
    energy: 0,
    stress: life?.stressPerDay ?? 0,
    mood: (life?.moodPerDay ?? 0) + (house ? (house.comfort - 1) * 4 : 0) + modAdd(state, 'mood.daily'),
    health: (life?.healthPerDay ?? 0) + modAdd(state, 'health.daily'),
  }
  const total = { ...daily }
  for (const a of ACTIVITIES) {
    const d = byActivity[a]
    total.energy += d.energy
    total.stress += d.stress
    total.mood += d.mood
    total.health += d.health
  }
  return { hours, byActivity, daily, total }
}

export interface ForecastPoint {
  /** Clock position 0..24 (end of the simulated hour). */
  x: number
  energy: number
  stress: number
  /** Absolute hour offset from now (0 = now). */
  offset: number
}

export interface Forecast {
  /** From now until midnight. */
  today: ForecastPoint[]
  /** From midnight until this hour tomorrow. */
  tomorrow: ForecastPoint[]
}

/** Project energy & stress for the next 24 hours following the current schedule. */
export function forecast(state: GameState): Forecast {
  const m = mults(state)
  const perHour = {} as Record<ActivityId, Delta>
  for (const a of ACTIVITIES) perHour[a] = deltaWith(state, a, m)
  const lifeStress = C.lifestyles.get(state.lifestyle)?.stressPerDay ?? 0
  const start = state.time.hour
  let e = state.stats.energy
  let s = state.stats.stress
  const today: ForecastPoint[] = [{ x: start, energy: e, stress: s, offset: 0 }]
  const tomorrow: ForecastPoint[] = []
  for (let i = 0; i < 24; i++) {
    const h = (start + i) % 24
    if (h === 0 && i > 0) {
      s = clamp(s + stressOf(m, lifeStress), 0, 100)
      tomorrow.push({ x: 0, energy: e, stress: s, offset: i })
    }
    const act = state.schedule[h] ?? 'relax'
    if (state.hospital) {
      e += 6
      s += stressOf(m, -0.5)
    } else if (state.jail) {
      e += act === 'sleep' ? balance.ACTIVITY.sleep.energy * 0.7 : -1
      s += stressOf(m, 0.4)
    } else {
      const d = perHour[act]
      e += d.energy
      s += d.stress
    }
    e = clamp(e, 0, 100)
    s = clamp(s, 0, 100)
    const pt: ForecastPoint = { x: h + 1, energy: e, stress: s, offset: i + 1 }
    if (start + i + 1 <= 24) today.push(pt)
    else tomorrow.push(pt)
  }
  return { today, tomorrow }
}
