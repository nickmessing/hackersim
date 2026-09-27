/**
 * PKG-05 — fac_loft_q1_prove, "Prove You Won't Rat" (bible §7.1 step 1).
 *
 * Corvid's annual loyalty test: a "rights management investigator" offers $400 for byteme's real
 * name. It is a sock puppet. Refusing earns the Loft's trust (+8); taking the bait costs it (−15,
 * `npc.corvid.wary`). The letter itself never shows a rep change, so the test stays a test: the
 * verdict (and every rep delta) lands when Corvid reveals herself on the board.
 */
import { defineContent } from '@/engine/registry'
import type { Effect, SceneDef } from '@/engine/types'

const answered: Effect = { flag: 'fac.loft.q1_answered' }

/** Applied when Corvid's private verdict arrives (the start node of `loft_q1_verdict`). */
const verdictEffects: Effect[] = [
  {
    if: { flag: 'fac.loft.q1_took_bait' },
    then: [
      { faction: 'fac.loft', add: -15 },
      { npc: 'corvid', affinity: -10 },
    ],
    else: [
      {
        if: { flag: 'fac.loft.q1_slip' },
        then: [
          { faction: 'fac.loft', add: -6 },
          { npc: 'corvid', affinity: -4 },
          // You gave a stranger the building. The door gets new locks, and the board knows who pays.
          { flag: 'fac.loft.new_locks' },
          { obligation: { id: 'pkg05_loft_new_locks', label: 'The Loft\'s new locks (you gave Mr. Pell our door)', perDay: 4, days: 45 } },
        ],
        else: [
          {
            if: { flag: 'fac.loft.q1_saw_through' },
            then: [
              { faction: 'fac.loft', add: 10 },
              { npc: 'corvid', affinity: 5 },
            ],
            else: [
              {
                if: { flag: 'fac.loft.q1_conned' },
                then: [
                  { faction: 'fac.loft', add: 4 },
                  { npc: 'corvid', affinity: 2 },
                ],
                else: [{ faction: 'fac.loft', add: 8 }],
              },
            ],
          },
        ],
      },
    ],
  },
]

