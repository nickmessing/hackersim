/**
 * events_home — the RECURRING pool. Beats that come back all game with cooldowns, each keeping a
 * private counter (`ev_home.*_count`, bumped by the start node on delivery) so the second and third
 * times read differently from the first, and each reacting to where you live, who is still at the
 * table, and what act of your life this is.
 */
import { defineContent } from '@/engine/registry'
import type { Cond, Effect, EventDef, SceneDef } from '@/engine/types'
import {
  BANDAGED_HAND,
  COLD_WEEK,
  FAMILY_STRAIN,
  FOOD_POISONED,
  HOME_WARM,
  SOGGY_RIG,
  THROWN_BACK,
  WELL_FED,
  actGte,
  actLte,
  around,
  atParents,
  buff,
  cathodeOpen,
  dadHere,
  darkTurn,
  familyHome,
  free,
  hasCat,
  kimHere,
  momGone,
  momHere,
  notAtParents,
  owe,
  owning,
  partnerIs,
  renting,
  tetWindow,
  winter,
  withGrace,
  withMira,
  withPartner,
  withRoommates,
} from './_shared'

/** A legit job title the aunties can pronounce. */
const respectableJob: Cond = { jobTrack: ['dev', 'sysadmin', 'network', 'security', 'management', 'startup'] }
/** Mom's brother: family, so he comes to Tết whether or not you've met him on his own business. */
const uncleHere: Cond = { npc: 'uncle', fateNot: ['gone', 'dead', 'jailed', 'arrested', 'missing'] }
/** Someone you share a bed and a lease with. */
const livingTogether: Cond = {
  any: [
    { all: [withMira, { npc: 'mira', romance: ['partner', 'engaged', 'married'] }] },
    { all: [withGrace, { npc: 'grace', romance: ['partner', 'engaged', 'married'] }] },
  ],
}

// ── ev_home_cat_chaos ─────────────────────────────────────────────────────────
// The cat has opinions about your work. Three variants, rolled on delivery.
const catChaosScene: SceneDef = {
  id: 'ev_home_cat_chaos_scene',
  channel: 'dialog',
  title: 'Cat Incident',
  start: 'incident',
  nodes: {
    incident: {
      speaker: 'narrator',
      effects: [
        { var: 'ev_home.cat_chaos_count', add: 1 },
        {
          random: [
            { weight: 1, effects: [{ var: 'ev_home.cat_mischief', set: 1 }] },
            { weight: 1, effects: [{ var: 'ev_home.cat_mischief', set: 2 }] },
            { weight: 1, effects: [{ var: 'ev_home.cat_mischief', set: 3 }] },
          ],
        },
      ],
      text: [
        { if: { var: 'ev_home.cat_mischief', eq: 1 }, text: 'You step away for ninety seconds to refill your coffee. When you come back, {flag:ev_home.cat_name} is sitting on the keyboard, looking pleased, and your half-written message to a client has been sent. It now ends: "...and the invoice is attached jjjjjjjjjjjjjjjjj;;;;;;;;;[[[[[[[[[[p".' },
        { if: { var: 'ev_home.cat_mischief', eq: 2 }, text: 'The connection drops mid-upload. You follow the phone cord back from the modem, hand over hand, and find {flag:ev_home.cat_name} under the bed with the other end in her mouth, chewing thoughtfully, like a sommelier.' },
        { if: { var: 'ev_home.cat_mischief', eq: 3 }, text: 'At 3 a.m. {flag:ev_home.cat_name} jumps onto the desk with a gift: a mouse, alive and extremely motivated, which she releases directly onto your keyboard before sitting back to watch what you\'ll do with it.' },
        { if: { var: 'ev_home.cat_chaos_count', gte: 2 }, text: 'This is not the first incident. You are starting to suspect it is policy.' },
      ],
      choices: [
        {
          if: { var: 'ev_home.cat_mischief', eq: 1 },
          tag: '[Social]',
          text: 'Write the client a follow-up so charming that the cat becomes a selling point.',
          check: {
            skill: 'social',
            dc: 12,
            bonuses: [
              { if: { trait: 'silver_tongue' }, add: 2, label: '+2 (silver tongue)' },
              { if: { background: 'class_clown' }, add: 1, label: '+1 (you can make anything a bit)' },
            ],
            success: 'client_win',
            fail: 'client_lose',
          },
        },
        {
          if: { var: 'ev_home.cat_mischief', eq: 1 },
          text: 'Say nothing and hope they don\'t read to the end.',
          effects: [{ stat: 'stress', add: 3 }],
          goto: 'silence',
        },
        {
          if: { var: 'ev_home.cat_mischief', eq: 2 },
          tag: '[Hardware]',
          text: 'Splice the cord back together with electrical tape and a steady hand.',
          check: {
            skill: 'hardware',
            dc: 12,
            bonuses: [{ if: { background: 'tinkerer' }, add: 2, label: '+2 (basement tinkerer)' }],
            success: 'cord_win',
            fail: 'cord_lose',
          },
        },
        {
          if: { var: 'ev_home.cat_mischief', eq: 2 },
          text: 'Walk to the pager shop and buy a new cord. Leave the old one to the cat as tribute.',
          effects: [{ money: -15 }, { stat: 'energy', add: -8 }],
          goto: 'tribute',
        },
        {
          if: { var: 'ev_home.cat_mischief', eq: 3 },
          tag: '[Fitness]',
          text: 'Catch the mouse bare-handed before it gets into the tower.',
          check: {
            skill: 'fitness',
            dc: 12,
            bonuses: [{ if: { trait: 'gym_rat' }, add: 2, label: '+2 (reflexes)' }],
            success: 'mouse_win',
            fail: 'mouse_lose',
          },
        },
        {
          if: { var: 'ev_home.cat_mischief', eq: 3 },
          text: 'Climb onto the chair and let the professional handle it.',
          effects: [{ stat: 'energy', add: -15 }, { stat: 'mood', add: 3 }],
          goto: 'professional',
        },
      ],
    },
    client_win: {
      speaker: 'narrator',
      text: 'You send a photo of {flag:ev_home.cat_name} on the keyboard with the caption "My QA department has reviewed your invoice." The client replies within the hour: they paid early, added a tip "for the QA department," and have asked whether she is available for their office party.',
      effects: [{ money: 40 }, { stat: 'mood', add: 5 }],
    },
    client_lose: {
      speaker: 'narrator',
      text: 'The client does not find it charming. The client forwards your message, j\'s and all, to three colleagues with the subject line "is this who we hired?" Two leads go quiet that week. Word travels in small business circles, and it travels with a cat attached.',
      effects: [{ stat: 'cred', add: -1 }, { stat: 'stress', add: 6 }, buff({ id: 'ev_home_cat_unprofessional', name: 'Cat on the Keyboard', desc: 'A client is telling the story of your invoice at networking lunches. Freelance rates are down until they find a new story.', days: 21, bad: true, mods: [{ key: 'freelance.pay', mult: 0.9 }] })],
    },
    silence: {
      speaker: 'narrator',
      text: 'They read to the end. They always read to the end. Their reply is a single line: "Is everything okay?" You write back "yes!!" and then sit very still for a while.',
      effects: [{ stat: 'mood', add: -2 }],
    },
    cord_win: {
      speaker: 'narrator',
      text: 'Ten minutes, a strip of tape, and a splice so clean you could frame it. The modem sings. {flag:ev_home.cat_name} watches you reconnect with the injured air of someone whose art has been restored without permission.',
      effects: [{ xp: 'hardware', add: 10 }],
    },
    cord_lose: {
      speaker: 'narrator',
      text: 'The splice holds for eleven seconds, which is long enough to feel smug. Then the line starts crackling, the connection drops every few minutes, and by midnight the modem is making a noise you have never heard it make. The pager shop\'s after-hours price for a cord and a replacement jack is extortion. You pay it. The upload you were in the middle of is late.',
      effects: [{ money: -45 }, { stat: 'energy', add: -15 }, { stat: 'stress', add: 5 }, { stat: 'cred', add: -1 }],
    },
    tribute: {
      speaker: 'narrator',
      text: 'The new cord works. The old cord becomes the cat\'s favorite object, and she carries it from room to room like a trophy, laying it across your keyboard every morning as a reminder of what she is capable of.',
    },
    mouse_win: {
      speaker: 'narrator',
      text: 'You get it on the second grab, walk it down three flights in cupped hands, and release it into the alley with a stern word. {flag:ev_home.cat_name} watches from the window, deeply disappointed in your hunting ethics.',
      effects: [{ stat: 'mood', add: 4 }],
    },
    mouse_lose: {
      speaker: 'narrator',
      text: 'You lunge, the mouse dodges, your knee meets the desk, and the monitor rocks on its base with a sound you will hear in your dreams. It stays upright. You do not. The mouse is never seen again, which is somehow worse: every noise in the walls for a month is the mouse.',
      effects: [{ stat: 'health', add: -5 }, { stat: 'stress', add: 6 }, { stat: 'energy', add: -10 }],
    },
    professional: {
      speaker: 'narrator',
      text: 'It takes her forty minutes, a lot of theatre, and one knocked-over mug. You don\'t get back to sleep. You do get a front-row seat to the most competent thing that has happened in this apartment all month.',
    },
  },
}

