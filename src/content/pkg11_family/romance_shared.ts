/**
 * PKG-11 — the shared upper rungs of the romance ladder (bible §8 Romance), written
 * partner-agnostic and branched on `life.partner` (the str flag set at `dating`, exclusive):
 *   side_meet_parents (dating → partner) · side_confession (accomplice or a secret with a fuse) ·
 *   side_long_distance (Schedule: hold it together or let it fade) ·
 *   side_proposal_server (partner → engaged) · side_wedding (engaged → married; feeds E4).
 *
 * Sets: `npc.<partner>` romance (via `forPartner`/`romanceTo`), `side.partner_knows` (read by
 * PKG-04's reckoning), `side.confession_lied` + `side.long_distance_days` (internal).
 * Reads: `life.partner`, partner romance state, `npc.mira.rivalry` (PKG-01), fates for the guest
 * list, `w.cathode_open`, `fac.aperture.client` (PKG-02) for flavor.
 */
import { defineContent } from '@/engine/registry'
import type { Choice, Cond, Effect, QuestDef, SceneDef, TriggerDef } from '@/engine/types'
import {
  AT_LEAST_DATING,
  AT_LEAST_PARTNER,
  around,
  breakUpWith,
  byPartner,
  dayRange,
  forPartner,
  hasPartner,
  momHere,
  momPassed,
  partnerAffinity,
  partnerContactOn,
  partnerIs,
  partnerRomance,
  romanceTo,
} from './_shared'

// ── side_meet_parents — Act II–III (dating → partner) ────────────────────────

const moveIn = (affinity: number) => forPartner(p => romanceTo(p, 'partner', affinity))

const meetParentsQuest: QuestDef = {
  id: 'side_meet_parents',
  title: 'Meet the Parents',
  kind: 'side',
  act: 2,
  priority: 7,
  autoStart: { all: [hasPartner, partnerRomance('dating'), partnerAffinity(30), { day: true, gte: 950 }] },
  rewards: "A partner who stays · the Row's blessing",
  summary:
    "It's time. Dinner at the family table with the person you've been seeing and the family that raised you — and the small matter of a second life you have to keep off the table for one evening, or finally put on it.",
  start: 'dinner',
  stages: {
    dinner: {
      text: "Dinner with the family and the person you're seeing. Get through it with your partner still in the chair, and you're moving in together after.",
      onEnter: [{ scene: 'side_meet_parents_scene' }],
      objectives: [
        {
          id: 'survived',
          text: 'Survive dinner with everyone you love in one room',
          when: partnerRomance(AT_LEAST_PARTNER),
          hint: "A [Social] play keeps the hacker life off the table. Fail and it's a comedy, not a catastrophe — love survives a bad dinner. You can also just tell them the truth. Every road ends with you moving in together.",
        },
      ],
    },
  },
}

