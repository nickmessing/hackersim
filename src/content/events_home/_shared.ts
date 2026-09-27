/**
 * EVENT PACK "events_home" — the event director's home & family pool (REDESIGN_V2 §C).
 *
 * Theme: the life that happens around the desk — the phone bill, the stray cat under the CRT,
 * roommates and landlords, damp walls and burst pipes, Mom discovering BuddyPager, Dad's workbench,
 * Kim growing up, Lunar New Year at the Tans', Sunday dinners, money troubles, health scares and,
 * by Act IV, parents who are getting older. Act I is comedy; by Act IV the same kitchen table
 * carries weight. Roughly a third of the events recur with cooldowns and conditional text.
 *
 * Every id in this pack is prefixed `ev_home_` (events, scenes, quests, traits, items, buffs,
 * obligations); private flags/vars live under `ev_home.`.
 *
 * Ownership: this pack owns only `src/content/events_home/**`. It reuses existing cast ids for
 * cameos, always guarded on fate/romance (never writes an NPC fate, never writes `kim_trajectory`,
 * never touches Mom's illness arc) and reads only confirmed world flags.
 *
 * HARD RULE: hacking, where it appears at all, is invented flavor — never a real technique, tool,
 * command or anything usable against a real system. Household mishaps are narrated, never taught.
 */
import { dayOf } from '@/engine/calendar'
import { defineContent } from '@/engine/registry'
import type { BuffDef, Cond, Effect, ItemDef, NpcFate, TraitDef } from '@/engine/types'

// ── People guards ─────────────────────────────────────────────────────────────

/** Fates after which an NPC can no longer message you, visit, or sit at your table. */
export const ABSENT: NpcFate[] = [
  'dead', 'missing', 'jailed', 'arrested', 'arrested_young', 'gone', 'passed',
  'exile', 'martyred', 'casualty', 'flips_you', 'estranged', 'left', 'broken',
]

/** Met, and still part of your life. */
export const around = (npc: string): Cond => ({ all: [{ npc, met: true }, { npc, fateNot: ABSENT }] })

/** Mom is alive and still speaks to you (never contradict the Mom arc). */
export const momHere: Cond = {
  all: [{ not: { var: 'w.mom_gone', eq: 1 } }, { npc: 'mom', fateNot: ['passed', 'estranged'] }],
}
export const momGone: Cond = { any: [{ var: 'w.mom_gone', eq: 1 }, { npc: 'mom', fate: 'passed' }] }

/** Mom's illness (main_a2_q4) is not running right now — no competing Mom health beats. */
export const momCrisisQuiet: Cond = {
  any: [{ quest: 'main_a2_q4_moms_illness', status: 'inactive' }, { flag: 'a2.mom_crisis_resolved' }],
}

/** Dad is still a presence (all of Dad's fates keep him alive; guard the estranged/absent set anyway). */
export const dadHere: Cond = around('dad')

/** Kim is around and still talks to you (not estranged; not in the Act III leverage crisis). */
export const kimHere: Cond = { all: [around('kim'), { npc: 'kim', fateNot: ['endangered'] }] }

/** Someone is home at the flat to set a table. */
export const familyHome: Cond = { any: [momHere, dadHere] }

export const partnerIs = (id: 'mira' | 'grace'): Cond => ({ flag: 'life.partner', eq: id })
const LIVE_ROMANCE = ['dating', 'partner', 'engaged', 'married'] as const
/** The partner (if any) is still with you. */
export const withPartner: Cond = {
  any: [
    { all: [partnerIs('mira'), around('mira'), { npc: 'mira', romance: [...LIVE_ROMANCE] }] },
    { all: [partnerIs('grace'), around('grace'), { npc: 'grace', romance: [...LIVE_ROMANCE] }] },
  ],
}
export const withMira: Cond = { all: [partnerIs('mira'), around('mira'), { npc: 'mira', romance: [...LIVE_ROMANCE] }] }
export const withGrace: Cond = { all: [partnerIs('grace'), around('grace'), { npc: 'grace', romance: [...LIVE_ROMANCE] }] }

// ── Places ────────────────────────────────────────────────────────────────────

