/**
 * EVENT PACK "events_city" — the event director's Port Lumen city-life pool.
 *
 * Theme (REDESIGN_V2 §C): the city outside the terminal — Cannery Row neighbors, the Cathode diner,
 * money windfalls and scams, romance and dating, friends, weather, and civic life (elections, the
 * surveillance law, redevelopment) reacting to world vars. Beats spread across the whole game: Act I
 * comedy warming into Act IV weight, era-gated by calendar day, with roughly a third recurring on
 * cooldowns so a familiar corner of the city never reads the same way twice.
 *
 * Every id in this pack is prefixed `ev_city_` (events, scenes, quests, triggers, traits, items,
 * obligations, buffs); every private flag/var lives under `ev_city.`.
 *
 * HARD RULE: nothing here is a real technique. Hacking, when it appears at all, is invented flavor —
 * dice and jargon-colour, never a real command, tool, or anything usable against a real system. Every
 * neighbor, scammer, and landlord is fictional; no real brands or people.
 *
 * Ownership: this pack owns only `src/content/events_city/**`. It reuses existing cast ids for cameos
 * (always guarded on fate/romance so it never contradicts an arc), never writes a romance state or a
 * fate, reads only confirmed world flags, and writes only its own `ev_city.*` flags, traits,
 * obligations, items and buffs plus generic stats, affinity, faction rep, heat and money.
 */
import { dayOf } from '@/engine/calendar'
import { defineContent } from '@/engine/registry'
import type { BuffDef, Cond, Effect, NpcFate, RomanceState, TextPart, TraitDef } from '@/engine/types'

// ── Fate guards (never let someone show up after they're gone) ──────────────────

/** Fates after which an NPC can no longer message you, visit, or sit in a booth. */
export const ABSENT: NpcFate[] = [
  'dead', 'missing', 'jailed', 'arrested', 'arrested_young', 'gone', 'passed',
  'exile', 'martyred', 'casualty', 'flips_you', 'estranged', 'left', 'broken',
  // Fates from specific arcs that also take someone off the street: detained or disappeared in the
  // List sweep, Marge's keys willed on, Sal's fall for the Row.
  'detained', 'disappeared', 'passed_keys', 'took_a_fall',
]

/** NPC is met and still around to appear in a scene. */
export const around = (npc: string): Cond => ({ all: [{ npc, met: true }, { npc, fateNot: ABSENT }] })
/** Around, and fond of you. */
export const close = (npc: string, affinity = 40): Cond => ({ all: [around(npc), { npc, affinityGte: affinity }] })

/** Not in a cell — every city beat needs you out on the street. */
export const free: Cond = { jailed: false }

// ── Act / era helpers ───────────────────────────────────────────────────────────

export const actIs = (n: number): Cond => ({ var: 'act', eq: n })
export const actGte = (n: number): Cond => ({ var: 'act', gte: n })
export const actLte = (n: number): Cond => ({ var: 'act', lte: n })
export const actBetween = (lo: number, hi: number): Cond => ({ all: [actGte(lo), actLte(hi)] })

/** The dark turn (Kroll's dinner) has landed — the city's humor goes gallows. */
export const darkTurn: Cond = { flag: 'a2.phase_iib' }
/** Still the comedy phase (Act I / IIa) — Kroll hasn't called yet. */
export const stillLight: Cond = { not: { flag: 'a2.phase_iib' } }

/** On or after a calendar date (era-gating weather and civic beats). */
export const fromDate = (y: number, m0: number, d: number): Cond => ({ day: true, gte: dayOf(y, m0, d) })
/** On or before a calendar date. */
export const untilDate = (y: number, m0: number, d: number): Cond => ({ day: true, lte: dayOf(y, m0, d) })

const FIRST_YEAR = 2001
const LAST_YEAR = 2013

/**
 * A recurring calendar window: `count` months starting at month `m0` (0 = Jan), every year of the
 * game. Windows may wrap the new year (`inMonths(11, 3)` is Dec–Feb). There is no month condition in
 * the engine, so this expands to one day range per year.
 */
