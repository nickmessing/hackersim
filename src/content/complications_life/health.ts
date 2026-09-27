/**
 * COMPLICATION PACK — 'health' source: the body sending the invoice.
 *
 * Spawned by this pack's spawner triggers ({ complication: 'health' }) and by fail branches that
 * pass 'health'. RSI, a burnout relapse, a surprise medical bill, insomnia, a bad tooth, a panic
 * attack. Each is a choice between the cheap-now/expensive-later kind of decision the body loves to
 * offer. Marks: physical scars (some double-edged, some genuinely good if you take care of it),
 * fixed-term medical obligations, and multi-week debuffs.
 *
 * When PARALLAX consumer risk-scoring is live, a medical bill can quietly become a coverage denial
 * (parallaxLive) — the era's quiet cruelty, kept in-world and fictional.
 */
import { defineContent } from '@/engine/registry'
import type { EventDef, QuestDef, SceneDef } from '@/engine/types'
import { CX_FLARE, CX_ON_EDGE, CX_RELAPSE, CX_RESTING, CX_SLEEPLESS } from './marks'
import { ending, has, owe, parallaxLive } from './_shared'

// ─────────────────────────────────────────────────────────────────────────────
// cx_life_rsi — the wrists file a formal complaint
// ─────────────────────────────────────────────────────────────────────────────
const rsiScene: SceneDef = {
  id: 'cx_life_rsi_scene',
  channel: 'dialog',
  title: 'The Morning Your Hands Say No',
  start: 'open',
  nodes: {
    open: {
      speaker: 'narrator',
      text: [
        'It doesn\'t start dramatically. It starts with a tingle you shake out, then an ache you ignore, then a morning where you reach for the mouse and your hand just... declines. A hot wire runs from your wrist to your elbow and stays lit.',
        'You\'ve been treating your body like a peripheral. The body has decided to renegotiate.',
      ],
      effects: [{ buff: CX_FLARE }],
      choices: [
        {
          text: 'See a physio. Do the boring exercises. Buy the brace and the good chair.',
          tag: '[$220]',
          req: { stat: 'money', gte: 220 },
          reqText: 'Requires $220',
          effects: [{ money: -220 }, { flag: 'cx_life.rsi_treated' }, { quest: 'cx_life_rsi_q', objective: 'chose' }],
          goto: 'treat',
        },
        {
          text: 'Rest it properly for a couple of weeks. Real rest, not "rest."',
          effects: [{ flag: 'cx_life.rsi_rested' }, { buff: CX_RESTING }, { quest: 'cx_life_rsi_q', objective: 'chose' }],
          goto: 'rest',
        },
        {
          text: 'Tape it up, take the painkillers, and power through the deadline.',
          tag: '[Push through]',
          effects: [{ flag: 'cx_life.rsi_pushed' }, { quest: 'cx_life_rsi_q', objective: 'chose' }],
          goto: 'push',
        },
      ],
    },
    treat: {
      speaker: 'narrator',
      text: [
        'The physio is a brisk person who calls your setup "a repetitive strain machine you built for yourself" and then, kinder, shows you how to un-build it. Wrist neutral. Screen up. Breaks on a timer. A brace for the bad days.',
        'It works, mostly, if you keep doing it. You will keep doing it, because the alternative introduced itself very clearly this morning.',
      ],
      effects: [{ trait: 'cx_life_good_habits' }, { removeBuff: 'cx_life_flare' }],
    },
    rest: {
      speaker: 'narrator',
      text: 'You do the unthinkable and stop for a while. No marathon sessions, no "just one more thing." The flare fades. You lose two weeks of output and gain a working pair of hands, which turns out to be the better deal.',
      effects: [{ flag: 'cx_life.rsi_rested' }],
    },
    push: {
      speaker: 'narrator',
      text: [
        'You hit the deadline. You also hit it with hands that now hurt when you sleep, when you drive, when you hold a coffee. The tingle became a resident. The brace lives on your wrist now, not in a drawer.',
        'You bought a week of speed with a permanent tax. The body always collects.',
      ],
      effects: [{ trait: 'cx_life_carpal' }, { stat: 'health', add: -4 }],
    },
  },
}

const rsiQuest: QuestDef = {
  id: 'cx_life_rsi_q',
  title: 'Complication: The Wrists',
  kind: 'personal',
  priority: 4,
  rewards: 'Keep your hands working',
  summary: 'Years of bad posture and long sessions came due in one morning. Fix it now, rest it now, or pay for it forever.',
  start: 's1',
  stages: {
    s1: {
      text: 'Your hands are in open revolt. Treat it properly, rest it, or push through the pain.',
      objectives: [
        { id: 'chose', text: 'Decide how to handle the pain', when: { never: true }, hint: 'The dialog "The Morning Your Hands Say No" opens it — see a physio ($220), rest properly, or power through.' },
      ],
      next: [
        { if: { flag: 'cx_life.rsi_pushed' }, stage: 'chronic' },
        { stage: 'managed' },
      ],
    },
    managed: ending('You listened to your body for once. The flare fades and, if you keep the habits, stays gone.', 'completed'),
    chronic: ending('You won the deadline and lost the argument with your own hands. The brace is permanent now.', 'failed'),
  },
}

