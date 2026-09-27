/**
 * EVENT PACK "events_work" — the event director's pool for WORK & CAREER.
 *
 * Theme (REDESIGN_V2 §C): every job track gets its own weather — odd jobs on the Row, the
 * CompCastle bench, help-desk headsets, dev shops, NOC nights, field vans, consulting suites, the
 * management floor, garages full of beanbags, and the rooms behind curtains. Office politics,
 * bosses, crunch, layoffs, promotions with strings attached, coworkers and clients from hell.
 * Act I is comedy; by Act IV the same office is a place where people lose their houses.
 *
 * Every id in this pack is prefixed `ev_work_`; every private flag/var lives under `ev_work.`.
 *
 * THE HR FILE. Bad days at work leave write-ups: the var `ev_work.strikes` (0–3). Two strikes is a
 * final warning that event text reacts to; the third opens a performance plan (see `hr.ts`), and a
 * second trip to three after that is the door. A clean record slowly heals, and a new job (any
 * stretch of unemployment) wipes the file.
 *
 * HARD RULE: hacking and IT work here are invented flavor — texture and jargon-colour, never a real
 * technique, tool, command or anything usable against a real system. All companies and people
 * introduced here are fictional.
 *
 * Ownership: this pack owns only `src/content/events_work/**`. It reuses existing cast ids for
 * cameos, guarded on fate/romance so it never contradicts an arc, reads confirmed world flags, and
 * writes only its own `ev_work.*` flags/vars, scars, obligations and buffs (plus faction rep, NPC
 * affinity and the player's job).
 */
import { dayOf } from '@/engine/calendar'
import { defineContent } from '@/engine/registry'
import type { BuffDef, Cond, Effect, NpcFate, RomanceState, TraitDef } from '@/engine/types'

// ── People guards ─────────────────────────────────────────────────────────────

/** Fates after which an NPC can no longer show up in a scene (mirrors the other event packs). */
export const ABSENT: NpcFate[] = [
  'dead',
  'missing',
  'jailed',
  'arrested',
  'arrested_young',
  'gone',
  'passed',
  'exile',
  'martyr',
  'martyred',
  'casualty',
  'flips_you',
  'estranged',
  'left',
  'broken',
]

/** NPC is met and still around to appear. */
export const around = (npc: string): Cond => ({ all: [{ npc, met: true }, { npc, fateNot: ABSENT }] })

/** Romance states that mean "you are seeing each other" (a date to disappoint). */
export const TOGETHER: RomanceState[] = ['dating', 'partner', 'engaged', 'married']
export const withGrace: Cond = { all: [around('grace'), { npc: 'grace', romance: TOGETHER }] }
export const withMira: Cond = { all: [around('mira'), { npc: 'mira', romance: TOGETHER }] }
export const seeingSomeone: Cond = { any: [withGrace, withMira] }

/** Mom is alive and still in your life. */
export const momHere: Cond = {
  all: [{ not: { var: 'w.mom_gone', eq: 1 } }, { npc: 'mom', fateNot: ['passed', 'estranged', 'dead'] }],
}

export const employed: Cond = { not: { job: null } }
export const free: Cond = { jailed: false }

// ── Act / era helpers ─────────────────────────────────────────────────────────

export const actGte = (n: number): Cond => ({ var: 'act', gte: n })
export const actLte = (n: number): Cond => ({ var: 'act', lte: n })
/** On or after a calendar date. */
export const fromDate = (y: number, m0: number, d: number): Cond => ({ day: true, gte: dayOf(y, m0, d) })
/** Before a calendar date. */
export const beforeDate = (y: number, m0: number, d: number): Cond => ({ day: true, lte: dayOf(y, m0, d) - 1 })
/** Kroll's dinner has happened — Act II's comedy is over. */
export const darkTurn: Cond = { flag: 'a2.phase_iib' }
/** Twenty-seven and up: the knees start filing their own reports. */
export const olderNow: Cond = { age: true, gte: 27 }

const YEARS = [2001, 2002, 2003, 2004, 2005, 2006, 2007, 2008, 2009, 2010, 2011, 2012]

/** The retail holiday crush: from the week before Thanksgiving to Christmas Eve, every year. */
export const holidayRush: Cond = {
  any: YEARS.map(y => ({ all: [fromDate(y, 10, 18), beforeDate(y, 11, 25)] })),
}

/** Office-party season: the whole of December. */
export const partySeason: Cond = {
  any: YEARS.map(y => ({ all: [fromDate(y, 11, 1), beforeDate(y + 1, 0, 1)] })),
}

// ── Job groups (ids from PKG-18) ──────────────────────────────────────────────

