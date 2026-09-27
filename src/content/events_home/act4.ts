/**
 * events_home — ACT IV (days ~2800+). The long tail comes home: Dad falls off a ladder and has to
 * learn to walk again (a personal quest that asks you to show up), your childhood room gets packed
 * into boxes (one of which should never have been kept), and the cat is old now.
 * Callbacks: Dad's radio (ev_home.radio_*), the Sunday dinners, the cat's name.
 */
import { defineContent } from '@/engine/registry'
import type { Cond, Effect, EventDef, QuestDef, SceneDef } from '@/engine/types'
import {
  BANDAGED_HAND,
  HOME_WARM,
  PORCH_EVENINGS,
  actGte,
  buff,
  dadHere,
  free,
  hasCat,
  kimHere,
  momGone,
  momHere,
  notAtParents,
  owe,
  parallaxLive,
  partnerIs,
  withPartner,
} from './_shared'

/** Late game: Act IV, or deep enough into the calendar that the long tail has started. */
const lateGame: Cond = { any: [actGte(4), { day: true, gte: 3000 }] }

// ── ev_home_dad_fall ──────────────────────────────────────────────────────────
// The phone at 7 a.m. Dad, a ladder, a hip. Harbor Point General.
const toRehab: Effect[] = [{ quest: 'ev_home_q_dad_rehab', start: true }]