export function inMonths(m0: number, count: number): Cond {
  const ranges: Cond[] = []
  for (let y = FIRST_YEAR - 1; y <= LAST_YEAR; y++) {
    ranges.push({ all: [{ day: true, gte: dayOf(y, m0, 1) }, { day: true, lte: dayOf(y, m0 + count, 1) - 1 }] })
  }
  return { any: ranges }
}

export const winter: Cond = inMonths(11, 3)
export const spring: Cond = inMonths(3, 3)
export const summer: Cond = inMonths(6, 2)
export const electionSeason: Cond = inMonths(9, 2)

// ── The city as a place ─────────────────────────────────────────────────────────

/** The Cathode is still open (owned by PKG-10/PKG-16; we only read it). */
export const cathodeOpen: Cond = { var: 'w.cathode_open', eq: 1 }
/** Sal is behind his counter tonight: the diner is open and he is still a free man on the Row. */
export const salHere: Cond = { all: [cathodeOpen, around('sal'), { npc: 'sal', fateNot: ['diner_closed'] }] }
/** You have standing on the Row. */
export const onRow = (rep = 10): Cond => ({ faction: 'fac.hood', gte: rep })
/** The surveillance law is live and being felt in the city. */
export const surveilled: Cond = { any: [{ var: 'w.mnsa', gte: 1 }, { flag: 'w.surveillance', eq: 'high' }] }
/** The old paper mill is a data campus now. */
export const dataCampus: Cond = { var: 'w.datacenter_open', eq: 1 }

// ── Home ─────────────────────────────────────────────────────────────────────────

export const atParents: Cond = { housing: 'parents_flat' }
/** Housing with a landlord who can raise the rent or install a camera. */
export const RENTED_HOUSING = ['shared_room', 'studio_flat', 'millgate_onebed', 'harbor_loft', 'harbor_penthouse'] as const
export const renting: Cond = { housing: [...RENTED_HOUSING] }
/** Places with real air conditioning (the heat wave skips them). */
export const cooledHousing: Cond = { housing: ['harbor_penthouse', 'hill_house', 'millgate_condo'] }

// ── People still in your life ────────────────────────────────────────────────────

/** Mom is alive and still speaks to you. */
export const momHere: Cond = { all: [{ not: { var: 'w.mom_gone', eq: 1 } }, { npc: 'mom', fateNot: ['passed', 'estranged'] }] }
/** Mom is gone. */
export const momGone: Cond = { any: [{ var: 'w.mom_gone', eq: 1 }, { npc: 'mom', fate: 'passed' }] }

const AT_LEAST_DATING: RomanceState[] = ['dating', 'partner', 'engaged', 'married']
const AT_LEAST_PARTNER: RomanceState[] = ['partner', 'engaged', 'married']
export type PartnerId = 'mira' | 'grace'
export const partnerIs = (id: PartnerId): Cond => ({ flag: 'life.partner', eq: id })

/** There is a partner and they are still with you (dating or higher). */
export const withPartner: Cond = {
  any: [
    { all: [partnerIs('mira'), around('mira'), { npc: 'mira', romance: AT_LEAST_DATING }] },
    { all: [partnerIs('grace'), around('grace'), { npc: 'grace', romance: AT_LEAST_DATING }] },
  ],
}
/** The partner is at "moving-in" or higher (a shared home to have a beat in). */
export const livingTogether: Cond = {
  any: [
    { all: [partnerIs('mira'), around('mira'), { npc: 'mira', romance: AT_LEAST_PARTNER }] },
    { all: [partnerIs('grace'), around('grace'), { npc: 'grace', romance: AT_LEAST_PARTNER }] },
  ],
}
/** Married to the current partner. */
export const married: Cond = {
  any: [
    { all: [partnerIs('mira'), { npc: 'mira', romance: 'married' }] },
    { all: [partnerIs('grace'), { npc: 'grace', romance: 'married' }] },
  ],
}
/** No partner, and neither romanceable NPC is being actively pursued — a stranger-flirt is safe here. */
export const unattached: Cond = {
  all: [
    { not: { flag: 'life.partner' } },
    { npc: 'mira', romance: ['none', 'ex'] },
    { npc: 'grace', romance: ['none', 'ex'] },
  ],
}

