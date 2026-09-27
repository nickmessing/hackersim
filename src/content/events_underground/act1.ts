/**
 * events_underground — ACT I & early II (days 0–~900). Small stakes, warm nostalgia, dial-up
 * comedy. The darkness is a rumour in a locked subboard; out here it's flame wars, Corvid's monthly
 * puzzle, discs that need a bike courier, a high-score war, and a sixteen-year-old paging you at
 * 2 a.m. because he ran a thing.
 *
 *  - ev_under_flame_bait       repeatable · forum · l33tKÎLLƏR picks a fight (Social / Programming)
 *  - ev_under_warez_courier    once · chat · Switch's bike-courier run (Business)
 *  - ev_under_byteme_2am       repeatable · chat · byteme panics (OpSec / Hardware)
 *  - ev_under_arcade_showdown  repeatable · dialog · GAUNTLET REDUX vs. "ASS" (Fitness / Social)
 *  - ev_under_board_puzzle     repeatable · forum · Corvid's crossword (Cryptography / Programming)
 *
 * HARD RULE: hacking is invented flavor only. No real techniques, tools or commands.
 */
import { defineContent } from '@/engine/registry'
import type { EventDef, SceneDef } from '@/engine/types'
import { ABSENT, LAUGHINGSTOCK, actBetween, actIs, around, atHome, boardLive, buff, bump, snapshot, stillLight } from './_shared'

// ── ev_under_flame_bait ───────────────────────────────────────────────────────
// The board flamer picks a fight. Repeatable comedy; a bad roll makes you the month's punchline.
const FLAME_COUNT = 'ev_under.flame_count'

