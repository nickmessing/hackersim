/**
 * events_work — THE OFFICE (mostly Act II). Web shops and clients from hell, Halcyon's koi pond,
 * Meridian's last mainframe man, the estimate somebody asks for in a hallway, and the holiday
 * party every office in Port Lumen throws whether it can afford one or not.
 *
 * Mini-arc: `ev_work_q_gordon` — learn LEDGER-7 before Gordon retires, then survive April.
 *
 * HARD RULE: all tech here is invented flavor, never real technique.
 */
import { defineContent } from '@/engine/registry'
import type { BuffDef, Cond, EventDef, QuestDef, SceneDef } from '@/engine/types'
import {
  BAD_WORD,
  CC_JOBS,
  CRUNCH,
  FRIED,
  GOOD_WORD,
  HALCYON_JOBS,
  MERIDIAN_JOBS,
  NORTHLINK_JOBS,
  OFFICE_HERO,
  OFFICE_TRACKS,
  ON_CALL,
  PARTY_REGRET,
  SHOP_JOBS,
  STARTUP_JOBS,
  DAWN_SHIFT,
  LSU_JOBS,
  around,
  bumpJob,
  free,
  onFinalWarning,
  partySeason,
  strike,
  withGrace,
  withMira,
} from './_shared'

// ── ev_work_client_from_hell ──────────────────────────────────────────────────
// Repeatable. The ferry company, the dentist, the realtor: one per firing, in that order.
const CLIENTS = 'ev_work.clients'
const atCoop = { job: ['job_coop_dev', 'job_coop_partner'] }
const ferry: Cond = { var: CLIENTS, eq: 1 }
const dentist: Cond = { var: CLIENTS, eq: 2 }
const realtor: Cond = { var: CLIENTS, gte: 3 }

const clientScene: SceneDef = {
  id: 'ev_work_client_from_hell_scene',
  channel: 'dialog',
  title: 'The Client',
  start: 'brief',
  nodes: {
    brief: {
      speaker: 'narrator',
      text: [
        { if: ferry, text: 'Captain Ray Dorsey of the Lumen Sound Ferry Company has approved the site mock-up, with one small change. He would like the ferry logo to spin. He would like it to sound the ferry\'s actual foghorn, as a MIDI file, every time the page loads. He would like this by Monday, because Monday is the new timetable, and the timetable must be on the site, and the timetable must also spin.' },
        { if: dentist, text: 'Dr. Leonard Feld, Family Dentistry, Harbor Point, has seen a website that does a thing and he wants his website to do the thing. The thing is a cartoon tooth named Molar Mike who follows your mouse cursor around the screen, forever, smiling. Also the invoice from March "seems high." Also he has "a few thoughts" about the colors, and the thoughts are forty pages long.' },
        { if: realtor, text: 'Brenda Vance of Vance Harbor Realty wants her face bigger. On every page. In the header, the footer, and — this is new — faintly behind the listings, like a watermark, "like I\'m watching over the home." She has not paid the last two invoices. She has sent eleven emails today. The subject line of the eleventh is "???????".' },
        { if: { flag: 'ev_work.phoned_in' }, text: 'Somewhere on the web, the last client\'s site still limps along with your name in the footer. You try not to think about it.' },
        { if: atCoop, text: 'At the co-op, a client this bad goes to a vote. The vote, as always, is that you handle it, because you\'re "good with people," which is what the co-op says when it means "you were late to the meeting."' },
      ],
      choices: [
        {
          tag: '[Programming]',
          text: 'Pull the all-nighter and build exactly the monstrosity they asked for — flawlessly.',
          check: {
            skill: 'programming',
            dc: 13,
            bonuses: [
              { if: { trait: 'night_owl' }, add: 2, label: '+2 (3 a.m. is your hour)' },
              { if: { trait: 'caffeine_fiend' }, add: 1, label: '+1 (the pot is on)' },
              { if: { background: 'mathlete' }, add: 1, label: '+1 (you actually know how to make it spin)' },
            ],
            success: 'shipped',
            fail: 'launch_fail',
            successEffects: [{ money: 120 }, ...bumpJob(200), { stat: 'energy', add: -15 }],
            failEffects: [{ buff: BAD_WORD }, { stat: 'stress', add: 8 }, { stat: 'energy', add: -15 }, { chance: 0.3, then: [{ complication: 'work' }] }],
          },
        },
        {
          tag: '[Business]',
          text: 'Send the change-order form. Every spin, every tooth, every face costs extra, in writing, up front.',
          check: {
            skill: 'business',
            dc: 14,
            bonuses: [
              { if: { trait: 'silver_tongue' }, add: 2, label: '+2 (silver tongue)' },
              { if: { background: 'class_clown' }, add: 1, label: '+1 (you make "no" sound like a favor)' },
            ],
            success: 'change_order',
            fail: 'client_walks',
            successEffects: [{ money: 250 }, { faction: 'fac.halcyon', add: 1 }, ...bumpJob(150)],
            failEffects: [{ buff: BAD_WORD }, { stat: 'mood', add: -4 }, { if: atCoop, then: [{ money: -40 }] }],
          },
        },
        {
          req: { stat: 'money', gte: 20 },
          reqText: 'Requires $20',
          tag: '[Social · $20]',
          text: 'Take them to lunch at the Cathode and talk them down to something sane.',
          effects: [{ money: -20 }],
          check: {
            skill: 'social',
            dc: 12,
            bonuses: [
              { if: { trait: 'empath' }, add: 2, label: '+2 (you figure out what they actually want)' },
              { if: { faction: 'fac.hood', gte: 20 }, add: 1, label: '+1 (Sal gives you the good booth)' },
            ],
            success: 'lunch_win',
            fail: 'lunch_lose',
            successEffects: [{ money: 100 }, { buff: GOOD_WORD }],
            failEffects: [{ stat: 'energy', add: -20 }, { stat: 'stress', add: 6 }, { chance: 0.4, then: [{ buff: BAD_WORD }] }],
          },
        },
        {
          text: 'Build it. Badly. Bill it anyway.',
          effects: [{ money: 80 }, { stat: 'mood', add: -3 }, { flag: 'ev_work.phoned_in' }],
          goto: 'phoned_in',
        },
      ],
    },
    shipped: {
      speaker: 'narrator',
      text: [
        { if: ferry, text: 'At 4 a.m. the ferry spins. The foghorn blares. The timetable is correct to the minute. Captain Dorsey calls on Monday to say his granddaughter "cried, it was so modern," and pays the invoice the same day, by check, with a doodle of a boat on it.' },
        { if: dentist, text: 'Molar Mike follows the cursor with the dead-eyed devotion of a golden retriever. Dr. Feld is ecstatic. His receptionist is not. Business goes up twelve percent and a local kid makes a fan page for Molar Mike, which is, somehow, the most successful thing you have ever built.' },
        { if: realtor, text: 'Brenda\'s face watches over every listing, huge and serene and deeply unsettling. She loves it. She pays both overdue invoices and a third one you forgot to send, and tells four other realtors, and you realize with horror that you now specialize in this.' },
      ],
    },
    launch_fail: {
      speaker: 'narrator',
      text: [
        { if: ferry, text: 'The site goes live at 7 a.m. The spinning timetable is wrong: the 7:15 to Ridgeport reads 7:51. Forty commuters miss the boat. Two of them write to the Lumen Ledger. Captain Dorsey withholds payment and uses the phrase "maritime disaster," which is unfair but not, technically, untrue.' },
        { if: dentist, text: 'Molar Mike follows the cursor. Molar Mike also, on one particular browser, multiplies. By noon there are four hundred cartoon teeth on Dr. Feld\'s homepage, all smiling. A patient calls it "the stuff of nightmares." Dr. Feld calls it "breach of contract."' },
        { if: realtor, text: 'The watermark renders wrong. Instead of faint and serene, Brenda\'s face is enormous, grey and slightly stretched behind a listing for a three-bedroom colonial, like a ghost in a haunted-house movie. Her lawyer\'s letter arrives before her email does.' },
        'Word gets around. It always does.',
      ],
    },
    change_order: {
      speaker: 'narrator',
      text: 'You send one page: what they asked for, what it costs, and a line for a signature. They sign it. They always sign it — nobody has ever said "no" to them in writing before, and they respect it the way a cat respects a closed door. The check clears. The extras get built at a sane pace, and billed, and paid.',
    },
    client_walks: {
      speaker: 'narrator',
      text: [
        'The change-order form lands like a slap. They don\'t reply. They take the half-finished site to a nephew "who does computers," refuse the last invoice, and tell everyone in Harbor Point that you are "impossible to work with."',
        { if: atCoop, text: 'The co-op votes to eat the loss. You buy the coffee for a month, which, given the co-op\'s coffee politics, is its own punishment.' },
      ],
    },
    lunch_win: {
      speaker: 'narrator',
      text: 'Over pie, it comes out: they don\'t want a spinning logo, they want people to like them. You can build that. You sketch a clean, simple site on a napkin. They keep the napkin. They send two referrals before the month is out, one with a note: "ask for the one who took me to lunch."',
    },
    lunch_lose: {
      speaker: 'narrator',
      text: 'They love the pie. They hate the plan. By the end of lunch, the scope has grown to include the pie — a "Cathode partnership page" Sal has never heard of and would not approve. You end up building the monstrosity and a sane version side by side, so they can "compare." They choose the monstrosity. You don\'t sleep for three days.',
    },
    phoned_in: {
      speaker: 'narrator',
      text: 'It takes you an afternoon. It looks like an afternoon. They pay, mostly, because it technically does everything they asked, in the way a sandwich technically contains lunch. Your name is in the footer, in small grey letters, forever.',
    },
  },
}

