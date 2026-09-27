/**
 * events_city — WEATHER & THE BODY. Port Lumen's seasons, and what they do to a person with a rig.
 *
 *  - ev_city_ice_storm   one-off, winter, Act II–III (2004+): three days without power on the Row.
 *  - ev_city_heat_wave   repeatable, July–August: the rig cooks, and so do you.
 *  - ev_city_fun_run     repeatable, spring: the Harbor Point General charity 5K.
 *
 * HARD RULE: no real techniques; all people and organizations are invented.
 */
import { defineContent } from '@/engine/registry'
import type { BuffDef, EventDef, SceneDef } from '@/engine/types'
import {
  CIVIC_PRIDE,
  COLD_SNAP,
  HEAT_MISERY,
  WELL_FED,
  actGte,
  actLte,
  around,
  atParents,
  buff,
  cooledHousing,
  costByAct,
  darkTurn,
  free,
  fromDate,
  momHere,
  onRow,
  partnerAff,
  partnerIs,
  partnerLines,
  salHere,
  spring,
  summer,
  winter,
  withPartner,
} from './_shared'

// ── Local buffs ────────────────────────────────────────────────────────────────

const BROKEN_WRIST: BuffDef = {
  id: 'ev_city_broken_wrist',
  name: 'Wrist in a Cast',
  desc: 'You type one-handed and slowly, with the cast propped on a paperback. Everything takes longer, and the itch under the plaster is a kind of weather of its own.',
  days: 35,
  bad: true,
  mods: [{ key: 'efficiency', mult: 0.9 }, { key: 'energy.drain', mult: 1.05 }, { key: 'hack.speed', mult: 0.9 }],
}

const ICE_BOX: BuffDef = {
  id: 'ev_city_ice_box',
  name: 'Swamp-Cooled',
  desc: 'Box fan, a tray of ice, a length of dryer hose and faith. It\'s ugly, it drips, and your corner of the heat wave is somehow bearable.',
  days: 14,
  mods: [{ key: 'efficiency', mult: 1.03 }, { key: 'stress.gain', mult: 0.96 }],
}

const RUNNERS_HIGH: BuffDef = {
  id: 'ev_city_runners_high',
  name: 'Runner\'s High',
  desc: 'You ran five kilometers on purpose, in public, and survived. Your lungs have opinions and your sleep has never been better.',
  days: 21,
  mods: [{ key: 'energy.regen', mult: 1.05 }, { key: 'mood.daily', add: 0.3 }],
}

const SHIN_SPLINTS: BuffDef = {
  id: 'ev_city_shin_splints',
  name: 'Shin Splints',
  desc: 'Every step down the stairs is a small lecture from your shins about the difference between ambition and training.',
  days: 21,
  bad: true,
  mods: [{ key: 'energy.drain', mult: 1.08 }, { key: 'mood.daily', add: -0.2 }],
}

// ── ev_city_ice_storm ──────────────────────────────────────────────────────────