export const atParents: Cond = { housing: 'parents_flat' }
export const notAtParents: Cond = { not: { housing: 'parents_flat' } }
export const RENTED = ['shared_room', 'studio_flat', 'millgate_onebed', 'harbor_loft', 'harbor_penthouse']
export const renting: Cond = { housing: RENTED }
export const OWNED = ['cannery_house', 'millgate_condo', 'hill_house']
export const owning: Cond = { housing: OWNED }
export const withRoommates: Cond = { housing: ['shared_room', 'dorm_room'] }

/** Only line to the net is still the household phone line. */
export const onDialup: Cond = {
  all: [{ not: { item: 'net_isdn' } }, { not: { item: 'net_dsl' } }, { not: { item: 'net_cable' } }, { not: { item: 'net_fiber' } }],
}

/** The Cathode is still open for business. */
export const cathodeOpen: Cond = { not: { var: 'w.cathode_open', eq: 0 } }

/** PARALLAX risk-scoring is live: a bill can quietly become a denial. */
export const parallaxLive: Cond = { all: [{ flag: 'w.aperture_state', eq: 'thriving' }, { var: 'w.enclosure', gte: 2 }] }

// ── Acts & era ────────────────────────────────────────────────────────────────

export const actIs = (n: number): Cond => ({ var: 'act', eq: n })
export const actGte = (n: number): Cond => ({ var: 'act', gte: n })
export const actLte = (n: number): Cond => ({ var: 'act', lte: n })
export const darkTurn: Cond = { flag: 'a2.phase_iib' }
export const free: Cond = { jailed: false }
export const between = (from: number, to: number): Cond => ({ all: [{ day: true, gte: from }, { day: true, lte: to }] })
export const fromDate = (y: number, m0: number, d: number): Cond => ({ day: true, gte: dayOf(y, m0, d) })

const YEARS = [2001, 2002, 2003, 2004, 2005, 2006, 2007, 2008, 2009, 2010, 2011, 2012]

/** December through February, every winter of the game. */
export const winter: Cond = {
  any: YEARS.map(y => between(dayOf(y, 11, 1), dayOf(y + 1, 1, 28))),
}

/** Lunar New Year (Tết) dates, 2002–2012. */
const TET: [number, number, number][] = [
  [2002, 1, 12], [2003, 1, 1], [2004, 0, 22], [2005, 1, 9], [2006, 0, 29], [2007, 1, 18],
  [2008, 1, 7], [2009, 0, 26], [2010, 1, 14], [2011, 1, 3], [2012, 0, 23],
]
/** The fortnight around Tết — wide enough that a weekly turn always lands inside it. */
export const tetWindow: Cond = {
  any: TET.map(([y, m, d]) => between(dayOf(y, m, d) - 10, dayOf(y, m, d) + 4)),
}

// ── Effect helpers ────────────────────────────────────────────────────────────

export const buff = (b: BuffDef): Effect => ({ buff: b })
export const owe = (id: string, label: string, perDay: number, days: number): Effect => ({
  obligation: { id, label, perDay, days },
})

// ── Buffs & debuffs (weeks) ───────────────────────────────────────────────────

export const HOUSE_RULES: BuffDef = {
  id: 'ev_home_house_rules',
  name: 'House Rules',
  desc: 'Dad has instituted a curfew on the phone line. It is enforced by a man who wakes at 5:40 and hears everything.',
  days: 28,
  bad: true,
  mods: [
    { key: 'hack.speed', mult: 0.85 },
    { key: 'freelance.speed', mult: 0.9 },
  ],
}

export const LINE_CUT: BuffDef = {
  id: 'ev_home_line_cut',
  name: 'Line Suspended',
  desc: 'The phone company put a hold on the line "pending review." You are borrowing the library\'s terminals and Grandma Ruth\'s patience.',
  days: 14,
  bad: true,
  mods: [
    { key: 'hack.speed', mult: 0.5 },
    { key: 'freelance.speed', mult: 0.75 },
  ],
}

