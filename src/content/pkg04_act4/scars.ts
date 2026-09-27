/**
 * PKG-04 — Act IV scars (REDESIGN_V2 §C/§D): permanent traits earned on the fail branches of the
 * endgame (the Bonfire's botched first fire, a bad landing at the exchange fence, a photograph taken
 * in the exchange lot). `scar: true` keeps them out of character creation. Ids are prefixed with the
 * package dir. The endings' "What Followed You" slides (marks.ts) read them back.
 */
import { defineContent } from '@/engine/registry'

export default defineContent({
  traits: [
    {
      id: 'pkg04_act4_marked_traitor',
      name: 'Marked Traitor',
      desc: 'The scene worked out who lit the first fire. Your handle is on every blacklist from here to Ridgeport, and the kids who used to ask you for advice now ask each other about you.',
      scar: true,
      bad: true,
      mods: [
        { key: 'cred.gain', mult: 0.6 },
        { key: 'check.social', add: -1 },
      ],
    },
    {
      id: 'pkg04_act4_bad_knee',
      name: 'Bad Knee',
      desc: 'You came down wrong off the exchange fence, a decade older than your body remembered. It aches when the fog comes in, which in Port Lumen is always.',
      scar: true,
      bad: true,
      mods: [
        { key: 'energy.drain', mult: 1.05 },
        { key: 'xp.fitness', mult: 0.8 },
      ],
    },
    {
      id: 'pkg04_act4_photographed',
      name: 'Photographed',
      desc: 'Somebody has a glossy eight-by-ten of you in the exchange lot at 3 a.m., keys in hand, looking straight at the lens you never saw. You learned to check for cameras. You never learned to stop wondering who is holding the negatives.',
      scar: true,
      bad: true,
      mods: [
        { key: 'heat.decay', add: -0.06 },
        { key: 'stress.gain', mult: 1.05 },
        { key: 'check.opsec', add: 1 },
      ],
    },
  ],
})
