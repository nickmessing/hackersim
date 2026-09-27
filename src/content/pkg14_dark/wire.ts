/**
 * PKG-14 — Side (Dark & late-game): `side_wire_you_planted` (bible §8.39).
 *
 * The generosity of Act I comes home wearing a suit. A tool you cracked and *sold or lent onward*
 * — or one you taught byteme to spread — is now the quiet engine inside a "free" civic gadget that
 * logs who on Cannery Row talks to whom, and phones the tally home to a dull little Millgate address
 * block. You made the seed. This is the crop. Recall it, turn it on your neighbors, burn its handler,
 * or learn to live with what you started.
 *
 * Hacking is fiction: the "wire", the "recall signal" and the "collection point" are abstract game
 * flavor — dice and consequences, never real technique.
 *
 * Owns / sets: `side.wire_done` (quest completion), `side.wire_recalled`/`.wire_weaponized`/`.wire_kept`
 * (reactivity flavor), and adds to the shared counters `w.enclosure` / `w.exposure`.
 * Reads (cross-package): `a1.sold_tool` (PKG-01), `npc.byteme.used` (PKG-12), `item.old_tool` (PKG-13).
 */
import { defineContent } from '@/engine/registry'
import type { QuestDef, SceneDef } from '@/engine/types'

const quest: QuestDef = {
  id: 'side_wire_you_planted',
  title: 'The Wire You Planted',
  kind: 'side',
  act: 3,
  giver: 'dad',
  priority: 8,
  // Only if a tool actually got out of your hands (sold/lent, or taught to byteme) — not merely
  // for keeping the Act I sample (bible §8.39).
  autoStart: {
    all: [{ var: 'act', gte: 3 }, { any: [{ flag: 'a1.sold_tool' }, { flag: 'npc.byteme.used' }] }],
  },
  rewards: 'A reckoning with your own fingerprints — the Row, some heat, or a piece of the truth',
  summary:
    'Dad found a "helpful" little widget humming on the Row\'s shared line, and under its friendly skin is your handwriting. Something you let out years ago is counting the neighbors now. Decide what you owe them.',
  start: 'look',
  stages: {
    look: {
      text:
        'A free civic gadget is quietly watching Cannery Row — who calls whom, who logs on when — and reporting it to a Millgate address block you have learned to recognize. Its guts are a tool you cracked and let go of, years and a whole self ago. Decide what to do about the wire you planted.',
      onEnter: [{ scene: 'dark_wire' }],
      objectives: [
        {
          id: 'decide',
          text: 'Deal with the wire on the Row',
          when: { flag: 'side.wire_done' },
          hint: 'Open the dialog from Dad. You can quietly recall the tool ([Opsec]), turn it to your own use, live with it, or — if you kept the old phreaker\'s kit — trace it back and burn the handler.',
        },
      ],
    },
  },
}

