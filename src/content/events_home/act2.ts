/**
 * events_home — ACT II (days ~240–1600). Growing up costs money: a roommate who skips out (and the
 * subletter who replaces him), a pre-approved credit card, Mom wanting Kim's boyfriend "checked on
 * the computer," and a wall that breathes. Each can grow a tail: a personal quest, a statement that
 * keeps arriving, a cough that doesn't go away.
 */
import { defineContent } from '@/engine/registry'
import type { EventDef, QuestDef, SceneDef } from '@/engine/types'
import {
  DAMP_COUGH,
  RENT_BREAK,
  actGte,
  actLte,
  between,
  buff,
  free,
  kimHere,
  momHere,
  owe,
  withGrace,
} from './_shared'

// ── ev_home_roommate_rent ─────────────────────────────────────────────────────
// Teo is gone. So is his share of the rent. The others are looking at you.
const roommateRentScene: SceneDef = {
  id: 'ev_home_roommate_rent_scene',
  channel: 'dialog',
  title: 'Teo Is Gone',
  start: 'gone',
  nodes: {
    gone: {
      speaker: 'narrator',
      text: [
        'Teo\'s side of the room is empty except for a lava lamp, a single sock and a note on the mattress: "GOT A THING IN RIDGEPORT. SORRY. KEEP THE LAMP." Rent is due Friday. His share is $180.',
        'Priscilla and Big Ron, your other two roommates, are standing in the doorway with their arms folded. Priscilla is a nursing student who has done the math. Big Ron is a bass player who has not.',
        '"So," says Priscilla. "You\'re the one with the computer money."',
      ],
      choices: [
        {
          text: 'Cover Teo\'s share yourself. It\'s easier than arguing.',
          req: { stat: 'money', gte: 180 },
          reqText: 'Requires $180',
          effects: [{ money: -180 }],
          goto: 'covered',
        },
        {
          text: 'Split it three ways. Everyone bleeds a little.',
          effects: [{ money: -60 }],
          goto: 'split',
        },
        {
          tag: '[Business]',
          text: 'Sublet his bed. Post it on the LSU housing board tonight and interview candidates tomorrow.',
          check: {
            skill: 'business',
            dc: 13,
            bonuses: [{ if: { background: 'class_clown' }, add: 1, label: '+1 (you could sell a bed in a swamp)' }],
            success: 'sublet_good',
            fail: 'sublet_bad',
          },
        },
        {
          tag: '[Social]',
          text: 'Track Teo down through his mother in Ridgeport and guilt him into paying.',
          check: {
            skill: 'social',
            dc: 13,
            bonuses: [{ if: { trait: 'empath' }, add: 2, label: '+2 (you know how to talk to moms)' }],
            success: 'teo_pays',
            fail: 'teo_mom',
          },
        },
      ],
    },
    covered: {
      speaker: 'narrator',
      text: 'Priscilla nods once, businesslike. Big Ron hugs you, which you did not consent to. For the rest of the month the fridge quietly stocks itself with things you like, and nobody says a word about it.',
      effects: [{ stat: 'mood', add: 2 }],
    },
    split: {
      speaker: 'narrator',
      text: 'Big Ron has to sell a guitar pedal. Priscilla works a double. Everyone is annoyed with Teo, which is the closest the three of you have ever been.',
    },
    sublet_good: {
      speaker: 'narrator',
      text: 'The third applicant is Anneliese, a graduate student in marine biology who owns exactly one bag, goes to bed at ten, and pays two months up front in cash. She labels her shelf in the fridge with a tiny laminated sign. You have never loved a stranger so much.',
      effects: [{ xp: 'business', add: 15 }, { stat: 'mood', add: 4 }],
    },
    sublet_bad: {
      speaker: 'narrator',
      text: [
        'The ad gets one reply. His name is Gus. He is "between situations." He pays the first month in rolled quarters and moves in with a garbage bag of clothes and a cordless phone he refers to as "my office."',
        'Priscilla gives you a look that will be discussed at your funeral.',
      ],
      effects: [{ quest: 'ev_home_q_subletter', start: true }],
    },
    teo_pays: {
      speaker: 'narrator',
      text: 'Mrs. Albernaz in Ridgeport listens to the whole story, says "one moment, sweetheart," and puts the phone down. You hear her yelling his full name in another room. A money order arrives on Thursday with an apology written on the back and a drawing of a sad dog.',
      effects: [{ xp: 'social', add: 10 }],
    },
    teo_mom: {
      speaker: 'narrator',
      text: 'Teo\'s mother does not see it your way. She thinks you are shaking down her son, and says so, at length, with a vocabulary that suggests she has done this before. Teo never pays. You end up covering his share in installments to Priscilla, who keeps a ledger.',
      effects: [owe('ev_home_teo_share', 'Teo\'s share of the rent', 6, 30), { stat: 'stress', add: 6 }],
    },
  },
}

