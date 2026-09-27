/**
 * EVENT PACK "events_underground" — the underground scene's director pool.
 *
 * Theme (REDESIGN_V2 §C): forum rivals and script kiddies, the Loft and its back room, informants
 * and the paranoia they breed, police attention that reacts to heat, heat-relief opportunities,
 * black-market deals, tempting side jobs, faction envoys, and the slow cost of cred. Events spread
 * across the whole game — Act I comedy warming into Act IV weight — and roughly a third recur with
 * cooldowns and conditional text so a familiar beat never reads the same twice.
 *
 * Every id in this pack is prefixed `ev_under_`; every flag/var it writes is namespaced `ev_under.`.
 *
 * Reactive-text rule used throughout: scene text is rendered live from state, so a start node only
 * branches on things the scene itself can't change mid-read — per-event counters bumped by the
 * EventDef's own `effects` (they run before the scene is delivered) and "previous outcome"
 * snapshots copied at fire time (see `snapshot`).
 *
 * HARD RULE: all hacking here is invented flavor — dice, texture and jargon-colour, never a real
 * technique, tool name, command, or anything usable against a real system. All handles, sellers and
 * cutouts are fictional.
 *
 * Ownership: this pack owns only `src/content/events_underground/**`. It reuses existing cast ids
 * for cameos (guarded on fate/romance so it never contradicts an arc), reads confirmed world flags,
 * and writes only its own `ev_under.*` flags/vars, scars, obligations, buffs, items and news.
 */
import { dayOf } from '@/engine/calendar'
import { defineContent } from '@/engine/registry'
import type { BuffDef, Cond, Effect, NpcFate, TraitDef } from '@/engine/types'

// ── Fate guards (never message / visit while gone) ────────────────────────────

/** Fates after which an NPC can no longer show up in a scene. Mirrors PKG-15's guard. */
export const ABSENT: NpcFate[] = [
  'dead', 'missing', 'jailed', 'arrested', 'arrested_young', 'gone', 'passed',
  'exile', 'martyred', 'casualty', 'flips_you', 'estranged', 'left', 'broken',
]

/** NPC is met and still around to appear. */
export const around = (npc: string): Cond => ({ all: [{ npc, met: true }, { npc, fateNot: ABSENT }] })

/** Not in custody (in-person scenes never land in a cell). */
export const free: Cond = { jailed: false }

// ── Act / era helpers ─────────────────────────────────────────────────────────

export const actIs = (n: number): Cond => ({ var: 'act', eq: n })
export const actGte = (n: number): Cond => ({ var: 'act', gte: n })
export const actLte = (n: number): Cond => ({ var: 'act', lte: n })
export const actBetween = (lo: number, hi: number): Cond => ({ all: [actGte(lo), actLte(hi)] })

/** The dark turn (Kroll's dinner) has landed — Act II tone flips to gallows. */
export const darkTurn: Cond = { flag: 'a2.phase_iib' }
/** Still the comedy phase (Act I or IIa) — Kroll hasn't called yet. */
export const stillLight: Cond = { not: { flag: 'a2.phase_iib' } }

/** Convenience: on a calendar day at or after a date (era-gating hardware/tech beats). */
export const fromDate = (y: number, m0: number, d: number): Cond => ({ day: true, gte: dayOf(y, m0, d) })

// ── The scene is still a place ────────────────────────────────────────────────

/** The Loft board is not dark. */
export const boardLive: Cond = { not: { flag: 'w.scene_state', eq: 'dark' } }
/** The Cathode is still serving coffee. */
export const cathodeOpen: Cond = { var: 'w.cathode_open', eq: 1 }
/** Living at home with Mom and Dad (the phone line is shared, the walls are thin). */
export const atHome: Cond = { housing: 'parents_flat' }

// ── Common effect fragments ───────────────────────────────────────────────────

/** A short-lived buff/debuff (weeks). */
export const buff = (b: BuffDef): Effect => ({ buff: b })

/** Bump a per-event counter (put it in the EventDef's `effects` so it lands before the scene). */
export const bump = (v: string): Effect => ({ var: v, add: 1 })

/**
 * Copy a result flag into a "previous outcome" flag at fire time, so the start node can say
 * "last time you..." without flipping when this run sets the result flag again.
 */
export const snapshot = (from: string, into: string): Effect => ({
  if: { flag: from },
  then: [{ flag: into }],
  else: [{ clearFlag: into }],
})

