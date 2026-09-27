/**
 * COMPLICATION PACK — gig source (failed freelance work comes back to bite).
 *
 *   cx_ops_client_stiffs   T1-3  repeatable — the client "isn't satisfied" and won't pay: chase, shame, or write it off.
 *   cx_ops_bad_review      T1-5  repeatable — a scathing GigPost review: answer it, fix it for free, or eat it.
 *   cx_ops_crunch_rsi      T2-5  repeatable — the crunch you pulled to save the gig lands in your wrists.
 *   cx_ops_small_claims    T2-5  once, quest — a client files in small claims for a refund plus "damages".
 *
 * GigPost, its reviewers and every client here are invented.
 */
import { defineContent } from '@/engine/registry'
import type { EventDef, QuestDef, SceneDef } from '@/engine/types'
import { debuff, hasScar, owe, scar } from './_shared'

// ─────────────────────────────────────────────────────────────────────────────
// cx_ops_client_stiffs — "we've decided to go in a different direction"
// ─────────────────────────────────────────────────────────────────────────────
const stiffScene: SceneDef = {
  id: 'cx_ops_client_stiffs_scene',
  channel: 'mail',
  title: 're: invoice #0042 — some concerns',
  from: 'A Former Client',
  start: 'mail',
  nodes: {
    mail: {
      speaker: 'A Former Client',
      text: [
        '"Hi! So we\'ve had a chance to look at the deliverable and, honestly, it\'s not really what we pictured? We\'ve decided to go in a different direction, so we won\'t be moving forward with payment. We did use some of it. Just the parts that worked. Thanks so much for your flexibility!!"',
        'Two exclamation points. You count them twice. The part they "used" is the whole thing.',
      ],
      choices: [
        {
          text: 'Reply with the contract, the timestamps and a very calm tone.',
          tag: '[Business DC 12]',
          check: {
            skill: 'business',
            dc: 12,
            bonuses: [{ if: { trait: 'cx_ops_scar_hard_bargainer' }, add: 2, label: '+2 (hard bargainer)' }],
            success: 'paid',
            fail: 'ghosted',
          },
        },
        {
          text: 'Name and shame them on the jobs board.',
          goto: 'shame',
        },
        {
          text: 'Write it off. Lesson learned: deposit up front.',
          effects: [
            { stat: 'mood', add: -3 },
            { stat: 'stress', add: 3 },
            { flag: 'cx_ops.deposit_rule' },
          ],
        },
      ],
    },
    paid: {
      speaker: 'A Former Client',
      text: '"Oh! Ha. We must have misread the terms. Sending payment now." Most of it arrives the next morning, with no exclamation points at all. You frame the silence in your mind.',
      effects: [{ money: 120 }, { xp: 'business', add: 40 }, { stat: 'mood', add: 3 }],
    },
    ghosted: {
      speaker: 'narrator',
      text: 'Your very calm email gets a very calm auto-reply: "This inbox is no longer monitored." The company has, in the space of an afternoon, apparently ceased to exist. The website still uses your code.',
      effects: [{ stat: 'stress', add: 5 }, { stat: 'mood', add: -3 }],
    },
    shame: {
      speaker: 'narrator',
      text: [
        'Your post is short, precise and furious. Three freelancers reply that the same client stiffed them too. For one warm evening you are a folk hero.',
        'Then the client posts their side: "missed deadlines, broken build, rude." It is at least one-third true. The board goes quiet in that particular way that means people are taking notes on both of you.',
      ],
      effects: [
        { stat: 'mood', add: 2 },
        { stat: 'stress', add: 4 },
        { chance: 0.5, then: [scar('cx_ops_scar_botched_rep')], else: [{ stat: 'cred', add: 1 }] },
      ],
    },
  },
}

const clientStiffs: EventDef = {
  id: 'cx_ops_client_stiffs',
  category: 'money',
  complication: { sources: ['gig'], minTier: 1, maxTier: 3 },
  repeatable: true,
  cooldownDays: 120,
  scene: 'cx_ops_client_stiffs_scene',
}

