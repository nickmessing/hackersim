/**
 * events_city — CIVIC LIFE & THE LONG DECADE. Elections, council, cameras, and the places and people
 * that mark the years going by.
 *
 *  - ev_city_election_day     repeatable, Oct–Nov: the church-basement polls, read against the era
 *                             (punch cards → touchscreens), Dee's seat, and the surveillance law.
 *  - ev_city_pothole_hotline  one-off, once Dee holds her council seat: her hotline is misbehaving.
 *  - ev_city_safestreets      one-off, Act III: the city bolts cameras to the lampposts on the Row.
 *  - ev_city_arcade_closing   one-off, Act III: the Sodium Row arcade's last night.
 *  - ev_city_cousin_wedding   one-off, Act II: Cousin Tuyet's wedding, and a laptop on the DJ table.
 *  - ev_city_reunion          one-off, fall 2010: Class of 2001 homecoming, nine years on.
 *
 * World vars are READ here (w.mnsa, w.surveillance, a3.mnsa_live, npc.dee.council), never written.
 * HARD RULE: machines are fixed by rebooting and reseating, never by anything that touches a count;
 * no real techniques, vendors, or people.
 */
import { defineContent } from '@/engine/registry'
import type { BuffDef, EventDef, ItemDef, SceneDef } from '@/engine/types'
import {
  ABSENT,
  CIVIC_PRIDE,
  IN_LOVE,
  WELL_FED,
  actBetween,
  actGte,
  around,
  buff,
  byPartner,
  costByAct,
  darkTurn,
  electionSeason,
  free,
  fromDate,
  married,
  momGone,
  momHere,
  onRow,
  partnerAff,
  partnerLines,
  salHere,
  surveilled,
  untilDate,
  withPartner,
} from './_shared'

// ── Local buffs & items ────────────────────────────────────────────────────────

const POTHOLE_LINE: BuffDef = {
  id: 'ev_city_pothole_line',
  name: 'The Pothole Line',
  desc: 'Every pothole complaint in the district now rings your phone. At dinner. At 2 a.m. During a job. Mrs. Kaminski has called about the same pothole nine times; you are on a first-name basis with it.',
  days: 28,
  bad: true,
  mods: [{ key: 'stress.gain', mult: 1.08 }, { key: 'energy.drain', mult: 1.03 }],
}

const BLIND_SPOTS: BuffDef = {
  id: 'ev_city_blind_spots',
  name: 'Knows the Blind Spots',
  desc: 'You walked the Row until you knew exactly which corners the new cameras can\'t see. You find yourself using them without thinking.',
  days: 90,
  mods: [{ key: 'heat.decay', add: 0.15 }],
}

const OLD_FRIENDS: BuffDef = {
  id: 'ev_city_old_friends',
  name: 'Old Friends',
  desc: 'Nine years later, a gym full of people who knew you before you were anybody were glad to see you. It stays with you.',
  days: 28,
  mods: [{ key: 'mood.daily', add: 0.4 }, { key: 'stress.relief', mult: 1.06 }],
}

const OLD_WOUNDS: BuffDef = {
  id: 'ev_city_old_wounds',
  name: 'Old Wounds',
  desc: 'You went back, and it went the way you were afraid it would. You keep hearing your own name said too loudly in a gym.',
  days: 21,
  bad: true,
  mods: [{ key: 'mood.daily', add: -0.4 }, { key: 'stress.gain', mult: 1.05 }],
}

const items: ItemDef[] = [
  {
    id: 'ev_city_arcade_cabinet',
    name: 'Star Harrow Cabinet',
    category: 'furniture',
    shop: 'life',
    price: 0,
    unique: true,
    hidden: true,
    tier: 0,
    desc: 'The last Star Harrow cabinet from the Sodium Row arcade: a cracked marquee, a joystick worn smooth by a decade of palms, and your initials, possibly, still on the high score table. It takes up half a wall and hums at night like a sleeping animal.',
    mods: [{ key: 'stress.relief', mult: 1.06 }, { key: 'mood.daily', add: 0.2 }],
  },
]

// ── ev_city_election_day (repeatable) ────────────────────────────────────────────

