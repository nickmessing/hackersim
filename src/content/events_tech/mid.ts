/**
 * events_tech — MID-GAME one-offs (Act II → Act III, 2003–2010). The net gets faster, bigger and
 * more permanent, and mistakes start to stick:
 *
 *   ev_tech_board_migration  underground  2003+   Corvid moves the Loft BBS to the web — twelve years in one shot
 *   ev_tech_blog             work         2003–08 your Diarist post about your manager goes viral
 *   ev_tech_open_wifi        tech         2004+   Grandma Ruth discovers nine free internets on the Row
 *   ev_tech_arg              weird        2004–07 the SIGNAL/NOISE puzzle hunt, and the wrong man
 *   ev_tech_numbers_station  weird        2005+   LUMEN SEVEN, reading numbers at 3:03 a.m. since 1997
 *   ev_tech_smartphone       era          2007–10 the Oblong, and the map inside every photo
 *
 * HARD RULE: invented networks, invented gadgets, invented puzzles; nothing is a real technique.
 */
import { dayOf } from '@/engine/calendar'
import { defineContent } from '@/engine/registry'
import type { Cond, EventDef, ItemDef, SceneDef } from '@/engine/types'
import {
  GOING_VIRAL,
  GUILT,
  NEW_TOY,
  PINNED,
  RABBIT_HOLE,
  SPOOKED,
  THIN_ICE,
  actBetween,
  actGte,
  around,
  between,
  broadbandGte,
  buff,
  close,
  free,
  officeJob,
  owe,
} from './_shared'

// ── The Oblong (a unique gadget this pack hands out) ───────────────────────────
const oblong: ItemDef = {
  id: 'ev_tech_oblong',
  name: 'Oblong Smartphone',
  category: 'gadget',
  shop: 'life',
  price: 499,
  unique: true,
  desc: 'A slab of black glass that knows where you are. The whole internet in your pocket; your pocket, in turn, in the whole internet.',
  mods: [{ key: 'check.social', add: 1 }, { key: 'efficiency', mult: 1.02 }, { key: 'stress.gain', mult: 1.03 }],
}