const rsi: EventDef = {
  id: 'cx_life_rsi',
  category: 'health',
  when: { not: { trait: 'cx_life_carpal' } },
  complication: { sources: ['health'], minTier: 1, maxTier: 3 },
  effects: [{ quest: 'cx_life_rsi_q', start: true }],
  scene: 'cx_life_rsi_scene',
}

// ─────────────────────────────────────────────────────────────────────────────
// cx_life_burnout_relapse — you went back to the well too soon
// ─────────────────────────────────────────────────────────────────────────────
const relapseScene: SceneDef = {
  id: 'cx_life_relapse_scene',
  channel: 'dialog',
  title: 'The Wall, Again',
  start: 'open',
  nodes: {
    open: {
      speaker: 'narrator',
      text: [
        'You know this feeling. That\'s the worst part. You clawed your way out of the pit once, told yourself you\'d learned the lesson, and then went straight back to the exact habits that dug it.',
        'Now you\'re staring at a screen that might as well be a wall, and the small tasks feel like moving furniture underwater. You went back to the well too soon, and the well was dry.',
      ],
      effects: [{ buff: CX_RELAPSE }],
      choices: [
        {
          text: 'Stop. Actually stop. Take a real week off, whatever it costs.',
          effects: [{ flag: 'cx_life.relapse_rested' }, { buff: CX_RESTING }, { quest: 'cx_life_relapse_q', objective: 'chose' }],
          goto: 'stop',
        },
        {
          text: 'Fix the schedule that caused it — fewer hours, hard boundaries.',
          tag: '[Systems DC 15]',
          check: {
            skill: 'systems',
            dc: 15,
            success: 'restructured',
            fail: 'grind',
            successEffects: [{ flag: 'cx_life.relapse_fixed' }, { quest: 'cx_life_relapse_q', objective: 'chose' }],
            failEffects: [{ flag: 'cx_life.relapse_ground' }, { quest: 'cx_life_relapse_q', objective: 'chose' }],
          },
        },
        {
          text: 'Caffeine, willpower, and denial. You don\'t have time for this.',
          tag: '[Push through]',
          effects: [{ flag: 'cx_life.relapse_ground' }, { quest: 'cx_life_relapse_q', objective: 'chose' }],
          goto: 'grind',
        },
      ],
    },
    stop: {
      speaker: 'narrator',
      text: 'You cancel everything and let yourself be useless for seven days — sleep, walks, bad TV, a real meal you sit down for. It feels like failure for about three days and then it feels like breathing. You come back slower and, for once, sustainable.',
      effects: [{ stat: 'stress', add: -12 }, { stat: 'mood', add: 4 }],
    },
    restructured: {
      speaker: 'narrator',
      text: 'You treat your own week like a system to debug: where the load spikes, where the recovery should be, what to cut. You build in the boundaries you never let yourself have. It\'s not rest, exactly. It\'s the thing that makes rest possible.',
      effects: [{ xp: 'systems', add: 55 }, { stat: 'stress', add: -6 }, { trait: 'cx_life_sleep_ritual' }],
    },
    grind: {
      speaker: 'narrator',
      text: [
        'You pour caffeine on it and call the shaking "focus." You get things done, badly, and each day the tank refills a little less. This is how the second burnout becomes a permanent lower ceiling — not a crash, just a floor that keeps rising.',
        'Something in your baseline resets, and not upward.',
      ],
      effects: [{ trait: 'cx_life_fragile' }, { stat: 'stress', add: 6 }],
    },
  },
}

const relapseQuest: QuestDef = {
  id: 'cx_life_relapse_q',
  title: 'Complication: The Wall, Again',
  kind: 'personal',
  priority: 5,
  rewards: 'Break the burnout cycle before it sets',
  summary: 'You climbed out of burnout once and walked right back in. This time it threatens to become your new normal.',
  start: 's1',
  stages: {
    s1: {
      text: 'You\'ve relapsed into burnout. Stop completely, redesign the week that caused it, or grind on.',
      objectives: [
        { id: 'chose', text: 'Decide how to handle the relapse', when: { never: true }, hint: 'The dialog "The Wall, Again" opens it — take a real week off, restructure your schedule [Systems DC 15], or push through.' },
      ],
      next: [
        { if: { flag: 'cx_life.relapse_ground' }, stage: 'sets' },
        { stage: 'breaks' },
      ],
    },
    breaks: ending('You broke the cycle instead of feeding it. Slower, steadier, still standing.', 'completed'),
    sets: ending('You ground through it, and the ceiling came down to meet you. Your baseline runs on fumes now.', 'failed'),
  },
}

