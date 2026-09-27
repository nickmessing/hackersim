/**
 * events_work — OPS & THE PIPE (Act II–III). Sysadmins, NOC nights, lab techs and the people in
 * the vans. The pager that goes off at dinner, the research cluster nobody lets you read, the
 * houses you wire one splitter at a time, and the street the rollout map forgot.
 *
 * HARD RULE: all tech here is invented flavor, never real technique.
 */
import { defineContent } from '@/engine/registry'
import type { Cond, Effect, EventDef, SceneDef } from '@/engine/types'
import {
  SPRAIN,
  WATCHED,
  around,
  bumpJob,
  firedNow,
  free,
  momHere,
  olderNow,
  onFinalWarning,
  strike,
  withGrace,
  withMira,
} from './_shared'

// ── ev_work_pager_duty ────────────────────────────────────────────────────────
// Repeatable. The network doesn't care what you were doing. Neither, it turns out, do you.
const kimHere: Cond = { all: [around('kim'), { npc: 'kim', fateNot: ['follows_in'] }] }
/** Which evening the pager ruins (first match wins, mirrored in text and effects). */
const atDinnerGrace: Cond = withGrace
const atDinnerMira: Cond = { all: [withMira, { not: withGrace }] }
const atKims: Cond = { all: [kimHere, { not: withGrace }, { not: withMira }] }
const atMoms: Cond = { all: [momHere, { not: kimHere }, { not: withGrace }, { not: withMira }] }
const alone: Cond = { all: [{ not: kimHere }, { not: momHere }, { not: withGrace }, { not: withMira }] }
const payphoneEra: Cond = { day: true, lte: 1700 }

const lovedOnesPay = (n: number): Effect[] => [
  { if: atDinnerGrace, then: [{ npc: 'grace', affinity: -n }] },
  { if: atDinnerMira, then: [{ npc: 'mira', affinity: -n }] },
  { if: atKims, then: [{ npc: 'kim', affinity: -n }] },
  { if: atMoms, then: [{ npc: 'mom', affinity: -Math.ceil(n / 2) }] },
  { if: alone, then: [{ stat: 'mood', add: -n }] },
]
const lovedOnesThank = (n: number): Effect[] => [
  { if: atDinnerGrace, then: [{ npc: 'grace', affinity: n }] },
  { if: atDinnerMira, then: [{ npc: 'mira', affinity: n }] },
  { if: atKims, then: [{ npc: 'kim', affinity: n }] },
  { if: atMoms, then: [{ npc: 'mom', affinity: n }] },
]

