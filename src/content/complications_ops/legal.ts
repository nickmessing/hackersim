/**
 * COMPLICATION PACK — legal source (courts, fines, probation, suits, federal letters).
 *
 *   cx_ops_court_summons   T1-2  repeatable — a municipal citation: pay, contest it, take a plan, or ignore it.
 *   cx_ops_arraignment     T3-5  repeatable (legal + hack) — a criminal charge: plead, fight with a public defender, or buy a lawyer.
 *   cx_ops_probation       T2-4  once, quest — a plea deal puts you "on paper"; survive two check-ins.
 *   cx_ops_civil_suit      T2-5  once, quest (legal + hack) — a company sues you for damages; settle, lawyer up, or argue it yourself.
 *   cx_ops_federal_letter  T4-5  repeatable (legal + hack) — the Bureau tells you, politely, that you are of interest.
 *
 * Every fine is an obligation with a settle-early letter later on. Courts, clerks, firms and
 * officers here are invented; nothing names a canonical story NPC.
 */
import { defineContent } from '@/engine/registry'
import type { EventDef, QuestDef, SceneDef } from '@/engine/types'
import { buff, debuff, hasScar, owe, scar } from './_shared'

// ─────────────────────────────────────────────────────────────────────────────
// cx_ops_court_summons — T1-2: a citation with your real name typed on it
// ─────────────────────────────────────────────────────────────────────────────
const summonsScene: SceneDef = {
  id: 'cx_ops_court_summons_scene',
  channel: 'mail',
  title: 'CITATION — Port Lumen Municipal Court, Traffic & Misc. Division',
  from: 'Municipal Court Clerk',
  start: 'citation',
  nodes: {
    citation: {
      speaker: 'Municipal Court Clerk',
      text: [
        'The envelope has a window, and through the window is your full legal name. Nobody has typed your full legal name since the school registrar.',
        '"You are cited for MISUSE OF A COMPUTING SERVICE (municipal ordinance, class C). You may pay the scheduled fine of $180 by mail, or appear on the date below to contest. Failure to respond will result in a bench warrant."',
        'Class C. That is the same class as a dog off its leash. It still has your name on it.',
      ],
      choices: [
        {
          text: 'Pay the fine and make it go away.',
          tag: '[$180]',
          req: { stat: 'money', gte: 180 },
          reqText: 'Requires $180',
          effects: [
            { money: -180 },
            { stat: 'stress', add: 2 },
            { flag: 'cx_ops.summons_paid' },
            { notify: 'Fine paid. The dog-off-leash era of your record is over.', kind: 'money' },
          ],
        },
        {
          text: 'Show up and contest it. They have a log line and a guess.',
          tag: '[Social DC 13]',
          check: {
            skill: 'social',
            dc: 13,
            bonuses: [{ if: hasScar('cx_ops_scar_courtroom_composure'), add: 2, label: '+2 (you have sat in the hard chair before)' }],
            success: 'dismissed',
            fail: 'upheld',
          },
        },
        {
          text: 'Ask the clerk for the payment plan.',
          effects: [
            owe('cx_ops_summons_plan', 'Municipal fine (payment plan)', 4, 56),
            { flag: 'cx_ops.summons_plan' },
            { scene: 'cx_ops_summons_payoff', delayHours: 24 * 21 },
          ],
        },
        {
          text: 'It is class C. Throw it away.',
          goto: 'warrant',
        },
      ],
    },
    dismissed: {
      speaker: 'narrator',
      text: [
        'The hearing takes eleven minutes. The city\'s whole case is one printout and an officer who is plainly thinking about lunch.',
        'You keep your voice level, ask who exactly the log line identifies, and watch the magistrate reach the same conclusion you did. "Dismissed. Next." Walking out into the fog, you feel ten feet tall and slightly sick.',
      ],
      effects: [
        { flag: 'cx_ops.summons_beat' },
        { xp: 'social', add: 45 },
        { stat: 'mood', add: 4 },
        scar('cx_ops_scar_courtroom_composure'),
      ],
    },
    upheld: {
      speaker: 'narrator',
      text: [
        'You talk too fast and a little too well. The magistrate peers over her glasses at the kid who clearly knows what a log line is. "Upheld. Plus court costs. And son? I would find a new hobby."',
        'The officer writes your name down a second time on the way out, on his own pad, for his own reasons.',
      ],
      effects: [
        { money: -180 },
        owe('cx_ops_summons_costs', 'Court costs (municipal)', 4, 30),
        scar('cx_ops_scar_known_to_police'),
        { stat: 'stress', add: 5 },
      ],
    },
    warrant: {
      speaker: 'narrator',
      text: [
        'Six weeks later a patrol car idles outside your building for a whole afternoon. It is not for you. Probably. But when you finally call the clerk, the words "bench warrant" come up, and so does a larger number.',
        'You pay it standing at a counter behind bulletproof glass while a desk officer types your name into something that remembers.',
      ],
      effects: [
        { money: -260 },
        { stat: 'heat', add: 8 },
        { stat: 'stress', add: 6 },
        scar('cx_ops_scar_known_to_police'),
        { flag: 'cx_ops.summons_warrant' },
      ],
    },
  },
}

