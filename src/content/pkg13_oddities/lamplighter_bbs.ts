/**
 * PKG-13 — `side_bbs_that_wouldnt_die` (bible §8 #33, Oddity · Dialog · Act II).
 *
 * A forum regular dials an old 1993 BBS list for nostalgia and one number still answers: THE
 * LAMPLIGHTER, a Cannery Row board whose sysop died in 1997. It still runs. Its "last caller" is
 * the dead sysop. Someone, somewhere, is keeping the lamp lit — and the answer is heartbreakingly
 * ordinary. The choice: preserve it, keep it running, hand it to the Loft, or quietly harvest its
 * user list.
 *
 * Sets: `side.bbs_harvested` (the harvest; **PKG-14's `trig_bbs_harvest_enclosure` owns the
 *       `w.enclosure` +1** — PKG-13 never writes enclosure), `side.bbs.done` (objective latch),
 *       `fac.hood`/`fac.loft` (+), small money/mood/stress.
 * Reads: `fac.loft`, `npc.corvid`/`npc.dialtone`/`npc.deadline` met, `a2.phase_iib`.
 *
 * Hacking is fiction: the board, its "event scripts" and its user list are abstract game flavor.
 */
import { defineContent } from '@/engine/registry'
import type { Effect, QuestDef, SceneDef } from '@/engine/types'

const done: Effect = { flag: 'side.bbs.done' }

const quest: QuestDef = {
  id: 'side_bbs_that_wouldnt_die',
  title: 'The Board That Wouldn\'t Die',
  kind: 'side',
  act: 2,
  priority: 5,
  autoStart: { all: [{ var: 'act', eq: 2 }, { day: true, gte: 380 }] },
  rewards: 'Neighborhood and Loft standing · a piece of the city\'s memory',
  summary: [
    'Somebody on the board dialed an old list of Port Lumen BBS numbers from 1993, for fun. Every line was dead but one. THE LAMPLIGHTER still picks up, still shows its ANSI lamp, still counts its callers.',
    'Its sysop, Tom Ashby, died in 1997. According to the board, he logged in three days ago.',
  ],
  start: 'dial',
  stages: {
    dial: {
      text: 'A dead man\'s bulletin board is still answering its phone on Cannery Row, and its sysop keeps logging in. Dial in and find out who is keeping the lamp lit.',
      hint: 'Read the forum thread, then dial THE LAMPLIGHTER. Programming or Social gets you to the truth fastest; either way, it gets you there.',
      onEnter: [{ scene: 'lamplighter_thread' }],
      objectives: [
        {
          id: 'lamp',
          text: 'Decide what becomes of THE LAMPLIGHTER',
          when: { flag: 'side.bbs.done' },
          hint: 'Dial in (the thread offers it), follow the trail to whoever keeps it running, and make the call in their spare room.',
        },
      ],
    },
  },
}

