/**
 * PKG-11 — Kim's arc (bible §4.2, §8 Family). Three of Kim's four beats live here
 * (beat 1 `side_tamagotchi_triage` is PKG-13); the reckoning node is `main_a4_q1` (PKG-04).
 *
 * Every choice moves the `kim_trajectory` var (bible §11.1 / §4.6): positive = you kept her out
 * of it and set an example (→ `thriving`, college); negative = she followed you in (→ `follows_in`).
 * The var, not a flag, is the through-line; PKG-04 finalizes her fate from it. This package also
 * nudges her affinity so the "you were around / you weren't" reading holds.
 *
 * Hacking is fiction: Kim's "other stuff" is abstract game-flavored mischief; nothing here is real
 * technique, and the whole point of the arc is what you teach a fourteen-year-old about it.
 */
import { defineContent } from '@/engine/registry'
import type { QuestDef, SceneDef } from '@/engine/types'
import { momHere } from './_shared'

// ── side_kims_login — beat 2 (Act IIa, Shop/Build) ───────────────────────────

const kimsLoginQuest: QuestDef = {
  id: 'side_kims_login',
  title: "Kim's First Login",
  kind: 'side',
  act: 2,
  giver: 'kim',
  priority: 6,
  autoStart: { all: [{ npc: 'kim', met: true }, { var: 'act', gte: 2 }, { day: true, gte: 260 }] },
  rewards: 'Neighborhood standing · what Kim learns from you',
  summary:
    'Kim has saved up two hundred dollars in babysitting money and a shoebox of birthday cash, and she wants her own machine so she can stop borrowing yours. She wants you to help her build it. What you put in the box, and how you get the parts, is the first real thing you teach her.',
  start: 'build',
  stages: {
    build: {
      text: 'Kim spread a parts list across the kitchen table, priced everything, and left it where you\'d see it. She is not going to ask twice. Help her build a first PC — and decide what kind of builder she becomes.',
      onEnter: [{ scene: 'side_kims_login_scene' }],
      objectives: [
        {
          id: 'built',
          text: "Build Kim her first machine",
          when: { never: true },
          hint: 'Sit down at the table. Clean parts cost more and teach her patience; hot parts are cheaper and teach her something else.',
        },
      ],
      onComplete: [{ faction: 'fac.hood', add: 5 }],
    },
  },
}