const subletterScene: SceneDef = {
  id: 'ev_home_subletter_scene',
  channel: 'dialog',
  title: 'Gus',
  start: 'trouble',
  nodes: {
    trouble: {
      speaker: 'narrator',
      text: [
        'Two weeks of Gus. He eats your food and leaves apologetic notes ("SORRY — G"). He is on the phone line from midnight to four doing something he calls "consulting." Twice now you have come home to find him sitting at your desk, looking at your screen, "just checking the weather."',
        'Tonight Priscilla corners you in the kitchen. "Either he goes, or I go. And I pay rent."',
      ],
      choices: [
        {
          tag: '[Social]',
          text: 'Sit him down. A deadline, a handshake, and no room to argue.',
          check: {
            skill: 'social',
            dc: 14,
            bonuses: [
              { if: { trait: 'silver_tongue' }, add: 2, label: '+2 (silver tongue)' },
              { if: { trait: 'hothead' }, add: -2, label: '-2 (hothead)' },
            ],
            success: 'talk_win',
            fail: 'talk_lose',
          },
        },
        {
          tag: '[OpSec]',
          text: 'Before you confront him, figure out what "consulting" means — the phone bill, the hours, who calls back.',
          check: {
            skill: 'opsec',
            dc: 14,
            bonuses: [{ if: { trait: 'paranoid' }, add: 2, label: '+2 (you noticed first)' }],
            success: 'leverage',
            fail: 'caught',
          },
        },
        {
          text: 'Pay him to leave. $150, cash, and he\'s gone by Sunday.',
          req: { stat: 'money', gte: 150 },
          reqText: 'Requires $150',
          effects: [{ money: -150 }, { flag: 'ev_home.gus_resolved' }],
          goto: 'paid_off',
        },
        {
          text: 'Grit your teeth and wait out the lease. Three more months.',
          effects: [{ stat: 'stress', add: 12 }, { money: -60 }, { flag: 'ev_home.gus_resolved' }],
          goto: 'endure',
        },
      ],
    },
    talk_win: {
      speaker: 'Gus',
      text: '"Hey. Hey. No, you\'re right. You\'re right." Gus looks genuinely wounded, then genuinely relieved, like he\'d been waiting for someone to tell him to leave. He\'s gone by Saturday. He leaves the cordless phone "as a thank-you." It doesn\'t work.',
      effects: [{ flag: 'ev_home.gus_resolved' }, { xp: 'social', add: 15 }],
    },
    talk_lose: {
      speaker: 'narrator',
      text: 'Gus nods through the whole speech and then says, "Yeah, see, I have a verbal agreement," and does not move. He stays until the end of the lease. When he finally goes, so do your good headphones and a phone bill with $140 of calls to numbers nobody recognizes.',
      effects: [{ flag: 'ev_home.gus_resolved' }, { money: -140 }, { stat: 'stress', add: 10 }],
    },
    leverage: {
      speaker: 'narrator',
      text: [
        'It takes one evening with the phone bill and a highlighter. Gus has been running a psychic hotline. On your line. Under the name "Madame Constance." The callbacks at 3 a.m. are his clients.',
        'You don\'t even have to raise your voice. You just set the highlighted bill on the table. He\'s gone in two days, and he pays back $80 of the calls in rolled quarters, which feels like a curse.',
      ],
      effects: [{ flag: 'ev_home.gus_resolved' }, { money: 80 }, { xp: 'opsec', add: 15 }],
    },
    caught: {
      speaker: 'narrator',
      text: [
        'Gus sees you with the phone bill and the highlighter and gets there first. By the next morning the landlord has a message from a "concerned tenant" about "some kind of computer hacker thing going on in 3B." Gus leaves on his own schedule, smug, a month later.',
        'The landlord starts dropping by unannounced. So, once, does a man in a windbreaker who says he is "from the phone company" and asks a lot of questions that are not about phones.',
      ],
      effects: [
        { flag: 'ev_home.gus_resolved' },
        { flag: 'ev_home.gus_tipped_landlord' },
        { stat: 'heat', add: 6 },
        { stat: 'stress', add: 8 },
        { chance: 0.4, then: [{ complication: 'social' }] },
      ],
    },
    paid_off: {
      speaker: 'Gus',
      text: '"That\'s very generous. That is, honestly, the most generous thing." He\'s gone Sunday morning. Priscilla bakes you a cake. Big Ron writes a song about it. It is not a good song.',
    },
    endure: {
      speaker: 'narrator',
      text: 'Three months. Three months of "SORRY — G" notes and midnight phone calls. You start working from the library. Priscilla moves in with her boyfriend in the second month, and the new roommate is somehow worse. You learn something about patience, and something about yourself, and neither lesson is pleasant.',
    },
  },
}

