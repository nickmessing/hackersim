/**
 * PKG-05 — the Loft BBS itself: the members-only board (forum board `'warez'`, opened at Loft rep
 * 20) as a living place. Bible §3 F1 ("a friend group with a private forum board"), §0.2 (board
 * `'warez'` + Loft rep gate).
 *
 *  - Ambient threads that appear as the arc moves (the one rule, the couch, the co-op rate card,
 *    the quiet months, the vote, the letters, the relaunch).
 *  - A repeatable rep source: newcomers post dumb, dangerous or sweet questions; answering them
 *    well is exactly the "sharing tools/knowledge" the Loft rewards (Loft +1–2 each).
 *  - The Trusted-rank alibi (bible §3: "a one-time heat scrub per act"), brokered by Deadline.
 *  - The sysop announcement after the Sysop Question.
 *
 * HARD RULE: every technical answer here is flavor — period-true household advice or invented
 * jargon, never a real technique.
 */
import { defineContent } from '@/engine/registry'
import type { Cond, Effect, ForumThreadDef, SceneDef, TriggerDef } from '@/engine/types'
import { LOFT, boardLive, onTheBoard } from './common'

const helped = (rep: number): Effect[] => [{ faction: LOFT, add: rep }, { stat: 'cred', add: 0.5 }, { stat: 'mood', add: 2 }]

// ── Newcomer threads (repeatable) ────────────────────────────────────────────