/** One paragraph that reads differently depending on which partner you have. */
export const byPartner = (mira: string, grace: string): TextPart => ({ if: partnerIs('mira'), text: mira, else: grace })

/**
 * Two paragraphs, at most one of which renders: Mira's line while she is your partner, Grace's while
 * she is. With no partner, neither shows. Spread into a text array: `...partnerLines(a, b)`.
 */
export const partnerLines = (mira: string, grace: string): TextPart[] => [
  { if: { all: [partnerIs('mira'), withPartner] }, text: mira },
  { if: { all: [partnerIs('grace'), withPartner] }, text: grace },
]

/** Affinity change for whoever the current partner is (never touches the romance state). */
export const partnerAff = (delta: number): Effect => ({
  if: partnerIs('mira'),
  then: [{ npc: 'mira', affinity: delta }],
  else: [{ if: partnerIs('grace'), then: [{ npc: 'grace', affinity: delta }] }],
})

// ── Effect fragments ─────────────────────────────────────────────────────────────

export const buff = (b: BuffDef): Effect => ({ buff: b })

/** Pay `early` dollars in Act I–II, `late` once the money is real (Act III+). */
export const costByAct = (early: number, late: number): Effect => ({
  if: actGte(3), then: [{ money: -late }], else: [{ money: -early }],
})

/** Sal (or Mom, or a neighbor) fed you properly. A warm week. */
export const WELL_FED: BuffDef = {
  id: 'ev_city_well_fed',
  name: 'Well Fed',
  desc: 'Somebody who loves this city put a plate in front of you and watched you eat it. You sleep better for a while.',
  days: 14,
  mods: [{ key: 'energy.regen', mult: 1.06 }, { key: 'health.daily', add: 0.4 }, { key: 'mood.daily', add: 0.3 }],
}

/** A good night with the person you love. */
export const IN_LOVE: BuffDef = {
  id: 'ev_city_in_love',
  name: 'In Good Company',
  desc: 'For a few weeks the two lives feel like one. Everything is a little lighter.',
  days: 21,
  mods: [{ key: 'mood.daily', add: 0.6 }, { key: 'stress.relief', mult: 1.1 }],
}

/** A date with a stranger that went well — no love story, just a good night. */
export const GOOD_DATE: BuffDef = {
  id: 'ev_city_good_date',
  name: 'A Good Night Out',
  desc: 'You were charming for three straight hours and someone noticed. You walk a little taller for a while.',
  days: 21,
  mods: [{ key: 'mood.daily', add: 0.5 }, { key: 'check.social', add: 1 }],
}

/** A romance beat went badly. */
export const HEARTSICK: BuffDef = {
  id: 'ev_city_heartsick',
  name: 'Heartsick',
  desc: 'You said the wrong thing, or didn\'t say the right one. It sits on your chest and slows everything down.',
  days: 21,
  bad: true,
  mods: [{ key: 'mood.daily', add: -0.6 }, { key: 'efficiency', mult: 0.96 }],
}

/** Money you didn't have to bleed for. */
export const FLUSH: BuffDef = {
  id: 'ev_city_flush',
  name: 'Feeling Flush',
  desc: 'A little unearned money in your pocket. It won\'t last, but the mood does, for a bit.',
  days: 14,
  mods: [{ key: 'mood.daily', add: 0.4 }],
}

/** You did right by the Row. */
export const CIVIC_PRIDE: BuffDef = {
  id: 'ev_city_civic_pride',
  name: 'Part of Something',
  desc: 'You showed up for the neighborhood and the neighborhood noticed. It steadies you.',
  days: 21,
  mods: [{ key: 'stress.relief', mult: 1.08 }, { key: 'mood.daily', add: 0.3 }],
}