const catChaos: EventDef = {
  id: 'ev_home_cat_chaos',
  category: 'weird',
  weight: 2,
  repeatable: true,
  cooldownDays: 140,
  when: { all: [hasCat, free] },
  scene: 'ev_home_cat_chaos_scene',
}

// ── ev_home_roommate_party ────────────────────────────────────────────────────
// Friday night, a deadline, and forty strangers on the other side of a thin door.
const partyScene: SceneDef = {
  id: 'ev_home_roommate_party_scene',
  channel: 'dialog',
  title: 'Party Next Door',
  start: 'noise',
  nodes: {
    noise: {
      speaker: 'narrator',
      effects: [{ var: 'ev_home.party_count', add: 1 }],
      text: [
        { if: { housing: 'dorm_room' }, text: 'It\'s Friday, and the fourth floor has decided that your hallway is the party. Someone has a keg in a laundry basket. Someone else is DJing off a boombox balanced on the fire extinguisher.' },
        { if: { housing: 'shared_room' }, text: 'It\'s Friday, and your roommates have invited "a few people," which in Millgate loft math means forty strangers, a drum circle and a guy who brought his own fog machine.' },
        'You have work due at dawn. Your door is thin, your lock is theoretical, and your rig is lit up like a shrine.',
        { if: { var: 'ev_home.party_count', gte: 2 }, text: 'This happened last time too. You remember exactly how it went.' },
        { if: { stat: 'heat', gte: 40 }, text: 'Lately, you have reasons not to want strangers near your desk. Good reasons. The kind that come with badges.' },
      ],
      choices: [
        {
          text: 'Close the laptop, lock the drawer, and join the party. You\'re young once.',
          effects: [{ stat: 'mood', add: 8 }, { stat: 'stress', add: -8 }, { stat: 'energy', add: -20 }],
          goto: 'join',
        },
        {
          text: 'Headphones on. Keep working through it.',
          effects: [{ stat: 'energy', add: -10 }],
          goto: 'stay',
        },
        {
          tag: '[Social]',
          text: 'Go out there and shut it down — politely, firmly, and with the landlord\'s name dropped twice.',
          check: {
            skill: 'social',
            dc: 14,
            bonuses: [
              { if: { trait: 'hothead' }, add: -2, label: '-2 (hothead)' },
              { if: { trait: 'silver_tongue' }, add: 2, label: '+2 (silver tongue)' },
            ],
            success: 'shut_win',
            fail: 'shut_lose',
          },
        },
        {
          if: cathodeOpen,
          text: 'Pack the laptop and work from the Cathode until the fog clears.',
          effects: [{ money: -8 }, { stat: 'energy', add: -5 }, { xp: 'programming', add: 15 }],
          goto: 'cathode',
        },
      ],
    },
    join: {
      speaker: 'narrator',
      text: [
        'You end up on the roof at 2 a.m. with a girl from the architecture program explaining load-bearing walls with her hands, and a roommate crying happily about his dad. Nobody asks what you do. You don\'t volunteer it.',
        { if: { background: 'class_clown' }, text: 'At some point you are standing on a chair telling the story of the phone bill, and forty strangers are howling. You are, briefly, the party.' },
        'The work is late. It\'s worth it, mostly.',
      ],
    },
    stay: {
      speaker: 'narrator',
      text: 'At 1 a.m. your door swings open. A stranger in a borrowed hat is standing there, drink in hand, looking past you at the green text scrolling on your screen with slowly dawning interest. "Whoa," he says. "Are you, like, a hacker?"',
      choices: [
        {
          tag: '[Social]',
          text: '"Tax software. Want me to explain depreciation schedules?"',
          check: {
            skill: 'social',
            dc: 13,
            bonuses: [{ if: { trait: 'silver_tongue' }, add: 2, label: '+2 (silver tongue)' }],
            success: 'deflect_win',
            fail: 'rumor',
          },
        },
        {
          tag: '[OpSec]',
          text: 'Hit the key you bound months ago that blanks the screen to a spreadsheet, and look bored.',
          check: {
            skill: 'opsec',
            dc: 12,
            bonuses: [{ if: { trait: 'paranoid' }, add: 2, label: '+2 (you set this up for exactly this)' }],
            success: 'blank_win',
            fail: 'rumor',
          },
        },
        {
          text: 'Slam the lid shut. "GET OUT."',
          effects: [{ stat: 'heat', add: 2 }, { flag: 'ev_home.party_rumor' }, { stat: 'stress', add: 4 }],
          goto: 'slam',
        },
      ],
    },
    deflect_win: {
      speaker: 'narrator',
      text: 'You get as far as "straight-line versus accelerated" before his eyes glaze and he backs away like you\'re contagious. You hear him tell someone in the hall that your roommate is "a total accountant, man." You have never been prouder.',
    },
    blank_win: {
      speaker: 'narrator',
      text: 'The screen becomes a budget spreadsheet so boring it has its own gravity. He squints at it, loses interest, and wanders off to find the fog machine. Months of paranoia just paid for themselves in one keystroke.',
      effects: [{ xp: 'opsec', add: 15 }],
    },
    slam: {
      speaker: 'narrator',
      text: 'He leaves. He also tells everyone at the party about the weird kid who slammed a laptop and yelled, which is a better story than anything on your screen. By Monday you are "the hacker in 3B," said as a joke. Mostly as a joke.',
    },
    rumor: {
      speaker: 'narrator',
      text: [
        'It doesn\'t take. He\'s drunk, not stupid. By 3 a.m. half the party has heard that the quiet one in the back room is "a real hacker, like in the movies," and someone has asked if you can change their grades.',
        'By the next week, it\'s the story everyone on the floor tells. Stories like that have a way of reaching people who write things down.',
        { if: { stat: 'heat', gte: 40 }, text: 'Somebody at that party has a cousin on the force. You find that out the way you always find these things out: too late.' },
      ],
      effects: [
        { stat: 'heat', add: 5 },
        { if: { stat: 'heat', gte: 40 }, then: [{ stat: 'heat', add: 5 }] },
        { flag: 'ev_home.party_rumor' },
        { stat: 'stress', add: 6 },
        { chance: 0.35, then: [{ complication: 'social' }] },
      ],
    },
    shut_win: {
      speaker: 'narrator',
      text: 'You say the landlord\'s name twice, the words "noise ordinance" once, and "I\'ll buy pizza for the cleanup" at exactly the right moment. The party migrates to someone else\'s building by midnight. Your roommates grumble, then eat the pizza, then admit it was getting out of hand.',
      effects: [{ money: -20 }, { xp: 'social', add: 10 }],
    },
    shut_lose: {
      speaker: 'narrator',
      text: 'You come out too hot and too early. Somebody boos. Your roommates look at you like you called their mothers. The party continues, louder, out of spite, and for the next month your groceries keep "disappearing" from the shared fridge in a cold war nobody will admit is happening.',
      effects: [{ money: -30 }, { stat: 'mood', add: -6 }, { stat: 'stress', add: 8 }],
    },
    cathode: {
      speaker: 'sal',
      text: '"Party at your place? Sit. Coffee\'s on me, pie is not." Sal refills your cup every forty minutes without asking and never once looks at your screen. You finish by four. It\'s the best work you do all month.',
      effects: [{ npc: 'sal', affinity: 2 }],
    },
  },
}

