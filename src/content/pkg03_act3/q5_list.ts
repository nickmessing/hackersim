/**
 * PKG-03 — Act III main, beat 5: `main_a3_q5_the_list` (bible §6.C).
 *
 * You pull PARALLAX's persons-of-interest list and warn only a handful. The epilogue remembers who
 * you saved. Fate updates for the swept live HERE (not in `news.list_sweep`), and are only applied
 * where the target's closed fate set allows a "swept" value (the two strangers and Ruth Alvarez);
 * inner-circle names you fail to warn get a message, not an illegal fate.
 *
 * The warn stage is timed and sets `sys.no_raids` for its duration (cleared on resolve) so a raid
 * can't eat the window. A failed `get_list` roll still hands you the list — shorter fuse, one name
 * unknown — so the chain never breaks.
 *
 * That fail is a different story, not a slap (REDESIGN_V2 §D): the trip scores you (scar
 * `pkg03_act3_parallax_scored`, expenses up for good), sets `a3.list_tripped` so every warning you
 * place costs heat, and the redacted name is a real person — the ER tech, unwarnable, whose fate
 * lands after the sweep (`a3.redacted_swept`, read by PKG-04's list epilogue).
 *
 * Cross-package ids referenced by exact bible id (owners in parentheses):
 *   npcs list_activist / grandma_ruth are PKG-00; `w.list_saved` init is PKG-00.
 */
import { defineContent } from '@/engine/registry'
import type { Effect } from '@/engine/types'

/**
 * After a botched pull PARALLAX is watching for you: every warning you place runs a little hotter.
 * Appended to each warn choice.
 */
const trippedCost: Effect = {
  if: { flag: 'a3.list_tripped' },
  then: [{ stat: 'heat', add: 3 }],
}

/** Apply concrete fates to anyone still unwarned, then clean up the beat and continue. */
const sweepAndResolve: Effect[] = [
  // The night-shift ER tech. On a partial list he was the redacted name — you never had a chance.
  {
    if: { not: { flag: 'a3.warned_stranger2' } },
    then: [
      {
        if: { flag: 'a3.list_partial' },
        then: [
          { flag: 'a3.redacted_swept' },
          { notify: 'The redacted name surfaces three weeks later, in a Herald brief: Tomas Ruiz, night-shift ER tech at Harbor General, detained after "irregularities in patient-record access." He had been flagging insurer denials. You never got to read his name in time.', kind: 'bad' },
        ],
        else: [{ notify: 'A name you never reached: the ER tech from the list lost his job the week of the sweep. Harbor General cited "a routine records audit."', kind: 'bad' }],
      },
    ],
  },
  // Nadia Bell — detained if things aren't too dark yet, disappeared if the enclosure has set in.
  {
    if: { not: { flag: 'npc.list_activist.warned' } },
    then: [
      {
        if: { var: 'w.enclosure', gte: 4 },
        then: [
          { npc: 'list_activist', fate: 'disappeared' },
          { notify: 'A name you never reached: Nadia Bell is missing. Her bike is still chained outside the Millgate library.', kind: 'bad' },
        ],
        else: [
          { npc: 'list_activist', fate: 'detained' },
          { notify: 'A name you never reached: Nadia Bell was detained in the sweep, and released nineteen days later, quieter.', kind: 'bad' },
        ],
      },
    ],
  },
  // Ruth Alvarez — if she was on your list and you didn't warn her, the app just keeps watching.
  {
    if: { all: [{ npc: 'grandma_ruth', met: true }, { not: { flag: 'npc.grandma_ruth.warned' } }, { flag: 'a3.ruth_on_list' }] },
    then: [{ npc: 'grandma_ruth', fate: 'spied_on' }],
  },
  { clearFlag: 'sys.no_raids' },
  { flag: 'a3.the_list_done' },
  { var: 'w.exposure', add: 2 },
  { quest: 'main_a3_q6_family_crosshairs', start: true },
]