// ─────────────────────────────────────────────────────────────────────────────
// cx_ops_bad_review — one star, and a paragraph
// ─────────────────────────────────────────────────────────────────────────────
const reviewScene: SceneDef = {
  id: 'cx_ops_bad_review_scene',
  channel: 'forum',
  board: 'jobs',
  title: 'GigPost review: ★☆☆☆☆ "would not hire again"',
  from: 'A Disappointed Client',
  start: 'review',
  nodes: {
    review: {
      speaker: 'A Disappointed Client',
      text: [
        '>> A Disappointed Client wrote:',
        '"Hired {handle} for what should have been a simple job. Missed the deadline, then delivered something that crashed on our office machines. Communication was fine I guess but the result was not. Save your money."',
        '>> It is pinned to the top of your GigPost profile, above four years of five-star reviews, like a stain on a white shirt.',
      ],
      choices: [
        {
          text: 'Reply publicly: own the miss, explain the fix, keep it gracious.',
          tag: '[Social DC 13]',
          check: {
            skill: 'social',
            dc: 13,
            bonuses: [{ if: hasScar('cx_ops_scar_courtroom_composure'), add: 1, label: '+1 (you stay calm under fire)' }],
            success: 'gracious',
            fail: 'defensive',
          },
        },
        {
          text: 'Fix it for free, on your own time, and ask them to update the review.',
          effects: [
            { stat: 'energy', add: -12 },
            { stat: 'stress', add: 4 },
            debuff('cx_ops_free_fix', 'Unpaid Fix', 7, [{ key: 'freelance.speed', mult: 0.85 }], 'You are spending evenings fixing an old job for free.'),
          ],
          goto: 'fixed',
        },
        {
          text: 'Ignore it. One review can\'t sink you.',
          goto: 'ignored',
        },
      ],
    },
    gracious: {
      speaker: 'narrator',
      text: 'Your reply is short and decent: what went wrong, what you changed, no excuses. A week later a new client mentions it by name. "Anyone can mess up. I liked how you handled it." Somehow the stain became a selling point.',
      effects: [{ xp: 'social', add: 40 }, { stat: 'mood', add: 3 }, { flag: 'cx_ops.review_answered' }],
    },
    defensive: {
      speaker: 'narrator',
      text: 'You meant to write something gracious. What you posted has the word "actually" in it three times. The client replies. You reply. Strangers start taking sides, and the thread gets longer than the job ever was.',
      effects: [scar('cx_ops_scar_botched_rep'), { stat: 'stress', add: 5 }, { flag: 'cx_ops.review_flamewar' }],
    },
    fixed: {
      speaker: 'narrator',
      text: 'Four evenings of unpaid work later, the thing runs on their office machines. The client updates the review to three stars and "responsive, eventually." It is not a win. It is not a scar either.',
      effects: [{ xp: 'programming', add: 45 }, { flag: 'cx_ops.review_fixed' }],
    },
    ignored: {
      speaker: 'narrator',
      text: 'It can, a little. The review sits there for months, the first thing anyone sees. The offers still come, just smaller, and clients open with "so about that review."',
      effects: [scar('cx_ops_scar_botched_rep'), { stat: 'mood', add: -2 }],
    },
  },
}

const badReview: EventDef = {
  id: 'cx_ops_bad_review',
  category: 'work',
  complication: { sources: ['gig'], minTier: 1, maxTier: 5 },
  repeatable: true,
  cooldownDays: 140,
  scene: 'cx_ops_bad_review_scene',
}

