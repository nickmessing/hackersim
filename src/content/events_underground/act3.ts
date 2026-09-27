/**
 * events_underground — ACT III (days ~1200–2900). Signal Intelligence. Surveillance is ambient now,
 * the money is real and dirty, and cred has a cost: everyone wants a piece of a name that matters.
 * Police attention reacts to heat, and the paranoia the scene laughed about in Act I stops being a
 * joke. One comedy beat still survives per stretch — but a joke is how people cope with a wake now.
 *
 * HARD RULE: hacking is invented flavor only.
 */
import { defineContent } from '@/engine/registry'
import type { BuffDef, Cond, EventDef, SceneDef } from '@/engine/types'
import { LYING_LOW, RATTLED, actGte, around, atHome, boardLive, buff, bump, cathodeOpen, free } from './_shared'

// ── ev_under_burned_handle ────────────────────────────────────────────────────
// A known handle gets busted; the board panics. Warn / scrub / freeze. Fail → complication.
const burnedScene: SceneDef = {
  id: 'ev_under_burned_handle_scene',
  channel: 'dialog',
  title: 'They Got Halfpipe',
  from: 'the Loft board',
  pause: true,
  start: 'news',
  nodes: {
    news: {
      speaker: 'narrator',
      text: [
        { if: around('byteme'), text: 'byteme, all caps, three pages in four minutes: "they got halfpipe. HALFPIPE. door came off the hinges at 6am. his mom filmed it. its on the local news right now. {handle} everyone he ever talked to is freaking. that includes us. that includes ME. what do we do"', else: 'The board is a wall of red. They got Halfpipe — 6 a.m. raid, door off the hinges, the works.' },
        'Halfpipe ran the old trading channel for six years: friendly, sloppy, never threw anything away. Every handle he ever traded with is now a name in someone\'s notebook. Including, three trades back, yours.',
        { if: { flag: 'fac.bureau.informant' }, text: 'You wonder, for one sick second, whether this started with something you said on a Tuesday. You will never know. That\'s the worst part of being on their books: you never get to know.' },
      ],
      choices: [
        {
          tag: '[OpSec]',
          text: 'Get the word out fast and clean — a warning chain that helps people without leaving your own prints on it.',
          check: {
            skill: 'opsec',
            dc: 19,
            bonuses: [
              { if: { trait: 'paranoid' }, add: 2, label: '+2 (paranoid)' },
              { if: { flag: 'life.y2k_safehouse' }, add: 1, label: '+1 (a safe channel you set up years ago)' },
            ],
            success: 'warn_ok',
            fail: 'warn_bad',
            successEffects: [{ faction: 'fac.loft', add: 4 }, { stat: 'cred', add: 3 }, { stat: 'heat', add: -4 }],
            failEffects: [{ complication: 'legal' }, { stat: 'heat', add: 10 }, { flag: 'ev_under.warning_traced' }],
          },
        },
        {
          tag: '[Intrusion]',
          text: 'Forget the others for a night. Scrub every link between you and Halfpipe before someone reads it.',
          check: {
            skill: 'intrusion',
            dc: 20,
            bonuses: [{ if: { item: 'sw_logcleaner' }, add: 2, label: '+2 (WipeWell)' }],
            success: 'scrub_ok',
            fail: 'scrub_bad',
            successEffects: [{ stat: 'heat', add: -12 }, { xp: 'intrusion', add: 30 }, { stat: 'cred', add: -1 }],
            failEffects: [{ complication: 'hack' }, { stat: 'heat', add: 8 }, buff(RATTLED) ],
          },
        },
        {
          text: 'Do nothing. Post nothing. Touch nothing. You were never here.',
          effects: [{ stat: 'cred', add: -3 }, { stat: 'stress', add: 6 }, buff(LYING_LOW), { flag: 'ev_under.abandoned_the_board' }],
          goto: 'froze',
        },
      ],
    },
    warn_ok: {
      speaker: 'narrator',
      text: 'The chain moves the way it was built to — a whisper that reaches everyone and points at no one. Three people wipe and vanish before the notebook reaches them. Nobody knows it was you, which is exactly how a favour this size should be done.',
    },
    warn_bad: {
      speaker: 'narrator',
      text: [
        'The warning saves people — and lights you up doing it. Somewhere a follow-the-source query just returned your shape. You did a good thing loudly, and loud is the one thing you can\'t afford right now.',
        { if: around('byteme'), text: 'byteme, much later, much quieter: "the warning worked. but i think u put ur own hand up. thank u. im sorry."' },
      ],
    },
    scrub_ok: {
      speaker: 'narrator',
      text: 'By dawn there is no line between you and Halfpipe that anyone could draw. It cost you a little standing — you looked after yourself first, and the board noticed — but you\'re clean, and clean is how you stay free enough to help the next one.',
    },
    scrub_bad: {
      speaker: 'narrator',
      text: 'You go to cut the links and find someone already pulling the same thread from the other end. You wipe what you can, but you were a beat too late, and now there\'s a version of tonight where your name is underlined.',
    },
    froze: {
      speaker: 'narrator',
      text: 'You close the laptop and sit in the dark. It\'s the safe play, and it works, and it costs you something quieter than heat — the part of you that used to believe the scene looked after its own. Deadline would have a word for this. You don\'t call him.',
    },
  },
}