const iceStormScene: SceneDef = {
  id: 'ev_city_ice_storm_scene',
  channel: 'dialog',
  title: 'The Ice Storm',
  start: 'dark',
  nodes: {
    dark: {
      speaker: 'narrator',
      text: [
        'The freezing rain starts on a Thursday and doesn\'t stop. By Friday night every tree on Cannery Row is wearing an inch of glass, and at 11:14 p.m. a branch the size of a car takes the power line down on Fifth with a flash that lights up the whole Sound.',
        'By Sunday the power is back in Harbor Point, back in Millgate, back — the radio says — at the new server campus "within four hours, thanks to redundant feeds." The Row gets a recorded message. The recorded message says "crews are working." The crews are working in Harbor Point.',
        { if: around('grandma_ruth'), text: 'Ruth Alvarez, three doors down, is seventy-eight, lives alone, and hasn\'t answered her phone since yesterday.' },
        'The Row has old people, space heaters that won\'t heat, and a lot of candles. It also has you.',
      ],
      choices: [
        {
          tag: '[Fitness]',
          text: 'Go door to door on the ice. Check on everyone who lives alone — carry water, carry blankets, carry people if you have to.',
          check: {
            skill: 'fitness',
            dc: 13,
            bonuses: [
              { if: { trait: 'gym_rat' }, add: 2, label: '+2 (gym rat)' },
              { if: { trait: 'glass_cannon' }, add: -2, label: '−2 (glass cannon)' },
              { if: onRow(30), add: 1, label: '+1 (you know every door on the Row)' },
            ],
            success: 'rounds',
            fail: 'fall',
            successEffects: [
              { trait: 'ev_city_scar_storm_hardened' },
              { faction: 'fac.hood', add: 6 },
              { stat: 'energy', add: -25 },
              { if: around('grandma_ruth'), then: [{ npc: 'grandma_ruth', affinity: 6 }] },
            ],
            failEffects: [
              { stat: 'health', add: -15 },
              buff(BROKEN_WRIST),
              { faction: 'fac.hood', add: 3 },
              { flag: 'ev_city.storm_fall' },
              { complication: 'health', tier: 1 },
            ],
          },
        },
        {
          tag: '[Hardware]',
          text: 'A car battery, an inverter and every power strip you own: build the Row a charging station. Mrs. Castellano\'s oxygen machine has four hours of battery left.',
          check: {
            skill: 'hardware',
            dc: 14,
            bonuses: [{ if: { background: 'tinkerer' }, add: 2, label: '+2 (you\'ve built worse out of less)' }],
            success: 'station',
            fail: 'cooked',
            successEffects: [{ faction: 'fac.hood', add: 8 }, { xp: 'hardware', add: 30 }, buff(CIVIC_PRIDE)],
            failEffects: [costByAct(150, 350), { stat: 'stress', add: 10 }, { faction: 'fac.hood', add: 2 }, { flag: 'ev_city.castellano_ambulance' }],
          },
        },
        {
          if: salHere,
          text: 'Pack up the laptop and ride it out at the Cathode. Sal will have the gas griddle going. Sal always has the gas griddle going.',
          effects: [buff(WELL_FED), { faction: 'fac.hood', add: 2 }, { npc: 'sal', affinity: 3 }, { money: -15 }],
          goto: 'cathode',
        },
        {
          tag: '[Leave]',
          text: 'Blankets, candles, the door locked. Wait for the lights.',
          effects: [buff(COLD_SNAP), { stat: 'mood', add: -5 }, { faction: 'fac.hood', add: -2 }],
          goto: 'wait',
        },
      ],
    },
    rounds: {
      speaker: 'narrator',
      text: [
        'You do the whole Row twice a day for three days, on ice so slick the sidewalks shine like a rink. You carry water up to the fourth floor of the Marchetti building. You find the Lindqvists wrapped in the same quilt, playing gin rummy by flashlight, and they make you play three hands before you\'re allowed to leave.',
        { if: around('grandma_ruth'), text: 'Ruth is fine — she had simply unplugged the phone because it "wouldn\'t stop ringing about the weather." She is also furious that you were worried, and makes you drink a cup of cocoa she heats over a candle with a patience that borders on witchcraft.' },
        'On the third night the lights come back all at once, the whole Row flickering on like a birthday cake. People come out onto their steps and cheer. Somebody starts shouting your name. It catches.',
      ],
    },
    fall: {
      speaker: 'narrator',
      text: [
        'You make it to four doors before the ice takes you. One moment you\'re carrying two gallons of water up the steps of the Marchetti building; the next you\'re on your back, looking at the frozen sky, and your left wrist is bending in a direction wrists do not bend.',
        {
          if: { all: [partnerIs('grace'), withPartner] },
          text: 'Grace sets it herself in the Harbor General ER, furious and gentle at the same time, talking the whole way through so you don\'t look. "You went out on the ice," she says, "to carry water to strangers." A pause. "Of course you did. Hold still."',
          else: 'Harbor General\'s ER is full of people who slipped on the ice. You wait six hours with your wrist in a bag of snow. The cast is blue. The bill will be worse.',
        },
        'The Row doesn\'t forget that you went out, though. By the time the power comes back there are three casseroles on your step and a get-well card signed by the entire second floor of the Marchetti building.',
      ],
    },
    station: {
      speaker: 'narrator',
      text: [
        'The Cathode\'s delivery van battery, an inverter from the back of Dad\'s closet, a bag of power strips, and an extension cord run through the laundromat window: by midnight the corner of Cannery and Fifth is the only lit place for a mile.',
        'Mrs. Castellano\'s oxygen machine runs all night. People charge phones, warm baby bottles, and one very determined man plugs in a slow cooker. For three days the whole Row takes turns sitting in folding chairs around a humming box you built, telling stories in the dark. It\'s the best party the Row has had in years, and nobody wants the lights to come back.',
      ],
    },
    cooked: {
      speaker: 'narrator',
      text: [
        'You get it wired. It runs for twenty minutes. Then the inverter makes a sound like a kettle having a nightmare, and a smell comes out of it like burnt hair and bad decisions, and the whole thing goes dark.',
        'Mrs. Castellano goes to Harbor General in an ambulance with its lights going. She\'s fine — the paramedics say she\'d have been fine either way — but she holds your hand all the way to the ambulance doors, and you replace everything you fried with money you had been saving for something else.',
      ],
    },
    cathode: {
      speaker: 'sal',
      text: [
        '"Power\'s out, so everything\'s a dollar," Sal announces to a diner full of candlelight and half the Row. "Everything except the pie. The pie is still the pie."',
        'You spend three days in the back booth, working on battery until it dies and then just sitting, listening to Sal argue with the radio and feed the entire neighborhood off one gas griddle. When the power comes back, a cheer goes up, and Sal looks, for just a second, disappointed.',
      ],
    },
    wait: {
      speaker: 'narrator',
      text: [
        'You lock the door. You wait. For three days you sleep in your coat, read by candle, and listen to the ice creak in the trees, and the Row goes by outside your window without you.',
        'When the lights come back, you hear that the Lindqvists spent two nights at the Cathode and Mrs. Castellano went to Harbor General in an ambulance. Everyone is fine. You weren\'t anywhere in the story of how.',
      ],
    },
  },
}

