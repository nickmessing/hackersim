/**
 * PKG-10 — fate wiring for Dad and Sal (bible §4.2, §4.3, §4.6).
 *
 * This package is the sole writer of `npc.dad.fate` and `npc.sal.fate`. Other packages only set
 * steering flags (`npc.dad.mill_job` from life_dads_resume, `npc.dad.dating` from
 * side_dads_profile, `npc.sal.base` from the Act IV Jax reckoning). Fates are written as the story
 * makes them true, then finalized once when Act IV opens so the reckonings read settled values.
 * PKG-04's table keeps any legal fate already written here.
 *
 * Dad's ordered rules (§4.6): mill job → mill_ghost · Dad's Comeback done → retrained · dating →
 * dating_again · neglected while Mom is gone → spiral · else normal. "Neglected" means low
 * affinity, and the Act III warning below gives the player a real chance to pull him back first.
 * Failing the [Social] intervention starts `fac_hood_dad_lamplighter` (lamplighter.ts): the 2 a.m.
 * ER call, the bill, and one last chance to reach him in the waiting room.
 *
 * Sal's rules: took_a_fall is terminal (written by Coming Home) · Cathode closed → diner_closed ·
 * back room is your base → base · else anchor.
 */
import { defineContent } from '@/engine/registry'
import type { Cond, Effect } from '@/engine/types'
import { CATHODE_CLOSED, CATHODE_OPEN, DAD_RETRAINED, KIM_CLOSE, MOM_GONE, SAL_AROUND } from './shared'

const dadNeglected: Cond = {
  all: [
    { not: { flag: 'npc.dad.pulled_back' } },
    { any: [{ npc: 'dad', affinityLte: 15 }, { all: [{ flag: 'npc.dad.brushed_off' }, { npc: 'dad', affinityLte: 30 }] }] },
  ],
}

const finalizeDad: Effect = {
  if: { flag: 'npc.dad.mill_job' },
  then: [{ npc: 'dad', fate: 'mill_ghost' }],
  else: [
    {
      if: DAD_RETRAINED,
      then: [{ npc: 'dad', fate: 'retrained' }],
      else: [
        {
          if: { flag: 'npc.dad.dating' },
          then: [{ npc: 'dad', fate: 'dating_again' }],
          else: [
            {
              if: { all: [MOM_GONE, dadNeglected] },
              then: [{ npc: 'dad', fate: 'spiral' }],
              else: [{ npc: 'dad', fate: 'normal' }],
            },
          ],
        },
      ],
    },
  ],
}

const finalizeSal: Effect = {
  if: { npc: 'sal', fate: 'took_a_fall' },
  then: [],
  else: [
    {
      if: CATHODE_CLOSED,
      then: [{ npc: 'sal', fate: 'diner_closed' }],
      else: [
        {
          if: { flag: 'npc.sal.base' },
          then: [{ npc: 'sal', fate: 'base' }],
          else: [{ npc: 'sal', fate: 'anchor' }],
        },
      ],
    },
  ],
}

/** The Act III warning: Mom is gone, Dad is drifting, and nobody has noticed but the Row. */
const dadAdrift: Cond = {
  all: [
    { var: 'act', gte: 3 },
    MOM_GONE,
    { npc: 'dad', affinityLte: 20 },
    { not: { flag: 'npc.dad.mill_job' } },
    { not: { flag: 'npc.dad.dating' } },
    { not: { flag: 'npc.dad.pulled_back' } },
    { not: DAD_RETRAINED },
  ],
}

