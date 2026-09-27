/**
 * events_city — CANNERY ROW & THE CATHODE. The neighbors, the diner, the building, the street.
 *
 *  - ev_city_the_usual        repeatable, all acts: a night at Sal's counter (jukebox, tabs, advice, pie).
 *  - ev_city_cold_snap        one-off, Act I–II winter: the building's boiler dies; fix it, or organize
 *                             the tenants — a mini-arc (`ev_city_q_cold_snap`) that ends with the landlord.
 *  - ev_city_stray_cat        one-off, Act I–II: a grey cat adopts your monitor.
 *  - ev_city_night_counter    one-off, Act III–IV: Sal asks you to mind the Cathode overnight.
 *  - ev_city_last_payphone    one-off, Act IV: the city takes out the last payphone on the Row.
 *  - ev_city_help_me_move     one-off, Act I–III: Jax needs your arms on Saturday.
 *
 * HARD RULE: no real techniques; every neighbor, landlord and business here is invented.
 */
import { defineContent } from '@/engine/registry'
import type { BuffDef, EventDef, ItemDef, QuestDef, SceneDef } from '@/engine/types'
import {
  CIVIC_PRIDE,
  COLD_SNAP,
  THROWN_BACK,
  WELL_FED,
  actGte,
  actIs,
  actLte,
  around,
  atParents,
  buff,
  byPartner,
  close,
  darkTurn,
  dataCampus,
  free,
  fromDate,
  momGone,
  momHere,
  onRow,
  partnerIs,
  salHere,
  stillLight,
  surveilled,
  winter,
  withPartner,
} from './_shared'

// ── Local buffs ────────────────────────────────────────────────────────────────

const EARWORM: BuffDef = {
  id: 'ev_city_earworm',
  name: 'Blue Moon (on Repeat)',
  desc: 'The Cathode\'s jukebox now plays exactly one song, and so, it turns out, does your brain. At 3 a.m. Weeks of it.',
  days: 21,
  bad: true,
  mods: [{ key: 'efficiency', mult: 0.97 }, { key: 'mood.daily', add: -0.2 }],
}

const BLACK_EYE: BuffDef = {
  id: 'ev_city_black_eye',
  name: 'Black Eye',
  desc: 'A shiner the colour of a bruised plum. People on the street take one look and decide not to ask you anything.',
  days: 14,
  bad: true,
  mods: [{ key: 'check.social', add: -1 }, { key: 'health.daily', add: -0.2 }],
}

// ── Items ──────────────────────────────────────────────────────────────────────

const items: ItemDef[] = [
  {
    id: 'ev_city_cat',
    name: 'The Cat on the Monitor',
    category: 'misc',
    shop: 'life',
    price: 0,
    unique: true,
    hidden: true,
    upkeepPerDay: 1,
    tier: 0,
    desc: [
      'Grey, the colour of a dead pixel, one ear with a notch in it. She sleeps on the warm top of whatever monitor you own and flicks her tail across the screen at the exact moment you need to read it.',
      'She costs a dollar a day in food and a certain amount of dignity. She is worth both.',
    ],
    mods: [{ key: 'mood.daily', add: 0.25 }, { key: 'stress.relief', mult: 1.04 }],
  },
  {
    id: 'ev_city_payphone_handset',
    name: 'The Last Payphone Handset',
    category: 'misc',
    shop: 'life',
    price: 0,
    unique: true,
    hidden: true,
    tier: 0,
    desc: 'A heavy black handset on a steel-armored cord, salvaged from the corner of Cannery and Fifth. It doesn\'t connect to anything anymore. When you hold it to your ear you can still hear the Row, a little.',
    mods: [{ key: 'mood.daily', add: 0.15 }],
  },
]

// ── ev_city_the_usual — a night at Sal's counter (repeatable) ────────────────────

