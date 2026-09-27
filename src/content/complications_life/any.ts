/**
 * COMPLICATION PACK — 'any' source: generic-but-good misfortune.
 *
 * The catch-all pool. Any fail branch that passes { complication: 'any' } (and the engine's own
 * fallback when no source-specific complication fits) can pull one of these. They lean on the
 * everyday disasters that don't care what track you're on: a stolen wallet, a clean-looking scam,
 * a landlord with leverage, and a letter from the revenue office. Marks: fixed-term obligations,
 * double-edged scars, and the occasional forced move.
 *
 * Recurrence: each story fires once (the engine never re-opens a finished quest). The wallet, the
 * scam and the landlord are the kind of thing that happens to a person twice, so each has a
 * second, different variant (a stolen bag, a fake invoice, a rent hike) with its own scene and
 * quest. A sequel waits until the first quest is over AND at least a year has passed, and its
 * text remembers how the first one went. That caps each at two occurrences per run. The tax
 * letter happens once; ignoring it brings a follow-up letter with real ways out.
 */
import { defineContent } from '@/engine/registry'
import type { EventDef, QuestDef, SceneDef } from '@/engine/types'
import { CX_SCRAPING } from './marks'
import { ending, has, owe, questOver, renting, stamp, stampedAgo } from './_shared'

// ─────────────────────────────────────────────────────────────────────────────
// cx_life_wallet — mugged / lifted / lost, and the aftermath
// ─────────────────────────────────────────────────────────────────────────────
const walletScene: SceneDef = {
  id: 'cx_life_wallet_scene',
  channel: 'dialog',
  title: 'The Empty Pocket',
  start: 'open',
  nodes: {
    open: {
      speaker: 'narrator',
      text: [
        'You reach for it and it\'s not there. Not-there in the specific, cold way that means it isn\'t coming back — the bus, the crowd, the guy who bumped you and apologized a little too warmly.',
        'Cash, cards, your ID, the scrap of paper with the thing written on it you never memorized. Gone in the time it takes to say sorry.',
      ],
      effects: [{ money: -80 }],
      choices: [
        {
          text: 'Cancel everything now, file the report, lock it all down fast.',
          tag: '[OpSec DC 13]',
          check: {
            skill: 'opsec',
            dc: 13,
            success: 'locked',
            fail: 'exposed',
            successEffects: [{ flag: 'cx_life.wallet_locked' }, { quest: 'cx_life_wallet_q', objective: 'handled' }],
            failEffects: [{ flag: 'cx_life.wallet_exposed' }, { quest: 'cx_life_wallet_q', objective: 'handled' }],
          },
        },
        {
          text: 'Deal with the paperwork tomorrow. You\'re exhausted.',
          effects: [{ flag: 'cx_life.wallet_slow' }, { quest: 'cx_life_wallet_q', objective: 'handled' }],
          goto: 'slow',
        },
        {
          text: 'Chase the guy. You saw which way he went.',
          tag: '[Fitness DC 15]',
          check: {
            skill: 'fitness',
            dc: 15,
            success: 'caught',
            fail: 'lost_him',
            successEffects: [{ flag: 'cx_life.wallet_recovered' }, { quest: 'cx_life_wallet_q', objective: 'handled' }],
            failEffects: [{ flag: 'cx_life.wallet_exposed' }, { quest: 'cx_life_wallet_q', objective: 'handled' }],
          },
        },
      ],
    },
    locked: {
      speaker: 'narrator',
      text: 'You move fast and clean: cards dead within the hour, a report filed, new locks on everything that has a lock. Whoever took it gets a wallet full of dead plastic and a lesson in picking a slower target. It cost you an evening and a replacement fee, and nothing worse.',
      effects: [{ money: -60 }, { xp: 'opsec', add: 40 }, { trait: 'cx_life_street_smart' }],
    },
    exposed: {
      speaker: 'narrator',
      text: [
        'You\'re too slow, or too rattled, and by the time you\'ve cancelled the last card there\'s already a charge you didn\'t make and a small, sick feeling that someone out there is wearing your name.',
        'Sorting it out is weeks of phone calls, and it leaves a smudge on your credit that takes a lot longer to scrub than to make.',
      ],
      effects: [{ money: -160 }, { trait: 'cx_life_bad_credit' }],
    },
    slow: {
      speaker: 'narrator',
      text: 'Tomorrow turns into the day after, and in the gap someone has a very productive shopping trip on your dime. It\'s all technically reversible and entirely miserable, a month of disputed charges and hold music.',
      effects: [{ money: -220 }, { buff: CX_SCRAPING }, { trait: 'cx_life_bad_credit' }],
    },
    caught: {
      speaker: 'narrator',
      text: [
        'You run him down two blocks later — turns out you\'re faster than you look and he\'s softer than he acts. He drops the wallet and his dignity and bolts, and you stand there, heart pounding, holding your own life back in your hand.',
        'You do not recommend the experience. You are, secretly, a little proud of it.',
      ],
      effects: [{ money: 60 }, { xp: 'fitness', add: 45 }, { trait: 'cx_life_street_smart' }, { stat: 'mood', add: 3 }],
    },
    lost_him: {
      speaker: 'narrator',
      text: 'You lose him at the corner, wheezing, hands on your knees, having achieved nothing except confirming you need to hit the gym. Now you\'re out the wallet AND you skipped the part where you cancel the cards while there was still time.',
      effects: [{ money: -160 }, { stat: 'energy', add: -8 }, { trait: 'cx_life_bad_credit' }],
    },
  },
}