export default defineContent({
  triggers: [
    {
      id: 'trig_hood_dad_mill_ghost',
      when: { flag: 'npc.dad.mill_job' },
      effects: [{ npc: 'dad', fate: 'mill_ghost' }],
    },
    {
      id: 'trig_hood_dad_dating',
      when: { all: [{ flag: 'npc.dad.dating' }, { npc: 'dad', fate: ['normal', 'spiral'] }] },
      effects: [{ npc: 'dad', fate: 'dating_again' }],
    },
    {
      id: 'trig_hood_dad_adrift',
      when: dadAdrift,
      atHour: 22,
      effects: [
        {
          if: { all: [CATHODE_OPEN, SAL_AROUND] },
          then: [{ scene: 'hood_sal_about_dad' }],
          else: [{ if: KIM_CLOSE, then: [{ scene: 'hood_kim_about_dad' }] }],
        },
      ],
    },
    {
      // Runs right after the Act IV gate opens (default priority is 100).
      id: 'trig_hood_fates_final',
      when: { var: 'act', gte: 4 },
      priority: 110,
      effects: [finalizeDad, finalizeSal],
    },
  ],

  scenes: [
    {
      id: 'hood_sal_about_dad',
      channel: 'chat',
      title: 'SAL',
      from: 'sal',
      expiresDays: 2,
      onExpire: [{ npc: 'dad', affinity: -2 }],
      start: 'ping',
      nodes: {
        ping: {
          text: [
            'KID ITS SAL',
            'YOUR OLD MAN. HES BEEN AT MY COUNTER EVERY NIGHT THIS WEEK',
            'COFFEE THEN MORE COFFEE THEN WHEN I CLOSE HE WALKS OVER TO THE LAMPLIGHTER ON 5TH. I KNOW BECAUSE I WATCH HIM TO THE CORNER',
            'HE DONT EAT. I PUT PIE IN FRONT OF HIM AND HE LOOKS AT IT LIKE ITS A PHOTOGRAPH',
          ],
          choices: [
            { text: 'on my way', effects: [{ scene: 'hood_dad_counter' }], goto: 'coming' },
            { text: 'ill call him tomorrow', effects: [{ npc: 'dad', affinity: -1 }], goto: 'tomorrow' },
          ],
        },
        coming: { text: 'GOOD. HES IN THE BACK BOOTH. ILL PUT A FRESH POT ON' },
        tomorrow: { text: 'TOMORROW. SURE. HELL BE HERE TOMORROW TOO. THATS WHAT IM TELLING YOU' },
      },
    },
    {
      id: 'hood_kim_about_dad',
      channel: 'chat',
      title: 'dad',
      from: 'kim',
      expiresDays: 2,
      onExpire: [{ npc: 'dad', affinity: -2 }],
      start: 'ping',
      nodes: {
        ping: {
          text: [
            'u need to come home',
            'not like an emergency. like a slow one',
            'dad sits on the front steps every night with a paper bag. he says its "just the one"',
            'its never the one',
          ],
          choices: [
            { text: 'coming now', effects: [{ scene: 'hood_dad_counter' }], goto: 'coming' },
            { text: 'this weekend. promise', effects: [{ npc: 'kim', affinity: -2 }, { npc: 'dad', affinity: -1 }], goto: 'weekend' },
          ],
        },
        coming: { text: 'ok. hes on the steps. dont make it a thing. just sit' },
        weekend: { text: 'u always say weekend' },
      },
    },
    {
      id: 'hood_dad_counter',
      channel: 'dialog',
      title: 'Your Father',
      start: 'find',
      nodes: {
        find: {
          speaker: 'narrator',
          text: [
            {
              if: { all: [CATHODE_OPEN, SAL_AROUND] },
              text: 'The Cathode at ten at night: two cab drivers, a nurse coming off shift, and your father in the back booth with a cup of coffee he stopped drinking an hour ago. Sal catches your eye from behind the counter and goes back to wiping the same clean spot.',
              else: 'The front steps of your parents\' building, under the one streetlight on the block that still works. Your father sits on the second step with a paper bag folded neatly around a bottle, the way he used to fold his lunch.',
            },
            'He looks up when you sit down. He doesn\'t look surprised. He looks like a man who has been waiting a long time for a bus and has stopped believing in buses.',
          ],
          next: 'dad',
        },
        dad: {
          speaker: 'dad',
          text: [
            '"Kid."',
            '"Your mother would know what to say right now. She always knew what to say. I only ever knew what to fix." He turns the cup a quarter turn on its saucer. "And there\'s nothing here to fix."',
          ],
          choices: [
            {
              text: '"The kitchen tap\'s been dripping for a month, Dad. Show me how to fix it. Tonight."',
              effects: [{ npc: 'dad', affinity: 10 }, { flag: 'npc.dad.pulled_back' }],
              goto: 'tap',
            },
            {
              text: '"Tell me something about her. Something I don\'t know."',
              effects: [{ npc: 'dad', affinity: 7 }, { flag: 'npc.dad.pulled_back' }, { stat: 'mood', add: -4 }],
              goto: 'story',
            },
            {
              text: '"The bottle goes in the sink tonight. I\'ll pour. You watch."',
              check: {
                skill: 'social',
                dc: 15,
                bonuses: [
                  { if: { trait: 'empath' }, add: 2, label: 'Empath' },
                  { if: { npc: 'dad', affinityGte: 15 }, add: 1, label: 'He still listens to you' },
                ],
                success: 'sink',
                fail: 'not_tonight',
                successEffects: [{ npc: 'dad', affinity: 8 }, { flag: 'npc.dad.pulled_back' }],
                failEffects: [
                  { npc: 'dad', affinity: -3 },
                  { flag: 'npc.dad.sink_refused' },
                  { stat: 'mood', add: -5 },
                  { quest: 'fac_hood_dad_lamplighter', start: true },
                ],
              },
            },
            {
              text: 'Sit with him. Don\'t say anything at all.',
              effects: [{ npc: 'dad', affinity: 5 }],
              goto: 'sit',
            },
          ],
        },
        tap: {
          speaker: 'narrator',
          text: [
            'The washer is shot. Of course it is. He finds a replacement in a coffee can of washers that has followed him through three apartments and one marriage, and he talks you through it without once touching the wrench himself.',
            '"Righty-tighty," he says, "and not a quarter turn more, or you strip it and then you\'re in real trouble." You do not strip it.',
            'At two in the morning the tap stops dripping. You both stand there and listen to it not drip. "Long as one of us can fix something," he says, and his voice goes, and then comes back.',
          ],
        },
        story: {
          speaker: 'dad',
          text: [
            '"The cannery dance. Nineteen seventy-eight. The band was terrible and she walked up to the bandleader in the middle of a song and told him he was playing it too fast."',
            '"He slowed down. Everybody slowed down. I asked her to dance because I figured anybody who could slow down a whole room could probably slow me down too."',
            'He laughs, a real one, rusty from disuse. "She did. God, she did. Thirty years I never once got anywhere on time."',
            '"Thank you for asking, kid. Nobody asks. They think it hurts. It does. It hurts worse when nobody asks."',
          ],
        },
        sink: {
          speaker: 'narrator',
          text: [
            'He looks at you for a long time. Then he hands you the bag without a word.',
            'It goes down the drain with a sound like a long sigh. He watches all of it. When it\'s done he rinses the sink out, carefully, because your mother hated a sticky sink, and dries his hands on the dish towel, and says, "Pork chops Sunday. Bring your sister."',
          ],
        },
        not_tonight: {
          speaker: 'dad',
          text: [
            '"Don\'t." It comes out sharp, sharper than you\'ve ever heard him. "Don\'t come here after a year and tell me what goes in the sink."',
            'Then, quieter, looking at his hands: "Not tonight, kid. Tonight I just want to sit."',
            'You sit. When it gets late you walk him home, and he lets you, and at the door he pats your shoulder twice without looking at you, the way men of his generation say everything they can\'t.',
            'The next night, Sal tells you later, he walked straight past the Cathode to the Lamplighter on Fifth, and stayed until they put the chairs up.',
          ],
        },
        sit: {
          speaker: 'narrator',
          text: [
            'You sit. Nobody says anything. A bus goes by, and then another one, and neither of you gets on.',
            'After an hour he says, "You should get some sleep," and you say, "So should you," and it is the most you have said to each other since the funeral. It isn\'t enough. It isn\'t nothing.',
          ],
        },
      },
    },
  ],
})
