/**
 * PKG-03 — Act III main, beat 7: `main_a3_q7_the_vote` (bible §6.C).
 *
 * The MNSA goes to the council, and the outcome is COMPUTED on-enter of `a3_vote`. The engine has
 * no arithmetic in conditions, so the continuous terms (`w.public_opinion`, `w.heat_lifetime`) are
 * summed into `a3.votescore` through bucketed `if` gates — the same computed-on-enter technique the
 * bible uses for the finale pool (§0.2). Sign convention: POSITIVE = anti-surveillance = toward the
 * act FAILING. Bands: fail ≥ +20 · gutted −10..+19 · pass ≤ −11. Dee actually swings if she holds
 * the seat.
 *
 * Cross-package ids referenced by exact bible id (owners in parentheses):
 *   flags npc.reyes.testifies (PKG-07), npc.dee.council (PKG-13/15);
 *   news.mnsa_failed / news.mnsa_gutted / news.mnsa_passed / news.dee_swing_vote (PKG-16, which own
 *   the w.heatGain / w.surveillance riders). This quest sets `w.mnsa` itself (the enum-int state).
 *   The "leak bonus" is applied through `a3.whistleblow_prepped` (side_politicians_laptop's own push
 *   already flows in through w.public_opinion), so no unowned "laptop leaked" flag is read.
 */
import { defineContent } from '@/engine/registry'
import type { Effect } from '@/engine/types'

/** Sum every vote term into a3.votescore (positive → the act fails). */
const computeVote: Effect[] = [
  { var: 'a3.votescore', set: 0 },
  // Public opinion (positive = anti-surveillance = toward FAIL), bucketed.
  { if: { var: 'w.public_opinion', gte: 8 }, then: [{ var: 'a3.votescore', add: 8 }] },
  { if: { var: 'w.public_opinion', gte: 18 }, then: [{ var: 'a3.votescore', add: 8 }] },
  { if: { var: 'w.public_opinion', gte: 30 }, then: [{ var: 'a3.votescore', add: 8 }] },
  { if: { var: 'w.public_opinion', gte: 45 }, then: [{ var: 'a3.votescore', add: 6 }] },
  { if: { var: 'w.public_opinion', lte: -8 }, then: [{ var: 'a3.votescore', add: -8 }] },
  { if: { var: 'w.public_opinion', lte: -18 }, then: [{ var: 'a3.votescore', add: -8 }] },
  { if: { var: 'w.public_opinion', lte: -30 }, then: [{ var: 'a3.votescore', add: -8 }] },
  // Discrete terms.
  { if: { faction: 'fac.loft', gte: 50 }, then: [{ var: 'a3.votescore', add: 15 }] },
  { if: { flag: 'a3.whistleblow_prepped' }, then: [{ var: 'a3.votescore', add: 20 }] },
  { if: { flag: 'npc.reyes.testifies' }, then: [{ var: 'a3.votescore', add: 10 }] },
  { if: { flag: 'a3.whistleblow_prepped' }, then: [{ var: 'a3.votescore', add: 10 }] },
  { if: { faction: 'fac.aperture', gte: 50 }, then: [{ var: 'a3.votescore', add: -20 }] },
  { if: { faction: 'fac.halcyon', gte: 50 }, then: [{ var: 'a3.votescore', add: -10 }] },
  // Loudness: lifetime heat pushes toward passage.
  { if: { var: 'w.heat_lifetime', gte: 400 }, then: [{ var: 'a3.votescore', add: -5 }] },
  { if: { var: 'w.heat_lifetime', gte: 800 }, then: [{ var: 'a3.votescore', add: -5 }] },
  { if: { var: 'w.heat_lifetime', gte: 1600 }, then: [{ var: 'a3.votescore', add: -5 }] },
  { if: { var: 'w.heat_lifetime', gte: 3200 }, then: [{ var: 'a3.votescore', add: -5 }] },
  // Dee is the swing vote if she holds the seat.
  { if: { all: [{ flag: 'npc.dee.council' }, { npc: 'dee', affinityGte: 40 }] }, then: [{ var: 'a3.votescore', add: 15 }] },
  { if: { all: [{ flag: 'npc.dee.council' }, { npc: 'dee', affinityLte: 39 }] }, then: [{ var: 'a3.votescore', add: -15 }] },
]

/** Apply the winning band, publish its headline, and fire Dee's swing story on a real deadlock. */
const applyOutcome: Effect[] = [
  {
    if: { var: 'a3.votescore', gte: 20 },
    then: [
      { var: 'w.mnsa', set: 0 },
      { faction: 'fac.bureau', add: -10 },
      { faction: 'fac.aperture', add: -10 },
      { news: 'mnsa_failed' },
    ],
  },
  {
    if: { all: [{ var: 'a3.votescore', gte: -10 }, { var: 'a3.votescore', lte: 19 }] },
    then: [
      { var: 'w.mnsa', set: 2 },
      { news: 'mnsa_gutted' },
      { var: 'w.enclosure', add: 1 },
    ],
  },
  {
    if: { var: 'a3.votescore', lte: -11 },
    then: [
      { var: 'w.mnsa', set: 1 },
      { news: 'mnsa_passed' },
      { var: 'w.enclosure', add: 1 },
    ],
  },
  {
    if: { all: [{ flag: 'npc.dee.council' }, { var: 'a3.votescore', gte: -9 }, { var: 'a3.votescore', lte: 9 }] },
    then: [{ news: 'dee_swing_vote' }],
  },
]