const newbieScenes: SceneDef[] = [
  {
    id: 'loft_newbie_modem',
    channel: 'forum',
    board: 'warez',
    title: 'HELP modem screams then my mom picks up the phone???',
    from: 'Fr3shM3at',
    start: 'q',
    expiresDays: 3,
    nodes: {
      q: {
        speaker: 'Fr3shM3at',
        text: [
          'ok so every time i get to 97% on a download my mom picks up the kitchen phone and the modem makes a noise like a dying seal and i lose EVERYTHING',
          'is this a hack. is someone hacking me through my mom',
          '-- Fr3shM3at :: new here :: pls be nice',
        ],
        next: 'q2',
      },
      q2: {
        speaker: 'byteme',
        text: 'lol welcome. this happened to me for like two years. my solution was crying',
        choices: [
          {
            tag: '[Hardware DC 12]',
            text: 'Actually help: explain phone-line etiquette, the "in use" light trick, and why a second line is the best money a household ever spends.',
            check: {
              skill: 'hardware',
              dc: 12,
              success: 'good',
              fail: 'bad',
              successEffects: helped(2),
              failEffects: [{ stat: 'mood', add: -2 }, { stat: 'cred', add: -0.5 }, { stat: 'stress', add: 2 }, { faction: LOFT, add: -1 }],
            },
          },
          {
            tag: '[Social DC 11]',
            text: 'Diplomatic route: draft him a note to leave taped on the kitchen phone. Tone is everything with moms.',
            check: {
              skill: 'social',
              dc: 11,
              bonuses: [{ if: { trait: 'silver_tongue' }, add: 1, label: '+1 (silver tongue)' }],
              success: 'note',
              fail: 'note_bad',
              successEffects: helped(2),
              failEffects: [
                { stat: 'mood', add: -1 },
                { stat: 'stress', add: 2 },
                { faction: LOFT, add: -1 },
                // A mother asking to meet "the study group" is how a lot of scenes get a knock on the door.
                { chance: 0.3, then: [{ complication: 'social' }] },
              ],
            },
          },
          {
            text: 'Post: "lurk moar."',
            effects: [{ faction: LOFT, add: -1 }],
            goto: 'flame',
          },
          { tag: '[Leave]', text: 'Scroll past. Somebody else will get it.' },
        ],
      },
      good: {
        speaker: 'Fr3shM3at',
        text: 'UPDATE: told my mom about the second line and she said "we are not made of money" and then my dad said "actually it\'s tax deductible if it\'s for the business" and he doesn\'t HAVE a business. anyway we\'re getting a second line. you\'re a legend',
      },
      bad: {
        speaker: 'Fr3shM3at',
        text: 'UPDATE: did what you said and now the phone in the kitchen doesn\'t ring at all and my mom missed a call from my aunt and i\'m grounded. but like. thanks for trying. the download finished tho',
      },
      note: {
        speaker: 'Fr3shM3at',
        text: 'UPDATE: taped the note up. mom added "AND DO YOUR HOMEWORK" at the bottom in red pen but she hasn\'t picked up in 3 days. 100% download. i love this board',
      },
      note_bad: {
        speaker: 'Fr3shM3at',
        text: 'UPDATE: my mom read the note and said "who is this LOFT and why are they writing me letters". i said it was a study group. she is now asking to meet the study group. please advise',
      },
      flame: {
        speaker: 'corvid',
        text: 'Everyone was new once. Some of us were new with considerably worse questions. Fr3shM3at, check your private messages — someone will help. Someone always does, in here.',
      },
    },
  },
  {
    id: 'loft_newbie_doxxed_himself',
    channel: 'forum',
    board: 'warez',
    title: 'hi im new!! (intro)',
    from: 'CaptainCarrierWave',
    start: 'q',
    expiresDays: 2,
    nodes: {
      q: {
        speaker: 'CaptainCarrierWave',
        text: [
          'hi everyone!! so excited to be here. my name is Tyler and i go to Millgate Junior High (8th grade) and i live on Cannery Row in the blue house next to the laundromat, my phone number is on my geocities page if anyone wants to trade games!!',
          'my handle is CaptainCarrierWave because i like carrier waves and also captains',
        ],
        next: 'q2',
      },
      q2: {
        speaker: 'deadline',
        text: 'Oh no.',
        choices: [
          {
            tag: '[OpSec DC 13]',
            text: 'Get the post scrubbed fast, then walk him through what an intro should look like: a handle, a hobby, and nothing a stranger could drive to.',
            check: {
              skill: 'opsec',
              dc: 13,
              bonuses: [{ if: { background: 'latchkey' }, add: 1, label: '+1 (you learned this at ten)' }],
              success: 'good',
              fail: 'bad',
              successEffects: helped(2),
              failEffects: [
                { faction: LOFT, add: -2 },
                { stat: 'stress', add: 3 },
                { stat: 'cred', add: -1 },
                { flag: 'fac.loft.quoted_the_dox' },
                { chance: 0.3, then: [{ complication: 'social' }] },
              ],
            },
          },
          {
            tag: '[Social DC 12]',
            text: 'Private message, gentle. Don\'t scare him off the board; scare him off the geocities page.',
            check: {
              skill: 'social',
              dc: 12,
              bonuses: [{ if: { trait: 'empath' }, add: 2, label: '+2 (you remember being that kid)' }],
              success: 'gentle',
              fail: 'gentle_bad',
              successEffects: helped(1),
              failEffects: [{ stat: 'mood', add: -2 }, { stat: 'stress', add: 2 }, { faction: LOFT, add: -1 }],
            },
          },
          { tag: '[Leave]', text: 'Leave it to Deadline. This is literally his whole personality.' },
        ],
      },
      good: {
        speaker: 'CaptainCarrierWave',
        text: [
          'ok. OK. i took down the page. and i changed my intro. is this better:',
          '"hi im CaptainCarrierWave. i like games. i live on Earth."',
          '-- CaptainCarrierWave :: (location: Earth)',
        ],
        next: 'good2',
      },
      good2: {
        speaker: 'deadline',
        text: 'That is the best intro this board has ever had. Kid, frame it.',
      },
      bad: {
        speaker: 'narrator',
        text: [
          'You reply fast — too fast — quoting his whole post so you can explain line by line what not to do. Which means the blue house next to the laundromat is now on the board twice.',
          'Deadline fixes it in four minutes, and pins a thread titled "DO NOT QUOTE THE DOX TO EXPLAIN THE DOX". Your handle isn\'t in the title. Everyone knows.',
          'Four minutes is a long time on a board with lurkers. Somebody on the Row has the blue house next to the laundromat in a text file now, and the people who quote your mistakes back to you will be doing it for years.',
        ],
      },
      gentle: {
        speaker: 'CaptainCarrierWave',
        text: 'thanks for the message. i didnt know people could just. find you. i took the page down. my mom asked why i was being so quiet at dinner and i said i was "practicing opsec" and she said "is that a sport"',
      },
      gentle_bad: {
        speaker: 'CaptainCarrierWave',
        text: 'wow ok i thought this board was friendly. deleting my account. (update: i did not delete my account, deadline explained it better, sorry for the drama)',
      },
    },
  },
  {
    id: 'loft_newbie_undetectable',
    channel: 'forum',
    board: 'warez',
    title: 'where do i get an UNDETECTABLE tool',
    from: 'NightRider_2K',
    start: 'q',
    expiresDays: 3,
    nodes: {
      q: {
        speaker: 'NightRider_2K',
        text: [
          'saw a guy on another board selling a tool that is "100% undetectable" for $60. is it legit. i want to be a hacker like in the movies with the green text',
          '-- NightRider_2K :: future elite :: dont trace me',
        ],
        next: 'q2',
      },
      q2: {
        speaker: 'byteme',
        text: 'oh man. i bought that tool. it was a screensaver of green text. i still use it tbh it\'s very relaxing',
        choices: [
          {
            tag: '[Programming DC 14]',
            text: 'Explain, patiently, that "undetectable" is a sales word, not a property — and hand him the reading list that actually made you good.',
            check: {
              skill: 'programming',
              dc: 14,
              success: 'good',
              fail: 'bad',
              successEffects: helped(2),
              failEffects: [{ stat: 'mood', add: -2 }, { stat: 'cred', add: -0.5 }, { stat: 'stress', add: 2 }, { faction: LOFT, add: -1 }],
            },
          },
          {
            tag: '[Share]',
            text: 'Share your own homemade utility with the board, free, with a note: "this is detectable, that\'s why it\'s honest."',
            req: { skill: 'programming', gte: 25 },
            reqText: 'Requires Programming 25',
            effects: [{ faction: LOFT, add: 3 }, { stat: 'cred', add: 1 }, { stat: 'heat', add: 1 }],
            goto: 'shared',
          },
          {
            tag: '[Sell]',
            text: 'DM him: you have a "better" undetectable tool. $80. (It\'s the same screensaver.)',
            effects: [{ money: 80 }, { faction: LOFT, add: -2 }, { npc: 'byteme', affinity: -2 }],
            goto: 'sold',
          },
          { tag: '[Leave]', text: 'Let byteme handle this one. He\'s been there.' },
        ],
      },
      good: {
        speaker: 'NightRider_2K',
        text: 'ok i read the first book on your list. it\'s 400 pages and there is no green text in it anywhere. i hate it. i\'m on chapter 3. this is the best thing that\'s ever happened to me',
      },
      bad: {
        speaker: 'NightRider_2K',
        text: 'i didn\'t understand any of that but you seem really smart so i bought the $60 tool anyway to learn from it. it\'s a screensaver. byteme was right. it IS relaxing',
      },
      shared: {
        speaker: 'corvid',
        text: 'This is what the board is for. Somebody pin it. And NightRider — the one that\'s honest about being detectable is the one worth learning from.',
      },
      sold: {
        speaker: 'byteme',
        text: 'dude. DUDE. i saw the screensaver in his screenshot. that\'s MY screensaver. you sold him my screensaver. that\'s so cold. that\'s so aperture of you',
      },
    },
  },
  {
    id: 'loft_newbie_password',
    channel: 'forum',
    board: 'warez',
    title: 'rate my password (serious)',
    from: 'Lady_Baud',
    start: 'q',
    expiresDays: 3,
    nodes: {
      q: {
        speaker: 'Lady_Baud',
        text: [
          'my brother says my password is bad. it is my cat\'s name, then the number 1, then an exclamation point for security. i think that is very strong. please back me up here',
          'i will not be posting the cat\'s name for security reasons (it\'s Muffin)',
        ],
        next: 'q2',
      },
      q2: {
        speaker: 'mira',
        text: 'I have so many feelings about this post and I\'m going to let someone nicer answer it.',
        choices: [
          {
            tag: '[Cryptography DC 12]',
            text: 'Explain, kindly, why "a long silly sentence only you would think of" beats "Muffin1!" — with a worked example that has nothing to do with Muffin.',
            check: {
              skill: 'cryptography',
              dc: 12,
              success: 'good',
              fail: 'bad',
              successEffects: helped(1),
              failEffects: [{ stat: 'mood', add: -1 }, { stat: 'cred', add: -0.5 }, { stat: 'stress', add: 1 }, { faction: LOFT, add: -1 }],
            },
          },
          {
            text: 'Post: "Muffin deserves better than this."',
            effects: [{ stat: 'mood', add: 3 }],
            goto: 'muffin',
          },
          { tag: '[Leave]', text: 'Let nyx find her nice voice. It\'s in there somewhere.' },
        ],
      },
      good: {
        speaker: 'Lady_Baud',
        text: 'ok i changed it to a sentence about my cat\'s opinions on the mailman. it is very long and i will never forget it because it is TRUE. my brother is furious that i listened to strangers over him',
      },
      bad: {
        speaker: 'Lady_Baud',
        text: 'i tried to follow your example and now my password is your example. word for word. is that bad. i feel like that might be bad',
      },
      muffin: {
        speaker: 'Lady_Baud',
        text: 'muffin agrees. she has been informed. she has knocked a glass off the desk in protest. i will choose a better password in her honor',
      },
    },
  },
]