const theUsualScene: SceneDef = {
  id: 'ev_city_the_usual_scene',
  channel: 'dialog',
  title: 'The Usual',
  start: 'counter',
  nodes: {
    counter: {
      speaker: 'narrator',
      text: [
        'The Cathode at an hour that isn\'t on any clock. The overpass hums, the neon buzzes pink across the counter, and Sal slides a coffee at you before you\'ve finished sitting down.',
        { if: actIs(1), text: '"You look like a dropped call," he says, which is how he says hello. The jukebox is playing something from 1978 with a skip in it that every regular has learned to hum around.' },
        { if: { all: [actIs(2), stillLight] }, text: 'The booths are full of kids in startup T-shirts arguing about stock options they don\'t have yet. Sal charges them for refills. He has never once charged you for a refill.' },
        { if: { all: [darkTurn, actLte(3)] }, text: 'It\'s quieter than it used to be. Two men in good coats have been nursing one coffee each in the back booth for an hour. Sal doesn\'t look at them in a way that is extremely loud.' },
        { if: actGte(4), text: 'Sal\'s hair has gone the colour of the coffee creamer. He still moves behind the counter like a man thirty years younger, but he sits down more now, and he\'s stopped pretending he doesn\'t.' },
        { if: onRow(20), text: 'Your stool at the end of the counter is empty. It is always empty when you come in. You have never once seen anybody asked to move.' },
        { if: { flag: 'ev_city.cathode_keys' }, text: 'You have your own key now. Some mornings you let yourself in at five and have the coffee going before Sal gets there. He pretends to be annoyed about it. He\'s started coming in at five-fifteen.' },
        { if: { flag: 'ev_city.called_police_on_row' }, text: 'Sal\'s a little careful with you since the night you called the police on Frank Mazur. He still pours your coffee. He just doesn\'t lean on the counter to talk while he does it.' },
        { if: { flag: 'ev_city.whitcombe_loan' }, text: 'The new walk-in freezer hums in the back with your name on its door in black marker. Sal shows it to everyone. "Meridian money," he says, amazed, every time, "south of the overpass."' },
        { if: { flag: 'ev_city.fun_run_photo' }, text: 'The photo of you on the medical-tent cot is still on the corkboard by the register. OUR CHAMPION. Someone has added a gold star.' },
        { if: { flag: 'ev_city.write_in' }, text: '"Evening, Mayor," says Sal, as he has every single time since the write-in results. He will never stop.' },
        { if: { any: [{ flag: 'ev_city.poll_photo' }, { flag: 'ev_city.on_channel_six' }] }, text: '"Saw you on Channel 6," says the cab driver at the end of the counter, not for the first time. Sal tells him to eat his eggs.' },
        { if: { flag: 'ev_city.keel_won' }, text: 'Leonard Keel came in once, last winter. Sal served him decaf without telling him and charged him for regular. The whole Row knows.' },
        { if: { flag: 'ev_city.blue_moon_jukebox' }, text: 'The jukebox is still playing "Blue Moon." It has played "Blue Moon" since the night you fixed it. The regulars have formed opinions. Mr. Pruszynski has never been happier.' },
      ],
      next: 'sal',
    },
    sal: {
      speaker: 'sal',
      text: [
        '"Something\'s wrong with the jukebox. Something\'s wrong with the register. Something\'s wrong with me, but the doctor says it\'s cholesterol and I say it\'s the doctor." He tops you up. "Pick one, genius."',
      ],
      choices: [
        {
          tag: '[Hardware]',
          text: 'Pop the back off the jukebox and see what forty years of fry grease has done to it.',
          check: {
            skill: 'hardware',
            dc: 11,
            bonuses: [
              { if: { background: 'tinkerer' }, add: 2, label: '+2 (you took apart your first radio at nine)' },
              { if: { flag: 'ev_city.blue_moon_jukebox' }, add: 1, label: '+1 (you know this machine\'s grudges now)' },
            ],
            success: 'jukebox_fixed',
            fail: 'jukebox_blue',
            successEffects: [
              { faction: 'fac.hood', add: 2 },
              { npc: 'sal', affinity: 3 },
              { xp: 'hardware', add: 15 },
              { clearFlag: 'ev_city.blue_moon_jukebox' },
              { removeBuff: 'ev_city_earworm' },
              buff(WELL_FED),
            ],
            failEffects: [
              { flag: 'ev_city.blue_moon_jukebox' },
              { npc: 'sal', affinity: -2 },
              { money: -40 },
              buff(EARWORM),
            ],
          },
        },
        {
          text: 'Cover the tab for the kid in the corner booth — the one counting out coins for a grilled cheese.',
          effects: [
            { money: -12 },
            { faction: 'fac.hood', add: 2 },
            { var: 'ev_city.tabs_covered', add: 1 },
            { if: { var: 'ev_city.tabs_covered', gte: 3 }, then: [{ trait: 'ev_city_scar_soft_touch' }] },
          ],
          goto: 'tab',
        },
        {
          if: { stat: 'stress', gte: 35 },
          text: '"Sal. What would you do?" You don\'t say about what. He doesn\'t ask.',
          effects: [{ stat: 'stress', add: -12 }, { npc: 'sal', affinity: 2 }],
          goto: 'advice',
        },
        {
          text: 'Just eat. Pie of the month, and whatever he\'s playing on the radio in the kitchen.',
          effects: [{ money: -6 }, buff(WELL_FED), { stat: 'mood', add: 3 }],
          goto: 'pie',
        },
      ],
    },
    jukebox_fixed: {
      speaker: 'narrator',
      text: [
        'The jukebox is a chrome-and-walnut beast older than Sal\'s marriage. Inside: a selector relay furred with grease, a drive belt stretched like old taffy, and a 1974 bus transfer somebody dropped in through the coin slot as a joke.',
        'You clean the contacts, shorten the belt, and leave the bus transfer where it is, out of respect. The next selection plays the right song, all the way through, with no skip. Three regulars applaud. One of them is crying a little; it was his wedding song.',
        { if: { flag: 'ev_city.local_fixture' }, text: 'Sal sets a slice of pie in front of you and a second one in front of your usual stool, in case you\'re still hungry after the first.', else: 'Sal sets down a slice of pie. "On the house. Don\'t tell anybody. They\'ll think I\'m soft."' },
      ],
    },
    jukebox_blue: {
      speaker: 'narrator',
      text: [
        'You clean. You jiggle. Something deep in the machine goes thunk, like a decision being made.',
        'The jukebox plays "Blue Moon." Then it plays "Blue Moon" again. Every button, every selection, every coin: "Blue Moon." In the corner booth, old Mr. Pruszynski rises slowly to his feet with tears in his eyes and begins to sway.',
        '"That part\'s eighty bucks," says Sal, very calmly. You put forty on the counter. He pushes it back. You push it again. He takes it, with the face of a man who will now be listening to "Blue Moon" until the day he dies.',
      ],
    },
    tab: {
      speaker: 'narrator',
      text: [
        'The kid — sixteen, maybe, a paper-route jacket and a borrowed library laptop with a sticker over the webcam — looks up when Sal tells her it\'s been taken care of. She doesn\'t say thank you. She says, "Why?"',
        'You don\'t have a good answer. Sal gives you one later, wiping down your end of the counter. "Because somebody did it for you. Twice, when you were fourteen. You don\'t remember. I do."',
        { if: { var: 'ev_city.tabs_covered', gte: 3 }, text: '"That\'s the third one," he adds. "Word\'s getting around. You\'re gonna end up broke and beloved, kid. Worst combination there is." He pours you a refill. "My favorite."' },
      ],
    },
    advice: {
      speaker: 'sal',
      text: [
        { if: { stat: 'heat', gte: 40 }, text: '"You got the look. The one where you check who\'s in the door every time the bell goes." He wipes the same spot on the counter three times. "Whatever it is, don\'t bring it in here. And if you gotta bring it in here, sit in the back booth. I\'ll know."' },
        { if: withPartner, text: '"Go home. Somebody\'s waiting up for you, and you\'re sitting here telling a fry cook your problems. Go tell them. That\'s what they\'re for. That\'s the whole deal."' },
        '"I got one rule, thirty-eight years behind this counter. Never solve anything after midnight. Eat. Sleep. Solve it in the morning." He slides you a plate of eggs you didn\'t order. "Everything looks smaller next to eggs."',
      ],
    },
    pie: {
      speaker: 'narrator',
      text: [
        { if: actLte(2), text: 'Cherry, with a lattice crust that shatters like safety glass. The radio in the kitchen is doing the late ballgame, and Sal argues with the umpire in a low, continuous murmur, like a prayer.', else: 'Apple, with too much cinnamon, the way his mother made it. The radio in the kitchen is doing the late news. Sal turns it down during the parts about the council and up again for the weather.' },
        'For twenty minutes nobody needs anything from you. You forget, briefly, what you do for a living. It is the best twenty minutes of the week.',
      ],
    },
  },
}

const theUsual: EventDef = {
  id: 'ev_city_the_usual',
  category: 'city',
  weight: 2,
  repeatable: true,
  cooldownDays: 150,
  when: { all: [free, salHere, { day: true, gte: 14 }] },
  scene: 'ev_city_the_usual_scene',
}

// ── ev_city_cold_snap — the boiler dies (one-off, winter, Act I–II) + mini-arc ──

