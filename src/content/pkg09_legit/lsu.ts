/**
 * PKG-09 — the Lumen State University arc (bible §7.6). Fills the IIa/III dead zones.
 *
 *  - `edu_lsu_q1_exam`       — admissions mail → the entrance exam ([Programming DC 12] OR
 *                              [Systems DC 12]) → enrollment → dorm move-in comedy.
 *  - `edu_lsu_q2_prof`       — meet Prof. Okoro; her grant is quietly Aperture/Bureau money.
 *  - `edu_lsu_q3_thesis`     — the thesis finds a PARALLAX precursor. Publish (evidence
 *                              fragment, `w.exposure +1`, Okoro 'ally') / bury (grade boost,
 *                              Okoro 'complicit') / quietly poison the model.
 *  - `edu_lsu_q4_graduation` — commencement; Mom attends while `w.mom_gone` is 0.
 *
 * Failure has a long tail here: a failed entrance exam can become conditional admission, a
 * probation buff and a ten-week review with the Associate Dean (lifted, final warning + paid
 * tutoring, or one more term); publishing the thesis alone becomes a research-integrity hearing
 * (cleared, Okoro testifies, retract, or the Orange Sticker scar). Commencement reads all of it.
 *
 * Programs `lsu_cs_assoc` / `lsu_cs_bs` are PKG-18's (referenced by id). The story exam enrolls
 * with the `enroll` effect (forced: it skips the engine exam and tuition, so tuition is charged
 * here). Forced enrollment also skips the shift-overlap check, so every in-story enrollment
 * requires having no day job; players with a night shift can still enroll from the Skills window.
 * `fac.lsu.days` counts days enrolled and paces q2/q3.
 */
import { defineContent } from '@/engine/registry'
import type { BuffDef, Choice, Cond, Effect, SkillCheck } from '@/engine/types'

const ASSOC = 'lsu_cs_assoc'
const BS = 'lsu_cs_bs'
const ASSOC_TUITION = 1200
const BS_TUITION = 1800

const atLsu: Cond = { any: [{ enrolled: ASSOC }, { enrolled: BS }] }
const lsuGraduate: Cond = { any: [{ degree: ASSOC }, { degree: BS }] }
const dayFree: Cond = { job: null }
const DAY_JOB_REQ = 'Classes run 10:00–14:00: you need your days free (quit in the Jobs window, or enroll around a night shift from the Skills window)'

const enrollIn = (program: string, tuition: number): Effect[] => [{ money: -tuition }, { enroll: program }, { flag: 'fac.lsu.admitted' }]

const enrollChoices = (extra: Effect[] = []): Choice[] => [
  {
    text: `Associate of Science in Computer Science — two years, $${ASSOC_TUITION.toLocaleString('en-US')} a semester`,
    req: { all: [dayFree, { stat: 'money', gte: ASSOC_TUITION }] },
    reqText: `Requires no day job and $${ASSOC_TUITION.toLocaleString('en-US')} for the first semester`,
    effects: [...extra, ...enrollIn(ASSOC, ASSOC_TUITION)],
    goto: 'enrolled',
  },
  {
    text: `Bachelor of Science in Computer Science — four years, $${BS_TUITION.toLocaleString('en-US')} a semester`,
    req: { all: [dayFree, { stat: 'money', gte: BS_TUITION }] },
    reqText: `Requires no day job and $${BS_TUITION.toLocaleString('en-US')} for the first semester`,
    effects: [...extra, ...enrollIn(BS, BS_TUITION)],
    goto: 'enrolled',
  },
]

const examChoices = (withPencil: boolean): Choice[] => [
  {
    text: 'Section A: write a sorting routine by hand, in pencil, like a monk.',
    check: {
      skill: 'programming',
      dc: 12,
      bonuses: [
        { if: { background: 'mathlete' }, add: 2, label: '+2 Math Olympiad' },
        { if: { trait: 'bookworm' }, add: 1, label: '+1 bookworm' },
      ],
      success: 'passed',
      fail: 'failed',
    },
  },
  {
    text: 'Section B: explain how an operating system juggles a dozen programs at once.',
    check: {
      skill: 'systems',
      dc: 12,
      bonuses: [{ if: { background: 'tinkerer' }, add: 2, label: '+2 basement tinkerer' }],
      success: 'passed',
      fail: 'failed',
    },
  },
  {
    text: 'Raise your hand and ask the proctor for some "clarification."',
    if: { not: { flag: 'fac.lsu.proctor_annoyed' } },
    check: {
      skill: 'social',
      dc: 14,
      bonuses: [{ if: { background: 'class_clown' }, add: 2, label: '+2 Class Clown' }],
      success: 'clarified',
      fail: 'front_row',
      failEffects: [{ flag: 'fac.lsu.proctor_annoyed' }, { stat: 'stress', add: 4 }],
    },
  },
  ...(withPencil
    ? [
        {
          text: 'The man in the mill jacket has snapped his only pencil. Lend him your spare first.',
          effects: [{ flag: 'fac.lsu.lent_pencil' }, { faction: 'fac.hood', add: 2 }],
          goto: 'pencil',
        } satisfies Choice,
      ]
    : []),
]

/** Quests a student drops out of mid-arc fail cleanly (never start-then-fail an inactive one). */
const failIfActive = (quest: string): Effect => ({ if: { quest, status: 'active' }, then: [{ quest, fail: true }] })

// ── Conditional admission: the long tail of a failed entrance exam ──────────
const PROBATION_BUFF: BuffDef = {
  id: 'lsu_probation',
  name: 'Academic Probation',
  desc: 'There is a letter in your file that says "conditional." Every quiz feels like a verdict. You study like someone is watching, because someone is.',
  days: 84,
  bad: true,
  mods: [
    { key: 'stress.gain', mult: 1.1 },
    { key: 'xp.all', mult: 1.05 },
  ],
}

const FINAL_WARNING_BUFF: BuffDef = {
  id: 'lsu_final_warning',
  name: 'Final Warning',
  desc: 'The Associate Dean wrote "final" in green ink and underlined it. One more bad term and Lumen State is a story you tell about the year you almost went to college.',
  days: 240,
  bad: true,
  mods: [
    { key: 'stress.gain', mult: 1.12 },
    { key: 'mood.daily', add: -0.3 },
    { key: 'xp.all', mult: 1.08 },
  ],
}

const TUTORING = 'pkg09_lsu_tutoring'

const PROBATION_LIFTED: Effect[] = [
  { removeBuff: 'lsu_probation' },
  { flag: 'fac.lsu.probation_lifted' },
  { stat: 'stress', add: -8 },
  { stat: 'mood', add: 6 },
]

const PROBATION_WARNED: Effect[] = [
  { removeBuff: 'lsu_probation' },
  { flag: 'fac.lsu.final_warning' },
  { buff: FINAL_WARNING_BUFF },
  { obligation: { id: TUTORING, label: 'Mandatory tutoring, LSU Academic Success Center', perDay: 5, days: 120 } },
  { stat: 'stress', add: 8 },
  { stat: 'mood', add: -6 },
]

// ── The research-integrity hearing: the long tail of publishing alone ───────
const HEARING_BONUSES: NonNullable<SkillCheck['bonuses']> = [
  { if: { flag: 'npc.okoro.impressed' }, add: 2, label: '+2 Okoro taught you to argue with footnotes' },
  { if: { flag: 'fac.lsu.asked_grant' }, add: 1, label: '+1 you know who pays for the rain' },
  { if: { flag: 'fac.lsu.research_assistant' }, add: -2, label: '-2 your signature is on the lab\'s data agreement' },
]

const HEARING_CLEARED: Effect[] = [
  { flag: 'fac.lsu.cleared_hearing' },
  { faction: 'fac.aperture', add: -3 },
  { stat: 'stress', add: -6 },
  { stat: 'mood', add: 5 },
]

