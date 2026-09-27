/**
 * PKG-01 — main_a1_q4_rivalry (bible §6.A).
 *
 * The handle that dunked on your first post — nyx — solves a board challenge you'd been grinding,
 * publicly and faster, and then turns out to be a real person your own age: Mira Okonkwo, newly
 * transferred from Ridgeport. CP-A1 sets your early track with her (respect / rivalry / a risky
 * probe at her past).
 *
 * autoStart: act 1, day >= 30, q3 completed. This quest does NOT start q5 (q5 dates itself).
 *
 * Fail branch (CP-A1 C): a botched probe spills onto the board two days later (a1_probe_fallout),
 * where you can apologize, own it, or dig in. Flags a1.mira_probe_burned / .probe_apologized /
 * .probe_doubled_down are read by PKG-02 (the Act II party and Mira's wall).
 */
import { defineContent } from '@/engine/registry'
import type { QuestDef, SceneDef } from '@/engine/types'
import { Q3, Q4, inAct1 } from './common'

const miraDunk: SceneDef = {
  id: 'a1_mira_dunk',
  channel: 'dialog',
  title: 'nyx',
  from: 'mira',
  start: 'board',
  nodes: {
    board: {
      speaker: 'narrator',
      text: [
        "For two days you've been chewing on a board challenge Corvid posted — a nasty little lock with no obvious way in. You've tried everything. You've filled a notebook. You've dreamed about it.",
        "This morning, nyx posts the answer. Ten lines. Elegant. Posted, by the timestamp, about eleven minutes after she started, with a single note underneath: \"Stop hitting it. Read it. The flaw's in the third function. The coffee's still warm if you want to see how.\"",
      ],
      next: 'cafe',
    },
    cafe: {
      speaker: 'narrator',
      text: [
        '"The coffee’s still warm." You read it three times before it lands: she’s not being poetic. She’s HERE. She wants you to come find her.',
        "Terminal Velocity, the Millgate cyber-café, two in the afternoon. Second row of terminals, corner seat, a coffee going cold beside a girl about your age who does not look up when you walk in and somehow makes that a whole sentence.",
      ],
      next: 'reveal',
    },
    reveal: {
      speaker: 'mira',
      text: [
        "You brute-forced it, didn't you. All week. I can tell by the way you're standing.",
        "Mira. Okonkwo. Transferred in from Ridgeport this fall, before you ask, and yes, I'm nyx, and no, I'm not sorry about your first post — somebody had to. You're not bad. You're just loud. You go through the wall. I read the blueprint and walk through the door.",
      ],
      next: 'confront',
    },
    confront: {
      speaker: 'mira',
      text: ["So. The new blood the whole board's whispering about. Say something interesting, or I'll go back to my coffee."],
      choices: [
        {
          text: '"GG. Genuinely. Teach me that source-read trick."',
          effects: [{ faction: 'fac.loft', add: 3 }, { npc: 'mira', affinity: 6 }, { flag: 'npc.mira.respect' }, { flag: 'a1.mira_dunk_done' }],
          goto: 'respect',
        },
        {
          text: '"Lucky read. Race you on the next one."',
          tag: '[Compete]',
          effects: [{ flag: 'npc.mira.rivalry' }, { npc: 'mira', affinity: 2 }, { flag: 'a1.mira_dunk_done' }],
          goto: 'rivalry',
        },
        {
          text: '[Mathlete] "The third function? It’s not a flaw, it’s an off-by-one in the counter. I’d have found it. Eventually."',
          if: { background: 'mathlete' },
          effects: [{ npc: 'mira', affinity: 5 }, { flag: 'npc.mira.respect' }, { flag: 'a1.mira_dunk_done' }],
          goto: 'mathlete',
        },
        {
          text: '"You transferred from Ridgeport. I heard about why you left."',
          tag: '[Probe]',
          check: {
            skill: 'social',
            dc: 12,
            bonuses: [{ if: { background: 'class_clown' }, add: 2, label: 'Class Clown charm' }],
            success: 'probe_ok',
            fail: 'probe_bad',
            successEffects: [{ flag: 'npc.mira.secret_hinted' }, { npc: 'mira', affinity: 3 }, { flag: 'a1.mira_dunk_done' }],
            // Fail is its own story: the café tells the board, and Mira keeps the receipt for years
            // (a1.mira_probe_burned is read at the Act II party and on the fire escape).
            failEffects: [
              { faction: 'fac.loft', add: -5 },
              { stat: 'mood', add: -10 },
              { npc: 'mira', affinity: -5 },
              { flag: 'a1.mira_dunk_done' },
              { flag: 'a1.mira_probe_burned' },
              { scene: 'a1_probe_fallout', delayHours: 48 },
            ],
          },
        },
      ],
    },
    respect: {
      speaker: 'mira',
      text: [
        "...Huh. Most people sulk. You asked. That's rarer than talent.",
        "Fine. Sit. I'll show you once and only once, and if you ever brute-force something this simple again I'll post about it. Deal?",
        "(She turns the monitor toward you. The coffee, it turns out, really is still warm.)",
      ],
    },
    rivalry: {
      speaker: 'mira',
      text: [
        "A race. Cute. You do understand I'll win.",
        "...but I'll admit it's more fun with someone chasing. Fine. Next puzzle Corvid posts, we both go, first clean solution takes it. Loser buys the coffee. I take mine black and I take it often.",
        "(There is, from that day, a scoreboard. Neither of you will ever admit it exists.)",
      ],
    },
    mathlete: {
      speaker: 'mira',
      text: [
        "Off-by-one in the counter. Yes. Exactly. Nobody sees that on the first read.",
        "...Okay. You’re not loud. You’re the other kind — the kind that’s quiet and then says something that ruins my afternoon. I like ruined afternoons. Sit down. Let’s ruin a few more.",
      ],
    },
    probe_ok: {
      speaker: 'mira',
      text: [
        "...",
        "You don't know why I left. Nobody does. You heard a rumor and you're fishing. But you fished... carefully, which means you're smarter than you look, and you stopped the second you saw my face change, which means you're kinder than you want people to know.",
        "I'm not going to tell you the story. But I'm not going to walk away either. That's a thing I'll give exactly one person here. Don't waste it.",
      ],
    },
    probe_bad: {
      speaker: 'mira',
      text: [
        "You heard about *why I left.*",
        "No, you didn't. You heard there was a why, and you led with it like a knife, in a café, to a stranger. Let me tell you what you heard: nothing. And now you've told a room full of people who like me that you're the kind who'd use it.",
        "Go home. Read a book about people. You clearly haven't met many.",
      ],
      next: 'probe_walk',
    },
    probe_walk: {
      speaker: 'narrator',
      text: [
        "She turns back to her monitor like you've already been deleted. The café has gone that particular kind of quiet where everybody is suddenly very interested in their own screens, and three of those screens, you notice on the way out, are logged into the Loft board.",
        "You walk home the long way, rehearsing better sentences that arrive about an hour too late. By the time you dial in, the café has beaten you there.",
      ],
    },
  },
}

