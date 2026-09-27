/**
 * PKG-15 — Life events §9.2: health, stress, aging.
 *
 *  - life_burnout        recurring warning at stress ≥ 90 ("the edge"); narrates `sys.burnouts`.
 *  - life_burnout_hits   edge-triggered on the engine's burnout counter (`sys.burnouts` incrementing,
 *                        tracked by `life.burnouts_seen`): first / second / third (the E7 warning) / again.
 *  - life_crunch_cold    Act II+, energy ≤ 20: push through or rest.
 *  - life_gym_mishap     rare, while you actually train: a fitness debuff.
 *  - life_aging_mirror   one-off at 27 (AGING_START): foreshadows the Act IV body.
 *  - life_hospital_bill  edge-triggered on `sys.hospitalized` incrementing (tracked by `life.hosp_seen`).
 *                        The engine has ALREADY deducted the base bill (3 days × $120): this beat never
 *                        charges it again. It delivers a bedside scene (who came to see you) and a
 *                        statement; only when PARALLAX risk scoring is live (w.aperture_state='thriving'
 *                        and w.enclosure ≥ 2) does the statement carry a surcharge + coverage denial
 *                        (pay / negotiate [Business DC 14] / ignore → collections).
 */
import { defineContent } from '@/engine/registry'
import type { BuffDef, Cond, Effect, SceneDef, TriggerDef } from '@/engine/types'
import { QUIET_RESET, actGte, around, close, free, momHere, partnerIs, withPartner } from './_shared'

// ── Buffs (inline, owned by this package) ────────────────────────────────────

const HEAD_COLD: BuffDef = {
  id: 'life_head_cold',
  name: 'Head Cold',
  desc: 'Stuffed up, foggy, and sneezing on your keyboard.',
  days: 5,
  bad: true,
  mods: [{ key: 'efficiency', mult: 0.85 }],
}
const FLU: BuffDef = {
  id: 'life_flu',
  name: 'The Flu',
  desc: 'You pushed a cold into a flu. Everything aches, including your opinions.',
  days: 7,
  bad: true,
  mods: [
    { key: 'efficiency', mult: 0.7 },
    { key: 'energy.drain', mult: 1.15 },
  ],
}
const RESTING: BuffDef = {
  id: 'life_resting',
  name: 'Actually Resting',
  desc: 'Soup, blankets, and nothing with a keyboard.',
  days: 3,
  mods: [
    { key: 'energy.regen', mult: 1.25 },
    { key: 'stress.relief', mult: 1.2 },
  ],
}
const ESPRESSO: BuffDef = {
  id: 'life_espresso_bargain',
  name: 'Espresso Bargain',
  desc: 'Three shots and a prayer. It is working. It will stop working.',
  days: 2,
  mods: [
    { key: 'efficiency', mult: 1.05 },
    { key: 'stress.gain', mult: 1.25 },
  ],
}
const pulled = (days: number): BuffDef => ({
  id: 'life_pulled_muscle',
  name: 'Pulled Muscle',
  desc: 'Every stair has an opinion about your hamstring.',
  days,
  bad: true,
  mods: [
    { key: 'xp.fitness', mult: 0.5 },
    { key: 'energy.drain', mult: 1.05 },
  ],
})
const REST_WEEK: BuffDef = {
  id: 'life_rest_week',
  name: 'A Real Week Off',
  desc: 'You told the world you were unavailable, and the world, astonishingly, coped.',
  days: 7,
  mods: [
    { key: 'stress.relief', mult: 1.35 },
    { key: 'mood.daily', add: 1 },
  ],
}
const NEW_LEAF: BuffDef = {
  id: 'life_new_leaf',
  name: 'New Leaf',
  desc: 'Running shoes by the door. You are going to be one of those people now.',
  days: 30,
  mods: [{ key: 'xp.fitness', mult: 1.3 }],
}
const DISCHARGE: BuffDef = {
  id: 'life_discharge_orders',
  name: 'Discharge Orders',
  desc: 'Fluids, sleep, and no screens after midnight. You are mostly following them.',
  days: 7,
  mods: [
    { key: 'health.daily', add: 0.5 },
    { key: 'stress.gain', mult: 0.9 },
  ],
}

// ── Edge-triggered counters ──────────────────────────────────────────────────

/** True when the engine counter `engineVar` has moved past what we've narrated in `seenVar`. */
function behind(engineVar: string, seenVar: string, max = 15): Cond {
  const rows: Cond[] = []
  for (let k = 1; k <= max; k++) rows.push({ all: [{ var: engineVar, gte: k }, { var: seenVar, lte: k - 1 }] })
  return { any: rows }
}

/** PARALLAX risk scoring is live in the insurance market. */
const PARALLAX_LIVE: Cond = { all: [{ flag: 'w.aperture_state', eq: 'thriving' }, { var: 'w.enclosure', gte: 2 }] }

/** Somebody who would come to your bedside. */
const VISITOR: Cond = {
  any: [withPartner, momHere, close('jax', 30), close('kim', 30), close('dad', 30)],
}