const roommateParty: EventDef = {
  id: 'ev_home_roommate_party',
  category: 'life',
  weight: 2,
  repeatable: true,
  cooldownDays: 150,
  when: { all: [withRoommates, free] },
  scene: 'ev_home_roommate_party_scene',
}

// ── ev_home_burst_pipe ────────────────────────────────────────────────────────
// Three a.m., a sound like applause inside the wall, and water coming through the ceiling.
const pipeScene: SceneDef = {
  id: 'ev_home_burst_pipe_scene',
  channel: 'dialog',
  title: 'Water',
  start: 'drip',
  nodes: {
    drip: {
      speaker: 'narrator',
      effects: [{ var: 'ev_home.pipe_count', add: 1 }],
      text: [
        'At 3 a.m. the wall behind your desk starts making a sound like polite applause. Then the ceiling above the monitor develops a brown bloom, a bulge, and — with real theatrical timing — a steady stream of water aimed directly at the tower.',
        { if: atParents, text: 'Down the hall you hear Dad\'s feet hit the floor before you\'ve even yelled. He has been waiting his whole life for this pipe.' },
        { if: renting, text: 'You call the landlord\'s emergency number. It rings through to an answering machine whose greeting is just a man sighing.' },
        { if: owning, text: 'It\'s your house. Your pipe. Your ceiling. There is nobody to call but yourself, and you are standing in a puddle.' },
        { if: { var: 'ev_home.pipe_count', gte: 2 }, text: 'Again. You know where the towels are this time. You know where the bucket is. It doesn\'t help as much as you\'d hoped.' },
      ],
      choices: [
        {
          tag: '[Hardware]',
          text: 'Find the shutoff and get the rig out of the splash zone at the same time.',
          check: {
            skill: 'hardware',
            dc: 14,
            bonuses: [
              { if: { background: 'tinkerer' }, add: 2, label: '+2 (you know old buildings)' },
              { if: { trait: 'ev_home_storm_tested' }, add: 1, label: '+1 (storm-tested)' },
            ],
            success: 'saved',
            fail: 'soaked',
          },
        },
        {
          text: 'Grab the tower and run. The flat can drown; the rig cannot.',
          goto: 'rescued',
        },
        {
          if: { all: [atParents, dadHere] },
          text: 'Get out of Dad\'s way. This is literally what he was built for.',
          effects: [{ npc: 'dad', affinity: 5 }, { stat: 'mood', add: 3 }],
          goto: 'dad_fix',
        },
        {
          if: renting,
          tag: '[Social]',
          text: 'Keep calling the landlord, the super and the super\'s brother until a human being answers.',
          check: {
            skill: 'social',
            dc: 13,
            bonuses: [{ if: { trait: 'hothead' }, add: -1, label: '-1 (you are yelling at a machine)' }],
            success: 'landlord_win',
            fail: 'landlord_lose',
          },
        },
      ],
    },
    saved: {
      speaker: 'narrator',
      text: [
        'The shutoff is behind a panel nobody has opened since the streetcars stopped running, but it turns. The stream becomes a drip becomes a sulk. The tower is on the bed wrapped in a towel, dry as a bone.',
        { if: owning, text: 'The plumber the next morning charges you for a new section of pipe and a lecture about old copper. Being a homeowner, you learn, is mostly paying men named Gary.' },
      ],
      effects: [{ xp: 'hardware', add: 15 }, { if: owning, then: [{ money: -150 }] }],
    },
    soaked: {
      speaker: 'narrator',
      text: [
        'You can\'t find the shutoff. You find three things that look like shutoffs; one of them is a gas valve, which you leave alone with shaking hands. By the time the water stops, the tower has taken a direct hit and the keyboard is making a squelching sound.',
        'It dries out on the radiator. It mostly works. It smells like a basement and freezes whenever it feels judged.',
        { if: renting, text: 'The landlord inspects the damage, decides your desk "concentrated the water," and keeps a chunk of the deposit.' },
        { if: owning, text: 'The plumber and the drywall guy send a bill that is easier to pay in installments. Everything about owning a house is easier to pay in installments.' },
        { if: atParents, text: 'Dad\'s toolbox was under the sink. His father\'s wrench will never be quite the same color. He says it doesn\'t matter.' },
      ],
      effects: [
        buff(SOGGY_RIG),
        { stat: 'stress', add: 8 },
        { if: renting, then: [{ money: -120 }] },
        { if: owning, then: [owe('ev_home_plumber', 'Plumber & drywall', 8, 45)] },
        { if: atParents, then: [{ money: -60 }, { npc: 'dad', affinity: -2 }] },
      ],
    },
    rescued: {
      speaker: 'narrator',
      text: [
        'The rig survives in your arms like a rescued child. Everything else does not.',
        { if: atParents, text: 'Mom\'s good rug, the one from her mother, is soaked through. She rolls it up without a word and hangs it over the balcony, where it drips for a week, reproachfully.' },
        { if: renting, text: 'The floor buckles. The landlord takes the repair out of your deposit, itemized, in red ink.' },
        { if: owning, text: 'The subfloor is ruined. The contractor\'s quote comes with a payment plan and the word "unfortunately" four times.' },
      ],
      effects: [
        { stat: 'stress', add: 5 },
        { if: atParents, then: [{ npc: 'mom', affinity: -3 }] },
        { if: renting, then: [{ money: -200 }] },
        { if: owning, then: [owe('ev_home_plumber', 'Plumber & drywall', 8, 30)] },
      ],
    },
    dad_fix: {
      speaker: 'dad',
      text: [
        'Dad goes past you in pajamas and work boots with a wrench already in his hand. Ninety seconds later the water stops and he is saying a word his father taught him, which he only uses on pipes.',
        '"Old copper," he says, satisfied, soaked to the knees. "Sounds like applause right before it goes. My dad told me that." He looks happier than he has in weeks. The rig took a splash; you\'ll find out how bad tomorrow.',
      ],
      effects: [{ chance: 0.5, then: [buff(SOGGY_RIG)] }],
    },
    landlord_win: {
      speaker: 'narrator',
      text: 'On the sixth call the super\'s brother answers, and it turns out he is a plumber, and he is awake, and he lives four blocks away. He fixes it in an hour, tells you the landlord will pay, and — miracle of miracles — the landlord pays.',
      effects: [{ xp: 'social', add: 10 }],
    },
    landlord_lose: {
      speaker: 'narrator',
      text: 'Nobody answers until Monday. You spend the weekend with a bucket, a mop and the tower in the bathtub, and you sleep at a motel on the highway for two nights because the ceiling is making new sounds. The landlord eventually sends a man, and a bill "for your portion."',
      effects: [buff(SOGGY_RIG), { money: -80 }, { stat: 'stress', add: 10 }],
    },
  },
}