const iceStorm: EventDef = {
  id: 'ev_city_ice_storm',
  category: 'city',
  weight: 2,
  when: { all: [free, winter, fromDate(2004, 0, 1), actGte(2), actLte(3)] },
  scene: 'ev_city_ice_storm_scene',
}

// ── ev_city_heat_wave (repeatable) ─────────────────────────────────────────────

const heatWaveScene: SceneDef = {
  id: 'ev_city_heat_wave_scene',
  channel: 'dialog',
  title: 'Heat Wave',
  start: 'heat',
  nodes: {
    heat: {
      speaker: 'narrator',
      text: [
        'The Sound goes flat as a plate and the fog forgets to come in. For eight days straight Port Lumen sits under a sky the colour of a hot sidewalk, and the whole city smells like tar and low tide.',
        { if: { all: [atParents, momHere] }, text: 'At home, Mom has closed every curtain and is standing in front of the open fridge "just for a minute," which has been going on for forty minutes. Dad has taken the box fan hostage.' },
        { if: { housing: 'studio_flat' }, text: 'The studio holds heat like a kiln. The neon outside the window is somehow hot. You sleep on the floor, which is two degrees cooler, next to the rig, which is ten degrees hotter.' },
        { if: { housing: 'harbor_loft' }, text: 'The loft\'s beautiful tall windows turn out to have a second career as a greenhouse. The exposed brick is warm to the touch at 3 a.m.' },
        { if: { item: 'ev_city_cat' }, text: '{flag:ev_city.cat_name} has abandoned the top of the monitor for the bathroom tiles, and regards you, personally, as responsible for the weather.' },
        'Your rig\'s fans are screaming like a kettle. Twice this week it\'s shut itself down mid-job out of what you can only assume is self-respect.',
      ],
      choices: [
        {
          tag: '[Hardware]',
          text: 'Build a cooling rig: box fan, a tray of ice, a length of dryer hose, and faith.',
          check: {
            skill: 'hardware',
            dc: 12,
            bonuses: [
              { if: { background: 'tinkerer' }, add: 2, label: '+2 (you\'ve been waiting your whole life to build this)' },
              { if: { trait: 'caffeine_fiend' }, add: 1, label: '+1 (you have a lot of ice, for coffee reasons)' },
            ],
            success: 'swamp',
            fail: 'puddle',
            successEffects: [buff(ICE_BOX), { xp: 'hardware', add: 15 }, { stat: 'mood', add: 4 }],
            failEffects: [costByAct(150, 300), buff(HEAT_MISERY), { stat: 'stress', add: 6 }],
          },
        },
        {
          if: salHere,
          text: 'Move your whole week into the Cathode\'s back booth. Sal\'s air conditioner is from 1979 and it is a god.',
          effects: [{ money: -25 }, buff(WELL_FED), { npc: 'sal', affinity: 2 }],
          goto: 'cathode',
        },
        {
          if: around('kim'),
          text: 'Take Kim to the public beach on the Sound. Work can melt on its own.',
          effects: [{ npc: 'kim', affinity: 5 }, { stat: 'mood', add: 8 }, { stat: 'stress', add: -8 }, { stat: 'energy', add: -8 }],
          goto: 'beach',
        },
        {
          text: 'Volunteer at the library cooling center. Somebody has to hand out water to the old folks.',
          effects: [{ faction: 'fac.hood', add: 3 }, { stat: 'stress', add: 4 }, buff(CIVIC_PRIDE)],
          goto: 'library',
        },
      ],
    },
    swamp: {
      speaker: 'narrator',
      text: [
        'It is the ugliest object you have ever built. It drips. It hums. It looks like a robot that\'s given up. It blows air across the ice and down a dryer hose directly into the rig\'s intake, and the fans slow from a scream to a sigh.',
        { if: { all: [atParents, momHere] }, text: 'Mom is so impressed she asks you to build a second one for the kitchen. Dad pretends to find it ridiculous and is caught asleep in front of it by noon.' },
        'For the rest of the heat wave, your corner of the city is the only bearable place in it.',
      ],
    },
    puddle: {
      speaker: 'narrator',
      text: [
        'It works for an afternoon. Then the ice melts, as ice will, and finds the power strip, as water does. There is a pop, a smell like a struck match, and the rig goes silent in a way that means the power supply is now a paperweight.',
        'The replacement costs real money and a sweaty bus ride to the store. You spend the rest of the heat wave with a wet towel on your neck, cooking slowly, like everybody else.',
      ],
    },
    cathode: {
      speaker: 'sal',
      text: [
        '"I don\'t run a library," Sal says, when you set up the laptop in the back booth. He brings you an iced tea. "I run a restaurant." He brings you a sandwich. "You gotta order something every two hours." He never checks.',
        'The whole Row seems to have the same idea. By Thursday every booth is full of people working, reading, napping, doing crossword puzzles and not buying anything, and Sal pretends to be furious about all of them.',
      ],
    },
    beach: {
      speaker: 'kim',
      text: [
        { if: actLte(2), text: 'Kim spends four hours in the water and comes out only to eat a hot dog and tell you about a boy in her grade who is "SO annoying," which is a word she says like it means something else. You pretend not to notice.', else: 'Kim drives, these days. She drives you both to the beach with the windows down and the radio loud, and for one afternoon she isn\'t your little sister so much as the person you trust most to tell you the truth.' },
        '"You should do this more," she says on the way home, sunburnt, sticky, half asleep. "Be a person. It\'s nice. You\'re nicer."',
      ],
    },
    library: {
      speaker: 'narrator',
      text: [
        'The Millgate branch library has the only reliable air conditioning on this side of the city and a librarian who has decided, on her own authority, that it is now a shelter. You hand out water and paper fans to a room full of grandmothers, toddlers, and one man who has brought his parrot.',
        'You leave every evening exhausted and sunburnt from the walk home. Three separate grandmothers now call you "the nice one," and one of them has told her grandson to marry you. He is eleven.',
      ],
    },
  },
}

