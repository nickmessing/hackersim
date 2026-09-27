/**
 * PKG-02 — the mirror identity lock (bible §4.5, §6.B; ~day 500, end of IIa).
 *
 * The anonymous rival "mirror" has been sniping your work since Act I (PKG-00 owns npc.mirror). Here
 * its identity LOCKS into `mir.identity` so IIb clues can be identity-specific, before the dark turn
 * and long before any confrontation. PKG-03 owns the outcome (`mir.outcome`) and the reveal
 * (`a3.mirror_revealed`); this package only writes the identity.
 *
 * Selector (§4.5): among {jax, mira, byteme}, filtered by availability and by an UNCOMPLETED loyalty
 * quest, pick the most-neglected — lowest NORMALIZED affinity (affinity minus baseline: jax 40,
 * byteme 25, mira 20). The engine has no argmin over NPCs, so this is a layered threshold cascade:
 * four neglect depths (normalized ≤ −5 / −12 / −20 / −30). Later depths override earlier ones, so the
 * most-neglected candidate wins; within a depth the order is mira → byteme → jax, so ties resolve
 * toward the closer friend (the most personal gotcha, which is the point). Nobody neglected →
 * `stranger`, bound to npc.flamer, so a player who cared for everyone is never punished.
 *
 * PKG-02 owns: main_a2_q1a_mirror_lock, scenes a2_mirror_ping / a2_mirror_clue /
 * a2_mirror_accuse_{jax,byteme,mira}, flags mir.identity / a2.mirror_suspect / a2.mirror_accused,
 * trigger trig_a2_mirror_clue.
 *
 * Fail branch: a failed read of the clue points you at the WRONG friend, and you ask them. The
 * affinity loss and a2.mirror_suspect carry forward (the 3 a.m. call, the raid, Mira's wall).
 */
import { defineContent } from '@/engine/registry'
import type { Cond, Effect, QuestDef, SceneDef, TriggerDef } from '@/engine/types'

// Loyalty completion shields a candidate (bible §4.7).
const jaxLoyal: Cond = { quest: 'side_jax_sister', status: 'completed' }
const bytemeLoyal: Cond = {
  any: [
    { quest: 'side_byteme_snowday', status: 'completed' },
    { quest: 'side_vanishing_highscore', status: 'completed' },
  ],
}
const miraLoyal: Cond = { quest: 'side_coffee_warm', status: 'completed' }

// available() = met, and fate not already terminal/hostile.
const jaxElig: Cond = { all: [{ npc: 'jax', met: true, fateNot: ['arrested', 'flipped', 'dead', 'gone'] }, { not: jaxLoyal }] }
const bytemeElig: Cond = { all: [{ npc: 'byteme', met: true, fateNot: ['arrested_young', 'dead', 'turns'] }, { not: bytemeLoyal }] }
const miraElig: Cond = { all: [{ npc: 'mira', met: true, fateNot: ['gone', 'rival', 'casualty', 'flips_you'] }, { not: miraLoyal }] }

type Candidate = 'jax' | 'byteme' | 'mira'
const BASELINE: Record<Candidate, number> = { jax: 40, byteme: 25, mira: 20 }
const ELIG: Record<Candidate, Cond> = { jax: jaxElig, byteme: bytemeElig, mira: miraElig }
/** Reachable by a chat at all (met, not locked up or gone) — loyalty doesn't matter for this. */
const ELIG_MET: Record<Candidate, Cond> = {
  jax: { npc: 'jax', met: true, fateNot: ['arrested', 'flipped', 'dead', 'gone'] },
  byteme: { npc: 'byteme', met: true, fateNot: ['arrested_young', 'dead', 'turns'] },
  mira: { npc: 'mira', met: true, fateNot: ['gone', 'rival', 'casualty', 'flips_you'] },
}

const setMirror = (who: string): Effect => ({ flag: 'mir.identity', set: who })
const pick = (npc: Candidate, depth: number): Effect => ({
  if: { all: [ELIG[npc], { npc, affinityLte: BASELINE[npc] - depth }] },
  then: [setMirror(npc)],
})

/** The locking cascade: stranger default, then deeper neglect overrides shallower. */
const lockSelector: Effect[] = [
  setMirror('stranger'),
  ...[5, 12, 20, 30].flatMap(depth => (['mira', 'byteme', 'jax'] as const).map(npc => pick(npc, depth))),
]