const burstPipe: EventDef = {
  id: 'ev_home_burst_pipe',
  category: 'life',
  repeatable: true,
  cooldownDays: 300,
  when: { all: [free, { not: { housing: 'dorm_room' } }] },
  scene: 'ev_home_burst_pipe_scene',
}

// ── ev_home_food_poisoning ────────────────────────────────────────────────────
// You ate something. It is eating you back.
const foodScene: SceneDef = {
  id: 'ev_home_food_poisoning_scene',
  channel: 'dialog',
  title: 'Something You Ate',
  start: 'sick',
  nodes: {
    sick: {
      speaker: 'narrator',
      effects: [
        { var: 'ev_home.food_count', add: 1 },
        {
          random: [
            { weight: 1, effects: [{ var: 'ev_home.food_culprit', set: 1 }] },
            { weight: 1, effects: [{ var: 'ev_home.food_culprit', set: 2 }] },
            { weight: 1, effects: [{ var: 'ev_home.food_culprit', set: 3 }] },
          ],
        },
      ],
      text: [
        { if: { var: 'ev_home.food_culprit', eq: 1 }, text: 'The gas station on Sodium Row sells sushi. You knew this. You bought it anyway, at 2 a.m., because it was glowing under the heat lamp next to the hot dogs, which in hindsight should have been a clue.' },
        { if: { var: 'ev_home.food_culprit', eq: 2 }, text: 'There was a takeout box in the back of your fridge. You were fairly sure it was from this week. You were fairly sure it was from this year.' },
        { if: { var: 'ev_home.food_culprit', eq: 3 }, text: 'The office potluck had a dish labeled only "SURPRISE." It was.' },
        'Four hours later you are lying on the bathroom floor with your cheek against the cool tile, negotiating with a god you do not believe in.',
        { if: { var: 'ev_home.food_count', gte: 2 }, text: 'You have been here before. The tile remembers you.' },
        { if: { lifestyle: 'instant_ramen' }, text: 'Your body, running on instant noodles for weeks, had no reserves to fight back with. It is not so much sick as betrayed.' },
      ],
      choices: [
        {
          tag: '[Fitness]',
          text: 'Ride it out at home: water, crackers, and whatever dignity survives.',
          check: {
            skill: 'fitness',
            dc: 12,
            bonuses: [
              { if: { trait: 'iron_stomach' }, add: 3, label: '+3 (iron stomach)' },
              { if: { trait: 'gym_rat' }, add: 1, label: '+1 (gym rat)' },
              { if: { trait: 'glass_cannon' }, add: -2, label: '-2 (glass cannon)' },
            ],
            success: 'rode_out',
            fail: 'worse',
          },
        },
        {
          text: 'Crawl to the urgent care on the Hill ($90).',
          req: { stat: 'money', gte: 90 },
          reqText: 'Requires $90',
          effects: [{ money: -90 }, { stat: 'health', add: -5 }],
          goto: 'clinic',
        },
        {
          if: withGrace,
          text: 'Page Grace. She is a nurse. She will know. She will also judge.',
          effects: [{ npc: 'grace', affinity: 3 }, { stat: 'health', add: 5 }],
          goto: 'grace',
        },
        {
          if: { all: [momHere, notAtParents] },
          text: 'Call Mom.',
          effects: [{ npc: 'mom', affinity: 4 }, buff(WELL_FED)],
          goto: 'mom',
        },
      ],
    },
    rode_out: {
      speaker: 'narrator',
      text: 'It is a long night. It is a longer morning. By Sunday evening you can eat a piece of dry toast, and it is the best meal of your life. You have a new respect for crackers and a permanent grudge against the source.',
      effects: [{ stat: 'health', add: -5 }, { stat: 'energy', add: -10 }],
    },
    worse: {
      speaker: 'narrator',
      text: [
        'Riding it out does not work. By the second day you can\'t keep water down, the room tilts when you stand, and you have missed everything you promised anyone. When you finally stand up for real, you have lost four pounds and a week.',
        { if: momHere, text: 'Mom hears about it from Kim. She arrives with a pot of rice porridge and a ginger remedy and a face that says she will be mentioning this at Tết for years.' },
      ],
      effects: [
        buff(FOOD_POISONED),
        { stat: 'health', add: -20 },
        { stat: 'stress', add: 8 },
        { if: momHere, then: [{ npc: 'mom', affinity: 2 }] },
        { chance: 0.3, then: [{ complication: 'health' }] },
      ],
    },
    clinic: {
      speaker: 'narrator',
      text: 'The urgent care doctor looks at you, asks one question ("gas station?"), and nods like a man who has seen this a thousand times. Fluids, a prescription, and a pamphlet called *Food Safety and You* that you read in the waiting room out of sheer shame.',
    },
    grace: {
      speaker: 'grace',
      text: 'She asks three questions in her calm ER voice, shows up forty minutes later with electrolyte drinks and saltines, takes your pulse without asking, and then sits on the edge of the tub and says, "Gas station sushi. You. A grown adult." She stays until you fall asleep. You will never, ever live this down.',
    },
    mom: {
      speaker: 'mom',
      text: 'She answers on the first ring, because she always does. "What did you eat. No. Don\'t tell me. I\'m coming." Forty minutes later she is in your kitchen with a pot of rice porridge and ginger and a full week of labeled containers, and she is cleaning your fridge with the grim focus of a woman defusing a bomb.',
    },
  },
}

