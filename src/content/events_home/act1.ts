/**
 * events_home — ACT I & early II (days ~0–1100). Kitchen-table comedy: the phone bill, a stray cat
 * on the CRT, Mom discovering BuddyPager, Dad's father's radio, and a molar with opinions.
 * Small stakes, real consequences: curfews, a suspended line, a cat that ends up at Ruth's.
 */
import { defineContent } from '@/engine/registry'
import type { EventDef, SceneDef } from '@/engine/types'
import {
  HOUSE_RULES,
  LINE_CUT,
  MOMS_FORWARDS,
  WELL_FED,
  actLte,
  around,
  atParents,
  buff,
  dadHere,
  darkTurn,
  free,
  kimHere,
  momHere,
  onDialup,
  owe,
  withRoommates,
  between,
} from './_shared'

// ── ev_home_phone_bill ────────────────────────────────────────────────────────
// Three hundred dollars of long-distance to a BBS in Ridgeport, and Dad has the bill.
const phoneBillScene: SceneDef = {
  id: 'ev_home_phone_bill_scene',
  channel: 'dialog',
  title: 'The Phone Bill',
  start: 'table',
  nodes: {
    table: {
      speaker: 'narrator',
      text: [
        'Dad is at the kitchen table with his reading glasses on and the phone bill flattened under both palms, like it might try to escape. Mom is standing behind him with her arms folded. Nobody has offered you rice. This is serious.',
        '"Three hundred and twelve dollars and forty cents," Dad says. "Long distance. Ridgeport. Every night this month, two in the morning, for three hours." He turns the page toward you. "Who do we know in Ridgeport, kiddo?"',
        { if: kimHere, text: 'From the hallway, Kim mouths the words *burned CD* and holds up two fingers. Her silence has a price, and the price just doubled.' },
        { if: { background: 'latchkey' }, text: 'Years of being home alone taught you to intercept the mail. This month, for once, Dad got to the box first.' },
      ],
      choices: [
        {
          text: 'Confess everything — the Ridgeport board, the files, the three a.m. — and pay it back out of your own money.',
          req: { stat: 'money', gte: 150 },
          reqText: 'Requires $150',
          effects: [{ money: -150 }, { npc: 'dad', affinity: 3 }, { npc: 'mom', affinity: 2 }],
          goto: 'confess',
        },
        {
          tag: '[Lie]',
          text: '"It\'s a billing glitch, Dad. It was on the news. Half the Row got charged for calls they never made."',
          check: {
            skill: 'social',
            dc: 12,
            bonuses: [
              { if: { trait: 'silver_tongue' }, add: 2, label: '+2 (silver tongue)' },
              { if: { background: 'class_clown' }, add: 2, label: '+2 (you have been talking your way out of things since kindergarten)' },
            ],
            success: 'lie_win',
            fail: 'lie_lose',
          },
        },
        {
          tag: '[Networking]',
          text: '"Let me call the phone company. There\'s an extended-area plan that makes Ridgeport a local call. I can get this knocked down."',
          check: {
            skill: 'networking',
            dc: 13,
            bonuses: [{ if: { background: 'arcade_rat' }, add: 1, label: '+1 (you know every area code on the Sound)' }],
            success: 'plan_win',
            fail: 'plan_lose',
          },
        },
        {
          text: '"I\'ll work it off. Paint Grandma Ruth\'s fence, clean the gutters — anything."',
          effects: [{ stat: 'energy', add: -20 }, { stat: 'mood', add: -2 }, { npc: 'dad', affinity: 4 }],
          goto: 'work_off',
        },
      ],
    },
    confess: {
      speaker: 'dad',
      text: [
        'He listens to the whole thing, including the part about the board, which he does not understand, and the part about the files, which he understands too well. Then he takes off his glasses and folds them.',
        '"You pay your debts. That\'s all I want." He slides the bill across the table like a diploma. Mom puts a bowl of rice in front of you, which means it\'s over.',
      ],
    },
    lie_win: {
      speaker: 'dad',
      text: '"Those crooks." He calls the phone company himself and argues for forty minutes about a glitch that does not exist, and somehow — through sheer mill-foreman stubbornness — gets a "courtesy credit" of half the bill. You pay the rest from your drawer. You feel terrible for about a day. The credit stays.',
      effects: [{ money: -80 }, { flag: 'ev_home.phone_lie' }],
    },
    lie_lose: {
      speaker: 'narrator',
      text: [
        'Dad nods slowly. Then he picks up the kitchen phone, reads the Ridgeport number off the bill, and dials it on speaker.',
        'The kitchen fills with the shriek of a modem answering. Mom flinches. Dad lets it scream for a long, long five seconds before he hangs up. "Billing glitch," he says. The line is now on a curfew: nothing after eleven, and he will know. He always knows.',
      ],
      effects: [{ money: -150 }, buff(HOUSE_RULES), { npc: 'dad', affinity: -6 }, { npc: 'mom', affinity: -3 }, { stat: 'stress', add: 6 }],
    },
    plan_win: {
      speaker: 'narrator',
      text: 'Forty minutes on hold, one supervisor, and a very specific tariff code later, Ridgeport becomes a local call retroactive to the first of the month. The bill drops to sixty dollars. Dad reads the new total twice, then looks at you the way he used to look at the paper line when it ran clean. "Huh," he says. That\'s the whole compliment. It\'s enough.',
      effects: [{ money: -60 }, { npc: 'dad', affinity: 4 }, { xp: 'networking', add: 20 }],
    },
    plan_lose: {
      speaker: 'narrator',
      text: [
        'You know exactly enough tariff jargon to sound like a problem. The rep goes quiet, then very polite, then says the account is being "flagged for a usage review," and the line will be suspended while they look at it.',
        'The dial tone is gone by dinner. You pay the full bill anyway. For two weeks you haunt the library\'s public terminals and Grandma Ruth\'s kitchen, where the modem is older than you are.',
      ],
      effects: [{ money: -150 }, buff(LINE_CUT), { npc: 'dad', affinity: -3 }, { stat: 'stress', add: 5 }],
    },
    work_off: {
      speaker: 'dad',
      text: '"Okay." He hands you a scraper and a can of primer before you have finished the sentence, which means he had them ready. Grandma Ruth\'s fence takes two Saturdays. She pays you in empanadas and tells the whole Row you are "a good boy, a little pale." Dad pays the bill and never mentions it again.',
      effects: [{ faction: 'fac.hood', add: 2 }, { npc: 'grandma_ruth', affinity: 3 }],
    },
  },
}

