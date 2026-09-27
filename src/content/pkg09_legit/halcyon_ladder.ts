/**
 * PKG-09 — Halcyon, part 1: "Vesting Schedule" (bible §7.4 steps 1–2, §3 F4).
 *
 *  - `fac_halcyon_q1_interview` — journal-only mirror of the main_a2_q2 interview (owns no
 *    effects and no scenes; completes on `fac.halcyon.employed`).
 *  - `fac_halcyon_q2_ship_it`   — crunch comedy, the 2 a.m. ship night, the review and options.
 *  - Glue triggers: the employed flag (single source for everyone who reads it), Halcyon's
 *    repeatable rep source (+2 per job level on the Halcyon ladder), benefits at Trusted (50),
 *    IPO morning + the lockup expiry, and the "moonlighting" HR warning.
 *
 * Options are tracked as tranches in the var `fac.halcyon.options` (0–3; one tranche = 4,000
 * options). Their cash value depends on `w.halcyon_state` at the moment you sell — the §3
 * "money time-bomb".
 */
import { defineContent } from '@/engine/registry'
import type { BuffDef, Cond, Effect, TextPart, TriggerDef } from '@/engine/types'

const HALCYON_JOB = 'job_halcyon_junior'

/** Pay out every held tranche at `perTranche` dollars, then zero the grant. */
function payTranches(perTranche: number): Effect[] {
  return [
    {
      if: { var: 'fac.halcyon.options', gte: 3 },
      then: [{ money: perTranche * 3 }],
      else: [
        {
          if: { var: 'fac.halcyon.options', eq: 2 },
          then: [{ money: perTranche * 2 }],
          else: [{ if: { var: 'fac.halcyon.options', eq: 1 }, then: [{ money: perTranche }] }],
        },
      ],
    },
    { var: 'fac.halcyon.options', set: 0 },
  ]
}

/** Sell at whatever the market says today. */
const SELL_AT_MARKET: Effect[] = [
  {
    if: { flag: 'w.halcyon_state', eq: 'rising' },
    then: payTranches(9000),
    else: [
      {
        if: { flag: 'w.halcyon_state', eq: 'clean' },
        then: payTranches(5000),
        else: [
          {
            if: { flag: 'w.halcyon_state', eq: 'wobble' },
            then: payTranches(3000),
            else: [{ var: 'fac.halcyon.options', set: 0 }],
          },
        ],
      },
    ],
  },
  { flag: 'fac.halcyon.sold_at_lockup' },
]

const OPTION_LINES: TextPart[] = [
  { if: { var: 'fac.halcyon.options', gte: 3 }, text: 'You hold three tranches: twelve thousand options. On paper that is a small house on the Hill, or a very large boat that would sink in the Sound.' },
  { if: { var: 'fac.halcyon.options', eq: 2 }, text: 'You hold two tranches: eight thousand options. On paper that is a good car and a year of not worrying about rent.' },
  { if: { var: 'fac.halcyon.options', eq: 1 }, text: 'You hold one tranche: four thousand options. On paper that is a used car with a working tape deck.' },
]

/** Halcyon's repeatable rep source (§3): +2 per level gained on the Halcyon ladder. */
const reviewTriggers: TriggerDef[] = Array.from({ length: 12 }, (_, i): TriggerDef => ({
  id: `trig_halcyon_review_${i + 1}`,
  when: { jobLevel: HALCYON_JOB, gte: i + 1 },
  effects: [{ faction: 'fac.halcyon', add: 2 }],
}))

const onHalcyonPayroll: Cond = { job: HALCYON_JOB }

/** The ship-night failure's long tail: Meridian runs on the broken build and pages you about it. */
const MERIDIAN_PAGER: BuffDef = {
  id: 'hal_meridian_pager',
  name: 'Meridian\'s Pager',
  desc: 'Harold Ogilvie has your pager number and a bank full of software that believes in Tuesday. Your nights are not your own.',
  days: 60,
  bad: true,
  mods: [
    { key: 'stress.gain', mult: 1.12 },
    { key: 'energy.regen', mult: 0.94 },
  ],
}

const TUESDAY_DONE: Effect[] = [{ removeBuff: 'hal_meridian_pager' }, { flag: 'fac.halcyon.tuesday_done' }]

