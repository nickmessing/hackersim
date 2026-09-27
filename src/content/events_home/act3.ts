/**
 * events_home — ACT III (days ~1100–2900). Weight arrives through the front door: a vet bill you
 * can't afford, Kim moving out and saying the thing about you never being around, a 3 a.m. heart
 * that won't slow down, and Mom's follow-up scan — with an insurer who has started reading scores.
 * Nothing here kills anyone the main story needs alive; the scan always comes back clear.
 */
import { defineContent } from '@/engine/registry'
import type { Cond, EventDef, SceneDef } from '@/engine/types'
import {
  FAMILY_STRAIN,
  GRIEF_CAT,
  PORCH_EVENINGS,
  THROWN_BACK,
  actGte,
  around,
  between,
  buff,
  dadHere,
  free,
  hasCat,
  kimHere,
  momHere,
  owe,
  parallaxLive,
  partnerIs,
  withGrace,
  withPartner,
} from './_shared'

// ── ev_home_cat_vet ───────────────────────────────────────────────────────────
// The cat stopped eating. The vet on the Hill has an estimate.
const catVetScene: SceneDef = {
  id: 'ev_home_cat_vet_scene',
  channel: 'dialog',
  title: 'The Vet',
  start: 'exam',
  nodes: {
    exam: {
      speaker: 'narrator',
      text: [
        '{flag:ev_home.cat_name} stopped eating on Tuesday. By Thursday she was hiding under the bed and wouldn\'t come out, even for tuna, even for you. Now she\'s on a steel table at the animal hospital on the Hill, very small under the bright light.',
        'The vet is kind and tired. "She swallowed something — a rubber band, a bit of cable tie, something like that. It\'s stuck. She needs surgery, today if we can." She slides the estimate across the counter. It says $900.',
        { if: { stat: 'money', lte: 900 }, text: 'You don\'t have $900. You know exactly how much you do have. It isn\'t close.' },
      ],
      choices: [
        {
          text: 'Pay it. Whatever it takes.',
          req: { stat: 'money', gte: 900 },
          reqText: 'Requires $900',
          effects: [{ money: -900 }],
          goto: 'surgery',
        },
        {
          tag: '[Business]',
          text: 'Ask for the practice manager, a payment plan, and a second look at every line of that estimate.',
          check: {
            skill: 'business',
            dc: 15,
            bonuses: [
              { if: { trait: 'silver_tongue' }, add: 2, label: '+2 (silver tongue)' },
              { if: { trait: 'empath' }, add: 1, label: '+1 (you can read a tired person)' },
            ],
            success: 'plan_good',
            fail: 'plan_bad',
            successEffects: [owe('ev_home_vet_plan', 'Vet payment plan', 4, 180)],
            failEffects: [owe('ev_home_vet_plan', 'Vet payment plan (financed)', 8, 150), { stat: 'stress', add: 6 }],
          },
        },
        {
          if: { all: [around('grandma_ruth'), { not: { flag: 'ev_home.cat_at_ruth' } }] },
          text: 'Call Grandma Ruth. You don\'t know why. You just need to hear someone say it\'ll be okay.',
          effects: [{ npc: 'grandma_ruth', affinity: 5 }, { faction: 'fac.hood', add: 2 }],
          goto: 'ruth',
        },
        {
          text: 'Ask, very quietly, about the other option.',
          goto: 'goodbye',
        },
      ],
    },
    plan_good: {
      speaker: 'narrator',
      text: 'The practice manager takes one look at your face and knocks off the "after-hours intake fee" and the "comfort package," which turns out to be a blanket. The rest goes on a plan you can actually carry. "We don\'t turn animals away here," she says, like it\'s policy. It isn\'t. She just decided.',
      next: 'surgery',
    },
    plan_bad: {
      speaker: 'narrator',
      text: 'The practice manager is polite and immovable. The only plan on offer goes through a third-party pet-care lender whose rate is printed in a very small font. You sign it. You would sign anything. They take her back before the ink is dry.',
      next: 'surgery',
    },
    ruth: {
      speaker: 'grandma_ruth',
      text: [
        '"Mijo. Stay there." Forty minutes later Ruth is at the counter in her church coat with an envelope that says GATO in blue ballpoint. "My emergency cat money. I have had it since 1987. I never had the cat." She pushes it at the vet. "Is enough?"',
        'It is almost exactly enough. She will not discuss it. She will, for the rest of her life, refer to your cat as "our cat."',
      ],
      next: 'surgery',
    },
    surgery: {
      speaker: 'narrator',
      text: [
        'Two hours in a plastic chair under a poster about heartworm. Then the vet comes out pulling her mask down, and she\'s smiling before she says anything.',
        '{flag:ev_home.cat_name} comes home three days later in a plastic cone, furious, alive, and more demanding than ever. The first night she sleeps on your chest, which she has never done, and you lie awake so as not to move her.',
      ],
      effects: [{ stat: 'mood', add: 8 }, { stat: 'stress', add: -5 }, { flag: 'ev_home.cat_surgery' }],
    },
    goodbye: {
      speaker: 'narrator',
      text: [
        'The vet nods. She has had this conversation more times than anyone should. She lets you stay in the room, and you hold {flag:ev_home.cat_name} and tell her she was a good cat, the best cat, a terrible roommate and the best cat, and she purrs, because she always purred for you.',
        'You carry the empty carrier home on the bus. At the desk, you leave the chair pushed back, as if someone might want it.',
      ],
      effects: [{ item: 'ev_home_cat', remove: true }, { flag: 'ev_home.cat_gone' }, buff(GRIEF_CAT), { stat: 'stress', add: 12 }, { stat: 'mood', add: -15 }],
    },
  },
}