const thread: SceneDef = {
  id: 'lamplighter_thread',
  channel: 'forum',
  board: 'general',
  title: 'dialed my dad\'s old BBS list for fun. one of them ANSWERED',
  from: 'Modem_Mouse',
  start: 'op',
  nodes: {
    op: {
      speaker: 'Modem_Mouse',
      text: [
        'found my dad\'s printout from \'93 in the basement. "PORT LUMEN BBS LIST — UPDATED MONTHLY — PLEASE SHARE." 61 numbers. dialed every one tonight, just to hear the noise.',
        '60 of them: "the number you have dialed is not in service." number 61: CONNECT 14400. full ANSI screen. a little lamp made of yellow block characters, flickering. THE LAMPLIGHTER. caller #48,211.',
        'the "last caller" line says TOMASHBY, 3 days ago. the sysop info file says Tom Ashby. i looked him up in the library microfiche like a total nerd and he has an obituary. from 1997.',
        'number\'s 555-0161 if anyone wants to tell me i\'m crazy',
        '-- modem_mouse · "it\'s not a bug, it\'s a lifestyle"',
      ],
      next: 'replies',
    },
    replies: {
      speaker: 'narrator',
      text: [
        'ReplyGuy2000: prob a script lol. ppl leave boxes running forever. my uncle\'s fax machine still sends christmas cards',
        'xXShadowPhreakXx: or its HAUNTED. im just saying nobody has ruled out haunted',
        { if: { npc: 'deadline', met: true }, text: 'deadline: Tom Ashby\'s board. Tom taught half this city to type ATDT. He died with the handset in his hand, near enough. Whatever\'s answering that line, be polite to it.' },
        { if: { npc: 'corvid', met: true }, text: 'corvid: The Lamplighter was my first board. I was fourteen. Tom let me stay on past my time limit every night and never once told my mother. If someone goes in there, go in gentle. It matters to more people than you\'d think.' },
        'modem_mouse: ok now im scared AND sad. somebody braver than me go look',
      ],
      choices: [
        {
          text: 'Dial 555-0161. Somebody braver than modem_mouse, reporting for duty.',
          effects: [{ scene: 'lamplighter_dialin', delayHours: 2 }],
        },
        {
          text: 'Post: "It\'s a script. Leave the man\'s board alone." (Then lie awake.)',
          effects: [
            { log: 'You told them to leave it alone. At 2 a.m. your hand dials 555-0161 anyway.', kind: 'story' },
            { scene: 'lamplighter_dialin', delayHours: 20 },
          ],
        },
      ],
    },
  },
}

