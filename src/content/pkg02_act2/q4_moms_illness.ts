/**
 * PKG-02 — main_a2_q4_moms_illness: the major life-sim fork (bible §6.B, CP-B3).
 *
 * Linh collapses; the bills are enormous. Grace is introduced here (Harbor Point General). The
 * decision can be made at the bedside or deferred to the hospital's payment-arrangement letter,
 * which stays open while the 45-day clock runs. The clock is split into four timed stages so the
 * billing office's reminders land at 30 / 14 / 3 days left ONLY while the crisis is unresolved.
 * Timing out is the "can't pay" resolution — never a soft-lock.
 *
 * PARALLAX cross-link: while Aperture thrives and you're complicit (w.enclosure ≥ 2), the insurance
 * line is greyed "Denied by risk score" and the Halcyon option becomes advance-only
 * (news insurers_riskscore). If you've brought shame/heat to the Row (hood ≤ −20), saving her still
 * costs the relationship (estranged).
 *
 * Engine notes worked around:
 *  - No arithmetic on net worth, so the bill is tiered from money-on-hand when the crisis lands
 *    (flag a2.mom_bill: $5k / $8k / $14k / $24k — always above the bible's $4k floor, ≈60% of savings).
 *  - "Pay if you can, else loan" is an `if` on money; the loan is a daily life.extraUpkeep charge
 *    cleared 400 days later by a pay-off letter (a scheduled scene).
 *
 * PKG-02 owns: main_a2_q4_moms_illness, scenes a2_mom_cough / a2_mom_bills / a2_mom_options /
 * a2_mom_reminder_1..3 / a2_mom_loan_paid, npc.mom.fate, npc.grace {met},
 * life.sold_out_for_mom / .hood_carried_you / .mom_crisis_failed / .dirty_bank_money,
 * a2.mom_crisis_resolved / .early_bank_job / .mom_bill / .mom_loan / .mom_estranged_path,
 * a2.bank_bloom / .grace_brushed.
 *
 * Fail branches: the reckless bank job (CP-B3 D) failing is its own beat now — the heat bloom, then a
 * 4 a.m. call from Meridian's fraud desk (bloom_call): the Red Dot scar, a2.bank_bloom (read by the
 * raid and by Reyes at the hinge) and maybe a 'hack' complication — while every other door stays
 * open, as the bible requires. Brushing Grace off costs her handwritten P.S. on the billing letter.
 *
 * Reads from PKG-01: a1.row_fixed / .safety_night / .row_spammed / .vcr_story (the Row remembers
 * Ruth's chain letter when it passes the hat). From q1/q2b: a2.kroll_lowballed, a2.halcyon_door_closed.
 */
import { defineContent } from '@/engine/registry'
import type { Choice, Cond, Effect, QuestDef, SceneDef, SceneNode, TextPart } from '@/engine/types'
import { SCAR } from './scars'

const Q = 'main_a2_q4_moms_illness'
const TIERS = [5000, 8000, 14000, 24000] as const
/** Daily loan payment per tier: ~400 days, with interest. */
const LOAN_PER_DAY: Record<(typeof TIERS)[number], number> = { 5000: 15, 8000: 24, 14000: 42, 24000: 72 }

const billIs = (b: number): Cond => ({ flag: 'a2.mom_bill', eq: b })
/** Run `fn(bill)` for whichever tier this crisis landed on. */
const perBill = (fn: (bill: (typeof TIERS)[number]) => Effect[]): Effect[] =>
  TIERS.map(b => ({ if: billIs(b), then: fn(b) }))
const billWords: Record<(typeof TIERS)[number], string> = {
  5000: 'Five thousand dollars',
  8000: 'Eight thousand dollars',
  14000: 'Fourteen thousand dollars',
  24000: 'Twenty-four thousand dollars',
}
const billLine = (tail: string): TextPart[] => TIERS.map(b => ({ if: billIs(b), text: `${billWords[b]}${tail}` }))

const denied: Cond = { all: [{ flag: 'w.aperture_state', eq: 'thriving' }, { var: 'w.enclosure', gte: 2 }] }
const insuredJob: Cond = { all: [{ flag: 'fac.halcyon.employed' }, { faction: 'fac.halcyon', gte: 50 }] }
const estranged: Cond = { flag: 'a2.mom_estranged_path' }

