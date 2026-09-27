/**
 * PKG-18 — the reactivity layer (bible §13): the world noticing what you did.
 *
 * Three kinds of reaction, all read-only (they branch on flags/fates/rep and emit mail, chat or
 * forum — never rewrite state that another package owns):
 *   1. Boss reactions to your career — milestone congratulations, and "cool it" warnings when your
 *      underground heat starts showing up at your day job (PKG-09 owns Halcyon's own moonlight mail;
 *      these cover the employers PKG-18 adds).
 *   2. "They'll remember that" — an NPC pinging you about a distant, major choice.
 *   3. Reputation payoffs — a leader's note the first time you cross into Trusted (rep 50).
 *
 * Senders are guarded so a dead / gone / jailed NPC never messages you.
 */
import { defineContent } from '@/engine/registry'
import type { Cond, SceneDef, TriggerDef } from '@/engine/types'

// ── Sender availability guards ───────────────────────────────────────────────
const jaxOk: Cond = { npc: 'jax', met: true, fateNot: ['dead', 'arrested', 'gone', 'missing', 'flipped'] }
const bytemeOk: Cond = { npc: 'byteme', met: true, fateNot: ['dead', 'arrested_young', 'gone', 'missing', 'turns'] }
const deadlineOk: Cond = { npc: 'deadline', met: true, fateNot: ['passed', 'dead', 'gone', 'missing'] }
const corvidOk: Cond = { npc: 'corvid', met: true, fateNot: ['martyred', 'exile', 'dead', 'gone', 'missing', 'bought'] }
const krollOk: Cond = { npc: 'kroll', met: true, fateNot: ['arrested', 'dead', 'gone'] }

