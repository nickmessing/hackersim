/**
 * PKG-11 — `side_slideshow` (bible §8 Family, Schedule mechanic; E4 payoff).
 *
 * A warm, timed "be there" quest: spend four Sunday evenings home with family digitizing the old
 * photo boxes before the moment passes. The Schedule *is* the mechanic — you have to actually give
 * family the time, tracked through the engine's `aff.last.<npc>` contact stamp.
 *
 * There is no weekday condition in the engine and no arithmetic in conditions, so the qualifying
 * Sundays (day 0 = Sat 1 Sep 2001 → Sundays are day % 7 === 1) are precomputed here and a small
 * helper trigger banks one "Sunday in" each week you were home with family during the window.
 *
 * Sets: `side.slideshow_done` (E4 warm slide) / `side.slideshow_lost` (the moment passed);
 * `side.slideshow_count` (var, internal progress). Guarded on `w.mom_gone` per §9.
 */
import { defineContent } from '@/engine/registry'
import type { QuestDef, SceneDef, TriggerDef } from '@/engine/types'
import { contactOn, momHere, sundays } from './_shared'

const FAMILY = ['mom', 'dad', 'kim'] as const
/** Every Sunday from the quest's earliest start to the end of the game (the stage is 60 days long). */
const SLIDESHOW_SUNDAYS = sundays(500, 3700)

/** One qualifying Sunday: it's that day, and you banked family social time that day. */
const homeThisSunday = contactOn(FAMILY, SLIDESHOW_SUNDAYS)

const sundayTrigger: TriggerDef = {
  id: 'side_slideshow_sunday',
  once: false,
  cooldownDays: 6,
  atHour: 22,
  when: {
    all: [
      { quest: 'side_slideshow', status: 'active' },
      { quest: 'side_slideshow', stage: 'sundays' },
      momHere,
      homeThisSunday,
    ],
  },
  effects: [
    { var: 'side.slideshow_count', add: 1 },
    {
      random: [
        { weight: 1, effects: [{ notify: 'Another Sunday over the photo boxes. Mom found one of you asleep face-down in a birthday cake, age two. It is now the family screensaver.', kind: 'good' }] },
        { weight: 1, effects: [{ notify: 'Sunday scanning: Dad narrated forty photos of a fishing trip where nobody caught anything. Kim timed him. Eleven minutes on one perch.', kind: 'good' }] },
        { weight: 1, effects: [{ notify: 'Sunday scanning: a whole roll of Mom and Dad before you were born, laughing at something off-camera. Nobody remembers what. Everybody guesses.', kind: 'good' }] },
        { weight: 1, effects: [{ notify: 'Sunday scanning: the scanner jammed on a Polaroid of the Cathode\'s grand reopening. Sal is in it, with hair. You make a copy for the diner.', kind: 'good' }] },
      ],
    },
    { stat: 'mood', add: 4 },
    { npc: 'mom', affinity: 3 },
  ],
}

const quest: QuestDef = {
  id: 'side_slideshow',
  title: 'The Slideshow',
  kind: 'side',
  giver: 'mom',
  act: 2,
  priority: 6,
  autoStart: { all: [{ day: true, gte: 500 }, momHere, { npc: 'mom', met: true }] },
  rewards: 'The photos, saved · a memory you keep',
  summary:
    "Mom found the water-stained boxes of family photos in the basement and wants them scanned before they fade any further. It takes being home, four Sunday evenings running, with a flatbed scanner and the whole family narrating. The catch is the only real one there is: you have to actually show up, and the boxes won't wait forever.",
  start: 'kickoff',
  stages: {
    kickoff: {
      text: 'Mom wants the old photo boxes digitized before they fade. It only works if you\'re actually home for it — four Sunday evenings, family included. Say yes.',
      onEnter: [{ scene: 'side_slideshow_scene' }],
      objectives: [
        {
          id: 'agreed',
          text: 'Agree to the Sunday project',
          when: { seen: 'side_slideshow_scene' },
          hint: 'Open Mom\'s message and say yes. Then keep your Sunday evenings for family.',
        },
      ],
      next: 'sundays',
    },
    sundays: {
      text: 'Be home with family four Sunday evenings while the boxes are still on the table. Spend the Sunday social block with Mom, Dad, or Kim — the scanner does the rest.',
      timeLimitDays: 60,
      objectives: [
        {
          id: 'four',
          text: 'Spend four Sunday evenings digitizing the boxes',
          when: { var: 'side.slideshow_count', gte: 4 },
          progress: { of: { var: 'side.slideshow_count' }, target: 4 },
          hint: 'Keep a Social block in your Daily Planner and pick Mom, Dad or Kim as the social focus (People window). Each week you spend time with family counts as one Sunday. The moment passes after two months — the boxes are fading.',
        },
      ],
      onComplete: [
        { flag: 'side.slideshow_done' },
        { faction: 'fac.hood', add: 6 },
        { npc: 'mom', affinity: 12 },
        { stat: 'mood', add: 10 },
        { scene: 'side_slideshow_done_scene' },
      ],
      onTimeout: { effects: [{ flag: 'side.slideshow_lost' }, { scene: 'side_slideshow_lost_scene' }, { npc: 'mom', affinity: -4 }] },
    },
  },
}

