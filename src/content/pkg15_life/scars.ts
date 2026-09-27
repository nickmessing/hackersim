/**
 * PKG-15 — scars: permanent traits earned by the life-event fail branches (REDESIGN_V2 §C/§D).
 * Ids are prefixed with the package dir name.
 *
 *  - pkg15_life_paranoid_sleeper  after a raid, you couldn't account for what they took; you never
 *                                 sleep all the way through again — but you never stop checking.
 */
import { defineContent } from '@/engine/registry'
import type { TraitDef } from '@/engine/types'

const traits: TraitDef[] = [
  {
    id: 'pkg15_life_paranoid_sleeper',
    name: 'Paranoid Sleeper',
    desc: 'You never did finish the list of what they might have found. Some part of you is still counting discs at 4 a.m. You wake at every car door on the street — and you have not left a disc unwiped since.',
    scar: true,
    bad: true,
    mods: [
      { key: 'energy.regen', mult: 0.93 },
      { key: 'check.opsec', add: 1 },
      { key: 'heat.decay', add: 0.1 },
    ],
  },
]

export default defineContent({ traits })
