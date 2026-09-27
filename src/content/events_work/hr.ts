/**
 * events_work — THE HR FILE. The glue that turns a bad day at work into a career consequence.
 *
 *  - Write-ups (`ev_work.strikes`) come from failed checks all over this pack.
 *  - Three strikes, the first time: "Complication: The Performance Plan" — four documented weeks
 *    and a review you can pass, fail (fired, Pink Slip scar) or walk out of.
 *  - Three strikes after the plan: no second plan. A termination letter.
 *  - A clean record heals one write-up every few months; leaving a job wipes the file.
 */
import { defineContent } from '@/engine/registry'
import type { Cond, QuestDef, SceneDef, TextPart, TriggerDef } from '@/engine/types'
import { CC_JOBS, HALCYON_JOBS, LSU_JOBS, MERIDIAN_JOBS, NORTHLINK_JOBS, PIP, STARTUP_JOBS, STRIKES, employed, firedNow, free } from './_shared'

const Q_PIP = 'ev_work_q_pip'

/** Who "HR" is, depending on where you work. */
const EMPLOYER_LINES: TextPart[] = [
  { if: { job: CC_JOBS }, text: 'The letterhead has a little cartoon castle on it. The castle is frowning. Somebody at Regional chose that clip art on purpose.' },
  { if: { job: HALCYON_JOBS }, text: 'It comes from Halcyon People Operations, which signs off "with gratitude and accountability," in a font chosen by a consultant.' },
  { if: { job: MERIDIAN_JOBS }, text: 'Meridian Trust Human Resources, fourteenth floor. The paper is heavy, cream, watermarked. The bank has been firing people politely since 1911.' },
  { if: { job: NORTHLINK_JOBS }, text: 'NorthLink HR is one woman named Pat and a fax machine. Pat has underlined "documented" three times.' },
  { if: { job: LSU_JOBS }, text: 'Lumen State Computing Services has cc\'d your academic advisor, which feels like being grounded by two sets of parents.' },
  { if: { job: STARTUP_JOBS }, text: 'Driftwood doesn\'t have HR. The founder wrote it themselves, on a napkin, then typed up the napkin. The typos are heartbreaking.' },
]