const walletQuest: QuestDef = {
  id: 'cx_life_wallet_q',
  title: 'Complication: The Empty Pocket',
  kind: 'personal',
  priority: 3,
  rewards: 'Contain the damage',
  summary: 'Cash, cards, and your ID, gone in the time it takes a stranger to say sorry. What happens next depends on how fast you move.',
  start: 's1',
  stages: {
    s1: {
      text: 'Your wallet\'s gone. Lock everything down fast, put it off, or chase the guy.',
      objectives: [
        { id: 'handled', text: 'React to the theft', when: { never: true }, hint: 'The dialog "The Empty Pocket" opens it — lock it all down [OpSec DC 13], deal with it tomorrow, or chase him [Fitness DC 15].' },
      ],
      next: [
        { if: { flag: 'cx_life.wallet_exposed' }, stage: 'fraud' },
        { stage: 'contained' },
      ],
    },
    contained: ending('You moved fast and kept the damage to an annoyance. That\'s the best you can do with a stranger and a crowd.', 'completed'),
    fraud: ending('It got messy — a charge you didn\'t make, a name that isn\'t quite yours anymore. Weeks of phone calls to un-ring that bell.', 'failed'),
  },
}

const wallet: EventDef = {
  id: 'cx_life_wallet',
  category: 'life',
  complication: { sources: ['any'], minTier: 1, maxTier: 3 },
  effects: [{ quest: 'cx_life_wallet_q', start: true }, ...stamp('wallet')],
  scene: 'cx_life_wallet_scene',
}

// ─────────────────────────────────────────────────────────────────────────────
// cx_life_scam — a deal too good, and you almost fell for it (or did)
// ─────────────────────────────────────────────────────────────────────────────
const scamScene: SceneDef = {
  id: 'cx_life_scam_scene',
  channel: 'mail',
  title: 'CONGRATULATIONS — Time-Sensitive',
  from: 'A Very Official-Looking Sender',
  start: 'note',
  nodes: {
    note: {
      speaker: 'A Very Official-Looking Sender',
      text: [
        'It\'s dressed up nicely — a logo, a case number, a tone of bored authority. A refund you\'re owed, or a prize you won, or an urgent problem with an account, and all you have to do is confirm a few details and send a small fee to release the large sum.',
        'The thing is, you\'re smart, and you\'re tired, and it\'s arrived on exactly the day you needed some good news. That\'s not an accident. That\'s the whole design.',
      ],
      choices: [
        {
          text: 'Sniff it. Pick apart the details until it falls apart.',
          tag: '[Business DC 13]',
          check: {
            skill: 'business',
            dc: 13,
            success: 'spotted',
            fail: 'bit',
            successEffects: [{ flag: 'cx_life.scam_spotted' }, { quest: 'cx_life_scam_q', objective: 'handled' }],
            failEffects: [{ flag: 'cx_life.scam_bit' }, { quest: 'cx_life_scam_q', objective: 'handled' }],
          },
        },
        {
          text: 'Waste their time. String the scammer along for sport.',
          tag: '[Social DC 14]',
          check: {
            skill: 'social',
            dc: 14,
            success: 'trolled',
            fail: 'bit',
            successEffects: [{ flag: 'cx_life.scam_trolled' }, { quest: 'cx_life_scam_q', objective: 'handled' }],
            failEffects: [{ flag: 'cx_life.scam_bit' }, { quest: 'cx_life_scam_q', objective: 'handled' }],
          },
        },
        {
          text: 'It looks legit enough, and you could really use the money. Send the fee.',
          tag: '[Take the bait]',
          effects: [{ money: -180 }, { flag: 'cx_life.scam_bit' }, { quest: 'cx_life_scam_q', objective: 'handled' }],
          goto: 'bit',
        },
      ],
    },
    spotted: {
      speaker: 'narrator',
      text: 'You lay it out flat and every seam shows: the fee to receive money, the pressure, the address that\'s almost-but-not a real one. You delete it, a little insulted they thought you\'d bite. The next one that comes, you\'ll spot in three seconds.',
      effects: [{ xp: 'business', add: 40 }, { trait: 'cx_life_hard_way' }],
    },
    trolled: {
      speaker: 'narrator',
      text: 'You reply as the most confused, chatty, detail-hungry mark alive, and you waste an impressive amount of a scammer\'s afternoon before they rage-quit the thread. It changes nothing and helps no one and it is deeply, pettily satisfying.',
      effects: [{ stat: 'mood', add: 4 }, { xp: 'social', add: 35 }],
    },
    bit: {
      speaker: 'narrator',
      text: [
        'You send it, and the moment the money\'s gone the mask drops — a follow-up asking for "one more small fee," and that\'s when you feel the floor go. There is no prize. There was never a prize. There was you, tired, on the right day.',
        'The money\'s not coming back. What you keep is the lesson, which is expensive but permanent.',
      ],
      effects: [{ trait: 'cx_life_hard_way' }, { stat: 'mood', add: -5 }],
    },
  },
}

const scamQuest: QuestDef = {
  id: 'cx_life_scam_q',
  title: 'Complication: Too Good to Be True',
  kind: 'personal',
  priority: 2,
  rewards: 'Learn a cheap lesson (or an expensive one)',
  summary: 'A too-good deal landed on exactly the day you needed good news. That timing wasn\'t luck — it was the design.',
  start: 's1',
  stages: {
    s1: {
      text: 'A scam that\'s better-targeted than it looks. Debunk it, troll it, or fall for it.',
      objectives: [
        { id: 'handled', text: 'Respond to the offer', when: { never: true }, hint: 'Answer the "CONGRATULATIONS" mail — pick it apart [Business DC 13], waste their time [Social DC 14], or take the bait.' },
      ],
      next: 'done',
    },
    done: ending('However that went, you\'ll read the next one more carefully. The lesson sticks either way.', 'completed'),
  },
}

const scam: EventDef = {
  id: 'cx_life_scam',
  category: 'money',
  complication: { sources: ['any'], minTier: 1, maxTier: 3 },
  effects: [{ quest: 'cx_life_scam_q', start: true }, ...stamp('scam')],
  scene: 'cx_life_scam_scene',
}