const phoneBill: EventDef = {
  id: 'ev_home_phone_bill',
  category: 'money',
  weight: 2,
  when: { all: [actLte(2), atParents, onDialup, dadHere, free, between(20, 700)] },
  scene: 'ev_home_phone_bill_scene',
}

// ── ev_home_stray_cat ─────────────────────────────────────────────────────────
// A grey stray finds the warmest thing in your life: the top of the monitor.
const strayCatScene: SceneDef = {
  id: 'ev_home_stray_cat_scene',
  channel: 'dialog',
  title: 'Visitor',
  start: 'window',
  nodes: {
    window: {
      speaker: 'narrator',
      text: [
        'Two in the morning, and something is tapping on the window. Not the wind. A paw.',
        { if: atParents, text: 'On the fire escape over the alley sits a grey cat with one torn ear, looking at your CRT the way you look at a T1 line.' },
        { if: { housing: 'shared_room' }, text: 'On the loft\'s iron window ledge sits a grey cat with one torn ear. Somebody downstairs has been feeding her noodles; she has clearly decided to upgrade.' },
        { if: { housing: 'dorm_room' }, text: 'On the ledge outside the dorm window — four floors up, somehow — sits a grey cat with one torn ear, looking deeply unimpressed with the observatory.' },
        { if: { not: { any: [atParents, withRoommates] } }, text: 'On the sill, lit pink by the neon, sits a grey cat with one torn ear. She is staring past you at the monitor, which is the warmest thing in the room and possibly the city.' },
        'She blinks once. Slowly. That is either a greeting or a threat.',
      ],
      choices: [
        { text: 'Open the window. Offer her the last of the ham.', effects: [{ stat: 'mood', add: 3 }], goto: 'inside' },
        { text: 'Feed her on the sill, but keep the window shut. You are not a cat person. Probably.', effects: [{ stat: 'mood', add: 2 }, { flag: 'ev_home.cat_fed' }], goto: 'sill' },
        { text: 'Take her to the Harbor Point shelter in the morning. Somebody there will know what to do.', effects: [{ stat: 'mood', add: -1 }], goto: 'shelter' },
      ],
    },
    inside: {
      speaker: 'narrator',
      text: [
        'She eats the ham with enormous dignity, walks across your keyboard (typing `hhhhhhhhhhh` into a very important chat), climbs onto the CRT, turns around three times, and falls asleep on the warm vents like she has paid rent since 1994.',
        'The problem is not the cat. The problem is everyone else.',
      ],
      choices: [
        {
          if: atParents,
          tag: '[Social]',
          text: 'At breakfast, make the case to Mom: she\'s quiet, she eats mice, she will guard the rice.',
          check: {
            skill: 'social',
            dc: 12,
            bonuses: [
              { if: { trait: 'empath' }, add: 2, label: '+2 (you know which buttons are soft)' },
              { if: { npc: 'mom', affinityGte: 60 }, add: 2, label: '+2 (Mom likes you a lot this month)' },
            ],
            success: 'keep',
            fail: 'refused',
          },
        },
        {
          if: withRoommates,
          tag: '[Social]',
          text: 'Convince the others that a cat is basically a very quiet roommate who pays in purring.',
          check: {
            skill: 'social',
            dc: 12,
            bonuses: [{ if: { background: 'class_clown' }, add: 2, label: '+2 (you can sell anything)' }],
            success: 'keep',
            fail: 'refused',
          },
        },
        { if: { not: { any: [atParents, withRoommates] } }, text: 'There is no one to ask. It\'s your door. She\'s staying.', goto: 'keep' },
      ],
    },
    keep: {
      speaker: 'narrator',
      text: [
        { if: atParents, text: 'Mom looks at the cat. The cat looks at Mom. Something passes between two creatures who have each run a household by force of will. "She stays out of my kitchen," Mom says, and by dinner the cat is asleep in the kitchen and Mom is pretending not to have given her fish.' },
        { if: withRoommates, text: 'The vote is three to one, the one being a guy who is "more of a lizard person." By Friday he is buying her toys.' },
        'She needs a name. She is watching you, waiting, and it had better be good.',
      ],
      choices: [
        { text: '"Baud." Short, fast, a little old-fashioned.', effects: [{ flag: 'ev_home.cat_name', set: 'Baud' }], goto: 'named' },
        { text: '"Parity." She keeps things even.', effects: [{ flag: 'ev_home.cat_name', set: 'Parity' }], goto: 'named' },
        { text: '"Checksum." Because she checks everything.', effects: [{ flag: 'ev_home.cat_name', set: 'Checksum' }], goto: 'named' },
        {
          if: { background: 'class_clown' },
          text: '"Duchess Whiskerton the Third, Esquire." Nobody will ever call her that. That\'s the point.',
          effects: [{ flag: 'ev_home.cat_name', set: 'the Duchess' }],
          goto: 'named',
        },
      ],
    },
    named: {
      speaker: 'narrator',
      text: '{flag:ev_home.cat_name} accepts the name the way a queen accepts a tax. From now on the CRT is hers, the keyboard is shared custody, and at four in the morning, when the work goes bad, there is a warm weight against your ankle that asks for nothing except that you stay.',
      effects: [{ item: 'ev_home_cat' }, { flag: 'ev_home.has_cat' }],
    },
    refused: {
      speaker: 'narrator',
      text: [
        { if: atParents, text: '"No." Mom doesn\'t even look up from the rice. "Cats are for people with their own apartment." Dad gives you a sympathetic shrug that says he tried, which he did not.' },
        { if: withRoommates, text: 'The vote is three to one against. One roommate is allergic, one is "philosophically opposed," and one just likes saying no.' },
        { if: around('grandma_ruth'), text: 'By noon, the grey cat has a new address: three doors down, on Grandma Ruth\'s windowsill, under a crocheted blanket, eating better than you. Ruth names her Doña Nube and sends you photos. You can visit. You cannot take her back.', else: 'You take her to the shelter on the Hill. The volunteer says a cat with that face will be adopted in a week. You walk home the long way.' },
      ],
      effects: [
        { stat: 'mood', add: -4 },
        { if: around('grandma_ruth'), then: [{ flag: 'ev_home.cat_at_ruth' }, { npc: 'grandma_ruth', affinity: 6 }, { faction: 'fac.hood', add: 1 }] },
      ],
    },
    sill: {
      speaker: 'narrator',
      text: 'She eats, washes one paw with enormous contempt for your boundaries, and leaves across the rooftops. For a week she comes back every night at two. Then she stops, and you realise you had been leaving the window cracked. You don\'t close it for a while.',
    },
    shelter: {
      speaker: 'narrator',
      text: 'The shelter volunteer scratches the torn ear and says, "Oh, she\'s a character." A family from Millgate takes her home three days later. You know this because you called to ask, which you will deny to anyone who asks.',
    },
  },
}