// ── The sysop announcement (after fac_loft_q5) ───────────────────────────────

const announcement: SceneDef = {
  id: 'loft_q5_announcement',
  channel: 'forum',
  board: 'warez',
  title: 'Changing of the keys',
  from: 'SYSOP',
  start: 'a1',
  nodes: {
    a1: {
      speaker: 'SYSOP',
      text: [
        { if: { flag: 'fac.loft.sysop', eq: 'player' }, text: 'Effective tonight the board has a new sysop: {handle}. Same rule. Same couch. Complaints may be submitted in writing and will be used as kindling.' },
        { if: { flag: 'fac.loft.sysop', eq: 'mira' }, text: 'Effective tonight the board has a new sysop: nyx. She has already read your posting history. All of it. She would like a word with some of you.' },
        { if: { flag: 'fac.loft.sysop', eq: 'deadline' }, text: 'Effective tonight the board has a new sysop: deadline. First policy: everybody backs up their LIFE by Friday. Second policy: see first policy.' },
        { if: { flag: 'fac.loft.sysop', eq: 'switch' }, text: 'Effective tonight the board has a new sysop: switch. The rate card is pinned. The couch is, he has been told, structural.' },
        { if: { npc: 'corvid', fate: 'martyred' }, text: 'The outgoing sysop will be unavailable for eight years. She asks that you write, and that you keep the lights on.' },
        { if: { npc: 'corvid', fate: ['free', 'succeeded'] }, text: 'The outgoing sysop is retiring to a garden, where she will check this board every morning and pretend she doesn\'t.' },
        '-- SYSOP',
      ],
      next: 'a2',
    },
    a2: {
      speaker: 'byteme',
      text: [
        { if: { flag: 'fac.loft.sysop', eq: 'player' }, text: 'LETS GOOOO. {handle} can i be your deputy. i will not abuse the power. i will abuse it a normal amount' },
        { if: { not: { flag: 'fac.loft.sysop', eq: 'player' } }, text: 'new sysop!! does this mean we can finally change the board colors. corvid said "grey is a feeling" for twelve years' },
      ],
      next: 'a3',
    },
    a3: {
      speaker: 'deadline',
      text: 'Whoever holds the keys: the job is ninety percent saying no. The other ten percent is also saying no, but kindly.',
      choices: [
        {
          text: 'Post: "Same rule as always. We don\'t rat. Everything else is negotiable."',
          effects: [{ faction: LOFT, add: 1 }],
          goto: 'r_rule',
        },
        {
          text: 'Post: "byteme, you can pick the board colors. One week. Then we\'re reviewing it as a group."',
          effects: [{ npc: 'byteme', affinity: 4 }],
          goto: 'r_colors',
        },
        { tag: '[Leave]', text: 'Read it twice and close the window.' },
      ],
    },
    r_rule: {
      speaker: 'narrator',
      text: 'Forty-one replies by morning, every one of them the same two words. You didn\'t ask them to do that. Nobody asks. That\'s how you know it\'s a scene.',
    },
    r_colors: {
      speaker: 'byteme',
      text: 'the board is now lime green on magenta. it is BEAUTIFUL. people are reporting headaches. this is the price of beauty',
    },
  },
}

