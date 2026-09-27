/**
 * events_work — THE STREET LEVEL (mostly Act I–II). Paper routes and pizza bikes, Sal's dish pit,
 * the library's haunted terminal, the CompCastle holiday crush, and every help-desk headset in the
 * city. Stakes are $40 and dignity — but a bad roll still leaves a limp, a bill, or a write-up.
 *
 * HARD RULE: all tech here is invented flavor, never real technique.
 */
import { defineContent } from '@/engine/registry'
import type { EventDef, SceneDef } from '@/engine/types'
import {
  CC_JOBS,
  COMPLAINT,
  DOCKED,
  DUCHESS,
  GOOD_WORD,
  SPRAIN,
  STREET_ROUTES,
  WELL_READ,
  around,
  bumpJob,
  free,
  holidayRush,
  onFinalWarning,
  strike,
} from './_shared'

// ── ev_work_pike_street_dog ───────────────────────────────────────────────────
// Repeatable comedy with a real limp on a bad roll. Feed her three times and she's yours.
const DOG_TREATS = 'ev_work.duchess'
const duchessFriend = { flag: 'ev_work.duchess_friend' }
const notFriend = { not: duchessFriend }
const onPizza = { job: 'job_odd_pizza_bike' }

const dogScene: SceneDef = {
  id: 'ev_work_pike_street_dog_scene',
  channel: 'dialog',
  title: 'Pike Street',
  start: 'gate',
  nodes: {
    gate: {
      speaker: 'narrator',
      text: [
        { if: { job: 'job_odd_paper_route' }, text: 'Pike Street, 5:40 a.m. The Herald bag cuts into your shoulder and the fog is so thick the streetlights look like dandelions.' },
        { if: { job: 'job_odd_flyers' }, text: 'Pike Street, dusk. A staple gun, forty neon flyers for a LAN party in a church basement, and one telephone pole left before home.' },
        { if: onPizza, text: 'Pike Street, 8:10 p.m. A large pepperoni rides in the rack behind you, and the one working brake is making its little noise.' },
        { if: { all: [notFriend, { var: DOG_TREATS, lte: 0 }] }, text: 'And there she is. Eighty pounds of grey-muzzled fury behind a chain-link fence with a gate that has never once been properly latched. The whole street calls her Duchess. You call her a lot of things, most of them from the far side of a parked car.' },
        { if: { all: [notFriend, { var: DOG_TREATS, gte: 1 }] }, text: 'Duchess is waiting at the gate. She remembers you — and she remembers that last time you brought something. Her tail is doing something undecided.' },
        { if: notFriend, text: 'The latch goes clink. The gate swings open. Duchess steps onto the sidewalk with the unhurried confidence of a dog who has done this before.' },
        { if: duchessFriend, text: 'The gate clinks open and Duchess trots out to meet you like an escort from a better, more organized kingdom. On the porch, Mrs. Kowalczyk raises her coffee mug at you. There is a second mug on the rail. It has your name on it in nail polish.' },
      ],
      choices: [
        {
          if: notFriend,
          tag: '[Fitness]',
          text: 'Run. Now. Don\'t look back, don\'t drop anything.',
          check: {
            skill: 'fitness',
            dc: 12,
            bonuses: [
              { if: { trait: 'gym_rat' }, add: 2, label: '+2 (gym rat)' },
              { if: onPizza, add: 2, label: '+2 (you are on a bike)' },
              { if: { background: 'arcade_rat' }, add: 1, label: '+1 (arcade reflexes)' },
            ],
            success: 'outran',
            fail: 'caught',
            successEffects: [{ xp: 'fitness', add: 20 }, { stat: 'mood', add: 3 }],
            failEffects: [
              { stat: 'health', add: -8 },
              { buff: SPRAIN },
              { obligation: { id: 'ev_work_urgent_care', label: 'Urgent care bill (the Pike Street ankle)', perDay: 4, days: 21 } },
            ],
          },
        },
        {
          if: notFriend,
          req: { stat: 'money', gte: 3 },
          reqText: 'Requires $3',
          tag: '[$3]',
          text: [{ if: onPizza, text: 'Sacrifice two slices of the customer\'s pepperoni to the gods of Pike Street.', else: 'Toss her the good beef jerky from the Kwik Stop. You bought it for exactly this.' }],
          effects: [{ money: -3 }, { var: DOG_TREATS, add: 1 }],
          goto: 'treat',
        },
        {
          if: notFriend,
          tag: '[Social]',
          text: 'Crouch down. Talk to her like she\'s a person having a bad week.',
          check: {
            skill: 'social',
            dc: 14,
            bonuses: [
              { if: { trait: 'empath' }, add: 3, label: '+3 (you hear the fear under the bark)' },
              { if: { background: 'class_clown' }, add: 1, label: '+1 (you can charm anything)' },
            ],
            success: 'talked',
            fail: 'bitten',
            successEffects: [{ var: DOG_TREATS, add: 1 }, { stat: 'stress', add: -3 }],
            failEffects: [{ money: -25 }, { stat: 'stress', add: 5 }],
          },
        },
        {
          if: notFriend,
          tag: '[Leave]',
          text: 'Back away slowly and take the long way round by Harbor Street.',
          effects: [{ stat: 'energy', add: -5 }, { if: onPizza, then: [{ money: -5 }] }],
          goto: 'detour',
        },
        {
          if: duchessFriend,
          text: 'Scratch her ears and let her walk you the whole route.',
          effects: [{ buff: DUCHESS }, { stat: 'mood', add: 4 }],
          goto: 'escort',
        },
        {
          if: duchessFriend,
          text: 'Sit on the porch step for five minutes. Drink the coffee. Let the route wait.',
          effects: [{ stat: 'stress', add: -6 }, { stat: 'mood', add: 3 }, { buff: DUCHESS }],
          goto: 'porch',
        },
      ],
    },
    outran: {
      speaker: 'narrator',
      text: [
        'You go from standing to sprinting in a single terrified heartbeat. Duchess gives chase for exactly one driveway, then stops, satisfied, the way a cat stops chasing a laser pointer: point made.',
        'At the corner you look back. She is sitting on the sidewalk, watching you. You could swear she looks pleased with both of you.',
      ],
    },
    caught: {
      speaker: 'narrator',
      text: [
        'You make it four strides before your sneaker finds the one loose paving slab on Pike Street. Your ankle goes one way. You go the other. Duchess arrives, sniffs your ear with great seriousness, and sits on your chest until Mrs. Kowalczyk comes out in her housecoat.',
        '"She was saying hello," Mrs. Kowalczyk tells you, while you lie in her hedge. "You were saying goodbye very rudely." The urgent-care nurse on Fourth tells you it\'s a sprain and hands you a bill that is also, in its way, a sprain.',
      ],
    },
    treat: {
      speaker: 'narrator',
      text: [
        { if: { var: DOG_TREATS, lte: 1 }, text: 'Duchess catches it out of the air with a snap like a mousetrap, chews it with her eyes closed, and then looks at you with a whole new set of questions. She lets you pass. She walks beside you to the end of her fence. It is not friendship. It is a ceasefire.' },
        { if: { var: DOG_TREATS, eq: 2 }, text: 'This time she doesn\'t even bark. She sits, very politely, and accepts tribute like a small grey queen. Her tail thumps twice against the fence. Mrs. Kowalczyk, on the porch, says "Huh," which from her is a speech.' },
        { if: { var: DOG_TREATS, gte: 3 }, text: 'Duchess takes the treat, sets it down, and leans her entire eighty pounds against your legs until you nearly fall over. Mrs. Kowalczyk comes down the steps. "She\'s decided," she says. "God help you. She walks the mailman to Sixth. She\'ll walk you now." She goes inside and comes back with a mug.' },
        { if: { all: [onPizza, { var: DOG_TREATS, lte: 2 }] }, text: 'The customer on Ninth opens the box, counts the slices, counts them again, and tips you a single nickel with enormous meaning.' },
      ],
      effects: [
        { if: { var: DOG_TREATS, gte: 3 }, then: [{ flag: 'ev_work.duchess_friend' }, { buff: DUCHESS }, { faction: 'fac.hood', add: 1 }] },
        { if: onPizza, then: [{ money: -4 }] },
      ],
    },
    talked: {
      speaker: 'narrator',
      text: [
        'You tell her about your week. The bag, the fog, the customer on Ninth who tips in pennies. Somewhere around the pennies she stops growling. By the end she is sitting, head tilted, listening like the Herald\'s best reader.',
        { if: { var: DOG_TREATS, gte: 3 }, text: 'When you stand, she leans her whole weight against your knees and refuses to move. Mrs. Kowalczyk watches from the porch. "Well," she says. "She\'s decided. She walks the mailman to Sixth. She\'ll walk you now." She goes inside and comes back with a mug.', else: 'When you stand, she lets you. When you walk, she walks with you, just to the end of her fence, and watches you all the way to the corner.' },
      ],
      effects: [{ if: { var: DOG_TREATS, gte: 3 }, then: [{ flag: 'ev_work.duchess_friend' }, { buff: DUCHESS }, { faction: 'fac.hood', add: 1 }] }],
    },
    bitten: {
      speaker: 'narrator',
      text: [
        'You get as far as "Hey, girl—" before she decides the conversation is over. It\'s not a bite, exactly. It\'s an opinion, delivered to your jacket sleeve, which comes away in her mouth like a trophy.',
        'Mrs. Kowalczyk yells at YOU from the porch — "Don\'t tease her!" — and the jacket was twenty-five dollars at the Army-Navy on Sodium Row. Duchess keeps the sleeve. You see it in her yard for weeks.',
      ],
    },
    detour: {
      speaker: 'narrator',
      text: [
        'Harbor Street adds twelve minutes, two hills and a very long look from a man walking a much smaller, much friendlier dog.',
        { if: onPizza, text: 'The pepperoni arrives lukewarm. The customer notes this. The tip notes this.', else: 'You finish the route late, legs burning, and tell yourself it was cardio.' },
      ],
    },
    escort: {
      speaker: 'narrator',
      text: 'Duchess pads beside you the whole way, stopping when you stop, glaring at every other dog on the Row as if they were disreputable relations. Somebody\'s kid waves from a window. You wave back. For eleven blocks you are royalty.',
    },
    porch: {
      speaker: 'Mrs. Kowalczyk',
      text: '"My Stan did the docks forty years," she says, watching the fog lift off the Sound. "Every morning, this porch, this coffee, that fence. Then he stopped coming home, and she started biting the mailman." Duchess sighs and puts her head on your shoe. "She likes you. I didn\'t think she\'d like anybody again." You finish the coffee. The route can wait five minutes. It always could.',
    },
  },
}