const meetParentsScene: SceneDef = {
  id: 'side_meet_parents_scene',
  channel: 'dialog',
  title: 'Meet the Parents',
  start: 'intro',
  nodes: {
    intro: {
      speaker: 'narrator',
      text: [
        byPartner(
          "You bring Mira home. Mira, who does not do families, who dressed for it anyway, who brought a plant for the table and Dad a very specific screwdriver she heard he needed, having clearly done reconnaissance. She is terrified and hiding it flawlessly, which you only know because you've learned her tells.",
          'You bring Grace home. Grace, who came straight off a double shift and still looks more composed than anyone in your family, who brought flowers and immediately started helping in the kitchen like she has known this kitchen for years.',
        ),
        {
          if: momHere,
          text: 'Mom has made too much food. Dad is asking about intentions in the least subtle way a human being has ever asked anything. Kim is lying in wait with a folder of your worst childhood photographs.',
          else: "Dad cooked, which means there are three kinds of potatoes and nothing else. Kim set the table, and set one place too many out of habit, and nobody moves it. Kim is also lying in wait with a folder of your worst childhood photographs.",
        },
        { if: momPassed, text: "Mom's recipe card for the pork thing is stuck to the fridge with a magnet from the Cathode. Dad tried. It's not the same. Nobody says so." },
        'And somewhere under all of it, you have to decide how much of the other life comes to dinner.',
      ],
      next: 'choice',
    },
    choice: {
      speaker: 'dad',
      text: [
        'Dad clears his throat. "So. What is it you two actually do? For work. Exactly. In detail." Kim leans in, grinning.',
        { if: { stat: 'heat', gte: 40 }, text: 'He says it looking at you, not at your partner. There was a car parked on the Row last week with two men in it who did not buy anything. Dad noticed. Dad notices cars.' },
      ],
      choices: [
        {
          text: 'Steer the whole dinner smoothly past every landmine. Keep the two lives apart for one night.',
          tag: '[Social DC 14]',
          check: {
            skill: 'social',
            dc: 14,
            bonuses: [{ if: { background: 'class_clown' }, add: 2, label: '+2 (class clown: you have been working this room since you were six)' }],
            success: 'smooth',
            fail: 'disaster',
            successEffects: [{ faction: 'fac.hood', add: 6 }],
            failEffects: [{ stat: 'mood', add: -4 }, { npc: 'dad', affinity: -4 }, { npc: 'kim', affinity: 3 }, { flag: 'side.green_bean_dinner' }, { chance: 0.3, then: [{ complication: 'social' }] }],
          },
        },
        {
          text: "Let your partner field it — they're better under fire than you are.",
          tag: '[Trust them]',
          req: partnerAffinity(45),
          reqText: 'Requires: your partner trusts you (affinity 45)',
          effects: [{ faction: 'fac.hood', add: 4 }],
          goto: 'partner_saves',
        },
        {
          text: '"I break into computers, Dad. Sometimes for money. I\'m trying to be careful." Put it on the table.',
          tag: '[The truth]',
          effects: [{ npc: 'dad', affinity: -4 }, { stat: 'stress', add: 4 }],
          goto: 'truth',
        },
      ],
    },
    smooth: {
      speaker: 'narrator',
      text: [
        "You are, for one glorious evening, a normal person with a normal job and a normal partner. You redirect Dad's interrogation into a forty-minute discussion of the correct screwdriver. You head off Kim's photo folder with a bribe negotiated under the table. You give the whole family the version of your life where you flinch at nothing.",
        byPartner(
          'Mira plays it perfectly — warm, funny, just guarded enough to read as "private" instead of "hiding." On the drive home she exhales for the first time in three hours. "Your family hugged me. Twice. I have a plant now. I have a family plant." She says it like she can\'t believe her luck, which, you understand, she can\'t.',
          'Grace has your whole family eating out of her hand by dessert. She lets Dad win the screwdriver argument he was always going to win and trades night-shift stories with Kim, who wants to be horrified and is instead enthralled. In the car she squeezes your hand. "I like them. I like you with them. That\'s the guy I want. Not the wall guy. That guy."',
        ),
        'You move in together the next month. Two desks or two schedules, one very tired router, a fridge covered in notes. A life.',
      ],
      effects: [...moveIn(12), { quest: 'side_meet_parents', objective: 'survived' }],
    },
    disaster: {
      speaker: 'narrator',
      text: [
        'It goes off the rails immediately and never gets back on. Kim deploys the photo folder. Dad asks a question about "the hacking thing you do" that you did not know he knew about, in front of everyone, and you inhale a green bean. Your pager goes off during grace.',
        { if: momHere, text: 'Mom asks, with terrible innocence, whether your work is "legal, mostly." Nobody breathes.' },
        byPartner(
          'Mira — who does not do families, who is watching your family become a live-fire opsec exercise — makes a decision. She jumps on the grenade: tells a story so charming and so load-bearing-false that it papers over three separate disasters at once, and by the end Dad is laughing and refilling her plate. In the car she is shaking. "I lied to your family\'s face about a screwdriver for you," she says. "I have never done that for anyone. Do not read into it." You read entirely into it.',
          'Grace, God bless her, does triage. She fields the pager ("hospital, they always need me"), reframes "the hacking thing" as "IT security, it\'s very boring, tell them about the screwdriver," and gets a green bean out of your windpipe with a calm that silences the whole table. By dessert your family thinks she hung the moon. "That," she says in the car, "was the worst dinner I have ever attended, and I once did Thanksgiving in the ER. We\'re moving in. You clearly cannot be left unsupervised at meals."',
        ),
        'Your partner saved the evening. Nobody saved the question. Dad asked it out loud, in front of Kim and an aunt with a phone tree, and a question like that doesn\'t go back in the box: by Sunday the whole Row has a version of "the hacking thing," and at least one of them has you in a ski mask. Dad stops asking about your work entirely, which is worse than asking. In this family it will be called the Green Bean Dinner forever.',
      ],
      effects: [...moveIn(8), { quest: 'side_meet_parents', objective: 'survived' }],
    },
    partner_saves: {
      speaker: 'narrator',
      text: [
        byPartner(
          'You let Mira take the wheel and she is, it turns out, a natural — she interviews your father about the mill until he\'s misty, she out-sarcasms Kim into open admiration, she asks for the recipe and writes it down. She runs the whole dinner like a clean job. On the way home she says, "I could get used to having people," in a very small voice, and then, louder, "don\'t make it weird."',
          'You let Grace take the wheel and she runs it like a shift: calm, warm, everyone triaged and cared for and not one of them aware they\'re being handled. She has Kim laughing, Dad advising, the whole table planning a second dinner before the first one ends. "Your family\'s easy," she says after. "You worry too much. They just want you happy. So do I."',
        ),
        'You move in together the next month. It is, against every expectation you were raised to have, going to be alright.',
      ],
      effects: [...moveIn(14), { quest: 'side_meet_parents', objective: 'survived' }],
    },
    truth: {
      speaker: 'narrator',
      text: [
        'The table goes quiet in the particular way a table goes quiet when a family has been not-saying something for years. Kim puts the photo folder down. Dad looks at his plate for a long time.',
        {
          if: momHere,
          text: '"I knew," Mom says finally. "I don\'t understand what you do. I understand you don\'t sleep, and you flinch when the phone rings. A mother can work with that." She passes the potatoes, which in this family is a legal ruling.',
          else: '"Your mother knew," Dad says finally. "She told me once. She said, \'Robert, he flinches when the phone rings, leave him be, he\'ll tell us when he\'s ready.\'" His voice goes somewhere and comes back. "So. You\'re ready."',
        },
        '"Careful isn\'t a plan," Dad says. "Careful is what men say before the plant closes." But he doesn\'t get up. He looks at the person you brought, and asks them straight: "Do you know what you\'re in for?"',
        byPartner(
          'Mira meets his eyes. "Sir, I\'m worse than your kid. I\'m the one who makes sure the careful is real." Dad considers this, nods once, and says, "Good. Somebody should." Kim is openly delighted. "She\'s scene," Kim whispers to you. "You brought home a scene girl. To DAD."',
          'Grace doesn\'t blink. "Yes, sir. I\'m an ER nurse. I know what happens to people who aren\'t careful. I\'ll be the one who makes it real." Dad looks at her a long moment and then, gruffly, pushes the pie toward her side of the table. It is the highest honor he knows how to give.',
        ),
        'Nobody pretends it was a nice dinner. But you drive home lighter than you arrived, and the next month the two of you move in together, and the next Sunday Dad calls just to ask, awkwardly, if you\'re being careful. You are. You tell him so. He says "good" and hangs up, and it\'s the longest phone call you\'ve had with him in a year.',
      ],
      effects: [...moveIn(16), { faction: 'fac.hood', add: 3 }, { quest: 'side_meet_parents', objective: 'survived' }],
    },
  },
}

// ── side_confession — Act II–III ─────────────────────────────────────────────

const confessionQuest: QuestDef = {
  id: 'side_confession',
  title: 'The Confession',
  kind: 'side',
  act: 2,
  priority: 7,
  autoStart: { all: [hasPartner, partnerRomance(AT_LEAST_DATING), { day: true, gte: 1000 }, { not: { flag: 'side.partner_knows' } }] },
  rewards: 'An accomplice, or a secret with a fuse on it',
  summary:
    "You can't keep a wall up forever with someone who sleeps next to you. The night comes when you either tell your partner the whole truth about the second life — and make them an accomplice who chooses you with open eyes — or keep the secret, and leave a fuse burning under the whole thing.",
  start: 'night',
  stages: {
    night: {
      text: 'The night to come clean, or not. Tell your partner everything and they become your accomplice; keep it, and someday they find out on their own terms — which may not be yours.',
      onEnter: [{ scene: 'side_confession_scene' }],
      objectives: [
        {
          id: 'chose',
          text: 'Decide what your partner knows',
          when: { never: true },
          hint: 'Honesty makes them an accomplice who can hide you when it counts; the lie keeps the peace tonight and leaves a fuse that burns down if the heat ever comes to your door.',
        },
      ],
    },
  },
}