const burnoutRelapse: EventDef = {
  id: 'cx_life_burnout_relapse',
  category: 'health',
  when: { all: [{ var: 'sys.burnouts', gte: 1 }, { not: { trait: 'cx_life_fragile' } }] },
  complication: { sources: ['health'], minTier: 2, maxTier: 5 },
  effects: [{ quest: 'cx_life_relapse_q', start: true }],
  scene: 'cx_life_relapse_scene',
}

// ─────────────────────────────────────────────────────────────────────────────
// cx_life_hospital_bill — a surprise bill, and maybe a denial
// ─────────────────────────────────────────────────────────────────────────────
const billScene: SceneDef = {
  id: 'cx_life_bill_scene',
  channel: 'mail',
  title: 'STATEMENT — Amount Due',
  from: 'Harbor Point General Billing',
  start: 'note',
  nodes: {
    note: {
      speaker: 'Harbor Point General Billing',
      text: [
        'A visit you\'d half-forgotten — the fall, the stitches, the four hours in a plastic chair — arrives as a statement thick enough to have chapters.',
        '"Amount due: a number with a comma in it. This statement reflects services rendered. Please remit within 30 days to avoid referral to collections. Detailed itemization enclosed (page 3)."',
        'Page 3 lists a $40 bag of saline and a "facility fee" the size of a car payment.',
        { if: parallaxLive, text: '"NOTE: A portion of your claim was DENIED by your carrier following a risk-profile review. You are responsible for the denied balance. Questions? Call the number on your card between the hours nobody is free."' },
      ],
      choices: [
        {
          text: 'Pay it in full and move on.',
          tag: '[$900]',
          req: { stat: 'money', gte: 900 },
          reqText: 'Requires $900',
          effects: [{ money: -900 }, { flag: 'cx_life.bill_paid' }, { quest: 'cx_life_bill_q', objective: 'handled' }],
          goto: 'paid',
        },
        {
          text: 'Call billing and negotiate — itemize, dispute, ask for the cash rate.',
          tag: '[Business DC 15]',
          check: {
            skill: 'business',
            dc: 15,
            success: 'negotiated',
            fail: 'plan',
            successEffects: [{ flag: 'cx_life.bill_negotiated' }, { quest: 'cx_life_bill_q', objective: 'handled' }],
            failEffects: [{ flag: 'cx_life.bill_plan' }, { quest: 'cx_life_bill_q', objective: 'handled' }],
          },
        },
        {
          text: 'Set up a payment plan and chip at it.',
          effects: [{ flag: 'cx_life.bill_plan' }, { quest: 'cx_life_bill_q', objective: 'handled' }],
          goto: 'plan',
        },
        {
          text: 'Put it in the drawer with the others.',
          tag: '[Ignore]',
          effects: [{ flag: 'cx_life.bill_ignored' }, { quest: 'cx_life_bill_q', objective: 'handled' }],
          goto: 'ignore',
        },
      ],
    },
    paid: {
      speaker: 'narrator',
      text: 'You write the number with the comma in it and feel it leave. It\'s gone, cleanly, which is a luxury — most people carry a bill like this for years. You get to not.',
      effects: [{ stat: 'stress', add: 3 }],
    },
    negotiated: {
      speaker: 'narrator',
      text: [
        'You call, and you\'re patient, and you make them explain page 3 line by line. Half of it evaporates under actual scrutiny — a duplicate charge, a code that shouldn\'t apply, the cash rate they never mention unless you ask.',
        'What\'s left is real, but survivable, and you learned the single most useful skill in this country: never pay a medical bill\'s first number.',
      ],
      effects: [{ xp: 'business', add: 55 }, owe('cx_life_medbill', 'Medical bill (negotiated)', 8, 42), { trait: 'cx_life_hard_way' }],
    },
    plan: {
      speaker: 'narrator',
      text: 'You set up the plan: four months of installments. It\'s a small monthly ache you\'ll carry for a while — the kind of low, constant drain that never quite lets you get ahead, but never quite drowns you either.',
      effects: [owe('cx_life_medbill', 'Medical bill (payment plan)', 11, 120)],
    },
    ignore: {
      speaker: 'narrator',
      text: [
        'Into the drawer it goes, on top of the others. It does not go away. It ages, and grows a second letter, and then a third with a firmer font, and eventually a phone number that calls at dinner.',
        'The bill you don\'t open becomes the credit score you can\'t fix.',
      ],
      effects: [owe('cx_life_medbill', 'Medical bill (late fees)', 14, 240), { flag: 'cx_life.bill_ignored' }, { scene: 'cx_life_collections', delayHours: 24 * 7 * 5 }],
    },
  },
}