const kimsLoginScene: SceneDef = {
  id: 'side_kims_login_scene',
  channel: 'dialog',
  title: "Kim's First Login",
  from: 'kim',
  start: 'intro',
  nodes: {
    intro: {
      speaker: 'kim',
      text: [
        'Kim has the parts list laminated. She actually went to the library and laminated it. "Okay. Two hundred and forty dollars. I want a machine that can run the good games and get on the good boards, and I want to build it myself so you can\'t say I don\'t understand it."',
        'She slides the list over. It\'s a decent list. She undershot the RAM and overshot the case fans, which is exactly the mistake you made at her age.',
      ],
      next: 'pitch',
    },
    pitch: {
      speaker: 'kim',
      text: '"So. You\'re the one who knows a guy. Do we do this the right way, or do we do this the fun way? Because the fun way is a hundred bucks cheaper and I already know you know a guy."',
      choices: [
        {
          text: 'Do it right. New-ish parts, receipts, and you teach her every step.',
          tag: '[Clean]',
          effects: [
            { money: -140 },
            { var: 'kim_trajectory', add: 1 },
            { npc: 'kim', affinity: 8 },
            { faction: 'fac.hood', add: 2 },
          ],
          goto: 'clean',
        },
        {
          text: '"Know a guy." Cheap parts of uncertain provenance, and a wink.',
          tag: '[Hot]',
          effects: [
            { money: -40 },
            { var: 'kim_trajectory', add: -2 },
            { npc: 'kim', affinity: 6 },
            { stat: 'cred', add: 1 },
          ],
          goto: 'hot',
        },
        {
          text: 'Make her earn half of it first. No handouts.',
          tag: '[Business]',
          check: {
            skill: 'business',
            dc: 12,
            success: 'earned',
            fail: 'earned_soft',
            successEffects: [{ var: 'kim_trajectory', add: 1 }, { npc: 'kim', affinity: 4 }, { money: -90 }],
            failEffects: [{ npc: 'kim', affinity: -2 }, { money: -120 }, { flag: 'side.kim.guilt_trip' }],
          },
        },
        {
          text: 'Raid your own spares bin. Build her a hand-me-down with a story in every part.',
          tag: '[Hardware DC 13]',
          req: { skill: 'hardware', gte: 12 },
          reqText: 'Requires Hardware 12',
          check: {
            skill: 'hardware',
            dc: 13,
            bonuses: [{ if: { background: 'tinkerer' }, add: 2, label: '+2 (basement tinkerer)' }],
            success: 'spares',
            fail: 'spares_fail',
            successEffects: [{ var: 'kim_trajectory', add: 1 }, { npc: 'kim', affinity: 10 }, { money: -20 }],
            failEffects: [{ npc: 'kim', affinity: 4 }, { money: -90 }, { stat: 'stress', add: 2 }, { flag: 'side.kim.smoke_machine' }],
          },
        },
      ],
    },
    spares: {
      speaker: 'narrator',
      text: [
        'You drag the spares bin out from under your bed and dump it on the kitchen table: the RAM from your first rig, the network card that got you through the flood, a case with a dent from the time Jax used it as a stepladder. Every part comes with a story and Kim makes you tell all of them. She writes them on masking tape and labels the parts.',
        'It boots on the second try, which she decides is better than the first try because "now I know what the beep codes mean." She calls the machine Frankenstein. She means it as a compliment. "It\'s got your whole life in it," she says, and then, catching herself, "your whole dumb life," which is the same sentence in Kim.',
      ],
      effects: [{ quest: 'side_kims_login', objective: 'built' }],
    },
    spares_fail: {
      speaker: 'narrator',
      text: [
        'Your spares bin turns out to be a museum of things that died for a reason. The RAM from your first rig is the reason your first rig crashed. The network card smells faintly of smoke. After an evening of beep codes you both admit defeat and go buy the missing parts new, at full price, on your dime.',
        '"So the lesson," Kim says, carrying the receipt home like a trophy, "is that you keep junk and call it sentiment." Still — she seated every part herself. It boots. She names it after the smoke smell. You do not ask how.',
      ],
      effects: [{ quest: 'side_kims_login', objective: 'built' }],
    },
    clean: {
      speaker: 'narrator',
      text: [
        'You take her to the good shop on Sodium Row and make her carry every box. You teach her to seat RAM until it clicks, to route a cable so it isn\'t in the fan, to write down the model number of everything in case it dies. She grounds herself on the case like you showed her, unprompted, and you have to look away so she doesn\'t see your face.',
        'When it POSTs on the first try she doesn\'t cheer. She just stares at the BIOS screen like it owes her money, and says, quietly, "I did that." She keeps the receipts in the laminated folder. She keeps everything.',
      ],
      effects: [{ quest: 'side_kims_login', objective: 'built' }],
    },
    hot: {
      speaker: 'narrator',
      text: [
        'The guy meets you behind the arcade. The parts work — mostly. The drive has somebody else\'s minesweeper high scores still on it and a folder named TAXES you delete without looking. Kim watches you not-look, and files it away.',
        'The machine boots. It\'s fast and it was cheap and it feels a little like getting away with something, and you can see her learning that feeling, learning that the fun way and the cheap way and the your-way are the same way. "Teach me the guy," she says. You say maybe. She hears yes.',
      ],
      effects: [{ quest: 'side_kims_login', objective: 'built' }],
    },
    earned: {
      speaker: 'kim',
      text: [
        '"You want me to earn half. Of course you do." She grumbles, and then she does it — a summer of babysitting and a very aggressive lemonade-stand pivot into "tech support for the whole street, cash only." She out-earns your estimate by a week.',
        'When you build it together she treats every part like it cost her something, because it did. "This is the most annoying lesson anyone has ever taught me," she says, seating the RAM until it clicks. "I\'m going to use it on everyone."',
      ],
      effects: [{ quest: 'side_kims_login', objective: 'built' }],
    },
    earned_soft: {
      speaker: 'narrator',
      text: [
        'You try to teach her the value of a dollar and she counters with the value of a guilt trip, deployed at Sunday dinner, in front of the whole family. You cave and cover most of it. She knows she won. You know she knows.',
        'Still — she carried the boxes, she seated the RAM, she wrote down the model numbers. She learned the part that mattered even if the lesson about money went sideways. It boots on the first try. She names the machine after a cat you don\'t remember owning.',
      ],
      effects: [{ quest: 'side_kims_login', objective: 'built' }],
    },
  },
}