// ─────────────────────────────────────────────────────────────────────────────
// cx_life_landlord — the landlord finds leverage
// ─────────────────────────────────────────────────────────────────────────────
const landlordScene: SceneDef = {
  id: 'cx_life_landlord_scene',
  channel: 'mail',
  title: 'NOTICE — Please Read Carefully',
  from: 'Your Landlord',
  start: 'note',
  nodes: {
    note: {
      speaker: 'Your Landlord',
      text: [
        'Your landlord has never sent a nicely-formatted letter before, which is the first bad sign. The second is the phrase "in accordance with the lease," which appears four times.',
        '"It has come to my attention that the unit is being used for business purposes / has hosted excessive visitors / has generated complaints. Per the lease, I am within my rights to [several unpleasant options]. I\'d prefer to resolve this amicably. A conversation, and perhaps an adjusted deposit, would go a long way."',
        'Translated: they\'ve noticed the "work calls" and the strangers, they smell money, and they\'ve decided you\'re a problem worth being paid to overlook.',
      ],
      choices: [
        {
          text: 'Know your rights. Push back on the lease terms, firmly and correctly.',
          tag: '[Business DC 16]',
          check: {
            skill: 'business',
            dc: 16,
            success: 'stood_ground',
            fail: 'squeezed',
            successEffects: [{ flag: 'cx_life.landlord_won' }, { quest: 'cx_life_landlord_q', objective: 'handled' }],
            failEffects: [{ flag: 'cx_life.landlord_squeezed' }, { quest: 'cx_life_landlord_q', objective: 'handled' }],
          },
        },
        {
          text: 'Pay the "adjusted deposit" and make it go away.',
          tag: '[$300]',
          req: { stat: 'money', gte: 300 },
          reqText: 'Requires $300',
          effects: [{ money: -300 }, { flag: 'cx_life.landlord_paid' }, { quest: 'cx_life_landlord_q', objective: 'handled' }],
          goto: 'paid',
        },
        {
          text: 'Clean up your act — quiet hours, no visitors, keep your head down.',
          effects: [{ flag: 'cx_life.landlord_complied' }, { buff: { ...CX_SCRAPING, id: 'cx_life_walking_soft', name: 'Walking on Eggshells', desc: 'You\'re being a model tenant on purpose. No noise, no strangers, no room to work.', mods: [{ key: 'hack.speed', mult: 0.9 }, { key: 'freelance.speed', mult: 0.9 }, { key: 'heat.decay', add: 0.3 }] } }, { quest: 'cx_life_landlord_q', objective: 'handled' }],
          goto: 'comply',
        },
      ],
    },
    stood_ground: {
      speaker: 'narrator',
      text: 'You reply with a calm, correct, citation-heavy letter of your own that makes it very clear you\'ve read the same lease they have, and the relevant statutes besides. The nice formatting stops. So do the notices. Bullies with clipboards fold fast when you push back in their own language.',
      effects: [{ xp: 'business', add: 55 }, { trait: 'cx_life_street_smart' }],
    },
    squeezed: {
      speaker: 'narrator',
      text: [
        'You try to fight it and get out-lawyered by a man with more experience and less to lose. The choice narrows to a bad one: pay a punitive new deposit you can\'t really spare, or be out by the end of the month.',
      ],
      choices: [
        {
          text: 'Pay up and stay.',
          tag: '[$450]',
          req: { stat: 'money', gte: 450 },
          reqText: 'Requires $450',
          effects: [{ money: -450 }, { buff: CX_SCRAPING }, { flag: 'cx_life.landlord_paid' }],
        },
        {
          text: 'Can\'t afford it. Move somewhere cheaper.',
          effects: [{ housing: 'shared_room' }, owe('cx_life_moving', 'Moving costs', 8, 21), { buff: CX_SCRAPING }, { notify: 'You had to move to a cheaper place on short notice.', kind: 'bad' }],
        },
      ],
    },
    paid: {
      speaker: 'narrator',
      text: 'You pay the "deposit" you\'ll never see again and the letters stop. It\'s a shakedown with letterhead, and you both know it, and you both pretend otherwise. Peace, rented by the season.',
      effects: [{ stat: 'stress', add: 3 }],
    },
    comply: {
      speaker: 'narrator',
      text: 'You go quiet and clean and boring, a model tenant, which keeps the landlord happy and makes your actual life very hard to run out of this apartment. The pressure eases. So does your throughput.',
      effects: [{ stat: 'stress', add: 2 }],
    },
  },
}

const landlordQuest: QuestDef = {
  id: 'cx_life_landlord_q',
  title: 'Complication: In Accordance With the Lease',
  kind: 'personal',
  priority: 4,
  rewards: 'Keep your home on your terms',
  summary: 'Your landlord noticed the "work calls," smelled money, and decided you\'re a problem worth being paid to overlook.',
  start: 's1',
  stages: {
    s1: {
      text: 'The landlord found leverage. Know your rights and push back, pay the shakedown, or become a model tenant.',
      objectives: [
        { id: 'handled', text: 'Handle the landlord', when: { never: true }, hint: 'Answer the "NOTICE" mail — push back [Business DC 16], pay the deposit ($300), or clean up your act.' },
      ],
      next: 'done',
    },
    done: ending('However it settled, you learned exactly how much your privacy is worth to the person who holds the keys.', 'completed'),
  },
}

const landlord: EventDef = {
  id: 'cx_life_landlord',
  category: 'life',
  when: renting,
  complication: { sources: ['any'], minTier: 1, maxTier: 4 },
  effects: [{ quest: 'cx_life_landlord_q', start: true }, ...stamp('landlord')],
  scene: 'cx_life_landlord_scene',
}