const dadFallScene: SceneDef = {
  id: 'ev_home_dad_fall_scene',
  channel: 'dialog',
  title: 'The Ladder',
  pause: true,
  start: 'call',
  nodes: {
    call: {
      speaker: 'narrator',
      text: [
        { if: kimHere, text: 'Kim calls at 7:02 a.m. She never calls; she pages. "Dad fell. He\'s okay. He\'s not okay. He\'s at Harbor General. Come."' },
        { if: { all: [{ not: kimHere }, momHere] }, text: 'Mom calls at 7:02 a.m., and her voice is doing the thing where it is very calm on purpose. "Your father fell. Harbor General. Come now, please."' },
        { if: { all: [{ not: kimHere }, { not: momHere }, { npc: 'dad', fate: 'dating_again' }] }, text: 'A woman\'s voice at 7:02 a.m. "This is Bernadette. Robert\'s — friend. He fell. He\'s at Harbor General and he keeps saying not to call you, so I\'m calling you."' },
        { if: { all: [{ not: kimHere }, { not: momHere }, { not: { npc: 'dad', fate: 'dating_again' } }] }, text: 'The Harbor Point General switchboard calls at 7:02 a.m. You are listed as next of kin. Robert Tan has been admitted. Robert Tan is asking for you, and also for his toolbox.' },
        { if: { npc: 'dad', fate: 'retrained' }, text: 'He was on a customer\'s ladder, running a cable into their attic for a new PC. He finished the job before he let anyone call the ambulance. Of course he did.' },
        { if: { npc: 'dad', fate: 'mill_ghost' }, text: 'It happened on the loading dock stairs at the datacenter — the old mill — on the night shift. The company has already sent a form. The form is mostly about what the company is not responsible for.' },
        { if: { npc: 'dad', fate: 'spiral' }, text: 'He fell on the stairs outside the flat, late. Nobody says why. Nobody has to.' },
        { if: { not: { npc: 'dad', fate: ['retrained', 'mill_ghost', 'spiral'] } }, text: 'He was on the ladder cleaning the gutters, because it was Saturday and the gutters were full and he is sixty-one and nobody could tell him not to.' },
        'It\'s his hip.',
      ],
      choices: [
        {
          text: 'Drop everything. Go.',
          effects: [{ stat: 'energy', add: -15 }, { npc: 'dad', affinity: 6 }, { flag: 'ev_home.went_to_dad' }],
          goto: 'hospital',
        },
        {
          text: 'You\'re in the middle of something that can\'t stop. Send money and call tonight ($500).',
          req: { stat: 'money', gte: 500 },
          reqText: 'Requires $500',
          effects: [{ money: -500 }, { npc: 'dad', affinity: -5 }, { if: kimHere, then: [{ npc: 'kim', affinity: -4 }] }, ...toRehab],
          goto: 'from_afar',
        },
      ],
    },
    hospital: {
      speaker: 'dad',
      text: [
        'He\'s in a bed by the window, grey in the face, trying to look like a man lying down on purpose. "Hey, kiddo. Look at this. Look at your old man." He tries a laugh and it doesn\'t come.',
        'Then the billing coordinator arrives with a clipboard, and Dad\'s face does something you\'ve never seen it do. It gets scared.',
        { if: parallaxLive, text: 'The clipboard has his "coverage tier" printed at the top. It\'s low. Someone somewhere decided a laid-off mill worker from the Flats was a poor risk, and a machine agreed.' },
      ],
      choices: [
        {
          tag: '[Business]',
          text: 'Take the clipboard. Handle the billing office before they send him home with a number he\'ll never say out loud.',
          check: {
            skill: 'business',
            dc: 16,
            bonuses: [
              { if: parallaxLive, add: -2, label: '-2 (his file carries a risk score)' },
              { if: { trait: 'silver_tongue' }, add: 2, label: '+2 (silver tongue)' },
              { if: { flag: 'ev_home.saw_riskscore' }, add: 2, label: '+2 (you know exactly which appeal code they fear)' },
            ],
            success: 'billing_win',
            fail: 'billing_lose',
          },
        },
        {
          text: 'Pay the deductible yourself, right now, before he can argue ($1,500).',
          req: { stat: 'money', gte: 1500 },
          reqText: 'Requires $1,500',
          effects: [{ money: -1500 }, { npc: 'dad', affinity: 2 }],
          goto: 'paid',
        },
        {
          text: 'Let him and his insurance sort it out. He\'d want it that way.',
          effects: [{ npc: 'dad', affinity: -2 }, { stat: 'stress', add: 5 }],
          goto: 'his_way',
        },
      ],
    },
    billing_win: {
      speaker: 'narrator',
      text: 'Forty minutes in a windowless office with a coordinator named Maureen and a stack of codes. You find the duplicate charge, the "facility fee" for a facility he never visited, and the appeal line that gets things escalated. The number on the clipboard falls by two-thirds. Dad watches you walk back in and says, "Huh." Same "huh" as the phone bill. Just as good.',
      effects: [{ money: -200 }, { npc: 'dad', affinity: 4 }, { xp: 'business', add: 25 }, ...toRehab],
      next: 'rehab_start',
    },
    billing_lose: {
      speaker: 'narrator',
      text: 'Maureen is sympathetic and powerless. The codes are the codes. The only thing she can offer is a payment plan, and the plan is the kind that follows a family for a year. You sign it, so he won\'t have to. He sees you sign it. He doesn\'t say anything, and that\'s worse.',
      effects: [owe('ev_home_dad_bill', 'Dad\'s hospital bill', 12, 120), { stat: 'stress', add: 10 }, ...toRehab],
      next: 'rehab_start',
    },
    paid: {
      speaker: 'dad',
      text: '"You didn\'t have to do that." He says it four times over the next hour, each time a little quieter. The fifth time, he just holds your wrist for a second, the way he used to hold the ladder for you when you were small.',
      effects: [...toRehab],
      next: 'rehab_start',
    },
    his_way: {
      speaker: 'narrator',
      text: 'He signs the forms himself, reading every line with his glasses on the end of his nose. It takes an hour. You sit with him. When the total comes up he just nods, like it\'s weather. Later you find out he\'s been paying it off with the money he was saving for a boat he was never going to buy.',
      effects: [...toRehab],
      next: 'rehab_start',
    },
    rehab_start: {
      speaker: 'narrator',
      text: [
        'The surgeon says the operation went well, and that the next three months matter more than the operation did. Physical therapy, three sessions a week. Stairs. A walker, then a cane, then — if he works at it, and if he isn\'t alone with it — nothing.',
        '"I don\'t need anybody to watch me walk down a hallway," Dad says. Everyone in the room hears what he means.',
      ],
    },
    from_afar: {
      speaker: 'narrator',
      text: 'You call that night. Dad is groggy and cheerful and says it\'s nothing, a little hip thing, the doctors are very young. In the background you hear Kim, or a nurse, or a television, saying the words "three months of therapy." He says he doesn\'t need anybody to watch him walk down a hallway. You tell yourself you believe him.',
    },
  },
}