export const STREET_ROUTES = ['job_odd_paper_route', 'job_odd_flyers', 'job_odd_pizza_bike']
export const CC_JOBS = ['job_compcastle_bench', 'job_compcastle_lead']
export const HALCYON_JOBS = ['job_halcyon_junior', 'job_halcyon_senior', 'job_halcyon_lead']
export const MERIDIAN_JOBS = ['job_meridian_support', 'job_meridian_dev', 'job_meridian_secanalyst', 'job_meridian_it_manager']
export const NORTHLINK_JOBS = [
  'job_northlink_helpdesk',
  'job_northlink_field_tech',
  'job_northlink_noc_night',
  'job_northlink_sysadmin',
  'job_northlink_senior_sysadmin',
  'job_northlink_neteng',
  'job_northlink_architect',
]
export const LSU_JOBS = ['job_lsu_helpdesk', 'job_lsu_labtech']
export const SHOP_JOBS = ['job_pixelworks_web', 'job_coop_dev', 'job_coop_partner']
export const STARTUP_JOBS = ['job_startup_engineer', 'job_startup_cto']

/** Tracks with an office, a boss and a holiday party. */
export const OFFICE_TRACKS = ['support', 'dev', 'sysadmin', 'network', 'security', 'management', 'startup']

/** Every job in the game — used to reward "whatever you're doing now". */
export const ALL_JOBS = [
  'job_odd_paper_route',
  'job_odd_flyers',
  'job_odd_pizza_bike',
  'job_odd_cathode',
  'job_odd_library',
  'job_odd_tv_cafe',
  'job_odd_pager_shop',
  ...CC_JOBS,
  ...LSU_JOBS,
  'job_meridian_support',
  'job_meridian_dev',
  'job_meridian_secanalyst',
  'job_meridian_it_manager',
  ...NORTHLINK_JOBS,
  'job_pixelworks_web',
  'job_coop_dev',
  'job_coop_partner',
  ...HALCYON_JOBS,
  'job_datacenter_ops',
  'job_cage_consultant',
  'job_tidewater_consultant',
  'job_bureau_consultant',
  'job_aperture_analyst',
  ...STARTUP_JOBS,
  'job_shady_refurb',
  'job_shady_verification',
  'job_shady_switch_crew',
]

/** Job XP for whichever job you currently hold (only the matching branch applies). */
export const bumpJob = (add: number): Effect[] => ALL_JOBS.map(j => ({ if: { job: j }, then: [{ jobXp: j, add }] }))

// ── The HR file ───────────────────────────────────────────────────────────────

export const STRIKES = 'ev_work.strikes'
/** Two write-ups on file: one more and it's a performance plan. */
export const onFinalWarning: Cond = { var: STRIKES, gte: 2 }

/** A write-up goes in your file. */
export const strike: Effect[] = [
  { var: STRIKES, add: 1 },
  {
    if: { var: STRIKES, gte: 3 },
    then: [{ notify: 'Third write-up. Somebody in HR has booked a meeting room with your name on it.', kind: 'bad' }],
    else: [
      {
        if: { var: STRIKES, eq: 2 },
        then: [{ notify: 'A second write-up goes in your file. That is what they call a final warning.', kind: 'bad' }],
        else: [{ notify: 'A write-up goes in your file.', kind: 'bad' }],
      },
    ],
  },
]

/** Fired on the spot: the job goes, the file closes, and the pink slip leaves a mark. */
export const firedNow: Effect[] = [
  { job: null },
  { var: STRIKES, set: 0 },
  { trait: 'ev_work_once_fired' },
  { stat: 'mood', add: -10 },
  { stat: 'stress', add: 8 },
]

// ── Buffs (temporary — weeks) ─────────────────────────────────────────────────

export const SPRAIN: BuffDef = {
  id: 'ev_work_sprain',
  name: 'Sprained Ankle',
  desc: 'Every step reminds you. Stairs are a negotiation and exercise is off the table for a while.',
  days: 14,
  bad: true,
  mods: [
    { key: 'energy.drain', mult: 1.12 },
    { key: 'xp.fitness', mult: 0.5 },
    { key: 'efficiency', mult: 0.97 },
  ],
}

export const COMPLAINT: BuffDef = {
  id: 'ev_work_complaint',
  name: 'Complaint on File',
  desc: 'A customer wrote in. Your manager has read it twice and highlighted the adjectives.',
  days: 21,
  bad: true,
  mods: [
    { key: 'jobXp', mult: 0.75 },
    { key: 'mood.daily', add: -0.3 },
  ],
}

export const GOOD_WORD: BuffDef = {
  id: 'ev_work_good_word',
  name: 'Good Word Around the Office',
  desc: 'Somebody said something nice about you in a meeting you weren\'t in. It keeps getting repeated.',
  days: 28,
  mods: [
    { key: 'jobXp', mult: 1.25 },
    { key: 'mood.daily', add: 0.3 },
  ],
}