const burnedHandle: EventDef = {
  id: 'ev_under_burned_handle',
  category: 'underground',
  weight: 3,
  when: { all: [actGte(3), boardLive, { day: true, gte: 1260 }, free] },
  scene: 'ev_under_burned_handle_scene',
}

// ── ev_under_side_job_temptation ──────────────────────────────────────────────
// A dirty, lucrative side job. More tempting when you're broke; [Business] to control the terms.
const sideJobScene: SceneDef = {
  id: 'ev_under_side_job_scene',
  channel: 'dialog',
  title: 'One Clean Number',
  from: 'a fixer named Odette',
  pause: true,
  start: 'pitch',
  nodes: {
    pitch: {
      speaker: 'Odette',
      text: [
        { if: { var: 'ev_under.odette_count', lte: 1 }, text: 'Odette fixes things for people who can\'t be seen fixing them. She has a voice like a closing account and a job that pays like a small inheritance.' },
        { if: { all: [{ var: 'ev_under.odette_count', gte: 2 }, { flag: 'ev_under.did_odette_job' }] }, text: 'Odette again, same booth, same untouched coffee. "You did tidy work last time. My clients noticed. Clients who notice are clients who come back."' },
        { if: { all: [{ var: 'ev_under.odette_count', gte: 2 }, { not: { flag: 'ev_under.did_odette_job' } }] }, text: 'Odette again. "I said I\'d call when your spine loosened. Let\'s find out." She has a voice like a closing account and, as ever, a job that pays like a small inheritance.' },
        '"A client needs a record to stop existing. Not altered — gone, clean, with the seams sanded. You\'re good enough that it won\'t come back on anyone. The number has five digits and the first one isn\'t small."',
        { if: { stat: 'money', lte: 400 }, text: 'You do the math on your own rent before she finishes the sentence. That\'s the thing about being broke: it does the persuading for her.' },
        { if: { stat: 'cred', gte: 60 }, text: '"I only bring this to people the board swears by. Congratulations. Your reputation is why I\'m sitting here — and why you can\'t entirely say no without it costing you."' },
      ],
      choices: [
        {
          text: 'Take it. Do the job. Make the number real.',
          effects: [
            { money: 9000 },
            { stat: 'heat', add: 16 },
            { stat: 'cred', add: 3 },
            { faction: 'fac.hood', add: -2 },
            { flag: 'ev_under.did_odette_job' },
            { chance: 0.3, then: [{ complication: 'hack' }] },
          ],
          goto: 'took',
        },
        {
          tag: '[Business]',
          text: '"I\'ll do it. But I set the terms — a cut-out between me and your client, and half up front." Control the exposure, not just the price.',
          check: {
            skill: 'business',
            dc: 20,
            bonuses: [{ if: { skill: 'opsec', gte: 45 }, add: 2, label: '+2 (you know what safe looks like)' }],
            success: 'terms_ok',
            fail: 'terms_bad',
          },
        },
        {
          text: '"Records don\'t stop existing. People just stop being able to find them. I don\'t do the first kind." Walk.',
          effects: [{ stat: 'cred', add: 2 }, { faction: 'fac.hood', add: 2 }, { stat: 'mood', add: 3 }, { flag: 'ev_under.refused_odette' }],
          goto: 'refused',
        },
        {
          text: 'Refuse — and quietly copy the client\'s name for a rainy day.',
          if: { skill: 'intrusion', gte: 50 },
          effects: [{ stat: 'cred', add: 1 }, { flag: 'ev_under.kept_odette_name' }, { stat: 'stress', add: 4 }],
          goto: 'kept',
        },
      ],
    },
    took: {
      speaker: 'narrator',
      text: 'The record dies quietly under your hands, seams sanded smooth. The money is real and the rent is paid and for a week you feel like a professional. Somewhere a person you\'ll never meet just became easier to hurt, and you file that feeling where you file the others.',
    },
    terms_ok: {
      speaker: 'Odette',
      text: '"...A cut-out. Half up front." She actually smiles, which is unnerving. "You\'ll last longer than most. Most take the number and forget they\'re the one holding it afterward."',
      effects: [{ money: 9000 }, { stat: 'heat', add: 8 }, { stat: 'cred', add: 4 }, { xp: 'business', add: 25 }, { flag: 'ev_under.did_odette_job' }],
    },
    terms_bad: {
      speaker: 'Odette',
      text: '"No cut-out. You do it my way or you don\'t do it." You take it anyway, because the rent doesn\'t negotiate — and now there\'s a straight line from the job to you with nothing in the middle to cut.',
      effects: [{ money: 9000 }, { stat: 'heat', add: 20 }, { flag: 'ev_under.did_odette_job' }, { flag: 'ev_under.odette_exposed' }, { complication: 'hack' }],
    },
    refused: {
      speaker: 'Odette',
      text: '"Pity. You\'re exactly good enough." She leaves cash on the table for a coffee she didn\'t order. "The offer has a cousin, and the cousin has a cousin. This city always needs someone with clean hands and a flexible spine. Call me when yours loosens."',
    },
    kept: {
      speaker: 'narrator',
      text: 'You say no, and you mean it, and you also walk away with the one thing Odette didn\'t mean to give you: the name of who wanted a person erased. You don\'t know yet what it\'s worth. You know enough to keep it.',
    },
  },
}