// ─────────────────────────────────────────────────────────────────────────────
// cx_life_tax_letter — the revenue office would like a word
// ─────────────────────────────────────────────────────────────────────────────
const taxScene: SceneDef = {
  id: 'cx_life_tax_scene',
  channel: 'mail',
  title: 'OFFICIAL NOTICE — Response Required',
  from: 'The Revenue Office',
  start: 'note',
  nodes: {
    note: {
      speaker: 'The Revenue Office',
      text: [
        'This one is real. You can tell because it\'s boring, and because your stomach drops before you\'ve finished the first line.',
        '"Our records indicate a discrepancy between reported income and third-party filings for the period in question. A response is required within 30 days. Failure to respond may result in assessment of additional tax, penalties, and interest."',
        'Somewhere in the cash-and-favors economy you\'ve been running, a number didn\'t match a number, and a very patient machine noticed.',
      ],
      choices: [
        {
          text: 'Get it right yourself — reconstruct the records, respond clean.',
          tag: '[Business DC 17]',
          check: {
            skill: 'business',
            dc: 17,
            success: 'clean',
            fail: 'owe',
            successEffects: [{ flag: 'cx_life.tax_clean' }, { quest: 'cx_life_tax_q', objective: 'handled' }],
            failEffects: [{ flag: 'cx_life.tax_owe' }, { quest: 'cx_life_tax_q', objective: 'handled' }],
          },
        },
        {
          text: 'Hire someone who does this for a living. Pay for peace of mind.',
          tag: '[$350]',
          req: { stat: 'money', gte: 350 },
          reqText: 'Requires $350',
          effects: [{ money: -350 }, { flag: 'cx_life.tax_pro' }, { quest: 'cx_life_tax_q', objective: 'handled' }],
          goto: 'pro',
        },
        {
          text: 'Ignore it and hope it\'s a form letter.',
          tag: '[Ignore]',
          effects: [{ flag: 'cx_life.tax_ignored' }, { quest: 'cx_life_tax_q', objective: 'handled' }],
          goto: 'ignore',
        },
      ],
    },
    clean: {
      speaker: 'narrator',
      text: 'You spend a grim weekend reconstructing a year of chaos into something that adds up, and you respond with a straight face and straight numbers. It turns out the discrepancy was mostly theirs. The file closes. You never want to feel that particular fear again, so you start keeping actual books.',
      effects: [{ xp: 'business', add: 65 }, { trait: 'cx_life_hard_way' }],
    },
    owe: {
      speaker: 'narrator',
      text: 'You try to sort it yourself and get some of it wrong, and the machine, unimpressed, sends back an assessment with penalties and interest attached. It\'s payable — on a plan, about five months of it — and it\'ll follow you every one of those months.',
      effects: [owe('cx_life_tax_debt', 'Back taxes (payment plan)', 12, 150), { stat: 'stress', add: 6 }],
    },
    pro: {
      speaker: 'narrator',
      text: 'The professional you hire has seen far worse and says so, reassuringly. They find deductions you didn\'t know existed, respond in a language the office respects, and make the whole thing go away for the price of their fee plus a modest, fair balance. Worth every dollar.',
      effects: [owe('cx_life_tax_debt', 'Back taxes (settled small)', 7, 42), { trait: 'cx_life_hard_way' }],
    },
    ignore: {
      speaker: 'narrator',
      text: [
        'It is not a form letter. Ignored, it becomes a bigger letter, then a lien-shaped one, then the kind of official attention you least want given the other things you do. The bill compounds while you pretend not to see it.',
        'This is the one kind of trouble that gets worse specifically because you looked away.',
      ],
      effects: [
        owe('cx_life_tax_debt', 'Back taxes (penalties mounting)', 18, 240),
        { stat: 'heat', add: 4 },
        { scene: 'cx_life_tax_final', delayHours: 24 * 7 * 6 },
      ],
    },
  },
}

const taxQuest: QuestDef = {
  id: 'cx_life_tax_q',
  title: 'Complication: A Discrepancy',
  kind: 'personal',
  priority: 5,
  rewards: 'Square things with the taxman',
  summary: 'Somewhere in your cash-and-favors economy, a number didn\'t match a number, and a very patient machine noticed. The revenue office wants a word.',
  start: 's1',
  stages: {
    s1: {
      text: 'The revenue office found a discrepancy. Sort it yourself, hire a pro, or ignore it and hope.',
      objectives: [
        { id: 'handled', text: 'Respond to the notice', when: { never: true }, hint: 'Answer the "OFFICIAL NOTICE" mail — reconstruct it yourself [Business DC 17], hire a pro ($350), or ignore it.' },
      ],
      next: [
        { if: { flag: 'cx_life.tax_clean' }, stage: 'clear' },
        { if: { flag: 'cx_life.tax_ignored' }, stage: 'dodging' },
        { stage: 'owing' },
      ],
    },
    clear: ending('The file closed clean. You started keeping actual books, which is the real thing this cost you — and the best thing.', 'completed'),
    dodging: {
      text: 'You ignored the letter, and the penalties are running. The revenue office does not forget; a second, firmer letter is on its way.',
      objectives: [
        { id: 'final', text: 'Answer the final notice', when: { never: true }, hint: 'A "FINAL NOTICE" from the Revenue Office arrives in Mail about six weeks after you ignored the first one. It is your chance to pay it off, negotiate it down [Business DC 15], or keep ignoring it.' },
      ],
      next: [
        { if: { not: { obligation: 'cx_life_tax_debt' } }, stage: 'paid' },
        { if: { flag: 'cx_life.tax_garnished' }, stage: 'garnished' },
        { stage: 'owing' },
      ],
    },
    owing: {
      text: 'You owe back taxes on a fixed-term plan now. It isn\'t going anywhere, but it isn\'t forever either — every week is one installment closer to done.',
      objectives: [
        { id: 'settle', text: 'Pay off the back taxes', when: { not: { obligation: 'cx_life_tax_debt' } }, hint: 'The plan has a fixed term (see its end date in the Obligations panel). Keep enough money coming in to cover it; the quest closes when the last installment clears.' },
      ],
      next: 'paid',
    },
    garnished: {
      text: 'You ignored the final notice too, and now the revenue office takes its share before you ever see it. Heavier, and on your record, but it has an end date.',
      objectives: [
        { id: 'settle', text: 'Outlast the garnishment', when: { not: { obligation: 'cx_life_tax_debt' } }, hint: 'The garnishment runs for a fixed term (its end date is in the Obligations panel). Keep money coming in until it clears.' },
      ],
      next: 'paid_hard',
    },
    paid: ending('The last of it cleared. The revenue office goes back to not knowing your name, which is exactly how you like it. You keep books now. Real ones.', 'completed'),
    paid_hard: ending('It\'s over, the expensive way. The money is gone, the record stays, and you open every envelope the day it arrives now.', 'failed'),
  },
}