const subletterQuest: QuestDef = {
  id: 'ev_home_q_subletter',
  title: 'Complication: The Subletter',
  kind: 'personal',
  priority: 3,
  summary: 'You sublet Teo\'s bed to Gus, who is "between situations." Priscilla has already started a countdown. Deal with Gus before the loft deals with you.',
  rewards: 'A quiet apartment, eventually',
  start: 'gus',
  stages: {
    gus: {
      text: 'Gus has moved in with a garbage bag of clothes and a cordless phone he calls "my office." Give it a couple of weeks. It will come to a head.',
      hint: 'Things with Gus will come to a head in a week or two. Answer when they do.',
      onEnter: [{ scene: 'ev_home_subletter_scene', delayHours: 24 * 14 }],
      objectives: [{ id: 'resolve', text: 'Deal with Gus', when: { flag: 'ev_home.gus_resolved' } }],
      onComplete: [{ log: 'Gus is gone. The loft is quiet again, give or take a bass player.', kind: 'story' }],
    },
  },
}

const roommateRent: EventDef = {
  id: 'ev_home_roommate_rent',
  category: 'money',
  weight: 2,
  when: { all: [{ housing: 'shared_room' }, actLte(3), free, { day: true, gte: 30 }] },
  scene: 'ev_home_roommate_rent_scene',
}