// ─────────────────────────────────────────────────────────────────────────────
// ev_tech_board_migration — the Loft moves to the web
// ─────────────────────────────────────────────────────────────────────────────
const migrationScene: SceneDef = {
  id: 'ev_tech_board_migration_scene',
  channel: 'chat',
  title: 'the board is moving',
  from: 'corvid',
  start: 'ask',
  expiresDays: 21,
  onExpire: [{ npc: 'corvid', affinity: -2 }, { flag: 'ev_tech.switch_migrated' }],
  nodes: {
    ask: {
      speaker: 'corvid',
      text: [
        'Corvid: The Loft has run on the same dial-in software since 1993. The drive it lives on is older than byteme. It\'s time. I\'m moving everything to a web forum — threads, users, twelve years of posts.',
        'Corvid: Switch says he has "a guy." I would rather have you.',
        'Corvid: One shot. The old software can export once before it chokes. If the import eats the archive, twelve years of the scene go with it. No pressure.',
      ],
      choices: [
        {
          tag: '[Systems]',
          text: 'Plan it properly: freeze the board, copy twice, verify both, then flip.',
          check: {
            skill: 'systems',
            dc: 15,
            bonuses: [
              { if: close('corvid', 50), add: 2, label: '+2 (she trusts you with the keys)' },
              { if: { flag: 'ev_tech.lost_it_all' }, add: 2, label: '+2 (you back up twice, always)' },
            ],
            success: 'migrated',
            fail: 'eaten',
            successEffects: [{ faction: 'fac.loft', add: 4 }, { npc: 'corvid', affinity: 6 }, { stat: 'cred', add: 2 }, { xp: 'systems', add: 40 }, { flag: 'ev_tech.migrated_board' }],
            failEffects: [{ flag: 'ev_tech.board_history_lost' }, { faction: 'fac.loft', add: -4 }, { npc: 'corvid', affinity: -6 }, { stat: 'cred', add: -2 }, buff(GUILT)],
          },
        },
        {
          tag: '[Programming]',
          text: 'Write your own importer from scratch. No black boxes near twelve years of history.',
          check: {
            skill: 'programming',
            dc: 16,
            bonuses: [{ if: { background: 'mathlete' }, add: 2, label: '+2 (mathlete)' }],
            success: 'importer',
            fail: 'eaten',
            successEffects: [{ faction: 'fac.loft', add: 5 }, { npc: 'corvid', affinity: 6 }, { stat: 'cred', add: 3 }, { xp: 'programming', add: 50 }, { flag: 'ev_tech.migrated_board' }, { flag: 'ev_tech.wrote_importer' }],
            failEffects: [{ flag: 'ev_tech.board_history_lost' }, { faction: 'fac.loft', add: -4 }, { npc: 'corvid', affinity: -6 }, { stat: 'cred', add: -2 }, buff(GUILT)],
          },
        },
        {
          if: around('switch'),
          text: '"Let Switch\'s guy do it. I\'m slammed."',
          effects: [{ npc: 'switch', affinity: 3 }, { npc: 'corvid', affinity: -2 }, { faction: 'fac.loft', add: -1 }, { flag: 'ev_tech.switch_migrated' }],
          goto: 'switch_guy',
        },
        {
          text: '"Don\'t move it. Some things should stay on copper."',
          effects: [{ npc: 'corvid', affinity: 1 }, { stat: 'mood', add: 1 }],
          goto: 'stay',
        },
      ],
    },
    migrated: {
      speaker: 'corvid',
      text: [
        'Corvid: 214,000 posts. Every one. I checked the \'94 threads by hand. They\'re all there. Deadline\'s last post before the raid is there.',
        'Corvid: I\'ve done this job for eleven years and nobody has ever done anything this carefully for the board. Thank you. I mean it.',
        '(The new forum goes live Sunday. By Monday, l33tKÎLLƏR has posted in every subforum to complain about the font.)',
      ],
    },
    importer: {
      speaker: 'corvid',
      text: [
        'Corvid: You wrote the whole importer. In a week. And it kept the old ASCII art aligned, which the commercial ones never do.',
        'Corvid: I\'m putting your handle in the forum footer. "Archive preserved by." Don\'t argue.',
      ],
    },
    eaten: {
      speaker: 'corvid',
      text: [
        'Corvid: The import stopped at 1998.',
        'Corvid: Everything before it is garbage characters. The old drive wouldn\'t mount after the export. That was the only full copy.',
        'Corvid: Five years of the scene. The \'94 raid threads. The night we all wiped our drives. Gone.',
      ],
      choices: [
        {
          tag: '[Hardware]',
          text: 'Pull the old drive\'s platters into a recovery rig. It isn\'t over until the platters say so.',
          check: {
            skill: 'hardware',
            dc: 16,
            bonuses: [{ if: { background: 'tinkerer' }, add: 2, label: '+2 (tinkerer)' }],
            success: 'salvaged',
            fail: 'gone',
            successEffects: [{ removeBuff: 'ev_tech_guilt' }, { faction: 'fac.loft', add: 3 }, { npc: 'corvid', affinity: 4 }, { flag: 'ev_tech.board_history_salvaged' }, { xp: 'hardware', add: 40 }],
            failEffects: [{ stat: 'mood', add: -4 }],
          },
        },
        {
          text: 'Tell the board the truth. All of it, under your own handle.',
          effects: [{ faction: 'fac.loft', add: 1 }, { stat: 'cred', add: -1 }],
          goto: 'truth',
        },
        {
          text: 'Blame the old software. It was ancient. It was always going to break.',
          effects: [{ faction: 'fac.loft', add: -1 }, { npc: 'corvid', affinity: -2 }],
          goto: 'blamed',
        },
      ],
    },
    salvaged: {
      speaker: 'corvid',
      text: [
        'Corvid: You got it back. Not all — \'93 is mostly noise — but \'94 through \'98 are readable. The raid threads are readable.',
        'Corvid: I\'m going to go sit in the dark for a while. Good dark. Thank you.',
      ],
    },
    gone: {
      speaker: 'corvid',
      text: [
        'Corvid: The platters are scratched through. There\'s nothing. It\'s all right. It isn\'t, but it will have to be.',
        'Corvid: We\'ll tell the old stories out loud, I suppose. That\'s how it worked before any of this.',
      ],
    },
    truth: {
      speaker: 'corvid',
      text: 'Corvid: Thank you for not hiding. The board will be angry for a month. Then somebody will post "remember the \'94 thread?" and forty people will write down what they remember. That might be its own kind of archive.',
    },
    blamed: {
      speaker: 'corvid',
      text: 'Corvid: Mm. The software was ancient. It was also fine for twelve years until this week. I\'m not going to argue with you about it. I\'m just going to remember that you wanted to.',
    },
    switch_guy: {
      speaker: 'corvid',
      text: [
        'Corvid: All right. Switch\'s guy it is.',
        '(The migration goes fine. The forum looks great. Two months later someone notices that Switch\'s guy kept a copy of the user database, every handle and every old password, "for safekeeping." Nobody can prove where it went.)',
      ],
    },
    stay: {
      speaker: 'corvid',
      text: 'Corvid: ...That is the most sentimental thing anyone has said to me this year. You\'re wrong, but I\'ll hold off another winter. The copper can have one more.',
    },
  },
}

const boardMigration: EventDef = {
  id: 'ev_tech_board_migration',
  category: 'underground',
  weight: 2,
  when: {
    all: [
      actBetween(2, 3),
      around('corvid'),
      { not: { flag: 'w.scene_state', eq: 'dark' } },
      { day: true, gte: dayOf(2003, 6, 1) },
      free,
    ],
  },
  scene: 'ev_tech_board_migration_scene',
}

