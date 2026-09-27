/**
 * PKG-01 — main_a1_q3_back_room (bible §6.A).
 *
 * Jax drags you to the back room on Sodium Row. You meet the scene in the flesh: Corvid (the
 * ethic), Deadline (the cautionary tale), byteme (the kid), Switch (the pragmatist), and hear the
 * one rule that holds it all together — we don't rat. A small first-impression choice sets your
 * early lean between Corvid's commons and Switch's ledger.
 *
 * Chain: started by q2. q4 auto-starts on its own dated trigger; q3 does not start it.
 */
import { defineContent } from '@/engine/registry'
import type { QuestDef, SceneDef } from '@/engine/types'
import { Q3 } from './common'

const backRoom: SceneDef = {
  id: 'a1_back_room',
  channel: 'dialog',
  title: 'The Back Room',
  from: 'corvid',
  start: 'arrive',
  nodes: {
    arrive: {
      speaker: 'narrator',
      effects: [
        { npc: 'corvid', met: true },
        { npc: 'deadline', met: true },
        { npc: 'byteme', met: true },
        { npc: 'switch', met: true },
      ],
      text: [
        "Behind the Cathode Diner, past the walk-in freezer, there's a door Sal pretends not to know about. Jax knocks the way you knock when a knock is a password. It opens.",
        "Inside: mismatched chairs, a wall of humming towers, an ashtray older than you, and the specific warm smell of too many computers in one small room. Four people look up. This is the scene. The actual, physical scene.",
      ],
      next: 'corvid_intro',
    },
    corvid_intro: {
      speaker: 'corvid',
      text: [
        "So you're the honest newbie from the board. Jax won't shut up about you. I'm Corvid. I keep the lights on and the door shut.",
        'That in the worst chair is Deadline. The kid vibrating in the corner is byteme. The man with the duffel bag and the calculator watch is Switch. There’s one more of us you’ve met but not met — nyx — and she doesn’t come to rooms. Sit. Don’t touch anything with a blinking light.',
      ],
      next: 'byteme_hi',
    },
    byteme_hi: {
      speaker: 'byteme',
      text: [
        "youre the one who cracked corvids starter gig right?? or youre gonna?? thats so cool i tried it and i bricked my whole machine twice",
        'is it true you know jax since like BIRTH. does he really have a boat in that game. can you teach me the thing',
      ],
      next: 'deadline_warn',
    },
    deadline_warn: {
      speaker: 'deadline',
      text: [
        "Let the kid breathe, byteme. New blood.",
        "Listen to an old man for one minute, then ignore him like everyone does. Ninety-four, they came through that door — not this one, the old room, but the same kind of door. Took my rig. My books. My dog's vet records, if you can believe it. Fourteen months.",
        "Back up your life, kid. Not your data. Your life.",
      ],
      next: 'corvid_ethic',
    },
    corvid_ethic: {
      speaker: 'corvid',
      text: [
        "And here's why Deadline's still one of us instead of a name in a file somewhere. The night they took him, forty of us wiped our drives before dawn. Nobody was asked. Nobody said a word to anyone with a badge. Not one.",
        "That's the whole religion, right there. We share everything and we sell out nobody. The tools are a commons. The people are family. We. Don't. Rat.",
      ],
      next: 'switch_counter',
    },
    switch_counter: {
      speaker: 'switch',
      text: [
        "Beautiful speech. I love it every time. Here's the part Corvid leaves out: a commons doesn't pay rent. Deadline's on disability. byteme's got a paper route. Half this room is one bad month from selling their machine.",
        "There's real money coming for what we do — corporate money, the boring kind with a suit on. I say we get the scene PAID before somebody buys it out from under us for free. That's not selling out. That's not starving.",
      ],
      next: 'jax_aside',
    },
    jax_aside: {
      speaker: 'jax',
      text: [
        "...and THIS is the argument they've been having since before we were born. Every single week. It's like a soap opera but with more soldering.",
        "they're both kind of right, which is the worst part. anyway — they're all looking at you now. new blood always gets asked. where do you land?",
      ],
      next: 'choice',
    },
    choice: {
      speaker: 'narrator',
      text: ['Corvid on one side, Switch on the other, the whole warm humming room waiting to hear what kind of person just walked in.'],
      choices: [
        {
          text: '"A commons. If it stops being that, it stops being worth protecting."',
          effects: [{ flag: 'a1.back_room_done' }, { faction: 'fac.loft', add: 5 }, { npc: 'corvid', affinity: 5 }],
          goto: 'sided_corvid',
        },
        {
          text: '"Switch is right. People need to eat. Idealism is a luxury."',
          effects: [{ flag: 'a1.back_room_done' }, { npc: 'switch', affinity: 8 }, { flag: 'npc.switch.courted' }],
          goto: 'sided_switch',
        },
        {
          text: "\"I just got here. Ask me in a year.\"",
          tag: '[Neutral]',
          effects: [{ flag: 'a1.back_room_done' }, { flag: 'a1.diplomat' }],
          goto: 'neutral',
        },
        {
          text: '[Latchkey] "Whatever it is, the one rule I already live by is: we don’t rat."',
          if: { background: 'latchkey' },
          effects: [{ flag: 'a1.back_room_done' }, { faction: 'fac.loft', add: 4 }, { npc: 'corvid', affinity: 4 }, { npc: 'deadline', affinity: 3 }],
          goto: 'latchkey',
        },
      ],
    },
    sided_corvid: {
      speaker: 'corvid',
      text: [
        "Good answer. Wrong, maybe, but good. Switch will work on you.",
        "You're welcome here as long as that's true. The day it stops being true, you'll be the first to know, because I'll stop saving you a chair.",
      ],
      next: 'close',
    },
    sided_switch: {
      speaker: 'switch',
      text: [
        "FINALLY. Someone under thirty with a functioning wallet-brain. Corvid, I like this one.",
        "Stick with me, new blood. I'll show you where the actual money is. It's less romantic than Corvid's version and it buys a lot more RAM.",
      ],
      next: 'close',
    },
    neutral: {
      speaker: 'deadline',
      text: [
        "Ha. Smart. Don't pick a side in a war you don't understand yet. You'll get pulled one way or the other soon enough — everybody does — but leaving your feet under you a while longer is the first wise thing I've seen a newbie do in years.",
      ],
      next: 'close',
    },
    latchkey: {
      speaker: 'corvid',
      text: [
        "...Huh. Somebody raised themselves. I know the shape of it.",
        "You already have the only rule that matters, then. The rest is just decorating. Welcome, blood. Sit anywhere but the worst chair — that one’s spoken for.",
      ],
      next: 'close',
    },
    close: {
      speaker: 'narrator',
      text: [
        "The argument folds back into itself, the way it always does, and the room goes on humming. Somebody starts a card game. byteme pesters you with questions. Deadline falls asleep upright.",
        "It isn't much — a back room, a handful of oddballs, one line of static holding them together. But walking out into the neon later, you understand you've joined something. What it is, exactly, you'll spend the next ten years finding out.",
      ],
    },
  },
}