const mirrorIs = (who: string): Cond => ({ flag: 'mir.identity', eq: who })

/**
 * Fail branch of the clue: the pattern resolves into the WRONG face. The suspect is always a friend
 * who is not the mirror (jax → byteme, byteme → mira, mira/stranger → jax), and the accusation
 * lands as a chat from them. `a2.mirror_suspect` (str) is read later by the 3 a.m. call, the raid
 * and Mira's wall.
 */
const suspectIs = (who: Candidate): Cond => ({ flag: 'a2.mirror_suspect', eq: who })
const accuse = (who: Candidate): Effect => ({
  if: { all: [suspectIs(who), ELIG_MET[who]] },
  then: [{ npc: who, affinity: -4 }, { scene: `a2_mirror_accuse_${who}`, delayHours: 30 }],
})
const wrongSuspect: Effect[] = [
  { flag: 'a2.mirror_suspect', set: 'jax' },
  { if: mirrorIs('jax'), then: [{ flag: 'a2.mirror_suspect', set: 'byteme' }] },
  { if: mirrorIs('byteme'), then: [{ flag: 'a2.mirror_suspect', set: 'mira' }] },
  accuse('jax'),
  accuse('byteme'),
  accuse('mira'),
]

const pingScene: SceneDef = {
  id: 'a2_mirror_ping',
  channel: 'chat',
  title: 'mirror',
  from: 'mirror',
  pause: false,
  start: 'ping',
  nodes: {
    ping: {
      speaker: 'mirror',
      text: [
        'a message with no sender lands in the pager, the way it has a dozen times since you were new.',
        '"you finished the millgate contract at 2:41. i had it at 2:09. you took the pretty route. i took the fast one."',
        // Identity-specific tells: small enough to miss, fair enough to earn the reveal.
        { if: mirrorIs('jax'), text: '"you still leave your semicolons hanging like you\'re waiting for someone to finish your sentences. used to be somebody did."' },
        { if: mirrorIs('mira'), text: '"you brute-forced the login again. cute. somebody should have taught you to read the source first."' },
        { if: mirrorIs('byteme'), text: '"i watched how u do the log wipe. i do it faster now. u never checked if i was watching lol"' },
        { if: mirrorIs('stranger'), text: '"still posting like a n00b who thinks nobody archives the old threads. i archive EVERYTHING."' },
        '"we\'re not so different, you and me. we just spend our nights on different things."',
      ],
      next: 'reply',
    },
    reply: {
      speaker: 'player',
      text: 'The cursor blinks. Whoever this is, they know your hands — the way you work, and the way you don\'t.',
      choices: [
        {
          text: '"Show me your face, then. Or are you scared of a fair race?"',
          effects: [{ stat: 'stress', add: 2 }],
          goto: 'gone',
        },
        { text: '"One day I\'m going to know your name. That\'s a promise."', goto: 'gone' },
        { text: 'Say nothing. Let them wonder who\'s reading.', tag: '[Silent]', goto: 'gone' },
      ],
    },
    gone: {
      speaker: 'narrator',
      text: 'The channel drops before your reply finishes sending. It always does. But something is different tonight — the taunt fits too well, lands too specifically, as if the shadow finally decided which person in your life it was going to wear.',
    },
  },
}