const summonsPayoff: SceneDef = {
  id: 'cx_ops_summons_payoff',
  channel: 'mail',
  title: 'Statement of account — municipal fine',
  from: 'Municipal Court Clerk',
  start: 'statement',
  nodes: {
    statement: {
      speaker: 'Municipal Court Clerk',
      text: 'A statement with a little perforated stub. "Remaining balance may be paid in full at any time." Somebody has drawn a smiley face in the margin in blue pen, which is either kindness or a cry for help.',
      choices: [
        {
          text: 'Pay off the rest and be done with it.',
          tag: '[$110]',
          if: { obligation: 'cx_ops_summons_plan' },
          req: { stat: 'money', gte: 110 },
          reqText: 'Requires $110',
          effects: [{ money: -110 }, { removeObligation: 'cx_ops_summons_plan' }, { stat: 'stress', add: -2 }],
        },
        { text: 'Keep paying it off a little at a time.' },
      ],
    },
  },
}

const courtSummons: EventDef = {
  id: 'cx_ops_court_summons',
  category: 'city',
  complication: { sources: ['legal'], minTier: 1, maxTier: 2 },
  repeatable: true,
  cooldownDays: 150,
  scene: 'cx_ops_court_summons_scene',
}

// ─────────────────────────────────────────────────────────────────────────────
// cx_ops_arraignment — T3-5: a real charge, a real courtroom
// ─────────────────────────────────────────────────────────────────────────────
const arraignmentScene: SceneDef = {
  id: 'cx_ops_arraignment_scene',
  channel: 'dialog',
  title: 'Department 4 — Arraignment Calendar',
  from: 'The Court',
  start: 'called',
  nodes: {
    called: {
      speaker: 'narrator',
      text: [
        'Department 4 smells like floor wax and wet coats. Your case is called ninth, between a man who stole a boat and a woman who insists the boat was hers.',
        '"The people charge UNAUTHORIZED ACCESS TO A PROTECTED SYSTEM, a misdemeanor, with an enhancement for damages." The prosecutor does not look up from her folder. She has forty of these. That is the only comfort in the room.',
        'The judge looks at you over folded hands. "How do you plead?"',
      ],
      choices: [
        {
          text: '"Guilty, Your Honor." Take the deal they slid across the table and get out of here.',
          goto: 'plea',
        },
        {
          text: '"Not guilty." Let the public defender with the coffee stain fight it.',
          tag: '[Social DC 16]',
          check: {
            skill: 'social',
            dc: 16,
            bonuses: [
              { if: hasScar('cx_ops_scar_courtroom_composure'), add: 2, label: '+2 (you keep your voice level)' },
              { if: { stat: 'heat', lte: 25 }, add: 1, label: '+1 (your recent history is quiet)' },
            ],
            success: 'acquitted',
            fail: 'convicted',
          },
        },
        {
          text: 'Ask for a continuance and hire a real lawyer.',
          tag: '[$1400]',
          req: { stat: 'money', gte: 1400 },
          reqText: 'Requires $1400',
          goto: 'lawyer',
        },
      ],
    },
    plea: {
      speaker: 'narrator',
      text: [
        'You say the word, and it is surprisingly easy to say. Restitution, costs, a conviction that will follow you into every interview for years. The judge is already reading the boat case.',
        'Outside, the fog has come in off the Sound. You stand on the courthouse steps for a long time, a person with a record.',
      ],
      effects: [
        scar('cx_ops_scar_criminal_record'),
        owe('cx_ops_restitution', 'Court-ordered restitution', 14, 60),
        { stat: 'heat', add: -8 },
        { stat: 'mood', add: -6 },
        { flag: 'cx_ops.pled_guilty' },
        { scene: 'cx_ops_restitution_payoff', delayHours: 24 * 21 },
      ],
    },
    acquitted: {
      speaker: 'narrator',
      text: [
        'The public defender is tired, underpaid and absolutely vicious. She asks the arresting officer to explain, slowly, how a login time proves a person. He cannot. You sit very still and do not help, which turns out to be the whole skill.',
        '"Charges dismissed for insufficient evidence." The prosecutor shrugs and flips to case ten. You have never loved a stranger in a cardigan so much.',
      ],
      effects: [
        { flag: 'cx_ops.acquitted' },
        { stat: 'heat', add: -6 },
        { stat: 'mood', add: 6 },
        { xp: 'social', add: 70 },
        scar('cx_ops_scar_courtroom_composure'),
      ],
    },
    convicted: {
      speaker: 'narrator',
      text: [
        'You answer a question you should have let her answer. It is a small thing: you correct the prosecutor on a technical term. The whole room hears exactly how much you know.',
        '"Guilty as charged." Restitution on top of costs, and the judge adds a note to the file for the next time. There is always a next time in a room like this.',
      ],
      effects: [
        scar('cx_ops_scar_criminal_record'),
        scar('cx_ops_scar_known_to_police'),
        owe('cx_ops_restitution', 'Court-ordered restitution', 20, 60),
        { stat: 'stress', add: 10 },
        { stat: 'mood', add: -8 },
        { flag: 'cx_ops.convicted' },
        { scene: 'cx_ops_restitution_payoff', delayHours: 24 * 21 },
      ],
    },
    lawyer: {
      speaker: 'narrator',
      text: [
        'The lawyer wears a suit that costs more than your rig and says "mm" a lot. He files two motions you do not understand, and three weeks later the case goes away the way expensive things do: quietly, on a Tuesday, with no one saying why.',
        'You are poorer. You are not a person with a record. Some days that is the whole trade.',
      ],
      effects: [
        { money: -1400 },
        { stat: 'heat', add: -10 },
        { stat: 'stress', add: -4 },
        { flag: 'cx_ops.bought_dismissal' },
        buff('cx_ops_lawyered', 'Lawyered Up', 14, [{ key: 'stress.gain', mult: 0.9 }], 'Someone expensive has your back for a couple of weeks.'),
      ],
    },
  },
}