// ── The Trusted-rank alibi (one heat scrub per act) ──────────────────────────

const alibi: SceneDef = {
  id: 'loft_alibi',
  channel: 'chat',
  title: 'Deadline',
  from: 'deadline',
  start: 'open',
  expiresDays: 4,
  onExpire: [{ log: 'Deadline\'s offer of an alibi went unanswered. He won\'t be offended; he\'ll just be right, later.', kind: 'story' }],
  nodes: {
    open: {
      text: [
        'YOU ARE RUNNING HOT. I CAN SEE IT FROM HERE AND I DON\'T EVEN OWN A THERMOMETER',
        'the board voted. you get the thing. one per year, and you\'ve earned yours: six people who\'ll swear you were at the cathode all week, a borrowed machine that\'s been in a closet since march, and a receipt for pie',
        'take it. don\'t be proud. proud is how i did fourteen months',
        { if: { flag: 'fac.loft.quoted_the_dox' }, text: 'and do NOT quote this chat to explain this chat. i pinned a thread about you once. i can pin another' },
        { if: { flag: 'fac.loft.testified' }, text: 'this one\'s harder than last time. you\'re on a transcript now. six people and a pie receipt still beats one court reporter, but not by as much as it used to' },
      ],
      choices: [
        {
          text: 'taking it. thank you, theo',
          effects: [
            { stat: 'heat', add: -25 },
            { npc: 'deadline', affinity: 3 },
            { flag: 'fac.loft.alibi_used' },
            { log: 'The Loft covered for you. Six people remember you at the Cathode all week. Heat −25.', kind: 'heat' },
          ],
          goto: 'taken',
        },
        {
          text: 'save it for someone who needs it more',
          effects: [{ faction: LOFT, add: 2 }, { npc: 'deadline', affinity: 1 }],
          goto: 'declined',
        },
      ],
    },
    taken: {
      text: 'good. the pie was cherry, if anyone asks. you had two slices. you complained about the crust. be consistent',
    },
    declined: {
      text: 'noble. stupid, but noble. i\'ll give it to byteme. god knows he\'ll need it by thursday',
    },
  },
}