const foodPoisoning: EventDef = {
  id: 'ev_home_food_poisoning',
  category: 'health',
  repeatable: true,
  cooldownDays: 200,
  when: { all: [free, { day: true, gte: 45 }] },
  scene: 'ev_home_food_poisoning_scene',
}

// ── ev_home_tet ───────────────────────────────────────────────────────────────
// Lunar New Year at the Tans'. The aunties are here. The aunties have questions.
const tetScene: SceneDef = {
  id: 'ev_home_tet_scene',
  channel: 'dialog',
  title: 'Tết',
  start: 'arrive',
  nodes: {
    arrive: {
      speaker: 'narrator',
      effects: [{ var: 'ev_home.tet_count', add: 1 }],
      text: [
        { if: momHere, text: 'The flat has smelled of braised pork and pickled onions for three days. Mom has been cooking since Tuesday and has slept, as far as anyone can tell, not at all. There are red envelopes on the altar next to the photo of her parents, and incense, and a bowl of oranges nobody is allowed to eat yet.' },
        { if: momGone, text: 'Dad tried to make the dishes from Mom\'s recipe cards. The rice cakes fell apart in the pot. He laughed about it for a while, in the kitchen, alone, and then he stopped laughing, and then he set the table anyway. The oranges are on the altar next to her photo now.' },
        { if: dadHere, text: 'Dad is wearing his one good sweater, the maroon one, which means this is the most formal event of the year.' },
        { if: { all: [kimHere, { day: true, lte: 1460 }] }, text: 'Kim is hiding in her room with headphones on, emerging only to collect envelopes.' },
        { if: { all: [kimHere, { day: true, gte: 1461 }] }, text: 'Kim is home for the holiday and has already been asked about marriage twice. She meets your eyes across the room with the look of a fellow prisoner.' },
        { if: { all: [uncleHere, { npc: 'uncle', fate: 'ruined' }] }, text: 'Uncle Danh comes without the gold watch this year. He is quieter. Mom fills his plate twice without asking.' },
        { if: { all: [uncleHere, { npc: 'uncle', fateNot: 'ruined' }] }, text: 'Uncle Danh arrives with a gold watch, a firm handshake and a new opportunity (this year: vitamin-infused bottled water). The family has learned to intercept him at the door.' },
        'And then the aunties find you. Three of them, on the couch, in a row, like a tribunal. "So," says the eldest. "What is your job? Are you married? Why so thin?"',
        { if: { all: [{ var: 'ev_home.tet_count', gte: 2 }, { flag: 'ev_home.aunties_gossip' }] }, text: 'They have heard things since last year. They have discussed them. They have conclusions.' },
        { if: { all: [{ var: 'ev_home.tet_count', gte: 2 }, { not: { flag: 'ev_home.aunties_gossip' } }] }, text: 'They remember last year. So do you.' },
      ],
      choices: [
        {
          tag: '[Social]',
          text: 'Survive the tribunal with charm, respect, and exactly the right amount of detail.',
          check: {
            skill: 'social',
            dc: 13,
            bonuses: [
              { if: { trait: 'silver_tongue' }, add: 2, label: '+2 (silver tongue)' },
              { if: { background: 'class_clown' }, add: 2, label: '+2 (you have been doing this since you were six)' },
              { if: respectableJob, add: 2, label: '+2 (a job title they can repeat at temple)' },
              { if: withPartner, add: 2, label: '+2 (you brought someone)' },
              { if: { stat: 'heat', gte: 50 }, add: -2, label: '-2 (the Row has been talking about you)' },
            ],
            success: 'aunties_win',
            fail: 'aunties_lose',
          },
        },
        {
          if: actLte(1),
          text: 'Accept your red envelope with both hands and bow like you mean it.',
          effects: [{ money: 40 }, { stat: 'mood', add: 4 }],
          goto: 'envelope_take',
        },
        {
          if: actGte(2),
          text: 'Hand out red envelopes to the little cousins, crisp new bills inside ($60).',
          req: { stat: 'money', gte: 60 },
          reqText: 'Requires $60',
          effects: [
            { money: -60 },
            { faction: 'fac.hood', add: 2 },
            { stat: 'mood', add: 5 },
            { if: momHere, then: [{ npc: 'mom', affinity: 3 }], else: [{ npc: 'dad', affinity: 3 }] },
          ],
          goto: 'envelope_give',
        },
        {
          text: 'Escape to the kitchen and make yourself useful.',
          effects: [
            { stat: 'energy', add: -10 },
            buff(WELL_FED),
            { if: momHere, then: [{ npc: 'mom', affinity: 5 }], else: [{ npc: 'dad', affinity: 6 }] },
          ],
          goto: 'kitchen',
        },
      ],
    },
    aunties_win: {
      speaker: 'narrator',
      text: [
        'You answer every question with a story, compliment every dish by name, and get the eldest aunt laughing so hard at your impression of your boss that she has to put her tea down.',
        '"Good child," she announces to the room, which is the highest honor available in this family. Somewhere behind you, you hear your mother exhale for the first time since Tuesday.',
      ],
      effects: [
        buff(HOME_WARM),
        { faction: 'fac.hood', add: 2 },
        { if: momHere, then: [{ npc: 'mom', affinity: 4 }], else: [{ npc: 'dad', affinity: 4 }] },
        { clearFlag: 'ev_home.aunties_gossip' },
      ],
    },
    aunties_lose: {
      speaker: 'narrator',
      text: [
        'You say "I do computer stuff" and watch it land like a dropped plate. They ask what kind. You say "freelance." They exchange a look that has been passed down through six generations of aunties. By the time the rice cakes come out, it is established that you are unemployed, possibly in trouble, and too thin.',
        { if: { flag: 'ev_home.aunties_gossip' }, text: 'This is the second year. The story has hardened now, the way family stories do. You are going to be "the one who does something with computers, you know" at every wedding for the rest of your life.' },
      ],
      effects: [
        { stat: 'stress', add: 8 },
        { stat: 'mood', add: -4 },
        { faction: 'fac.hood', add: -2 },
        { if: momHere, then: [{ npc: 'mom', affinity: -2 }] },
        { if: { flag: 'ev_home.aunties_gossip' }, then: [{ trait: 'ev_home_family_story' }] },
        { flag: 'ev_home.aunties_gossip' },
      ],
    },
    envelope_take: {
      speaker: 'narrator',
      text: 'Forty dollars across four envelopes, crisp enough to cut yourself on, and one from Uncle Danh that contains a coupon for vitamin-infused bottled water. You bow to every aunt. The eldest pinches your cheek and says you will be rich someday. She says it like a warning.',
    },
    envelope_give: {
      speaker: 'narrator',
      text: 'The little cousins line up like a bank queue and bow with suspicious precision. The smallest one opens hers on the spot, counts it twice, and hugs your leg. The aunties watch this and revise their opinion of you upward by almost a full point.',
    },
    kitchen: {
      speaker: 'narrator',
      text: [
        { if: momHere, text: 'Mom puts you on spring rolls without a word, which is how you know you are forgiven for everything this year. You roll them wrong. She fixes each one behind you, silently, and hums.' },
        { if: momGone, text: 'You and Dad make the rice cakes from her card, together, arguing about what "enough" means. The third batch holds. He puts the first one on the altar, in front of her photo, and stands there a while. You stand with him.' },
        'You go home with a week of leftovers packed in old margarine tubs, labeled in handwriting you would know anywhere.',
      ],
    },
  },
}