const sideJobTemptation: EventDef = {
  id: 'ev_under_side_job_temptation',
  category: 'money',
  weight: 2,
  repeatable: true,
  cooldownDays: 140,
  when: { all: [actGte(3), { stat: 'cred', gte: 30 }, free] },
  effects: [bump('ev_under.odette_count')],
  scene: 'ev_under_side_job_scene',
}

// ── ev_under_paranoia_night ───────────────────────────────────────────────────
// 3 a.m. and the fear won't sleep. [Fitness]/[OpSec] to settle; failure leaves a scar.
const paranoiaScene: SceneDef = {
  id: 'ev_under_paranoia_night_scene',
  channel: 'dialog',
  title: '3:47 A.M.',
  from: 'Home, in the dark',
  pause: true,
  start: 'wake',
  nodes: {
    wake: {
      speaker: 'narrator',
      text: [
        'You\'re awake because a car idled outside a beat too long, or because the fridge clicked, or because the fear doesn\'t need a reason anymore. The ceiling has nothing to say. Your heart is doing the talking.',
        { if: atHome, text: 'Every light in your old bedroom is off except the modem\'s, which blinks like it\'s counting down to something. Down the hall, Dad snores. If they came tonight, they would come through Mom\'s kitchen. You know they won\'t. Knowing doesn\'t help at 3:47 a.m.', else: 'Every light in the place is off except the modem\'s, which blinks like it\'s counting down to something. You know it isn\'t. Knowing doesn\'t help at 3:47 a.m.' },
        { if: { trait: 'ev_under_paranoid_sleeper' }, text: 'This is not the first night. It is not the tenth. You have a routine for it now, which is its own kind of answer.' },
      ],
      choices: [
        {
          tag: '[Fitness]',
          text: 'Burn it off — push-ups until the noise in your chest is just your body, not your mind.',
          check: {
            skill: 'fitness',
            dc: 18,
            bonuses: [{ if: { trait: 'gym_rat' }, add: 3, label: '+3 (the body knows this)' }],
            success: 'settled',
            fail: 'spiral',
            successEffects: [{ stat: 'stress', add: -10 }, { stat: 'mood', add: 3 }, { xp: 'fitness', add: 15 }],
            failEffects: [{ stat: 'stress', add: 8 }, { stat: 'energy', add: -10 }, buff(RATTLED) ],
          },
        },
        {
          tag: '[OpSec]',
          text: 'Do a slow, thorough sweep — check everything, prove to yourself it\'s fine, then sleep.',
          check: {
            skill: 'opsec',
            dc: 18,
            success: 'settled',
            fail: 'spiral',
            successEffects: [{ stat: 'stress', add: -6 }, { stat: 'heat', add: -3 }],
            failEffects: [{ trait: 'ev_under_paranoid_sleeper' }, { stat: 'stress', add: 6 }, { flag: 'ev_under.never_sleeps' }],
          },
        },
        {
          text: 'Just lie there and let it run. Watch the modem blink until the sky greys.',
          effects: [{ stat: 'stress', add: 10 }, { stat: 'energy', add: -14 }, { stat: 'mood', add: -4 }],
          goto: 'dawn',
        },
        {
          text: 'Call someone who\'s awake at this hour and lets you not talk about it.',
          if: { all: [around('grace'), { npc: 'grace', romance: ['flirting', 'dating', 'partner', 'engaged', 'married'] }] },
          effects: [{ stat: 'stress', add: -8 }, { stat: 'mood', add: 4 }, { npc: 'grace', affinity: 3 }],
          goto: 'called',
        },
      ],
    },
    settled: {
      speaker: 'narrator',
      text: 'The fear doesn\'t leave so much as sit down next to you, quieter now, and eventually you both fall asleep. In the morning the car is gone. There probably never was a car. You get to keep believing that.',
    },
    spiral: {
      speaker: 'narrator',
      text: 'It doesn\'t work. The sweep finds nothing, which only proves you missed something. You watch the door until the light comes up grey and useless, and some part of you doesn\'t come back to bed after tonight. It stays up. It\'s always going to be up now.',
    },
    dawn: {
      speaker: 'narrator',
      text: 'You give the night to the fear and it takes everything. Dawn finds you hollow, wired, and no safer than you were — just more tired, which is its own kind of exposure.',
    },
    called: {
      speaker: 'grace',
      text: '"You don\'t have to say what it is." A pause, a kettle somewhere on her end. "Just stay on the line \'til it\'s smaller. I\'m good at nights. It\'s the whole job." You breathe. It gets smaller.',
    },
  },
}

