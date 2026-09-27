/**
 * PKG-18 — standing buffs and passive income the bible attaches to this package (§13: "all BuffDef
 * — retainer income, y2k safehouse; grief is PKG-02, burnout is the engine").
 *
 * Buffs are applied inline (the engine has no buff registry), so this file is the triggers that
 * grant them:
 *   - The Aperture retainer pays a monthly stipend and a mild standing buff while you hold it.
 *   - The Y2K prepper's bunker becomes a long-lived heat-decay safehouse once you fix its network.
 */
import { defineContent } from '@/engine/registry'
import type { TriggerDef } from '@/engine/types'

const triggers: TriggerDef[] = [
  // Retainer income: a monthly stipend while `fac.aperture.retainer` holds (set at CP-B1 D).
  {
    id: 'trig_pkg18_retainer_income',
    when: { all: [{ flag: 'fac.aperture.retainer' }, { flag: 'w.aperture_state', eq: 'thriving' }] },
    once: false,
    cooldownDays: 30,
    atHour: 8,
    effects: [
      { money: 1200 },
      {
        buff: {
          id: 'buff_aperture_retainer',
          name: 'Aperture Retainer',
          desc: 'A line item on somebody else\'s budget. The money is steady; the sleep is not.',
          days: 40,
          mods: [{ key: 'expenses', mult: 0.95 }],
        },
      },
      { notify: 'Aperture retainer deposited: +$1,200. Hollis never signs the memo. The money still arrives.', kind: 'money' },
    ],
  },
  // The Y2K bunker safehouse (bible §9.4): a durable heat-decay hideout once `life.y2k_safehouse`
  // is set by PKG-15's `life_y2k_holdout`. Refreshed slowly so it persists across the late game.
  {
    id: 'trig_pkg18_y2k_safehouse',
    when: { flag: 'life.y2k_safehouse' },
    once: false,
    cooldownDays: 200,
    atHour: 6,
    effects: [
      {
        buff: {
          id: 'buff_y2k_safehouse',
          name: 'The Bunker',
          desc: 'A prepper\'s off-grid room you keep quietly stocked. A clean place to go to ground: heat cools faster.',
          days: 240,
          mods: [{ key: 'heat.decay', add: 0.4 }],
        },
      },
    ],
  },
]

export default defineContent({ triggers })