const taxFinalScene: SceneDef = {
  id: 'cx_life_tax_final',
  channel: 'mail',
  title: 'FINAL NOTICE — Intent to Collect',
  from: 'The Revenue Office',
  start: 'note',
  nodes: {
    note: {
      speaker: 'The Revenue Office',
      text: [
        'The second letter doesn\'t bother being boring. It has a box around the important part, and the important part is in bold.',
        '"Our previous notice regarding the period in question has not received a response. Penalties and interest continue to accrue. If this balance is not resolved, we will proceed to collect it directly from your income and accounts."',
        'Below that, in small type, a phone number and the one sentence that matters: "Taxpayers who contact this office before collection begins may be eligible for a reduced settlement."',
      ],
      choices: [
        {
          text: 'Pay the whole balance, penalties and all. Make it stop.',
          tag: '[$1100]',
          req: has(1100),
          reqText: 'Requires $1100',
          effects: [{ money: -1100 }, { removeObligation: 'cx_life_tax_debt' }, { flag: 'cx_life.tax_settled' }, { quest: 'cx_life_tax_q', objective: 'final' }],
          goto: 'paid',
        },
        {
          text: 'Call the number. Be polite, be organized, and ask for that reduced settlement.',
          tag: '[Business DC 15]',
          check: {
            skill: 'business',
            dc: 15,
            success: 'negotiated',
            fail: 'refused',
            successEffects: [
              { removeObligation: 'cx_life_tax_debt' },
              owe('cx_life_tax_debt', 'Back taxes (negotiated plan)', 12, 60),
              { quest: 'cx_life_tax_q', objective: 'final' },
            ],
            failEffects: [{ quest: 'cx_life_tax_q', objective: 'final' }],
          },
        },
        {
          text: 'Put it in the drawer with the first one.',
          tag: '[Ignore]',
          effects: [
            { removeObligation: 'cx_life_tax_debt' },
            owe('cx_life_tax_debt', 'Back taxes (garnished)', 22, 200),
            { flag: 'cx_life.tax_garnished' },
            { trait: 'cx_life_bad_credit' },
            { stat: 'heat', add: 4 },
            { quest: 'cx_life_tax_q', objective: 'final' },
          ],
          goto: 'garnished',
        },
      ],
    },
    paid: {
      speaker: 'narrator',
      text: 'It hurts to send and it is worth every cent to be done. The penalties stop the same day. A week later a flat, bureaucratic letter confirms the account is closed, and you put it in a folder you label, for the first time in your life, TAXES.',
      effects: [{ stat: 'stress', add: -6 }, { trait: 'cx_life_hard_way' }],
    },
    negotiated: {
      speaker: 'narrator',
      text: [
        'You call with every number in front of you, apologize once, and then talk like someone who intends to pay. The clerk on the other end has heard every excuse there is; yours is refreshingly short.',
        'The penalties get knocked down and the rest goes on a short plan. Two months of pain instead of eight.',
      ],
      effects: [
        { xp: 'business', add: 50 },
        { stat: 'stress', add: -3 },
      ],
    },
    refused: {
      speaker: 'narrator',
      text: 'You call, get transferred three times, and end up with someone who reads you the policy word for word and then reads it again. No reduction. The penalty plan stays exactly as it was, but at least collection is off the table for as long as you keep paying.',
      effects: [{ stat: 'stress', add: 4 }],
    },
    garnished: {
      speaker: 'narrator',
      text: [
        'Future-you inherits the problem sooner than expected. The next paycheck is short, and so is the one after, and a form letter explains that it will keep being short for the better part of a year.',
        'Worse, the file is open now, with your name on it, in an office that talks to other offices.',
      ],
      effects: [{ complication: 'legal' }],
    },
  },
}

const taxLetter: EventDef = {
  id: 'cx_life_tax_letter',
  category: 'money',
  complication: { sources: ['any'], minTier: 2, maxTier: 5 },
  effects: [{ quest: 'cx_life_tax_q', start: true }],
  scene: 'cx_life_tax_scene',
}