const paranoiaNight: EventDef = {
  id: 'ev_under_paranoia_night',
  category: 'health',
  weight: 2,
  repeatable: true,
  cooldownDays: 100,
  when: { all: [actGte(3), free, { any: [{ stat: 'heat', gte: 40 }, { stat: 'stress', gte: 60 }] }] },
  scene: 'ev_under_paranoia_night_scene',
}

// ── ev_under_cred_tax ─────────────────────────────────────────────────────────
// The price of a name that matters: a desperate stranger wants a rescue. Reads cred.
const credTaxScene: SceneDef = {
  id: 'ev_under_cred_tax_scene',
  channel: 'chat',
  title: 'please u dont know me but',
  from: 'Unknown handle',
  start: 'plea',
  nodes: {
    plea: {
      speaker: 'Unknown handle',
      text: [
        { if: { var: 'ev_under.cred_tax_count', lte: 1 }, text: 'hi. its D0wnpour. u dont know me. everyone knows u tho. ur name is like. a legend on three boards' },
        { if: { var: 'ev_under.cred_tax_count', eq: 2 }, text: 'hi. im saltmarsh. D0wnpour gave me ur handle. said u were the one who actually answers' },
        { if: { var: 'ev_under.cred_tax_count', gte: 3 }, text: 'hey. u dont know me. nobody gave me ur handle, its just. everywhere. ur on a list of "people who help" someone made. sorry' },
        'i did something stupid and now i think im about to get raided and i have my little brothers stuff on my drive too and i cant lose it and i cant afford anyone real and ur the only name i had',
        'can u help me. please. i can pay a little. i know u dont owe me anything. thats why im asking, cuz everyone says u actually help people',
      ],
      choices: [
        {
          tag: '[Intrusion]',
          text: 'Talk them through a real clean-up, walking their hands step by step until the drive is safe.',
          check: {
            skill: 'intrusion',
            dc: 19,
            bonuses: [{ if: { skill: 'social', gte: 40 }, add: 2, label: '+2 (patience is the skill here)' }],
            success: 'helped',
            fail: 'help_bad',
            successEffects: [{ stat: 'cred', add: 3 }, { stat: 'mood', add: 5 }, { faction: 'fac.hood', add: 1 }],
            failEffects: [{ complication: 'social' }, { stat: 'cred', add: -2 }, { stat: 'mood', add: -5 }],
          },
        },
        {
          tag: '[Social]',
          text: 'Set a boundary kindly — point them to who *should* help, and why it can\'t be you every time.',
          check: {
            skill: 'social',
            dc: 18,
            bonuses: [{ if: { trait: 'empath' }, add: 2, label: '+2 (empath)' }],
            success: 'boundary',
            fail: 'boundary_bad',
            successEffects: [{ stat: 'stress', add: -3 }, { stat: 'mood', add: 2 }],
            failEffects: [{ trait: 'ev_under_burned_bridge' }, { stat: 'cred', add: -2 }, { flag: 'ev_under.turned_away_a_kid' }],
          },
        },
        {
          text: '"Wire me $300 first." Cred is a business now; act like it.',
          effects: [{ money: 300 }, { stat: 'cred', add: -3 }, { faction: 'fac.hood', add: -2 }, { flag: 'ev_under.charged_the_desperate' }],
          goto: 'charged',
        },
        { text: 'Block them. You can\'t carry every stranger on the Row.', effects: [{ stat: 'mood', add: -3 }, { stat: 'stress', add: 2 }], goto: 'blocked' },
      ],
    },
    helped: {
      speaker: 'Unknown handle',
      text: 'its clean. its CLEAN. my brothers stuff is on a burned cd in my pocket and the drive is a brick and im crying a little. u didnt have to. ur exactly what everyone says u are. i wont forget this. i mean it',
    },
    help_bad: {
      speaker: 'Unknown handle',
      text: 'wait thats not— that deleted the— no no no\n\n...its gone. all of it. i think i just made it worse and u tried and now theyre still coming and\n\ni shouldnt have bothered u. sorry. sorry',
    },
    boundary: {
      speaker: 'Unknown handle',
      text: 'ok. ok yeah. u gave me a name and a number and u didnt make me feel like garbage for asking. thats more than i expected honestly. thank u for being straight with me',
    },
    boundary_bad: {
      speaker: 'narrator',
      text: 'You mean to be kind and it comes out as a door closing. They log off mid-sentence. A week later a post goes up — no names, but everyone knows — about how the legends only help when it\'s cheap. Some of it sticks to you, because some of it is fair.',
    },
    charged: {
      speaker: 'narrator',
      text: 'The three hundred lands. You do the work; it\'s easy for you. But charging a scared kid up front is the kind of thing the old you would have recognized in someone else and quietly stopped respecting. The Row hears about it. The Row always hears.',
    },
    blocked: {
      speaker: 'narrator',
      text: 'You close the window. There\'ll be another one tomorrow, and another the day after. A name that matters is a line out the door of people who need something, and you can\'t be the whole scene\'s conscience and your own at once. You tell yourself that a few times.',
    },
  },
}