// ─────────────────────────────────────────────────────────────────────────────
// ev_tech_blog — "THE SEVEN LAYERS OF MY MANAGER"
// ─────────────────────────────────────────────────────────────────────────────
const blogScene: SceneDef = {
  id: 'ev_tech_blog_scene',
  channel: 'mail',
  title: 'Your post "The Seven Layers of My Manager" has 1,204 new comments',
  from: 'Diarist',
  start: 'viral',
  pause: true,
  nodes: {
    viral: {
      speaker: 'Diarist',
      text: [
        'Three weeks ago, at 1 a.m., you wrote a post on your little Diarist blog: "The Seven Layers of My Manager," a networking-model joke with a very real target. It had eleven readers. Most of them were Jax.',
        'Tonight it has 1,204 comments. A tech-humor site linked it. In the comments, someone has correctly guessed your employer. Someone else has correctly guessed your manager\'s first name. Someone has made a diagram.',
      ],
      choices: [
        {
          text: 'Take it down tonight. Delete the whole blog. Deny everything.',
          effects: [{ stat: 'stress', add: 3 }, { stat: 'mood', add: -3 }, { flag: 'ev_tech.blog_deleted' }, { chance: 0.3, then: [buff(THIN_ICE)] }],
          goto: 'deleted',
        },
        {
          tag: '[OpSec]',
          text: 'Scrub every detail that points at your job — and keep it up, anonymously.',
          check: {
            skill: 'opsec',
            dc: 14,
            bonuses: [
              { if: { trait: 'paranoid' }, add: 2, label: '+2 (paranoid)' },
              { if: { background: 'latchkey' }, add: 1, label: '+1 (latchkey)' },
            ],
            success: 'anon',
            fail: 'hr',
            successEffects: [buff(GOING_VIRAL), { xp: 'opsec', add: 25 }, { stat: 'mood', add: 5 }, { flag: 'ev_tech.blogger' }],
            failEffects: [{ stat: 'stress', add: 5 }],
          },
        },
        {
          tag: '[Social]',
          text: 'Double down: a follow-up so funny, and so kind, that even your manager laughs.',
          check: {
            skill: 'social',
            dc: 16,
            bonuses: [
              { if: { trait: 'silver_tongue' }, add: 2, label: '+2 (silver tongue)' },
              { if: { background: 'class_clown' }, add: 2, label: '+2 (class clown)' },
            ],
            success: 'double_win',
            fail: 'hr',
            successEffects: [buff(GOING_VIRAL), { money: 200 }, { stat: 'cred', add: 1 }, { flag: 'ev_tech.columnist' }],
            failEffects: [{ stat: 'stress', add: 5 }],
          },
        },
      ],
    },
    deleted: {
      speaker: 'narrator',
      text: 'You delete it all: three years of posts, the good ones too. The next morning your manager says "good morning" in a perfectly normal voice, and you spend a week wondering whether that voice was normal. The internet, somewhere, has a cached copy. The internet always has a cached copy.',
    },
    anon: {
      speaker: 'narrator',
      text: 'You file the serial numbers off everything — the company becomes "the Firm," your manager becomes "Layer Seven," your city becomes "a port town." The post keeps spreading. Nobody can find you in it. For three weeks, strangers quote you to each other and you are nobody at all. It is wonderful.',
    },
    double_win: {
      speaker: 'narrator',
      text: [
        'The follow-up is called "In Defense of Layer Seven." It is funnier than the first one and it ends with a paragraph about how your manager once drove you home in a snowstorm, which is true.',
        'A tech site offers you a paid monthly column. Your manager forwards the link to his wife with the subject line "I\'m famous?" You are, somehow, fine.',
      ],
    },
    hr: {
      speaker: 'narrator',
      text: 'Monday, 9:02. A meeting invite with no subject. In the small conference room: your manager, a woman from HR you have never seen before, and a printout of your post with three paragraphs highlighted in yellow.',
      choices: [
        {
          tag: '[Social]',
          text: 'Apologize like you mean it. You do, mostly.',
          check: {
            skill: 'social',
            dc: 14,
            bonuses: [{ if: { trait: 'empath' }, add: 2, label: '+2 (you can see what it cost him)' }],
            success: 'kept_job',
            fail: 'dooced',
            successEffects: [buff(THIN_ICE), { stat: 'stress', add: 6 }],
            failEffects: [{ job: null }, { trait: 'ev_tech_scar_dooced' }, { stat: 'stress', add: 12 }, { stat: 'mood', add: -10 }, { stat: 'cred', add: 2 }],
          },
        },
        {
          tag: '[Business]',
          text: 'Point out, calmly, that they have no written policy on employee blogs. You checked.',
          check: {
            skill: 'business',
            dc: 16,
            success: 'policy',
            fail: 'dooced',
            successEffects: [buff(THIN_ICE), { stat: 'mood', add: 3 }, { stat: 'cred', add: 1 }],
            failEffects: [{ job: null }, { trait: 'ev_tech_scar_dooced' }, { stat: 'stress', add: 12 }, { stat: 'mood', add: -10 }, { stat: 'cred', add: 2 }],
          },
        },
        {
          text: 'Save them the trouble. "I\'ll clear my desk."',
          effects: [{ job: null }, { stat: 'mood', add: 2 }, { stat: 'stress', add: -4 }, { flag: 'ev_tech.quit_over_blog' }],
          goto: 'quit',
        },
      ],
    },
    kept_job: {
      speaker: 'narrator',
      text: '"We appreciate your candor," says HR, in the tone of someone writing "final warning" in a file. Your manager doesn\'t look at you. On the way out, very quietly, he says: "The part about the stapler was fair." You keep your job. You don\'t keep the blog.',
    },
    policy: {
      speaker: 'narrator',
      text: 'There is a long silence while HR flips through a binder that does not contain what she is looking for. "We\'ll be drafting one," she says at last. You keep your job. There is, by Friday, a policy. It is named, informally, after you.',
    },
    dooced: {
      speaker: 'narrator',
      text: [
        '"We\'ve decided to go in a different direction," says HR, which is how they say it. A cardboard box appears from nowhere, as if the building keeps them in the walls. Security walks you to the lift. Somebody claps, once, from a cubicle, and then thinks better of it.',
        'By evening, "fired for a blog post" is itself a post, on someone else\'s blog, with your handle in it. There is a word for this now. The word is your name.',
      ],
    },
    quit: {
      speaker: 'narrator',
      text: 'You put your badge on the table. HR looks relieved; your manager looks, oddly, sad. Walking out into the afternoon with a box of desk things, you feel lighter than you have in a year, and also you have no job, and both of those things are true at once.',
    },
  },
}