const coldSnapScene: SceneDef = {
  id: 'ev_city_cold_snap_scene',
  channel: 'dialog',
  title: 'No Heat on Cannery Row',
  start: 'cold',
  nodes: {
    cold: {
      speaker: 'narrator',
      text: [
        'Winter comes in off the Sound like it has a grudge. On the third night of the cold, the radiators in the building on Cannery Row go cold, clank once, apologetically, and die.',
        { if: { all: [atParents, momHere] }, text: 'You wake up able to see your breath. Mom is boiling pots of water on the stove "for the humidity," which is not how heat works, and nobody has the heart to tell her. Dad is in the basement doorway in his mill jacket, staring down the stairs like the boiler owes him money.' },
        { if: { all: [atParents, momGone] }, text: 'You wake up able to see your breath. Dad is in the basement doorway in his mill jacket, staring down the stairs. He hasn\'t said much since Mom. He says, "It\'s cold," and you hear everything else he doesn\'t say.' },
        { if: { all: [{ not: atParents }, momHere] }, text: 'Your phone rings at seven. "It\'s nothing," Mom says, in the voice she uses when it\'s something. "The boiler. Everybody\'s in coats. Mr. Szabo is wearing both his cardigans and a third one I have never seen before."' },
        { if: { all: [{ not: atParents }, momGone] }, text: 'Dad calls at seven, instead of Mom, the way it is now. He doesn\'t say it\'s nothing. He says, "It\'s cold here," and you hear everything else he doesn\'t say.' },
        'The building belongs to Leonard Keel of Keel Property Management, who owns four buildings on the Row and answers his phone in none of them. His answering machine says he is "aware of the situation."',
      ],
      choices: [
        {
          tag: '[Hardware]',
          text: 'Go down to the basement and look at the boiler yourself.',
          check: {
            skill: 'hardware',
            dc: 14,
            bonuses: [
              { if: { background: 'tinkerer' }, add: 2, label: '+2 (a basement is basically your natural habitat)' },
              { if: { all: [around('dad'), { npc: 'dad', fateNot: ['spiral'] }] }, add: 1, label: '+1 (Dad holds the flashlight and knows where the valves are)' },
            ],
            success: 'fixed',
            fail: 'flood',
            successEffects: [
              { faction: 'fac.hood', add: 5 },
              { xp: 'hardware', add: 25 },
              { flag: 'ev_city.fixed_boiler' },
              buff(CIVIC_PRIDE),
              { if: onRow(30), then: [{ trait: 'ev_city_scar_local_fixture' }] },
            ],
            failEffects: [
              { faction: 'fac.hood', add: -2 },
              { stat: 'stress', add: 8 },
              { flag: 'ev_city.flooded_basement' },
              { obligation: { id: 'ev_city_basement_flood', label: 'Basement flood — your share of the pump-out', perDay: 3, days: 45 } },
              { quest: 'ev_city_q_cold_snap', start: true },
            ],
          },
        },
        {
          tag: '[Organize]',
          text: 'Knock on every door. If the whole building calls Keel at once, he can\'t not answer.',
          effects: [{ faction: 'fac.hood', add: 2 }, { quest: 'ev_city_q_cold_snap', start: true }],
          goto: 'organize',
        },
        {
          text: 'Buy space heaters for the old folks on the second floor.',
          req: { stat: 'money', gte: 90 },
          reqText: 'Requires $90',
          effects: [{ money: -90 }, { faction: 'fac.hood', add: 3 }, { stat: 'mood', add: 3 }],
          goto: 'heaters',
        },
        {
          tag: '[Leave]',
          text: 'It\'s a landlord problem. Put on another sweater and wait it out.',
          effects: [{ faction: 'fac.hood', add: -2 }, buff(COLD_SNAP)],
          goto: 'sweater',
        },
      ],
    },
    fixed: {
      speaker: 'narrator',
      text: [
        'The boiler is a cast-iron monster from the year the streetcars stopped running with a pilot assembly caked in soot and a thermocouple so corroded it looks like a fossil. You clean it, reseat it, bleed a valve that screams at you like a kettle, and hold your breath.',
        'Whoomp. Blue flame. Somewhere above you, forty radiators begin to tick and clank like an orchestra tuning up. By the time you climb the stairs, people are standing in their doorways in their socks, cheering.',
        { if: { flag: 'ev_city.local_fixture' }, text: 'Mrs. Castellano pins a note to the lobby corkboard: "IF BROKEN — ASK {name}." Nobody takes it down. By spring it has three more names under yours, all of them things you apparently also fix.', else: 'Mrs. Castellano presses a foil-covered dish into your hands. It is still warm. It is always still warm. Nobody on the Row has ever figured out how she does that.' },
      ],
    },
    flood: {
      speaker: 'narrator',
      text: [
        'You open the wrong valve. You know it\'s the wrong valve about half a second after you open it, which is when the basement begins, gently and then not gently, to fill with water.',
        'By the time Dad gets the main shut off, the storage cages are ankle-deep and Mr. Szabo\'s box of ferry-engine manuals is floating past like a small, sad barge. The pump-out company costs money. You insist on paying your share. You insist quite loudly, because you can\'t feel your feet.',
        'The boiler is still dead. Now it is definitely a landlord problem. The building gets together in the lobby, wet to the shins, and writes Leonard Keel a letter.',
      ],
    },
    organize: {
      speaker: 'narrator',
      text: [
        'Twenty-two apartments. Twenty-two doors. You get tea at nine of them, a lecture on the 1974 transit strike at one, and a signature at every single one. Mr. Szabo signs twice, "in case they lose the first one." Mrs. Castellano signs in fountain pen and underlines it.',
        'The letter goes to Keel Property Management by certified mail, and a copy goes under his office door by hand. Now you wait — twenty-two households in coats, all watching the mailbox.',
      ],
    },
    heaters: {
      speaker: 'narrator',
      text: [
        'The hardware store on Fifth has six space heaters left. You buy four and carry them up two flights, two at a time, while the clerk yells "DON\'T PUT THEM NEAR THE CURTAINS" after you down the street.',
        'The Lindqvists on the second floor, who are eighty-one and eighty-four, put theirs in the middle of the living room and sit either side of it holding hands like it\'s a fireplace. The boiler stays dead for another nine days. Nobody on the second floor freezes. That will do.',
      ],
    },
    sweater: {
      speaker: 'narrator',
      text: [
        'You put on another sweater. Then another. For nine days you work in fingerless gloves, sleep in your coat, and watch your breath fog the monitor.',
        'Keel eventually sends a man with a used part and a cigarette, and the heat comes back. On the stairs, a few of the neighbors say hello to you a little more carefully than before, as if you\'re someone who lives here but not someone who is from here.',
      ],
    },
  },
}

