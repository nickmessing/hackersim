/**
 * PKG-14 — Side (Dark): `side_zero_day` (bible §8.41).
 *
 * The genre's grind fantasy, weaponized. A broker dangles a 72-hour rush job with a weekend's
 * migration window and a frankly obscene number attached. You can push through on no sleep and
 * gamble your body, body-hack the crunch, automate it so you can rest, or take a smaller, saner
 * cut. Push too hard and you wake up on a gurney — which is also, per §4.3, the fallback place you
 * first meet Grace if Mom's crisis never put anyone in Harbor General.
 *
 * Hacking is fiction: the "job" is abstract crunch-and-consequences flavor, never real technique.
 *
 * Sets: `side.zero_day` (colors Burnout / E7), `side.zero_day_collapsed`/`.zero_day_resolved`
 * (internal), and `npc.grace {met}` as the romance fallback in the crashcart scene.
 */
import { defineContent } from '@/engine/registry'
import type { QuestDef, SceneDef } from '@/engine/types'

const quest: QuestDef = {
  id: 'side_zero_day',
  title: 'Zero Day, Zero Sleep',
  kind: 'side',
  act: 2,
  priority: 7,
  // Offered once you're skilled enough for a "big weekend" to make sense, from Act II on.
  autoStart: {
    all: [
      { var: 'act', gte: 2 },
      { any: [{ skill: 'intrusion', gte: 20 }, { skill: 'programming', gte: 20 }, { skill: 'networking', gte: 20 }] },
    ],
  },
  rewards: 'A weekend\'s worth of money — and whatever it takes out of you to earn it',
  summary:
    'A broker wants seventy-two hours of your life for a number with too many zeros. One migration window, one weekend, no sleep. Decide how much of yourself the money is allowed to cost.',
  start: 'pitch',
  stages: {
    pitch: {
      text:
        'A broker calling themselves Redline is offering a 72-hour rush job: get in before a system migration closes the window on Monday, and name your own comfort about the number. The money is real. So is the weekend it wants to eat.',
      onEnter: [{ scene: 'dark_zero_day' }],
      objectives: [
        {
          id: 'decide',
          text: 'Take Redline\'s weekend job — or don\'t',
          when: { flag: 'side.zero_day_resolved' },
          hint: 'Open the dialog. Push through raw, [Fitness] your way through it, [Systems] it so you can sleep, or take the smaller safe cut. Grinding it earns the most and risks the most.',
        },
      ],
    },
  },
}