// ── ev_home_credit_card ───────────────────────────────────────────────────────
// PRE-APPROVED! The first envelope that treats you like an adult is a trap.
const cardScene: SceneDef = {
  id: 'ev_home_credit_card_scene',
  channel: 'mail',
  title: 'You\'re PRE-APPROVED!',
  from: 'Lumen Sound Card Services',
  start: 'offer',
  expiresDays: 21,
  nodes: {
    offer: {
      speaker: 'Lumen Sound Card Services',
      text: [
        'Congratulations, {name}! Based on your excellent potential, you have been PRE-APPROVED for the Lumen Sound Platinum Card* with a credit line of up to $1,500 and an introductory rate of 0%**!',
        'Activate today and receive a complimentary travel alarm clock (a $4.99 value).',
        { if: { stat: 'money', lte: 200 }, text: 'Your account balance tells you exactly how tempting this is. It knows. They always know.' },
        '* Not platinum. ** Terms and conditions apply. See reverse. See reverse of reverse.',
      ],
      choices: [
        {
          text: 'Activate it and take the full $1,500 cash advance.',
          effects: [
            { money: 1500 },
            owe('ev_home_card', 'Lumen Sound "Platinum" Card', 9, 240),
            { flag: 'ev_home.card_tier', set: 'advance' },
            { scene: 'ev_home_card_statement_scene', delayHours: 24 * 60 },
          ],
          goto: 'advance',
        },
        {
          tag: '[Business]',
          text: 'Read every line of the fine print. Use only the 0% window, borrow $800, and pay it off before the rate wakes up.',
          check: {
            skill: 'business',
            dc: 14,
            bonuses: [
              { if: { background: 'mathlete' }, add: 2, label: '+2 (you can read an amortization table for fun)' },
              { if: { trait: 'bookworm' }, add: 1, label: '+1 (you actually read the reverse of the reverse)' },
            ],
            success: 'intro',
            fail: 'trap',
            successEffects: [
              { money: 800 },
              owe('ev_home_card', 'Lumen Sound "Platinum" Card', 3, 300),
              { flag: 'ev_home.card_tier', set: 'intro' },
              { scene: 'ev_home_card_statement_scene', delayHours: 24 * 60 },
            ],
            failEffects: [
              { money: 800 },
              owe('ev_home_card', 'Lumen Sound "Platinum" Card', 8, 240),
              { flag: 'ev_home.card_tier', set: 'trap' },
              { scene: 'ev_home_card_statement_scene', delayHours: 24 * 60 },
            ],
          },
        },
        {
          text: 'Shred it. Dad\'s voice in your head: "Never owe a bank."',
          effects: [{ stat: 'mood', add: 2 }, { flag: 'ev_home.shredded_card' }],
          goto: 'shred',
        },
        {
          if: kimHere,
          text: 'Mail it to Kim with a sticky note: "Lesson #1. Read the back."',
          effects: [{ npc: 'kim', affinity: 3 }],
          goto: 'kim',
        },
      ],
    },
    advance: {
      speaker: 'narrator',
      text: 'The money lands in two days. It feels incredible for about a week. Then the first statement arrives and the word "minimum" starts appearing in your dreams.',
    },
    intro: {
      speaker: 'narrator',
      text: 'The 0% window is real, if you read the reverse of the reverse: nine months, no interest, as long as you never, ever miss a payment. You set the payments to come out automatically and put a note on your monitor that just says "NINE." It is the most adult thing you have ever done.',
    },
    trap: {
      speaker: 'narrator',
      text: 'You read the fine print. You read it wrong. The "introductory period" is three months, not three years, and it ends the first time you are a day late, which you are, because the payment address changed in a footnote. The rate that wakes up is hungry.',
    },
    shred: {
      speaker: 'narrator',
      text: 'The shredder at the copy shop eats it with a satisfying crunch. Eleven more offers arrive over the next two months. You start a shoebox. It becomes a small, grim art project.',
    },
    kim: {
      speaker: 'kim',
      text: ['lol', 'i read the back', 'the back of the back says they can change the rate "at any time for any reason including no reason"', 'ur a good big sibling sometimes. dont let it go to ur head'],
    },
  },
}