const catVet: EventDef = {
  id: 'ev_home_cat_vet',
  category: 'money',
  weight: 2,
  when: { all: [hasCat, actGte(2), { day: true, gte: 1100 }, free] },
  scene: 'ev_home_cat_vet_scene',
}

// ── ev_home_kim_moving_day ────────────────────────────────────────────────────
// Kim moves out. Dad's truck, Mom's cooler, four flights of stairs, and the thing she finally says.
const kimCollege: Cond = { any: [{ npc: 'kim', fate: 'thriving' }, { var: 'kim_trajectory', gte: 2 }] }
const kimInTheScene: Cond = { all: [{ not: kimCollege }, { any: [{ npc: 'kim', fate: 'follows_in' }, { var: 'kim_trajectory', lte: -2 }] }] }
const kimMiddle: Cond = { all: [{ not: kimCollege }, { not: kimInTheScene }] }

const movingScene: SceneDef = {
  id: 'ev_home_kim_moving_day_scene',
  channel: 'dialog',
  title: 'Moving Day',
  start: 'truck',
  nodes: {
    truck: {
      speaker: 'narrator',
      text: [
        'Kim is moving out.',
        { if: kimCollege, text: 'A dorm at the college across the Sound, a scholarship letter she keeps in a plastic sleeve, and a roommate questionnaire she filled out with alarming honesty.' },
        { if: kimInTheScene, text: 'A loft in Millgate with two "friends" whose handles she uses instead of their names, and — you count — three routers.' },
        { if: kimMiddle, text: 'A studio above a laundromat in the Flats, a job at the pharmacy, and a lease with her own name on it that she has read four times.' },
        { if: dadHere, text: 'Dad has borrowed a truck and is directing the loading like it\'s the paper line: heavy stuff low, fragile stuff wrapped, nobody touches the lamp.' },
        { if: momHere, text: 'Mom has packed a cooler with enough food for a small army and is pretending not to cry by being furious at a roll of tape.' },
        'The couch is last. Four flights. No elevator. Kim looks at the couch, then at you.',
      ],
      choices: [
        {
          tag: '[Fitness]',
          text: 'Carry the couch up four flights. Alone. For honor.',
          check: {
            skill: 'fitness',
            dc: 14,
            bonuses: [
              { if: { trait: 'gym_rat' }, add: 2, label: '+2 (gym rat)' },
              { if: { trait: 'glass_cannon' }, add: -2, label: '-2 (glass cannon)' },
              { if: { trait: 'ev_home_bad_back' }, add: -2, label: '-2 (bad back)' },
            ],
            success: 'couch_win',
            fail: 'couch_lose',
          },
        },
        {
          text: 'Leave the couch to Dad and a neighbor. Set up her network before she can stop you.',
          effects: [{ stat: 'energy', add: -5 }],
          goto: 'network',
        },
        {
          text: 'Send money for movers instead of coming. You\'re slammed this week ($250).',
          req: { stat: 'money', gte: 250 },
          reqText: 'Requires $250',
          effects: [{ money: -250 }, { npc: 'kim', affinity: -4 }],
          goto: 'movers',
        },
      ],
    },
    couch_win: {
      speaker: 'kim',
      text: '"Oh my god. Oh my GOD. You actually did it." You are purple and shaking and the couch is in her apartment and your legs have filed a formal complaint. Kim gets you a glass of water and takes a photo, which she will produce at every family gathering until the end of time.',
      effects: [{ npc: 'kim', affinity: 6 }, { stat: 'energy', add: -20 }],
      next: 'floor',
    },
    couch_lose: {
      speaker: 'narrator',
      text: [
        'Third-floor landing. You pivot. Something in your lower back makes a noise like a guitar string, and the next thing you know you are lying on the stairs under a couch while your sister laughs so hard she has to sit down.',
        'Dad and the neighbor finish the job. You finish the day lying flat on Kim\'s floor, which is where the rest of the evening happens anyway.',
      ],
      effects: [
        { npc: 'kim', affinity: 2 },
        { stat: 'health', add: -10 },
        buff(THROWN_BACK),
        { chance: 0.35, then: [{ trait: 'ev_home_bad_back' }] },
      ],
      next: 'floor',
    },
    network: {
      speaker: 'narrator',
      text: [
        { if: kimInTheScene, text: 'She already did it. Better than you would have. Encrypted, segmented, a guest network named after a joke only the two of you would get. "I learned from the best," she says. "Unfortunately."' },
        { if: { not: kimInTheScene }, text: 'She lets you. She watches you crawl behind the desk with the cable and says, "You\'re happy right now. This is you being happy." She\'s right. It\'s the most relaxed you\'ve been in months.' },
      ],
      effects: [{ npc: 'kim', affinity: 3 }],
      next: 'floor',
    },
    floor: {
      speaker: 'narrator',
      text: [
        'Late. Everyone else has gone home. The two of you are sitting on the floor of her new place with a pizza box between you and nothing on the walls yet.',
        'Kim picks at the crust. "You know you were never around, right? Like — for most of it. You were upstairs, or you were out, or you were somewhere you couldn\'t tell anybody about." She doesn\'t sound angry. That\'s the hard part.',
      ],
      choices: [
        {
          tag: '[Social]',
          text: 'Don\'t defend it. Say the true thing, all of it, and let it be heavy.',
          check: {
            skill: 'social',
            dc: 15,
            bonuses: [
              { if: { trait: 'empath' }, add: 2, label: '+2 (empath)' },
              { if: { npc: 'kim', affinityGte: 50 }, add: 2, label: '+2 (she wants to hear it)' },
              { if: { flag: 'ev_home.kim_snooped' }, add: -2, label: '-2 (she remembers Desmond)' },
            ],
            success: 'heart',
            fail: 'defensive',
          },
        },
        {
          text: 'Make a joke. It\'s what you do. It\'s what you both do.',
          effects: [{ stat: 'mood', add: 2 }],
          goto: 'joke',
        },
      ],
    },
    heart: {
      speaker: 'kim',
      text: [
        'You tell her you know. You tell her you were scared of what you were doing and scared for her, and that you kept her out of it because keeping her out of it was the only good thing you were sure how to do. You tell her you missed stuff. You name the stuff.',
        'She is quiet for a long time. Then she leans her head on your shoulder, like when she was nine. "Okay," she says. "Okay. Come to dinner on Sundays. Here. I\'ll make the terrible pasta."',
      ],
      effects: [{ npc: 'kim', affinity: 10 }, { stat: 'mood', add: 6 }, { flag: 'ev_home.kim_heart_to_heart' }],
    },
    defensive: {
      speaker: 'kim',
      text: [
        'It comes out wrong. It comes out as reasons — the work, the money, the family, all of it for the family — and you can hear yourself building a wall out of excuses while she watches.',
        '"Right," she says, standing up to put the pizza box away. "You were busy. And now you want credit for a couch." She thanks you for helping. She means it. She doesn\'t walk you to the door.',
      ],
      effects: [{ npc: 'kim', affinity: -6 }, buff(FAMILY_STRAIN)],
    },
    joke: {
      speaker: 'kim',
      text: '"Was that a joke? Was that your joke?" She laughs anyway, because it was a pretty good joke, and the moment closes over like water. You both feel it go. On the way home you think of the thing you should have said, word for word, and there\'s nobody in the car to say it to.',
    },
    movers: {
      speaker: 'kim',
      text: ['movers came. they were very professional. one of them called me "ma\'am"', 'dad carried the lamp himself. he wouldnt let them touch it', 'thanks for the money. seriously', 'wouldve been nice if u came tho'],
    },
  },
}