const clientFromHell: EventDef = {
  id: 'ev_work_client_from_hell',
  category: 'work',
  weight: 3,
  repeatable: true,
  cooldownDays: 140,
  when: { all: [{ job: SHOP_JOBS }, free] },
  effects: [{ var: CLIENTS, add: 1 }],
  scene: 'ev_work_client_from_hell_scene',
}

// ── ev_work_halcyon_koi ───────────────────────────────────────────────────────
// Vale's prize koi is dead and the camera shows a hoodie at 1 a.m. It was your hoodie's night.
const valeUp: Cond = { all: [around('vale'), { npc: 'vale', fateNot: ['flames_out', 'exposed', 'escapes_clean'] }] }
const priyaUp = around('priya')

const koiScene: SceneDef = {
  id: 'ev_work_halcyon_koi_scene',
  channel: 'dialog',
  title: 'Series B',
  start: 'pond',
  nodes: {
    pond: {
      speaker: 'narrator',
      text: [
        'Monday, 8:50 a.m. There is a crowd around the atrium pond. In the middle of it, floating with terrible dignity, is Series B — the enormous orange-and-white koi Marcus Vale named after the funding round that saved the company, and which he introduces to visiting investors by name.',
        'People Operations has pulled the lobby camera. At 1:04 a.m. Friday, a figure in a grey hoodie crouched by the pond for ninety seconds. You were in the building at 1:04 a.m. Friday. You own a grey hoodie. So does everyone on the second floor.',
        { if: valeUp, text: 'An all-hands has been called for ten o\'clock. The calendar invite is titled "Grief & Accountability."' },
        { if: priyaUp, text: 'Priya passes you with her coffee and says, without slowing down, "Rule four: never be the last badge swipe before a death."' },
      ],
      choices: [
        {
          tag: '[Hardware]',
          text: 'Check the pond pump before all-hands. You\'d bet your badge this is plumbing, not murder.',
          check: {
            skill: 'hardware',
            dc: 13,
            bonuses: [{ if: { background: 'tinkerer' }, add: 2, label: '+2 (basement tinkerer)' }],
            success: 'pump',
            fail: 'flood',
            successEffects: [...bumpJob(250), { faction: 'fac.halcyon', add: 2 }, { buff: GOOD_WORD }],
            failEffects: [...strike, { stat: 'stress', add: 8 }, { stat: 'mood', add: -4 }, { flag: 'ev_work.koi_killer' }],
          },
        },
        {
          tag: '[OpSec]',
          text: 'Pull the badge logs for 1:04 a.m. and find out whose hoodie it actually was.',
          check: {
            skill: 'opsec',
            dc: 14,
            bonuses: [
              { if: { background: 'latchkey' }, add: 2, label: '+2 (latchkey kid)' },
              { if: { trait: 'paranoid' }, add: 1, label: '+1 (you already knew where the logs live)' },
            ],
            success: 'logs',
            fail: 'caught_snooping',
            successEffects: [{ xp: 'opsec', add: 30 }],
            failEffects: [...strike, { faction: 'fac.halcyon', add: -2 }, { if: priyaUp, then: [{ npc: 'priya', affinity: -2 }] }],
          },
        },
        {
          tag: '[Social]',
          text: 'Get ahead of it. Volunteer to say a few words for Series B at all-hands.',
          check: {
            skill: 'social',
            dc: 13,
            bonuses: [
              { if: { background: 'class_clown' }, add: 3, label: '+3 (you were born to eulogize a fish)' },
              { if: { trait: 'silver_tongue' }, add: 2, label: '+2 (silver tongue)' },
            ],
            success: 'eulogy',
            fail: 'eulogy_bomb',
            successEffects: [...bumpJob(150), { stat: 'mood', add: 6 }, { faction: 'fac.halcyon', add: 1 }, { if: valeUp, then: [{ npc: 'vale', affinity: 3 }] }],
            failEffects: [...strike, { stat: 'mood', add: -5 }],
          },
        },
        {
          tag: '[Leave]',
          text: 'Keep your head down and let it blow over.',
          effects: [{ stat: 'stress', add: 4 }, { stat: 'mood', add: -3 }, { flag: 'ev_work.koi_killer' }],
          goto: 'head_down',
        },
      ],
    },
    pump: {
      speaker: 'narrator',
      text: [
        'The pump\'s intake is choked solid — by a Halcyon-branded stress ball, the squishy kind they handed out at the last all-hands, which somebody threw at somebody and missed. No flow, no oxygen, no Series B. You clear it, reset the pump, and the water starts to move again. The other koi perk up visibly, like survivors.',
        { if: valeUp, text: 'At ten, Vale holds up the stress ball on stage like a murder weapon. "This," he says, "is what happens when we stop thinking in systems. And THIS" — he points at you — "is what a systems thinker looks like." There is applause. You did not expect applause.', else: 'At ten, your manager holds up the stress ball at the meeting like a murder weapon. The stress balls are recalled by lunch. You are, briefly and weirdly, famous.' },
      ],
    },
    flood: {
      speaker: 'narrator',
      text: [
        'You pull the hose you are sure is the intake. It is not the intake. Forty gallons of koi water pour across the atrium floor, down the ramp, and into the base of the lobby plasma screen, which dies mid-slide on the words THE FUTURE IS A VERB.',
        'Facilities bills your department for the screen. The surviving koi are evacuated to a kiddie pool in the parking lot. By Wednesday someone has written KOI KILLER on a sticky note and put it on your monitor, and nobody will admit to it, and nobody takes it down.',
      ],
    },
    logs: {
      speaker: 'narrator',
      text: [
        'Badge 2214, swiped in at 1:02 a.m., out at 1:09. Badge 2214 belongs to Tyler Vale — nineteen, a summer intern, and Marcus Vale\'s nephew. A vending-machine receipt in the same minute: six packs of Pixy Stix. He fed the koi candy. For ninety seconds. Out of love, probably.',
        'You have the log on a printout. Nobody else knows it exists.',
      ],
      choices: [
        {
          text: 'Hand it to People Operations. The truth is the truth.',
          effects: [{ faction: 'fac.halcyon', add: 2 }, ...bumpJob(150)],
          goto: 'handed_in',
        },
        {
          text: 'Fold the printout into your wallet. Knowing something about the boss\'s family is worth more than a pat on the back.',
          effects: [{ flag: 'ev_work.vale_nephew' }, { stat: 'stress', add: 2 }],
          goto: 'kept_it',
        },
        {
          if: { trait: 'empath' },
          text: 'Find Tyler first and tell him to confess on his own. Give the kid a chance to be the one who says it.',
          effects: [{ stat: 'mood', add: 5 }, { faction: 'fac.halcyon', add: 1 }],
          goto: 'tyler',
        },
      ],
    },
    handed_in: {
      speaker: 'narrator',
      text: 'People Operations thanks you in a tone that suggests they already suspected and hoped nobody would prove it. Tyler is not fired; Tyler receives "mentorship." The rumor about you dies before lunch. By Friday, you are the person who solved the Koi Case, which is a thing people say at Halcyon now, with a straight face.',
    },
    kept_it: {
      speaker: 'narrator',
      text: 'The investigation "concludes without a finding." The rumor about the grey hoodie fades on its own. Every so often, in a meeting, Marcus Vale mentions family, and you feel the little folded square of paper in your wallet like a second heartbeat.',
    },
    tyler: {
      speaker: 'narrator',
      text: 'Tyler goes white, then red, then very quiet. At all-hands he stands up before anyone can speak and says, "It was me. I thought they were hungry." There is a long silence, then a sound from the back that turns into applause. The kid shakes your hand afterward like you saved his life. Maybe, in the small way offices do it, you did.',
    },
    caught_snooping: {
      speaker: 'narrator',
      text: [
        'The badge system is not a place a developer is supposed to be, and it tells IT so the moment you touch it. By eleven there is a meeting invite titled "Access Review" and a very polite man from security explaining the difference between "curious" and "unauthorized."',
        { if: priyaUp, text: 'Priya catches you in the stairwell after. "Rule five," she says quietly. "If you\'re going to go looking, don\'t leave footprints. And never for a fish." She is disappointed in the specific way of someone who expected you to be better at it.' },
      ],
    },
    eulogy: {
      speaker: 'narrator',
      text: [
        'You step up to the mic. "Series B," you begin, "closed in 2001. He was oversubscribed. He never missed a milestone. He was, in every sense, a fish who scaled." The room loses it. Then you get quiet and say something true about how nobody here would have a job without the round he was named for, and the room gets quiet too.',
        { if: valeUp, text: 'Vale hugs you on stage for eleven seconds. You counted. He calls you "culture" in the next board memo, which you learn about from three different people.', else: 'Your manager says you\'re "culture." It is meant as the highest compliment Halcyon gives.' },
      ],
    },
    eulogy_bomb: {
      speaker: 'narrator',
      text: 'Your opening line is "Well, at least one thing at Halcyon finally went belly-up." You meant it about the fish. The CFO, who has been fielding questions about the burn rate all month, did not take it about the fish. The silence has a texture. On the way out, People Operations asks if you have "a minute this afternoon."',
    },
    head_down: {
      speaker: 'narrator',
      text: 'It does not blow over. People Operations interviews everyone who owns a grey hoodie, and for some reason you are interviewed twice. The investigation "concludes without a finding," which in office language means "concludes with a rumor." Somebody starts calling you Koi Killer. It sticks the way nicknames stick: forever, and at the worst moments.',
    },
  },
}