// ── side_kim_logs — beat 3 (Act IIb, Dialog) ─────────────────────────────────

const kimLogsQuest: QuestDef = {
  id: 'side_kim_logs',
  title: 'What Kim Found',
  kind: 'side',
  act: 2,
  giver: 'kim',
  priority: 6,
  autoStart: { all: [{ npc: 'kim', met: true }, { var: 'act', gte: 2 }, { day: true, gte: 760 }] },
  rewards: 'What Kim learns about hiding things',
  summary:
    "Kim got on your machine while you were out and read the ICQ logs you thought you'd been careful about. Now she knows more than she should, and she's watching to see how you handle it. Whatever you do next, she's taking notes.",
  start: 'caught',
  stages: {
    caught: {
      text: 'Kim knows. She read the logs. The question isn\'t how to make her forget — it\'s what she learns from watching you deal with it. Teach her the careful way, or teach her the wrong lesson.',
      onEnter: [{ scene: 'side_kim_logs_scene' }],
      objectives: [
        {
          id: 'handled',
          text: 'Handle what Kim found',
          when: { never: true },
          hint: 'She copies whatever you actually do, not what you tell her to do. An [Opsec] play models the careful way; blustering models the other one.',
        },
      ],
    },
  },
}

const kimLogsScene: SceneDef = {
  id: 'side_kim_logs_scene',
  channel: 'dialog',
  title: 'What Kim Found',
  from: 'kim',
  start: 'intro',
  nodes: {
    intro: {
      speaker: 'kim',
      text: [
        'She\'s sitting on your bed when you get home, which she is not allowed to do, holding a printout, which is worse. "I wasn\'t snooping," she says, which means she was snooping. "Your machine was on. And your logs don\'t even have a password on them, which, for a supposed genius—"',
        { if: { var: 'kim_trajectory', lte: -1 }, text: 'She taps the printout. "The guy behind the arcade taught me more than you think. Mostly that you\'re not as careful as you act."' },
        { if: { flag: 'side.kim.guilt_trip' }, text: 'She has the look she had at Sunday dinner the year she guilt-tripped you into paying for her whole computer: a negotiator who has already won once and would like to win again.' },
        { if: { flag: 'side.kim.steve_reset' }, text: '"You wiped Steve once," she adds, apropos of nothing. "Ninety-one days. So I figured I should check how careful you are with the stuff that isn\'t a dinosaur."' },
        { if: { flag: 'side.kim.smoke_machine' }, text: 'She read them on Smokey, the machine you built her out of your spares bin, which still smells faintly of the evening it nearly caught fire. "Your junk," she says, "has a better memory than you do."' },
        {
          if: momHere,
          text: '"—I know who nyx is. I know what \'the back room\' is. I know you tell Jax you\'re fine when you\'re very obviously not." She folds the printout in half. "I\'m not going to tell Mom. I want to know what you\'re going to do about the fact that I can read all of this."',
          else: '"—I know who nyx is. I know what \'the back room\' is. I know you tell Jax you\'re fine when you\'re very obviously not." She folds the printout in half. "Dad can\'t lose anybody else. So I\'m not telling him. I want to know what you\'re going to do about the fact that I can read all of this."',
        },
      ],
      next: 'choice',
    },
    choice: {
      speaker: 'player',
      text: 'She\'s sixteen and she just out-scouted you in your own room. Whatever you say now, she\'s going to become.',
      choices: [
        {
          text: 'Sit down with her and lock it all down properly, together. Model the careful way.',
          tag: '[Opsec]',
          check: {
            skill: 'opsec',
            dc: 14,
            success: 'taught',
            fail: 'taught_fail',
            successEffects: [{ var: 'kim_trajectory', add: 2 }, { npc: 'kim', affinity: 10 }],
            failEffects: [
              { var: 'kim_trajectory', add: -2 },
              { npc: 'kim', affinity: 4 },
              { flag: 'side.kim.copied_habits' },
              { scene: 'side_kim_logs_fallout', delayHours: 24 * 21 },
            ],
          },
        },
        {
          text: '"Impressive. Here\'s how I\'d have caught you." Show off. Make it a game.',
          tag: '[Show off]',
          effects: [{ var: 'kim_trajectory', add: -2 }, { npc: 'kim', affinity: 6 }, { stat: 'mood', add: 4 }],
          goto: 'showoff',
        },
        {
          text: 'Scare her off it. "This isn\'t a game. Stay out of my stuff and out of this."',
          tag: '[Warn]',
          effects: [{ var: 'kim_trajectory', add: 1 }, { npc: 'kim', affinity: -4 }],
          goto: 'warned',
        },
        {
          text: 'Tell her the true cost — the raid, the friends, the phone you flinch at. No lecture. Just the bill.',
          tag: '[Social DC 15]',
          req: { flag: 'a2.first_raid_resolved' },
          reqText: 'Requires: something that actually cost you (the first raid)',
          check: {
            skill: 'social',
            dc: 15,
            bonuses: [{ if: { trait: 'empath' }, add: 2, label: '+2 (empath)' }],
            success: 'bill',
            fail: 'bill_fail',
            successEffects: [{ var: 'kim_trajectory', add: 2 }, { npc: 'kim', affinity: 8 }],
            failEffects: [
              { npc: 'kim', affinity: 2 },
              { var: 'kim_trajectory', add: -1 },
              { flag: 'side.kim.raid_legend' },
              { scene: 'side_kim_raid_legend', delayHours: 24 * 14 },
            ],
          },
        },
        {
          text: 'Buy her silence and change nothing. A burned CD and a "we never talk about this."',
          tag: '[Bribe]',
          effects: [{ var: 'kim_trajectory', add: -1 }, { npc: 'kim', affinity: 2 }],
          goto: 'bribe',
        },
      ],
    },
    taught: {
      speaker: 'narrator',
      text: [
        'You don\'t lecture. You sit down next to her and say, "Okay. You\'re right, that was sloppy. Watch." And you show her how you should have done it — the boring parts, the discipline parts, the parts that aren\'t cool. You show her that the careful way is the respectful way, that hiding something well is mostly just caring about it.',
        'She takes notes. Actual notes. At the end she says, "So the real skill isn\'t the breaking-in. It\'s the not-getting-caught, and the not-getting-caught is just... being careful about people." You nod. "Then why are you so bad at it," she says, and you realize you\'ve taught her the one thing that might keep her safe.',
      ],
      effects: [{ quest: 'side_kim_logs', objective: 'handled' }],
    },
    taught_fail: {
      speaker: 'narrator',
      text: [
        'You try to walk her through the careful way, but you\'re tired and rattled and you get half of it wrong, and she catches you getting it wrong, and now the lesson is "even the expert fumbles it." Not the worst thing she could learn. Not the best.',
        'She helps you fix your own setup, which is either sweet or humiliating depending on the hour. "You should\'ve paid for the good lock," she says, meaning it about six different things.',
        'What you don\'t see is her taking notes on the half you got wrong. She copies your setup exactly, mistakes and all, onto every machine she touches. That\'s the thing about teaching by example: the example is the lesson, not the speech.',
      ],
      effects: [{ quest: 'side_kim_logs', objective: 'handled' }],
    },
    bill: {
      speaker: 'narrator',
      text: [
        'You don\'t make it a warning. You make it an invoice. The night the men in jackets came through the Row. What it did to the people standing closest to you. The lawyers\' numbers you still know by heart. How every ringing phone for a year sounded like the end of something.',
        'Kim listens without interrupting, which she has never once done in her life. When you\'re finished she unfolds the printout, looks at it, and tears it very carefully in half, and then in half again. "Okay," she says. "I\'m not scared. I\'m just... doing the math." She leaves your room without being told. It\'s the most grown-up thing you\'ve ever seen her do.',
      ],
      effects: [{ quest: 'side_kim_logs', objective: 'handled' }],
    },
    bill_fail: {
      speaker: 'narrator',
      text: [
        'You try to tell her what it cost and it comes out wrong — too cool, too war-story, the raid somehow sounding like an adventure in your own mouth. You watch her eyes light up at exactly the parts you meant to be frightening.',
        '"So you got away with it," she says, impressed. You didn\'t, not really, but you can\'t find the words for the part you didn\'t, and she takes the printout with her when she goes.',
        'Two days later you hear her on the phone with a friend, doing your voice. "And then the guy in the jacket goes—" She has the whole story. She has it better than you do. She is telling it like a legend.',
      ],
      effects: [{ quest: 'side_kim_logs', objective: 'handled' }],
    },
    showoff: {
      speaker: 'narrator',
      text: [
        'You can\'t help it. She\'s good, and you want her to know you\'re better, so you make it a game — here\'s how I\'d have found you, here\'s the trick, here\'s the trick behind the trick. Her eyes light up in a way that you recognize because it\'s your own.',
        'By the end she\'s not scared of any of it. She thinks it\'s the most fun thing in the world, because you just spent an hour proving that it is. "Do the thing with the logs again," she says. You know, distantly, that you should not have done the thing with the logs.',
      ],
      effects: [{ quest: 'side_kim_logs', objective: 'handled' }],
    },
    warned: {
      speaker: 'narrator',
      text: [
        'You make your voice go flat and serious, the way Dad\'s does, and you tell her this isn\'t a game and people go to jail and you need her to stay out of it. She rolls her eyes so hard you hear it. But she also goes quiet, and she puts the printout down, and she doesn\'t bring it up again.',
        'You can\'t tell if you scared her off it or just taught her to hide it from you, which is a fear that will keep you up more than one night. But she keeps her distance from the machine after that, and some nights that feels like enough.',
      ],
      effects: [{ quest: 'side_kim_logs', objective: 'handled' }],
    },
    bribe: {
      speaker: 'narrator',
      text: [
        'You burn her a CD of the good games and you both agree, without saying it, that the conversation is over. It\'s the easy way. It costs you a disc and a small piece of the thing where your little sister thinks you have your life together.',
        '"We never had this talk," she says, pocketing the CD. "Obviously," you say. She learned something in this room today, and it wasn\'t about opsec. It was about how a problem can be made to go away if you pay it and don\'t look at it. You taught her that one by accident.',
      ],
      effects: [{ quest: 'side_kim_logs', objective: 'handled' }],
    },
  },
}