const kimMovingDay: EventDef = {
  id: 'ev_home_kim_moving_day',
  category: 'family',
  weight: 2,
  when: {
    all: [
      kimHere,
      actGte(3),
      between(1500, 2800),
      { any: [{ quest: 'side_kim_essay', status: 'completed' }, { day: true, gte: 2200 }] },
      free,
    ],
  },
  scene: 'ev_home_kim_moving_day_scene',
}

// ── ev_home_chest_pains ───────────────────────────────────────────────────────
// 3:12 a.m. Your heart is doing something it has never done.
const partnerAffinity = (n: number) => ({ if: partnerIs('mira'), then: [{ npc: 'mira', affinity: n }], else: [{ npc: 'grace', affinity: n }] })

const chestScene: SceneDef = {
  id: 'ev_home_chest_pains_scene',
  channel: 'dialog',
  title: '3:12 a.m.',
  pause: true,
  start: 'floor',
  nodes: {
    floor: {
      speaker: 'narrator',
      text: [
        'It starts as a tightness, like a hand on your sternum. Then your left arm goes strange and your heart is going like a moth in a jar — too fast, then skipping, then too fast again. You are on the floor of your room at 3:12 a.m. and you are counting.',
        '{age} years old. Too young for this. You think that, and your heart skips again, and you stop being sure.',
        { if: { stat: 'stress', gte: 85 }, text: 'You can\'t remember the last time you slept a full night. You can\'t remember the last meal that wasn\'t eaten over a keyboard.' },
      ],
      choices: [
        {
          text: 'Call a cab to Harbor Point General. Now.',
          effects: [{ money: -300 }, { flag: 'ev_home.er_visit' }],
          goto: 'er',
        },
        {
          tag: '[Fitness]',
          text: 'Lie still. Breathe slow. It\'ll pass. You\'re not old enough for this to be real.',
          check: {
            skill: 'fitness',
            dc: 15,
            bonuses: [
              { if: { trait: 'gym_rat' }, add: 2, label: '+2 (gym rat)' },
              { if: { trait: 'glass_cannon' }, add: -2, label: '-2 (glass cannon)' },
              { if: { trait: 'caffeine_fiend' }, add: -2, label: '-2 (the ninth coffee)' },
            ],
            success: 'passed',
            fail: 'collapse',
          },
        },
        {
          if: momHere,
          text: 'Call Mom.',
          effects: [{ npc: 'mom', affinity: 8 }, { money: -300 }, { flag: 'ev_home.er_visit' }],
          goto: 'mom',
        },
        {
          if: withPartner,
          text: 'Wake your partner.',
          effects: [partnerAffinity(4), { money: -300 }, { flag: 'ev_home.er_visit' }],
          goto: 'partner',
        },
      ],
    },
    mom: {
      speaker: 'mom',
      text: 'She answers on the first ring. She always answers on the first ring. "Stay on the phone. Don\'t hang up. I\'m calling the ambulance on your father\'s line. Talk to me." She keeps you talking about nothing — the fish, the neighbors, the radio — until the paramedics are in your doorway, and she is at the hospital before you are.',
      next: 'er',
    },
    partner: {
      speaker: 'narrator',
      text: [
        { if: partnerIs('mira'), text: 'Mira is awake before you finish saying her name. She gets you into the car in ninety seconds and drives to Harbor General like she is outrunning a trace, one hand on the wheel and one hand gripping yours hard enough to hurt.' },
        { if: partnerIs('grace'), text: 'Grace is awake and kneeling by you with two fingers on your wrist before you finish saying her name. Her voice goes completely calm, the ER voice, and somehow that is the most frightening thing of all. "Okay. Okay. We\'re going in. Right now."' },
      ],
      next: 'er',
    },
    er: {
      speaker: 'narrator',
      text: [
        'Six hours, wires on your chest, a monitor beeping your own heart back at you. Then a doctor with coffee on her coat sits on the edge of the bed and says it isn\'t your heart. Not the way you thought. It\'s stress, and caffeine, and no sleep, and a body that has been sending you invoices for a year that you\'ve been throwing out unopened.',
        { if: withGrace, text: 'Grace was on shift. She didn\'t leave the curtain once. When the doctor says "stress," Grace looks at you in a way you will think about for a long time.' },
        '"Next time," the doctor says, "it might be the other thing. You\'re young. You get to decide if there\'s a next time."',
      ],
      effects: [{ stat: 'stress', add: -10 }],
      next: 'decide',
    },
    passed: {
      speaker: 'narrator',
      text: 'Twenty minutes on the floor, breathing like a metronome, and it slows. Skips once more, like an afterthought, and settles. You lie there until the window goes grey. You don\'t tell anybody. You think about it every time you reach for a coffee, for a month.',
      effects: [{ stat: 'stress', add: -4 }, { stat: 'mood', add: -4 }],
      next: 'decide',
    },
    collapse: {
      speaker: 'narrator',
      text: [
        'It doesn\'t pass. The room tunnels. The last thing you remember is the ceiling, and the thought that you never cleaned that corner, and then a paramedic\'s face very close to yours saying your name like a question.',
        'The neighbor heard you fall. You wake up at Harbor Point General with an IV in your arm and no idea what day it is.',
      ],
      effects: [{ stat: 'health', set: 0 }, { trait: 'ev_home_heart_scare' }, { chance: 0.4, then: [{ complication: 'health' }] }],
      next: 'decide',
    },
    decide: {
      speaker: 'narrator',
      text: 'So. Now you know what that feels like. The question is what you do with it.',
      choices: [
        {
          text: 'Take it seriously. Sleep. Eat. Stop at a reasonable hour, at least sometimes.',
          effects: [buff(PORCH_EVENINGS), { if: { not: { trait: 'ev_home_heart_scare' } }, then: [{ trait: 'ev_home_heart_scare' }] }],
          goto: 'serious',
        },
        {
          text: 'Back to work Monday. It was a scare, not a sentence.',
          effects: [{ stat: 'stress', add: 5 }, { flag: 'ev_home.ignored_heart' }],
          goto: 'ignore',
        },
      ],
    },
    serious: {
      speaker: 'narrator',
      text: 'You buy a real pillow. You learn to breathe before you panic, four in and six out, and you get strangely good at it. The work is a little slower. You are a little calmer. You decide that\'s a trade you can live with, which is the point.',
    },
    ignore: {
      speaker: 'narrator',
      text: 'Monday you\'re back at the desk with a coffee in each hand. The discharge papers go in a drawer. Sometimes at 3 a.m. you feel a flutter and freeze and wait. It always passes. So far.',
    },
  },
}

