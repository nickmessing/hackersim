/**
 * PKG-13 — `side_konami_contact` (bible §8 #35, Easter egg · Messenger · Act II–III).
 *
 * Gated on the Oracle channel existing (`a2.oracle_contact`, PKG-02's IIb drops). A rumor on the
 * board says the ghost-window that pages people answers to "the old code — the thirty-lives one."
 * It does. The player literally enters the sequence, one button per reply, in a blank BuddyPager
 * window; wrong presses reset it. The right one opens an extra Oracle cache: one more clue about
 * who insures the risk, and an evidence fragment.
 *
 * Sets: `evidence_fragments(+1)` (read by PKG-04 `trig_evidence`), `w.exposure(+1)` (shared add-only),
 *       `side.konami.done` (objective latch), small stress/mood.
 * Reads: `a2.oracle_contact` (PKG-02), `npc.oracle.is_deadline/.is_reyes/.is_kroll` (PKG-03, flavor
 *        only — the egg never commits to an identity before the Act III reveal), `bg.arcade_rat`.
 *
 * Hacking is fiction: the "cache" is a story device inside an invented messenger.
 */
import { defineContent } from '@/engine/registry'
import type { Choice, QuestDef, SceneDef, SceneNode } from '@/engine/types'

const BUTTONS = ['↑', '↓', '←', '→', 'B', 'A'] as const
type Button = (typeof BUTTONS)[number]
/** The thirty-lives code. */
const CODE: readonly Button[] = ['↑', '↑', '↓', '↓', '←', '→', '←', '→', 'B', 'A']

/** Builds one input node per step: every press but the right one resets the sequence. */
function codeNodes(): Record<string, SceneNode> {
  const nodes: Record<string, SceneNode> = {}
  CODE.forEach((want, i) => {
    const typed = CODE.slice(0, i).join(' ')
    const blanks = Array.from({ length: CODE.length - i }, () => '_').join(' ')
    const next = i + 1 < CODE.length ? `k${String(i + 1)}` : 'start_prompt'
    const choices: Choice[] = BUTTONS.map(b => ({ text: `[ ${b} ]`, goto: b === want ? next : 'wrong' }))
    nodes[`k${String(i)}`] = {
      speaker: 'narrator',
      text: `> ${typed}${typed ? ' ' : ''}${blanks}`,
      choices,
    }
  })
  return nodes
}

const quest: QuestDef = {
  id: 'side_konami_contact',
  title: 'Thirty Lives',
  kind: 'side',
  act: 2,
  priority: 4,
  autoStart: {
    all: [{ flag: 'a2.oracle_contact' }, { var: 'act', gte: 2 }, { var: 'act', lte: 3 }],
  },
  rewards: 'One more piece of the puzzle · an evidence fragment',
  summary: [
    'Whoever keeps opening windows in your pager is not the only one they\'ve visited. On the board there\'s a rumor: the ghost-window has an easter egg. "Type the old code at it. You know the one. Thirty lives."',
    'It is absolutely a prank. You are absolutely going to try it.',
  ],
  start: 'rumor',
  stages: {
    rumor: {
      text: 'A rumor says the anonymous window that pages people answers to the oldest cheat code in the arcade. Try it.',
      hint: 'Read the thread on the security board, then enter the code in the blank BuddyPager window — one button per reply. A wrong press resets it. Think side-scrolling shooters, a cabinet at the back of the arcade, and thirty lives.',
      onEnter: [{ scene: 'konami_rumor' }],
      objectives: [
        {
          id: 'code',
          text: 'Enter the thirty-lives code into the blank window',
          when: { flag: 'side.konami.done' },
          hint: 'Up, up — you know the rest. If you close the window, it opens again the next night.',
        },
      ],
    },
  },
}

const rumor: SceneDef = {
  id: 'konami_rumor',
  channel: 'forum',
  board: 'security',
  title: 'the pager ghost has a cheat code (NOT a joke)',
  from: 'L0wBatt',
  start: 'op',
  nodes: {
    op: {
      speaker: 'L0wBatt',
      text: [
        'ok so. some of you have had the window. the one that opens in your pager by itself, no handle, says spooky stuff about who "insures the risk," closes before you can reply. dont lie, i know at least 3 of you got it',
        'my cousin in Ridgeport says theres an egg in it. if you type the old code at the blank window — THE code, the thirty-lives one, from the back of every arcade in the world — it answers different. says something it doesnt say otherwise',
        'i tried and got to "down" and chickened out bc my mom walked in',
        '-- l0wbatt · 12% and falling',
      ],
      next: 'replies',
    },
    replies: {
      speaker: 'narrator',
      text: [
        'ReplyGuy2000: this is how they get you. "type the code." next thing you know your hard drive is playing a MIDI of your own funeral',
        'xXShadowPhreakXx: i got the window once. it said "careless, but good." i think about it every day. i did not type any code i just unplugged my whole house',
        'l0wbatt: cowards. all of you. (me too)',
      ],
      choices: [
        {
          text: 'Open the pager. Somebody has to press up.',
          effects: [{ scene: 'konami_window', delayHours: 1 }],
        },
        {
          text: 'Post: "It\'s a prank." Then wait for everyone to log off.',
          effects: [
            { log: 'You called it a prank. That night a blank window opens in your pager by itself, cursor blinking, waiting.', kind: 'story' },
            { scene: 'konami_window', delayHours: 26 },
          ],
        },
      ],
    },
  },
}