const collectionsScene: SceneDef = {
  id: 'cx_life_collections',
  channel: 'mail',
  title: 'FINAL NOTICE — Account Referred',
  from: 'Tidewater Recovery Associates',
  start: 'note',
  nodes: {
    note: {
      speaker: 'Tidewater Recovery Associates',
      text: [
        'The letter is a different color, which is the point. The friendly hospital font is gone. This one means it.',
        '"Your account has been referred to our office. The full balance, plus fees, is now due. This debt has been reported. Contact us to arrange resolution."',
        'The number attached to it is bigger than the original, because of course it is.',
      ],
      choices: [
        {
          text: 'Settle it — pay the (now larger) balance and be done.',
          tag: '[$1200]',
          req: has(1200),
          reqText: 'Requires $1200',
          effects: [{ money: -1200 }, { removeObligation: 'cx_life_medbill' }, { quest: 'cx_life_bill_q', objective: 'resolve' }],
          goto: 'settled',
        },
        {
          text: 'Call them. Dispute the fees, cite the original itemization, offer a real number.',
          tag: '[Business DC 14]',
          check: {
            skill: 'business',
            dc: 14,
            success: 'talked_down',
            fail: 'their_plan',
            successEffects: [
              { removeObligation: 'cx_life_medbill' },
              owe('cx_life_medbill', 'Medical bill (settled with collections)', 10, 60),
              { quest: 'cx_life_bill_q', objective: 'resolve' },
            ],
            failEffects: [
              { removeObligation: 'cx_life_medbill' },
              owe('cx_life_medbill', 'Collections payment plan', 12, 150),
              { trait: 'cx_life_bad_credit' },
              { quest: 'cx_life_bill_q', objective: 'resolve' },
            ],
          },
        },
        {
          text: 'Set up their payment plan and eat the credit hit.',
          effects: [
            { removeObligation: 'cx_life_medbill' },
            owe('cx_life_medbill', 'Collections payment plan', 12, 150),
            { trait: 'cx_life_bad_credit' },
            { quest: 'cx_life_bill_q', objective: 'resolve' },
          ],
          goto: 'their_plan',
        },
        {
          text: 'Keep ignoring it. Future-you problem.',
          tag: '[Ignore]',
          effects: [
            { removeObligation: 'cx_life_medbill' },
            owe('cx_life_medbill', 'Medical debt (judgment)', 18, 200),
            { flag: 'cx_life.bill_judgment' },
            { trait: 'cx_life_bad_credit' },
            { stat: 'stress', add: 5 },
            { quest: 'cx_life_bill_q', objective: 'resolve' },
          ],
          goto: 'judgment',
        },
      ],
    },
    settled: {
      speaker: 'narrator',
      text: 'You pay it, all of it, fees and all, and a week later a letter in the friendly font again says the account is closed. It\'s the most expensive lesson in opening your mail you\'ll ever buy.',
      effects: [{ notify: 'Debt cleared. Expensive way to learn to open your mail.', kind: 'money' }, { stat: 'stress', add: -4 }],
    },
    talked_down: {
      speaker: 'narrator',
      text: [
        'You are calm, you are specific, and you have page 3 in front of you. The collector has a quota and you are offering a real number; the fees quietly disappear and the rest goes on a short plan.',
        'Two months. You can do two months.',
      ],
      effects: [{ xp: 'business', add: 45 }, { trait: 'cx_life_hard_way' }],
    },
    their_plan: {
      speaker: 'narrator',
      text: 'Their plan is five months of installments and a mark on your record that outlasts it by years. It\'s not a good deal. It is, at least, a deal with an end date.',
      effects: [{ stat: 'stress', add: 3 }],
    },
    judgment: {
      speaker: 'narrator',
      text: [
        'Future-you arrives sooner than planned, in the form of a court letter. The agency sued, you didn\'t show, and now there\'s a judgment: the debt comes out of what you earn, whether you open the envelopes or not.',
        'And now your name is on a docket, which is a place people like you should never be.',
      ],
      effects: [{ complication: 'legal' }],
    },
  },
}