const halcyonKoi: EventDef = {
  id: 'ev_work_halcyon_koi',
  category: 'work',
  weight: 3,
  when: {
    all: [
      { job: HALCYON_JOBS },
      { not: { flag: 'w.halcyon_state', eq: 'dead' } },
      { not: { flag: 'w.halcyon_state', eq: 'crashed' } },
      free,
    ],
  },
  scene: 'ev_work_halcyon_koi_scene',
}

// ── ev_work_meridian_gordon + quest ev_work_q_gordon ─────────────────────────
// The last man who understands the bank's mainframe retires in March. April is coming.
const Q_GORDON = 'ev_work_q_gordon'
const learned = { flag: 'ev_work.gordon_learned' }
const copied = { flag: 'ev_work.gordon_binder' }
const atMeridianDev = { job: 'job_meridian_dev' }

const ON_CALL_UNPAID: BuffDef = {
  id: 'ev_work_on_call_unpaid',
  name: 'On Call (Unpaid)',
  desc: 'They gave you the pager and kept the raise. LEDGER-7 wakes you twice a week to tell you it is fine.',
  days: 90,
  bad: true,
  mods: [
    { key: 'stress.gain', mult: 1.12 },
    { key: 'energy.regen', mult: 0.95 },
  ],
}

const gordonScene: SceneDef = {
  id: 'ev_work_meridian_gordon_scene',
  channel: 'dialog',
  title: 'The Binder',
  start: 'binder',
  nodes: {
    binder: {
      speaker: 'narrator',
      text: [
        'Gordon Pike is sixty-four, wears a cardigan with leather elbow patches, and is the only person at Meridian Trust who understands LEDGER-7: the batch system in the tower\'s sub-basement that closes the bank\'s books every Friday night. It is older than the tower. The web team talks to it through one narrow little interface everyone calls "the mail slot," and nobody on your floor has ever seen the other side.',
        'He is retiring at the end of March. He has a lake cabin, a boat called Overtime, and a binder: nine hundred pages, three-hole-punched, the margins full of pencil.',
        '"Nobody\'s asked me what happens in April," he says, eating a sandwich at his desk. He says it the way people talk about weather. "I\'ll make you an offer, kid. Six a.m., six weeks. I\'ll show you what the binder doesn\'t say."',
      ],
      choices: [
        {
          text: 'Six a.m. for six weeks. Learn the old iron from the man who built half of it.',
          effects: [{ flag: 'ev_work.gordon_learned' }, { buff: DAWN_SHIFT }, { quest: Q_GORDON, start: true }],
          goto: 'yes',
        },
        {
          text: '"Could I just photocopy the binder?" Nine hundred pages. How hard can it be.',
          effects: [{ flag: 'ev_work.gordon_binder' }, { money: -45 }, { quest: Q_GORDON, start: true }],
          goto: 'copy',
        },
        {
          tag: '[Leave]',
          text: '"That\'s really an ops problem, Gordon. I build web pages."',
          effects: [{ quest: Q_GORDON, start: true }],
          goto: 'no',
        },
      ],
    },
    yes: {
      speaker: 'Gordon',
      text: [
        'Six weeks of dark mornings. The tower empty, the sub-basement warm and loud, Gordon\'s thermos of black coffee and his terrible jokes. He shows you where LEDGER-7 keeps its secrets: the step that always fails in a leap year, the one that must never run twice, the one that is held up, Gordon swears, "by spite and a 1983 patch that I will take to my grave."',
        'On his last Friday he gives you his pencil. "Step 41," he says. "It\'s always 41. When it goes — and it will — don\'t restart it. Walk it back." He shakes your hand. His grip is like a vise.',
      ],
    },
    copy: {
      speaker: 'Gordon',
      text: 'Gordon watches you feed his binder through the copier on the ninth floor, page by page, for most of an afternoon. "It\'s a good binder," he says eventually. "Doesn\'t say anything about the smell it makes before it fails, though." He goes back to his sandwich. You have nine hundred warm pages and a toner headache.',
    },
    no: {
      speaker: 'Gordon',
      text: '"Sure," Gordon says, perfectly pleasantly. "Sure it is." He finishes his sandwich. On March 31st there is a sheet cake in the break room that says HAPPY RETIREMENT GORDON in blue icing, and he eats one bite, and waves, and is gone, and the sub-basement hums on without him.',
    },
  },
}