const credTax: EventDef = {
  id: 'ev_under_cred_tax',
  category: 'underground',
  weight: 2,
  repeatable: true,
  cooldownDays: 120,
  when: { all: [actGte(3), { stat: 'cred', gte: 45 }, boardLive] },
  effects: [bump('ev_under.cred_tax_count')],
  scene: 'ev_under_cred_tax_scene',
}

// ── ev_under_bureau_pressure ──────────────────────────────────────────────────
// A faction envoy #2: the law leans in. Reads fac.bureau and the informant flag; guards Reyes.
const bureauScene: SceneDef = {
  id: 'ev_under_bureau_pressure_scene',
  channel: 'dialog',
  title: 'A Ride You Didn\'t Ask For',
  from: 'a grey sedan',
  pause: true,
  start: 'curb',
  nodes: {
    curb: {
      speaker: 'narrator',
      text: [
        'The sedan pulls to the curb like it owns the block, because the people in it more or less do. The window comes down on a face you half-recognize from the news and a laminated card you\'re shown but not handed.',
        { if: { flag: 'fac.bureau.informant' }, text: '"Relax. You\'re one of ours, on paper. This is just a reminder that on paper cuts both ways." The card goes away. The smile doesn\'t.' },
        { if: { not: { flag: 'fac.bureau.informant' } }, text: '"We know your handle. We know your friends\' handles. We\'re not here to ruin your day. We\'re here to offer you a way to keep having days."' },
      ],
      choices: [
        {
          tag: '[OpSec]',
          text: 'Say nothing incriminating, be politely useless, and let them learn you\'re not worth the effort.',
          check: {
            skill: 'opsec',
            dc: 21,
            bonuses: [{ if: { trait: 'silver_tongue' }, add: 1, label: '+1 (you make dull sound like cooperation)' }],
            success: 'stonewall_ok',
            fail: 'stonewall_bad',
            successEffects: [{ stat: 'cred', add: 2 }, { stat: 'heat', add: -4 }, { xp: 'opsec', add: 30 }],
            failEffects: [{ complication: 'legal' }, { stat: 'stress', add: 8 }, { flag: 'ev_under.bureau_leaned' }],
          },
        },
        {
          text: 'Give them a scrap — nothing that burns a friend, just enough to end the conversation.',
          effects: [{ faction: 'fac.bureau', add: 3 }, { faction: 'fac.loft', add: -2 }, { stat: 'heat', add: -8 }, { stat: 'cred', add: -2 }, { flag: 'ev_under.fed_the_grey_sedan' }],
          goto: 'fed',
        },
        {
          text: '"Am I detained?" Make them either arrest you or leave. Call the bluff.',
          effects: [{ chance: 0.5, then: [{ stat: 'cred', add: 3 }, { stat: 'heat', add: -2 }], else: [{ jail: 1 }, { stat: 'heat', add: 6 }, { complication: 'legal' }] }],
          goto: 'bluff',
        },
        {
          text: 'Ask for Reyes by name. Deal only with the one who might be honest.',
          if: { all: [around('reyes'), { npc: 'reyes', fateNot: ['nemesis'] }] },
          effects: [{ npc: 'reyes', affinity: 2 }, { stat: 'cred', add: 1 }, { flag: 'ev_under.asked_for_reyes' }],
          goto: 'reyes',
        },
      ],
    },
    stonewall_ok: {
      speaker: 'narrator',
      text: 'You are a masterpiece of saying nothing. You agree that the weather is a problem. You are concerned about crime in general. The window goes up on a pair of professionals who have decided you\'re more trouble to lean on than you\'re worth. For now.',
    },
    stonewall_bad: {
      speaker: 'narrator',
      text: 'You mean to be dull and instead you\'re nervous, and nervous is a language they read for a living. One slip, one flinch at the wrong name, and now there\'s a follow-up scheduled you didn\'t agree to. They drive off knowing more than they arrived with.',
    },
    fed: {
      speaker: 'narrator',
      text: 'You hand them something small and true and about someone who was probably going to get caught anyway. That\'s the lie you tell the drive home. The sedan pulls away satisfied, and the back room will feel a degree colder next time, though nobody will know why but you.',
    },
    bluff: {
      speaker: 'narrator',
      text: 'You call it. Sometimes the bluff folds and they drive off annoyed; sometimes it doesn\'t, and you spend a night learning exactly how uncomfortable a holding cell chair can be. Either way, you didn\'t give them a friend.',
    },
    reyes: {
      speaker: 'reyes',
      text: '"...Fine. Everybody out, I\'ve got this one." She waits until the others are gone. "That was smart. Don\'t make a habit of trusting the badge, though. Even mine. *Especially* the ones above mine." She hands you a card — a real one, this time.',
    },
  },
}