const blankWindow: SceneDef = {
  id: 'konami_window',
  channel: 'chat',
  title: 'unknown sender',
  from: 'oracle',
  start: 'blank',
  nodes: {
    blank: {
      speaker: 'narrator',
      text: [
        'A BuddyPager window you didn\'t open. No handle, no status, no away message. The text area is empty except for a cursor, blinking at the speed of a resting heart. Along the bottom edge, in grey letters so small they might be a rendering glitch: PRESS START.',
      ],
      choices: [
        {
          text: 'Start typing the code. One button at a time.',
          goto: 'k0',
        },
        {
          text: 'Your hands know this. You typed it on a hundred cabinets before you could spell "arcade."',
          if: { flag: 'bg.arcade_rat' },
          tag: '[Arcade Rat]',
          goto: 'start_prompt',
        },
        {
          text: 'Close the window. Not tonight.',
          effects: [{ scene: 'konami_window', delayHours: 24 }],
        },
      ],
    },
    ...codeNodes(),
    wrong: {
      speaker: 'narrator',
      text: [
        'The line clears. The cursor goes back to the start and blinks, unbothered. Whatever is on the other side of this window has all the time in the world, and is quietly waiting for you to remember a very old joke correctly.',
      ],
      choices: [
        { text: 'From the top.', goto: 'k0' },
        {
          text: 'Close it. Try again tomorrow night.',
          effects: [{ scene: 'konami_window', delayHours: 24 }],
        },
      ],
    },
    start_prompt: {
      speaker: 'narrator',
      text: '> ↑ ↑ ↓ ↓ ← → ← → B A\n\nThe cursor stops blinking. The grey words at the bottom brighten: PRESS START.',
      choices: [{ text: '[ START ]', goto: 'egg' }],
    },
    egg: {
      speaker: 'oracle',
      text: [
        'the window fills slowly, one line at a time, the way a text adventure used to.',
        '"30 LIVES. you\'ll need them."',
        '"you found the door i left for people who still remember how doors used to work. good. the ones who only know the new ways never think to press up."',
        { if: { flag: 'npc.oracle.is_deadline' }, text: 'At the end of the line, a tiny dog made of ASCII characters wags its tail and vanishes.' },
        { if: { flag: 'npc.oracle.is_reyes' }, text: 'The timestamp at the top of the message is formatted like an evidence log. Date, time, initials, a case number with the digits blacked out.' },
        { if: { flag: 'npc.oracle.is_kroll' }, text: '"you\'d be wonderful at dinner parties," the window adds, in a slightly different rhythm, as if someone couldn\'t help themselves.' },
      ],
      next: 'cache',
    },
    cache: {
      speaker: 'oracle',
      text: [
        '"the scores have to be bought by someone. aperture sells them. the insurers use them. but somebody takes the other side of the bet — somebody holds the risk when a whole street is scored as \'elevated.\'"',
        '"it\'s called Lumen Sound Mutual. floor 31 of the meridian tower, by the lobby directory. a company with a board, a bank account, a very nice logo, and no employees."',
        '"attached: one page. a rate card. find your street on it. then find mine. no — don\'t reply."',
        'A single scanned page drops into the window: a PARALLAX neighborhood rate card, columns of codes and multipliers. Halfway down, in the same soft good font you have started to see in your sleep: CANNERY ROW — ADJUSTMENT: ELEVATED (+18%). Below it a handwritten margin note, photocopied with the page: "ask who holds the other side."',
      ],
      effects: [
        { var: 'evidence_fragments', add: 1 },
        { var: 'w.exposure', add: 1 },
        { stat: 'stress', add: 3 },
        { notify: 'Evidence fragment: the PARALLAX rate card (Lumen Sound Mutual).', kind: 'good' },
      ],
      choices: [
        {
          text: 'Save the page three ways before the window closes.',
          goto: 'saved',
        },
        {
          text: 'Type back anyway: "Who holds YOUR side?"',
          goto: 'typed',
        },
      ],
    },
    saved: {
      speaker: 'narrator',
      text: [
        'You save it to disk, to a floppy, and to a burned CD you hide inside the case of a bad movie. The window watches you do it, cursor still, and then closes itself, politely, like a host showing a guest to the door.',
        'On the board, the next morning, l0wbatt has posted again: "update: did anyone actually do it." You don\'t reply. Some easter eggs are only funny until you find one.',
      ],
      effects: [{ flag: 'side.konami.done' }, { stat: 'mood', add: 2 }],
    },
    typed: {
      speaker: 'narrator',
      text: [
        'You type it fast, before the window can close. The words sit there in the reply box. The cursor blinks once, twice. For a moment you think you see the first letter of an answer begin to form in the other half of the window.',
        'Then the window closes, and your saved copy of the rate card is fine, and your pager\'s history shows no conversation at all. As if you had been talking to yourself. As if that were the point.',
      ],
      effects: [{ flag: 'side.konami.done' }, { stat: 'stress', add: 2 }],
    },
  },
}

export default defineContent({ quests: [quest], scenes: [rumor, blankWindow] })