const flameBaitScene: SceneDef = {
  id: 'ev_under_flame_bait_scene',
  channel: 'forum',
  board: 'general',
  title: 'RE: RE: RE: ur "fix" is a JOKE and so are u',
  from: 'flamer',
  start: 'post',
  expiresDays: 14,
  onExpire: [{ stat: 'cred', add: -1 }, { log: 'You never answered l33tKÎLLƏR. He declared victory in a 900-word post. The board mostly scrolled past it.', kind: 'info' }],
  nodes: {
    post: {
      speaker: 'flamer',
      text: [
        { if: { var: FLAME_COUNT, lte: 1 }, text: 'LMAO look who crawled onto MY board. i SAW ur help post. "elegant"?? my GRANDMOTHER writes cleaner and shes been DEAD since \'98' },
        { if: { all: [{ var: FLAME_COUNT, gte: 2 }, { flag: 'ev_under.flame_prev_lost' }] }, text: 'ROUND TWO. last time u cried so hard the board had to add a new smiley for it. i have it saved. i have it BACKED UP. ready for another L??' },
        { if: { all: [{ var: FLAME_COUNT, gte: 2 }, { not: { flag: 'ev_under.flame_prev_lost' } }] }, text: 'ok so maybe u got lucky ONE time. luck. LUCK. i have been practicing. i bought a BOOK. u and me, again, right now' },
        'u wanna go?? me and u. post ur best work RIGHT NOW or admit ur a n00b in front of the WHOLE BOARD',
        ';;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;\n;; l33tKÎLLƏR :: undefeated :: cope ;;\n;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;',
      ],
      choices: [
        {
          tag: '[Social]',
          text: 'Roast him back — surgically, and funny enough that the board laughs *with* you.',
          check: {
            skill: 'social',
            dc: 12,
            bonuses: [
              { if: { trait: 'silver_tongue' }, add: 2, label: '+2 (silver tongue)' },
              { if: { background: 'class_clown' }, add: 2, label: '+2 (you were built for this)' },
              { if: { trait: 'hothead' }, add: -2, label: '−2 (you are already typing in caps)' },
            ],
            success: 'roast_win',
            fail: 'roast_lose',
            successEffects: [
              { stat: 'cred', add: 2 },
              { stat: 'mood', add: 5 },
              { faction: 'fac.loft', add: 1 },
              { npc: 'flamer', affinity: -3 },
              { flag: 'ev_under.flamewar_won' },
              { clearFlag: 'ev_under.flamewar_lost' },
            ],
            failEffects: [
              { stat: 'cred', add: -2 },
              { stat: 'mood', add: -4 },
              { flag: 'ev_under.flamewar_lost' },
              buff(LAUGHINGSTOCK),
            ],
          },
        },
        {
          tag: '[Programming]',
          text: 'Say nothing. Post a solution so clean it makes his look like it was chewed by a dog.',
          check: {
            skill: 'programming',
            dc: 13,
            bonuses: [
              { if: { background: 'mathlete' }, add: 2, label: '+2 (you actually read the theory)' },
              { if: { trait: 'bookworm' }, add: 1, label: '+1 (you read the manual. all of it)' },
            ],
            success: 'code_win',
            fail: 'code_lose',
            successEffects: [
              { stat: 'cred', add: 3 },
              { xp: 'programming', add: 25 },
              { faction: 'fac.loft', add: 1 },
              { flag: 'ev_under.flamewar_won' },
              { clearFlag: 'ev_under.flamewar_lost' },
            ],
            failEffects: [
              { stat: 'cred', add: -3 },
              { stat: 'stress', add: 4 },
              { flag: 'ev_under.flamewar_lost' },
              buff(LAUGHINGSTOCK),
            ],
          },
        },
        {
          text: 'Reply with a forty-line ASCII dragon eating a keyboard. Add nothing else.',
          effects: [{ stat: 'mood', add: 4 }, { stat: 'cred', add: 1 }, { flag: 'ev_under.posted_dragon' }],
          goto: 'dragon',
        },
        { tag: '[Leave]', text: "Don't feed it. Close the tab.", effects: [{ stat: 'mood', add: -1 }], goto: 'ignored' },
      ],
    },
    roast_win: {
      speaker: 'narrator',
      text: [
        'Your reply is four lines long. The fourth one is the kind of joke people quote at each other for years.',
        { if: around('byteme'), text: 'byteme: "oh my god. OH MY GOD. someone screencap this before he edits it. {handle} u are my HERO. he logged off. HE LOGGED OFF"', else: 'The thread fills with laughing smileys. l33tKÎLLƏR logs off without replying, which on this board counts as a knockout.' },
      ],
    },
    roast_lose: {
      speaker: 'flamer',
      text: [
        'THATS the best u got?? weak. WEAK. everyone point and laugh. ;)  <-- thats me winking at ur whole personality',
        'By morning someone has turned your comeback into a signature file. It is in four signatures by lunch. The board has a new favourite joke, and it is you.',
      ],
    },
    code_win: {
      speaker: 'narrator',
      text: 'You post six lines and one comment: "hope this helps :)". The thread fills with "GG" and one very quiet "...ok that\'s actually good." l33tKÎLLƏR does not reply. l33tKÎLLƏR is never quiet.',
    },
    code_lose: {
      speaker: 'flamer',
      text: [
        'IT DOESNT EVEN COMPILE. it DOESNT EVEN COMPILE. i cant breathe. someone get this n00b a manual. or a mirror. HAHAHAHA',
        'He is right, which is the worst part. A missing bracket, posted to three hundred people. It will be in signatures for a month.',
      ],
    },
    dragon: {
      speaker: 'corvid',
      text: 'The dragon is genuinely excellent artwork and I am printing it for the wall by the couch. Marcus, stop typing in all caps in my house. Everyone else, back to work.',
    },
    ignored: {
      speaker: 'narrator',
      text: 'You close the tab. Behind it, a thread keeps growing without you — nine pages by morning, most of it him arguing with a user called "grammarcop". You were never needed. It is oddly freeing.',
    },
  },
}

const flameBait: EventDef = {
  id: 'ev_under_flame_bait',
  category: 'underground',
  weight: 3,
  repeatable: true,
  cooldownDays: 90,
  when: {
    all: [
      actBetween(1, 2),
      boardLive,
      { quest: 'main_a1_q1_boot_sequence', status: 'completed' },
      { npc: 'flamer', fateNot: ABSENT },
    ],
  },
  effects: [
    { npc: 'flamer', met: true },
    bump(FLAME_COUNT),
    snapshot('ev_under.flamewar_lost', 'ev_under.flame_prev_lost'),
  ],
  scene: 'ev_under_flame_bait_scene',
}