const pikeStreetDog: EventDef = {
  id: 'ev_work_pike_street_dog',
  category: 'weird',
  weight: 3,
  repeatable: true,
  cooldownDays: 120,
  when: { all: [{ job: STREET_ROUTES }, free] },
  scene: 'ev_work_pike_street_dog_scene',
}

// ── ev_work_cathode_inspector ─────────────────────────────────────────────────
// Sal's out; the health inspector isn't. Fix the cooler, charm the man, or call for help.
const cathodeScene: SceneDef = {
  id: 'ev_work_cathode_inspector_scene',
  channel: 'dialog',
  title: 'Routine Inspection',
  start: 'bell',
  nodes: {
    bell: {
      speaker: 'narrator',
      text: [
        'Tuesday, 7:05 p.m. Sal is across town at the cash-and-carry, arguing about the price of eggs with a man he has argued with about the price of eggs since 1974. You are alone with the dinner rush, the dish pit, and the walk-in cooler, which has been making The Noise since Friday.',
        'The bell over the door. A man with a clipboard and a laminated badge: CITY OF PORT LUMEN — ENVIRONMENTAL HEALTH. "Routine," he says, the way a dentist says "little pinch." He glances at the kitchen. "Owner around?"',
        'Behind you, the cooler\'s compressor coughs, rattles, and goes quiet in a way you do not like at all.',
      ],
      choices: [
        {
          tag: '[Hardware]',
          text: 'Pour him a coffee "on the house," then slip into the back and fix the cooler\'s relay before he gets there.',
          check: {
            skill: 'hardware',
            dc: 13,
            bonuses: [
              { if: { background: 'tinkerer' }, add: 2, label: '+2 (basement tinkerer)' },
              { if: { skill: 'hardware', gte: 20 }, add: 1, label: '+1 (you fix fridges for fun)' },
            ],
            success: 'fixed',
            fail: 'sparks',
          },
        },
        {
          tag: '[Social]',
          text: 'Charm the inspector. Pie. Stories. The history of the booth where the mayor proposed.',
          check: {
            skill: 'social',
            dc: 14,
            bonuses: [
              { if: { trait: 'silver_tongue' }, add: 2, label: '+2 (silver tongue)' },
              { if: { background: 'class_clown' }, add: 2, label: '+2 (you have a bit for every occasion)' },
              { if: { faction: 'fac.hood', gte: 20 }, add: 1, label: '+1 (you know every story on the Row)' },
            ],
            success: 'charmed',
            fail: 'strict',
            successEffects: [{ npc: 'sal', affinity: 4 }, { faction: 'fac.hood', add: 1 }],
            failEffects: [{ npc: 'sal', affinity: -2 }, { stat: 'stress', add: 5 }, { buff: { ...DOCKED, id: 'ev_work_short_shifts', name: 'Short Shifts', desc: 'The Cathode lost a night to the inspector and Sal is cutting everybody\'s hours until the till recovers.', days: 21 } }],
          },
        },
        {
          text: 'Stall with the specials board and call the cash-and-carry payphone number taped to the register.',
          effects: [{ npc: 'sal', affinity: 2 }, { stat: 'mood', add: 2 }],
          goto: 'called',
        },
      ],
    },
    fixed: {
      speaker: 'narrator',
      text: [
        'The relay is a sticky little brick older than you are. You tap it with the back of a butter knife, reseat the plug, and hold your breath. The compressor hums back to life like an old man clearing his throat. By the time the inspector pushes open the walk-in, the thermometer is falling nicely.',
        '"Tight ship," he says, and writes SATISFACTORY. When Sal comes back and hears, he says nothing at all — just puts twenty dollars in your apron pocket and a slice of the good pie in front of you, and that is how you know.',
      ],
      effects: [{ npc: 'sal', affinity: 6 }, { faction: 'fac.hood', add: 2 }, { money: 20 }, { xp: 'hardware', add: 25 }],
    },
    sparks: {
      speaker: 'narrator',
      text: [
        'The relay does not want to be tapped. It wants to be replaced, and it tells you so with a bang, a smell like a burnt birthday candle, and the breaker taking out every light in the kitchen. The inspector stands in the doorway of a dark walk-in with his penlight, writing, and writing, and writing.',
        'The Cathode gets a fine and a re-inspection notice taped in the window for the whole Row to see. Sal arrives twenty minutes later, looks at the dark kitchen, looks at you.',
      ],
      effects: [{ npc: 'sal', affinity: -4 }, { buff: DOCKED }, { stat: 'stress', add: 6 }],
      next: 'sal_asks',
    },
    sal_asks: {
      speaker: 'sal',
      text: '"So," Sal says, very calmly, which is worse than yelling. "What happened to my cooler."',
      choices: [
        {
          text: '"I tried to fix it before he got to it. I made it worse. I\'m sorry, Sal."',
          effects: [{ npc: 'sal', affinity: 3 }, { stat: 'mood', add: 2 }],
          goto: 'truth',
        },
        {
          tag: '[Lie]',
          text: '"It just died on its own. I didn\'t touch it."',
          check: {
            skill: 'social',
            dc: 15,
            bonuses: [{ if: { trait: 'silver_tongue' }, add: 2, label: '+2 (silver tongue)' }],
            success: 'lie_ok',
            fail: 'lie_bad',
            successEffects: [{ removeBuff: 'ev_work_docked' }, { stat: 'stress', add: 3 }],
            failEffects: [{ npc: 'sal', affinity: -6 }],
          },
        },
      ],
    },
    truth: {
      speaker: 'sal',
      text: '"Good," he says. "Not good that you blew up my relay. Good that you said so." He takes the butter knife out of your hand. "You work it off. And next time a man with a clipboard walks in, you call me. That\'s what the number\'s for." He\'s already calling a repair guy. He\'s already forgiven you. You can tell because he\'s complaining about the egg prices again.',
    },
    lie_ok: {
      speaker: 'sal',
      text: '"Thirty years that thing ran," Sal mutters, patting the dead cooler like a horse. "Thirty years." He doesn\'t dock you. He does buy you a coffee. You drink it and it tastes like a relay burning.',
    },
    lie_bad: {
      speaker: 'sal',
      text: 'Sal holds up the butter knife. It is black at the tip. "Kid. I have been lying to inspectors since before your mother was born. Don\'t lie to me in my own kitchen." He doesn\'t raise his voice. He doesn\'t have to. You work the next two weeks in a silence you could slice and serve.',
    },
    charmed: {
      speaker: 'narrator',
      text: 'By the second slice of rhubarb, the inspector is telling you about his own first job, at a fish cannery that no longer exists, and how his father used to bring him here after. He checks the dish pit, the hand sink, the dates on the milk. He does not check the walk-in. He writes SATISFACTORY and "excellent pie" in the margin, which Sal later frames.',
    },
    strict: {
      speaker: 'narrator',
      text: [
        'He listens to exactly one story, smiles exactly once, and walks straight past you into the walk-in with a thermometer. It reads forty-nine degrees. He writes for a long time.',
        'The Cathode closes for a night to pass re-inspection — the first night it has been dark in eleven years. Sal pays for a new compressor and cuts everybody\'s hours to cover it, including yours. He doesn\'t blame you. He just looks older.',
      ],
    },
    called: {
      speaker: 'narrator',
      text: 'Sal comes through the door eighteen minutes later with his apron over his coat and flour on his hat, shakes the inspector\'s hand like an old sparring partner — "Dennis! How\'s your mother!" — and walks him into the kitchen with an arm around his shoulders. Somehow the cooler gets written up as "noted, re-check in 30 days." On the way out Sal points at you: "Good call. Literally." It is the worst joke you have ever heard and you will remember it forever.',
    },
  },
}