const billQuest: QuestDef = {
  id: 'cx_life_bill_q',
  title: 'Complication: The Statement',
  kind: 'personal',
  priority: 4,
  rewards: 'Keep a medical bill from owning you',
  summary: 'A hospital visit came back as a statement with a comma in it — and a "facility fee" the size of a car payment. In this town, a bill you ignore becomes a credit score you can\'t fix.',
  start: 's1',
  stages: {
    s1: {
      text: 'A surprise medical bill has landed. Pay it, negotiate it down, set up a plan, or ignore it (at your peril).',
      objectives: [
        { id: 'handled', text: 'Deal with the bill', when: { never: true }, hint: 'Answer the "STATEMENT" mail — pay in full ($900), negotiate [Business DC 15], set up a plan, or ignore it and risk collections.' },
      ],
      next: [
        { if: { flag: 'cx_life.bill_ignored' }, stage: 'collections' },
        { if: { flag: 'cx_life.bill_paid' }, stage: 'clear' },
        { stage: 'carrying' },
      ],
    },
    clear: ending('Paid in full, gone clean. Most people carry a bill like that for years. You didn\'t have to.', 'completed'),
    carrying: {
      text: 'You\'re carrying the bill on a fixed-term plan now — a small monthly ache with an end date.',
      objectives: [
        { id: 'settle', text: 'Pay off the medical bill', when: { not: { obligation: 'cx_life_medbill' } }, hint: 'The plan has a fixed term (its end date is in the Obligations panel). Keep money coming in; the quest closes when the last installment clears.' },
      ],
      next: 'paid_off',
    },
    collections: {
      text: 'You let it go to collections. Late fees are piling up, and a final notice is on its way.',
      objectives: [
        { id: 'resolve', text: 'Answer the collections notice', when: { never: true }, hint: 'A "FINAL NOTICE" from a collections agency arrives in Mail about five weeks after you shelved the bill. Pay it off ($1200), talk it down [Business DC 14], take their plan, or keep ignoring it.' },
      ],
      next: [
        { if: { not: { obligation: 'cx_life_medbill' } }, stage: 'clear' },
        { if: { flag: 'cx_life.bill_judgment' }, stage: 'judgment' },
        { stage: 'carrying' },
      ],
    },
    judgment: {
      text: 'A court judgment takes the debt straight out of your income now. It\'s heavier than any plan would have been, but it does end.',
      objectives: [
        { id: 'settle', text: 'Outlast the judgment', when: { not: { obligation: 'cx_life_medbill' } }, hint: 'The judgment runs for a fixed term (its end date is in the Obligations panel). It closes on its own; keep money coming in until it does.' },
      ],
      next: 'paid_hard',
    },
    paid_off: ending('The last installment cleared. The bill is a memory now, and you read every statement\'s page 3 first.', 'completed'),
    paid_hard: ending('It\'s paid, the hard way. The credit mark stays, and so does the habit of opening every envelope the day it arrives.', 'failed'),
  },
}

const hospitalBill: EventDef = {
  id: 'cx_life_hospital_bill',
  category: 'health',
  complication: { sources: ['health'], minTier: 2, maxTier: 4 },
  effects: [{ quest: 'cx_life_bill_q', start: true }],
  scene: 'cx_life_bill_scene',
}

// ─────────────────────────────────────────────────────────────────────────────
// cx_life_insomnia — the off switch stops working
// ─────────────────────────────────────────────────────────────────────────────
const insomniaScene: SceneDef = {
  id: 'cx_life_insomnia_scene',
  channel: 'dialog',
  title: 'Four A.M., Again',
  start: 'open',
  nodes: {
    open: {
      speaker: 'narrator',
      text: [
        'The ceiling has a water stain shaped like a state you\'ve never been to. You know this because you\'ve been looking at it since 2 a.m., doing math about your life that never balances.',
        'It\'s been weeks now. You\'re tired in a way that sleep isn\'t fixing, because the sleep isn\'t coming. Somewhere back there the off switch stopped working, and you\'ve been running the machine hot ever since.',
      ],
      effects: [{ buff: CX_SLEEPLESS }],
      choices: [
        {
          text: 'Go full monk: strict schedule, dark room, no screens after ten. Boring. Effective.',
          tag: '[Systems DC 14]',
          check: {
            skill: 'systems',
            dc: 14,
            success: 'ritual',
            fail: 'fails',
            successEffects: [{ flag: 'cx_life.insomnia_fixed' }, { quest: 'cx_life_insomnia_q', objective: 'chose' }],
            failEffects: [{ flag: 'cx_life.insomnia_stuck' }, { quest: 'cx_life_insomnia_q', objective: 'chose' }],
          },
        },
        {
          text: 'See a doctor about it. Actual help, actual questions.',
          tag: '[$120]',
          req: { stat: 'money', gte: 120 },
          reqText: 'Requires $120',
          effects: [{ money: -120 }, { flag: 'cx_life.insomnia_doctor' }, { quest: 'cx_life_insomnia_q', objective: 'chose' }],
          goto: 'doctor',
        },
        {
          text: 'Lean into it. The world\'s quiet at 4 a.m. — get work done.',
          tag: '[Embrace it]',
          effects: [{ flag: 'cx_life.insomnia_stuck' }, { quest: 'cx_life_insomnia_q', objective: 'chose' }],
          goto: 'embrace',
        },
      ],
    },
    ritual: {
      speaker: 'narrator',
      text: [
        'You debug your own sleep like a flaky service: same bedtime, same wake time, no blue light, no "just one more thing," a dumb little wind-down routine you\'d be embarrassed to describe.',
        'It takes about ten days and then, one night, you just... sleep. All the way through. You wake up and the state-shaped stain is just a stain again.',
      ],
      effects: [{ xp: 'systems', add: 50 }, { trait: 'cx_life_sleep_ritual' }, { removeBuff: 'cx_life_sleepless' }],
    },
    doctor: {
      speaker: 'narrator',
      text: 'The doctor asks better questions than you ask yourself — about the caffeine, the hours, the thing you\'re not saying — and gives you a plan that\'s half medical and half "stop living like that." It helps. Slowly, the nights get their bottom back.',
      effects: [{ trait: 'cx_life_sleep_ritual' }, { removeBuff: 'cx_life_sleepless' }, { stat: 'health', add: 3 }],
    },
    fails: {
      speaker: 'narrator',
      text: 'You try the discipline thing but your own brain keeps out-arguing you at 3 a.m., and one bad night resets a week of progress. The sleeplessness digs in and becomes a fixture, a low hum under everything you do.',
      effects: [{ trait: 'cx_life_insomnia' }],
    },
    embrace: {
      speaker: 'narrator',
      text: [
        'For a while it feels like a superpower — the whole quiet world to yourself, hours nobody else has. Then the edges start to fray. You misread things. You snap at people. The 4 a.m. genius turns out to be a tired person making tired mistakes.',
        'The insomnia stops being a phase and becomes a fact about you.',
      ],
      effects: [{ trait: 'cx_life_insomnia' }, { stat: 'mood', add: -3 }],
    },
  },
}