const pagerScene: SceneDef = {
  id: 'ev_work_pager_duty_scene',
  channel: 'dialog',
  title: 'The Pager',
  start: 'page',
  nodes: {
    page: {
      speaker: 'narrator',
      text: [
        { if: atDinnerGrace, text: 'Dinner with {npc:grace} at the little Portuguese place on Cannery Row — her one free night in two weeks. The waiter has just set down the grilled sardines when your belt buzzes.' },
        { if: atDinnerMira, text: '{npc:mira} actually agreed to go to a movie. A real one, in a theater, with popcorn. The trailers have just started when your belt buzzes, and she turns her head very slowly to look at you.' },
        { if: atKims, text: 'Kim\'s thing. The one she made you swear on the modem you\'d come to. You are in the third row, and she has just walked out under the lights, when your belt buzzes.' },
        { if: atMoms, text: 'Sunday dinner at Mom\'s. She made the good pho, the one that takes all day. She has just set your bowl down, steam curling up, when your belt buzzes.' },
        { if: alone, text: 'A rare quiet night: the Cathode, the end stool, a slice of pie and a paperback. You have just turned the page to chapter nine when your belt buzzes.' },
        'The pager reads: SEV1 — CORE ROUTER EAST — CUSTOMERS DOWN. Then again. Then a third time, just the number of the on-call phone, which is the pager\'s way of shouting.',
        { if: olderNow, text: 'You are older now. Your knees make a sound when you stand up at 3 a.m. You have started to take that personally.' },
        { if: onFinalWarning, text: 'Two write-ups in your file. This is not a page you can sleep through.' },
      ],
      choices: [
        {
          text: 'Go. Right now. The network doesn\'t care about dinner.',
          effects: [...lovedOnesPay(4), ...bumpJob(150), { stat: 'energy', add: -10 }],
          goto: 'went',
        },
        {
          tag: '[Systems]',
          text: [{ if: payphoneEra, text: 'Fix it from here — the payphone out front, a borrowed line, and a very patient dial-up session.', else: 'Fix it from here: laptop out, phone tethered, back before anyone notices you left.' }],
          check: {
            skill: 'systems',
            dc: 14,
            bonuses: [
              { if: { skill: 'networking', gte: 40 }, add: 2, label: '+2 (you know the backbone by heart)' },
              { if: { background: 'tinkerer' }, add: 1, label: '+1 (basement tinkerer)' },
              { if: { trait: 'night_owl' }, add: 1, label: '+1 (night owl)' },
            ],
            success: 'remote_fix',
            fail: 'remote_fail',
            successEffects: [...bumpJob(200), { stat: 'mood', add: 4 }, ...lovedOnesThank(2)],
            failEffects: [...strike, ...lovedOnesPay(6), { stat: 'stress', add: 8 }, { chance: 0.3, then: [{ complication: 'work' }] }],
          },
        },
        {
          tag: '[Social]',
          text: 'Call the junior admin and talk them through it, step by step, from the sidewalk.',
          check: {
            skill: 'social',
            dc: 13,
            bonuses: [
              { if: { trait: 'silver_tongue' }, add: 2, label: '+2 (silver tongue)' },
              { if: { trait: 'empath' }, add: 1, label: '+1 (you can hear them panicking)' },
              { if: { flag: 'ev_work.protege' }, add: 2, label: '+2 (you trained this kid)' },
            ],
            success: 'handoff',
            fail: 'handoff_fail',
            successEffects: [{ flag: 'ev_work.protege' }, ...bumpJob(80), ...lovedOnesThank(2)],
            failEffects: [...strike, { stat: 'mood', add: -3 }, { clearFlag: 'ev_work.protege' }],
          },
        },
        {
          tag: '[Leave]',
          text: 'Turn the pager off. Just this once. Just tonight.',
          effects: [...lovedOnesThank(4), { stat: 'mood', add: 5 }, ...strike, { stat: 'stress', add: 4 }],
          goto: 'ignored',
        },
      ],
    },
    went: {
      speaker: 'narrator',
      text: [
        { if: atDinnerGrace, text: '{npc:grace} doesn\'t argue. She is a nurse; she knows what a page is. She just says "go," and asks the waiter to box your sardines, and doesn\'t text you once all night. That is somehow worse than if she had.' },
        { if: atDinnerMira, text: '"Go," {npc:mira} says, eyes back on the screen. "I\'ll tell you how it ends." She doesn\'t. When you ask the next day, she says "you missed it," and changes the subject, and you understand that she means more than the movie.' },
        { if: atKims, text: 'You slip out during her first line. You hear it through the auditorium doors — her voice, steady, brave — as you run for the car. Later she says it\'s fine. She says it three times.' },
        { if: atMoms, text: 'Mom puts a lid on your bowl without a word and pushes it into your hands for the road. The pho is cold by the time you remember it, at four in the morning, on a data-center floor.' },
        { if: alone, text: 'You leave the pie. Sal wraps it in foil without being asked and puts it on the end stool for tomorrow.' },
        'The router is fixed by 1 a.m. The postmortem thanks "the on-call engineer" in the third paragraph.',
      ],
    },
    remote_fix: {
      speaker: 'narrator',
      text: [
        'Eleven minutes, one very focused expression and a little prayer to whoever watches over routing tables. The pager goes quiet. The graphs go green. You slide back into your seat before anyone has finished the thought "where did they go?"',
        { if: atDinnerGrace, text: '{npc:grace} raises an eyebrow. "Triage?" "Triage." She clinks her glass against yours. "Look at you. A professional."' },
        { if: atKims, text: 'You make it back for her big scene. She sees you in the third row and does the smallest thing with her eyebrows that, from Kim, is a standing ovation.' },
      ],
    },
    remote_fail: {
      speaker: 'narrator',
      text: [
        'You make one change from a payphone-quality connection and the routing table takes it personally. What was one router down is now the whole east side of the city: three hours of dark modems, four thousand angry customers and a mention on the late news.',
        'You end up driving in anyway, and you miss everything, and the postmortem has your name in it — not in the thanks section.',
      ],
    },
    handoff: {
      speaker: 'narrator',
      text: [
        'The junior admin on the other end is twenty-two and terrified. You slow your voice down. "Okay. Tell me what you see. Good. Now the second line. Good. You\'ve got this." They do. It takes forty minutes. At the end they say "thank you" like you pulled them out of a river.',
        'You go back inside to cold food and a warm table. The next week the kid leaves a coffee on your desk with a note: "for the voice on the phone."',
      ],
    },
    handoff_fail: {
      speaker: 'narrator',
      text: 'The kid panics, reboots the wrong box, and takes down billing along with everything else. Your boss calls you twenty minutes later — not the kid, you — and asks you to explain why the on-call engineer delegated a SEV1 to someone who started on Monday. The kid resigns by Friday. You find their badge in your mailbox with no note.',
    },
    ignored: {
      speaker: 'narrator',
      text: [
        { if: atDinnerGrace, text: 'You press the button until it stops. {npc:grace} watches you do it and something in her face opens up. "Who are you," she says, delighted, "and what did you do with the one who always leaves?"' },
        { if: atDinnerMira, text: 'You turn it off. {npc:mira} watches you do it, then offers you the popcorn, which in her language is a sonnet.' },
        { if: atKims, text: 'You turn it off. You watch the whole thing. Kim is wonderful. Afterward she runs off the stage into your arms like she\'s nine again.' },
        { if: atMoms, text: 'You turn it off and eat the pho while it\'s hot. Mom watches you eat the way she used to when you were small, and doesn\'t say anything, and doesn\'t need to.' },
        { if: alone, text: 'You turn it off and finish chapter nine, and chapter ten, and the pie.' },
        'On Monday there is a meeting titled "Incident Review — On-Call Response" and you are in it, and the other five people in it are looking at you.',
      ],
    },
  },
}

