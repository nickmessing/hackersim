/**
 * PKG-11 — Mira's romance & loyalty (bible §8 Romance: `side_coffee_warm`, `side_ridgeport`).
 *
 * `side_coffee_warm` is Mira's Loyalty quest (§4.5): completing it shields her from the mirror /
 * first-blood selectors whether or not you romance her. Its romantic outcome advances the shared
 * ladder to `dating` and stakes `life.partner='mira'` (exclusivity — clearing an existing Grace
 * partner first). `side_ridgeport` is her Ridgeport-ex beat, gated on `npc.mira.trusts`.
 *
 * Sets: `npc.mira` romance, `life.partner` (str), the "Two Keyboards" collab buff.
 * Reads: `npc.mira.trusts`, `npc.mira.rivalry`, `npc.mira.secret_hinted` (PKG-01/02).
 */
import { defineContent } from '@/engine/registry'
import type { BuffDef, Choice, Cond, Effect, QuestDef, SceneDef, TriggerDef } from '@/engine/types'
import { AT_LEAST_DATING, breakUpWith, partnerIs, startDating } from './_shared'

/** Mira is still in Port Lumen and still talking to you. */
const miraAvailable: Cond = { npc: 'mira', fateNot: ['gone', 'dead', 'rival', 'flips_you', 'casualty'] }
/** There's a spark with Mira but you aren't together yet. */
const miraSpark: Cond = { npc: 'mira', romance: 'flirting' }
/** A spark is lit if there wasn't one already (never demotes an existing relationship). */
const lightSpark: Effect = { if: { npc: 'mira', romance: 'none' }, then: [{ npc: 'mira', romance: 'flirting' }] }

/** The "say the real thing" choices, shared by the coffee night and the second chance. */
function askMiraOut(objective: Effect[], together: string, choseMira: string): Choice[] {
  return [
    {
      text: '"Not a one-off. Mira — I keep the coffee warm too." Say the real thing.',
      tag: '[More than coffee]',
      if: { all: [{ not: partnerIs('grace') }, { not: { npc: 'mira', romance: AT_LEAST_DATING } }] },
      req: miraSpark,
      reqText: 'Requires: a spark with Mira (win her over first)',
      effects: [...startDating('mira', 10), ...objective],
      goto: together,
    },
    {
      text: '"Not a one-off." Say it, even though it means ending things with Grace.',
      tag: '[Choose Mira]',
      if: { all: [partnerIs('grace'), miraSpark] },
      effects: [...breakUpWith('grace'), ...startDating('mira', 10), ...objective],
      goto: choseMira,
    },
  ]
}

const COLLAB_BUFF: BuffDef = {
  id: 'buff_two_keyboards',
  name: 'Two Keyboards',
  desc: 'You and Mira split the hard problems in half. Freelance pays better and your instincts on a job are sharper.',
  days: 120,
  mods: [
    { key: 'freelance.pay', mult: 1.12 },
    { key: 'hack.roll', add: 1 },
  ],
}

// ── side_coffee_warm — Act II, Loyalty: Mira ─────────────────────────────────

const coffeeQuest: QuestDef = {
  id: 'side_coffee_warm',
  title: 'The Coffee\'s Still Warm',
  kind: 'side',
  act: 2,
  giver: 'mira',
  priority: 7,
  autoStart: { all: [{ npc: 'mira', met: true }, miraAvailable, { var: 'act', gte: 2 }] },
  rewards: 'Mira in your corner · maybe more than coffee',
  summary:
    'Mira leaves a message that isn\'t quite an invitation: a board puzzle she "already solved," and the note that the coffee\'s still warm if you want to see how. It\'s the closest thing to a door she opens. Walk through it and she stops being a rival you keep at arm\'s length and becomes someone who stays.',
  start: 'meet',
  stages: {
    meet: {
      text: 'Mira left you a puzzle and an open door. Show up, sit down, and see whether the two of you are rivals, partners, or something you don\'t have a word for yet.',
      onEnter: [{ scene: 'side_coffee_warm_scene' }],
      objectives: [
        {
          id: 'showed',
          text: "Take Mira up on the coffee",
          when: { never: true },
          hint: 'The [Social] beat decides how the evening goes; where it goes after that is up to you. Either way, showing up is what keeps her in your corner.',
        },
      ],
    },
  },
}