/** Save-the-patient fate: estranged if you dragged shame/heat to the Row, else the given fate. */
const saved = (fate: 'healthy' | 'recovered_dark'): Effect => ({
  if: estranged,
  then: [{ npc: 'mom', fate: 'estranged' }],
  else: [{ npc: 'mom', fate }],
})
const resolve: Effect = { flag: 'a2.mom_crisis_resolved' }

const grief: Effect[] = [
  { flag: 'life.mom_crisis_failed' },
  { npc: 'mom', fate: 'passed' },
  { var: 'w.mom_gone', set: 1 },
  { stat: 'stress', add: 20 },
  {
    buff: {
      id: 'buff_grief_mom',
      name: 'Grief',
      desc: 'It sits on your chest at odd hours. You carry it because you have to.',
      days: 180,
      bad: true,
      mods: [{ key: 'mood.daily', add: -1 }, { key: 'stress.gain', mult: 1.1 }],
    },
  },
  resolve,
]

const payOrLoan: Effect[] = perBill(b => [
  {
    if: { stat: 'money', gte: b },
    then: [{ money: -b }, { flag: 'a2.mom_paid_cash' }],
    else: [
      { var: 'life.extraUpkeep', add: LOAN_PER_DAY[b] },
      { flag: 'a2.mom_loan', set: LOAN_PER_DAY[b] },
      { scene: 'a2_mom_loan_paid', delayHours: 400 * 24 },
      {
        buff: {
          id: 'buff_mom_loan',
          name: 'Hospital Loan',
          desc: 'A payment plan gnaws at your money and your sleep.',
          days: 400,
          bad: true,
          mods: [{ key: 'stress.gain', mult: 1.06 }],
        },
      },
    ],
  },
])

/** CP-B3 — shared by the bedside dialog and the payment-arrangement letter. */
const cpChoices: Choice[] = [
  {
    text: 'Take the fastest dirty job Kroll has. Whatever it pays, it pays for this.',
    tag: '[Aperture]',
    effects: [
      { faction: 'fac.aperture', add: 15 },
      { faction: 'fac.loft', add: -3 },
      { stat: 'heat', add: 25 },
      { flag: 'life.sold_out_for_mom' },
      { var: 'w.enclosure', add: 1 },
      saved('recovered_dark'),
      resolve,
    ],
    goto: 'out_aperture',
  },
  {
    text: 'Go to Priya. File it on the insurance your badge is supposed to buy.',
    tag: '[Halcyon]',
    if: { not: denied },
    req: insuredJob,
    reqText: 'Requires: Halcyon employment with benefits (employed, rep 50+)',
    effects: [
      { faction: 'fac.halcyon', add: 5 },
      { flag: 'npc.priya.debt' },
      ...perBill(b => [{ money: -Math.round(b / 10) }]),
      saved('healthy'),
      resolve,
    ],
    goto: 'out_halcyon',
  },
  {
    text: 'File it on the insurance.',
    tag: '[Halcyon]',
    if: denied,
    req: { never: true },
    reqText: 'Denied by risk score',
  },
  {
    text: 'Go to Priya. Ask her for an advance against your salary — off the books.',
    tag: '[Halcyon · advance]',
    if: denied,
    req: insuredJob,
    reqText: 'Requires: Halcyon employment with benefits (employed, rep 50+)',
    effects: [{ faction: 'fac.halcyon', add: 5 }, { flag: 'npc.priya.debt' }, saved('healthy'), resolve],
    goto: 'out_halcyon',
  },
  {
    text: 'Call Priya. Ask if Halcyon would still take you on — benefits first, pride later.',
    tag: '[Halcyon]',
    if: { all: [{ flag: 'a2.halcyon_door_closed' }, { not: { flag: 'fac.halcyon.employed' } }] },
    req: { never: true },
    reqText: 'Halcyon passed on you twice — that door closed in the temp pool',
  },
  {
    text: 'Let the Row carry you. Sal, Deadline, the church ladies — pass the hat.',
    tag: '[Neighborhood]',
    req: { faction: 'fac.hood', gte: 20 },
    reqText: 'Requires: the Neighborhood in your corner (rep 20+)',
    effects: [
      { faction: 'fac.hood', add: 20 },
      { flag: 'life.hood_carried_you' },
      { news: 'mom_fundraiser' },
      saved('healthy'),
      resolve,
    ],
    goto: 'out_hood',
  },
  {
    text: 'Hit a bank early. One clean pull covers everything, with change.',
    tag: '[Reckless]',
    if: { not: { flag: 'a2.bank_attempted' } },
    effects: [{ flag: 'a2.bank_attempted' }],
    check: {
      skill: 'intrusion',
      dc: 18,
      bonuses: [{ if: { skill: 'networking', gte: 40 }, add: 1, label: '+1 (you know how bank traffic moves)' }],
      success: 'out_bank_win',
      fail: 'heat_bloom',
      successEffects: [
        ...perBill(b => [{ money: Math.round(b / 2) }]),
        { stat: 'heat', add: 40 },
        { flag: 'a2.early_bank_job' },
        { flag: 'life.dirty_bank_money' },
        { var: 'w.exposure', add: 1 },
        saved('healthy'),
        resolve,
      ],
      // Bible: heat +30 and Reyes flags you hard; A, C and F stay open. The flag is now a scar.
      failEffects: [
        { stat: 'heat', add: 30 },
        { flag: 'fac.bureau.on_radar' },
        { flag: 'a2.bank_bloom' },
        { trait: SCAR.redDot },
      ],
    },
  },
  {
    text: 'Pay it. From savings if they stretch that far; a payment plan if they don\'t.',
    tag: '[Pay]',
    effects: [...payOrLoan, saved('healthy'), resolve],
    goto: 'out_pay',
  },
  {
    text: 'There\'s no money and no miracle. Let it go.',
    tag: '[Give up]',
    effects: grief,
    goto: 'out_gone',
  },
]

