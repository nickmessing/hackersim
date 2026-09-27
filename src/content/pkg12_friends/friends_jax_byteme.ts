/**
 * PKG-12 — Side: Friends & Freelance.
 * Jax's loyalty quest (Rosa's bills) and byteme's two loyalty beats (the snow day, the arcade score).
 *
 * Loyalty quests carry "Loyalty" in the title so the Journal tags them; completing one shields the
 * NPC from the first-blood/mirror selectors (bible §4.7). This package is the writer of
 * `npc.rosa.fate` and `npc.byteme.used` (§13).
 *
 * All "hacking" here is abstract game fiction: a dice check against an invented system, never a
 * technique. byteme's "tool off the forum" is a made-up bragged-about program with no real content.
 */
import { defineContent } from '@/engine/registry'
import type { QuestDef, SceneDef } from '@/engine/types'

// ── side_jax_sister — Loyalty: Jax ────────────────────────────────────────────
// Rosa Ferreira's heart condition has a long name and a longer bill. Jax is drowning quietly.

const jaxSister: QuestDef = {
  id: 'side_jax_sister',
  title: "Loyalty: Rosa's Envelopes",
  kind: 'side',
  act: 2,
  giver: 'jax',
  priority: 8,
  rewards: "Rosa's care · Jax's loyalty",
  summary:
    "Jax has been hiding the medical envelopes from his own mother, and from you. Rosa reads them anyway — she's the only one in that house who does. Somebody has to help, and Jax will never ask.",
  autoStart: {
    all: [
      { var: 'act', gte: 2 },
      { npc: 'jax', met: true, fateNot: ['dead', 'gone', 'arrested', 'flipped'] },
      { npc: 'rosa', fateNot: ['treated', 'passed'] },
      { day: true, gte: 300 },
    ],
  },
  start: 'help',
  stages: {
    help: {
      text: "There's a shoebox of unpaid bills under Jax's bed and a very smart eleven-year-old who's already done the math. Find a way to get Rosa's treatment paid — legit, hot, or by leaning on the Row — before it gets worse.",
      onEnter: [{ scene: 'side_jax_sister_scene' }],
      objectives: [
        {
          id: 'resolve',
          text: "Settle Rosa's bill one way or another",
          when: { flag: 'side.rosa_resolved' },
          hint: "Meet Jax at the Cathode booth. You can pay it, put him onto a paying job, sweet-talk the clinic, or admit you can't — each lands differently on Rosa and on Jax.",
        },
      ],
      onComplete: [{ log: "Rosa's bills, one way or another, are behind you.", kind: 'story' }],
    },
  },
}

