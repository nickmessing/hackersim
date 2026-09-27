/**
 * PKG-02 — scars: permanent traits earned by Act II failures (REDESIGN_V2 §C/§D).
 *
 * Each one is granted by a specific failed check and never offered at character creation. They are
 * small, legible, permanent nudges — the kind of thing a player notices on the character sheet a
 * year later and remembers exactly which night it came from.
 *
 *  - Bought Cheap      — overreached negotiating with Kroll at the first dinner (main_a2_q1).
 *  - Red Dot           — the early bank job lit up a federal map (main_a2_q4, CP-B3 D fail).
 *  - Prints on File    — the first raid took you in (main_a2_q5, stonewall/panic/run fail).
 *  - Bad Knee          — you didn't clear the fence (main_a2_q5, run fail).
 *  - Counting Exits    — you fumbled Mira's wall and caught her oldest habit (main_a2_q6). Double-edged.
 *  - Your Own Voice    — the wire you built for Kroll failed, and she mailed you the tape
 *                        (main_a2_q7, CP-B5 E fail). Double-edged.
 */
import { defineContent } from '@/engine/registry'
import type { TraitDef } from '@/engine/types'

export const SCAR = {
  boughtCheap: 'pkg02_act2_bought_cheap',
  redDot: 'pkg02_act2_red_dot',
  printsOnFile: 'pkg02_act2_prints_on_file',
  badKnee: 'pkg02_act2_bad_knee',
  countingExits: 'pkg02_act2_counting_exits',
  ownVoice: 'pkg02_act2_own_voice',
} as const

const traits: TraitDef[] = [
  {
    id: SCAR.boughtCheap,
    name: 'Bought Cheap',
    desc: 'Vanessa Kroll named your price before you could, and a stubborn little part of you still believes her. When the numbers get big, you flinch first.',
    scar: true,
    bad: true,
    mods: [{ key: 'check.business', add: -1 }],
  },
  {
    id: SCAR.redDot,
    name: 'Red Dot',
    desc: 'Since the night the bank lit up, your handle has had its own pin on a federal corkboard. Heat you pick up sticks around longer.',
    scar: true,
    bad: true,
    mods: [{ key: 'heat.decay', add: -0.1 }],
  },
  {
    id: SCAR.printsOnFile,
    name: 'Prints on File',
    desc: 'Booked, photographed and fingerprinted at the Harbor Street precinct. The system knows your face now, and it is very good at faces.',
    scar: true,
    bad: true,
    mods: [
      { key: 'heat.decay', add: -0.06 },
      { key: 'hack.heat', mult: 1.05 },
    ],
  },
  {
    id: SCAR.badKnee,
    name: 'Bad Knee',
    desc: 'You didn\'t clear the fence. The fence cleared you. It aches before rain, and Port Lumen is mostly rain.',
    scar: true,
    bad: true,
    mods: [
      { key: 'check.fitness', add: -2 },
      { key: 'energy.drain', mult: 1.03 },
    ],
  },
  {
    id: SCAR.countingExits,
    name: 'Counting Exits',
    desc: 'You lost Mira and kept her oldest habit: every room you walk into, you find the doors first. It keeps you safe. It keeps people out.',
    scar: true,
    mods: [
      { key: 'check.opsec', add: 1 },
      { key: 'check.social', add: -1 },
    ],
  },
  {
    id: SCAR.ownVoice,
    name: 'Your Own Voice',
    desc: 'Somewhere in Millgate there is a tape of you testing a wire meant for Vanessa Kroll, and she made sure you know it. You check every rig three times now. Some nights you hear yourself saying "testing, testing" in the dark.',
    scar: true,
    mods: [
      { key: 'check.cryptography', add: 1 },
      { key: 'stress.gain', mult: 1.04 },
    ],
  },
]

export default defineContent({ traits })