/** Outcome nodes, shared by both scenes. */
const outcomes: Record<string, SceneNode> = {
  heat_bloom: {
    speaker: 'narrator',
    text: [
      'You get maybe forty seconds into the bank\'s outer wall before every gauge you have turns red. This isn\'t a sleepy target — it\'s a tripwire wearing a bank\'s face, and you feel the trace close like a hand around your wrist. You bail, hard, leaving skid marks.',
      'Across town, in a federal office that still smells of new carpet, a light starts blinking next to your handle. Agent Reyes will remember this. But the bill is still unpaid, and giving up on the bank isn\'t giving up — it\'s just choosing a different door.',
    ],
    effects: [{ log: 'The bank job blew up in your face — a heat bloom, and the Bureau\'s attention. The other roads are still open.', kind: 'heat' }],
    next: 'bloom_call',
  },
  bloom_call: {
    speaker: 'narrator',
    text: [
      'At 4:10 a.m. the pager goes off: a number you don\'t know. You shouldn\'t call it back. You call it back.',
      'A recorded voice, warm and female and completely without a person inside it: "Thank you for your interest in the security of Meridian Trust. Your session has been referred to our Fraud Prevention partners. Your reference number is seven, three, one, one, four—" You hang up before it finishes. You remember every digit anyway.',
      'A reference number is how an institution tells you it intends to remember you. Somewhere across the Sound, a pin goes into a corkboard, and the corkboard does not care that your mother is in a hospital bed.',
      'The bill is still on the clipboard. The clock is still running. Pick another door — any door that doesn\'t have a bank behind it.',
    ],
    effects: [{ chance: 0.5, then: [{ complication: 'hack', tier: 2 }] }],
    next: 'cp_b3',
  },
  out_aperture: {
    speaker: 'narrator',
    text: [
      'You call the number Kroll gave you and take the fastest, ugliest job on her board, and you don\'t let yourself think about it until it\'s done and the money has gone straight from an account in Millgate to Harbor Point General, and Mom is sitting up eating jello she pretends to hate.',
      {
        if: { flag: 'a2.kroll_lowballed' },
        text: 'Except it isn\'t one job. Kroll pays exactly what Hollis wrote on your tab at that first dinner — "our standard rate for you, dear" — and the standard rate covers about half a hospital. So you take a second job, uglier than the first, and you do that one faster too.',
      },
      {
        if: estranged,
        text: 'She lives. She also stops calling. When you visit, the curtain moves and then it doesn\'t. You saved her life with money she asked you not to spend, and that turns out to be a thing a person can\'t forgive, even when it\'s love.',
        else: 'She never asks where it came from. But sometimes you catch her watching you across a room like she\'s reading a letter in a language she used to know, and you love her too much to explain the translation.',
      },
    ],
    effects: [
      { log: 'You sold out for Mom. It was love, not greed — and Kroll owns a little more of you now.', kind: 'story' },
      // Bought Cheap: Kroll pays you what Hollis wrote down, so one ugly job becomes two.
      {
        if: { flag: 'a2.kroll_lowballed' },
        then: [
          { stat: 'heat', add: 10 },
          { faction: 'fac.aperture', add: 5 },
          { stat: 'stress', add: 6 },
          { log: 'At the rate Hollis wrote down for you, one job didn\'t cover it. You took a second.', kind: 'bad' },
        ],
      },
    ],
  },
  out_halcyon: {
    speaker: 'priya',
    text: [
      {
        if: denied,
        text: '"The insurance won\'t pay," Priya says flatly, folder open. "Your mother\'s file came back with a risk score. A number some machine decided about a woman it never met. I know exactly what kind of machine, and I helped build its grandfather." She closes the folder. "So it\'s an advance. My name on it, quietly. Don\'t argue."',
        else: '"The plan covers most of it," Priya says, "and I\'ll front the co-pay gap myself if you come up short. Don\'t call it a loan. We both know it\'s a loan." She signs something before you can object. "This is what the boring good life is for. Take it."',
      },
      {
        if: estranged,
        text: 'Mom recovers. She sends a thank-you card to Priya, and not to you. You find out because Priya shows it to you, gently, like handing someone a splinter they need to see.',
        else: 'Mom will be fine. You owe Priya now — a debt neither of you will name, which is the most expensive kind.',
      },
    ],
    effects: [{ log: 'Priya covered Mom through Halcyon. You owe her, and she\'ll never once mention it.', kind: 'good' }],
  },
  out_hood: {
    speaker: 'sal',
    text: [
      '"Put your wallet away before I take it personally." Sal has a coffee can on the Cathode counter within the hour, and by the weekend the whole Row has emptied its pockets into it — Deadline\'s crumpled bills, the church group\'s bake sale, a kid\'s paper-route money that Sal quietly triples before it goes in.',
      { if: { flag: 'a1.safety_night' }, text: 'The church office donates the proceeds of Friday bingo, on the written condition that you run another Internet Safety Night. Ruth has already bought a new spiral pad for it.' },
      { if: { all: [{ flag: 'a1.row_fixed' }, { not: { flag: 'a1.safety_night' } }] }, text: 'Mrs. Ferraro puts in a folded twenty "for the good kind of computer person," and makes Sal write it on the can in marker so everyone sees.' },
      { if: { flag: 'a1.vcr_story' }, text: 'Somebody tapes a note to the can: FOR THE KID WHO SET OUR VCRs. It gets a laugh every time someone drops in a bill. You decide that\'s fine. You decide that\'s better than fine.' },
      { if: { flag: 'a1.row_spammed' }, text: 'The church office puts in nothing, pointedly. When you pass its open window you can still hear the trumpet. Ruth puts in forty dollars and tells you, very quietly, that she forgave you a long time ago and the church ladies will get there.' },
      'It isn\'t enough on its own, and then somehow it is, because that\'s what the Row does. Mom cries when she hears the list of names. "You didn\'t do this," she tells you, wiping her eyes. "This is them." She\'s right, and you let her be right, and you never forget that they\'ll call this in someday — beautifully, not cruelly.',
    ],
    effects: [{ log: 'The Row carried you. Mom pulls through. They\'ll remember — and so will you.', kind: 'good' }],
  },
  out_bank_win: {
    speaker: 'narrator',
    text: [
      'It works. God help you, it works — one clean pull, in and out before the trace finds its shoes, and a number in an account that will never survive an honest question.',
      'Mom gets the good tests and the good room and the good outcome, and you get the specific dread of dirty money that saved a life. Someone will find the hole eventually, and someone will have to take the blame for it. But tonight your mother is alive, and you did that, and you\'ll pay for it on the installment plan the world always sends.',
    ],
    effects: [{ log: 'The bank job paid. Mom lives on dirty money. The bill for THIS one arrives later, with interest.', kind: 'money' }],
  },
  out_pay: {
    speaker: 'narrator',
    text: [
      {
        if: { flag: 'a2.mom_paid_cash' },
        text: 'You empty the account in one terrible afternoon and sign your name at the billing window. No heat. No favors owed to Kroll or the Row. Just the oldest, most boring kind of sacrifice: money you earned, spent on someone you love.',
        else: 'The savings don\'t stretch, so you sign a payment plan that will follow you for more than a year — a little every day, with interest, until it doesn\'t. No heat. No favors owed. Just a debt with your name on it and hers on the reason.',
      },
      {
        if: estranged,
        text: 'She takes the care and not your hand. That\'s allowed. You paid anyway.',
        else: 'Mom holds your hand and doesn\'t ask what it cost. She doesn\'t have to. She raised you; she can read a receipt in your face.',
      },
    ],
    effects: [{ log: 'You paid Mom\'s bill the hard, clean way. It bites, but it\'s yours.', kind: 'money' }],
  },
  out_gone: {
    speaker: 'narrator',
    text: [
      'There is no job fast enough, no favor big enough, and no version of you willing to become the thing it would take. You sit with her, and you hold her hand, and the machines do what machines do, and then they stop.',
      'Her reading glasses stay on the kitchen windowsill for a long time after. Nobody moves them. Something in you reorders itself around the shape of her absence, and everything you do from now on has that shape in it, whether you mean it to or not.',
    ],
    effects: [{ log: 'Mom is gone. The grief becomes part of the reason you do this now.', kind: 'bad' }],
  },
}