const restitutionPayoff: SceneDef = {
  id: 'cx_ops_restitution_payoff',
  channel: 'mail',
  title: 'Restitution account — early satisfaction offer',
  from: 'County Collections Unit',
  start: 'offer',
  nodes: {
    offer: {
      speaker: 'County Collections Unit',
      text: 'The county, it turns out, would rather have most of the money now than all of it later. "Restitution may be satisfied in full at a reduced balance if paid within thirty days." A rare act of mercy, typed in a font designed to prevent it.',
      choices: [
        {
          text: 'Pay it off and close the account.',
          tag: '[$450]',
          if: { obligation: 'cx_ops_restitution' },
          req: { stat: 'money', gte: 450 },
          reqText: 'Requires $450',
          effects: [
            { money: -450 },
            { removeObligation: 'cx_ops_restitution' },
            { stat: 'stress', add: -4 },
            { notify: 'Restitution satisfied. The county thanks you for your business.', kind: 'money' },
          ],
        },
        { text: 'Keep the monthly schedule.' },
      ],
    },
  },
}

const arraignment: EventDef = {
  id: 'cx_ops_arraignment',
  category: 'city',
  complication: { sources: ['legal', 'hack'], minTier: 3, maxTier: 5 },
  repeatable: true,
  cooldownDays: 180,
  scene: 'cx_ops_arraignment_scene',
}

// ─────────────────────────────────────────────────────────────────────────────
// cx_ops_probation — T2-4: a plea deal and two check-ins with a tired officer
// ─────────────────────────────────────────────────────────────────────────────
const probationDeal: SceneDef = {
  id: 'cx_ops_probation_deal',
  channel: 'dialog',
  title: 'Hallway outside Department 2',
  from: 'Public Defender',
  start: 'offer',
  nodes: {
    offer: {
      speaker: 'Public Defender',
      text: [
        'Your public defender catches you in the hallway with a paper cup in one hand and your whole future in the other.',
        '"Okay. Here\'s the offer. You plead to the small count, they drop the big one, you do eighteen months of supervised probation and pay the fees. Monthly check-ins. Stay boring. Or we fight, and if we lose, it\'s the big count and a record."',
        'She takes a sip. "I\'m not telling you what to do. I\'m telling you I have nine more of these before lunch."',
      ],
      choices: [
        {
          text: 'Take the deal. Boring sounds great.',
          effects: [
            scar('cx_ops_scar_on_probation'),
            owe('cx_ops_supervision_fee', 'Probation supervision fees', 6, 112),
            { flag: 'cx_ops.prob_sentenced' },
            { quest: 'cx_ops_probation_q', objective: 'plea' },
          ],
          goto: 'took',
        },
        {
          text: 'Fight it. Make them prove it.',
          tag: '[Social DC 15]',
          check: {
            skill: 'social',
            dc: 15,
            bonuses: [{ if: hasScar('cx_ops_scar_courtroom_composure'), add: 2, label: '+2 (you know how to sit in that chair)' }],
            success: 'won',
            fail: 'lost',
          },
        },
      ],
    },
    took: {
      speaker: 'Public Defender',
      text: '"Smart. Boring is a skill, kid. Practice it." She hands you a card for a probation office on Cannery Street and is gone before you can thank her.',
    },
    won: {
      speaker: 'narrator',
      text: [
        'The trial is one grey afternoon. The prosecution\'s expert cannot explain his own printout, and you sit on your hands and let him drown.',
        '"Not guilty." Your public defender does not even smile. She just nods once, like a carpenter checking a joint, and walks off to her next case.',
      ],
      effects: [
        scar('cx_ops_scar_courtroom_composure'),
        { stat: 'mood', add: 8 },
        { xp: 'social', add: 60 },
        { flag: 'cx_ops.prob_dismissed' },
        { quest: 'cx_ops_probation_q', objective: 'plea' },
      ],
    },
    lost: {
      speaker: 'narrator',
      text: [
        'You lose. Not dramatically: just a slow grinding loss, one objection at a time. The big count sticks.',
        'The judge gives you the probation anyway, because the jails are full, plus a conviction that will sit on every background check for the rest of the decade.',
      ],
      effects: [
        scar('cx_ops_scar_criminal_record'),
        scar('cx_ops_scar_on_probation'),
        owe('cx_ops_supervision_fee', 'Probation supervision fees', 9, 112),
        { stat: 'mood', add: -8 },
        { flag: 'cx_ops.prob_sentenced' },
        { quest: 'cx_ops_probation_q', objective: 'plea' },
      ],
    },
  },
}