// ── The fallout: the café tells the board (only after a failed probe) ─────────
const probeFallout: SceneDef = {
  id: 'a1_probe_fallout',
  channel: 'forum',
  board: 'general',
  title: 'so the new blood interrogates people in cafés now?',
  from: 'Lamplighter',
  start: 'op',
  nodes: {
    op: {
      speaker: 'Lamplighter',
      text: [
        'Heads up for anybody who hangs at Terminal Velocity. Our friend the "honest newbie" walked up to nyx yesterday — in person, at her table — and opened with "I heard why you left Ridgeport." To her FACE. In a room full of people.',
        'Some of us moved to this city specifically to stop being asked that question. Not cool.',
        '-- Lamplighter · "the lights are on, nobody\'s home"',
      ],
      next: 'replies',
    },
    replies: {
      speaker: 'Loft BBS',
      text: [
        'byteme: wait what did they hear. not that i want to know. i want to know',
        'jax: ok everybody chill. my friend has the social skills of a busy signal, thats not the same as being a creep. ...but yeah. that was a bad one dude. that was a real bad one',
        'switch: Information is currency. Spending it in a café to look interesting is a lousy trade. That\'s the only lesson here, kids.',
        '[nyx has not replied. The "last read" stamp next to her handle says she has read every word.]',
        'corvid: Locking this in an hour. Say what you need to say and then drop it. We don\'t do pile-ons here. We also don\'t do what started this one.',
      ],
      choices: [
        {
          text: 'Post a real apology — to nyx, in public, with no "but" in it.',
          tag: '[Apologize]',
          effects: [{ flag: 'a1.probe_apologized' }, { faction: 'fac.loft', add: 3 }, { npc: 'mira', affinity: 2 }, { stat: 'mood', add: -3 }],
          goto: 'apology',
        },
        {
          text: '"Day one I posted a wall of nonsense. Day thirty I asked a stranger the worst question in the world. I\'m consistent, at least. nyx — I\'m sorry."',
          tag: '[Own it]',
          if: { flag: 'a1.posted_cringe' },
          effects: [{ flag: 'a1.probe_apologized' }, { faction: 'fac.loft', add: 4 }, { npc: 'mira', affinity: 3 }],
          goto: 'owned_it',
        },
        {
          text: '"I didn\'t mean anything by it. Everybody\'s acting like I stabbed someone."',
          tag: '[Defend]',
          effects: [{ flag: 'a1.probe_doubled_down' }, { faction: 'fac.loft', add: -3 }, { npc: 'mira', affinity: -3 }],
          goto: 'defended',
        },
        {
          text: 'Don\'t touch it. Let the thread die on its own.',
          tag: '[Lurk]',
          effects: [{ stat: 'stress', add: 2 }],
          goto: 'silent',
        },
      ],
    },
    apology: {
      speaker: 'narrator',
      text: [
        'You write it four times and post the shortest version: you were out of line, it was never yours to ask, you\'re sorry. Corvid locks the thread ten minutes later with one word — "Good." — which from Corvid is a standing ovation.',
        'nyx never replies. But the next morning your post has a single quiet +1 on it, from a handle with no avatar and no signature. You decide not to make a thing of it. That, you are beginning to learn, is the whole trick.',
      ],
    },
    owned_it: {
      speaker: 'narrator',
      text: [
        'It gets a laugh — a real one, the kind that lets a whole room breathe out — and then Lamplighter gives it a +1, which is the forum equivalent of a truce signed in blood. Somebody adds your first-day post to the thread as "exhibit A." Jax adds a skull. Corvid locks it, and you swear the lock icon looks amused.',
        'Nobody forgets what you said in the café. But now, when they tell the story, the ending is the apology.',
      ],
    },
    defended: {
      speaker: 'narrator',
      text: [
        'It goes about how you\'d expect. Four people explain, at length and with quotations, exactly what you did. Jax stops defending you and just posts a skull. Corvid locks the thread with "Enough." — and the period on the end of it follows you around for a while, like a shadow with opinions.',
      ],
    },
    silent: {
      speaker: 'narrator',
      text: [
        'You watch the thread grow, and then you watch Corvid lock it. Nobody mentions it again — not to you, anyway. That is not the same thing as nobody mentioning it.',
      ],
    },
  },
}

