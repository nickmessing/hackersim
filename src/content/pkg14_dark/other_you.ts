/**
 * PKG-14 — Side (Dark / meta): `side_the_other_you` (bible §8.40, motif table §6.E).
 *
 * The warm "you've got mail" gag, inverted: an ad arrives that knows you too well. PARALLAX has
 * built a little model of you out of a decade of exhaust, and it would like to show you what it
 * thinks you'll do next. You can prove it right, try to prove it wrong (and learn that spite is a
 * behavior too), or poison the model. Either way you walk out with proof it profiles individuals —
 * a fragment of the case — and a new, cold feeling about your own free will.
 *
 * Sets: `side.predictable` (you matched it), `side.other_you_done` (completion). Adds to the shared
 * counters `w.exposure` and `evidence_fragments` (read by PKG-04 `trig_evidence`).
 * Reads (cross-package): `a3.truth_t3` (PKG-03). Reactivity branches use engine-owned state only
 * (money, romance, housing, traits) so the ad can "know you" without cross-package flag reads.
 */
import { defineContent } from '@/engine/registry'
import type { QuestDef, SceneDef } from '@/engine/types'

const quest: QuestDef = {
  id: 'side_the_other_you',
  title: 'The Other You',
  kind: 'side',
  act: 3,
  priority: 7,
  autoStart: {
    all: [{ var: 'act', gte: 3 }, { any: [{ flag: 'a3.truth_t3' }, { var: 'w.enclosure', gte: 3 }] }],
  },
  rewards: 'A cold new kind of dread — and a receipt PARALLAX never meant to leave',
  summary:
    'An ad arrived with your name spelled right and your next three moves already guessed. Somewhere a model of you is running, better rested than you are. Meet it. Decide whether it\'s right about you.',
  start: 'open',
  stages: {
    open: {
      text:
        'An advertisement is sitting in your inbox that knows what you bought last month, what you almost bought, and — it claims — what you are about to do next. It is signed by a "marketing partner" you have started to recognize. Open it, and find out how much of you is already on file.',
      onEnter: [{ scene: 'dark_other_you' }],
      objectives: [
        {
          id: 'meet_it',
          text: 'Answer the ad that knows too much',
          when: { flag: 'side.other_you_done' },
          hint: 'Open the dialog. You can match its prediction, defy it, or try to poison the model with [Cryptography]. Read to the end either way — the ad itself is evidence.',
        },
      ],
    },
  },
}