const jaxSisterScene: SceneDef = {
  id: 'side_jax_sister_scene',
  channel: 'dialog',
  title: "Rosa's Envelopes",
  from: 'jax',
  start: 'booth',
  nodes: {
    booth: {
      speaker: 'jax',
      text: [
        "Jax has the corner booth at the Cathode and a coffee he isn't drinking. There's a shoebox on the seat next to him. He keeps almost putting his hand on it and then not.",
        '"Okay so. Don\'t make a thing of it." He slides the box over. It\'s full of envelopes, most of them with the little cellophane windows, most of them opened by someone with small, careful hands.',
        { if: { flag: 'a2.priya_backstory' }, text: '"Rosa opens them before Ma can hide them. She\'s got a folder. Color-coded. She\'s eleven." He laughs, and it doesn\'t work.' },
        '"The clinic wants twelve hundred to keep the good doctor on her case. I\'ve got, uh." He checks a pocket he already knows is empty. "I\'ve got a plan."',
      ],
      choices: [
        {
          text: "\"Your plan is me. Here's the twelve hundred.\"",
          tag: '[Pay $1,200]',
          req: { stat: 'money', gte: 1200 },
          reqText: 'Requires $1,200',
          goto: 'paid',
        },
        {
          text: '"No hot jobs alone. We line up a real gig, you earn it, I watch your back."',
          goto: 'gig',
        },
        {
          text: '"Let me talk to whoever sends these letters."',
          tag: '[Social DC 14]',
          check: {
            skill: 'social',
            dc: 14,
            bonuses: [{ if: { trait: 'silver_tongue' }, add: 2, label: '+2 (silver tongue)' }],
            success: 'talked',
            fail: 'talked_fail',
          },
        },
        {
          text: "\"Jax, I can't swing this right now. I'm sorry.\"",
          tag: '[Leave]',
          goto: 'cant',
        },
      ],
    },
    paid: {
      speaker: 'jax',
      text: [
        "He looks at the money like it might be a trick. Then he doesn't. He just folds it, very slowly, into the shoebox.",
        '"I\'m gonna pay this back. I mean it. Every dollar." He won\'t, not in dollars, and you both know that, and it doesn\'t matter even a little.',
        "Rosa's doctor stays on the case. Two weeks later she runs the school science fair like a small merciless general, and mails you a certificate that says WORLD'S OKAYEST SPONSOR in her mother's good pen.",
      ],
      effects: [
        { npc: 'rosa', fate: 'treated' },
        { npc: 'jax', affinity: 18 },
        { faction: 'fac.hood', add: 5 },
        { flag: 'side.rosa_resolved' },
        { flag: 'npc.jax.protected' },
        { stat: 'mood', add: 8 },
      ],
    },
    gig: {
      speaker: 'player',
      text: [
        "You don't let him take the too-hot contract off the board. You find him a real one instead — dull, legal-ish, well-paid — and you sit in the room while he does it, reading his screen over his shoulder like a nervous parent.",
        "He's good. That's the thing that keeps scaring both of you. He talks a payment loose from a client who didn't want to pay, entirely with his voice, and the money lands, and Rosa's doctor stays on.",
        '"See?" He\'s shaking a little. "Told you I had a plan." The heat of the gig sits on you, not him. That was the deal.',
      ],
      effects: [
        { npc: 'rosa', fate: 'treated' },
        { npc: 'jax', affinity: 14 },
        { stat: 'heat', add: 8 },
        { xp: 'social', add: 30 },
        { flag: 'side.rosa_resolved' },
        { flag: 'npc.jax.protected' },
      ],
    },
    talked: {
      speaker: 'Clinic billing manager',
      text: [
        "The billing office at Harbor Point General smells like carpet cleaner and defeat. The woman behind the glass has heard every sad story and believed none of them, and you don't give her one.",
        "You give her a payment plan she can defend to her own boss, a first installment you can actually make, and a reason to route Rosa's file to the fund nobody advertises. She stamps it. She even almost smiles.",
        '"Tell the little girl to keep her folder," she says. "It\'s better than half of what we\'ve got."',
      ],
      effects: [
        { npc: 'rosa', fate: 'treated' },
        { npc: 'jax', affinity: 12 },
        { faction: 'fac.hood', add: 6 },
        { money: -300 },
        { flag: 'side.rosa_resolved' },
        { flag: 'npc.jax.protected' },
      ],
    },
    talked_fail: {
      speaker: 'Clinic billing manager',
      text: [
        "You push it too hard, too fast, and the woman behind the glass goes flat and administrative. \"That's not a program we offer,\" she says, to a wall just left of your head.",
        "So you do the ugly, expensive thing: you cover the deposit yourself, on the spot, to keep Rosa's file from sliding to the bottom of a stack — and then, because the deposit is only the deposit, you sign the payment plan too. Your name, on the line under hers. It works. It just costs more, for longer, and Jax doesn't find out how much.",
        "Rosa keeps her doctor. You keep the receipt somewhere you won't look at it, and a statement arrives every month to remind you where it is.",
      ],
      effects: [
        { npc: 'rosa', fate: 'treated' },
        { npc: 'jax', affinity: 8 },
        { money: -300 },
        { obligation: { id: 'pkg12_friends_rosa_plan', label: "Rosa's clinic payment plan (in your name)", perDay: 5, days: 120 } },
        { stat: 'stress', add: 6 },
        { flag: 'side.rosa_resolved' },
        { flag: 'npc.jax.protected' },
      ],
    },
    cant: {
      speaker: 'jax',
      text: [
        "He nods too fast. \"No, yeah, totally, you got your own stuff.\" He pulls the shoebox back, carefully, like it's asleep.",
        '"I\'ll figure it. I always figure it." That\'s the whole problem. He\'ll figure it the fast way, the way that ends with his name in somebody\'s file.',
        { if: { flag: 'npc.jax.exposed' }, text: "You already know how his figuring goes. There's already a file." },
        "Rosa's bills go back under the bed. She reads them anyway. She's the only one in that house who does.",
      ],
      effects: [
        { npc: 'rosa', fate: 'worsens' },
        { npc: 'jax', affinity: -8 },
        { stat: 'stress', add: 6 },
        { flag: 'side.rosa_resolved' },
        { flag: 'npc.jax.alone' },
      ],
    },
  },
}