const scenes: SceneDef[] = [
  // ── The plan arrives ──────────────────────────────────────────────────────
  {
    id: 'ev_work_pip_notice',
    channel: 'mail',
    title: 'Performance Improvement Plan — Please Review and Sign',
    from: 'Human Resources',
    start: 'm',
    nodes: {
      m: {
        speaker: 'Human Resources',
        text: [
          'Following recent documented concerns regarding your performance and conduct, you have been placed on a thirty-day Performance Improvement Plan. During this period your work will be reviewed weekly against the attached objectives. A formal review will be held at the end of the plan.',
          'Please note that failure to meet the objectives of this plan may result in further action, up to and including termination of employment.',
          ...EMPLOYER_LINES,
          'Attached: OBJECTIVES.DOC (4 pages). Objective 3 is "demonstrate ownership." Nobody can tell you what it means.',
        ],
        choices: [
          { text: 'Sign it. Put your head down. Four weeks.', effects: [{ stat: 'stress', add: 4 }] },
          { text: 'Sign it, then spend an hour reading job boards in the bathroom.', effects: [{ stat: 'mood', add: 2 }, { stat: 'stress', add: 2 }] },
        ],
      },
    },
  },
  // ── The review ────────────────────────────────────────────────────────────
  {
    id: 'ev_work_pip_review',
    channel: 'dialog',
    title: 'The Review',
    start: 'room',
    nodes: {
      room: {
        speaker: 'narrator',
        text: [
          { if: employed, text: 'A small meeting room with no windows and a box of tissues placed at an angle you are clearly meant to notice. Your manager has a folder. Someone from HR has a pen and does not look up.', else: 'The calendar invite still pops up at nine: PIP REVIEW — ROOM 3. You don\'t work there anymore. The reminder doesn\'t know that yet.' },
          { if: { all: [employed, { stat: 'energy', gte: 60 }] }, text: 'You slept last night, which is more than you did for most of the month. You feel almost like a person.' },
          { if: employed, text: '"So," your manager says. "Four weeks. Talk to us."' },
        ],
        choices: [
          {
            if: employed,
            tag: '[Business]',
            text: 'Open a binder: every fix, every ticket, every late night, with dates. Make it impossible to argue with.',
            check: {
              skill: 'business',
              dc: 14,
              bonuses: [
                { if: { stat: 'energy', gte: 60 }, add: 2, label: '+2 (well rested)' },
                { if: { background: 'mathlete' }, add: 1, label: '+1 (you put it in a spreadsheet)' },
              ],
              success: 'passed',
              fail: 'let_go',
            },
          },
          {
            if: employed,
            tag: '[Social]',
            text: 'Be human about it: what went wrong, what you changed, what you need from them.',
            check: {
              skill: 'social',
              dc: 14,
              bonuses: [
                { if: { trait: 'empath' }, add: 2, label: '+2 (you read the room before you walked in)' },
                { if: { trait: 'silver_tongue' }, add: 2, label: '+2 (silver tongue)' },
                { if: { stat: 'energy', gte: 60 }, add: 1, label: '+1 (well rested)' },
              ],
              success: 'passed',
              fail: 'let_go',
            },
          },
          {
            if: employed,
            tag: '[Leave]',
            text: '"I\'ll save you the paperwork." Resign before they can fire you.',
            effects: [{ job: null }, { var: STRIKES, set: 0 }, { flag: 'ev_work.pip_resigned' }, { stat: 'mood', add: 3 }],
            goto: 'resigned',
          },
          {
            if: { job: null },
            text: 'Delete the invite. That life is somebody else\'s problem now.',
            effects: [{ flag: 'ev_work.pip_resigned' }, { var: STRIKES, set: 0 }],
            goto: 'deleted',
          },
        ],
      },
      passed: {
        speaker: 'narrator',
        text: [
          'Your manager reads for a long minute. Then closes the folder, slides it an inch to the left, and says, "Okay. Okay. This is — yeah. This is what we needed to see."',
          'The HR person finally looks up, and writes one word, and you will never know what it was. You walk out with your job, your badge, and a file that is, for the first time in months, clean.',
        ],
        effects: [
          { var: STRIKES, set: 0 },
          { removeBuff: 'ev_work_pip' },
          { flag: 'ev_work.pip_reviewed' },
          { flag: 'ev_work.pip_survived' },
          { stat: 'stress', add: -10 },
          { stat: 'mood', add: 6 },
          { faction: 'fac.halcyon', add: 1 },
        ],
      },
      let_go: {
        speaker: 'narrator',
        text: [
          'Your manager doesn\'t open the binder. They already know what\'s in the folder, and it isn\'t you. "We\'ve decided to go in a different direction."',
          'There is a box. There is always a box — they keep them flat-packed in a closet for exactly this. The HR person walks you past the front desk with a hand not quite on your elbow. Someone you ate lunch with for a year pretends to be on the phone.',
          'Outside, the air is very cold and very ordinary. You hold the box. There is a desk plant in it. You don\'t remember it being yours.',
        ],
        effects: [
          ...firedNow,
          { removeBuff: 'ev_work_pip' },
          { flag: 'ev_work.pip_reviewed' },
          { flag: 'ev_work.pip_failed' },
          { chance: 0.35, then: [{ complication: 'work' }] },
        ],
      },
      resigned: {
        speaker: 'narrator',
        text: 'You set your badge on the table. The HR person looks almost grateful — you have saved everyone a form. Nobody walks you out. You walk yourself, which turns out to matter more than you expected.',
        effects: [{ removeBuff: 'ev_work_pip' }, { flag: 'ev_work.pip_reviewed' }],
      },
      deleted: {
        speaker: 'narrator',
        text: 'Click. The invite is gone, and with it the last piece of that office still living in your computer. Somewhere a meeting room sits empty at nine, tissues angled at nobody.',
        effects: [{ removeBuff: 'ev_work_pip' }, { flag: 'ev_work.pip_reviewed' }],
      },
    },
  },
  // ── No second plan ────────────────────────────────────────────────────────
  {
    id: 'ev_work_termination',
    channel: 'mail',
    title: 'Notice of Termination — Effective Immediately',
    from: 'Human Resources',
    pause: true,
    start: 'm',
    nodes: {
      m: {
        speaker: 'Human Resources',
        text: [
          'This letter confirms the termination of your employment, effective immediately, following repeated documented concerns and a prior Performance Improvement Plan.',
          'Your final paycheck will be mailed to your address on file. Please return all company property, including badges, keys, pagers and any documentation, within five business days. Your network access has been disabled.',
          ...EMPLOYER_LINES,
          'There is no signature. It was sent by a machine, which somehow makes it worse.',
        ],
        choices: [
          { text: 'Box up the desk plant. It\'s yours now, whether you wanted it or not.', effects: [{ stat: 'mood', add: -2 }] },
          { text: 'Mail the badge back cut into eleven pieces.', effects: [{ stat: 'mood', add: 3 }, { stat: 'stress', add: -2 }] },
        ],
      },
    },
  },
]