const gordonApril: SceneDef = {
  id: 'ev_work_gordon_april',
  channel: 'dialog',
  title: 'Step 41',
  start: 'two_am',
  nodes: {
    two_am: {
      speaker: 'narrator',
      text: [
        'April. 2:14 a.m. The phone. The overnight operator, a kid named Luis whose voice is doing something high and thin: LEDGER-7\'s Friday close has stopped at step 41 of 60. Forty thousand customer statements, the Port Authority payroll and the bank\'s quarter-end are sitting in a queue, going nowhere.',
        { if: { not: atMeridianDev }, text: 'You don\'t even work in the tower anymore. Somebody still had your number on a sticky note labeled GORDON\'S KID.' },
        { if: learned, text: 'You know this one. You did it with Gordon on a dark Tuesday in March, his pencil tapping the page. Don\'t restart it. Walk it back.' },
        { if: copied, text: 'The binder is on your shelf, nine hundred photocopied pages. Somewhere in there is step 41.' },
      ],
      choices: [
        {
          tag: '[Systems]',
          text: 'Get in a cab. Go down to the sub-basement and walk the job back by hand.',
          check: {
            skill: 'systems',
            dc: 17,
            bonuses: [
              { if: learned, add: 5, label: '+5 (six weeks of dawns with Gordon)' },
              { if: copied, add: 2, label: '+2 (the photocopied binder)' },
              { if: { trait: 'night_owl' }, add: 1, label: '+1 (it\'s your hour)' },
              { if: { background: 'mathlete' }, add: 1, label: '+1 (you follow the math, not the menu)' },
            ],
            success: 'hero',
            fail: 'scapegoat',
            successEffects: [{ trait: 'ev_work_mainframe_keeper' }, { xp: 'systems', add: 80 }],
            failEffects: [{ stat: 'stress', add: 10 }, { stat: 'mood', add: -8 }],
          },
        },
        {
          text: 'Call Gordon at the lake. He said never to call.',
          goto: 'gordon_call',
        },
        {
          tag: '[Leave]',
          text: 'It\'s 2 a.m. and you are not on call. Let the day shift find it.',
          effects: [{ if: atMeridianDev, then: strike }, { stat: 'stress', add: 4 }],
          goto: 'ignored',
        },
      ],
    },
    hero: {
      speaker: 'narrator',
      text: [
        'The sub-basement is warm and loud and smells, just faintly, like burning dust — the smell Gordon said the binder doesn\'t mention. You don\'t restart it. You walk it back, one step at a time, the way a surgeon backs out of a bad incision. At 5:40 a.m., step 60 completes. Luis cries a little. So do you, a little, in the elevator.',
        { if: atMeridianDev, text: 'By nine, the CIO knows your name. By ten, there is an offer on the table: "LEDGER-7 Custodian." A title, a raise — and a pager.', else: 'By nine, Meridian\'s CIO calls you personally to ask what you charge. You realize you get to name a number.' },
      ],
      choices: [
        {
          if: atMeridianDev,
          text: 'Take it. Custodian of the old iron: the raise, the title, the pager on your belt.',
          effects: [{ buff: ON_CALL }, { jobXp: 'job_meridian_dev', add: 600 }, { faction: 'fac.halcyon', add: 2 }],
          goto: 'custodian',
        },
        {
          if: atMeridianDev,
          tag: '[Business]',
          text: '"Only if you hire and train a real team for it. In writing. This never rests on one person again."',
          check: {
            skill: 'business',
            dc: 15,
            bonuses: [{ if: learned, add: 1, label: '+1 (you can say exactly what Gordon was worth)' }],
            success: 'team',
            fail: 'pager_anyway',
            successEffects: [{ jobXp: 'job_meridian_dev', add: 400 }, { faction: 'fac.halcyon', add: 3 }, { flag: 'ev_work.ledger_team' }],
            failEffects: [{ buff: ON_CALL_UNPAID }, { stat: 'mood', add: -4 }],
          },
        },
        {
          if: atMeridianDev,
          text: 'Take the thanks. Hand back the pager. You have a life, allegedly.',
          effects: [{ jobXp: 'job_meridian_dev', add: 200 }, { stat: 'mood', add: 3 }],
          goto: 'declined_pager',
        },
        {
          if: { not: atMeridianDev },
          text: 'Invoice them. Consultant rates, emergency surcharge, 2 a.m. premium.',
          effects: [{ money: 1500 }, { faction: 'fac.halcyon', add: 2 }],
          goto: 'invoiced',
        },
        {
          if: { not: atMeridianDev },
          text: 'Tell them it\'s on the house. For Gordon.',
          effects: [{ stat: 'mood', add: 6 }, { faction: 'fac.halcyon', add: 1 }, { faction: 'fac.hood', add: 1 }],
          goto: 'for_gordon',
        },
      ],
    },
    custodian: {
      speaker: 'narrator',
      text: 'The title goes on a brass plate on a door in the sub-basement. The raise is real. The pager goes off on Friday nights like clockwork, usually to tell you nothing is wrong. In June, a postcard arrives from a lake: a photo of a boat called Overtime, and on the back, in pencil, "Step 41. — G."',
      effects: [{ flag: 'ev_work.gordon_april_done' }],
    },
    team: {
      speaker: 'narrator',
      text: 'It takes a signed memo and a hard week, but Meridian hires two junior operators and puts you in charge of teaching them everything Gordon taught you. You start at six a.m. You bring a thermos. On the first morning, one of them asks why the step is numbered 41 and you hear yourself say, "Spite, and a 1983 patch."',
      effects: [{ flag: 'ev_work.gordon_april_done' }],
    },
    pager_anyway: {
      speaker: 'narrator',
      text: 'The VP nods through your whole speech, thanks you for your "passion," and hands you the pager anyway. There is no team. There is no raise yet — "next cycle." There is you, the sub-basement, and a machine that knows you\'ll come when it calls.',
      effects: [{ flag: 'ev_work.gordon_april_done' }],
    },
    declined_pager: {
      speaker: 'narrator',
      text: 'The CIO looks at you like you\'ve turned down a kidney. The pager goes to someone else, who calls you at 3 a.m. the next Friday, and the one after. You help, every time. You never did learn how to say no to that machine.',
      effects: [{ flag: 'ev_work.gordon_april_done' }],
    },
    invoiced: {
      speaker: 'narrator',
      text: 'You invoice fifteen hundred dollars. Meridian pays it in four days without a single question, which tells you exactly how scared they were. Luis sends you a thank-you card with a drawing of a mainframe with a Band-Aid on it.',
      effects: [{ flag: 'ev_work.gordon_april_done' }],
    },
    for_gordon: {
      speaker: 'narrator',
      text: 'The CIO doesn\'t know what to do with that, so he sends a fruit basket the size of a car tire. You eat the pears. In June a postcard arrives from a lake — a boat called Overtime — and on the back, in pencil: "Heard. Proud of you. — G."',
      effects: [{ flag: 'ev_work.gordon_april_done' }],
    },
    gordon_call: {
      speaker: 'Gordon',
      text: [
        { if: learned, text: 'He answers on the first ring, like he has been sitting by the phone since March. "Step 41," he says. "It\'s always 41. You know this one, kid. You did it on a Tuesday." He stays on the line while you do it, saying nothing, just breathing and sometimes grunting approval. At 5:50 he says, "Good," and hangs up. It is the best performance review you will ever get.', else: 'Voicemail: "Gone fishing." Then, at 6:10 a.m., a callback. A long silence. "You didn\'t come at six," Gordon says. Then, slowly, like a man paying a debt he doesn\'t owe, he walks you through it, step by step, for two hours. When it\'s done he says, "Don\'t call again," and means it.' },
      ],
      effects: [{ flag: 'ev_work.gordon_april_done' }, { if: { all: [atMeridianDev, learned] }, then: [{ jobXp: 'job_meridian_dev', add: 150 }] }, { if: { not: learned }, then: [{ stat: 'mood', add: -3 }] }],
    },
    scapegoat: {
      speaker: 'narrator',
      text: [
        'You restart step 38 when you meant 41, and then you learn why Gordon said never to restart. Half the statements duplicate. The payroll file for the Port Authority doubles itself. At seven a.m., a vice president in a golf shirt says the words "root cause" while looking directly at you.',
        'At eight, Gordon walks in — on his second day of retirement, in fishing boots — and fixes it in forty minutes without a word. He doesn\'t say anything to you. He doesn\'t have to.',
        { if: atMeridianDev, text: 'The incident report uses the phrase "web team." Your name is the only one in the section.' },
      ],
      effects: [
        { flag: 'ev_work.gordon_april_done' },
        { if: atMeridianDev, then: [...strike, { buff: { id: 'ev_work_incident', name: 'Named in the Incident Report', desc: 'Every meeting starts with someone glancing at you. Every change you make now needs two signatures.', days: 42, bad: true, mods: [{ key: 'jobXp', mult: 0.8 }, { key: 'stress.gain', mult: 1.08 }] } }] },
        { chance: 0.3, then: [{ complication: 'work' }] },
      ],
    },
    ignored: {
      speaker: 'narrator',
      text: [
        'On Monday forty thousand Meridian customers receive statements dated January 1, 1900. The Lumen Ledger runs it on the front page of the business section: MERIDIAN CUSTOMERS GET MAIL FROM LAST CENTURY. Mrs. Delacroix, eighty-one, calls the bank to ask if she is dead.',
        { if: atMeridianDev, text: 'The bank blames "a web team error." It was not a web team error. Somebody still has to be the web team.', else: 'You read it over breakfast and put the paper down and don\'t pick it up again.' },
      ],
      effects: [{ flag: 'ev_work.gordon_april_done' }],
    },
  },
}