const cathodeInspector: EventDef = {
  id: 'ev_work_cathode_inspector',
  category: 'city',
  weight: 3,
  when: { all: [{ job: 'job_odd_cathode' }, around('sal'), { var: 'w.cathode_open', eq: 1 }, free] },
  scene: 'ev_work_cathode_inspector_scene',
}

// ── ev_work_library_ghost ─────────────────────────────────────────────────────
// The haunted screensaver on terminal 3. A ghost story with a heart, and a catalog you can crash.
const libraryScene: SceneDef = {
  id: 'ev_work_library_ghost_scene',
  channel: 'dialog',
  title: 'Terminal Three',
  start: 'marquee',
  nodes: {
    marquee: {
      speaker: 'narrator',
      text: [
        'Public terminal three has a screensaver nobody installed. Every morning at opening it scrolls a single line across the screen in chunky yellow letters: TODAY: "THE WIND IN THE WILLOWS." SHELF J, THIRD FROM THE LEFT. BE GENTLE WITH THE SPINE.',
        'It is right about the shelf. It is always right about the shelf. The kids have started lining up to see what it picks.',
        'Mr. Abernathy, head of circulation, is less charmed. The Digital Harbor grant inspectors are coming Thursday. "I want it gone," he says. "Whatever it is. I do not want to explain a ghost to the state."',
      ],
      choices: [
        {
          tag: '[Systems]',
          text: 'Trace it to its source. Something, somewhere in this building, is running it.',
          check: {
            skill: 'systems',
            dc: 12,
            bonuses: [
              { if: { trait: 'bookworm' }, add: 2, label: '+2 (you know how librarians think)' },
              { if: { background: 'tinkerer' }, add: 1, label: '+1 (basement tinkerer)' },
            ],
            success: 'found',
            fail: 'crashed',
            successEffects: [{ xp: 'systems', add: 25 }],
            failEffects: [...strike, { stat: 'stress', add: 6 }],
          },
        },
        {
          text: 'Unplug terminal three and tape an OUT OF ORDER sign over the screen.',
          goto: 'unplugged',
        },
        {
          text: 'Pull up a chair on your lunch break and read what it picks today.',
          effects: [{ buff: WELL_READ }, { stat: 'mood', add: 3 }],
          goto: 'read',
        },
      ],
    },
    found: {
      speaker: 'narrator',
      text: [
        'You follow a grey cable out of the back of terminal three, through a ceiling tile, down a wall, and into the basement stacks, where it ends at a beige box wedged behind the 1987 census binders. It is warm. It is humming. Its case has a label in careful cursive: A. FENN — CHILDREN\'S. PLEASE DO NOT UNPLUG. I MEAN IT.',
        'Inside, one small program written in 1994: it reads a card file of four thousand hand-typed book notes and picks one each morning. The last card added is dated June 1999. You ask at the desk. Adelaide Fenn ran the children\'s room for thirty-one years. She died that summer. Nobody knew the box was there.',
      ],
      choices: [
        {
          text: 'Move Miss Fenn\'s program onto a new machine. Make it official. Put her name on the screen.',
          effects: [{ flag: 'ev_work.fenn_saved' }, { faction: 'fac.hood', add: 2 }, { stat: 'mood', add: 6 }],
          goto: 'kept',
        },
        {
          text: 'Do what Abernathy asked. Power it down, gently, and box it for the archives.',
          effects: [...bumpJob(120), { stat: 'mood', add: -4 }],
          goto: 'boxed',
        },
      ],
    },
    kept: {
      speaker: 'narrator',
      text: [
        'It takes an evening, a spare machine from the supply closet and one very careful transplant. On Thursday the grant inspectors find terminal three scrolling: TODAY: "CHARLOTTE\'S WEB." SHELF E. — MISS FENN\'S PICK, SINCE 1994.',
        'The lead inspector, a woman in a grey suit, reads it twice, takes off her glasses, and writes "community heritage program — exemplary." Mr. Abernathy accepts the compliment as if it had been his idea all along. You let him.',
      ],
    },
    boxed: {
      speaker: 'narrator',
      text: 'The box goes quiet with a little click, like a door closing in another room. Abernathy is delighted; the inspectors see a clean screen; you get a nod in the staff meeting. On Monday a seven-year-old stands in front of terminal three for a long time, waiting for the words, and then asks you where they went. You don\'t have a good answer.',
    },
    crashed: {
      speaker: 'narrator',
      text: [
        'The grey cable goes into a wall that also carries the catalog server\'s line, and you pull the wrong one. The whole library\'s card catalog goes dark. For three days patrons return books to a growing hill on the front desk while the county sends a technician who sighs at you, specifically.',
        'Abernathy puts a note in your file. The screensaver, of course, comes back on its own the moment the power does. TODAY: "HARRIET THE SPY." BE CAREFUL WHAT YOU GO LOOKING FOR.',
      ],
    },
    unplugged: {
      speaker: 'narrator',
      text: 'On Monday terminal three is plugged back in. The screensaver is running. Your OUT OF ORDER sign has been neatly corrected in careful cursive: IN ORDER. Nobody on staff will admit to it. The kids think it\'s the best thing that has ever happened. Abernathy stops asking you to fix it and starts taking the long way round the reference desk.',
      effects: [{ stat: 'mood', add: 1 }, { stat: 'stress', add: 2 }],
    },
    read: {
      speaker: 'narrator',
      text: 'TODAY: "A WRINKLE IN TIME." SHELF L. You haven\'t read it since fourth grade. You read the first three chapters over a vending-machine sandwich and go back the next day for the rest, and the day after that the screen picks something else, and it is always, somehow, the right thing. You start to look forward to lunch.',
    },
  },
}