const confessionScene: SceneDef = {
  id: 'side_confession_scene',
  channel: 'dialog',
  title: 'The Confession',
  start: 'intro',
  nodes: {
    intro: {
      speaker: 'narrator',
      text: [
        "It's late. The good kind of late, the two-of-you-and-the-dark kind. And your partner asks the question they've been circling for months — not angry, just tired of the wall — about where the money really comes from, and the pager, and the nights, and the flinch.",
        byPartner(
          '"I know what you are," Mira says, because of course she does, she\'s scene too, she\'s just never made you say it. "I want to know if you\'ll say it to me. Out loud. That\'s different from me knowing."',
          '"I\'m not stupid," Grace says, quiet. "I stopped asking because I decided I trusted you more than I needed the answer. But I\'m done deciding that. Tell me the true thing, or tell me you won\'t, but stop pretending there isn\'t one."',
        ),
      ],
      next: 'choice',
    },
    choice: {
      speaker: 'player',
      text: 'The whole second life is right there behind your teeth. You can put it in their hands, or keep it in yours.',
      choices: [
        {
          text: 'Tell them everything. All of it. Make them a partner in the truth, not just the life.',
          tag: '[The whole truth]',
          effects: [{ flag: 'side.partner_knows' }],
          goto: 'confessed',
        },
        {
          text: 'Tell them a true-enough version — enough to satisfy, not enough to endanger.',
          tag: '[Social DC 16]',
          check: {
            skill: 'social',
            dc: 16,
            bonuses: [{ if: { trait: 'silver_tongue' }, add: 1, label: '+1 (you have been editing yourself for years)' }],
            success: 'partial',
            fail: 'partial_fail',
            successEffects: [{ flag: 'side.partner_knows' }],
          },
        },
        {
          text: '"There\'s nothing to tell." Hold the line. Keep them clean and in the dark.',
          tag: '[Lie]',
          effects: [{ flag: 'side.confession_lied' }],
          goto: 'lied',
        },
        {
          text: '"Not tonight. But I promise you: before anyone else, it\'ll be you." Ask for time, honestly.',
          tag: '[Ask for time]',
          req: partnerAffinity(55),
          reqText: 'Requires: a partner who trusts you enough to wait (affinity 55)',
          goto: 'time',
        },
      ],
    },
    confessed: {
      speaker: 'narrator',
      text: [
        "You tell them everything. The scene, the heat, the names, the whole architecture of the second life laid out in the dark. It's the most exposed you've ever been, more than any terminal, and you can't take it back once it's said.",
        { if: { flag: 'fac.aperture.client' }, text: 'You even tell them about the woman who takes you to dinner at Harbor Point and pays in envelopes. That part is the hardest to say out loud. It sounds worse in a bedroom than it does in a restaurant.' },
        byPartner(
          'Mira listens to all of it and then says, "Good. Now we\'re even — you know my Ridgeport, I know your everything. That\'s the only way I stay." She means it as a threat and a vow at once. From here on she\'s not just your partner; she\'s your accomplice, your alibi, the one who\'ll wipe the drive and swear you were home.',
          'Grace is quiet for a long time. Then: "Okay. Okay. I\'m a nurse — I don\'t leave people because they\'re bleeding, I just want to see the wound." She takes your hand. "But you don\'t get to lie to me again. Not once. If they ever come, I need to already know everything, so I can lie to *them* instead." She just became your accomplice. She\'ll hide you when it counts.',
        ),
      ],
      effects: [...forPartner(p => [{ npc: p, affinity: 14 }]), { quest: 'side_confession', objective: 'chose' }],
    },
    partial: {
      speaker: 'narrator',
      text: [
        "You give them a version — true in its bones, edited in its details. Enough that they feel trusted; not so much that they could be made to testify to anything specific. It's a careful, loving, slightly cowardly gift, and you deliver it well.",
        byPartner(
          'Mira knows it\'s the edited cut. She lets you have it, for now. "Fine," she says. "Keep your compartments. I\'ll keep mine. Just remember I can read a redaction." She stays, half-in, and she knows enough to cover for you if it comes to that.',
          'Grace exhales, relieved to have *anything*. "Thank you. That\'s— that helps." She doesn\'t know it\'s partial. She thinks the wall came down. She knows enough now to stand between you and a badge, and not so much that it\'ll destroy her to.',
        ),
      ],
      effects: [...forPartner(p => [{ npc: p, affinity: 8 }]), { quest: 'side_confession', objective: 'chose' }],
    },
    partial_fail: {
      speaker: 'narrator',
      text: [
        'You start editing on the fly and lose track of your own redactions. A name slips out, then the reason for the name, then the thing the name did. Halfway through you realize you are telling the whole truth anyway, badly, in the wrong order, like a drive dumping its sectors.',
        byPartner(
          'Mira lets you finish, then reassembles your mess into a timeline out loud, correcting you twice. "That\'s the worst confession I\'ve ever heard," she says. "Also the most honest. You can\'t even lie to me when you try. I love that. Don\'t make it weird." She knows everything now. She\'s in.',
          'Grace listens to the whole jumbled thing the way she\'d take a history from a patient who keeps changing their story, and at the end she just says, "Okay. So all of it, then." She takes your hand. "Next time lead with the truth. It\'s faster." She knows everything now. She\'s in.',
        ),
      ],
      effects: [{ flag: 'side.partner_knows' }, ...forPartner(p => [{ npc: p, affinity: 6 }]), { stat: 'stress', add: 4 }, { quest: 'side_confession', objective: 'chose' }],
    },
    lied: {
      speaker: 'narrator',
      text: [
        '"There\'s nothing to tell," you say, and you say it well, and the lie sits down at the foot of the bed and gets comfortable, because it plans to stay.',
        byPartner(
          'Mira looks at you for a long, flat moment. "Okay," she says, in the voice that means it is not okay. She knows you lied — she always knows — and she files it, the way she files everything, and some part of her that had started to unclench goes quiet again.',
          'Grace nods slowly and lets it go, because she decided to trust you and she\'s a woman of her word. But something closes behind her eyes. If the second life ever comes for the first, she won\'t know enough to protect you — and she\'ll remember that you looked her in the face and said there was nothing to tell.',
        ),
      ],
      effects: [...forPartner(p => [{ npc: p, affinity: -4 }]), { quest: 'side_confession', objective: 'chose' }],
    },
    time: {
      speaker: 'narrator',
      text: [
        'You don\'t lie and you don\'t confess. You tell them there is a true thing, that it\'s big, that you\'re not ready, and that when you are, they\'ll be first. It\'s the least satisfying honest answer there is.',
        byPartner(
          'Mira considers it like a contract. "Terms accepted. Interest accrues." She rolls over. Ten minutes later, in the dark: "I\'m going to guess, you know. Every night. Out loud." She does. She\'s right on the fourth night. You tell her the rest. She is insufferable about it for a week.',
          'Grace is quiet, and then she says, "Okay. I can work with a patient who says \'not yet.\' I can\'t work with one who says \'nothing\'s wrong.\'" A week later, over bad chicken, you tell her all of it. She doesn\'t put her fork down once. "Thank you for making it a week," she says. "I was going to give you two."',
        ),
      ],
      effects: [{ flag: 'side.partner_knows' }, ...forPartner(p => [{ npc: p, affinity: 10 }]), { quest: 'side_confession', objective: 'chose' }],
    },
  },
}

