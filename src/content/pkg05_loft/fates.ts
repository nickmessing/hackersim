/**
 * PKG-05 — Corvid's and Switch's fates outside the big quest scenes (bible §4.1, §4.4, §4.6, §13).
 *
 * PKG-05 is the sole writer of `npc.corvid.fate` and `npc.switch.fate`. The quest scenes decide
 * most of it (q3 sets Switch's road, q5 decides Corvid martyred/free and the chair, q6 lifts her to
 * `vindicated`). This file closes the remaining gaps so no epilogue ever reads an unset value:
 *  - Aperture's broker choice (PKG-06) sets only the flag `npc.corvid.bought`; the fate follows here.
 *  - A charged Corvid whose Sysop Question never came (Loft rep never reached 50) is sentenced when
 *    Act IV opens — nobody fought for her, which is exactly the bible's `martyred` condition.
 *  - Everyone still on a default fate at Act IV gets their settled one (Corvid `free`, Switch by road).
 *  - `loft_switch_discarded`: Aperture uses Switch and drops him; one pager conversation decides
 *    whether he comes home (`converted`) or stays gone (`casualty`).
 *  - `loft_corvid_last_post`: her two-line goodbye on the board, whenever she is sentenced.
 */
import { defineContent } from '@/engine/registry'
import type { Effect, SceneDef } from '@/engine/types'
import { CORVID_LAST_POST, LOFT, corvidSentenced, corvidTrialPending } from './common'

const switchHome: Effect[] = [
  { flag: 'npc.switch.converted' },
  { npc: 'switch', fate: 'converted', affinity: 10 },
  { faction: LOFT, add: 4 },
  { flag: 'fac.loft.switch_call_done' },
]

const switchGone: Effect[] = [{ npc: 'switch', fate: 'casualty' }, { flag: 'fac.loft.switch_call_done' }]