// ── side_kim_essay — beat 4 (Act III, Dialog) ────────────────────────────────

const kimEssayQuest: QuestDef = {
  id: 'side_kim_essay',
  title: "Kim's Essay",
  kind: 'side',
  act: 3,
  giver: 'kim',
  priority: 6,
  autoStart: { all: [{ npc: 'kim', met: true }, { var: 'act', gte: 3 }] },
  rewards: 'The road Kim takes',
  summary:
    "Kim is seventeen and applying to college, and she wants your help with the essay — or she wants your help with something else entirely, depending on how the last few years went. This is the beat where her road forks, and you're standing at the fork with her.",
  start: 'ask',
  stages: {
    ask: {
      text: 'Kim came to you, which she never does, and she has two folders. One is a college application. The other one she hasn\'t shown you yet. Which one you lean into is the last real push you get.',
      onEnter: [{ scene: 'side_kim_essay_scene' }],
      objectives: [
        {
          id: 'chose',
          text: 'Help Kim with what she brought you',
          when: { never: true },
          hint: 'The essay is the honest road; the other folder is the road you took. What you spend the evening on is what she remembers you choosing for her.',
        },
      ],
    },
  },
}

const kimEssayScene: SceneDef = {
  id: 'side_kim_essay_scene',
  channel: 'dialog',
  title: "Kim's Essay",
  from: 'kim',
  start: 'intro',
  nodes: {
    intro: {
      speaker: 'kim',
      text: [
        {
          if: { var: 'kim_trajectory', gte: 2 },
          text: 'Kim has the college application open and a legal pad covered in crossed-out sentences. "The prompt is \'describe a challenge you overcame,\' which is a stupid prompt, but the scholarship is real money, so." She looks at you. "You\'re the only person in this family who writes emails that don\'t sound like a ransom note. Help me not sound like a ransom note."',
          else: 'Kim has two folders. She slides the college application aside almost apologetically and opens the other one. There\'s a login screen on her laptop that isn\'t hers, and a grade she\'d like changed, and a defiant set to her jaw that you know from the mirror. "Before you say anything. You do this. You do this all the time. I just want to know if I did it right."',
        },
        { if: { flag: 'a3.kim_leveraged' }, text: 'She doesn\'t say anything about the men who followed her home from school that month, or about what you did to make them stop. She doesn\'t have to. It\'s in how she keeps her back to the wall now, like somebody else you know.' },
      ],
      next: 'choice',
    },
    choice: {
      speaker: 'player',
      text: 'Two folders on the table. She\'s watching which one you pick up.',
      choices: [
        {
          text: 'Pick up the essay. Spend the night making her sound like herself, only braver.',
          tag: '[The honest road]',
          effects: [
            { var: 'kim_trajectory', add: 2 },
            { npc: 'kim', affinity: 10 },
            { faction: 'fac.hood', add: 3 },
          ],
          goto: 'essay',
        },
        {
          text: 'Look at the other folder. "Show me what you did." Teach her to do it cleaner.',
          tag: '[Your road]',
          effects: [
            { var: 'kim_trajectory', add: -3 },
            { npc: 'kim', affinity: 8 },
            { stat: 'cred', add: 2 },
          ],
          goto: 'hack',
        },
        {
          text: 'Refuse the second folder, hard, and only help with the essay. Draw the line you never had.',
          tag: '[Social]',
          if: { var: 'kim_trajectory', lte: 1 },
          check: {
            skill: 'social',
            dc: 16,
            success: 'line_held',
            fail: 'line_failed',
            successEffects: [{ var: 'kim_trajectory', add: 3 }, { npc: 'kim', affinity: 6 }],
            failEffects: [
              { var: 'kim_trajectory', add: -1 },
              { npc: 'kim', affinity: -6 },
              { flag: 'side.kim.both_folders' },
              { stat: 'stress', add: 4 },
              { scene: 'side_kim_essay_after', delayHours: 24 * 30 },
            ],
          },
        },
      ],
    },
    essay: {
      speaker: 'narrator',
      text: [
        'You don\'t write it for her. You do the harder thing, which is ask questions until she writes the true one herself — about the year the mill closed, about a house that got very quiet, about a brother she won\'t name but describes with unbearable accuracy as "someone I love who I don\'t want to become."',
        'She reads the final draft out loud and her voice cracks on the last line and she\'s furious about it. "This is going to work," she says, wiping her eyes on her sleeve. "This is going to work and I\'m going to leave and it\'s your fault." From Kim, it is the nicest thing anyone has ever said to you.',
      ],
      effects: [{ quest: 'side_kim_essay', objective: 'chose' }],
    },
    hack: {
      speaker: 'narrator',
      text: [
        'You open the other folder. She did it well. She did it, honestly, better than you did at her age — cleaner, quieter, with a patience you had to learn the hard way. You could tell her to stop. You could tell her about the raid, the lawyers, the friends you can\'t call anymore. Instead you point at the one sloppy thing and say, "Here. This is how they\'d have caught you."',
        'She fixes it in seconds. She glows. You just became her mentor in the one thing you swore you\'d keep her out of, and you both know it, and the college application slides quietly off the table and nobody picks it up.',
      ],
      effects: [{ quest: 'side_kim_essay', objective: 'chose' }],
    },
    line_held: {
      speaker: 'narrator',
      text: [
        'You close the second folder and you don\'t open it again. You tell her the truth — not the lecture, the truth. The names of the people it cost you. The thing you flinch at when the phone rings. "I\'m not better than you," you say. "I just started sooner, and I\'d give a lot to have had someone close this folder for me."',
        'She\'s quiet a long time. Then she pushes the second folder into your hands to take away, and pulls the essay back, and says, "Okay. But you\'re helping with the essay, and it better be good, because I just gave up my whole personality." You help with the essay. It\'s good.',
      ],
      effects: [{ quest: 'side_kim_essay', objective: 'chose' }],
    },
    line_failed: {
      speaker: 'narrator',
      text: [
        'You try to hold the line and it comes out as a lecture, and a lecture is the one thing that has never worked on Kim in the history of Kim. "You," she says, standing up, folders under her arm, "do not get to tell me it\'s dangerous while you do it for a living. Pick a lane." She takes both folders with her.',
        'You don\'t know which one she opens later, in her own room, with the door shut. That not-knowing is the exact shape of the thing you were trying to spare her.',
      ],
      effects: [{ quest: 'side_kim_essay', objective: 'chose' }],
    },
  },
}