const coffeeScene: SceneDef = {
  id: 'side_coffee_warm_scene',
  channel: 'dialog',
  title: "The Coffee's Still Warm",
  from: 'mira',
  start: 'intro',
  nodes: {
    intro: {
      speaker: 'mira',
      text: [
        { if: { flag: 'npc.mira.rivalry' }, text: 'The page comes in at 10:52 p.m., no greeting: "Cathode. 11. I solved the thing you\'re still losing to. Come see how, or keep losing. -n"' },
        'The Cathode at eleven, her booth, two coffees she ordered before you got there. She slides a printout across — a board challenge you\'ve both been circling for a week. "I solved it Tuesday," she says, not bragging, just true. "Logic flaw in the auth. I read the source, you brute-forced it for three days. I watched you brute-force it for three days. It was like watching someone dig a tunnel next to a door."',
        'She taps the printout. "So. I can show you the door. Or you can keep digging and we can keep pretending we don\'t check each other\'s uptime." A beat. "The coffee\'s still warm."',
      ],
      next: 'choice',
    },
    choice: {
      speaker: 'player',
      text: 'Two coffees. One door. She\'s not going to make this easy, because she never makes anything easy, because easy things can\'t be trusted.',
      choices: [
        {
          text: 'Read the door with her, out loud, riffing off each other until it clicks.',
          tag: '[Social DC 13]',
          check: {
            skill: 'social',
            dc: 13,
            success: 'clicked',
            fail: 'flopped',
            bonuses: [
              { if: { flag: 'npc.mira.respect' }, add: 2, label: '+2 (you asked her to teach you, once)' },
              { if: { flag: 'npc.mira.secret_hinted' }, add: 1, label: '+1 (you know about Ridgeport)' },
            ],
            successEffects: [{ npc: 'mira', affinity: 12 }, { buff: COLLAB_BUFF }, lightSpark],
            failEffects: [{ npc: 'mira', affinity: -2 }, { stat: 'mood', add: -2 }, { stat: 'stress', add: 2 }],
          },
        },
        {
          text: '"Just show me the flaw." Skip the dance; take the lesson.',
          effects: [{ npc: 'mira', affinity: 4 }, { xp: 'intrusion', add: 30 }],
          goto: 'lesson',
        },
        {
          text: 'Slide your own printout across: the flaw she missed, two layers down.',
          tag: '[Programming DC 16]',
          check: {
            skill: 'programming',
            dc: 16,
            bonuses: [{ if: { background: 'mathlete' }, add: 2, label: '+2 (math olympiad)' }],
            success: 'outread',
            fail: 'outread_fail',
            successEffects: [{ npc: 'mira', affinity: 10 }, { buff: COLLAB_BUFF }, lightSpark],
            failEffects: [{ npc: 'mira', affinity: 1 }, { stat: 'mood', add: -3 }, { stat: 'stress', add: 2 }],
          },
        },
      ],
    },
    clicked: {
      speaker: 'narrator',
      text: [
        'It works the way the good nights work: she starts a sentence, you finish it wrong, she corrects you, you correct her back, and somewhere in the argument the flaw just falls open in front of both of you. She laughs — actually laughs, the rare one — and for a second forgets to be guarded.',
        'The coffee goes cold. Neither of you leaves. It\'s two in the morning before she says, quietly, like it costs her, "This was nice. I don\'t do nice. Don\'t make it weird."',
      ],
      next: 'after',
    },
    flopped: {
      speaker: 'narrator',
      text: [
        'You reach for a joke to match her and it lands like a dropped hard drive. You mansplain the flaw she already found. You say "so basically" and watch her eyebrow go up a full centimeter. It is a rout.',
        '"Okay," she says, gathering the printout, mouth twitching. "That was the worst collaboration in the history of the scene. I\'m keeping the door." But she doesn\'t leave, and she does buy the next round, and something in the disaster made her decide you\'re safe to be a disaster around. That counts.',
      ],
      next: 'after',
    },
    outread: {
      speaker: 'narrator',
      text: [
        'She reads your printout with her coffee halfway to her mouth, and the coffee stays there. Two layers under her logic flaw is a second one — uglier, older, the kind you only find if you dig a tunnel next to the door for three days and hit the foundations. "Oh," she says. "Oh, that\'s disgusting. That\'s beautiful."',
        'For the next hour she argues with your find like it insulted her family, and then she concedes, loudly, which Mira does not do. "Fine. You dig. I read. Between us we\'re one entire competent person." She is smiling. She notices she is smiling and doesn\'t stop.',
      ],
      next: 'after',
    },
    outread_fail: {
      speaker: 'narrator',
      text: [
        'You slide your printout across with a flourish. She reads it in eight seconds. "This is my flaw," she says gently, "described worse." She\'s right. You found the door she already opened and wrote it up like a treasure map.',
        '"No, it\'s sweet," she says, and folds your printout into her jacket, which is the most confusing thing anyone has ever done with your work. "You got there. Slower. It counts." She buys the pie. You are not sure whether you lost.',
      ],
      next: 'after',
    },
    lesson: {
      speaker: 'narrator',
      text: [
        'She shows you the flaw. It\'s elegant and obvious in the way only her stuff ever is, and you feel your whole approach reorganize around it. "There," she says, satisfied. "Now you owe me a coffee, and I take payment in not being an idiot about it."',
        'It\'s a good lesson and a decent evening, and she keeps her guard exactly where it was, which is fine. Not every door has to open all the way tonight.',
      ],
      next: 'after',
    },
    after: {
      speaker: 'mira',
      text: 'She\'s got her jacket half on, keys in hand, doing the thing where she leaves before anyone can watch her decide to stay. "So," she says, not looking at you. "Same time next week, or was this a one-off."',
      choices: [
        ...askMiraOut([{ quest: 'side_coffee_warm', objective: 'showed' }], 'together', 'chose_mira'),
        {
          text: '"Same time. Every week. You know that." Already together — say it anyway.',
          if: { npc: 'mira', romance: AT_LEAST_DATING },
          effects: [{ npc: 'mira', affinity: 8 }, { quest: 'side_coffee_warm', objective: 'showed' }],
          goto: 'already',
        },
        {
          text: '"Same time next week." Keep it as it is — partners, not that kind.',
          if: { not: { npc: 'mira', romance: AT_LEAST_DATING } },
          effects: [{ npc: 'mira', affinity: 6 }, { quest: 'side_coffee_warm', objective: 'showed' }],
          goto: 'friends',
        },
      ],
    },
    already: {
      speaker: 'narrator',
      text: [
        'She rolls her eyes so hard it\'s nearly audible. "Obviously. I was checking you still knew." She sits back down, shoulder against yours in the booth, and steals the rest of your pie as a matter of policy.',
        'You stay until Sal starts stacking chairs around you. The puzzle is solved, the coffee is cold, and Mira Okonkwo, who does not stay anywhere, stays.',
      ],
    },
    together: {
      speaker: 'narrator',
      text: [
        'She stops with the jacket half on. Turns around. Looks at you for a long, evaluating second, the same look she gives a system she\'s deciding whether to trust. Then she sets the keys down.',
        '"Okay," she says. "But I plan the wedding." You point out that nobody said anything about a wedding. "I\'m just saying," she says, sitting back down, "when it happens, I plan it. There\'s going to be a spreadsheet." The coffee\'s cold. You order two more.',
      ],
    },
    chose_mira: {
      speaker: 'narrator',
      text: [
        'It isn\'t a clean thing to say and you don\'t say it cleanly. Grace deserved better than to be the thing you were sure about until you weren\'t. But you don\'t lie to Mira, of all people — you tell her there was someone, and that it\'s over, and that this is the one you\'re choosing with your eyes open.',
        'Mira is quiet. Then: "I don\'t share, and I don\'t do second place, and if you ever make me the runner-up I will vanish so completely you\'ll think I was a handle you imagined." She sets the keys down. "Okay. Same time. Every time." The coffee\'s cold. Neither of you leaves.',
      ],
    },
    friends: {
      speaker: 'narrator',
      text: [
        'You let it be what it is — the best kind of rival, the one who reads your source and warms your coffee and never once lets you get away with lazy work. Some of the strongest things two people build have no name and need none.',
        '"Same time," she agrees, and for once she doesn\'t bolt for the door. She stays until closing, arguing about the flaw, and you understand that whatever happens to everyone else in this story, Mira Okonkwo is in your corner now, and she does not leave people who don\'t leave her.',
      ],
    },
  },
}