const dialin: SceneDef = {
  id: 'lamplighter_dialin',
  channel: 'dialog',
  title: 'THE LAMPLIGHTER',
  start: 'connect',
  nodes: {
    connect: {
      speaker: 'narrator',
      text: [
        'ATDT 555-0161. The dial tone. The seven digits. And then the song — the long, rising, gargling screech of two modems finding each other in the dark, the most comforting ugly noise you know. CONNECT 14400.',
        'The screen fills from the top, line by line, at the speed of a slow reader. A lamp built from yellow and orange block characters, a little ANSI flame that flickers between two frames. Beneath it, in hand-set letters: THE LAMPLIGHTER · PORT LUMEN · EST. 1986 · "KEEP THE LAMP LIT."',
        'YOU ARE CALLER #48,212. LAST CALLER: TOMASHBY (3 DAYS AGO). TIME LEFT TODAY: 60 MIN.',
      ],
      next: 'messages',
    },
    messages: {
      speaker: 'narrator',
      text: [
        'The message base is a time capsule. Flame wars about the best text editor, 1991. A thread titled "WHO TOOK MY LAWN FLAMINGO (TOM I KNOW IT WAS YOU)." Recipes. Birthday wishes to users with names like CAPTAIN_BYTE and LUNCHLADY. Everything stops in the spring of 1997 — except one user.',
        'Every Sunday since, without a single miss, TOMASHBY has posted to the main board. Always the same two words. "Lamp\'s lit." Three hundred and forty-some Sundays of it, marching down the screen like fence posts. The newest is from three days ago.',
        { if: { flag: 'a2.phase_iib' }, text: 'A year ago this would only have been sad. Lately you know too much about machines that keep doing things after the people are gone, and about who pays for them to keep doing it. You check the line for anything listening in. It\'s clean. Just a dead man\'s board, and you.' },
      ],
      choices: [
        {
          text: '[Programming] Read the board\'s nightly event scripts. A ghost has to run on something.',
          check: {
            skill: 'programming',
            dc: 14,
            bonuses: [{ if: { background: 'mathlete' }, add: 1, label: '+1 (you read code like sheet music)' }],
            success: 'script_truth',
            fail: 'page_sysop',
            successEffects: [{ xp: 'programming', add: 12 }],
            failEffects: [{ xp: 'programming', add: 5 }],
          },
        },
        {
          text: '[Social] The sysop info file lists a voice line for emergencies. Call it.',
          check: {
            skill: 'social',
            dc: 12,
            success: 'voice_line',
            fail: 'page_sysop',
            successEffects: [{ xp: 'social', add: 10 }],
            failEffects: [{ xp: 'social', add: 4 }],
          },
        },
        {
          text: 'Page the sysop. It\'s what you\'d do on any board.',
          goto: 'page_sysop',
        },
      ],
    },
    // Fail-forward (and the eerie beat): the sysop answers.
    page_sysop: {
      speaker: 'narrator',
      text: [
        'You press P for Page Sysop, the way you have on a hundred boards. The screen clears. A split chat window opens, his half on top, yours on the bottom, the way it used to. The cursor sits in his half and blinks.',
        'Then letters, one at a time, at the speed of a man typing with two fingers: "Evening. Lamp\'s lit." A pause long enough to hear your own blood. "Who\'s calling?"',
        'You don\'t type anything. You hang up so hard the handset cracks the cradle. It takes you a full cup of coffee and the old city directory at the library to do what you should have done first — look up the Ashbys of Cannery Row. There\'s still one listed. E. Ashby. Four streets from your parents\' place.',
      ],
      effects: [{ stat: 'stress', add: 7 }, { stat: 'energy', add: -8 }, { flag: 'side.lamp_paged' }],
      next: 'ellie',
    },
    script_truth: {
      speaker: 'narrator',
      text: [
        'The ghost runs on a scheduler. You find it in the board\'s nightly maintenance events, a tidy little script with Tom\'s initials in the header and a date: January 1997. Every Sunday at dusk it logs in as TOMASHBY, posts "Lamp\'s lit," and logs out. If anyone pages the sysop, it types back a greeting, two fingers\' slow, then waits forever.',
        'There\'s a comment above it, in plain English. "For Ellie. So the lights on the modem blink on Sundays and she knows it\'s still going. Don\'t let the phone company cut it, El. Somebody might need to call." And a voice number. Four streets from your parents\' place.',
      ],
      effects: [{ faction: 'fac.hood', add: 1 }],
      next: 'ellie',
    },
    voice_line: {
      speaker: 'narrator',
      text: [
        'It rings nine times. You\'re about to give up when a woman picks up — old, careful, a little breathless, as if she crossed a whole house to get to the phone. "Ashby residence."',
        'You explain, badly, that you called the board. There\'s a long silence on the line, and then something that is almost a laugh and almost not. "Oh, honey," says Ellie Ashby. "Nobody\'s called the board in years. You\'d better come over. I\'ll put the kettle on. Tom would have wanted to meet you."',
      ],
      effects: [{ faction: 'fac.hood', add: 1 }],
      next: 'ellie',
    },
    ellie: {
      speaker: 'narrator',
      text: [
        'Ellie Ashby is eighty-one and four foot ten and has kept the spare room exactly as Tom left it. Shelves of manuals. A mug of pencils. A beige tower the size of a suitcase humming on a card table, and on top of it a modem whose little red lights flicker whenever someone calls. The line has been paid, every month, for six years.',
        { if: { flag: 'side.lamp_paged' }, text: 'You notice, on the card table, the old handset you heard crack on your end — no, not yours. Hers. A second phone on the same line, the receiver taped where it split. "Somebody paged him Thursday and then hung up hard enough to crack it," she says mildly. "I thought it was him being cross. Was that you, dear?" It was you. She forgives you before you finish saying so.' },
        '"I can\'t work it," she says. "Never could. But on Sundays the lights blink, and I sit here with my tea and I think, well, he\'s still at it." She smooths the doily under the modem. "Then you called, and they blinked on a Thursday. I nearly dropped the pot." She looks at you over her glasses. "The fan\'s getting loud. The man at the store says it\'s dying. What should I do with it, dear? You\'d know. Tom always said the young ones would know."',
      ],
      choices: [
        {
          text: '[Hardware] Preserve it: image the old drive, print her the message base, and let it rest.',
          check: {
            skill: 'hardware',
            dc: 14,
            bonuses: [{ if: { background: 'tinkerer' }, add: 2, label: '+2 (you\'ve nursed older drives)' }],
            success: 'preserve_win',
            fail: 'preserve_fail',
            successEffects: [{ xp: 'hardware', add: 12 }],
            failEffects: [{ xp: 'hardware', add: 6 }],
          },
        },
        {
          text: 'Keep the lamp lit. Swap the dying fan and power supply on your own dime. ($40)',
          req: { stat: 'money', gte: 40 },
          reqText: 'Requires $40 for parts',
          effects: [{ money: -40 }],
          goto: 'keep_lit',
        },
        {
          text: 'Bring the Loft in: let the scene adopt the Lamplighter as a node, so it outlives all of you.',
          req: { faction: 'fac.loft', gte: 30 },
          reqText: 'Requires Loft reputation 30 — they only adopt history for people they trust',
          goto: 'loft_node',
        },
        {
          text: 'While she makes the tea, quietly copy the user list. Twenty years of handles, real names and phone numbers.',
          tag: '[Harvest]',
          goto: 'harvest',
        },
      ],
    },
    preserve_win: {
      speaker: 'narrator',
      text: [
        'You take the old drive out like you\'re lifting a sleeping cat, slow down everything that can be slowed down, and coax twenty years off it before the bearings can argue. Every flame war. Every recipe. Every "Lamp\'s lit." The whole capsule, safe.',
        'At the copy shop you print the message base in a fat spiral-bound book, and on the cover you put the yellow ANSI lamp. Ellie reads the flamingo thread at her kitchen table and laughs until she cries, and then just cries, and then laughs again. "Oh, it WAS him," she says. "The flamingo. That rascal."',
        'Then, together, the two of you shut it down. She turns the key herself. The fan spins down with a sigh like a long exhale, and the lights on the modem go dark for the first time in twenty years.',
      ],
      effects: [
        { faction: 'fac.hood', add: 3 },
        { faction: 'fac.loft', add: 2 },
        { stat: 'mood', add: 8 },
        { if: { npc: 'corvid', met: true }, then: [{ npc: 'corvid', affinity: 4 }] },
      ],
      next: 'preserved_end',
    },
    preserve_fail: {
      speaker: 'narrator',
      text: [
        'Halfway through the copy the drive starts to click — the slow, even tick of a clock nobody can wind — and then it stops. You get the last two years of the message base: 1996, the last of the living posts, and every single Sunday "Lamp\'s lit." The flamingo thread is gone forever. So are the recipes.',
        'You tell Ellie, and she only nods. "Well," she says, patting the silent tower like a horse. "He always did go out in the middle of a sentence." You print her what survived, fifty-two Sundays and a year of neighbors, and she says it\'s exactly the right amount of Tom to keep on a nightstand.',
      ],
      effects: [{ faction: 'fac.hood', add: 2 }, { stat: 'mood', add: 2 }, { stat: 'stress', add: 3 }, { flag: 'side.lamp_partial' }],
      next: 'preserved_end',
    },
    preserved_end: {
      speaker: 'narrator',
      text: [
        'You post in modem_mouse\'s thread that night. "Not a ghost. Just a man who wanted his wife to know the light was still on. The board is resting now. There\'s a book, if anyone who used to call wants to read it. Ask me."',
        { if: { npc: 'corvid', met: true }, text: 'Corvid is the first to ask. She doesn\'t say anything else. She just asks.' },
        {
          if: { flag: 'side.lamp_partial' },
          text: 'Twenty-three people ask in the first week. Nearly every one of them asks, second thing, about the flamingo thread, and you have to tell each of them it\'s gone — that the drive went out mid-copy and took 1977 through 1995 with it. One of them writes back only: "that was the best thing that ever happened on this street." You believe her. You keep the fifty-two Sundays anyway.',
          else: 'Fifty-eight people ask in the first week. Some of them are grandparents now. One of them is modem_mouse\'s dad.',
        },
      ],
      effects: [done],
    },
    keep_lit: {
      speaker: 'narrator',
      text: [
        'You come back Saturday with a new fan and a secondhand power supply from the CompCastle bargain bin, and in an afternoon the tower is quieter than it\'s been in a decade. You don\'t touch anything else. Not the script. Not the Sundays.',
        'Ellie watches you work like you\'re performing surgery on a relative. When you boot it back up and the ANSI lamp flickers on the monitor, she claps her hands once, like a girl. "Keep it lit," she says. "That was the whole idea, wasn\'t it."',
        'The next Sunday at dusk you dial in, just to check. "Lamp\'s lit." You page the sysop. "Evening. Lamp\'s lit. Who\'s calling?" This time you type back: "A friend, Tom. Just a friend." It doesn\'t answer. It doesn\'t need to.',
      ],
      effects: [{ faction: 'fac.hood', add: 4 }, { stat: 'mood', add: 8 }, done],
    },
    loft_node: {
      speaker: 'narrator',
      text: [
        'Corvid comes herself. She stands in Tom Ashby\'s spare room for a full minute without speaking, and then she kneels by the card table and puts her palm flat on the humming tower like she\'s checking for a heartbeat. "I was TINYFIRE," she tells Ellie. "Fourteen. Tom let me stay on past my time limit every night."',
        'Ellie grips her hand. "You were the one who called at two in the morning. He used to wait up."',
        'By the end of the week the Lamplighter lives on a Loft machine in the Sodium Row back room, its message base mirrored three ways, its Sunday script running on schedule, a new line in the welcome screen: MAINTAINED BY FRIENDS OF TOM ASHBY. The old tower goes to Ellie\'s spare room shelf, dark and dusted, where she can see it.',
      ],
      effects: [
        { faction: 'fac.loft', add: 6 },
        { faction: 'fac.hood', add: 3 },
        { npc: 'corvid', affinity: 6 },
        { stat: 'mood', add: 8 },
        done,
      ],
    },
    harvest: {
      speaker: 'narrator',
      text: [
        'She goes to put the kettle on. The old board keeps its user file in one fat, unencrypted list, because in 1986 nobody imagined anyone would want it for anything worse than a prank call. Handles. Real names off the old registration forms. Phone numbers. Street addresses. Birthdays. Three thousand one hundred people who trusted Tom Ashby with their teenage selves.',
        { if: { npc: 'corvid', met: true }, text: 'Somewhere around line nine hundred: TINYFIRE — E. VOSS — AGE 14 — PARENTS\' LINE, DO NOT CALL AFTER 10. You keep copying.' },
        'It fits on one floppy with room to spare. When Ellie comes back with the tea tray, the disk is already in your jacket and you are admiring the ANSI lamp. "Just do whatever\'s right, dear," she says. "I trust you. Tom always trusted the young ones."',
      ],
      effects: [{ flag: 'side.bbs_harvested' }, { stat: 'stress', add: 5 }],
      next: 'harvest_end',
    },
    harvest_end: {
      speaker: 'narrator',
      text: [
        'You swap her fan for her, because you\'re not a monster, and you leave the lamp lit, because you can\'t look her in the eye and turn it off. On the walk home the floppy weighs about as much as a floppy. It feels heavier.',
        'That Sunday the board posts "Lamp\'s lit," same as always. Tom\'s script doesn\'t know anything is missing. That\'s the thing about a list: it\'s still there after you take it.',
      ],
      effects: [{ faction: 'fac.hood', add: 1 }, done],
    },
  },
}

export default defineContent({ quests: [quest], scenes: [thread, dialin] })