const probationCheck1: SceneDef = {
  id: 'cx_ops_probation_check1',
  channel: 'dialog',
  title: 'Adult Probation — Cannery Street Office',
  from: 'Officer Tamsin Hale',
  start: 'office',
  expiresDays: 14,
  onExpire: [
    { flag: 'cx_ops.prob_missed' },
    { flag: 'cx_ops.prob_check1_done' },
    { stat: 'heat', add: 10 },
    { jail: 2 },
    { notify: 'You missed a probation check-in. They came and got you.', kind: 'heat' },
  ],
  nodes: {
    office: {
      speaker: 'Officer Tamsin Hale',
      text: [
        'Your probation officer has a desk fan, a dying fern and ninety-one clients. She has read your file twice, which puts her ahead of everyone else in your life.',
        '"Employment? Address? Any contact with police? And, per the special conditions, any access to computing equipment beyond what\'s needed for work?" She taps the last line. "That one is why you\'re here, so let\'s not be cute about it."',
      ],
      choices: [
        {
          text: 'Tell her the truth, in carefully boring detail.',
          tag: '[Social DC 13]',
          check: {
            skill: 'social',
            dc: 13,
            bonuses: [{ if: { stat: 'heat', lte: 30 }, add: 2, label: '+2 (you really have been quiet)' }],
            success: 'fine',
            fail: 'suspicious',
          },
        },
        {
          text: 'Show her the clean, tidy machine you brought just for this.',
          tag: '[OpSec DC 15]',
          check: {
            skill: 'opsec',
            dc: 15,
            success: 'fine',
            fail: 'suspicious',
          },
        },
      ],
    },
    fine: {
      speaker: 'Officer Tamsin Hale',
      text: '"Good. Boring. I love boring." She stamps something. "See you in a month. Water my fern if you get here early, nobody else does."',
      effects: [{ flag: 'cx_ops.prob_check1_done' }, { stat: 'stress', add: -3 }],
    },
    suspicious: {
      speaker: 'Officer Tamsin Hale',
      text: '"Mm-hm." She writes for a long time. "I\'m adding a surprise home visit to your conditions. Nothing personal. You just talked like someone with a second machine." You do have a second machine.',
      effects: [
        { flag: 'cx_ops.prob_check1_done' },
        { flag: 'cx_ops.prob_flagged' },
        { stat: 'stress', add: 6 },
        debuff('cx_ops_home_visits', 'Surprise Home Visits', 28, [{ key: 'hack.speed', mult: 0.85 }, { key: 'stress.gain', mult: 1.1 }], 'Your probation officer might knock any evening. You keep the rig in a closet and work slowly.'),
      ],
    },
  },
}

const probationCheck2: SceneDef = {
  id: 'cx_ops_probation_check2',
  channel: 'dialog',
  title: 'Adult Probation — Review',
  from: 'Officer Tamsin Hale',
  start: 'review',
  expiresDays: 14,
  onExpire: [
    { flag: 'cx_ops.prob_violated' },
    { stat: 'heat', add: 12 },
    { jail: 4 },
    { notify: 'You missed your probation review. A violation hearing followed, and a few nights in a cell.', kind: 'heat' },
  ],
  nodes: {
    review: {
      speaker: 'Officer Tamsin Hale',
      text: [
        'The fern is somehow still alive. So are you. Officer Hale has your whole file open, and today it is thin, which is the best thing a file can be.',
        '"I can recommend early termination to the judge. Your conduct has to support it. The fees have to be current. And I have to not get a single call about you between now and the hearing." She waits. "Can I not get a call?"',
      ],
      choices: [
        {
          text: '"You won\'t hear my name." Make the case for early release.',
          tag: '[Social DC 14]',
          check: {
            skill: 'social',
            dc: 14,
            bonuses: [
              { if: { not: { flag: 'cx_ops.prob_flagged' } }, add: 2, label: '+2 (a clean first check-in)' },
              { if: { stat: 'heat', gte: 45 }, add: -3, label: '-3 (you are running hot)' },
            ],
            success: 'released',
            fail: 'extended',
          },
        },
        {
          text: 'Pay the rest of the fees up front and ask her to put that in the letter.',
          tag: '[$500]',
          if: { obligation: 'cx_ops_supervision_fee' },
          req: { stat: 'money', gte: 500 },
          reqText: 'Requires $500',
          effects: [{ money: -500 }],
          goto: 'released',
        },
        {
          text: 'Just finish out the term. No speeches.',
          goto: 'serve_out',
        },
      ],
    },
    released: {
      speaker: 'narrator',
      text: [
        'The judge signs the early termination without looking up. Officer Hale shakes your hand in the hallway, the first time anyone in this building has touched you without a form involved.',
        '"Don\'t come back," she says. "The fern and I will miss you, but don\'t."',
      ],
      effects: [
        { removeObligation: 'cx_ops_supervision_fee' },
        { trait: 'cx_ops_scar_on_probation', remove: true },
        { flag: 'cx_ops.prob_released' },
        { stat: 'mood', add: 8 },
        { stat: 'stress', add: -6 },
      ],
    },
    extended: {
      speaker: 'Officer Tamsin Hale',
      text: '"I believe you mean it. I also believe your file." She closes it gently. "Full term. Keep coming in. Keep paying. Boring is a marathon, not a sprint." The fee schedule keeps its grip on your wallet.',
      effects: [{ flag: 'cx_ops.prob_served_out' }, { stat: 'stress', add: 5 }, { scene: 'cx_ops_probation_end', delayHours: 24 * 56 }],
    },
    serve_out: {
      speaker: 'narrator',
      text: 'You sign the monthly form, agree to everything, and walk out. The months will pass whether you give speeches or not. The fees go on, and the mark stays until the paper runs out.',
      effects: [{ flag: 'cx_ops.prob_served_out' }, { scene: 'cx_ops_probation_end', delayHours: 24 * 56 }],
    },
  },
}

