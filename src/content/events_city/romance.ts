/**
 * events_city — ROMANCE & DATING. Strangers when you're single; the person you love when you're not.
 *
 *  - ev_city_blind_date     one-off, Act I–II, unattached: Mom (or Jax) sets you up with Robin.
 *  - ev_city_speed_dating   repeatable, Act II–III, unattached: seven minutes, seven strangers.
 *  - ev_city_date_night     repeatable, with a partner: a night for the two of you — or not.
 *  - ev_city_late_again     one-off, with a partner, once the life has teeth: they waited up.
 *
 * Romance guard: this pack NEVER writes a romance state or `life.partner`. Stranger dates only fire
 * while you have no partner and aren't flirting with or dating Mira or Grace (`unattached`), and they
 * never become relationships. Partner beats only read the ladder (`withPartner`) and move affinity.
 * `side.partner_knows` (PKG-11's confession) is read for flavor, never set.
 */
import { defineContent } from '@/engine/registry'
import type { BuffDef, EventDef, SceneDef } from '@/engine/types'
import {
  GOOD_DATE,
  HEARTSICK,
  IN_LOVE,
  WELL_FED,
  actGte,
  actLte,
  around,
  buff,
  byPartner,
  cathodeOpen,
  costByAct,
  darkTurn,
  free,
  livingTogether,
  married,
  momHere,
  partnerAff,
  partnerIs,
  partnerLines,
  unattached,
  withPartner,
} from './_shared'

// ── Local buffs ────────────────────────────────────────────────────────────────

const HOME_BY_MIDNIGHT: BuffDef = {
  id: 'ev_city_home_by_midnight',
  name: 'Home by Midnight',
  desc: 'You promised, and you\'re keeping it. Less gets done after dark. More of you gets home.',
  days: 28,
  mods: [{ key: 'efficiency', mult: 0.96 }, { key: 'stress.relief', mult: 1.12 }, { key: 'mood.daily', add: 0.3 }],
}

const SHUT_OUT: BuffDef = {
  id: 'ev_city_cold_shoulder',
  name: 'Cold Shoulder',
  desc: 'The apartment has two people in it and one conversation nobody is having. It follows you to the desk.',
  days: 21,
  bad: true,
  mods: [{ key: 'mood.daily', add: -0.5 }, { key: 'stress.relief', mult: 0.9 }],
}

// ── ev_city_blind_date (one-off, Act I–II) ───────────────────────────────────────