// ── Fail-branch fallout scenes (the bad roll comes home) ─────────────────────

/** After the Opsec teach fumbled: Kim copied your setup — mistakes and all. */
const kimLogsFalloutScene: SceneDef = {
  id: 'side_kim_logs_fallout',
  channel: 'chat',
  title: 'kim',
  from: 'kim',
  pause: false,
  start: 'ping',
  nodes: {
    ping: {
      speaker: 'kim',
      text: [
        'so i set mine up the way u showed me',
        'exactly the way. down to the thing where the second folder isnt actually hidden its just NAMED boring',
        'i thought that was genius until pilar found my whole diary in like four minutes because thats not hiding thats just optimism',
        'u taught me a broken lock and told me it was a lock',
      ],
      choices: [
        {
          text: '"Then let me teach you the real way. Tonight. Properly this time."',
          effects: [{ var: 'kim_trajectory', add: 1 }, { npc: 'kim', affinity: 4 }],
          goto: 'fix',
        },
        {
          text: '"...yeah. I was rattled that night. That\'s on me."',
          effects: [{ npc: 'kim', affinity: 2 }, { stat: 'mood', add: -3 }],
          goto: 'own_it',
        },
      ],
    },
    fix: {
      speaker: 'kim',
      text: ['ok', 'but ur showing me the boring version. the discipline version. the one u actually use', 'not the cool version. i already know the cool version doesnt work, i live it now'],
    },
    own_it: {
      speaker: 'kim',
      text: ['its ok', 'i mean its not. pilar read my DIARY', 'but i learned the real lesson which is: dont copy someone who was tired. copy someone who was careful', 'ur working on being the second one right'],
    },
  },
}

