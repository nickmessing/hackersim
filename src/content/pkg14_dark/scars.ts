/**
 * PKG-14 — scars: permanent marks from the dark late-game fail branches
 * (REDESIGN_V2 §C/§D). Ids are prefixed with the package dir name.
 *
 *  - pkg14_dark_watched  you walked somewhere a Millgate desk was paid to watch, and it noticed you.
 *                        Double-edged: your name runs a little warm forever, but you never move
 *                        carelessly again.
 *  - pkg14_dark_polite_complaint  the seventy-two-hour collapse left your heart a little less patient.
 *  - pkg14_dark_modeled           a failed attempt to poison PARALLAX taught it your camouflage.
 */
import { defineContent } from '@/engine/registry'
import type { TraitDef } from '@/engine/types'

const traits: TraitDef[] = [
  {
    id: 'pkg14_dark_watched',
    name: 'A Warm Entry',
    desc: 'Somewhere in Millgate your handle sits one row above a wire you went looking for, flagged and dated. The heat never fully leaves you now — but neither does the caution it burned in.',
    scar: true,
    bad: true,
    mods: [
      { key: 'heat.decay', add: -0.15 },
      { key: 'check.opsec', add: 1 },
    ],
  },
  {
    id: 'pkg14_dark_polite_complaint',
    name: 'A Polite Complaint',
    desc: 'Harbor General called it "a heart that filed a very polite complaint." It still files them — a skipped beat on the stairs, a flutter at 3 a.m. You rest now when your chest asks, whether you want to or not.',
    scar: true,
    bad: true,
    mods: [
      { key: 'health.daily', add: -0.05 },
      { key: 'energy.drain', mult: 1.04 },
      { key: 'stress.gain', mult: 1.04 },
    ],
  },
  {
    id: 'pkg14_dark_modeled',
    name: 'Modeled',
    desc: 'You tried to poison PARALLAX and it learned the shape of your lies instead. Somewhere a model of you is a little sharper for the attempt. You know how you look from outside now — which is its own kind of education.',
    scar: true,
    bad: true,
    mods: [
      { key: 'check.opsec', add: -1 },
      { key: 'heat.decay', add: -0.05 },
      { key: 'check.cryptography', add: 1 },
    ],
  },
]

export default defineContent({ traits })