const libraryGhost: EventDef = {
  id: 'ev_work_library_ghost',
  category: 'weird',
  weight: 3,
  when: { all: [{ job: 'job_odd_library' }, free] },
  scene: 'ev_work_library_ghost_scene',
}

// ── ev_work_cc_holiday_rush ───────────────────────────────────────────────────
// Every holiday season at CompCastle. Dee runs a field hospital; after the layoffs, Gary runs numbers.
const RUSHES = 'ev_work.rushes'
const deeHere = { all: [around('dee'), { not: { flag: 'life.dee_laid_off' } }] }
const garyHere = { not: deeHere }

const rushScene: SceneDef = {
  id: 'ev_work_cc_holiday_rush_scene',
  channel: 'dialog',
  title: 'Doorbuster',
  start: 'doors',
  nodes: {
    doors: {
      speaker: 'narrator',
      text: [
        'CompCastle, 5:58 a.m., the Friday after Thanksgiving. Two hundred people in the parking lot, breath steaming, some of them in lawn chairs they brought from home. The doorbuster: twelve CastlePro towers, monitor and printer included, for one hundred and ninety-nine dollars, while supplies last. Supplies will last about nine seconds.',
        { if: { var: RUSHES, gte: 2 }, text: 'You have done this before. You know which aisle the reindeer-sweater guy goes for. You know where to stand so the mousepad pallet doesn\'t get you.' },
        { if: deeHere, text: 'Dee is standing on a chair with a thermos of homemade cocoa. "Troops. Today we are not a service bench. Today we are a field hospital, and the war is RETAIL. Nobody gets trampled on my watch. Heal the customer. Heal each other. Let\'s GO."' },
        { if: garyHere, text: 'Gary from Regional is standing where Dee used to stand, holding a laminated chart instead of a thermos. "Attach rate, people. Every box goes out with an extended warranty or it goes out with my disappointment. Regional is watching."' },
      ],
      choices: [
        {
          tag: '[Social]',
          text: 'Work the line before the doors open: numbered tickets for the twelve towers, jokes for everyone else.',
          check: {
            skill: 'social',
            dc: 13,
            bonuses: [
              { if: { background: 'class_clown' }, add: 2, label: '+2 (you can work a crowd)' },
              { if: { trait: 'silver_tongue' }, add: 2, label: '+2 (silver tongue)' },
              { if: { var: RUSHES, gte: 2 }, add: 1, label: '+1 (you\'ve survived one of these)' },
            ],
            success: 'orderly',
            fail: 'stampede',
            successEffects: [...bumpJob(250), { buff: GOOD_WORD }, { faction: 'fac.halcyon', add: 1 }],
            failEffects: [
              { stat: 'health', add: -12 },
              { buff: SPRAIN },
              ...strike,
              { chance: 0.25, then: [{ trait: 'ev_work_bad_knee' }] },
            ],
          },
        },
        {
          tag: '[Business]',
          text: 'Push the extended warranty on every box that leaves. The bonus is five bucks a unit.',
          check: {
            skill: 'business',
            dc: 14,
            bonuses: [{ if: { trait: 'silver_tongue' }, add: 1, label: '+1 (silver tongue)' }],
            success: 'quota',
            fail: 'quota_bust',
            successEffects: [{ money: 90 }, ...bumpJob(150), { faction: 'fac.hood', add: -1 }],
            failEffects: [{ money: 15 }, ...strike, { stat: 'mood', add: -4 }],
          },
        },
        {
          tag: '[Hardware]',
          text: 'Hide in the back and fix the demo machine that\'s been blue-screening in the front window since Tuesday.',
          check: {
            skill: 'hardware',
            dc: 12,
            bonuses: [{ if: { background: 'tinkerer' }, add: 2, label: '+2 (basement tinkerer)' }],
            success: 'demo',
            fail: 'demo_smoke',
            successEffects: [...bumpJob(200), { xp: 'hardware', add: 30 }],
            failEffects: [{ stat: 'stress', add: 6 }, { if: garyHere, then: strike, else: [{ npc: 'dee', affinity: -2 }] }],
          },
        },
        {
          tag: '[Leave]',
          text: 'Call in sick. No one should be alive at 5:58 a.m. for a printer.',
          effects: [
            { stat: 'mood', add: 4 },
            { stat: 'energy', add: 10 },
            { if: deeHere, then: [{ npc: 'dee', affinity: -3 }], else: strike },
          ],
          goto: 'sick',
        },
      ],
    },
    orderly: {
      speaker: 'narrator',
      text: [
        'You walk the line with a roll of raffle tickets and a voice like a game-show host. Twelve lucky numbers. Everybody else gets a coupon, a joke, and your solemn promise that the shelves hold more than towers. When the doors open, nobody runs. A grandmother high-fives you. A man in a lawn chair applauds.',
        { if: deeHere, text: 'Dee finds you at noon and hands you the last of the cocoa, which is a promotion in every way that matters. "That," she says, misty, "was HEALING."', else: 'Gary writes "crowd management — exceeds" on his laminated chart and, for one moment, almost looks human.' },
      ],
    },
    stampede: {
      speaker: 'narrator',
      text: [
        'The tickets work for about forty seconds. Then someone yells "THEY\'RE OUT OF PRINTERS" — they are not out of printers — and the line becomes a wave. A man in a reindeer sweater goes over the mousepad pallet like a ski jumper. You go into the big-screen display. The big-screen display goes into you.',
        'You spend Black Friday in the break room with an ice pack and a form in triplicate about "the incident at Aisle 4," which Regional will want signed, and a knee that makes a new sound when you stand up.',
      ],
    },
    quota: {
      speaker: 'narrator',
      text: [
        'You sell warranties like a preacher sells salvation. Eighteen boxes, eighteen warranties. The bonus is real money. The printout of your attach rate goes on the break-room wall with a gold star.',
        'Around three, a small woman in a church-choir coat buys a warranty for a mouse. You watch her count the bills out of an envelope. The gold star looks different after that.',
        { if: { trait: 'empath' }, text: 'You think about her all weekend. You were very good at it. That\'s the part that bothers you.' },
      ],
    },
    quota_bust: {
      speaker: 'narrator',
      text: 'You push too hard on the wrong customer: three warranties on one PC, one of them for the box it came in. On Monday she comes back with her son, who is a lawyer, and who wants to discuss "the conduct of your sales associate." The store refunds everything. Your name goes on a form. The bonus you did make wouldn\'t buy lunch.',
    },
    demo: {
      speaker: 'narrator',
      text: [
        'The demo machine has a dying fan, a loose memory stick and, for some reason, a screensaver of a dancing hamster that is eating all its cycles. Twenty minutes with a screwdriver and some quiet swearing, and it runs a flight simulator in the front window at full speed.',
        'It sells forty CastlePros by noon. People stand in front of the glass just to watch it, the way people used to stand in front of department-store windows at Christmas.',
        { if: deeHere, text: 'Dee comes into the back with two cocoas and says, reverently, "Who fixed the window?" You raise one greasy hand.', else: 'Gary asks who fixed the window, writes down your name, and adds it to a chart with an upward arrow on it.' },
      ],
      effects: [{ if: deeHere, then: [{ npc: 'dee', affinity: 3 }] }],
    },
    demo_smoke: {
      speaker: 'narrator',
      text: [
        'You swap the power supply for one from the parts bin. The parts bin, it turns out, is a parts bin for a reason. The demo machine lets out a thin grey ribbon of smoke in the front window in front of two hundred people. A kid in the parking lot yells "THE CASTLE IS ON FIRE," which it is not, but which makes the Lumen Ledger\'s "Around Town" column on Monday.',
        { if: deeHere, text: 'Dee laughs until she cries, then makes you write "I will not use the parts bin" on the whiteboard fifty times.', else: 'Gary puts it in writing. He puts everything in writing.' },
      ],
    },
    sick: {
      speaker: 'narrator',
      text: [
        'You sleep until ten, eat leftover pie standing at the fridge, and watch the news footage of the CompCastle parking lot like it\'s a war you narrowly avoided being drafted into.',
        { if: deeHere, text: 'Dee doesn\'t call. That\'s how you know she\'s hurt. On Monday there\'s a sticky note on your locker: "We held the line without you. Barely. — D."', else: 'Gary calls. Twice. The second voicemail is just the word "documented."' },
      ],
    },
  },
}