const strayCat: EventDef = {
  id: 'ev_home_stray_cat',
  category: 'life',
  weight: 2,
  when: { all: [free, between(30, 900), { not: { item: 'ev_home_cat' } }] },
  scene: 'ev_home_stray_cat_scene',
}

// ── ev_home_mom_online ────────────────────────────────────────────────────────
// Mom's coworker at the cannery office signed her up for BuddyPager. God help us all.
const momOnlineScene: SceneDef = {
  id: 'ev_home_mom_online_scene',
  channel: 'chat',
  title: 'HELLO THIS IS MOM',
  from: 'mom',
  start: 'hello',
  nodes: {
    hello: {
      speaker: 'mom',
      text: [
        'HELLO THIS IS MOM',
        'DOREEN AT WORK MADE ME THIS. IT IS LIKE A PHONE BUT QUIET',
        'HOW DO I MAKE THE LETTERS SMALL. I AM NOT ANGRY THEY ARE JUST BIG',
        { if: { not: atParents }, text: 'ALSO DID YOU EAT' },
        { if: atParents, text: 'ALSO I CAN HEAR YOU LAUGHING THROUGH THE CEILING' },
      ],
      choices: [
        {
          tag: '[Systems]',
          text: 'this weekend ill set up ur whole computer mom. small letters, a real junk filter, a big button that says KIM',
          check: {
            skill: 'systems',
            dc: 11,
            bonuses: [{ if: { background: 'tinkerer' }, add: 2, label: '+2 (you have fixed worse in a basement)' }],
            success: 'setup_win',
            fail: 'setup_lose',
          },
        },
        {
          text: 'ok mom. the key on the left side. it says CAPS LOCK. press it once',
          goto: 'caps',
        },
        {
          if: kimHere,
          text: 'mom kim is the computer expert now. u should ask her',
          effects: [{ npc: 'kim', affinity: -3 }, { npc: 'mom', affinity: 1 }],
          goto: 'kim',
        },
        {
          text: 'teach her patiently, one key at a time, for as long as it takes',
          effects: [{ stat: 'energy', add: -8 }, { npc: 'mom', affinity: 4 }, { stat: 'mood', add: 3 }],
          goto: 'teach',
        },
      ],
    },
    setup_win: {
      speaker: 'mom',
      text: [
        'thank you sweetheart',
        'look how small. like a whisper',
        'i am sending you a picture of the rice i made. it is a big file. doreen says that is ok now',
      ],
      effects: [{ npc: 'mom', affinity: 6 }, { xp: 'systems', add: 15 }],
    },
    setup_lose: {
      speaker: 'mom',
      text: [
        'SWEETHEART WHERE IS THE CANNERY FILE',
        'THE PAYROLL ONE. IT WAS ON THE DESK PICTURE. NOW THERE IS A PICTURE OF A MOUNTAIN',
        'I FOUND IT. IT WAS IN A FOLDER CALLED "OLD STUFF". I AM NOT OLD STUFF',
        'FROM NOW ON I WILL SEND YOU EVERYTHING FIRST SO YOU CAN CHECK IT IS NOT A VIRUS. EVERYTHING. :)',
      ],
      effects: [{ npc: 'mom', affinity: -3 }, buff(MOMS_FORWARDS), { stat: 'stress', add: 3 }],
    },
    caps: {
      speaker: 'mom',
      text: ['thank you sweetheart', 'oh', 'OH NO IT CAME BACK', 'I PRESSED IT AGAIN BY ACCIDENT. I WILL LEAVE IT LIKE THIS. GOODNIGHT. EAT SOMETHING'],
      effects: [{ stat: 'mood', add: 4 }, { npc: 'mom', affinity: 2 }],
    },
    kim: {
      speaker: 'kim',
      text: ['i will END you', 'she just asked me what a "browser" is and if it is the same as a "window" and if windows are the same as "doors"', 'i owe u one. a BAD one'],
    },
    teach: {
      speaker: 'mom',
      text: [
        'ok. small letters. done.',
        'this is nice. it is like you are in the next room even when you are not',
        'dont tell your father i can do this. i want to surprise him. i will send him a message at work that says "hello robert this is your wife" and he will fall off his chair',
      ],
      effects: [{ flag: 'ev_home.mom_online' }],
    },
  },
}