// ── ev_under_warez_courier ────────────────────────────────────────────────────
// A one-off Act I temptation: move burned discs around the Row for pocket money.
const courierScene: SceneDef = {
  id: 'ev_under_warez_courier_scene',
  channel: 'chat',
  title: 'easy money?',
  from: 'switch',
  start: 'pitch',
  expiresDays: 14,
  onExpire: [{ npc: 'switch', affinity: -1 }],
  nodes: {
    pitch: {
      speaker: 'switch',
      text: [
        'hey. you got a bike, right? i got a stack of discs — games, a couple of utilities, nothing that\'ll get anyone shot — that need to be at four spots on the Row by friday',
        '$40. cash. you never met me. the discs were never in your bag. simple, clean, and it puts your name around as somebody who shows up',
        { if: { background: 'latchkey' }, text: 'and don\'t give me the face. you grew up with a key on a string. you know how to walk home a long way round.' },
        'or you can keep fixing monitors for exposure. your call, kid',
      ],
      choices: [
        {
          text: 'Take the run. Forty bucks is forty bucks.',
          effects: [
            { money: 40 },
            { stat: 'cred', add: 1 },
            { stat: 'heat', add: 2 },
            { flag: 'ev_under.ran_for_switch' },
            { npc: 'switch', affinity: 3 },
          ],
          goto: 'took',
        },
        {
          tag: '[Business]',
          text: '"Forty, plus a cut of whatever those utilities sell for. I know what I\'m carrying."',
          check: {
            skill: 'business',
            dc: 12,
            bonuses: [{ if: { background: 'class_clown' }, add: 1, label: '+1 (you can sell anything)' }],
            success: 'haggle_win',
            fail: 'haggle_lose',
          },
        },
        {
          tag: '[Leave]',
          text: '"I\'ll keep my name clean a little longer, thanks."',
          effects: [{ stat: 'cred', add: -1 }],
          goto: 'passed',
        },
      ],
    },
    haggle_win: {
      speaker: 'switch',
      text: 'ha. ok. OK. i like that. sixty, and a pie at the Cathode. you\'re gonna be a problem for somebody someday and i hope it\'s not me',
      effects: [{ money: 60 }, { stat: 'cred', add: 2 }, { stat: 'heat', add: 2 }, { flag: 'ev_under.ran_for_switch' }, { npc: 'switch', affinity: 5 }],
    },
    haggle_lose: {
      speaker: 'switch',
      text: [
        'nah. you don\'t know what you\'re carrying, that\'s the whole point of you carrying it. forty, take it or leave it. and now i\'m wondering if you talk too much',
        'You take it. The route he gives you this time goes past the pager shop twice and the police substation once. A lesson, delivered by bike.',
      ],
      effects: [{ money: 40 }, { stat: 'heat', add: 4 }, { npc: 'switch', affinity: -3 }, { flag: 'ev_under.ran_for_switch' }, { flag: 'ev_under.switch_thinks_you_talk' }],
    },
    took: {
      speaker: 'narrator',
      text: 'Four stops, one flat tire, and a dog on Cannery that will remember your ankles forever. The discs land where they\'re meant to. Two days later a stranger nods at you outside the pager shop like you\'re somebody. Maybe you are, a little.',
    },
    passed: {
      speaker: 'switch',
      text: 'suit yourself. offer\'s good til it isn\'t. plenty of kids on this Row with a bike and no principles.',
    },
  },
}

const warezCourier: EventDef = {
  id: 'ev_under_warez_courier',
  category: 'money',
  weight: 2,
  when: { all: [actIs(1), { day: true, gte: 20 }, around('switch')] },
  scene: 'ev_under_warez_courier_scene',
}

// ── ev_under_byteme_2am ───────────────────────────────────────────────────────
// byteme pages you in a panic. Repeatable, guarded on his fate; each repeat remembers the last.
const BYTEME_COUNT = 'ev_under.byteme_2am_count'