const blindDateScene: SceneDef = {
  id: 'ev_city_blind_date_scene',
  channel: 'dialog',
  title: 'A Table for Two',
  start: 'setup',
  nodes: {
    setup: {
      speaker: 'narrator',
      text: [
        {
          if: momHere,
          text: 'Mom has arranged it. Mom arranged it with Mrs. Nguyen from church, whose kid Robin is "studying accounting, very responsible, very nice smile," and Mom has told Mrs. Nguyen that you are "in computers, very successful," which is a sentence that has never been true on the same day twice.',
          else: 'Jax has arranged it. "my cousins roommate, Robin, accounting major, v funny, i told them ur a computer genius and also normal," he typed, which is at least half a lie.',
        },
        { if: cathodeOpen, text: 'The venue is the Cathode, which means Sal will be watching from behind the counter with the expression of a man at a nature documentary.', else: 'The venue is the noodle place on Fifth with the fish tank and the one working ceiling fan.' },
      ],
      next: 'date',
    },
    date: {
      speaker: 'Robin',
      text: [
        'Robin arrives exactly on time: sharp, funny, a laugh that turns heads, a copy of a tax code handbook sticking out of their bag like a paperback thriller. "So," they say, sliding into the booth, "I was promised a very successful computer genius who is also normal. I\'m going to need you to pick one."',
      ],
      choices: [
        {
          tag: '[Social]',
          text: 'Be charming. Ask real questions. Listen to the answers.',
          check: {
            skill: 'social',
            dc: 12,
            bonuses: [
              { if: { trait: 'silver_tongue' }, add: 2, label: '+2 (silver tongue)' },
              { if: { trait: 'empath' }, add: 2, label: '+2 (you actually want to know)' },
              { if: { background: 'class_clown' }, add: 1, label: '+1 (you make them laugh first)' },
            ],
            success: 'good',
            fail: 'modem',
            successEffects: [buff(GOOD_DATE), { stat: 'mood', add: 8 }, { flag: 'ev_city.blind_date_good' }, { if: momHere, then: [{ npc: 'mom', affinity: 3 }] }],
            failEffects: [buff(HEARTSICK), { stat: 'mood', add: -6 }, { flag: 'ev_city.blind_date_disaster' }, { if: momHere, then: [{ npc: 'mom', affinity: -2 }] }],
          },
        },
        {
          text: 'Be honest: "I\'m only here because my mother made a deal with God and Mrs. Nguyen."',
          if: momHere,
          effects: [{ stat: 'mood', add: 5 }, { flag: 'ev_city.blind_date_honest' }],
          goto: 'honest',
        },
        {
          tag: '[Leave]',
          text: 'Fake a pager emergency at the twenty-minute mark and bolt.',
          effects: [{ stat: 'mood', add: -2 }, { flag: 'ev_city.blind_date_bailed' }, { if: momHere, then: [{ npc: 'mom', affinity: -4 }], else: [{ npc: 'jax', affinity: -2 }] }],
          goto: 'bailed',
        },
        {
          if: { trait: 'paranoid' },
          text: 'Spend the evening quietly trying to work out who really sent Robin, and why.',
          effects: [{ stat: 'mood', add: -3 }, { stat: 'stress', add: 3 }],
          goto: 'paranoid',
        },
      ],
    },
    good: {
      speaker: 'narrator',
      text: [
        'It\'s easy. That\'s the surprise. You ask Robin why accounting and get a twenty-minute answer about how every business is a story told in numbers, and most of them are lying, and they want to be the one who can tell. You find yourself saying things you\'ve never said to anyone outside a chat window.',
        'At the end, on the sidewalk, Robin says: "You\'re great. You\'re also very clearly married to that computer." They say it kindly. You don\'t argue. You get coffee twice more that month, and it\'s lovely, and it\'s clear to both of you it\'s a friendship with good timing rather than a love story.',
        'That spring, Robin does your taxes for free and finds you a deduction you didn\'t know existed. It\'s the most romantic thing anyone has ever done for you.',
      ],
      effects: [{ money: 60 }],
    },
    modem: {
      speaker: 'narrator',
      text: [
        'It starts fine. Then Robin, being polite, asks what you\'re working on right now, and something in your brain comes unplugged.',
        'You talk about modem initialization strings for forty minutes. You draw a diagram on a napkin. You draw a second diagram on a second napkin, to correct the first. At some point you notice that Robin has finished their soup, their tea and, you think, their degree.',
        '"This was really… informative," Robin says, gathering their coat and both napkins, which they seem to want as evidence. By Sunday, Mrs. Nguyen has told Mom everything. By Monday, the whole church knows about the napkins.',
      ],
    },
    honest: {
      speaker: 'Robin',
      text: [
        'Robin stares at you. Then they laugh so hard that Sal looks over. "Oh, thank God. My mother told me you were a doctor." They reach across the table and shake your hand. "Robin. Hostage."',
        'You spend two hours trading stories about your mothers. It\'s not a date. It\'s better than a date: it\'s an alliance. You both report back that it "went really well" and "we\'ll see," which buys each of you six months of peace.',
      ],
    },
    bailed: {
      speaker: 'narrator',
      text: [
        'At the twenty-minute mark your pager goes off. It didn\'t go off; you pressed the button on the side under the table. "Emergency," you say. "Server. Very serious. People could die." Robin nods slowly, with the expression of someone who has seen this exact move before and rated it.',
        { if: momHere, text: 'Mom hears about it by the time you get home. She doesn\'t yell. She just says, "People could die?" in a voice that suggests one person, specifically, could.', else: 'Jax hears about it before you get home. "PEOPLE COULD DIE??" he types. "dude. DUDE. robin is telling EVERYONE."' },
      ],
    },
    paranoid: {
      speaker: 'narrator',
      text: [
        'Robin is funny and friendly and asks about your job. Which is exactly what someone would do if they had been sent to ask about your job. You answer in careful, vague, non-committal sentences. You check the door every time the bell rings. You pay in cash.',
        'On the sidewalk, Robin says, "Well, that was the weirdest dinner of my life," and means it as a compliment, maybe. You go home and spend an hour convinced Mrs. Nguyen is a cutout. She is not. She runs the church bake sale.',
      ],
    },
  },
}