// ── side_ridgeport — Act III ─────────────────────────────────────────────────

const ridgeportQuest: QuestDef = {
  id: 'side_ridgeport',
  title: 'Ridgeport',
  kind: 'side',
  act: 3,
  giver: 'mira',
  priority: 7,
  autoStart: { all: [{ npc: 'mira', met: true }, miraAvailable, { flag: 'npc.mira.trusts' }, { var: 'act', gte: 3 }] },
  rewards: 'The last wall Mira has · trust, or the truth',
  summary:
    "The man who erased Mira in Ridgeport has found her again, and he's the kind of careful that means he'll do it clean this time. Mira wants to run, the way she always runs. You can defuse him, take the blame off her yourself, or discover that the story she told you about Ridgeport wasn't the whole story.",
  start: 'surface',
  stages: {
    surface: {
      text: "Mira's Ridgeport ex has surfaced and he means to erase her again. She's already packing. What you do about him decides whether she ever stops running.",
      onEnter: [{ scene: 'side_ridgeport_scene' }],
      objectives: [
        {
          id: 'resolved',
          text: "Face what came after Mira from Ridgeport",
          when: { never: true },
          hint: 'Defuse him with a [Social] read of the leverage, take the fall onto yourself, or ask the question about what really happened in Ridgeport. Each costs something different.',
        },
      ],
    },
  },
}

