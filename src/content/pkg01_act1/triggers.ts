/**
 * PKG-01 — the Act I gating machinery (bible §5.1, §9.0).
 *
 *  trig_a1_two_side_done — sets `a1.two_side_done` once two Act I side quests are finished (the
 *      engine has no counting condition, so "any two of nine" is written as the set of pairs).
 *  trig_a1_gate_pair     — sets `a1.gate_pair` once at least three of the four Act I→II roads are open
 *      (any-skill 25 / CompCastle L4 or Loft Known / two side quests / $3,000).
 *  trig_act2_gate        — the ONLY writer of `act` to 2. When Act I's story is done, the calendar
 *      has reached late April 2002, and the road pair is open, it turns the act and opens Act II.
 *
 * Cross-package reads: the nine Act I side quests (PKG-11/12/13) and `main_a2_q0a_settling_in`
 * (PKG-02, the Act II opener) — all referenced by exact bible id.
 */
import { defineContent } from '@/engine/registry'
import type { Cond, TriggerDef } from '@/engine/types'
import { ACT1_SIDES, inAct1, twoRoads } from './common'

/** Every unordered pair of "these two Act I side quests are both completed". */
const sidePairs: Cond[] = ACT1_SIDES.flatMap((a, i) =>
  ACT1_SIDES.slice(i + 1).map(
    (b): Cond => ({ all: [{ quest: a, status: 'completed' }, { quest: b, status: 'completed' }] }),
  ),
)

const twoSidesDone: TriggerDef = {
  id: 'trig_a1_two_side_done',
  once: true,
  priority: 20,
  when: { any: sidePairs },
  effects: [{ flag: 'a1.two_side_done' }],
}

const gatePair: TriggerDef = {
  id: 'trig_a1_gate_pair',
  once: true,
  priority: 21,
  when: twoRoads,
  effects: [{ flag: 'a1.gate_pair' }],
}

const act2Gate: TriggerDef = {
  id: 'trig_act2_gate',
  once: true,
  priority: 22,
  when: {
    all: [inAct1, { flag: 'a1.grandma_done' }, { day: true, gte: 240 }, { flag: 'a1.gate_pair' }],
  },
  effects: [
    { var: 'act', set: 2 },
    { quest: 'main_a2_q0a_settling_in', start: true },
    { notify: 'ACT II — "Everyone’s Getting Paid." The dot-com money is real now, and so is everything that comes with it.', kind: 'story' },
  ],
}

export default defineContent({
  triggers: [twoSidesDone, gatePair, act2Gate],
})