export const OFFICE_HERO: BuffDef = {
  id: 'ev_work_office_hero',
  name: 'Office Legend',
  desc: 'People tell the story in the break room. You walk a little taller, and doors open a little faster.',
  days: 28,
  mods: [
    { key: 'jobXp', mult: 1.3 },
    { key: 'check.social', add: 1 },
  ],
}

export const BAD_WORD: BuffDef = {
  id: 'ev_work_bad_word',
  name: 'Bad Word of Mouth',
  desc: 'A client is telling everyone who will listen. The good gigs are going to somebody else this month.',
  days: 42,
  bad: true,
  mods: [
    { key: 'freelance.pay', mult: 0.85 },
    { key: 'jobXp', mult: 0.85 },
  ],
}

export const DOCKED: BuffDef = {
  id: 'ev_work_docked',
  name: 'Docked Pay',
  desc: 'The paycheck is lighter until the damage is paid off. You check the stub every week like a scab.',
  days: 28,
  bad: true,
  mods: [{ key: 'pay', mult: 0.85 }],
}

export const CRUNCH: BuffDef = {
  id: 'ev_work_crunch',
  name: 'Crunch Mode',
  desc: 'Nights, weekends, the cot in the server room. You are getting an astonishing amount done and you have forgotten what the sun is for.',
  days: 21,
  mods: [
    { key: 'efficiency', mult: 1.06 },
    { key: 'jobXp', mult: 1.2 },
    { key: 'stress.gain', mult: 1.25 },
    { key: 'energy.regen', mult: 0.92 },
  ],
}

export const FRIED: BuffDef = {
  id: 'ev_work_fried',
  name: 'Fried',
  desc: 'The crunch ended. You didn\'t, quite. Words take longer to arrive and nothing tastes like anything.',
  days: 21,
  bad: true,
  mods: [
    { key: 'efficiency', mult: 0.9 },
    { key: 'mood.daily', add: -0.5 },
  ],
}

export const ON_CALL: BuffDef = {
  id: 'ev_work_on_call',
  name: 'On Call',
  desc: 'The raise is real and so is the pager on your belt. You sleep like a smoke detector: lightly, and waiting.',
  days: 90,
  mods: [
    { key: 'pay', mult: 1.12 },
    { key: 'stress.gain', mult: 1.12 },
    { key: 'energy.regen', mult: 0.95 },
  ],
}

export const PAY_CUT: BuffDef = {
  id: 'ev_work_pay_cut',
  name: 'Solidarity Pay Cut',
  desc: 'You took less so someone else could keep something. The stub stings. The mirror doesn\'t.',
  days: 120,
  bad: true,
  mods: [
    { key: 'pay', mult: 0.8 },
    { key: 'mood.daily', add: 0.2 },
  ],
}

export const DEFERRED: BuffDef = {
  id: 'ev_work_deferred',
  name: 'Deferred Salary',
  desc: 'Driftwood is paying you in equity and optimism until the round closes. Optimism does not cover rent.',
  days: 56,
  bad: true,
  mods: [{ key: 'pay', mult: 0.3 }],
}

export const DEFERRED_HALF: BuffDef = {
  id: 'ev_work_deferred_half',
  name: 'Half Salary',
  desc: 'You split the difference: half a paycheck now, a little more lottery ticket later.',
  days: 56,
  bad: true,
  mods: [{ key: 'pay', mult: 0.65 }],
}

export const WATCHED: BuffDef = {
  id: 'ev_work_watched',
  name: 'Being Watched',
  desc: 'Someone noticed you looking. Now you notice everything: the same car twice, the click on the line, the new guy in IT who is very interested in your weekend.',
  days: 28,
  bad: true,
  mods: [
    { key: 'stress.gain', mult: 1.1 },
    { key: 'heat.decay', add: -0.2 },
  ],
}

export const PARTY_REGRET: BuffDef = {
  id: 'ev_work_party_regret',
  name: 'The Photocopier Incident',
  desc: 'Nobody has said anything. Everybody has said everything. There may be a copy on the fridge.',
  days: 21,
  bad: true,
  mods: [
    { key: 'check.social', add: -2 },
    { key: 'mood.daily', add: -0.3 },
  ],
}

export const DUCHESS: BuffDef = {
  id: 'ev_work_duchess',
  name: 'Duchess Walks You Home',
  desc: 'Eighty pounds of grey-muzzled dog escorts you down Pike Street like visiting royalty. It is the best part of your day.',
  days: 60,
  mods: [
    { key: 'mood.daily', add: 0.4 },
    { key: 'stress.relief', mult: 1.05 },
  ],
}