const quest: QuestDef = {
  id: Q4,
  title: 'Race You',
  kind: 'main',
  act: 1,
  priority: 97,
  giver: 'mira',
  autoStart: { all: [inAct1, { day: true, gte: 30 }, { quest: Q3, status: 'completed' }] },
  rewards: 'A rival with a face — or the start of something else',
  summary:
    "The handle that dunked on you, nyx, just solved your board puzzle in eleven minutes and invited you to come see how. Turns out she's a real person your age, and how you handle that sets the tone for years.",
  start: 'dunk',
  stages: {
    dunk: {
      text: 'nyx solved the puzzle you’d been grinding and left you an address. Go meet her at Terminal Velocity and figure out what she is to you.',
      onEnter: [{ scene: 'a1_mira_dunk' }],
      objectives: [
        {
          id: 'react',
          text: 'Meet nyx face to face',
          when: { flag: 'a1.mira_dunk_done' },
          hint: 'The dialog opens itself. How you answer sets your track with Mira — admiration, rivalry, or a risky guess at her past (a Social check with teeth).',
        },
      ],
      onComplete: [
        { log: 'nyx has a name now: Mira. The board will never feel quite so anonymous again.', kind: 'story' },
        {
          if: { flag: 'a1.mira_probe_burned' },
          then: [{ log: 'You led with a knife at Terminal Velocity. Mira will remember the café long after the board forgets it.', kind: 'bad' }],
        },
      ],
    },
  },
}

export default defineContent({
  scenes: [miraDunk, probeFallout],
  quests: [quest],
})