const scenes: SceneDef[] = [
  // ── 1. Boss milestone congratulations ──────────────────────────────────
  {
    id: 'react_dee_milestone',
    channel: 'mail',
    title: 'you are wasted on that bench',
    from: 'dee',
    start: 'm',
    nodes: {
      m: {
        speaker: 'dee',
        text: [
          'Kid,\n\nYou\'ve fixed more machines this year than the other three techs combined, and you did it without once telling a customer their monitor was unplugged. That\'s not a skill. That\'s a CALLING.',
          'So here\'s me, being a good manager for once: you\'re too good for my bench. When something bigger comes up — Halcyon, the bank, whatever — you TAKE it, and you don\'t feel bad, and you send me a postcard. Also I\'m running for council. Long story. Vote early.\n\n— Dee',
        ],
        choices: [{ text: 'Save it. (You do feel a little bad.)' }],
      },
    },
  },
  {
    id: 'react_wes_milestone',
    channel: 'mail',
    title: 're: the chair',
    from: 'northlink_wes',
    start: 'm',
    nodes: {
      m: {
        speaker: 'northlink_wes',
        text: [
          'You settled into engineering faster than anybody I\'ve put in that chair. The panel that grilled you now sends YOU the hard tickets. That\'s the whole career, man — one day you\'re the guy they call.',
          'Keep your head down when the compliance memos come. They\'re getting worse. We just run the pipe. Right?\n\n— Wes',
        ],
        choices: [{ text: '"Right, Wes." (You\'re not sure anymore.)' }],
      },
    },
  },
  {
    id: 'react_kroll_milestone',
    channel: 'chat',
    title: 'Kroll',
    from: 'kroll',
    start: 'm',
    nodes: {
      m: {
        speaker: 'kroll',
        text: [
          'the analysts upstairs are frightened of you. i find that delightful.',
          'you were made for this floor, dear. i said so at dinner, years ago. do you remember? the water was already rising then, too.',
          'get some sleep. the model says you don\'t. the model is usually right.',
        ],
        choices: [{ text: 'Close the window. Turn off the monitor. Do not sleep.' }],
      },
    },
  },
  // ── 1b. "Your heat is showing at work" warnings ─────────────────────────
  {
    id: 'react_dee_heat',
    channel: 'mail',
    title: 'a friendly word',
    from: 'dee',
    start: 'm',
    nodes: {
      m: {
        speaker: 'dee',
        text: [
          'I ran a service bench for eleven years, which means I know exactly what a person looks like when they haven\'t slept and keep glancing at the door.',
          'I don\'t know what you\'re into after hours and I don\'t WANT to. But you bring it into MY store, and I can\'t protect you, and I will be very sad and then very fired. So. Cool it. For me. For the monitors.\n\n— Dee',
        ],
        effects: [{ stat: 'stress', add: 2 }],
        choices: [{ text: 'She\'s right. Cool it.' }],
      },
    },
  },
  {
    id: 'react_wes_heat',
    channel: 'mail',
    title: 're: keep it off the pipe',
    from: 'northlink_wes',
    start: 'm',
    nodes: {
      m: {
        speaker: 'northlink_wes',
        text: [
          'Hey. Abuse desk flagged some traffic that came back to a static line that came back to, well. You.',
          'I scrubbed it. Once. I run the pipe, I don\'t police it, but the new memos say I have to start, and I\'d rather not start with you. Whatever you\'re doing, don\'t do it from here.\n\n— Wes',
        ],
        effects: [{ stat: 'heat', add: -3 }],
        choices: [{ text: 'Noted. Use a different line.' }],
      },
    },
  },
  {
    id: 'react_meridian_heat',
    channel: 'mail',
    title: 'Notice: Acceptable Use Review',
    from: 'Meridian Human Resources',
    start: 'm',
    nodes: {
      m: {
        speaker: 'Meridian Human Resources',
        text: [
          'This is an automated courtesy notice. Our monitoring indicates activity associated with your credentials that falls outside the scope of the Meridian Trust Acceptable Use Policy (§4.2, "Off-Hours Conduct").',
          'No action is required at this time. Please be advised that a second notice is not a courtesy. Have a secure day.\n\n— People & Culture, Meridian Trust',
        ],
        effects: [{ stat: 'stress', add: 3 }],
        choices: [{ text: 'File it under "at this time."' }],
      },
    },
  },
  // ── 2. "They'll remember that" ──────────────────────────────────────────
  {
    id: 'react_byteme_jax_fall',
    channel: 'chat',
    title: 'byteme',
    from: 'byteme',
    start: 'm',
    nodes: {
      m: {
        speaker: 'byteme',
        text: [
          'yo. YO. jax told me what you did. that you took his fall. that you went INSIDE for him',
          'i didnt know people actually did that. like in real life. i thought that was a movie thing',
          'im gonna be more careful. i mean it this time. i dont want anybody taking a fall for ME',
        ],
        effects: [{ npc: 'byteme', affinity: 6 }],
        choices: [{ text: '"Be careful, then. That\'s all I want."' }],
      },
    },
  },
  {
    id: 'react_jax_hospital',
    channel: 'chat',
    title: 'JaxAttack',
    from: 'jax',
    start: 'm',
    nodes: {
      m: {
        speaker: 'jax',
        text: [
          'hey. so. people are talking. about the hospital thing. the billing thing.',
          'im not gonna ask if it was you. i dont want to know. i really dont',
          'just. that was somebodys grandma man. that was somebodys grandma',
        ],
        effects: [{ npc: 'jax', affinity: -4 }, { stat: 'mood', add: -4 }],
        choices: [
          { text: '"It wasn\'t what it looks like." (It was exactly what it looks like.)', effects: [{ npc: 'jax', affinity: -2 }] },
          { text: 'Say nothing. Let the cursor blink.' },
        ],
      },
    },
  },
  {
    id: 'react_deadline_solidarity',
    channel: 'chat',
    title: 'Deadline',
    from: 'deadline',
    start: 'm',
    nodes: {
      m: {
        speaker: 'deadline',
        text: [
          'kid. what you pulled with the board tonight. the wipe. everybody at once, nobody said a word.',
          'that\'s \'94. that\'s the whole thing. i was starting to think the scene forgot how to do that.',
          'i had a rough decade, you know that. tonight i\'m glad i stuck around to see it happen one more time. now back up your LIFE, not your data. old man\'s only advice worth anything.',
        ],
        effects: [{ npc: 'deadline', affinity: 5 }, { stat: 'mood', add: 4 }],
        choices: [{ text: '"Couldn\'t have done it without the \'94 playbook, Deadline."' }],
      },
    },
  },
  {
    id: 'react_board_goes_quiet',
    channel: 'forum',
    title: 'anybody heard from Corvid?',
    from: 'a worried regular',
    board: 'warez',
    start: 'm',
    nodes: {
      m: {
        speaker: 'a worried regular',
        text: [
          '> anybody heard from Corvid? board\'s been weird. threads getting locked, old posts vanishing. feels like somebody\'s cleaning house and it isn\'t her.',
          '> heard she "took a consulting thing." Corvid. consulting. the woman who wiped forty drives so nobody would rat. i don\'t believe it and i\'m scared it\'s true.',
          '> if you know something, don\'t post it here. board\'s not ours anymore. that\'s the whole point.',
        ],
        choices: [{ text: 'Read it twice. Post nothing. It really isn\'t yours anymore.' }],
      },
    },
  },
  // ── 3. Trusted-tier reputation payoffs ──────────────────────────────────
  {
    id: 'react_loft_trusted',
    channel: 'chat',
    title: 'Corvid',
    from: 'corvid',
    start: 'm',
    nodes: {
      m: {
        speaker: 'corvid',
        text: [
          'You crossed a line tonight. A good one. The back room\'s yours now — the real one, on Sodium Row, not the forum.',
          'That means something. It means when the men in jackets come for you, forty people wipe their drives the same night and nobody says a word. It also means we expect the same from you. That\'s the deal. That\'s always been the deal.',
          'Don\'t sell it. Burn it before you sell it. — C.',
        ],
        choices: [{ text: '"I know the deal, Corvid. I\'m in."' }],
      },
    },
  },
  {
    id: 'react_aperture_trusted',
    channel: 'mail',
    title: 'a standing arrangement',
    from: 'kroll',
    start: 'm',
    nodes: {
      m: {
        speaker: 'kroll',
        text: [
          'Dear,\n\nYou\'ve reached the tier where I stop describing you as "promising." Promising is what I buy cheap. You are now something I would be foolish to lose, and I am rarely foolish.',
          'What this means, practically: our lawyers are your lawyers. Problems become smaller. Doors that were locked develop the habit of being open. In return, you keep being interesting, and you keep being discreet. I\'ve never had to say the second part to you twice, which is exactly why I\'m writing the first part now.\n\nWarmly — always warmly,\nV.',
        ],
        choices: [{ text: 'Warmly. Always warmly. Close it.' }],
      },
    },
  },
]

