/**
 * PKG-03 — Act III system triggers (bible §5.1, §9.0).
 *
 * The two act gates are the ONLY authorized writers of `act` past Act II. Each is a persistent,
 * once, hourly trigger whose `when` is the full gate condition and whose effects write `act` and
 * start the next act's q1. Support triggers precompute the gate's derived inputs (`a3.committed`,
 * `a3.own_branches`, `a3.real_fates`) at a low priority so they are fresh when the gate checks.
 *
 * Cross-package ids referenced by exact bible id (owners in parentheses):
 *   quest main_a4_q1_reckonings (PKG-04); flags a2.first_raid_resolved / a2.mom_crisis_resolved /
 *   a2.hinge_done (PKG-02); w.exposure / w.enclosure init (PKG-00). `end.has_evidence` is read only
 *   inside the quests, maintained by PKG-04's trig_evidence.
 */
import { defineContent } from '@/engine/registry'
import type { Cond, Effect, FactionId } from '@/engine/types'

const FACTIONS: FactionId[] = ['fac.loft', 'fac.aperture', 'fac.bureau', 'fac.halcyon', 'fac.hood']
const anyFactionAtLeast = (n: number): Cond => ({ any: FACTIONS.map(f => ({ faction: f, gte: n })) })

/** The four rival factions (Hood has no rival and can't be a commitment pole). */
const RIVALS: FactionId[] = ['fac.loft', 'fac.aperture', 'fac.bureau', 'fac.halcyon']

/** a3.real_fates = how many watch-list NPCs have moved off their default fate. */
const REAL_FATE_WATCH = [
  'mom', 'dad', 'kim', 'rosa', 'grandma_ruth', 'list_activist',
  'jax', 'mira', 'corvid', 'byteme', 'deadline', 'priya', 'kroll', 'grace',
] as const

const recomputeRealFates: Effect[] = [
  { var: 'a3.real_fates', set: 0 },
  ...REAL_FATE_WATCH.map((id): Effect => ({
    if: { npc: id, fateNot: 'normal' },
    then: [{ var: 'a3.real_fates', add: 1 }],
  })),
]

export default defineContent({
  triggers: [
    // ── Derived-input triggers (run before the gates) ─────────────────────────
    {
      id: 'trig_a3_own_branches',
      priority: 10,
      once: true,
      when: { var: 'w.enclosure', gte: 4 },
      effects: [{ flag: 'a3.own_branches' }],
    },
    {
      id: 'trig_a3_committed',
      priority: 10,
      once: true,
      when: {
        all: [
          { var: 'act', gte: 3 },
          {
            any: [
              // One faction Trusted while another is Hostile.
              { all: [anyFactionAtLeast(50), { any: RIVALS.map(f => ({ faction: f, lte: -20 })) }] },
              // Two rival factions both Trusted.
              { all: [{ faction: 'fac.loft', gte: 50 }, { faction: 'fac.aperture', gte: 50 }] },
              { all: [{ faction: 'fac.loft', gte: 50 }, { faction: 'fac.bureau', gte: 50 }] },
              { all: [{ faction: 'fac.aperture', gte: 50 }, { faction: 'fac.bureau', gte: 50 }] },
              { all: [{ faction: 'fac.halcyon', gte: 50 }, { faction: 'fac.loft', gte: 50 }] },
              { all: [{ faction: 'fac.halcyon', gte: 50 }, { faction: 'fac.aperture', gte: 50 }] },
            ],
          },
        ],
      },
      effects: [{ flag: 'a3.committed' }],
    },
    {
      id: 'trig_a3_real_fates',
      priority: 10,
      once: false,
      cooldownDays: 0, // recompute every hour once Act III is running (no soft warning)
      when: { var: 'act', gte: 3 },
      effects: recomputeRealFates,
    },

    // ── Act II → III gate (§5.1) ──────────────────────────────────────────────
    {
      id: 'trig_act3_gate',
      once: true,
      when: {
        all: [
          { var: 'act', eq: 2 },
          // Failsafe (playtest soft-lock): exposure only comes from optional investigative beats.
          { any: [{ var: 'w.exposure', gte: 6 }, { day: true, gte: 1700 }] },
          {
            any: [
              anyFactionAtLeast(50),
              { all: [{ day: true, gte: 1600 }, anyFactionAtLeast(35)] },
            ],
          },
          { flag: 'a2.first_raid_resolved' },
          { flag: 'a2.mom_crisis_resolved' },
          { flag: 'a2.hinge_done' },
          { day: true, gte: 1200 },
        ],
      },
      effects: [
        { var: 'act', set: 3 },
        { quest: 'main_a3_q1_the_law_begins', start: true },
      ],
    },

    // ── Act III → IV gate (§5.1) ──────────────────────────────────────────────
    {
      id: 'trig_act4_gate',
      once: true,
      when: {
        all: [
          { var: 'act', eq: 3 },
          { flag: 'a3.heist_resolved' },
          { any: [{ var: 'w.exposure', gte: 12 }, { day: true, gte: 3200 }] },
          { flag: 'a3.vote_resolved' },
          { flag: 'a3.oracle_revealed' },
          { flag: 'a3.mirror_revealed' },
          { any: [{ var: 'a3.real_fates', gte: 3 }, { day: true, gte: 3200 }] },
          { any: [{ flag: 'a3.committed' }, { day: true, gte: 3300 }] },
          { day: true, gte: 2900 },
        ],
      },
      effects: [
        { var: 'act', set: 4 },
        // Opened via the day-3300 fallback without ever committing → mark it for E9's variant.
        { if: { not: { flag: 'a3.committed' } }, then: [{ flag: 'end.uncommitted' }] },
        { quest: 'main_a4_q1_reckonings', start: true },
      ],
    },
  ],
})