const electionScene: SceneDef = {
  id: 'ev_city_election_day_scene',
  channel: 'dialog',
  title: 'Election Day on the Row',
  start: 'basement',
  nodes: {
    basement: {
      speaker: 'narrator',
      text: [
        'The polling place for Cannery Row is the basement of St. Brendan\'s: folding tables, a coffee urn older than the church, and a line of voters out the door and halfway up the block, most of them over seventy and all of them with opinions.',
        { if: untilDate(2003, 11, 31), text: 'The ballots are paper. The booths have little curtains. A retired schoolteacher hands out "I VOTED" stickers with the gravity of a woman awarding medals.' },
        { if: fromDate(2004, 0, 1), text: 'This year there are new touchscreen machines — VOTESURE 2000, leased from a Millgate vendor, beige and humming — and a laminated sign that says TOUCH GENTLY. Nobody touches gently.' },
        { if: { flag: 'npc.dee.council' }, text: 'Half the lawns on the Row have a sign: BRIGGS — SHE FIXED THE POTHOLES. Dee herself is out front in a sash, shaking every hand in the line, twice.' },
        { if: { all: [{ flag: 'a3.mnsa_live' }, { var: 'w.mnsa', eq: 0 }] }, text: 'Everyone in the line is talking about the Network Security Act: who\'s for it, who\'s against it, and what "retain all logs" means for Mrs. Castellano\'s email to her sister.' },
        { if: { var: 'w.mnsa', eq: 1 }, text: 'There\'s a new camera over the church door since the Act passed. Somebody has taped a Mass card over the lens. Nobody has taken it down.' },
        { if: { var: 'w.mnsa', eq: 2 }, text: 'The Act passed in its watered-down form. "Half a leash," Mr. Szabo calls it in the line, "is still a leash." Several people nod.' },
      ],
      choices: [
        {
          text: 'Volunteer as a poll worker. Twelve hours, a folding chair and bad coffee.',
          effects: [{ faction: 'fac.hood', add: 3 }, { stat: 'stress', add: 5 }, { stat: 'energy', add: -10 }, buff(CIVIC_PRIDE)],
          goto: 'worker',
        },
        {
          if: fromDate(2004, 0, 1),
          tag: '[Systems]',
          text: 'One of the new machines freezes mid-vote. The poll captain looks straight at you: "You\'re the computer one."',
          check: {
            skill: 'systems',
            dc: 15,
            bonuses: [
              { if: { jobTrack: ['sysadmin', 'support', 'network'] }, add: 2, label: '+2 (you reboot things for a living)' },
              { if: { trait: 'paranoid' }, add: -1, label: '−1 (you are VERY aware how this looks)' },
            ],
            success: 'fixed',
            fail: 'photographed',
            successEffects: [{ faction: 'fac.hood', add: 4 }, { flag: 'ev_city.fixed_poll_machine' }, { xp: 'systems', add: 25 }],
            failEffects: [
              { stat: 'heat', add: 6 },
              { flag: 'ev_city.poll_photo' },
              { trait: 'ev_city_scar_known_face' },
              { chance: 0.4, then: [{ complication: 'legal', tier: 1 }] },
            ],
          },
        },
        {
          if: untilDate(2003, 11, 31),
          tag: '[Social]',
          text: 'Mr. Szabo is in the line with a pencil and a look. Talk him out of writing himself in for mayor again.',
          check: {
            skill: 'social',
            dc: 12,
            success: 'szabo_talked',
            fail: 'write_in',
            successEffects: [{ faction: 'fac.hood', add: 2 }, { stat: 'mood', add: 3 }],
            failEffects: [{ flag: 'ev_city.write_in' }, { faction: 'fac.hood', add: -1 }],
          },
        },
        {
          text: 'Vote, take the sticker, and go get pie.',
          effects: [{ stat: 'mood', add: 3 }, { if: salHere, then: [{ money: -6 }, buff(WELL_FED)] }],
          goto: 'voted',
        },
        {
          tag: '[Leave]',
          text: 'Skip it. Nothing ever changes.',
          effects: [{ faction: 'fac.hood', add: -1 }],
          goto: 'skipped',
        },
      ],
    },
    worker: {
      speaker: 'narrator',
      text: [
        'You check names off a list printed in a font from 1981. You explain the ballot to a man who wants to vote for "whoever\'s against the new parking meters" and to a first-time voter so nervous she drops her ID three times. You get six cups of coffee and one cold sandwich.',
        'At 8 p.m. the doors close and the whole crew stands around the counting table — no one touching anything, just watching the captain do it right — and it feels, for a second, like the most important room in the city.',
      ],
    },
    fixed: {
      speaker: 'narrator',
      text: [
        'You don\'t touch anything that counts. You don\'t even open the case. You just do what the laminated manual in its drawer says, which nobody had read: power down, wait the full sixty seconds, reseat the cartridge, power up, call the county line and read them the serial number.',
        'It comes back. The voter whose ballot froze gets to start over, with the county on speakerphone confirming. The captain shakes your hand. The line, which has watched the whole thing with the deep suspicion of people who have voted here for fifty years, applauds.',
      ],
    },
    photographed: {
      speaker: 'narrator',
      text: [
        'You follow the manual. It doesn\'t come back. The screen stays grey and the captain sends everyone to paper ballots for the rest of the day, which is fine, honestly. Paper is fine.',
        'What is not fine is the man with a camera and a blog who got a photo of the Row\'s resident computer person bent over a voting machine with its back panel open. By Friday it\'s on the Channel 6 evening news: HACKER AT THE POLLS? You are the question mark. It runs for eleven seconds. People will remember your face for years.',
      ],
    },
    szabo_talked: {
      speaker: 'Mr. Szabo',
      text: '"Fine," says Mr. Szabo, crossing out his own name with regret. "I vote for the other one. But when they ruin everything, I want it on the record: I was available." He votes. He gets a sticker. He wears it for a week.',
    },
    write_in: {
      speaker: 'narrator',
      text: [
        'He listens to your whole argument, nods thoughtfully, and writes in your name instead.',
        'When the results post, the Courier\'s small-print table lists every candidate, then every write-in, and there you are: {name} (write-in) — 3 votes. Mr. Szabo, his cousin and one person you will never identify. Mr. Szabo is now telling everyone you\'re "considering a run." People keep asking about your platform. You keep saying "potholes."',
      ],
    },
    voted: {
      speaker: 'narrator',
      text: [
        'You vote. You get the sticker. You wear it all day, slightly embarrassed, and every single person on the Row who sees it says "good for you" like you did something brave.',
        { if: salHere, text: 'Sal has a sign on the register: VOTED? PIE 50¢ OFF. DIDN\'T VOTE? PIE COSTS DOUBLE. He checks stickers.' },
      ],
    },
    skipped: {
      speaker: 'narrator',
      text: [
        { if: actGte(3), text: 'You skip it. Something changes anyway. It always does. It just changes without you.' },
        { if: { all: [{ not: actGte(3) }, momHere] }, text: 'You skip it. Nothing much changes. Your mother, who has not missed an election in twenty-five years, finds out anyway, and you hear about it for a month.' },
        { if: { all: [{ not: actGte(3) }, { not: momHere }] }, text: 'You skip it. Nothing much changes. That\'s the story you tell yourself, anyway, walking past the line outside St. Brendan\'s on the way to somewhere else.' },
      ],
    },
  },
}

const electionDay: EventDef = {
  id: 'ev_city_election_day',
  category: 'era',
  weight: 1.5,
  repeatable: true,
  cooldownDays: 600,
  when: { all: [free, electionSeason, { day: true, gte: 400 }] },
  scene: 'ev_city_election_day_scene',
}

// ── ev_city_pothole_hotline (one-off, Dee on the council) ────────────────────────