const momOnline: EventDef = {
  id: 'ev_home_mom_online',
  category: 'family',
  weight: 2,
  when: { all: [momHere, actLte(2), { not: darkTurn }, between(20, 800), free] },
  scene: 'ev_home_mom_online_scene',
}

// ── ev_home_dad_radio ─────────────────────────────────────────────────────────
// After the layoff, Dad brings his father's tube radio up from the storage cage.
// Read again in Act IV (ev_home_old_bedroom).
const dadRadioScene: SceneDef = {
  id: 'ev_home_dad_radio_scene',
  channel: 'dialog',
  title: 'The Radio',
  start: 'bench',
  nodes: {
    bench: {
      speaker: 'narrator',
      text: [
        'Dad has spread newspaper over the kitchen table and set his father\'s radio on it: a walnut cabinet the size of a microwave, cloth grille, a dial marked with cities that don\'t have stations anymore. He is looking at it the way he looked at the mill gate the last morning.',
        '"My father fixed radios," he says. "Every radio on the Row, 1950 to 1980. This one was his. Hasn\'t made a sound since I was your age." He taps the back panel. "Your mother\'s birthday is Sunday. I thought."',
        'He doesn\'t finish the sentence. He has had a lot of unfinished sentences since the layoff.',
      ],
      choices: [
        {
          tag: '[Hardware]',
          text: 'Pull up a chair. "Let\'s find out what\'s wrong with it. Together."',
          check: {
            skill: 'hardware',
            dc: 12,
            bonuses: [
              { if: { background: 'tinkerer' }, add: 2, label: '+2 (basement tinkerer)' },
              { if: { npc: 'dad', affinityGte: 55 }, add: 1, label: '+1 (he trusts your hands)' },
            ],
            success: 'fixed',
            fail: 'broken',
          },
        },
        {
          text: '"Dad, CompCastle has radios for forty bucks. I\'ll get Mom a new one."',
          effects: [{ money: -40 }, { npc: 'dad', affinity: -2 }],
          goto: 'new_radio',
        },
        {
          text: 'Hand him the screwdrivers and keep him company. This is his to fix.',
          effects: [{ npc: 'dad', affinity: 5 }, { stat: 'mood', add: 3 }],
          goto: 'company',
        },
        {
          tag: '[Leave]',
          text: '"I\'ve got a deadline tonight. Next weekend?"',
          effects: [{ npc: 'dad', affinity: -2 }],
          goto: 'later',
        },
      ],
    },
    fixed: {
      speaker: 'narrator',
      text: [
        'It takes until one in the morning, a flashlight in your teeth and Dad reading his father\'s handwriting off a yellowed card taped inside the cabinet. When it finally warms up there is a hum, then a hiss, then a big band station from across the Sound, faint as memory.',
        'Dad doesn\'t say anything for a long time. Then he turns it down so it won\'t wake Mom, and leaves it playing. On Sunday she cries, and he pretends it was all your idea, and you pretend it was all his.',
      ],
      effects: [{ npc: 'dad', affinity: 8 }, { npc: 'mom', affinity: 3 }, { faction: 'fac.hood', add: 2 }, { xp: 'hardware', add: 20 }, { flag: 'ev_home.radio_fixed' }],
    },
    broken: {
      speaker: 'narrator',
      text: [
        'You find the fault. You are almost sure you find the fault. Then there is a soft pop from inside the chassis, a smell like hot dust and old varnish, and a thread of grey smoke rising out of the grille.',
        '"That\'s alright," Dad says immediately. He says it too fast. He unplugs it, pats the cabinet twice, and carries it back down to the storage cage himself. On Sunday he gives Mom a scarf. It isn\'t alright. It\'s just a radio. Both things are true.',
      ],
      effects: [{ npc: 'dad', affinity: -3 }, { stat: 'stress', add: 4 }, { stat: 'mood', add: -3 }, { flag: 'ev_home.radio_broken' }],
    },
    new_radio: {
      speaker: 'narrator',
      text: 'Mom loves the new radio. It has a clock and a snooze button and a cassette deck. Dad thanks you, and means it, and carries his father\'s radio back down to the storage cage, and doesn\'t bring it up again.',
      effects: [{ npc: 'mom', affinity: 2 }],
    },
    company: {
      speaker: 'dad',
      text: [
        'He doesn\'t fix it tonight. He takes the back off, looks at everything, and tells you about his father instead: how he whistled through his teeth when a set came back to life, how the Row paid him in pies and favors, how he never once owned a car.',
        '"Maybe next month," he says at midnight, putting the panel back. He is smiling. It\'s the first time since the mill.',
      ],
    },
    later: {
      speaker: 'narrator',
      text: 'Next weekend there is a deadline too. The radio goes back to the storage cage. Dad doesn\'t ask again, and you don\'t offer, and the week after that you both forget it was ever on the table.',
    },
  },
}