const probationEnd: SceneDef = {
  id: 'cx_ops_probation_end',
  channel: 'mail',
  title: 'Certificate of Completion — Supervised Probation',
  from: 'Adult Probation, Cannery Street',
  start: 'cert',
  nodes: {
    cert: {
      speaker: 'Adult Probation',
      text: 'A single sheet with a gold foil sticker, the kind they give out at spelling bees. "The above-named has completed the term of supervision." Clipped to it, in blue pen on a sticky note: "Told you boring works. The fern says hi. — T.H."',
      effects: [
        { removeObligation: 'cx_ops_supervision_fee' },
        { trait: 'cx_ops_scar_on_probation', remove: true },
        { flag: 'cx_ops.prob_completed' },
        { stat: 'mood', add: 5 },
      ],
    },
  },
}

const probationQuest: QuestDef = {
  id: 'cx_ops_probation_q',
  title: 'Complication: On Paper',
  kind: 'personal',
  priority: 5,
  rewards: 'A clean end to supervision',
  summary: 'A charge became a plea deal became supervised probation. Get through the check-ins, keep the fees current and stay boring, or fight it in court.',
  start: 'plea',
  stages: {
    plea: {
      text: 'Your public defender has a deal on the table: plead to the small count and do probation, or take your chances at trial.',
      onEnter: [{ scene: 'cx_ops_probation_deal' }],
      objectives: [{ id: 'plea', text: 'Decide on the plea deal', when: { never: true }, hint: 'Talk to your public defender. Take the deal, or fight it (Social).' }],
      next: [{ if: { flag: 'cx_ops.prob_dismissed' }, stage: 'cleared' }, { stage: 'check1' }],
    },
    check1: {
      text: 'You are on probation. Your first check-in at the Cannery Street office is in three weeks. Do not miss it.',
      onEnter: [{ scene: 'cx_ops_probation_check1', delayHours: 24 * 21 }],
      objectives: [{ id: 'check1', text: 'Attend your first check-in', when: { flag: 'cx_ops.prob_check1_done' }, hint: 'Answer the check-in when it arrives: be honest (Social) or show a clean machine (OpSec). Missing it means a night in a cell.' }],
      next: 'check2',
    },
    check2: {
      text: 'Your probation review is coming up. A clean record since the first check-in could buy an early end to supervision.',
      onEnter: [{ scene: 'cx_ops_probation_check2', delayHours: 24 * 35 }],
      objectives: [
        {
          id: 'check2',
          text: 'Attend your probation review',
          when: { any: [{ flag: 'cx_ops.prob_released' }, { flag: 'cx_ops.prob_served_out' }, { flag: 'cx_ops.prob_violated' }] },
          hint: 'Keep your heat down. At the review, argue for early termination (Social) or pay the fees off up front.',
        },
      ],
      next: [{ if: { flag: 'cx_ops.prob_violated' }, stage: 'violated' }, { stage: 'cleared' }],
    },
    cleared: {
      text: 'The court is done with you, for now. Whatever the paperwork says, you know what that hallway smells like.',
      onEnter: [{ log: 'The probation business is behind you.', kind: 'story' }],
      objectives: [{ id: 'ok', text: 'Resolved', when: { always: true }, hidden: true, hint: 'Done.' }],
    },
    violated: {
      text: 'You missed your review. A violation is now part of the record, and the supervision runs its full term.',
      onEnter: [scar('cx_ops_scar_criminal_record'), { log: 'A probation violation joined your file.', kind: 'heat' }],
      objectives: [{ id: 'ok', text: 'Resolved', when: { always: true }, hidden: true, hint: 'Done.' }],
      outcome: 'failed',
    },
  },
}

const probation: EventDef = {
  id: 'cx_ops_probation',
  category: 'city',
  complication: { sources: ['legal'], minTier: 2, maxTier: 4 },
  weight: 1.5,
  effects: [{ quest: 'cx_ops_probation_q', start: true }],
}