const potholeScene: SceneDef = {
  id: 'ev_city_pothole_hotline_scene',
  channel: 'mail',
  title: 'URGENT!!! (NOT A VIRUS)',
  from: 'dee',
  start: 'mail',
  expiresDays: 21,
  onExpire: [{ npc: 'dee', affinity: -4 }],
  nodes: {
    mail: {
      speaker: 'dee',
      text: [
        'From: Councilwoman Dolores Briggs\nSubject: URGENT!!! (NOT A VIRUS)',
        'I KNOW YOU ARE BUSY. I AM ALSO BUSY. I AM A COUNCILWOMAN.',
        'The POTHOLE HOTLINE I promised the Row is LIVE. The city paid a company to set it up. It is ALSO, as of this morning, forwarding EVERY CALL to the HARBOR POINT YACHT CLUB. The Yacht Club has called me four times. They are not happy. Nobody on the Row is happy. The potholes are VERY unhappy.',
        'We do not tell the customer. We HEAL the customer. The whole district is my customer now. Please come heal the hotline.\n\nCouncilwoman Dolores "Dee" Briggs\n(the caps lock is ON PURPOSE)',
      ],
      choices: [
        {
          tag: '[Systems]',
          text: 'Reply: "On my way." Go to City Hall and look at the call-routing box.',
          check: {
            skill: 'systems',
            dc: 14,
            bonuses: [{ if: { jobTrack: ['network', 'sysadmin'] }, add: 2, label: '+2 (you route things for a living)' }],
            success: 'healed',
            fail: 'your_phone',
            successEffects: [{ faction: 'fac.hood', add: 4 }, { npc: 'dee', affinity: 6 }, buff(CIVIC_PRIDE), { flag: 'ev_city.pothole_fixed' }],
            failEffects: [buff(POTHOLE_LINE), { npc: 'dee', affinity: 2 }, { faction: 'fac.hood', add: 1 }, { flag: 'ev_city.pothole_line' }],
          },
        },
        {
          tag: '[Business]',
          text: '"Fire the vendor and make them refund the city. Want me to write the letter?"',
          check: {
            skill: 'business',
            dc: 13,
            success: 'refund',
            fail: 'nephew',
            successEffects: [{ npc: 'dee', affinity: 4 }, { faction: 'fac.hood', add: 2 }, { xp: 'business', add: 15 }],
            failEffects: [{ npc: 'dee', affinity: -2 }, { stat: 'stress', add: 4 }],
          },
        },
        {
          text: '"Answer it yourself for a week. With a headset. The Row will love it."',
          effects: [{ npc: 'dee', affinity: 3 }, { faction: 'fac.hood', add: 2 }],
          goto: 'headset',
        },
        {
          tag: '[Leave]',
          text: 'Mark it as read. You have your own fires.',
          effects: [{ npc: 'dee', affinity: -4 }],
          goto: 'ignored',
        },
      ],
    },
    healed: {
      speaker: 'dee',
      text: [
        'Subject: RE: URGENT!!! (NOT A VIRUS)',
        'It WORKS. I called it myself from my office and it rang in the pothole room and Gary answered. Gary has never looked so frightened. I am going to put your name in the council minutes. I am going to put your name in the NEWSLETTER.',
        'The Yacht Club sent a fruit basket to say thank you for making the calls stop. I have given it to the Row\'s senior center. The pears are very good.\n\n— Dee',
      ],
    },
    your_phone: {
      speaker: 'narrator',
      text: [
        'You get the calls to stop going to the Yacht Club. You get them to stop going to the Yacht Club by sending them, through a mistake you will not understand for three weeks, to your own phone.',
        '"Pothole Hotline," you find yourself answering, at dinner, at two in the morning, in the middle of a job. Mrs. Kaminski on Ninth has called about the same pothole nine times. You are on a first-name basis with the pothole. Dee thinks this is wonderful. "You\'re VERY good on the phone," she writes. "Don\'t fix it yet. The approval ratings are UP."',
      ],
    },
    refund: {
      speaker: 'dee',
      text: 'Subject: RE: URGENT!!! The vendor has REFUNDED the city. They were VERY apologetic after your letter. I read your letter out loud at the council meeting. Two councilmen looked at their shoes. I have never been so happy. The new vendor is a nice girl from the LSU engineering program who charges half and answers her phone. — Dee',
    },
    nephew: {
      speaker: 'dee',
      text: 'Subject: RE: URGENT!!! So the vendor is the Deputy Mayor\'s NEPHEW. Your letter went to the Deputy Mayor. The Deputy Mayor has now sent ME a letter. It is not a nice letter. The hotline still rings at the Yacht Club. I am not angry. I am DISAPPOINTED, which as you know is worse. — Dee',
    },
    headset: {
      speaker: 'narrator',
      text: [
        'Dee answers the hotline herself, in a headset, for a week — and then for a year, because she likes it. "Dolores Briggs, Pothole Line. How can I heal your street?"',
        'Complaints drop. Not because the potholes get fixed faster, though some do, but because nobody on the Row can stay angry at a councilwoman who remembers their dog\'s name. The Courier runs a photo: BRIGGS ON THE LINE.',
      ],
    },
    ignored: {
      speaker: 'narrator',
      text: 'You mark it as read. The hotline rings at the Yacht Club for another three weeks until somebody in the city IT department finds it. Dee doesn\'t mention it. She just starts signing her emails to you "Councilwoman Briggs," which she has never done before.',
    },
  },
}

const potholeHotline: EventDef = {
  id: 'ev_city_pothole_hotline',
  category: 'city',
  weight: 2,
  when: { all: [free, { flag: 'npc.dee.council' }, around('dee')] },
  scene: 'ev_city_pothole_hotline_scene',
}

// ── ev_city_safestreets (one-off, Act III) ───────────────────────────────────────