const blindDate: EventDef = {
  id: 'ev_city_blind_date',
  category: 'romance',
  weight: 2,
  when: { all: [free, actLte(2), { day: true, gte: 60 }, unattached, { any: [momHere, around('jax')] }] },
  scene: 'ev_city_blind_date_scene',
}

// ── ev_city_speed_dating (repeatable, Act II–III) ────────────────────────────────

const speedScene: SceneDef = {
  id: 'ev_city_speed_dating_scene',
  channel: 'dialog',
  title: 'Seven Minutes',
  start: 'bell',
  nodes: {
    bell: {
      speaker: 'narrator',
      effects: [{ var: 'ev_city.speed_dates', add: 1 }],
      text: [
        'Terminal Velocity has pushed its computer desks against the walls and set up fourteen little tables with a candle on each. SPEED DATING — SEVEN MINUTES, SEVEN STRANGERS, says a sign in marker. The organizer has a bell. She is not afraid to use it.',
        { if: { var: 'ev_city.speed_dates', gte: 2 }, text: '"Back again!" she says when she sees you, with a pity so warm you could toast bread on it. She gives you the table by the window. It\'s the good table. She thinks you need it.' },
        { if: darkTurn, text: 'Half the room checks their phone between rounds. The other half watches the door. It\'s that kind of year in Port Lumen.' },
        'Ding.',
      ],
      choices: [
        {
          tag: '[Social]',
          text: 'Work the room. Seven strangers, seven good conversations, no matter what.',
          check: {
            skill: 'social',
            dc: 13,
            bonuses: [
              { if: { trait: 'silver_tongue' }, add: 2, label: '+2 (silver tongue)' },
              { if: { trait: 'empath' }, add: 1, label: '+1 (you notice who\'s nervous and go easy)' },
              { if: { flag: 'ev_city.blind_date_disaster' }, add: 1, label: '+1 (you will never mention modems again)' },
            ],
            success: 'room',
            fail: 'fix_my_computer',
            successEffects: [buff(GOOD_DATE), { stat: 'mood', add: 6 }],
            failEffects: [buff(HEARTSICK), { stat: 'mood', add: -4 }],
          },
        },
        {
          tag: '[Business]',
          text: 'Pitch yourself like a startup. Vision. Traction. A hockey-stick growth chart of personal improvement.',
          check: {
            skill: 'business',
            dc: 13,
            bonuses: [{ if: { jobTrack: ['startup', 'management'] }, add: 2, label: '+2 (you do this all day, unfortunately)' }],
            success: 'pitched',
            fail: 'synergy',
            successEffects: [buff(GOOD_DATE), { stat: 'mood', add: 5 }, { xp: 'business', add: 10 }],
            failEffects: [buff(HEARTSICK), { stat: 'mood', add: -3 }],
          },
        },
        {
          text: 'Tell every one of them exactly what you do for a living, and watch their faces.',
          effects: [{ stat: 'stress', add: -4 }, { stat: 'mood', add: 2 }],
          goto: 'truth',
        },
        {
          tag: '[Leave]',
          text: 'Drink the free wine, say hello to one table, and slip out the side door.',
          effects: [{ stat: 'mood', add: 1 }],
          goto: 'slipped',
        },
      ],
    },
    room: {
      speaker: 'narrator',
      text: [
        'A marine biologist who hates boats. A retired jazz drummer who is here "for research." A bus driver with an encyclopedic knowledge of Port Lumen\'s abandoned streetcar lines, who gives you a hand-drawn map. A nurse who says you have "good posture for a computer person," which you decide is flirting.',
        'At the end, three cards in your box have your number circled. You don\'t call any of them in the end. You didn\'t need to. You walk home feeling like a person other people are glad to have met.',
      ],
    },
    fix_my_computer: {
      speaker: 'narrator',
      text: [
        'Round one: "Oh, you\'re in computers? My laptop does this thing where—" Round two: "Can I ask you something about my printer?" Round three: a very nice woman brings her actual laptop, in its bag, to the table.',
        { if: around('flamer'), text: 'Round five is Marcus Doyle. You both freeze. He says "n00b," reflexively, out loud, at a speed-dating event, and then looks as horrified as you are. You spend seven minutes in total silence. It is, somehow, the most honest conversation of the night.', else: 'Round five is a man who wants you to explain the internet to him, "from the start." You get as far as "so there are wires" before the bell.' },
        'You fix four computers. You get no numbers. The organizer gives you a free coffee on the way out, like a consolation prize at a fair.',
      ],
    },
    pitched: {
      speaker: 'narrator',
      text: 'You pitch it perfectly: the origin story, the pivot, the vision for the next five years. Three people say they want to "circle back." One asks if you\'re raising. You go home with a napkin that says "call me — seriously — also my brother is looking for a CTO," and a warm feeling that is only partly the wine.',
    },
    synergy: {
      speaker: 'narrator',
      text: 'In round two you use the word "synergy." In round three you hear yourself say "I\'m really passionate about leveraging my core competencies," and the woman across from you says, very gently, "Is this a job interview?" There is no round four. There are seven rounds. It doesn\'t matter.',
    },
    truth: {
      speaker: 'narrator',
      text: [
        { if: { any: [{ stat: 'heat', gte: 40 }, actGte(3)] }, text: 'You say "computer security" seven times and watch seven faces decide, individually, whether you\'re a cop or a criminal. Four decide cop. Two decide criminal. The seventh asks if there\'s a difference anymore, and you don\'t have an answer, and she writes her number on the back of your hand anyway.', else: 'You say "I fix computers and sometimes I break them, for a living, sort of" seven times, and get seven completely different reactions, including one person who laughs so hard she knocks over the candle.' },
        'It\'s the least lonely you\'ve felt in a while, not having to pretend. You don\'t get a date. You get a good night.',
      ],
    },
    slipped: {
      speaker: 'narrator',
      text: 'You drink the free wine, meet a very pleasant woman who restores antique clocks, and slip out the side door before round two. On the walk home you realize you would have liked to hear about the clocks. You don\'t go back. You almost do.',
    },
  },
}