/** The lie's fuse: when the second life shows up at your door, your partner learns the truth the hard way. */
const confessionFalloutTrigger: TriggerDef = {
  id: 'side_confession_fallout',
  when: {
    all: [
      { flag: 'side.confession_lied' },
      { not: { flag: 'side.partner_knows' } },
      hasPartner,
      partnerRomance(AT_LEAST_DATING),
      { jailed: false },
      { any: [{ n: { var: 'sys.raids' }, gte: 1 }, { stat: 'heat', gte: 65 }] },
    ],
  },
  effects: [{ scene: 'side_confession_fallout_scene' }],
}

const confessionFalloutScene: SceneDef = {
  id: 'side_confession_fallout_scene',
  channel: 'dialog',
  title: 'Nothing to Tell',
  start: 'intro',
  nodes: {
    intro: {
      speaker: 'narrator',
      text: [
        byPartner(
          'Mira is sitting at the kitchen table when you get home, and on the table are three things: a business card from a detective, a printout of a board post with your handle in it, and the note from the fridge that says *hugz - buy milk*. She has arranged them in a row, like evidence. She is very calm. Mira is never calm.',
          'Grace is sitting at the kitchen table when you get home, still in scrubs, and on the table is a business card from a detective who came to the ER to ask her, politely, whether she knew what her partner did at night. She is very calm. It is her work voice. You have never heard it used on you.',
        ),
        '"Nothing to tell," they say. Your own words, handed back. "You looked at me and said there was nothing to tell."',
      ],
      next: 'choice',
    },
    choice: {
      speaker: 'player',
      text: 'The fuse you lit that night just reached the end.',
      choices: [
        {
          text: 'Tell them everything, now, and let them be angry for as long as they need.',
          tag: '[Social DC 15]',
          check: {
            skill: 'social',
            dc: 15,
            bonuses: [{ if: partnerAffinity(60), add: 2, label: '+2 (they love you, which is the problem)' }],
            success: 'repaired',
            fail: 'cracked',
            successEffects: [{ flag: 'side.partner_knows' }, ...forPartner(p => [{ npc: p, affinity: -4 }])],
            failEffects: [{ flag: 'side.partner_knows' }, ...forPartner(p => [{ npc: p, affinity: -15 }])],
          },
        },
        {
          text: '"It\'s not what it looks like." Double down.',
          tag: '[Lie]',
          goto: 'doubled',
        },
      ],
    },
    repaired: {
      speaker: 'narrator',
      text: [
        'You tell them everything, the way you should have the first time, and you don\'t defend any of it. You let them be as angry as they need to be. It takes most of the night.',
        byPartner(
          'At four in the morning Mira puts the detective\'s card in the sink and sets it on fire with the kitchen lighter, watching it curl. "The next time someone comes asking," she says, "I will already know everything, and I will lie to them beautifully. Never make me find out from a cop again." You won\'t. She knows you won\'t, because now she knows.',
          'At four in the morning Grace tears the detective\'s card in half and then in half again. "I told him I didn\'t know anything," she says. "It was true. I hated that it was true. Next time I want it to be a lie." She takes your hand across the table. It\'s shaking. So is yours. You\'re still together. It cost something you won\'t get back all the way.',
        ),
      ],
    },
    cracked: {
      speaker: 'narrator',
      text: [
        'You try to tell them everything and it comes out as a defense — every true thing wrapped in a reason, every reason sounding like an excuse. They listen to all of it with their arms crossed.',
        '"I believe you," they say at the end. "That\'s the worst part. I believe every word, and I still don\'t know if you would have ever told me." They sleep on the couch. They\'re still there in the morning. But the fridge notes stop for a while, and when they start again they\'re shorter.',
      ],
      effects: [{ trait: 'pkg11_family_shorter_notes' }],
    },
    doubled: {
      speaker: 'narrator',
      text: [
        'You say it\'s not what it looks like. You watch them hear you say it.',
        {
          if: partnerAffinity(50),
          text: 'They don\'t argue. They pack a bag — just a bag, just for a few days, they say — and leave the key on the table next to the detective\'s card. They come back a week later. They don\'t ask again. You live together now like two people sharing a waiting room.',
          else: 'They don\'t argue. They pack everything. The key goes on the table next to the detective\'s card. "I\'m not going to tell him anything," they say at the door. "Not because of you. Because I don\'t know anything. You made sure of that." And then they\'re gone.',
        },
      ],
      effects: [
        {
          if: partnerAffinity(50),
          then: forPartner(p => [{ npc: p, affinity: -20 }]),
          else: [...forPartner(p => breakUpWith(p, -30)), { stat: 'mood', add: -15 }],
        },
      ],
    },
  },
}

// ── side_long_distance — Act III (Schedule) ──────────────────────────────────

/** Days on which the long-distance stretch can be running (Act III onward). */
const LD_DAYS = dayRange(1500, 3700)
const LD_TARGET = 20

const longDistanceDayTrigger: TriggerDef = {
  id: 'side_long_distance_day',
  once: false,
  cooldownDays: 1,
  atHour: 23,
  when: { all: [{ quest: 'side_long_distance', stage: 'drift' }, { quest: 'side_long_distance', status: 'active' }, partnerContactOn(LD_DAYS)] },
  effects: [{ var: 'side.long_distance_days', add: 1 }],
}

const longDistanceQuest: QuestDef = {
  id: 'side_long_distance',
  title: 'Long Distance',
  kind: 'side',
  act: 3,
  priority: 6,
  autoStart: { all: [hasPartner, partnerRomance(AT_LEAST_PARTNER), { var: 'act', gte: 3 }, { day: true, gte: 1500 }] },
  rewards: 'A bond that survives the distance · or one that fades',
  summary:
    "Work pulls the two of you to opposite ends of the day — their shifts, your nights, a stretch where you live in the same apartment and never seem to be awake in it at the same time. Keeping this alive means actually keeping it on the schedule. Neglect it, and dial-up latency isn't the only thing that goes quiet.",
  start: 'drift',
  stages: {
    drift: {
      text: `You and your partner are drifting on opposite schedules. Put them back on your calendar — real social time with them on ${LD_TARGET} different days in the next ten weeks — or watch the bond go quiet.`,
      timeLimitDays: 70,
      onEnter: [{ var: 'side.long_distance_days', set: 0 }, ...forPartner(p => [{ scene: `side_long_distance_${p}` }])],
      objectives: [
        {
          id: 'held',
          text: 'Spend real time with your partner through the busy stretch',
          when: { var: 'side.long_distance_days', gte: LD_TARGET },
          progress: { of: { var: 'side.long_distance_days' }, target: LD_TARGET },
          hint: 'Pick your partner in Contacts and paint social blocks on the schedule. Each day you spend time together counts. Ten weeks to find twenty days — the stretch is long, but so is the alternative.',
        },
      ],
      onComplete: [{ scene: 'side_long_distance_kept_scene' }, ...forPartner(p => [{ npc: p, affinity: 8 }]), { stat: 'stress', add: -6 }],
      onTimeout: {
        effects: [{ scene: 'side_long_distance_faded_scene' }, ...forPartner(p => [{ npc: p, affinity: -10 }]), { stat: 'mood', add: -8 }],
      },
    },
  },
}