const blog: EventDef = {
  id: 'ev_tech_blog',
  category: 'work',
  weight: 2,
  when: { all: [between(dayOf(2003, 2, 1), dayOf(2008, 11, 31)), officeJob, free] },
  scene: 'ev_tech_blog_scene',
}

// ─────────────────────────────────────────────────────────────────────────────
// ev_tech_open_wifi — "the internet is FREE now??"
// ─────────────────────────────────────────────────────────────────────────────
const wifiScene: SceneDef = {
  id: 'ev_tech_open_wifi_scene',
  channel: 'mail',
  title: 'the internet is FREE now??',
  from: 'grandma_ruth',
  start: 'mail',
  expiresDays: 21,
  onExpire: [{ npc: 'grandma_ruth', affinity: -2 }],
  nodes: {
    mail: {
      speaker: 'grandma_ruth',
      text: [
        'Dear {name},\n\nMy grandson bought me a wireless box for Christmas and now I have the internet in the BATHROOM. Also my new laptop computer says there are nine other internets on the street I could join. One is called DEFAULT. One is called PRETTYFLY. One is called FEDERAL_SURVEILLANCE_VAN (Mr. Szabo\'s, I think).',
        'Is it stealing to use them? Is someone using MINE? My box is called RUTHSBOX and it has no password because I do not like passwords.\n\nLove, Ruth\n\nP.S. I have made empanadas. This is not a bribe. It is a little bit a bribe.',
      ],
      choices: [
        {
          text: 'Go over and put a proper password on RUTHSBOX. Eat the empanadas.',
          effects: [{ npc: 'grandma_ruth', affinity: 4 }, { faction: 'fac.hood', add: 1 }, { stat: 'health', add: 2 }, { stat: 'mood', add: 3 }],
          goto: 'secured',
        },
        {
          tag: '[Networking]',
          text: 'Go bigger: one shared, secured network for the whole Row. Free for everyone, owned by nobody.',
          check: {
            skill: 'networking',
            dc: 15,
            bonuses: [
              { if: { flag: 'ev_tech.row_it_guy' }, add: 2, label: '+2 (you already know every box on the street)' },
              { if: { background: 'arcade_rat' }, add: 1, label: '+1 (arcade rat)' },
            ],
            success: 'mesh',
            fail: 'mesh_down',
            successEffects: [{ faction: 'fac.hood', add: 5 }, { npc: 'grandma_ruth', affinity: 4 }, { xp: 'networking', add: 50 }, { flag: 'ev_tech.row_mesh' }, { stat: 'mood', add: 6 }],
            failEffects: [
              { faction: 'fac.hood', add: -3 },
              owe('ev_tech_router_bill', 'Replacing the Row\'s routers', 3, 30),
              { stat: 'stress', add: 6 },
              { flag: 'ev_tech.mesh_blamed' },
            ],
          },
        },
        {
          tag: '[Heat]',
          text: 'Say nothing about DEFAULT. Borrow it yourself, for the things you\'d rather not do from home.',
          effects: [
            { stat: 'heat', add: -3 },
            { flag: 'ev_tech.piggyback' },
            { npc: 'grandma_ruth', affinity: 1 },
            {
              chance: 0.35,
              then: [
                { faction: 'fac.hood', add: -3 },
                buff(GUILT),
                { notify: 'A detective knocked on the door of whoever owns DEFAULT on the Row. They didn\'t know anything. You did.', kind: 'bad' },
              ],
            },
          ],
          goto: 'piggyback',
        },
        {
          text: 'Write back: it\'s fine, don\'t worry, empanadas are payment enough.',
          effects: [{ npc: 'grandma_ruth', affinity: 2 }, { stat: 'health', add: 1 }],
          goto: 'fine',
        },
      ],
    },
    secured: {
      speaker: 'grandma_ruth',
      text: [
        '"A password. Like a speakeasy." She makes you write it on an index card and hides the card in the flour tin, which you decide is, honestly, better security than most banks.',
        'The empanadas are extraordinary. You leave with six more wrapped in foil and her opinion of everyone on the street.',
      ],
    },
    mesh: {
      speaker: 'narrator',
      text: [
        'It takes three weekends, eleven routers, a borrowed ladder and Mr. Szabo\'s grudging permission to put a box on his fire escape ("if the van people complain, it was you"). When you flip it on, every flat on the Row has fast, free, locked-down internet.',
        'The laundromat puts up a sign: FREE ROW WIFI — ASK FOR THE PASSWORD. People ask Grandma Ruth. She has never been happier.',
      ],
    },
    mesh_down: {
      speaker: 'narrator',
      text: [
        'You flip it on during the championship game. Every box on the street reboots at once and does not come back. Forty flats lose their internet, their cable box, and, somehow, two of their cordless phones.',
        'Mr. Szabo is convinced it was the van. The tenants\' association is convinced it was you. They are correct, and they would like two routers\' worth of money back.',
      ],
    },
    piggyback: {
      speaker: 'narrator',
      text: 'You write Ruth a nice note about her own box. You say nothing about DEFAULT. Over the next weeks, some of your quieter work goes out through a stranger\'s router on the Row. It is very convenient. It belongs to somebody. You try not to think about who.',
    },
    fine: {
      speaker: 'grandma_ruth',
      text: '"Oh good," she writes back. "Then I will keep using PRETTYFLY, it is very fast." You decide not to explain what that means. The empanadas arrive the next day regardless.',
    },
  },
}