const ridgeportScene: SceneDef = {
  id: 'side_ridgeport_scene',
  channel: 'dialog',
  title: 'Ridgeport',
  from: 'mira',
  start: 'intro',
  nodes: {
    intro: {
      speaker: 'mira',
      text: [
        'Mira is packing. Not dramatically — that\'s the thing that scares you. Methodically, a duffel and a burned box of drives, the practiced pack of someone who has disappeared before. "His name is Aaron. In Ridgeport." She doesn\'t look up. "He found the handle. He\'s good, and he\'s patient, and he already did this to me once. Wrote me out of everything we built. Made it so the good stuff was his and the crime was mine. I did nine months of a suspended sentence with my name on it and he gave the keynote at a security conference about it."',
        '"I\'m not doing it again. I\'m just going to be somewhere else before he finishes." She zips the bag. "I wanted you to hear it from me and not from a handle that stops logging in."',
      ],
      next: 'choice',
    },
    choice: {
      speaker: 'player',
      text: 'The duffel is by the door. She\'s got her hand on it. This is the version of Mira you were always afraid you\'d meet — the one already gone.',
      choices: [
        {
          text: "Find his leverage and turn it around. Give Aaron a reason to lose your number.",
          tag: '[Social DC 17]',
          check: {
            skill: 'social',
            dc: 17,
            success: 'defused',
            fail: 'doxxed',
            bonuses: [{ if: { skill: 'opsec', gte: 40 }, add: 2, label: '+2 (you know how he\'ll hide)' }],
            successEffects: [{ npc: 'mira', affinity: 18 }, { flag: 'side.ridgeport_defused' }],
            failEffects: [{ stat: 'heat', add: 15 }, { npc: 'mira', affinity: 8 }, { scene: 'side_ridgeport_hideout', delayHours: 72 }],
          },
        },
        {
          text: "Take the blame onto your own name so hers stays clean this time.",
          tag: '[Take the fall]',
          effects: [{ npc: 'mira', affinity: 20 }, lightSpark, { stat: 'heat', add: 25 }],
          goto: 'took_fall',
        },
        {
          text: '"Mira. What actually happened in Ridgeport?" Ask the whole question.',
          tag: '[The truth]',
          effects: [{ npc: 'mira', affinity: -4 }],
          goto: 'lied',
        },
        {
          text: "Don't stop her. Help her pack a clean exit — and tell her the door stays open.",
          tag: '[Let her decide]',
          effects: [{ npc: 'mira', affinity: 10 }, { stat: 'mood', add: -6 }],
          goto: 'ran',
        },
      ],
    },
    defused: {
      speaker: 'narrator',
      text: [
        'You don\'t out-hack Aaron; you out-read him. A patient man with a conference keynote and a clean reputation has a great deal to lose and no appetite for a fight that might get loud. You find the seams in the story he tells about himself — quietly, the way Mira taught you — and you let him understand, without a single threat, that erasing her a second time would be the most expensive thing he ever did.',
        'He loses her number. Mira watches you work and something in her face comes unclenched that you have never seen unclenched. She unpacks the duffel, slowly, one drive at a time. "You didn\'t make it about you," she says, wondering. "Everyone makes it about them." She doesn\'t leave. For the first time, you believe she might never.',
      ],
      effects: [{ quest: 'side_ridgeport', objective: 'resolved' }],
    },
    doxxed: {
      speaker: 'narrator',
      text: [
        'You reach for the leverage and Aaron is faster and meaner than you gave him credit for. He can\'t erase her again — you\'re in the way now — but he can make noise, and he does: her old name, her old case, her new address, all of it lit up where the wrong people can see it. The heat lands on both of you.',
        'She doesn\'t run, though. That\'s the thing that guts you. She looks at the mess and says, "You stood in front of it. Nobody\'s ever stood in front of it." She hides at your place with the lights off and the bag still by the door, and she stays, scared and furious and staying, because you tried. You\'ll clean up Aaron\'s noise for months. She helps.',
      ],
      effects: [{ quest: 'side_ridgeport', objective: 'resolved' }, { flag: 'side.ridgeport_doxxed' }, { trait: 'pkg11_family_ridgeport_shadow' }],
    },
    took_fall: {
      speaker: 'narrator',
      text: [
        'You do the thing Aaron did, in reverse: you arrange it so the old case has your fingerprints on the crime and hers on nothing. You put your name where hers was. It costs you — heat, exposure, a night you\'ll relive — and Mira watches you do it and understands exactly what it is, because it\'s the inverse of the worst thing that ever happened to her.',
        '"You absolute idiot," she says, and there are tears in it, which from Mira is a natural disaster. "You just made yourself the story so I could stop being it." She sets the bag down for good. She doesn\'t run. She stays, and she keeps the coffee warm, and she never lets you carry anything that heavy alone again.',
      ],
      effects: [{ quest: 'side_ridgeport', objective: 'resolved' }],
    },
    lied: {
      speaker: 'narrator',
      text: [
        'You ask the whole question, and the room goes cold. "What actually happened," she repeats. And then, because you asked, she tells you the part she left out: that at the end, cornered, she did one thing she isn\'t proud of — she burned a mutual friend to buy her own exit. Not the way Aaron tells it. But not nothing, either.',
        '"So now you know," she says, quiet and defended and braced for you to look at her differently. "I\'m not just the girl it happened to. I\'m also a person it happened *because* of." How you hold that — whether you can hold it — is the wall behind the wall. She stays, watchful, waiting to see if the truth cost her you. It hasn\'t. But it\'s a longer road back to warm now, and you both know it.',
      ],
      effects: [{ quest: 'side_ridgeport', objective: 'resolved' }],
    },
    ran: {
      speaker: 'narrator',
      text: [
        'You don\'t argue her out of it. You help her do it right instead — a clean route out past the Sound, a burner handle, a place Aaron can\'t follow. At the door you tell her the only true thing you\'ve got: "The coffee\'s still warm. Whenever." It\'s the kindest thing and it feels like the worst thing.',
        'She\'s gone five weeks. Her handle stays grey. Then one night it goes green, and a page comes in that just says "he lost interest. i didn\'t." She walks into the Cathode an hour later with the same duffel and sits in her booth like she never left. "Most people would\'ve tried to keep me," she says. "You let me go. So I came back." She doesn\'t explain further. She doesn\'t need to.',
      ],
      effects: [{ quest: 'side_ridgeport', objective: 'resolved' }, { npc: 'mira', affinity: 6 }],
    },
  },
}