const ccHolidayRush: EventDef = {
  id: 'ev_work_cc_holiday_rush',
  category: 'work',
  weight: 5,
  repeatable: true,
  cooldownDays: 250,
  when: { all: [{ job: CC_JOBS }, holidayRush, free] },
  effects: [{ var: RUSHES, add: 1 }],
  scene: 'ev_work_cc_holiday_rush_scene',
}

// ── ev_work_support_caller ────────────────────────────────────────────────────
// Every support job has The Caller. Repeatable, reads your employer and how many you've survived.
const CALLERS = 'ev_work.callers'
const atCC = { job: CC_JOBS }
const atNorthLinkDesk = { job: 'job_northlink_helpdesk' }
const atLsuDesk = { job: 'job_lsu_helpdesk' }
const atMeridianDesk = { job: 'job_meridian_support' }

const callerScene: SceneDef = {
  id: 'ev_work_support_caller_scene',
  channel: 'dialog',
  title: 'The Caller',
  start: 'ring',
  nodes: {
    ring: {
      speaker: 'narrator',
      text: [
        { if: atCC, text: 'A man sets a tower on the service counter like a cat that got hit by a car. "It just died," he says. The tower smells, audibly, of orange soda. There is a straw in the floppy drive.' },
        { if: { all: [atNorthLinkDesk, { var: 'w.broadband', lte: 0 }] }, text: 'Line four. "The modem is making the noise," says a man in a voice of deep betrayal, "but it isn\'t doing the internet." Behind him, faintly, a cordless phone rings in the same room as the modem.' },
        { if: { all: [atNorthLinkDesk, { var: 'w.broadband', gte: 1 }] }, text: 'Line four. "You people told me it\'s always on," says a woman. "It is not always on. It is on when my son is asleep and off when he is awake and I think that is YOUR fault." The DSL light on her side is, in fact, green. So is her son, probably.' },
        { if: atLsuDesk, text: 'Professor Hargreave of the History department is in the Pell Hall basement in person, which is never good. "The internet button," he says. "It is gone. My grant proposal is due at five o\'clock and the internet is IN the button." He has deleted a desktop shortcut. He has done this four times this semester.' },
        { if: atMeridianDesk, text: 'Line two. Mrs. Delacroix, eighty-one, a Meridian customer since 1946. "I want to know," she says carefully, "whether the internet can see my money. My grandson says it can see everything. Is it looking at my money right now, dear?"' },
        { if: { var: CALLERS, gte: 3 }, text: 'You have done this enough times now that your voice goes into Customer Mode on its own, like a car that knows the way home.' },
        { if: onFinalWarning, text: 'Two write-ups in your file. Your supervisor is standing close enough to hear.' },
      ],
      choices: [
        {
          tag: '[Social]',
          text: 'Infinite patience. Walk them through it one tiny step at a time, and make them feel smart the whole way.',
          check: {
            skill: 'social',
            dc: 12,
            bonuses: [
              { if: { trait: 'empath' }, add: 2, label: '+2 (you hear the panic under the anger)' },
              { if: { trait: 'silver_tongue' }, add: 1, label: '+1 (silver tongue)' },
              { if: { trait: 'hothead' }, add: -2, label: '−2 (hothead)' },
            ],
            success: 'saved',
            fail: 'escalated',
            successEffects: [{ buff: GOOD_WORD }, ...bumpJob(150), { var: CALLERS, add: 1 }],
            failEffects: [{ buff: COMPLAINT }, { stat: 'stress', add: 5 }, { var: CALLERS, add: 1 }, { chance: 0.4, then: strike }],
          },
        },
        {
          tag: '[Systems]',
          text: 'Skip the script entirely and just fix the actual problem.',
          check: {
            skill: 'systems',
            dc: 14,
            bonuses: [
              { if: { background: 'tinkerer' }, add: 1, label: '+1 (basement tinkerer)' },
              { if: { skill: 'networking', gte: 20 }, add: 1, label: '+1 (you know how the pipe works)' },
            ],
            success: 'fixed',
            fail: 'broke',
            successEffects: [{ xp: 'systems', add: 30 }, ...bumpJob(100), { stat: 'mood', add: 3 }, { var: CALLERS, add: 1 }],
            failEffects: [{ buff: COMPLAINT }, ...strike, { var: CALLERS, add: 1 }],
          },
        },
        {
          if: { trait: 'hothead' },
          tag: '[Hothead]',
          text: 'Tell them, clearly and with feeling, exactly what they did.',
          effects: [{ stat: 'mood', add: 6 }, { stat: 'stress', add: -6 }, ...strike, { var: CALLERS, add: 1 }],
          goto: 'snapped',
        },
        {
          text: 'Read the script. Word for word. Let the script take the blame.',
          effects: [{ stat: 'energy', add: -3 }, { stat: 'mood', add: -2 }, { var: CALLERS, add: 1 }],
          goto: 'script',
        },
      ],
    },
    saved: {
      speaker: 'narrator',
      text: [
        { if: atCC, text: 'You open the case together. You let him pull out the straw himself. When it boots, he makes a noise like a man seeing his dog come home. He buys a keyboard cover. He writes a letter to "the manager of the kind young tech," which gets pinned to the break-room corkboard.' },
        { if: atNorthLinkDesk, text: 'Step by step: phone cord, ten seconds, back in. The noise. The other noise. The glorious silence of a connection. "Oh," they say, suddenly very small and very happy. "Oh, there it is." The survey afterward gives you five stars and the comment "WIZARD."' },
        { if: atLsuDesk, text: 'You restore the internet button, then — gently, as if handling an unexploded shell — show him how to make it himself. He does it. He does it again. At 4:52 he submits the grant and shakes your hand with both of his. His department sends Computing Services a fruit basket.' },
        { if: atMeridianDesk, text: 'You explain it the way her grandson didn\'t: the internet is a road, the bank is a vault, and you are the guard at the door who checks every name. She is quiet a long time. "That\'s a very good job, dear," she says finally. "You sound like you do it well." She writes to the branch manager. On paper. With a stamp.' },
      ],
    },
    escalated: {
      speaker: 'narrator',
      text: [
        '"I want to speak to your supervisor." You have lost them somewhere around step three, and they are not coming back. The supervisor takes the call, fixes nothing, apologizes for everything, and then comes over to your desk with a sticky note and a sigh.',
        'The complaint arrives in writing three days later. It uses the word "condescending" twice and "young person" four times. Your manager reads it aloud at the team meeting, as an example.',
      ],
    },
    fixed: {
      speaker: 'narrator',
      text: [
        'Forget the flowchart. Ninety seconds of actual thinking and the actual problem is fixed.',
        { if: atMeridianDesk, text: 'Your supervisor frowns at your call time — too short, off script — and then at the survey score, which is perfect, and decides not to mention it.', else: 'The caller doesn\'t even understand what you did. They just know it works, and that you sounded like you knew what you were talking about, which you did.' },
      ],
    },
    broke: {
      speaker: 'narrator',
      text: [
        'You go off script and off a cliff. One confident change too many, and what was a small problem is now a large one with your name attached to it in the ticket history.',
        { if: atCC, text: 'The tower that "just died" now actually has. The man wants a new one. The store gives him a new one. Your manager gives you a form.' },
        { if: { any: [atNorthLinkDesk, atMeridianDesk] }, text: 'They call back three times. Each time they get someone new, and each time they mention you by name.' },
        { if: atLsuDesk, text: 'The professor\'s grant proposal is not due at five anymore. It was due at five. His department chair calls your boss.' },
      ],
    },
    snapped: {
      speaker: 'narrator',
      text: 'You tell them. Calmly at first, then less calmly, then with a precision that would make a lawyer weep. There is a long silence on the line — or at the counter — and then they say, very quietly, "...okay." It is the best ninety seconds of your working life. It is going in your file.',
    },
    script: {
      speaker: 'narrator',
      text: 'You read the script. "Have you tried turning it off and on again. I understand your frustration. Is there anything else I can help you with today." It works, eventually, the way water works on stone. Your soul leaves your body around step nine and returns at lunch, looking tired.',
    },
  },
}