// ─────────────────────────────────────────────────────────────────────────────
// cx_ops_crunch_rsi — the crunch lands in your wrists
// ─────────────────────────────────────────────────────────────────────────────
const rsiScene: SceneDef = {
  id: 'cx_ops_crunch_rsi_scene',
  channel: 'dialog',
  title: '3:40 a.m., the kitchen table',
  from: 'Your Right Wrist',
  start: 'hands',
  nodes: {
    hands: {
      speaker: 'narrator',
      text: [
        'You pulled three all-nighters to save that gig and lost it anyway. The gig is gone. The all-nighters stayed.',
        'There is a hot wire running from your right wrist to your elbow. Your fingers buzz when you type, as if the keyboard were plugged into the wall. You drop a mug. You never drop mugs.',
      ],
      choices: [
        {
          text: 'See a doctor, buy the ugly brace, do the stretches.',
          tag: '[$180]',
          req: { stat: 'money', gte: 180 },
          reqText: 'Requires $180',
          effects: [
            { money: -180 },
            { flag: 'cx_ops.rsi_treated' },
            debuff('cx_ops_brace', 'Wrist Brace', 14, [{ key: 'freelance.speed', mult: 0.9 }, { key: 'hack.speed', mult: 0.9 }], 'An ugly brace and a stretching routine. Slower for two weeks, fine after.'),
          ],
          goto: 'doctor',
        },
        {
          text: 'Take two weeks off the keyboard entirely.',
          effects: [
            { flag: 'cx_ops.rsi_rested' },
            { stat: 'stress', add: -4 },
            debuff('cx_ops_rsi_rest', 'Resting Your Hands', 14, [{ key: 'freelance.speed', mult: 0.6 }, { key: 'hack.speed', mult: 0.6 }], 'Doctor\'s orders you gave yourself: barely any typing for two weeks.'),
          ],
          goto: 'rest',
        },
        {
          text: 'Ice it, ibuprofen, push through. You have more gigs queued.',
          tag: '[Fitness DC 13]',
          check: {
            skill: 'fitness',
            dc: 13,
            success: 'lucky',
            fail: 'tunnel',
          },
        },
      ],
    },
    doctor: {
      speaker: 'narrator',
      text: 'The doctor says "repetitive strain" in a bored voice and prints you a sheet of stretches with a clip-art hand on it. You feel ridiculous doing them. In two weeks the wire in your arm is gone.',
    },
    rest: {
      speaker: 'narrator',
      text: 'Two weeks of not typing is two weeks of learning what your brain does when it cannot type. Mostly it paces. You read three paperbacks. Your wrists forgive you.',
    },
    lucky: {
      speaker: 'narrator',
      text: 'You ice it, shift the keyboard, fix your chair and grind it out. The buzzing fades over a week. You got away with it this time, and you know exactly how close it was.',
      effects: [{ stat: 'health', add: -3 }, { xp: 'fitness', add: 20 }],
    },
    tunnel: {
      speaker: 'narrator',
      text: [
        'You push. It pushes back. By the end of the month the buzzing is a constant, and the doctor you finally see uses a longer word and a more serious face.',
        '"This is chronic now. You can manage it. You won\'t get rid of it." You type the rest of that night\'s work with two fingers.',
      ],
      effects: [scar('cx_ops_scar_carpal_tunnel'), { stat: 'health', add: -6 }, { money: -120 }, { stat: 'mood', add: -5 }],
    },
  },
}

const crunchRsi: EventDef = {
  id: 'cx_ops_crunch_rsi',
  category: 'health',
  complication: { sources: ['gig'], minTier: 2, maxTier: 5 },
  when: { not: { trait: 'cx_ops_scar_carpal_tunnel' } },
  repeatable: true,
  cooldownDays: 240,
  scene: 'cx_ops_crunch_rsi_scene',
}