const tet: EventDef = {
  id: 'ev_home_tet',
  category: 'family',
  weight: 6,
  repeatable: true,
  cooldownDays: 300,
  when: { all: [tetWindow, familyHome, free] },
  scene: 'ev_home_tet_scene',
}

// ── ev_home_ice_storm ─────────────────────────────────────────────────────────
// The Sound freezes the lines. The Row goes dark for a week.
const stormScene: SceneDef = {
  id: 'ev_home_ice_storm_scene',
  channel: 'dialog',
  title: 'Ice Storm',
  start: 'dark',
  nodes: {
    dark: {
      speaker: 'narrator',
      effects: [{ var: 'ev_home.storm_count', add: 1 }],
      text: [
        'Freezing rain off the Sound all night, and at dawn every wire on the Row is wearing a glass sleeve. At 7:14 the transformer on the corner goes with a blue flash and a sound like a dropped piano. The power is out, the phone lines are down, and the radio says "several days."',
        { if: atParents, text: 'Mom is already filling pots with water. Dad is already in the storage cage looking for the lantern he bought in 1987, just in case, and has been waiting fourteen years to be right about.' },
        { if: { not: atParents }, text: 'Your place is going cold fast. So is everyone else\'s.' },
        { if: around('grandma_ruth'), text: 'Three doors down from your parents, Grandma Ruth lives alone, and her radiator is electric.' },
        { if: { var: 'ev_home.storm_count', gte: 2 }, text: 'Another one. The Row knows the drill now. So do you.' },
      ],
      choices: [
        {
          if: around('grandma_ruth'),
          tag: '[Fitness]',
          text: 'Go door to door on the Row: check on Ruth, haul water up the stairs, carry blankets and firewood.',
          check: {
            skill: 'fitness',
            dc: 13,
            bonuses: [
              { if: { trait: 'gym_rat' }, add: 2, label: '+2 (gym rat)' },
              { if: { faction: 'fac.hood', gte: 30 }, add: 1, label: '+1 (the Row opens its doors for you)' },
            ],
            success: 'helper',
            fail: 'slipped',
          },
        },
        {
          tag: '[Hardware]',
          text: 'Get the building\'s old backup generator running — enough for the hallway lights and the fridges.',
          check: {
            skill: 'hardware',
            dc: 14,
            bonuses: [
              { if: { background: 'tinkerer' }, add: 2, label: '+2 (basement tinkerer)' },
              { if: { trait: 'ev_home_storm_tested' }, add: 1, label: '+1 (storm-tested)' },
            ],
            success: 'generator',
            fail: 'burned',
          },
        },
        {
          if: { all: [cathodeOpen, around('sal')] },
          text: 'Hole up at the Cathode. Sal cooks on gas and never closes.',
          effects: [{ money: -15 }, { npc: 'sal', affinity: 3 }, { stat: 'mood', add: 4 }],
          goto: 'cathode',
        },
        {
          text: 'Put on every sweater you own and wait it out under the blankets.',
          effects: [buff(COLD_WEEK), { stat: 'energy', add: -15 }],
          goto: 'wait',
        },
      ],
    },
    helper: {
      speaker: 'grandma_ruth',
      text: [
        'Ruth answers the door in two coats and a church hat. "Mijo! I was going to call, but there are no calls." You carry up four buckets of water, two armloads of wood for the stove in the church hall, and a space heater from your parents\' flat that you run off a neighbor\'s generator cord.',
        'By the third day you have done the same for nine doors on the Row. People you have never spoken to wave at you from windows. Ruth tells everyone at church that you are "a saint, a thin saint."',
        { if: { flag: 'ev_home.storm_helped' }, text: 'Twice now, you have been the one who showed up. Something about that has settled into your bones.' },
      ],
      effects: [
        { npc: 'grandma_ruth', affinity: 6 },
        { faction: 'fac.hood', add: 4 },
        { stat: 'energy', add: -20 },
        { if: { flag: 'ev_home.storm_helped' }, then: [{ trait: 'ev_home_storm_tested' }] },
        { flag: 'ev_home.storm_helped' },
      ],
    },
    slipped: {
      speaker: 'narrator',
      text: [
        'On the fourth trip, on Ruth\'s front steps, with a bucket in each hand, the world goes sideways. You land on your back on a sheet of ice with a sound the whole street hears. The water goes everywhere. So do you.',
        'Ruth insists on feeding you soup while you lie on her couch unable to turn your head. It is very good soup. You will be walking like an old man for a month.',
      ],
      effects: [
        { stat: 'health', add: -15 },
        buff(THROWN_BACK),
        { npc: 'grandma_ruth', affinity: 2 },
        { faction: 'fac.hood', add: 1 },
        { chance: 0.3, then: [{ complication: 'health' }] },
      ],
    },
    generator: {
      speaker: 'narrator',
      text: 'The generator in the basement is older than the building\'s last paint job, but with patience, a flashlight and a lot of swearing it coughs, catches and roars. The hallway lights come on. Twelve fridges hum back to life. By evening there is a potluck on the second-floor landing and somebody\'s grandfather is playing accordion. The building remembers.',
      effects: [{ faction: 'fac.hood', add: 3 }, { stat: 'mood', add: 5 }, { stat: 'stress', add: -5 }, { xp: 'hardware', add: 20 }],
    },
    burned: {
      speaker: 'narrator',
      text: 'The generator coughs, catches, runs for a glorious thirty seconds — and dies with a bang and a smell that makes the whole basement step back. You burned your hand on the housing somewhere in there. The part it needs costs eighty dollars and won\'t be in until the ice melts, which is also when the power comes back.',
      effects: [buff(BANDAGED_HAND), buff(COLD_WEEK), { money: -80 }, { stat: 'health', add: -8 }],
    },
    cathode: {
      speaker: 'sal',
      text: '"Power\'s out? Kid, my grill runs on gas and spite." The Cathode becomes the Row\'s living room for five days: candles in coffee cups, a transistor radio on the counter, and Sal feeding anyone who walks in whether they can pay or not. You wash dishes on the second night without being asked. He pretends not to notice. He notices.',
    },
    wait: {
      speaker: 'narrator',
      text: 'Five days of fingerless gloves, cold cereal, and working out algorithms on paper by candlelight like a monk. It is romantic for about an hour. By the fourth day you have read every book you own and started on the phone book.',
    },
  },
}

const iceStorm: EventDef = {
  id: 'ev_home_ice_storm',
  category: 'life',
  weight: 2,
  repeatable: true,
  cooldownDays: 300,
  when: { all: [winter, free] },
  scene: 'ev_home_ice_storm_scene',
}