const HEARING_REPRIMAND: Effect[] = [
  { flag: 'fac.lsu.reprimand' },
  { trait: 'pkg09_legit_orange_sticker' },
  { clearFlag: 'fac.lsu.research_assistant' },
  { stat: 'stress', add: 10 },
  { stat: 'mood', add: -8 },
  { chance: 0.3, then: [{ complication: 'legal' }] },
]

export default defineContent({
  traits: [
    {
      id: 'pkg09_legit_orange_sticker',
      name: 'The Orange Sticker',
      desc: 'Your transcript carries a research-integrity reprimand from Lumen State, filed at the request of an "interested party." Hiring managers ask about it. You learned the hard way to keep copies of everything, in more than one place.',
      scar: true,
      bad: true,
      mods: [
        { key: 'check.business', add: -1 },
        { key: 'check.opsec', add: 1 },
      ],
    },
  ],

  quests: [
    // ── 1. Entrance exam ────────────────────────────────────────────────────
    {
      id: 'edu_lsu_q1_exam',
      title: 'Entrance Exam',
      kind: 'side',
      act: 2,
      priority: 10,
      summary:
        'Lumen State University sits on the Hill above the fog: an observatory, good coffee, and a CS basement with the quietest server room in Port Lumen. A degree is a slow road. It is also the only road nobody can take away from you in a raid.',
      rewards: 'A place at Lumen State',
      autoStart: {
        any: [atLsu, { all: [{ var: 'act', gte: 2 }, { not: lsuGraduate }] }],
      },
      start: 'apply',
      stages: {
        apply: {
          text: 'Lumen State is admitting for the new year. The admissions office has your address, somehow, and it is not shy about using it.',
          objectives: [
            {
              id: 'enrolled',
              text: 'Enroll at Lumen State (optional)',
              when: atLsu,
              hint: 'Reply to the Lumen State admissions mail to sit the entrance exam, or enroll directly from the Skills window. Classes run 10:00–14:00, so a day job and a degree don\'t mix.',
            },
          ],
          onComplete: [{ scene: 'lsu_move_in', delayHours: 12 }],
          next: 'move_in',
        },
        move_in: {
          text: 'You\'re in. Move-in day on the Hill: cardboard boxes, somebody\'s dad carrying a mini-fridge up four flights, and the smell of a hundred new CRTs warming up at once.',
          objectives: [
            {
              id: 'moved_in',
              text: 'Survive move-in day',
              when: { flag: 'fac.lsu.moved_in' },
              hint: 'Answer the move-in day dialog.',
            },
          ],
        },
      },
    },

    // ── 2. Office hours ─────────────────────────────────────────────────────
    {
      id: 'edu_lsu_q2_prof',
      title: 'Office Hours',
      kind: 'side',
      act: 2,
      giver: 'okoro',
      priority: 10,
      summary:
        'Professor Ada Okoro teaches Systems 210 in a lecture hall that applauds her. She is the best teacher you will ever have. Her lab runs on a grant from a foundation you have never heard of.',
      rewards: 'A mentor, maybe a lab job',
      autoStart: {
        all: [
          { quest: 'edu_lsu_q1_exam', status: 'completed' },
          { var: 'act', gte: 2 },
          { any: [{ all: [atLsu, { var: 'fac.lsu.days', gte: 20 }] }, lsuGraduate] },
        ],
      },
      start: 'meet',
      stages: {
        meet: {
          text: 'Your problem set came back with two words in red ink across the top: "See me." Professor Okoro\'s office hours are Thursday, in the CS basement, next to the server room.',
          onEnter: [{ scene: 'lsu_okoro_office' }],
          objectives: [
            {
              id: 'met',
              text: 'Go to Professor Okoro\'s office hours',
              when: { flag: 'fac.lsu.met_okoro' },
              hint: 'Answer the office-hours dialog.',
            },
          ],
        },
      },
    },

    // ── 3. The thesis ───────────────────────────────────────────────────────
    {
      id: 'edu_lsu_q3_thesis',
      title: 'The Thesis',
      kind: 'side',
      act: 2,
      giver: 'okoro',
      priority: 15,
      summary:
        'Every degree ends in a long document that three people will read. Yours is going to be read by a lot more people than that, or by nobody at all, and you are going to have to decide which.',
      rewards: 'A grade, a reference — or the truth',
      autoStart: {
        all: [{ quest: 'edu_lsu_q2_prof', status: 'completed' }, { var: 'act', gte: 2 }, { any: [{ var: 'fac.lsu.days', gte: 75 }, lsuGraduate] }],
      },
      start: 'research',
      stages: {
        research: {
          text: [
            { if: { enrolled: ASSOC }, text: 'Your capstone project uses the lab\'s "anonymized" consumer dataset to look for patterns. Patterns are exactly what it finds.', else: 'Your thesis uses the lab\'s "anonymized" consumer dataset to look for patterns. Patterns are exactly what it finds.' },
          ],
          onEnter: [{ scene: 'lsu_thesis_night', delayHours: 24 * 5 }],
          objectives: [
            {
              id: 'written',
              text: 'Decide what your thesis says',
              when: { flag: 'fac.lsu.thesis_done' },
              hint: 'Answer the late-night dialog in the CS basement. Publishing needs Okoro\'s signature, or the nerve to go without it.',
            },
          ],
        },
      },
    },

    // ── 4. Commencement ─────────────────────────────────────────────────────
    {
      id: 'edu_lsu_q4_graduation',
      title: 'Commencement',
      kind: 'side',
      act: 2,
      priority: 15,
      summary: 'A gown that doesn\'t fit, a hat that won\'t stay on, and a piece of paper nobody can confiscate.',
      rewards: 'A degree, and the people who came to watch you get it',
      autoStart: { all: [lsuGraduate, { quest: 'edu_lsu_q3_thesis', status: 'completed' }] },
      start: 'ceremony',
      stages: {
        ceremony: {
          text: 'Commencement on the Hill. The fog is supposed to lift by eleven. The fog has not been told.',
          onEnter: [{ scene: 'lsu_commencement', delayHours: 24 }],
          objectives: [
            {
              id: 'walked',
              text: 'Walk at commencement',
              when: { flag: 'fac.lsu.graduated' },
              hint: 'Answer the commencement dialog.',
            },
          ],
        },
      },
    },
  ],

  scenes: [
    // ── Admissions mail (re-sent every ~5 months until you enroll) ──────────
    {
      id: 'lsu_admissions_mail',
      channel: 'mail',
      title: 'Your Future on the Hill — Lumen State Admissions',
      from: 'Lumen State Admissions',
      start: 'letter',
      nodes: {
        letter: {
          text: [
            'Dear {name},',
            { if: { flag: 'fac.lsu.passed_exam' }, text: 'Our records show that you have passed the Lumen State entrance examination. Your score remains on file, and a place in the Department of Computer Science is held for you. Tuition is due at enrollment.', else: 'Lumen State University is now admitting students to the Department of Computer Science for the coming year. Entrance examinations are held Saturday mornings in Pell Hall, room 104. Please bring two No. 2 pencils and a photo ID. Calculators are not permitted. Neither, after an incident last spring, are pagers.' },
            'The Department offers a two-year Associate of Science ($1,200 per semester) and a four-year Bachelor of Science ($1,800 per semester). Classes meet daily from 10:00 to 14:00. On-campus housing is available in Hadley Hall.',
            'We look forward to seeing you on the Hill.',
            'Office of Admissions\nLumen State University\n"Lux in Nebula"',
          ],
          choices: [
            {
              text: 'Sign up for Saturday\'s entrance exam.',
              if: { not: { flag: 'fac.lsu.passed_exam' } },
              req: dayFree,
              reqText: DAY_JOB_REQ,
              effects: [{ scene: 'lsu_exam_day', delayHours: 48 }],
              goto: 'signed',
            },
            {
              text: 'Quit your job and go full-time. Sign up for the exam.',
              tag: '[Quit job]',
              if: { all: [{ not: dayFree }, { not: { flag: 'fac.lsu.passed_exam' } }] },
              effects: [{ job: null }, { scene: 'lsu_exam_day', delayHours: 48 }],
              goto: 'signed',
            },
            ...enrollChoices().map((c): Choice => ({ ...c, if: { flag: 'fac.lsu.passed_exam' } })),
            { text: 'Not this year.', goto: 'later' },
          ],
        },
        signed: {
          text: 'Thank you for registering for the Lumen State entrance examination. Please arrive by 7:45 a.m. Doors close at 8:00 sharp. The proctor has asked us to add that he means it.\n\nOffice of Admissions',
        },
        enrolled: {
          text: 'Congratulations, and welcome to Lumen State University. Your class schedule and Hadley Hall housing information will follow. Orientation is on the quad. There will be a banner. Please do not climb it.\n\nOffice of Admissions',
        },
        later: {
          text: 'You fold the letter into a paper airplane and throw it at the wall. It flies surprisingly well. Maybe there\'s something to this education thing. Maybe next year.',
        },
      },
    },

    // ── The entrance exam ───────────────────────────────────────────────────
    {
      id: 'lsu_exam_day',
      channel: 'dialog',
      title: 'Pell Hall, Room 104',
      start: 'hall',
      nodes: {
        hall: {
          speaker: 'narrator',
          text: [
            'Saturday, 7:58 a.m. Pell Hall smells like floor wax and panic. Forty teenagers, a woman in scrubs straight off a night shift, and a big quiet man in his fifties wearing a Port Lumen Paper jacket with the name KOWALCZYK stitched over the pocket.',
            'The proctor is a grad student named Tobias Wren, who has a goatee that isn\'t working out and a stopwatch he clearly loves. "Section A, programming. Section B, systems. Answer one. Pencils up. Go."',
            'Two seats over, the man in the mill jacket snaps his only pencil in half and stares at the pieces like they betrayed him personally.',
          ],
          choices: examChoices(true),
        },
        pencil: {
          speaker: 'narrator',
          text: 'You slide your spare pencil across the aisle. Mr. Kowalczyk looks at it, then at you, and nods once, the way men from the mill nod: a whole paragraph in one motion. Tobias pretends not to see. Four minutes gone. Back to it.',
          choices: examChoices(false),
        },
        clarified: {
          speaker: 'Tobias Wren',
          text: '"Clarification. Sure." Tobias crouches by your desk and, in the course of clarifying what the question "means, conceptually," explains the answer so thoroughly that you could frame it. He seems to realize this halfway through, and just... keeps going. "Nobody ever asks me anything," he whispers. "I did four years of this." You pass.',
          next: 'passed',
        },
        front_row: {
          speaker: 'Tobias Wren',
          text: '"The question," Tobias says loudly, to the entire room, "means what it says." He moves you to the front row, directly under his stopwatch, where you can hear it tick. It is very loud. You have eleven minutes left, and the whole room knows your name now.',
          choices: [
            { text: 'Section A. Write the sorting routine. Ignore the stopwatch.', check: { skill: 'programming', dc: 13, bonuses: [{ if: { background: 'mathlete' }, add: 2, label: '+2 Math Olympiad' }], success: 'passed', fail: 'failed' } },
            { text: 'Section B. Operating systems. Ignore the stopwatch.', check: { skill: 'systems', dc: 13, bonuses: [{ if: { background: 'tinkerer' }, add: 2, label: '+2 basement tinkerer' }], success: 'passed', fail: 'failed' } },
          ],
        },
        passed: {
          speaker: 'Tobias Wren',
          text: [
            'Tobias grades them on the spot, at the front desk, with a red pen and visible joy. When he gets to yours he stops, reads it twice, and writes 91 in the corner with a small star.',
            '"Welcome to Lumen State," he says, handing it back. "Don\'t tell anyone about the star. I\'m not supposed to do stars."',
            { if: { flag: 'fac.lsu.lent_pencil' }, text: 'On the steps outside, Mr. Kowalczyk is holding his own paper with both hands. It says 64. He gives you the pencil back. You tell him to keep it. He puts it in his jacket pocket like a medal.' },
          ],
          effects: [{ flag: 'fac.lsu.passed_exam' }],
          choices: [
            ...enrollChoices(),
            { text: '"I need to save up for tuition first."', goto: 'saving' },
          ],
        },
        failed: {
          speaker: 'Tobias Wren',
          text: [
            'Tobias grades them on the spot. At yours, he winces the way you wince at a stubbed toe that isn\'t yours. 58. Passing is 60.',
            '"Okay, so, listen." He leans in. "There\'s a thing. Conditional admission. You take the summer bridge course — a hundred and fifty bucks, six weeks of me being very patient — and you start on academic probation. Associate track only. Most people who do it end up fine." He shrugs. "Some of them end up better than fine. I did it."',
            { if: { flag: 'fac.lsu.lent_pencil' }, text: 'On the steps outside, Mr. Kowalczyk is holding his own paper: 64. He looks at yours, then at you, and says, "Next time you keep your pencil." It\'s the kindest thing anyone says to you all week.' },
          ],
          choices: [
            {
              text: 'Take conditional admission: the bridge course, probation, the Associate track.',
              req: { all: [dayFree, { stat: 'money', gte: ASSOC_TUITION + 150 }] },
              reqText: `Requires no day job and $${(ASSOC_TUITION + 150).toLocaleString('en-US')} (bridge course + first semester)`,
              effects: [
                { money: -150 },
                ...enrollIn(ASSOC, ASSOC_TUITION),
                { flag: 'fac.lsu.probation' },
                { stat: 'stress', add: 5 },
                { buff: PROBATION_BUFF },
                { scene: 'lsu_probation_review', delayHours: 24 * 70 },
              ],
              goto: 'probation',
            },
            { text: '"I\'ll try again next year."', goto: 'retry' },
          ],
        },
        enrolled: {
          speaker: 'narrator',
          text: 'You pay the first semester at the bursar\'s window in Pell Hall, to a woman who has been stamping PAID on things since 1974 and does it with the gravity of a sacrament. PAID. You\'re a college student. It feels exactly like nothing and then, walking down the Hill in the fog, exactly like everything.',
        },
        probation: {
          speaker: 'narrator',
          text: [
            'Six weeks of summer bridge course in a room with no air conditioning, taught by Tobias Wren with the patience of a saint and the goatee of a lesser saint. You pass it. You start in the fall on probation, with a letter in your file that says "conditional." You intend to make them take it out.',
            'The letter has a second page. A standing review in ten weeks, it says, before the Associate Dean. Probationary students who are "not demonstrating satisfactory progress" will be "counseled." Tobias reads it over your shoulder and says, "Counseled is a very big word in this building."',
          ],
        },
        saving: {
          speaker: 'Tobias Wren',
          text: '"Totally normal. Your score stays on file." He writes something on a sticky note and presses it onto your exam: a phone number and "Registrar — ask for Bev." "When you\'ve got the money, call Bev. Bev is a legend." Admissions will write to you again. Admissions always writes again.',
        },
        retry: {
          speaker: 'Tobias Wren',
          text: '"Respect." He means it. "Most people who fail by two points come back and destroy it." He hands you your exam with the 58 on it. You keep it in a drawer, where it will stare at you until you come back. You can also sit the registrar\'s standard exam any time from the Skills window, but Tobias says the Saturday one "has more heart."',
        },
      },
    },

    // ── Move-in day ─────────────────────────────────────────────────────────
    {
      id: 'lsu_move_in',
      channel: 'dialog',
      title: 'Move-In Day',
      start: 'quad',
      nodes: {
        quad: {
          speaker: 'narrator',
          text: [
            'The Hill on the first day of term: fog on the quad, a banner reading WELCOME HOME, LUMEN LIGHTS that somebody has already climbed, and a line of cars double-parked outside Hadley Hall with mini-fridges strapped to the roofs.',
            { if: { flag: 'fac.lsu.probation' }, text: 'You have a letter in your pocket that says "conditional." You have not stopped touching it all morning.' },
            'The housing office has a room for you if you want it: Hadley 412, a cinderblock double, $150 to move in. Your roommate is listed as "D. Petrakis." Under "interests" he has written, in all caps, NETWORKING.',
          ],
          choices: [
            {
              text: 'Take Hadley 412. You\'re going to live on the Hill.',
              if: { not: { housing: 'dorm_room' } },
              req: { stat: 'money', gte: 150 },
              reqText: 'Requires $150 to move in',
              effects: [
                { money: -150 },
                { housing: 'dorm_room' },
                { if: { lifestyle: 'moms_cooking' }, then: [{ lifestyle: 'life_groceries' }] },
              ],
              goto: 'doom',
            },
            {
              text: 'Your stuff is already in Hadley 412. Go meet the roommate.',
              if: { housing: 'dorm_room' },
              goto: 'doom',
            },
            {
              text: 'Stay at home and take the 14 bus up the Hill every morning.',
              if: { housing: 'parents_flat' },
              goto: 'commute_home',
            },
            {
              text: 'Keep your own place. You\'ve got a door that locks; you\'re not giving it up for a bunk.',
              if: { not: { housing: ['parents_flat', 'dorm_room'] } },
              goto: 'commute_own',
            },
          ],
        },
        doom: {
          speaker: 'Dmitri "Doom" Petrakis',
          text: [
            'Hadley 412 already contains a roommate: Dmitri Petrakis, from Ridgeport, six-foot-four, wearing a bathrobe over jeans at 2 p.m. "Call me Doom. Everybody does. It\'s a Ridgeport thing, not my personality."',
            'He has already strung coaxial cable out the window, along the gutter and back in through the heating vent, connecting twelve rooms on the fourth floor into one network. "For Rail Frenzy," he explains. "Also for learning. Mostly Rail Frenzy. Friday night the whole floor plays. You in?"',
          ],
          choices: [
            { text: '"I\'m in. I will destroy all of you."', effects: [{ stat: 'mood', add: 6 }, { xp: 'networking', add: 40 }, { flag: 'fac.lsu.floor_lan' }], goto: 'lan' },
            {
              text: '"Ground rules first. Headphones after 2 a.m., and nobody touches my machine."',
              check: {
                skill: 'social',
                dc: 12,
                success: 'rules_ok',
                fail: 'rules_forgot',
                successEffects: [{ stat: 'stress', add: -4 }],
                failEffects: [
                  { stat: 'stress', add: 3 },
                  {
                    buff: {
                      id: 'lsu_doom_vents',
                      name: 'Doom Through the Vents',
                      desc: 'Your roommate narrates Rail Frenzy to the entire fourth floor through the heating vent, nightly, around 3:40 a.m.',
                      days: 42,
                      bad: true,
                      mods: [{ key: 'energy.regen', mult: 0.94 }],
                    },
                  },
                ],
              },
            },
            {
              text: 'Look at his cable job with professional horror and offer to redo it properly.',
              check: {
                skill: 'hardware',
                dc: 12,
                success: 'recabled',
                fail: 'blackout',
                successEffects: [{ xp: 'hardware', add: 40 }, { flag: 'fac.lsu.floor_lan' }],
                failEffects: [{ stat: 'mood', add: -3 }, { money: -60 }, { flag: 'fac.lsu.owe_doom' }],
              },
            },
          ],
        },
        lan: {
          speaker: 'narrator',
          text: 'Friday night, twelve rooms, twelve CRTs, one fire code violation. You lose the first map to a quiet girl from 409 who plays with the mouse upside down. You win the next six. By midnight the fourth floor of Hadley knows your handle, and Doom is calling you "the professional" with the reverence of a man who has been fragged very thoroughly.',
          effects: [{ flag: 'fac.lsu.moved_in' }],
        },
        rules_ok: {
          speaker: 'Dmitri "Doom" Petrakis',
          text: '"Headphones after two. Nobody touches your box." Doom holds out a huge hand and you shake on it. He honors it, fanatically, for the entire year, and once physically removes a drunk sophomore who tries to check his mail on your machine. You have never felt so safe in your life.',
          effects: [{ flag: 'fac.lsu.moved_in' }],
        },
        rules_forgot: {
          speaker: 'Dmitri "Doom" Petrakis',
          text: '"Totally. Absolutely. Headphones." Doom agrees to everything, sincerely, and forgets all of it by Tuesday. At 3:40 a.m. on Wednesday you wake up to him narrating a rocket-launcher kill to the entire floor through the heating vent. It is, you have to admit, a very good kill.',
          effects: [{ flag: 'fac.lsu.moved_in' }],
        },
        recabled: {
          speaker: 'narrator',
          text: 'You spend the evening rerunning Doom\'s network: proper terminators, cable off the gutter, a hub in the closet instead of a tangle in the vent. It works on the first try. Doom stares at the blinking lights with tears in his eyes and appoints you, on the spot, "Minister of Cables." Word spreads. By week two, three other floors want you.',
          effects: [{ flag: 'fac.lsu.moved_in' }],
        },
        blackout: {
          speaker: 'narrator',
          text: 'You unplug one thing to fix another thing and the entire fourth floor of Hadley goes dark: lights, network, somebody\'s fish tank pump. There is a long silence in the hallway, and then twelve people yelling your room number. Doom, to his eternal credit, takes the blame. "It was Doom," he tells the RA. "It\'s always Doom." Housing fines him sixty dollars for the fish. You pay it, obviously. You owe him forever, and he knows it, and he will collect.',
          effects: [{ flag: 'fac.lsu.moved_in' }],
        },
        commute_home: {
          speaker: 'narrator',
          text: [
            { if: { var: 'w.mom_gone', eq: 0 }, text: 'Mom is up before you on the first day, which has not happened since kindergarten. There is a lunch in a paper bag on the counter with your name on it in marker, and a note inside: "COLLEGE. Eat the orange. — Mom." You read it on the 14 bus, going up the Hill in the fog, and have to look out the window for a while.', else: 'The flat is quiet on the first morning. Dad has left a paper-bag lunch on the counter with your name on it, in his careful mill-foreman capitals, and an orange. You eat the orange on the 14 bus, going up the Hill in the fog.' },
          ],
          effects: [{ flag: 'fac.lsu.moved_in' }, { npc: 'mom', affinity: 3 }, { npc: 'dad', affinity: 3 }, { faction: 'fac.hood', add: 2 }],
        },
        commute_own: {
          speaker: 'narrator',
          text: 'You keep your own place and ride up the Hill every morning with the nurses coming off shift and the kids who can\'t afford Hadley. By the second week you know every driver on the route. By the third, one of them saves you a seat. It\'s not the dorm. It\'s yours.',
          effects: [{ flag: 'fac.lsu.moved_in' }],
        },
      },
    },

    // ── Office hours with Okoro ─────────────────────────────────────────────
    {
      id: 'lsu_okoro_office',
      channel: 'dialog',
      title: 'Office Hours',
      start: 'lecture',
      nodes: {
        lecture: {
          speaker: 'narrator',
          text: [
            { if: lsuGraduate, text: 'You already have the diploma, but Professor Okoro has asked to see you anyway. Your old capstone problem set is still on her desk, she says, and it still bothers her.' },
            'Systems 210 starts seven minutes late, every time. Professor Ada Okoro arrives in tweed and chalk dust, writes one sentence on a whiteboard that hasn\'t been fully erased since 1994, and talks for an hour without notes. The hall applauds at the end. It always does. She always looks surprised.',
            'Her office is in the CS basement, next to the server room, and it hums. Books to the ceiling. A kettle. Your problem set on the desk, bleeding red ink.',
          ],
          next: 'office',
        },
        office: {
          speaker: 'okoro',
          text: [
            '"Your answer to problem four is wrong," she says, pouring two cups of tea without asking. "It\'s wrong in a very interesting way. Most students are wrong in the ordinary way. It\'s restful. You\'re not restful."',
            '"I run a lab. We look for patterns in large collections of consumer data — shopping, transit, that sort of thing — anonymized, of course. The Harbor Foundation for Applied Data pays for it. I need a research assistant who is interestingly wrong. It pays a stipend and it pays in reading."',
          ],
          effects: [{ npc: 'okoro', met: true, fate: 'mentor' }],
          choices: [
            {
              text: '"How do you keep the data anonymous, exactly?"',
              check: {
                skill: 'cryptography',
                dc: 13,
                bonuses: [{ if: { background: 'mathlete' }, add: 2, label: '+2 Math Olympiad' }],
                success: 'impressed',
                fail: 'wrong_delight',
                successEffects: [{ flag: 'npc.okoro.impressed' }, { npc: 'okoro', affinity: 8 }],
                failEffects: [{ npc: 'okoro', affinity: 2 }, { stat: 'mood', add: -4 }, { stat: 'stress', add: 4 }, { stat: 'energy', add: -6 }],
              },
            },
            {
              text: '"Problem four was wrong on purpose. Let me show you why the right answer breaks."',
              check: {
                skill: 'programming',
                dc: 13,
                success: 'impressed',
                fail: 'wrong_delight',
                successEffects: [{ flag: 'npc.okoro.impressed' }, { npc: 'okoro', affinity: 8 }],
                failEffects: [{ npc: 'okoro', affinity: 2 }, { stat: 'mood', add: -4 }, { stat: 'stress', add: 4 }, { stat: 'energy', add: -6 }],
              },
            },
            { text: '"Who funds the Harbor Foundation?"', effects: [{ flag: 'fac.lsu.asked_grant' }], goto: 'grant' },
            { text: '"Yes. I\'ll take the job."', goto: 'join' },
          ],
        },
        impressed: {
          speaker: 'okoro',
          text: 'She listens with her chin on her fist, and when you finish she gets up, goes to her own whiteboard, and writes your name in the corner next to a list of four other names, three of which you recognize from textbooks. "That," she says, "is where I keep the people who surprise me. Don\'t let it go to your head. Two of them are dead."',
          next: 'offer',
        },
        wrong_delight: {
          speaker: 'okoro',
          text: 'You say something with great confidence. It is wrong. Okoro\'s whole face lights up. "No!" she says happily, and spends twenty minutes explaining why in a way that rearranges the furniture in your head. You leave feeling stupid and taller, which, she tells you, is the only honest feeling a university can give anyone.',
          next: 'offer',
        },
        grant: {
          speaker: 'okoro',
          text: [
            'She blows on her tea. "Grants are like weather. You don\'t ask the cloud where the rain came from."',
            'A pause, long enough that the server room next door fills it.',
            '"Though lately I\'ve started asking. The Foundation\'s donors include a data company in Millgate and a federal office that funds \'infrastructure research,\' whatever that is this year. It is all very respectable. It is all very, very respectable." She sets the cup down. "Well. Do you want the job?"',
          ],
          next: 'offer',
        },
        offer: {
          speaker: 'okoro',
          text: '"So. The lab. Yes or no. I don\'t do maybe; maybe is a grant word."',
          choices: [
            { text: '"Yes."', goto: 'join' },
            { text: '"I\'m here for the degree, Professor. Not the lab."', goto: 'decline' },
          ],
        },
        join: {
          speaker: 'okoro',
          text: '"Good." She hands you a key on a loop of red yarn: the server room. "Mondays and Thursdays. Don\'t touch the machine labeled BARTHOLOMEW; he\'s older than you and twice as temperamental. Your first reading is on the chair. All of it." It is a stack of papers taller than the chair.',
          effects: [{ flag: 'fac.lsu.research_assistant' }, { flag: 'fac.lsu.met_okoro' }, { money: 800 }, { xp: 'programming', add: 100 }, { xp: 'cryptography', add: 80 }, { npc: 'okoro', affinity: 5 }],
        },
        decline: {
          speaker: 'okoro',
          text: '"Fair." She doesn\'t seem offended; she seems to be filing it. "You\'ll still end up my advisee. I\'m the only one in this building who reads systems theses to the end." She hands your problem set back. "Fix problem four. Keep it wrong in the same way, but on purpose."',
          effects: [{ flag: 'fac.lsu.met_okoro' }],
        },
      },
    },

    // ── The thesis ──────────────────────────────────────────────────────────
    {
      id: 'lsu_thesis_night',
      channel: 'dialog',
      title: 'The CS Basement, 2 a.m.',
      start: 'basement',
      nodes: {
        basement: {
          speaker: 'narrator',
          text: [
            'The CS basement at 2 a.m.: the server room humming, BARTHOLOMEW clicking to himself, a vending machine that only sells a single flavor of cracker.',
            'Your thesis was supposed to be dull. "Trends in anonymized consumer data." The lab\'s dataset: pharmacy loyalty cards, bus-pass swipes, the times people\'s home connections went online, all with the names scrubbed off. You wrote a model to find trends. It didn\'t find trends. It found people.',
            { if: { var: 'w.mom_gone', eq: 0 }, text: 'Record 40,117. No name. Night shifts. The pharmacy on Cannery Row, every other Tuesday. The 14 bus. A home connection that goes online at 11 p.m. and stays on while someone sleeps. You know who that is. You were the someone asleep. It\'s your mother.', else: 'Record 40,117. No name. The pharmacy on Cannery Row, twice a week. The 14 bus, never after dark. A home connection used for exactly one hour a day, for email. You know who that is. It\'s Ruth Alvarez, from next door.' },
            'The dataset\'s file headers, which nobody was supposed to read, say PARALLAX-PILOT. You have never seen the word before. It doesn\'t feel like a word you want to have seen.',
          ],
          choices: [
            {
              text: 'Write it up — "On the Re-identification of Anonymized Consumer Data" — and ask Okoro to put her name on it with yours.',
              check: {
                skill: 'social',
                dc: 14,
                bonuses: [
                  { if: { flag: 'npc.okoro.impressed' }, add: 2, label: '+2 your name is on her whiteboard' },
                  { if: { flag: 'fac.lsu.asked_grant' }, add: 2, label: '+2 you asked about the rain' },
                ],
                success: 'cosigned',
                fail: 'alone',
                successEffects: [{ npc: 'okoro', fate: 'ally', affinity: 10 }, { var: 'evidence_fragments', add: 1 }, { var: 'w.exposure', add: 1 }, { faction: 'fac.aperture', add: -10 }, { flag: 'fac.lsu.published' }, { flag: 'fac.lsu.thesis_done' }],
                failEffects: [
                  { npc: 'okoro', affinity: -5 },
                  { var: 'evidence_fragments', add: 1 },
                  { var: 'w.exposure', add: 1 },
                  { faction: 'fac.aperture', add: -5 },
                  { flag: 'fac.lsu.published' },
                  { flag: 'fac.lsu.pulled_paper' },
                  { scene: 'lsu_governance_review', delayHours: 24 * 10 },
                  { flag: 'fac.lsu.thesis_done' },
                ],
              },
            },
            {
              text: 'Delete the model. Write a safe, elegant thesis about scheduling algorithms instead.',
              effects: [{ flag: 'fac.lsu.honors' }, { money: 1000 }, { npc: 'okoro', fate: 'complicit' }, { faction: 'fac.halcyon', add: 3 }, { flag: 'fac.lsu.thesis_done' }],
              goto: 'buried',
            },
            {
              text: 'Publish a thesis that "proves" the method doesn\'t work — and quietly poison the model so it never will.',
              check: {
                skill: 'programming',
                dc: 16,
                bonuses: [{ if: { skill: 'cryptography', gte: 30 }, add: 2, label: '+2 you know how to hide a flaw' }],
                success: 'poisoned',
                fail: 'caught',
                successEffects: [{ flag: 'fac.lsu.poisoned_model' }, { faction: 'fac.aperture', add: -5 }, { flag: 'fac.lsu.thesis_done' }],
                failEffects: [{ flag: 'fac.lsu.caught_sabotage' }, { npc: 'okoro', affinity: -6 }, { stat: 'stress', add: 6 }],
              },
            },
          ],
        },
        cosigned: {
          speaker: 'okoro',
          text: [
            'She reads it in her office the next morning, all of it, while her tea goes cold. When she\'s done she takes off her glasses and sits for a long time.',
            '"I told myself it was weather." She uncaps a pen. "I am too old to be frightened of anything except bad footnotes, and your footnotes are excellent." She signs. Then she opens a drawer and hands you a folder: every grant letter, every donor, every invoice from the Harbor Foundation, copied in her careful hand. "If we\'re going to be difficult, let\'s be thorough."',
            'The paper goes up on the department server on Friday. The Foundation cancels the grant on Monday. On Tuesday, three strangers download it from an address block in Millgate. Okoro frames the cancellation letter.',
          ],
        },
        alone: {
          speaker: 'okoro',
          text: [
            '"No." She says it gently, which is worse. "I have eleven students on that grant. I have a lab to feed. I can\'t put my name on this." She slides it back across the desk. "I won\'t stop you. I just can\'t hold the door."',
            'You post it to the department server under your own name. It\'s pulled within forty-eight hours for "data governance review." You kept a copy, of course. The copy is what matters. Okoro still grades your work fairly, but she doesn\'t pour you tea anymore.',
            'On the third day a letter arrives in your campus mailbox on the heavy paper the university saves for bad news. The Office of Research Integrity would like to "discuss the provenance of the data." There will be a hearing. The Harbor Foundation\'s lawyer will attend "as an interested party."',
          ],
        },
        buried: {
          speaker: 'narrator',
          text: [
            'You delete the model at 4 a.m. It takes one keystroke. Record 40,117 goes back to being a number.',
            'The scheduling thesis is beautiful. Okoro calls it "the most elegant thing I\'ve read in three years" and nominates it for the department prize, which comes with a thousand dollars and a plaque. At the ceremony she hugs you and doesn\'t quite meet your eye, and you realize she knew what was in that dataset all along. You were both just very good at not reading headers.',
          ],
        },
        poisoned: {
          speaker: 'narrator',
          text: [
            'You write a careful, honest-looking thesis concluding that re-identification from this kind of data is "statistically unreliable at scale." Then you plant one small, patient flaw in the lab\'s shared model, deep enough that nobody will find it for a year, maybe two.',
            'Okoro gives you a B-plus and a puzzled look. "This is the most confident wrong answer you\'ve ever given me," she says. "I can\'t decide if I\'m disappointed." Somewhere in Millgate, a project milestone quietly slips.',
          ],
        },
        caught: {
          speaker: 'okoro',
          text: [
            'Okoro finds the flaw in three days. Of course she does. She calls you into her office and sets the printout on the desk between the teacups.',
            '"This is not a mistake. You don\'t make this kind of mistake." Her voice is very even. "You were trying to break it. Why?"',
          ],
          choices: [
            {
              text: 'Tell her everything. Record 40,117. PARALLAX-PILOT. Ask her to help you publish.',
              effects: [{ npc: 'okoro', fate: 'ally', affinity: 8 }, { var: 'evidence_fragments', add: 1 }, { var: 'w.exposure', add: 1 }, { faction: 'fac.aperture', add: -10 }, { flag: 'fac.lsu.published' }, { flag: 'fac.lsu.thesis_done' }],
              goto: 'cosigned',
            },
            {
              text: '"It was an accident. I\'ll rewrite it. Scheduling algorithms."',
              tag: '[Lie]',
              effects: [{ npc: 'okoro', fate: 'complicit' }, { npc: 'okoro', affinity: -3 }, { stat: 'stress', add: 6 }, { flag: 'fac.lsu.integrity_note' }, { flag: 'fac.lsu.thesis_done' }],
              goto: 'lied',
            },
          ],
        },
        lied: {
          speaker: 'okoro',
          text: [
            '"Of course." She knows. You know she knows. She lets it be an accident, and you write the scheduling thesis, and it\'s fine, and you both carry the other one around for years like a stone in a shoe.',
            'It isn\'t entirely fine. The thesis comes back with a C-plus, and the department file gets a one-line memo in her careful hand: "Integrity concern raised and resolved with the student." Resolved is a word that means somebody wrote it down. She never nominates you for anything.',
          ],
        },
      },
    },

    // ── Conditional admission: the ten-week review ──────────────────────────
    {
      id: 'lsu_probation_review',
      channel: 'dialog',
      title: 'Satisfactory Progress',
      start: 'office',
      nodes: {
        office: {
          speaker: 'narrator',
          text: [
            {
              if: atLsu,
              text: 'The Associate Dean for Undergraduate Studies, Dr. Maureen Hargreave, has an office on the third floor of Pell Hall and a clock that ticks slightly louder than a clock should. There is a box of tissues on the corner of her desk, angled toward the chair you are sitting in. That tells you how most of these meetings go.',
              else: 'A letter from the Associate Dean\'s office finds you anyway, forwarded twice. Your probationary review "is closed, as the student is no longer enrolled." Somebody has initialed it in green ink. That\'s the whole letter. It stings more than it has any right to.',
            },
            { if: { all: [atLsu, { flag: 'fac.lsu.probation_extended' }] }, text: '"Round two," she says, not unkindly, and opens the same file to the same page. The sticky note you left on it last time is still there.' },
            { if: atLsu, text: '"Conditional admission. Summer bridge. Probation." She turns a page. "Mr. Wren tells me you finished the bridge course. Mr. Wren tells me a great many things, most of them involving stars. I need to see satisfactory progress with my own eyes. Convince me."' },
          ],
          choices: [
            {
              if: { not: atLsu },
              text: 'Fold the letter into a paper airplane. Don\'t throw it.',
              effects: [{ removeBuff: 'lsu_probation' }, { stat: 'mood', add: -3 }],
            },
            {
              if: atLsu,
              text: 'Put your problem sets on her desk and walk her through the hardest one, line by line.',
              check: {
                skill: 'programming',
                dc: 13,
                bonuses: [
                  { if: { skill: 'programming', gte: 25 }, add: 2, label: '+2 you actually did the reading' },
                  { if: { trait: 'bookworm' }, add: 1, label: '+1 bookworm' },
                  { if: { flag: 'fac.lsu.probation_extended' }, add: 1, label: '+1 a second term of practice' },
                ],
                success: 'lifted',
                fail: 'warning',
                successEffects: PROBATION_LIFTED,
                failEffects: PROBATION_WARNED,
              },
            },
            {
              if: atLsu,
              text: 'Tell her what this year has actually been like, at home and on the Row.',
              check: {
                skill: 'social',
                dc: 14,
                bonuses: [
                  { if: { flag: 'a1.dad_laid_off' }, add: 1, label: '+1 the mill layoffs made the paper' },
                  { if: { background: 'class_clown' }, add: 1, label: '+1 Class Clown' },
                ],
                success: 'lifted_story',
                fail: 'warning_story',
                successEffects: PROBATION_LIFTED,
                failEffects: PROBATION_WARNED,
              },
            },
            {
              if: { all: [atLsu, { not: { flag: 'fac.lsu.probation_extended' } }] },
              text: '"Give me one more term. Then judge me."',
              effects: [{ flag: 'fac.lsu.probation_extended' }, { buff: PROBATION_BUFF }, { stat: 'stress', add: 4 }, { scene: 'lsu_probation_review', delayHours: 24 * 70 }],
              goto: 'extended',
            },
          ],
        },
        lifted: {
          speaker: 'Dr. Hargreave',
          text: [
            'She reads the problem set while you talk, then stops listening to you and just reads, which is better. At the end she takes out a green pen, finds the word "conditional" in your file, and draws one straight line through it.',
            '"Satisfactory," she says. "That is the most beautiful word in academia and nobody ever believes me." In the hallway, Tobias Wren is pretending to read a bulletin board. He gives you a thumbs-up without turning around.',
          ],
        },
        lifted_story: {
          speaker: 'Dr. Hargreave',
          text: [
            'You tell her about the kitchen table and the bus up the Hill and the nights. You don\'t make it sound better than it was, and you don\'t make it sound worse. She listens with her pen capped.',
            '"I have sat in this chair for nineteen years," she says at the end, "and I can tell the difference between a story and an excuse. That was a story." She uncaps the pen, finds the word "conditional" in your file, and draws one straight line through it.',
          ],
        },
        warning: {
          speaker: 'Dr. Hargreave',
          text: [
            'Halfway through the hardest problem your own handwriting stops making sense to you. You go back a step. Then two. The clock is very loud. She watches you find your way out of it, eventually, the long way around, and writes something down.',
            '"You got there," she says. "You got there slowly, and with help from the margin." She writes FINAL WARNING across the top of your file in green ink and underlines it twice. "Tutoring at the Academic Success Center, three evenings a week, for the rest of the year. It is not free. It is not optional. And if your grades slip one more term, this conversation is our last one."',
          ],
        },
        warning_story: {
          speaker: 'Dr. Hargreave',
          text: [
            'You tell her about home. It comes out wrong: too long in the wrong places, too short in the right ones. Halfway through you watch her gently slide the box of tissues half an inch toward you, which is worse than anything she could have said.',
            '"I believe you," she says. "I believe every student who sits there. It doesn\'t change the numbers." She writes FINAL WARNING across the top of your file in green ink. "Tutoring at the Academic Success Center, three evenings a week, at your expense. One more bad term and you are a very sympathetic former student."',
          ],
        },
        extended: {
          speaker: 'Dr. Hargreave',
          text: '"One term." She writes a date on a sticky note and presses it onto the front of your file. "Nobody asks for more time in this office. They ask for mercy. Time is braver." She closes the file. "Don\'t waste it. I will be here. So will the tissues."',
        },
      },
    },

    // ── Published alone: the research-integrity hearing ─────────────────────
    {
      id: 'lsu_governance_review',
      channel: 'dialog',
      title: 'Office of Research Integrity',
      start: 'room',
      nodes: {
        room: {
          speaker: 'narrator',
          text: [
            'Pell Hall, room 301, a Wednesday afternoon. A long table with a pitcher of water nobody touches. The Associate Provost, a statistics professor who keeps rubbing his eyes, a note-taker, and, at the end of the table in a suit that does not belong on the Hill, a lawyer named T. Pruitt, of Whitcombe & Vey, "attending on behalf of the Harbor Foundation as an interested party."',
            'Your paper is on the table in front of each of them. Someone has highlighted Record 40,117 in yellow.',
            { if: { npc: 'okoro', affinityGte: 30 }, text: 'Professor Okoro is in the back row with her arms folded and her reading glasses on top of her head. She wasn\'t invited. Nobody has asked her to leave.' },
          ],
          next: 'charge',
        },
        charge: {
          speaker: 'T. Pruitt',
          text: [
            '"Our concern is simple." Pruitt smiles the way a filing cabinet would smile. "The student signed a data-use agreement promising not to attempt re-identification of any subject. The paper is a detailed account of re-identifying subjects. We are not here to argue about the conclusions. We are here to discuss a breach of contract, and the University\'s exposure."',
            'The Associate Provost looks at you. "Would you like to respond?"',
          ],
          choices: [
            {
              text: 'Walk the panel through the method: the data was never anonymous. You didn\'t break the lock; you showed there wasn\'t one.',
              check: { skill: 'cryptography', dc: 15, bonuses: HEARING_BONUSES, success: 'cleared', fail: 'reprimand', successEffects: HEARING_CLEARED, failEffects: HEARING_REPRIMAND },
            },
            {
              text: 'Forget the math. Tell them who Record 40,117 is: a woman on the 14 bus, every other Tuesday.',
              check: { skill: 'social', dc: 15, bonuses: HEARING_BONUSES, success: 'cleared_story', fail: 'reprimand', successEffects: HEARING_CLEARED, failEffects: HEARING_REPRIMAND },
            },
            {
              text: 'Turn around and look at Professor Okoro.',
              tag: '[Okoro]',
              req: { npc: 'okoro', affinityGte: 30 },
              reqText: 'Requires Professor Okoro still on your side (affinity 30+)',
              effects: [...HEARING_CLEARED, { npc: 'okoro', fate: 'ally', affinity: 6 }, { flag: 'fac.lsu.okoro_testified' }],
              goto: 'okoro_stands',
            },
            {
              text: 'Sign the retraction Pruitt has so thoughtfully prepared. Keep your copy. Keep your record clean.',
              tag: '[Retract]',
              effects: [{ flag: 'fac.lsu.retracted' }, { faction: 'fac.aperture', add: 3 }, { stat: 'mood', add: -10 }, { npc: 'okoro', affinity: -3 }],
              goto: 'retracted',
            },
          ],
        },
        cleared: {
          speaker: 'narrator',
          text: [
            'You borrow the statistics professor\'s whiteboard. Ten minutes, no jargon, three columns: what the "anonymized" records contained, what any bus schedule contains, and the one line where they meet. The statistics professor stops rubbing his eyes around minute four. By minute eight he is nodding.',
            '"So the agreement," he says slowly, to Pruitt, "prohibits discovering that the agreement\'s central promise was false." Pruitt says that is a mischaracterization. The Associate Provost writes something down and underlines it. The finding, when it comes a week later, is "no violation." Pruitt\'s client is "disappointed."',
          ],
        },
        cleared_story: {
          speaker: 'narrator',
          text: [
            'You don\'t say her name. You don\'t have to. You say night shifts, and the pharmacy on Cannery Row, and the 14 bus, and a home connection that stays on while somebody sleeps, and you watch the note-taker stop taking notes.',
            '"Every one of those rows is somebody\'s Tuesday," you finish. "The Foundation paid to know them. I just said it out loud." The room is quiet for a long time. The finding, when it comes a week later, is "no violation." Pruitt\'s client is "disappointed."',
          ],
        },
        okoro_stands: {
          speaker: 'okoro',
          text: [
            'Okoro stands up in the back row before you finish turning around. "I am the principal investigator on that grant," she says, "and I refused to put my name on this paper. That was the most cowardly thing I have done since 1994. I would like to correct the record."',
            'She talks for eleven minutes without notes. The Harbor Foundation pulls her grant that evening. The finding, a week later, is "no violation." She frames both letters side by side in the CS basement, above the kettle, and pours you tea again.',
          ],
        },
        reprimand: {
          speaker: 'narrator',
          text: [
            'You get halfway through before Pruitt starts asking questions, polite and small and endless, each one a pebble in the gears. When did you first suspect the data could be re-identified? Before or after signing? Did you share the model with anyone? Is the copy you kept stored on University equipment? Every true answer sounds worse than the last.',
            'The finding comes a week later: "a breach of the data-use agreement, mitigated by the public interest." The paper stays pulled. Your transcript gets a formal reprimand and, for reasons the registrar cannot explain, an orange sticker. Your research assistantship ends that afternoon. You still have your copy. You keep three more after that, in three places, and you never again sign anything without reading every line.',
          ],
        },
        retracted: {
          speaker: 'narrator',
          text: [
            'Pruitt slides the retraction across the table with a pen that costs more than your tuition. You sign it. The paper becomes "withdrawn by the author pending methodological review," a phrase so boring it is basically invisible.',
            'Nobody writes anything in your file. On the way out, Pruitt holds the door for you. "Very sensible," he says. You still have your copy. You tell yourself that\'s the part that matters, all the way down the Hill.',
          ],
        },
      },
    },

    // ── Commencement ────────────────────────────────────────────────────────
    {
      id: 'lsu_commencement',
      channel: 'dialog',
      title: 'Commencement',
      start: 'quad',
      nodes: {
        quad: {
          speaker: 'narrator',
          text: [
            'The quad on the Hill, eleven a.m. The fog did not lift. Six hundred folding chairs, six hundred black gowns, a brass band playing the one march it knows. Your hat will not stay on. Nobody\'s hat stays on. It\'s tradition.',
            { if: { flag: 'fac.lsu.honors' }, text: 'When they read your name, they add "with departmental honors," and somebody in the family section makes a sound like a kettle.', else: 'When they read your name, somebody in the family section makes a sound like a kettle.' },
            { if: { all: [{ flag: 'fac.lsu.probation' }, { not: { flag: 'fac.lsu.final_warning' } }] }, text: 'The word "conditional" is not in your file anymore. You checked. Twice.' },
            { if: { flag: 'fac.lsu.final_warning' }, text: 'The word "conditional" is still in your file, under a final warning in the Associate Dean\'s handwriting. It will always be in your file. You are walking anyway. Tobias Wren, in the faculty rows, gives you a very small thumbs-up.' },
            { if: { flag: 'fac.lsu.reprimand' }, text: 'Your transcript has an orange sticker on it. The Office of Research Integrity said it would. Nobody said it would be orange.' },
            { if: { flag: 'fac.lsu.cleared_hearing' }, text: 'Somewhere in the crowd is the Harbor Foundation\'s lawyer from your hearing, attending a nephew\'s graduation. He sees you. He looks away first.' },
            { if: { flag: 'fac.lsu.retracted' }, text: 'Your thesis is listed in the program as "withdrawn." Nobody reads the program. You read it four times.' },
            { if: { obligation: TUTORING }, text: 'Your tutor from the Academic Success Center is in the family section, clapping harder than anyone. You are still paying her. It is the best money you have ever spent, and you will never tell her that.' },
            { if: { flag: 'fac.lsu.owe_doom' }, text: 'Doom finds you in the procession, gown ending at his shins, and hisses: "Fish tank. Sixty dollars. You still owe me." You have paid him back four times over in pie. It has never once counted.' },
            { if: { flag: 'fac.lsu.lent_pencil' }, text: 'Six names after yours: "Stanley Kowalczyk." The big man from the mill crosses the stage in a gown that ends at his knees and holds his diploma over his head like a trophy fish. When he passes your row, he pats his breast pocket. The pencil is still in it.' },
          ],
          next: 'family',
        },
        family: {
          speaker: 'narrator',
          text: [
            { if: { all: [{ var: 'w.mom_gone', eq: 0 }, { npc: 'mom', fateNot: 'estranged' }] }, text: 'Mom has a disposable camera and has used all twenty-four exposures before the procession ends. She is crying into Dad\'s good jacket. Dad is pretending he isn\'t, very badly. Kim is holding a poster board that says NERD in glitter glue, and under it, smaller: "(proud of u)."' },
            { if: { all: [{ var: 'w.mom_gone', eq: 0 }, { npc: 'mom', fate: 'estranged' }] }, text: 'Dad and Kim are in the third row. And at the back, by the gate, alone, in her good coat: Mom. She came. She watches you cross the stage with both hands over her mouth, and by the time you get back to the family section she\'s gone. There\'s a paper bag on your chair. An orange.' },
            { if: { var: 'w.mom_gone', eq: 1 }, text: 'Dad and Kim are in the third row. Between them is an empty folding chair with Mom\'s blue scarf folded on the seat. Kim saved it. She got there at seven a.m. to save it. When they read your name, Dad puts his hand flat on the scarf and keeps it there.' },
            { if: { npc: 'okoro', fate: 'ally' }, text: 'Professor Okoro finds you afterwards, in her academic robes, which make her look like a very small, very dangerous bishop. "We made a lot of important people uncomfortable," she says. "I haven\'t had this much fun since 1994."' },
            { if: { flag: 'fac.lsu.okoro_testified' }, text: '"No grant, no lab, no Foundation." She shrugs inside the robes. "They gave me a smaller office. It is next to the vending machine. I have never been happier to be punished."' },
            { if: { npc: 'okoro', fate: 'mentor' }, text: 'Professor Okoro finds you afterwards and presses an envelope into your hand: a reference letter, sealed. "Don\'t read it," she says. "It\'s embarrassing. I got carried away with the adjectives."' },
            { if: { all: [{ npc: 'okoro', fate: 'complicit' }, { not: { flag: 'fac.lsu.integrity_note' } }] }, text: 'Professor Okoro hugs you on the steps of Pell Hall and says "well done" into your shoulder. She doesn\'t quite meet your eye. Her reference letter is excellent. It is very, very respectable.' },
            { if: { flag: 'fac.lsu.integrity_note' }, text: 'Professor Okoro shakes your hand on the steps of Pell Hall, briefly, the way you shake hands at a funeral with someone you owe money. Her reference letter arrives a week later. It is two sentences long, and both of them are true.' },
          ],
          choices: [
            {
              text: 'Take everyone to the Cathode. Sal is expecting you. Sal is always expecting you.',
              effects: [{ flag: 'fac.lsu.graduated' }, { faction: 'fac.halcyon', add: 5 }, { faction: 'fac.hood', add: 5 }, { npc: 'mom', affinity: 5 }, { npc: 'dad', affinity: 5 }, { npc: 'kim', affinity: 5 }],
              goto: 'cathode',
            },
            {
              text: 'Find Professor Okoro in the crowd and thank her properly.',
              effects: [{ flag: 'fac.lsu.graduated' }, { faction: 'fac.halcyon', add: 8 }, { npc: 'okoro', affinity: 6 }],
              goto: 'thank_okoro',
            },
            {
              text: 'Throw your hat as high as it will possibly go.',
              effects: [{ flag: 'fac.lsu.graduated' }, { faction: 'fac.halcyon', add: 5 }, { stat: 'mood', add: 10 }, { stat: 'stress', add: -8 }],
              goto: 'hat',
            },
          ],
        },
        cathode: {
          speaker: 'sal',
          text: [
            'Sal has pushed three booths together and put a sign on them: RESERVED FOR THE GRADUATE (AND GUESTS) (NO HACKERS) (EXCEPT THE GRADUATE). There is a cake. The cake is shaped, approximately, like a diploma.',
            '"College," Sal says, cutting you the corner piece. "In my day you learned a trade from a guy who hated you. Now you pay the guy." He sets the plate down. "Eat. You look like a graduate. It\'s a good look. Keep it."',
          ],
        },
        thank_okoro: {
          speaker: 'okoro',
          text: '"Don\'t thank me. Thank the part of you that was wrong in interesting ways." She straightens your hat, which immediately falls off again. "You\'ll write to me. Letters, not those email things. I want your handwriting when you\'re thirty, so I can see what the world did to it." She\'ll forward your name to three companies that afternoon. You won\'t find out for a year.',
        },
        hat: {
          speaker: 'narrator',
          text: 'Six hundred hats go up into the fog and simply vanish into it, all at once, like the Hill swallowed them. For one second nobody has a hat and everybody is looking up. Then they start coming down, all over the quad, on strangers, on parents, in the fountain. You never get yours back. The one that lands in your hands has a name written inside the brim: WREN, T. — Ph.D. Tobias the proctor finally finished. You keep it anyway.',
        },
      },
    },
  ],

  triggers: [
    // Admissions writes (again) while the arc is waiting for you.
    {
      id: 'trig_lsu_admissions',
      when: { all: [{ quest: 'edu_lsu_q1_exam', status: 'active', stage: 'apply' }, { not: { enrolled: true } }] },
      once: false,
      cooldownDays: 150,
      atHour: 9,
      effects: [{ scene: 'lsu_admissions_mail' }],
    },
    // Days enrolled at LSU — paces Okoro and the thesis.
    { id: 'trig_lsu_day', when: atLsu, once: false, cooldownDays: 1, atHour: 12, effects: [{ var: 'fac.lsu.days', add: 1 }] },
    // Left school (dropout / expelled) mid-arc: the open LSU beats close.
    {
      id: 'trig_lsu_left_school',
      when: {
        all: [
          { any: [{ quest: 'edu_lsu_q2_prof', status: 'active' }, { quest: 'edu_lsu_q3_thesis', status: 'active' }] },
          { not: atLsu },
          { not: lsuGraduate },
        ],
      },
      once: false,
      cooldownDays: 1,
      effects: [
        failIfActive('edu_lsu_q2_prof'),
        failIfActive('edu_lsu_q3_thesis'),
        { log: 'You left Lumen State. The key on the red yarn goes back in Okoro\'s drawer.', kind: 'story' },
      ],
    },
  ],
})
