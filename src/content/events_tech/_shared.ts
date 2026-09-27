/**
 * EVENT PACK "events_tech" — the tech-&-era-nostalgia director pool (REDESIGN_V2 §C).
 *
 * Theme: the machines and the internet across 2001–2012, fictionalized end to end —
 * dial-up → broadband, the first worms and popup scams, guestbooks and flame-free forum quirks,
 * the blog era, early social networks, the smartphone landing, the demoscene, hardware that dies
 * with a click, and the eerie little corners of the net that stare back. Comedy in Act I, weight in
 * Act IV; roughly a third of the events recur with cooldowns and conditional text so a familiar
 * beat never reads the same twice.
 *
 * Ownership: this pack owns only `src/content/events_tech/**`. Every id it creates is prefixed
 * `ev_tech_` (events, scenes, traits, buffs, obligations, flags: `ev_tech.*`). It reuses existing
 * cast ids for cameos, always guarded on fate/romance so it never contradicts an arc, and it never
 * writes an NPC `fate`, a story flag it does not own, or a shared world counter (`w.exposure`,
 * `w.enclosure`, `w.heatGain`, `act`). Institutional grudges are `{ faction, add }` deltas.
 *
 * HARD RULE: all hacking/tech here is invented flavor — dice, texture and jargon-colour, never a
 * real technique, tool name, command, product, brand, or anything usable against a real system.
 */
import { dayOf } from '@/engine/calendar'
import { defineContent } from '@/engine/registry'
import type { BuffDef, Cond, Effect, NpcFate, RomanceState, TraitDef } from '@/engine/types'

// ── Fate guards (never let a gone NPC show up in a cameo) ──────────────────────

/** Fates after which an NPC can no longer message you, visit, or appear in a scene. */
export const ABSENT: NpcFate[] = [
  'dead', 'missing', 'jailed', 'arrested', 'arrested_young', 'gone', 'passed',
  'passed_keys', 'exile', 'martyred', 'casualty', 'flips_you', 'estranged', 'left', 'broken', 'bought',
]

/** Met, and still around to appear. */
export const around = (npc: string): Cond => ({ all: [{ npc, met: true }, { npc, fateNot: ABSENT }] })
/** Around, and fond of you. */
export const close = (npc: string, affinity = 35): Cond => ({ all: [around(npc), { npc, affinityGte: affinity }] })

/** Romance states that mean "together right now". */
export const TOGETHER: RomanceState[] = ['dating', 'partner', 'engaged', 'married']
/** Around, and currently together with you. */
export const together = (npc: string): Cond => ({ all: [around(npc), { npc, romance: TOGETHER }] })
/** Together with anyone the game lets you romance. */
export const inRelationship: Cond = { any: [together('mira'), together('grace')] }

/** Mom is alive, present and still speaking to you (bible §4.2 post-death guard). */
export const momHere: Cond = { all: [around('mom'), { not: { var: 'w.mom_gone', eq: 1 } }] }

/** Has a job at all. */
export const employed: Cond = { not: { job: null } }
/** A desk job with a manager, a shared server and an HR department. */
export const officeJob: Cond = { jobTrack: ['support', 'dev', 'sysadmin', 'network', 'security', 'management', 'startup'] }

// ── Act / era helpers ─────────────────────────────────────────────────────────

export const actGte = (n: number): Cond => ({ var: 'act', gte: n })
export const actLte = (n: number): Cond => ({ var: 'act', lte: n })
export const actBetween = (lo: number, hi: number): Cond => ({ all: [actGte(lo), actLte(hi)] })

/** On or after a calendar date (era-gating tech beats). */
export const fromDate = (y: number, m0: number, d: number): Cond => ({ day: true, gte: dayOf(y, m0, d) })
/** Inclusive calendar window. */
export const between = (fromDay: number, toDay: number): Cond => ({ all: [{ day: true, gte: fromDay }, { day: true, lte: toDay }] })

/** The dark turn (Kroll's dinner) has landed — tone flips to gallows. */
export const darkTurn: Cond = { flag: 'a2.phase_iib' }

/** Still on the household phone line — no broadband bought yet. */
export const onDialup: Cond = {
  all: [{ not: { item: 'net_isdn' } }, { not: { item: 'net_dsl' } }, { not: { item: 'net_cable' } }, { not: { item: 'net_fiber' } }],
}
/** The city has at least this broadband step (0 dial-up → 3 fiber; §9.0). */
export const broadbandGte = (n: number): Cond => ({ var: 'w.broadband', gte: n })

export const free: Cond = { jailed: false }

// ── Effect fragments ──────────────────────────────────────────────────────────

export const buff = (b: BuffDef): Effect => ({ buff: b })

/** A recurring cost you can settle early with { removeObligation: id }. */
export const owe = (id: string, label: string, perDay: number, days?: number): Effect => ({
  obligation: days !== undefined ? { id, label, perDay, days } : { id, label, perDay },
})