// ── side_byteme_snowday — Loyalty: byteme ─────────────────────────────────────
// Kevin has a snow day and a program the forum swore was "undetectable." It is not.

const bytemeSnowday: QuestDef = {
  id: 'side_byteme_snowday',
  title: 'Loyalty: The Snow Day',
  kind: 'side',
  act: 1,
  giver: 'byteme',
  priority: 8,
  rewards: "byteme's loyalty · a fork in the kid",
  summary:
    'Kevin Pham got a snow day, a full battery, and a program off the forum that "says its undetectable so its fine right. right??" He is sixteen, he is brilliant, and he is one bad afternoon from a very long file.',
  autoStart: {
    all: [
      { var: 'act', lte: 2 },
      { npc: 'byteme', met: true, fateNot: ['dead', 'arrested_young'] },
      { day: true, gte: 95 },
    ],
  },
  start: 'panic',
  stages: {
    panic: {
      text: "byteme is paging you in a lowercase panic. He pointed a bragged-about program at something because school was closed and his impulse control wasn't. Decide what kind of teacher you're going to be.",
      onEnter: [{ scene: 'side_byteme_snowday_scene' }],
      objectives: [
        {
          id: 'resolve',
          text: 'Answer the kid before he does something worse',
          when: { flag: 'side.byteme_snowday_done' },
          hint: 'Open the BuddyPager. You can clean up quietly, teach him to be invisible, or scare him careful — each shapes who he becomes.',
        },
      ],
      onComplete: [{ log: 'The snow day is survived. What Kevin learned from it is the part that lasts.', kind: 'story' }],
    },
  },
}