const byteme2amScene: SceneDef = {
  id: 'ev_under_byteme_2am_scene',
  channel: 'chat',
  title: 'ITS 2AM AND',
  from: 'byteme',
  pause: true,
  start: 'panic',
  expiresDays: 14,
  onExpire: [{ npc: 'byteme', affinity: -3 }, { flag: 'ev_under.brushed_off_byteme' }],
  nodes: {
    panic: {
      speaker: 'byteme',
      text: [
        { if: { var: BYTEME_COUNT, lte: 1 }, text: 'ok dont freak out but i think i freaked out' },
        { if: { all: [{ var: BYTEME_COUNT, gte: 2 }, { flag: 'ev_under.byteme_prev_taught' }] }, text: 'ok before u say anything i DID read the readme this time. it just said "trust me" in eleven languages. so. i think that was the warning. i see that now' },
        { if: { all: [{ var: BYTEME_COUNT, gte: 2 }, { not: { flag: 'ev_under.byteme_prev_taught' } }] }, text: 'so remember last time. this is like last time but. more' },
        'i ran a thing off the board. it said "totally safe undetectable trust me". now my modem light wont stop blinking even when im not doing anything and my dad is asking why the phone bill has calls to like. ohio',
        'am i going to prison. is this prison. {handle} pls i cant call ohio i dont KNOW anyone in ohio',
      ],
      choices: [
        {
          tag: '[OpSec]',
          text: 'Walk him through pulling the plug, binning the thing, and reading before he runs — the calm version.',
          check: {
            skill: 'opsec',
            dc: 12,
            bonuses: [
              { if: { background: 'latchkey' }, add: 2, label: '+2 (you raised yourself on this stuff)' },
              { if: { trait: 'paranoid' }, add: 1, label: '+1 (you already had a checklist)' },
            ],
            success: 'calm',
            fail: 'flustered',
            successEffects: [{ npc: 'byteme', affinity: 6 }, { stat: 'mood', add: 3 }, { flag: 'ev_under.taught_byteme_care' }],
            failEffects: [{ npc: 'byteme', affinity: 2 }, { stat: 'stress', add: 5 }, { stat: 'heat', add: 3 }, { flag: 'ev_under.byteme_scare' }],
          },
        },
        {
          tag: '[Hardware]',
          text: 'Tell him to yank the phone line, note the blinking pattern, and describe exactly which lights. Diagnose it cold.',
          check: {
            skill: 'hardware',
            dc: 13,
            bonuses: [{ if: { background: 'tinkerer' }, add: 2, label: '+2 (you can hear a bad modem)' }],
            success: 'calm',
            fail: 'flustered',
            successEffects: [{ npc: 'byteme', affinity: 5 }, { xp: 'hardware', add: 20 }, { flag: 'ev_under.taught_byteme_care' }],
            failEffects: [{ npc: 'byteme', affinity: 2 }, { stat: 'stress', add: 4 }, { stat: 'heat', add: 3 }, { flag: 'ev_under.byteme_scare' }],
          },
        },
        {
          text: '"Kevin. Turn the computer off. Go to bed. We fix it tomorrow, together."',
          effects: [{ npc: 'byteme', affinity: 4 }, { stat: 'mood', add: 2 }, { stat: 'energy', add: -4 }],
          goto: 'bed',
        },
        {
          text: '"lol you\'re fine, it\'s nothing" and go back to sleep.',
          effects: [{ npc: 'byteme', affinity: -3 }, { flag: 'ev_under.brushed_off_byteme' }],
          goto: 'brushed',
        },
      ],
    },
    calm: {
      speaker: 'byteme',
      text: [
        'ok. ok its off. lights are off. the ohio calls stopped. i deleted the whole folder AND i read the readme first this time (it was gibberish, thats the point right)',
        'u didnt make me feel stupid. thanks. i mean it. real programming tomorrow?? like u promised??',
      ],
    },
    flustered: {
      speaker: 'byteme',
      text: [
        'i think i deleted the wrong thing. also windows. i deleted some of windows. its ok tho i think. i THINK',
        'also um. the thing had a config file. and in the config file was a sig. and the sig was urs. i copied it bc it looked cool. is that bad. that feels bad',
        '...can we not tell the board about this one',
      ],
    },
    bed: {
      speaker: 'byteme',
      text: 'ok. ok yeah. off. thanks for picking up. everyone else woulda laughed. night {handle} <3',
    },
    brushed: {
      speaker: 'byteme',
      text: 'oh. ok. yeah. nvm. sorry for waking u up. ill figure it out.',
    },
  },
}

