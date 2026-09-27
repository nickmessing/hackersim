/**
 * COMPLICATION PACK — spawner triggers.
 *
 * Complications are mostly pulled by fail branches elsewhere ({ complication: 'social' } etc.) and
 * by the engine's traced-op / failed-gig hooks. These triggers are the ambient safety net: when
 * your life is visibly running hot — chronic stress, neglected health, a body pushed too far — the
 * world occasionally sends a bill, without waiting for a dice roll to fail.
 *
 * They are also what makes the 'health' source reachable at all (no other package spawns it), so
 * every health complication in this pack has a way in.
 *
 * All rare, all long-cooldown, all gated so nothing piles on during a genuinely bad week. `chance`
 * is per daily check and the engine stretches it across the weekly turn (perStep), so the small
 * numbers here are already "roughly once every many weeks while the condition holds."
 */
import { defineContent } from '@/engine/registry'
import type { TriggerDef } from '@/engine/types'
import { free } from './_shared'

const triggers: TriggerDef[] = [
  // Chronic stress cashes out as a body problem (the only spawner for the 'health' source).
  {
    id: 'cx_life_spawn_health_stress',
    when: { all: [free, { stat: 'stress', gte: 85 }] },
    once: false,
    cooldownDays: 90,
    atHour: 9,
    chance: 0.02,
    effects: [{ complication: 'health' }],
  },
  // Neglected health, pushed anyway, finally sends an invoice.
  {
    id: 'cx_life_spawn_health_neglect',
    when: { all: [free, { stat: 'health', lte: 35 }] },
    once: false,
    cooldownDays: 100,
    atHour: 10,
    chance: 0.025,
    effects: [{ complication: 'health' }],
  },
  // Running cold and disconnected: a social thread frays on its own.
  {
    id: 'cx_life_spawn_social_lowmood',
    when: { all: [free, { stat: 'mood', lte: 25 }, { var: 'act', gte: 2 }] },
    once: false,
    cooldownDays: 120,
    atHour: 11,
    chance: 0.015,
    effects: [{ complication: 'social' }],
  },
  // Living on the edge financially invites the generic-misfortune pool.
  {
    id: 'cx_life_spawn_any_broke',
    when: { all: [free, { stat: 'money', lte: 40 }, { var: 'act', gte: 2 }] },
    once: false,
    cooldownDays: 120,
    atHour: 8,
    chance: 0.015,
    effects: [{ complication: 'any' }],
  },
]

export default defineContent({ triggers })
