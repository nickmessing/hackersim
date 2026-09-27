/**
 * PKG-01 — main_a1_q1_boot_sequence (bible §6.A).
 *
 * The opening tutorial. Day 0, September 2001. A welcome mail from the ISP and a chat from Jax
 * teach the Mail and BuddyPager windows; the first forum thread (a1_boot_forum) teaches the Loft
 * BBS and lands the first *hugz* dunk from an anonymous handle (nyx — Mira, still unnamed); a
 * planner walkthrough teaches the schedule and lets the first day tick over.
 *
 * Chain: q1 (autoStart on act 1) → q2. Sets jax/mira met, starts main_a1_q2_first_money.
 */
import { defineContent } from '@/engine/registry'
import type { QuestDef, SceneDef } from '@/engine/types'
import { Q1, Q2, inAct1 } from './common'

// ── Welcome mail from the ISP ────────────────────────────────────────────────
const ispWelcome: SceneDef = {
  id: 'a1_isp_welcome',
  channel: 'mail',
  title: 'Welcome to NorthLink! Your account is active',
  from: 'NorthLink Member Services',
  start: 'body',
  nodes: {
    body: {
      text: [
        'Dear Valued Subscriber,',
        'Congratulations, and welcome to the NorthLink family! Your 33.6k dial-up account is now ACTIVE. Your new email address is printed on the enclosed card. Please keep it somewhere safe and do not share it with strangers (or your little sister).',
        'A few tips to get the most from your Information Superhighway experience:',
        '• Your DESKTOP is your headquarters. The Mail icon holds this letter and everything after it. BuddyPager is for chatting with friends in real time. The Loft BBS icon opens the message boards.',
        '• The DAILY PLANNER lets you decide how you spend each hour — sleeping, studying, working, or just relaxing. Fill it in, then press PLAY and watch the day go by.',
        '• The CAREER CENTER and e-SHOP are where a young person turns talent into dollars, and dollars into a faster modem. In that order, we hope.',
        'Remember: while you are online, your household telephone line is IN USE. We are legally required to remind you that Mother may need the phone.',
        'Yours in connectivity,\nThe NorthLink Member Services Team',
        '(This mailbox is not monitored. For support, dial 1-800-NORTHLK and enjoy our music.)',
      ],
    },
  },
}

// ── Jax pages you (BuddyPager tutorial) ──────────────────────────────────────
const jaxWelcome: SceneDef = {
  id: 'a1_jax_welcome',
  channel: 'chat',
  title: 'JaxAttack',
  from: 'jax',
  start: 'ping',
  nodes: {
    ping: {
      speaker: 'jax',
      text: [
        'duuuude are you online',
        'DUDE',
        'ok i KNOW youre online because your mom paged MY house looking for you lol get off the phone she says',
        'anyway forget that. someone leaked a crack for Galleon Online. the WHOLE thing. its posted on the board rn',
        'i linked it in general go look go look go look',
      ],
      choices: [
        {
          text: "What's Galleon Online?",
          effects: [{ flag: 'a1.hi_jax' }],
          goto: 'explain',
        },
        {
          text: "Two seconds, I'm literally still connecting.",
          tag: '[Lie]',
          effects: [{ flag: 'a1.hi_jax' }],
          goto: 'liar',
        },
        {
          text: '[Class clown] "your house? did you tell my mom you were me again"',
          if: { background: 'class_clown' },
          effects: [{ flag: 'a1.hi_jax' }, { npc: 'jax', affinity: 2 }],
          goto: 'clown',
        },
      ],
    },
    explain: {
      speaker: 'jax',
      text: [
        'the pirate MMO everybody at school plays?? the one you said looked dumb?? it does look dumb. i play it every night',
        'point is the crack is out and the board is going NUTS. corvid hasnt nuked the thread yet which means its a big deal',
        'go say something. dont be a lurker your whole life',
      ],
      next: 'signoff',
    },
    liar: {
      speaker: 'jax',
      text: [
        'you are SUCH a liar. i can see your handle logged in. i am literally looking at it',
        'whatever. the crack thread. general board. GO',
      ],
      next: 'signoff',
    },
    clown: {
      speaker: 'jax',
      text: [
        'ONE time. and it worked, she gave me pie',
        'ok focus. crack thread. general board. go make an entrance',
      ],
      next: 'signoff',
    },
    signoff: {
      speaker: 'jax',
      text: ['open the Forum window, itll be the thread at the top. brb pretending to do homework *salute*'],
    },
  },
}

