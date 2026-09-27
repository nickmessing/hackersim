/**
 * PKG-00 — world-state initialization (bible §11.1 / §11.2).
 *
 * Runs once at game start, before every other trigger (priority 0). It is the only place any
 * package may `set` the shared add-only counters/multipliers; everyone else only `add`s.
 *
 * Important: the engine's `var add` starts from 0 when a var is unset, so the multipliers MUST be
 * initialized to 1.0 here before any news rider adds a delta (e.g. `w.heatGain add 0.10`).
 *
 * The affinity drift rules (bible §4.7) are engine-applied through `NpcDef.decay`; there is
 * deliberately no `trig_affinity_decay` trigger.
 */
import { defineContent } from '@/engine/registry'
import type { Effect } from '@/engine/types'

/** Numeric world vars: multipliers the sim reads, story counters and bool-ints. */
const NUMERIC_INIT: Record<string, number> = {
  // Multipliers read by the simulation (default 1.0).
  'w.heatGain': 1,
  'w.contractPay': 1,
  'w.itSalary': 1,
  'w.rent': 1,
  'w.prices': 1,
  'w.techPrices': 1,
  // Story counters and scalars.
  'w.exposure': 0,
  'w.enclosure': 0,
  'w.public_opinion': 0,
  'w.hood_soul': 0,
  'w.mnsa': 0,
  'w.broadband': 0,
  'w.heat_lifetime': 0,
  'w.list_saved': 0,
  // Bool-ints.
  'w.aperture_alerted': 0,
  'w.mill_open': 1,
  'w.datacenter_open': 0,
  'w.cathode_open': 1,
  'w.mom_gone': 0,
  // Shared add-only ending counter (§13: only PKG-00 may set it).
  'end.doubles': 0,
}

/** String-flag world enums (§11.2). */
const ENUM_INIT: Record<string, string> = {
  'w.halcyon_state': 'startup',
  'w.aperture_state': 'thriving',
  'w.meridian_state': 'healthy',
  'w.scene_state': 'vibrant',
  // "Derived" in readers from w.mnsa; initialized to match w.mnsa = 0.
  'w.surveillance': 'low',
}

const effects: Effect[] = [
  ...Object.entries(NUMERIC_INIT).map(([v, n]): Effect => ({ var: v, set: n })),
  ...Object.entries(ENUM_INIT).map(([f, s]): Effect => ({ flag: f, set: s })),
]

export default defineContent({
  triggers: [
    {
      id: 'trig_world_init',
      when: { always: true },
      once: true,
      priority: 0,
      effects,
    },
  ],
})