/** Follow-up to a failed defuse: Aaron's noise lands, and Mira goes to ground at your place. */
const ridgeportHideout: SceneDef = {
  id: 'side_ridgeport_hideout',
  channel: 'chat',
  title: 'lights off',
  from: 'mira',
  pause: false,
  start: 'ping',
  nodes: {
    ping: {
      speaker: 'mira',
      text: [
        'ok. i\'m at yours. used the spare key under the dead fern',
        'your fern is dead btw',
        'lights off, modem unplugged, i moved the couch so it\'s not in line with the window. don\'t laugh. old habits',
        'he posted my old case number on three boards. two took it down. one is run by a guy who owes me',
        'i\'m not running. i want that on the record. i\'m just... sitting very still in the dark in your apartment',
      ],
      choices: [
        {
          text: 'omw. bringing food. the good noodles. do NOT open the door for anyone who doesn\'t knock our knock',
          effects: [{ npc: 'mira', affinity: 6 }, { stat: 'mood', add: 2 }],
          goto: 'food',
        },
        {
          text: 'give me the third board. i\'ll make the guy remember what he owes',
          tag: '[Networking DC 14]',
          check: {
            skill: 'networking',
            dc: 14,
            success: 'scrubbed',
            fail: 'scrub_fail',
            successEffects: [{ npc: 'mira', affinity: 8 }, { stat: 'heat', add: -6 }, { trait: 'pkg11_family_ridgeport_shadow', remove: true }, { flag: 'side.ridgeport_scrubbed' }],
            failEffects: [{ stat: 'heat', add: 4 }, { npc: 'mira', affinity: 3 }, { stat: 'stress', add: 4 }, { chance: 0.3, then: [{ complication: 'hack' }] }],
          },
        },
      ],
    },
    food: {
      speaker: 'mira',
      text: ['we have a knock?', '...ok we have a knock now. three and then one. don\'t be late. *hugz*'],
    },
    scrubbed: {
      speaker: 'mira',
      text: ['it\'s gone. all three.', 'you did that in forty minutes. i was going to do it in thirty but i was busy sitting in the dark', 'and the mirror he was setting up in ridgeport never finished seeding. he\'s got nothing left to post. that shadow\'s off you too', 'come home. i\'ll turn one light on'],
    },
    scrub_fail: {
      speaker: 'mira',
      text: [
        'he mirrored it before you got there. there\'s a copy on some ridgeport board now too',
        'it\'s ok. it\'s ok. it\'s just my name. i\'ve had worse things done to my name',
        'just come home',
      ],
    },
  },
}