const scenes: SceneDef[] = [
  // ── The letter ────────────────────────────────────────────────────────────
  {
    id: 'loft_q1_bait',
    channel: 'mail',
    title: 'Confidential inquiry re: "StarHaven Deluxe" release',
    from: 'rpell@kestrelrights.net',
    start: 'letter',
    expiresDays: 7,
    onExpire: [
      answered,
      { flag: 'fac.loft.q1_refused' },
      { flag: 'fac.loft.q1_ignored' },
      { log: 'You never answered the Kestrel letter. Silence is an answer too — and the safe one.', kind: 'story' },
    ],
    nodes: {
      letter: {
        text: [
          'Dear Sir or Madam,',
          'Kestrel Rights Management represents the publisher of StarHaven Deluxe, a space-trading simulation for home computers. An unauthorized copy of this product, with its registration protection removed, has circulated on bulletin boards in the Port Lumen area since last month.',
          'The release notes accompanying the copy carry the signature of a group calling itself "the Loft" and a personal handle, "byteme". We are prepared to pay FOUR HUNDRED DOLLARS ($400.00), by money order or in cash, for the legal name and home address of the individual responsible. Your own identity will remain strictly confidential. In our experience, members of such groups are often relieved to put the matter behind them.',
          'Reply to this address within seven days.',
          'R. Pell\nSenior Investigator, Kestrel Rights Management\n"Protecting Creativity Since 1996"\nTel/Fax (555) 013-4471',
        ],
        next: 'think',
      },
      think: {
        speaker: 'narrator',
        text: [
          'You know byteme\'s real name. Everybody who has been to the back room knows it. He introduced himself with it the first night, and then with his home phone number, and then with his mother\'s shift schedule at the laundromat.',
          'Kevin is sixteen. He signs everything. Four hundred dollars is two months of groceries, or a 56k modem and change.',
          { if: { flag: 'a1.cautious' }, text: 'You lurked for weeks before your first post. You know what a fishing line looks like when it hits the water.' },
        ],
        choices: [
          {
            tag: '[Leave]',
            text: 'Delete it. We don\'t rat.',
            effects: [answered, { flag: 'fac.loft.q1_refused' }],
            goto: 'deleted',
          },
          {
            text: 'Forward it to Corvid with one line: "Someone\'s shopping for byteme."',
            effects: [answered, { flag: 'fac.loft.q1_refused' }, { flag: 'fac.loft.q1_reported' }, { npc: 'corvid', affinity: 3 }],
            goto: 'forwarded',
          },
          {
            text: 'You grew up answering the door to people asking where your parents were. You know a fishing trip when you see one. Look closer.',
            if: { background: 'latchkey' },
            effects: [answered, { flag: 'fac.loft.q1_refused' }, { flag: 'fac.loft.q1_saw_through' }],
            goto: 'traced',
          },
          {
            text: 'Don\'t answer yet. Look hard at who\'s asking.',
            check: {
              skill: 'opsec',
              dc: 12,
              bonuses: [{ if: { flag: 'a1.cautious' }, add: 1, label: '+1 (a lurker\'s patience)' }],
              success: 'traced',
              fail: 'trace_fail',
              successEffects: [answered, { flag: 'fac.loft.q1_refused' }, { flag: 'fac.loft.q1_saw_through' }],
              failEffects: [{ stat: 'stress', add: 3 }, { stat: 'heat', add: 2 }, { flag: 'fac.loft.q1_called_fax' }],
            },
          },
          {
            tag: '[Con]',
            text: 'Take their money. Sell them a name that doesn\'t exist.',
            check: {
              skill: 'social',
              dc: 13,
              success: 'conned',
              fail: 'con_fail',
              successEffects: [answered, { flag: 'fac.loft.q1_conned' }, { money: 400 }],
              failEffects: [answered, { flag: 'fac.loft.q1_slip' }],
            },
          },
          {
            tag: '[Sell]',
            text: 'Reply with byteme\'s real name. $400 is $400.',
            effects: [answered, { flag: 'fac.loft.q1_took_bait' }, { flag: 'npc.corvid.wary' }],
            goto: 'sold',
          },
        ],
      },
      deleted: {
        speaker: 'narrator',
        text: 'Drag, drop, empty the trash. The little paper-crumple sound your computer makes has never felt so righteous. You sit there for a minute afterwards, a bit shaky, like you have just turned down a fight.',
      },
      forwarded: {
        speaker: 'narrator',
        text: [
          'You send it on and hover over the pager, waiting for a reply that doesn\'t come. Corvid is famously slow to answer and famously never misses anything.',
          'At 2 a.m. the forwarded message gets marked read. Nothing else.',
        ],
      },
      traced: {
        speaker: 'narrator',
        text: [
          'The letterhead is good. Too good: nobody\'s had a letterhead that crisp since the copy shop on Harbor Street closed. Then you look at the fax number.',
          '(555) 013-4471. You know that number. It\'s on the curling flyer taped inside the back-room door: SODIUM ROW PAGERS & ELECTRONICS: REPAIRS, ACTIVATIONS, NO QUESTIONS.',
          'The investigator is downstairs from the Loft. The investigator is probably wearing a black coat. You laugh out loud, alone, at your desk, and delete it with enormous satisfaction.',
        ],
      },
      trace_fail: {
        speaker: 'narrator',
        text: [
          'The return address bounces through a mail-drop service in Ridgeport and dead-ends there. The phone number goes to a fax tone that screams at you. You have learned exactly nothing, except that you are now sweating.',
          'You called it from the kitchen phone. Twice. Your real number, your mother\'s name on the bill. Somewhere a fax machine now knows exactly who was curious, and the mail-drop clerk in Ridgeport has written your voice down as "nervous kid, asked a lot."',
          'The letter is still sitting there. So is the $400.',
        ],
        choices: [
          {
            tag: '[Leave]',
            text: 'Delete it. Whoever they are, the answer is no.',
            effects: [answered, { flag: 'fac.loft.q1_refused' }],
            goto: 'deleted',
          },
          {
            text: 'Forward it to Corvid. She\'ll know what it is.',
            effects: [answered, { flag: 'fac.loft.q1_refused' }, { flag: 'fac.loft.q1_reported' }, { npc: 'corvid', affinity: 3 }],
            goto: 'forwarded',
          },
          {
            tag: '[Sell]',
            text: 'You can\'t find out who they are. Fine. Send the name.',
            effects: [answered, { flag: 'fac.loft.q1_took_bait' }, { flag: 'npc.corvid.wary' }],
            goto: 'sold',
          },
        ],
      },
      conned: {
        speaker: 'narrator',
        text: [
          'You give them "Kevin Albrecht, 14 Tidewater Court", a person and a street that exist only in your imagination and possibly in a very boring novel. You add a detail about a golden retriever for realism.',
          'Two days later a money order for $400 arrives in a plain envelope. It clears. You feel like a movie character, specifically the one who gets away with it in the first act.',
        ],
      },
      con_fail: {
        speaker: 'narrator',
        text: [
          'The fake name comes easily. The fake address doesn\'t, and you panic and write "above the pager shop on Sodium Row" because it is the first real place your brain offers you.',
          'You hit send before your brain finishes screaming. The name was fiction. The building wasn\'t.',
          'That night you walk past the pager shop on the way home, the long way, and look at the door to the back-room stairs as if it might already be a crime scene. It isn\'t. It\'s just a door. It\'s just the door you gave away.',
        ],
      },
      sold: {
        speaker: 'narrator',
        text: [
          'You type it out. Kevin Pham. The street. The apartment number. You leave out his mother\'s shift schedule, which feels, for about a second, like a kindness.',
          'Send. The modem chirps. It is the same sound it always makes.',
        ],
      },
    },
  },

  // ── Corvid's public confession on the members board ──────────────────────
  {
    id: 'loft_q1_confession',
    channel: 'forum',
    board: 'warez',
    title: 'Kestrel Rights Management (a confession)',
    from: 'corvid',
    start: 'c1',
    nodes: {
      c1: {
        text: [
          'Some of you received a letter this week from a Mr. R. Pell of Kestrel Rights Management, offering money for a member\'s name.',
          'There is no Kestrel Rights Management. There is no StarHaven Deluxe. There is a fax machine downstairs, a very old typeface, and me. I sent the same letter to seven of our newer members, about seven different people.',
          {
            if: { flag: 'fac.loft.q1_took_bait' },
            text: 'One of you answered with a real name and a real address. You know who you are. So do I. That is all I will say in public, because this board does not do hangings. It does not do much forgetting either.',
            else: 'Every one of you said no, or said nothing, or said something rude to Mr. Pell that I have printed out and put on the fridge. I have never been so pleased to be so bored.',
          },
          'I do this every year. I\'ll do it next year. If that offends you, you are welcome to leave, and I\'ll understand, and I\'ll still do it.',
          '-- Corvid :: sysop :: keep the commons',
        ],
        next: 'c2',
      },
      c2: {
        speaker: 'byteme',
        text: 'wait. WAIT. the letter was about ME?? who was selling me. who. i will not be mad. (i will be a little mad) (i will get over it) (who)',
        next: 'c3',
      },
      c3: {
        speaker: 'switch',
        text: 'For the record, four hundred is insulting. If anybody ever sells byteme, hold out for a grand, the kid is worth at least that. Kidding. Mostly. Corvid, you owe me a fax cartridge.',
        next: 'c4',
      },
      c4: {
        speaker: 'deadline',
        text: [
          'In \'94 the letter was real. It said five hundred. Somebody took it. I did fourteen months.',
          'She does this every year so none of you ever find out what that feels like from the inside. Say thank you.',
        ],
        choices: [
          {
            text: 'Thank you.',
            effects: [{ npc: 'corvid', affinity: 1 }, { npc: 'deadline', affinity: 2 }],
            goto: 'r_thanks',
          },
          {
            text: 'byteme, put your real name in one more release note and I\'ll sell it myself. For a grand.',
            effects: [{ npc: 'byteme', affinity: 2 }, { stat: 'mood', add: 2 }],
            goto: 'r_joke',
          },
          {
            text: 'Next year, use a fax number that isn\'t taped inside our own door.',
            if: { flag: 'fac.loft.q1_saw_through' },
            effects: [{ npc: 'corvid', affinity: 2 }],
            goto: 'r_fax',
          },
          {
            tag: '[Leave]',
            text: 'Close the thread without posting.',
            if: { flag: 'fac.loft.q1_took_bait' },
          },
        ],
      },
      r_thanks: {
        speaker: 'corvid',
        text: 'You\'re welcome. Now somebody please explain to byteme what a release note is and why his name should not be in it.',
      },
      r_joke: {
        speaker: 'byteme',
        text: 'ok first of all rude. second of all i have removed my name from all release notes. third of all i put my handle in the ascii art instead where NO ONE will ever look',
      },
      r_fax: {
        speaker: 'corvid',
        text: 'Noted. The fax number stays. It catches the ones who look, and I like to know who looks.',
      },
    },
  },

  // ── Corvid's private verdict ─────────────────────────────────────────────
  {
    id: 'loft_q1_verdict',
    channel: 'chat',
    title: 'Corvid',
    from: 'corvid',
    start: 'open',
    expiresDays: 5,
    onExpire: [{ flag: 'fac.loft.q1_done' }],
    nodes: {
      open: {
        effects: verdictEffects,
        text: [
          {
            if: { flag: 'fac.loft.q1_took_bait' },
            text: 'i read your reply to mr pell. i have it printed. it\'s very neat. you even spelled the street right.',
          },
          {
            if: { all: [{ flag: 'fac.loft.q1_slip' }, { not: { flag: 'fac.loft.q1_took_bait' } }] },
            text: 'fake name: a+. golden retriever: nice touch. "above the pager shop on sodium row": you gave a stranger our front door.',
          },
          {
            if: { all: [{ flag: 'fac.loft.q1_saw_through' }, { not: { flag: 'fac.loft.q1_took_bait' } }] },
            text: 'you looked at the fax number. almost nobody looks at the fax number.',
          },
          {
            if: { all: [{ flag: 'fac.loft.q1_conned' }, { not: { flag: 'fac.loft.q1_slip' } }] },
            text: 'you sold mr pell a boy who doesn\'t exist on a street that doesn\'t exist. i\'m told the money order cleared. that was my money, by the way.',
          },
          {
            if: {
              all: [
                { flag: 'fac.loft.q1_refused' },
                { not: { flag: 'fac.loft.q1_saw_through' } },
                { not: { flag: 'fac.loft.q1_conned' } },
              ],
            },
            text: 'you said no. that\'s all it takes. it\'s amazing how often it isn\'t.',
          },
          {
            if: { flag: 'fac.loft.q1_called_fax' },
            text: 'also. you called my fax machine twice on tuesday. from your mother\'s kitchen line. it is a 1991 fax machine and it still has caller id. we\'ll work on that.',
          },
        ],
        choices: [
          {
            text: 'you\'re not even mad?',
            if: { flag: 'fac.loft.q1_took_bait' },
            goto: 'bait_1',
          },
          {
            text: 'it was a test. i knew it was a test.',
            if: { flag: 'fac.loft.q1_took_bait' },
            goto: 'bait_lie',
          },
          {
            text: 'so do i get the $400 back, or',
            if: { flag: 'fac.loft.q1_conned' },
            goto: 'con_1',
          },
          {
            text: 'i panicked. i\'m sorry.',
            if: { flag: 'fac.loft.q1_slip' },
            effects: [{ npc: 'corvid', affinity: 2 }],
            goto: 'slip_1',
          },
          {
            text: 'is this where you tell me i passed?',
            if: { all: [{ flag: 'fac.loft.q1_refused' }, { not: { flag: 'fac.loft.q1_took_bait' } }] },
            goto: 'pass_1',
          },
        ],
      },
      bait_1: {
        text: [
          'no. mad is for people you expect things from.',
          'the money order will come anyway. keep it. it\'s the last thing the loft will ever sell you.',
        ],
        choices: [
          {
            text: 'i\'ll earn it back.',
            effects: [{ flag: 'fac.loft.q1_done' }, { npc: 'corvid', affinity: 2 }],
            goto: 'bait_end',
          },
          { tag: '[Leave]', text: 'log off.', effects: [{ flag: 'fac.loft.q1_done' }] },
        ],
      },
      bait_lie: {
        text: 'you didn\'t, though. i can tell because you asked what denomination the money order would be in.',
        choices: [
          {
            text: '...i\'ll earn it back.',
            effects: [{ flag: 'fac.loft.q1_done' }, { npc: 'corvid', affinity: 1 }],
            goto: 'bait_end',
          },
          { tag: '[Leave]', text: 'log off.', effects: [{ flag: 'fac.loft.q1_done' }] },
        ],
      },
      bait_end: {
        text: 'people do. slowly. the board\'s still open to you. the back room is too. i\'ll just be watching the door a little more when you come through it.',
      },
      con_1: {
        text: [
          'keep it. anyone who can take money from a snitch-buyer without giving them anything real has earned a small fee.',
          'but understand: the test wasn\'t "can you lie to a stranger". the test was "will you deal". you dealt. beautifully. i\'ll remember both halves of that.',
        ],
        choices: [{ text: 'fair.', effects: [{ flag: 'fac.loft.q1_done' }] }],
      },
      slip_1: {
        text: [
          'i know. panic is where people tell the truth. yours was the address.',
          'nobody got hurt. nobody gets hurt because i wrote the letter. next time it might not be me. think about that before you think about anything else.',
          'the door gets new locks on thursday. the fax number changes. the locksmith wants $180 and the board voted on who pays. it was unanimous. you can pay it off by the week like a gentleman.',
        ],
        choices: [
          {
            tag: '[Pay $180]',
            text: 'i\'ll pay the locksmith tonight. all of it.',
            if: { stat: 'money', gte: 180 },
            effects: [{ money: -180 }, { removeObligation: 'pkg05_loft_new_locks' }, { npc: 'corvid', affinity: 2 }, { flag: 'fac.loft.q1_done' }],
            goto: 'slip_paid',
          },
          { text: 'i will. think about it, i mean. and pay.', effects: [{ flag: 'fac.loft.q1_done' }] },
        ],
      },
      slip_paid: {
        text: 'cash, on the counter, before the locks are even in. huh. keep the receipt. frame it next to the one where you gave away the address. that\'s the whole education, those two receipts.',
      },
      pass_1: {
        text: [
          { if: { flag: 'fac.loft.q1_saw_through' }, text: 'this is where i tell you that you passed and that you\'re a smartass. both true.' },
          { if: { not: { flag: 'fac.loft.q1_saw_through' } }, text: 'this is where i tell you that you passed. welcome in. properly in, i mean.' },
          'the loft is people who didn\'t say the name. that\'s all it ever was. the tools come and go.',
        ],
        choices: [
          { text: 'what happens now?', goto: 'pass_2' },
          { tag: '[Leave]', text: 'thanks, corvid.', effects: [{ flag: 'fac.loft.q1_done' }] },
        ],
      },
      pass_2: {
        text: 'now you get the good leads, you get told things, and people start asking you for favors. it\'s mostly the favors. brb, byteme is trying to post his phone number in the ascii art thread',
        effects: [{ flag: 'fac.loft.q1_done' }],
      },
    },
  },
]