const cough: SceneDef = {
  id: 'a2_mom_cough',
  channel: 'chat',
  title: 'Kim',
  from: 'kim',
  pause: false,
  start: 'a',
  nodes: {
    a: {
      speaker: 'kim',
      text: [
        'ok dont freak out',
        'mom has been coughing for like 3 weeks and she told me not to tell u',
        'so obviously im telling u',
        'she says its "just the cannery air." the cannery closed in 1987',
      ],
      choices: [
        { text: '"I\'ll call her tonight. Thanks, Kim."', effects: [{ npc: 'kim', affinity: 2 }, { npc: 'mom', affinity: 2 }], goto: 'b' },
        { text: '"Make her see a doctor. Tell her I said so."', effects: [{ npc: 'kim', affinity: 1 }], goto: 'c' },
        { text: '"She\'s tough. She\'ll be fine."', effects: [{ npc: 'kim', affinity: -2 }], goto: 'd' },
      ],
    },
    b: { speaker: 'kim', text: ['ok. she will pretend to be annoyed. she will not be annoyed', 'ur still buying my silence with a cd btw'] },
    c: { speaker: 'kim', text: ['lol u think i have that power', 'ill try. she listens to u more than me. dont let that go to ur head'] },
    d: { speaker: 'kim', text: ['wow ok', 'thats exactly what she said', 'u guys are so alike its actually scary'] },
  },
}