const triggers: TriggerDef[] = [
  // Milestones
  { id: 'trig_react_dee_milestone', when: { jobLevel: 'job_compcastle_bench', gte: 6 }, atHour: 9, effects: [{ scene: 'react_dee_milestone' }] },
  { id: 'trig_react_wes_milestone', when: { all: [{ jobLevel: 'job_northlink_neteng', gte: 3 }, { npc: 'northlink_wes', met: true }] }, atHour: 9, effects: [{ scene: 'react_wes_milestone' }] },
  { id: 'trig_react_kroll_milestone', when: { all: [{ jobLevel: 'job_aperture_analyst', gte: 2 }, krollOk] }, atHour: 20, effects: [{ scene: 'react_kroll_milestone' }] },
  // Heat-at-work warnings (Halcyon's own is PKG-09; these cover the other employers)
  {
    id: 'trig_react_dee_heat',
    when: { all: [{ job: ['job_compcastle_bench', 'job_compcastle_lead'] }, { stat: 'heat', gte: 55 }] },
    once: false,
    cooldownDays: 120,
    atHour: 10,
    effects: [{ scene: 'react_dee_heat' }],
  },
  {
    id: 'trig_react_wes_heat',
    when: { all: [{ jobTrack: ['sysadmin', 'network'] }, { job: ['job_northlink_noc_night', 'job_northlink_sysadmin', 'job_northlink_senior_sysadmin', 'job_northlink_neteng', 'job_northlink_architect', 'job_northlink_field_tech'] }, { stat: 'heat', gte: 60 }, { npc: 'northlink_wes', met: true }] },
    once: false,
    cooldownDays: 120,
    atHour: 10,
    effects: [{ scene: 'react_wes_heat' }],
  },
  {
    id: 'trig_react_meridian_heat',
    when: { all: [{ job: ['job_meridian_support', 'job_meridian_dev', 'job_meridian_secanalyst', 'job_meridian_it_manager'] }, { stat: 'heat', gte: 55 }] },
    once: false,
    cooldownDays: 120,
    atHour: 9,
    effects: [{ scene: 'react_meridian_heat' }],
  },
  // "They'll remember that"
  { id: 'trig_react_byteme_jax_fall', when: { all: [{ flag: 'a2.took_jax_fall' }, bytemeOk] }, atHour: 17, effects: [{ scene: 'react_byteme_jax_fall' }] },
  { id: 'trig_react_jax_hospital', when: { all: [{ flag: 'fac.aperture.hospital_done' }, jaxOk] }, atHour: 21, effects: [{ scene: 'react_jax_hospital' }] },
  { id: 'trig_react_deadline_solidarity', when: { all: [{ flag: 'a2.solidarity' }, deadlineOk] }, atHour: 23, effects: [{ scene: 'react_deadline_solidarity' }] },
  { id: 'trig_react_board_quiet', when: { flag: 'npc.corvid.bought' }, atHour: 22, effects: [{ scene: 'react_board_goes_quiet' }] },
  // Trusted-tier payoffs
  { id: 'trig_react_loft_trusted', when: { all: [{ faction: 'fac.loft', gte: 50 }, corvidOk] }, atHour: 22, effects: [{ scene: 'react_loft_trusted' }] },
  { id: 'trig_react_aperture_trusted', when: { all: [{ faction: 'fac.aperture', gte: 50 }, krollOk] }, atHour: 8, effects: [{ scene: 'react_aperture_trusted' }] },
]

export default defineContent({ scenes, triggers })