const visitGo = (next?: string): Effect[] => [
  { var: 'ev_home.dad_visits', add: 1 },
  { stat: 'energy', add: -10 },
  { npc: 'dad', affinity: 3 },
  ...(next ? [{ scene: next, delayHours: 24 * 21 }] : []),
]
const visitSkip = (next?: string): Effect[] => [{ npc: 'dad', affinity: -2 }, ...(next ? [{ scene: next, delayHours: 24 * 21 }] : [])]
/** After a visit: two sessions attended → recovery done; otherwise keep going (or conclude on the last). */
const settleAfter2: Effect = {
  if: { var: 'ev_home.dad_visits', gte: 2 },
  then: [{ flag: 'ev_home.dad_rehab_done' }, { flag: 'ev_home.dad_rehab_over' }],
  else: [{ scene: 'ev_home_rehab_visit_3_scene', delayHours: 24 * 21 }],
}
const settleFinal: Effect[] = [
  { if: { var: 'ev_home.dad_visits', gte: 2 }, then: [{ flag: 'ev_home.dad_rehab_done' }] },
  { flag: 'ev_home.dad_rehab_over' },
]

const visit1Scene: SceneDef = {
  id: 'ev_home_rehab_visit_1_scene',
  channel: 'mail',
  title: 'PT Tuesday 10am',
  from: 'dad',
  start: 'mail',
  expiresDays: 14,
  onExpire: visitSkip('ev_home_rehab_visit_2_scene'),
  nodes: {
    mail: {
      speaker: 'dad',
      text: [
        'Kiddo,',
        'Physical therapy is Tuesday at 10 at the Harbor General annex. Second floor, past the vending machines. You don\'t have to come. The therapist is a young man named Terrence who says "awesome" when I stand up. I stand up very well.',
        { if: { flag: 'ev_home.went_to_dad' }, text: 'Thank you for coming the first day. I didn\'t say it then.' },
        '— Dad',
        { if: kimHere, text: '(Your sister showed me how to send these. I am told I do not have to sign them.)', else: '(Mrs. Castellano\'s grandson showed me how to send these. I am told I do not have to sign them.)' },
      ],
      choices: [
        { text: 'Go. Walk the hallway with him.', effects: visitGo('ev_home_rehab_visit_2_scene'), goto: 'went' },
        { text: '"Can\'t this week, Dad. Next time for sure."', effects: visitSkip('ev_home_rehab_visit_2_scene'), goto: 'skipped' },
      ],
    },
    went: {
      speaker: 'narrator',
      text: 'He does the parallel bars four times, sweating, jaw set, and doesn\'t look at you once. On the fourth pass he stops at the end, breathing hard, and says to Terrence, "That\'s my kid." Terrence says "awesome."',
    },
    skipped: {
      speaker: 'dad',
      text: 'Understood. Terrence says I am "crushing it." I am not sure what I am crushing. — Dad',
    },
  },
}