const keelReplyScene: SceneDef = {
  id: 'ev_city_keel_reply',
  channel: 'dialog',
  title: 'Leonard Keel Comes to Cannery Row',
  start: 'lobby',
  nodes: {
    lobby: {
      speaker: 'narrator',
      text: [
        'Leonard Keel arrives on a Tuesday in a camel-hair coat, climbing the front steps as if each one has personally insulted him. He brings a clipboard, a man with a used boiler part, and the air of someone who has done this in four other buildings and won every time.',
        '"I received your letter," he tells the lobby, which is full. "Very moving. Here is what I can do. My man patches the old unit today. A new boiler is a capital improvement, and capital improvements are passed on to tenants. That is simply how buildings work."',
        { if: { flag: 'ev_city.flooded_basement' }, text: 'He glances at the tide line on the basement door. "I understand there was also a flood. Tenant-caused, I\'m told." He looks at you. Everybody looks at you.' },
      ],
      choices: [
        {
          tag: '[Business]',
          text: 'Read him the city housing code, chapter and verse, and then the fine schedule, slowly.',
          check: {
            skill: 'business',
            dc: 14,
            bonuses: [
              { if: onRow(20), add: 2, label: '+2 (Mrs. Castellano is standing behind you holding a casserole dish like a weapon)' },
              { if: { background: 'class_clown' }, add: 1, label: '+1 (you have argued your way out of worse detentions)' },
            ],
            success: 'folds',
            fail: 'patch',
            successEffects: [{ flag: 'ev_city.keel_answered' }, { flag: 'ev_city.keel_won' }],
            failEffects: [{ flag: 'ev_city.keel_answered' }],
          },
        },
        {
          tag: '[Social]',
          text: 'Let the building do the talking: twenty-two households, one at a time, every one of them with a name.',
          check: {
            skill: 'social',
            dc: 13,
            bonuses: [
              { if: onRow(30), add: 2, label: '+2 (the Row trusts you to run the room)' },
              { if: { trait: 'empath' }, add: 1, label: '+1 (you know who should speak first)' },
            ],
            success: 'voices',
            fail: 'walks',
            successEffects: [{ flag: 'ev_city.keel_answered' }, { flag: 'ev_city.keel_won' }],
            failEffects: [{ flag: 'ev_city.keel_answered' }],
          },
        },
        {
          text: 'Pay for a real part yourself, in cash, and tell Keel exactly what he owes this building.',
          req: { stat: 'money', gte: 250 },
          reqText: 'Requires $250',
          effects: [{ money: -250 }, { flag: 'ev_city.keel_answered' }, { flag: 'ev_city.paid_boiler' }, { faction: 'fac.hood', add: 4 }],
          goto: 'paid',
        },
      ],
    },
    folds: {
      speaker: 'narrator',
      text: [
        'You don\'t raise your voice. You don\'t have to. You have the code section for heat in residential units, the section on emergency repair, and the per-day fine for each, and you read all of it in the tone of someone reading a weather report about a storm that is going to hit Keel specifically.',
        'Somewhere around the second page his man quietly puts the used part back in the truck. "A new unit," Keel says, as if it were his idea. "Installed Friday. No pass-through." He looks at you like he is memorizing your face for a list. You smile at him like you already have one.',
      ],
      next: 'aftermath_won',
    },
    voices: {
      speaker: 'narrator',
      text: [
        'You don\'t make a speech. You just start with the Lindqvists — eighty-one and eighty-four — and let them tell him about the second floor. Then the woman with the twins. Then Mr. Szabo, who explains the entire history of heating to Keel, beginning with fire.',
        'By the ninth household, Keel has stopped writing on his clipboard. By the fifteenth, he is looking at the door. "A new unit," he says finally, to no one, to the ceiling. "Friday. No pass-through. Can everyone please stop telling me their names."',
      ],
      next: 'aftermath_won',
    },
    aftermath_won: {
      speaker: 'narrator',
      text: [
        'Friday, a new boiler comes down the basement stairs on a dolly, and forty radiators wake up at once. The building throws a party in the lobby with a slow cooker on every step.',
        { if: { flag: 'ev_city.flooded_basement' }, text: 'Keel even eats the pump-out bill — it seems the "tenant-caused" flood happened to a boiler room his own inspector should have condemned years ago. You didn\'t say that out loud. You just let him notice you knew it.' },
      ],
      effects: [
        { faction: 'fac.hood', add: 6 },
        { if: momHere, then: [{ npc: 'mom', affinity: 4 }] },
        buff(CIVIC_PRIDE),
        { removeObligation: 'ev_city_basement_flood' },
        { if: onRow(30), then: [{ trait: 'ev_city_scar_local_fixture' }] },
      ],
    },
    patch: {
      speaker: 'Leonard Keel',
      text: [
        '"Section fourteen-B was amended in 1997," Keel says pleasantly, "and the fine schedule you are reading is from a library book." He is right. You can tell he is right from the way Mrs. Castellano slowly lowers the casserole dish.',
        '"Patch it," he tells his man. "And the capital-improvement surcharge goes on everyone\'s rent from next month. Blame your spokesperson."',
      ],
      next: 'aftermath_lost',
    },
    walks: {
      speaker: 'narrator',
      text: [
        'It starts well. Then the fourth speaker, who has waited two years to say something to Leonard Keel, says all of it, including a word nobody says in front of Mrs. Castellano. The room tips from grievance into shouting.',
        'Keel lets it run for exactly one minute, then clicks his pen. "Patch it," he tells his man. "Surcharge on every unit. I tried to be reasonable." He is gone before anyone can stop shouting at each other long enough to stop him.',
      ],
      next: 'aftermath_lost',
    },
    aftermath_lost: {
      speaker: 'narrator',
      text: [
        'The patched boiler works, mostly, if you kick it. The surcharge letters arrive two weeks later. On the stairs people don\'t blame you — not out loud, not exactly — but the Row remembers who stood up in the lobby, and that it didn\'t work.',
        { if: momHere, text: 'You tell Mom you\'ll cover her share. She says absolutely not. You cover it anyway, and she pretends not to notice the rent is right every month.', else: 'You tell Dad you\'ll cover his share. He doesn\'t argue. That worries you more than if he had.' },
      ],
      effects: [
        { faction: 'fac.hood', add: 2 },
        { flag: 'ev_city.keel_grudge' },
        { obligation: { id: 'ev_city_keel_surcharge', label: 'Keel\'s "boiler surcharge" on the family\'s rent (you said you\'d cover it)', perDay: 2, days: 90 } },
      ],
    },
    paid: {
      speaker: 'narrator',
      text: [
        'You put two hundred and fifty dollars on his clipboard in twenties. "That\'s a real part," you tell him. "Install it today. And the next time this building goes cold, I call the Courier, the city inspector, and your mother, in that order."',
        'Keel looks at the money for a long moment, then at the lobby, then pockets it. The new part goes in by dinner. It is, everyone agrees, the most expensive thing anybody on the Row has ever done out of spite, and they love you for it.',
      ],
      effects: [{ if: onRow(30), then: [{ trait: 'ev_city_scar_soft_touch' }] }],
    },
  },
}

const coldSnapQuest: QuestDef = {
  id: 'ev_city_q_cold_snap',
  title: 'Cold Snap on Cannery Row',
  kind: 'side',
  priority: 3,
  summary: 'The boiler in the building on Cannery Row is dead, it is the middle of winter, and the landlord is "aware of the situation." The tenants have written him a letter. Now somebody has to make Leonard Keel care.',
  rewards: 'Heat for the building · the Row\'s regard',
  start: 'letter',
  stages: {
    letter: {
      text: 'Twenty-two households signed the letter; Mr. Szabo signed it twice. Leonard Keel of Keel Property Management has it now. Wait for his answer, and be ready to stand in the lobby with the building behind you when it comes.',
      onEnter: [{ scene: 'ev_city_keel_reply', delayHours: 24 * 14 }],
      objectives: [
        {
          id: 'faced',
          text: 'Face down Leonard Keel in the lobby',
          when: { flag: 'ev_city.keel_answered' },
          hint: 'Keel comes in person about two weeks after the letter. Business or Social can win the building a real boiler; lose the room and it\'s a cheap patch and a surcharge. Cash also talks.',
        },
      ],
      next: [{ if: { any: [{ flag: 'ev_city.keel_won' }, { flag: 'ev_city.paid_boiler' }] }, stage: 'warm' }, { stage: 'patched' }],
    },
    warm: {
      text: 'The radiators on Cannery Row are ticking again, and the lobby smells like six different slow cookers. Keel will remember your face. So will everybody else in the building, the good way.',
      objectives: [{ id: 'done', text: 'Enjoy the heat', when: { always: true }, hint: 'Nothing left to do but be warm.' }],
    },
    patched: {
      text: 'The old boiler works if you kick it, and every rent in the building went up to pay for the privilege. Keel won this round. The Row noticed you tried.',
      objectives: [{ id: 'done', text: 'Live with the patch', when: { always: true }, hint: 'It\'s over. The surcharge runs its course.' }],
      outcome: 'failed',
    },
  },
}