const speedDating: EventDef = {
  id: 'ev_city_speed_dating',
  category: 'romance',
  weight: 1,
  repeatable: true,
  cooldownDays: 300,
  when: { all: [free, { day: true, gte: 450 }, actGte(2), unattached] },
  scene: 'ev_city_speed_dating_scene',
}

// ── ev_city_date_night (repeatable, with a partner) ──────────────────────────────

const dateNightScene: SceneDef = {
  id: 'ev_city_date_night_scene',
  channel: 'dialog',
  title: 'Date Night',
  start: 'tonight',
  nodes: {
    tonight: {
      speaker: 'narrator',
      text: [
        { if: married, text: 'It\'s your anniversary. Not the wedding one — the other one, the first-date one, which you both agreed years ago was the real one.' },
        { if: { all: [livingTogether, { not: married }] }, text: 'It\'s been a long month in a small apartment with two people\'s cables, schedules and moods. You promised each other one night a month that belongs to nobody else.' },
        { if: { not: livingTogether }, text: 'You\'ve been seeing each other long enough that there\'s a "your usual" at two different restaurants. Tonight was supposed to be the night.' },
      ],
      next: 'partner',
    },
    partner: {
      speaker: 'narrator',
      text: [
        ...partnerLines(
          'Mira has taken tonight off. She has told you this in the tone of someone who has never taken anything off in her life and is not sure she\'s doing it right. She\'s wearing the green jacket. She only wears the green jacket when it matters.',
          'Grace has traded two night shifts and a weekend to get tonight free, and she isn\'t going to mention it, and you are going to know anyway, because she\'s asleep on the couch at six with her shoes still on, setting an alarm for seven so she\'s awake for you.',
        ),
        { if: { all: [{ flag: 'ev_city.date_gift' }, partnerIs('mira')] }, text: 'The printout of your puzzle\'s love letter is still taped inside her closet door, where she thinks you haven\'t seen it.' },
        { if: { all: [{ flag: 'ev_city.date_gift' }, partnerIs('grace')] }, text: 'Her mother\'s cassettes live in the car now. She plays them on the way to every shift.' },
        { if: { all: [{ flag: 'ev_city.ate_the_tape' }, partnerIs('grace')] }, text: 'The pieces of her mother\'s tape are in a jar on the bookshelf. She hasn\'t thrown them out. Neither of you mentions them.' },
        { if: { flag: 'ev_city.caught_lying' }, text: 'Things have been careful between you since the night in the kitchen. Tonight is supposed to help with that.' },
        { if: darkTurn, text: 'Your pager is on the table. You both look at it.' },
      ],
      choices: [
        {
          text: 'Splurge. The rooftop place in Harbor Point, the one with the view of the whole Sound.',
          req: { stat: 'money', gte: 300 },
          reqText: 'Requires $300',
          effects: [costByAct(150, 300), buff(IN_LOVE), partnerAff(6)],
          goto: 'rooftop',
        },
        {
          if: partnerIs('mira'),
          tag: '[Programming]',
          text: 'Make her a puzzle: a tiny locked program with a love letter inside. She\'ll crack it. That\'s the point.',
          check: {
            skill: 'programming',
            dc: 13,
            bonuses: [{ if: { background: 'mathlete' }, add: 2, label: '+2 (you know how she thinks: in proofs)' }],
            success: 'puzzle',
            fail: 'puzzle_crash',
            successEffects: [buff(IN_LOVE), { npc: 'mira', affinity: 10 }, { flag: 'ev_city.date_gift' }],
            failEffects: [{ npc: 'mira', affinity: -5 }, buff(HEARTSICK)],
          },
        },
        {
          if: partnerIs('grace'),
          tag: '[Hardware]',
          text: 'Fix the dead tape deck in her car, so her mother\'s old cassettes play again.',
          check: {
            skill: 'hardware',
            dc: 13,
            bonuses: [{ if: { background: 'tinkerer' }, add: 2, label: '+2 (tape decks are your childhood)' }],
            success: 'tape',
            fail: 'tape_eaten',
            successEffects: [buff(IN_LOVE), { npc: 'grace', affinity: 10 }, { flag: 'ev_city.date_gift' }],
            failEffects: [{ npc: 'grace', affinity: -6 }, buff(HEARTSICK), { flag: 'ev_city.ate_the_tape' }],
          },
        },
        {
          text: 'Cook at home. Badly. Together.',
          effects: [partnerAff(4), { stat: 'stress', add: -8 }, { stat: 'mood', add: 6 }],
          goto: 'cook',
        },
        {
          text: 'Work through it. There\'s a deadline. You\'ll make it up to them.',
          effects: [
            { if: { flag: 'ev_city.missed_date_night' }, then: [partnerAff(-12)], else: [partnerAff(-8)] },
            buff(HEARTSICK),
          ],
          goto: 'worked',
        },
      ],
    },
    rooftop: {
      speaker: 'narrator',
      text: [
        'The rooftop place has white tablecloths, a waiter who pronounces every dish like it\'s a person\'s name, and the whole Lumen Sound spread out under you in lights. The ferry goes by, lit up like a birthday cake.',
        byPartner(
          'Mira pretends to be unimpressed for exactly one course. Then she puts her hand flat on the table, palm up, without looking at you, and leaves it there until you take it.',
          'Grace looks at the view for a long time and says, "I can see the hospital from here." Then: "It looks so small." She doesn\'t check her pager once. You\'ve never seen her not check her pager.',
        ),
      ],
    },
    puzzle: {
      speaker: 'mira',
      text: [
        'She cracks it in eleven minutes, which is four minutes longer than you expected and, you realize, is her being generous. The letter unfolds in the terminal a line at a time.',
        'She reads it twice. Then she closes the laptop very carefully, as if it\'s something breakable, and says, "Your error handling is sloppy." Her voice does something at the end of the sentence that you will remember for the rest of your life.',
      ],
    },
    puzzle_crash: {
      speaker: 'mira',
      text: [
        'She runs it. It locks. Then it keeps locking — past the puzzle, past the letter, into her machine, which freezes solid with three days of unsaved work open in another window.',
        '"It\'s fine," she says, in the voice she uses when a thing is extremely not fine. She spends the rest of date night rebuilding what she lost while you sit next to her holding a letter nobody can read. At midnight she says, not looking up, "It was a nice idea." It\'s the worst thing she could have said.',
      ],
    },
    tape: {
      speaker: 'grace',
      text: [
        'It takes you a whole afternoon in her car in the hospital parking lot, the dashboard in pieces on your lap: a belt gone to goo, a pinch roller worn flat, a head so dirty it hasn\'t read a note since 1996.',
        'That night you put in one of her mother\'s cassettes — handwritten label, HIGHLIFE 88 — and press play. Grace sits very still in the driver\'s seat. Then she turns it up, and puts her head on the steering wheel, and laughs and cries at the same time for the whole first side.',
      ],
    },
    tape_eaten: {
      speaker: 'grace',
      text: [
        'It plays. For eleven seconds it plays, her mother\'s music, and Grace\'s face opens up like a window. Then there\'s a sound like somebody chewing a plastic bag, and the deck eats the tape.',
        'You get it out. It\'s in pieces, a spaghetti of brown ribbon on your lap. Grace doesn\'t yell. She just takes the pieces out of your hands, one by one, very carefully, like a patient, and puts them in her coat pocket, and doesn\'t say anything on the drive home. It was the only copy.',
      ],
    },
    cook: {
      speaker: 'narrator',
      text: [
        'You make a disaster: a sauce that separates, pasta that welds itself into a single object, a smoke alarm that goes off twice.',
        byPartner(
          'Mira eats it with total seriousness and grades each course out loud. The sauce gets a C. The smoke alarm gets an A. She laughs, really laughs, the one you hear maybe twice a year, and leans on you on the couch until she falls asleep.',
          'Grace declares the kitchen a trauma bay and triages the sauce. You end up eating cereal on the kitchen floor at ten p.m., your back against the cabinets, her head on your shoulder. It\'s the best meal of the year.',
        ),
      ],
      effects: [buff(WELL_FED)],
    },
    worked: {
      speaker: 'narrator',
      text: [
        { if: { flag: 'ev_city.missed_date_night' }, text: 'Again. You said it again. "Next time," you say, and hear exactly how many times you\'ve said it, and so do they.' },
        byPartner(
          'Mira says, "Sure," and goes back to her own screen, and doesn\'t argue, which is how you know. At 2 a.m. you look over and she\'s still in the green jacket.',
          'Grace says, "Okay," and takes off her shoes, and goes to bed at eight like it\'s any other night. She set the alarm for seven for nothing. You hear her turn it off.',
        ),
      ],
      effects: [{ flag: 'ev_city.missed_date_night' }],
    },
  },
}