const heatWave: EventDef = {
  id: 'ev_city_heat_wave',
  category: 'city',
  weight: 1.5,
  repeatable: true,
  cooldownDays: 330,
  when: { all: [free, summer, { not: cooledHousing }, { day: true, gte: 200 }] },
  scene: 'ev_city_heat_wave_scene',
}

// ── ev_city_fun_run (repeatable) ───────────────────────────────────────────────

const funRunScene: SceneDef = {
  id: 'ev_city_fun_run_scene',
  channel: 'dialog',
  title: 'The Harbor Point 5K',
  start: 'start',
  nodes: {
    start: {
      speaker: 'narrator',
      text: [
        'Every spring, Harbor Point General runs a charity 5K along the Sound: five kilometers of seawall, a brass band that knows two songs, and several hundred people in matching T-shirts who all, individually, regret it at kilometer three.',
        ...partnerLines(
          'Mira has signed you both up without asking, "as a benchmark." She has a training spreadsheet. The spreadsheet has your name in it, in red.',
          'Grace is working the medical tent, and has signed you up, and has made it clear that if you collapse she will treat you in front of her whole department and never, ever let it go.',
        ),
        { if: { all: [{ not: withPartner }, around('dee')] }, text: 'Dee Briggs is captain of a team called "Briggs\' Bench Warmers," and you are on it, and she did not ask, and she already ordered your shirt.' },
        { if: { all: [{ not: withPartner }, { not: around('dee') }, around('jax')] }, text: 'Jax bet you twenty dollars you couldn\'t finish it. You took the bet before you were fully awake.' },
        { if: { all: [{ not: withPartner }, { not: around('dee') }, { not: around('jax') }] }, text: 'A flyer on the laundromat corkboard said EVEN YOU CAN DO IT, and you took that personally.' },
        { if: darkTurn, text: 'This year the T-shirts say PORT LUMEN: STRONGER TOGETHER, and a sponsor\'s logo on the back you don\'t recognize, a clean little circle with a dot in it.' },
      ],
      choices: [
        {
          tag: '[Fitness]',
          text: 'Run it. All five kilometers. No walking.',
          check: {
            skill: 'fitness',
            dc: 12,
            bonuses: [
              { if: { trait: 'gym_rat' }, add: 2, label: '+2 (gym rat)' },
              { if: { trait: 'glass_cannon' }, add: -2, label: '−2 (glass cannon)' },
              { if: { trait: 'night_owl' }, add: -1, label: '−1 (the start gun is at 7 a.m.)' },
              { if: { trait: 'ev_city_scar_storm_hardened' }, add: 1, label: '+1 (you\'ve run on ice; this is just pavement)' },
            ],
            success: 'finished',
            fail: 'tent',
            successEffects: [buff(RUNNERS_HIGH), { stat: 'health', add: 5 }, { faction: 'fac.hood', add: 2 }, { xp: 'fitness', add: 20 }],
            failEffects: [buff(SHIN_SPLINTS), { stat: 'health', add: -5 }, { stat: 'mood', add: -4 }, { flag: 'ev_city.fun_run_photo' }],
          },
        },
        {
          text: 'Work the water table at kilometer three. Somebody has to hand the cups to the regret.',
          effects: [{ faction: 'fac.hood', add: 3 }, { stat: 'energy', add: -6 }, { stat: 'mood', add: 3 }],
          goto: 'water',
        },
        {
          text: 'Sponsor the Row\'s team and cheer from the seawall with a coffee.',
          req: { stat: 'money', gte: 50 },
          reqText: 'Requires $50',
          effects: [{ money: -50 }, { faction: 'fac.hood', add: 1 }, { stat: 'mood', add: 2 }],
          goto: 'cheer',
        },
        {
          tag: '[Leave]',
          text: 'Sleep in. The Sound will still be there next year.',
          effects: [{ stat: 'energy', add: 6 }, { if: withPartner, then: [partnerAff(-2)] }],
          goto: 'slept',
        },
      ],
    },
    finished: {
      speaker: 'narrator',
      text: [
        'Kilometer one: easy. Kilometer two: fine. Kilometer three: a conversation with God. Kilometer four: the brass band plays the same song for the fifth time and it lifts you like a hand in the back. Kilometer five: you cross the line at a pace that is best described as "technically running."',
        ...partnerLines(
          'Mira finishes forty seconds ahead of you, turns around, and checks her watch. "Within tolerance," she says, which from her is a medal.',
          'Grace is waiting at the finish with a paper cup of water and a look of enormous, professional pride. "Pupils equal, breathing ragged, color good," she says. "Congratulations. You\'re alive."',
        ),
        'Somebody hangs a cheap medal around your neck. You wear it for the rest of the day and pretend it\'s a joke.',
      ],
    },
    tent: {
      speaker: 'narrator',
      text: [
        'At kilometer two your shins file a formal complaint. At kilometer three they go on strike. You finish the last stretch in the medical tent, lying on a cot with ice packs taped to both legs, while children who are nine and ten jog past the tent flap eating ice pops.',
        {
          if: { all: [partnerIs('grace'), withPartner] },
          text: 'Grace treats you herself, in front of her entire department. She is very gentle. She is also, the whole time, visibly trying not to laugh, and failing, and so is everyone else in the tent.',
          else: 'The nurse who treats you is kind and brisk and says, "First one?" in a tone that suggests she can always tell.',
        },
        'Somebody takes a photo: you on the cot, a medal someone gave you out of pity around your neck, both thumbs up. By next week it\'s pinned to the corkboard at the Cathode with the caption OUR CHAMPION.',
      ],
    },
    water: {
      speaker: 'narrator',
      text: [
        'You hand out eight hundred cups of water in forty minutes. Half of them are thrown back at you by accident. By the end your shoes are soaked, you\'ve been thanked by a man dressed as a lobster, and three separate runners have gasped "bless you" at you like you\'re a saint.',
        'It is, honestly, a lot more fun than running.',
      ],
    },
    cheer: {
      speaker: 'narrator',
      text: [
        'You sponsor the Row\'s team — eleven people, average age sixty-three, in shirts that say CANNERY ROW RUNS ON COFFEE — and cheer from the seawall with a hot cup of your own.',
        { if: momHere, text: 'Mom is on the team. You did not know Mom could run. Mom cannot, it turns out, run, but she walks the entire five kilometers at a terrifying pace, passes three people half her age, and refuses to discuss it.' },
      ],
    },
    slept: {
      speaker: 'narrator',
      text: [
        'You sleep in. It\'s wonderful. At noon you see the photos: the whole city on the seawall, sunburnt and laughing, a brass band, a man dressed as a lobster.',
        ...partnerLines(
          'Mira sends you a single text: her finish time, followed by "unopposed."',
          'Grace sends you a photo of the medical tent with an empty cot circled in red marker. "Saved you a spot," it says.',
        ),
      ],
    },
  },
}

const funRun: EventDef = {
  id: 'ev_city_fun_run',
  category: 'health',
  weight: 1,
  repeatable: true,
  cooldownDays: 330,
  when: { all: [free, spring, { day: true, gte: 200 }] },
  scene: 'ev_city_fun_run_scene',
}

export default defineContent({
  scenes: [iceStormScene, heatWaveScene, funRunScene],
  events: [iceStorm, heatWave, funRun],
})