const coldSnap: EventDef = {
  id: 'ev_city_cold_snap',
  category: 'city',
  weight: 2,
  when: { all: [free, winter, actLte(2), { day: true, gte: 60 }, { any: [atParents, momHere, around('dad')] }] },
  scene: 'ev_city_cold_snap_scene',
}

// ── ev_city_stray_cat — a cat adopts your monitor (one-off, Act I–II) ──────────

const strayCatScene: SceneDef = {
  id: 'ev_city_stray_cat_scene',
  channel: 'dialog',
  title: 'A Visitor',
  start: 'cat',
  nodes: {
    cat: {
      speaker: 'narrator',
      text: [
        'For three nights running, you\'ve come back to the desk to find a cat asleep on top of your monitor. She is grey, the exact colour of a dead pixel, with a notch out of one ear, and she has claimed the warm top of the screen the way a queen claims a country.',
        'You don\'t know how she gets in. The window is open two inches. She regards this as an invitation. She regards you as staff.',
        { if: { trait: 'night_owl' }, text: 'She keeps your hours exactly: arrives at midnight, supervises until four, leaves at dawn with the air of someone who has done a full shift.' },
      ],
      choices: [
        {
          text: 'Keep her. Buy a bag of food. Name her Parity.',
          effects: [{ item: 'ev_city_cat' }, { flag: 'ev_city.cat_name', set: 'Parity' }, { stat: 'mood', add: 8 }],
          goto: 'kept',
        },
        {
          text: 'Keep her. Buy a bag of food. Name her Baud.',
          effects: [{ item: 'ev_city_cat' }, { flag: 'ev_city.cat_name', set: 'Baud' }, { stat: 'mood', add: 8 }],
          goto: 'kept',
        },
        {
          tag: '[Social]',
          text: 'Somebody on the Row must be missing a grey cat. Ask around.',
          check: {
            skill: 'social',
            dc: 11,
            bonuses: [{ if: onRow(10), add: 1, label: '+1 (people on the Row answer your knock)' }],
            success: 'owner',
            fail: 'flyers',
            successEffects: [{ faction: 'fac.hood', add: 3 }, { stat: 'mood', add: 4 }],
            failEffects: [{ item: 'ev_city_cat' }, { flag: 'ev_city.cat_name', set: 'Loaf' }, { stat: 'mood', add: 5 }, { stat: 'energy', add: -8 }],
          },
        },
        {
          tag: '[Leave]',
          text: 'Close the window. You can\'t afford a cat. You can barely afford you.',
          effects: [{ stat: 'mood', add: -3 }],
          goto: 'closed',
        },
      ],
    },
    kept: {
      speaker: 'narrator',
      text: [
        '{flag:ev_city.cat_name} accepts the name, the food, and a folded towel on the monitor with the gracious indifference of royalty receiving tribute. Within a week she has learned that the modem\'s handshake means you\'re about to sit down for hours, and comes running at the sound.',
        { if: momHere, text: 'Mom pretends to disapprove for four days and then starts buying her the good tuna.' },
      ],
    },
    owner: {
      speaker: 'Mr. Szabo',
      text: [
        'You find her owner on the third door: Mr. Szabo from 14B, in two cardigans, who has been missing her for a week and is certain she was "recruited."',
        '"Every night she goes out the fire escape and comes back smelling of electricity," he says darkly. "Now I know. You." He gives you a jar of pickled peppers strong enough to strip paint and, grudgingly, permission for her to keep visiting. She does. Most nights. On her terms.',
      ],
    },
    flyers: {
      speaker: 'narrator',
      text: [
        'You put up flyers with a photo so blurry that she could be a cat, a slipper or a loaf of bread. Three people call to claim a loaf of bread. One of them is very persistent.',
        'Nobody claims the cat. After two weeks of flyers, phone calls and one extremely long conversation about sourdough, you give up and buy the food. Her name is Loaf now. She seems to think that\'s fair.',
      ],
    },
    closed: {
      speaker: 'narrator',
      text: 'You close the window. She sits on the fire escape and looks at you through the glass for a long time with enormous, unblinking contempt, then leaves. The top of the monitor is cold the next night, and the one after that. You didn\'t know a monitor could look lonely.',
    },
  },
}

const strayCat: EventDef = {
  id: 'ev_city_stray_cat',
  category: 'weird',
  weight: 1,
  when: { all: [free, actLte(2), { day: true, gte: 45 }, { not: { item: 'ev_city_cat' } }] },
  scene: 'ev_city_stray_cat_scene',
}

// ── ev_city_night_counter — minding the Cathode overnight (one-off, Act III–IV) ─