const cardStatementScene: SceneDef = {
  id: 'ev_home_card_statement_scene',
  channel: 'mail',
  title: 'Your Statement Is Ready',
  from: 'Lumen Sound Card Services',
  start: 'statement',
  nodes: {
    statement: {
      speaker: 'Lumen Sound Card Services',
      text: [
        'Dear Valued Cardmember, your statement is ready. Your minimum payment will continue to be collected daily as a courtesy.',
        { if: { flag: 'ev_home.card_tier', eq: 'advance' }, text: 'Payoff amount today (incl. cash advance fee, finance charge and a "convenience charge" nobody can explain): $1,450. Or keep paying daily, which works out to rather more.' },
        { if: { flag: 'ev_home.card_tier', eq: 'intro' }, text: 'Payoff amount today: $620. Your introductory rate remains in effect. Please do not miss a payment. We are watching. (Kindly.)' },
        { if: { flag: 'ev_home.card_tier', eq: 'trap' }, text: 'Payoff amount today: $1,250. Your introductory rate has ended. Your new rate is described on page 4 in a font size we are legally required to call "readable."' },
        { if: { not: { obligation: 'ev_home_card' } }, text: 'Our records indicate this account is paid in full. Congratulations! Would you like to be pre-approved for something else?' },
      ],
      choices: [
        {
          if: { all: [{ flag: 'ev_home.card_tier', eq: 'advance' }, { obligation: 'ev_home_card' }] },
          text: 'Pay off the whole thing and cut the card in half ($1,450).',
          req: { stat: 'money', gte: 1450 },
          reqText: 'Requires $1,450',
          effects: [{ money: -1450 }, { removeObligation: 'ev_home_card' }],
          goto: 'paid',
        },
        {
          if: { all: [{ flag: 'ev_home.card_tier', eq: 'intro' }, { obligation: 'ev_home_card' }] },
          text: 'Pay off the rest while the rate is still zero ($620).',
          req: { stat: 'money', gte: 620 },
          reqText: 'Requires $620',
          effects: [{ money: -620 }, { removeObligation: 'ev_home_card' }],
          goto: 'paid',
        },
        {
          if: { all: [{ flag: 'ev_home.card_tier', eq: 'trap' }, { obligation: 'ev_home_card' }] },
          text: 'Pay it off and never look at a credit card again ($1,250).',
          req: { stat: 'money', gte: 1250 },
          reqText: 'Requires $1,250',
          effects: [{ money: -1250 }, { removeObligation: 'ev_home_card' }],
          goto: 'paid',
        },
        {
          if: { obligation: 'ev_home_card' },
          tag: '[Business]',
          text: 'Call the retention department and negotiate the rate down. Mention the competition. Mention it twice.',
          check: {
            skill: 'business',
            dc: 15,
            bonuses: [{ if: { trait: 'silver_tongue' }, add: 2, label: '+2 (silver tongue)' }],
            success: 'negotiated',
            fail: 'fee',
          },
        },
        { text: 'Keep paying the minimum. Future you can handle it.', goto: 'minimum' },
      ],
    },
    paid: {
      speaker: 'narrator',
      text: 'You cut the card in half with kitchen scissors, then into quarters, then into a fine plastic confetti that you scatter out the window like a ceremony. The daily charge vanishes. You feel ten pounds lighter, and considerably wiser about envelopes that say PRE-APPROVED.',
    },
    negotiated: {
      speaker: 'narrator',
      text: 'Forty minutes, three transfers and one supervisor named Brenda later, the rate drops like a stone. "We value your loyalty," Brenda says, in the voice of a woman who has lost this fight before. The daily charge shrinks.',
      effects: [owe('ev_home_card', 'Lumen Sound "Platinum" Card (renegotiated)', 4, 200), { xp: 'business', add: 20 }],
    },
    fee: {
      speaker: 'narrator',
      text: 'Retention transfers you to billing, billing transfers you to retention, and at minute fifty-three a recording thanks you for your call and hangs up. Next month\'s statement includes a $35 "account review fee" for the call.',
      effects: [{ money: -35 }, { stat: 'stress', add: 6 }],
    },
    minimum: {
      speaker: 'narrator',
      text: 'You file the statement in the shoebox with the others. The daily charge keeps ticking along in the ledger like a clock you can\'t hear unless the room is very quiet.',
    },
  },
}

const creditCard: EventDef = {
  id: 'ev_home_credit_card',
  category: 'money',
  when: { all: [actGte(2), between(300, 1600), free] },
  scene: 'ev_home_credit_card_scene',
}

