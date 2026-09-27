/**
 * PKG-05 — the Loft's scars: permanent traits earned when a Loft moment goes badly
 * (REDESIGN_V2 §D fail-branch pass). Never offered at character creation.
 *
 *  - The Miracle Arrow   — the co-op pitch you botched in the back room (fac_loft_q2).
 *  - Took the Stand      — you testified for Corvid under your own name, and lost (fac_loft_q5).
 *  - Four Sleepless Nights — the sock puppet in the rebuilt board (fac_loft_q6, Systems fail).
 *  - Vouched for a Fed   — the vouch chain that let the Bureau in (fac_loft_q6, OpSec fail).
 */
import { defineContent } from '@/engine/registry'

export default defineContent({
  traits: [
    {
      id: 'pkg05_loft_miracle_arrow',
      name: 'The Miracle Arrow',
      desc: 'Your co-op pitch had an arrow on it labeled "and then a miracle happens." The Row will never let it go. People underestimate you, which helps; nobody quite trusts your spreadsheets, which doesn\'t.',
      scar: true,
      mods: [
        { key: 'check.business', add: -1 },
        { key: 'check.social', add: 1 },
      ],
    },
    {
      id: 'pkg05_loft_on_the_record',
      name: 'Took the Stand',
      desc: 'You testified at a hacker\'s trial under your own name and answered one question too honestly. The police know your face now. On the bright side, after a jury, every other room is easy.',
      scar: true,
      bad: true,
      mods: [
        { key: 'heat.decay', add: -0.2 },
        { key: 'check.social', add: 1 },
      ],
    },
    {
      id: 'pkg05_loft_sleepless_sysop',
      name: 'Four Sleepless Nights',
      desc: 'A polite new member with perfect punctuation turned out to be a corporate sock puppet, and you spent four nights finding every door he opened. You read punctuation like a threat now. You also don\'t sleep right.',
      scar: true,
      bad: true,
      mods: [
        { key: 'stress.gain', mult: 1.08 },
        { key: 'energy.regen', mult: 0.95 },
        { key: 'check.opsec', add: 1 },
      ],
    },
    {
      id: 'pkg05_loft_vouched_a_fed',
      name: 'Vouched for a Fed',
      desc: 'Three links deep in the rebuilt board\'s vouch chain sat a Bureau contractor in a very nice jacket, and the first link was you. Everybody forgave you. Nobody forgot. You will never vouch lightly again.',
      scar: true,
      bad: true,
      mods: [
        { key: 'cred.gain', mult: 0.9 },
        { key: 'check.opsec', add: 1 },
      ],
    },
  ],
})