const alibiWhen = (act: number): Cond => ({
  all: [
    { var: 'act', eq: act },
    { faction: LOFT, gte: 50 },
    { stat: 'heat', gte: 45 },
    boardLive,
    { npc: 'deadline', met: true, fateNot: ['passed', 'dead', 'relapse'] },
  ],
})

const alibiTriggers: TriggerDef[] = [2, 3, 4].map(act => ({
  id: `trig_loft_alibi_a${String(act)}`,
  when: alibiWhen(act),
  atHour: 20,
  effects: [{ scene: 'loft_alibi' }],
}))

// ── Ambient threads on the members board ─────────────────────────────────────

const forum: ForumThreadDef[] = [
  {
    id: 'forum_loft_the_rule',
    board: 'warez',
    title: 'READ THIS FIRST: the rules (there is one rule)',
    pinned: true,
    appears: { faction: LOFT, gte: 20 },
    posts: [
      {
        author: 'corvid',
        text: [
          'Welcome to the back room. There is one rule: we don\'t rat. Not on members, not on ex-members, not on the kid who posted his phone number in the ASCII art thread (you know who you are).',
          'Everything else — the tools, the leads, the arguments — is negotiable, and will be negotiated, at length, at 3 a.m.',
          'Share what you know. Leak, don\'t sell. If you\'re in trouble, say so. Someone always shows up.',
          '-- Corvid :: sysop :: keep the commons',
        ],
      },
      { author: 'byteme', text: 'i would like the record to show i have not posted my phone number in the ascii art thread since MARCH' },
      { author: 'deadline', text: 'The record shows you posted your pager number in March. Not better, Kevin.' },
    ],
  },
  {
    id: 'forum_loft_couch',
    board: 'warez',
    title: 'The couch is structural (an oral history)',
    appears: { all: [{ faction: LOFT, gte: 20 }, { quest: 'fac_loft_q1_prove', status: 'completed' }] },
    posts: [
      {
        author: 'switch',
        text: 'Settling this once and for all: the back-room couch was already there when Corvid rented the space in \'89. It came with the building. It may BE the building.',
      },
      { author: 'deadline', text: 'Two people have proposed on that couch. One of them is still married. I was the best man at the other one, briefly.' },
      { author: 'mira', text: 'I found a floppy inside the left cushion. Label says "DO NOT." Just "DO NOT." I did not.' },
      {
        author: 'byteme',
        text: [
          'i made ascii art of the couch',
          '   ____________________\n  /|                  |\\\n |_|__________________|_|\n  ||  structural  ||\n  ""              ""',
        ],
      },
    ],
  },
  {
    id: 'forum_loft_rate_card',
    board: 'warez',
    title: 'Co-op rate card v1 (pinned, no real names, ever)',
    appears: { all: [onTheBoard, { flag: 'fac.loft.coop' }] },
    posts: [
      {
        author: 'switch',
        text: [
          'The co-op is live. Every job goes out under the shared handle, pay splits by hours, the client never learns who did what. Corvid has read this post four times looking for a loophole. She found one typo.',
          'RATE CARD: small fix $80 · weekend rescue $300 · "please don\'t tell my boss" surcharge +50%',
        ],
      },
      { author: 'corvid', text: 'It sells the work and not the list. I can live under a co-op. Fix the typo.' },
      { author: 'mira', text: 'Signed up. First job was a dentist\'s billing system. The irony is not lost on anyone.' },
    ],
  },
  {
    id: 'forum_loft_new_locks',
    board: 'warez',
    title: 'NEW DOOR CODE (and who we have to thank for it)',
    appears: { all: [onTheBoard, { flag: 'fac.loft.new_locks' }] },
    posts: [
      { author: 'deadline', text: 'The back-room door has new locks and the fax number has changed. New code is on the paper taped under the register in the pager shop. Memorize it. Eat the paper. I\'m serious about the paper.' },
      { author: 'byteme', text: 'why are we changing the locks. did something happen. can the new code be my birthday' },
      { author: 'switch', text: 'Somebody gave a sock puppet our street address. Relax, the sock puppet was Corvid. The locks are real though, and so is the locksmith\'s invoice, and so is the person paying it.' },
      { author: 'deadline', text: 'No, Kevin.' },
    ],
  },
  {
    id: 'forum_loft_miracle_arrow',
    board: 'warez',
    title: 'the arrow (a tribute) (ascii)',
    appears: { all: [onTheBoard, { flag: 'fac.loft.coop_botched' }] },
    posts: [
      {
        author: 'byteme',
        text: [
          'someone asked me to recreate the whiteboard from tuesday. for the archive. i have done my best',
          '[ WE TAKE THE JOB ] ------------------------------>  [ NOBODY\'S NAME ON IT ]\n                  "and then a miracle happens"',
        ],
      },
      { author: 'switch', text: 'I\'ve started drawing it on all my invoices. Clients love it. One of them paid early out of fear.' },
      { author: 'mira', text: 'For the record: it\'s a good idea. It was a bad Tuesday. Draw it again when you\'ve slept.' },
      { author: 'corvid', text: 'Thread stays up. Everybody should see what a good idea looks like right before it gets someone subpoenaed.' },
    ],
  },
  {
    id: 'forum_loft_outage',
    board: 'warez',
    title: 'THE BOARD WAS DOWN FOR 3 DAYS: a timeline',
    appears: { all: [onTheBoard, { flag: 'fac.loft.patch_outage' }] },
    posts: [
      { author: 'byteme', text: 'day 1: board down. assumed raid. wiped my drive. day 1, later: still scared. wiped my mom\'s drive. day 2: mom asks where her tax return is. day 3: board back. it was a PATCH. a PATCH' },
      { author: 'deadline', text: 'Kevin wiped his mother\'s tax return because of a login bug. We are passing the hat for an accountant. Whoever pushed that patch: the hat is looking at you.' },
      { author: 'switch', text: 'Just saying, if I wanted to cancel a vote, I wouldn\'t do it by taking the board down for three days. I\'d do it faster.' },
    ],
  },
  {
    id: 'forum_loft_the_booth',
    board: 'warez',
    title: 'the booth by the jukebox (read it, then we never talk about it)',
    appears: { all: [onTheBoard, { flag: 'fac.bureau.outed' }] },
    posts: [
      {
        author: 'deadline',
        text: 'A federal agent\'s boss let it be known, this week, that one of ours has been sitting in the booth by the jukebox at the Cathode. I\'m not posting the handle. You already know it. I did fourteen months because a man took five hundred dollars. I know what a rat looks like. I\'m still deciding what this is.',
      },
      { author: 'byteme', text: 'i don\'t want to talk about it. i just want it on the record that they bought me a donut once when i had no money and i ate it and it was a good donut' },
      {
        author: 'switch',
        text: [
          {
            if: { flag: 'fac.loft.switch_sold' },
            text: 'I sold a rate card to Aperture and some of you still let me on the couch. I\'m not the guy who gets to throw the first stone. I\'m holding it though. I\'m just holding it.',
            else: 'I once stood up in the back room and said we should get paid. People still bring it up. So I\'m not the guy who gets to throw the first stone. I\'m holding it though. I\'m just holding it.',
          },
        ],
      },
      {
        author: 'corvid',
        text: [
          {
            if: { npc: 'corvid', fate: 'martyred' },
            text: '[posted by proxy, from a letter] The one rule is we don\'t rat. The second rule, which I never wrote down, is that we don\'t hang people either. Figure out which one this is before you pick up the rope. — C.',
            else: 'The one rule is we don\'t rat. The second rule, which I never wrote down, is that we don\'t hang people either. Figure out which one this is before you pick up the rope. Thread locked.',
          },
        ],
      },
    ],
  },
  {
    id: 'forum_loft_braces',
    board: 'warez',
    title: 'photo: new braces (off-topic, sorry)',
    appears: { all: [onTheBoard, { flag: 'fac.loft.gus_blessed' }, { quest: 'fac_loft_q3_enclosure', status: 'completed' }] },
    posts: [
      {
        author: 'GreyHat_Gus',
        text: 'I don\'t post here anymore, I know. Just wanted whoever talked me out the door kindly to see this. Kid picked green brackets. Says they look like "circuit boards." I didn\'t cry at the orthodontist, you cried at the orthodontist.',
      },
      { author: 'byteme', text: 'GREEN BRACKETS. this child is one of us. gus we are keeping her' },
    ],
  },
  {
    id: 'forum_loft_quiet',
    board: 'warez',
    title: 'where did everyone go?',
    appears: { all: [onTheBoard, { flag: 'w.scene_state', eq: 'bleeding' }] },
    posts: [
      { author: 'byteme', text: 'the who\'s online list said 4 tonight. FOUR. one of them was me twice because i forgot to log out on the library computer' },
      { author: 'deadline', text: 'This is what it looks like. Not a raid. Not a bust. Just a quieter board every month, until one month it\'s a storage closet.' },
      { author: 'switch', text: 'People went where the money is. I said this would happen. I hate that I said it.' },
    ],
  },
  {
    id: 'forum_loft_for_sale',
    board: 'warez',
    title: 'rate card v2 — aperture\'s buying',
    appears: { all: [onTheBoard, { flag: 'fac.loft.switch_sold' }] },
    posts: [
      {
        author: 'switch',
        text: 'Aperture\'s paying for "community insight consulting." Translation: what we already do, for a company that already knows our names. DM me. The money is real.',
      },
      { author: 'mira', text: 'Ray. You\'re selling the list. You know you\'re selling the list.' },
      { author: 'switch', text: 'I\'m selling the work. The list is... adjacent.' },
      { author: 'deadline', text: 'Screenshotting this for the trial. Kidding. I hope I\'m kidding.' },
    ],
  },
  {
    id: 'forum_loft_the_vote',
    board: 'warez',
    title: 'so we just HAND it to them now?? (sysop vote, archived)',
    appears: { all: [onTheBoard, { flag: 'fac.loft.sysop_contested' }] },
    posts: [
      { author: 'switch', text: 'Final count: tied, recount tied, Corvid broke it. For the record, I think the process was a coronation with extra steps.' },
      { author: 'byteme', text: 'for the record i think ray is just sad he lost. hi ray. we love you ray' },
      { author: 'corvid', text: 'A monarchy with a couch would have been faster. This was slower on purpose. Thread locked.' },
    ],
  },
  {
    id: 'forum_loft_letters',
    board: 'warez',
    title: 'Letters to C. (add your name)',
    appears: { all: [onTheBoard, { npc: 'corvid', fate: 'martyred' }] },
    posts: [
      { author: 'deadline', text: 'Sunday is letter day. Paper. Your handle is fine; they read it anyway. Tell her what the board argued about this week. She misses the arguing most.' },
      { author: 'byteme', text: 'my letter is 9 pages and 6 of them are ascii art. the guard wrote back asking how i did the shading' },
      { author: 'mira', text: 'She wrote back to me. One line: "Tell {handle} the lights look good from here." I don\'t know how she knows. She always knows.' },
    ],
  },
  {
    id: 'forum_loft_back',
    board: 'warez',
    title: 'we\'re back (invite only, bring your own vouch)',
    pinned: true,
    appears: { all: [{ faction: LOFT, gte: 20 }, { flag: 'w.scene_state', eq: 'reformed' }] },
    posts: [
      {
        author: 'SYSOP',
        text: [
          'The commons is open again. Smaller. Careful. Clean. No member list exists anywhere — not on this machine, not in a drawer, not in anyone\'s head who\'s willing to say so.',
          'Same rule. Same couch.',
          '-- SYSOP :: keep the commons',
        ],
      },
      { author: 'byteme', text: 'i am crying at a library computer. a librarian asked if i was ok. i said "the commons is back" and she said "that\'s nice dear" and gave me a tissue' },
      {
        author: 'corvid',
        text: [
          {
            if: { npc: 'corvid', fate: 'martyred' },
            text: '[posted by proxy, from a letter] Good. Don\'t sell the building. — C.',
            else: 'I said I wouldn\'t post. I\'m not posting. This is a garden update: the tomatoes are doing well. Keep the commons.',
          },
        ],
      },
    ],
  },
]

// ── The repeatable trigger for newcomer threads ──────────────────────────────

const newbieTrigger: TriggerDef = {
  id: 'trig_loft_newbie_thread',
  when: onTheBoard,
  once: false,
  cooldownDays: 14,
  atHour: 21,
  chance: 0.35,
  effects: [
    {
      random: [
        { weight: 1, effects: [{ scene: 'loft_newbie_modem' }] },
        { weight: 1, effects: [{ scene: 'loft_newbie_doxxed_himself' }] },
        { weight: 1, effects: [{ scene: 'loft_newbie_undetectable' }] },
        { weight: 1, effects: [{ scene: 'loft_newbie_password' }] },
      ],
    },
  ],
}

export default defineContent({
  scenes: [...newbieScenes, announcement, alibi],
  forum,
  triggers: [newbieTrigger, ...alibiTriggers],
})
