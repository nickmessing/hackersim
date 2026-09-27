/**
 * PKG-02 — a2_loft_who_talked: the crack the failed solidarity wipe left behind (main_a2_q5 CP-B4
 * Corvid fail). REDESIGN_V2 §D: a botched rally isn't just "Corvid charged" — it plants the
 * informant seed as a living suspicion. Three days after the patchy wipe, the board holds its own
 * quiet inquest, and how you steer it decides whether the scene closes ranks or starts eating itself.
 *
 * Reached only after a2.informant_seed (set by the failed rally). Sets:
 *  - a2.scene_closed_ranks   → you talked them down; the seed stays dormant (a good outcome)
 *  - a2.scene_witch_hunt     → you fed the paranoia; the Loft turns on itself (Loft rep, cred)
 *  - a2.informant_is_you_rumor→ you deflected badly and the finger swung to you (heat, Loft rep)
 * All three leave a2.informant_seed intact for fac_bureau/fac_loft later content, per the bible.
 */
import { defineContent } from '@/engine/registry'
import type { SceneDef } from '@/engine/types'

const thread: SceneDef = {
  id: 'a2_loft_who_talked',
  channel: 'forum',
  board: 'warez',
  title: 'the wall had holes. who.',
  from: 'switch',
  pause: false,
  start: 'op',
  nodes: {
    op: {
      speaker: 'switch',
      text: [
        'Let\'s not pretend. In \'94 the wall was solid — forty drives, one night, zero names. Last week it wasn\'t. Corvid\'s facing paper because somewhere in this room, somebody didn\'t wipe, or somebody did worse than not wipe.',
        'I\'m not accusing. I\'m accounting. Those are different jobs and I only do one of them for free. So: who was slow, and who was scared, and are those the same person?',
        '-- Switch · "trust is a line item"',
      ],
      next: 'replies',
    },
    replies: {
      speaker: 'Loft BBS',
      text: [
        'byteme: this is exactly how it starts. this is how \'94 almost went bad before the wipe saved it. we cant do this to each other',
        'deadline: i have watched a scene eat itself from the inside exactly once. i still know all their names. none of them talk to each other. the cops didn\'t do that. THIS did.',
        'Lamplighter: somebody was new-ish. somebody didn\'t know the word. i\'m just saying what everybody\'s typing in private.',
        '[corvid has not posted. corvid is, per the timestamp, reading.]',
      ],
      choices: [
        {
          text: '"Enough. The cops win the second we start hunting each other. Wall up, shut up, move on."',
          tag: '[Close ranks]',
          check: {
            skill: 'social',
            dc: 15,
            bonuses: [
              { if: { faction: 'fac.loft', gte: 30 }, add: 2, label: '+2 (the board listens to you)' },
              { if: { flag: 'a1.diplomat' }, add: 1, label: '+1 (you never picked a side in \'01)' },
            ],
            success: 'closed',
            fail: 'backfire',
            successEffects: [{ flag: 'a2.scene_closed_ranks' }, { faction: 'fac.loft', add: 8 }, { npc: 'corvid', affinity: 4 }, { stat: 'cred', add: 2 }],
            failEffects: [{ flag: 'a2.informant_is_you_rumor' }, { faction: 'fac.loft', add: -8 }, { stat: 'heat', add: 6 }, { stat: 'cred', add: -3 }],
          },
        },
        {
          text: 'Name names. Post who you saw hesitate. Let the scene sort its own.',
          tag: '[Point fingers]',
          effects: [
            { flag: 'a2.scene_witch_hunt' },
            { faction: 'fac.loft', add: -12 },
            { stat: 'cred', add: -2 },
            { npc: 'switch', affinity: 4 },
            { npc: 'corvid', affinity: -4 },
          ],
          goto: 'hunt',
        },
        {
          text: 'Say nothing on the board. Take it to Corvid in person instead.',
          tag: '[Private]',
          effects: [{ flag: 'a2.scene_closed_ranks' }, { npc: 'corvid', affinity: 3 }, { stat: 'stress', add: 3 }],
          goto: 'private',
        },
      ],
    },
    closed: {
      speaker: 'narrator',
      text: [
        'You write the thing the room needs to hear, and — because you\'ve earned enough standing to be heard — the room hears it. The temperature drops. byteme posts a relieved skull. Deadline posts, simply, "good."',
        'Corvid finally breaks her silence with one line, addressed to the whole board and, you suspect, to you specifically: "The wall holds when we decide it holds. Thread closed." The seed of suspicion doesn\'t die — those never do — but it goes back underground, waiting for a worse day.',
      ],
      effects: [{ log: 'You talked the Loft off the ledge. The scene closed ranks instead of eating itself.', kind: 'good' }],
    },
    backfire: {
      speaker: 'narrator',
      text: [
        'You reach for the calming, unifying thing — and it comes out preachy, and someone types the sentence that ends you: "kind of convenient, the newer guy telling everybody not to look for a rat." It catches. It always catches.',
        'By morning the whisper has a shape and the shape has your handle on it. Nobody says it to your face. Everybody reads the same thread. You spend the next month being just slightly too welcome everywhere, which is how the scene tells you it isn\'t sure about you anymore.',
      ],
      effects: [{ log: 'You tried to close ranks and the finger swung to you. The Loft isn\'t sure about you now.', kind: 'bad' }],
    },
    hunt: {
      speaker: 'narrator',
      text: [
        'You post the names. It feels, for one hour, like leadership. Then it feels like what it is. Two of the people you named were just slow; one was just scared; the actual weak link, whoever it was, stays quiet and lets the others burn.',
        'Switch approves, which should worry you and does. Corvid doesn\'t. The board splits into people who post and people who\'ve gone quiet, and the quiet ones are the ones who mattered. You didn\'t catch a rat. You built the maze a rat likes to live in.',
      ],
      effects: [{ log: 'You started a witch hunt in the Loft. It caught no rat and cost the scene its trust.', kind: 'bad' }],
    },
    private: {
      speaker: 'corvid',
      text: [
        'You find Corvid in the back room, alone, wiping down a machine that\'s already clean. She doesn\'t look up. "Smart, keeping it off the board. That thread\'s a gift to whoever\'s actually listening." A pause. "And somebody is."',
        '"I\'ll handle it my way. Quiet. You keep doing what you just did — bringing it to a person instead of a thread. That\'s the difference between us and them, and it\'s the only difference that\'s ever mattered." She finally looks at you. "The seed\'s planted now. Nothing pulls it. We just make sure it doesn\'t get watered."',
      ],
      effects: [{ log: 'You took the informant fear to Corvid privately. She\'ll handle it quiet. The seed stays buried — for now.', kind: 'story' }],
    },
  },
}

export default defineContent({
  scenes: [thread],
})