// ── Shared buffs / debuffs (weeks) ─────────────────────────────────────────────

/** Something on the screen got under your skin; you keep flinching at shadows. */
export const SPOOKED: BuffDef = {
  id: 'ev_tech_spooked',
  name: 'Spooked',
  desc: 'Something on the screen got into you. You keep glancing at the dark corners of the room. It passes.',
  days: 10,
  bad: true,
  mods: [{ key: 'stress.gain', mult: 1.12 }, { key: 'energy.regen', mult: 0.96 }],
}

/** A good clean-out / a quiet ritual leaves you settled for a while. */
export const SETTLED: BuffDef = {
  id: 'ev_tech_settled',
  name: 'Settled',
  desc: 'The machine is humming, the files are where they should be, and for once so are you.',
  days: 14,
  mods: [{ key: 'stress.relief', mult: 1.12 }, { key: 'mood.daily', add: 0.3 }],
}

/** New hardware / a new toy: the honeymoon weeks where everything feels fast. */
export const NEW_TOY: BuffDef = {
  id: 'ev_tech_new_toy',
  name: 'New-Toy Glow',
  desc: 'A new machine on the desk. Everything feels faster, and you keep finding excuses to use it.',
  days: 21,
  mods: [{ key: 'efficiency', mult: 1.05 }, { key: 'mood.daily', add: 0.4 }],
}

/** A fried component: the rig limps until you can replace the part. */
export const FRIED_RIG: BuffDef = {
  id: 'ev_tech_fried_rig',
  name: 'Let the Smoke Out',
  desc: 'A component died in a puff of hot plastic. The rig runs, badly, until you can afford the part.',
  days: 21,
  bad: true,
  mods: [{ key: 'hack.speed', mult: 0.9 }, { key: 'freelance.speed', mult: 0.9 }, { key: 'efficiency', mult: 0.97 }],
}

/** Junkware from a scam: the machine crawls under a load of "helpful" garbage. */
export const JUNKWARE: BuffDef = {
  id: 'ev_tech_junkware',
  name: 'Toolbar Infestation',
  desc: 'Three toolbars, a "system optimizer", and a search page you never chose. Everything is slower and shoutier.',
  days: 18,
  bad: true,
  mods: [{ key: 'efficiency', mult: 0.94 }, { key: 'stress.gain', mult: 1.06 }],
}

/** A night (or a week) of work evaporated; you're redoing what you already did. */
export const LOST_WORK: BuffDef = {
  id: 'ev_tech_lost_work',
  name: 'Starting Over',
  desc: 'Work you already did is gone and you are doing it again, slower, angrier, and saving every ninety seconds.',
  days: 14,
  bad: true,
  mods: [{ key: 'efficiency', mult: 0.92 }, { key: 'stress.gain', mult: 1.06 }],
}

/** Embermoor Online has its hooks in you. Pleasant. Expensive in sleep. */
export const ONE_MORE_QUEST: BuffDef = {
  id: 'ev_tech_one_more_quest',
  name: 'One More Quest',
  desc: 'Embermoor Online is open in the other window. It is always open in the other window. You are happier and more tired.',
  days: 28,
  mods: [{ key: 'mood.daily', add: 0.5 }, { key: 'stress.relief', mult: 1.1 }, { key: 'energy.regen', mult: 0.94 }, { key: 'efficiency', mult: 0.97 }],
}

/** An obsession with a puzzle nobody asked you to solve. */
export const RABBIT_HOLE: BuffDef = {
  id: 'ev_tech_rabbit_hole',
  name: 'Down the Rabbit Hole',
  desc: 'You keep a notebook of numbers by the bed. Your sleep is bad and your pattern-matching is frighteningly good.',
  days: 21,
  bad: true,
  mods: [{ key: 'efficiency', mult: 0.9 }, { key: 'energy.regen', mult: 0.93 }, { key: 'xp.cryptography', mult: 1.2 }],
}

/** Management has your name on a sticky note. */
export const THIN_ICE: BuffDef = {
  id: 'ev_tech_thin_ice',
  name: 'On Thin Ice at Work',
  desc: 'Your manager says "good morning" in a new, careful voice. Every mistake counts double until this blows over.',
  days: 28,
  bad: true,
  mods: [{ key: 'jobXp', mult: 0.8 }, { key: 'stress.gain', mult: 1.08 }],
}

/** Something you wrote got passed around, and for a few weeks the internet knows your handle. */
export const GOING_VIRAL: BuffDef = {
  id: 'ev_tech_viral',
  name: 'Briefly Internet-Famous',
  desc: 'Strangers quote you back to yourself. It will not last, and it feels incredible while it does.',
  days: 21,
  mods: [{ key: 'mood.daily', add: 0.5 }, { key: 'cred.gain', mult: 1.1 }, { key: 'check.social', add: 1 }],
}