const offer: SceneDef = {
  id: 'dark_zero_day',
  channel: 'dialog',
  title: 'Seventy-Two Hours',
  from: 'Redline',
  start: 'intro',
  nodes: {
    intro: {
      speaker: 'Redline',
      text: [
        'The message is short, the way expensive messages are. "Weekend job. Migration window closes 6 a.m. Monday — after that the thing I need is behind a wall nobody can climb. Sixty hours of work in a seventy-two-hour hole. Pays like a whole quarter."',
        'The number sits there on the screen, bright as an exit sign. It would clear a lot. It would clear almost everything. All it wants is a weekend, and everything a person keeps in a weekend: sleep, food, the difference between Saturday and Sunday, the little voice that says lie down.',
      ],
      next: 'choice',
    },
    choice: {
      speaker: 'narrator',
      text:
        'The clock is already running in your head. You know exactly how you\'d do it. You also know what you looked like the last time you did something like this, and you know the mirror doesn\'t lie the way you do.',
      choices: [
        {
          text: 'Take it and push. No plan, no sleep, just you and the clock until it\'s done.',
          tag: '[Push through]',
          effects: [
            { money: 14000 },
            { stat: 'stress', add: 30 },
            { flag: 'side.zero_day' },
            { flag: 'side.zero_day_resolved' },
            {
              chance: 0.55,
              then: [
                { stat: 'health', set: 0 },
                { flag: 'side.zero_day_collapsed' },
                { trait: 'pkg14_dark_polite_complaint' },
                { obligation: { id: 'pkg14_dark_harbor_bill', label: 'Harbor General — cardiac observation, payment plan', perDay: 14, days: 120 } },
                { scene: 'zero_day_crashcart', delayHours: 8 },
              ],
              else: [
                { stat: 'health', add: -15 },
                { stat: 'stress', add: 10 },
              ],
            },
          ],
          goto: 'grind_outcome',
        },
        {
          text: 'Do it, but train for it — sleep in ninety-minute stabs, discipline, a body run like a machine.',
          tag: '[Fitness 15]',
          check: {
            skill: 'fitness',
            dc: 15,
            success: 'body_ok',
            fail: 'body_fail',
            bonuses: [
              { if: { trait: 'gym_rat' }, add: 2, label: '+2 (your body has done worse for worse reasons)' },
              { if: { trait: 'caffeine_fiend' }, add: 1, label: '+1 (chemistry is on your side, briefly)' },
            ],
            successEffects: [
              { money: 14000 },
              { stat: 'stress', add: 20 },
              { stat: 'health', add: -8 },
              { flag: 'side.zero_day' },
              { flag: 'side.zero_day_resolved' },
            ],
            failEffects: [
              { money: 14000 },
              { stat: 'health', set: 0 },
              { trait: 'pkg14_dark_polite_complaint' },
              { obligation: { id: 'pkg14_dark_harbor_bill', label: 'Harbor General — cardiac observation, payment plan', perDay: 14, days: 120 } },
              { flag: 'side.zero_day' },
              { flag: 'side.zero_day_collapsed' },
              { flag: 'side.zero_day_resolved' },
              { scene: 'zero_day_crashcart', delayHours: 8 },
            ],
          },
        },
        {
          text: 'Automate the boring three-quarters of it so you can actually sleep in shifts.',
          tag: '[Systems 16]',
          check: {
            skill: 'systems',
            dc: 16,
            success: 'auto_ok',
            fail: 'auto_fail',
            bonuses: [
              { if: { trait: 'night_owl' }, add: 1, label: '+1 (the small hours are your native tongue)' },
            ],
            successEffects: [
              { money: 10000 },
              { stat: 'stress', add: 8 },
              { stat: 'cred', add: 4 },
              { flag: 'side.zero_day' },
              { flag: 'side.zero_day_resolved' },
            ],
            failEffects: [
              { money: 6000 },
              { stat: 'stress', add: 22 },
              { stat: 'health', add: -10 },
              { flag: 'side.zero_day' },
              { flag: 'side.zero_day_resolved' },
              { chance: 0.3, then: [{ complication: 'hack' }] },
            ],
          },
        },
        {
          text: '"I\'ll take a corner of it, done right, for a corner of the money." Sane hours, smaller cut.',
          tag: '[Pace it]',
          effects: [
            { money: 4500 },
            { stat: 'mood', add: 3 },
            { flag: 'side.zero_day_resolved' },
          ],
          goto: 'paced',
        },
      ],
    },
    grind_outcome: {
      speaker: 'narrator',
      text: [
        'You go in at Friday dark and you do not come up for air. Time stops meaning anything but the migration clock. You forget to eat, then forget that you forgot. The work is good — it\'s always good, that\'s the trap — and somewhere around hour fifty the walls start breathing gently and you decide that\'s fine.',
        {
          if: { flag: 'side.zero_day_collapsed' },
          text: 'You get it done. You remember typing the last of it. You do not remember the floor coming up to meet you, or your own heart deciding it had filed a complaint. The money lands in an account you will read about later, from a bed that is not yours.',
          else: 'You get it done, at 5:52 a.m., with eight minutes to spare, and then you sleep for a day and a half and wake up feeling like something the tide left. The number is real. So is the grey face in the mirror. You banked one and you\'ll be paying down the other for a while.',
        },
      ],
    },
    body_ok: {
      speaker: 'narrator',
      text: [
        'You treat it like a fight instead of a bender. Ninety minutes down, hard, then up. Water, not just coffee. A walk around the block at 3 a.m. to remind your body it belongs to a person. It is brutal and it is boring and it works: you come out the far side of the window paid, wrecked, and — crucially — conscious.',
        'The number is obscene and yours. You feel like you were hit by a slow, gentle truck. But you scheduled the truck, and you got up after, which is the whole difference between a hard weekend and a hospital.',
      ],
    },
    body_fail: {
      speaker: 'narrator',
      text: [
        'You had a plan. The plan assumed a body you used to have. Somewhere in the second night the ninety-minute stabs stop restoring anything, and discipline turns into just staying upright, and staying upright turns out to be optional.',
        'You finish — you actually finish, the money lands — and then the room tilts, unhurried, like it has all the time in the world, and you go down with it. The last thing you think is that you\'ll be fine, which is the thing everybody thinks.',
      ],
    },
    auto_ok: {
      speaker: 'narrator',
      text: [
        'You spend the first six hours making sure you\'ll have to spend the fewest hours after that. You build the dull machinery to do the dull three-quarters — the fetching, the sorting, the patient hammering — and then you do the human quarter awake and rested while it grinds. You sleep. On purpose. During a rush job. It feels like cheating and it is not.',
        'The number comes in a little lighter than the reckless road would have paid, and you are a whole, functioning person on Monday, which turns out to be worth the difference several times over. The broker\'s only note: "Fast. Clean. Boring." At Aperture that would be the highest praise there is. Out here it just means you\'ll be alive for the next one.',
      ],
    },
    auto_fail: {
      speaker: 'narrator',
      text: [
        'The automation is elegant right up until Sunday afternoon, when it quietly does the wrong thing very efficiently and you lose four hours you did not have to unwinding it by hand. After that it\'s just you and the clock, scrambling, doing the boring three-quarters yourself with no sleep left in the budget.',
        'You make the window — barely, and for less, because you had to cut the last stretch to Monday\'s deadline. You don\'t collapse. You just spend the following week feeling like a photocopy of yourself, jumping at the phone, wondering when your clever plan turned into the same grind you were trying to avoid.',
        'Redline pays, and then sends one more line: "client says your script touched things it shouldn\'t have on the way out. they\'re looking. not my problem anymore." It is, you notice, very much yours.',
      ],
    },
    paced: {
      speaker: 'narrator',
      text: [
        'You take a corner of it and do that corner beautifully, on a schedule a human being could survive, for a fraction of the money. Redline is briefly, professionally disappointed, then respectful. "Most people can\'t say no to the number," they write. "You just did math instead."',
        'You sleep in your own bed all weekend and wake up Monday a little poorer and entirely yourself. It is the least dramatic thing you have done in months, and standing in your kitchen with coffee and a whole undamaged day in front of you, you understand exactly how much that\'s worth.',
      ],
    },
  },
}