// ── ev_home_sunday_dinner ─────────────────────────────────────────────────────
// Mom (or Dad) calls. Sunday dinner. Are you coming? It is not really a question.
const dinnerScene: SceneDef = {
  id: 'ev_home_sunday_dinner_scene',
  channel: 'dialog',
  title: 'Sunday Dinner',
  start: 'call',
  nodes: {
    call: {
      speaker: 'narrator',
      text: [
        { if: momHere, text: 'Mom calls on Thursday. "Sunday. Six o\'clock. I\'m making the fish." It is not a question. It has never been a question.' },
        { if: momGone, text: 'Dad calls on Thursday, which he never does. "I\'m making your mother\'s fish on Sunday. I think I\'m making it. Come see if I\'m making it."' },
        { if: { var: 'ev_home.dinners_skipped', gte: 2 }, text: 'There is a pause before the goodbye. "You haven\'t been in a while," the pause says. It says it very clearly.' },
      ],
      choices: [
        { text: 'Go. Bring dessert from the Cathode.', effects: [{ money: -12 }, { stat: 'energy', add: -8 }], goto: 'table' },
        {
          if: withPartner,
          text: 'Go, and bring your partner.',
          effects: [
            { money: -12 },
            { stat: 'energy', add: -8 },
            { if: partnerIs('mira'), then: [{ npc: 'mira', affinity: 3 }], else: [{ npc: 'grace', affinity: 3 }] },
          ],
          goto: 'table_partner',
        },
        {
          text: '"I can\'t this week. Work." Make it sound true.',
          effects: [
            { var: 'ev_home.dinners_skipped', add: 1 },
            { if: momHere, then: [{ npc: 'mom', affinity: -3 }] },
            { if: dadHere, then: [{ npc: 'dad', affinity: -3 }] },
          ],
          goto: 'skipped',
        },
      ],
    },
    table_partner: {
      speaker: 'narrator',
      text: [
        { if: partnerIs('mira'), text: 'Mira brings a bottle of wine and a spreadsheet-level knowledge of your family\'s allergies, which she compiled from things you said in passing.' },
        { if: { all: [partnerIs('mira'), momHere] }, text: 'Mom is visibly shaken by her competence and adores her.' },
        { if: { all: [partnerIs('mira'), momGone] }, text: 'Dad watches her fold the napkins into perfect thirds and says, quietly, "Your mother would have liked her." It is the highest thing he knows how to say.' },
        { if: partnerIs('grace'), text: 'Grace brings a pie and asks Dad about his knees within ten minutes, and he tells her things he has never told his own doctor.' },
        { if: { all: [partnerIs('grace'), momHere] }, text: 'Mom decides on the spot that she is family.' },
      ],
      effects: [{ if: momHere, then: [{ npc: 'mom', affinity: 3 }], else: [{ npc: 'dad', affinity: 3 }] }],
      next: 'table',
    },
    table: {
      speaker: 'narrator',
      effects: [{ var: 'ev_home.dinners_skipped', set: 0 }],
      text: [
        { if: { all: [momGone, kimHere] }, text: 'There are four chairs at the table and three plates. Nobody moves the fourth chair. Nobody would dream of it.' },
        { if: { all: [momGone, { not: kimHere }] }, text: 'There are four chairs at the table and two plates. Dad sets the salt in front of Mom\'s chair out of habit, then leaves it there.' },
        { if: { all: [kimHere, { not: darkTurn }] }, text: 'Halfway through the fish, Kim announces that she is dropping the advanced math class. Dad puts his fork down very slowly.' },
        { if: { all: [kimHere, darkTurn, actLte(2)] }, text: 'Halfway through the fish, Kim says she wants to spend the summer at a "tech thing" in Millgate that she will not describe in detail. Dad looks at her, then at you, then back at her.' },
        { if: { all: [kimHere, actGte(3)] }, text: 'Halfway through the fish, Kim and Dad start the argument they always start now — about her future, his, the city — and it gets louder than it used to.' },
        { if: { flag: 'npc.dad.mill_job' }, text: 'Somewhere in there Dad mentions his shift at the datacenter, the old mill floor, and the table goes quiet in a way that has your name in it.' },
        { if: { not: kimHere }, text: 'Halfway through the fish, Dad asks what exactly you do all night, and whether it pays, and whether it is legal, and whether he should be worried. It is the most words he has said in a row all year.' },
        'Everyone is looking at you. You are, it turns out, the tiebreaker.',
      ],
      choices: [
        {
          tag: '[Social]',
          text: 'Keep the peace. Find the thing everyone at this table actually wants and say it out loud.',
          check: {
            skill: 'social',
            dc: 14,
            bonuses: [
              { if: { trait: 'empath' }, add: 2, label: '+2 (empath)' },
              { if: { trait: 'hothead' }, add: -2, label: '-2 (hothead)' },
              { if: { flag: 'ev_home.radio_fixed' }, add: 1, label: '+1 (Dad remembers the radio)' },
            ],
            success: 'peace',
            fail: 'blowup',
          },
        },
        {
          if: kimHere,
          text: 'Take Kim\'s side. Somebody has to.',
          effects: [{ npc: 'kim', affinity: 5 }, { npc: 'dad', affinity: -5 }],
          goto: 'sided',
        },
        {
          text: 'Stay out of it. Eat the fish. Compliment the fish.',
          effects: [{ stat: 'mood', add: -2 }],
          goto: 'fish',
        },
      ],
    },
    peace: {
      speaker: 'narrator',
      text: [
        'You say the true thing — that everyone at this table is scared of the same thing, which is losing each other to a city that eats people — and you say it with a joke on the end so nobody has to cry. It lands. Dad picks his fork back up. Kim kicks you under the table, gently, which means thank you.',
        'You stay until eleven. You leave with leftovers and a feeling that lasts all week.',
      ],
      effects: [
        buff(HOME_WARM),
        { if: momHere, then: [{ npc: 'mom', affinity: 3 }] },
        { if: dadHere, then: [{ npc: 'dad', affinity: 3 }] },
        { if: kimHere, then: [{ npc: 'kim', affinity: 3 }] },
        { faction: 'fac.hood', add: 1 },
      ],
    },
    blowup: {
      speaker: 'narrator',
      text: [
        'You say the wrong true thing. It comes out sharp. Somebody says "at least I\'m here," and somebody else says "you\'re never here," and it isn\'t clear who is talking to whom anymore. A chair scrapes. A door slams. The fish goes cold on the table.',
        'You drive home in silence. It\'s days before anyone calls anyone.',
      ],
      effects: [
        buff(FAMILY_STRAIN),
        { if: kimHere, then: [{ npc: 'kim', affinity: -4 }] },
        { if: dadHere, then: [{ npc: 'dad', affinity: -4 }] },
        { stat: 'stress', add: 8 },
      ],
    },
    sided: {
      speaker: 'narrator',
      text: 'Kim looks at you like you just walked through a wall for her. Dad looks at you like you just walked through a wall of his. The rest of the dinner is polite, careful, and very quiet. On the doorstep, Kim hugs you — hard, fast, and without comment.',
    },
    fish: {
      speaker: 'narrator',
      text: 'You compliment the fish three times. The argument burns itself out without you, the way arguments do in families, leaving a little scorch mark on the evening. On the way out Mom presses leftovers into your hands and says, "You were quiet." It isn\'t a compliment.',
    },
    skipped: {
      speaker: 'narrator',
      text: [
        '"Okay," comes the answer. "Next week." There is a practiced lightness to it, like something said often enough to stop hurting.',
        'On Sunday at six you are at your desk. At 6:40 you think about the fish. At 7:15 a container of it is left outside your door by someone who didn\'t knock.',
      ],
    },
  },
}