const scene: SceneDef = {
  id: 'dark_other_you',
  channel: 'dialog',
  title: 'A Message Chosen For You',
  from: 'PARALLAX',
  start: 'intro',
  nodes: {
    intro: {
      speaker: 'PARALLAX',
      text: [
        'The banner unfurls in that too-friendly font every ad wears now. "Hello, {name}! Based on your recent activity, we think you\'ll love these." Nothing unusual. Then the pictures load.',
        {
          if: { stat: 'money', gte: 40000 },
          text: 'A watch you looked at once, late, and closed the tab on. The exact model. The exact night.',
          else: 'A budgeting service. A payday advance. The specific, dignified shame of an ad that has correctly guessed you are short this month.',
        },
        {
          if: { npc: 'grace', romance: ['dating', 'partner', 'engaged', 'married'] },
          text: 'A restaurant near Harbor General with a late table, "for two," on a night you happen to be free.',
        },
        {
          if: { npc: 'mira', romance: ['dating', 'partner', 'engaged', 'married'] },
          text: 'A refurbished router — the exact one you\'ve been meaning to replace — and, beneath it, "customers like you also bought" a single travel mug that says nothing but a small pair of asterisks.',
        },
      ],
      next: 'reveal',
    },
    reveal: {
      speaker: 'PARALLAX',
      text: [
        'You do the thing you always do: you look at the ad the way you\'d look at a lock. And the ad, sensing engagement, opens a little further than an ad should. A panel slides down like it was waiting for you. "You\'re curious," it says warmly. "We modeled that too."',
        'It shows you a card. YOUR NEXT SEVEN DAYS, it says, the way a horoscope would, except a horoscope guesses and this thing measures. Three lines. What you\'ll buy. Who you\'ll call. And one line it has greyed out, coyly, marked DECISION PENDING, with a little confidence bar already three-quarters full.',
        {
          if: { flag: 'a3.truth_t3' },
          text: 'You know what it is now, because the Oracle already told you: Special Accounts isn\'t a person, it\'s a seat, and PARALLAX has been quietly interviewing candidates for it. This is the interview. You are reading your own dossier, dressed up as a coupon.',
        },
      ],
      next: 'choice',
    },
    choice: {
      speaker: 'narrator',
      text:
        'The confidence bar sits there, pulsing, patient. It has already decided which way you break. The only open question is whether you agree.',
      choices: [
        {
          text: 'Save the whole thing — banner, panel, dossier — before it can pull it back. Then close the tab.',
          tag: '[Take the receipt]',
          effects: [
            { var: 'evidence_fragments', add: 1 },
            { var: 'w.exposure', add: 1 },
            { stat: 'stress', add: 6 },
            { flag: 'side.other_you_done' },
          ],
          goto: 'saved',
        },
        {
          text: 'Read the greyed line. Then do exactly that, on purpose, because it\'s what you were going to do anyway.',
          tag: '[Match it]',
          effects: [
            { var: 'evidence_fragments', add: 1 },
            { var: 'w.exposure', add: 1 },
            { flag: 'side.predictable' },
            { stat: 'mood', add: -10 },
            { stat: 'stress', add: 8 },
            { flag: 'side.other_you_done' },
          ],
          goto: 'matched',
        },
        {
          text: 'Do the opposite. Whatever it predicted, break the pattern — prove you\'re not a graph.',
          tag: '[Defy it]',
          effects: [
            { var: 'evidence_fragments', add: 1 },
            { var: 'w.exposure', add: 1 },
            { money: -600 },
            { stat: 'mood', add: -4 },
            { flag: 'side.other_you_done' },
          ],
          goto: 'defied',
        },
        {
          text: 'Feed it garbage. Bury your real pattern under a week of noise it can\'t model.',
          tag: '[Cryptography 18]',
          check: {
            skill: 'cryptography',
            dc: 18,
            success: 'poison_ok',
            fail: 'poison_fail',
            bonuses: [
              { if: { trait: 'paranoid' }, add: 2, label: '+2 (you have always assumed you were watched)' },
            ],
            successEffects: [
              { var: 'evidence_fragments', add: 1 },
              { var: 'w.exposure', add: 1 },
              { stat: 'cred', add: 4 },
              { stat: 'mood', add: 4 },
              { flag: 'side.other_you_done' },
            ],
            failEffects: [
              { var: 'evidence_fragments', add: 1 },
              { var: 'w.exposure', add: 1 },
              { flag: 'side.predictable' },
              { stat: 'stress', add: 10 },
              { trait: 'pkg14_dark_modeled' },
              { flag: 'side.other_you_done' },
            ],
          },
        },
      ],
    },
    saved: {
      speaker: 'narrator',
      text: [
        'You copy it out — the whole obscene, chatty little dossier — before the panel can decide you\'ve seen enough and roll back up. It fights you for half a second, which is how you know it matters. Then it\'s yours: a coupon that profiles a human being, with the human being\'s name on it, in a company\'s own cheerful voice.',
        'You never read the greyed line. Some things you don\'t want measured, even by yourself. But you have the receipt now, and a receipt is the one thing a firm like this spends millions to never, ever leave. It goes in the drawer with the rest of the case, and you sit in the dark a while, not buying the watch.',
      ],
    },
    matched: {
      speaker: 'narrator',
      text: [
        'You read the greyed line. It is not dramatic. It is a small, ordinary choice — the kind you make a dozen times a week without noticing — and it is exactly, boringly right. You do it. The confidence bar fills the rest of the way and the panel says, kindly, "Thanks for confirming!" the way a trap says nothing at all.',
        'That is the horror of it: not that it read your mind, but that there wasn\'t much to read. You are a pattern, well-lit and well-behaved, and the machine that watches you sleeps better than you do because it already knows how tomorrow ends. You keep the receipt. You are not sure, anymore, that keeping it wasn\'t predicted too.',
      ],
    },
    defied: {
      speaker: 'narrator',
      text: [
        'You do the other thing. The stupid thing, the expensive thing, the thing you did not want — purely so that no machine gets to be right about you tonight. It feels, for about four minutes, like freedom. Then it feels like what it is, which is spite, which is also a behavior, which is also on file.',
        'Somewhere the model updates: SUBJECT DEVIATES WHEN OBSERVED. Adds a column. Refits. It doesn\'t mind being wrong once; being wrong is how it gets righter. You kept the receipt, at least. And you proved you\'re unpredictable, at a cost, on demand, exactly when prompted — which, you realize on the drive home, is its own kind of predictable.',
      ],
    },
    poison_ok: {
      speaker: 'narrator',
      text: [
        'You don\'t argue with the model. You drown it. For a week you become somebody else on purpose — wrong hours, wrong buys, wrong calls, a whole fictional person laid down thick over the real one until the real one can\'t be read through the noise. The confidence bar, when you check back, has slumped to a shrug.',
        'It is the first time in months you\'ve felt genuinely unseen, and the feeling is so good it frightens you a little. You kept the receipt, too — proof it tried, and proof it can be blinded, which is worth as much as either fact alone. The greyed line stays greyed. Let it wonder.',
      ],
    },
    poison_fail: {
      speaker: 'narrator',
      text: [
        'You try to bury yourself in noise, and for a day or two it works — and then the model does the thing you keep forgetting it can do, which is treat your camouflage as one more signal. It finds the shape of the lie and infers the truth from the outline of it, the way you can find a hidden object by the wrinkle in the sheet.',
        'The confidence bar comes back higher than before. SUBJECT ATTEMPTS OBFUSCATION UNDER STRESS, it might as well say. You gave it a harder puzzle and it thanked you for the exercise. You keep the receipt. It is, tonight, cold comfort, and you are learning that cold comfort is the only kind this city stocks.',
        'A week later another ad arrives. It does not know you better. It knows you *differently* — it offers you a privacy product, a burner-phone plan, a paperback called Disappearing for Beginners. It has filed you under PEOPLE WHO HIDE. Every careful thing you do from now on is one more data point in a category you built for it yourself.',
      ],
    },
  },
}

export default defineContent({
  quests: [quest],
  scenes: [scene],
})