// ─────────────────────────────────────────────────────────────────────────────
// cx_life_bag — second variant of the wallet: the whole bag, laptop and all
// (a year or more after the wallet story ended; remembers how that went)
// ─────────────────────────────────────────────────────────────────────────────
const bagScene: SceneDef = {
  id: 'cx_life_bag_scene',
  channel: 'dialog',
  title: 'The Chair Where Your Bag Was',
  start: 'open',
  nodes: {
    open: {
      speaker: 'narrator',
      text: [
        'You look up from the counter for maybe forty seconds — a refill, a napkin, a stupid joke with the kid at the register — and when you turn around, the chair is just a chair.',
        'Your bag. Your machine inside it. Your notes, your chargers, the half-finished work that lives on that drive and nowhere else.',
        { if: { flag: 'cx_life.wallet_locked' }, text: 'Last time it was your wallet, and you had it locked down inside the hour. Your hands already know the drill.' },
        { if: { any: [{ flag: 'cx_life.wallet_exposed' }, { flag: 'cx_life.wallet_slow' }] }, text: 'Last time it was your wallet, and you were slow, and you paid for slow for months. Not again. Not this time.' },
        { if: { flag: 'cx_life.wallet_recovered' }, text: 'Last time you ran a thief down in the street. This one is long gone; there is nobody to chase, just a door still swinging.' },
      ],
      choices: [
        {
          text: 'Seal it off from here. Kill every session and password the machine ever knew.',
          tag: '[OpSec DC 14]',
          check: {
            skill: 'opsec',
            dc: 14,
            bonuses: [{ if: { trait: 'cx_life_street_smart' }, add: 2, label: '+2 (Street Smart: you\'ve done this before)' }],
            success: 'sealed',
            fail: 'leaky',
            successEffects: [{ flag: 'cx_life.bag_sealed' }, { quest: 'cx_life_bag_q', objective: 'handled' }],
            failEffects: [{ flag: 'cx_life.bag_leaky' }, { quest: 'cx_life_bag_q', objective: 'handled' }],
          },
        },
        {
          text: 'Work the room. Somebody in here saw something, and people talk to a friendly face.',
          tag: '[Social DC 15]',
          check: {
            skill: 'social',
            dc: 15,
            success: 'found',
            fail: 'shrugs',
            successEffects: [{ flag: 'cx_life.bag_found' }, { quest: 'cx_life_bag_q', objective: 'handled' }],
            failEffects: [{ flag: 'cx_life.bag_lost' }, { quest: 'cx_life_bag_q', objective: 'handled' }],
          },
        },
        {
          text: 'Write it off. File the report, buy a new machine, rebuild from what you remember.',
          tag: '[$450]',
          req: has(450),
          reqText: 'Requires $450',
          effects: [{ money: -450 }, { flag: 'cx_life.bag_lost' }, { quest: 'cx_life_bag_q', objective: 'handled' }],
          goto: 'rebuild',
        },
      ],
    },
    sealed: {
      speaker: 'narrator',
      text: [
        'You borrow the café\'s phone and a quiet corner, and one by one you shut every door that machine could open. By the time the thief gets it home, it is a very nice brick with your name nowhere on it.',
        'You still need a new machine, and the work on that drive is gone. But nothing of yours walks out into the world wearing your face.',
      ],
      effects: [{ money: -380 }, { xp: 'opsec', add: 50 }, { trait: 'cx_life_street_smart' }, { buff: { ...CX_SCRAPING, id: 'cx_life_rebuilding', name: 'Rebuilding', desc: 'New machine, old habits, none of your tools set up the way your hands expect.', days: 14, mods: [{ key: 'hack.speed', mult: 0.88 }, { key: 'freelance.speed', mult: 0.88 }] } }],
    },
    leaky: {
      speaker: 'narrator',
      text: [
        'You get most of them. Most. Two days later a message goes out from one of your accounts to everyone you know, and it is not a message you wrote.',
        'Cleaning that up means apologizing to a lot of people, and changing things you should have changed years ago, and knowing that somewhere a stranger read your notes.',
      ],
      effects: [{ money: -380 }, { stat: 'heat', add: 5 }, { stat: 'cred', add: -2 }, { buff: CX_SCRAPING }],
    },
    found: {
      speaker: 'narrator',
      text: [
        'The kid at the register saw a guy in a grey jacket. The woman by the window saw which way he turned. The bus driver at the stop outside, bless him, saw the bag go under a seat.',
        'Forty minutes and a lot of friendliness later you have it back, one charger short, everything else intact. You buy the whole café a round of coffee and mean it.',
      ],
      effects: [{ money: -40 }, { xp: 'social', add: 50 }, { faction: 'fac.hood', add: 3 }, { stat: 'mood', add: 4 }],
    },
    shrugs: {
      speaker: 'narrator',
      text: 'Nobody saw anything. Nobody ever sees anything. You spend an hour being sympathized at and walk home with nothing but the strap mark still on your shoulder. The new machine comes out of the rent money.',
      effects: [{ money: -450 }, { stat: 'mood', add: -4 }, { buff: CX_SCRAPING }],
    },
    rebuild: {
      speaker: 'narrator',
      text: 'You don\'t chase it. You file the report, walk to the shop, and buy the machine you were going to buy next year anyway. Rebuilding from memory is slow and humbling, and some of it comes back better than it was.',
      effects: [{ xp: 'programming', add: 30 }, { stat: 'stress', add: 3 }],
    },
  },
}

const bagQuest: QuestDef = {
  id: 'cx_life_bag_q',
  title: 'Complication: The Empty Chair',
  kind: 'personal',
  priority: 3,
  rewards: 'Keep a stolen machine from becoming a stolen life',
  summary: 'Forty seconds with your back turned, and your bag walked out of the café with your machine inside it.',
  start: 's1',
  stages: {
    s1: {
      text: 'Your bag and your machine are gone. Seal it off remotely, work the room for witnesses, or write it off.',
      objectives: [
        { id: 'handled', text: 'React to the theft', when: { never: true }, hint: 'The dialog "The Chair Where Your Bag Was" opens it — seal it off [OpSec DC 14], ask around [Social DC 15], or pay to replace it ($450).' },
      ],
      next: [
        { if: { flag: 'cx_life.bag_leaky' }, stage: 'leaked' },
        { if: { flag: 'cx_life.bag_found' }, stage: 'recovered' },
        { stage: 'replaced' },
      ],
    },
    recovered: ending('A café full of strangers had your back. You got it all back, and learned which neighbors are worth knowing.', 'completed'),
    replaced: ending('The machine is gone, but nothing that matters went with it. New hardware, same you.', 'completed'),
    leaked: ending('A stranger wore your accounts for a couple of days. You cleaned it up, but some of it got read, and you can\'t unread it for them.', 'failed'),
  },
}

const bag: EventDef = {
  id: 'cx_life_bag',
  category: 'life',
  when: { all: [questOver('cx_life_wallet_q'), stampedAgo('wallet', 'cx_life_wallet', 365)] },
  complication: { sources: ['any'], minTier: 1, maxTier: 5 },
  effects: [{ quest: 'cx_life_bag_q', start: true }],
  scene: 'cx_life_bag_scene',
}

