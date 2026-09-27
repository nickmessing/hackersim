/**
 * PKG-04 — shared conditions and small helpers for Act IV & the endings.
 *
 * This module exports helpers used by the other PKG-04 files and by `tests/pkg04_endings.test.ts`.
 * Every file under src/content is auto-discovered, so it also exports an (empty) content pack.
 */
import { dayOf } from '@/engine/calendar'
import { defineContent } from '@/engine/registry'
import type { Cond, NpcFate, NpcId } from '@/engine/types'

// ── Calendar ──────────────────────────────────────────────────────────────────

/** The old exchange's copper is scheduled to be pulled the first week of November 2010. */
export const EXCHANGE_NIGHT = dayOf(2010, 9, 30)
/** Bible §5.4: soft floor for the last day (Thu 23 Dec 2010). */
export const LAST_DAY = 3400

// ── Leverage lanes (a4.leverage, the ending matrix's primary key) ─────────────

export const LANES = ['publish', 'bury', 'sell', 'handoff', 'made', 'bonfire', 'none'] as const
export type Lane = (typeof LANES)[number]

export const lane = (...ls: Lane[]): Cond =>
  ls.length === 1 ? { flag: 'a4.leverage', eq: ls[0] ?? 'none' } : { any: ls.map(l => ({ flag: 'a4.leverage', eq: l })) }

export const spine = (s: 'aperture' | 'bureau' | 'double' | 'halcyon' | 'loft'): Cond => ({ flag: 'a2.spine', eq: s })

// ── NPC state helpers ─────────────────────────────────────────────────────────

export const fate = (npc: NpcId, f: NpcFate | NpcFate[]): Cond => ({ npc, fate: f })
export const fateNot = (npc: NpcId, f: NpcFate | NpcFate[]): Cond => ({ npc, fateNot: f })
export const aff = (npc: NpcId, gte: number): Cond => ({ npc, affinityGte: gte })
export const affLte = (npc: NpcId, lte: number): Cond => ({ npc, affinityLte: lte })
export const met = (npc: NpcId): Cond => ({ npc, met: true })
export const not = (c: Cond): Cond => ({ not: c })
export const all = (...cs: Cond[]): Cond => ({ all: cs })
export const any = (...cs: Cond[]): Cond => ({ any: cs })
export const flag = (f: string, eq?: string | number | boolean): Cond => (eq === undefined ? { flag: f } : { flag: f, eq })

/** Fates that mean a person is no longer part of your daily life (bible §4.6 `available()`). */
export const GONE_FATES: NpcFate[] = [
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
  'broken',
  'flips_you',
  'estranged',
  'left',
]

/** Met, and still around in the city and your life. */
export const available = (npc: NpcId): Cond => all(met(npc), fateNot(npc, GONE_FATES))

/** Still genuinely there for you: around, and the bond is warm. Used by the E7 test and warm rooms. */
export const stillThere = (npc: NpcId, minAffinity = 16): Cond => all(available(npc), aff(npc, minAffinity))

/** Jax is still a free man in your corner. */
export const jaxFree = fate('jax', ['free', 'backroom_partner', 'normal'])
/** Mira is with you (romance) or a friendly rival who stayed. */
export const miraClose = any(
  { npc: 'mira', romance: ['partner', 'engaged', 'married'] },
  all(fate('mira', ['partner', 'rival', 'normal']), not(flag('npc.mira.betrayed')), aff('mira', 35)),
)
export const graceWithYou = { npc: 'grace', romance: ['dating', 'partner', 'engaged', 'married'] } satisfies Cond
export const married = any({ npc: 'grace', romance: 'married' }, { npc: 'mira', romance: 'married' })

/** The ending cut switch (§10): a failed finale check darkens every ending except E7/E9. */
export const finaleFail: Cond = { flag: 'end.finale_fail' }
export const finalePass: Cond = not(finaleFail)

/** Inner circle for the E7 "who still visits" test (bible §4.1 plus the partner). */
export const INNER_CIRCLE: NpcId[] = ['jax', 'mira', 'priya', 'corvid', 'grace']
export const nobodyLeft: Cond = all(...INNER_CIRCLE.map(n => not(stillThere(n))))

/** The player walked out of Port Lumen at the end (so "you still visit X" slides must not fire). */
export const youLeftTown: Cond = any(lane('handoff'), lane('bonfire'), all(lane('publish'), finaleFail, flag('end.has_evidence')))

export default defineContent({})