const nightCounterScene: SceneDef = {
  id: 'ev_city_night_counter_scene',
  channel: 'dialog',
  title: 'The Night Counter',
  start: 'ask',
  nodes: {
    ask: {
      speaker: 'sal',
      text: [
        '"My sister\'s getting her knee done at Harbor General. Six a.m., which means I\'m driving her at four, which means nobody\'s on the counter midnight to six." He puts the keys on the counter between you. Not in your hand. On the counter. Your choice.',
        '"You know where the coffee is. You know where the pie is. You know where the bat is." He looks at you. "Don\'t use the bat."',
      ],
      next: 'night',
    },
    night: {
      speaker: 'narrator',
      text: [
        'The city after midnight comes in one person at a time. A cab driver who orders pie and tells you, in detail, about every fare he\'s ever had who didn\'t pay. Two nurses off a double, too tired to talk, who just hold their mugs and lean.',
        { if: { all: [partnerIs('grace'), withPartner] }, text: 'Around two, Grace comes in off her shift and takes the stool at the end of the counter without a word. She stays until four, reading a paperback, keeping you company without making you say anything. It is the most married you have ever felt.' },
        { if: { all: [partnerIs('mira'), withPartner] }, text: 'Around two, Mira comes in with her laptop and takes the back booth "to work," which means she sits where she can see the door, and you, until four. She doesn\'t say she\'s keeping watch. She doesn\'t have to.' },
        { if: surveilled, text: 'The TV over the register runs the late news on mute: the council, the new law, a graphic of a city map covered in little glowing dots. Nobody watches it. Everybody knows it\'s there.' },
        'At ten past three, the bell over the door goes, and a big man in a work jacket comes in out of the rain already shouting.',
      ],
      next: 'trouble',
    },
    trouble: {
      speaker: 'narrator',
      text: [
        { if: dataCampus, text: 'He worked the paper mill for twenty years. Now it\'s a data campus, and they didn\'t need him, and tonight the bank sent a letter saying a "risk model" decided he\'s not a good bet for his own house.', else: 'He worked the docks for twenty years. Tonight the bank sent a letter saying a "risk model" decided he\'s not a good bet for his own house.' },
        'He wants to know who decided. He wants to know what a model is. He has picked up a stool, not to swing it at anyone, exactly, but because his hands need to hold something heavy while he asks. The front window is right behind him.',
      ],
      choices: [
        {
          tag: '[Social]',
          text: 'Pour two coffees. Sit down on your side of the counter. Ask him his name, and then ask him about the mill.',
          check: {
            skill: 'social',
            dc: 15,
            bonuses: [
              { if: { trait: 'empath' }, add: 2, label: '+2 (you can hear what he\'s actually asking)' },
              { if: { trait: 'silver_tongue' }, add: 2, label: '+2 (silver tongue)' },
              { if: onRow(50), add: 1, label: '+1 (he knows your face from the Row)' },
            ],
            success: 'talked_down',
            fail: 'window',
          },
        },
        {
          tag: '[Fitness]',
          text: 'Come around the counter and get between him and the glass.',
          check: {
            skill: 'fitness',
            dc: 14,
            bonuses: [{ if: { trait: 'gym_rat' }, add: 2, label: '+2 (gym rat)' }],
            success: 'held',
            fail: 'swung',
          },
        },
        {
          text: 'Call the police. That\'s what the phone behind the register is for.',
          effects: [{ stat: 'heat', add: 4 }, { faction: 'fac.hood', add: -2 }, { flag: 'ev_city.called_police_on_row' }],
          goto: 'police',
        },
        {
          text: 'Stay behind the counter. Let him break what he needs to break.',
          effects: [{ money: -120 }, { faction: 'fac.hood', add: 1 }],
          goto: 'let_it',
        },
      ],
    },
    talked_down: {
      speaker: 'narrator',
      text: [
        'His name is Frank. He puts the stool down to shake your hand, and then he just keeps sitting on it. You ask about the mill and he tells you about the mill, for an hour: the smell, the noise, the guy who lost two fingers and kept working, the Christmas party in 1987 when somebody set the foreman\'s tie on fire.',
        'At half four he pays for his coffee, which you didn\'t charge him for, and leaves a five on the counter, which you didn\'t ask for. "Tell Sal Frank Mazur says hello," he says at the door. "He\'ll know."',
      ],
      effects: [{ faction: 'fac.hood', add: 5 }, { flag: 'ev_city.night_counter_calm' }, { trait: 'ev_city_scar_local_fixture' }],
      next: 'dawn',
    },
    window: {
      speaker: 'narrator',
      text: [
        'You say the wrong thing. You don\'t even know which thing it was — something about the bank, something that sounded like you were on its side. He turns, and the stool goes through the front window of the Cathode with a sound like the whole night breaking.',
        'He stands in the rain looking at what he did, and then he sits down on the curb and cries, and you sit next to him on the wet concrete until the glass guy comes at dawn. You insist on paying for the window. You insist hard enough that it becomes true.',
      ],
      effects: [
        { faction: 'fac.hood', add: 2 },
        { stat: 'stress', add: 10 },
        { flag: 'ev_city.cathode_window' },
        { obligation: { id: 'ev_city_cathode_window', label: 'The Cathode\'s front window (you insisted)', perDay: 8, days: 60 } },
      ],
      next: 'dawn',
    },
    held: {
      speaker: 'narrator',
      text: [
        'You come around the counter and just stand there, between him and the glass, hands open. He is bigger than you. It doesn\'t matter. He looks at you, then at the stool in his hands, and something goes out of him like air out of a tire.',
        'He puts it down. You put your hand on his shoulder and steer him to a booth, and he doesn\'t say another word until the coffee\'s gone.',
      ],
      effects: [{ faction: 'fac.hood', add: 3 }, { stat: 'health', add: -3 }],
      next: 'dawn',
    },
    swung: {
      speaker: 'narrator',
      text: [
        'You come around the counter too fast. He flinches, and the stool comes up, and the leg of it catches you square across the cheekbone. You see a very bright white light and then the ceiling tiles.',
        'When you sit up he is on his knees next to you, horrified, holding a bag of frozen peas from the kitchen to your face and apologizing to you, to Sal, to the window, to God. The window is fine. You are not, for a couple of weeks.',
      ],
      effects: [{ stat: 'health', add: -15 }, buff(BLACK_EYE), { faction: 'fac.hood', add: 2 }],
      next: 'dawn',
    },
    police: {
      speaker: 'narrator',
      text: [
        'The patrol car comes in six minutes. The officers are polite and bored and take everybody\'s name, including yours, which the younger one types into a little screen on his dashboard and then looks at for slightly too long.',
        'They take Frank out in cuffs. Through the window he looks back at you — not angry, just surprised, like you were someone he\'d assumed was on his side of something. Sal hears about it before he\'s back from the hospital. He doesn\'t say anything. He just doesn\'t say anything for a while.',
      ],
      next: 'dawn',
    },
    let_it: {
      speaker: 'narrator',
      text: [
        'You stay where you are. He doesn\'t go for the window. He goes for the pie case: one swing, a crash of glass and meringue, and then he stands there with the stool hanging from his hand like he doesn\'t know what it is.',
        'He leaves without a word. You sweep up. You pay for the pie case out of your own pocket, and when Sal hears the story he just nods. "You did right. Stuff is stuff. He\'s a person."',
      ],
      next: 'dawn',
    },
    dawn: {
      speaker: 'sal',
      text: [
        'Sal comes in at six with the rain on his hat. His sister is fine; the knee is titanium now and she is, he reports, "unbearable about it."',
        { if: { flag: 'ev_city.night_counter_calm' }, text: '"Frank Mazur was in," you tell him. Sal stops. "Frank. Jesus. How is he?" You tell him. He listens to the whole thing with his hands flat on the counter. "Good," he says at the end, very quietly. "Good. You did good."' },
        { if: { flag: 'ev_city.cathode_window' }, text: 'He looks at the plywood over his front window for a long time. "Frank Mazur," he says. "I heard. Poor bastard." He doesn\'t say a word about the glass. He doesn\'t take the money either, until you leave it in the tip jar, and then he pretends not to see it for sixty days.' },
        '"Keep the keys," he says, and turns the coffee machine on. "In case. You know. In case."',
      ],
      effects: [{ flag: 'ev_city.cathode_keys' }, { npc: 'sal', affinity: 6 }, buff(WELL_FED)],
    },
  },
}

const nightCounter: EventDef = {
  id: 'ev_city_night_counter',
  category: 'city',
  weight: 2,
  when: { all: [free, actGte(3), salHere, close('sal', 30)] },
  scene: 'ev_city_night_counter_scene',
}

// ── ev_city_last_payphone — the city takes out the Row's last payphone (Act IV) ─