const dadRadio: EventDef = {
  id: 'ev_home_dad_radio',
  category: 'family',
  weight: 2,
  when: { all: [dadHere, { flag: 'a1.dad_laid_off' }, actLte(2), between(60, 540), free] },
  scene: 'ev_home_dad_radio_scene',
}

// ── ev_home_dentist ───────────────────────────────────────────────────────────
// Five years without a dentist. Tonight the molar declares war.
const dentistScene: SceneDef = {
  id: 'ev_home_dentist_scene',
  channel: 'dialog',
  title: 'Molar',
  start: 'ache',
  nodes: {
    ache: {
      speaker: 'narrator',
      text: [
        'The tooth has been negotiating with you for two weeks. Tonight, at 3 a.m., it abandons diplomacy. The left side of your face has its own heartbeat, and it is faster than yours.',
        'You have not seen a dentist since high school. You have been busy. The tooth does not care that you have been busy.',
        { if: { trait: 'caffeine_fiend' }, text: 'Your ninth coffee of the day was, in retrospect, a tactical error. So were the first eight.' },
      ],
      choices: [
        {
          text: 'Book Dr. Pham on Sodium Row for first thing tomorrow ($180).',
          req: { stat: 'money', gte: 180 },
          reqText: 'Requires $180',
          effects: [{ money: -180 }, { stat: 'health', add: 5 }, { stat: 'stress', add: -3 }],
          goto: 'pham',
        },
        {
          text: 'The LSU dental school runs a student clinic. Forty bucks. What could go wrong?',
          effects: [
            { money: -40 },
            {
              random: [
                { weight: 7, effects: [{ stat: 'health', add: 3 }] },
                { weight: 3, effects: [{ flag: 'ev_home.clinic_rough' }, { stat: 'health', add: -5 }, { stat: 'stress', add: 6 }] },
              ],
            },
          ],
          goto: 'clinic',
        },
        {
          tag: '[Fitness]',
          text: 'Ice, clove oil, and grim resolve. Teeth are a state of mind.',
          check: {
            skill: 'fitness',
            dc: 13,
            bonuses: [
              { if: { trait: 'gym_rat' }, add: 1, label: '+1 (pain is just weakness leaving)' },
              { if: { trait: 'glass_cannon' }, add: -2, label: '-2 (glass cannon)' },
            ],
            success: 'tough_win',
            fail: 'tough_lose',
          },
        },
        {
          if: momHere,
          text: 'Call Mom. Mom has a remedy for everything, and a cousin for the rest.',
          effects: [{ npc: 'mom', affinity: 3 }, { money: -110 }, { stat: 'health', add: 3 }],
          goto: 'mom',
        },
      ],
    },
    pham: {
      speaker: 'Dr. Pham',
      text: 'Dr. Pham works with the radio on and the drill at a pitch that harmonizes with the modem in your head. "You kids," he says, with both hands in your mouth. "You don\'t sleep, you drink the coffee, you grind the teeth. I can hear the internet in your jaw." One filling, one lecture, one free toothbrush. The heartbeat in your face goes quiet.',
    },
    clinic: {
      speaker: 'narrator',
      text: [
        { if: { flag: 'ev_home.clinic_rough' }, text: 'Your student is named Trevor and this is, he admits, his "first live one." It takes three hours, two supervisors, and a moment where everyone in the room goes very quiet. The filling holds. Your trust in institutions does not.', else: 'Your student is named Priscilla, she is terrifyingly competent, and she narrates every step to a supervisor who mostly just nods. Forty dollars. You would pay forty dollars again. You would maybe not tell anyone.' },
      ],
    },
    tough_win: {
      speaker: 'narrator',
      text: 'By dawn the tooth retreats into a sullen truce. By the weekend you can chew on that side again, cautiously, like a man crossing a frozen pond. You have won. For now. The tooth is patient.',
      effects: [{ stat: 'health', add: -3 }, { stat: 'stress', add: 2 }],
    },
    tough_lose: {
      speaker: 'narrator',
      text: [
        'By Thursday your cheek is the size of a tangerine and you have a fever that makes the monitor swim. At four in the morning you are in the Harbor Point General emergency room, holding a bag of frozen peas to your face, next to a man who stapled his own hand.',
        'Emergency dental work is expensive in a way that has monthly installments. The dentist who finally sees you says, very kindly, "Two weeks ago this would have been a filling."',
        { if: momHere, text: 'Mom arrives at the ER in her coat over her nightgown with a thermos of rice porridge, and does not say "I told you so," loudly.' },
      ],
      effects: [
        { stat: 'health', add: -25 },
        { stat: 'stress', add: 10 },
        owe('ev_home_dental_bill', 'Emergency dental work', 5, 60),
        { chance: 0.3, then: [{ complication: 'health' }] },
      ],
    },
    mom: {
      speaker: 'mom',
      text: 'Mom\'s remedy is warm salt water, a lecture about coffee, and the home number of Dr. Vo from church, who sees you at seven a.m. before his first appointment at "the family price," which is not free but is much less than you deserve. He tells Mom everything. By dinner the whole Row knows about your molar.',
      effects: [buff(WELL_FED)],
    },
  },
}

const dentist: EventDef = {
  id: 'ev_home_dentist',
  category: 'health',
  when: { all: [actLte(2), between(90, 1100), free] },
  scene: 'ev_home_dentist_scene',
}

export default defineContent({
  events: [phoneBill, strayCat, momOnline, dadRadio, dentist],
  scenes: [phoneBillScene, strayCatScene, momOnlineScene, dadRadioScene, dentistScene],
})