const billScene: SceneDef = {
  id: 'a2_mom_bills',
  channel: 'dialog',
  title: 'Harbor Point General',
  from: 'mom',
  start: 'open',
  nodes: {
    open: {
      speaker: 'narrator',
      text: [
        'The call comes in the middle of a shift: Mom collapsed at work, and the ambulance took her to Harbor Point General — the good hospital, the one on the money side of town, which is its own kind of terror, because the good hospital sends the good bills.',
        'You find her small in a bed that\'s too big, an IV in the back of her hand, insisting she feels fine and that you should eat something. A nurse with steady hands and a badge that says OKAFOR checks the monitor, catches your face, and gives you exactly the amount of honesty you can handle. "She\'s stable," Grace says. "The tests aren\'t cheap, and she\'s going to need more of them. I\'ll give you two a minute."',
      ],
      // Grace enters the story here; the bill is tiered from your savings; the estranged variant
      // arms if you brought heat or shame to the Row; the risk-score denial goes public.
      effects: [
        { npc: 'grace', met: true },
        { flag: 'a2.mom_bill', set: 5000 },
        { if: { stat: 'money', gte: 9000 }, then: [{ flag: 'a2.mom_bill', set: 8000 }] },
        { if: { stat: 'money', gte: 20000 }, then: [{ flag: 'a2.mom_bill', set: 14000 }] },
        { if: { stat: 'money', gte: 40000 }, then: [{ flag: 'a2.mom_bill', set: 24000 }] },
        { if: { faction: 'fac.hood', lte: -20 }, then: [{ flag: 'a2.mom_estranged_path' }] },
        { if: denied, then: [{ news: 'insurers_riskscore' }] },
      ],
      next: 'the_number',
    },
    the_number: {
      speaker: 'mom',
      text: [
        {
          if: estranged,
          text: '"You shouldn\'t have come," she says, and it lands like a slap because she means it kindly. She has heard things — men asking questions on the Row, a neighbor who won\'t meet her eye. "I don\'t want your money. I don\'t want to know where it\'s from. I just want you to have been someone else." She turns her face to the window.',
          else: '"Don\'t make that face," Mom says. "A mother can work with a lot of things. Not sleeping. Flinching at the phone. But you make that face and I know it\'s about money, and I\'d rather be sick than be a bill." She squeezes your hand with more strength than she should have.',
        },
        'The estimate is on a clipboard by the door. You do the math three times because the first two times you don\'t believe it.',
        ...billLine(', and that\'s the optimistic column.'),
      ],
      next: 'grace',
    },
    grace: {
      speaker: 'grace',
      text: [
        'In the hallway, Grace Okafor presses a vending-machine coffee into your hand without asking if you want one. "Billing will send you a payment-arrangement letter. It reads like a threat. It\'s mostly a form." She hesitates. "Your mom talks about you. Says you fix computers. Says you don\'t sleep."',
        '"I\'m a nurse. I\'m very good at knowing when someone\'s hiding a wound. You don\'t have to tell me which one. Just — eat something. She\'s right about that."',
      ],
      choices: [
        { text: '"Thank you. Really. For the coffee and the honesty."', effects: [{ npc: 'grace', affinity: 4 }], goto: 'cp_intro' },
        {
          text: '"You\'re on your second shift today, aren\'t you."',
          tag: '[Notice]',
          check: {
            skill: 'social',
            dc: 12,
            bonuses: [{ if: { trait: 'empath' }, add: 2, label: '+2 (Empath)' }],
            success: 'grace_seen',
            fail: 'grace_brush',
            successEffects: [{ npc: 'grace', affinity: 7 }],
            // Minor: she closes up, and the billing letter arrives without her handwriting on it.
            failEffects: [{ npc: 'grace', affinity: -1 }, { stat: 'stress', add: 2 }, { flag: 'a2.grace_brushed' }],
          },
        },
        { text: 'Nod. You don\'t trust your voice.', effects: [{ npc: 'grace', affinity: 2 }], goto: 'cp_intro' },
      ],
    },
    grace_seen: {
      speaker: 'grace',
      text: '"Third, technically." A tired, surprised laugh — the first real one you\'ve heard in this building. "Nobody asks. Okay. You\'re observant. Use it on the billing office; they hate that." She taps your coffee cup with hers like a toast and goes back to work.',
      next: 'cp_intro',
    },
    grace_brush: {
      speaker: 'grace',
      text: '"Every shift is my second shift." It\'s a practiced deflection, warm and closed — the voice she keeps for relatives who are about to become a problem — and she\'s gone down the corridor before you can find a better question. You have the feeling you just got filed under "family, difficult."',
      next: 'cp_intro',
    },
    cp_intro: {
      speaker: 'player',
      text: [
        ...billLine(' you don\'t have, against a clock nobody will say out loud — forty-five days, the letter will say.'),
        'There is no version of this that doesn\'t leave a mark. You can choose now, standing in this hallway. Or you can go home and look for a door you haven\'t thought of yet.',
      ],
      choices: [
        { text: 'Decide now. Look at every door.', goto: 'cp_b3' },
        {
          text: '"I need time. I\'ll find a way."',
          tag: '[Leave]',
          effects: [{ scene: 'a2_mom_options', delayHours: 20 }],
          goto: 'deferred',
        },
      ],
    },
    deferred: {
      speaker: 'narrator',
      text: 'You kiss her forehead, promise her things, and drive home through fog that makes the streetlights look like they\'re underwater. The payment-arrangement letter will be in your inbox by tomorrow. The clock is already running.',
    },
    cp_b3: {
      speaker: 'player',
      text: 'Pick the one you can live with.',
      choices: cpChoices,
    },
    ...outcomes,
  },
}