const safeStreetsScene: SceneDef = {
  id: 'ev_city_safestreets_scene',
  channel: 'dialog',
  title: 'SafeStreets',
  start: 'poles',
  nodes: {
    poles: {
      speaker: 'narrator',
      text: [
        'A city crew is working its way down Cannery Row with a cherry picker, bolting white domes to the lampposts: one at every corner, one outside the laundromat, one pointed at the Cathode\'s door. A banner on the truck reads SAFESTREETS PORT LUMEN — A SAFER CITY IS A SEEN CITY.',
        'There\'s a community meeting about it tonight in St. Brendan\'s basement, which the flyer describes as "informational," meaning it has already been decided.',
        { if: around('list_activist'), text: 'Nadia Bell is on the corner with a stack of her own flyers: WHO WATCHES CANNERY ROW? She hands you one without asking whether you want it. "Come tonight," she says. "Say something. They listen to people who sound like they know what a network is."' },
        'Mrs. Castellano, on the other hand, is thrilled. She is certain the cameras will finally catch whoever has been stealing her newspaper since 1996.',
        { if: { stat: 'heat', gte: 40 }, text: 'You count the domes between your front door and the bus stop. Four. You didn\'t used to have to count things.' },
      ],
      choices: [
        {
          tag: '[Social]',
          text: 'Speak at the meeting. Not about technology. About the church door, the diner, and the corner where the kids play.',
          check: {
            skill: 'social',
            dc: 15,
            bonuses: [
              { if: onRow(50), add: 2, label: '+2 (the Row knows you)' },
              { if: { trait: 'silver_tongue' }, add: 2, label: '+2 (silver tongue)' },
              { if: { flag: 'ev_city.local_fixture' }, add: 1, label: '+1 (local fixture)' },
            ],
            success: 'moved',
            fail: 'channel_six',
            successEffects: [{ faction: 'fac.hood', add: 6 }, { faction: 'fac.bureau', add: -2 }, buff(CIVIC_PRIDE), { flag: 'ev_city.cameras_moved' }],
            failEffects: [{ trait: 'ev_city_scar_known_face' }, { stat: 'heat', add: 5 }, { faction: 'fac.hood', add: 1 }, { flag: 'ev_city.on_channel_six' }],
          },
        },
        {
          if: around('list_activist'),
          text: 'Sign Nadia\'s petition and spend the week flyering the Row with her.',
          effects: [{ faction: 'fac.hood', add: 4 }, { faction: 'fac.bureau', add: -3 }, { stat: 'heat', add: 3 }, { npc: 'list_activist', affinity: 5 }],
          goto: 'petition',
        },
        {
          tag: '[OpSec]',
          text: 'Skip the meeting. Walk the Row at night and map every dome\'s sightline, so you know where they can\'t see.',
          check: {
            skill: 'opsec',
            dc: 13,
            bonuses: [
              { if: { trait: 'paranoid' }, add: 2, label: '+2 (paranoid)' },
              { if: { background: 'latchkey' }, add: 1, label: '+1 (you have always known the back ways home)' },
            ],
            success: 'mapped',
            fail: 'noticed',
            successEffects: [buff(BLIND_SPOTS), { flag: 'ev_city.knows_blind_spots' }, { xp: 'opsec', add: 20 }],
            failEffects: [{ stat: 'heat', add: 6 }, { flag: 'ev_city.noticed_mapping' }, { chance: 0.4, then: [{ complication: 'legal' }] }],
          },
        },
        {
          text: 'Say nothing. You\'ve got nothing to hide. (You have a great deal to hide.)',
          effects: [{ faction: 'fac.bureau', add: 2 }, { faction: 'fac.hood', add: -3 }],
          goto: 'nothing',
        },
      ],
    },
    moved: {
      speaker: 'narrator',
      text: [
        'You don\'t say "packet" once. You talk about St. Brendan\'s door, where people go to confess things; the Cathode\'s door, where people go to say things they can\'t say anywhere else; the corner of Ninth where the kids play stickball. You ask the city\'s man, politely, which of those he thinks is making the Row less safe.',
        'He doesn\'t have an answer. The room does. The cameras go up — but not over the church door, not outside the Cathode, not on the corner of Ninth. It\'s a small win. On the Row, lately, those are the only kind, and people hold on to them.',
      ],
    },
    channel_six: {
      speaker: 'narrator',
      text: [
        'You get three sentences in before you hear yourself say "distributed retention architecture" to a room full of grandmothers. By the fifth sentence the city\'s man is smiling, which is bad. By the seventh, someone at the back says "is he one of those hackers?" loudly enough for everyone to hear.',
        'The Channel 6 crew, who came for Mrs. Castellano\'s newspaper story, get you instead: eleven seconds of your face, lit badly, saying "networks" with enormous intensity. It runs at six and again at eleven. The cameras go up exactly where the city wanted them.',
      ],
    },
    petition: {
      speaker: 'list_activist',
      text: [
        'You spend a week on doorsteps with Nadia. She is relentless, funny, and knows the name of every child on the Row. You collect four hundred and twelve signatures. The city accepts them in a folder and puts the folder in a drawer.',
        '"They always put it in a drawer," Nadia says, unbothered, at the Cathode afterwards. "The drawer isn\'t the point. The point is four hundred and twelve people know each other\'s names now." She clinks her coffee against yours. "That\'s harder to watch."',
      ],
    },
    mapped: {
      speaker: 'narrator',
      text: [
        'Three nights, a notebook, and a lot of casual walking. You learn the domes are cheap: fixed lenses, no night vision worth the name, a dead zone under every one of them the width of a sidewalk. The alley behind the laundromat is dark end to end. So is the Cathode\'s back door.',
        'You don\'t write any of it down anywhere but your own head. You don\'t tell anyone. But you walk home differently now, without thinking about it, the way you\'d step around a puddle.',
      ],
    },
    noticed: {
      speaker: 'narrator',
      text: [
        'On your third pass down Ninth, a patrol car slows beside you. On your fourth, it stops. The officer is friendly, which is the worst possible version. "Evening. You\'ve been up and down this block a lot. Everything all right?"',
        'You tell him you\'re walking off a bad week. He writes something down anyway. The domes, it turns out, can see a person walking the same four blocks eleven times perfectly well, and somebody, somewhere, was watching the screen.',
      ],
    },
    nothing: {
      speaker: 'narrator',
      text: [
        'You say nothing. The meeting goes the way the flyer said it would. The cameras go up everywhere, including over the Cathode\'s door and the corner where the kids play.',
        { if: { stat: 'heat', gte: 30 }, text: 'The irony isn\'t lost on you: of everybody on Cannery Row, you\'re the one with the most to hide, and the one who said the least. You tell yourself it was strategy. It was, mostly.', else: 'Mrs. Castellano\'s newspaper keeps disappearing. The cameras never catch anyone. They were never, you suspect, looking for newspapers.' },
      ],
    },
  },
}

const safeStreets: EventDef = {
  id: 'ev_city_safestreets',
  category: 'city',
  weight: 2,
  when: { all: [free, fromDate(2005, 6, 1), { any: [actGte(3), surveilled] }] },
  scene: 'ev_city_safestreets_scene',
}