const insomniaQuest: QuestDef = {
  id: 'cx_life_insomnia_q',
  title: 'Complication: Four A.M.',
  kind: 'personal',
  priority: 4,
  rewards: 'Get your sleep back',
  summary: 'The off switch stopped working weeks ago and you\'ve been running hot ever since. Fix it before it becomes a permanent fact about you.',
  start: 's1',
  stages: {
    s1: {
      text: 'You can\'t sleep, and it\'s wearing through everything. Impose a strict routine, see a doctor, or lean into the small hours.',
      objectives: [
        { id: 'chose', text: 'Decide what to do about the insomnia', when: { never: true }, hint: 'The dialog "Four A.M., Again" opens it — build a sleep ritual [Systems DC 14], see a doctor ($120), or embrace the 4 a.m. life.' },
      ],
      next: [
        { if: { flag: 'cx_life.insomnia_stuck' }, stage: 'chronic' },
        { stage: 'fixed' },
      ],
    },
    fixed: ending('You got the nights back. Turns out the least hacker thing about you — a boring bedtime — was the fix.', 'completed'),
    chronic: ending('The sleeplessness dug in and stayed. It\'s a fact about you now, humming under everything.', 'failed'),
  },
}

const insomnia: EventDef = {
  id: 'cx_life_insomnia',
  category: 'health',
  when: { not: { trait: 'cx_life_insomnia' } },
  complication: { sources: ['health'], minTier: 1, maxTier: 3 },
  effects: [{ quest: 'cx_life_insomnia_q', start: true }],
  scene: 'cx_life_insomnia_scene',
}