// ─────────────────────────────────────────────────────────────────────────────
// cx_life_invoice — second variant of the scam: a fake past-due invoice
// ─────────────────────────────────────────────────────────────────────────────
const invoiceScene: SceneDef = {
  id: 'cx_life_invoice_scene',
  channel: 'mail',
  title: 'INVOICE #88-4172 — PAST DUE',
  from: 'Accounts Receivable',
  start: 'note',
  nodes: {
    note: {
      speaker: 'Accounts Receivable',
      text: [
        'An invoice, addressed to you by name and business name, for "annual directory listing and domain services, renewal." Past due. A late fee already added, helpfully.',
        '"To avoid interruption of service and referral to our collections partner, please remit within 5 business days." It even has a little logo, a globe with a swoosh.',
        'You do buy services from people. You do lose track of renewals. That\'s exactly who this was written for.',
        { if: { flag: 'cx_life.scam_bit' }, text: 'Somewhere in your chest, an old bruise wakes up. The last time a letter was this confident, it cost you.' },
        { if: { any: [{ flag: 'cx_life.scam_spotted' }, { flag: 'cx_life.scam_trolled' }] }, text: 'It has the same smell as that "CONGRATULATIONS" mail, just wearing a better suit.' },
      ],
      choices: [
        {
          text: 'Check it against your own records. Every real vendor, every real renewal.',
          tag: '[Business DC 14]',
          check: {
            skill: 'business',
            dc: 14,
            bonuses: [{ if: { trait: 'cx_life_hard_way' }, add: 3, label: '+3 (Learned the Hard Way)' }],
            success: 'debunked',
            fail: 'paid',
            successEffects: [{ flag: 'cx_life.invoice_spotted' }, { quest: 'cx_life_invoice_q', objective: 'handled' }],
            failEffects: [{ money: -220 }, { flag: 'cx_life.invoice_paid' }, { quest: 'cx_life_invoice_q', objective: 'handled' }],
          },
        },
        {
          text: 'Report it to the Port Lumen business bureau and warn the folks on the board.',
          tag: '[Social DC 13]',
          check: {
            skill: 'social',
            dc: 13,
            success: 'warned',
            fail: 'ignored',
            successEffects: [{ flag: 'cx_life.invoice_spotted' }, { quest: 'cx_life_invoice_q', objective: 'handled' }],
            failEffects: [{ flag: 'cx_life.invoice_spotted' }, { quest: 'cx_life_invoice_q', objective: 'handled' }],
          },
        },
        {
          text: 'Pay it. You can\'t afford an interruption right now, whatever it is.',
          tag: '[$220]',
          req: has(220),
          reqText: 'Requires $220',
          effects: [{ money: -220 }, { flag: 'cx_life.invoice_paid' }, { quest: 'cx_life_invoice_q', objective: 'handled' }],
          goto: 'paid',
        },
      ],
    },
    debunked: {
      speaker: 'narrator',
      text: 'Your records are boring and complete, and nowhere in them is a globe with a swoosh. The "invoice" is a net thrown wide at every small business in the city, hoping a tired owner pays without looking. Not this owner. Delete, and a note in your books: never pay a stranger\'s renewal.',
      effects: [{ xp: 'business', add: 45 }, { stat: 'mood', add: 2 }],
    },
    warned: {
      speaker: 'narrator',
      text: [
        'You post a calm, specific warning on the local board. By evening, six other small shops have replied: they got the same letter. Two had already paid.',
        'Nobody gets their money back. But the next dozen people won\'t send it, and a few of them will remember whose post it was.',
      ],
      effects: [{ xp: 'social', add: 40 }, { stat: 'cred', add: 2 }, { faction: 'fac.hood', add: 2 }],
    },
    ignored: {
      speaker: 'narrator',
      text: 'The bureau sends a form reply. Your post on the board gets two replies, one of them a joke. You were right, and you didn\'t pay, and nobody cares, which is more or less how being right usually goes.',
      effects: [{ stat: 'mood', add: -1 }],
    },
    paid: {
      speaker: 'narrator',
      text: [
        'The money clears. Nothing is interrupted, because there was never anything to interrupt. A week later the same letter arrives again, with a new number, because a mark who pays once is a mark who goes on a list.',
        'You don\'t pay the second one. You do sit with the first one for a while.',
      ],
      effects: [{ stat: 'mood', add: -5 }, { trait: 'cx_life_hard_way' }],
    },
  },
}

const invoiceQuest: QuestDef = {
  id: 'cx_life_invoice_q',
  title: 'Complication: Past Due',
  kind: 'personal',
  priority: 2,
  rewards: 'Keep a fake bill from becoming a real loss',
  summary: 'A past-due invoice for a service you may or may not have bought, written for exactly the kind of busy person you have become.',
  start: 's1',
  stages: {
    s1: {
      text: 'An official-looking invoice wants money within five days. Check your own records, warn the neighborhood, or pay it.',
      objectives: [
        { id: 'handled', text: 'Deal with the invoice', when: { never: true }, hint: 'Answer the "INVOICE — PAST DUE" mail — check it against your records [Business DC 14], report and warn others [Social DC 13], or pay ($220).' },
      ],
      next: [
        { if: { flag: 'cx_life.invoice_paid' }, stage: 'stung' },
        { stage: 'dodged' },
      ],
    },
    dodged: ending('You didn\'t pay a stranger\'s renewal. You never will again, either.', 'completed'),
    stung: ending('You paid a bill for nothing. It\'s a small number, and a big lesson.', 'failed'),
  },
}

const invoice: EventDef = {
  id: 'cx_life_invoice',
  category: 'money',
  when: { all: [questOver('cx_life_scam_q'), stampedAgo('scam', 'cx_life_scam', 365)] },
  complication: { sources: ['any'], minTier: 1, maxTier: 5 },
  effects: [{ quest: 'cx_life_invoice_q', start: true }],
  scene: 'cx_life_invoice_scene',
}