const bytemeSnowdayScene: SceneDef = {
  id: 'side_byteme_snowday_scene',
  channel: 'chat',
  title: 'byteme',
  from: 'byteme',
  pause: true,
  start: 'ping',
  nodes: {
    ping: {
      speaker: 'byteme',
      text: [
        'ok so. dont be mad',
        'snow day. got the whole day. got the thing off the warez board, guy SWORE its undetectable',
        'i pointed it at the school grade portal thing as a joke and now theres like. a log? theres a log with a timestamp and i dont know whose it is',
        'its fine right. right??',
      ],
      choices: [
        {
          text: "\"Don't touch anything. I'm coming in behind you to clean it up. Sit on your hands.\"",
          goto: 'cover',
        },
        {
          text: "\"It's not fine. Sit still, screen-share, and I'll show you how to do it so there's no log at all.\"",
          tag: '[Teach him the quiet way]',
          goto: 'teach',
        },
        {
          text: "\"Kevin. Log off. Now. We need to talk about how this ends for kids who don't.\"",
          tag: '[Social DC 12]',
          check: {
            skill: 'social',
            dc: 12,
            bonuses: [{ if: { npc: 'byteme', affinityGte: 30 }, add: 2, label: '+2 (he listens to you)' }],
            success: 'scared',
            fail: 'scared_fail',
          },
        },
      ],
    },
    cover: {
      speaker: 'byteme',
      text: [
        "You walk him through pulling his hands off the keyboard, then you clean up after him the boring, careful way — the way that takes an hour and teaches nothing except that somebody will always take the hour for him.",
        'omg. ok. its gone? you made it gone',
        'youre like a wizard. i owe you a mountain dew and also my life',
        "He's safe. He also learned that the fix is a phone call to you. You file that thought away where it makes you uneasy.",
      ],
      effects: [
        { npc: 'byteme', affinity: 8 },
        { stat: 'heat', add: 3 },
        { flag: 'side.byteme_snowday_done' },
      ],
    },
    teach: {
      speaker: 'byteme',
      text: [
        "You screen-share and walk him through it properly — how to leave no timestamp, how to want to be invisible more than you want to be impressive. He gets it fast. He gets everything fast. That's the trouble.",
        'ohhh. OH. thats so much cleaner. why does nobody teach this',
        "Because nobody should be teaching a sixteen-year-old this. But you did, and now he knows, and one day when you need a set of quiet hands you're going to remember that he never once told you no.",
        'youre the best. teach me the next thing',
      ],
      effects: [
        { npc: 'byteme', affinity: 12 },
        { flag: 'npc.byteme.used' },
        { flag: 'side.byteme_snowday_done' },
        { xp: 'opsec', add: 10 },
      ],
    },
    scared: {
      speaker: 'byteme',
      text: [
        "You tell him about Deadline. The '94 raid, the fourteen months, the confiscated dog's vet records. You make it real and you make it his — a kid his age, a snow day just like this one, a log just like his.",
        'ok. ok im logging off. im logging off for real',
        "i didnt think about the. the after part. that theres an after part",
        "He signs off. When he comes back that evening it's to ask you, in complete lowercase sentences, how to check whether he's already made himself a problem. He starts using the word 'careful' like it's new to him. It is.",
      ],
      effects: [
        { npc: 'byteme', affinity: 6 },
        { flag: 'side.byteme_careful' },
        { flag: 'side.byteme_snowday_done' },
      ],
    },
    scared_fail: {
      speaker: 'byteme',
      text: [
        "You reach for the scary story and it comes out like a lecture, and a sixteen-year-old can smell a lecture through a modem. He goes quiet, then defensive, then gone.",
        'ok mom. relax. i said its fine',
        "He logs off before you can fix it, and does the rest himself, badly and luckily. Nothing catches him this time. You spend the evening quietly checking, from the outside, that the luck held.",
        "It held — for him. He doesn't know how close it was. He never does. What he kicked over on his way out, though, has your handle in its buddy list, and you spend the next week half-listening for the other shoe.",
      ],
      effects: [
        { npc: 'byteme', affinity: -6 },
        { stat: 'stress', add: 5 },
        { flag: 'side.byteme_snowday_done' },
        { chance: 0.3, then: [{ complication: 'hack' }] },
      ],
    },
  },
}

// ── side_vanishing_highscore — an alternate byteme loyalty beat ────────────────
// The Sodium Row arcade's high-score table sprouts a handle that shouldn't be there.

const vanishingHighscore: QuestDef = {
  id: 'side_vanishing_highscore',
  title: 'Loyalty: The Vanishing High Score',
  kind: 'side',
  act: 1,
  giver: 'byteme',
  priority: 7,
  rewards: "byteme's loyalty · Sodium Row goodwill",
  summary:
    "The champion of the Sodium Row arcade's oldest cabinet has been dethroned by a name that reads BYTE, then B4TE, then a rude word, all with impossible scores. Kevin has learned to rewrite the little chip that remembers who's best. Somebody's going to notice.",
  autoStart: {
    all: [{ var: 'act', eq: 1 }, { npc: 'byteme', met: true, fateNot: ['dead', 'arrested_young'] }, { day: true, gte: 20 }],
  },
  start: 'score',
  stages: {
    score: {
      text: "byteme cracked the score-keeper chip in the arcade's ancient cabinet and can't stop signing his work. Sal's noticed the scores are 'a little psychotic lately.' Decide whether to rat, cover, or turn it into a lesson.",
      onEnter: [{ scene: 'side_vanishing_highscore_scene' }],
      objectives: [
        {
          id: 'resolve',
          text: 'Deal with the high-score situation',
          when: { flag: 'side.highscore_done' },
          hint: "It's at the Cathode's back-corner cabinet. You can tell on him, cover for him, or teach him why leaving your name everywhere is the amateur move.",
        },
      ],
      onComplete: [{ log: 'The high-score table is settled. So, a little, is Kevin.', kind: 'story' }],
    },
  },
}