const openWifi: EventDef = {
  id: 'ev_tech_open_wifi',
  category: 'tech',
  weight: 2,
  when: { all: [{ day: true, gte: dayOf(2004, 3, 1) }, broadbandGte(1), around('grandma_ruth'), free, actGte(2)] },
  scene: 'ev_tech_open_wifi_scene',
}

// ─────────────────────────────────────────────────────────────────────────────
// ev_tech_arg — SIGNAL/NOISE, frame 1,214
// ─────────────────────────────────────────────────────────────────────────────
const apertureThriving: Cond = { flag: 'w.aperture_state', eq: 'thriving' }

const argScene: SceneDef = {
  id: 'ev_tech_arg_scene',
  channel: 'forum',
  board: 'offtopic',
  title: 'the SIGNAL/NOISE trailer has a phone number in it (frame 1,214)',
  from: 'Loft BBS',
  start: 'thread',
  expiresDays: 21,
  nodes: {
    thread: {
      speaker: 'Loft BBS',
      text: [
        'Pause the new SIGNAL/NOISE movie trailer at frame 1,214. There\'s a whiteboard in the background with a phone number on it. It\'s a real Port Lumen number. A recorded voice reads a string of letters and hangs up.',
        '"It\'s an ARG," says the next reply. "Alternate reality game. Somebody\'s building a puzzle hunt out of the real city — payphones, websites, a voicemail box. Last one like this ran for three months."',
        { if: around('byteme'), text: 'byteme: i called it 11 times my mom is SO mad. the letters change every day at midnight. someone smart pls help' },
        'The thread is forty pages long. The board is obsessed. Nobody has cracked the letters yet.',
      ],
      choices: [
        {
          tag: '[Cryptography]',
          text: 'Crack the letter string. It\'s a cipher, and you have seen this shape before.',
          check: {
            skill: 'cryptography',
            dc: 14,
            bonuses: [
              { if: { background: 'mathlete' }, add: 2, label: '+2 (mathlete)' },
              { if: { trait: 'bookworm' }, add: 1, label: '+1 (bookworm)' },
            ],
            success: 'solved',
            fail: 'wrong_man',
            successEffects: [{ stat: 'mood', add: 6 }, { stat: 'cred', add: 2 }, { xp: 'cryptography', add: 40 }, { flag: 'ev_tech.arg_solved' }],
            failEffects: [{ trait: 'ev_tech_scar_wrong_man' }, buff(GUILT), { stat: 'stress', add: 6 }],
          },
        },
        {
          text: 'Call the number yourself at 3 a.m. and just listen.',
          effects: [buff(SPOOKED), { stat: 'mood', add: 2 }],
          goto: 'listen',
        },
        {
          if: around('byteme'),
          text: 'Page byteme and talk him out of calling it a twelfth time before his mother strangles him.',
          effects: [{ npc: 'byteme', affinity: 3 }],
          goto: 'byteme',
        },
        { tag: '[Leave]', text: 'ARGs are marketing. Close the thread.', effects: [{ stat: 'mood', add: -1 }] },
      ],
    },
    solved: {
      speaker: 'narrator',
      text: [
        'It\'s a keyed shift — the key hidden in the film\'s tagline — and the plaintext is a payphone on Sodium Row and a time: Saturday, 9 p.m. You are there at 8:50. At 9:00 exactly, it rings.',
        'A voice says: "Congratulations. You heard the signal in the noise." A box under the phone\'s shelf holds a T-shirt, a pair of premiere tickets, and a business card.',
        { if: apertureThriving, text: 'The card is plain white. On the back, in small grey type: "Aperture Data Solutions — Talent. We noticed." There is a phone number. The puzzle was never just a movie ad. It was an interview.' },
        { if: { not: apertureThriving }, text: 'The card says only "we noticed," and a web address that 404s a week later. You keep it anyway.' },
      ],
      effects: [{ if: apertureThriving, then: [{ faction: 'fac.aperture', add: 2 }, { flag: 'ev_tech.arg_aperture' }] }],
    },
    wrong_man: {
      speaker: 'narrator',
      text: [
        'You crack it — you\'re sure you crack it — and it comes out as an address in Millgate. You post it in the thread in capitals: FOUND IT. By morning, forty people have been to that address.',
        'It\'s a real apartment. It belongs to a real man named Gordon Pike, a night-shift baker who has never heard of SIGNAL/NOISE, and who woke at noon to strangers photographing his mailbox and shouting a password through his letterbox.',
        'Then someone on the board re-runs your math and finds your mistake in the second line.',
      ],
      choices: [
        {
          tag: '[Social]',
          text: 'Go to Gordon\'s door yourself and apologize to his face.',
          check: {
            skill: 'social',
            dc: 13,
            bonuses: [{ if: { trait: 'empath' }, add: 2, label: '+2 (empath)' }],
            success: 'gordon_ok',
            fail: 'gordon_slam',
            successEffects: [{ removeBuff: 'ev_tech_guilt' }, { faction: 'fac.hood', add: 1 }, { stat: 'stress', add: -3 }],
            failEffects: [{ faction: 'fac.hood', add: -1 }, { stat: 'stress', add: 3 }],
          },
        },
        {
          text: 'Post a retraction and an apology, loudly, everywhere you posted the address.',
          effects: [{ stat: 'cred', add: -1 }],
          goto: 'retract',
        },
        {
          text: 'Delete your post and say nothing. The thread moves fast.',
          effects: [{ stat: 'cred', add: -2 }, { faction: 'fac.hood', add: -2 }, { flag: 'ev_tech.arg_coward' }],
          goto: 'silent',
        },
      ],
    },
    gordon_ok: {
      speaker: 'Gordon Pike',
      text: [
        '"You\'re the one who did the math." He looks at you for a long time. He has flour on his forearms. "My whole life, nobody\'s ever come to my door to say sorry for anything. Not the landlord. Not my ex-wife. You want tea?"',
        'You have tea. He tells you about bread. When you leave he says, "Check your work, kid," and you will, for the rest of your life.',
      ],
    },
    gordon_slam: {
      speaker: 'Gordon Pike',
      text: '"I don\'t care," he says through the chain, before you finish the first sentence. "I haven\'t slept in two days. Go away." The door closes. You stand there for a while holding an apology nobody took.',
    },
    retract: {
      speaker: 'narrator',
      text: 'Your retraction is honest and long and it gets fewer views than the address did, which is how retractions work. Some people thank you for it. Some people screenshot the original. The address is still out there, attached to your handle, in forty browser caches.',
    },
    silent: {
      speaker: 'narrator',
      text: 'You delete the post. Someone has already quoted it. The thread moves on, and so does the crowd, eventually, from Gordon Pike\'s mailbox. You never find out if he got his sleep back. You look him up once, years later, and then wish you hadn\'t.',
    },
    listen: {
      speaker: 'narrator',
      text: [
        'At 3 a.m. the recorded voice reads its letters, slow and clear. Under it, very faint, there is a sound like surf breaking on rocks.',
        { if: { any: [{ flag: 'ev_tech.cam_watched' }, { flag: 'ev_tech.cam_found' }, { flag: 'ev_tech.cam_legend' }] }, text: 'You know that surf. You have listened to it at ten past three before, watching a lamp room window. The recording was made at Gull Point.' },
        'You hang up and sit in the dark, feeling like the city just whispered something to you and you didn\'t quite catch it.',
      ],
    },
    byteme: {
      speaker: 'byteme',
      text: 'byteme: ok ok i stopped. my mom took the phone into her room and locked the door. she said "who is SIGNAL NOISE and why does he need you." i said its a movie and she said "a movie doesnt need you, i need you to do the dishes." she has a point tbh',
    },
  },
}