export const WELL_READ: BuffDef = {
  id: 'ev_work_well_read',
  name: 'Miss Fenn\'s Pick',
  desc: 'A book a dead librarian chose for you, one lunch break at a time. You read faster than you used to.',
  days: 28,
  mods: [{ key: 'xp.all', mult: 1.05 }],
}

export const DAWN_SHIFT: BuffDef = {
  id: 'ev_work_dawn_shift',
  name: 'Six A.M. with Gordon',
  desc: 'Every morning before the tower wakes up, an old man teaches you a machine older than your parents. You are tired and you are learning like a sponge.',
  days: 42,
  mods: [
    { key: 'energy.regen', mult: 0.93 },
    { key: 'xp.systems', mult: 1.25 },
    { key: 'xp.programming', mult: 1.1 },
  ],
}

export const LIAISON_PAY: BuffDef = {
  id: 'ev_work_liaison_pay',
  name: 'Friends in Procurement',
  desc: 'Box seats, steak dinners, and a quiet "consulting" envelope from Coastal every quarter. Money is easy. The signature gets heavier each time.',
  days: 180,
  mods: [
    { key: 'pay', mult: 1.2 },
    { key: 'stress.gain', mult: 1.08 },
  ],
}

export const PIP: BuffDef = {
  id: 'ev_work_pip',
  name: 'On a Performance Plan',
  desc: 'Every hour is documented. You are working harder than you ever have, mostly out of fear.',
  days: 28,
  bad: true,
  mods: [
    { key: 'stress.gain', mult: 1.15 },
    { key: 'jobXp', mult: 1.15 },
  ],
}

// ── Scars (permanent traits earned at work) ──────────────────────────────────

const SCARS: TraitDef[] = [
  {
    id: 'ev_work_once_fired',
    name: 'Pink Slip',
    desc: 'You have carried a cardboard box out past the front desk once. You will never let it happen again, and you will never quite stop expecting it to.',
    scar: true,
    // Double-edged: you work like it matters, because you know exactly what it costs.
    mods: [
      { key: 'jobXp', mult: 1.1 },
      { key: 'stress.gain', mult: 1.06 },
    ],
  },
  {
    id: 'ev_work_crunch_brain',
    name: 'Crunch-Brained',
    desc: 'Two crunches too many. Your body has learned that sleep is optional and it will not unlearn it.',
    scar: true,
    bad: true,
    mods: [
      { key: 'energy.regen', mult: 0.93 },
      { key: 'mood.daily', add: -0.2 },
    ],
  },
  {
    id: 'ev_work_mainframe_keeper',
    name: 'Keeper of the Old Iron',
    desc: 'An old man trusted you with a machine nobody else understands. You learned to hear a system the way a mechanic hears an engine.',
    scar: true,
    mods: [
      { key: 'check.systems', add: 1 },
      { key: 'xp.systems', mult: 1.1 },
    ],
  },
  {
    id: 'ev_work_bad_knee',
    name: 'Bad Knee',
    desc: 'Something in there went twang on the job and never quite untwanged. It predicts rain better than the Herald does.',
    scar: true,
    bad: true,
    mods: [
      { key: 'xp.fitness', mult: 0.85 },
      { key: 'energy.drain', mult: 1.04 },
    ],
  },
  {
    id: 'ev_work_straight_shooter',
    name: 'Straight Shooter',
    desc: 'You told a boardroom the truth and it turned out to be right. People believe you now — and some clients would rather hire someone softer.',
    scar: true,
    mods: [
      { key: 'check.business', add: 1 },
      { key: 'check.social', add: 1 },
      { key: 'freelance.pay', mult: 0.95 },
    ],
  },
  {
    id: 'ev_work_on_the_take',
    name: 'On the Take',
    desc: 'Somebody in Millgate has a receipt with your signature on it. It sits in a file, patient as a landmine.',
    scar: true,
    bad: true,
    mods: [
      { key: 'heat.decay', add: -0.15 },
      { key: 'mood.daily', add: -0.2 },
    ],
  },
  {
    id: 'ev_work_difficult',
    name: 'Difficult to Work With',
    desc: 'Two words in a reference call, said in a certain tone. The raises come slower and the good projects go to people who smile more.',
    scar: true,
    bad: true,
    mods: [
      { key: 'pay', mult: 0.95 },
      { key: 'jobXp', mult: 0.92 },
    ],
  },
  {
    id: 'ev_work_the_axe',
    name: 'The Axe',
    desc: 'You held the list and you cut the names. You are very good in a negotiation now. People stop talking when you walk into the kitchen.',
    scar: true,
    bad: true,
    mods: [
      { key: 'check.business', add: 1 },
      { key: 'check.social', add: -1 },
      { key: 'mood.daily', add: -0.3 },
    ],
  },
]

export default defineContent({ traits: SCARS })