const gordonQuest: QuestDef = {
  id: Q_GORDON,
  title: 'Gordon\'s Binder',
  kind: 'side',
  summary: 'The last man who understands Meridian\'s mainframe retires in March. Nobody has asked what happens in April.',
  start: 'april',
  rewards: 'A career — or a scapegoat',
  stages: {
    april: {
      text: [
        { if: learned, text: 'Six weeks of dawns with Gordon Pike in the sub-basement. You know where LEDGER-7 keeps its secrets — mostly. He retires at the end of March.' },
        { if: copied, text: 'You have nine hundred photocopied pages of Gordon\'s binder on a shelf. You have read eleven of them.' },
        { if: { not: { any: [learned, copied] } }, text: 'You told Gordon his mainframe was an ops problem. He retires at the end of March. It will be somebody\'s problem in April.' },
      ],
      hint: 'LEDGER-7 closes the books every Friday night. Gordon retires at the end of March, and whatever happens next happens in April. Systems will matter.',
      onEnter: [{ scene: 'ev_work_gordon_april', delayHours: 24 * 49 }],
      objectives: [{ id: 'april', text: 'Get through April', when: { flag: 'ev_work.gordon_april_done' } }],
    },
  },
}

const meridianGordon: EventDef = {
  id: 'ev_work_meridian_gordon',
  category: 'work',
  weight: 3,
  when: { all: [atMeridianDev, { not: { flag: 'w.meridian_state', eq: 'collapsed' } }, free] },
  scene: 'ev_work_meridian_gordon_scene',
}