/** "Lying low" — heat sheds faster but the money and the fun both dry up for a while. */
export const LYING_LOW: BuffDef = {
  id: 'ev_under_lying_low',
  name: 'Lying Low',
  desc: 'You have gone quiet on purpose. Heat cools faster, but the board is a stranger and the work is thin.',
  days: 28,
  mods: [
    { key: 'heat.decay', add: 0.5 },
    { key: 'cred.gain', mult: 0.7 },
    { key: 'freelance.pay', mult: 0.9 },
  ],
}

/** "Rattled" — a bad scare leaves your hands unsteady for a few weeks. */
export const RATTLED: BuffDef = {
  id: 'ev_under_rattled',
  name: 'Rattled',
  desc: 'Something got too close. You keep checking the window. Focus and nerve are shot until it fades.',
  days: 21,
  bad: true,
  mods: [
    { key: 'stress.gain', mult: 1.15 },
    { key: 'efficiency', mult: 0.94 },
  ],
}

/** "Riding High" — a clean win on the board and everyone knows your handle this month. */
export const RIDING_HIGH: BuffDef = {
  id: 'ev_under_riding_high',
  name: 'Riding High',
  desc: 'The board is saying your name. Cred comes easier and the work finds you while it lasts.',
  days: 28,
  mods: [
    { key: 'cred.gain', mult: 1.25 },
    { key: 'freelance.pay', mult: 1.1 },
  ],
}

/** "Laughingstock" — the board has a new favourite screenshot, and it's of you. */
export const LAUGHINGSTOCK: BuffDef = {
  id: 'ev_under_laughingstock',
  name: 'Laughingstock',
  desc: 'Somebody made your worst post into a signature file. It will pass. It has not passed yet.',
  days: 28,
  bad: true,
  mods: [
    { key: 'cred.gain', mult: 0.75 },
    { key: 'mood.daily', add: -0.5 },
  ],
}

// ── Scars (permanent traits earned by bad — or, once in a while, good — outcomes) ──

export const SCARS: TraitDef[] = [
  {
    id: 'ev_under_known_to_police',
    name: 'Known to Police',
    desc: 'Your name is in a folder in a squad room now. They remember you, and heat clings to you longer than it should.',
    scar: true,
    bad: true,
    mods: [{ key: 'heat.decay', add: -0.25 }],
  },
  {
    id: 'ev_under_burned_bridge',
    name: 'Burned Bridge',
    desc: 'You crossed the wrong people in the scene, and word travels on the board faster than any packet. Trust is harder to earn now.',
    scar: true,
    bad: true,
    mods: [
      { key: 'cred.gain', mult: 0.9 },
      { key: 'check.social', add: -1 },
    ],
  },
  {
    id: 'ev_under_paranoid_sleeper',
    name: 'Paranoid Sleeper',
    desc: 'You cover your tracks even in your dreams now — every light left on, every log checked twice. It keeps you careful and it keeps you tired.',
    scar: true,
    // Double-edged: the vigilance sheds heat, but the sleep never quite comes.
    mods: [
      { key: 'heat.decay', add: 0.25 },
      { key: 'stress.gain', mult: 1.12 },
      { key: 'energy.regen', mult: 0.95 },
    ],
  },
  {
    id: 'ev_under_street_smart',
    name: 'Street Smart',
    desc: 'A close call taught you how the scene really moves — who to read, when to walk, which smile is a knife. A good scar, for once.',
    scar: true,
    mods: [
      { key: 'check.social', add: 1 },
      { key: 'check.opsec', add: 1 },
    ],
  },
  {
    id: 'ev_under_marked_snitch',
    name: 'Suspected Snitch',
    desc: "A rumour got out that you talk to the wrong people. It isn't even true — or isn't quite — but the back room goes quiet when you walk in, and it stays that way.",
    scar: true,
    bad: true,
    mods: [
      { key: 'cred.gain', mult: 0.85 },
      { key: 'check.social', add: -1 },
    ],
  },
  {
    id: 'ev_under_open_file',
    name: 'An Open File',
    desc: 'Somewhere in Millgate a man in a grey suit wrote your name on a folder and did not close it. Every job you touch now gets looked at twice.',
    scar: true,
    bad: true,
    mods: [
      { key: 'hack.heat', mult: 1.1 },
      { key: 'stress.gain', mult: 1.05 },
    ],
  },
]

export default defineContent({
  traits: SCARS,
})