const bureauPressure: EventDef = {
  id: 'ev_under_bureau_pressure',
  category: 'underground',
  weight: 2,
  when: { all: [actGte(3), { stat: 'heat', gte: 30 }, { day: true, gte: 1400 }, free] },
  scene: 'ev_under_bureau_pressure_scene',
}

// ── ev_under_cop_at_the_door ──────────────────────────────────────────────────
// Police attention reacting to heat — a knock, a canvass. Fail → jail night + legal complication.
const doorScene: SceneDef = {
  id: 'ev_under_cop_at_the_door_scene',
  channel: 'dialog',
  title: 'A Knock',
  from: 'your door',
  pause: true,
  start: 'knock',
  nodes: {
    knock: {
      speaker: 'narrator',
      text: [
        'Three knocks, evenly spaced, at an hour that isn\'t for friends. Through the peephole: two detectives from the local Cage, the underdog cyber unit with a budget of nothing and a grudge that outruns it.',
        '"Just a few questions about some activity on the network in this building. Mind if we come in?" The one in front is already reading your face. Your rig hums in the next room like a confession.',
        { if: { npc: 'calderon', met: true }, text: 'You know the younger one. He carried your tower out to the van the night of the raid, and he said "sorry" under his breath while he did it.' },
        { if: { flag: 'life.y2k_safehouse' }, text: 'Your sensitive work hasn\'t lived on this machine in years. Let them look. There\'s nothing here but a very boring life.' },
        { if: atHome, text: 'Behind you, Mom calls from the kitchen: "Who is it, sweetheart?" The detective in front smiles at you like he just learned something.' },
      ],
      choices: [
        {
          tag: '[OpSec]',
          text: 'Stay calm, stay in the doorway, and be a wall of polite nothing. Consent to nothing; admit nothing.',
          check: {
            skill: 'opsec',
            dc: 20,
            bonuses: [
              { if: { flag: 'life.y2k_safehouse' }, add: 3, label: '+3 (nothing incriminating is here)' },
              { if: { trait: 'paranoid' }, add: 2, label: '+2 (paranoid)' },
            ],
            success: 'held',
            fail: 'cracked',
            successEffects: [{ stat: 'heat', add: -8 }, { stat: 'cred', add: 2 }, { xp: 'opsec', add: 25 }],
            failEffects: [{ complication: 'legal' }, { stat: 'heat', add: 10 }, { jail: 1 }, { flag: 'ev_under.let_them_in' }],
          },
        },
        {
          tag: '[Social]',
          text: 'Charm the exhausted underdogs — coffee, sympathy for their budget, and a story that goes nowhere pleasantly.',
          check: {
            skill: 'social',
            dc: 19,
            bonuses: [{ if: { trait: 'silver_tongue' }, add: 2, label: '+2 (silver tongue)' }],
            success: 'charmed',
            fail: 'cracked',
            successEffects: [{ stat: 'heat', add: -6 }, { stat: 'mood', add: 2 }],
            failEffects: [{ complication: 'legal' }, { stat: 'heat', add: 8 }, { jail: 1 }, { flag: 'ev_under.let_them_in' }],
          },
        },
        {
          text: '"I\'d like to talk to a lawyer before I talk to you." Close the door slowly and legally.',
          effects: [{ stat: 'heat', add: 2 }, { stat: 'cred', add: 1 }, { obligation: { id: 'ev_under_lawyer_retainer', label: 'Lawyer on retainer', perDay: 6, days: 60 } }, { flag: 'ev_under.lawyered_at_door' }],
          goto: 'lawyered',
        },
      ],
    },
    held: {
      speaker: 'narrator',
      text: 'You are courteous, immovable, and boring in exactly the load-bearing way. They ask, you decline, they note it, they leave. No entry, no admissions, no case — just two tired detectives back to a car with a broken heater and one more door that held.',
    },
    charmed: {
      speaker: 'narrator',
      text: 'You give them coffee and commiseration and a version of events with no edges. The younger one actually laughs. They leave with nothing but a warm cup and the vague sense that you\'re probably fine, which is the most valuable outcome money can\'t buy.',
    },
    cracked: {
      speaker: 'narrator',
      text: 'You say one word too many, or let them one step too far inside, and the polite fiction collapses. A phone comes out. The rig in the next room stops being a hum and starts being evidence, and the night stops being yours.',
    },
    lawyered: {
      speaker: 'narrator',
      text: 'The magic words. They can\'t like it, but they can\'t argue it either. The door closes on their annoyance. It costs you — a retainer isn\'t free, and now there\'s a lawyer who expects to be paid — but a paid lawyer is cheaper than an unpaid mistake.',
    },
  },
}