const crashcart: SceneDef = {
  id: 'zero_day_crashcart',
  channel: 'dialog',
  title: 'Harbor General, 4 a.m.',
  from: 'grace',
  start: 'wake',
  nodes: {
    wake: {
      speaker: 'grace',
      text: [
        'You surface in a curtained bay with a line in your arm and a monitor keeping honest, unhurried time next to you. A nurse is checking the drip, unbothered, the way you\'d check a kettle. She has a laugh that arrives half a second before she decides whether you\'ve earned it. Right now she has decided you have not.',
        '"There he is." She doesn\'t look up from the chart. "Dehydration, exhaustion, a heart that filed a very polite complaint. You worked a weekend without stopping, and your body voted no." She clicks the pen. "I\'m Grace. You\'re going to remember that, because I\'m going to be the one who remembers you did this to yourself."',
      ],
      effects: [{ npc: 'grace', met: true }],
      next: 'talk',
    },
    talk: {
      speaker: 'grace',
      text: [
        {
          if: { npc: 'grace', romance: ['dating', 'partner', 'engaged', 'married'] },
          text: 'She stops pretending to read the chart. "You could\'ve told me it was that kind of weekend," she says quietly, and the professional calm slips for exactly one second before she pins it back up. "I\'d have at least brought you water." That, from Grace, is a whole speech.',
          else: 'She finally looks at you properly, the way she probably looks at every ceiling that thinks it\'s bulletproof. "I\'ve seen a hundred of you," she says, not unkindly. "The clever ones are the worst. They think tired is a moral position."',
        },
        '"So." She caps the pen. "You\'ve got a choice about how this conversation goes, same as the last one, apparently."',
      ],
      choices: [
        {
          text: '"You\'re right. It was stupid. Thank you for the water metaphor and the actual water."',
          tag: '[Honest]',
          effects: [
            { npc: 'grace', affinity: 6 },
            { stat: 'mood', add: 4 },
          ],
          goto: 'honest',
        },
        {
          text: '"Big job. Big money. I knew what I was doing." Wave it off.',
          tag: '[Brush it off]',
          effects: [
            { stat: 'mood', add: -4 },
          ],
          goto: 'brush',
        },
      ],
    },
    honest: {
      speaker: 'grace',
      text: [
        'Something in her face unclenches by a degree. "Good," she says. "Say it to yourself at 2 a.m. next time, before the floor does." She writes something, tears it off, and tucks it under the water cup: a discharge time and, under it, in smaller writing, a name and a number that is not the ward\'s.',
        '"For when you want to talk to someone who isn\'t going to be impressed by the money." She\'s already turning to the next bay. "Drink the whole cup. All of it. I\'ll know."',
        'At discharge they hand you a payment plan with CARDIAC OBSERVATION in capitals and a leaflet about "listening to your body." Your body, it turns out, has a lot to say now, mostly on stairs.',
      ],
    },
    brush: {
      speaker: 'grace',
      text: [
        'She nods slowly, the way you nod at a patient who is not ready to hear it yet. "Sure," she says. "You knew exactly what you were doing." She hangs the chart back on the rail. "That\'s the part that worries me."',
        'She pulls the curtain on her way out, leaving you with the water and the honest little machine and the bill, which will arrive later, and which — you\'re starting to understand — is never really the expensive part.',
        'The bill does arrive: a payment plan, four months of it, CARDIAC OBSERVATION in capitals. The expensive part arrives too, quieter — a flutter on the stairs the next week, and the week after. Your heart has started keeping its own logs.',
      ],
    },
  },
}

export default defineContent({
  quests: [quest],
  scenes: [offer, crashcart],
})
