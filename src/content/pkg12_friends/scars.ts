/**
 * PKG-12 — scars: permanent marks left by the friends & freelance fail branches
 * (REDESIGN_V2 §C/§D). Ids are prefixed with the package dir name.
 *
 *  - pkg12_friends_burned_marker  a called-in Loft marker you couldn't pay; the scene remembers,
 *                                 and it reads it back through cred.
 */
import { defineContent } from '@/engine/registry'
import type { TraitDef } from '@/engine/types'

const traits: TraitDef[] = [
  {
    id: 'pkg12_friends_burned_marker',
    name: 'Unpaid Marker',
    desc: 'The scene called in your marker and the answer was a kid in a grey car. That story travels. Underground doors that used to open now stick.',
    scar: true,
    bad: true,
    mods: [
      { key: 'cred.gain', mult: 0.85 },
      { key: 'mood.daily', add: -0.2 },
    ],
  },
]

export default defineContent({ traits })