const scenes: SceneDef[] = [
  // ── Switch, after Aperture is done with him ────────────────────────────────
  {
    id: 'loft_switch_discarded',
    channel: 'chat',
    title: 'Switch',
    from: 'switch',
    start: 'open',
    expiresDays: 5,
    onExpire: [...switchGone, { log: 'You never answered Switch. He stopped paging after the third day.', kind: 'story' }],
    nodes: {
      open: {
        text: [
          'hey. you up',
          {
            if: { flag: 'fac.loft.side_switch' },
            text: 'so funny story. turns out aperture didn\'t want me. they wanted the board. and the board didn\'t come with me, because you kept it together, which, great, good for the board',
            else: 'so funny story. i went over. alone, since nobody backed the "get paid" plan. they loved me for about six weeks. long enough to copy my contact list',
          },
          'they walked me out today. security guy carried my box. there was a plant in it. i don\'t even own a plant. it was THEIR plant. i stole a plant from aperture on my way out, that\'s my whole severance',
        ],
        choices: [
          { text: 'are you ok?', goto: 'ok' },
          { text: 'i told you they buy the list, not the people', effects: [{ npc: 'switch', affinity: -3 }], goto: 'told_you' },
          { text: 'what\'s the plant', goto: 'plant' },
        ],
      },
      plant: {
        text: 'ficus i think. it\'s very corporate. it has a little laminated tag that says ASSET #40031. i\'m going to name it Kevin From HR',
        next: 'ok',
      },
      told_you: {
        text: 'yeah. corvid said that too. everybody said that. i\'m the guy who had to find out by carrying a box to the parking lot',
        next: 'ok',
      },
      ok: {
        text: [
          'no. yes. i don\'t know. i was so sure i was the only one in that room who could add',
          'thing is i can\'t really come back, can i. you can\'t sell the rate card and then sit on the couch like it didn\'t happen',
        ],
        choices: [
          {
            tag: '[Social DC 15]',
            text: 'come home, ray. the couch is structural. it\'s held worse people than you',
            check: {
              skill: 'social',
              dc: 15,
              bonuses: [
                { if: { npc: 'switch', affinityGte: 40 }, add: 2, label: '+2 (he actually likes you)' },
                { if: { flag: 'npc.switch.courted' }, add: 1, label: '+1 (you stood with him once)' },
                { if: { flag: 'fac.loft.side_switch' }, add: 1, label: '+1 (you backed his plan)' },
              ],
              success: 'home',
              fail: 'not_home',
              successEffects: switchHome,
              failEffects: [...switchGone, { flag: 'fac.loft.switch_turned_away' }, { stat: 'mood', add: -3 }],
            },
          },
          {
            tag: '[Business DC 16]',
            text: 'the board needs someone who can add. that part of your pitch was right. come back and do the books, not the list',
            check: {
              skill: 'business',
              dc: 16,
              bonuses: [
                { if: { flag: 'fac.loft.coop' }, add: 2, label: '+2 (the co-op is real and needs a treasurer)' },
                { if: { trait: 'pkg05_loft_miracle_arrow' }, add: -2, label: '−2 (he remembers your arrow)' },
              ],
              success: 'home',
              fail: 'not_home',
              successEffects: switchHome,
              failEffects: [...switchGone, { flag: 'fac.loft.switch_turned_away' }, { stat: 'mood', add: -3 }],
            },
          },
          {
            text: 'you made your bed. good luck with the ficus',
            effects: [...switchGone, { npc: 'switch', affinity: -8 }],
            goto: 'bed',
          },
        ],
      },
      home: {
        text: [
          '...',
          'ok. ok. i\'ll come by thursday. i\'ll bring donuts. i\'ll bring the MAPLE one and i will give it to someone else, publicly, as penance',
          'and kevin from hr. he lives on the couch now. that\'s non-negotiable',
        ],
      },
      not_home: {
        text: [
          'nah. you\'re sweet. but everyone on that board would look at me like i was wearing a lanyard',
          'there\'s a shop in ridgeport that wants a guy who can add. i\'ll be fine. i\'m always fine. tell corvid she was right, and then tell her i said it under protest',
          'oh and. if the board ever comes back, don\'t tell me. i\'ll just look anyway. i\'m going to take kevin from hr with me. he\'s the only one who never asked me for anything',
        ],
      },
      bed: {
        text: 'yeah. i did. night.',
      },
    },
  },

  // ── Corvid's last post before sentencing ────────────────────────────────────
  {
    id: 'loft_corvid_last_post',
    channel: 'forum',
    board: 'warez',
    title: 'two lines',
    from: 'corvid',
    start: 'c1',
    nodes: {
      c1: {
        speaker: 'corvid',
        text: [CORVID_LAST_POST, '-- Corvid :: sysop emerita :: keep the commons'],
        next: 'c2',
      },
      c2: {
        speaker: 'byteme',
        text: 'i dont have anything smart to say. i just want it on the record that she was the first person on this board who didnt laugh at my ascii art. she said it had "structural ambition". i think about that a lot',
        next: 'c3',
      },
      c3: {
        speaker: 'deadline',
        text: [
          'Fourteen months felt like fourteen years. Eight years is going to feel like eight years, because she\'ll make it. She\'ll organize the library by threat level. She\'ll have the guards backing up their lives.',
          'Write to her. Paper. The kind they can read first. She knows they read it. That\'s the point — let them read what a scene sounds like.',
          {
            if: { obligation: 'pkg05_loft_defense_debt' },
            text: 'And one of you signed for her lawyer when the jar ran out, and is still paying him by the week. You know who you are. So do I. The jar is back on the pager-shop counter. Fill it.',
          },
        ],
        next: 'c3b',
      },
      c3b: {
        speaker: 'byteme',
        text: [
          {
            if: { flag: 'fac.loft.testified' },
            text: 'also whoever took the stand for her. you were SO cool. the prosecutor was so mean. i printed the whole transcript and put it up in the back room so everyone can read what you said',
            else: 'i am going to write her a letter every week. i am going to put ascii art in every one. she cannot stop me from inside',
          },
        ],
        next: 'c3c',
      },
      c3c: {
        speaker: 'deadline',
        text: [
          {
            if: { flag: 'fac.loft.testified' },
            text: 'Kevin. The transcript has their legal name on the first page. Take it down. Take it down and shred it and then shred the shreds. Some of us already did time for being on paper.',
            else: 'Kevin, the guards read every one. Make the ASCII art good. Make them want to read the next one.',
          },
        ],
        next: 'c4',
      },
      c4: {
        speaker: 'narrator',
        text: 'The thread fills up for three days. Nobody argues on it. For this board, that is the loudest thing anyone has ever said.',
        choices: [
          {
            tag: '[Accept the hat]',
            text: 'Swallow your pride. Let the jar on the counter pay the lawyer.',
            if: { obligation: 'pkg05_loft_defense_debt' },
            effects: [{ removeObligation: 'pkg05_loft_defense_debt' }, { faction: LOFT, add: 2 }, { stat: 'mood', add: 4 }, { flag: 'fac.loft.letters' }],
            goto: 'r_hat',
          },
          {
            text: 'Post: "Lights stay on. Building stays ours. Writing to her Sunday — add your name to the letter."',
            effects: [{ faction: LOFT, add: 2 }, { npc: 'corvid', affinity: 4 }, { flag: 'fac.loft.letters' }],
            goto: 'r_letter',
          },
          {
            text: 'Post nothing. Print the thread out instead, and mail it to her, all eleven pages.',
            effects: [{ npc: 'corvid', affinity: 6 }, { flag: 'fac.loft.letters' }],
            goto: 'r_print',
          },
          {
            tag: '[Leave]',
            text: 'Close the window. You can\'t, yet.',
            effects: [{ stat: 'stress', add: 4 }],
          },
        ],
      },
      r_letter: {
        speaker: 'byteme',
        text: 'adding my name. adding it in ascii. she will appreciate it structurally',
      },
      r_hat: {
        speaker: 'deadline',
        text: 'Jar\'s full by Friday. Somebody put in a money order for exactly $400 with no name on it. I have a theory. I will die with my theory. Keep the lights on, and let people carry you once in a while — that\'s also the commons.',
      },
      r_print: {
        speaker: 'narrator',
        text: 'The reply comes six weeks later on lined paper, in handwriting like a circuit diagram: "Received. All eleven pages. Kevin still can\'t spell \'structural\'. Keep the lights on. — C."',
      },
    },
  },
]