const ldMiraScene: SceneDef = {
  id: 'side_long_distance_mira',
  channel: 'chat',
  title: 'you up?',
  from: 'mira',
  pause: false,
  start: 'ping',
  nodes: {
    ping: {
      speaker: 'mira',
      text: [
        'you up? stupid question. you\'re asleep, i can hear you snoring through the wall, i\'m messaging you from eleven feet away',
        'we live in the same apartment and our entire relationship this month is a note on the fridge that says *hugz - buy milk*',
        'i\'m not complaining. i\'m complaining a little',
        'i ran the numbers. we have been awake in the same room for four hours in two weeks. that\'s not a relationship, that\'s a shift change',
      ],
      choices: [
        {
          text: '(in the morning) i read it. i\'m blocking out thursdays. no pagers. just us.',
          effects: [{ npc: 'mira', affinity: 3 }],
          goto: 'ok',
        },
        {
          text: '(in the morning) it\'s a busy stretch. it\'ll pass.',
          goto: 'pass',
        },
      ],
    },
    ok: { speaker: 'mira', text: ['thursdays', 'ok', 'i\'m holding you to it. i keep logs'] },
    pass: { speaker: 'mira', text: ['everything passes', 'that\'s kind of the thing i\'m worried about'] },
  },
}

const ldGraceScene: SceneDef = {
  id: 'side_long_distance_grace',
  channel: 'chat',
  title: 'break room',
  from: 'grace',
  pause: false,
  start: 'ping',
  nodes: {
    ping: {
      speaker: 'grace',
      text: [
        'you up? 3:14am, hospital break room, fourth coffee',
        'i miss you and this is the only ten minutes i get',
        'we live together and talk mostly through notes on the fridge. i found the one that says "asleep, don\'t wake, love you" and i almost cried in the kitchen, which is not like me',
        'i\'ve watched a lot of couples in the waiting room. you can tell the ones who stopped choosing each other. i don\'t want to be a waiting room',
      ],
      choices: [
        {
          text: '(when you wake) not a waiting room. i\'m putting you on the schedule. in pen.',
          effects: [{ npc: 'grace', affinity: 3 }],
          goto: 'ok',
        },
        {
          text: '(when you wake) we\'ll get through it. we always do.',
          goto: 'pass',
        },
      ],
    },
    ok: { speaker: 'grace', text: ['in pen. okay. i\'m going to check', 'i check everything'] },
    pass: { speaker: 'grace', text: ['we always do because somebody always does the work', 'just making sure it\'s both of us'] },
  },
}

const longDistanceKeptScene: SceneDef = {
  id: 'side_long_distance_kept_scene',
  channel: 'dialog',
  title: 'Long Distance',
  pause: false,
  start: 'kept',
  nodes: {
    kept: {
      speaker: 'narrator',
      text: [
        'You made it deliberate. You blocked out the overlapping hours and defended them. You had the 3 a.m. coffees and the stolen breakfasts and the Sunday you both slept until noon with the phone off. You treated the relationship like the most important job on the board, because it was, and you did the work.',
        byPartner(
          'Mira leaves a new note on the fridge. It says: *hugz - you kept showing up. i noticed. i notice everything. - buy milk.* You keep it. You keep all of them.',
          'Grace catches you at the door between her shift and your night, both of you exhausted, and just holds on for a second longer than a passing hug needs. "We\'re still us," she says, surprised and glad. "A lot of people we know aren\'t still them. We are."',
        ),
      ],
    },
  },
}

const longDistanceFadedScene: SceneDef = {
  id: 'side_long_distance_faded_scene',
  channel: 'dialog',
  title: 'Long Distance',
  pause: false,
  start: 'faded',
  nodes: {
    faded: {
      speaker: 'narrator',
      text: [
        "It didn't end. That's almost worse. It just went quiet — the notes got shorter, the overlapping hours got given away to work one at a time, and one day you realized you couldn't remember the last real conversation the two of you had had that wasn't about the router or the rent.",
        byPartner(
          "Mira stops leaving the *hugz* notes. She doesn't say anything. She just stops, and the fridge gets very businesslike, and you both pretend not to notice the thing you're both noticing. She's still there. She's just further away, in the way she warned you she could get.",
          'Grace stops waiting up. She stops leaving the notes. "I\'m not going anywhere," she tells you, and means it, and that steady loyalty is somehow the saddest part — she\'ll stay, dimmer, in a relationship you both let go quiet because neither of you fought the calendar for it.',
        ),
      ],
    },
  },
}

// ── side_proposal_server — Act III (partner → engaged) ───────────────────────

const engage = (affinity: number) => forPartner(p => romanceTo(p, 'engaged', affinity))
/** Mira, the old rival, is jealous and still around — and your partner is Grace. */
const rivalCircling: Cond = { all: [{ flag: 'npc.mira.rivalry' }, partnerIs('grace'), around('mira'), { not: { npc: 'mira', romance: AT_LEAST_DATING } }] }

/** After the build: guard against the rival, or go straight to the reveal. */
const afterBuild: Choice[] = [
  {
    text: 'Someone with a very familiar calling card has been poking at your little BBS. Lock it down before you invite Grace.',
    tag: '[OpSec DC 15]',
    if: rivalCircling,
    check: {
      skill: 'opsec',
      dc: 15,
      bonuses: [{ if: { trait: 'paranoid' }, add: 2, label: '+2 (paranoid: you saw this coming)' }],
      success: 'secured',
      fail: 'leaked',
      failEffects: [{ npc: 'mira', affinity: -10 }, { flag: 'side.proposal_spoiled' }, { stat: 'stress', add: 4 }],
    },
  },
  {
    text: 'Ignore the poking. It\'s just nyx being nyx. Invite Grace tonight.',
    if: rivalCircling,
    effects: [{ npc: 'mira', affinity: -4 }],
    goto: 'leaked',
  },
  {
    text: 'Invite them to play. "I made a little game. Tell me if it\'s dumb."',
    if: { not: rivalCircling },
    goto: 'played',
  },
]