/** You got taken. */
export const SCAMMED: BuffDef = {
  id: 'ev_city_scammed',
  name: 'Taken',
  desc: 'Somebody smarter about people than you were about them cleaned you out. You keep replaying it.',
  days: 21,
  bad: true,
  mods: [{ key: 'stress.gain', mult: 1.08 }, { key: 'mood.daily', add: -0.4 }],
}

/** A brutal heat wave with no relief. */
export const HEAT_MISERY: BuffDef = {
  id: 'ev_city_heat_misery',
  name: 'Cooking',
  desc: 'The heat has settled into the walls and won\'t leave. The rig runs hot, you run slow, nothing dries.',
  days: 14,
  bad: true,
  mods: [{ key: 'energy.drain', mult: 1.08 }, { key: 'stress.gain', mult: 1.06 }],
}

/** Cold that gets into the bones. */
export const COLD_SNAP: BuffDef = {
  id: 'ev_city_chilled',
  name: 'Chilled to the Bone',
  desc: 'You slept in your coat for a week. Your fingers are slow on the keys and your sleep is thin.',
  days: 14,
  bad: true,
  mods: [{ key: 'energy.regen', mult: 0.92 }, { key: 'efficiency', mult: 0.97 }],
}

/** Lifted the wrong way. */
export const THROWN_BACK: BuffDef = {
  id: 'ev_city_thrown_back',
  name: 'Thrown Back',
  desc: 'Something between your shoulder blades went "tink" on the third landing. Sitting hurts. Standing hurts. Sitting at a desk for ten hours hurts most of all.',
  days: 21,
  bad: true,
  mods: [{ key: 'energy.drain', mult: 1.1 }, { key: 'efficiency', mult: 0.95 }, { key: 'health.daily', add: -0.2 }],
}

// ── Scars (permanent traits earned by city life; a couple are gifts, not wounds) ──

export const traits: TraitDef[] = [
  {
    id: 'ev_city_scar_local_fixture',
    name: 'Local Fixture',
    desc: 'You\'ve been on this street long enough that people vouch for you without being asked. Doors open; heat has a harder time finding a face everyone knows.',
    scar: true,
    mods: [{ key: 'check.social', add: 1 }, { key: 'heat.decay', add: 0.1 }],
    flags: ['ev_city.local_fixture'],
  },
  {
    id: 'ev_city_scar_soft_touch',
    name: 'Soft Touch',
    desc: 'Word got around that you\'ll always help, always cover it, always say yes. It costs you — and, quietly, it\'s the best thing anyone\'s ever said about you.',
    scar: true,
    mods: [{ key: 'expenses', mult: 1.04 }, { key: 'mood.daily', add: 0.3 }],
    flags: ['ev_city.soft_touch'],
  },
  {
    id: 'ev_city_scar_sucker_list',
    name: 'On a Sucker List',
    desc: 'You answered a scammer once, so now your number is traded like a baseball card. The phone rings more, and never with good news.',
    scar: true,
    bad: true,
    mods: [{ key: 'stress.gain', mult: 1.05 }],
    flags: ['ev_city.sucker_list'],
  },
  {
    id: 'ev_city_scar_storm_hardened',
    name: 'Storm-Hardened',
    desc: 'You kept the block alive through a night the city forgot. Whatever comes next, you\'ve stood in worse weather than this.',
    scar: true,
    mods: [{ key: 'stress.relief', mult: 1.06 }, { key: 'check.fitness', add: 1 }],
    flags: ['ev_city.storm_hardened'],
  },
  {
    id: 'ev_city_scar_known_face',
    name: 'Known Face',
    desc: 'Your face ran on the Channel 6 evening news once, for eleven seconds. Strangers half-recognize you, which opens a surprising number of conversations — and makes you very easy to describe to a detective.',
    scar: true,
    bad: true,
    mods: [{ key: 'heat.decay', add: -0.1 }, { key: 'check.social', add: 1 }],
    flags: ['ev_city.known_face'],
  },
]

export default defineContent({ traits })