// ─────────────────────────────────────────────────────────────────────────────
// cx_ops_civil_suit — T2-5: Pellham & Voss want damages
// ─────────────────────────────────────────────────────────────────────────────
const suitServed: SceneDef = {
  id: 'cx_ops_suit_served',
  channel: 'dialog',
  title: 'A knock, a clipboard, a smile',
  from: 'Process Server',
  start: 'door',
  nodes: {
    door: {
      speaker: 'Process Server',
      text: [
        'The man at the door is cheerful in the way only process servers are cheerful. "{name}? Great. You\'ve been served. Have a nice day." He is back in his hatchback before the door finishes swinging.',
        'COMPLAINT FOR DAMAGES. Some company you have never heard of, represented by PELLHAM & VOSS LLP, claims your "unlawful interference" cost them $6,400 in "remediation, downtime and reputational harm." There is a settlement figure in the cover letter. It is not small. It is also not $6,400.',
      ],
      choices: [
        {
          text: 'Call the number and settle. Make it disappear.',
          tag: '[$1100]',
          req: { stat: 'money', gte: 1100 },
          reqText: 'Requires $1100',
          effects: [
            { money: -1100 },
            { flag: 'cx_ops.suit_settled' },
            { quest: 'cx_ops_civil_suit_q', objective: 'answer' },
            { notify: 'Settled. Pellham & Voss send a fruit basket to someone else.', kind: 'money' },
          ],
        },
        {
          text: 'Retain a lawyer and fight it properly.',
          effects: [
            owe('cx_ops_suit_retainer', 'Lawyer retainer (civil suit)', 11, 42),
            { flag: 'cx_ops.suit_lawyer' },
            { quest: 'cx_ops_civil_suit_q', objective: 'answer' },
          ],
        },
        {
          text: 'Represent yourself. Their "damages" are made-up numbers, and you know it.',
          effects: [
            { flag: 'cx_ops.suit_pro_se' },
            { stat: 'stress', add: 4 },
            { quest: 'cx_ops_civil_suit_q', objective: 'answer' },
          ],
        },
      ],
    },
  },
}

const suitHearing: SceneDef = {
  id: 'cx_ops_suit_hearing',
  channel: 'dialog',
  title: 'Civil Department 11 — Motion Hearing',
  from: 'The Court',
  start: 'hearing',
  nodes: {
    hearing: {
      speaker: 'narrator',
      text: [
        'Pellham & Voss send a junior associate with perfect hair and a binder the size of a cinder block. He talks about "remediation" in a voice like a radio ad.',
        'The judge flips pages. "The defendant may respond."',
      ],
      choices: [
        {
          text: 'Let your lawyer take them apart.',
          if: { flag: 'cx_ops.suit_lawyer' },
          tag: '[Business DC 12]',
          check: {
            skill: 'business',
            dc: 12,
            bonuses: [{ if: { flag: 'cx_ops.suit_lawyer' }, add: 3, label: '+3 (a lawyer who reads binders)' }],
            success: 'won_lawyer',
            fail: 'lost',
          },
        },
        {
          text: 'Stand up with your own stack of invoices and do the math on their "damages" out loud.',
          if: { flag: 'cx_ops.suit_pro_se' },
          tag: '[Business DC 16]',
          check: {
            skill: 'business',
            dc: 16,
            bonuses: [{ if: hasScar('cx_ops_scar_courtroom_composure'), add: 2, label: '+2 (you stay calm in court)' }],
            success: 'won_pro_se',
            fail: 'lost',
          },
        },
        {
          text: 'Offer to settle on the courthouse steps instead.',
          tag: '[$800]',
          req: { stat: 'money', gte: 800 },
          reqText: 'Requires $800',
          effects: [{ money: -800 }, { removeObligation: 'cx_ops_suit_retainer' }, { flag: 'cx_ops.suit_settled' }],
          goto: 'steps',
        },
      ],
    },
    won_lawyer: {
      speaker: 'narrator',
      text: 'Your lawyer finds the page in the binder where their own "remediation" invoice predates the incident by a week. The judge reads it twice. Dismissed with costs. The associate\'s hair survives, just about.',
      effects: [
        { removeObligation: 'cx_ops_suit_retainer' },
        { money: 300 },
        { flag: 'cx_ops.suit_won' },
        scar('cx_ops_scar_courtroom_composure'),
        { stat: 'mood', add: 6 },
      ],
    },
    won_pro_se: {
      speaker: 'narrator',
      text: [
        'You walk the judge through their numbers one invoice at a time: the "emergency consultant" who billed forty hours on a Sunday, the "reputational harm" to a company with no customers. You never raise your voice. You never have to.',
        '"Dismissed," the judge says, and then, almost to herself: "That was very thorough." The associate closes his binder like a man closing a coffin.',
      ],
      effects: [
        { flag: 'cx_ops.suit_won' },
        { xp: 'business', add: 90 },
        { stat: 'mood', add: 8 },
        scar('cx_ops_scar_hard_bargainer'),
      ],
    },
    lost: {
      speaker: 'narrator',
      text: 'The binder wins. Binders usually do. Judgment for the plaintiff, payable in monthly installments, plus interest the judge calls "statutory" in a tone that means "sorry."',
      effects: [
        { removeObligation: 'cx_ops_suit_retainer' },
        owe('cx_ops_suit_judgment', 'Civil judgment (Pellham & Voss)', 15, 120),
        { flag: 'cx_ops.suit_lost' },
        { stat: 'stress', add: 8 },
        { scene: 'cx_ops_suit_payoff', delayHours: 24 * 30 },
      ],
    },
    steps: {
      speaker: 'Junior Associate',
      text: '"Oh thank God," the associate says, before he can stop himself. He signs your napkin-grade settlement against his binder. Everybody goes home. Nobody learns anything.',
    },
  },
}