const visit2Scene: SceneDef = {
  id: 'ev_home_rehab_visit_2_scene',
  channel: 'mail',
  title: 'Stairs',
  from: 'dad',
  start: 'mail',
  expiresDays: 14,
  onExpire: [{ npc: 'dad', affinity: -2 }, settleAfter2],
  nodes: {
    mail: {
      speaker: 'dad',
      text: [
        'Kiddo,',
        'This week is stairs. They say I have to practice at home too, and the flat has the bad stairs, you know the ones. Terrence says I need a rail in the bathroom and one on the landing. I can put them in myself once I can stand on a ladder, which they say is never. So.',
        { if: { var: 'ev_home.dad_visits', gte: 1 }, text: 'You don\'t have to come again. It was good that you came.' },
        '— Dad',
      ],
      choices: [
        {
          tag: '[Hardware]',
          text: 'Go to the session, then put the rails in at the flat yourself, properly, the way he\'d do it.',
          effects: [{ var: 'ev_home.dad_visits', add: 1 }, { stat: 'energy', add: -15 }],
          check: {
            skill: 'hardware',
            dc: 15,
            bonuses: [
              { if: { background: 'tinkerer' }, add: 2, label: '+2 (basement tinkerer)' },
              { if: { trait: 'ev_home_storm_tested' }, add: 1, label: '+1 (storm-tested)' },
              { if: { flag: 'ev_home.radio_fixed' }, add: 1, label: '+1 (he taught you, once, with the radio)' },
            ],
            success: 'rails_win',
            fail: 'rails_lose',
            successEffects: [{ npc: 'dad', affinity: 6 }, { flag: 'ev_home.dad_rails' }, settleAfter2],
            failEffects: [{ money: -150 }, { npc: 'dad', affinity: 2 }, buff(BANDAGED_HAND), settleAfter2],
          },
        },
        { text: 'Go to the session and hire someone for the rails ($200).', req: { stat: 'money', gte: 200 }, reqText: 'Requires $200', effects: [{ money: -200 }, ...visitGo(), settleAfter2], goto: 'hired' },
        { text: '"I\'m buried this month, Dad. I\'ll call."', effects: [{ npc: 'dad', affinity: -2 }, settleAfter2], goto: 'skipped' },
      ],
    },
    rails_win: {
      speaker: 'narrator',
      text: 'Two rails, level and anchored into studs, a no-slip mat, a stool in the shower. Dad watches from a kitchen chair, pointing, supervising, criticizing your drill angle exactly like his father criticized his. When you finish he grips the landing rail with both hands and pulls, hard, and it doesn\'t move. "Good," he says. "Good work." You will remember it longer than any paycheck.',
    },
    rails_lose: {
      speaker: 'narrator',
      text: 'The first rail comes off the wall in Dad\'s hand on the first test, along with a fist-sized chunk of plaster. You find a stud on the second try and cut your hand on the bracket on the third. A handyman from the church finishes it on Saturday for $150, very kindly, while Dad tells him the story of the first rail in great detail.',
    },
    hired: {
      speaker: 'narrator',
      text: 'The session is stairs, up and down, up and down, Dad counting under his breath in a way you recognize from when he taught you to ride a bike. The handyman comes on Thursday. Dad inspects his work with open suspicion and eventually pronounces it "fine," which from him is a medal.',
    },
    skipped: {
      speaker: 'dad',
      text: [
        { if: kimHere, text: 'Understood. Your sister came. She did the rails out of a library book. They are a little crooked. They hold. — Dad', else: 'Understood. A man from church came and did the rails. He talked the whole time about his own hip. They hold. — Dad' },
      ],
    },
  },
}