// ─────────────────────────────────────────────────────────────────────────────
// cx_life_bad_tooth — the dental emergency you can't code your way out of
// ─────────────────────────────────────────────────────────────────────────────
const toothScene: SceneDef = {
  id: 'cx_life_tooth_scene',
  channel: 'dialog',
  title: 'The Tooth',
  start: 'open',
  nodes: {
    open: {
      speaker: 'narrator',
      text: [
        'You ignored it when it was a twinge. You ignored it when it was an ache. Now it\'s a hot, dumb, all-consuming throb on the left side of your face, and you\'ve been chewing on the right for a week, and last night the pain woke you up like an alarm you can\'t snooze.',
        'This is the one thing you cannot brute-force, script around, or outsmart. The tooth does not care how good you are with computers.',
      ],
      effects: [{ buff: { ...CX_ON_EDGE, id: 'cx_life_tooth_pain', name: 'Toothache', desc: 'A hot throb on the left side of your face. You can\'t think about anything else.', mods: [{ key: 'efficiency', mult: 0.88 }, { key: 'mood.daily', add: -0.4 }] } }],
      choices: [
        {
          text: 'Go to the dentist. Pay the emergency rate. Get it fixed right.',
          tag: '[$400]',
          req: { stat: 'money', gte: 400 },
          reqText: 'Requires $400',
          effects: [{ money: -400 }, { flag: 'cx_life.tooth_fixed' }, { removeBuff: 'cx_life_tooth_pain' }, { quest: 'cx_life_tooth_q', objective: 'chose' }],
          goto: 'fixed',
        },
        {
          text: 'Find the cheap clinic across town and get on a payment plan.',
          effects: [{ flag: 'cx_life.tooth_clinic' }, { removeBuff: 'cx_life_tooth_pain' }, owe('cx_life_dental', 'Dental payment plan', 7, 42), { quest: 'cx_life_tooth_q', objective: 'chose' }],
          goto: 'clinic',
        },
        {
          text: 'Painkillers and clove oil. It\'ll settle down. It has to.',
          tag: '[Endure]',
          effects: [{ flag: 'cx_life.tooth_endured' }, { quest: 'cx_life_tooth_q', objective: 'chose' }],
          goto: 'endure',
        },
      ],
    },
    fixed: {
      speaker: 'narrator',
      text: 'The dentist does something brief and expensive and merciful, and the throb that owned your whole head for a week simply... stops. The relief is so total it\'s almost funny. You resolve to go every six months. You will not. But you mean it right now.',
      effects: [{ stat: 'mood', add: 6 }, { stat: 'health', add: 2 }],
    },
    clinic: {
      speaker: 'narrator',
      text: 'The clinic is a two-hour wait and a student dentist with a supervisor, but they fix it, and the payment plan is gentle. Slower and cheaper and completely fine — the pain\'s gone and your wallet survived. Settle the plan when you can.',
      effects: [{ stat: 'mood', add: 3 }],
    },
    endure: {
      speaker: 'narrator',
      text: [
        'You white-knuckle it with pills and folk remedies, and it does eventually quiet down — into a low, permanent throb that flares when the weather turns and when you\'re stressed, which is often.',
        'You saved four hundred dollars and bought a tooth that will remind you of this decision for years.',
      ],
      effects: [{ trait: 'cx_life_bad_tooth' }, { stat: 'health', add: -3 }],
    },
  },
}

const toothQuest: QuestDef = {
  id: 'cx_life_tooth_q',
  title: 'Complication: The Tooth',
  kind: 'personal',
  priority: 5,
  rewards: 'The one thing you can\'t debug',
  summary: 'A dental emergency you can\'t script your way out of. Fix it right, fix it cheap, or endure it and let it become permanent.',
  start: 's1',
  stages: {
    s1: {
      text: 'The tooth has taken over your whole head. See a dentist, find the cheap clinic, or grit it out.',
      objectives: [
        { id: 'chose', text: 'Deal with the tooth', when: { never: true }, hint: 'The dialog "The Tooth" opens it — the dentist ($400), the cheap clinic (payment plan), or painkillers and hope.' },
      ],
      next: [
        { if: { flag: 'cx_life.tooth_endured' }, stage: 'chronic' },
        { if: { flag: 'cx_life.tooth_clinic' }, stage: 'plan' },
        { stage: 'fixed' },
      ],
    },
    fixed: ending('Fixed right, gone for good. Worth every dollar and you know it.', 'completed'),
    plan: {
      text: 'The clinic fixed it on a six-week payment plan. A small bill with an end date, and a tooth that no longer runs your life.',
      objectives: [
        { id: 'settle', text: 'Pay off the dental plan', when: { not: { obligation: 'cx_life_dental' } }, hint: 'The dental plan runs for six weeks (its end date is in the Obligations panel) and closes on its own when the last installment clears.' },
      ],
      next: 'fixed',
    },
    chronic: ending('You saved the money and kept the tooth. It aches when the weather turns, and it always will.', 'failed'),
  },
}

const badTooth: EventDef = {
  id: 'cx_life_bad_tooth',
  category: 'health',
  when: { not: { trait: 'cx_life_bad_tooth' } },
  complication: { sources: ['health'], minTier: 1, maxTier: 3 },
  effects: [{ quest: 'cx_life_tooth_q', start: true }],
  scene: 'cx_life_tooth_scene',
}

