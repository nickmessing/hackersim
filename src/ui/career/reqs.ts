/**
 * Requirement helpers: split a `Cond` into displayable parts (each met / unmet) and decide
 * whether a locked thing is "close" enough to be advertised (job board visibility default).
 * Conditions containing `chance` are never evaluated here (that would consume the RNG).
 */
import { ageOn, describeCond, evalCond, numRef, type Cond, type GameState, type JobDef } from '@/engine'

export interface ReqPart {
  text: string
  met: boolean
  /** Hidden story gate (describeCond has no words for it). */
  secret: boolean
}

function hasChance(c: Cond): boolean {
  if ('chance' in c) return true
  if ('all' in c) return c.all.some(hasChance)
  if ('any' in c) return c.any.some(hasChance)
  if ('not' in c) return hasChance(c.not)
  return false
}

/** evalCond that never rolls dice. */
export function condMet(state: GameState, cond: Cond | undefined): boolean {
  if (!cond) return true
  if (hasChance(cond)) return false
  return evalCond(state, cond)
}

function flatten(c: Cond): Cond[] {
  return 'all' in c ? c.all.flatMap(flatten) : [c]
}

/** Requirement parts for display, in authored order. Met secret gates are omitted. */
export function reqParts(state: GameState, cond: Cond | undefined): ReqPart[] {
  if (!cond) return []
  const out: ReqPart[] = []
  let secretUnmet = false
  for (const c of flatten(cond)) {
    const text = describeCond(c)
    const met = condMet(state, c)
    if (!text) {
      if (!met) secretUnmet = true
      continue
    }
    out.push({ text, met, secret: false })
  }
  if (secretUnmet) out.push({ text: 'Something you have not done yet', met: false, secret: true })
  return out
}

interface Range {
  gte?: number
  lte?: number
  eq?: number
}

function near(v: number, r: Range, slack: number): boolean {
  if (r.gte !== undefined && v + slack < r.gte) return false
  if (r.lte !== undefined && v - slack > r.lte) return false
  if (r.eq !== undefined && Math.abs(v - r.eq) > slack) return false
  return true
}

/**
 * Is an unmet condition within reach? Numbers are close within a margin (skills ±10,
 * faction ±15, money half-way, a job level ±3 if you have held that job); story gates are
 * never "close" — the story reveals them.
 */
export function isClose(state: GameState, cond: Cond | undefined): boolean {
  if (!cond) return true
  if (hasChance(cond)) return false
  if (evalCond(state, cond)) return true
  if ('all' in cond) return cond.all.every(c => isClose(state, c))
  if ('any' in cond) return cond.any.some(c => isClose(state, c))
  if ('skill' in cond) return near(state.skills[cond.skill].level, cond, 10)
  if ('stat' in cond) {
    const v = state.stats[cond.stat]
    const slack = cond.stat === 'money' ? Math.max(250, (cond.gte ?? 0) * 0.5) : 10
    return near(v, cond, slack)
  }
  if ('faction' in cond) return near(state.factions[cond.faction] ?? 0, cond, 15)
  if ('age' in cond) return near(ageOn(state.time.day), cond, 1)
  if ('day' in cond) return near(state.time.day, cond, 30)
  if ('n' in cond) return near(numRef(state, cond.n), cond, 10)
  if ('jobLevel' in cond) {
    const p = state.jobs[cond.jobLevel]
    if (!p) return (cond.gte ?? 0) <= 1
    return near(p.level, cond, 3)
  }
  if ('degree' in cond) {
    const e = state.edu.enrolled
    return e !== null && (cond.degree === true || e.program === cond.degree)
  }
  if ('course' in cond) return state.edu.coursesOwned.includes(cond.course)
  return false
}

/** Job board visibility: explicit `visible`, else "requirements met or close". Held jobs always show. */
export function jobVisible(state: GameState, job: JobDef): boolean {
  if (state.job === job.id || state.jobs[job.id] !== undefined) return true
  if (job.visible) return condMet(state, job.visible)
  return isClose(state, job.req)
}