/** After the raid-cost story came out as a war story: Kim's telling it as a legend now. */
const kimRaidLegendScene: SceneDef = {
  id: 'side_kim_raid_legend',
  channel: 'chat',
  title: 'kim',
  from: 'kim',
  pause: false,
  start: 'ping',
  nodes: {
    ping: {
      speaker: 'kim',
      text: [
        'ok dont be weird about this',
        'i might have told the raid story at lunch. the jackets, the guy who stepped on ur foot and apologized. the whole thing',
        'everyone thought it was the coolest thing theyd ever heard and now pilar calls u "the legend"',
        'i tried to make it scary like u said but it kept coming out awesome. i think thats a u problem not a me problem',
      ],
      choices: [
        {
          text: '"Kim. It wasn\'t awesome. Let me tell you the part I skipped."',
          tag: '[Social DC 13]',
          check: {
            skill: 'social',
            dc: 13,
            success: 'told_true',
            fail: 'legend_holds',
            successEffects: [{ var: 'kim_trajectory', add: 2 }, { npc: 'kim', affinity: 5 }],
            failEffects: [{ npc: 'kim', affinity: 1 }, { var: 'kim_trajectory', add: -1 }, { stat: 'stress', add: 3 }, { chance: 0.3, then: [{ complication: 'social' }] }],
          },
        },
        {
          text: '"...The legend. Great." Let it ride. You\'re too tired to fight the myth.',
          effects: [{ var: 'kim_trajectory', add: -1 }, { npc: 'kim', affinity: 2 }],
          goto: 'rides',
        },
      ],
    },
    told_true: {
      speaker: 'kim',
      text: ['oh', 'u didnt tell me that part. the part about after. about who stopped calling', 'ok. yeah. thats not a lunch story', 'i wont tell it again. i mean it this time'],
    },
    legend_holds: {
      speaker: 'kim',
      text: ['ok ok i hear u', 'but like. the foot thing is still funny', 'ill tell it less. ish', 'also pilar\'s brother wants to meet u. he has a "project." i said id ask. im asking. dont be mad'],
    },
    rides: {
      speaker: 'kim',
      text: ['knew u\'d get it', 'ur a legend. own it', '...ill get u a cape'],
    },
  },
}