export default defineContent({
  quests: [
    {
      id: 'main_a3_q7_the_vote',
      title: 'The Vote',
      kind: 'main',
      act: 3,
      priority: 30,
      summary:
        'Everything you have done for a decade — every leak, every lobby, every point of heat, every friend you did or did not put on the council — comes due in one show of hands in a room that smells of old carpet.',
      rewards: 'The city, surveilled or spared',
      start: 'wait',
      stages: {
        wait: {
          text: 'The hearings are over. The whip count has been swinging for weeks in the News window. Now the council meets to decide what the city\'s wires are allowed to remember.',
          hint: 'Watch the News for the whip count. Public opinion, a friend on the council, a whistleblower, lobbies and your own noise all move it before the gavel falls.',
          objectives: [
            { id: 'wait', text: 'Wait for the council to vote', when: { day: true, gte: 2050 }, hint: 'The vote lands on its own. Everything that moves it, you already did or didn\'t.' },
          ],
          onComplete: [{ scene: 'a3_vote' }],
          next: 'vote',
        },
        vote: {
          text: 'The council chamber, packed and stale. Somewhere in this room the ballots are already decided by everything that happened outside it.',
          hint: 'Sit through it. The outcome is the sum of your decade.',
          objectives: [
            { id: 'done', text: 'See the vote through', when: { flag: 'a3.vote_resolved' }, hint: 'Follow the scene to the gavel.' },
          ],
          onComplete: [{ quest: 'main_a3_q8_meridian_heist', start: true }],
        },
      },
    },
  ],
  scenes: [
    {
      id: 'a3_vote',
      channel: 'dialog',
      title: 'The Council Vote',
      start: 'chamber',
      nodes: {
        chamber: {
          speaker: 'narrator',
          text: [
            'You get a seat in the back, under a banner about civic pride. The clerk reads Ordinance 04-217 in a monotone that could sand wood. Then the members speak, one after another, each one performing a decision they made in a hallway an hour ago.',
            'You do the arithmetic in your head as they go: who owes whom, who\'s afraid, who read your letter, who read PARALLAX\'s.',
            { if: { flag: 'npc.dee.council' }, text: 'Councilwoman Dolores Briggs sits dead center, potholes-and-library-hours Dee, and the whole room seems to be waiting for her the way a sentence waits for a period.' },
          ],
          effects: computeVote,
          next: 'tally',
        },
        tally: {
          speaker: 'Council Clerk',
          text: [
            '"On Ordinance 04-217, the ayes and nays being called—"',
            { if: { var: 'a3.votescore', gte: 20 }, text: 'The nays have it, and it isn\'t close. The gallery — more of it than you expected — lets out a breath that turns into something like a cheer. The law is dead. For now, the wires get to forget.' },
            { if: { all: [{ var: 'a3.votescore', gte: -10 }, { var: 'a3.votescore', lte: 19 }] }, text: 'It passes — gutted. Amended into a compromise that pleases no one and protects the powerful, which is what compromises are usually for. Some logs, some access, a foot in the door that will only ever open wider.' },
            { if: { var: 'a3.votescore', lte: -11 }, text: 'The ayes have it. Every provider in Port Lumen will keep every log, forever, and hand them over on request. The gavel comes down like a lid. You feel the city get quieter in a way that has nothing to do with sound.' },
            { if: { all: [{ flag: 'npc.dee.council' }, { var: 'a3.votescore', gte: -9 }, { var: 'a3.votescore', lte: 9 }] }, text: 'It comes down to Dee. Deadlocked, six to six, and the chamber turns to her like a compass finding north. She looks, for one second, straight at you.' },
          ],
          effects: applyOutcome,
          next: 'close',
        },
        close: {
          speaker: 'narrator',
          text: [
            { if: { var: 'w.mnsa', eq: 0 }, text: 'Outside, the fog is coming in off the Sound, and for once it feels like cover instead of surveillance. You didn\'t win the city. You won a night. In this decade, a night is a lot.' },
            { if: { var: 'w.mnsa', eq: 2 }, text: 'Outside, the fog is coming in, indifferent as ever. Half a law is still a law. You tell yourself half is better than whole. You are not sure you believe it.' },
            { if: { var: 'w.mnsa', eq: 1 }, text: 'Outside, the fog is coming in, and every streetlight looks a little like a lens now. The handshake sound your modem makes tonight is going to sound, for the first time, exactly like a wiretap.' },
          ],
          effects: [{ flag: 'a3.vote_resolved' }],
        },
      },
    },
  ],
})
