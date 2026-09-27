/**
 * PKG-11 — scars: permanent traits earned by the family & romance fail branches (REDESIGN_V2 §C/§D).
 *
 *  - pkg11_family_shorter_notes    the confession fallout cracked instead of healing
 *  - pkg11_family_ridgeport_shadow Aaron's noise after a failed Ridgeport defuse, if it sticks
 *  - pkg11_family_scammed_twice    Dad's sweetheart scam rescue went wrong and you carry it
 */
import { defineContent } from '@/engine/registry'
import type { TraitDef } from '@/engine/types'

const traits: TraitDef[] = [
  {
    id: 'pkg11_family_shorter_notes',
    name: 'Shorter Notes',
    desc: 'The notes on the fridge came back after the detective\'s card. They are shorter now, and home is a place you are a little careful in.',
    scar: true,
    bad: true,
    mods: [
      { key: 'mood.daily', add: -0.3 },
      { key: 'stress.relief', mult: 0.92 },
    ],
  },
  {
    id: 'pkg11_family_ridgeport_shadow',
    name: 'Ridgeport Shadow',
    desc: 'A patient man in Ridgeport knows your handle now, and every few months another board gets a helpful anonymous post about you. Clients read boards.',
    scar: true,
    bad: true,
    mods: [
      { key: 'freelance.pay', mult: 0.93 },
      { key: 'heat.decay', add: -0.1 },
    ],
  },
  {
    id: 'pkg11_family_scammed_twice',
    name: 'Soft Touch, Hard Lesson',
    desc: 'You watched your father get taken by a stranger with a stock photo, and you could not get it back. You read every friendly message twice now. Nobody gets you with a sad story again.',
    scar: true,
    mods: [
      { key: 'check.social', add: -1 },
      { key: 'check.opsec', add: 1 },
    ],
  },
]

export default defineContent({ traits })