const chestPains: EventDef = {
  id: 'ev_home_chest_pains',
  category: 'health',
  weight: 3,
  when: { all: [{ stat: 'stress', gte: 70 }, actGte(2), { day: true, gte: 1300 }, free] },
  scene: 'ev_home_chest_pains_scene',
}

// ── ev_home_mom_scan ──────────────────────────────────────────────────────────
// Mom's follow-up scan after the crisis. Dad calls. She told him not to tell you.
const momRecovered: Cond = { all: [momHere, { flag: 'a2.mom_crisis_resolved' }, { npc: 'mom', fate: ['healthy', 'recovered_dark'] }] }

const momScanScene: SceneDef = {
  id: 'ev_home_mom_scan_scene',
  channel: 'dialog',
  title: 'Follow-Up',
  start: 'call',
  nodes: {
    call: {
      speaker: 'dad',
      text: [
        '"Your mother has a follow-up scan on Thursday. The one-year one." A pause on the line. "She told me not to tell you. I\'m telling you."',
        '"It\'s routine. The doctor said routine." Another pause. "The insurance people are \'reviewing\' it. They sent a letter. There\'s a number on it I don\'t understand."',
        { if: { npc: 'mom', fate: 'recovered_dark' }, text: 'You think about the money that paid for last time, and where it came from, and you feel it in your teeth.' },
        { if: parallaxLive, text: 'You know what kind of number that is. You know who sells the scores insurers use to read families like hers, because you have seen the inside of that business.' },
      ],
      choices: [
        {
          text: 'Take the day off and go with her.',
          effects: [{ stat: 'energy', add: -10 }, { npc: 'mom', affinity: 8 }, { npc: 'dad', affinity: 3 }, { flag: 'ev_home.went_to_scan' }],
          goto: 'waiting',
        },
        {
          tag: '[Business]',
          text: 'Get on the phone with the insurer and don\'t hang up until the scan is approved.',
          check: {
            skill: 'business',
            dc: 16,
            bonuses: [
              { if: parallaxLive, add: -2, label: '-2 (her file carries a risk score)' },
              { if: { flag: 'fac.halcyon.employed' }, add: 2, label: '+2 (your company plan has an advocate line)' },
              { if: { trait: 'silver_tongue' }, add: 2, label: '+2 (silver tongue)' },
            ],
            success: 'approved',
            fail: 'denied',
          },
        },
        {
          text: 'Pay for the scan yourself, quietly, before anyone can argue ($600).',
          req: { stat: 'money', gte: 600 },
          reqText: 'Requires $600',
          effects: [{ money: -600 }, { npc: 'mom', affinity: 3 }],
          goto: 'paid',
        },
        {
          text: 'You can\'t get away Thursday. Send flowers and call after.',
          effects: [{ npc: 'mom', affinity: -5 }, { npc: 'dad', affinity: -3 }, { flag: 'ev_home.missed_scan' }],
          goto: 'flowers',
        },
      ],
    },
    waiting: {
      speaker: 'narrator',
      text: [
        'The waiting room at Harbor General has the same plastic chairs as last time. Mom does a word search with a ballpoint pen and gets every word, and then does the ones that aren\'t on the list. She doesn\'t look up when they call her name. She just squeezes your hand once, hard, and goes.',
        'Afterwards you take her out for pie, and she tells you about every single person in the waiting room, including their probable diagnoses.',
      ],
      effects: [{ scene: 'ev_home_mom_scan_result_scene', delayHours: 24 * 14 }],
    },
    approved: {
      speaker: 'narrator',
      text: 'An hour and ten minutes, four departments, one supervisor, and the phrase "medically necessary follow-up per your own published guidelines, section four" said very slowly. The approval number arrives by fax to your parents\' kitchen, where Dad reads it aloud like a lottery ticket.',
      effects: [{ npc: 'mom', affinity: 4 }, { npc: 'dad', affinity: 4 }, { xp: 'business', add: 20 }, { scene: 'ev_home_mom_scan_result_scene', delayHours: 24 * 14 }],
    },
    denied: {
      speaker: 'narrator',
      text: [
        'Denied. "Elevated risk tier." Nobody will say what that means or who assigned it. The scan happens anyway, because Dad signs a form that makes it your family\'s problem, and you make the family\'s problem yours.',
        { if: parallaxLive, text: 'The denial letter has a reference code at the bottom in a font you recognize. You have seen it before, on the other side of a screen, in a building in Millgate. You put the letter in a drawer. You don\'t throw it away.' },
      ],
      effects: [
        owe('ev_home_scan_copay', 'Mom\'s scan (uncovered)', 10, 60),
        { stat: 'stress', add: 8 },
        { if: parallaxLive, then: [{ flag: 'ev_home.saw_riskscore' }] },
        { scene: 'ev_home_mom_scan_result_scene', delayHours: 24 * 14 },
      ],
    },
    paid: {
      speaker: 'mom',
      text: '"You did WHAT." She finds out in about four hours, because the billing office calls the house to say thank you. She is furious. She is furious in the specific way that means she is going to tell every aunt at Tết. "My child paid for my scan," she will say, and pretend it\'s a complaint.',
      effects: [{ scene: 'ev_home_mom_scan_result_scene', delayHours: 24 * 14 }],
    },
    flowers: {
      speaker: 'dad',
      text: '"The flowers are nice," Dad says on the phone that night. "She put them in the good vase." He doesn\'t say anything else for a moment. "She kept looking at the door, is all." Then he talks about the weather for a while, and you let him.',
      effects: [{ scene: 'ev_home_mom_scan_result_scene', delayHours: 24 * 14 }],
    },
  },
}