// ── The first forum thread — CP-A0, and the *hugz* dunk ───────────────────────
const bootForum: SceneDef = {
  id: 'a1_boot_forum',
  channel: 'forum',
  board: 'general',
  title: 'HOLY COW the Galleon crack is REAL (proof inside)',
  from: 'jax',
  start: 'op',
  nodes: {
    op: {
      speaker: 'jax',
      text: [
        "Okay so I know everybody's been calling this vaporware for a month but IT IS REAL. Somebody dumped the whole thing. No more $9.99 a month to sail a boat badly.",
        "I'm not gonna say who leaked it (it wasn't me) (I wish it was me). Screenshot attached. Flame away.",
        '-- Jax, professional boat captain',
      ],
      next: 'dunk',
    },
    dunk: {
      speaker: 'mira',
      // The dunk lands here — mira becomes "met" but stays the anonymous handle "nyx" in text.
      effects: [{ npc: 'mira', met: true }],
      text: [
        "Congratulations on reposting a leak that's been on three other boards since Tuesday. Your \"proof\" screenshot still has the loading spinner in it, which means you haven't actually run it. You just wanted to be first.",
        "It's cute, though. Welcome to the internet, new blood. Don't strain anything.",
        '~ nyx *hugz*',
      ],
      next: 'yourturn',
    },
    yourturn: {
      speaker: 'narrator',
      text: [
        'The thread has forty replies and climbing. Somewhere in the middle, a handle called nyx has publicly, gently, and thoroughly taken your best friend apart — and left a little *hugz* on the wound like a bow on a bad gift.',
        'The reply box is blinking at you. Your first words on the Loft board. No pressure.',
      ],
      choices: [
        {
          text: 'Lurk. Read the whole thread first, say nothing.',
          tag: '[Lurk]',
          effects: [{ flag: 'a1.boot_forum_done' }, { flag: 'a1.cautious' }],
          goto: 'lurk',
        },
        {
          text: 'Introduce yourself honestly. New here, learning, glad to be aboard.',
          effects: [
            { flag: 'a1.boot_forum_done' },
            { flag: 'a1.known_newbie' },
            { faction: 'fac.loft', add: 5 },
          ],
          goto: 'honest',
        },
        {
          text: 'Post a wall of jargon you half-understand so you look like a veteran.',
          tag: '[Bluff]',
          effects: [
            { flag: 'a1.boot_forum_done' },
            { flag: 'a1.posted_cringe' },
            { faction: 'fac.loft', add: -5 },
          ],
          goto: 'cringe',
        },
        {
          text: '[Tinkerer] Post your beige-box specs and offer to mirror the file off your own line.',
          if: { background: 'tinkerer' },
          effects: [
            { flag: 'a1.boot_forum_done' },
            { flag: 'a1.known_newbie' },
            { faction: 'fac.loft', add: 6 },
          ],
          goto: 'tinkerer',
        },
      ],
    },
    lurk: {
      speaker: 'narrator',
      text: [
        'You read every reply twice. You learn three new words, two of which are insults, and exactly who not to argue with. Nobody notices you, which, you are starting to understand, is the whole art of it.',
        "Corvid nukes the thread an hour later with a single line — \"take it to a board that isn't public, children\" — and the Galleon crack, and your first lesson, vanish together.",
      ],
    },
    honest: {
      speaker: 'narrator',
      text: [
        'You keep it short and true: new to the board, here to learn, no idea what half of this means yet. A couple of regulars type "welcome" without any sarcasm at all, which on the internet is basically a hug.',
        'A user called Corvid — the sysop, the name at the top of every board — gives your post a quiet nod: "New and honest about it. Rare. Stick around." You feel about eleven feet tall.',
      ],
    },
    cringe: {
      speaker: 'narrator',
      text: [
        'You string together every impressive-sounding phrase you have ever half-heard. You are pretty sure it means something.',
        'It does not. nyx replies with a single word — "reboot." Jax replies with a laughing skull. Somebody makes a signature out of your post. You have achieved, on your very first day, a small and permanent kind of fame.',
        "(Owning a spectacular flub has its uses. One day, in the right room, you'll be able to laugh at this and win someone over with it.)",
      ],
    },
    tinkerer: {
      speaker: 'narrator',
      text: [
        "You list your rig like it's a resume — the modem, the drive, the RAM you soldered back to life yourself — and offer to host a mirror so the board's one shared line stops choking.",
        'It works. Two old-timers thank you for thinking about bandwidth instead of glory, and Corvid marks your handle in some invisible ledger of people-who-get-it. A useful first impression on the Row.',
      ],
    },
  },
}

