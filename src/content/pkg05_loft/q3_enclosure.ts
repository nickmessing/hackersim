/**
 * PKG-05 — fac_loft_q3_enclosure, "The Enclosure" (bible §7.1 step 3).
 *
 * Aperture is hiring the scene one handle at a time. Three Loft regulars are wavering. You get one
 * night of pager calls to talk each of them into staying — a [Social] check per member, harder
 * while the economy is eating the Row (`w.itSalary < 1`). A member you fail drifts to Aperture and
 * comes back later on the wrong side (a flag Act III side content reads).
 *
 * Keep two of three and the board stays vibrant (`fac.loft.intact`, `w.scene_state='vibrant'`);
 * lose two and it bleeds (`fac.loft.bleeding`, `w.scene_state='bleeding'`).
 *
 * A member you *fail* to persuade (rather than let go) leaves hurt: Marisol takes the board's
 * unpaid upkeep with her (`fac.loft.marisol_stung`, read by the Sysop contest and PKG-06's rescue),
 * Dawn leaves with something to prove (`fac.loft.dawn_stung`, read by the Hospital Job and the
 * relaunch). GreyHat_Gus only ever drifts on a failed pitch, so his drift is already the scar.
 *
 * The three regulars are invented handles (label speakers, never NPCs), so this beat writes no
 * fate it doesn't own.
 */
import { defineContent } from '@/engine/registry'
import type { Effect, SceneDef } from '@/engine/types'
import { LOFT, boardLive, enclosureBonuses } from './common'

const kept: Effect = { var: 'fac.loft.kept', add: 1 }