// ── The quest ─────────────────────────────────────────────────────────────────

const quests: QuestDef[] = [
  {
    id: Q_PIP,
    title: 'Complication: The Performance Plan',
    kind: 'personal',
    summary: 'Three write-ups. Four weeks to prove you should keep your job.',
    start: 'plan',
    rewards: 'Your job — or the door',
    priority: 5,
    stages: {
      plan: {
        text: 'Three write-ups and a signature: you are on a performance plan. Every hour of the next four weeks gets documented, and then there is a room with a box of tissues in it.',
        hint: 'Keep working your shifts. The review comes in four weeks — walking in rested helps, and Business or Social will carry the room.',
        onEnter: [{ buff: PIP }, { scene: 'ev_work_pip_notice' }, { scene: 'ev_work_pip_review', delayHours: 24 * 28 }],
        objectives: [{ id: 'review', text: 'Survive the performance review', when: { flag: 'ev_work.pip_reviewed' } }],
        next: [{ if: { flag: 'ev_work.pip_failed' }, stage: 'fired' }, { if: { flag: 'ev_work.pip_resigned' }, stage: 'walked' }, { stage: 'kept' }],
      },
      kept: {
        text: 'You walked into the room with a folder of your own and walked out with your job. The file is clean. You keep a copy of the binder anyway, in a drawer, like a spare key.',
        objectives: [{ id: 'done', text: 'Keep the job', when: { always: true }, hint: 'Already done. Breathe.' }],
      },
      walked: {
        text: 'You left before they could decide for you. No box, no escort, no plan. Just the long walk to the bus stop and the strange lightness of an empty calendar.',
        objectives: [{ id: 'done', text: 'Walk out on your own terms', when: { always: true }, hint: 'Already done. The job board is open when you are.' }],
      },
      fired: {
        text: 'They went in a different direction. The direction was the front door. You have a box, a desk plant, and a new line on your résumé you will learn to explain in one breath.',
        objectives: [{ id: 'done', text: 'Carry the box out', when: { always: true }, hint: 'Already done. The job board is open when you are.' }],
        outcome: 'failed',
      },
    },
  },
]

// ── Glue triggers ─────────────────────────────────────────────────────────────

const pipOver: Cond = { quest: Q_PIP, status: ['completed', 'failed'] }

const triggers: TriggerDef[] = [
  {
    id: 'ev_work_trig_pip',
    when: { all: [{ var: STRIKES, gte: 3 }, employed, free, { quest: Q_PIP, status: 'inactive' }] },
    atHour: 9,
    effects: [{ quest: Q_PIP, start: true }],
  },
  {
    // After the one and only plan, a third strike is simply the door.
    id: 'ev_work_trig_terminated',
    when: { all: [{ var: STRIKES, gte: 3 }, employed, free, pipOver] },
    once: false,
    cooldownDays: 30,
    atHour: 9,
    effects: [{ scene: 'ev_work_termination' }, ...firedNow],
  },
  {
    // A clean stretch lets a write-up fall off the file (roughly one every few months).
    id: 'ev_work_trig_file_heals',
    when: { all: [{ var: STRIKES, gte: 1 }, { var: STRIKES, lte: 2 }, employed, { not: { quest: Q_PIP, status: 'active' } }] },
    once: false,
    cooldownDays: 90,
    chance: 1 / 60,
    atHour: 9,
    effects: [{ var: STRIKES, add: -1 }, { log: 'A quiet quarter at work. One of the write-ups in your file has aged out.', kind: 'good' }],
  },
  {
    // A new employer never sees the old file.
    id: 'ev_work_trig_file_wiped',
    when: { all: [{ var: STRIKES, gte: 1 }, { job: null }, { not: { quest: Q_PIP, status: 'active' } }] },
    once: false,
    cooldownDays: 7,
    effects: [{ var: STRIKES, set: 0 }],
  },
]

export default defineContent({ scenes, quests, triggers })