// ── ev_work_hallway_estimate ──────────────────────────────────────────────────
// Repeatable. "Just a ballpark" becomes a board-deck promise. Crunch twice and it leaves a mark.
const CRUNCHES = 'ev_work.crunches'
const ESTIMATE_JOBS = ['job_halcyon_junior', 'job_halcyon_senior', 'job_meridian_dev', 'job_pixelworks_web', 'job_coop_dev', 'job_startup_engineer']
const atHalcyonDev = { job: ['job_halcyon_junior', 'job_halcyon_senior'] }

const estimateScene: SceneDef = {
  id: 'ev_work_hallway_estimate_scene',
  channel: 'dialog',
  title: 'Just a Ballpark',
  start: 'hallway',
  nodes: {
    hallway: {
      speaker: 'narrator',
      text: [
        { if: atHalcyonDev, text: 'Brad Fenwick, VP of Product Velocity, falls into step beside you on the way back from the bathroom. "Quick one. The partner dashboard — ballpark? Gut number. Not a commitment."' },
        { if: { job: 'job_meridian_dev' }, text: 'Mr. Albrecht from Retail Banking catches you at the elevator, the way a hawk catches a mouse, politely. "The new bill-pay screen. Rough idea? I won\'t hold you to it."' },
        { if: { job: 'job_pixelworks_web' }, text: 'Nate, who owns Pixel Works and one very small boat, leans into your cubicle. "The ferry people want a booking system now. Ballpark? Just for my own head."' },
        { if: { job: 'job_coop_dev' }, text: 'A client\'s project manager named Chip corners you by the co-op\'s contested coffee machine. "Real quick — the inventory thing. Ballpark? Just so I can tell my boss something."' },
        { if: { job: 'job_startup_engineer' }, text: 'The founder bounces a tennis ball off the garage wall and catches it. "Checkout flow for the corner-shop pilot. How long? Gut. I trust your gut. Your gut is our whole company."' },
        { if: { var: CRUNCHES, gte: 1 }, text: 'You have been here before. You know exactly where this sentence goes if you let it.' },
        { if: onFinalWarning, text: 'Two write-ups in your file. Whatever you say now will be remembered precisely.' },
      ],
      choices: [
        {
          tag: '[Business]',
          text: '"I don\'t do numbers in hallways. Book thirty minutes; I\'ll bring a real plan."',
          check: {
            skill: 'business',
            dc: 13,
            bonuses: [
              { if: { background: 'mathlete' }, add: 2, label: '+2 (you actually do the math)' },
              { if: { var: CRUNCHES, gte: 1 }, add: 1, label: '+1 (once burned)' },
            ],
            success: 'sane_plan',
            fail: 'number_anyway',
            successEffects: [...bumpJob(200), { faction: 'fac.halcyon', add: 1 }, { stat: 'stress', add: -3 }],
          },
        },
        {
          text: '"Two weeks?" Everyone says two weeks.',
          goto: 'week_three',
        },
        {
          tag: '[Programming]',
          text: '"Two weeks." And then — insanely — actually do it in two weeks.',
          check: {
            skill: 'programming',
            dc: 16,
            bonuses: [
              { if: { trait: 'night_owl' }, add: 2, label: '+2 (night owl)' },
              { if: { trait: 'caffeine_fiend' }, add: 1, label: '+1 (caffeine fiend)' },
            ],
            success: 'did_it',
            fail: 'week_three',
            successEffects: [{ buff: OFFICE_HERO }, ...bumpJob(350), { stat: 'energy', add: -15 }],
            failEffects: [{ stat: 'stress', add: 6 }],
          },
        },
      ],
    },
    sane_plan: {
      speaker: 'narrator',
      text: 'The meeting takes twenty-eight minutes. You bring a whiteboard sketch, three risks and an honest range — six to nine weeks. There is a flicker of disappointment, then something better: relief. Nobody has ever given them a number they could believe. The project ships in seven weeks. You go home at six every single night of it.',
    },
    number_anyway: {
      speaker: 'narrator',
      text: 'You explain that you need to scope it first. They nod and say "totally, totally — so, like, two weeks?" and you make a noise that is not a yes, and by Friday "two weeks" is in a slide deck in front of people who control your salary.',
      next: 'week_three',
    },
    did_it: {
      speaker: 'narrator',
      text: 'Fourteen days. Coffee, headphones, a cot you are not supposed to know about. On day fourteen, at 4:55 p.m., it ships — working, tested, clean. People come by your desk just to look at you, the way people visit a rock formation. For a month you are the person who did the thing everyone said couldn\'t be done. You are also very, very tired.',
    },
    week_three: {
      speaker: 'narrator',
      text: [
        'It is week three. The feature is sixty percent done and one hundred percent promised. The "not a commitment" is now a line item in a quarterly plan, with your name in the owner column.',
        { if: { var: CRUNCHES, gte: 1 }, text: 'Your body remembers the last crunch. Your shoulders go up at the word "weekend."' },
      ],
      choices: [
        {
          text: 'Crunch. Nights, weekends, whatever it takes.',
          effects: [
            { var: CRUNCHES, add: 1 },
            { buff: CRUNCH },
            { stat: 'health', add: -6 },
            { if: { var: CRUNCHES, gte: 2 }, then: [{ trait: 'ev_work_crunch_brain' }, { buff: FRIED }] },
          ],
          goto: 'crunched',
        },
        {
          tag: '[Social]',
          text: 'Go to the boss with a demo of what\'s real and reset expectations before the deadline does it for you.',
          check: {
            skill: 'social',
            dc: 15,
            bonuses: [
              { if: { trait: 'silver_tongue' }, add: 2, label: '+2 (silver tongue)' },
              { if: { trait: 'empath' }, add: 1, label: '+1 (you know what they\'re afraid of)' },
            ],
            success: 'reset_ok',
            fail: 'reset_bad',
            successEffects: [...bumpJob(100), { stat: 'stress', add: -2 }],
            failEffects: [...strike, { stat: 'mood', add: -4 }],
          },
        },
        {
          text: 'Quietly cut scope and ship what you have. Maybe nobody notices.',
          effects: [
            {
              chance: 0.5,
              then: [{ flag: 'ev_work.scope_caught' }, ...strike],
              else: [{ clearFlag: 'ev_work.scope_caught' }, ...bumpJob(100)],
            },
          ],
          goto: 'cut_scope',
        },
      ],
    },
    crunched: {
      speaker: 'narrator',
      text: [
        'You ship it at 3 a.m. on the Sunday before the deadline, by the light of a monitor and a vending machine. It works. Mostly. Monday there is cake for the team, with your name spelled wrong, and you eat a piece standing up and feel absolutely nothing.',
        { if: { var: CRUNCHES, gte: 2 }, text: 'This is the second time. Something in you doesn\'t come back from it. You lie awake at four the next week, and the week after, wired for a deadline that isn\'t there anymore.' },
      ],
    },
    reset_ok: {
      speaker: 'narrator',
      text: 'You show them the real thing — what works, what doesn\'t, what\'s left — and give them a new date with a straight face. There is a long exhale on the other side of the desk. "Okay," they say. "Okay. Thank you for telling me now and not in two weeks." You didn\'t know that was an option. It was always an option.',
    },
    reset_bad: {
      speaker: 'narrator',
      text: 'They hear "it\'s going to be late" and nothing after it. "You said two weeks," they say, and when you point out that you said "maybe," they say "you said two weeks" again, slower, like you\'re the one being unreasonable. The meeting ends with a write-up and the original date.',
    },
    cut_scope: {
      speaker: 'narrator',
      text: [
        { if: { flag: 'ev_work.scope_caught' }, text: 'The feature you quietly cut was the one the client asked for by name. They notice in the first demo, in front of everyone. "Where\'s the export button?" There is no export button. There is only you, and a very long pause.', else: 'You ship the sixty percent that works and call it "phase one." Nobody notices. Nobody ever notices. You file that away as a very useful and slightly depressing fact about your industry.' },
      ],
    },
  },
}