const scene: SceneDef = {
  id: 'dark_wire',
  channel: 'dialog',
  title: 'The Wire You Planted',
  from: 'dad',
  start: 'intro',
  nodes: {
    intro: {
      speaker: 'dad',
      text: [
        'Dad has the beige tower open on the kitchen table, the one the church-basement class shares, and a screwdriver he does not need in his hand because holding it helps him think. "Whole Row got these," he says, and nudges a little grey box the size of a deck of cards, blinking green. "Free. City handed them out. \'Neighbor Net.\' Ruth loves it — tells her when her grandkids sign on."',
        '"Only, Robert Tan raised no fool." He taps the box. "It calls somewhere every night. Same time. 3:12. I figured you\'d know what that means better than the pamphlet does."',
      ],
      next: 'recognize',
    },
    recognize: {
      speaker: 'narrator',
      text: [
        'You open it up, the way he taught you to open radios. Under the cheerful "Neighbor Net" wrapper is a distribution stub you would know in your sleep — because you wrote the joke in the header. A little easter-egg string, tucked where nobody bothers to look: BORROWED, NOT STOLEN — and your old handle, spelled the way you spelled it at eighteen.',
        {
          if: { flag: 'a1.sold_tool' },
          text: 'You cracked this thing\'s ancestor for forty dollars and a stranger\'s gratitude, and then you sold the copy on, because it was clean and it was free and what was the harm. It was free. That was the harm. Free things spread.',
        },
        {
          if: { all: [{ flag: 'npc.byteme.used' }, { not: { flag: 'a1.sold_tool' } }] },
          text: 'You never sold it. You taught it — to a sixteen-year-old who ran everything the forum swore was undetectable, and who spread this one the way kids spread a good cheat code: fast, wide, and to everyone. He learned it from you. He never says no to you.',
        },
        'The box counts the Row. Every green blink is somebody\'s grandmother phoning her grandkids, filed, timestamped, and sent to a company that sells the shape of a life. You built the lock. Somebody else copied the key.',
      ],
      next: 'choice',
    },
    choice: {
      speaker: 'player',
      text: 'Dad watches you the way he used to watch the mill foreman: waiting to see whether the thing in front of you is worth fixing, and whether you\'re the one who\'ll do it.',
      choices: [
        {
          text: 'Quietly recall it. Push the old kill-string, pull your work back off the Row.',
          tag: '[Opsec 16]',
          check: {
            skill: 'opsec',
            dc: 16,
            success: 'recall_ok',
            fail: 'recall_flagged',
            bonuses: [
              { if: { flag: 'a1.cautious' }, add: 1, label: '+1 (you always did lurk before you leapt)' },
            ],
            successEffects: [
              { faction: 'fac.hood', add: 8 },
              { stat: 'cred', add: 3 },
              { flag: 'side.wire_recalled' },
              { flag: 'side.wire_done' },
            ],
            failEffects: [
              { faction: 'fac.hood', add: 4 },
              { stat: 'heat', add: 12 },
              { stat: 'stress', add: 6 },
              { var: 'w.exposure', add: 1 },
              { flag: 'side.wire_recalled' },
              { flag: 'side.wire_done' },
              { chance: 0.3, then: [{ complication: 'legal' }] },
            ],
          },
        },
        {
          text: 'Don\'t kill it — keep it. A wire in your own neighborhood is leverage nobody knows you hold.',
          tag: '[Weaponize]',
          effects: [
            { faction: 'fac.hood', add: -10 },
            { stat: 'cred', add: 5 },
            { money: 800 },
            { var: 'w.enclosure', add: 1 },
            { flag: 'side.wire_weaponized' },
            { flag: 'side.wire_done' },
          ],
          goto: 'weaponize',
        },
        {
          text: '"Leave it, Dad. It\'s free. People like it." Close the box. Say nothing.',
          tag: '[Live with it]',
          effects: [
            { faction: 'fac.hood', add: -5 },
            { stat: 'mood', add: -6 },
            { var: 'w.enclosure', add: 1 },
            { flag: 'side.wire_kept' },
            { flag: 'side.wire_done' },
          ],
          goto: 'live_with_it',
        },
        {
          text: 'Trace it home through the phreaker\'s kit and burn the handler off the Row for good.',
          tag: '[Networking 18]',
          req: { item: 'old_tool' },
          reqText: 'Requires the Phreaker\'s Toolbox',
          check: {
            skill: 'networking',
            dc: 18,
            success: 'burn_ok',
            fail: 'burn_fail',
            successEffects: [
              { faction: 'fac.hood', add: 10 },
              { stat: 'cred', add: 5 },
              { stat: 'heat', add: 10 },
              { var: 'w.exposure', add: 2 },
              { flag: 'side.wire_recalled' },
              { flag: 'side.wire_done' },
            ],
            failEffects: [
              { stat: 'heat', add: 20 },
              { stat: 'stress', add: 8 },
              { var: 'w.exposure', add: 1 },
              { var: 'w.enclosure', add: 1 },
              { flag: 'side.wire_done' },
              { flag: 'side.wire_burn_flagged' },
              { trait: 'pkg14_dark_watched' },
              { chance: 0.3, then: [{ complication: 'legal' }] },
            ],
          },
        },
      ],
    },
    recall_ok: {
      speaker: 'narrator',
      text: [
        'The old kill-string still works, because you wrote it to, back when you thought like a locksmith and not a burglar. One by one the little grey boxes on the Row forget how to phone home. Ruth\'s still tells her when the grandkids log on. It just stops telling anyone else.',
        'Dad closes the tower and pats it, the way he pats a car that started on a cold morning. "Good," he says. "That\'s the job." He doesn\'t ask how the thing got there. You\'re grateful, and you hate that you\'re grateful.',
      ],
    },
    recall_flagged: {
      speaker: 'narrator',
      text: [
        'You get the boxes back — the Row is clean — but the recall itself is a signal, and signals are exactly what somebody in Millgate is paid to notice. A whole neighborhood\'s worth of gadgets going dark on the same night is a very loud kind of quiet.',
        'You come away hotter than you went in, and one thing warmer: you saw where the tally was going before you cut the line. You know the address now. Dad reads your face. "You fixed it," he says. "But it cost you." He is right, and he always is.',
      ],
    },
    weaponize: {
      speaker: 'narrator',
      text: [
        'You don\'t kill it. You adopt it. A quiet fork of the feed comes to you now — who\'s home, who\'s out, who called a lawyer, who called a man they shouldn\'t. It is astonishing, and it is worth money, and every green blink is a neighbor who waved at you this morning.',
        'Dad waits for you to say you\'re shutting it down. You tell him you handled it. It is not, technically, a lie. He nods slowly and goes to fix a hinge that isn\'t squeaking, and does not offer you dinner, and you both pretend not to notice which of those is the message.',
      ],
    },
    live_with_it: {
      speaker: 'narrator',
      text: [
        'You put the lid back on. It\'s free, people like it, and you are so tired of being the one who ruins free things people like. The Row goes on being counted, and you go on knowing, and knowing turns out to weigh about the same as doing.',
        '"Okay," Dad says, when you tell him it\'s nothing to worry about. He puts the screwdriver back in the drawer, in its slot, where it lives. "Okay." He is a man who has spent his life fixing things that could be fixed, and he can tell, now, that this was one of them, and that you left it.',
      ],
    },
    burn_ok: {
      speaker: 'narrator',
      text: [
        'The phreaker\'s kit is older than the network it\'s hunting through, and that\'s the trick of it — the modern collection rig doesn\'t recognize a lineman\'s handset and a floppy of switch-room folklore as a threat, so it lets you walk right up the copper to the handler. You find the desk the tally lands on. Then you make that desk useless: the feed from the whole Row turns to noise, permanently, and the account it fed goes cold.',
        'It costs you heat — you were, briefly, standing in a place you had no business standing — but the Row stops being merchandise, and somebody in Millgate spends tomorrow explaining to their boss why the Cannery went dark. Dad turns the dead grey box over in his hands like a spent shell. "Marge\'s kit," he says, recognizing the old routines\' fingerprints. "Course it was. Nobody younger would\'ve known where the wires still went."',
      ],
    },
    burn_fail: {
      speaker: 'narrator',
      text: [
        'You get most of the way up the copper before the rig notices something walking where nothing should walk. It doesn\'t catch you — old routines are good for that — but it wakes up, and it flags the whole approach, and now your handle is a very warm entry on somebody\'s morning report.',
        'The wire is still there. So is your name, now, one row above it. You did map the collection point on the way in, for whatever that\'s worth; it\'s worth a headache and a sleepless week. Dad sees you sweating and doesn\'t comment, which is the kindest thing he could possibly do.',
      ],
    },
  },
}

export default defineContent({
  quests: [quest],
  scenes: [scene],
})
