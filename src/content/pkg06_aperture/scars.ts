/**
 * PKG-06 — Aperture's scars: permanent traits earned when a Special Accounts job goes wrong
 * (REDESIGN_V2 §D fail-branch pass). Never offered at character creation.
 *
 *  - Asset #40032        — you let Compliance image your machine (the vendor audit, q2 skim fail).
 *  - An Open File        — Hollis caught you playing both sides (audit decoy fail, q3 fake fail,
 *                          the café wire). Sets `fac.aperture.hollis_file`, which later jobs read.
 *  - The Parking Structure — you couldn't bury Grace, and now you check mirrors (q5 rescue fail).
 */
import { defineContent } from '@/engine/registry'

export default defineContent({
  traits: [
    {
      id: 'pkg06_aperture_asset_tag',
      name: 'Asset #40032',
      desc: 'Aperture\'s Compliance desk imaged your machine and handed it back cleaner than you left it, with a laminated asset tag on the case. Something of theirs rode home inside it. Your traces run hotter; your hacks run louder.',
      scar: true,
      bad: true,
      mods: [
        { key: 'trace', mult: 0.9 },
        { key: 'hack.heat', mult: 1.1 },
      ],
    },
    {
      id: 'pkg06_aperture_open_file',
      name: 'An Open File',
      desc: '"You are, at present, an open file." Miles Hollis keeps a tab in his leather folio with your name on it, and Aperture\'s people read your traffic like a hobby. Heat leaves you slower than it should.',
      scar: true,
      bad: true,
      flags: ['fac.aperture.hollis_file'],
      mods: [{ key: 'heat.decay', add: -0.15 }],
    },
    {
      id: 'pkg06_aperture_parking_structure',
      name: 'The Parking Structure',
      desc: 'You left threads, and a man with a folio pulled one in a hospital parking garage. You check mirrors now: every car, every stairwell, every patient smile. It keeps your heat down. It keeps you up at night.',
      scar: true,
      bad: true,
      mods: [
        { key: 'energy.regen', mult: 0.94 },
        { key: 'heat.decay', add: 0.2 },
      ],
    },
  ],
})