const visit3Scene: SceneDef = {
  id: 'ev_home_rehab_visit_3_scene',
  channel: 'mail',
  title: 'Last session',
  from: 'dad',
  start: 'mail',
  expiresDays: 14,
  onExpire: [{ npc: 'dad', affinity: -2 }, ...settleFinal],
  nodes: {
    mail: {
      speaker: 'dad',
      text: [
        'Kiddo,',
        'Last session is Thursday. Terrence says if I do the long hallway without the cane they will give me a certificate. I told him I have a certificate from the mill for twenty years of service and it is in a drawer. He said this one is better. He may be right.',
        '— Dad',
      ],
      choices: [
        { text: 'Be there Thursday. Front row.', effects: [...visitGo(), ...settleFinal], goto: 'went' },
        { text: '"I\'m so sorry, Dad. I can\'t."', effects: [{ npc: 'dad', affinity: -3 }, ...settleFinal], goto: 'skipped' },
      ],
    },
    went: {
      speaker: 'narrator',
      text: 'He does the long hallway without the cane. Slowly. You walk backwards in front of him the whole way, like he did for you when you were one, and when he reaches the end the therapists clap and Terrence says "AWESOME" at a volume that is frankly unprofessional.',
    },
    skipped: {
      speaker: 'dad',
      text: 'Understood. I did the hallway. I think. There was a lot of clapping. — Dad',
    },
  },
}

const rehabDoneScene: SceneDef = {
  id: 'ev_home_rehab_done_scene',
  channel: 'mail',
  title: 'Certificate',
  from: 'dad',
  start: 'mail',
  nodes: {
    mail: {
      speaker: 'dad',
      text: [
        'Kiddo,',
        'They gave me the certificate. It says "Outstanding Effort." I have put it on the refrigerator next to your fourth-grade science fair ribbon, which I would like you to know is still there.',
        'I walked to the Cathode and back yesterday. Sal gave me pie and would not take money. I told him my kid would pay. So you owe Sal for a pie.',
        'Thank you for coming. I don\'t say things. You know that. — Dad',
      ],
      choices: [{ text: 'Frame the email. Well. Print it and put it on your own fridge.', effects: [{ stat: 'mood', add: 8 }, buff(HOME_WARM)] }],
    },
  },
}

const rehabQuest: QuestDef = {
  id: 'ev_home_q_dad_rehab',
  title: 'Dad\'s Recovery',
  kind: 'personal',
  giver: 'dad',
  priority: 6,
  summary: 'Dad broke his hip. The surgeon says the next three months matter more than the operation: therapy, stairs, and — whether he admits it or not — someone who shows up.',
  rewards: 'Your father, walking',
  start: 'rehab',
  stages: {
    rehab: {
      text: 'Dad has physical therapy through the spring. He says he doesn\'t need anybody to watch him walk down a hallway. He means the opposite. Be there for at least two of his sessions.',
      hint: 'Dad emails you before each session. Show up for at least two of the three.',
      objectives: [
        {
          id: 'visits',
          text: 'Be there for Dad\'s therapy sessions',
          when: { flag: 'ev_home.dad_rehab_over' },
          progress: { of: { var: 'ev_home.dad_visits' }, target: 2 },
        },
      ],
      onEnter: [{ var: 'ev_home.dad_visits', set: 0 }, { scene: 'ev_home_rehab_visit_1_scene', delayHours: 24 * 14 }],
      next: [{ if: { flag: 'ev_home.dad_rehab_done' }, stage: 'walking' }, { stage: 'cane' }],
    },
    walking: {
      text: 'Dad walks without the cane now — slowly, stubbornly, and to the Cathode and back every morning. You were there for it.',
      objectives: [{ id: 'done', text: 'Dad is walking', hidden: true, when: { always: true } }],
      onComplete: [{ npc: 'dad', affinity: 8 }, { faction: 'fac.hood', add: 2 }, { scene: 'ev_home_rehab_done_scene', delayHours: 24 * 7 }],
    },
    cane: {
      text: 'Dad got through it mostly on his own, with the neighbors and a therapist named Terrence. He walks with a cane now. He never mentions the sessions you missed. He doesn\'t have to.',
      objectives: [{ id: 'done', text: 'Dad walks with a cane', hidden: true, when: { always: true } }],
      onComplete: [{ npc: 'dad', affinity: -6 }, { flag: 'ev_home.dad_cane' }, { trait: 'ev_home_missed_calls' }],
      outcome: 'failed',
    },
  },
}