const proposalQuest: QuestDef = {
  id: 'side_proposal_server',
  title: 'The Proposal Server',
  kind: 'side',
  act: 3,
  priority: 7,
  autoStart: { all: [hasPartner, partnerRomance(AT_LEAST_PARTNER), partnerAffinity(50), { var: 'act', gte: 3 }, { day: true, gte: 1700 }] },
  rewards: 'The question, asked the only way you know how',
  summary:
    "You want to ask. You are, however, constitutionally incapable of asking a normal question in a normal way, so you're going to hide the proposal inside a homebrew BBS door-game your partner will have to play to find it. Build it right, guard it from anyone who'd spoil it, and ask.",
  start: 'build',
  stages: {
    build: {
      text: 'Build the proposal into a BBS door-game only your partner can finish. Get it right — and keep anyone jealous from leaking it first — and you get to ask the question.',
      onEnter: [{ scene: 'side_proposal_server_scene' }],
      objectives: [
        {
          id: 'asked',
          text: 'Ask the question, your way',
          when: partnerRomance(['engaged', 'married']),
          hint: 'A [Programming] or [Hardware] build hides the question in the last room; or skip the game and just ask. If an old rival is circling, an [OpSec] pass keeps the secret. Every road gets you a yes.',
        },
      ],
    },
  },
}

const proposalScene: SceneDef = {
  id: 'side_proposal_server_scene',
  channel: 'dialog',
  title: 'The Proposal Server',
  start: 'intro',
  nodes: {
    intro: {
      speaker: 'narrator',
      text: [
        "The ring is in a drawer, inside a sock, inside a shoebox labelled TAXES 1998. The problem is that you cannot, physically, get down on one knee and say a sentence like a person. So you're doing it your way: a homebrew door-game on a little BBS you stood up just for this, a text adventure that is secretly a museum of the two of you, with the question hidden in the final room.",
        byPartner(
          'Mira will see through the ASCII art in about four seconds and solve the whole thing in ten, so it has to be *good* — good enough that the smartest person you know slows down, and smiles, and lets herself be gotten.',
          "Grace doesn't do a lot of games, so it has to be warm and findable, a path she can follow after a double shift with her guard down and her whole heart in it, all the way to the last room.",
        ),
      ],
      next: 'choice',
    },
    choice: {
      speaker: 'player',
      text: 'An empty BBS, a blinking cursor, and a ring in a sock. How do you build this?',
      choices: [
        {
          text: 'Write the whole thing beautifully — every room a memory, the question in the last one.',
          tag: '[Programming DC 14]',
          check: {
            skill: 'programming',
            dc: 14,
            success: 'built',
            fail: 'built_rough',
            failEffects: [{ flag: 'side.proposal_rough' }],
          },
        },
        {
          text: 'Build it into the machine itself: the case LEDs spell it out when they reach the last room.',
          tag: '[Hardware DC 14]',
          req: { skill: 'hardware', gte: 20 },
          reqText: 'Requires Hardware 20',
          check: {
            skill: 'hardware',
            dc: 14,
            bonuses: [{ if: { background: 'tinkerer' }, add: 2, label: '+2 (basement tinkerer)' }],
            success: 'built_leds',
            fail: 'built_rough',
            failEffects: [{ flag: 'side.proposal_rough' }],
          },
        },
        {
          text: 'Forget the game. Just ask. Over breakfast, like a person.',
          tag: '[Just ask]',
          goto: 'plain',
        },
      ],
    },
    built: {
      speaker: 'narrator',
      text: [
        "You build it like the most important thing you've ever shipped, because it is. Every room is a real place: the Cathode booth, the night the coffee went cold, the fridge with the notes. The puzzles are inside jokes only one person alive could solve. The final room is just a door, and behind the door, the question.",
      ],
      choices: afterBuild,
    },
    built_leds: {
      speaker: 'narrator',
      text: [
        "The software is simple — a handful of rooms, one for every year. The real work is inside the case: a strip of salvaged LEDs soldered along the front panel, wired to light one letter at a time as the game reaches its end. Test run at 3 a.m.: the case glows, letter by letter, in the dark of your desk. It works. You sit there and look at it far longer than a test needs.",
      ],
      choices: afterBuild,
    },
    built_rough: {
      speaker: 'narrator',
      text: [
        'The door-game is janky. One puzzle soft-locks, the ASCII heart looks like a spider, and the parser rejects the word "yes" specifically, which is a catastrophe given the circumstances. But the bones are there, and the memories are real, and your partner is the forgiving kind about exactly this.',
      ],
      choices: afterBuild,
    },
    plain: {
      speaker: 'narrator',
      text: [
        'You don\'t build anything. You make breakfast — badly, eggs slightly on fire — and halfway through the toast you just say it, across the table, with jam on your thumb and no plan at all.',
        byPartner(
          'Mira stares at you over her coffee. "No door-game? No puzzle? You, of all people, just— asked?" She sets the mug down very carefully. "That is the least efficient, least clever, most terrifying thing you have ever done. Yes. Obviously yes. I\'m planning the wedding. There\'s a spreadsheet."',
          'Grace goes completely still, fork halfway up, the way she does when a monitor changes tone. Then she laughs — really laughs, the rare one. "You set the eggs on fire and then proposed. That\'s the most honest thing anyone\'s ever done in this kitchen. Yes. Put the eggs out first. Then yes."',
        ),
      ],
      effects: [...engage(16), { stat: 'mood', add: 16 }, { quest: 'side_proposal_server', objective: 'asked' }],
    },
    secured: {
      speaker: 'narrator',
      text: [
        'You were right to worry. The calling card in your logs is nyx\'s — Mira, the old rival, who has never once let you have a win without taking it apart first, and who has opinions about you marrying someone who isn\'t scene. You lock the board down cold and quiet, and at 2 a.m. a page arrives: "fine. well played. congrats, i guess. don\'t tell her i said that." Then nothing.',
        'The door-game stays a secret until the moment you want it to stop being one.',
      ],
      next: 'played',
    },
    leaked: {
      speaker: 'narrator',
      text: [
        'Mira gets in. Of course she does; she\'s better than you at exactly this, and it\'s what she lives for. Two days before you\'re ready, Grace gets an anonymous page: "check the drawer with the tax box. sock. you\'re welcome. -n". For one horrible evening you think it\'s ruined.',
        { if: { flag: 'side.proposal_spoiled' }, text: 'Worse: you had locked the door. You had tried. She walked through it anyway, left her calling card in your logs like a signature on a painting, and that is the part you will not forgive — she wanted you to know she could.' },
        'It isn\'t. Grace, who reads people for a living, clocks the sabotage instantly and is furious on your behalf. "Someone tried to steal this from you," she says. "From *us*." So she does the thing you didn\'t expect: she plays your door-game anyway, all the way to the last room, and when she gets there she turns around and holds out her hand for the ring you\'re too stunned to be holding right. "Ask me anyway. Out loud. Ruin her whole night." You do. She says yes. You both win.',
        { if: { flag: 'side.proposal_spoiled' }, text: 'Grace does not forget it, though. She crosses a name off a list you didn\'t know she kept. From now on, when nyx\'s handle lights up on your screen, Grace leaves the room — not angry, just finished — and the old rivalry has a new edge on it that neither you nor Mira put there.' },
      ],
      effects: [...engage(18), { stat: 'mood', add: 14 }, { quest: 'side_proposal_server', objective: 'asked' }],
    },
    played: {
      speaker: 'narrator',
      text: [
        byPartner(
          'Mira sits down to "test your dumb little game" and goes very quiet around room three. By the last room she\'s not typing anymore. She turns around, and you\'re already down on one knee like an idiot, and she says "you HID it in a DOOR GAME," and then she says yes, furiously, and then she says "I\'m still planning the wedding, there\'s a spreadsheet," and you know there is.',
          "Grace plays it after a double shift, half-asleep and smiling, following the little rooms of your life together. In the last room the screen just says one thing, and she reads it twice, and turns around to find you holding the ring, and she — steady, unflappable Grace — completely loses her composure for the first time since you've known her. \"Yes. Obviously. You absolute nerd. Yes.\"",
        ),
        {
          if: { flag: 'side.proposal_rough' },
          text: 'It is not a flawless run. There is a soft-lock in room four that you have to walk them past, and the parser still rejects "yes," so they type "YES YES YES" until it gives up and crashes. That becomes the story. The crash is everybody\'s favorite part.',
        },
      ],
      effects: [...engage(20), { stat: 'mood', add: 20 }, { quest: 'side_proposal_server', objective: 'asked' }],
    },
  },
}