const momScanResultScene: SceneDef = {
  id: 'ev_home_mom_scan_result_scene',
  channel: 'chat',
  title: 'RESULTS',
  from: 'mom',
  start: 'clear',
  nodes: {
    clear: {
      speaker: 'mom',
      text: [
        'IT IS CLEAR',
        'sorry. caps. IT IS CLEAR. the doctor said "unremarkable". i have never been so happy to be unremarkable',
        { if: { flag: 'ev_home.went_to_scan' }, text: 'thank you for sitting with me. you held my hand like when you were small and scared of the dentist. now we are even' },
        { if: { flag: 'ev_home.missed_scan' }, text: 'the flowers are still alive. i am also still alive. next year you come. that is not a question' },
        'come eat. i made too much. i always make too much',
      ],
      choices: [
        { text: 'coming. save me the crispy part', effects: [{ npc: 'mom', affinity: 3 }, { stat: 'mood', add: 8 }, { stat: 'stress', add: -6 }] },
        { text: '*hugz* mom. so glad. this weekend, promise', effects: [{ stat: 'mood', add: 6 }, { stat: 'stress', add: -4 }] },
      ],
    },
  },
}

const momScan: EventDef = {
  id: 'ev_home_mom_scan',
  category: 'health',
  weight: 3,
  when: { all: [momRecovered, dadHere, actGte(3), free] },
  scene: 'ev_home_mom_scan_scene',
}

export default defineContent({
  events: [catVet, kimMovingDay, chestPains, momScan],
  scenes: [catVetScene, movingScene, chestScene, momScanScene, momScanResultScene],
})