// ─────────────────────────────────────────────────────────────────────────────
// cx_ops_small_claims — the client wants their money back, plus "damages"
// ─────────────────────────────────────────────────────────────────────────────
const claimFiled: SceneDef = {
  id: 'cx_ops_small_claims_filed',
  channel: 'mail',
  title: 'NOTICE OF CLAIM — Small Claims Division',
  from: 'Small Claims Clerk',
  start: 'notice',
  nodes: {
    notice: {
      speaker: 'Small Claims Clerk',
      text: [
        '"The plaintiff, Bayline Marine Supply, claims $750 from the defendant for defective services (refund of fees paid) and consequential losses. A hearing has been scheduled. Both parties may present documents."',
        'Bayline Marine Supply. The boat-parts website. The one where you told them in writing that their old server would not survive the launch, and they said "just make it work," and it did not survive the launch.',
      ],
      choices: [
        {
          text: 'Refund them and walk away before it gets expensive.',
          tag: '[$350]',
          req: { stat: 'money', gte: 350 },
          reqText: 'Requires $350',
          effects: [
            { money: -350 },
            { flag: 'cx_ops.claims_refunded' },
            { quest: 'cx_ops_small_claims_q', objective: 'answer' },
          ],
        },
        {
          text: 'Dig up every email where you warned them. Build the folder.',
          effects: [
            { stat: 'energy', add: -8 },
            { flag: 'cx_ops.claims_prepared' },
            { quest: 'cx_ops_small_claims_q', objective: 'answer' },
          ],
        },
        {
          text: 'Counter-claim for the unpaid final invoice they "forgot".',
          effects: [
            { flag: 'cx_ops.claims_countered' },
            { stat: 'stress', add: 4 },
            { quest: 'cx_ops_small_claims_q', objective: 'answer' },
          ],
        },
      ],
    },
  },
}

const claimHearing: SceneDef = {
  id: 'cx_ops_small_claims_hearing',
  channel: 'dialog',
  title: 'Small Claims, Room 3B',
  from: 'The Court',
  start: 'room',
  nodes: {
    room: {
      speaker: 'narrator',
      text: [
        'Small claims is a room with a flag, a folding table and a commissioner who has heard every story there is. The owner of Bayline Marine Supply shows up in a fishing vest and talks for nine minutes about "the launch."',
        '"And the defendant?" the commissioner asks, not unkindly.',
      ],
      choices: [
        {
          text: 'Lay out the paper trail, one dated email at a time.',
          tag: '[Business DC 14]',
          check: {
            skill: 'business',
            dc: 14,
            bonuses: [
              { if: { flag: 'cx_ops.claims_prepared' }, add: 3, label: '+3 (you brought the folder)' },
              { if: { flag: 'cx_ops.claims_countered' }, add: 1, label: '+1 (your counter-claim shifts the frame)' },
              { if: hasScar('cx_ops_scar_courtroom_composure'), add: 1, label: '+1 (you stay calm in court)' },
            ],
            success: 'won',
            fail: 'lost',
          },
        },
        {
          text: 'Offer to split the difference in the hallway.',
          tag: '[$200]',
          req: { stat: 'money', gte: 200 },
          reqText: 'Requires $200',
          effects: [{ money: -200 }, { flag: 'cx_ops.claims_split' }],
          goto: 'split',
        },
      ],
    },
    won: {
      speaker: 'narrator',
      text: [
        'You read three emails aloud. "This server will not survive the launch." "Just make it work." "Why is the site down." The commissioner actually laughs, then apologizes for laughing.',
        '"Claim denied." And, because you asked: "Counter-claim granted for the final invoice." The fishing vest leaves without a word. You walk out knowing, in your bones, what your time is worth.',
      ],
      effects: [
        { flag: 'cx_ops.claims_won' },
        { if: { flag: 'cx_ops.claims_countered' }, then: [{ money: 220 }] },
        { xp: 'business', add: 70 },
        scar('cx_ops_scar_hard_bargainer'),
      ],
    },
    lost: {
      speaker: 'narrator',
      text: 'You know you are right, and you explain it like someone who knows they are right. The commissioner rules for the fishing vest, "in the interest of fairness to small businesses." You are also a small business. Nobody mentions it.',
      effects: [
        { flag: 'cx_ops.claims_lost' },
        owe('cx_ops_claims_judgment', 'Small-claims judgment (Bayline)', 6, 90),
        scar('cx_ops_scar_botched_rep'),
        { stat: 'mood', add: -4 },
        { scene: 'cx_ops_small_claims_payoff', delayHours: 24 * 21 },
      ],
    },
    split: {
      speaker: 'Bayline Marine Supply',
      text: '"...Fine. Fine. But the site better stay up." It will not be your problem if it does not. You shake a hand that smells like bilge and never think about boat parts again.',
    },
  },
}