const pagerDuty: EventDef = {
  id: 'ev_work_pager_duty',
  category: 'work',
  weight: 3,
  repeatable: true,
  cooldownDays: 100,
  when: { all: [{ jobTrack: ['sysadmin', 'network'] }, { not: { job: 'job_northlink_field_tech' } }, free] },
  scene: 'ev_work_pager_duty_scene',
}

// ── ev_work_lab_queue ─────────────────────────────────────────────────────────
// A grad student's thesis versus the research cluster's untouchable "GRANT-7" jobs.
const okoroUp = around('okoro')

const labScene: SceneDef = {
  id: 'ev_work_lab_queue_scene',
  channel: 'dialog',
  title: 'The Queue',
  start: 'queue',
  nodes: {
    queue: {
      speaker: 'narrator',
      text: [
        'Tomasz Wierzbicki, fifth-year PhD, has been sleeping in the CS basement. His thesis defense is in nine days. His simulation needs sixty hours on the research cluster, and the cluster is booked solid for three weeks by jobs tagged GRANT-7 / PRIORITY / DO NOT PREEMPT.',
        '"Please," he says. He has the look of a man who has been saying "please" to machines for a very long time and has only now thought to try a person.',
        'You have the admin password. Technically, you have always had the admin password. Nobody has ever told you what GRANT-7 computes. Nobody has ever let you read its paperwork.',
        { if: okoroUp, text: 'Professor Okoro\'s name is on the grant. You have seen her stand in front of the cluster\'s status screen at night with her tea going cold, just looking at it.' },
      ],
      choices: [
        {
          text: 'Preempt the grant jobs for sixty hours. A thesis is a thesis.',
          effects: [{ stat: 'mood', add: 6 }, ...strike, { flag: 'ev_work.bumped_grant' }],
          goto: 'preempt',
        },
        {
          tag: '[Systems]',
          text: 'Find sixty hours of idle cycles at 4 a.m. — squeeze him in without touching GRANT-7 at all.',
          check: {
            skill: 'systems',
            dc: 15,
            bonuses: [
              { if: { trait: 'night_owl' }, add: 2, label: '+2 (4 a.m. is your office)' },
              { if: { background: 'mathlete' }, add: 1, label: '+1 (you can schedule it in your head)' },
            ],
            success: 'squeeze',
            fail: 'crash_cluster',
            successEffects: [{ xp: 'systems', add: 40 }, { stat: 'mood', add: 5 }, ...bumpJob(150)],
            failEffects: [...strike, { stat: 'heat', add: 4 }, { stat: 'stress', add: 8 }, { flag: 'ev_work.saw_grant' }],
          },
        },
        {
          tag: '[OpSec]',
          text: 'Before you decide anything, take one quiet look at what GRANT-7 actually computes.',
          check: {
            skill: 'opsec',
            dc: 14,
            bonuses: [
              { if: { background: 'latchkey' }, add: 2, label: '+2 (latchkey kid)' },
              { if: { trait: 'paranoid' }, add: 1, label: '+1 (you cover your tracks by habit)' },
            ],
            success: 'peek',
            fail: 'peek_caught',
            successEffects: [{ flag: 'ev_work.saw_grant' }, { xp: 'opsec', add: 30 }, { stat: 'stress', add: 4 }],
            failEffects: [{ flag: 'ev_work.saw_grant' }, { stat: 'heat', add: 6 }, { stat: 'stress', add: 8 }, { buff: WATCHED }, { chance: 0.3, then: [{ complication: 'work' }] }],
          },
        },
        {
          tag: '[Leave]',
          text: '"I\'m sorry, Tomasz. It\'s not my queue to break."',
          effects: [{ stat: 'mood', add: -3 }],
          goto: 'refuse',
        },
      ],
    },
    preempt: {
      speaker: 'narrator',
      text: [
        'Sixty hours. Tomasz\'s simulation finishes at dawn on day three and he actually weeps into the lab printer. He defends on Friday, and passes, and in his acknowledgements, between his mother and his cat, there is a line: "and to the lab tech who broke the rules."',
        'On Monday a very polite email arrives from the Grant Compliance Office. It is cc\'d to your supervisor, the department chair, and an address at an organization you have never heard of. It uses the phrase "contractual obligations to our research partners" three times.',
        { if: okoroUp, text: 'Professor Okoro stops by with two teas. "Somebody complained about a sixty-hour delay within ninety minutes of it happening," she says, handing you one. "At midnight. On a Saturday." She looks at the cluster screen for a long time. "Who watches a queue that closely?"' },
      ],
      effects: [{ if: okoroUp, then: [{ npc: 'okoro', affinity: 3 }] }],
    },
    squeeze: {
      speaker: 'narrator',
      text: 'You find it: a gap every night between 3:40 and 6:10 when GRANT-7 writes its results out and the processors sit idle, waiting. Nine nights of gaps is sixty hours. Tomasz defends with every result he needed. Nobody notices anything. You sleep for most of the following weekend.',
    },
    crash_cluster: {
      speaker: 'narrator',
      text: [
        'You squeeze too hard. One of the GRANT-7 jobs — eleven days into its run — starves, stalls and dies. You watch its status go from RUNNING to FAILED like a heart monitor flatlining.',
        'Two days later, two men in good suits come to the basement. They are not from LSU. They do not say where they are from. They ask your name, and write it down, and ask very reasonable questions about scheduling in a tone that makes you want to confess to things you haven\'t done.',
        { if: okoroUp, text: 'Afterward, Professor Okoro finds you by the vending machine, very pale. "I didn\'t know they could come here," she says, mostly to herself.' },
      ],
    },
    peek: {
      speaker: 'narrator',
      text: [
        'You don\'t touch anything. You just look. GRANT-7 is a correlation run: names, addresses, purchase histories, phone numbers — Port Lumen\'s, a few hundred thousand of them — being matched against each other in patterns you don\'t fully understand and don\'t like at all. The output directory is called PX_STAGING.',
        'You close the window. Your hands are cold. Tomasz is still waiting outside the server-room door.',
      ],
      choices: [
        {
          text: 'Preempt it anyway. Let it wait sixty hours. Let somebody notice.',
          effects: [{ stat: 'mood', add: 4 }, ...strike, { flag: 'ev_work.bumped_grant' }],
          goto: 'preempt',
        },
        {
          text: 'Tell Tomasz no. Suddenly you don\'t want your name anywhere near that queue.',
          effects: [{ stat: 'mood', add: -3 }],
          goto: 'refuse',
        },
      ],
    },
    peek_caught: {
      speaker: 'narrator',
      text: [
        'The moment you open the output directory, something on the other end of the pipe notices. A message appears on the admin console, from an account that doesn\'t belong to anyone at LSU: "Please don\'t." Just that. Then the session closes itself.',
        'For the next month you notice things. The same grey sedan in the faculty lot. A click on the lab line. A new "IT auditor" who asks about your weekends.',
      ],
    },
    refuse: {
      speaker: 'narrator',
      text: 'Tomasz nods like he expected it, which is worse than if he\'d argued. He defends with half his results and a lot of confident hand-waving. He passes — barely, with revisions. He doesn\'t bring you cookies anymore. The GRANT-7 jobs run on, humming, untouched.',
    },
  },
}