const suitPayoff: SceneDef = {
  id: 'cx_ops_suit_payoff',
  channel: 'mail',
  title: 'Re: Judgment — lump-sum satisfaction',
  from: 'Pellham & Voss LLP',
  start: 'letter',
  nodes: {
    letter: {
      speaker: 'Pellham & Voss LLP',
      text: '"Our client is prepared to accept a discounted lump sum in full satisfaction of the judgment." Translation: collecting from you monthly is costing them more in postage than they expected.',
      choices: [
        {
          text: 'Pay the lump sum and be done with them.',
          tag: '[$1000]',
          if: { obligation: 'cx_ops_suit_judgment' },
          req: { stat: 'money', gte: 1000 },
          reqText: 'Requires $1000',
          effects: [{ money: -1000 }, { removeObligation: 'cx_ops_suit_judgment' }, { stat: 'stress', add: -5 }],
        },
        {
          text: 'Counter at half, with a spreadsheet explaining why.',
          if: { obligation: 'cx_ops_suit_judgment' },
          tag: '[Business DC 15]',
          check: {
            skill: 'business',
            dc: 15,
            bonuses: [{ if: { trait: 'cx_ops_scar_hard_bargainer' }, add: 2, label: '+2 (hard bargainer)' }],
            success: 'countered',
            fail: 'rebuffed',
          },
        },
        { text: 'Keep paying monthly. Let them lick stamps.' },
      ],
    },
    countered: {
      speaker: 'Pellham & Voss LLP',
      text: '"Our client accepts." Four words, no pleasantries. It is the most beautiful letter you have ever received.',
      effects: [{ money: -500 }, { removeObligation: 'cx_ops_suit_judgment' }, scar('cx_ops_scar_hard_bargainer')],
    },
    rebuffed: {
      speaker: 'Pellham & Voss LLP',
      text: '"Our client declines. The monthly schedule stands." Somewhere a paralegal laughs at your spreadsheet, and the installments go on.',
      effects: [{ stat: 'stress', add: 3 }],
    },
  },
}

const suitQuest: QuestDef = {
  id: 'cx_ops_civil_suit_q',
  title: 'Complication: Pellham & Voss v. You',
  kind: 'personal',
  priority: 5,
  rewards: 'Your savings, intact (maybe)',
  summary: 'A company claims your meddling cost them thousands and has sued. Settle, lawyer up, or stand in front of the judge yourself.',
  start: 'served',
  stages: {
    served: {
      text: 'You have been served with a civil complaint. Decide how to answer it.',
      onEnter: [{ scene: 'cx_ops_suit_served' }],
      objectives: [{ id: 'answer', text: 'Answer the complaint', when: { never: true }, hint: 'Settle now, retain a lawyer (a retainer you pay over time), or represent yourself (Business).' }],
      next: [{ if: { flag: 'cx_ops.suit_settled' }, stage: 'done' }, { stage: 'hearing' }],
    },
    hearing: {
      text: 'The motion hearing is set for next month. Bring your case.',
      onEnter: [{ scene: 'cx_ops_suit_hearing', delayHours: 24 * 28 }],
      objectives: [
        {
          id: 'hearing',
          text: 'Attend the hearing',
          when: { any: [{ flag: 'cx_ops.suit_won' }, { flag: 'cx_ops.suit_lost' }, { flag: 'cx_ops.suit_settled' }] },
          hint: 'At the hearing, let your lawyer work or argue the numbers yourself (Business). You can still settle on the steps.',
        },
      ],
      next: 'done',
    },
    done: {
      text: 'The lawsuit is over, one way or another.',
      onEnter: [{ log: 'Pellham & Voss have moved on to someone else.', kind: 'story' }],
      objectives: [{ id: 'ok', text: 'Resolved', when: { always: true }, hidden: true, hint: 'Done.' }],
    },
  },
}

const civilSuit: EventDef = {
  id: 'cx_ops_civil_suit',
  category: 'money',
  complication: { sources: ['legal', 'hack'], minTier: 2, maxTier: 5 },
  effects: [{ quest: 'cx_ops_civil_suit_q', start: true }],
}

