/**
 * PKG-10 — The Neighborhood ("Home Directory"): shared conditions and effects.
 *
 * Every content file must default-export a pack, so this helper module exports an empty one.
 *
 * Ownership reminders (bible §13): this package is the sole writer of `npc.dad.fate`,
 * `npc.sal.fate`, `npc.dialtone.fate`, `side.saved_cathode` and `w.cathode_open`, and the only
 * package that grants `item.exchange_keys`. `w.hood_soul` is shared add-only; the ±1 attached to
 * the Cathode headlines belongs to the news riders (PKG-16), so this package only publishes them.
 */
import { dayOf } from '@/engine/calendar'
import { defineContent } from '@/engine/registry'
import type { Cond, Effect } from '@/engine/types'

// ── State shorthands ─────────────────────────────────────────────────────────

export const CATHODE_OPEN: Cond = { var: 'w.cathode_open', eq: 1 }
export const CATHODE_CLOSED: Cond = { var: 'w.cathode_open', eq: 0 }

/** Mom is alive and still speaking to you. */
export const MOM_HOME: Cond = {
  all: [{ not: { var: 'w.mom_gone', eq: 1 } }, { npc: 'mom', fateNot: ['passed', 'estranged'] }],
}
export const MOM_GONE: Cond = { any: [{ var: 'w.mom_gone', eq: 1 }, { npc: 'mom', fate: 'passed' }] }
export const MOM_ESTRANGED: Cond = { npc: 'mom', fate: 'estranged' }

export const KIM_CLOSE: Cond = { npc: 'kim', fateNot: ['estranged'] }

/** Sal is still behind his counter (he has not taken a fall for anyone). */
export const SAL_AROUND: Cond = { npc: 'sal', fateNot: ['took_a_fall'] }

export const MET_MARGE: Cond = { flag: 'side.met_dialtone' }

export const HOOD_KNOWN: Cond = { faction: 'fac.hood', gte: 20 }
export const HOOD_TRUSTED: Cond = { faction: 'fac.hood', gte: 50 }
export const HOOD_INNER: Cond = { faction: 'fac.hood', gte: 80 }
export const HOOD_COLD: Cond = { faction: 'fac.hood', lte: -20 }

export const DAD_RETRAINED: Cond = { quest: 'fac_hood_q2_dad', status: 'completed' }

/** You are carrying enough attention that people come to the Row asking about you. */
export const PLAYER_HOT: Cond = {
  any: [
    { stat: 'heat', gte: 35 },
    { flag: 'a3.burned' },
    { flag: 'a3.incriminated' },
    { flag: 'a3.folk_hero' },
    { flag: 'fac.bureau.onto_you_hard' },
    { var: 'sys.raids', gte: 2 },
  ],
}

/** Sal is exposed if your trouble ever reaches the Row: your base is in his back room, or he is in debt for the diner. */
export const SAL_EXPOSED: Cond = { any: [{ flag: 'npc.sal.base' }, { flag: 'npc.sal.second_mortgage' }] }

// ── Raid suppression during timed stages (bible §5.3) ───────────────────────

/**
 * `sys.no_raids` is one shared flag. Before clearing it, make sure no other timed story stage we
 * know about still needs it (the engine raid must not eat another package's window).
 */
const OTHER_TIMED_STAGES: Cond = {
  any: [
    { quest: 'main_a2_q4_moms_illness', status: 'active' },
    { quest: 'main_a3_q5_the_list', status: 'active', stage: 'warn' },
    { quest: 'fac_hood_q4_save_cathode', status: 'active', stage: 'campaign' },
    { quest: 'fac_hood_q5_coming_home', status: 'active', stage: 'operator' },
  ],
}

export const SET_NO_RAIDS: Effect = { flag: 'sys.no_raids' }
export const CLEAR_NO_RAIDS: Effect = { if: { not: OTHER_TIMED_STAGES }, then: [{ clearFlag: 'sys.no_raids' }] }

// ── Calendar ─────────────────────────────────────────────────────────────────

/** Science-fair season: 1 March – 20 May, every spring of Act III's likely span. */
export const SPRING: Cond = {
  any: [2005, 2006, 2007, 2008, 2009].map(
    (y): Cond => ({ all: [{ day: true, gte: dayOf(y, 2, 1) }, { day: true, lte: dayOf(y, 4, 20) }] }),
  ),
}

export default defineContent({})