/** The letter stays open; once the crisis is settled (or lost), its options fold away. */
const unresolved: Cond = { not: { flag: 'a2.mom_crisis_resolved' } }
const letterChoices: Choice[] = [
  ...cpChoices.map((c): Choice => ({ ...c, if: c.if ? { all: [c.if, unresolved] } : unresolved })),
  { text: 'Close the letter. It\'s settled, one way or another.', if: { flag: 'a2.mom_crisis_resolved' } },
]

const optionsScene: SceneDef = {
  id: 'a2_mom_options',
  channel: 'mail',
  title: 'Payment Arrangement — Account 4471-LT',
  from: 'Harbor Point General · Billing',
  pause: true,
  start: 'letter',
  nodes: {
    letter: {
      speaker: 'Harbor Point General · Billing',
      text: [
        'Dear Family of L. TAN,',
        'Enclosed please find the itemized estimate for continued diagnostic and inpatient care.',
        ...billLine(' is due or must be placed under a payment arrangement within 45 days of admission. Continued care is contingent on this arrangement.'),
        'We understand this is a difficult time. Our office is open until 6 PM.',
        '— Patient Financial Services, Harbor Point General',
        {
          if: { flag: 'a2.grace_brushed' },
          text: 'P.S. (typed) — Patient stable. Visiting hours 10–8. — Nursing Station 4',
          else: 'P.S. (handwritten, scanned crooked) — Her color\'s better today. She asked for the crossword. — G.O.',
        },
      ],
      next: 'cp_b3',
    },
    cp_b3: {
      speaker: 'player',
      text: [
        { if: unresolved, text: 'You read it four times. It doesn\'t get smaller. Pick the one you can live with — or leave the letter open and keep looking, while the clock lets you.', else: 'The letter is still in your inbox. It doesn\'t matter anymore, and you can\'t bring yourself to delete it.' },
      ],
      choices: letterChoices,
    },
    ...outcomes,
  },
}