const labQueue: EventDef = {
  id: 'ev_work_lab_queue',
  category: 'work',
  weight: 3,
  when: { all: [{ job: 'job_lsu_labtech' }, free] },
  scene: 'ev_work_lab_queue_scene',
}

// ── ev_work_house_calls ───────────────────────────────────────────────────────
// Repeatable. The van, the attic, the soup, the splitter. One house per firing, in that order.
const HOUSECALLS = 'ev_work.housecalls'
const soupHouse: Cond = { var: HOUSECALLS, eq: 1 }
const raccoonHouse: Cond = { var: HOUSECALLS, eq: 2 }
const splitterHouse: Cond = { var: HOUSECALLS, gte: 3 }

const houseScene: SceneDef = {
  id: 'ev_work_house_calls_scene',
  channel: 'dialog',
  title: 'House Call',
  start: 'door',
  nodes: {
    door: {
      speaker: 'narrator',
      text: [
        { if: soupHouse, text: 'Install #6 of the day: Mrs. Rosa Esposito, Cannery Row, eighty years old, four foot ten, and already ladling soup before you have your boots off. While you run the line she shows you what\'s in the back bedroom: her late husband Carmine\'s ham radio, dusty and dark. "It hasn\'t talked since he did," she says. "Maybe you know radios too?"' },
        { if: raccoonHouse, text: 'Harbor Point, a big old house on the hill. The only path for the line is through the attic. The homeowner mentions, on your way up the ladder, that "something" lives up there. From the dark comes a sound like a very small, very angry man clearing his throat. Several of them.' },
        { if: splitterHouse, text: 'A duplex off Millgate Avenue. The customer — Rick, gold chain, cheerful — watches you finish, then holds out a folded fifty. "My brother\'s next door. Just split the line to his side. Nobody\'s gotta know. It\'s a family thing."' },
        { if: onFinalWarning, text: 'Dispatch has you on a short leash: two write-ups, and the supervisor reads every timesheet.' },
      ],
      choices: [
        {
          if: soupHouse,
          tag: '[Hardware]',
          text: 'Fix Carmine\'s radio. Fifteen minutes. Dispatch can wait.',
          check: {
            skill: 'hardware',
            dc: 12,
            bonuses: [{ if: { background: 'tinkerer' }, add: 2, label: '+2 (you grew up taking these apart)' }],
            success: 'radio_ok',
            fail: 'radio_bad',
            successEffects: [{ faction: 'fac.hood', add: 3 }, { stat: 'mood', add: 5 }, { xp: 'hardware', add: 30 }],
            failEffects: [{ stat: 'mood', add: -4 }, ...strike],
          },
        },
        {
          if: soupHouse,
          text: 'Eat the soup. It would be rude not to. It would be a crime not to.',
          effects: [{ stat: 'health', add: 3 }, { stat: 'mood', add: 3 }, { chance: 0.3, then: strike }],
          goto: 'soup',
        },
        {
          if: raccoonHouse,
          tag: '[Fitness]',
          text: 'Crawl in anyway. You are a professional. They are raccoons.',
          check: {
            skill: 'fitness',
            dc: 13,
            bonuses: [{ if: { trait: 'gym_rat' }, add: 2, label: '+2 (gym rat)' }],
            success: 'attic_ok',
            fail: 'attic_bad',
            successEffects: [...bumpJob(150), { xp: 'fitness', add: 25 }],
            failEffects: [
              { stat: 'health', add: -10 },
              { buff: SPRAIN },
              { obligation: { id: 'ev_work_ceiling', label: 'NorthLink payroll deduction (a Harbor Point ceiling)', perDay: 6, days: 30 } },
              { chance: 0.35, then: [{ trait: 'ev_work_bad_knee' }] },
            ],
          },
        },
        {
          if: raccoonHouse,
          tag: '[Networking]',
          text: 'Skip the attic. Run the line along the outside of the house like a sane person.',
          check: {
            skill: 'networking',
            dc: 14,
            bonuses: [{ if: { skill: 'hardware', gte: 30 }, add: 1, label: '+1 (you know how to weatherproof a run)' }],
            success: 'wall_ok',
            fail: 'wall_bad',
            successEffects: [...bumpJob(150), { xp: 'networking', add: 30 }],
            failEffects: [...strike, { stat: 'stress', add: 5 }],
          },
        },
        {
          if: splitterHouse,
          text: 'Take the fifty and split the line. It\'s a family thing.',
          effects: [
            { money: 50 },
            { stat: 'heat', add: 2 },
            { flag: 'ev_work.split_line' },
            { chance: 0.45, then: [{ scene: 'ev_work_split_line_audit', delayHours: 24 * 30 }] },
          ],
          goto: 'split',
        },
        {
          if: splitterHouse,
          tag: '[Social]',
          text: 'Talk him into the family bundle instead. Legit, cheaper per house, and nobody goes to jail over it.',
          check: {
            skill: 'social',
            dc: 12,
            bonuses: [
              { if: { trait: 'silver_tongue' }, add: 2, label: '+2 (silver tongue)' },
              { if: { faction: 'fac.hood', gte: 20 }, add: 1, label: '+1 (you talk like the neighborhood)' },
            ],
            success: 'bundle_ok',
            fail: 'bundle_bad',
            successEffects: [{ money: 20 }, ...bumpJob(100)],
            failEffects: [...strike, { stat: 'mood', add: -3 }],
          },
        },
        {
          tag: '[Leave]',
          text: [
            { if: soupHouse, text: 'Politely decline everything and get to install #7.' },
            { if: raccoonHouse, text: 'Reschedule. Raccoons have rights, and you have a tetanus shot from 1996.' },
            { if: splitterHouse, text: 'Hand back the fifty. "Can\'t do it, Rick."' },
          ],
          effects: [{ if: raccoonHouse, then: [{ chance: 0.3, then: strike }] }, { if: { not: raccoonHouse }, then: bumpJob(60) }],
          goto: 'moved_on',
        },
      ],
    },
    radio_ok: {
      speaker: 'narrator',
      text: [
        'A cracked solder joint and a tube that just needed reseating. The radio warms, crackles, and fills the back bedroom with the hiss of the whole wide world. Mrs. Esposito puts her hand over her mouth.',
        'Within a week, she is talking every evening to a man in Ridgeport named Vito who knew Carmine on the tugboats in 1961. She tells everyone on the Row about "the NorthLink angel." You are late to install #7 and nobody at dispatch ever finds out why, because Mrs. Esposito calls them first and yells at them in two languages.',
      ],
    },
    radio_bad: {
      speaker: 'narrator',
      text: [
        'There is a small pop, a smell like a struck match, and the radio goes darker than it was before. "It\'s all right," Mrs. Esposito says quickly, patting your hand. "It\'s all right, it was old." It isn\'t all right. You both know it isn\'t.',
        'You\'re also an hour late to install #7, who calls dispatch, who calls you. The soup was very good. That doesn\'t go on the timesheet.',
      ],
    },
    soup: {
      speaker: 'narrator',
      text: 'It is wedding soup, and it is the best thing you have eaten in a year. She sends you off with a jar of it wrapped in a dish towel and a kiss on each cheek. The jar rides in the van\'s cupholder all afternoon like a small, warm passenger.',
    },
    attic_ok: {
      speaker: 'narrator',
      text: 'You crawl in on your elbows with a flashlight in your teeth. Four raccoons watch you with the flat professional contempt of union men. You make your run, staple the line, back out, and nobody bites anybody. The homeowner tips you twenty dollars and calls you "fearless." Dispatch calls you "on time," which is rarer.',
    },
    attic_bad: {
      speaker: 'narrator',
      text: [
        'The biggest raccoon rises up on its hind legs like a bear in a nature documentary. You scramble backward, miss the joist, and put your knee straight through the ceiling — into the dining room, where the homeowner is hosting a dinner party for the Harbor Point Garden Society.',
        'You hang there, one leg through the plaster, above a very good roast. The Garden Society stares up at you. The raccoon stares down at you. NorthLink pays for the ceiling, and then takes it out of your paycheck, one week at a time.',
      ],
    },
    wall_ok: {
      speaker: 'narrator',
      text: 'You run the line along the eaves, weatherproof every clip, and bring it in through a clean hole by the utility box. It\'s the best install of your week — neat enough that your supervisor uses a photo of it in the next training binder, labeled HOW IT SHOULD LOOK.',
    },
    wall_bad: {
      speaker: 'narrator',
      text: 'It looks fine. It is not fine. The first big rain off the Sound finds the one clip you didn\'t seal, and the Harbor Point house goes offline in the middle of the owner\'s important conference call. The callback ticket has your name on it in capital letters.',
    },
    split: {
      speaker: 'narrator',
      text: 'Ten minutes with a splitter and a length of cable nobody will ever inventory. Rick\'s brother comes out onto his porch to wave at you like you\'ve delivered a baby. You drive to the next job with fifty dollars in your shirt pocket that feels, for some reason, heavier than fifty dollars.',
    },
    bundle_ok: {
      speaker: 'narrator',
      text: '"Family bundle," you say. "Two houses, one bill, twenty percent off. And your brother gets his own line that nobody can cut." Rick thinks about it, then laughs and pockets the fifty. "You\'re good, kid. You\'re in the wrong business." You get the sales commission. You kind of agree.',
    },
    bundle_bad: {
      speaker: 'narrator',
      text: 'Rick stops smiling. The next morning he calls NorthLink customer service and tells them the installer "tried to shake him down for fifty bucks." It\'s his word against yours, and he has a gold chain and a very convincing voice. Your supervisor believes you, mostly. The write-up goes in anyway.',
    },
    moved_on: {
      speaker: 'narrator',
      text: [
        { if: soupHouse, text: 'Mrs. Esposito looks disappointed for exactly one second, then presses a wrapped cookie into your hand anyway. You eat it in the van. You think about the radio all the way to install #7.' },
        { if: raccoonHouse, text: 'You tell the homeowner to call a wildlife guy and NorthLink both, in that order. Dispatch sighs at you, but dispatch sighs at everyone.' },
        { if: splitterHouse, text: 'Rick shrugs and takes the fifty back. "Suit yourself." By next month, you notice, there is a splitter on the line anyway. Somebody else took the fifty. There is always somebody else.' },
      ],
    },
  },
}