/**
 * Second chance: the coffee night ended as friends (or before the spark), and later a spark
 * appeared anyway — through the Act II wall or just time. Mira reopens the door herself.
 */
const secondChanceTrigger: TriggerDef = {
  id: 'side_coffee_warm_again',
  atHour: 23,
  chance: 0.25,
  when: {
    all: [
      { quest: 'side_coffee_warm', status: 'completed' },
      miraAvailable,
      miraSpark,
      { npc: 'mira', affinityGte: 35 },
      { not: partnerIs('mira') },
    ],
  },
  effects: [{ scene: 'side_coffee_warm_again_scene' }],
}

const secondChanceScene: SceneDef = {
  id: 'side_coffee_warm_again_scene',
  channel: 'chat',
  title: 'booth',
  from: 'mira',
  pause: false,
  expiresDays: 7,
  onExpire: [{ npc: 'mira', affinity: -3 }],
  start: 'ping',
  nodes: {
    ping: {
      speaker: 'mira',
      text: [
        'cathode. my booth. i ordered two',
        'this isn\'t a puzzle. there\'s no puzzle. i checked, it\'s just coffee',
        'that\'s the whole message. i\'m not going to send a second one, i have a reputation',
      ],
      choices: [
        ...askMiraOut([], 'together', 'chose'),
        {
          text: 'omw. still just coffee though, right?',
          effects: [{ npc: 'mira', affinity: 2 }],
          goto: 'friends',
        },
      ],
    },
    together: {
      speaker: 'mira',
      text: ['ok', 'OK', 'you\'re buying. and i plan the wedding. there\'s going to be a spreadsheet. that\'s not a proposal that\'s a warning', '*hugz*'],
    },
    chose: {
      speaker: 'mira',
      text: [
        'you told her first? before me?',
        '...good. that\'s the right order. i\'d have hated you a little if you hadn\'t',
        'i don\'t do second place. you know that. so don\'t make me',
        'booth. now. *hugz*',
      ],
    },
    friends: {
      speaker: 'mira',
      text: ['right. yeah. just coffee', 'bring the printout from last week, i found a third flaw and i want to watch your face'],
    },
  },
}

export default defineContent({
  quests: [coffeeQuest, ridgeportQuest],
  scenes: [coffeeScene, ridgeportScene, ridgeportHideout, secondChanceScene],
  triggers: [secondChanceTrigger],
})