// ── side_wedding — Act III–IV (engaged → married) ────────────────────────────

const weddingQuest: QuestDef = {
  id: 'side_wedding',
  title: 'The Wedding',
  kind: 'side',
  act: 3,
  priority: 8,
  autoStart: { all: [hasPartner, partnerRomance('engaged'), { var: 'act', gte: 3 }, { day: true, gte: 1900 }, { jailed: false }] },
  rewards: 'Married · a table of everyone who made it',
  summary:
    "The wedding. Small, at the Cathode if it's still standing, with the people who are left — and the empty chairs for the ones who aren't. Whoever's still alive and still speaking to you is who's in the room when you say it. That guest list is a decade of your choices, seated.",
  start: 'day',
  stages: {
    day: {
      text: "Your wedding day. Look around the room — at who made it, and who didn't — and get married.",
      onEnter: [{ scene: 'side_wedding_scene' }],
      objectives: [
        {
          id: 'married',
          text: 'Get married',
          when: partnerRomance('married'),
          hint: "There's nothing to roll here and no way to fail it. Show up and say it.",
        },
      ],
    },
  },
}

const married = (affinity: number): Effect[] => [...forPartner(p => romanceTo(p, 'married', affinity)), { stat: 'mood', add: 25 }, { faction: 'fac.hood', add: 8 }]