const introScene: SceneDef = {
  id: 'side_slideshow_scene',
  channel: 'chat',
  title: 'the photo boxes',
  from: 'mom',
  pause: false,
  start: 'ping',
  nodes: {
    ping: {
      speaker: 'mom',
      text: [
        'your father found the photo boxes in the basement',
        'the ones from before you were born. and the ones from after. the flood in 98 got at the bottom ones, they are FADING, i can see it happening',
        'i borrowed the flatbed scanner from the church. i need your hands and your eyes and your sundays. four of them. can i have four sundays',
      ],
      choices: [
        {
          text: "Four Sundays. I'll be there. Save me the corner with the dog pictures.",
          tag: '[Yes]',
          effects: [{ npc: 'mom', affinity: 4 }],
          goto: 'yes',
        },
        {
          text: "I'll try, Ma. Things are busy. But I'll try.",
          effects: [{ npc: 'mom', affinity: 2 }],
          goto: 'try',
        },
      ],
    },
    yes: {
      speaker: 'mom',
      text: ['good. GOOD. sunday. i am making the pork thing. do not be late, the scanner is very slow and so is your father'],
    },
    try: {
      speaker: 'mom',
      text: ['trying is not sundays. but okay. i will set a place anyway. i always set a place anyway'],
    },
  },
}

const doneScene: SceneDef = {
  id: 'side_slideshow_done_scene',
  channel: 'dialog',
  title: 'The Slideshow',
  from: 'mom',
  start: 'done',
  nodes: {
    done: {
      speaker: 'narrator',
      text: [
        'Four Sundays. The pork thing four times. The scanner whining through a thousand photographs while your father provided narration nobody asked for and Kim invented a drinking game for pictures of you crying at your own birthdays.',
        'On the last night Mom puts the finished slideshow up on the TV — every rescued photo, in order, from a wedding in a country you\'ve never seen to a fourteen-year-old Kim flipping off a Christmas tree. Nobody says much. Dad holds Mom\'s hand on the couch. You realize you will have this after everything else is gone: the boxes saved, the Sundays spent, the whole family in one warm room, on purpose, because you showed up.',
      ],
    },
  },
}

const lostScene: SceneDef = {
  id: 'side_slideshow_lost_scene',
  channel: 'mail',
  title: 'the boxes',
  from: 'mom',
  pause: false,
  start: 'lost',
  nodes: {
    lost: {
      speaker: 'mom',
      text: [
        'I gave the scanner back to the church. It\'s alright. You were busy — I know you were busy, I\'m not saying it like that.',
        'I did what I could of the bottom boxes myself but my hands aren\'t good with the little buttons and some of them were too far gone. The one of your grandmother at the shore just came out as light. I don\'t want you to feel bad. I just wanted us all at the table for it, is all. There\'ll be other things.',
        '— Mom',
      ],
    },
  },
}

export default defineContent({
  quests: [quest],
  scenes: [introScene, doneScene, lostScene],
  triggers: [sundayTrigger],
})