/** Thank whoever is closest (first match). */
const THANK_VISITOR: Effect = {
  if: withPartner,
  then: [{ if: partnerIs('mira'), then: [{ npc: 'mira', affinity: 3 }], else: [{ npc: 'grace', affinity: 3 }] }],
  else: [
    {
      if: momHere,
      then: [{ npc: 'mom', affinity: 3 }],
      else: [{ if: close('jax', 30), then: [{ npc: 'jax', affinity: 3 }], else: [{ npc: 'kim', affinity: 3 }] }],
    },
  ],
}

// ════════════════════════════════════════════════════════════════════════════
// Scenes
// ════════════════════════════════════════════════════════════════════════════

const scenes: SceneDef[] = [
  // ── life_burnout: the edge ───────────────────────────────────────────────
  {
    id: 'life_burnout',
    channel: 'dialog',
    title: 'The Edge',
    start: 'start',
    nodes: {
      start: {
        speaker: 'narrator',
        text: [
          'It\'s late. The cursor blinks. You read the same line of text four times and it still doesn\'t mean anything. Your jaw hurts; you\'ve been clenching it for, apparently, days.',
          { if: { var: 'sys.burnouts', lte: 0 }, text: 'You have never actually hit the wall. You can feel it from here, though: a kind of low hum under everything, like a hard drive about to click.' },
          { if: { var: 'sys.burnouts', eq: 1 }, text: 'You\'ve been here before. Once. It took five days to feel like a person again, and you swore that time would be the last time.' },
          { if: { var: 'sys.burnouts', eq: 2 }, text: 'Twice now you\'ve gone over this edge. You know exactly what the bottom looks like. You can see it from here.' },
          { if: { var: 'sys.burnouts', gte: 3 }, text: 'You have hit the wall {var:sys.burnouts} times. Some of the people who used to call you stopped calling during one of them. You don\'t remember which.' },
          { if: { flag: 'side.zero_day' }, text: 'Since the seventy-two-hour job, your hands shake a little when you\'re this tired. You\'ve started holding the coffee mug with both of them.' },
        ],
        choices: [
          {
            text: 'Close everything. Sleep fourteen hours.',
            effects: [{ stat: 'stress', add: -25 }, { stat: 'energy', add: 20 }, { stat: 'mood', add: 3 }],
            goto: 'sleep',
          },
          {
            text: 'Call Jax.',
            if: around('jax'),
            effects: [{ stat: 'stress', add: -15 }, { npc: 'jax', affinity: 3 }],
            goto: 'jax',
          },
          {
            text: 'Call Mom. It\'s 2 a.m. She\'ll pick up.',
            if: momHere,
            effects: [{ stat: 'stress', add: -15 }, { npc: 'mom', affinity: 3 }],
            goto: 'mom',
          },
          {
            text: 'Go for a run. Right now. In the dark.',
            tag: '[Fitness]',
            check: {
              skill: 'fitness',
              dc: 12,
              bonuses: [{ if: { trait: 'gym_rat' }, add: 2, label: '+2 (gym rat)' }],
              success: 'run_ok',
              fail: 'run_bench',
              successEffects: [{ stat: 'stress', add: -18 }, { xp: 'fitness', add: 20 }],
              failEffects: [{ stat: 'stress', add: -8 }, { stat: 'health', add: -2 }, { stat: 'energy', add: -8 }],
            },
          },
          {
            text: [{ if: { trait: 'caffeine_fiend' }, text: 'Another pot of coffee. One more hour.', else: 'Push through. One more hour.' }],
            effects: [{ stat: 'stress', add: 5 }, { stat: 'mood', add: -4 }, { xp: 'programming', add: 15 }],
            goto: 'push',
          },
        ],
      },
      sleep: {
        speaker: 'narrator',
        text: 'You close the laptop like you\'re closing a door on something with teeth. You sleep through two alarms and a garbage truck. When you wake up it is somehow afternoon, and the light on the ceiling is the most interesting thing you\'ve seen in weeks.',
      },
      jax: {
        speaker: 'jax',
        text: '"Dude. It\'s two a.m." A pause. Then, because he is Jax: "Okay. Talk. Or don\'t talk, I got the late-night infomercials on, we can just watch a man sell knives together." You don\'t talk. You watch a man sell knives for forty minutes, on the phone, together. It helps more than it has any right to.',
      },
      mom: {
        speaker: 'mom',
        text: 'She picks up on the second ring like she was waiting. "What\'s wrong." Not a question. You say nothing\'s wrong. She says, "Okay," and talks about the Quinteros\' new dog until your breathing slows down. At the end she says, "Go to sleep. That\'s an order from your mother," and hangs up before you can argue.',
      },
      run_ok: {
        speaker: 'narrator',
        text: 'The Row at 2 a.m. is yours: wet pavement, one working streetlight, the Sound breathing out fog. You run until your lungs burn louder than your thoughts. You come home soaked, ridiculous, and lighter.',
      },
      run_bench: {
        speaker: 'narrator',
        text: 'You make it four blocks before a stitch folds you in half. You sit on a bench by the water and watch the tugboat lights until you can breathe. It isn\'t the run you wanted. It\'s the bench you needed.',
      },
      push: {
        speaker: 'narrator',
        text: 'One more hour becomes three. You get some work done. You are aware, in the way you are aware of weather, that you are borrowing against something, and that the interest rate is terrible.',
      },
    },
  },

  // ── Burnout aftermath ───────────────────────────────────────────────────
  {
    id: 'life_burnout_first',
    channel: 'dialog',
    title: 'The Wall',
    start: 'start',
    nodes: {
      start: {
        speaker: 'narrator',
        text: [
          'You sit down at the desk at nine in the morning. At two in the afternoon you notice you\'re still sitting there, and that you have not done anything, and that you have been staring at the same icon for five hours.',
          'It isn\'t sadness. It\'s quieter than that. It\'s like somebody unplugged the part of you that wanted things.',
          'This is burnout. Everybody on the board jokes about it. Nobody jokes about it when it\'s happening.',
        ],
        choices: [
          {
            text: 'Tell someone. Out loud.',
            effects: [{ stat: 'stress', add: -10 }, THANK_VISITOR],
            goto: 'told',
          },
          {
            text: 'Take a real week off. Tell everyone you\'re unavailable.',
            effects: [{ buff: REST_WEEK }, { stat: 'cred', add: -1 }],
            goto: 'week',
          },
          {
            text: 'Hide it. Keep the lights on. Nobody needs to know.',
            effects: [{ stat: 'stress', add: 4 }, { stat: 'mood', add: -4 }],
            goto: 'hid',
          },
        ],
      },
      told: {
        speaker: 'narrator',
        text: [
          { if: VISITOR, text: 'You say "I think I\'m kind of broken right now" to somebody who loves you, and they don\'t fix it, and they don\'t panic. They just bring over food and sit on the other end of the couch while you don\'t talk. That turns out to be the treatment.', else: 'You say "I think I\'m kind of broken right now" out loud, to the empty room, because there is nobody to say it to. It still helps, a little. It also tells you something you didn\'t want to know.' },
        ],
      },
      week: {
        speaker: 'narrator',
        text: 'You set an away message. You unplug the modem and put it in a drawer, like a cigarette. The first two days are unbearable. On the third day you read a book with no keyboard in it. On the fifth you notice the sky.',
      },
      hid: {
        speaker: 'narrator',
        text: 'You keep answering pages. You keep the contracts moving, slowly, at half speed. Nobody notices, which is the saddest part, and the thing you think about most when it\'s over.',
      },
    },
  },
  {
    id: 'life_burnout_second',
    channel: 'chat',
    title: 'you ok?',
    from: 'jax',
    start: 'start',
    nodes: {
      start: {
        speaker: 'jax',
        text: [
          'hey',
          'u ok? not like joke u ok. like actually',
          'u went quiet for like a week and when u came back u typed like a screensaver',
          'this is the second time man. i counted',
        ],
        choices: [
          { text: '"yeah. no. not really. can u come over"', effects: [{ npc: 'jax', affinity: 4 }, { stat: 'stress', add: -12 }], goto: 'over' },
          { text: '"im fine. just tired. dont worry about it"', effects: [{ npc: 'jax', affinity: -1 }], goto: 'fine' },
          {
            text: '"i am a finely tuned machine running at 110%"',
            tag: '[Social]',
            check: {
              skill: 'social',
              dc: 12,
              success: 'joke_ok',
              fail: 'joke_flat',
              successEffects: [{ stat: 'stress', add: -6 }, { npc: 'jax', affinity: 2 }],
              failEffects: [{ npc: 'jax', affinity: -3 }, { stat: 'stress', add: 2 }],
            },
          },
        ],
      },
      over: { speaker: 'jax', text: ['omw. bringing the bad pizza', 'the GOOD bad pizza'] },
      fine: { speaker: 'jax', text: ['ok', 'ok man', 'im here tho. like. im always here'] },
      joke_ok: { speaker: 'jax', text: ['lol ok machine', 'machines need oil. im bringing oil. by oil i mean pizza', 'ttyl dont die'] },
      joke_flat: { speaker: 'jax', text: ['...', 'dude thats what u said last time', 'ok. im around if u want'] },
    },
  },
  {
    id: 'life_burnout_third',
    channel: 'dialog',
    title: 'Back Up Your Life',
    start: 'start',
    nodes: {
      start: {
        speaker: 'narrator',
        text: [
          'Three times now. The third time is different. The third time you don\'t come back all the way; a little of you stays down there, like a file that wouldn\'t copy.',
          {
            if: around('deadline'),
            text: 'Deadline finds you at the Cathode, staring at a cup of coffee that went cold an hour ago. He sits down across from you without asking. "\'94," he says. "Everybody thinks the raid was the worst part. The raid was a Tuesday. The worst part was the two years before, when I didn\'t sleep, didn\'t call anybody back, thought I was the only thing holding the whole thing up." He taps the table. "Back up your life, kid. Not your data."',
            else: 'Sal refills your cold coffee without asking and leaves the pot on the table, which he never does. "I had a cousin like you," he says. "Worked three jobs, never slept, never saw his kids. Very successful. Very dead at forty-four." He wipes the counter. "Eat something."',
          },
          'You know how this ends for people. You\'ve seen it: no raid, no headline, no glory. Just a body that quits, and a phone that stops ringing.',
        ],
        choices: [
          {
            text: '"Okay. I hear you. Things change now."',
            effects: [{ buff: REST_WEEK }, { stat: 'stress', add: -15 }, { if: around('deadline'), then: [{ npc: 'deadline', affinity: 4 }], else: [{ npc: 'sal', affinity: 3 }] }],
            goto: 'promise',
          },
          {
            text: '"I don\'t have time to fall apart."',
            effects: [{ stat: 'mood', add: -6 }],
            goto: 'refuse',
          },
        ],
      },
      promise: {
        speaker: 'narrator',
        text: 'You write it on an index card and stick it to the monitor: SLEEP IS NOT OPTIONAL. It looks stupid. You leave it there. For a while, at least, you mostly do what it says.',
      },
      refuse: {
        speaker: 'narrator',
        text: 'You say it like it\'s a strength. It comes out like a symptom. Nobody argues with you, which is how you know they\'ve stopped expecting to win.',
      },
    },
  },
  {
    id: 'life_burnout_again',
    channel: 'mail',
    title: 'Again',
    from: 'Note to self',
    start: 'start',
    nodes: {
      start: {
        text: [
          'Burnout number {var:sys.burnouts}.',
          'You find a text file on your desktop you don\'t remember writing, dated the last time. It says: "if you are reading this it happened again. drink water. go outside. call someone. you are not the server."',
          { if: VISITOR, text: 'There are still people who would pick up. You check the list twice to make sure.', else: 'You scroll through your contacts and realize you don\'t know who would still pick up at this hour. You don\'t try to find out.' },
        ],
        choices: [
          { text: 'Do what the file says.', effects: [{ stat: 'stress', add: -10 }, { buff: RESTING }] },
          { text: 'Delete the file.', effects: [{ stat: 'mood', add: -3 }] },
        ],
      },
    },
  },

  // ── life_crunch_cold ────────────────────────────────────────────────────
  {
    id: 'life_crunch_cold',
    channel: 'dialog',
    title: 'Crunch Cold',
    start: 'start',
    nodes: {
      start: {
        speaker: 'narrator',
        text: [
          'You wake up with a head full of wet cement and a throat like a cheese grater. Classic crunch cold: your body waited until you ran the tank dry and then filed a formal complaint.',
          { if: { flag: 'fac.halcyon.employed' }, text: 'Half of Halcyon has the same thing. The office sounds like a tuberculosis ward with a foosball table.' },
        ],
        choices: [
          {
            text: 'Push through. Tissues, cough drops, keep working.',
            tag: '[Fitness]',
            check: {
              skill: 'fitness',
              dc: 13,
              bonuses: [{ if: { trait: 'iron_stomach' }, add: 2, label: '+2 (iron stomach)' }],
              success: 'shook_off',
              fail: 'flu',
              successEffects: [{ buff: { ...HEAD_COLD, days: 2 } }],
              failEffects: [{ buff: FLU }, { stat: 'health', add: -15 }, { stat: 'stress', add: 5 }],
            },
          },
          {
            text: 'Rest. Actually rest. Blankets, fluids, bad daytime TV.',
            effects: [{ buff: RESTING }, { stat: 'stress', add: -10 }, { stat: 'energy', add: 15 }],
            goto: 'rest',
          },
          {
            text: 'Go home for Mom\'s soup.',
            if: momHere,
            effects: [{ stat: 'health', add: 8 }, { npc: 'mom', affinity: 3 }, { stat: 'stress', add: -6 }, { buff: { ...HEAD_COLD, days: 2 } }],
            goto: 'soup',
          },
          {
            text: 'Three espressos and a prayer.',
            if: { trait: 'caffeine_fiend' },
            effects: [{ buff: ESPRESSO }, { buff: { ...HEAD_COLD, days: 4 } }, { stat: 'health', add: -4 }],
            goto: 'espresso',
          },
        ],
      },
      shook_off: {
        speaker: 'narrator',
        text: 'You power through on orange juice and spite. By day two the cement has drained out of your head. You feel like a hero. You are, medically, just lucky.',
      },
      flu: {
        speaker: 'narrator',
        text: 'The cold, sensing weakness, calls in its big brother. By evening you have a fever, the shakes, and a bone-deep ache in places you didn\'t know had bones. You lose a week to the flu and most of a second to feeling sorry for yourself.',
      },
      rest: {
        speaker: 'narrator',
        text: 'You watch three consecutive hours of a daytime court show and develop strong opinions about a dispute over a borrowed lawnmower. You drink so much tea you can hear it. By the weekend you\'re human again, and slightly better rested than you\'ve been in months.',
      },
      soup: {
        speaker: 'mom',
        text: '"You look terrible." She puts a hand on your forehead, then the back of her hand, then her cheek, the full diagnostic. "Sit." The soup has ginger in it, and something green, and something she won\'t name. You sleep on the couch under the blanket that has been in the family since before Kim. You wake up nearly well.',
      },
      espresso: {
        speaker: 'narrator',
        text: 'Three shots, then three more. Your nose is running and your heart is running faster. You get an astonishing amount done in a state of vibrating, sniffling clarity. You will pay for it. You know you will pay for it. That is a problem for later-you, who you have never liked.',
      },
    },
  },

  // ── life_gym_mishap ─────────────────────────────────────────────────────
  {
    id: 'life_gym_mishap',
    channel: 'dialog',
    title: 'Something Went Twang',
    start: 'start',
    nodes: {
      start: {
        speaker: 'narrator',
        text: [
          'One more rep. There is always one more rep. And then, somewhere in the back of your leg, a noise like a guitar string, and a feeling like somebody pulled your hamstring out through your sock.',
          'The guy at the next bench, who has been grunting at a mirror for forty minutes, says "ooh" with real sympathy.',
        ],
        choices: [
          {
            text: 'Walk it off.',
            tag: '[Fitness]',
            check: {
              skill: 'fitness',
              dc: 12,
              bonuses: [{ if: { trait: 'gym_rat' }, add: 2, label: '+2 (you know how to fall)' }],
              success: 'walked',
              fail: 'worse',
              successEffects: [{ buff: pulled(3) }],
              failEffects: [{ buff: pulled(10) }, { stat: 'health', add: -4 }],
            },
          },
          {
            text: 'See the physio on the Hill. ($80)',
            req: { stat: 'money', gte: 80 },
            effects: [{ money: -80 }, { stat: 'health', add: 2 }],
            goto: 'physio',
          },
          {
            text: 'Rest, ice, reruns.',
            effects: [{ buff: pulled(7) }, { stat: 'mood', add: 3 }, { stat: 'stress', add: -5 }],
            goto: 'reruns',
          },
        ],
      },
      walked: {
        speaker: 'narrator',
        text: 'You limp heroically around the block twice. It loosens up. By the weekend it\'s just a twinge, and a story that gets more dramatic every time you tell it.',
      },
      worse: {
        speaker: 'narrator',
        text: 'Walking it off turns out to mean walking it further. By the evening you can\'t do stairs without narrating each one. You spend a week and a half moving like somebody\'s grandfather.',
      },
      physio: {
        speaker: 'narrator',
        text: 'The physio is a small, terrifying woman who presses exactly on the thing and asks, pleasantly, "Here?" She sends you home with a sheet of stretches and the instruction "less ego." You follow it, mostly. It heals clean.',
      },
      reruns: {
        speaker: 'narrator',
        text: 'A bag of frozen peas, the couch, and an entire season of a cop show where they solve crimes by typing very fast. You shout at the screen that that is not how any of it works. It\'s the most relaxed you\'ve been in a month.',
      },
    },
  },

  // ── life_aging_mirror ───────────────────────────────────────────────────
  {
    id: 'life_aging_mirror',
    channel: 'dialog',
    title: 'Twenty-Seven',
    start: 'start',
    nodes: {
      start: {
        speaker: 'narrator',
        text: [
          'Bathroom mirror, 7 a.m., bad light. There is a gray hair. Just one, above your left ear, catching the fluorescent tube like a tiny antenna.',
          'You\'re twenty-seven. Your knees make a noise on the stairs now. A hangover lasts two days. The kids on the board use slang you have to look up, and they call you "old man" affectionately, and it is only a little bit affectionate.',
          'Somewhere a warranty has quietly expired.',
          { if: { skill: 'fitness', gte: 40 }, text: 'At least you kept moving. Your body is a well-maintained machine, even if it now makes the occasional noise.' },
          { if: { skill: 'fitness', lte: 15 }, text: 'You have, you realize, spent the better part of a decade in a chair. The chair has been very good to you. Your back has not.' },
        ],
        choices: [
          {
            text: 'Buy running shoes. Today. Before you can talk yourself out of it.',
            effects: [{ buff: NEW_LEAF }, { xp: 'fitness', add: 40 }, { money: -60 }],
            goto: 'shoes',
          },
          {
            text: 'Pluck it. Deny everything.',
            effects: [{ stat: 'mood', add: 2 }],
            goto: 'pluck',
          },
          {
            text: 'Call home and ask when they got their first gray hair.',
            if: { any: [momHere, around('dad')] },
            effects: [{ if: momHere, then: [{ npc: 'mom', affinity: 3 }], else: [{ npc: 'dad', affinity: 3 }] }, { stat: 'stress', add: -5 }],
            goto: 'call',
          },
        ],
      },
      shoes: {
        speaker: 'narrator',
        text: 'The shoes are aggressively white and cost more than your first monitor. You run a mile and a half along the Sound that evening and have to lie down on a bench afterwards. A seagull watches you with open contempt. You go again the next day.',
      },
      pluck: {
        speaker: 'narrator',
        text: 'It comes out with a tiny sting. You flush it. You are twenty-seven, and fine, and young, and nothing is happening. Three weeks later there are two.',
      },
      call: {
        speaker: 'narrator',
        text: [
          { if: momHere, text: '"Twenty-six," says Mom immediately. "The week after you were born. It was your fault." She laughs for a long time. Then she says, "It\'s good. It means you\'re still here. Plenty of people don\'t get gray hair, you know. Eat something."', else: '"Your age," says Dad. "Maybe younger. Your mother found it and laughed at me for a week." A pause on the line. "She\'d laugh at you too. Wear a hat."' },
        ],
      },
    },
  },

  // ── Hospital: bedside ───────────────────────────────────────────────────
  {
    id: 'life_hospital_wake',
    channel: 'dialog',
    title: 'Harbor Point General',
    start: 'start',
    nodes: {
      start: {
        speaker: 'narrator',
        text: [
          'White ceiling. The beep of something measuring you. A thin blanket, a plastic bracelet with your name spelled almost right, and the particular hospital silence that is actually a hundred small noises.',
          'You collapsed. The chart at the foot of the bed says EXHAUSTION / DEHYDRATION in a doctor\'s hurried hand, and under it, in a different hand: "3 days minimum. Take the pager away from them."',
          { if: { var: 'sys.hospitalized', eq: 2 }, text: 'The admitting nurse recognizes you. "Back again?" she says, not unkindly. That\'s worse than unkindly.' },
          { if: { var: 'sys.hospitalized', gte: 3 }, text: 'This is your third time in one of these beds, or more. The night nurse knows your blood type without looking. You wish that were a fun fact.' },
          { if: withPartner, text: 'Your partner is asleep in the plastic chair by the bed, still in their coat, one hand on the blanket over your foot like they were afraid you would wander off.' },
          { if: momHere, text: 'Mom is here. Of course Mom is here. She has brought a thermos of soup, which is not allowed, and has already made friends with two nurses, which is how it\'s going to stay allowed.' },
          { if: close('jax', 30), text: 'Jax has left a get-well card on the tray. It is a birthday card with BIRTH crossed out and WELL written in above it. Inside: "get better or i get your monitor."' },
          { if: close('kim', 30), text: 'Kim is sitting cross-legged at the end of the bed doing homework, like she\'s guarding you. "Don\'t," she says, without looking up. "Don\'t even say you\'re fine."' },
          { if: { all: [{ npc: 'grace', met: true }, { not: partnerIs('grace') }] }, text: 'On her rounds, Grace Okafor stops at the foot of your bed and reads the chart with an eyebrow up. "You," she says. "Hydrate. That\'s not advice. That\'s the whole treatment plan."' },
          { if: { not: VISITOR }, text: 'Nobody else is here. There is a pudding cup on the tray that a nurse left for you. You eat it slowly. It is the kindest thing that has happened to you in a while, and that thought sits on your chest for a long time.' },
        ],
        choices: [
          {
            text: 'Promise, and mean it: you\'ll take care of yourself.',
            effects: [{ buff: DISCHARGE }, { stat: 'stress', add: -10 }, { stat: 'mood', add: 3 }],
            goto: 'promise',
          },
          {
            text: 'Thank whoever came.',
            if: VISITOR,
            effects: [THANK_VISITOR, { stat: 'mood', add: 5 }],
            goto: 'thanks',
          },
          {
            text: '"Has anybody seen my pager?"',
            effects: [{ stat: 'stress', add: 4 }, { stat: 'cred', add: 1 }],
            goto: 'pager',
          },
        ],
      },
      promise: {
        speaker: 'narrator',
        text: 'You say it to the ceiling, and then to whoever will listen. You\'ll sleep. You\'ll eat actual food. You\'ll stop treating your body like a rented server. The machine that measures you beeps along, noncommittal. It has heard this before.',
      },
      thanks: {
        speaker: 'narrator',
        text: 'You say thank you and your voice cracks halfway through, which is humiliating, and nobody mentions it, which is love. Somebody adjusts your pillow. Somebody steals your pudding. You sleep, properly, for the first time in weeks.',
      },
      pager: {
        speaker: 'narrator',
        text: 'The nurse holds it up, out of reach, like a treat for a dog. It has buzzed eleven times. "Three days," she says. She puts it in a drawer and locks the drawer. You stare at the drawer for most of an afternoon.',
      },
    },
  },

  // ── Hospital: the statement (no surcharge) ────────────────────────────────
  {
    id: 'life_hospital_receipt',
    channel: 'mail',
    title: 'Statement of Account: PAID IN FULL',
    from: 'Harbor Point General, Patient Accounts',
    start: 'start',
    nodes: {
      start: {
        text: [
          'HARBOR POINT GENERAL HOSPITAL\nPatient Accounts Department',
          'Inpatient stay, 3 days (observation, IV fluids, bed rest) ..... $360.00\nPayment received ..... ($360.00)\nBALANCE DUE ..... $0.00',
          'Thank you for choosing Harbor Point General.',
          { if: { npc: 'grace', met: true }, text: 'Paper-clipped to the statement, a sticky note in quick, square handwriting: "Get some sleep. Real sleep. Not the kind with a keyboard. — G."', else: 'Someone in the billing office has drawn a small smiley face next to the zero. It has a thermometer in its mouth.' },
        ],
        choices: [
          { text: 'File it away.', effects: [{ stat: 'mood', add: 1 }] },
          { text: 'Pin it above your desk as a warning to yourself.', effects: [{ stat: 'stress', add: -3 }] },
        ],
      },
    },
  },

  // ── Hospital: the statement (PARALLAX surcharge) ──────────────────────────
  {
    id: 'life_hospital_bill',
    channel: 'mail',
    title: 'Statement of Account: ACTION REQUIRED',
    from: 'Harbor Point General, Patient Accounts',
    start: 'start',
    nodes: {
      start: {
        text: [
          'HARBOR POINT GENERAL HOSPITAL\nPatient Accounts Department',
          'Inpatient stay, 3 days (observation, IV fluids, bed rest) ..... $360.00\nPayment received ..... ($360.00)\nRisk-Adjusted Care Supplement ..... $540.00\nBALANCE DUE ..... $540.00',
          'Your insurer has declined to cover the Risk-Adjusted Care Supplement based on a third-party consumer risk assessment. The assessment was provided by a licensed data partner. Reference: PLX-0812-C.',
          'The assessment considers factors including irregular sleep patterns, late-night network activity, and residence in a statistically elevated-risk postal zone.',
          'Please remit within 30 days to avoid referral to a collections agency.',
          'PLX. You read the reference number three times. A licensed data partner.',
          { if: { flag: 'life.collections_typo' }, text: 'Your name is misspelled on the statement. The same way the collections agency misspelled it, last time. The typo has spread from one file to another like a cold — which tells you exactly how many files you are in, and that they talk to each other.' },
        ],
        choices: [
          {
            text: 'Pay it. ($540)',
            effects: [{ money: -540 }, { stat: 'stress', add: 3 }],
            goto: 'paid',
          },
          {
            text: 'Call Patient Accounts and take the supplement apart line by line.',
            tag: '[Business]',
            check: {
              skill: 'business',
              dc: 14,
              success: 'waived',
              fail: 'stuck',
              successEffects: [{ stat: 'mood', add: 4 }],
              failEffects: [{ var: 'life.extraUpkeep', add: 6 }, { scene: 'life_med_debt_cleared', delayHours: 24 * 90 }, { stat: 'stress', add: 4 }],
            },
          },
          {
            text: 'Forward it to Halcyon\'s benefits office.',
            req: { flag: 'fac.halcyon.insured' },
            reqText: 'Requires: employer health benefits',
            effects: [{ faction: 'fac.halcyon', add: 1 }],
            goto: 'benefits',
          },
          {
            text: 'Ignore it. Let them come for it.',
            effects: [{ scene: 'life_hospital_collections', delayHours: 24 * 30 }],
            goto: 'ignored',
          },
        ],
      },
      paid: {
        text: 'You pay it. The confirmation page thanks you for your prompt payment and invites you to rate your billing experience from one to five stars. Your insurer sends a brochure titled HEALTHY HABITS, HEALTHIER RATES the same week. You never ordered it.',
      },
      waived: {
        text: [
          'Forty minutes on hold with a pan-flute cover of a song you used to like. Then a tired woman named Doris, to whom you explain, calmly and in order, that you were never told of any supplement, never consented to any assessment, and would like a written copy of the scoring criteria.',
          'There is a long pause. "I\'m going to go ahead and waive that," says Doris. "Between you and me, you\'re the fourth person this week." You thank her. You wonder about the other three, and the people who didn\'t call.',
        ],
      },
      stuck: {
        text: [
          'Forty minutes on hold. Then a supervisor who explains, with the patience of someone reading from a laminated card, that the supplement reflects "your individual risk profile" and cannot be adjusted by hospital staff.',
          'The best you can get is a payment plan: six dollars a day for ninety days. You sign up. Your risk profile, you assume, now includes "argues with billing."',
        ],
      },
      benefits: {
        text: 'The Halcyon benefits office replies within the hour with the tone of someone who has fielded this exact email all month: "We\'ll handle it. Please don\'t discuss the reference number on company email." Two days later the balance reads $0.00. You don\'t discuss it on company email. You think about it a great deal.',
      },
      ignored: {
        text: 'You close the mail. You put it in a folder called LATER. LATER is where things go to grow teeth.',
      },
    },
  },
  {
    id: 'life_hospital_collections',
    channel: 'mail',
    title: 'FINAL NOTICE: Account Referred for Collection',
    from: 'Lumen Sound Recovery Services',
    start: 'start',
    nodes: {
      start: {
        text: [
          'This communication is from a debt collector.',
          'Your account with HARBOR POINT GENERAL HOSPITAL (balance: $540.00) has been referred to this agency. A collection fee of $160.00 has been applied. The total of $700.00 has been debited per the terms of your patient agreement, section 14(c), which you signed while receiving IV fluids.',
          'Your payment history has been reported to our data partners.',
          'Have a pleasant day.',
        ],
        effects: [{ money: -700 }, { stat: 'stress', add: 8 }, { stat: 'mood', add: -5 }],
        choices: [
          {
            text: 'Dispute the fee in writing, citing every rule they skipped.',
            tag: '[Business]',
            check: {
              skill: 'business',
              dc: 16,
              success: 'refund',
              fail: 'form_letter',
              successEffects: [{ money: 160 }, { stat: 'mood', add: 3 }],
              failEffects: [{ stat: 'stress', add: 3 }, { flag: 'life.collections_typo' }, { chance: 0.3, then: [{ complication: 'legal' }] }],
            },
          },
          { text: 'Let it go. Lesson learned: LATER has teeth.', effects: [{ stat: 'stress', add: -2 }] },
        ],
      },
      refund: {
        text: 'Your letter is four pages long and cites things. Nine days later a check for $160.00 arrives with no cover letter, which is how you know you were right.',
      },
      form_letter: {
        text: 'They reply with a form letter thanking you for your "feedback." The form letter has a typo in your name. So does, you suspect, your file.',
      },
    },
  },
  {
    id: 'life_med_debt_cleared',
    channel: 'mail',
    title: 'Payment Plan Complete',
    from: 'Harbor Point General, Patient Accounts',
    start: 'start',
    nodes: {
      start: {
        text: [
          'Congratulations! Your payment plan for account PLX-0812-C is complete. Your balance is $0.00.',
          'Thank you for your continued trust in Harbor Point General. We look forward to caring for you again.',
          'You would prefer that they didn\'t.',
        ],
        effects: [{ var: 'life.extraUpkeep', add: -6 }, { stat: 'mood', add: 3 }],
      },
    },
  },
]

