/**
 * PKG-11 — shared helpers for the family & romance side quests.
 *
 * Every file under src/content is auto-discovered, so this module also exports a (small) pack:
 * the romance-ladder guard triggers below.
 *
 * Romance model (bible §8): one shared ladder, flirting → dating → partner → engaged → married.
 * `life.partner` (str: 'mira' | 'grace') is set when a romance reaches `dating` and gates every
 * partner-scoped quest. Partner-scoped quests are written partner-agnostic: they read
 * `life.partner` at the moment a scene plays and branch their text and effects on it.
 *
 * Ladder integrity: this package records the highest rung each partner reached in the numeric var
 * `side.rung.<npc>` (2 dating … 5 married). Other packages set `romance:'flirting'` at their own
 * story beats (e.g. the Act II Mira wall), which could otherwise knock an existing relationship
 * back down a rung; the guard triggers restore the recorded rung while that NPC is still your
 * partner. Breaking up goes through `breakUpWith`, which zeroes the rung.
 */
import { DAYS_PER_STEP } from '@/engine/balance'
import { defineContent } from '@/engine/registry'
import type { Cond, Effect, RomanceState, TextPart, TriggerDef } from '@/engine/types'

export const PARTNERS = ['mira', 'grace'] as const
export type PartnerId = (typeof PARTNERS)[number]

export const partnerIs = (id: PartnerId): Cond => ({ flag: 'life.partner', eq: id })
export const hasPartner: Cond = { flag: 'life.partner' }

/** Romance states that mean "together" at or above the given rung. */
export const AT_LEAST_DATING: RomanceState[] = ['dating', 'partner', 'engaged', 'married']
export const AT_LEAST_PARTNER: RomanceState[] = ['partner', 'engaged', 'married']

const RUNG: Record<RomanceState, number> = { none: 0, ex: 0, flirting: 1, dating: 2, partner: 3, engaged: 4, married: 5 }
const rungVar = (p: PartnerId): string => `side.rung.${p}`

/** The current partner is in one of these romance states. */
export function partnerRomance(states: RomanceState | RomanceState[]): Cond {
  return { any: PARTNERS.map(p => ({ all: [partnerIs(p), { npc: p, romance: states }] })) }
}

/** The current partner's affinity is at least `gte`. */
export function partnerAffinity(gte: number): Cond {
  return { any: PARTNERS.map(p => ({ all: [partnerIs(p), { npc: p, affinityGte: gte }] })) }
}

/** Effects applied to whichever NPC is the current partner. */
export function forPartner(fx: (id: PartnerId) => Effect[]): Effect[] {
  return [{ if: partnerIs('mira'), then: fx('mira'), else: [{ if: partnerIs('grace'), then: fx('grace') }] }]
}

/** One paragraph that reads differently for Mira and for Grace. */
export function byPartner(mira: string, grace: string): TextPart {
  return { if: partnerIs('mira'), text: mira, else: grace }
}

/** Move an NPC to a romance rung (and record it for the ladder guard). */
export function romanceTo(p: PartnerId, state: RomanceState, affinity = 0): Effect[] {
  return [{ npc: p, romance: state, ...(affinity ? { affinity } : {}) }, { var: rungVar(p), set: RUNG[state] }]
}

/** Start dating `p`: the exclusive `dating` rung plus the `life.partner` stake. */
export function startDating(p: PartnerId, affinity: number): Effect[] {
  return [...romanceTo(p, 'dating', affinity), { flag: 'life.partner', set: p }]
}

/** End things with `p` (they become your ex) and clear the partner stake. */
export function breakUpWith(p: PartnerId, affinity = -20): Effect[] {
  return [{ npc: p, romance: 'ex', affinity }, { var: rungVar(p), set: 0 }, { clearFlag: 'life.partner' }]
}

/** Fates after which someone cannot sit at a table with you (bible §4.6 available()). */
export const ABSENT_FATES = [
  'dead',
  'missing',
  'arrested',
  'arrested_young',
  'jailed',
  'gone',
  'passed',
  'exile',
  'martyred',
  'casualty',
  'flips_you',
  'estranged',
  'left',
  'broken',
]

export const around = (npc: string): Cond => ({ all: [{ npc, met: true }, { npc, fateNot: ABSENT_FATES }] })

/** Mom is alive and still speaks to you. */
export const momHere: Cond = { all: [{ not: { var: 'w.mom_gone', eq: 1 } }, { npc: 'mom', fateNot: ['passed', 'estranged'] }] }
/** Mom is gone (passed away). */
export const momPassed: Cond = { any: [{ var: 'w.mom_gone', eq: 1 }, { npc: 'mom', fate: 'passed' }] }

// ── Calendar helpers ──────────────────────────────────────────────────────────

/** Day numbers in [from, to) in steps of `step`. */
export function dayRange(from: number, to: number, step = 1): number[] {
  const out: number[] = []
  for (let d = from; d < to; d += step) out.push(d)
  return out
}

/**
 * Day 0 is Saturday 1 September 2001, so Sundays are the days with `day % 7 === 1`.
 * The engine has no weekday condition; the Sunday list is precomputed here.
 */
export function sundays(from: number, to: number): number[] {
  return dayRange(from, to).filter(d => d % 7 === 1)
}

/**
 * "You spent time with one of these people today": the engine stamps `aff.last.<npc>` with the
 * current day whenever you spend social time with them (or they send you a scene). There is no
 * arithmetic in conditions, so this pairs each candidate day with its own threshold.
 */
export function contactOn(npcs: readonly string[], days: number[]): Cond {
  return {
    // Weekly turns: contact stamps carry the turn's start day, so "that day" means "that week".
    any: days.map(d => ({ all: [{ day: true, eq: d }, { any: npcs.map(n => ({ var: `aff.last.${n}`, gte: d - (d % DAYS_PER_STEP) })) }] })),
  }
}

/** Contact today with whoever the current partner is. */
export function partnerContactOn(days: number[]): Cond {
  return { any: PARTNERS.map(p => ({ all: [partnerIs(p), contactOn([p], days)] })) }
}

// ── Ladder guard triggers ─────────────────────────────────────────────────────

const GUARDED: RomanceState[] = ['dating', 'partner', 'engaged', 'married']

const ladderGuards: TriggerDef[] = PARTNERS.flatMap(p =>
  GUARDED.map(
    (s): TriggerDef => ({
      id: `side_romance_guard_${p}_${s}`,
      once: false,
      cooldownDays: 1,
      when: { all: [partnerIs(p), { npc: p, romance: ['none', 'flirting'] }, { var: rungVar(p), eq: RUNG[s] }] },
      effects: [{ npc: p, romance: s }],
    }),
  ),
)

export default defineContent({ triggers: ladderGuards })