/** A thing you did to someone who did not deserve it, on a loop, at 3 a.m. */
export const GUILT: BuffDef = {
  id: 'ev_tech_guilt',
  name: "Can't Stop Thinking About It",
  desc: 'You keep replaying it. You keep checking whether it has gone away. It has not gone away.',
  days: 21,
  bad: true,
  mods: [{ key: 'stress.gain', mult: 1.1 }, { key: 'mood.daily', add: -0.4 }],
}

/** You fixed the family machine and got fed for it. */
export const FAMILY_HERO: BuffDef = {
  id: 'ev_tech_family_hero',
  name: 'Family IT Hero',
  desc: 'You fixed it, they fed you, and for one evening nobody asked what you actually do for a living.',
  days: 14,
  mods: [{ key: 'mood.daily', add: 0.4 }, { key: 'stress.relief', mult: 1.08 }],
}

/** Your location went somewhere it should not have. */
export const PINNED: BuffDef = {
  id: 'ev_tech_pinned',
  name: 'Pinned on a Map',
  desc: 'Somewhere a dot with your name on it sits on a map of Port Lumen. Heat clings to you until the dot goes stale.',
  days: 28,
  bad: true,
  mods: [{ key: 'heat.decay', add: -0.2 }, { key: 'stress.gain', mult: 1.08 }],
}

/** Old files, old voices; you come away steadier than you went in. */
export const ROOTED: BuffDef = {
  id: 'ev_tech_rooted',
  name: 'Rooted',
  desc: 'You looked back at where you started and, for once, it steadied you instead of hurting.',
  days: 21,
  mods: [{ key: 'stress.relief', mult: 1.15 }, { key: 'mood.daily', add: 0.3 }],
}

// ── Scars (permanent traits earned by bad — or, once, good — outcomes) ─────────

export const SCARS: TraitDef[] = [
  {
    id: 'ev_tech_scar_patient_zero',
    name: 'Patient Zero',
    desc: 'You let something loose that mailed itself to everyone you know. The scene has never let you forget it, and it never will.',
    scar: true,
    bad: true,
    mods: [{ key: 'cred.gain', mult: 0.95 }, { key: 'check.social', add: -1 }],
    flags: ['ev_tech.patient_zero'],
  },
  {
    id: 'ev_tech_scar_magic_smoke',
    name: 'Respect for the Smoke',
    desc: 'You released the magic smoke once, and the smell never quite left your memory. Now you treat every heatsink like it might bite — and you are better at hardware for it.',
    scar: true,
    mods: [{ key: 'check.hardware', add: 1 }],
    flags: ['ev_tech.magic_smoke'],
  },
  {
    id: 'ev_tech_scar_lost_it_all',
    name: 'Once Bitten (Backs Up Twice)',
    desc: 'You lost a drive with your whole life on it, once. You will never make that mistake again — you save constantly, obsessively, a little slower for it, and a lot calmer.',
    scar: true,
    mods: [{ key: 'stress.gain', mult: 0.95 }, { key: 'efficiency', mult: 0.98 }],
    flags: ['ev_tech.lost_it_all'],
  },
  {
    id: 'ev_tech_scar_read_fine_print',
    name: 'Reads the Fine Print',
    desc: 'A slick scam got you for real money once. Now you read every checkbox twice and trust no free lunch — a hard lesson that pays for itself.',
    scar: true,
    mods: [{ key: 'check.business', add: 1 }],
    flags: ['ev_tech.read_fine_print'],
  },
  {
    id: 'ev_tech_scar_dooced',
    name: 'Dooced',
    desc: 'You were fired over a blog post. Type your name into Findle and it is still the first result. Interviewers have read it; the underground thinks it is hilarious.',
    scar: true,
    bad: true,
    mods: [{ key: 'jobXp', mult: 0.95 }, { key: 'check.business', add: -1 }, { key: 'cred.gain', mult: 1.03 }],
    flags: ['ev_tech.dooced'],
  },
  {
    id: 'ev_tech_scar_on_the_map',
    name: 'On the Map',
    desc: 'A gadget told the world exactly where you sleep, once. Heat sticks to you a little longer now — and you check every setting on every device twice.',
    scar: true,
    bad: true,
    mods: [{ key: 'heat.decay', add: -0.1 }, { key: 'check.opsec', add: 1 }],
    flags: ['ev_tech.on_the_map'],
  },
  {
    id: 'ev_tech_scar_wrong_man',
    name: 'The Wrong Man',
    desc: 'You were certain, you said so loudly, and a stranger who had done nothing paid for it. You do not say "I\'m sure" anymore. You verify.',
    scar: true,
    bad: true,
    mods: [{ key: 'stress.gain', mult: 1.03 }, { key: 'check.social', add: -1 }, { key: 'check.opsec', add: 1 }],
    flags: ['ev_tech.wrong_man'],
  },
]

export default defineContent({ traits: SCARS })