export default defineContent({
  scenes,
  triggers: [
    // Aperture's broker choice (PKG-06) flipped her; the fate follows the flag.
    {
      id: 'trig_loft_corvid_bought',
      when: { all: [{ flag: 'npc.corvid.bought' }, { npc: 'corvid', fateNot: ['bought', 'martyred', 'exile'] }] },
      effects: [
        { npc: 'corvid', fate: 'bought' },
        { log: 'Corvid has stopped posting. Nobody on the board says the word "Aperture" out loud. They just stop using her name.', kind: 'story' },
      ],
    },
    // Nobody fought for her: the trial runs its course without a Sysop Question.
    {
      id: 'trig_loft_corvid_verdict',
      when: {
        all: [
          { var: 'act', gte: 4 },
          corvidTrialPending,
          { quest: 'fac_loft_q5_sysop', status: 'inactive' },
        ],
      },
      effects: corvidSentenced,
    },
    // Act IV: whoever is still on a default fate gets their settled one.
    {
      id: 'trig_loft_fates_settle',
      when: { var: 'act', gte: 4 },
      priority: 50,
      effects: [
        {
          if: { all: [{ npc: 'corvid', fate: 'normal' }, { not: corvidTrialPending }, { not: { flag: 'npc.corvid.bought' } }] },
          then: [{ if: { flag: 'w.scene_state', eq: 'dark' }, then: [{ npc: 'corvid', fate: 'exile' }], else: [{ npc: 'corvid', fate: 'free' }] }],
        },
        {
          if: { npc: 'switch', fate: 'normal' },
          then: [
            {
              if: { all: [{ flag: 'fac.loft.side_switch' }, { flag: 'w.scene_state', eq: 'bleeding' }] },
              then: [{ npc: 'switch', fate: 'sellout' }],
              else: [
                {
                  if: { all: [{ flag: 'fac.loft.side_switch' }, { flag: 'w.scene_state', eq: 'dark' }] },
                  then: [{ npc: 'switch', fate: 'casualty' }],
                  else: [{ flag: 'npc.switch.converted' }, { npc: 'switch', fate: 'converted' }],
                },
              ],
            },
          ],
        },
      ],
    },
  ],
})