const arg: EventDef = {
  id: 'ev_tech_arg',
  category: 'weird',
  weight: 2,
  when: { all: [between(dayOf(2004, 4, 1), dayOf(2007, 11, 31)), free, actGte(2)] },
  scene: 'ev_tech_arg_scene',
}

// ─────────────────────────────────────────────────────────────────────────────
// ev_tech_numbers_station — LUMEN SEVEN
// ─────────────────────────────────────────────────────────────────────────────
const stationScene: SceneDef = {
  id: 'ev_tech_numbers_station_scene',
  channel: 'dialog',
  title: 'LUMEN SEVEN',
  from: 'an internet radio stream, 3:03 a.m.',
  start: 'static',
  nodes: {
    static: {
      speaker: 'narrator',
      text: [
        '3:03 a.m. You\'re clicking through a directory of internet radio streams when you land on one called LUMEN SEVEN. No description. Eleven listeners.',
        'A woman\'s voice, flat and patient, reads numbers in groups of five over a hiss that sounds like weather. "Four-one-one-seven-two. Nine-nine-zero-three-one." A chime. Then more numbers. Then a long, clean tone, and the numbers start again.',
        'The stream\'s server is in Port Lumen. According to its own counter, it has been running since 1997.',
      ],
      choices: [
        {
          tag: '[Cryptography]',
          text: 'Record an hour of it and break the groups.',
          check: {
            skill: 'cryptography',
            dc: 16,
            bonuses: [
              { if: { background: 'mathlete' }, add: 2, label: '+2 (mathlete)' },
              { if: { flag: 'ev_tech.arg_solved' }, add: 1, label: '+1 (you have cracked a city puzzle before)' },
            ],
            success: 'decoded',
            fail: 'hole',
            successEffects: [{ flag: 'ev_tech.lumen_seven_decoded' }, { xp: 'cryptography', add: 50 }, { stat: 'mood', add: 4 }],
            failEffects: [buff(RABBIT_HOLE), { stat: 'stress', add: 6 }, { stat: 'energy', add: -10 }, { flag: 'ev_tech.lumen_seven_obsessed' }],
          },
        },
        {
          if: around('dialtone'),
          text: 'Send Marge Osgood the link. If anyone knows a voice like that, it\'s her.',
          effects: [{ npc: 'dialtone', affinity: 5 }, { stat: 'mood', add: 4 }, { flag: 'ev_tech.lumen_seven_decoded' }],
          goto: 'marge',
        },
        {
          text: 'Leave it playing, low, and fall asleep to it.',
          effects: [{ stat: 'stress', add: -4 }, buff(SPOOKED)],
          goto: 'sleep',
        },
        { tag: '[Leave]', text: 'Turn it off. Some doors should stay shut at 3 a.m.', effects: [{ stat: 'stress', add: -1 }] },
      ],
    },
    decoded: {
      speaker: 'narrator',
      text: [
        'By dawn you have it, and it is not what you feared. The groups are telephone line numbers — five digits, the old Cannery/Millgate exchange format — and the long tone after each block is a line-test signal.',
        'Somebody, in 1997, wired the old exchange\'s automatic nightly line check into a stream. Every night since, LUMEN SEVEN has been reading out every copper line still connected to the building. A census of the old net, shrinking year by year. Last night it read four hundred and twelve.',
        { if: around('dialtone'), text: 'Marge would want to hear this. You have a feeling she already knows.' },
      ],
    },
    hole: {
      speaker: 'narrator',
      text: [
        'You can\'t crack it. You also can\'t stop. By the end of the week you have a notebook full of fives, a spreadsheet of chime intervals, and a theory involving the tides that you explain to nobody because you can hear how it sounds.',
        'You listen every night at 3:03. The numbers change. You are sure they mean something. You are sure you are close.',
      ],
    },
    marge: {
      speaker: 'dialtone',
      text: [
        '"Oh, love." You can hear her smile down the line. "That\'s the line-check tape. The exchange ran it every night at three, when the calls were quiet — every live number read out, one by one, to make sure the copper still answered. That\'s Winifred on the tape. She did it in \'71 and they never recorded another."',
        '"Somebody\'s been keeping her talking." A pause. "The building still answers, you know. More of it than they think."',
      ],
    },
    sleep: {
      speaker: 'narrator',
      text: 'You fall asleep to the numbers and dream in groups of five: long corridors of copper, a switchboard the size of a city, a patient voice checking that every line still answers. You wake rested and a little haunted. Both, it turns out, at once.',
    },
  },
}