const vanishingHighscoreScene: SceneDef = {
  id: 'side_vanishing_highscore_scene',
  channel: 'dialog',
  title: 'The Vanishing High Score',
  from: 'byteme',
  start: 'cabinet',
  nodes: {
    cabinet: {
      speaker: 'byteme',
      text: [
        "The cabinet is older than either of you — a fishing game nobody's beaten since the first Bush administration. The top score used to belong to somebody who signed it SAL, in 1991.",
        "Now the whole table reads B4TE, B4TE, B4TE, with scores that would require the machine to run for a hundred years without a bathroom break. byteme is vibrating next to you.",
        '"i figured out the little chip that remembers the scores," he whispers, delighted. "i can put ANYTHING. watch, i\'ll put your name—"',
        { if: { flag: 'npc.byteme.used' }, text: '"you taught me the quiet stuff, this is basically the same, right?" No. It is exactly the opposite of the quiet stuff.' },
      ],
      choices: [
        {
          text: '"Sal\'s going to notice. Tell him yourself, before he finds out on his own."',
          goto: 'rat',
        },
        {
          text: "\"Put SAL's 1991 score back on top and never touch it again. I'll square it with the old man.\"",
          tag: '[Cover for him]',
          goto: 'cover',
        },
        {
          text: '"Rule one of leaving your name everywhere: don\'t. Let me show you what a pro would do here."',
          tag: '[Lesson]',
          goto: 'lesson',
        },
      ],
    },
    rat: {
      speaker: 'sal',
      text: [
        "You make him walk up to the counter and confess, which is worse than any punishment. Sal listens to the whole thing with a coffee pot in one hand and an expression like weather.",
        '"You broke my machine," Sal says, "to write your name on it. In my day we used a knife and the bathroom wall." A long pause. "You\'re gonna clean the grill for a week. And you\'re gonna put my 1991 back."',
        "Kevin, scarlet, cleans grills for a week. He hates it. He also stops signing his work, which is the whole point, and he never forgets that the worst part of getting caught is the walk to the counter.",
      ],
      effects: [
        { npc: 'byteme', affinity: -2 },
        { faction: 'fac.hood', add: 4 },
        { flag: 'side.byteme_careful' },
        { flag: 'side.highscore_done' },
      ],
    },
    cover: {
      speaker: 'sal',
      text: [
        "You quietly restore SAL, 1991, to the top of the table where it belongs, and buy the old man's silence with a slice of pie and a story that's only mostly a lie.",
        'Sal squints at the machine, then at you. "Funny," he says. "Coulda swore the scores went crazy." He lets it go, because he lets you get away with things, because you eat here.',
        "byteme is thrilled to have gotten away with it. That's the part that worries you. He learned that you'll paper over it. He did not learn to stop.",
      ],
      effects: [
        { npc: 'byteme', affinity: 6 },
        { flag: 'side.highscore_done' },
      ],
    },
    lesson: {
      speaker: 'player',
      text: [
        "You sit him down at the cabinet and take the fun apart with him. Anybody can write BYTE on a chip. The move nobody sees is putting a score that's *plausible* — good, human, deniable — under a name that isn't yours, and walking away.",
        '"so like... the point is nobody knows i did it?" Yes. That is the entire point of all of it, forever.',
        'He puts SAL back on top, out of a new and grudging respect, and sets one quiet, believable score under a made-up name three rows down. "for practice," he says. He is, God help you, a fast learner.',
      ],
      effects: [
        { npc: 'byteme', affinity: 8 },
        { flag: 'side.byteme_careful' },
        { flag: 'side.highscore_done' },
        { xp: 'opsec', add: 8 },
      ],
    },
  },
}

export default defineContent({
  quests: [jaxSister, bytemeSnowday, vanishingHighscore],
  scenes: [jaxSisterScene, bytemeSnowdayScene, vanishingHighscoreScene],
})
