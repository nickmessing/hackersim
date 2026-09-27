/**
 * PKG-15 — Life & Random Events: shared conditions, effects and calendar helpers.
 *
 * Every file under src/content is auto-discovered, so this helper module also exports an empty pack.
 *
 * The "director clock" (bible §9.0 trig_director): the engine cannot tell content when another
 * package's beat last fired, so this package keeps its own quiet-day counter, `life.quiet_days`.
 * A daily trigger adds 1; every life event in this package resets it through `QUIET_RESET`
 * (and the director resets it when it pulls a beat). When it reaches ~45, the director steps in.
 */
import { dayOf } from '@/engine/calendar'
import { defineContent } from '@/engine/registry'
import type { Cond, Effect, NpcFate } from '@/engine/types'

// ── People ──────────────────────────────────────────────────────────────────

/** Fates after which someone can no longer message you, visit, or sit at your table. */
export const ABSENT_FATES: NpcFate[] = [
  'dead',
  'missing',
  'jailed',
  'arrested',
  'arrested_young',
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

/** Met, and still part of your life. */
export const around = (npc: string): Cond => ({ all: [{ npc, met: true }, { npc, fateNot: ABSENT_FATES }] })

/** Around, and fond of you. */
export const close = (npc: string, affinity = 40): Cond => ({ all: [around(npc), { npc, affinityGte: affinity }] })

/** Mom is alive and still speaks to you. */
export const momHere: Cond = {
  all: [{ not: { var: 'w.mom_gone', eq: 1 } }, { npc: 'mom', fateNot: ['passed', 'estranged'] }],
}
export const momGone: Cond = { any: [{ var: 'w.mom_gone', eq: 1 }, { npc: 'mom', fate: 'passed' }] }

export const partnerIs = (id: 'mira' | 'grace'): Cond => ({ flag: 'life.partner', eq: id })
/** The partner (if any) is still with you. */
export const withPartner: Cond = {
  any: [
    { all: [partnerIs('mira'), around('mira'), { npc: 'mira', romance: ['dating', 'partner', 'engaged', 'married'] }] },
    { all: [partnerIs('grace'), around('grace'), { npc: 'grace', romance: ['dating', 'partner', 'engaged', 'married'] }] },
  ],
}

// ── Places & era ────────────────────────────────────────────────────────────

export const atParents: Cond = { housing: 'parents_flat' }
/** Housing with a landlord (the dorm has an RA, not a landlord). */
export const RENTED_HOUSING = ['shared_room', 'studio_flat', 'millgate_onebed', 'harbor_loft', 'harbor_penthouse']
export const renting: Cond = { housing: RENTED_HOUSING }

/** Your only line to the net is still the household phone line. */
export const onDialup: Cond = {
  all: [{ not: { item: 'net_isdn' } }, { not: { item: 'net_dsl' } }, { not: { item: 'net_cable' } }, { not: { item: 'net_fiber' } }],
}

export const actIs = (n: number): Cond => ({ var: 'act', eq: n })
export const actGte = (n: number): Cond => ({ var: 'act', gte: n })
export const actLte = (n: number): Cond => ({ var: 'act', lte: n })

export const free: Cond = { jailed: false }

/** The dark turn has happened (Kroll's dinner). */
export const darkTurn: Cond = { flag: 'a2.phase_iib' }

// ── Effects ─────────────────────────────────────────────────────────────────

/** Every life beat resets the director's quiet-day counter. */
export const QUIET_RESET: Effect = { var: 'life.quiet_days', set: 0 }

// ── Calendar ────────────────────────────────────────────────────────────────

const YEARS = [2001, 2002, 2003, 2004, 2005, 2006, 2007, 2008, 2009, 2010, 2011, 2012]

/** Day number of the n-th given weekday (0 = Sunday) of a month. */
function nthWeekday(year: number, month0: number, weekday: number, n: number): number {
  const first = new Date(Date.UTC(year, month0, 1)).getUTCDay()
  const date = 1 + ((weekday - first + 7) % 7) + (n - 1) * 7
  return dayOf(year, month0, date)
}

/** Fourth Thursday of November, every year of the game. */
export const THANKSGIVING_DAYS: number[] = YEARS.map(y => nthWeekday(y, 10, 4, 4))

/** Third Saturday of July: the Cannery Row block party. */
export const BLOCK_PARTY_DAYS: number[] = YEARS.filter(y => y >= 2002).map(y => nthWeekday(y, 6, 6, 3))

/** True on any of the given days. */
export const onDays = (days: number[]): Cond => ({ any: days.map(d => ({ day: true, eq: d })) })

/** Inclusive calendar window. */
export const between = (from: number, to: number): Cond => ({ all: [{ day: true, gte: from }, { day: true, lte: to }] })

export default defineContent({})