const copAtTheDoor: EventDef = {
  id: 'ev_under_cop_at_the_door',
  category: 'city',
  weight: 3,
  when: { all: [actGte(3), { stat: 'heat', gte: 55 }, { npc: 'calderon', fateNot: ['forced_out'] }, free, { not: { flag: 'sys.no_raids' } }] },
  scene: 'ev_under_cop_at_the_door_scene',
}

// ── ev_under_heat_sweep ───────────────────────────────────────────────────────
// Repeatable police attention that reacts to heat: the Row's whisper network warns you a sweep is
// coming. Stash the rig, go quiet, lean on the neighbours — or shrug and roll the dice on a raid.
const SWEEP_COUNT = 'ev_under.sweep_count'

const RIG_CLOSET: BuffDef = {
  id: 'ev_under_rig_closet',
  name: 'Rig in a Closet',
  desc: 'Your good machine is wrapped in a blanket in somebody else\'s closet. You\'re working off a borrowed laptop with a sticky trackpad and a lot of feelings.',
  days: 14,
  bad: true,
  mods: [
    { key: 'hack.speed', mult: 0.6 },
    { key: 'freelance.speed', mult: 0.8 },
    { key: 'efficiency', mult: 0.92 },
    { key: 'heat.decay', add: 0.3 },
  ],
}

const salAround: Cond = { all: [cathodeOpen, { npc: 'sal', fateNot: ['took_a_fall', 'diner_closed'] }] }