const lastPayphoneScene: SceneDef = {
  id: 'ev_city_last_payphone_scene',
  channel: 'dialog',
  title: 'The Last Payphone on Cannery Row',
  start: 'corner',
  nodes: {
    corner: {
      speaker: 'narrator',
      text: [
        'A city work crew has a flatbed parked at the corner of Cannery and Fifth, outside the laundromat, and two men with a socket wrench are unbolting the payphone. The last one on the Row. The last one anywhere, as far as you know.',
        'You made a lot of calls from that box. You called Jax from it the night you ran away from home for four hours at fourteen. You called in sick to CompCastle from it, twice, doing a voice. When the line at home was busy because you were online, the whole family used it.',
        { if: { flag: 'side.met_dialtone' }, text: 'Marge Osgood could tell you exactly which exchange it\'s wired to, and the name of the man who wired it, and what he had for lunch that day in 1971.' },
        '"Nobody\'s used it in two years," the foreman tells you, "except one guy who calls the weather line every morning. Everybody\'s got one in their pocket now." He shrugs. "Progress."',
      ],
      choices: [
        {
          text: 'Ask for five minutes. Make one last call.',
          goto: 'last_call',
        },
        {
          tag: '[Hardware]',
          text: '"It\'s going to scrap anyway. Let me take the handset — I\'ll help you get the housing off in one piece."',
          check: {
            skill: 'hardware',
            dc: 14,
            bonuses: [{ if: { background: 'tinkerer' }, add: 2, label: '+2 (you\'ve wanted to open one of these since you were six)' }],
            success: 'salvaged',
            fail: 'fined',
            successEffects: [{ item: 'ev_city_payphone_handset' }, { xp: 'hardware', add: 20 }, { stat: 'mood', add: 6 }],
            failEffects: [
              { stat: 'health', add: -5 },
              { stat: 'heat', add: 3 },
              { obligation: { id: 'ev_city_city_fine', label: 'City fine: damage to municipal property', perDay: 4, days: 30 } },
            ],
          },
        },
        {
          tag: '[Social]',
          text: 'Talk the foreman into giving it one more week. The Row deserves a wake.',
          check: {
            skill: 'social',
            dc: 13,
            bonuses: [
              { if: onRow(50), add: 2, label: '+2 (half the Row is watching from the laundromat)' },
              { if: { flag: 'ev_city.local_fixture' }, add: 1, label: '+1 (local fixture)' },
            ],
            success: 'wake',
            fail: 'quota',
            successEffects: [{ faction: 'fac.hood', add: 5 }, buff(CIVIC_PRIDE)],
            failEffects: [{ stat: 'mood', add: -8 }, { faction: 'fac.hood', add: 1 }],
          },
        },
        {
          tag: '[Leave]',
          text: 'Keep walking. It\'s a phone.',
          goto: 'walk',
        },
      ],
    },
    last_call: {
      speaker: 'narrator',
      text: 'The foreman waves his hand: go on. You feed it two quarters from the bottom of your pocket. The dial tone is exactly the same as it was when you were eight. Who do you call?',
      choices: [
        {
          if: momHere,
          text: 'Mom. She\'ll pick up on the second ring. She always does.',
          effects: [{ npc: 'mom', affinity: 5 }, { stat: 'mood', add: 8 }],
          goto: 'called_mom',
        },
        {
          if: around('jax'),
          text: 'Jax. The number you know by heart, from the box you always called it from.',
          effects: [{ npc: 'jax', affinity: 5 }, { stat: 'mood', add: 8 }],
          goto: 'called_jax',
        },
        {
          if: withPartner,
          text: 'Home. Whoever\'s there is who you want to hear right now.',
          effects: [{ stat: 'mood', add: 8 }],
          goto: 'called_home',
        },
        {
          text: 'The old dial-up number for the Loft\'s board. Just to hear it.',
          effects: [{ stat: 'mood', add: 4 }, { stat: 'stress', add: -6 }],
          goto: 'called_board',
        },
      ],
    },
    called_mom: {
      speaker: 'mom',
      text: [
        '"Hello?" Then, suspicious: "Why is it saying \'Port Lumen Telephone\'? Where are you? Are you in trouble?"',
        'You tell her where you are. There\'s a pause, and then she laughs, the young laugh, the one from before any of it. "That box. Your father proposed to me from that box. He was too scared to do it in person, so he called from across the street and watched me answer." You didn\'t know that. Nobody ever told you that.',
      ],
      next: 'unbolted',
    },
    called_jax: {
      speaker: 'jax',
      text: [
        '"yeah?" Then: "wait. WAIT. is this the Fifth Street box? dude. DUDE. are you at the Fifth Street box right now?"',
        'You tell him. He\'s quiet for a second. "remember when we called the radio station from there eleven times so they\'d play that song and they played it and then the DJ said \'this one\'s for the two idiots on Fifth Street\'?" You remember. "man," Jax says. "man. ok. say bye to it for me."',
      ],
      next: 'unbolted',
    },
    called_home: {
      speaker: 'narrator',
      text: [
        byPartner(
          '"Who is this," Mira answers, flat and wary, because nobody calls that number but you and telemarketers. Then she hears your voice and the wariness goes out of it. "A payphone? You\'re calling me from a payphone? What are you, a spy?" You tell her it\'s the last one. She stays on the line, not saying much, until the money runs out.',
          '"Grace Okafor," she answers, in her work voice, because an unknown number means the hospital. Then, softer: "Oh, it\'s you. Where are you? It sounds like 1994." You tell her. "Stay on," she says. "Tell me about it. I\'ve got two minutes before the kettle." She takes all two minutes, and then a third.',
        ),
      ],
      next: 'unbolted',
    },
    called_board: {
      speaker: 'narrator',
      text: [
        'You dial it from memory. It rings once. Then: three rising tones and a recorded voice. The number you have dialed is no longer in service.',
        { if: { flag: 'life.modem_song' }, text: 'You still have the recording of the handshake somewhere, the one you made years ago. You realize, standing on the corner with a dead line humming in your ear, that it\'s the only place that sound still exists.', else: 'You stand there for a while with the dead line humming in your ear. Somewhere under this street there are still copper pairs that carried every stupid, wonderful thing you ever typed at 2 a.m. Nobody\'s listening to them anymore. That used to feel like freedom.' },
      ],
      next: 'unbolted',
    },
    unbolted: {
      speaker: 'narrator',
      text: 'When you hang up, the foreman gives it a respectful second, then puts the wrench back on the bolts. The box goes up on the flatbed with its cord dangling. There\'s a clean rectangle on the laundromat wall where it hung for forty years, paler than the brick around it, like a tan line.',
    },
    salvaged: {
      speaker: 'narrator',
      text: [
        'You know how these housings are put together before the foreman does. Four tamper-proof bolts, a hinge, a cord armored like a bicycle lock. The whole thing comes off in one piece and the foreman is so impressed he lets you keep the handset and the little brass plate that says PORT LUMEN TELEPHONE CO.',
        { if: { all: [around('dialtone'), { flag: 'side.met_dialtone' }] }, text: 'You bring the plate to Marge Osgood. She holds it for a long minute, turns it over, and reads the installer\'s initials scratched on the back. "Eddie Ruiz," she says. "He could never keep a straight line to save his life." She is smiling so hard it looks painful.' },
      ],
      effects: [{ if: { all: [around('dialtone'), { flag: 'side.met_dialtone' }] }, then: [{ npc: 'dialtone', affinity: 8 }, { faction: 'fac.hood', add: 2 }] }],
    },
    fined: {
      speaker: 'narrator',
      text: [
        'The bolts are older and angrier than you expected. The third one shears, the housing slips, and the coin box comes down on your hand with forty years of spite behind it. You bleed on the sidewalk. The handset cracks in half on the curb.',
        'The foreman, who had been friendly, is not friendly anymore. "Damage to municipal property," he says, writing on a pad, "and don\'t tell me it was going to scrap, because now I got a form." The form becomes a fine. The fine becomes your name in a city database, next to the word "tampering," which is a word you have spent a long time keeping away from your name.',
      ],
    },
    wake: {
      speaker: 'narrator',
      text: [
        'The foreman has a mother on the Row, it turns out. He gives you a week.',
        'All week, the Row comes to say goodbye. Mrs. Castellano calls her sister in Ridgeport. Mr. Szabo calls the weather line, as he apparently has every morning since 1988, and announces to the whole street that it will be cloudy. Mr. Pruszynski brings the accordion. Kids who have never used a payphone in their lives line up with borrowed quarters to call their own mothers\' cell phones, giggling.',
        'On the last day somebody tapes a card to the box: THANK YOU FOR YOUR SERVICE. By the time the crew comes back, it has sixty signatures on it.',
      ],
    },
    quota: {
      speaker: 'narrator',
      text: [
        '"I got a quota," says the foreman, not unkindly. "Nine of these today. You want to throw it a party, throw it a party at the scrapyard."',
        'You watch it go up on the flatbed. Nobody else on the street even looks up. You stand there longer than you mean to, looking at the pale rectangle on the brick, and it bothers you for weeks — not the phone, exactly. How easy it was.',
      ],
    },
    walk: {
      speaker: 'narrator',
      text: [
        'You keep walking. It\'s a phone. You have one in your pocket that\'s better at everything, including, you know better than almost anyone in this city, telling someone exactly where you are.',
        { if: surveilled, text: 'Half a block later you realize you\'ve put your hand on your pocket, the way you would to check for a wallet. You don\'t take it out. You just keep your hand there.' },
      ],
    },
  },
}

