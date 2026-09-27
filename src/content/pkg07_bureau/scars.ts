/**
 * PKG-07 — the Bureau's scars: permanent traits earned when the informant road goes badly
 * (REDESIGN_V2 §D fail-branch pass). Never offered at character creation.
 *
 *  - The Wire Itch          — Marlow made you prove yourself by wearing a wire into the Loft's
 *                             back room (fac_bureau_q2, the blown [Double]).
 *  - The Booth by the Jukebox — Marlow let the Row know you sit with a fed (q2 "Prove It" refusal,
 *                             or the q3 called bluff). Sets `fac.bureau.outed`, which PKG-05's
 *                             Loft scenes read.
 *  - Signed Statement       — you put your own name on the record so no friend had to go on it
 *                             (fac_bureau_q3, the blown decoy).
 */
import { defineContent } from '@/engine/registry'

export default defineContent({
  traits: [
    {
      id: 'pkg07_bureau_wire_itch',
      name: 'The Wire Itch',
      desc: 'You wore a wire into the back room above the pager shop, once, to prove to a man with a putter that you were slow and not crooked. The tape rash healed in a week. The itch didn\'t: every time somebody says "we don\'t rat," your collar remembers. You check rooms for recorders now. You also don\'t sleep like you used to.',
      scar: true,
      bad: true,
      mods: [
        { key: 'stress.gain', mult: 1.06 },
        { key: 'check.social', add: -1 },
        { key: 'check.opsec', add: 1 },
      ],
    },
    {
      id: 'pkg07_bureau_outed',
      name: 'The Booth by the Jukebox',
      desc: 'SAC Duke Marlow let the whole Row know which booth at the Cathode you share with a federal agent. Nobody spits. Nobody has to. Leads dry up, favors come slower, and the scene\'s respect arrives at a discount — but nobody bothers to ask you for anything risky anymore, which is its own strange rest.',
      scar: true,
      bad: true,
      flags: ['fac.bureau.outed'],
      mods: [
        { key: 'cred.gain', mult: 0.85 },
        { key: 'stress.relief', mult: 1.05 },
      ],
    },
    {
      id: 'pkg07_bureau_signed_statement',
      name: 'Signed Statement',
      desc: 'Your legal name sits at the bottom of a federal statement, above a line you signed so that no friend of yours had to. Every background check you ever pass now comes back with a pause in it, and heat finds you more easily than it should. You would sign it again. That part doesn\'t heal either.',
      scar: true,
      bad: true,
      mods: [
        { key: 'heat.decay', add: -0.15 },
        { key: 'pay', mult: 0.95 },
      ],
    },
  ],
})