const hallwayEstimate: EventDef = {
  id: 'ev_work_hallway_estimate',
  category: 'work',
  weight: 2,
  repeatable: true,
  cooldownDays: 160,
  when: { all: [{ job: ESTIMATE_JOBS }, { not: { quest: 'fac_halcyon_q2_ship_it', status: 'active' } }, free] },
  scene: 'ev_work_hallway_estimate_scene',
}

// ── ev_work_holiday_party ─────────────────────────────────────────────────────
// Every December, every office. Reads the employer, the era, and whoever is on your arm.
const partyHalcyonRich: Cond = { all: [{ job: HALCYON_JOBS }, { flag: 'w.halcyon_state', eq: 'rising' }] }

const partyScene: SceneDef = {
  id: 'ev_work_holiday_party_scene',
  channel: 'dialog',
  title: 'The Holiday Party',
  start: 'party',
  nodes: {
    party: {
      speaker: 'narrator',
      text: [
        { if: { job: CC_JOBS }, text: 'The CompCastle holiday party is in the break room: store-brand soda, a sheet cake shaped like a castle, and a Secret Santa where every gift is a mousepad. Somebody plugs a karaoke machine into the demo stereo. It is loud enough to set off a car alarm in the lot.' },
        { if: { job: LSU_JOBS }, text: 'Computing Services shares the faculty lounge with the History department: sherry in paper cups, a tray of cookies the dean\'s wife made, and a karaoke machine a grad student "borrowed" from the student union.' },
        { if: { job: NORTHLINK_JOBS }, text: 'NorthLink throws its party in the NOC, because somebody has to watch the lights. Pizza on the console, tinsel on the racks, and a karaoke machine Wes Tran bought with his own money in 1998 and brings out every year like a sacred relic.' },
        { if: partyHalcyonRich, text: 'Halcyon has rented the yacht club. An ice luge shaped like the logo. A jazz trio. Shrimp arranged into the words THE FUTURE IS A VERB. Somewhere, a karaoke booth with a velvet rope.' },
        { if: { all: [{ job: HALCYON_JOBS }, { not: partyHalcyonRich }] }, text: 'Halcyon\'s party is in the atrium this year, next to the koi, with pizza and a speech about "lean times" and "family." There is still a karaoke machine. At Halcyon there is always a karaoke machine.' },
        { if: { job: MERIDIAN_JOBS }, text: 'Meridian Trust takes over the fourteenth-floor ballroom: an ice sculpture of the bank\'s eagle, a string quartet, and name tags with your department in gold. Late in the evening, someone from Retail Banking wheels out a karaoke machine and the string quartet leaves.' },
        { if: { job: STARTUP_JOBS }, text: 'Driftwood\'s holiday party is a keg in the garage, forty beanbags, and the founder\'s laptop playing a karaoke track off the internet at a volume that rattles the tool wall.' },
        { if: { job: 'job_pixelworks_web' }, text: 'Pixel Works closes at three and Nate takes all four of you to the bowling alley on Sodium Row, which has pitchers of root beer, shoes that have seen things, and a karaoke corner by the claw machine.' },
        { if: atCoop, text: 'The co-op floor above the bakery has a potluck, a vote about whether the potluck should have been catered, and a karaoke machine that the bakery downstairs lends every year in exchange for silence about the "incident" in 2002.' },
        { if: { job: 'job_cage_consultant' }, text: 'The Cage\'s party is a crockpot of chili on the evidence-intake counter, three detectives in paper crowns, and a karaoke machine that was, until last spring, evidence. Nobody asks which case.' },
        { if: { job: ['job_datacenter_ops', 'job_tidewater_consultant', 'job_bureau_consultant', 'job_aperture_analyst'] }, text: 'The party is in a conference room with a view, a catering tray, and a karaoke machine somebody\'s cousin rents out. Everybody wears their badge. Nobody takes it off, even to sing.' },
        { if: { job: 'job_aperture_analyst' }, text: 'There is an NDA at the door. You sign it. It covers "the party, its attendees, and anything said in the vicinity of the shrimp."' },
        { if: withGrace, text: '{npc:grace} came straight from a shift, still smelling faintly of hospital soap, and is already making friends with the one person in the room who actually looks tired.' },
        { if: { all: [withMira, { not: withGrace }] }, text: '{npc:mira} came as your date and is standing by the wall, reading the room the way she reads a network: all exits noted, all weak points mapped.' },
        { if: { flag: 'ev_work.koi_killer' }, text: 'Someone at Halcyon has brought a goldfish in a bowl as a "gift for you." Everyone thinks this is hilarious.' },
      ],
      choices: [
        {
          tag: '[Social]',
          text: 'Karaoke. You have been waiting all year for this.',
          check: {
            skill: 'social',
            dc: 13,
            bonuses: [
              { if: { background: 'class_clown' }, add: 3, label: '+3 (class clown)' },
              { if: { trait: 'silver_tongue' }, add: 1, label: '+1 (silver tongue)' },
              { if: { flag: 'ev_work.party_legend' }, add: 1, label: '+1 (they chant your name before you start)' },
            ],
            success: 'karaoke_win',
            fail: 'karaoke_fail',
            successEffects: [{ buff: OFFICE_HERO }, ...bumpJob(150), { stat: 'mood', add: 8 }, { flag: 'ev_work.party_legend' }],
            failEffects: [{ buff: PARTY_REGRET }, { stat: 'mood', add: -4 }, { chance: 0.3, then: strike }],
          },
        },
        {
          tag: '[Business]',
          text: 'Corner the boss by the shrimp and pitch yourself for the big project next year.',
          check: {
            skill: 'business',
            dc: 14,
            bonuses: [{ if: { trait: 'silver_tongue' }, add: 1, label: '+1 (silver tongue)' }],
            success: 'pitched',
            fail: 'pitch_fail',
            successEffects: [...bumpJob(300), { faction: 'fac.halcyon', add: 1 }],
            failEffects: [{ stat: 'mood', add: -3 }, { stat: 'stress', add: 3 }],
          },
        },
        {
          text: 'Find the quiet coworker by the coat rack and actually talk to them.',
          effects: [{ stat: 'mood', add: 6 }, { stat: 'stress', add: -6 }, { flag: 'ev_work.office_friend' }],
          goto: 'coat_rack',
        },
        {
          if: { any: [withGrace, withMira] },
          text: [{ if: withGrace, text: 'Slip out early with {npc:grace}. The best part of any party is leaving it with the right person.', else: 'Slip out early with {npc:mira}. The best part of any party is leaving it with the right person.' }],
          effects: [{ if: withGrace, then: [{ npc: 'grace', affinity: 4 }], else: [{ npc: 'mira', affinity: 4 }] }, { stat: 'mood', add: 5 }],
          goto: 'slipped_out',
        },
        {
          tag: '[Leave]',
          text: 'Skip it. Go home. Sleep.',
          effects: [{ stat: 'energy', add: 8 }, { stat: 'mood', add: 2 }, { if: { flag: 'ev_work.skipped_party' }, then: [{ stat: 'stress', add: 2 }] }, { flag: 'ev_work.skipped_party' }],
          goto: 'skipped',
        },
      ],
    },
    karaoke_win: {
      speaker: 'narrator',
      text: [
        'You pick the song everyone pretends to hate and sing it like your life depends on it. By the second chorus, the whole room is singing. By the bridge, your boss is on a chair. When you finish, there is a roar, and someone from Accounting you have never spoken to hugs you and says "that was the best night of my year."',
        { if: withGrace, text: '{npc:grace} is laughing so hard she has to hold onto the wall. "I didn\'t know," she says, "that you could do something badly and brilliantly at the same time."' },
      ],
    },
    karaoke_fail: {
      speaker: 'narrator',
      text: 'The song is too high. You knew it was too high. You go for the note anyway. At some point there is a Santa hat, and at some point there is the photocopier, and by Monday a grainy image of both is taped to the break-room fridge under the words EMPLOYEE OF THE MONTH. HR sends a memo reminding everyone that the copier is "for business use only." It is addressed to everyone. It is about you.',
    },
    pitched: {
      speaker: 'narrator',
      text: 'You catch the boss between the shrimp and the second eggnog, when people are honest and still remember things. Three minutes, one clear idea, one clear ask. "Send me that in writing Monday," they say. You do. In January, the big project has your name on it.',
    },
    pitch_fail: {
      speaker: 'narrator',
      text: 'The boss is three eggnogs deep and promises you everything: the project, a raise, a corner office, possibly their firstborn. On Monday they remember none of it and look at you in the elevator like you are a stranger who knows something embarrassing about them. Which, to be fair, you do.',
    },
    coat_rack: {
      speaker: 'narrator',
      text: 'Her name is Joanne and she has worked here eleven years and nobody has ever asked her about the ship in a bottle on her desk. It turns out she builds them. She has built two hundred and nine. You talk until the caterers start folding tables. On Monday there is a very small ship in a very small bottle on your monitor, and a note: "For the one who asked."',
    },
    slipped_out: {
      speaker: 'narrator',
      text: [
        { if: withGrace, text: 'You get your coats while the karaoke starts, and walk out into the cold, and {npc:grace} takes your arm. You walk the long way, past the harbor, where the fishing boats have strung up colored lights. Neither of you says much. Neither of you needs to.', else: 'You and {npc:mira} leave through the service stairs, because of course she already found them. Out on the street she lights nothing, says nothing, just leans into your shoulder and watches the fog roll over Millgate. "Worst party of the year," she says eventually. "Best exit."' },
      ],
    },
    skipped: {
      speaker: 'narrator',
      text: [
        'You go home. You put on the kettle. You fall asleep on the couch at nine-fifteen with your shoes on and it is, honestly, glorious.',
        { if: { flag: 'ev_work.office_friend' }, text: 'At eleven your pager buzzes: a message from Joanne. "Saved you a cookie. The good kind." You smile in the dark.', else: 'On Monday people are talking about something that happened at the party. You don\'t get any of the jokes. You laugh anyway.' },
      ],
    },
  },
}

const holidayParty: EventDef = {
  id: 'ev_work_holiday_party',
  category: 'life',
  weight: 4,
  repeatable: true,
  cooldownDays: 300,
  when: { all: [{ jobTrack: OFFICE_TRACKS }, partySeason, free] },
  scene: 'ev_work_holiday_party_scene',
}

export default defineContent({
  scenes: [clientScene, koiScene, gordonScene, gordonApril, estimateScene, partyScene],
  quests: [gordonQuest],
  events: [clientFromHell, halcyonKoi, meridianGordon, hallwayEstimate, holidayParty],
})