// ─────────────────────────────────────────────────────────────────────────────
// cx_life_panic — the body's alarm goes off with no fire
// ─────────────────────────────────────────────────────────────────────────────
const panicScene: SceneDef = {
  id: 'cx_life_panic_scene',
  channel: 'dialog',
  title: 'Twelve Minutes',
  start: 'open',
  nodes: {
    open: {
      speaker: 'narrator',
      text: [
        'It comes from nowhere, or from everywhere at once. Your heart tries to leave your chest, the room goes far away and too bright, and a certainty arrives that something is terribly, physically wrong — that this is the big one, right here, at your desk, over nothing.',
        'It lasts maybe twelve minutes. It feels like the rest of your life. When it passes it leaves you wrung out and scared of the next one, which is its own kind of trap.',
      ],
      effects: [{ buff: CX_ON_EDGE }],
      choices: [
        {
          text: 'Take it seriously. Talk to someone — a doctor, a counselor, anyone real.',
          tag: '[$100]',
          req: { stat: 'money', gte: 100 },
          reqText: 'Requires $100',
          effects: [{ money: -100 }, { flag: 'cx_life.panic_help' }, { quest: 'cx_life_panic_q', objective: 'chose' }],
          goto: 'help',
        },
        {
          text: 'Learn to ride it — breathing, grounding, the boring proven stuff.',
          tag: '[Fitness DC 14]',
          check: {
            skill: 'fitness',
            dc: 14,
            success: 'managed',
            fail: 'spiral',
            successEffects: [{ flag: 'cx_life.panic_managed' }, { quest: 'cx_life_panic_q', objective: 'chose' }],
            failEffects: [{ flag: 'cx_life.panic_spiral' }, { quest: 'cx_life_panic_q', objective: 'chose' }],
          },
        },
        {
          text: 'Pretend it didn\'t happen. Never speak of it. Get back to work.',
          effects: [{ flag: 'cx_life.panic_spiral' }, { quest: 'cx_life_panic_q', objective: 'chose' }],
          goto: 'bury',
        },
      ],
    },
    help: {
      speaker: 'narrator',
      text: 'It turns out to be a very common, very treatable thing with a boring clinical name, which is enormously comforting — you\'re not broken, you\'re overloaded, and there are actual tools for it. You come away with a plan and the specific relief of knowing what it was.',
      effects: [{ stat: 'stress', add: -8 }, { trait: 'cx_life_iron_nerves' }, { removeBuff: 'cx_life_on_edge' }],
    },
    managed: {
      speaker: 'narrator',
      text: 'You learn the unglamorous mechanics of not drowning — slow breath, feet on the floor, name five things you can see. It doesn\'t make the attacks never happen. It makes them a passing weather system instead of a catastrophe, and that changes everything.',
      effects: [{ xp: 'fitness', add: 45 }, { trait: 'cx_life_iron_nerves' }, { removeBuff: 'cx_life_on_edge' }],
    },
    spiral: {
      speaker: 'narrator',
      text: 'You try to white-knuckle it alone and the fear of the next one starts shrinking your world — avoiding places, avoiding calls, avoiding the desk where it happened. Untreated, it doesn\'t fade. It just quietly draws the borders of your life in tighter.',
      effects: [{ stat: 'mood', add: -4 }, { stat: 'stress', add: 5 }],
    },
    bury: {
      speaker: 'narrator',
      text: 'You file it under "never happened" and get back to work, and the alarm, ignored, just learns to go off more often. You become someone who braces for the phone, who leaves the exits mapped, who is always a little bit ready to run from nothing.',
      effects: [{ stat: 'mood', add: -5 }, { stat: 'stress', add: 6 }],
    },
  },
}

const panicQuest: QuestDef = {
  id: 'cx_life_panic_q',
  title: 'Complication: Twelve Minutes',
  kind: 'personal',
  priority: 5,
  rewards: 'Face the alarm before it runs your life',
  summary: 'The body\'s alarm went off with no fire, and now you\'re scared of the next one. Untreated, it quietly draws your world in tighter.',
  start: 's1',
  stages: {
    s1: {
      text: 'You had a panic attack and the fear of the next one is settling in. Get real help, learn to ride it, or bury it.',
      objectives: [
        { id: 'chose', text: 'Decide how to face it', when: { never: true }, hint: 'The dialog "Twelve Minutes" opens it — talk to someone ($100), learn grounding techniques [Fitness DC 14], or pretend it didn\'t happen.' },
      ],
      next: [
        { if: { flag: 'cx_life.panic_spiral' }, stage: 'spiral' },
        { stage: 'managed' },
      ],
    },
    managed: ending('You gave the alarm a name and a set of tools. It still rings sometimes. It doesn\'t run you anymore.', 'completed'),
    spiral: ending('Ignored, the alarm learned to ring more often. Your world is a little smaller than it was.', 'failed'),
  },
}

const panic: EventDef = {
  id: 'cx_life_panic',
  category: 'health',
  complication: { sources: ['health'], minTier: 2, maxTier: 4 },
  effects: [{ quest: 'cx_life_panic_q', start: true }],
  scene: 'cx_life_panic_scene',
}

export default defineContent({
  scenes: [rsiScene, relapseScene, billScene, collectionsScene, insomniaScene, toothScene, panicScene],
  quests: [rsiQuest, relapseQuest, billQuest, insomniaQuest, toothQuest, panicQuest],
  events: [rsi, burnoutRelapse, hospitalBill, insomnia, badTooth, panic],
})