const byteme2am: EventDef = {
  id: 'ev_under_byteme_2am',
  category: 'underground',
  weight: 2,
  repeatable: true,
  cooldownDays: 120,
  when: { all: [actBetween(1, 2), around('byteme'), { npc: 'byteme', fateNot: ['pro', 'turns'] }] },
  effects: [bump(BYTEME_COUNT), snapshot('ev_under.taught_byteme_care', 'ev_under.byteme_prev_taught')],
  scene: 'ev_under_byteme_2am_scene',
}

// ── ev_under_arcade_showdown ──────────────────────────────────────────────────
// Sodium Row arcade high-score war. Light comedy; arcade_rat shines; the throne remembers you.
const ARCADE_COUNT = 'ev_under.arcade_count'

const arcadeScene: SceneDef = {
  id: 'ev_under_arcade_showdown_scene',
  channel: 'dialog',
  title: 'THE GAUNTLET (Sodium Row Arcade)',
  from: 'Sodium Row Arcade',
  start: 'floor',
  nodes: {
    floor: {
      speaker: 'narrator',
      text: [
        { if: { var: ARCADE_COUNT, lte: 1 }, text: 'The cabinet is called GAUNTLET REDUX and it has eaten a generation of quarters. Somebody has held the top score for three months under the initials "ASS", which the whole Row agrees is a masterpiece of commitment.' },
        { if: { all: [{ var: ARCADE_COUNT, gte: 2 }, { flag: 'ev_under.arcade_prev_champ' }] }, text: 'GAUNTLET REDUX still wears your initials at the top of the board like a crown. Which means, according to the ancient law of the Row, that everyone under sixteen wants to take it off you.' },
        { if: { all: [{ var: ARCADE_COUNT, gte: 2 }, { not: { flag: 'ev_under.arcade_prev_champ' } }] }, text: '"ASS" is still on top of GAUNTLET REDUX. Rumour on the Row says ASS is a forty-year-old dentist who plays at 6 a.m. Nobody has ever seen him. Everyone has a theory.' },
        'A kid in a bucket hat cracks his knuckles. "Twenty says you can\'t take the top spot." The machine hums. Half the arcade drifts over. This is, somehow, the most important thing happening in Port Lumen tonight.',
      ],
      choices: [
        {
          tag: '[Fitness]',
          text: 'Lock in. Twitch reflexes, dry palms, no mercy.',
          req: { stat: 'money', gte: 20 },
          reqText: 'Requires $20 to bet',
          check: {
            skill: 'fitness',
            dc: 12,
            bonuses: [
              { if: { background: 'arcade_rat' }, add: 4, label: '+4 (this was your childhood)' },
              { if: { trait: 'caffeine_fiend' }, add: 1, label: '+1 (caffeine)' },
              { if: { trait: 'glass_cannon' }, add: -1, label: '−1 (wrists of spun sugar)' },
            ],
            success: 'win',
            fail: 'lose',
            successEffects: [{ money: 20 }, { stat: 'mood', add: 8 }, { stat: 'cred', add: 1 }, { flag: 'ev_under.arcade_champ' }],
            failEffects: [{ money: -20 }, { stat: 'mood', add: -3 }, { clearFlag: 'ev_under.arcade_champ' }],
          },
        },
        {
          tag: '[Social]',
          text: 'Psych the kid out first — narrate his doom until his thumbs sweat.',
          req: { stat: 'money', gte: 20 },
          reqText: 'Requires $20 to bet',
          check: {
            skill: 'social',
            dc: 13,
            bonuses: [{ if: { background: 'class_clown' }, add: 2, label: '+2 (heckling is a craft)' }],
            success: 'win',
            fail: 'lose',
            successEffects: [{ money: 20 }, { stat: 'mood', add: 6 }, { stat: 'cred', add: 1 }, { flag: 'ev_under.arcade_champ' }],
            failEffects: [{ money: -20 }, { stat: 'mood', add: -3 }, { clearFlag: 'ev_under.arcade_champ' }],
          },
        },
        { tag: '[Leave]', text: '"I respect the throne too much to challenge it." Buy a soda, watch.', effects: [{ stat: 'mood', add: 2 }, { stat: 'stress', add: -2 }], goto: 'watched' },
      ],
    },
    win: {
      speaker: 'narrator',
      text: 'New high score. You enter your initials with the trembling reverence of a monk. The arcade erupts. Bucket-hat kid pays up and immediately asks to be your apprentice. Somewhere, a dentist feels a disturbance.',
    },
    lose: {
      speaker: 'narrator',
      text: [
        'You die on the third boss to a hazard you\'ve beaten a hundred times, because a crowd is watching and hands are cruel. Bucket-hat kid pockets your twenty and says "gg" in the tone of a boy who has just discovered power.',
        'He enters his initials: "LOL". It stays up there for weeks. You walk past it on the way to the Cathode every single day.',
      ],
      effects: [{ stat: 'stress', add: 2 }],
    },
    watched: {
      speaker: 'narrator',
      text: 'Bucket-hat kid dies on the third boss and blames the joystick. You nod gravely. It is always the joystick. The soda is warm and perfect.',
    },
  },
}