const quest: QuestDef = {
  id: Q3,
  title: 'The Back Room',
  kind: 'main',
  act: 1,
  priority: 98,
  giver: 'jax',
  rewards: 'A place at the table — and an ethic to keep or break',
  summary:
    "Jax wants you to meet the scene where it actually lives: a back room on Sodium Row. Show up, meet the people, and hear the one rule that holds them together.",
  start: 'meet',
  stages: {
    meet: {
      text: 'The back room is behind the Cathode, past the freezer, behind a door Sal pretends not to know about. Go meet the Loft in the flesh.',
      onEnter: [{ scene: 'a1_back_room' }],
      objectives: [
        {
          id: 'attend',
          text: 'Go to the meet on Sodium Row, after dark',
          when: { seen: 'a1_back_room' },
          hint: 'The story dialog opens itself — read it through.',
        },
        {
          id: 'impression',
          text: 'Make your first impression',
          when: { flag: 'a1.back_room_done' },
          hint: 'Corvid argues for a commons; Switch argues for getting paid. Pick a lean, or stay neutral — there’s no wrong answer this early.',
        },
      ],
      onComplete: [
        { if: { npc: 'jax', affinityGte: 20 }, then: [{ flag: 'a1.bond_jax' }] },
        { log: 'You have a place at the table now. Small table. Loud table. Yours.', kind: 'story' },
      ],
    },
  },
}

export default defineContent({
  scenes: [backRoom],
  quests: [quest],
})