const splitAudit: SceneDef = {
  id: 'ev_work_split_line_audit',
  channel: 'mail',
  title: 'Revenue Assurance: Service Discrepancy — Millgate Ave.',
  from: 'NorthLink Revenue Assurance',
  pause: true,
  start: 'm',
  nodes: {
    m: {
      speaker: 'NorthLink Revenue Assurance',
      text: [
        'A routine line audit has identified an unauthorized service extension at a Millgate Avenue duplex. Installation records indicate you were the last technician on site.',
        'Please report to the Revenue Assurance office on Thursday at 10:00 a.m. to discuss this matter. You may bring a representative.',
        'Theft of service is grounds for immediate termination.',
      ],
      choices: [
        {
          tag: '[Social]',
          text: 'Walk in calm. "I ran the line to spec. Whatever happened after I left, I didn\'t see it."',
          check: {
            skill: 'social',
            dc: 15,
            bonuses: [
              { if: { trait: 'silver_tongue' }, add: 2, label: '+2 (silver tongue)' },
              { if: { background: 'latchkey' }, add: 1, label: '+1 (you have been lying to adults since you were nine)' },
            ],
            success: 'cleared',
            fail: 'terminated',
            successEffects: [...strike],
            failEffects: [...firedNow, { stat: 'heat', add: 4 }],
          },
        },
        {
          req: { stat: 'money', gte: 300 },
          reqText: 'Requires $300',
          tag: '[$300]',
          text: 'Tell the truth and offer to repay the stolen service out of your own pocket.',
          effects: [{ money: -300 }, ...strike, { stat: 'mood', add: 2 }],
          goto: 'repaid',
        },
        {
          tag: '[Leave]',
          text: 'Don\'t go. Clean out your locker Wednesday night.',
          effects: [{ job: null }, { stat: 'mood', add: -6 }],
          goto: 'quit',
        },
      ],
    },
    cleared: {
      speaker: 'narrator',
      text: 'The man from Revenue Assurance has heard every story there is. He listens to yours with his pen capped. At the end he writes "insufficient evidence" and "technician counseled," and you are counseled, at length, about cable inventory. You walk out with your job and a cold sweat that lasts until Sunday.',
    },
    terminated: {
      speaker: 'narrator',
      text: 'Rick\'s brother, it turns out, told the auditor everything, including your name and how nice you were about it. The man from Revenue Assurance slides a form across the desk. Your badge stops working before you reach the parking lot.',
    },
    repaid: {
      speaker: 'narrator',
      text: 'The auditor blinks. Nobody has ever offered to pay. He writes it up as "technician self-reported, restitution made," and there is a write-up, and it stings — but you keep the van, and the route, and the ability to look Mrs. Esposito in the eye.',
    },
    quit: {
      speaker: 'narrator',
      text: 'You leave the van keys on the dispatcher\'s desk with a sticky note that just says "sorry." Nobody calls. That, somehow, is the part that stays with you.',
    },
  },
}