export const MOMS_FORWARDS: BuffDef = {
  id: 'ev_home_moms_forwards',
  name: "Mom's Forwards",
  desc: 'You are on every list Mom has ever made: the prayer chain, the recipe circle, and the one that is just photos of other people\'s grandchildren.',
  days: 30,
  bad: true,
  mods: [
    { key: 'efficiency', mult: 0.97 },
    { key: 'mood.daily', add: 0.2 },
  ],
}

export const SOGGY_RIG: BuffDef = {
  id: 'ev_home_soggy_rig',
  name: 'Soggy Rig',
  desc: 'The tower dried out on the radiator. It works. It also smells like a basement and freezes whenever it feels judged.',
  days: 21,
  bad: true,
  mods: [
    { key: 'hack.speed', mult: 0.8 },
    { key: 'freelance.speed', mult: 0.85 },
  ],
}

export const FOOD_POISONED: BuffDef = {
  id: 'ev_home_food_poisoned',
  name: 'Food Poisoning',
  desc: 'You have learned things about your own digestive system that no one should know. Recovery is slow and involves crackers.',
  days: 10,
  bad: true,
  mods: [
    { key: 'energy.drain', mult: 1.25 },
    { key: 'efficiency', mult: 0.85 },
  ],
}

export const THROWN_BACK: BuffDef = {
  id: 'ev_home_thrown_back',
  name: 'Thrown-Out Back',
  desc: 'Every chair is the wrong chair. You type standing up, leaning, and occasionally lying on the floor with the keyboard on your chest.',
  days: 28,
  bad: true,
  mods: [
    { key: 'energy.drain', mult: 1.1 },
    { key: 'efficiency', mult: 0.93 },
  ],
}

export const BANDAGED_HAND: BuffDef = {
  id: 'ev_home_bandaged_hand',
  name: 'Bandaged Hand',
  desc: 'Six stitches and a lot of typing with nine fingers.',
  days: 14,
  bad: true,
  mods: [
    { key: 'hack.speed', mult: 0.9 },
    { key: 'freelance.speed', mult: 0.9 },
  ],
}

export const WELL_FED: BuffDef = {
  id: 'ev_home_well_fed',
  name: 'Well Fed',
  desc: 'Leftovers in the fridge, labeled in Mom\'s handwriting, with instructions you are ignoring. You feel looked after.',
  days: 14,
  mods: [
    { key: 'health.daily', add: 0.2 },
    { key: 'stress.relief', mult: 1.08 },
  ],
}

export const HOME_WARM: BuffDef = {
  id: 'ev_home_home_warm',
  name: 'Warm Kitchen',
  desc: 'A good evening at the family table. It carries you through the week like a thermos.',
  days: 14,
  mods: [
    { key: 'mood.daily', add: 0.4 },
    { key: 'stress.gain', mult: 0.94 },
  ],
}

export const FAMILY_STRAIN: BuffDef = {
  id: 'ev_home_family_strain',
  name: 'Family Strain',
  desc: 'Something was said at the table that cannot be unsaid. You keep replaying it in the shower.',
  days: 21,
  bad: true,
  mods: [
    { key: 'mood.daily', add: -0.4 },
    { key: 'stress.gain', mult: 1.08 },
  ],
}

export const DAMP_COUGH: BuffDef = {
  id: 'ev_home_damp_cough',
  name: 'Damp Cough',
  desc: 'The wall behind the bed breathes, and now so do you — wetly.',
  days: 30,
  bad: true,
  mods: [
    { key: 'energy.regen', mult: 0.92 },
    { key: 'health.daily', add: -0.15 },
  ],
}

export const RENT_BREAK: BuffDef = {
  id: 'ev_home_rent_break',
  name: 'Rent Break',
  desc: 'The landlord knocked a little off the rent after the mold business, mostly so you would stop writing letters.',
  days: 90,
  mods: [{ key: 'expenses', mult: 0.93 }],
}

export const PORCH_EVENINGS: BuffDef = {
  id: 'ev_home_porch_evenings',
  name: 'Slow Evenings',
  desc: 'You stopped at six most nights this month. The work waited. It turns out it can.',
  days: 30,
  mods: [
    { key: 'stress.relief', mult: 1.15 },
    { key: 'mood.daily', add: 0.4 },
    { key: 'efficiency', mult: 0.97 },
  ],
}