// ── ev_home_kim_boyfriend ─────────────────────────────────────────────────────
// Mom has learned Kim has a boyfriend. Mom wants him "checked on the computer."
const kimBoyfriendScene: SceneDef = {
  id: 'ev_home_kim_boyfriend_scene',
  channel: 'chat',
  title: 'URGENT FAMILY MATTER',
  from: 'mom',
  start: 'urgent',
  nodes: {
    urgent: {
      speaker: 'mom',
      text: [
        'KIM HAS A BOYFRIEND',
        'his name is desmond. he is sixteen. he has a CAR. who gives a sixteen year old a car',
        'you know computers. can you check him on the computer. is he a criminal. does he have a record',
        'dont tell kim i asked. i am just a mother',
      ],
      choices: [
        {
          tag: '[Social]',
          text: 'ill handle it mom. (then just go meet Desmond at the Cathode like a normal sibling)',
          check: {
            skill: 'social',
            dc: 13,
            bonuses: [
              { if: { trait: 'empath' }, add: 2, label: '+2 (empath)' },
              { if: { trait: 'hothead' }, add: -2, label: '-2 (hothead)' },
            ],
            success: 'meet_win',
            fail: 'meet_lose',
          },
        },
        {
          tag: '[OpSec]',
          text: 'Look into him quietly, the way you look into things — and make sure nobody ever knows you looked.',
          check: {
            skill: 'opsec',
            dc: 14,
            bonuses: [{ if: { trait: 'paranoid' }, add: 1, label: '+1 (paranoid)' }],
            success: 'looked',
            fail: 'caught',
          },
        },
        {
          text: 'no mom. kim is sixteen, not a suspect. she\'s fine',
          effects: [{ npc: 'mom', affinity: -3 }, { npc: 'kim', affinity: 4 }],
          goto: 'refuse',
        },
        {
          text: 'Page Kim instead: "mom\'s on the warpath. bring him to dinner before she hires a detective."',
          effects: [{ npc: 'kim', affinity: 2 }, { npc: 'mom', affinity: 1 }, { flag: 'ev_home.desmond_dinner' }],
          goto: 'warn',
        },
      ],
    },
    meet_win: {
      speaker: 'narrator',
      text: [
        'Desmond turns out to be a lanky kid in a chess club jacket who stands up when you walk into the Cathode and calls Sal "sir." The car is his grandmother\'s 1986 sedan, and he drives it exactly at the speed limit. He asks about your work with real curiosity and listens to the answer.',
        'You report back to Mom: harmless, polite, terrified of Kim, which is correct. Kim finds out anyway and pretends to be furious. She isn\'t.',
      ],
      effects: [{ npc: 'kim', affinity: 5 }, { npc: 'mom', affinity: 3 }, { flag: 'ev_home.met_desmond' }],
    },
    meet_lose: {
      speaker: 'narrator',
      text: [
        'You meant to be casual. Instead you hear yourself asking him where he sees himself in five years, what his intentions are, and whether that car has been inspected. He answers every question. Then he leaves very fast, and doesn\'t come back.',
        'Kim\'s message arrives an hour later, all caps, which she only uses for true emergencies: "WHAT DID YOU DO."',
      ],
      effects: [{ npc: 'kim', affinity: -8 }, { flag: 'ev_home.kim_mortified' }, { stat: 'stress', add: 5 }],
    },
    looked: {
      speaker: 'narrator',
      text: 'He\'s nobody. A chess club, a part-time job at the library, a grandmother\'s car, a web page about model trains that hasn\'t been updated since he was twelve. You tell Mom he\'s fine. She is relieved. You close the window and sit for a minute feeling faintly like a person you would not want your sister dating.',
      effects: [{ npc: 'mom', affinity: 2 }, { stat: 'mood', add: -2 }],
    },
    caught: {
      speaker: 'kim',
      text: [
        'so desmond\'s mom heard someone was asking around about him. at the library. at his JOB',
        'the librarian described them. she described ur JACKET',
        'u checked up on him. for MOM. u of all people',
        'dont talk to me for a while ok',
      ],
      effects: [{ npc: 'kim', affinity: -12 }, { npc: 'mom', affinity: -2 }, { flag: 'ev_home.kim_snooped' }, { stat: 'stress', add: 6 }],
    },
    refuse: {
      speaker: 'mom',
      text: ['ok', 'you are right. i know you are right', 'i am still going to make him eat dinner here. with your father. and the good knives out'],
    },
    warn: {
      speaker: 'kim',
      text: ['oh my GOD', 'ok. ok ok ok. sunday. i will prepare him', 'if dad does the handshake thing i am moving to ridgeport', 'thx. seriously. u could have just told her stuff'],
    },
  },
}