// ─────────────────────────────────────────────────────────────────────────────
// cx_life_rent_hike — second variant of the landlord: the renewal with a new number
// ─────────────────────────────────────────────────────────────────────────────
const rentHikeScene: SceneDef = {
  id: 'cx_life_rent_hike_scene',
  channel: 'mail',
  title: 'Lease Renewal — New Terms',
  from: 'Your Landlord',
  start: 'note',
  nodes: {
    note: {
      speaker: 'Your Landlord',
      text: [
        'The renewal comes early, which is never good. Page one thanks you for being a valued tenant. Page two has the new rent on it, and the new rent is a number that made you sit down.',
        '"Due to rising costs in the area, the monthly rate will be adjusted as follows. Please sign and return by the first to secure your unit."',
        { if: { flag: 'cx_life.landlord_won' }, text: 'You notice the letter is very, very carefully worded this time. He remembers the last time you read the lease back to him.' },
        { if: { flag: 'cx_life.landlord_paid' }, text: 'You paid him to go away once. You have a sinking feeling that taught him exactly the wrong lesson.' },
        { if: { flag: 'cx_life.landlord_complied' }, text: 'You\'ve been the quietest tenant in the building for a year. Apparently quiet doesn\'t pay the rent he has in mind.' },
      ],
      choices: [
        {
          text: 'Pull up what comparable units actually rent for, and make him a counteroffer.',
          tag: '[Business DC 15]',
          check: {
            skill: 'business',
            dc: 15,
            bonuses: [{ if: { flag: 'cx_life.landlord_won' }, add: 2, label: '+2 (he knows you read the fine print)' }],
            success: 'countered',
            fail: 'firm',
            successEffects: [{ flag: 'cx_life.hike_countered' }, { quest: 'cx_life_rent_hike_q', objective: 'handled' }],
            failEffects: [{ flag: 'cx_life.hike_accepted' }, owe('cx_life_rent_hike', 'Rent increase', 6, 180), { quest: 'cx_life_rent_hike_q', objective: 'handled' }],
          },
        },
        {
          text: 'Sign it. Moving is worse than paying.',
          effects: [{ flag: 'cx_life.hike_accepted' }, owe('cx_life_rent_hike', 'Rent increase', 6, 180), { quest: 'cx_life_rent_hike_q', objective: 'handled' }],
          goto: 'signed',
        },
        {
          text: 'Don\'t sign. Pack up and find somewhere cheaper before the first.',
          effects: [{ flag: 'cx_life.hike_moved' }, { quest: 'cx_life_rent_hike_q', objective: 'handled' }],
          goto: 'moved',
        },
      ],
    },
    countered: {
      speaker: 'narrator',
      text: 'You send back three listings, two numbers and one polite sentence about how much a vacancy costs a landlord per month. He calls the next day and meets you most of the way. The new rent still stings, but only a little, and you signed something you can live with.',
      effects: [{ xp: 'business', add: 50 }, owe('cx_life_rent_hike', 'Rent increase (negotiated)', 2, 180)],
    },
    firm: {
      speaker: 'narrator',
      text: 'He listens to your numbers and says, very pleasantly, that there is a waiting list. There probably is. You sign, because the first is coming and the alternative is boxes.',
      effects: [{ stat: 'stress', add: 4 }],
    },
    signed: {
      speaker: 'narrator',
      text: 'You sign and mail it back. The home stays yours, for more money, and for about six months every trip to the mailbox feels a little like paying a toll on your own front door.',
      effects: [{ stat: 'stress', add: 3 }],
    },
    moved: {
      speaker: 'narrator',
      text: [
        'You spend two weekends in other people\'s empty rooms and settle for a shared place across town. Smaller, louder, cheaper.',
        'Carrying your whole life down three flights of stairs has a way of showing you how much of it you didn\'t need.',
      ],
      effects: [{ housing: 'shared_room' }, owe('cx_life_moving', 'Moving costs', 8, 21), { stat: 'energy', add: -10 }, { notify: 'You moved out rather than pay the new rent.', kind: 'bad' }],
    },
  },
}

const rentHikeQuest: QuestDef = {
  id: 'cx_life_rent_hike_q',
  title: 'Complication: New Terms',
  kind: 'personal',
  priority: 4,
  rewards: 'Keep a roof you can afford',
  summary: 'Your lease renewal arrived early, with a thank-you on page one and a new rent on page two.',
  start: 's1',
  stages: {
    s1: {
      text: 'The landlord wants a lot more rent. Counteroffer, sign it, or move out.',
      objectives: [
        { id: 'handled', text: 'Answer the renewal', when: { never: true }, hint: 'Answer the "Lease Renewal" mail — counteroffer [Business DC 15], sign it, or move somewhere cheaper.' },
      ],
      next: [
        { if: { flag: 'cx_life.hike_moved' }, stage: 'moved' },
        { stage: 'paying' },
      ],
    },
    paying: {
      text: 'You signed the new lease. The increase runs as its own line on your costs for about six months, until the new rate is simply what rent costs.',
      objectives: [
        { id: 'absorbed', text: 'Absorb the rent increase', when: { not: { obligation: 'cx_life_rent_hike' } }, hint: 'The increase is a fixed-term obligation (its end date is in the Obligations panel). It closes on its own; just keep the money coming in.' },
      ],
      next: 'settled',
    },
    settled: ending('The new rent is just rent now. You kept your home, and you know exactly what it is worth to the person who holds the keys.', 'completed'),
    moved: ending('You walked rather than pay. A smaller place, a cheaper one, and a life that fits in fewer boxes than you thought.', 'completed'),
  },
}

const rentHike: EventDef = {
  id: 'cx_life_rent_hike',
  category: 'life',
  when: { all: [renting, questOver('cx_life_landlord_q'), stampedAgo('landlord', 'cx_life_landlord', 365)] },
  complication: { sources: ['any'], minTier: 1, maxTier: 5 },
  effects: [{ quest: 'cx_life_rent_hike_q', start: true }],
  scene: 'cx_life_rent_hike_scene',
}

export default defineContent({
  scenes: [walletScene, scamScene, landlordScene, taxScene, taxFinalScene, bagScene, invoiceScene, rentHikeScene],
  quests: [walletQuest, scamQuest, landlordQuest, taxQuest, bagQuest, invoiceQuest, rentHikeQuest],
  events: [wallet, scam, landlord, taxLetter, bag, invoice, rentHike],
})