const dadFall: EventDef = {
  id: 'ev_home_dad_fall',
  category: 'family',
  weight: 3,
  when: { all: [dadHere, lateGame, { day: true, gte: 2800 }, free] },
  scene: 'ev_home_dad_fall_scene',
}

// ── ev_home_old_bedroom ───────────────────────────────────────────────────────
// Your parents are finally clearing out your childhood room. There is a box.
const oldBedroomScene: SceneDef = {
  id: 'ev_home_old_bedroom_scene',
  channel: 'dialog',
  title: 'Your Old Room',
  start: 'boxes',
  nodes: {
    boxes: {
      speaker: 'narrator',
      text: [
        { if: momHere, text: 'Mom is turning your old room into a sewing room. She has wanted a sewing room for twenty-five years and has decided, with a lifetime of patience used up, that it is now.' },
        { if: { all: [momGone, { npc: 'dad', fate: 'retrained' }] }, text: 'Dad is turning your old room into the PC Doctor workshop. He says it\'s practical. He says it without looking at the other room, the one with Mom\'s reading glasses still on the windowsill.' },
        { if: { all: [momGone, { not: { npc: 'dad', fate: 'retrained' } }] }, text: 'Dad says the flat is too big now. He\'s not moving, not yet. He just wants your room to be "something." He doesn\'t know what. He just can\'t leave it a museum anymore.' },
        'The room is boxes. Your posters, rolled. Your first keyboard, missing the E. Stacks of burned CDs labeled in teenage handwriting.',
        'And at the bottom of the closet, a spiral notebook with your first handle on the cover in marker — started at sixteen and kept long after you should have stopped. Board numbers, old handles, the names of people who trusted you. Things you should never have written down.',
        { if: { flag: 'a1.grandma_done' }, text: 'Near the back, in your worst handwriting: notes from the night you cleaned out Grandma Ruth\'s PC and found the thing that phoned home.' },
        { if: { flag: 'ev_home.radio_fixed' }, text: 'On the shelf, the walnut radio, still working. Dad plays it on Saturdays. It\'s been waiting for you.' },
        { if: { flag: 'ev_home.radio_broken' }, text: 'On the shelf, the walnut radio, silent, where Dad put it back years ago. He never threw it out.' },
      ],
      choices: [
        {
          text: 'Sit down on the floor with Dad and go through everything, one box at a time.',
          effects: [{ npc: 'dad', affinity: 6 }, { stat: 'mood', add: 6 }, { if: momHere, then: [{ npc: 'mom', affinity: 3 }] }],
          goto: 'floor',
        },
        {
          tag: '[OpSec]',
          text: 'Pocket the notebook before anyone opens it, and make sure it stops existing — properly, today.',
          check: {
            skill: 'opsec',
            dc: 17,
            bonuses: [
              { if: { trait: 'paranoid' }, add: 2, label: '+2 (you\'ve thought about this notebook for years)' },
              { if: { flag: 'life.family_shield' }, add: 1, label: '+1 (the family already closes ranks)' },
            ],
            success: 'burned',
            fail: 'rummage',
          },
        },
        {
          text: '"Throw it all out. I don\'t live there anymore."',
          effects: [{ npc: 'dad', affinity: -4 }, { if: momHere, then: [{ npc: 'mom', affinity: -3 }] }],
          goto: 'toss',
        },
      ],
    },
    floor: {
      speaker: 'dad',
      text: [
        'It takes all afternoon. Dad holds up every CD and reads the label out loud — "\'Mix for Jax Do Not Touch\'" — and you tell him the stories, the harmless ones. He laughs at all of them. He finds a science fair ribbon and puts it in his shirt pocket without a word.',
        { if: { flag: 'ev_home.radio_broken' }, text: 'At the end, he lifts the walnut radio off the shelf and puts it in your arms. "Try again sometime," he says. "No rush." Neither of you mentions the last time.' },
        { if: { flag: 'ev_home.radio_fixed' }, text: 'At the end, he turns on the walnut radio. The big band station from across the Sound is long gone, so it\'s a call-in show about fishing. You both listen to the whole thing.' },
        'The notebook, you slide into your jacket when he isn\'t looking. That one you\'ll deal with on your own.',
      ],
      effects: [buff(HOME_WARM), { flag: 'ev_home.kept_notebook' }],
    },
    burned: {
      speaker: 'narrator',
      text: 'You pocket it before anyone sees. That night, in the sink of your own apartment, you tear it page by page and let each one burn down to your fingers, then run the ashes down the drain. Ten years of carrying a thing you forgot you were carrying, gone in fifteen minutes. You feel lighter. You also feel sixteen, and a little sad.',
      effects: [{ stat: 'heat', add: -3 }, { stat: 'stress', add: -5 }, { flag: 'ev_home.notebook_burned' }],
    },
    rummage: {
      speaker: 'narrator',
      text: [
        'You go through the closet twice. Then the boxes. Then the boxes again. The notebook isn\'t there.',
        '"Oh — the papers?" Dad says. "I gave a box of old papers to the church rummage sale on Saturday. Mrs. Castellano\'s grandson was helping. It all went. Somebody bought the whole box for a quarter."',
        'Somewhere in Port Lumen, for twenty-five cents, someone owns your childhood handle, your first board numbers, and the names of people who trusted you. You spend a week trying to trace who bought it. You don\'t find them. Someone else might find you.',
      ],
      effects: [{ stat: 'heat', add: 8 }, { stat: 'stress', add: 10 }, { flag: 'ev_home.notebook_lost' }, { chance: 0.5, then: [{ complication: 'legal' }] }],
    },
    toss: {
      speaker: 'narrator',
      text: 'Dad nods, slowly, and starts filling trash bags. He doesn\'t argue. That\'s how you know you hurt him.',
      effects: [
        {
          random: [
            { weight: 6, effects: [{ flag: 'ev_home.notebook_trashed' }] },
            { weight: 4, effects: [{ flag: 'ev_home.notebook_lost' }, { stat: 'heat', add: 5 }, { chance: 0.35, then: [{ complication: 'legal' }] }] },
          ],
        },
      ],
      next: 'toss_after',
    },
    toss_after: {
      speaker: 'narrator',
      text: [
        { if: { flag: 'ev_home.notebook_lost' }, text: 'Weeks later you remember the notebook, and your stomach drops. Dad says the papers went to the church rummage sale, not the trash. The whole box sold for a quarter. You never find out to whom.' },
        { if: { not: { flag: 'ev_home.notebook_lost' } }, text: 'Weeks later you remember the notebook, and your stomach drops — until Dad mentions that everything went to the landfill on the Thursday truck. Somewhere under a thousand tons of Port Lumen, your sixteen-year-old self is finally, safely, garbage.' },
      ],
    },
  },
}