const numbersStation: EventDef = {
  id: 'ev_tech_numbers_station',
  category: 'weird',
  weight: 1,
  when: { all: [actBetween(2, 3), { day: true, gte: dayOf(2005, 0, 1) }, free] },
  scene: 'ev_tech_numbers_station_scene',
}

// ─────────────────────────────────────────────────────────────────────────────
// ev_tech_smartphone — the Oblong
// ─────────────────────────────────────────────────────────────────────────────
const dadHere: Cond = { all: [around('dad'), { npc: 'dad', fateNot: 'spiral' }] }

const phoneScene: SceneDef = {
  id: 'ev_tech_smartphone_scene',
  channel: 'dialog',
  title: 'The Oblong',
  from: 'Sodium Row phone shop',
  start: 'window',
  nodes: {
    window: {
      speaker: 'narrator',
      text: [
        'It is the summer everyone in Millgate is holding the same thing: a slab of glass and black called the Oblong. No keys. You touch it and it touches back. The whole internet in your pocket, a camera, and a map that knows exactly where you are standing.',
        { if: around('jax'), text: 'Jax calls it "a tricorder for people with dental insurance." Jax has also stood outside this window three times this week.' },
        'The line at the phone shop on Sodium Row is forty deep. $499 and a two-year contract. The man behind the counter is holding one like it\'s a holy relic.',
      ],
      choices: [
        {
          text: 'Buy one. It\'s the future, and the future has a touchscreen.',
          req: { stat: 'money', gte: 499 },
          reqText: 'Requires $499',
          effects: [{ money: -499 }, { item: 'ev_tech_oblong' }, buff(NEW_TOY)],
          goto: 'geotag',
        },
        {
          tag: '[OpSec]',
          text: 'Buy one, turn off every sensor it has, and use it as a very expensive notebook.',
          req: { all: [{ stat: 'money', gte: 499 }, { skill: 'opsec', gte: 20 }] },
          reqText: 'Requires $499 and OpSec 20',
          effects: [{ money: -499 }, { item: 'ev_tech_oblong' }, { xp: 'opsec', add: 15 }],
          goto: 'locked_down',
        },
        {
          if: dadHere,
          text: 'Buy one for Dad. He has been standing outside this window too.',
          req: { stat: 'money', gte: 499 },
          reqText: 'Requires $499',
          effects: [{ money: -499 }, { npc: 'dad', affinity: 6 }, { stat: 'mood', add: 4 }],
          goto: 'dad_phone',
        },
        {
          text: 'Keep the old brick. It can survive a fall off a building, and it can\'t tell anyone anything.',
          effects: [{ stat: 'heat', add: -1 }, { stat: 'mood', add: -1 }],
          goto: 'brick',
        },
      ],
    },
    geotag: {
      speaker: 'narrator',
      text: [
        'For three weeks it is magic. You take photos of everything: the Cathode booth at 2 a.m., your desk, the fog on the Sound, the back room with its tangle of cables and the one good chair.',
        'Then you notice a setting you never touched. Every photo you\'ve posted carries a tiny invisible stamp: where it was taken, to within a few meters.',
      ],
      choices: [
        {
          tag: '[OpSec]',
          text: 'Strip every stamp from every photo, lock every setting, audit everything on the phone.',
          check: {
            skill: 'opsec',
            dc: 14,
            bonuses: [
              { if: { trait: 'paranoid' }, add: 2, label: '+2 (paranoid)' },
              { if: { background: 'latchkey' }, add: 1, label: '+1 (latchkey)' },
            ],
            success: 'stripped',
            fail: 'mapped',
            successEffects: [{ xp: 'opsec', add: 30 }, { stat: 'heat', add: -2 }],
            failEffects: [
              buff(PINNED),
              { stat: 'heat', add: 6 },
              { trait: 'ev_tech_scar_on_the_map' },
              { if: { stat: 'heat', gte: 40 }, then: [{ stat: 'heat', add: 4 }] },
              { chance: 0.4, then: [{ complication: 'legal' }] },
            ],
          },
        },
        {
          text: 'Delete the photos. Keep the phone. Hope nobody was looking.',
          effects: [{ stat: 'heat', add: 2 }, { stat: 'stress', add: 2 }],
          goto: 'deleted',
        },
        {
          text: 'Walk to the end of the pier and throw the whole thing into the Sound.',
          effects: [{ item: 'ev_tech_oblong', remove: true }, { removeBuff: 'ev_tech_new_toy' }, { stat: 'stress', add: -3 }, { stat: 'mood', add: -4 }],
          goto: 'splash',
        },
      ],
    },
    stripped: {
      speaker: 'narrator',
      text: 'It takes an evening and three settings menus that seem designed by someone who hates you. When you\'re done, your photos are just photos again: a booth, a desk, some fog, no coordinates. You keep the phone. You keep a wary eye on it, too.',
    },
    mapped: {
      speaker: 'narrator',
      text: [
        'You scrub what you can find. It isn\'t enough. The photo site has already been crawled; a scraper somewhere kept the originals, stamps and all.',
        'For someone who knows how to read them, your last month is a map: where you eat, where you sleep, and a building on Sodium Row where you spend a lot of very late nights.',
      ],
    },
    deleted: {
      speaker: 'narrator',
      text: 'You delete the photos. Some of them were already copied to other sites; you can\'t get those back. You keep the phone, and you turn the camera setting off, and you don\'t think about it again, mostly.',
    },
    splash: {
      speaker: 'narrator',
      text: 'It sails in a lovely arc and goes into the grey water with barely a sound. Four hundred and ninety-nine dollars. A gull investigates and loses interest. You walk home lighter and poorer and, you think, safer.',
    },
    locked_down: {
      speaker: 'narrator',
      text: 'The man at the counter watches you disable the camera, the map, the location, the microphone permissions, and the cheerful assistant, one by one, with the expression of a priest watching someone baptize a toaster. It\'s a very nice notepad. It knows nothing about you.',
    },
    dad_phone: {
      speaker: 'dad',
      text: [
        'Your father holds it the way he used to hold new tools: carefully, turning it over, looking for the screws. "There are no screws," he says, betrayed. Then, "How do I call your mother on it."',
        'That evening he sends you forty-three photos of the dinner table, one of the cat, and a video of the ceiling fan. It is the most he has said to you in a single day in years.',
      ],
    },
    brick: {
      speaker: 'narrator',
      text: 'You keep the brick. It has a two-color screen, a game with a snake in it, and a battery that lasts nine days. By the end of the year, you are one of the only people in Port Lumen whose phone cannot tell anyone where they are. You find you like that very much.',
    },
  },
}

const smartphone: EventDef = {
  id: 'ev_tech_smartphone',
  category: 'era',
  weight: 3,
  when: { all: [between(dayOf(2007, 6, 1), dayOf(2010, 11, 31)), free, actGte(2)] },
  scene: 'ev_tech_smartphone_scene',
}

export default defineContent({
  items: [oblong],
  scenes: [migrationScene, blogScene, wifiScene, argScene, stationScene, phoneScene],
  events: [boardMigration, blog, openWifi, arg, numbersStation, smartphone],
})