const houseCalls: EventDef = {
  id: 'ev_work_house_calls',
  category: 'work',
  weight: 3,
  repeatable: true,
  cooldownDays: 120,
  when: { all: [{ job: 'job_northlink_field_tech' }, free] },
  effects: [{ var: HOUSECALLS, add: 1 }],
  scene: 'ev_work_house_calls_scene',
}

// ── ev_work_forgotten_street ──────────────────────────────────────────────────
// The broadband rollout map has Cannery Row in grey. You're the one filling in the survey.
const wesUp: Cond = { all: [around('northlink_wes'), { not: { flag: 'fac.northlink.wes_burned' } }] }
const marge: Cond = { npc: 'dialtone', met: true }

const streetScene: SceneDef = {
  id: 'ev_work_forgotten_street_scene',
  channel: 'dialog',
  title: 'Phase 4 (TBD)',
  start: 'map',
  nodes: {
    map: {
      speaker: 'narrator',
      text: [
        'The rollout map on the engineering wall is a city in colored pushpins. Harbor Point: green, Phase 1, done. The Hill: green. Millgate: yellow, Phase 2. Cannery Row is a grey smudge with a sticky note: PHASE 4 (TBD) — LOW TAKE RATE.',
        'You grew up in that smudge. The field survey for the Row landed on your desk this morning with a note from marketing: "Just confirm the numbers so we can close this out."',
        { if: wesUp, text: 'Wes Tran stops beside you with his coffee, looks at the map for a while, and says, "I just run the pipe, man." He doesn\'t move on, though.' },
        { if: marge, text: 'You think about Marge Osgood, who patched calls on that copper for thirty years and told you once which wires they forgot to disconnect.' },
      ],
      choices: [
        {
          tag: '[Networking]',
          text: 'Redo the survey properly. The Row\'s old copper is better than anyone here thinks — you\'ve seen it.',
          check: {
            skill: 'networking',
            dc: 15,
            bonuses: [
              { if: marge, add: 2, label: '+2 (Marge told you which wires were good)' },
              { if: { background: 'tinkerer' }, add: 1, label: '+1 (you\'ve had your hands in those junction boxes)' },
            ],
            success: 'survey_ok',
            fail: 'survey_bad',
            successEffects: [{ faction: 'fac.hood', add: 6 }, { flag: 'ev_work.row_wired' }, ...bumpJob(200), { stat: 'mood', add: 5 }],
            failEffects: [...strike, { stat: 'mood', add: -5 }, { faction: 'fac.hood', add: 1 }],
          },
        },
        {
          tag: '[Business]',
          text: 'Pitch the Row as a market: the kids down there are the ones who\'ll pay for games, music and chat.',
          check: {
            skill: 'business',
            dc: 14,
            bonuses: [
              { if: { background: 'class_clown' }, add: 2, label: '+2 (you know how to sell a room)' },
              { if: { faction: 'fac.hood', gte: 25 }, add: 1, label: '+1 (you know those families)' },
            ],
            success: 'pitch_ok',
            fail: 'pitch_bad',
            successEffects: [{ faction: 'fac.hood', add: 4 }, { faction: 'fac.halcyon', add: 2 }, { flag: 'ev_work.row_wired' }, ...bumpJob(150)],
            failEffects: [{ stat: 'mood', add: -4 }, { stat: 'stress', add: 3 }],
          },
        },
        {
          tag: '[OpSec]',
          text: 'Just fudge the numbers. Nobody ever double-checks a field survey.',
          check: {
            skill: 'opsec',
            dc: 13,
            bonuses: [{ if: { background: 'latchkey' }, add: 2, label: '+2 (latchkey kid)' }],
            success: 'fudge_ok',
            fail: 'fudge_bad',
            successEffects: [{ faction: 'fac.hood', add: 5 }, { flag: 'ev_work.row_wired' }],
            failEffects: [...strike, { faction: 'fac.halcyon', add: -2 }, { faction: 'fac.hood', add: -2 }],
          },
        },
        {
          text: 'Fill it in as told. The map is the map.',
          effects: [{ faction: 'fac.hood', add: -3 }, ...bumpJob(100)],
          goto: 'as_told',
        },
      ],
    },
    survey_ok: {
      speaker: 'narrator',
      text: [
        'You spend two weekends in junction boxes on the Row with a line tester and a thermos, and bring back real numbers: the copper under Cannery Row is old, fat and beautiful, laid when things were built to last. The engineers argue for a week and then go quiet.',
        { if: momHere, text: 'The grey sticky note comes down. A new pushpin goes in — yellow, Phase 2. On the Row, nobody knows why. Your mother just says, one Sunday, "The man says we can get the fast internet next spring," and you say "huh," and eat your soup.', else: 'The grey sticky note comes down. A new pushpin goes in — yellow, Phase 2. On the Row, nobody knows why. Sal just mentions, pouring your coffee, that "some kid from the phone company" got the whole block wired, and you say "huh," and drink it.' },
      ],
    },
    survey_bad: {
      speaker: 'narrator',
      text: 'Your numbers are optimistic in the one place engineering checks. At the review, a senior engineer circles it in red and says, not unkindly, "This is what we call a hometown survey." The room laughs. The Row stays grey. Your boss notes "judgment concerns" in your file.',
    },
    pitch_ok: {
      speaker: 'narrator',
      text: 'You bring a one-page pitch: the arcade on Sodium Row, the LAN parties in the church basement, the kids who ride the bus to Terminal Velocity because they can\'t get a fast line at home. "They\'re already paying," you say. "Just not us." Marketing loves it. The Row moves to Phase 2 with a campaign called ALWAYS ON THE ROW. You wince at the name. You don\'t care.',
    },
    pitch_bad: {
      speaker: 'narrator',
      text: 'Marketing loves the pitch so much they apply it to the suburbs. By spring, every cul-de-sac on the Hill has a banner reading ALWAYS ON — FOR THE WHOLE FAMILY, over a photo of a kid who looks like you did at twelve. The Row stays grey.',
    },
    fudge_ok: {
      speaker: 'narrator',
      text: 'You nudge the take-rate estimate up four points and the copper quality up one grade. Nobody checks. The Row moves up to Phase 2. It is the most useful lie you have ever told, and it gets a neighborhood wired, and you will never be able to tell anyone about it.',
    },
    fudge_bad: {
      speaker: 'narrator',
      text: [
        'Engineering double-checks the field survey. Of course they do — the new compliance memo says they have to. The numbers you nudged don\'t match the test logs. Your supervisor calls it "data integrity." The Row gets bumped to Phase 5, "pending review," which is where streets go to be forgotten.',
        { if: wesUp, text: 'Wes finds you in the stairwell. "Next time," he says quietly, "ask me first. I know which numbers they check." He doesn\'t report it further. He could have.' },
      ],
    },
    as_told: {
      speaker: 'narrator',
      text: 'You confirm the numbers. The Row stays grey. Driving home that night through the Flats, you notice for the first time how many windows glow the blue of a dial-up modem at one in the morning — kids, waiting for a download to finish, the way you used to.',
    },
  },
}

const forgottenStreet: EventDef = {
  id: 'ev_work_forgotten_street',
  category: 'city',
  weight: 3,
  when: {
    all: [
      { job: ['job_northlink_field_tech', 'job_northlink_neteng', 'job_northlink_architect'] },
      { var: 'w.broadband', gte: 1 },
      { var: 'w.broadband', lte: 2 },
      free,
    ],
  },
  scene: 'ev_work_forgotten_street_scene',
}

export default defineContent({
  scenes: [pagerScene, labScene, houseScene, splitAudit, streetScene],
  events: [pagerDuty, labQueue, houseCalls, forgottenStreet],
})