// ── ev_city_arcade_closing (one-off, Act III) ────────────────────────────────────

const arcadeScene: SceneDef = {
  id: 'ev_city_arcade_closing_scene',
  channel: 'dialog',
  title: 'GAME OVER',
  start: 'last_night',
  nodes: {
    last_night: {
      speaker: 'narrator',
      text: [
        'The Sodium Row arcade is closing. The sign over the door, which has read G LAXY since a letter burned out in 1996, has a banner under it now: LAST NIGHT — FREE PLAY — THANK YOU PORT LUMEN. Next month it becomes a "wireless lounge" with forty-dollar sandwiches.',
        'Inside it\'s packed: kids who were born after half these cabinets were built, men in their thirties holding their kids up to the controls, and Benny Oyelaran, who has run the place for thirty-one years, auctioning off the machines one by one from a stepladder with a microphone that only works if you hit it.',
        { if: { background: 'arcade_rat' }, text: 'You spent most of 1995 in here. You know which machines eat quarters, which joystick sticks to the left, and where the carpet is still sticky from a milkshake somebody spilled in 1993. This place raised you as much as anybody did.' },
        { if: around('flamer'), text: 'Across the room, Marcus Doyle — l33tKÎLLƏR himself, older, heavier, in the same hoodie — is standing by the Star Harrow cabinet with his hand on it like it\'s a horse he intends to buy.' },
      ],
      choices: [
        {
          tag: '[Business]',
          text: 'Bid on the Star Harrow cabinet. Your initials might still be on its high score table.',
          check: {
            skill: 'business',
            dc: 13,
            bonuses: [
              { if: { background: 'arcade_rat' }, add: 2, label: '+2 (you know exactly what it\'s worth, and what it isn\'t)' },
              { if: { stat: 'money', gte: 5000 }, add: 1, label: '+1 (everyone can tell you can afford it)' },
            ],
            success: 'won_cheap',
            fail: 'bidding_war',
          },
        },
        {
          tag: '[Fitness]',
          text: 'Forget buying anything. Set one last high score on Star Harrow before it goes.',
          check: {
            skill: 'fitness',
            dc: 14,
            bonuses: [
              { if: { background: 'arcade_rat' }, add: 3, label: '+3 (your hands remember)' },
              { if: { trait: 'caffeine_fiend' }, add: 1, label: '+1 (reflexes of a person on their fifth coffee)' },
            ],
            success: 'high_score',
            fail: 'second_place',
            successEffects: [{ stat: 'mood', add: 10 }, { stat: 'cred', add: 2 }, { flag: 'ev_city.final_high_score' }],
            failEffects: [{ stat: 'mood', add: -3 }],
          },
        },
        {
          text: 'Help Benny wind the cords and tape the boxes. Hear the stories.',
          effects: [{ faction: 'fac.hood', add: 3 }, { stat: 'mood', add: 4 }, { stat: 'stress', add: -5 }],
          goto: 'benny',
        },
        {
          tag: '[Leave]',
          text: 'Don\'t go in. Some places you remember better closed.',
          goto: 'outside',
        },
      ],
    },
    won_cheap: {
      speaker: 'narrator',
      text: [
        'You wait. You let three people bid it up and drop out. When Benny says "going once," you say a number, quietly, just loud enough, like you\'re doing him a favour — and he looks at you over the microphone and brings the hammer down before anyone else can breathe.',
        '"For a regular," he says, off-mic, when you pay him. "It should go home with somebody who played it." It takes four people to get it up your stairs.',
      ],
      effects: [{ money: -300 }, { item: 'ev_city_arcade_cabinet' }, { stat: 'mood', add: 10 }],
    },
    bidding_war: {
      speaker: 'narrator',
      text: [
        { if: around('flamer'), text: 'You bid. Marcus Doyle bids. You bid. Marcus Doyle bids, and turns around to look at you with the pure uncomplicated fury of a man who has never, in his life, let anything go. The room starts chanting. Benny stops hitting the microphone and just enjoys it.', else: 'You bid. A man in a golf shirt at the back bids. You bid. He bids, without looking up from his phone, like it costs him nothing, which it probably doesn\'t.' },
        'It\'s at nine hundred dollars. It\'s your bid to make.',
      ],
      choices: [
        {
          text: 'Nine hundred. You are not losing this.',
          req: { stat: 'money', gte: 900 },
          reqText: 'Requires $900',
          effects: [{ money: -900 }, { item: 'ev_city_arcade_cabinet' }, { stat: 'mood', add: 6 }, { if: around('flamer'), then: [{ npc: 'flamer', affinity: -3 }] }],
          goto: 'paid_dear',
        },
        {
          text: 'Let it go. Shake the winner\'s hand.',
          effects: [{ stat: 'mood', add: -4 }, { if: around('flamer'), then: [{ npc: 'flamer', affinity: 4 }] }],
          goto: 'let_go',
        },
      ],
    },
    paid_dear: {
      speaker: 'narrator',
      text: [
        'Nine hundred dollars. The hammer comes down. The room cheers like you won a war, which, in a way, you did — a small, stupid, wonderful one.',
        { if: around('flamer'), text: 'Marcus Doyle leaves without a word. On the forum that night he posts a single line: "hope u enjoy MY cabinet n00b." You print it out and tape it to the side of the machine.' },
      ],
    },
    let_go: {
      speaker: 'narrator',
      text: [
        { if: around('flamer'), text: 'You shake Marcus Doyle\'s hand. He looks at you, suspicious, then — for one second — just happy, like the kid he was in 1995, hanging off the joystick. "I\'ll let you play it," he mutters. "Sometimes. If you ask nice." He never does. But he says it.', else: 'The man in the golf shirt pays and has it loaded into a truck headed for a basement in Harbor Point, where it will be looked at, occasionally, by people who never played it. You try not to think about it.' },
      ],
    },
    high_score: {
      speaker: 'narrator',
      text: [
        'Eleven minutes on one quarter. The crowd builds behind you — first kids, then dads, then Benny himself, off the stepladder, standing at your shoulder breathing through his mouth. On the last ship you take the top spot with a margin that makes someone at the back swear in awe.',
        'You enter your initials. Benny takes a photograph of the screen. "That goes on the wall," he says. "Whatever they put in here. That goes on the wall." When the wireless lounge opens next month, it does: a framed photo by the register, a high score table, your initials at the top, forever.',
      ],
    },
    second_place: {
      speaker: 'narrator',
      text: [
        'You play the best game of your life and finish second. First place is a twelve-year-old girl in a soccer uniform who has been playing for twenty minutes, total, ever. She enters her initials — ZOE — and walks off without looking at the screen.',
        'Your initials are on the final table, one line down. Benny photographs it anyway. The photo goes on the wall of the wireless lounge: ZOE at the top, you right under her, which is, you decide eventually, exactly the right order for a city to remember its arcades in.',
      ],
    },
    benny: {
      speaker: 'Benny Oyelaran',
      text: [
        '"You know what I miss?" Benny says at 2 a.m., winding a power cord around his elbow. "Not the games. The noise. Forty machines all going at once. You couldn\'t hear yourself think in here. Kids came here so they didn\'t have to think." He taps the side of his head. "Now everybody\'s got the whole arcade in their pocket, and it\'s quiet, and everybody\'s thinking all the time. Nobody looks rested."',
        'He gives you the G from the old sign. It\'s been in the back room since 1996. "I kept it in case," he says. "In case of what, I don\'t know. In case of you, I guess."',
      ],
    },
    outside: {
      speaker: 'narrator',
      text: 'You stand across the street and watch the lights through the window, the crowd moving between the cabinets like a tide, and you don\'t cross. At midnight the sign goes out, G LAXY for the last time, and somebody on the sidewalk starts clapping, and then everybody does.',
    },
  },
}