// ════════════════════════════════════════════════════════════════════════════
// Triggers
// ════════════════════════════════════════════════════════════════════════════

const triggers: TriggerDef[] = [
  {
    id: 'life_burnout',
    when: { all: [{ stat: 'stress', gte: 90 }, free] },
    once: false,
    cooldownDays: 21,
    atHour: 23,
    effects: [QUIET_RESET, { scene: 'life_burnout' }],
  },
  {
    id: 'life_burnout_hits',
    when: { all: [behind('sys.burnouts', 'life.burnouts_seen'), free] },
    once: false,
    cooldownDays: 0,
    effects: [
      QUIET_RESET,
      { var: 'life.burnouts_seen', add: 1 },
      {
        if: { var: 'life.burnouts_seen', eq: 1 },
        then: [{ scene: 'life_burnout_first' }],
        else: [
          {
            if: { all: [{ var: 'life.burnouts_seen', eq: 2 }, around('jax')] },
            then: [{ scene: 'life_burnout_second' }],
            else: [{ if: { var: 'life.burnouts_seen', eq: 3 }, then: [{ scene: 'life_burnout_third' }], else: [{ scene: 'life_burnout_again' }] }],
          },
        ],
      },
    ],
  },
  {
    id: 'life_crunch_cold',
    when: { all: [{ stat: 'energy', lte: 20 }, actGte(2), free] },
    once: false,
    cooldownDays: 60,
    chance: 0.08,
    effects: [QUIET_RESET, { scene: 'life_crunch_cold' }],
  },
  {
    id: 'life_gym_mishap',
    when: { all: [{ any: [{ item: 'gad_gym' }, { skill: 'fitness', gte: 15 }] }, free] },
    once: false,
    cooldownDays: 150,
    atHour: 19,
    chance: 0.012,
    effects: [QUIET_RESET, { scene: 'life_gym_mishap' }],
  },
  {
    id: 'life_aging_mirror',
    when: { all: [{ age: true, gte: 27 }, free] },
    atHour: 7,
    effects: [QUIET_RESET, { scene: 'life_aging_mirror' }],
  },
  {
    id: 'life_hospital_bill',
    when: behind('sys.hospitalized', 'life.hosp_seen'),
    once: false,
    cooldownDays: 0,
    effects: [
      QUIET_RESET,
      { var: 'life.hosp_seen', add: 1 },
      { scene: 'life_hospital_wake' },
      // The engine already charged the base bill. Only the PARALLAX surcharge is new money.
      {
        if: PARALLAX_LIVE,
        then: [{ news: 'insurers_riskscore' }, { scene: 'life_hospital_bill', delayHours: 72 }],
        else: [{ scene: 'life_hospital_receipt', delayHours: 72 }],
      },
    ],
  },
]

export default defineContent({ scenes, triggers })