const dateNight: EventDef = {
  id: 'ev_city_date_night',
  category: 'romance',
  weight: 2,
  repeatable: true,
  cooldownDays: 240,
  when: { all: [free, withPartner] },
  scene: 'ev_city_date_night_scene',
}

// ── ev_city_late_again (one-off, with a partner, once the life has teeth) ────────

const lateAgainScene: SceneDef = {
  id: 'ev_city_late_again_scene',
  channel: 'dialog',
  title: 'Late Again',
  start: 'kitchen',
  nodes: {
    kitchen: {
      speaker: 'narrator',
      text: [
        'You come home at ten past three. The kitchen light is on.',
        byPartner(
          'Mira is sitting at the kitchen table in the dark except for that one light, your pager in front of her like a piece of evidence. She doesn\'t ask where you were. She has never needed to ask where you were. She asks, "Whose network," flatly, and then, before you can answer: "No. Don\'t. Tell me if it was careful."',
          'Grace is at the kitchen table in scrubs she hasn\'t changed out of, a cup of tea gone cold in front of her. She looks at you the way she looks at patients who say they "just fell": gently, all the way through. "I\'m not going to ask what," she says. "I\'m going to ask how often."',
        ),
        { if: { flag: 'side.partner_knows' }, text: 'They know what you do. You told them, and they stayed. This isn\'t about what. It\'s about how often, and how carefully, and whether one night you just won\'t come home.' },
        { if: { stat: 'heat', gte: 50 }, text: 'There was a car parked across the street when you came in, with its engine running and nobody getting out. You both know it. Neither of you mentions it.' },
      ],
      choices: [
        {
          tag: '[Social]',
          text: '"It was a work thing. A server went down. I\'m sorry. Let\'s go to bed." Say it like it\'s true.',
          check: {
            skill: 'social',
            dc: 15,
            bonuses: [
              { if: { trait: 'silver_tongue' }, add: 2, label: '+2 (silver tongue)' },
              { if: withPartner, add: -2, label: '−2 (they know you; that\'s the whole problem)' },
            ],
            success: 'believed',
            fail: 'caught',
            successEffects: [{ stat: 'stress', add: -3 }, { flag: 'ev_city.lied_well' }],
            failEffects: [
              partnerAff(-10),
              buff(HEARTSICK),
              { flag: 'ev_city.caught_lying' },
              { stat: 'stress', add: 10 },
              { complication: 'social' },
            ],
          },
        },
        {
          text: '"Home by midnight. For a while. I mean it." And mean it.',
          effects: [buff(HOME_BY_MIDNIGHT), partnerAff(6), { flag: 'ev_city.home_by_midnight' }],
          goto: 'promise',
        },
        {
          text: 'Sit down across from them. Tell them as much as you can without putting them in it.',
          effects: [partnerAff(3), { stat: 'stress', add: -5 }, { flag: 'ev_city.half_truth' }],
          goto: 'sit',
        },
        {
          tag: '[Leave]',
          text: '"I can\'t do this right now." Go to bed.',
          effects: [partnerAff(-6), buff(SHUT_OUT), { flag: 'ev_city.shut_out' }],
          goto: 'bed',
        },
      ],
    },
    believed: {
      speaker: 'narrator',
      text: [
        'They look at you for a long second. Then they nod, and rinse the cup, and turn off the light. In bed, they fall asleep with their back against yours, the way they always do.',
        'You lie awake until dawn. It worked. You\'re good at this. You have never, in your whole life, wished so much that you weren\'t.',
      ],
    },
    caught: {
      speaker: 'narrator',
      text: [
        byPartner(
          '"A server," Mira repeats. She holds up your pager. "Your server paged you from a payphone on Sodium Row at 1:40 a.m. with a code I taught you." She puts it down. "Don\'t. Don\'t do that to me. I can take a lot of things. I can\'t take being handled."',
          '"You have grease on your cuff," Grace says quietly, "and you smell like the inside of a server room, and your pulse is a hundred and ten. I work in an ER." She stands and takes her cup to the sink. "I\'m not stupid. Please don\'t treat me like I\'m stupid. That\'s the only thing I\'ve asked."',
        ),
        'They sleep on the couch. In the morning they\'re polite, which is worse than angry. It\'s weeks before the apartment feels like it has two people living in it again, instead of one person and a secret.',
      ],
    },
    promise: {
      speaker: 'narrator',
      text: [
        byPartner(
          'Mira studies you like a line of code she suspects. "Midnight," she says. "I\'m setting a timer." She actually sets a timer. For a month, it goes off at 11:45 every night in the other room, a small electronic chirp, and you come home.',
          'Grace nods slowly. "Okay," she says. "Midnight." She doesn\'t say she\'ll hold you to it. She doesn\'t have to. For a month there\'s a cup of tea waiting on the table at 11:59, and it\'s always still warm.',
        ),
        'The work goes slower. You go home. It turns out to be worth more than the work.',
      ],
    },
    sit: {
      speaker: 'narrator',
      text: [
        'You sit down. You don\'t tell them the names, or the places, or anything that would make them a witness to something. You tell them what it feels like: the hours, the itch, the particular 3 a.m. loneliness of a job nobody can know you do.',
        byPartner(
          'Mira listens without interrupting, which she never does. "I know," she says at the end. "I know exactly what it feels like. That\'s why I\'m scared." She reaches across the table. "Be careful for both of us."',
          'Grace listens the way she listens to a patient describing pain: carefully, without flinching, counting. "Okay," she says at the end. "Thank you for telling me the part you could." She takes your hand. "Now tell me you\'ll be here in the morning."',
        ),
      ],
    },
    bed: {
      speaker: 'narrator',
      text: [
        'You go to bed. They stay in the kitchen with the light on. You hear the cup go into the sink at four, and the couch creak at half past.',
        'In the morning nobody mentions it. That\'s the thing about not mentioning something: once you start, you can keep going for a very long time.',
      ],
    },
  },
}

const lateAgain: EventDef = {
  id: 'ev_city_late_again',
  category: 'romance',
  weight: 2,
  when: { all: [free, withPartner, { any: [{ stat: 'heat', gte: 30 }, darkTurn] }, actGte(2)] },
  scene: 'ev_city_late_again_scene',
}

export default defineContent({
  scenes: [blindDateScene, speedScene, dateNightScene, lateAgainScene],
  events: [blindDate, speedDating, dateNight, lateAgain],
})