/** After the essay line failed and she took both folders: which one she opened, you don't get to know. */
const kimEssayAfterScene: SceneDef = {
  id: 'side_kim_essay_after',
  channel: 'chat',
  title: 'kim',
  from: 'kim',
  pause: false,
  start: 'ping',
  nodes: {
    ping: {
      speaker: 'kim',
      text: [
        'the essay\'s done. i finished it myself. its good actually',
        'the other folder is also done. i\'m not telling u which i did first and u dont get to ask, thats the deal now',
        'u wanted to draw a line while standing on the wrong side of it. i noticed. everyone always notices',
        'anyway. i submitted the application. AND i cleaned up the other thing so its unfindable. both. thats who i am now, u helped make sure',
      ],
      choices: [
        {
          text: '"I know I did. I\'m sorry. The door\'s open whenever you want the real conversation."',
          effects: [{ npc: 'kim', affinity: 3 }, { stat: 'mood', add: -4 }],
          goto: 'maybe',
        },
        {
          text: '"Just — be better at it than I was. That\'s all I\'ve got."',
          effects: [{ var: 'kim_trajectory', add: -1 }, { npc: 'kim', affinity: 2 }],
          goto: 'better',
        },
      ],
    },
    maybe: {
      speaker: 'kim',
      text: ['maybe', 'the application\'s real tho. i do want out. i just also want to be good at the thing u are', 'those arent opposites in my head anymore. i dont know if thats ur fault or mine'],
    },
    better: {
      speaker: 'kim',
      text: ['thats the most honest thing u\'ve said to me in a year', 'ok', 'i\'ll be better than u. low bar *hugz*'],
    },
  },
}

export default defineContent({
  quests: [kimsLoginQuest, kimLogsQuest, kimEssayQuest],
  scenes: [kimsLoginScene, kimLogsScene, kimEssayScene, kimLogsFalloutScene, kimRaidLegendScene, kimEssayAfterScene],
})
