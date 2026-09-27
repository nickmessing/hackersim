/**
 * COMPLICATIONS — "complications_life": shared guards, helpers and namespaces.
 *
 * This pack authors CONSEQUENCE SUB-STORIES (REDESIGN_V2 §C) for the sources 'social', 'work',
 * 'health' and 'any'. A complication is an `EventDef` with a `complication: { sources, minTier,
 * maxTier }` block; the director never picks it — it is spawned by a matching `{ complication }`
 * effect (fail branches elsewhere in the game, plus the small spawner triggers in `spawners.ts`).
 * Each one is a real little story with lasting marks: scars (`marks.ts`), obligations, week-long
 * debuffs, faction/affinity damage, job loss, and private `cx_life.*` flags that later beats in
 * THIS pack read (see the "echo" paragraphs in each file).
 *
 * Guard rules: this pack never writes a `fate`, a `romance` state or another package's steering
 * flag onto a canonical NPC. Grudges are affinity deltas plus this pack's own flags. Invented
 * one-off characters are free-form labels (spaces/caps), never bare ids.
 *
 * Every id in this pack is prefixed `cx_life_`; every private flag lives under `cx_life.`.
 * Every file is auto-discovered, so this helper module also exports an empty pack.
 */
import { defineContent } from '@/engine/registry'
import type { Cond, Effect, NpcFate, QuestStageDef, Text } from '@/engine/types'

// ── People guards ─────────────────────────────────────────────────────────────

/** Fates after which an NPC can no longer message you, appear, or hold a grudge in person. */
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

/** Met, and still a live presence in your life (safe to use as a sender / grudge-holder). */
export const around = (npc: string): Cond => ({ all: [{ npc, met: true }, { npc, fateNot: ABSENT_FATES }] })

/** Around, and fond enough of you to be hurt by a betrayal. */
export const close = (npc: string, affinity = 35): Cond => ({ all: [around(npc), { npc, affinityGte: affinity }] })

// ── World guards ──────────────────────────────────────────────────────────────

export const employed: Cond = { not: { job: null } }
export const unemployed: Cond = { job: null }
export const free: Cond = { jailed: false }

/** Jobs whose loss would tear a hole in a story arc: these employers write you up, never fire you. */
export const ARC_JOBS = ['job_halcyon_junior', 'job_aperture_analyst', 'job_bureau_consultant', 'job_cage_consultant']
export const onArcJob: Cond = { job: ARC_JOBS }

/** Desk / tech work (not odd jobs): the tracks where an audit, an outage or a review can happen. */
export const TECH_TRACKS = ['support', 'dev', 'sysadmin', 'network', 'security', 'management', 'startup']
export const techJob: Cond = { jobTrack: TECH_TRACKS }

/** Mom is alive and still speaks to you (never contradict the Mom arc). */
export const momHere: Cond = {
  all: [{ not: { var: 'w.mom_gone', eq: 1 } }, { npc: 'mom', fateNot: ['passed', 'estranged'] }],
}

/** Housing with a landlord you answer to (the dorm has an RA, the parents' flat has Mom). */
export const RENTED_HOUSING = ['shared_room', 'studio_flat', 'millgate_onebed', 'harbor_loft', 'harbor_penthouse']
export const renting: Cond = { housing: RENTED_HOUSING }
export const atParents: Cond = { housing: 'parents_flat' }

export const actGte = (n: number): Cond => ({ var: 'act', gte: n })
export const actLte = (n: number): Cond => ({ var: 'act', lte: n })

/** PARALLAX consumer risk-scoring is live — the era where a bill can quietly become a denial. */
export const parallaxLive: Cond = { all: [{ flag: 'w.aperture_state', eq: 'thriving' }, { var: 'w.enclosure', gte: 2 }] }

/** The Cathode is still open (Sal's diner, the warm-restore spot). */
export const cathodeOpen: Cond = { var: 'w.cathode_open', eq: 1 }

/** A partner (read-only: romance is owned by the family/romance package). */
export const partnerIs = (id: 'mira' | 'grace'): Cond => ({ flag: 'life.partner', eq: id })
export const withPartner: Cond = {
  any: [
    { all: [partnerIs('mira'), around('mira'), { npc: 'mira', romance: ['dating', 'partner', 'engaged', 'married'] }] },
    { all: [partnerIs('grace'), around('grace'), { npc: 'grace', romance: ['dating', 'partner', 'engaged', 'married'] }] },
  ],
}

// ── Effect helpers ────────────────────────────────────────────────────────────

/**
 * A recurring debt with a fixed term. Every obligation in this pack ends on its own: the
 * Obligations panel has no settle button, so the only ways out are the term running down or a
 * story beat (a follow-up mail) that pays it off with `{ removeObligation }`.
 */
export const owe = (id: string, label: string, perDay: number, days: number): Effect => ({
  obligation: { id, label, perDay, days },
})

/** Money check for a pay option. */
export const has = (dollars: number): Cond => ({ stat: 'money', gte: dollars })

// ── Quest helpers ─────────────────────────────────────────────────────────────

/**
 * A terminal journal stage: shows how things ended and closes the quest at once.
 * `onEnter` is where the stage-level marks go when a branch (not a scene) decides the outcome.
 */
export function ending(text: Text, outcome: 'completed' | 'failed' = 'completed', onEnter?: Effect[]): QuestStageDef {
  return {
    text,
    outcome,
    ...(onEnter ? { onEnter } : {}),
    objectives: [
      {
        id: 'closed',
        text: 'This chapter is closed',
        when: { always: true },
        hidden: true,
        hint: 'Nothing left to do here — it is behind you now, for better or worse.',
      },
    ],
  }
}

// ── Recurrence helpers ────────────────────────────────────────────────────────
//
// The engine never re-opens a quest that already exists, so each quest-bearing complication in
// this pack fires ONCE. The few everyday misfortunes that are meant to recur get a second,
// different variant event (its own scene + quest) that is gated on the first one being over and
// on real time having passed. Conditions can't compare two numbers from state, so the first fire
// "stamps" the current quarter (91-day bucket) into a var, and the gap check expands to one
// branch per possible stamp.

const STAMP_BUCKET = 91
/** Buckets covering day 0 .. ~5800 (the whole 2001–2012 campaign with room to spare). */
const STAMP_BUCKETS = 64

/** Record which quarter of the campaign this is into `cx_life.stamp.<key>`. */
export const stamp = (key: string): Effect[] =>
  Array.from({ length: STAMP_BUCKETS }, (_, q): Effect => ({
    if: { day: true, gte: q * STAMP_BUCKET, lte: q * STAMP_BUCKET + STAMP_BUCKET - 1 },
    then: [{ var: `cx_life.stamp.${key}`, set: q }],
  }))

/**
 * True once at least `minDays` have passed since `stamp(key)` ran (measured from the end of the
 * stamped quarter, so the real gap is between `minDays` and `minDays + 91`). False if never stamped.
 */
export const stampedAgo = (key: string, stampedBy: string, minDays: number): Cond => ({
  all: [
    { eventFired: stampedBy },
    {
      any: Array.from({ length: STAMP_BUCKETS }, (_, q): Cond => ({
        all: [{ var: `cx_life.stamp.${key}`, eq: q }, { day: true, gte: (q + 1) * STAMP_BUCKET + minDays }],
      })),
    },
  ],
})

/** A complication's quest has run its course (completed or failed), so a sequel can start clean. */
export const questOver = (quest: string): Cond => ({ quest, status: ['completed', 'failed'] })

/** One calendar week, as a scene delay (the engine turns it into one weekly turn). */
export const WEEK = 168

export default defineContent({})