const claimPayoff: SceneDef = {
  id: 'cx_ops_small_claims_payoff',
  channel: 'mail',
  title: 'Bayline — judgment balance',
  from: 'Bayline Marine Supply',
  start: 'note',
  nodes: {
    note: {
      speaker: 'Bayline Marine Supply',
      text: '"Look, the monthly checks are a pain for my bookkeeper too. Pay the rest in one go and we\'ll call it square." Handwritten, on the back of a boat-parts catalogue.',
      choices: [
        {
          text: 'Send the check and end it.',
          tag: '[$300]',
          if: { obligation: 'cx_ops_claims_judgment' },
          req: { stat: 'money', gte: 300 },
          reqText: 'Requires $300',
          effects: [{ money: -300 }, { removeObligation: 'cx_ops_claims_judgment' }, { stat: 'stress', add: -3 }],
        },
        { text: 'Keep paying monthly. Let the bookkeeper suffer.' },
      ],
    },
  },
}

const claimQuest: QuestDef = {
  id: 'cx_ops_small_claims_q',
  title: 'Complication: Small Claims',
  kind: 'personal',
  priority: 4,
  rewards: 'Your fee, and your pride',
  summary: 'A client whose job went bad has taken you to small claims court for a refund plus damages. Pay up, build your case, or countersue.',
  start: 'filed',
  stages: {
    filed: {
      text: 'Bayline Marine Supply has filed a claim against you. Decide how to answer it before the hearing.',
      onEnter: [{ scene: 'cx_ops_small_claims_filed' }],
      objectives: [{ id: 'answer', text: 'Answer the claim', when: { never: true }, hint: 'Refund them, build a paper trail (a bonus at the hearing), or counter-claim for your unpaid invoice.' }],
      next: [{ if: { flag: 'cx_ops.claims_refunded' }, stage: 'done' }, { stage: 'hearing' }],
    },
    hearing: {
      text: 'The small-claims hearing is in three weeks.',
      onEnter: [{ scene: 'cx_ops_small_claims_hearing', delayHours: 24 * 21 }],
      objectives: [
        {
          id: 'hearing',
          text: 'Attend the hearing',
          when: { any: [{ flag: 'cx_ops.claims_won' }, { flag: 'cx_ops.claims_lost' }, { flag: 'cx_ops.claims_split' }] },
          hint: 'Present your case (Business; the folder helps) or settle in the hallway.',
        },
      ],
      next: 'done',
    },
    done: {
      text: 'The Bayline business is closed.',
      onEnter: [{ log: 'The small-claims case is over.', kind: 'story' }],
      objectives: [{ id: 'ok', text: 'Resolved', when: { always: true }, hidden: true, hint: 'Done.' }],
    },
  },
}

const smallClaims: EventDef = {
  id: 'cx_ops_small_claims',
  category: 'money',
  complication: { sources: ['gig'], minTier: 2, maxTier: 5 },
  effects: [{ quest: 'cx_ops_small_claims_q', start: true }],
}

const events: EventDef[] = [clientStiffs, badReview, crunchRsi, smallClaims]
const scenes: SceneDef[] = [stiffScene, reviewScene, rsiScene, claimFiled, claimHearing, claimPayoff]
const quests: QuestDef[] = [claimQuest]

export default defineContent({ events, scenes, quests })