const kimBoyfriend: EventDef = {
  id: 'ev_home_kim_boyfriend',
  category: 'family',
  weight: 2,
  when: { all: [kimHere, momHere, actGte(2), between(480, 1500), free] },
  scene: 'ev_home_kim_boyfriend_scene',
}

// ── ev_home_mold ──────────────────────────────────────────────────────────────
// The wall behind the bed has started to breathe.
const moldScene: SceneDef = {
  id: 'ev_home_mold_scene',
  channel: 'dialog',
  title: 'The Wall',
  start: 'wall',
  nodes: {
    wall: {
      speaker: 'narrator',
      text: [
        'It started as a shadow in the corner behind the bed. Now it\'s a continent, grey-green and velvety, with a smell like wet cardboard that follows your clothes to work. You\'ve had a cough for two weeks. It gets worse at night.',
        { if: { housing: 'studio_flat' }, text: 'The arcade downstairs has been shuttered for a decade, and apparently it has been leaking into your wall the whole time.' },
        { if: { housing: 'shared_room' }, text: 'Priscilla, the nursing student, looked at it and said a word you have never heard her say.' },
        { if: withGrace, text: 'Grace took one look at it last weekend and told you, in her ER voice, that you are not to sleep in that room. You slept in that room.' },
      ],
      choices: [
        {
          tag: '[Business]',
          text: 'Write the landlord a letter citing the housing code by section number, with photos, and a copy to the city.',
          check: {
            skill: 'business',
            dc: 15,
            bonuses: [
              { if: { trait: 'bookworm' }, add: 2, label: '+2 (you read the whole code at the library)' },
              { if: { faction: 'fac.hood', gte: 30 }, add: 1, label: '+1 (the tenants\' association knows your name)' },
            ],
            success: 'letter_win',
            fail: 'letter_lose',
          },
        },
        {
          tag: '[Fitness]',
          text: 'Scrub it out yourself: gloves, a mask, a bucket, a weekend and every window open.',
          check: {
            skill: 'fitness',
            dc: 14,
            bonuses: [
              { if: { trait: 'gym_rat' }, add: 2, label: '+2 (gym rat)' },
              { if: { trait: 'glass_cannon' }, add: -2, label: '-2 (glass cannon)' },
            ],
            success: 'scrub_win',
            fail: 'scrub_lose',
          },
        },
        {
          text: 'Move the bed, hang a poster over it, and pretend.',
          effects: [buff(DAMP_COUGH), { scene: 'ev_home_mold_cough_scene', delayHours: 24 * 45 }],
          goto: 'ignore',
        },
      ],
    },
    letter_win: {
      speaker: 'narrator',
      text: 'The landlord calls within a day, voice tight, and sends two men in masks who tear out the wall, find the leak, and fix it properly. A week later a note arrives knocking a little off your rent "in recognition of the inconvenience," which is landlord for "please stop writing to the city."',
      effects: [buff(RENT_BREAK), { xp: 'business', add: 20 }],
    },
    letter_lose: {
      speaker: 'narrator',
      text: [
        'The landlord sends one man with a can of paint. He paints over the mold. It comes back through the paint in eleven days, like a ghost in a sheet.',
        'Two weeks later, a notice: rent is going up "to fund building improvements." You know exactly which tenant the improvements are for.',
      ],
      effects: [buff(DAMP_COUGH), owe('ev_home_rent_hike', 'Rent increase ("improvements")', 4, 120), { stat: 'stress', add: 8 }],
    },
    scrub_win: {
      speaker: 'narrator',
      text: 'It takes the whole weekend, three buckets, a lot of bleach and a playlist that gets progressively more aggressive. By Sunday night the wall is bare plaster and the room smells like a swimming pool. The cough fades within a week. You feel like you won a war.',
      effects: [{ stat: 'health', add: -3 }, { stat: 'mood', add: 5 }],
    },
    scrub_lose: {
      speaker: 'narrator',
      text: [
        'The mask doesn\'t fit right. You don\'t notice until you\'re two hours in and the room is spinning. The wall looks better. You look worse.',
        'The cough goes deeper after that. It doesn\'t feel like it\'s going anywhere.',
      ],
      effects: [
        buff(DAMP_COUGH),
        { stat: 'health', add: -12 },
        { chance: 0.5, then: [{ trait: 'ev_home_damp_lungs' }] },
        { chance: 0.25, then: [{ complication: 'health' }] },
      ],
    },
    ignore: {
      speaker: 'narrator',
      text: 'The poster is of a beach. The irony is not lost on you. At night, lying in the dark, you can hear the wall breathing, and — increasingly — yourself.',
    },
  },
}

