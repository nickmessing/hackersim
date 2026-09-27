/**
 * The event director and complications.
 *
 * - Random events (`EventDef` without `complication`): once per weekly turn the director rolls
 *   EVENT_BASE_CHANCE + EVENT_QUIET_BONUS × quiet turns; on a hit it picks a weighted eligible
 *   event, preferring categories not seen recently, so something is always happening.
 * - Complications (`EventDef` with `complication`): consequence sub-stories. Never picked by the
 *   director; spawned by `{ complication: source }` effects, traced hack ops and failed gigs.
 */
import {
  EVENT_BASE_CHANCE,
  EVENT_DEFAULT_COOLDOWN,
  EVENT_QUIET_BONUS,
  EVENT_RECENT_MEMORY,
} from './balance'
import { evalCond } from './conditions'
import { applyEffects } from './effects'
import { C } from './registry'
import { rand, weighted } from './rng'
import { deliverScene } from './story'
import type { ComplicationSource, EventDef, GameState } from './types'

function available(state: GameState, e: EventDef): boolean {
  const rec = state.events.fired[e.id]
  if (rec && rec.count > 0) {
    if (!e.repeatable) return false
    if (state.time.day - rec.lastDay < (e.cooldownDays ?? EVENT_DEFAULT_COOLDOWN)) return false
  }
  // Don't stack a second copy of an event whose scene is still waiting for an answer.
  if (e.scene && state.threads.some(t => t.scene === e.scene && (t.status === 'unread' || t.status === 'open'))) return false
  return evalCond(state, e.when)
}

/** Fire an event now (scene + effects), recording it. Returns false for unknown ids. */
export function fireEvent(state: GameState, id: string): boolean {
  const e = C.events.get(id)
  if (!e) {
    console.warn(`[events] unknown event "${id}"`)
    return false
  }
  const rec = state.events.fired[id]
  state.events.fired[id] = { count: (rec?.count ?? 0) + 1, lastDay: state.time.day }
  if (!e.complication) {
    state.events.recent = [e.category, ...state.events.recent].slice(0, EVENT_RECENT_MEMORY)
  }
  state.events.quietTurns = 0
  applyEffects(state, e.effects)
  if (e.scene) deliverScene(state, e.scene)
  return true
}

/** Probability the director fires this turn. */
export function directorChance(state: GameState): number {
  return Math.min(1, EVENT_BASE_CHANCE + EVENT_QUIET_BONUS * state.events.quietTurns)
}

/** Once per weekly turn (start of turn). */
export function directorTick(state: GameState): void {
  // A story scene last turn counts as "something happened".
  const busy = state.events.lastSceneDay >= state.time.day - 7 && state.time.day > 0
  if (rand(state) >= directorChance(state)) {
    state.events.quietTurns = busy ? 0 : state.events.quietTurns + 1
    return
  }
  const pool = [...C.events.values()].filter(e => !e.complication && available(state, e))
  if (pool.length === 0) {
    state.events.quietTurns += 1
    return
  }
  const recent = new Set(state.events.recent)
  const fresh = pool.filter(e => !recent.has(e.category))
  const pickFrom = fresh.length > 0 ? fresh : pool
  const pick = weighted(state, pickFrom, e => e.weight ?? 1)
  if (pick) fireEvent(state, pick.id)
}

/** Current act as a default severity tier (1..4, capped at 5). */
function defaultTier(state: GameState): number {
  return Math.max(1, Math.min(5, state.vars.act ?? 1))
}

/**
 * Spawn a complication for `source` at `tier`. Prefers exact source matches over 'any'.
 * Returns the event id, or undefined if nothing eligible exists.
 */
export function triggerComplication(state: GameState, source: ComplicationSource, tier?: number): string | undefined {
  const t = tier ?? defaultTier(state)
  const fits = (e: EventDef): boolean => {
    const c = e.complication
    if (!c) return false
    if ((c.minTier ?? 1) > t || (c.maxTier ?? 5) < t) return false
    return available(state, e)
  }
  const all = [...C.events.values()].filter(fits)
  const exact = all.filter(e => e.complication?.sources.includes(source))
  const generic = all.filter(e => e.complication?.sources.includes('any'))
  const pool = exact.length > 0 ? exact : generic
  const pick = weighted(state, pool, e => e.weight ?? 1)
  if (!pick) return undefined
  fireEvent(state, pick.id)
  return pick.id
}