// ─────────────────────────────────────────────────────────────────────────────
// cx_ops_federal_letter — T4-5: a very polite letter from the Bureau
// ─────────────────────────────────────────────────────────────────────────────
const federalLetterScene: SceneDef = {
  id: 'cx_ops_federal_letter_scene',
  channel: 'mail',
  title: 'Notice of Investigative Interest',
  from: 'The Bureau — Port Lumen Satellite Office',
  start: 'letter',
  nodes: {
    letter: {
      speaker: 'The Bureau',
      text: [
        'Heavy paper. An embossed seal. A signature from an Assistant Special Agent whose name you will never be able to spell.',
        '"This office wishes to inform you that you have been identified as a SUBJECT OF INVESTIGATIVE INTEREST in a matter concerning unauthorized access to protected systems. You are invited to contact this office to discuss the matter voluntarily. You are not under arrest. You are advised that you may consult counsel."',
        'It is the most frightening word in the language: invited.',
      ],
      choices: [
        {
          text: 'Hand it to a lawyer and let him do the talking.',
          tag: '[$1200]',
          req: { stat: 'money', gte: 1200 },
          reqText: 'Requires $1200',
          effects: [
            { money: -1200 },
            owe('cx_ops_fed_counsel', 'Federal counsel (retainer)', 12, 42),
            { stat: 'heat', add: -12 },
            { flag: 'cx_ops.fed_lawyered' },
          ],
          goto: 'lawyered',
        },
        {
          text: 'Walk in, sit down, and say as little as possible, very pleasantly.',
          tag: '[Social DC 17]',
          check: {
            skill: 'social',
            dc: 17,
            bonuses: [{ if: hasScar('cx_ops_scar_courtroom_composure'), add: 2, label: '+2 (you keep your voice level in hard rooms)' }],
            success: 'interview_ok',
            fail: 'interview_bad',
          },
        },
        {
          text: 'Go dark. Wipe, shelve the rig, lie low for a month.',
          goto: 'dark',
        },
        {
          text: 'Frame it and hang it over the desk. Let them come.',
          goto: 'bravado',
        },
      ],
    },
    lawyered: {
      speaker: 'narrator',
      text: 'Your lawyer writes one letter, two paragraphs long, that says nothing in a way that costs a great deal. The Bureau writes back even less. It goes quiet. Quiet is what you paid for.',
    },
    interview_ok: {
      speaker: 'narrator',
      text: [
        'A windowless room, a coffee you do not drink, two agents taking turns being nice. You say "I don\'t recall" in six different tones and thank them for their time.',
        'On the way out one of them says, "We\'ll be in touch." It is clearly a bluff, because they have nothing. You make it all the way to the car before your hands start shaking.',
      ],
      effects: [
        { stat: 'heat', add: -10 },
        { stat: 'stress', add: 6 },
        { xp: 'social', add: 80 },
        scar('cx_ops_scar_courtroom_composure'),
        { flag: 'cx_ops.fed_interviewed' },
      ],
    },
    interview_bad: {
      speaker: 'narrator',
      text: [
        'You were going to say nothing. You said something. One small, true, technical something, and you watched the younger agent write it down very carefully.',
        'They thank you. They mean it. Your name moves from one folder into a thicker one.',
      ],
      effects: [
        scar('cx_ops_scar_on_a_list'),
        { stat: 'heat', add: 10 },
        { stat: 'stress', add: 10 },
        { faction: 'fac.bureau', add: -3 },
        { flag: 'cx_ops.fed_talked' },
        debuff('cx_ops_fed_eyes', 'Federal Eyes', 35, [{ key: 'trace', mult: 0.85 }], 'The Bureau is actively watching your patterns. Traces come faster.'),
      ],
    },
    dark: {
      speaker: 'narrator',
      text: 'You unplug everything, sleep at a friend\'s couch twice, and let the rig gather dust under a blanket. It is the longest month of your life. They do not come. You were still right to be scared.',
      effects: [
        { stat: 'heat', add: -8 },
        { stat: 'mood', add: -5 },
        scar('cx_ops_scar_on_a_list'),
        debuff('cx_ops_gone_dark', 'Gone Dark', 28, [{ key: 'hack.speed', mult: 0.7 }, { key: 'heat.decay', add: 0.3 }], 'You shelved the rig and went quiet. Work crawls, but heat bleeds off.'),
      ],
    },
    bravado: {
      speaker: 'narrator',
      text: 'It looks great over the desk. Your friends think it is hilarious. The Bureau, which has a longer memory and less of a sense of humor, notes that you did not call.',
      effects: [
        scar('cx_ops_scar_on_a_list'),
        { stat: 'heat', add: 12 },
        { stat: 'cred', add: 4 },
        { stat: 'mood', add: 3 },
        { faction: 'fac.bureau', add: -5 },
      ],
    },
  },
}

const federalLetter: EventDef = {
  id: 'cx_ops_federal_letter',
  category: 'underground',
  complication: { sources: ['legal', 'hack'], minTier: 4, maxTier: 5 },
  repeatable: true,
  cooldownDays: 220,
  scene: 'cx_ops_federal_letter_scene',
}

const events: EventDef[] = [courtSummons, arraignment, probation, civilSuit, federalLetter]
const scenes: SceneDef[] = [
  summonsScene,
  summonsPayoff,
  arraignmentScene,
  restitutionPayoff,
  probationDeal,
  probationCheck1,
  probationCheck2,
  probationEnd,
  suitServed,
  suitHearing,
  suitPayoff,
  federalLetterScene,
]
const quests: QuestDef[] = [probationQuest, suitQuest]

export default defineContent({ events, scenes, quests })