const scenes: SceneDef[] = [
  {
    id: 'loft_q3_enclosure',
    channel: 'dialog',
    title: 'The Enclosure — One Night on the Pager',
    from: 'corvid',
    start: 'open',
    nodes: {
      open: {
        speaker: 'corvid',
        text: [
          'Corvid pages you at nine and it isn\'t a test this time; you can tell because she doesn\'t start with a joke.',
          '"Three of ours got the Aperture letter tonight. Good money, clean desk, dental. GreyHat_Gus, Modem_Marisol, DialUpDawn. They\'re on the fence and the fence has a fountain on the other side."',
          {
            if: { flag: 'fac.loft.coop' },
            text: '"Tell them about the co-op. Tell them we pay now. Tell them the truth: it\'s smaller money and it\'s theirs."',
            else: '"I can\'t buy them. You know I can\'t buy them. All you\'ve got is that they like you and the truth. Go."',
          },
          {
            if: { var: 'w.itSalary', lte: 0.99 },
            text: '"And I know. Rent\'s up, work\'s down, everyone\'s scared. It\'s a bad night to ask anyone to stay poor on principle. Ask anyway."',
          },
          { if: { flag: 'fac.loft.coop_botched' }, text: '"And whatever you do tonight, don\'t draw anybody an arrow."' },
          { if: { flag: 'fac.bureau.outed' }, text: '"They know about the booth by the jukebox. All three of them. They\'ll ask. Don\'t lie to them about it — they\'ll forgive a lot tonight, but not that."' },
        ],
        effects: [{ var: 'fac.loft.kept', set: 0 }],
        next: 'gus_intro',
      },

      // ── GreyHat_Gus ──────────────────────────────────────────────────────
      gus_intro: {
        speaker: 'GreyHat_Gus',
        text: '"hey. yeah. i took the meeting. the fountain\'s real, the offer\'s real. i\'m 34, man. i can\'t crack games in a back room til i die. give me one reason that pays my kid\'s dentist and i\'ll stay."',
        choices: [
          {
            tag: '[Social DC 14]',
            text: '"The co-op pays. Not fountain money, but real money, and nobody at Aperture ever owns your name. Stay and get paid on your own board."',
            if: { flag: 'fac.loft.coop' },
            check: {
              skill: 'social',
              dc: 14,
              bonuses: enclosureBonuses,
              success: 'gus_stay',
              fail: 'gus_go',
            },
          },
          {
            tag: '[Social DC 16]',
            text: '"Aperture doesn\'t hire crackers. It hires informants who used to be crackers. The day the dentist bill is due, they\'ll ask you for a name, and it\'ll be one of ours."',
            check: {
              skill: 'social',
              dc: 16,
              bonuses: enclosureBonuses,
              success: 'gus_stay',
              fail: 'gus_go',
            },
          },
          {
            tag: '[Business DC 15]',
            text: '"Take the job. Take their money. And keep one foot here where it\'s warm. I\'m not going to tell you to stay poor for a principle."',
            check: {
              skill: 'business',
              dc: 15,
              bonuses: enclosureBonuses,
              success: 'gus_hedge',
              fail: 'gus_go',
            },
          },
          {
            text: '"Take the job, Gus. Your kid needs a dentist more than the scene needs you. Go with my blessing." (Let him go clean.)',
            effects: [{ flag: 'fac.loft.gus_blessed' }],
            goto: 'gus_bless',
          },
        ],
      },
      gus_stay: {
        speaker: 'GreyHat_Gus',
        text: '"...yeah. yeah, okay. you\'re right and i hate that you\'re right. i\'ll tell them the kid\'s allergic to fountains. thanks. seriously." He stays.',
        effects: [kept, { faction: LOFT, add: 2 }],
        next: 'marisol_intro',
      },
      gus_hedge: {
        speaker: 'GreyHat_Gus',
        text: '"one foot in, one foot warm. i can do that. i\'ll keep my mouth shut over there and my handle over here." Not a win. Not a loss. He stays, quietly.',
        effects: [kept, { flag: 'fac.loft.gus_double' }],
        next: 'marisol_intro',
      },
      gus_bless: {
        speaker: 'GreyHat_Gus',
        text: '"...you\'re the only one who said the kid part out loud." He\'s gone by morning, but he\'s gone as a friend. He mails you a photo of the kid\'s new braces two months later. Doesn\'t count as kept. Counts as something.',
        next: 'marisol_intro',
      },
      gus_go: {
        speaker: 'narrator',
        text: 'You try. He wanted to be talked out of it and you gave him the wrong reason, or the right reason too late. "It\'s just a job," he says, which is what people say when it isn\'t. GreyHat_Gus takes the desk with the fountain. You\'ll hear his handle again, on the other side of a door.',
        effects: [{ flag: 'fac.loft.gus_drifted' }, { var: 'fac.loft.enclosure_lost', add: 1 }, { stat: 'mood', add: -3 }, { npc: 'corvid', affinity: -1 }],
        next: 'marisol_intro',
      },

      // ── Modem_Marisol ────────────────────────────────────────────────────
      marisol_intro: {
        speaker: 'Modem_Marisol',
        text: '"i\'m not scared of the money, i\'m tired. i\'ve been the girl who fixes it for free since i was nineteen. Aperture said the word \'salary\' and i cried a little, don\'t tell anyone. why should i stay?"',
        choices: [
          {
            tag: '[Social DC 15]',
            text: '"Because here you\'re Marisol who fixes it. There you\'re a cost center with a badge. Tired is real. Erased is worse."',
            check: {
              skill: 'social',
              dc: 15,
              bonuses: enclosureBonuses,
              success: 'marisol_stay',
              fail: 'marisol_lost',
            },
          },
          {
            tag: '[Social DC 17]',
            text: 'The empath\'s route: don\'t argue, just listen, and let her hear herself decide.',
            if: { trait: 'empath' },
            check: {
              skill: 'social',
              dc: 17,
              bonuses: [...enclosureBonuses, { if: { trait: 'empath' }, add: 3, label: '+3 (you actually hear her)' }],
              success: 'marisol_stay',
              fail: 'marisol_lost',
            },
          },
          {
            tag: '[Business DC 14]',
            text: '"You\'re tired because you do it for free. Take the co-op\'s cut. Get paid and stay yours."',
            if: { flag: 'fac.loft.coop' },
            check: {
              skill: 'business',
              dc: 14,
              bonuses: enclosureBonuses,
              success: 'marisol_stay',
              fail: 'marisol_lost',
            },
          },
          {
            text: '"Honestly? You sound like you should go. Rest. I mean it." (Let her go.)',
            goto: 'marisol_go',
          },
        ],
      },
      marisol_stay: {
        speaker: 'Modem_Marisol',
        text: '"...okay. one more year of being Marisol who fixes it. but i\'m billing the co-op for tonight, and for making me cry." She stays, and she does bill you. Fairly.',
        effects: [kept, { faction: LOFT, add: 2 }],
        next: 'dawn_intro',
      },
      marisol_lost: {
        speaker: 'Modem_Marisol',
        text: [
          '"...wow." A long pause, full of modem hiss. "you too, huh. i tell you i\'m tired of fixing things for free, and you call me at eleven at night to ask me to fix the board. for free. with feelings."',
          '"no, it\'s fine. it\'s fine. that\'s the whole problem, it\'s always fine." She isn\'t crying now. That\'s worse. "you know what the aperture recruiter did? she asked me what i wanted. nobody on this board ever asked me that. not even tonight."',
        ],
        effects: [{ flag: 'fac.loft.marisol_stung' }, { faction: LOFT, add: -2 }, { npc: 'corvid', affinity: -1 }],
        next: 'marisol_go',
      },
      marisol_go: {
        speaker: 'narrator',
        text: [
          {
            if: { flag: 'fac.loft.marisol_stung' },
            text: 'She hangs up without saying goodbye, which in eight years she has never once done. Modem_Marisol logs off the board for the last time. Her unpaid fixes — the login script, the backup job, the thing with the modem pool that nobody else understands — keep running for about three weeks, and then, one by one, quietly, they stop. Aperture gives her a chair that doesn\'t squeak, and a helpdesk to run, and a bonus the first month.',
            else: 'She goes. Not angry — relieved, which is somehow harder to watch. "It\'s okay to be tired," she tells you, giving you permission you didn\'t ask for. Modem_Marisol logs off the board for the last time. Aperture gives her a chair that doesn\'t squeak, and a helpdesk to run, and the next time you see her work it will be keeping their lights on.',
          },
        ],
        effects: [{ flag: 'fac.loft.marisol_drifted' }, { var: 'fac.loft.enclosure_lost', add: 1 }, { stat: 'mood', add: -3 }],
        next: 'dawn_intro',
      },

      // ── DialUpDawn ───────────────────────────────────────────────────────
      dawn_intro: {
        speaker: 'DialUpDawn',
        text: '"lol you\'re doing the whole night of pep talks huh. cute. i already signed. i just wanted to hear what you\'d say." A beat. "...say it anyway."',
        choices: [
          {
            tag: '[Social DC 18]',
            text: '"You signed because it\'s easier to be bought than to be brave, and you paged me at midnight because you already regret it. Un-sign. I\'ll help you word it."',
            check: {
              skill: 'social',
              dc: 18,
              bonuses: enclosureBonuses,
              success: 'dawn_stay',
              fail: 'dawn_lost',
            },
          },
          {
            tag: '[Cryptography DC 16]',
            text: 'Dawn was always the sharpest crypto head on the board. Talk shop, not feelings — remind her what she\'d never get to build inside a "consumer insight" firm.',
            check: {
              skill: 'cryptography',
              dc: 16,
              bonuses: enclosureBonuses,
              success: 'dawn_stay',
              fail: 'dawn_lost',
            },
          },
          {
            text: '"You already signed. I\'m not going to beg. Just — don\'t give them anybody. Please." (Accept it.)',
            effects: [{ flag: 'fac.loft.dawn_promised' }],
            goto: 'dawn_go',
          },
        ],
      },
      dawn_stay: {
        speaker: 'DialUpDawn',
        text: '"...ugh. UGH. fine. i\'ll tell them the crypto over there is boring, which is true, and that i changed my mind, which is now also true because of you." She tears up the offer on the phone so you can hear it. She stays.',
        effects: [kept, { faction: LOFT, add: 3 }],
        next: 'tally',
      },
      dawn_lost: {
        speaker: 'DialUpDawn',
        text: [
          '"huh." The lol is gone from her voice. "so that\'s what you think of me. bought, not brave. boring crypto for a boring girl." You hear her typing while she talks — Dawn always types while she talks — and then you hear her stop.',
          '"here\'s the thing. i was gonna un-sign. i paged you to be talked out of it. and you picked the one argument that makes me want to go over there and build the best thing that building has ever owned, just so you have to look at it."',
          '"night. go keep your board."',
        ],
        effects: [
          { flag: 'fac.loft.dawn_stung' },
          { stat: 'stress', add: 3 },
          // She tells her new team exactly who paged her at midnight, and the Row hears it told back.
          { chance: 0.3, then: [{ complication: 'social' }] },
        ],
        next: 'dawn_go',
      },
      dawn_go: {
        speaker: 'narrator',
        text: [
          {
            if: { flag: 'fac.loft.dawn_stung' },
            text: 'DialUpDawn takes the job, and takes her frighteningly good crypto with her, and aims it. Not at the board — at you, specifically, the way a person aims at a thing they need to prove wrong. You will meet her work again, and it will have your name in its margins.',
            else: 'She wanted a reason and you didn\'t find the one that fit her. "Nice try," she says, gently. DialUpDawn takes the job, and takes her frighteningly good crypto with her, and you will meet it again pointed the wrong way.',
          },
          { if: { flag: 'fac.loft.dawn_promised' }, text: '"I won\'t give them anybody," she adds, before she hangs up. "Promise." You believe her about as much as she does.' },
        ],
        effects: [{ flag: 'fac.loft.dawn_drifted' }, { var: 'fac.loft.enclosure_lost', add: 1 }, { stat: 'mood', add: -3 }],
        next: 'tally',
      },

      // ── Resolution ───────────────────────────────────────────────────────
      tally: {
        speaker: 'narrator',
        text: [
          'It\'s past three. The pager is warm from your hand. You did what you could with a voice and the truth and no fountain of your own.',
          { if: { var: 'fac.loft.kept', gte: 2 }, text: 'You kept the board together. Bruised, smaller, but together — the couch stays full enough to argue over donuts.' },
          { if: { var: 'fac.loft.kept', lte: 1 }, text: 'You kept the board barely. Handles you knew are quiet now, one by one, and the couch has room on it for the first time in years.' },
          { if: { flag: 'fac.loft.marisol_stung' }, text: 'At 3:40 the board\'s nightly backup doesn\'t run. It always ran. You realize, staring at the log, that it always ran because Marisol ran it, by hand, every night, for eight years, and never once mentioned it.' },
          { if: { flag: 'fac.loft.dawn_stung' }, text: 'DialUpDawn\'s handle is still logged in at dawn, which is a joke she\'d have made herself a week ago. At 5:02 it logs out, and her member profile changes to a single line: "boring crypto, coming soon."' },
          { if: { all: [{ flag: 'fac.loft.side_switch' }, { var: 'fac.loft.kept', lte: 1 }] }, text: 'Around four, Switch posts a single line to the board: "rate card attached. aperture\'s buying. anyone who wants in, dm me." It\'s what you told him to do, back in the schism. It just looks different at four in the morning.' },
        ],
        effects: [
          {
            if: { var: 'fac.loft.kept', gte: 2 },
            then: [
              { flag: 'fac.loft.intact' },
              { flag: 'w.scene_state', set: 'vibrant' },
              { faction: LOFT, add: 5 },
              { npc: 'corvid', affinity: 5 },
            ],
            else: [
              { flag: 'fac.loft.bleeding' },
              { flag: 'w.scene_state', set: 'bleeding' },
              { npc: 'corvid', affinity: -3 },
              { stat: 'mood', add: -6 },
            ],
          },
          // Switch's road (PKG-05 is his sole fate writer). A backed Switch on a bleeding board leads
          // the scene into Aperture's arms; on a board that held, Aperture uses him and lets him go
          // (a chat, `loft_switch_discarded`, gives you one shot at bringing him home).
          {
            if: { flag: 'fac.loft.side_switch' },
            then: [
              {
                if: { var: 'fac.loft.kept', gte: 2 },
                then: [{ scene: 'loft_switch_discarded', delayHours: 24 * 20 }],
                else: [{ npc: 'switch', fate: 'sellout' }, { flag: 'fac.loft.switch_sold' }],
              },
            ],
            else: [
              {
                if: { any: [{ flag: 'fac.loft.side_corvid' }, { var: 'fac.loft.kept', gte: 2 }] },
                then: [{ flag: 'npc.switch.converted' }, { npc: 'switch', fate: 'converted' }],
                else: [{ scene: 'loft_switch_discarded', delayHours: 24 * 20 }],
              },
            ],
          },
          { flag: 'fac.loft.q3_done' },
        ],
        next: 'corvid_close',
      },
      corvid_close: {
        speaker: 'corvid',
        text: [
          { if: { var: 'fac.loft.kept', gte: 2 }, text: '"Two out of three, on a night like this." Corvid sounds almost young. "That\'s not losing. Get some sleep. Don\'t let the two years make you lazy."' },
          {
            if: { var: 'fac.loft.kept', lte: 1 },
            text: '"I know. I heard the board go quiet from here." No blame in it, which is worse than blame. "It\'s still ours. Less of it. Still ours. Sleep."',
          },
        ],
      },
    },
  },
]