const arcadeClosing: EventDef = {
  id: 'ev_city_arcade_closing',
  category: 'era',
  weight: 2,
  when: { all: [free, fromDate(2006, 9, 1), { any: [actGte(3), fromDate(2008, 0, 1)] }] },
  scene: 'ev_city_arcade_closing_scene',
}

// ── ev_city_cousin_wedding (one-off, Act II) ─────────────────────────────────────

const weddingScene: SceneDef = {
  id: 'ev_city_cousin_wedding_scene',
  channel: 'dialog',
  title: 'Cousin Tuyet\'s Wedding',
  start: 'hall',
  nodes: {
    hall: {
      speaker: 'narrator',
      text: [
        'Cousin Tuyet — Uncle Danh\'s youngest, who used to cheat at cards and blame you — is getting married at the parish hall on Ninth. There are two hundred guests, eleven kinds of noodles, a four-tier cake, and, as of forty minutes before the ceremony, no DJ. The DJ has the flu.',
        '"You have a laptop," Tuyet says, gripping your arm in a way that is not a question. "You have music. You\'re the computer one. Please."',
        { if: { npc: 'uncle', fate: 'ruined' }, text: 'Uncle Danh is wearing a borrowed watch and a very brave smile. He is going to give a toast about resilience. He has been practicing it on everyone.' },
        { if: { npc: 'uncle', fateNot: 'ruined' }, text: 'Uncle Danh is going around the tables handing out business cards for his newest venture, a fish-sauce import concern with "enormous upside." He has given one to the priest.' },
        ...partnerLines(
          'You brought Mira. Mira, who does not do weddings, is standing against the wall like a bodyguard, being inspected by four aunts at once. She is handling it the way she handles a hostile network: silently, taking notes.',
          'You brought Grace. Grace has already been adopted by three aunts and is being told which of your cousins to avoid, in detail, with diagrams drawn on napkins.',
        ),
      ],
      choices: [
        {
          tag: '[Systems]',
          text: 'Run the music off the laptop. How hard can it be?',
          check: {
            skill: 'systems',
            dc: 13,
            bonuses: [{ if: { background: 'tinkerer' }, add: 1, label: '+1 (you brought the right cable, for once)' }],
            success: 'dance',
            fail: 'handshake',
            successEffects: [
              { npc: 'mom', affinity: 5 },
              { faction: 'fac.hood', add: 2 },
              { if: withPartner, then: [buff(IN_LOVE), partnerAff(4)], else: [{ stat: 'mood', add: 8 }] },
            ],
            failEffects: [{ npc: 'mom', affinity: -6 }, { flag: 'ev_city.wedding_modem' }, { stat: 'mood', add: -6 }],
          },
        },
        {
          text: 'Let a cousin with a boombox handle the music. Dance with Mom instead.',
          effects: [{ npc: 'mom', affinity: 6 }, { stat: 'mood', add: 5 }, { if: around('dad'), then: [{ npc: 'dad', affinity: 3 }] }],
          goto: 'mom_dance',
        },
        {
          if: { npc: 'uncle', fateNot: 'ruined' },
          tag: '[Social]',
          text: 'Rescue the groom from Uncle Danh\'s fish-sauce investment pitch.',
          check: {
            skill: 'social',
            dc: 12,
            bonuses: [{ if: { background: 'class_clown' }, add: 2, label: '+2 (you\'ve been deflecting Uncle Danh since you were six)' }],
            success: 'rescued',
            fail: 'invested',
            successEffects: [{ stat: 'mood', add: 4 }, { faction: 'fac.hood', add: 1 }],
            failEffects: [costByAct(150, 300), { flag: 'ev_city.fish_sauce_investor' }],
          },
        },
        {
          if: withPartner,
          text: 'Slip out to the parish steps with the person you came with. Just for a minute.',
          effects: [partnerAff(6), buff(IN_LOVE)],
          goto: 'steps',
        },
      ],
    },
    dance: {
      speaker: 'narrator',
      text: [
        'You find a playlist, a cable, and the hall\'s ancient amplifier, and somehow the three of them agree to cooperate. Tuyet walks down the aisle to the song she wanted. The first dance is perfect. By ten o\'clock two hundred people are dancing, and Uncle Danh does the worm, and nobody will ever let him forget it.',
        ...partnerLines(
          'Mira dances exactly once, with you, badly and seriously, like she is solving a problem. Four aunts approve. It\'s the highest honour your family has.',
          'Grace dances with every aunt, both uncles, and a ring-bearer, and then with you, slowly, while the hall spins. "Your family is a lot," she says into your shoulder. "I love it."',
        ),
      ],
    },
    handshake: {
      speaker: 'narrator',
      text: [
        'Everything\'s fine through the processional. Then, at the exact moment the priest says "if anyone here has reason why these two should not be joined," your laptop — which you swore you\'d unplugged from the parish hall\'s phone jack — decides to dial in and check your mail.',
        'Through the hall\'s PA system, at full volume, for twenty-two seconds, two hundred wedding guests hear the modem handshake: the whine, the static, the screech, the crunching white noise, the little triumphant beeps. The priest waits for it to finish. It\'s the longest twenty-two seconds of your life.',
        'Uncle Danh laughs so hard he has to sit on the floor. Tuyet, to her eternal credit, says "I object" when it\'s over, and the whole hall collapses. It will be told at every family gathering for the rest of your life. Mom does not speak to you until the cake.',
      ],
    },
    mom_dance: {
      speaker: 'mom',
      text: [
        'Mom dances like she\'s twenty and slightly embarrassed about it. "You used to stand on my feet," she says. "At your cousin Hoa\'s wedding. You were four. You wouldn\'t get off."',
        { if: around('dad'), text: 'Halfway through, Dad cuts in — not on you, on her — and you watch your parents turn slowly under the paper lanterns, and for three minutes neither of them looks tired.' },
      ],
    },
    rescued: {
      speaker: 'narrator',
      text: 'You get between Uncle Danh and the groom with a plate of spring rolls and a question about Uncle Danh\'s knee surgery, which he loves to discuss. The groom mouths "thank you" and escapes to the bar. Uncle Danh talks to you about his knee for twenty-five minutes. It is, you decide, a small price for a man\'s marriage to start debt-free.',
    },
    invested: {
      speaker: 'narrator',
      text: 'You get between them. Uncle Danh simply redirects. By the end of the conversation you are, somehow, a shareholder in Mekong Pearl Fish Sauce Imports, LLC, and have written a check for an amount you don\'t remember agreeing to. He gives you a certificate he printed at the library. It has clip art of a fish.',
    },
    steps: {
      speaker: 'narrator',
      text: [
        'The parish steps are cool and quiet and smell like the harbor. Inside, the music thumps through the door.',
        byPartner(
          'Mira sits next to you and doesn\'t say anything for a long time. Then: "I never thought I\'d be at one of these. As a guest. With someone." She leans her shoulder against yours. "Your aunts are terrifying. I want them on my side in a fight."',
          'Grace takes her shoes off and puts her feet on the cold stone and sighs like she\'s been waiting all day to do it. "I\'m keeping you," she says, to the harbor, not to you. "Just so you know. I decided somewhere around the noodles."',
        ),
      ],
    },
  },
}