const oldBedroom: EventDef = {
  id: 'ev_home_old_bedroom',
  category: 'family',
  weight: 2,
  when: { all: [dadHere, notAtParents, lateGame, { day: true, gte: 2850 }, free] },
  scene: 'ev_home_old_bedroom_scene',
}

// ── ev_home_old_cat ───────────────────────────────────────────────────────────
// The cat is old. She can't make the jump to the desk anymore.
const oldCatScene: SceneDef = {
  id: 'ev_home_old_cat_scene',
  channel: 'dialog',
  title: 'Old Cat',
  start: 'jump',
  nodes: {
    jump: {
      speaker: 'narrator',
      text: [
        '{flag:ev_home.cat_name} tries to jump onto the desk and doesn\'t make it. She lands badly, looks around to see if anyone noticed, and washes her shoulder with enormous dignity. You noticed.',
        'She\'s old now. Grey around the muzzle, thin along the spine, and she sleeps most of the day in the one patch of sun that crosses the floor between two and four. The CRT she loved is long gone; she sleeps on the warm router instead and has never forgiven the flat screen.',
        { if: { flag: 'ev_home.cat_surgery' }, text: 'There\'s still a little shaved patch on her belly from the surgery, years ago, where the fur grew back white.' },
      ],
      choices: [
        {
          tag: '[Hardware]',
          text: 'Build her a ramp to the desk — a shelf board, carpet scraps, and some actual care.',
          check: {
            skill: 'hardware',
            dc: 14,
            bonuses: [{ if: { background: 'tinkerer' }, add: 2, label: '+2 (basement tinkerer)' }],
            success: 'ramp_win',
            fail: 'ramp_lose',
          },
        },
        {
          text: 'Stop at six tonight. Sit on the floor with her in the last of the sun.',
          effects: [buff(PORCH_EVENINGS), { stat: 'mood', add: 8 }, { stat: 'stress', add: -10 }],
          goto: 'sun',
        },
        {
          text: 'Take her to the vet on the Hill for a checkup ($150).',
          req: { stat: 'money', gte: 150 },
          reqText: 'Requires $150',
          effects: [{ money: -150 }, { stat: 'mood', add: 3 }],
          goto: 'vet',
        },
        {
          if: withPartner,
          text: 'Let your partner spoil her rotten this week.',
          effects: [
            { stat: 'mood', add: 4 },
            { if: partnerIs('mira'), then: [{ npc: 'mira', affinity: 3 }], else: [{ npc: 'grace', affinity: 3 }] },
          ],
          goto: 'partner',
        },
      ],
    },
    ramp_win: {
      speaker: 'narrator',
      text: 'It takes a Saturday. The ramp is carpeted, gently sloped, and built to a standard that would pass any inspection. She ignores it for two days out of principle, then uses it every morning for the rest of her life, walking up it slowly to sit beside the keyboard like a supervisor arriving at the office.',
      effects: [{ stat: 'mood', add: 6 }, { xp: 'hardware', add: 15 }],
    },
    ramp_lose: {
      speaker: 'narrator',
      text: 'The saw slips. You spend three hours at urgent care and come home with six stitches and a ramp that rocks. She tries it once, feels it wobble, and gives you a look of profound disappointment. Then she climbs into your lap instead, and stays there while you type with nine fingers. Maybe that was the point.',
      effects: [buff(BANDAGED_HAND), { money: -90 }, { stat: 'mood', add: 2 }],
    },
    sun: {
      speaker: 'narrator',
      text: 'You lie down on the floor next to her in the square of sun. She puts one paw on your wrist, the way she used to on the mouse. The work waits. For once, you let it. When the sun moves off the floor at four, she follows it, and so do you.',
    },
    vet: {
      speaker: 'narrator',
      text: 'The vet listens to her heart, feels her kidneys, looks at her teeth, and says, "She\'s old. She\'s fine. She has maybe a few good years left if nobody drops a monitor on her." {flag:ev_home.cat_name} bites the vet, lightly, as a matter of record.',
    },
    partner: {
      speaker: 'narrator',
      text: [
        { if: partnerIs('mira'), text: 'Mira builds her a heated bed out of a spare router power supply and a folded sweater, and documents her sleeping schedule in a spreadsheet with a tab labeled "naps (optimal)."' },
        { if: partnerIs('grace'), text: 'Grace brings home the soft food the vet recommended, sits with her every night after shift, and talks to her in the same calm voice she uses on scared patients. The cat, who has never liked anyone but you, follows Grace from room to room.' },
      ],
    },
  },
}

const oldCat: EventDef = {
  id: 'ev_home_old_cat',
  category: 'life',
  weight: 2,
  when: { all: [hasCat, lateGame, { day: true, gte: 2900 }, free] },
  scene: 'ev_home_old_cat_scene',
}

export default defineContent({
  events: [dadFall, oldBedroom, oldCat],
  scenes: [dadFallScene, visit1Scene, visit2Scene, visit3Scene, rehabDoneScene, oldBedroomScene, oldCatScene],
  quests: [rehabQuest],
})