const reminder = (id: string, title: string, days: string, body: string, stress: number): SceneDef => ({
  id,
  channel: 'mail',
  title,
  from: 'Harbor Point General · Billing',
  pause: true,
  start: 'msg',
  nodes: {
    msg: {
      speaker: 'Harbor Point General · Billing',
      text: ['Dear Family of L. TAN,', body, `Days remaining on this arrangement: ${days}.`, '— Patient Financial Services'],
      effects: [{ stat: 'stress', add: stress }],
    },
  },
})

const reminder1 = reminder(
  'a2_mom_reminder_1',
  'Reminder — Account 4471-LT',
  '30',
  'This is a courtesy reminder that the balance for the above account remains outstanding. We understand this is a difficult time. Our automated system does not, but we do.',
  4,
)
const reminder2 = reminder(
  'a2_mom_reminder_2',
  'SECOND NOTICE — Account 4471-LT',
  '14',
  'The window for a payment arrangement on this account is narrowing. After the deadline, our options — and hers — narrow considerably. A person on our end still hopes you will call. Please prove them right.',
  6,
)
const reminder3 = reminder(
  'a2_mom_reminder_3',
  'FINAL NOTICE — Account 4471-LT',
  '3',
  'This is the final notice before this account is referred and continued care is reviewed. If there is anything — anything — you have not tried, please try it now.',
  8,
)