const sundayDinner: EventDef = {
  id: 'ev_home_sunday_dinner',
  category: 'family',
  weight: 2,
  repeatable: true,
  cooldownDays: 100,
  when: { all: [actGte(2), notAtParents, familyHome, free] },
  scene: 'ev_home_sunday_dinner_scene',
}

// ── ev_home_eviction ──────────────────────────────────────────────────────────
// Broke, renting, and the landlord has noticed. A notice under the door.
const evictedEffects: Effect[] = [
  {
    if: familyHome,
    then: [{ housing: 'parents_flat' }, { flag: 'ev_home.moved_back_home' }],
    else: [{ housing: 'shared_room' }],
  },
  owe('ev_home_back_rent', 'Back rent (court judgment)', 8, 40),
  { stat: 'stress', add: 15 },
  { stat: 'mood', add: -10 },
]

const evictionScene: SceneDef = {
  id: 'ev_home_eviction_scene',
  channel: 'mail',
  title: 'NOTICE TO PAY RENT OR QUIT',
  from: 'Property Management',
  pause: true,
  start: 'notice',
  expiresDays: 14,
  onExpire: [...evictedEffects, { notify: 'You never answered the landlord. The locks were changed on a Tuesday.', kind: 'bad' }],
  nodes: {
    notice: {
      speaker: 'Property Management',
      effects: [{ var: 'ev_home.eviction_count', add: 1 }],
      text: [
        'NOTICE TO PAY RENT OR QUIT',
        'Tenant: {name}. Our records indicate that rent for the current period remains unpaid. You are hereby notified that unless the balance of $150.00 is paid in full within FOURTEEN (14) DAYS, proceedings will commence to recover possession of the premises.',
        { if: { var: 'ev_home.eviction_count', gte: 2 }, text: 'Please note this is not the first notice issued for this tenancy. Management\'s patience is not a renewable resource.' },
        'This notice has also been taped to your door, where your neighbors can read it.',
        '— Lumen Sound Property Management, "Your Home Is Our Business"',
      ],
      choices: [
        {
          text: 'Pay the balance in full.',
          req: { stat: 'money', gte: 150 },
          reqText: 'Requires $150',
          effects: [{ money: -150 }],
          goto: 'paid',
        },
        {
          tag: '[Social]',
          text: 'Go down to the office in person: a date, a plan, and your most honest face.',
          check: {
            skill: 'social',
            dc: 14,
            bonuses: [
              { if: { trait: 'silver_tongue' }, add: 2, label: '+2 (silver tongue)' },
              { if: { trait: 'hothead' }, add: -2, label: '-2 (hothead)' },
              { if: { var: 'ev_home.eviction_count', gte: 2 }, add: -2, label: '-2 (they have heard it before)' },
            ],
            success: 'extension',
            fail: 'evicted',
          },
        },
        {
          tag: '[Business]',
          text: 'Offer a trade: you\'ll build their rental listings site and fix the office computers in exchange for the month.',
          check: {
            skill: 'business',
            dc: 15,
            bonuses: [{ if: { skill: 'programming', gte: 30 }, add: 2, label: '+2 (you can actually deliver)' }],
            success: 'trade',
            fail: 'trade_fail',
          },
        },
        {
          if: { all: [around('jax'), { npc: 'jax', affinityGte: 40 }] },
          text: 'Page Jax. He\'ll spot you. He always spots you.',
          effects: [{ npc: 'jax', affinity: -2 }, { flag: 'ev_home.jax_rent_loan' }],
          goto: 'jax',
        },
      ],
    },
    paid: {
      speaker: 'Property Management',
      text: 'Payment received. Thank you for your prompt attention to this matter. Please note that future late payments may incur a fee of $35.00 and a notice taped to your door. We look forward to continuing our relationship.',
    },
    extension: {
      speaker: 'narrator',
      text: 'The property manager is a tired woman named Rhonda with a photo of three grandkids on her desk. You don\'t lie. You tell her exactly how broke you are and exactly when the next money lands. She looks at you for a long moment, then writes up a payment plan in pencil. "Don\'t make me regret this," she says. It\'s a debt, but it\'s a roof.',
      effects: [owe('ev_home_back_rent', 'Back rent (payment plan)', 6, 30)],
    },
    evicted: {
      speaker: 'narrator',
      text: [
        'It goes badly. You get defensive, she gets formal, and at some point she starts writing things down. Nine days later a man with a clipboard and a locksmith is standing in your doorway while you carry the rig down the stairs in your arms.',
        { if: familyHome, text: 'You move back into your old room at your parents\' flat. Mom makes up the bed without asking a single question, which is worse than a hundred questions.', else: 'You end up in a shared room in Millgate, three roommates and a bathroom that has seen things, with a court judgment for the back rent following you like a smell.' },
      ],
      effects: [...evictedEffects],
    },
    trade: {
      speaker: 'narrator',
      text: 'Rhonda\'s office computers are running something from 1996 and a screensaver of flying toasters. You fix all four in an afternoon and build them a listings page with photos that make the units look almost livable. She tears up your notice in front of you. "You should do this for a living," she says. You don\'t tell her you sort of do.',
      effects: [{ xp: 'business', add: 20 }, { xp: 'programming', add: 15 }],
    },
    trade_fail: {
      speaker: 'narrator',
      text: 'You promise too much, too fast. The listings site goes up with the wrong phone number and a photo of the dumpster as the "featured amenity." Three prospective tenants call to complain. Rhonda stops returning your calls, and the next thing under your door is a court date.',
      next: 'evicted',
    },
    jax: {
      speaker: 'jax',
      text: [
        'dude. yes. obviously. its done, i\'m sending it now',
        { if: { npc: 'rosa', fate: 'worsens' }, text: 'dont worry about it. seriously. rosa\'s stuff is... whatever. its fine. pay me back when u can', else: 'pay me back whenever. or in pizza. pizza is also legal tender' },
        'hey. u ok tho? like actually',
      ],
      effects: [{ stat: 'stress', add: 4 }],
    },
  },
}

const eviction: EventDef = {
  id: 'ev_home_eviction',
  category: 'money',
  weight: 3,
  repeatable: true,
  cooldownDays: 240,
  when: { all: [renting, { stat: 'money', lte: 120 }, { not: livingTogether }, free, { not: { obligation: 'ev_home_back_rent' } }] },
  scene: 'ev_home_eviction_scene',
}

export default defineContent({
  events: [catChaos, roommateParty, burstPipe, foodPoisoning, tet, iceStorm, sundayDinner, eviction],
  scenes: [catChaosScene, partyScene, pipeScene, foodScene, tetScene, stormScene, dinnerScene, evictionScene],
})