const moldCoughScene: SceneDef = {
  id: 'ev_home_mold_cough_scene',
  channel: 'dialog',
  title: 'The Cough',
  start: 'cough',
  nodes: {
    cough: {
      speaker: 'narrator',
      text: [
        'Six weeks behind the beach poster. The cough has moved in and started paying rent. You wake up at four every morning with a chest like a wet paper bag, and climbing the stairs to your door leaves you leaning on the rail.',
        { if: withGrace, text: 'Grace has stopped asking and started leaving pamphlets on your pillow.' },
      ],
      choices: [
        {
          text: 'See a doctor. Actually go. ($120)',
          req: { stat: 'money', gte: 120 },
          reqText: 'Requires $120',
          effects: [{ money: -120 }, { stat: 'health', add: 8 }],
          goto: 'doctor',
        },
        {
          tag: '[Fitness]',
          text: 'Sleep on the couch, open the windows, and outlast it.',
          check: {
            skill: 'fitness',
            dc: 14,
            bonuses: [{ if: { trait: 'gym_rat' }, add: 2, label: '+2 (gym rat)' }],
            success: 'outlast',
            fail: 'scarred',
          },
        },
      ],
    },
    doctor: {
      speaker: 'narrator',
      text: 'The doctor listens to your chest for a long time, asks where you live, and writes "MOVE" on the back of the prescription in block capitals. The antibiotics work. You tear down the beach poster and finally call the landlord about the wall, and this time you don\'t hang up.',
    },
    outlast: {
      speaker: 'narrator',
      text: 'Two weeks on the couch with the windows open in all weather, and the cough loosens its grip one morning at a time. You get lucky. You know you got lucky.',
      effects: [{ stat: 'health', add: -4 }],
    },
    scarred: {
      speaker: 'narrator',
      text: 'It doesn\'t go. It settles — deep, permanent, a rattle at the bottom of every breath that the doctor you finally see calls "reactive" and "chronic" and "something you\'ll manage." You manage. You sleep worse. You can smell mold from the hallway of any building you walk into, for the rest of your life.',
      effects: [{ trait: 'ev_home_damp_lungs' }, { stat: 'health', add: -8 }],
    },
  },
}

const mold: EventDef = {
  id: 'ev_home_mold',
  category: 'health',
  when: { all: [{ housing: ['shared_room', 'studio_flat', 'millgate_onebed'] }, actGte(2), between(400, 2600), free] },
  scene: 'ev_home_mold_scene',
}

export default defineContent({
  events: [roommateRent, creditCard, kimBoyfriend, mold],
  scenes: [roommateRentScene, subletterScene, cardScene, cardStatementScene, kimBoyfriendScene, moldScene, moldCoughScene],
  quests: [subletterQuest],
})