const lastPayphone: EventDef = {
  id: 'ev_city_last_payphone',
  category: 'era',
  weight: 2,
  when: { all: [free, { any: [actGte(4), fromDate(2011, 0, 1)] }, fromDate(2009, 8, 1)] },
  scene: 'ev_city_last_payphone_scene',
}

// ── ev_city_help_me_move — Jax needs your arms (one-off, Act I–III) ────────────

const helpMeMoveScene: SceneDef = {
  id: 'ev_city_help_me_move_scene',
  channel: 'chat',
  title: 'saturday????',
  from: 'jax',
  start: 'ask',
  expiresDays: 14,
  onExpire: [{ npc: 'jax', affinity: -3 }],
  nodes: {
    ask: {
      speaker: 'jax',
      text: [
        'dude. DUDE. i need ur arms saturday',
        { if: actLte(1), text: 'moving out of my moms. FINALLY. basement unit on pier st, it has a window!!! (the window is at ankle height but it counts)', else: 'moving again. new place on pier st. its got a real kitchen and a landlord who doesnt live in the walls' },
        'its 4 flights. theres a couch. the couch is a problem. the couch is my nemesis',
        'pizza + beer + my eternal gratitude which as u know is worth at least $6',
      ],
      choices: [
        {
          tag: '[Fitness]',
          text: 'im in. ill take the couch end going up',
          check: {
            skill: 'fitness',
            dc: 12,
            bonuses: [
              { if: { trait: 'gym_rat' }, add: 2, label: '+2 (gym rat)' },
              { if: { trait: 'glass_cannon' }, add: -2, label: '−2 (glass cannon)' },
            ],
            success: 'moved',
            fail: 'back',
            successEffects: [{ npc: 'jax', affinity: 6 }, { xp: 'fitness', add: 15 }, buff(WELL_FED), { stat: 'energy', add: -10 }],
            failEffects: [
              { npc: 'jax', affinity: 3 },
              { stat: 'health', add: -6 },
              buff(THROWN_BACK),
              { chance: 0.3, then: [{ complication: 'health', tier: 1 }] },
            ],
          },
        },
        {
          if: around('byteme'),
          tag: '[Business]',
          text: 'ill bring byteme and the loft kids. many hands. i will manage them like a foreman',
          check: {
            skill: 'business',
            dc: 12,
            success: 'crew',
            fail: 'crew_chaos',
            successEffects: [{ npc: 'jax', affinity: 5 }, { npc: 'byteme', affinity: 3 }, { faction: 'fac.loft', add: 1 }],
            failEffects: [{ npc: 'jax', affinity: 2 }, { money: -80 }],
          },
        },
        {
          text: 'cant lift, got a deadline. but im paying for movers. my treat',
          req: { stat: 'money', gte: 150 },
          reqText: 'Requires $150',
          effects: [{ money: -150 }, { npc: 'jax', affinity: 1 }],
          goto: 'movers',
        },
        {
          tag: '[Leave]',
          text: 'cant this weekend man sorry',
          effects: [{ npc: 'jax', affinity: -6 }, { flag: 'ev_city.skipped_jax_move' }],
          goto: 'bailed',
        },
      ],
    },
    moved: {
      speaker: 'jax',
      text: [
        'WE DID IT. the couch is IN. it lives here now. i will never move again. i will die in this apartment and they will have to bury me in the couch',
        'u were a machine on that 3rd landing btw. i was just yelling "pivot" and u actually pivoted',
        'pizza is here. ur slices are the ones without the olives bc i am a good friend and i remember things',
      ],
    },
    back: {
      speaker: 'jax',
      text: [
        'ok so. how is ur back. be honest. u made a noise on the 3rd landing like a door in a horror movie',
        'i feel TERRIBLE. im bringing soup. my mom made it. she says ur an idiot for lifting with ur back and also she loves u',
        'the couch made it tho. ur sacrifice was not in vain',
      ],
    },
    crew: {
      speaker: 'jax',
      text: [
        'ok u were a genius. byteme carried every box labeled FRAGILE like it was a baby. the loft kids did it in 2 hrs. i have never seen nerds move furniture so efficiently',
        'we had pizza on the new floor with like nine people. it felt like a lan party with no computers. best housewarming ever',
      ],
    },
    crew_chaos: {
      speaker: 'jax',
      text: [
        'so. update. byteme dropped my monitor down 2 flights',
        'it bounced. twice. it was honestly kind of beautiful. then it stopped being a monitor',
        'u dont have to replace it. ur replacing it arent u. ur already on the way to compcastle. dude. DUDE. ok thank u. i love u. never let byteme carry anything again',
      ],
    },
    movers: {
      speaker: 'jax',
      text: [
        'wow ok. movers. fancy',
        'thanks man seriously. they were great. very professional. they did not yell pivot even once',
        'kinda missed u yelling pivot tho',
      ],
    },
    bailed: {
      speaker: 'jax',
      text: [
        'oh. ok. no worries',
        'got my cousin and his friend. we got it done. couch is in. only lost one lamp',
        'its cool. seriously. its cool',
      ],
    },
  },
}

const helpMeMove: EventDef = {
  id: 'ev_city_help_me_move',
  category: 'life',
  weight: 2,
  when: { all: [free, actLte(3), around('jax'), { day: true, gte: 30 }] },
  scene: 'ev_city_help_me_move_scene',
}

export default defineContent({
  items,
  scenes: [theUsualScene, coldSnapScene, keelReplyScene, strayCatScene, nightCounterScene, lastPayphoneScene, helpMeMoveScene],
  quests: [coldSnapQuest],
  events: [theUsual, coldSnap, strayCat, nightCounter, lastPayphone, helpMeMove],
})