/** A IIb forum clue: mirror posts a cleaner solution to a board challenge, with an identity tell. */
const clueScene: SceneDef = {
  id: 'a2_mirror_clue',
  channel: 'forum',
  board: 'security',
  title: 'RE: Meridian online-banking login — "unbreakable"?',
  from: 'mirror',
  pause: false,
  start: 'post',
  nodes: {
    post: {
      speaker: 'mirror',
      text: [
        '> they say the new Meridian portal is unbreakable',
        'nothing a bank built in a hurry is unbreakable. it\'s just loud when it breaks. i\'m not posting how. i\'m posting THAT. somebody on this board is going to try it the loud way within the month and i want it on record that i said so first.',
        { if: mirrorIs('jax'), text: 'ps — whoever still orders pineapple on the back-room pizza: we see you. we have always seen you.' },
        { if: mirrorIs('mira'), text: 'ps — read the source. it\'s always in the source. the coffee\'s warm, if anyone ever wants to learn.' },
        { if: mirrorIs('byteme'), text: 'ps — snow day energy. u know who u are. im not a kid anymore' },
        { if: mirrorIs('stranger'), text: 'ps — some of us were here before the rep points. some of us remember who got laughed off this board in 2001. i remember everything.' },
        '— mirror',
      ],
      choices: [
        {
          text: 'Reply publicly: "Nice speech. Show your work or log off."',
          effects: [{ stat: 'cred', add: 1 }, { stat: 'stress', add: 2 }],
          goto: 'replied',
        },
        {
          text: 'Save the post. Compare the phrasing against everyone you know.',
          tag: '[Investigate]',
          check: {
            skill: 'cryptography',
            dc: 14,
            success: 'pattern',
            fail: 'wrong_pattern',
            successEffects: [{ xp: 'cryptography', add: 20 }],
            failEffects: [{ stat: 'stress', add: 3 }, ...wrongSuspect],
          },
        },
        { text: 'Close the thread. You have enough ghosts.', goto: 'closed' },
      ],
    },
    replied: {
      speaker: 'mirror',
      text: '"i already did," comes the reply, forty seconds later. "you just weren\'t looking where i was standing." The thread is locked by a moderator an hour after that, for "reasons."',
    },
    pattern: {
      speaker: 'narrator',
      text: [
        'You lay the post next to every message you\'ve kept — pages, forum sigs, the handwriting of people\'s typing. It\'s not proof. It\'s a feeling with a shape.',
        { if: mirrorIs('jax'), text: 'The double spaces after every period. The way the jokes arrive a beat late. You know someone who types exactly like that, and you haven\'t talked to him in a while.' },
        { if: mirrorIs('mira'), text: 'The economy of it. No wasted words, not one. You know someone who writes like she\'s paying by the letter, and you\'ve let her go quiet.' },
        { if: mirrorIs('byteme'), text: 'The "u." The missing apostrophes. The need to be seen being better. You know a kid who types like that, and when did he last page you?' },
        { if: mirrorIs('stranger'), text: 'The capital-letter archivist\'s pride. The grudge that\'s older than your handle. None of your friends write like that. Somebody from further back does.' },
      ],
    },
    wrong_pattern: {
      speaker: 'narrator',
      text: [
        'You stare at the phrasing until it rearranges itself into a face — and the face is wrong, though you won\'t know that for a long time.',
        { if: suspectIs('jax'), text: 'The late jokes. The double spaces. It has to be Jax. It explains the dodged pages, the "side stuff," the way he\'s been half a step out of reach all year. You\'re sure. You\'re so sure you start writing to him before you can stop yourself.' },
        { if: suspectIs('byteme'), text: 'The hunger to be seen. The "u." It has to be byteme — the kid who wanted to be you, finally good enough to prove it. You\'re sure. You\'re so sure it feels like relief, and you start writing to him before you can stop yourself.' },
        { if: suspectIs('mira'), text: 'The economy of it. Not one wasted word. It has to be Mira — who else reads you like source code? You\'re sure. Being sure about Mira feels like swallowing a battery, and you start writing to her anyway.' },
        'It feels exactly the way the pattern feels when it\'s right. That\'s the trouble with feelings that have shapes.',
      ],
    },
    closed: {
      speaker: 'narrator',
      text: 'You close the thread. It stays open somewhere in the back of your head anyway, the way the good taunts always do.',
    },
  },
}

/** The wrong accusation, one chat per suspect (voices differ; the damage doesn't). */
const accuseScene = (who: Candidate, lines: { hurt: string[]; sorry: string[]; pushed: string[]; deflect: string[] }): SceneDef => ({
  id: `a2_mirror_accuse_${who}`,
  channel: 'chat',
  title: who === 'jax' ? 'JaxAttack' : who === 'byteme' ? 'byteme' : 'nyx',
  from: who,
  pause: false,
  start: 'ask',
  nodes: {
    ask: {
      speaker: 'player',
      text: 'You type it, delete it, type it again, and send the worst possible version: "random q. you ever post on the security board under a different name?"',
      next: 'hurt',
    },
    hurt: {
      speaker: who,
      text: lines.hurt,
      choices: [
        { text: '"no. forget it. i\'m tired and paranoid. i\'m sorry."', tag: '[Apologize]', effects: [{ npc: who, affinity: 2 }], goto: 'sorry' },
        {
          text: '"it fits. the timing, the phrasing. just tell me."',
          tag: '[Push]',
          effects: [{ npc: who, affinity: -4 }, { flag: 'a2.mirror_accused' }],
          goto: 'pushed',
        },
        { text: '"lol obviously joking. anyway"', tag: '[Deflect]', goto: 'deflect' },
      ],
    },
    sorry: { speaker: who, text: lines.sorry },
    pushed: { speaker: who, text: lines.pushed },
    deflect: { speaker: who, text: lines.deflect },
  },
})

