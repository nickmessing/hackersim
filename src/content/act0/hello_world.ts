/**
 * ACT 0 — "Hello, World": the guided introduction (gradual discovery).
 *
 * A new game starts paused on an empty desktop. Programs appear one at a time, the first time they
 * matter (see src/engine/unlocks.ts):
 *   1. NorthLink's welcome mail arrives            → Mail appears (automatic on the first mail).
 *   2. Mom sits you down about having a routine    → the Daily Planner appears.
 *   3. You paint your hours and press play          → your first week goes by.
 *   4. Act 0 ends (`act0.done`), Act I's Boot Sequence starts: Jax pages you (BuddyPager appears),
 *      the board thread shows up (the Forum appears), the main story starts (the Journal appears)…
 * Later reveals: Jobs + Ops with the first-money quest, the e-Shop with the first-upgrade quest,
 * Life when money starts to matter (below), Skills on the first level-up, People once you know a
 * few people, News with the first headline, the Terminal the first time something launches it.
 */
import { defineContent } from '@/engine/registry'
import type { QuestDef, SceneDef, TriggerDef } from '@/engine/types'

const momRoutine: SceneDef = {
  id: 'act0_mom_routine',
  channel: 'dialog',
  title: 'The Kitchen Table',
  start: 'open',
  nodes: {
    open: {
      speaker: 'narrator',
      text: [
        'Mom is waiting at the kitchen table with two mugs of tea and the expression she uses for report cards.',
        'The modem is still warm. The phone line has been busy since six.',
      ],
      next: 'talk',
    },
    talk: {
      speaker: 'mom',
      text: [
        '"Sit. I am not angry. I am organized." She slides a sheet of paper across the table: a grid, twenty-four boxes, hand-ruled with a pencil.',
        '"If you are going to live on that computer, you are going to have a routine. Sleep, study, and something that pays eventually. Your father had a routine for twenty years. Look where it got him." A pause. "Stable. It got him stable."',
      ],
      choices: [
        {
          text: '"A schedule. Sure. I can do a schedule."',
          effects: [{ npc: 'mom', affinity: 3 }],
          goto: 'planner',
        },
        {
          text: '"Mom, it\'s the Information Age. Nobody sleeps anymore."',
          goto: 'sleep',
        },
        {
          text: 'Take the paper and nod very seriously.',
          effects: [{ npc: 'mom', affinity: 1 }],
          goto: 'planner',
        },
      ],
    },
    sleep: {
      speaker: 'mom',
      text: '"Then the Information Age can do your laundry." She taps the grid. "Eight hours of sleep. I will know."',
      next: 'planner',
    },
    planner: {
      speaker: 'narrator',
      text: [
        'Back in your room you find a program you never noticed on the desktop, a little calendar icon: the DAILY PLANNER. It is Mom\'s grid, but on a screen, and nobody can see your handwriting.',
        'Paint your hours onto the grid — sleep, study, relax, and the rest — then press ▶ in the tray (or Space) and watch your first week go by. Each cycle of the clock is one week of your life.',
      ],
      effects: [{ unlock: 'schedule' }, { flag: 'act0.routine_talk' }],
    },
  },
}

const helloWorld: QuestDef = {
  id: 'act0_hello_world',
  title: 'Act 0 — Hello, World',
  kind: 'tutorial',
  priority: 200,
  giver: 'mom',
  autoStart: { always: true },
  rewards: 'Your first week online (and the rest of the desktop, bit by bit)',
  summary:
    'September 2001. A beige PC, a 33.6k modem and an empty desktop. Nothing is here yet, and that is the point: new programs show up the first time you need them.',
  start: 'mail',
  stages: {
    mail: {
      text: 'The game is paused. A letter just landed in the brand-new Mail window. Open it and read it.',
      onEnter: [{ scene: 'a1_isp_welcome' }],
      objectives: [
        {
          id: 'read_mail',
          text: 'Read your first mail',
          when: { flag: 'act0.mail_read' },
          hint: 'Double-click the Mail icon on the desktop (or click the toast), open the NorthLink letter and answer it.',
        },
      ],
      next: 'routine',
    },
    routine: {
      text: 'Mom wants a word about how you spend your days.',
      onEnter: [{ scene: 'act0_mom_routine' }],
      objectives: [
        {
          id: 'talk',
          text: 'Talk to Mom',
          when: { flag: 'act0.routine_talk' },
          hint: 'The conversation opens on its own. Pick any answer — she will get her schedule either way.',
        },
        {
          id: 'plan',
          text: 'Paint your hours in the Daily Planner',
          when: { flag: 'sys.schedule_edited' },
          hint: 'Open the Daily Planner, pick an activity and click-drag it across the hour grid, or pick a preset. Keep 7–8 hours of Sleep.',
        },
      ],
      next: 'week',
    },
    week: {
      text: 'Your routine is set. Press play and live your first week — the clock shows a typical day, and every full cycle is one week.',
      objectives: [
        {
          id: 'first_week',
          text: 'Let your first week go by',
          when: { day: true, gte: 7 },
          progress: { of: { day: true }, target: 7 },
          hint: 'Press ▶ in the tray at the bottom right (or Space). 1–4 change the speed.',
        },
      ],
      onComplete: [
        { flag: 'act0.done' },
        { notify: 'ACT I — "The Whir of the Modem." Your desktop will keep growing as your life does.', kind: 'story' },
      ],
    },
  },
}

// ── Life appears when money starts to matter ─────────────────────────────────
const momBudget: SceneDef = {
  id: 'act0_mom_budget',
  channel: 'mail',
  title: 'Household budget (please read!!)',
  from: 'mom',
  start: 'mail',
  nodes: {
    mail: {
      speaker: 'mom',
      text: [
        'Sweetheart,',
        'Your father set up an email for me so I can "join the century". This is me joining it.',
        'Now that you are a working person (or almost one), we should talk about the household. Starting soon you will chip in a little for groceries and the phone line, which you are always on. I made you a budget in the LIFE program — your health, your money, what everything costs. Look at it before you buy another modem.',
        'Love, Mom\n(this took me forty minutes)',
      ],
      effects: [{ unlock: 'life' }],
    },
  },
}

const lifeReveal: TriggerDef = {
  id: 'act0_life_reveal',
  when: {
    all: [
      { flag: 'act0.done' },
      { any: [{ not: { job: null } }, { day: true, gte: 42 }, { var: 'sys.gigsDone', gte: 1 }] },
    ],
  },
  atHour: 9,
  effects: [{ scene: 'act0_mom_budget' }],
}

export default defineContent({
  scenes: [momRoutine, momBudget],
  quests: [helloWorld],
  triggers: [lifeReveal],
})