export default defineContent({
  quests: [
    {
      id: 'main_a3_q5_the_list',
      title: 'The List',
      kind: 'main',
      act: 3,
      priority: 30,
      summary:
        "PARALLAX keeps a list of people it has decided are risks — activists, elders, a nurse, a kid, maybe someone you love. You can get it. You cannot save everyone on it. Choose who, and be quick.",
      rewards: 'The names you reached — remembered to the end',
      start: 'wait',
      stages: {
        wait: {
          text: 'The Oracle hinted at a list. Not a target list — a *risk* list. People PARALLAX has quietly flagged. If it exists, you want it before anyone acts on it.',
          hint: 'A little time, then the way in opens.',
          objectives: [
            { id: 'wait', text: 'Find a way to the list', when: { day: true, gte: 1710 }, hint: 'Keep at it. The route to the list surfaces on its own.' },
          ],
          onComplete: [{ scene: 'a3_list_get' }],
          next: 'get_list',
        },
        get_list: {
          text: "Pull the persons-of-interest list out of PARALLAX. It won't be sitting in the open; it never is.",
          hint: 'One clean Intrusion roll gets you the full list and a two-week window. Botch it and the Oracle slips you a partial one — shorter fuse, one name blacked out, every warning hotter, and PARALLAX scores you too.',
          objectives: [
            { id: 'got', text: 'Obtain the list', when: { flag: 'a3.have_list' }, hint: 'Follow the scene. Success or failure, you walk away with names.' },
          ],
          onComplete: [{ var: 'w.exposure', add: 2 }],
          next: [
            { if: { flag: 'a3.list_partial' }, stage: 'warn_short' },
            { stage: 'warn' },
          ],
        },
        warn: {
          text: 'You have the whole list and fourteen days. Warning someone costs time and a careful touch — tip PARALLAX and you make it worse. You cannot reach them all. Decide who.',
          hint: 'Open the warning scene and reach as many as you can before the clock runs out. Family is cheap to reach; strangers cost you days. Anyone you miss gets swept.',
          onEnter: [{ flag: 'sys.no_raids' }, { scene: 'a3_list' }],
          timeLimitDays: 14,
          objectives: [
            { id: 'warned', text: 'Warn who you can, then send it', when: { flag: 'a3.list_warned' }, hint: 'Warn names in the scene, then choose "That\'s everyone I can reach."' },
          ],
          onTimeout: { effects: [{ flag: 'a3.list_ignored' }, { notify: 'The window closed. The names you never reached are on their own now.', kind: 'bad' }], stage: 'resolve' },
          next: 'resolve',
        },
        warn_short: {
          text: 'The partial list, and only a week. One name is blacked out — you will never know who you couldn\'t have saved. Move.',
          hint: 'Same as the full window, but faster and incomplete. Reach who you can, then send it.',
          onEnter: [{ flag: 'sys.no_raids' }, { scene: 'a3_list' }],
          timeLimitDays: 7,
          objectives: [
            { id: 'warned', text: 'Warn who you can, then send it', when: { flag: 'a3.list_warned' }, hint: 'Warn names in the scene, then choose "That\'s everyone I can reach."' },
          ],
          onTimeout: { effects: [{ flag: 'a3.list_ignored' }, { notify: 'The window closed. The names you never reached are on their own now.', kind: 'bad' }], stage: 'resolve' },
          next: 'resolve',
        },
        resolve: {
          text: 'The list is spent, one way or another. The city will feel the shape of who you reached and who you didn\'t.',
          hint: 'The consequences land on their own.',
          onEnter: sweepAndResolve,
          objectives: [
            { id: 'done', text: 'The list is settled', when: { always: true }, hidden: true },
          ],
        },
      },
    },
  ],
  scenes: [
    {
      id: 'a3_list_get',
      channel: 'dialog',
      title: 'Persons of Interest',
      start: 'open',
      nodes: {
        open: {
          speaker: 'narrator',
          text: [
            'PARALLAX keeps its risk list where it keeps everything valuable: behind a wall of dull, expensive competence. No thrill to it. Just a login page held together with duct tape and a budget.',
            'Get in clean and you get the whole thing, with time to act. Get sloppy and you get whatever the Oracle can throw over the wall after you trip it.',
          ],
          choices: [
            {
              tag: '[Intrusion DC 17]',
              text: 'Go in quiet and pull the full list.',
              check: {
                skill: 'intrusion',
                dc: 17,
                bonuses: [{ if: { item: 'kroll_recording' }, add: 2, label: '+2 (you know how they think)' }],
                success: 'clean',
                fail: 'partial',
              },
            },
          ],
        },
        clean: {
          speaker: 'narrator',
          text: [
            'You\'re in and out like weather. The full list scrolls past — six, seven names you know, and a scatter of strangers whose only crime is being legible to a machine.',
            'Fourteen days before the sweep, by the timestamps. Enough to save a few. Not enough to save them all.',
          ],
          effects: [{ flag: 'a3.have_list' }],
        },
        partial: {
          speaker: 'oracle',
          text: [
            'You trip something on the way in, and the wall wakes up. You bail — but a message is already waiting when you land, from a sender with no address.',
            '"Messy. I pulled what I could before they noticed you noticing. It\'s partial — one name\'s redacted, even I can\'t read it — and you\'ve got a week, not two. Move faster than you\'d like."',
            '"One more thing. When you tripped the wall, it did what it was built to do: it scored you. You\'re in the risk tables now, with everyone else on that list. Expect your insurance to find you interesting. And every warning you send from here, they\'ll be listening for."',
          ],
          effects: [
            { flag: 'a3.have_list' },
            { flag: 'a3.list_partial' },
            // The machine noticed you noticing it, and did what it does: it scored you.
            { flag: 'a3.list_tripped' },
            { trait: 'pkg03_act3_parallax_scored' },
            { stat: 'heat', add: 10 },
          ],
        },
      },
    },
    {
      id: 'a3_list',
      channel: 'dialog',
      title: 'Who Do You Warn?',
      start: 'hub',
      nodes: {
        hub: {
          speaker: 'narrator',
          text: [
            'The names sit on your screen like a seating chart for a disaster. Each warning is a phone call from a payphone, a note left where only they will look, a day you don\'t get back — and a chance, if you\'re careless, of tipping the very thing you\'re warning them about.',
            'Reach who you can. Then send it, and live with the rest.',
          ],
          effects: [{ flag: 'a3.ruth_on_list', set: true }],
          choices: [
            {
              text: 'Warn Nadia Bell — a tenant organizer you\'ve never met, flagged for reading leases out loud.',
              if: { not: { flag: 'npc.list_activist.warned' } },
              effects: [
                { npc: 'list_activist', met: true, fate: 'warned' },
                { flag: 'npc.list_activist.warned' },
                { var: 'w.list_saved', add: 1 },
                { log: 'You warned Nadia Bell. She moved her meetings to a church hall and changed her number.', kind: 'good' },
                trippedCost,
              ],
              goto: 'hub',
            },
            {
              text: "Warn the night-shift ER tech — his file is thicker than a nurse's file should be.",
              if: { all: [{ not: { flag: 'a3.warned_stranger2' } }, { not: { flag: 'a3.list_partial' } }] },
              effects: [
                { flag: 'a3.warned_stranger2' },
                { var: 'w.list_saved', add: 1 },
                { log: 'You warned the ER tech. He took a sudden vacation and thanked a stranger he never saw.', kind: 'good' },
                trippedCost,
              ],
              goto: 'hub',
            },
            {
              tag: '[Redacted]',
              text: '██████ ████ — a name the Oracle couldn\'t read. Night shift, somewhere. That is all you have.',
              if: { flag: 'a3.list_partial' },
              req: { never: true },
              reqText: 'You botched the pull. This name is lost to you.',
              goto: 'hub',
            },
            {
              text: 'Warn Ruth Alvarez — Grandma Ruth, flagged because her cleaned-up PC still talks to Millgate.',
              if: { all: [{ npc: 'grandma_ruth', met: true }, { not: { flag: 'npc.grandma_ruth.warned' } }] },
              effects: [
                { npc: 'grandma_ruth', fate: 'warned' },
                { flag: 'npc.grandma_ruth.warned' },
                { var: 'w.list_saved', add: 1 },
                { log: 'You warned Ruth. She covered the webcam with a church bulletin and fed you until you couldn\'t stand.', kind: 'good' },
                trippedCost,
              ],
              goto: 'hub',
            },
            {
              text: 'Warn Kim — your sister is on it, for being related to you.',
              if: { all: [{ npc: 'kim', met: true }, { not: { flag: 'npc.kim.warned' } }] },
              effects: [
                { flag: 'npc.kim.warned' },
                { npc: 'kim', affinity: 6 },
                { var: 'w.list_saved', add: 1 },
                { log: 'You warned Kim. She rolled her eyes, then quietly changed every password she owns.', kind: 'good' },
                trippedCost,
              ],
              goto: 'hub',
            },
            {
              text: 'Warn Deadline — the old cautionary tale, still flagged from \'94.',
              if: { all: [{ npc: 'deadline', met: true }, { npc: 'deadline', fateNot: 'passed' }, { not: { flag: 'npc.deadline.warned' } }] },
              effects: [
                { flag: 'npc.deadline.warned' },
                { var: 'w.list_saved', add: 1 },
                { log: 'You warned Deadline. "Told you," he said, and backed up his life in triplicate. Again.', kind: 'good' },
                trippedCost,
              ],
              goto: 'hub',
            },
            {
              text: 'Warn byteme — the kid never stood a chance of not being on a list.',
              if: { all: [{ npc: 'byteme', met: true }, { npc: 'byteme', fateNot: ['dead', 'arrested_young'] }, { not: { flag: 'npc.byteme.warned' } }] },
              effects: [
                { flag: 'npc.byteme.warned' },
                { var: 'w.list_saved', add: 1 },
                { log: 'You warned byteme. "im basically a ghost now," he typed, and for once he was careful about it.', kind: 'good' },
                trippedCost,
              ],
              goto: 'hub',
            },
            {
              tag: '[Send]',
              text: "That's everyone I can reach. Send it, and stop.",
              effects: [{ flag: 'a3.list_warned' }],
              goto: 'sent',
            },
          ],
        },
        sent: {
          speaker: 'narrator',
          text: [
            'You stop. There are always more names. There is never more time.',
            { if: { var: 'w.list_saved', gte: 4 }, text: 'You reached a lot of them. It won\'t feel like enough. It never does. But church halls will fill instead of cells, because of you.' },
            { if: { var: 'w.list_saved', lte: 1 }, text: 'You barely reached anyone. You tell yourself the list was impossible. The list was impossible. You still made a choice inside it.' },
            { if: { flag: 'a3.list_partial' }, text: 'And one name you never got to choose at all: a black bar where a person should be. You will find out who it was. That is the worst part of a list — eventually, you always find out.' },
          ],
        },
      },
    },
  ],
})