const cousinWedding: EventDef = {
  id: 'ev_city_cousin_wedding',
  category: 'family',
  weight: 2,
  when: { all: [free, momHere, { npc: 'uncle', fateNot: ABSENT }, actBetween(2, 3), { day: true, gte: 500 }, untilDate(2008, 0, 1)] },
  scene: 'ev_city_cousin_wedding_scene',
}

// ── ev_city_reunion (one-off, fall 2010) ─────────────────────────────────────────

const reunionScene: SceneDef = {
  id: 'ev_city_reunion_scene',
  channel: 'dialog',
  title: 'Class of 2001: Homecoming',
  start: 'gym',
  nodes: {
    gym: {
      speaker: 'narrator',
      text: [
        'Port Lumen Central High, homecoming weekend, nine years on. The committee couldn\'t wait for ten — "who knows where any of us will be by then," the invitation said, which felt like a joke when you read it. The gym smells exactly the same: floor wax, old sweat, the ghost of a thousand pep rallies. Someone has hung streamers in the school colours and a banner that says CLASS OF 2001 — WE MADE IT (MOSTLY).',
        'Your name tag says {name}. Someone at the sign-in table has added, underneath in ballpoint, "{handle}?" and a question mark, and then a second question mark.',
        { if: { any: [{ flag: 'a3.folk_hero' }, { stat: 'cred', gte: 60 }] }, text: 'Two different people ask, half-joking, if you\'re "the Handle" from the news. You laugh. They laugh. One of them keeps looking at you after.' },
        { if: { jobTrack: ['security', 'management'] }, text: 'Your job title fits on a business card only if you fold the card. People are impressed by it in the specific way people are impressed by things they don\'t understand.' },
        { if: { jobTrack: 'startup' }, text: 'You say "startup" and three people ask if you\'re hiring and one asks if you\'re rich. The answers are "sort of" and "on paper."' },
        { if: { job: null }, text: 'When people ask what you do, you say "freelance," which in 2010 means everything and nothing, and which is, technically, the truth.' },
        { if: { stat: 'money', gte: 250000 }, text: 'You drove here in a car that costs more than the new scoreboard. You parked it around the corner. You\'re not sure who you were hiding it from.' },
        { if: { flag: 'sys.jailed_once' }, text: 'Somebody saw your name in the paper that time. Nobody brings it up. Everybody brings it up, with their eyes, all night.' },
        { if: { npc: 'jax', fate: 'dead' }, text: 'On the memorial table by the doors, between the class president and a girl from homeroom who died in a car in 2004, there\'s Jax\'s senior photo. He\'s making a face. Of course he\'s making a face. Somebody chose that one on purpose.' },
        { if: { npc: 'jax', fate: ['arrested', 'jailed'] }, text: 'Three people ask where Jax is. You say he couldn\'t make it. It\'s technically true.' },
        { if: around('jax'), text: 'Jax came as your plus-one, whether or not you have one, because "we\'re a package deal, sixth grade, it\'s legally binding." He has already found the punch.' },
        ...partnerLines(
          'Mira came, which is its own miracle. She is standing near the bleachers being your plus-one with the posture of someone doing reconnaissance. A man you once beat at the science fair asks her what she does. She says "security." He leaves.',
          'Grace came, off a double shift, and has already diagnosed two classmates with things they should get looked at. They thank her. One of them cries a little. "Occupational hazard," she tells you.',
        ),
        { if: { flag: 'ev_city.blind_date_disaster' }, text: 'Robin Nguyen is here — married, two kids, a very nice spouse — and introduces you to that spouse, warmly, as "the modem guy." The spouse has heard the napkin story. Everyone, it turns out, has heard the napkin story.' },
        { if: { flag: 'ev_city.wedding_modem' }, text: 'Tuyet\'s husband went to this school. He has told the wedding-modem story at four separate tables before you get your first drink.' },
        { if: onRow(50), text: 'Half the Row\'s kids are here, and every single one of them tells you their grandmother says hello.' },
      ],
      choices: [
        {
          tag: '[Social]',
          text: 'Work the room. Tell your story the way you want it told.',
          check: {
            skill: 'social',
            dc: 14,
            bonuses: [
              { if: { trait: 'silver_tongue' }, add: 2, label: '+2 (silver tongue)' },
              { if: { background: 'class_clown' }, add: 2, label: '+2 (the class clown returns, older and wiser, but mostly older)' },
              { if: { flag: 'ev_city.known_face' }, add: -1, label: '−1 (people half-recognize you from the Channel 6 thing)' },
            ],
            success: 'room',
            fail: 'recognized',
            successEffects: [buff(OLD_FRIENDS), { stat: 'stress', add: -10 }, { stat: 'mood', add: 10 }],
            failEffects: [
              buff(OLD_WOUNDS),
              { stat: 'heat', add: 6 },
              { flag: 'ev_city.reunion_recognized' },
              { chance: 0.35, then: [{ complication: 'social' }] },
            ],
          },
        },
        {
          text: 'Find Mrs. Oduya, who ran the computer lab and let you stay after school, and thank her.',
          effects: [{ stat: 'mood', add: 8 }, { stat: 'stress', add: -6 }],
          goto: 'oduya',
        },
        {
          text: 'Tell the truth — the whole strange decade — to the one person who asks properly.',
          effects: [{ stat: 'stress', add: -8 }, { stat: 'mood', add: 4 }],
          goto: 'truth',
        },
        {
          tag: '[Leave]',
          text: 'Leave before the slideshow. You already know how it ends.',
          effects: [{ stat: 'mood', add: -2 }],
          goto: 'left',
        },
      ],
    },
    room: {
      speaker: 'narrator',
      text: [
        'You find the version of the story that\'s true and still fits in a gym: you started fixing computers, you got good at it, the city got strange, you kept going. You get laughs in the right places. You ask everyone about their kids, and remember the kids\' names when they come back from the bar.',
        'By midnight you\'re sitting on the bleachers with six people you haven\'t thought about in nine years, passing a bottle of something terrible and remembering the time the chemistry teacher set his own tie on fire. It feels, for an hour, like none of it happened — or like all of it did, and you still got to keep this.',
      ],
    },
    recognized: {
      speaker: 'narrator',
      text: [
        'It goes fine for twenty minutes. Then Dana Albrecht from the yearbook committee, who remembers everything about everyone, says your old handle out loud — loudly, delightedly, across the drinks table — and adds, "Weren\'t you always, like, breaking into the school computers?"',
        'The man standing next to her, whose name tag says KEITH and whose lanyard says REGIONAL FIELD OFFICE, turns and looks at you with polite, professional interest. He asks what you do now. You tell him. He nods slowly, the way people nod when they are filing something.',
        'You leave before the slideshow. You don\'t sleep well for a while.',
      ],
    },
    oduya: {
      speaker: 'Mrs. Oduya',
      text: [
        'She\'s smaller than you remember and exactly as sharp. She recognizes you before you\'re close enough to read the tag. "The one who reinstalled the whole lab over Christmas break," she says, "without asking me first."',
        'You thank her. She waves it off, and then doesn\'t. "I always knew you\'d end up in computers," she says, holding both your hands. "I hoped it would be the nice kind." She looks at you for a long moment, the way teachers do. "Is it the nice kind?"',
        { if: { any: [{ stat: 'heat', gte: 40 }, { flag: 'sys.raided' }] }, text: 'You say yes. She squeezes your hands anyway, like she heard the other answer and forgives you for it.', else: 'You tell her it\'s mostly the nice kind. She laughs, delighted. "Mostly is what the rest of us get, too."' },
      ],
    },
    truth: {
      speaker: 'narrator',
      text: [
        'It\'s a woman you barely knew in school — Priti, from the back row of Spanish — who asks, at the edge of the dance floor, "No, but really. What happened to you?" and actually waits.',
        'So you tell her. Not the names, not the places. But the shape of it: a kid with a modem in a damp flat, a city that learned to read everyone, the people you kept and the people you lost track of. It takes forty minutes. She doesn\'t interrupt.',
        { if: momGone, text: 'When you get to your mother, you have to stop for a second. Priti just waits. She lost hers two years ago, she says. You sit with that together for a while, two strangers who went to the same school.' },
        '"God," she says at the end. "I sell insurance." She means it as a joke and it isn\'t one. Then she hugs you, hard, like you both survived something. Maybe you did.',
      ],
    },
    left: {
      speaker: 'narrator',
      text: [
        'You slip out before the lights go down. Through the gym doors you can hear the slideshow start: the music everyone slow-danced to in 2001, the laughter, a few names read out that make the room go quiet.',
        { if: { any: [darkTurn, married] }, text: 'You sit in the car for a long time with the engine off. Nine years. You were eighteen the week it all started. You try to remember what you wanted, then, and find you can\'t — only that it was smaller, and that you would have been happy with it.', else: 'You sit in the car for a long time with the engine off, and then you drive home the long way, past Cannery Row, just to see the lights.' },
      ],
    },
  },
}

const reunion: EventDef = {
  id: 'ev_city_reunion',
  category: 'life',
  weight: 3,
  // Fall 2010, so it lands before the finale (the ending fires at the day-3400 floor, late Dec 2010).
  when: { all: [free, fromDate(2010, 8, 1)] },
  scene: 'ev_city_reunion_scene',
}

export default defineContent({
  items,
  scenes: [electionScene, potholeScene, safeStreetsScene, arcadeScene, weddingScene, reunionScene],
  events: [electionDay, potholeHotline, safeStreets, arcadeClosing, cousinWedding, reunion],
})