const loanPaid: SceneDef = {
  id: 'a2_mom_loan_paid',
  channel: 'mail',
  title: 'PAID IN FULL — Account 4471-LT',
  from: 'Harbor Point General · Billing',
  pause: false,
  start: 'msg',
  nodes: {
    msg: {
      speaker: 'Harbor Point General · Billing',
      text: [
        'Dear Account Holder,',
        'Our records indicate that the payment arrangement on the above account has been completed. The balance is $0.00. No further payments will be drawn.',
        { if: { var: 'w.mom_gone', eq: 1 }, text: 'We are sorry for your loss.', else: 'Please give our best to the patient.' },
        '— Patient Financial Services',
      ],
      effects: [
        ...Object.values(LOAN_PER_DAY).map(
          (perDay): Effect => ({ if: { flag: 'a2.mom_loan', eq: perDay }, then: [{ var: 'life.extraUpkeep', add: -perDay }] }),
        ),
        { clearFlag: 'a2.mom_loan' },
        { stat: 'stress', add: -6 },
        { stat: 'mood', add: 5 },
      ],
    },
  },
}

const resolvedObj = (id: string, text: string) => ({
  id,
  text,
  when: { flag: 'a2.mom_crisis_resolved' } as Cond,
  hint: 'Choose a road at the bedside or in the hospital\'s payment-arrangement letter (Mail). Every road resolves it.',
})

const quest: QuestDef = {
  id: Q,
  title: "Mom's Bills",
  kind: 'main',
  act: 2,
  giver: 'mom',
  summary:
    'Linh collapsed. Harbor Point General is the good hospital, and the good hospital sends the good bills. You have forty-five days and no easy answer.',
  autoStart: {
    all: [{ quest: 'main_a2_q3_jax_overreach', status: 'completed' }, { day: true, gte: 1000 }, { not: { var: 'w.mom_gone', eq: 1 } }],
  },
  priority: 30,
  rewards: "Mom's life · your soul's exchange rate",
  start: 'wait',
  stages: {
    wait: {
      text: 'Mom hasn\'t been herself lately, brushing off your worry the way she brushes off everything.',
      hint: 'Something is coming. Money on hand, Halcyon benefits, Row standing and Aperture contacts are all doors — or none of them.',
      onEnter: [{ scene: 'a2_mom_cough', delayHours: 20 }, { scene: 'a2_mom_bills', delayHours: 12 * 24 }],
      objectives: [{ id: 'call', text: 'The call comes', when: { seen: 'a2_mom_bills' }, hint: 'Keep playing; the call comes within a couple of weeks.' }],
      next: 'crisis_45',
    },
    crisis_45: {
      text: 'Mom is at Harbor Point General and the bill is enormous. Forty-five days to find the money, or a version of yourself willing to.',
      hint: 'If the clock runs out with no choice made, that IS a choice — and a permanent one.',
      objectives: [resolvedObj('decide', "Resolve Mom's crisis")],
      timeLimitDays: 15,
      onTimeout: { stage: 'crisis_30', effects: [{ scene: 'a2_mom_reminder_1' }] },
    },
    crisis_30: {
      text: 'Thirty days left on the payment arrangement. The letter is still open in your inbox.',
      hint: 'If the clock runs out with no choice made, that IS a choice — and a permanent one.',
      objectives: [resolvedObj('decide', "Resolve Mom's crisis")],
      timeLimitDays: 16,
      onTimeout: { stage: 'crisis_14', effects: [{ scene: 'a2_mom_reminder_2' }] },
    },
    crisis_14: {
      text: 'Two weeks. Mom has stopped asking how you\'re going to manage it, which is how you know she\'s scared.',
      hint: 'Open the payment-arrangement letter in Mail and choose. Paying from savings or a loan is always available.',
      objectives: [resolvedObj('decide', "Resolve Mom's crisis")],
      timeLimitDays: 11,
      onTimeout: { stage: 'crisis_3', effects: [{ scene: 'a2_mom_reminder_3' }] },
    },
    crisis_3: {
      text: 'Three days. The billing office has stopped sounding like a form.',
      hint: 'Open the payment-arrangement letter in Mail. The payment plan is always there if nothing else is.',
      objectives: [resolvedObj('decide', "Resolve Mom's crisis")],
      timeLimitDays: 3,
      onTimeout: {
        effects: [...grief, { notify: 'The window closed. There was no more time, and then there was no more Mom.', kind: 'bad' }],
      },
    },
  },
}

export default defineContent({
  quests: [quest],
  scenes: [cough, billScene, optionsScene, reminder1, reminder2, reminder3, loanPaid],
})