const weddingScene: SceneDef = {
  id: 'side_wedding_scene',
  channel: 'dialog',
  title: 'The Wedding',
  start: 'intro',
  nodes: {
    intro: {
      speaker: 'narrator',
      text: [
        {
          if: { var: 'w.cathode_open', eq: 1 },
          text: 'You get married at the Cathode, because of course you do. Sal closed the diner for the day, strung lights across the counter, and made the pie himself, weeping into it in a way he will deny to his grave. Neon in the window, vinyl booths, the whole warm wrong-side-of-Sodium-Row of it.',
          else: 'You get married in the church basement on Cannery Row, the one with the folding chairs and the hum of the old fluorescents, because the Cathode is gone and you needed somewhere the Row could fill. Sal brings a pie anyway, from his sister\'s oven. It fills.',
        },
        "You look out at the room while somebody's cousin fiddles with the sound system, and you take stock of who's here — and of the chairs that stay empty.",
      ],
      next: 'guests',
    },
    guests: {
      speaker: 'narrator',
      text: [
        {
          if: around('jax'),
          text: "Jax is your best man, obviously, and he's already cried twice and given a toast that was 40% inside jokes and 60% openly weeping about how proud he is. There's a Quake reference. There's always a Quake reference.",
          else: "Jax's chair is empty. You left it set anyway, with a game controller on the seat, because a decade ago he got Quake running on a library machine and called it the best day of his life, and you wanted him in the room somehow.",
        },
        { if: momHere, text: 'Mom is in the front row in the dress she saves for the important things, telling everyone within reach that she always knew, she always said, didn\'t she always say. She did. She always said.' },
        { if: momPassed, text: "Mom's chair is in the front row, empty, with her reading glasses folded on the seat. Nobody moves the glasses." },
        { if: { npc: 'mom', fate: 'estranged' }, text: 'The invitation you sent your mother came back unopened. You set her place anyway. Dad keeps glancing at the door.' },
        {
          if: { npc: 'dad', fateNot: ['spiral'] },
          text: 'Dad wears the suit from the union photo — it still fits, almost — and fixes the sound system when the cousin gives up, because of course he does. "Long as one of us can fix something," he says, and squeezes your shoulder, and has to go stand outside for a minute.',
          else: 'Dad comes, sober, shaking a little, in a borrowed tie. He stays through the vows. He leaves before the toasts. You catch his eye as he goes and he nods, once, and that is the most he can give today, and it\'s enough.',
        },
        { if: around('kim'), text: 'Kim gives a reading she pretends she didn\'t practice, and lands it, and glares at you for making her feel things in public.' },
        { if: around('corvid'), text: 'Corvid came, which from Corvid is a benediction. She sits in the back where she can see the exits and raises a glass to you exactly once, which means more than a whole speech.' },
        { if: around('byteme'), text: 'byteme wore a tie with a circuit board printed on it and is extremely proud of this. He takes four hundred photos on a disposable camera. Eleven come out.' },
        { if: { npc: 'byteme', fate: 'dead' }, text: 'There\'s a disposable camera on an empty chair near the back. Nobody knows who put it there. Everybody knows who it\'s for.' },
        { if: around('deadline'), text: 'Deadline stands at the back with a club soda, and when you catch his eye he taps his temple: back up your life, not your data. You did, kid. This is the backup.' },
        { if: around('priya'), text: 'Priya gives you a card with a check inside and a note that says "rule three: keep this one." She will not explain what rules one and two were.' },
        { if: { all: [partnerIs('mira'), { flag: 'side.ridgeport_doxxed' }, { not: { flag: 'side.ridgeport_scrubbed' } }] }, text: 'Mira checks the guest sign-in twice for a name that isn\'t there and won\'t be — Aaron\'s noise still surfaces on some Ridgeport board every few months, and she still checks, and today she checks and then, deliberately, stops, and dances instead.' },
        { if: { all: [around('mira'), { not: partnerIs('mira') }, { not: { flag: 'side.proposal_spoiled' } }] }, text: 'Mira came. She caught the bouquet on purpose, calculated the trajectory, and refuses to discuss it.' },
        { if: { all: [around('mira'), { not: partnerIs('mira') }, { flag: 'side.proposal_spoiled' }] }, text: 'Mira did not come. A package did: one clean white sock, folded, with a note in block capitals that says CONGRATULATIONS. Grace drops it in the bin without reading the note twice. You fish it out later and keep it, and you could not tell anyone why.' },
        { if: { flag: 'side.green_bean_dinner' }, text: 'There are no green beans on the buffet. Dad personally checked with the caterer. Twice. Kim tells the story anyway, during the toasts, and this time even Dad laughs.' },
        { if: { all: [{ npc: 'grace', met: true }, around('grace'), { not: partnerIs('grace') }] }, text: 'Grace sends a card from the ER with every nurse on the night shift\'s signature on it, and a note: "Check his pupils when he comes home late. Trust me."' },
        { if: around('sal'), text: 'Sal officiates the pie. That is his word for it. Nobody argues.' },
      ],
      next: 'vows',
    },
    vows: {
      speaker: 'narrator',
      text: [
        byPartner(
          'Mira wrote her vows in a spreadsheet, color-coded, with a tab for contingencies, and reads them off a laminated card, and they are the most devastating thing anyone in that room has ever heard, and she is furious about how much everyone is crying.',
          'Grace, who runs a whole ER without her voice shaking, gets exactly four words into her vows before it goes, and she has to stop, and laugh at herself, and start over, and the whole room loves her for it. "I know when someone\'s hiding a wound," she manages. "You let me see all of them. That\'s all I ever wanted."',
        ),
        'Then it\'s your turn. Everybody is looking at you. The cousin has finally gotten the microphone to stop squealing.',
      ],
      choices: [
        {
          text: 'Read the vows you wrote — every draft of them, folded in your pocket for a month.',
          goto: 'said_written',
        },
        {
          text: 'Put the card away. Say what\'s actually in your chest, right now, unedited.',
          tag: '[Social DC 12]',
          check: {
            skill: 'social',
            dc: 12,
            success: 'said_free',
            fail: 'said_stumble',
            failEffects: [{ flag: 'side.wedding_yes_speech' }, { stat: 'stress', add: 3 }],
          },
        },
        {
          text: 'Vows that name both lives out loud — in front of everyone, because they already know.',
          tag: '[Both lives]',
          req: { flag: 'side.partner_knows' },
          reqText: 'Requires: your partner knows the whole truth',
          goto: 'said_both',
        },
      ],
    },
    said_written: {
      speaker: 'narrator',
      text: [
        'You read them. Your voice cracks on the second line and you push through it anyway, the way you push through a download at 98%. They\'re good vows. You worked on them for a month. By the end your partner is holding your free hand hard enough to hurt.',
        byPartner('Mira signs the certificate *hugz* next to her real name. You leave it.', 'Grace signs the certificate in nurse-handwriting nobody will ever be able to read. It\'s perfect.'),
      ],
      next: 'married',
    },
    said_free: {
      speaker: 'narrator',
      text: [
        'You put the card in your pocket and just talk. About the first time you saw them. About the notes on the fridge. About how you used to think the most important thing you would ever do was get into a machine, and how wrong you were. It isn\'t polished. It\'s true. Somebody in the back row — it might be Sal — says "oh, come ON" and blows their nose like a trumpet.',
        byPartner('Mira signs the certificate *hugz* next to her real name. You leave it.', 'Grace signs the certificate in nurse-handwriting nobody will ever be able to read. It\'s perfect.'),
      ],
      next: 'married',
    },
    said_stumble: {
      speaker: 'narrator',
      text: [
        'You put the card away and open your mouth and absolutely nothing comes out. The silence goes on long enough that Kim audibly says "oh no." Then you just say, "I— yes. All of it. Yes," which is not a vow, technically, but the room applauds like it\'s the finest speech ever given in Port Lumen.',
        byPartner('"Close enough," Mira says, and signs the certificate *hugz* next to her real name. You leave it.', '"I\'ll take it," Grace says, laughing and crying at once, and signs the certificate in nurse-handwriting nobody will ever be able to read.'),
      ],
      next: 'married',
    },
    said_both: {
      speaker: 'narrator',
      text: [
        'You say it plainly, in front of your family and your scene and the whole of the Row: that there have been two of you for ten years, the one who comes to dinner and the one who flinches at the phone, and that this is the only person who has ever been allowed to love both. The room goes very still. Then, from the back, Corvid — or Jax, or Sal, whoever is left to do it — starts clapping, slow, and it spreads.',
        byPartner(
          'Mira doesn\'t cry. Mira *never* cries. Mira cries. She signs the certificate *hugz* next to her real name.',
          'Grace takes your face in both hands in front of everyone. "One life," she says. "That\'s the one I married." She signs the certificate in nurse-handwriting nobody will ever read.',
        ),
      ],
      effects: [...forPartner(p => [{ npc: p, affinity: 6 }]), { faction: 'fac.hood', add: 2 }],
      next: 'married',
    },
    married: {
      speaker: 'narrator',
      text: [
        "You're married. The empty chairs are part of it too — the whole long tail of the decade, seated. Whatever else the story does to you, it can't take this room, this day, these people who stayed.",
      ],
      effects: [...married(20), { quest: 'side_wedding', objective: 'married' }],
    },
  },
}

export default defineContent({
  quests: [meetParentsQuest, confessionQuest, longDistanceQuest, proposalQuest, weddingQuest],
  scenes: [
    meetParentsScene,
    confessionScene,
    confessionFalloutScene,
    ldMiraScene,
    ldGraceScene,
    longDistanceKeptScene,
    longDistanceFadedScene,
    proposalScene,
    weddingScene,
  ],
  triggers: [confessionFalloutTrigger, longDistanceDayTrigger],
})