const sweepScene: SceneDef = {
  id: 'ev_under_heat_sweep_scene',
  channel: 'dialog',
  title: 'Sweep Week',
  from: 'Sodium Row',
  pause: true,
  start: 'warning',
  nodes: {
    warning: {
      speaker: 'narrator',
      text: [
        { if: salAround, text: 'Sal slides a coffee you didn\'t order down the counter and keeps his eyes on the grill. "Two fellas in nice shoes were in here yesterday asking about a kid who\'s good with computers. I told \'em every kid is good with computers. They didn\'t laugh. Cops never laugh at the good ones."' },
        { if: { all: [{ not: salAround }, around('dialtone')] }, text: 'Your phone rings at seven in the morning. "It\'s Marge, love. Don\'t say anything, just listen. There\'s a van with no windows parked by the old substation, and it\'s been there three days, and the man in it keeps asking the pager shop about you. That\'s all. Drink some water."' },
        { if: { all: [{ not: salAround }, { not: around('dialtone') }] }, text: 'A kid on a bike you once paid to carry discs swerves up next to you on Sodium Row. "Plainclothes on the strip all week. Van by the substation. They\'re asking about you by your handle." He\'s gone before you can thank him.' },
        { if: { var: SWEEP_COUNT, gte: 2 }, text: 'Sweep week again. The Row has a rhythm for it now, like weather: the windows close, the arcade goes quiet, and everyone suddenly has somewhere very boring to be.' },
        { if: { var: 'w.mnsa', eq: 1 }, text: 'Since the Act passed, they don\'t even need a warrant to pull the logs. They just need a reason to look. You are, at present, a reason.' },
        'Your heat is up. They are close enough to smell it. What you do this week decides whether they knock.',
      ],
      choices: [
        {
          text: 'Pack the rig in a blanket and stash it somewhere that isn\'t yours for a couple of weeks.',
          effects: [{ stat: 'heat', add: -10 }, buff(RIG_CLOSET), { stat: 'stress', add: 3 }],
          goto: 'stashed',
        },
        {
          tag: '[OpSec]',
          text: 'Keep working, but go quiet: new hours, new patterns, nothing that looks like you.',
          check: {
            skill: 'opsec',
            dc: 16,
            bonuses: [
              { if: { trait: 'paranoid' }, add: 2, label: '+2 (paranoid)' },
              { if: { item: 'ev_under_hushline' }, add: 2, label: '+2 (the Hushline Relay)' },
              { if: { item: 'bm_burner_kit' }, add: 1, label: '+1 (burner identity kit)' },
              { if: { trait: 'ev_under_known_to_police' }, add: -2, label: '−2 (they know your name already)' },
            ],
            success: 'quiet_ok',
            fail: 'noticed',
            successEffects: [{ stat: 'heat', add: -6 }, { xp: 'opsec', add: 30 }],
            failEffects: [buff(RATTLED), { stat: 'heat', add: 8 }, { chance: 0.4, then: [{ raid: true }] }],
          },
        },
        {
          tag: '[Social]',
          text: 'Ask the neighbours to be boring for you — a story about a quiet kid who fixes printers.',
          req: { faction: 'fac.hood', gte: 20 },
          reqText: 'Requires Neighborhood rep 20 (they have to know you)',
          check: {
            skill: 'social',
            dc: 14,
            bonuses: [
              { if: { trait: 'empath' }, add: 1, label: '+1 (you know who to ask)' },
              { if: { faction: 'fac.hood', gte: 50 }, add: 2, label: '+2 (the Row trusts you)' },
            ],
            success: 'covered',
            fail: 'hassled',
            successEffects: [{ stat: 'heat', add: -12 }, { faction: 'fac.hood', add: 1 }],
            failEffects: [
              { faction: 'fac.hood', add: -4 },
              { stat: 'heat', add: 4 },
              { flag: 'ev_under.row_hassled' },
              { if: atHome, then: [{ npc: 'mom', affinity: -3 }] },
            ],
          },
        },
        {
          text: 'Shrug. Heat is weather, and you\'ve got deadlines.',
          effects: [
            { stat: 'cred', add: 1 },
            {
              if: { stat: 'heat', gte: 55 },
              then: [{ chance: 0.35, then: [{ flag: 'ev_under.sweep_raided' }, { raid: true }], else: [{ clearFlag: 'ev_under.sweep_raided' }] }],
              else: [{ clearFlag: 'ev_under.sweep_raided' }],
            },
          ],
          goto: 'shrugged',
        },
      ],
    },
    stashed: {
      speaker: 'narrator',
      text: [
        { if: around('jax'), text: 'Jax takes the tower without asking a single question, puts it under his bed, and puts a laundry basket on top of it. "If anyone asks, it\'s a space heater." For two weeks you work off a borrowed laptop and a lot of patience.', else: 'The tower goes into a blanket and then into a closet that isn\'t yours. For two weeks you work off a borrowed laptop with a sticky trackpad and a lot of patience.' },
        'The van by the substation leaves on the ninth day. You don\'t know if you had anything to do with it. That\'s how it\'s supposed to feel.',
      ],
    },
    quiet_ok: {
      speaker: 'narrator',
      text: 'You become a very dull person for a week: early nights, no long sessions, nothing at the hours you usually keep. Whoever is watching the pattern sees a pattern that isn\'t yours, and gets bored, and moves on to someone who isn\'t being careful.',
    },
    noticed: {
      speaker: 'narrator',
      text: [
        'You change your hours but not your habits, and habits are what they read. On the fourth night a car idles outside with its lights off for forty minutes at exactly the time you log in.',
        { if: { flag: 'sys.raided' }, text: 'You know what the next part sounds like. You have heard it before. Your hands know it too.', else: 'You don\'t sleep. You don\'t need to. The fear does it for you, in shifts.' },
      ],
    },
    covered: {
      speaker: 'narrator',
      text: 'Mrs. Alvarez from three doors down tells the man in nice shoes that you are "a good boy who fixes my printer and eats too little," at length, with photographs. The corner store says you buy milk. The laundromat says you fold badly. By the end of the week you are the least interesting person in Port Lumen, officially.',
    },
    hassled: {
      speaker: 'narrator',
      text: [
        'You ask, and the Row tries, and it goes wrong the way small things go wrong: the man in nice shoes doesn\'t like the story, and he spends a whole afternoon asking the corner store owner about his permits instead.',
        'Nobody says anything to you about it. They don\'t have to. The next time you buy milk, the owner rings it up without looking at you.',
        { if: atHome, text: 'At dinner, Mom mentions that "a policeman" asked the neighbours about her child. She doesn\'t ask you anything. That\'s worse.' },
      ],
    },
    shrugged: {
      speaker: 'narrator',
      text: [
        { if: { flag: 'ev_under.sweep_raided' }, text: 'Thursday, 6:10 a.m. The knock is not a knock. It is the sound of the week you decided not to take seriously, arriving all at once, with a warrant.', else: 'You keep your hours. You keep your habits. The van by the substation leaves after a week, and for once the dice were kind. You tell yourself it was skill. It wasn\'t.' },
      ],
    },
  },
}

const heatSweep: EventDef = {
  id: 'ev_under_heat_sweep',
  category: 'city',
  weight: 3,
  repeatable: true,
  cooldownDays: 90,
  when: { all: [actGte(2), { stat: 'heat', gte: 45 }, free, { not: { flag: 'sys.no_raids' } }] },
  effects: [bump(SWEEP_COUNT)],
  scene: 'ev_under_heat_sweep_scene',
}

export default defineContent({
  events: [burnedHandle, sideJobTemptation, paranoiaNight, credTax, bureauPressure, copAtTheDoor, heatSweep],
  scenes: [burnedScene, sideJobScene, paranoiaScene, credTaxScene, bureauScene, doorScene, sweepScene],
})