export default defineContent({
  scenes,
  quests: [
    {
      id: 'fac_loft_q1_prove',
      title: 'Prove You Won\'t Rat',
      kind: 'faction',
      faction: 'fac.loft',
      giver: 'corvid',
      act: 1,
      summary: 'Somebody is offering money for a Loft member\'s real name. The Loft only has one rule, and everyone gets tested on it eventually.',
      rewards: 'Loft reputation, Corvid\'s trust',
      priority: 20,
      autoStart: { all: [{ faction: 'fac.loft', gte: 15 }, { var: 'act', lte: 2 }, { npc: 'corvid', met: true }] },
      start: 'letter',
      stages: {
        letter: {
          text: 'A "rights-management investigator" wants the name behind byteme\'s handle and is offering $400 for it. You know the name. The question is what kind of person you are when you think nobody is watching.',
          onEnter: [{ scene: 'loft_q1_bait', delayHours: 6 }],
          objectives: [
            {
              id: 'answer',
              text: 'Deal with the Kestrel letter',
              when: { flag: 'fac.loft.q1_answered' },
              hint: 'It\'s in your Mail. Whatever you decide, decide it on purpose.',
            },
          ],
          next: 'verdict',
        },
        verdict: {
          text: [
            { if: { flag: 'fac.loft.q1_took_bait' }, text: 'You sent the name. Somewhere, a fax machine is warming up. You have a feeling you are about to find out who was really asking.' },
            {
              if: { not: { flag: 'fac.loft.q1_took_bait' } },
              text: 'You kept the name to yourself. Somebody on Sodium Row is going to want to talk about that.',
            },
          ],
          onEnter: [
            { scene: 'loft_q1_confession', delayHours: 30 },
            { scene: 'loft_q1_verdict', delayHours: 36 },
          ],
          objectives: [
            {
              id: 'verdict',
              text: 'Hear the verdict',
              when: { flag: 'fac.loft.q1_done' },
              hint: 'Watch the Loft\'s members board and your BuddyPager. Somebody has been watching you.',
            },
          ],
        },
      },
    },
  ],
})
