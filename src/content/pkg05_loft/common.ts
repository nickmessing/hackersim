/**
 * PKG-05 — The Loft arc: shared conditions and constants.
 *
 * Ownership (bible §13): fac_loft_q1…q6 (+ the journal mirror fac_loft_q4_solidarity), their
 * scenes, the Loft's repeatable rep sources and rank perks, `fac.loft.*` flags (incl. the
 * `fac.loft.sysop` string), `w.scene_state`, and the fates of Corvid (sole writer) and Switch.
 *
 * The Loft BBS lives on forum board `'warez'` (members-only; the UI opens it at Loft rep 20 or
 * when a story thread is posted there for you). The board's own system account posts as the
 * label `SYSOP`, so notices read correctly whoever currently holds the chair.
 */
import { defineContent } from '@/engine/registry'
import type { Cond, Effect, SkillCheck } from '@/engine/types'

export const LOFT = 'fac.loft'

/** The Loft board is still running (not dark). */
export const boardLive: Cond = { not: { flag: 'w.scene_state', eq: 'dark' } }

/** Corvid is free to act as herself (not jailed, fled or bought). */
export const corvidAround: Cond = {
  all: [{ npc: 'corvid', fate: ['normal', 'free', 'succeeded', 'vindicated'] }, { not: { flag: 'npc.corvid.bought' } }],
}

/** Corvid's charges from the first raid are still hanging over her (bible CP-B4 fail). */
export const corvidTrialPending: Cond = {
  all: [
    { flag: 'npc.corvid.charged' },
    { not: { flag: 'a2.solidarity' } },
    { not: { flag: 'fac.loft.corvid_cleared' } },
    { npc: 'corvid', fate: 'normal' },
    { not: { flag: 'npc.corvid.bought' } },
  ],
}

/** `available()` filters for the three successor candidates (bible §7.1 q5). */
export const miraAvailable: Cond = {
  npc: 'mira',
  met: true,
  fateNot: ['gone', 'casualty', 'rival', 'flips_you', 'dead', 'missing', 'arrested', 'jailed'],
}
export const deadlineAvailable: Cond = {
  npc: 'deadline',
  met: true,
  fateNot: ['passed', 'dead', 'missing', 'arrested', 'jailed'],
}
/** A sold-out Switch can still take the chair — he just takes it to Aperture (bible §4.6). */
export const switchAvailable: Cond = {
  npc: 'switch',
  met: true,
  fateNot: ['casualty', 'dead', 'missing', 'arrested', 'jailed'],
}

/** Switch's board-successor fate: a backed Switch taking a bleeding board sells it (bible §4.6). */
export const switchTakesBoard: Effect[] = [
  { flag: 'fac.loft.sysop', set: 'switch' },
  {
    if: { any: [{ npc: 'switch', fate: 'sellout' }, { all: [{ flag: 'w.scene_state', eq: 'bleeding' }, { flag: 'fac.loft.side_switch' }] }] },
    then: [{ npc: 'switch', fate: 'sellout' }],
    // He now runs the board: clear any earlier "converted" so the successor fate wins finalization.
    else: [{ clearFlag: 'npc.switch.converted' }, { npc: 'switch', fate: 'new_sysop' }],
  },
]

/** Corvid steps down on her own terms (only if nothing darker already decided her fate). */
export const corvidStepsDownFree: Effect = {
  if: { all: [{ npc: 'corvid', fate: ['normal', 'free'] }, { not: { flag: 'npc.corvid.bought' } }] },
  then: [{ npc: 'corvid', fate: 'free' }],
}

/** The board goes dark: Corvid, if still free, goes with it (bible exile). */
export const boardGoesDark: Effect[] = [
  { flag: 'w.scene_state', set: 'dark' },
  { removeBuff: 'loft_safehouse' },
  {
    if: { all: [{ npc: 'corvid', fate: ['normal', 'free'] }, { not: { flag: 'npc.corvid.bought' } }] },
    then: [{ npc: 'corvid', fate: 'exile' }],
  },
]

/** The Loft's members-only board is open to you and still running. */
export const onTheBoard: Cond = { all: [{ faction: LOFT, gte: 20 }, boardLive] }

/** Corvid's last public words before sentencing (cast bio, PKG-00, quotes them). */
export const CORVID_LAST_POST = 'Keep the lights on. Don\'t sell the building.'

/** Corvid goes to prison: the fate, the headline (PKG-16 owns its deltas), her last post. */
export const corvidSentenced: Effect[] = [
  { npc: 'corvid', fate: 'martyred' },
  { flag: 'fac.loft.corvid_sentenced' },
  { news: 'corvid_trial' },
  { scene: 'loft_corvid_last_post', delayHours: 20 },
]

/** Situational modifiers for every "stay with the Loft" argument in The Enclosure (fac_loft_q3). */
export const enclosureBonuses: NonNullable<SkillCheck['bonuses']> = [
  { if: { var: 'w.itSalary', lte: 0.99 }, add: -2, label: '−2 (the economy is eating the Row)' },
  { if: { flag: 'fac.loft.coop' }, add: 2, label: '+2 (the co-op pays real money)' },
  { if: { flag: 'a2.solidarity' }, add: 2, label: '+2 (they remember the night of the wipe)' },
  { if: { flag: 'fac.loft.side_switch' }, add: -1, label: '−1 (you told the board to get paid)' },
  // PKG-07's "Prove It" fallout: Marlow let the scene know you sat in the booth by the jukebox.
  { if: { flag: 'fac.bureau.outed' }, add: -2, label: '−2 (everyone knows about the booth by the jukebox)' },
]

/** The Inner-rank safehouse buff (bible §3 F1, rep 80: halves incoming heat; 0-day cache). */
export const SAFEHOUSE_BUFF = {
  id: 'loft_safehouse',
  name: 'The Room Above the Pager Shop',
  desc: 'A room on no lease, a cache of tools nobody else has seen yet, and a door the Loft watches for you. Heat from hacking is halved; contract rolls +2.',
  days: 60,
  mods: [
    { key: 'hack.heat' as const, mult: 0.5 },
    { key: 'hack.roll' as const, add: 2 },
  ],
}

/**
 * Every handle the Enclosure lost now works for Aperture (bible §7.1 q3: "returns on the wrong
 * side"). Sibling files and PKG-06 read these flags; this is the Loft's own summary of them.
 */
export const lostToAperture: Cond = {
  any: [{ flag: 'fac.loft.gus_drifted' }, { flag: 'fac.loft.marisol_drifted' }, { flag: 'fac.loft.dawn_drifted' }],
}

// Helpers only; the content lives in the sibling files.
export default defineContent({})