const accuseJax = accuseScene('jax', {
  hurt: [
    '...',
    'dude',
    'are u asking if im MIRROR',
    'u think im the guy whos been dunking on u for three years',
    'i can barely keep ONE handle alive. i reset my password like every week. the security question is "rosas cat" and i STILL get it wrong',
  ],
  sorry: ['ok', 'ok. its fine', 'its not fine but its fine', 'for the record if i WAS mirror id be nicer to u. i\'m nice. its my whole thing'],
  pushed: ['wow', 'ok', 'i gotta go', '...', 'for what its worth i defended u in like 40 threads. never mind'],
  deflect: ['lol ok', 'u should sleep man', 'like. actually sleep. not the thing where u close ur eyes at the monitor'],
})

const accuseByteme = accuseScene('byteme', {
  hurt: [
    'wait',
    'wait wait wait',
    'do u think im mirror??',
    'thats. honestly the coolest and worst thing anyones ever thought about me',
    'no. its not me. i wish i was that good. i cried when u didnt answer my pages last month',
  ],
  sorry: ['its ok!!', 'kinda flattered tbh', 'but also kinda not', 'can we do the library card thing again sometime. like old times'],
  pushed: ['its not me', 'why would u even', 'forget it. ur just like everybody else on the board. u only talk to me when u want something'],
  deflect: ['lol ok', 'u were joking right', 'right?'],
})

const accuseMira = accuseScene('mira', {
  hurt: [
    '...',
    'You think I\'d hide behind a handle to hurt you.',
    'I dunked on you in public on your first day, under my own name. I\'ve never once hit you from the dark.',
    'That\'s the one thing I thought you knew about me.',
  ],
  sorry: ['Okay.', 'I\'m going to pretend you were tired.', 'I\'m very good at pretending. Ask anyone from Ridgeport.'],
  pushed: ['Good night.', '[nyx has signed off]'],
  deflect: ['Sure. Joking.', 'Go to bed. Read the source in the morning. You\'ll see it isn\'t me.'],
})

const clueTrigger: TriggerDef = {
  id: 'trig_a2_mirror_clue',
  once: true,
  atHour: 23,
  chance: 0.2,
  when: { all: [{ flag: 'a2.phase_iib' }, { flag: 'mir.identity' }, { quest: 'main_a2_q2_priya', status: 'completed' }] },
  effects: [{ scene: 'a2_mirror_clue' }],
}

const quest: QuestDef = {
  id: 'main_a2_q1a_mirror_lock',
  title: 'The Shadow Sharpens',
  kind: 'main',
  act: 2,
  summary:
    'The anonymous rival "mirror" has been half a step ahead of you for months. Lately the taunts feel personal — like the shadow has picked a shape.',
  autoStart: { all: [{ var: 'act', eq: 2 }, { day: true, gte: 500 }] },
  priority: 6,
  rewards: 'A rival with a face (eventually)',
  start: 'lock',
  stages: {
    lock: {
      text: 'mirror is still out there, matching you move for move on the opposite method. Whoever it is, they know you too well now for it to be a stranger every time.',
      hint: 'A chat will arrive. Who the shadow becomes depends on which of your friends you\'ve let drift — loyalty quests shield them.',
      // Lock the identity first, then deliver the ping so its identity tells read correctly.
      onEnter: [...lockSelector, { scene: 'a2_mirror_ping', delayHours: 3 }],
      objectives: [
        {
          id: 'seen',
          text: 'Read the message that has no sender',
          when: { seen: 'a2_mirror_ping' },
          hint: 'Open the BuddyPager when it lights up.',
        },
      ],
    },
  },
}

export default defineContent({
  quests: [quest],
  scenes: [pingScene, clueScene, accuseJax, accuseByteme, accuseMira],
  triggers: [clueTrigger],
})