const arcadeShowdown: EventDef = {
  id: 'ev_under_arcade_showdown',
  category: 'weird',
  weight: 1,
  repeatable: true,
  cooldownDays: 150,
  when: { all: [actBetween(1, 2), { day: true, lte: 1100 }, { jailed: false }] },
  effects: [bump(ARCADE_COUNT), snapshot('ev_under.arcade_champ', 'ev_under.arcade_prev_champ')],
  scene: 'ev_under_arcade_showdown_scene',
}

// ── ev_under_board_puzzle ─────────────────────────────────────────────────────
// Corvid's monthly "crossword" on the board. Clever wins cred; a confident wrong answer is forever.
const PUZZLE_COUNT = 'ev_under.puzzle_count'

const puzzleScene: SceneDef = {
  id: 'ev_under_board_puzzle_scene',
  channel: 'forum',
  board: 'general',
  title: '[PINNED] The Crossword — this month\'s riddle',
  from: 'corvid',
  start: 'riddle',
  expiresDays: 21,
  onExpire: [{ log: 'Somebody else solved Corvid\'s crossword this month. The board has already forgotten there was a contest.', kind: 'info' }],
  nodes: {
    riddle: {
      speaker: 'corvid',
      text: [
        'House tradition, for the new faces: once a month I hide a message in a wall of noise. First correct answer posted here wins bragging rights and a week of me being slightly nicer to you.',
        { if: { var: PUZZLE_COUNT, gte: 2 }, text: 'Last month\'s winner is banned from answering in the first hour. You know who you are. So does everyone.' },
        { if: stillLight, text: 'This one has a theme. The theme is "things that are not as dull as they look." Take that as you like.', else: 'This one has a theme. The theme is "who is reading over your shoulder." Take that as you like.' },
        '  7F 3A 11 ... 08 5C 5C 21 ... 40 40 13\n  -- no tools that do the thinking for you. i will know. --',
      ],
      choices: [
        {
          tag: '[Cryptography]',
          text: 'Do it properly: find the pattern, peel the layers, post the answer with a one-line explanation.',
          check: {
            skill: 'cryptography',
            dc: 13,
            bonuses: [
              { if: { background: 'mathlete' }, add: 2, label: '+2 (competition brain)' },
              { if: { trait: 'bookworm' }, add: 1, label: '+1 (you have read about this exact trick)' },
              { if: { trait: 'night_owl' }, add: 1, label: '+1 (3 a.m. is when patterns show themselves)' },
            ],
            success: 'solved',
            fail: 'wrong',
            successEffects: [{ stat: 'cred', add: 2 }, { faction: 'fac.loft', add: 2 }, { xp: 'cryptography', add: 30 }, { npc: 'corvid', affinity: 2 }, { flag: 'ev_under.puzzle_solved' }],
            failEffects: [{ stat: 'cred', add: -2 }, { stat: 'mood', add: -4 }, buff(LAUGHINGSTOCK), { flag: 'ev_under.puzzle_flubbed' }],
          },
        },
        {
          tag: '[Programming]',
          text: 'Write a little script to grind every possibility overnight. Corvid said no tools that think for you. A script is more of a... helper.',
          check: {
            skill: 'programming',
            dc: 14,
            success: 'ground',
            fail: 'phone_line',
            successEffects: [{ stat: 'cred', add: 1 }, { xp: 'programming', add: 25 }],
            failEffects: [
              { stat: 'stress', add: 5 },
              { if: atHome, then: [{ npc: 'dad', affinity: -2 }, { stat: 'mood', add: -3 }], else: [{ money: -25 }] },
            ],
          },
        },
        {
          text: 'Page byteme and solve it together — two heads, one very loud one.',
          if: around('byteme'),
          effects: [{ npc: 'byteme', affinity: 4 }, { stat: 'mood', add: 4 }, { stat: 'cred', add: 1 }, { xp: 'cryptography', add: 12 }],
          goto: 'team',
        },
        { tag: '[Leave]', text: 'Lurk. Watch everyone else get it wrong. Learn something.', effects: [{ xp: 'cryptography', add: 10 }], goto: 'lurked' },
      ],
    },
    solved: {
      speaker: 'corvid',
      text: [
        'Correct, and — rarer — explained in one line. Everyone look at how {handle} did that and then do it that way. Thread locked.',
        { if: around('mira'), text: 'Under it, forty replies of "how" and one from nyx: "not bad. *hugz*" — which somehow reads as both a compliment and a threat.', else: 'Under it, forty replies of "how", and your handle in bold at the top of the pinned thread for a whole month.' },
      ],
    },
    wrong: {
      speaker: 'narrator',
      text: [
        'You post your answer at 1:12 a.m. with total confidence and the word "obviously". It is not the answer. It is not near the answer. It is, in fact, the decoy Corvid planted specifically to catch people who say "obviously".',
        'At 1:22 a.m. a handle called mirror posts the real one, cleanly, with your "obviously" quoted underneath. The board will be using that word at you for a month.',
      ],
    },
    ground: {
      speaker: 'corvid',
      text: 'Correct. Also found by brute force at four in the morning, which I can tell because the answer arrived with a timestamp and no explanation. Points for honesty. Deductions for the phone bill I assume you just ran up.',
    },
    phone_line: {
      speaker: 'narrator',
      text: [
        'Your script runs all night, ties up the line, and finds nothing, because there was a bug on line nine and it spent eight hours checking the same guess.',
        { if: atHome, text: 'At 7 a.m. Dad picks up the phone to call the unemployment office and gets a scream of modem noise in his ear. The conversation at breakfast is short and does not go well.', else: 'The phone company bills you for the privilege. Somebody else posts the answer at noon.' },
      ],
    },
    team: {
      speaker: 'byteme',
      text: 'WE GOT IT. well u got it and i typed it really fast. corvid said "good teamwork" which is the nicest thing she has ever said to me. i am going to frame this thread. can u frame a thread',
    },
    lurked: {
      speaker: 'narrator',
      text: 'You watch nine people guess wrong in nine instructive ways, and then someone gets it, and you understand the trick a second before they explain it. Next month, maybe.',
    },
  },
}

const boardPuzzle: EventDef = {
  id: 'ev_under_board_puzzle',
  category: 'underground',
  weight: 2,
  repeatable: true,
  cooldownDays: 100,
  when: { all: [actBetween(1, 2), boardLive, around('corvid')] },
  effects: [bump(PUZZLE_COUNT)],
  scene: 'ev_under_board_puzzle_scene',
}

export default defineContent({
  events: [flameBait, warezCourier, byteme2am, arcadeShowdown, boardPuzzle],
  scenes: [flameBaitScene, courierScene, byteme2amScene, arcadeScene, puzzleScene],
})