export default defineContent({
  scenes,
  quests: [
    {
      id: 'fac_loft_q3_enclosure',
      title: 'The Enclosure',
      kind: 'faction',
      faction: 'fac.loft',
      giver: 'corvid',
      act: 3,
      summary: 'Aperture is buying the scene out from under itself, one handle at a time. Three regulars are wavering. You have one night, a pager, and the truth to keep them.',
      rewards: 'Sets the scene\'s health (vibrant or bleeding); Loft reputation',
      priority: 20,
      autoStart: {
        all: [
          { quest: 'fac_loft_q2_schism', status: 'completed' },
          { var: 'act', gte: 3 },
          boardLive,
          { not: { flag: 'npc.corvid.bought' } },
        ],
      },
      start: 'night',
      stages: {
        night: {
          text: 'Three Loft regulars got the Aperture letter. Corvid can\'t buy them back; all you have is one night on the pager and the truth. Keep two of three and the board survives.',
          onEnter: [{ scene: 'loft_q3_enclosure', delayHours: 18 }],
          objectives: [
            {
              id: 'work_the_phone',
              text: 'Spend the night keeping the board together',
              when: { flag: 'fac.loft.q3_done' },
              hint: 'A dialog arrives tonight. Each regular is a [Social] check (mix in Business or Cryptography where it fits). The economy makes it harder; the co-op, if you built one, makes it easier. Keep two of three — and remember that anyone you lose goes to work for Aperture, and Aperture will point them at you.',
              progress: { of: { var: 'fac.loft.kept' }, target: 2 },
            },
          ],
        },
      },
    },
  ],
})