export default defineContent({
  traits: [
    {
      id: 'pkg09_legit_tuesday',
      name: 'The Tuesday Build',
      desc: 'At Halcyon your name became a verb: to ship something that says "Tuesday." Every performance review since has opened with the story, and promotions come slower when the room is laughing.',
      scar: true,
      bad: true,
      mods: [{ key: 'jobXp', mult: 0.9 }],
    },
  ],

  quests: [
    // ── Step 1: journal-only mirror of the main_a2_q2 interview ─────────────
    {
      id: 'fac_halcyon_q1_interview',
      title: 'The Interview',
      kind: 'faction',
      act: 2,
      faction: 'fac.halcyon',
      giver: 'priya',
      priority: 20,
      summary:
        'Halcyon Systems is the dot-com that survived the bust: exposed brick, free soda, an atrium with a koi pond and a CEO on the cover of Port Lumen Business Weekly. Everybody in the city wants a Halcyon badge. You might be able to get one.',
      rewards: 'A junior developer job, a badge, and the Halcyon ladder',
      autoStart: {
        all: [
          { var: 'act', gte: 2 },
          {
            any: [
              { faction: 'fac.halcyon', gte: 20 },
              { flag: 'a1.job_started' },
              { degree: true },
              { flag: 'fac.halcyon.employed' },
            ],
          },
        ],
      },
      start: 'hired',
      stages: {
        hired: {
          text: [
            'Halcyon is hiring again, and your name has come up in rooms you have never been in. Your legit résumé is short but real, and somewhere on the fourth floor of the Millgate lofts, Priya Raman has been quietly mentioning you.',
            { if: { flag: 'a1.job_started' }, text: 'Word is Dee Briggs landed there too after the CompCastle layoffs, as office manager. The supply closet reportedly has a sign-out sheet now.' },
          ],
          objectives: [
            {
              id: 'employed',
              text: 'Get hired at Halcyon Systems',
              when: { flag: 'fac.halcyon.employed' },
              hint: 'Take the interview Priya sets up when she comes looking for you, or apply for the junior developer opening on the Job board once Halcyon knows your name.',
            },
          ],
        },
      },
    },

    // ── Step 2: Ship It ─────────────────────────────────────────────────────
    {
      id: 'fac_halcyon_q2_ship_it',
      title: 'Ship It',
      kind: 'faction',
      act: 2,
      faction: 'fac.halcyon',
      giver: 'priya',
      priority: 20,
      summary:
        'Beacon 2.0 — "project management for the connected enterprise" — ships this quarter or Marcus Vale dies trying, and he would prefer it was somebody else who died. Welcome to crunch.',
      rewards: 'A promotion, stock options, Halcyon rep',
      autoStart: { all: [{ flag: 'fac.halcyon.employed' }, { jobLevel: HALCYON_JOB, gte: 1 }] },
      start: 'crunch',
      stages: {
        crunch: {
          text: 'You have a badge, an ergonomic chair that squeaks in B-flat, and a desk under a banner that reads SHIP IT. Beacon 2.0 is due at the end of the quarter. Nobody has gone home before nine since Tuesday.',
          onEnter: [
            { scene: 'hal_dee_memo' },
            { scene: 'hal_allhands', delayHours: 72 },
          ],
          objectives: [
            {
              id: 'allhands',
              text: 'Survive your first Halcyon all-hands',
              when: { seen: 'hal_allhands' },
              hint: 'Marcus Vale holds court in the atrium on Friday. Attendance is mandatory. Enthusiasm is strongly encouraged.',
            },
            {
              id: 'grind',
              text: 'Grind through crunch (reach Halcyon job level 5)',
              when: { jobLevel: HALCYON_JOB, gte: 5 },
              progress: { of: { jobLevel: HALCYON_JOB }, target: 5 },
              hint: 'Work your Halcyon shifts. Crunch is measured in pizza boxes; job level is measured in the Jobs window.',
            },
          ],
          onComplete: [{ scene: 'hal_ship_night' }],
          next: 'ship_night',
        },
        ship_night: {
          text: 'It is 2 a.m. the night before the Meridian Trust demo, and Beacon 2.0 has decided that every task in every project is due on the first of January, 1970.',
          objectives: [
            {
              id: 'shipped',
              text: 'Get through ship night',
              when: { flag: 'fac.halcyon.ship_night_done' },
              hint: 'Answer the ship-night dialog. There is more than one way to save a demo, and one way to not save it honestly.',
            },
          ],
          onComplete: [{ scene: 'hal_review', delayHours: 36 }],
          next: 'review',
        },
        review: {
          text: [
            { if: { flag: 'fac.halcyon.shipped' }, text: 'Beacon shipped, and it worked, and a bank bought it. Vale wants to see you in the glass conference room everyone calls the Fishbowl.', else: 'Beacon shipped, in the sense that it left the building. Vale wants to see you in the glass conference room everyone calls the Fishbowl.' },
          ],
          objectives: [
            {
              id: 'reviewed',
              text: 'Sit your first performance review',
              when: { flag: 'fac.halcyon.reviewed' },
              hint: 'Answer the review dialog in the Fishbowl.',
            },
          ],
        },
      },
    },

    // ── Ship night went wrong: the Tuesday build goes live at a bank ────────
    {
      id: 'fac_halcyon_tuesday_build',
      title: 'Complication: The Tuesday Build',
      kind: 'personal',
      act: 2,
      faction: 'fac.halcyon',
      giver: 'vale',
      priority: 18,
      summary:
        'Beacon crashed in front of Meridian Trust, and Meridian bought it anyway. Now a bank runs its whole rollout on a build that believes, deep down, in Tuesday. Guess whose pager number is taped to Harold Ogilvie\'s monitor.',
      rewards: 'Your nights back, and maybe your name',
      start: 'on_call',
      stages: {
        on_call: {
          text: 'Meridian Trust is live on the Tuesday build. When it misbehaves, and it does, Harold Ogilvie pages you: at dinner, at 3 a.m., once during a wedding. Until somebody fixes it for real, your nights belong to a bank.',
          onEnter: [{ buff: MERIDIAN_PAGER }, { scene: 'hal_tuesday_ogilvie', delayHours: 24 * 21 }],
          objectives: [
            {
              id: 'dealt',
              text: 'Deal with Meridian\'s Tuesday problem',
              when: { flag: 'fac.halcyon.tuesday_done' },
              hint: 'Harold Ogilvie will write to you when his patience runs out. Answer him: fix it yourself, tell him the truth, or hand him to Vale.',
            },
          ],
        },
      },
    },
  ],

  scenes: [
    // ── Dee's welcome memo ──────────────────────────────────────────────────
    {
      id: 'hal_dee_memo',
      channel: 'mail',
      title: 'WELCOME TO HALCYON (read ALL of it)',
      from: 'dee',
      start: 'memo',
      nodes: {
        memo: {
          effects: [{ npc: 'dee', met: true }],
          text: [
            { if: { flag: 'a1.job_started' }, text: 'Well well WELL. Look who followed me up the ladder. I told Marcus I trained you personally and he said "who?" and I said "exactly, he\'s that good."', else: 'Hello and welcome! I am Dolores Briggs, Office Manager, and you may call me Dee, and you may NOT call me "the office lady."' },
            'Some things you need to know about Halcyon, in order of importance:',
            '1. The supply closet has a sign-out sheet. The sign-out sheet has a sign-out sheet. Pens are not free just because the soda is free.\n2. The koi in the atrium are named Synergy, Bandwidth and Gerald. Do NOT feed Gerald. Gerald knows what he did.\n3. The foosball table is on the org chart. It reports to Engineering. Do not ask me why, it was like that when I got here.\n4. Crunch is not an emergency. Crunch is a lifestyle. Eat something green once a week.\n5. If Marcus says "moonshot" in a meeting, write down the date. HR tracks it.',
            'Your badge photo was taken at 4:55 on a Friday and it shows. There is nothing I can do. It is laminated now.',
            '— Dee Briggs\nOffice Manager, Halcyon Systems\n"Healing the Customer Since 1991"',
          ],
          choices: [
            { text: 'Reply: "Yes, Dee."', effects: [{ npc: 'dee', affinity: 2 }], goto: 'yes_dee' },
            { text: 'Reply: "Who does the foosball table report to, exactly?"', effects: [{ npc: 'dee', affinity: 1 }], goto: 'foosball' },
          ],
        },
        yes_dee: {
          text: 'Good answer. You would be amazed how many software engineers can\'t manage two words. There is a donut in the break room with your name on it. Literally. I wrote on it. Nobody else will touch it now.\n\n— D.',
        },
        foosball: {
          text: 'It reports to the VP of Engineering, who reports to Marcus, who reports to "the future." I asked the future for a bigger coffee budget and the future said no.\n\nWelcome aboard, smartypants.\n\n— D.',
        },
      },
    },

    // ── Vale's all-hands ────────────────────────────────────────────────────
    {
      id: 'hal_allhands',
      channel: 'dialog',
      title: 'All-Hands: The Future Is a Verb',
      start: 'atrium',
      nodes: {
        atrium: {
          speaker: 'narrator',
          text: [
            'Friday, 4 p.m. The whole company crowds the atrium around the koi pond, holding free soda like candles at a vigil. Somebody has rented a fog machine. It is on, a little.',
            'Marcus Vale bounds onto the edge of the pond in a black turtleneck and white sneakers and does not fall in, which feels planned.',
          ],
          next: 'vale_speech',
        },
        vale_speech: {
          speaker: 'vale',
          text: [
            '"People ask me: Marcus, the bust took half this street. Why is Halcyon still standing? And I tell them: because we are not selling software."',
            '"We are selling the feeling that the future already arrived and you are standing in it. Beacon 2.0 is that feeling, with Gantt charts. It ships in six weeks. And then —" he points at the ceiling, which has exposed ductwork — "moonshot."',
            'Across the crowd, Dee writes something down.',
          ],
          choices: [
            { text: 'Applaud like it\'s your job. (It is.)', effects: [{ faction: 'fac.halcyon', add: 2 }], goto: 'applause' },
            {
              text: '"What\'s our burn rate?"',
              check: {
                skill: 'business',
                dc: 12,
                success: 'burn_good',
                fail: 'burn_bad',
                successEffects: [{ flag: 'fac.halcyon.asked_burn' }, { faction: 'fac.halcyon', add: 1 }, { npc: 'priya', affinity: 2 }],
                failEffects: [
                  { flag: 'fac.halcyon.asked_burn' },
                  { flag: 'fac.halcyon.burn_rate_nick' },
                  { faction: 'fac.halcyon', add: -2 },
                  { stat: 'mood', add: -4 },
                  { stat: 'stress', add: 3 },
                ],
              },
            },
            { text: 'Find Priya in the back and stand next to her.', effects: [{ npc: 'priya', affinity: 3 }], goto: 'priya_back' },
            { text: 'Drift toward the snack table during the moonshot slide.', goto: 'snacks' },
          ],
        },
        applause: {
          speaker: 'narrator',
          text: 'You clap. The people near you clap harder, because you started it. Vale finds your face in the crowd and points at you like you are a verb too. For one second you feel the future arrive. It smells like fog-machine glycol.',
          next: 'close',
        },
        burn_good: {
          speaker: 'vale',
          text: [
            'The atrium goes quiet enough to hear Gerald the koi surface. Vale smiles with every tooth.',
            '"Great question. The answer is: we burn bright." Laughter. He moves on. But on the way out, the CFO, a thin woman named Anneliese Crane, looks at you for a long second and gives you the smallest nod anyone has ever given anyone.',
          ],
          next: 'close',
        },
        burn_bad: {
          speaker: 'vale',
          text: [
            'It comes out as "what\'s our burn... thing... rate," at a volume meant for a much smaller room.',
            '"Somebody\'s been reading the business pages!" Vale says, delighted, and the whole atrium laughs, and you laugh too, because the alternative is walking into the koi pond. For a week people call you "Burn Rate." Priya calls you "Burn Rate" for considerably longer.',
          ],
          next: 'close',
        },
        priya_back: {
          speaker: 'priya',
          text: [
            'Priya is leaning on a pillar with her arms folded and her WORLD\'S OKAYEST ENGINEER mug. She doesn\'t look at you.',
            '"Rule one of all-hands meetings: count the exits, and count how many times he says \'future.\' I\'m at eleven." A beat. "Twelve."',
          ],
          next: 'close',
        },
        snacks: {
          speaker: 'narrator',
          text: 'The snack table has four kinds of hummus and a sculpture of the Halcyon logo carved out of cheese. Two senior engineers are hiding behind it, eating the logo. One of them offers you a piece of the "H" without breaking eye contact. You are one of them now.',
          next: 'close',
        },
        close: {
          speaker: 'narrator',
          text: 'The all-hands ends with a slide that just says SHIP IT in letters four feet high, and a hundred people walk back to their desks to do exactly that, at 5 p.m. on a Friday, which tells you everything about crunch.',
        },
      },
    },

    // ── Ship night ──────────────────────────────────────────────────────────
    {
      id: 'hal_ship_night',
      channel: 'dialog',
      title: 'Ship Night',
      start: 'two_am',
      nodes: {
        two_am: {
          speaker: 'narrator',
          text: [
            '1:52 a.m., the third-floor war room. Pizza boxes stacked like geological strata. The demo for Meridian Trust\'s digital banking team is at 9 a.m. Priya went home at midnight "to sleep for the first time since the last millennium."',
            'You load the demo build one last time. Beacon 2.0 opens, beautiful, and cheerfully reports that every task in every project is due on the first of January, 1970. The whole Meridian rollout plan, according to Beacon, was due before anyone in the building was born.',
          ],
          choices: [
            {
              text: 'Find the bug yourself. It\'s in the date handling. It\'s always in the date handling.',
              check: {
                skill: 'programming',
                dc: 14,
                bonuses: [{ if: { background: 'mathlete' }, add: 1, label: '+1 you dream in edge cases' }],
                success: 'fixed_code',
                fail: 'fixed_tuesday',
              },
            },
            {
              text: 'Roll the demo server back to last Tuesday\'s build and patch the settings by hand.',
              check: {
                skill: 'systems',
                dc: 14,
                bonuses: [{ if: { background: 'tinkerer' }, add: 2, label: '+2 basement tinkerer' }],
                success: 'rolled_back',
                fail: 'acme',
              },
            },
            {
              text: 'Call Priya. At 2 a.m. Pray.',
              check: {
                skill: 'social',
                dc: 13,
                bonuses: [{ if: { npc: 'priya', affinityGte: 40 }, add: 2, label: '+2 she actually likes you' }],
                success: 'priya_arrives',
                fail: 'priya_hangs_up',
              },
            },
            { text: 'Call Vale and tell him the truth: it won\'t be ready.', goto: 'tell_vale' },
          ],
        },
        fixed_code: {
          speaker: 'narrator',
          text: 'Forty minutes of reading code at the speed of dread, and there it is: a date that was never set, defaulting quietly to the beginning of time. You fix it with a one-line change and stare at it for another twenty minutes, afraid to breathe near it. At 3:10 a.m. every task in the Meridian plan is due on a real day. You fall asleep under your desk holding a pizza crust like a teddy bear.',
          next: 'demo_good',
        },
        fixed_tuesday: {
          speaker: 'narrator',
          text: 'You find the bug. You fix the bug. You have, it turns out, fixed it in the way a hammer fixes a watch: every task in every project is now due "Tuesday." Not a date. Just the word. Beacon is extremely sure about Tuesday. It is 4:40 a.m. and there is no more time.',
          next: 'demo_wobbly',
        },
        rolled_back: {
          speaker: 'narrator',
          text: 'Last Tuesday\'s build boots clean. You spend two hours copying settings by hand from a sticky note someone left on the server that says DO NOT TOUCH (TOUCHED). At 4 a.m. the demo box hums, every date correct, like nothing ever happened. You name the server in the logs "Lazarus." Nobody will ever know.',
          next: 'demo_good',
        },
        acme: {
          speaker: 'narrator',
          text: 'The rollback works perfectly and eats the entire demo database on its way through. The Meridian sample data is gone. At 5 a.m. you rebuild it by hand, from memory, as a fictional company called ACME Widgets whose every project manager is named after a member of your family. Kim is Head of Logistics. It will have to do.',
          next: 'demo_wobbly',
        },
        priya_arrives: {
          speaker: 'priya',
          text: [
            'She picks up on the fourth ring. There is a long silence. "Is anything on fire?" No. "Is it the date handling?" Yes. "I\'m bringing pho."',
            'Priya arrives at 2:40 in pajama pants and a parka, sets two soups on the desk, and fixes it in eleven minutes while explaining what she\'s doing in short, terrifying sentences. Then she sits back.',
            '"Rule three: never let the demo know it\'s a demo. Now eat your soup, go home, shower, and come back looking like you slept."',
          ],
          effects: [{ npc: 'priya', affinity: 4 }],
          next: 'demo_good',
        },
        priya_hangs_up: {
          speaker: 'priya',
          text: [
            'She picks up on the eighth ring, says "no," and hangs up. Ninety seconds later your pager buzzes: "rule four: you can do this. dont call me again. soup is in the fridge on 2."',
            'There is, in fact, soup on the second floor. It is cold, and it is the best thing you have ever eaten. It is also 3:05 a.m., and you have spent forty minutes of the night you did not have. Okay. Round two.',
          ],
          effects: [{ npc: 'priya', affinity: -2 }, { stat: 'stress', add: 4 }, { flag: 'fac.halcyon.woke_priya' }],
          choices: [
            {
              text: 'Go back into the code, slower this time.',
              check: { skill: 'programming', dc: 12, success: 'fixed_code', fail: 'fixed_tuesday' },
            },
            {
              text: 'Forget the code — rebuild the demo box from last Tuesday.',
              check: { skill: 'systems', dc: 12, success: 'rolled_back', fail: 'acme' },
            },
          ],
        },
        tell_vale: {
          speaker: 'vale',
          text: [
            'Vale answers on the first ring. There is jazz and ice and water behind him; he is at the Yacht Club, or on a boat, or on a boat at the Yacht Club.',
            'You explain. He listens without a word. Then: "Okay. Here\'s what we do. We don\'t demo the product. We demo the vision." He hangs up. At 9 a.m. he gives the Meridian team forty minutes of slides about the future, a clip of a sunrise, and one screenshot. They sign a letter of intent before lunch.',
          ],
          effects: [
            { flag: 'fac.halcyon.told_truth' },
            { flag: 'fac.halcyon.ship_night_done' },
            { faction: 'fac.halcyon', add: 2 },
            { npc: 'priya', affinity: 3 },
            { stat: 'stress', add: -4 },
          ],
          next: 'vision_after',
        },
        vision_after: {
          speaker: 'priya',
          text: '"You called him and told him the truth." Priya is looking at you like you are a rare bird. "In six years at this company, I have never seen that work. Don\'t get used to it." She finishes shipping the real build herself by Thursday and puts your name on the release notes anyway.',
        },
        demo_good: {
          speaker: 'narrator',
          text: [
            '9 a.m., the Fishbowl. Meridian Trust sends a VP of Digital Banking named Harold Ogilvie, who has the face of a man who has been demoed to before. Vale drives. Beacon 2.0 performs like it rehearsed. Ogilvie asks for the pricing sheet before the second coffee.',
            'On the way out, Vale claps you on the shoulder in front of everyone. "This one," he tells the room, "is the future." He has no idea what you did last night. That is, you are learning, how it works.',
          ],
          effects: [
            { flag: 'fac.halcyon.shipped' },
            { flag: 'fac.halcyon.ship_night_done' },
            { faction: 'fac.halcyon', add: 5 },
            { jobXp: HALCYON_JOB, add: 120 },
            { xp: 'programming', add: 60 },
          ],
        },
        demo_wobbly: {
          speaker: 'narrator',
          text: [
            '9 a.m., the Fishbowl. Meridian Trust sends a VP of Digital Banking named Harold Ogilvie. Eight minutes in, Beacon freezes, displays a dialog box that just says "Tuesday," and quietly closes itself.',
            'Vale doesn\'t blink. "And that," he says, "is graceful degradation. When Beacon detects uncertainty, it steps back and lets the humans lead." Ogilvie nods slowly, deeply moved. The bank buys it. You go to the bathroom and sit in a stall for a while.',
          ],
          effects: [
            { flag: 'fac.halcyon.demo_crashed' },
            { flag: 'fac.halcyon.ship_night_done' },
            { faction: 'fac.halcyon', add: 2 },
            { jobXp: HALCYON_JOB, add: 60 },
            { stat: 'stress', add: 6 },
          ],
          next: 'vale_pager',
        },
        vale_pager: {
          speaker: 'vale',
          text: [
            'Vale finds you by the elevators afterwards. He is still smiling, the way a lighthouse is still lit.',
            '"Graceful degradation bought us a signature. It did not buy us a product." He takes out one of his business cards, writes your pager number on the back in fountain pen, and hands it to Ogilvie\'s assistant as she passes. "Meridian goes live on the Tuesday build next month. When it does Tuesday things, Harold is going to need a name to call."',
            '"Congratulations. The name is yours."',
          ],
          effects: [{ quest: 'fac_halcyon_tuesday_build', start: true }],
        },
      },
    },

    // ── The Tuesday build: Harold Ogilvie runs out of patience ──────────────
    {
      id: 'hal_tuesday_ogilvie',
      channel: 'mail',
      title: 'Re: Re: Re: Beacon — "Tuesday" (URGENT, again)',
      from: 'Harold Ogilvie (Meridian Trust)',
      start: 'letter',
      nodes: {
        letter: {
          text: [
            'Good evening.',
            'Every Tuesday at approximately 9:40 a.m., Beacon informs two hundred and twelve members of my staff that all of their deadlines are "Tuesday." Last week it informed our auditors. Our auditors have begun to take it personally.',
            'Mr. Vale assures me this is "the product finding its rhythm." I have been in banking for thirty-one years. I know what a rhythm sounds like, and I know what a man tapping his foot to stall for time sounds like.',
            { if: { not: { job: HALCYON_JOB } }, text: 'I understand you are no longer with Halcyon. Your pager number, however, is still taped to my monitor, and you are still the only person there who has ever answered it.' },
            'I would like this to stop. I would like someone to tell me when it will stop. I am writing to you because you are the name I was given.',
            'Harold Ogilvie\nVice President, Digital Banking\nMeridian Trust — "Steady Since 1911"',
          ],
          choices: [
            {
              text: 'Fix it properly. Nights, off the books, until the word "Tuesday" never appears on a Meridian screen again.',
              check: {
                skill: 'programming',
                dc: 15,
                bonuses: [
                  { if: { background: 'mathlete' }, add: 1, label: '+1 you dream in edge cases' },
                  { if: { npc: 'priya', affinityGte: 40 }, add: 2, label: '+2 Priya leaves notes in the margins' },
                ],
                success: 'patched',
                fail: 'patch_worse',
                successEffects: [...TUESDAY_DONE, { flag: 'fac.halcyon.tuesday_fixed' }, { faction: 'fac.halcyon', add: 3 }, { xp: 'programming', add: 80 }, { stat: 'energy', add: -15 }],
                failEffects: [
                  ...TUESDAY_DONE,
                  { flag: 'fac.halcyon.tuesday_scapegoat' },
                  { trait: 'pkg09_legit_tuesday' },
                  { faction: 'fac.halcyon', add: -5 },
                  { stat: 'stress', add: 10 },
                ],
              },
            },
            {
              text: 'Tell him the truth: it shipped broken, here is exactly why, and here is the workaround until it\'s fixed.',
              tag: '[Honest]',
              effects: [...TUESDAY_DONE, { flag: 'fac.halcyon.told_ogilvie' }, { faction: 'fac.halcyon', add: -6 }, { stat: 'stress', add: -4 }],
              goto: 'truth',
            },
            {
              text: 'Forward it to Vale. Let the vision guy sell him a vision.',
              effects: [{ flag: 'fac.halcyon.tuesday_done' }, { flag: 'fac.halcyon.passed_tuesday' }, { npc: 'priya', affinity: -3 }, { faction: 'fac.halcyon', add: 2 }],
              goto: 'forwarded',
            },
          ],
        },
        patched: {
          text: [
            'Two weeks of nights in the Meridian data room, which smells of carpet glue and old money. You find the date handling. It is always the date handling. This time you fix it in the way a watchmaker fixes a watch.',
            'Ogilvie\'s reply is one line, on bank letterhead, delivered by courier because he is that kind of man: "It is Wednesday. Beacon agrees. Thank you. — H.O."',
          ],
        },
        patch_worse: {
          text: [
            'Your patch goes live on Thursday night. On Friday morning Meridian runs its month-end close, and every loan officer at the Harbor Point branch is informed, with the added conviction of a program that has been corrected, that their reports are due "Tuesday."',
            'Ogilvie calls Vale. Vale calls a meeting. At the meeting Vale explains to Meridian\'s CIO, calmly and generously, with one hand resting on your shoulder, exactly whose patch it was.',
            'By Monday the story is all over the third floor. By the end of the month engineers at three other companies know it. Your name has become a verb: to ship something that says Tuesday. Priya, to her credit, never once uses it. Everyone else does.',
          ],
        },
        truth: {
          text: [
            'Dear {name},',
            'Thank you. In thirty-one years, nobody in your industry has told me the truth before five in the afternoon. I have forwarded your workaround to my staff, and your letter to nobody at all.',
            'Mr. Vale was less grateful. I gather he called you "disloyal" to my assistant, in a voice he believed was quiet. I have made a note of which of you I would hire.',
            'H.O.',
          ],
        },
        forwarded: {
          text: [
            'Vale\'s reply comes back in four minutes, cc: everyone. "Harold! Great news: Beacon 2.1 is going to be transformational for Meridian. Loop in Priya for the details."',
            'Priya fixes it three weeks later, on her own time, and never mentions it. The pager keeps buzzing until she does. On the night it stops, you find a sticky note on your monitor in her handwriting: "you owe me a pho. a big one. — P."',
          ],
        },
      },
    },

    // ── The review ──────────────────────────────────────────────────────────
    {
      id: 'hal_review',
      channel: 'dialog',
      title: 'The Fishbowl',
      start: 'fishbowl',
      nodes: {
        fishbowl: {
          speaker: 'vale',
          text: [
            'The Fishbowl is a glass box in the middle of the fourth floor, so everyone can watch you get reviewed. Vale sits on the table instead of a chair. Priya sits in a chair, with a folder she hasn\'t opened.',
            { if: { flag: 'fac.halcyon.burn_rate_nick' }, text: '"Burn Rate!" Vale says warmly as you come in, and two people outside the glass turn to look. "Sit, sit."' },
            { if: { flag: 'fac.halcyon.shipped' }, text: '"Meridian signed. Ogilvie called me personally to say Beacon made him feel \'on top of it.\' Do you know how hard it is to make a banker feel on top of anything?"' },
            { if: { flag: 'fac.halcyon.demo_crashed' }, text: '"Graceful degradation. I\'ve used it in three pitches since. Two of them closed. You gave me that. Accidentally, but you gave it to me."' },
            { if: { quest: 'fac_halcyon_tuesday_build', status: 'active' }, text: '"Also, Harold Ogilvie tells me you\'re his favorite pager number." He says it like a compliment. Priya\'s pen stops tapping for a second.' },
            { if: { flag: 'fac.halcyon.told_truth' }, text: '"You called me at two in the morning and told me it was broken. Nobody tells me anything is broken. I found it... bracing."' },
            '"So. Software Engineer II. A raise. And four thousand options, vesting over four years, one-year cliff. In a year those options are a car. In three, they\'re a house." He spreads his hands. "Welcome to the future. Sign here."',
          ],
          choices: [
            {
              text: '"Thank you. I\'m in."',
              effects: [{ var: 'fac.halcyon.options', add: 1 }, { faction: 'fac.halcyon', add: 5 }, { jobXp: HALCYON_JOB, add: 200 }],
              goto: 'signed',
            },
            {
              text: '"Make it eight thousand and I\'ll stop reading the job boards."',
              check: {
                skill: 'business',
                dc: 14,
                bonuses: [{ if: { background: 'class_clown' }, add: 1, label: '+1 you can sell ice to a koi' }],
                success: 'doubled',
                fail: 'no_lol',
                successEffects: [{ var: 'fac.halcyon.options', add: 2 }, { faction: 'fac.halcyon', add: 3 }, { jobXp: HALCYON_JOB, add: 200 }],
                failEffects: [
                  { var: 'fac.halcyon.options', add: 1 },
                  { faction: 'fac.halcyon', add: 1 },
                  { jobXp: HALCYON_JOB, add: 120 },
                  { flag: 'fac.halcyon.pushed_vale' },
                  { stat: 'stress', add: 4 },
                  { chance: 0.3, then: [{ complication: 'work' }] },
                ],
              },
            },
            {
              text: '"Could I get that as cash instead?"',
              effects: [{ money: 2500 }, { faction: 'fac.halcyon', add: 2 }, { jobXp: HALCYON_JOB, add: 200 }],
              goto: 'cash',
            },
            { text: '"Before I sign: what\'s the \'strategic data partnership\' line on the revenue slide?"', goto: 'partnership' },
          ],
        },
        partnership: {
          speaker: 'vale',
          text: [
            'Vale\'s smile doesn\'t move at all, which is how you know it\'s working hard. "Our biggest customer. They\'re shy. Big organizations like to keep their tools quiet. You\'d be amazed who runs on Beacon."',
            'Priya\'s pen, which has been tapping, stops.',
            '"Anyway." He slides the paper over. "Four thousand options."',
          ],
          effects: [{ flag: 'fac.halcyon.noticed_partnership' }],
          choices: [
            {
              text: '"Okay. I\'m in."',
              effects: [{ var: 'fac.halcyon.options', add: 1 }, { faction: 'fac.halcyon', add: 5 }, { jobXp: HALCYON_JOB, add: 200 }],
              goto: 'signed',
            },
            {
              text: '"Cash, please. I like things I can hold."',
              effects: [{ money: 2500 }, { faction: 'fac.halcyon', add: 2 }, { jobXp: HALCYON_JOB, add: 200 }],
              goto: 'cash',
            },
          ],
        },
        signed: {
          speaker: 'vale',
          text: '"Beautiful." He signs with a fountain pen that costs more than your first computer, then signs yours too, for emphasis. "Stick with me, and in five years you\'ll be telling this story in a magazine."',
          next: 'stairwell',
        },
        doubled: {
          speaker: 'vale',
          text: 'Vale looks at you for a long moment, then laughs, a real one, and crosses out the number with his fancy pen. "Eight thousand. Priya, you told me this one was quiet." Priya: "I said they were quiet in meetings." "Well," Vale says, "not in this one."',
          next: 'stairwell',
        },
        no_lol: {
          speaker: 'vale',
          text: [
            '"I love it," Vale says warmly. "No." He signs your four thousand with a flourish. "Keep that energy. Point it at customers." Behind him, Priya hides a smile behind her folder, badly.',
            'On your way out he adds, to nobody in particular, "Transactional." The word follows you back to your desk. By Friday your raise has been quietly shaved to match it, and someone on the third floor has started calling you "Eight Thousand."',
          ],
          next: 'stairwell',
        },
        cash: {
          speaker: 'vale',
          text: 'Vale looks at you like you asked for the fax machine. "Cash," he repeats, as if trying a word in a foreign language. "Sure. Absolutely. Anneliese will cut you a bonus." He does not offer you the fountain pen. Priya, for the first time all meeting, looks genuinely impressed.',
          next: 'stairwell',
        },
        stairwell: {
          speaker: 'priya',
          text: [
            'Priya catches you in the stairwell, where there are no glass walls.',
            '"Congratulations. You\'re real now. Rule five: don\'t fall in love with paper. Paper burns. Options are paper that has been told it\'s money."',
            { if: { flag: 'fac.halcyon.noticed_partnership' }, text: 'She glances up the stairwell, then down. "And the next time you ask him about that line item, do it somewhere with walls."' },
            { if: { flag: 'fac.halcyon.woke_priya' }, text: '"Also. If you ever call me at two in the morning again, it had better be a fire. An actual one. With flames." She is almost smiling. Almost.' },
            { if: { flag: 'fac.halcyon.pushed_vale' }, text: '"And don\'t haggle with Marcus in the Fishbowl. He doesn\'t say no to people who ask. He says no to people who ask in front of an audience, and then he remembers them."' },
          ],
          effects: [{ npc: 'priya', affinity: 3 }, { flag: 'fac.halcyon.reviewed' }],
          choices: [
            { text: '"Paper\'s all I\'ve got, Priya."', goto: 'paper' },
            { text: '"You sound like someone who got burned."', goto: 'burned' },
          ],
        },
        paper: {
          speaker: 'priya',
          text: '"I know." She pats your shoulder twice, awkwardly, like someone who has read about shoulder-patting. "That\'s why I\'m telling you. Go home. Sleep. You shipped."',
        },
        burned: {
          speaker: 'priya',
          text: [
            { if: { flag: 'a2.priya_backstory' }, text: '"You know I did." She doesn\'t say \'99. She doesn\'t have to. "Different fire. Same smell."', else: '"Everybody at this company has been burned by something. Some of us just remember which match." She doesn\'t explain, and she doesn\'t let you ask.' },
            'She goes back upstairs. Through the glass, you watch her sit down at her desk and not type for a long time.',
          ],
        },
      },
    },

    // ── Start date (the main_a2_q2 interview sets the flag; this puts you on the payroll) ──
    {
      id: 'hal_start_date',
      channel: 'mail',
      title: 'Your start date (and your badge photo, God help us)',
      from: 'dee',
      start: 'paperwork',
      nodes: {
        paperwork: {
          effects: [{ npc: 'dee', met: true }],
          text: [
            'Priya says you\'re hired, which means I have paperwork, which means YOU have paperwork. Junior Developer, Halcyon Systems. Desk on three, by the window that doesn\'t open.',
            'You start whenever you tell me you start. I would like that to be Monday. I would like a lot of things.',
            'Bring two forms of ID and a face you don\'t mind laminating.',
            '— Dee Briggs\nOffice Manager, Halcyon Systems',
          ],
          choices: [
            {
              text: 'Reply: "Monday. I\'ll be there."',
              req: { not: { enrolled: true } },
              reqText: 'The Halcyon shift overlaps your Lumen State classes. Take the job from the Job board when your schedule allows.',
              effects: [{ job: HALCYON_JOB }, { npc: 'dee', affinity: 2 }],
              goto: 'monday',
            },
            { text: 'Reply: "I need a little time to wrap things up first."', goto: 'later' },
          ],
        },
        monday: { text: 'MONDAY. 9 a.m. Do not be late, the badge camera has feelings.\n\n— D.' },
        later: { text: 'Take your time, sweetheart. The job\'s on the Job board with your name practically on it. Don\'t make me come find you.\n\n— D.' },
      },
    },

    // ── Benefits at Trusted (50) ────────────────────────────────────────────
    {
      id: 'hal_benefits_mail',
      channel: 'mail',
      title: 'Your Benefits Packet (I laminated it)',
      from: 'dee',
      start: 'packet',
      nodes: {
        packet: {
          text: [
            'Congratulations, you have been at Halcyon long enough and been good enough at it that Marcus signed off on the Full Package. You are now covered by the good health plan, the one with the dental, and the one where the hospital says "yes" before it says "how."',
            'I am attaching the benefits packet. I have laminated it. It is waterproof, coffee-proof and, I checked, mostly fireproof.',
            'Now listen to me, because I am only going to say this once and then I am going to pretend I didn\'t. If anybody in your family ever gets sick — your mom, your dad, that sister of yours who calls the front desk pretending to be your lawyer — you come to me FIRST. Before the insurance people, before the billing people, before you do anything stupid and proud. Halcyon takes care of its own. I make sure of it.',
            '— Dee\nOffice Manager (and, apparently, your mother now)',
          ],
          choices: [
            { text: 'Reply: "Thank you, Dee. Really."', effects: [{ npc: 'dee', affinity: 3 }], goto: 'thanks' },
            { text: 'Reply: "Does the laminator have a sign-out sheet?"', effects: [{ npc: 'dee', affinity: 1 }], goto: 'laminator' },
          ],
        },
        thanks: { text: 'Don\'t get mushy with me, I have a supply audit at three.\n\n...You\'re welcome, sweetheart.\n\n— D.' },
        laminator: { text: 'The laminator has a WAITING LIST. You are on it. You are number four. Number one is Gerald\'s feeding schedule.\n\n— D.' },
      },
    },

    // ── IPO morning ─────────────────────────────────────────────────────────
    {
      id: 'hal_ipo_bell',
      channel: 'mail',
      title: 'We Did It (a note from Marcus)',
      from: 'vale',
      start: 'bell',
      nodes: {
        bell: {
          text: [
            'Team,',
            'At 9:30 this morning, in a city 2,000 miles from here, I rang a bell, and the whole world found out what we already knew. HLCN is a public company. We opened at $18. We are not at $18 anymore. Go look. Actually, don\'t look, go build. But look first.',
            'Three years ago this street was full of companies that sold the feeling of the future without the future. They\'re gone. We\'re here. Every one of you did that.',
            ...OPTION_LINES,
            { if: { var: 'fac.halcyon.options', gte: 1 }, text: 'A note from Anneliese: the standard six-month lockup applies to all employee shares. You will receive a notice when your window opens. Until then, your paper is paper. Beautiful, beautiful paper.' },
            'Moonshot.\n— Marcus',
            'P.S. from Dee: The champagne budget was NOT unlimited. Whoever put a bottle in the koi pond, Gerald is fine, and I know who you are.',
          ],
          effects: [{ stat: 'mood', add: 8 }],
        },
      },
    },

    // ── Lockup expiry: the money time-bomb ──────────────────────────────────
    {
      id: 'hal_lockup_mail',
      channel: 'mail',
      title: 'NOTICE: Your HLCN Trading Window Is Open',
      from: 'Halcyon Stock Plan Administration',
      start: 'notice',
      nodes: {
        notice: {
          text: [
            'This is an automated notice from Halcyon Stock Plan Administration.',
            'The post-offering lockup period has ended. Vested employee options may now be exercised and sold, subject to company trading-window policy.',
            { if: { var: 'fac.halcyon.options', lte: 0 }, text: 'Our records show no vested options in your account. If you believe this is an error, please contact the Office Manager, who has asked us to add that she "does not do stock."' },
            ...OPTION_LINES,
            { if: { flag: 'w.halcyon_state', eq: 'rising' }, text: 'HLCN closed yesterday well above its offering price. Analysts describe the outlook as "radiant."' },
            { if: { flag: 'w.halcyon_state', eq: 'wobble' }, text: 'HLCN has traded below its offering price for some weeks. Analysts describe the outlook as "under review."' },
            { if: { flag: 'w.halcyon_state', eq: 'clean' }, text: 'HLCN trades modestly and steadily, which analysts find boring and your accountant finds lovely.' },
            'This notice is not investment advice.',
          ],
          choices: [
            {
              text: 'Exercise and sell everything today.',
              if: { var: 'fac.halcyon.options', gte: 1 },
              effects: SELL_AT_MARKET,
              goto: 'sold',
            },
            {
              text: 'Hold. Marcus says the best is ahead.',
              if: { var: 'fac.halcyon.options', gte: 1 },
              effects: [{ flag: 'fac.halcyon.held_options' }],
              goto: 'held',
            },
            { text: 'Page Priya: "Sell or hold?"', if: { var: 'fac.halcyon.options', gte: 1 }, goto: 'ask_priya' },
            { text: 'Archive the notice. There is nothing left in the account to sell.', if: { var: 'fac.halcyon.options', lte: 0 } },
          ],
        },
        ask_priya: {
          speaker: 'priya',
          text: 'Her reply comes in four minutes, which for Priya is a speech: "rule five. paper burns. i sold mine at 9:31. do what you want but do it on purpose."',
          choices: [
            { text: 'Sell. On purpose.', effects: [...SELL_AT_MARKET, { npc: 'priya', affinity: 2 }], goto: 'sold' },
            { text: 'Hold. On purpose.', effects: [{ flag: 'fac.halcyon.held_options' }], goto: 'held' },
          ],
        },
        sold: {
          text: 'Transaction confirmed. The proceeds have been deposited to your account, minus fees, taxes, and a small piece of your belief in the future. Somewhere on the fourth floor, you imagine, Marcus Vale feels a disturbance in the force.',
        },
        held: {
          text: 'No action taken. Your options remain in your account, where they will be worth exactly what the world thinks of Halcyon on the day you finally sell them.',
        },
      },
    },

    // ── Moonlighting: HR notices ────────────────────────────────────────────
    {
      id: 'hal_moonlight_mail',
      channel: 'mail',
      title: 'Quick question (not a big deal) (it\'s a big deal)',
      from: 'dee',
      start: 'call',
      nodes: {
        call: {
          text: [
            'Sweetheart. Somebody from a federal office called the front desk this morning asking for your employment dates, your usual hours, and — this is a direct quote — "whether the subject keeps irregular nights."',
            'I told him you are the worst employee Halcyon has ever had, you never work nights, you are barely here in the DAYTIME, and he should call back never. He thanked me. I don\'t think he believed me.',
            'Marcus heard about it. Marcus does not like phone calls he didn\'t make. Whatever you are doing on your own time, do less of it, or do it quieter, or at least don\'t give them the switchboard number.',
            '— D.',
          ],
          choices: [
            { text: 'Reply: "Thank you for covering for me, Dee."', effects: [{ npc: 'dee', affinity: 2 }], goto: 'thanks' },
            {
              text: 'Reply: "It\'s a misunderstanding. Freelance stuff. Totally boring."',
              check: {
                skill: 'social',
                dc: 13,
                success: 'bought_it',
                fail: 'didnt_buy_it',
                successEffects: [{ faction: 'fac.halcyon', add: 3 }],
                failEffects: [
                  // A second lie on top of an existing note is the one that gets written in pen.
                  { if: { flag: 'fac.halcyon.moonlight_file' }, then: [{ flag: 'fac.halcyon.moonlight_pen' }, { faction: 'fac.halcyon', add: -5 }, { complication: 'work' }] },
                  { flag: 'fac.halcyon.moonlight_file' },
                  { faction: 'fac.halcyon', add: -5 },
                  { npc: 'dee', affinity: -3 },
                  { stat: 'stress', add: 5 },
                  { chance: 0.3, then: [{ complication: 'legal' }] },
                ],
              },
            },
          ],
        },
        thanks: { text: 'I didn\'t cover for you. I lied to a government. There\'s a difference and it\'s about four years.\n\nBe careful.\n\n— D.' },
        bought_it: { text: 'Freelance. Okay. I will tell Marcus "freelance," and he will say "boring," and that will be the end of it. Boring is the best word in this building.\n\n— D.' },
        didnt_buy_it: {
          text: [
            'Honey. I ran a CompCastle service bench for eleven years. I know what a misunderstanding looks like, and it does not look like a man in a gray suit asking about your nights.',
            'I\'m not asking. I\'m just not stupid.',
            {
              if: { flag: 'fac.halcyon.moonlight_pen' },
              text: 'And sweetheart, this is the second time. Marcus wrote this note himself. In PEN. He wanted me to watch him do it. He asked me who you have lunch with. I said the vending machine. He did not laugh.',
              else: 'Marcus asked me to put a note in your file. I did. I wrote it in pencil. Pencil is what I use for people I like. Please don\'t make me go find a pen.',
            },
            '— D.',
          ],
        },
      },
    },
  ],

  triggers: [
    // Single source of `fac.halcyon.employed` (read by main_a2_q2 / CP-B3 B / Priya's bio / this arc).
    { id: 'trig_halcyon_employed', when: onHalcyonPayroll, effects: [{ flag: 'fac.halcyon.employed' }] },
    // PKG-02's interview grants the badge; this mail puts you on the actual payroll.
    {
      id: 'trig_halcyon_start_date',
      when: { all: [{ flag: 'fac.halcyon.employed' }, { not: onHalcyonPayroll }, { jobLevel: HALCYON_JOB, lte: 0 }] },
      atHour: 9,
      effects: [{ scene: 'hal_start_date' }],
    },
    // Benefits at Trusted (50): unlocks the CP-B3 insurance option (which reads employed + rep 50).
    {
      id: 'trig_halcyon_insured',
      when: { all: [onHalcyonPayroll, { faction: 'fac.halcyon', gte: 50 }] },
      atHour: 10,
      effects: [{ flag: 'fac.halcyon.insured' }, { scene: 'hal_benefits_mail' }],
    },
    // IPO morning (the IPO itself is PKG-16's trig_halcyon_ipo, which sets w.halcyon_state='rising').
    {
      id: 'trig_halcyon_ipo_day',
      when: { all: [{ flag: 'w.halcyon_state', eq: 'rising' }, { flag: 'fac.halcyon.employed' }] },
      atHour: 9,
      effects: [
        { scene: 'hal_ipo_bell' },
        { if: { var: 'fac.halcyon.options', gte: 1 }, then: [{ scene: 'hal_lockup_mail', delayHours: 24 * 180 }] },
      ],
    },
    // "Rep down: getting caught moonlighting" (§3 F4).
    {
      id: 'trig_halcyon_moonlight',
      when: { all: [onHalcyonPayroll, { stat: 'heat', gte: 60 }] },
      once: false,
      cooldownDays: 120,
      atHour: 10,
      effects: [{ faction: 'fac.halcyon', add: -5 }, { scene: 'hal_moonlight_mail' }],
    },
    ...reviewTriggers,
  ],
})