const supportCaller: EventDef = {
  id: 'ev_work_support_caller',
  category: 'work',
  weight: 3,
  repeatable: true,
  cooldownDays: 84,
  when: { all: [{ jobTrack: 'support' }, free] },
  scene: 'ev_work_support_caller_scene',
}

// ── ev_work_nl_retention ──────────────────────────────────────────────────────
// The Save Desk script versus a widow who wants to cancel her late husband's line.
const retentionScene: SceneDef = {
  id: 'ev_work_nl_retention_scene',
  channel: 'dialog',
  title: 'The Save Desk',
  start: 'call',
  nodes: {
    call: {
      speaker: 'narrator',
      text: [
        'NorthLink has a new memo: every cancellation now goes through the Save Desk script — three retention offers, then the early termination fee. Retention rates go up on the whiteboard every Friday. Yours is in the middle, in green marker.',
        'Line six. "Hello? I\'m sorry to bother you." Mrs. Irene Hallorann, seventy-four. The account is in her husband\'s name. Walter. He passed in March. She doesn\'t use the computer; she never did. She\'d just like to stop paying for it, please, if that\'s all right.',
        'Your screen says the contract has fourteen months left. Early termination fee: $180.',
        { if: { faction: 'fac.hood', gte: 20 }, text: 'You know the name. Hallorann — she runs the raffle at St. Brendan\'s on Cannery Row. She sold your mother a ticket last spring.' },
      ],
      choices: [
        {
          text: 'Follow the script. Three offers, then the fee. That\'s the job.',
          effects: [{ money: 25 }, ...bumpJob(120), { faction: 'fac.hood', add: -3 }, { stat: 'mood', add: -6 }],
          goto: 'scripted',
        },
        {
          tag: '[Systems]',
          text: 'There\'s a "deceased account holder" waiver code, buried four menus deep. Find it and use it.',
          check: {
            skill: 'systems',
            dc: 13,
            bonuses: [{ if: { skill: 'networking', gte: 20 }, add: 1, label: '+1 (you know NorthLink\'s billing box)' }],
            success: 'waived',
            fail: 'audit',
            successEffects: [{ faction: 'fac.hood', add: 3 }, { stat: 'mood', add: 5 }],
            failEffects: [...strike, { stat: 'stress', add: 6 }],
          },
        },
        {
          tag: '[Business]',
          text: 'Take it to your supervisor with numbers: a dead man\'s account is a liability, not a save.',
          check: {
            skill: 'business',
            dc: 14,
            bonuses: [{ if: { trait: 'silver_tongue' }, add: 1, label: '+1 (silver tongue)' }],
            success: 'policy',
            fail: 'overruled',
            successEffects: [{ faction: 'fac.hood', add: 2 }, ...bumpJob(200), { flag: 'ev_work.nl_bereavement_policy' }],
            failEffects: [...strike, { stat: 'mood', add: -4 }],
          },
        },
      ],
    },
    scripted: {
      speaker: 'narrator',
      text: [
        'Offer one: a free month. Offer two: a faster plan. Offer three: a discount, "just for you, Mrs. Hallorann." By the third she\'s confused and apologetic and says, "All right, dear, if you think that\'s best," and keeps paying for a line that nobody will ever dial.',
        'Your retention rate goes up on the whiteboard in green marker. Friday, there\'s a pizza. You don\'t eat any.',
      ],
    },
    waived: {
      speaker: 'narrator',
      text: [
        'Billing, then Adjustments, then Special, then a menu called OTHER (LEGACY) that nobody has opened since the Clinton administration. There it is: WAIVER — DECEASED. You key it in. The fee turns to zero. The account closes.',
        '"Oh," she says. "Oh, that\'s very kind. Walter would have liked you. He liked people who knew where things were." A week later a card arrives at NorthLink addressed to "the nice young man, or woman, on the telephone." Somebody tapes it to the break-room fridge. Nobody knows it\'s yours. You do.',
      ],
    },
    audit: {
      speaker: 'narrator',
      text: [
        'You find a waiver code. It is the wrong waiver code — the one for "service outage credit, commercial" — and it trips a fraud flag in an office in another city. Denise, your supervisor, is at your desk before you\'ve hung up her next call.',
        '"You don\'t freelance the billing system," she says. The fee gets reapplied. Someone will have to call Mrs. Hallorann back and tell her. Denise looks at you. It will be you.',
      ],
      next: 'fee_stands',
    },
    policy: {
      speaker: 'Denise',
      text: [
        'Denise reads your numbers — chargebacks, complaint rates, the time a dead man\'s son called the Lumen Ledger — and rubs her temples. "Nobody tells me anything useful. You just told me something useful."',
        'She waives the fee herself, then emails Regional. By the next memo, the Save Desk script has a new first line: "Is this account holder deceased?" It isn\'t much. It\'s a line in a script. It\'s going to save somebody\'s grandmother a hundred and eighty dollars every week for years.',
      ],
    },
    overruled: {
      speaker: 'Denise',
      text: '"Your numbers are my numbers," Denise says, not unkindly. "My numbers go on Regional\'s whiteboard. You don\'t get to decide which saves count." She writes it up — "script deviation" — and hands you the phone back. The fee stands.',
      next: 'fee_stands',
    },
    fee_stands: {
      speaker: 'narrator',
      text: 'Mrs. Hallorann is still on hold, humming along to the hold music, which is a synthesizer version of a song her husband probably danced to. A hundred and eighty dollars.',
      choices: [
        {
          req: { stat: 'money', gte: 180 },
          reqText: 'Requires $180',
          tag: '[$180]',
          text: 'Pay her fee yourself with a money order. Tell her it was "a courtesy credit."',
          effects: [{ money: -180 }, { faction: 'fac.hood', add: 3 }, { stat: 'mood', add: 4 }],
          goto: 'paid_it',
        },
        {
          text: 'Tell her about the fee. Listen to her say "that\'s all right, dear."',
          effects: [{ stat: 'mood', add: -5 }, { faction: 'fac.hood', add: -1 }],
          goto: 'told_her',
        },
      ],
    },
    paid_it: {
      speaker: 'narrator',
      text: 'The money order costs you a dollar-fifty at the post office and most of a week\'s groceries. On the form, under "memo," you write COURTESY CREDIT. It is the best lie you\'ve ever told, and nobody will ever know you told it.',
    },
    told_her: {
      speaker: 'narrator',
      text: '"That\'s all right, dear," she says, exactly as you knew she would. "Walter always said the phone company gets you coming and going." She thanks you for your time. She means it. You take the next call, and the next, and at the end of the shift you sit in the parking lot for a long while before you start the car.',
    },
  },
}

const nlRetention: EventDef = {
  id: 'ev_work_nl_retention',
  category: 'work',
  weight: 3,
  when: { all: [{ job: 'job_northlink_helpdesk' }, free] },
  scene: 'ev_work_nl_retention_scene',
}

export default defineContent({
  scenes: [dogScene, cathodeScene, libraryScene, rushScene, callerScene, retentionScene],
  events: [pikeStreetDog, cathodeInspector, libraryGhost, ccHolidayRush, supportCaller, nlRetention],
})