// ── Planner walkthrough (dialog) ─────────────────────────────────────────────
const scheduleTut: SceneDef = {
  id: 'a1_schedule_tut',
  channel: 'dialog',
  title: 'The Daily Planner',
  from: 'jax',
  start: 'intro',
  nodes: {
    intro: {
      speaker: 'jax',
      text: [
        "okay, actual advice, no jokes: nobody gets good at this by accident. you get good by DECIDING to. that's what the Planner's for.",
        "open the Daily Planner. it's a grid, one box per hour. drag Sleep onto the night, drop Study or Hack or whatever you want to get better at onto the rest, then hit play and let the clock run. the little numbers go up. it's the best feeling there is.",
      ],
      choices: [
        {
          text: "What should I be practicing?",
          goto: 'advice',
        },
        {
          text: '[Bookworm] "Already built one. Colour-coded. Eight hours of study."',
          if: { trait: 'bookworm' },
          effects: [{ npc: 'jax', affinity: 2 }],
          goto: 'bookworm',
        },
        {
          text: '[Night Owl] "I do my best work at 3 a.m. anyway."',
          if: { trait: 'night_owl' },
          goto: 'nightowl',
        },
        {
          text: "I've got it. Let me drive.",
          goto: 'go',
        },
      ],
    },
    advice: {
      speaker: 'jax',
      text: [
        "depends who you wanna be! Programming and Networking pay the rent. Intrusion and Crypto are the flashy stuff. Social's the one everybody skips and everybody needs — you can talk your way past a lock a lot faster than you can pick it.",
        "don't burn out either. leave a couple boxes for Relax and Exercise or your brain turns to oatmeal. i learned that the hard way, i was oatmeal for a WEEK",
      ],
      next: 'go',
    },
    bookworm: {
      speaker: 'jax',
      text: ["of COURSE you did. you're gonna be terrifying. remember to eat, colour-code girl/guy/legend"],
      next: 'go',
    },
    nightowl: {
      speaker: 'jax',
      text: ["a vampire. i respect it. just put Sleep SOMEWHERE or you'll be a ghost by friday"],
      next: 'go',
    },
    go: {
      speaker: 'narrator',
      text: [
        "The modem is warm, the Planner is open, and the whole grey city outside is asleep. Set your hours, press play, and let the first day of the rest of it roll by.",
        "This is where it starts. Every single thing that happens after — the money, the trouble, the people — starts with one kid deciding how to spend an afternoon.",
      ],
    },
  },
}

// ── The quest ────────────────────────────────────────────────────────────────
const quest: QuestDef = {
  id: Q1,
  title: 'Boot Sequence',
  kind: 'main',
  act: 1,
  priority: 100,
  giver: 'jax',
  autoStart: inAct1,
  rewards: 'The basics — and a paycheck to chase',
  summary:
    "September 2001. Your beige box hums, the modem sings, and Mom wants the phone. Learn the desktop — mail, messenger, the board, the planner — and find your feet before you go looking for your first dollar.",
  start: 'intro',
  stages: {
    intro: {
      text: 'You just got online. There’s mail from the ISP and a page from Jax blinking on the taskbar. Read what Jax sent you.',
      onEnter: [
        { scene: 'a1_isp_welcome' },
        { scene: 'a1_jax_welcome', delayHours: 1 },
      ],
      objectives: [
        {
          id: 'read_jax',
          text: "Answer Jax's page",
          when: { flag: 'a1.hi_jax' },
          hint: 'Open BuddyPager (the messenger) on the taskbar and reply to Jax. He wants you to look at the board.',
        },
      ],
      next: 'first_forum',
    },
    first_forum: {
      text: 'Jax linked a thread on the Loft BBS. Open the Forum window, read it, and say your first words on the board.',
      onEnter: [{ scene: 'a1_boot_forum' }],
      objectives: [
        {
          id: 'first_post',
          text: 'Say your first words on the board (or decide to lurk)',
          when: { flag: 'a1.boot_forum_done' },
          hint: 'Open the Forum window. The thread is pinned at the top of General. Read the replies, then pick how you answer.',
        },
      ],
      next: 'tutorial_schedule',
    },
    tutorial_schedule: {
      text: 'You’ve met the board. Now meet the clock. Open the Daily Planner, lay out a day, and let it run.',
      onEnter: [{ scene: 'a1_schedule_tut' }],
      objectives: [
        {
          id: 'first_day',
          text: 'Set a schedule and let one day pass',
          when: { day: true, gte: 1 },
          progress: { of: { day: true }, target: 1 },
          hint: 'Open the Daily Planner, drag activities onto the hour grid (Study builds skills), then press play in the tray and let a full day tick by.',
        },
      ],
      onComplete: [
        { npc: 'jax', met: true, affinity: 5 },
        { npc: 'mira', met: true },
        { log: 'You spent your first day online. It felt like nothing and everything.', kind: 'story' },
        { quest: Q2, start: true },
      ],
    },
  },
}

export default defineContent({
  scenes: [ispWelcome, jaxWelcome, bootForum, scheduleTut],
  quests: [quest],
})