export const COLD_WEEK: BuffDef = {
  id: 'ev_home_cold_week',
  name: 'The Long Cold',
  desc: 'A week without power, typing in fingerless gloves by candlelight. Romantic for about an hour.',
  days: 10,
  bad: true,
  mods: [
    { key: 'efficiency', mult: 0.85 },
    { key: 'energy.regen', mult: 0.9 },
  ],
}

export const GRIEF_CAT: BuffDef = {
  id: 'ev_home_grief_cat',
  name: 'Empty Chair',
  desc: 'You keep leaving the desk chair pushed back, as if someone might want it.',
  days: 45,
  bad: true,
  mods: [{ key: 'mood.daily', add: -0.6 }],
}

// ── Scars (permanent; earned through play) ────────────────────────────────────

export const SCARS: TraitDef[] = [
  {
    id: 'ev_home_damp_lungs',
    name: 'Damp Lungs',
    desc: 'A winter in a flat with a breathing wall left a rattle in your chest. You sleep worse and tire faster, and you can smell mold from the hallway.',
    scar: true,
    bad: true,
    mods: [
      { key: 'energy.regen', mult: 0.96 },
      { key: 'health.daily', add: -0.05 },
    ],
  },
  {
    id: 'ev_home_bad_back',
    name: 'Bad Back',
    desc: 'You lifted with your back, once, heroically. Your back remembers. Long sessions cost more now.',
    scar: true,
    bad: true,
    mods: [
      { key: 'energy.drain', mult: 1.04 },
      { key: 'xp.fitness', mult: 0.9 },
    ],
  },
  {
    id: 'ev_home_heart_scare',
    name: 'Heart Scare',
    desc: 'You had the night where you counted your own heartbeat on the bathroom floor. Since then you breathe before you panic — and you never quite push the way you used to.',
    scar: true,
    // Double-edged: calmer, but a little slower.
    mods: [
      { key: 'stress.gain', mult: 0.9 },
      { key: 'efficiency', mult: 0.97 },
    ],
  },
  {
    id: 'ev_home_family_story',
    name: 'The Family Story',
    desc: 'Every aunt in Port Lumen has a version of what you do, and none of them are flattering. You have stopped correcting them, which they take as confirmation.',
    scar: true,
    bad: true,
    mods: [
      { key: 'check.social', add: -1 },
      { key: 'stress.relief', mult: 0.95 },
    ],
  },
  {
    id: 'ev_home_missed_calls',
    name: 'Missed Calls',
    desc: 'Your father learned to walk again mostly without you. He never said a word about it. The silence has a weight you carry into every week.',
    scar: true,
    bad: true,
    mods: [
      { key: 'stress.gain', mult: 1.05 },
      { key: 'mood.daily', add: -0.15 },
    ],
  },
  {
    id: 'ev_home_storm_tested',
    name: 'Storm-Tested',
    desc: 'The week the Row froze, you were the one who kept showing up. Something settled in you: steadier hands, and neighbors who wave first.',
    scar: true,
    mods: [
      { key: 'check.hardware', add: 1 },
      { key: 'stress.relief', mult: 1.04 },
    ],
  },
]

// ── The cat ───────────────────────────────────────────────────────────────────

export const CAT: ItemDef = {
  id: 'ev_home_cat',
  name: 'The Cat',
  category: 'misc',
  shop: 'life',
  price: 0,
  unique: true,
  hidden: true,
  upkeepPerDay: 1,
  desc: [
    'A grey stray with one torn ear who decided the warm top of your CRT was hers, and then that you were.',
    { if: { flag: 'ev_home.cat_name' }, text: 'Her name is {flag:ev_home.cat_name}. She answers to it when there is tuna involved.' },
  ],
  mods: [
    { key: 'mood.daily', add: 0.3 },
    { key: 'stress.relief', mult: 1.05 },
  ],
}

/** You have the cat at home. */
export const hasCat: Cond = { all: [{ item: 'ev_home_cat' }, { not: { flag: 'ev_home.cat_gone' } }] }

export default defineContent({
  traits: SCARS,
  items: [CAT],
})
