/**
 * PKG-17 — Terminal Missions. `a1_library` — "The Library Card" (bible §6.A ⌨ TERMINAL, Act I).
 *
 * The gentle tutorial run: clear byteme's late-fee record off the LSU library's ancient circulation
 * server. Trivial, warm, comic. It teaches the whole terminal loop in one sitting — connect, scan,
 * probe, crack a single easy lock, ls/cat, rm, wipe, disconnect — with a forgiving trace and almost
 * no heat. Launched (optionally) from an Act I scene owned by PKG-01/PKG-13; auto-resolves at
 * [Intrusion DC 8].
 *
 * FICTION NOTE (applies to every file in this package): a MissionDef is a small INVENTED network of
 * make-believe machines. Every host, IP, banner, "service" name, file and log line here is authored
 * game flavour — memos, notices, jokes — not a description of any real system or technique. The
 * terminal's verbs are invented game commands (see src/ui/terminal/sim.ts). Nothing here teaches, or
 * could be used against, anything real.
 */
import { defineContent } from '@/engine/registry'
import type { MissionDef, SceneDef, TriggerDef } from '@/engine/types'

const a1_library: MissionDef = {
  id: 'a1_library',
  title: 'The Library Card',
  briefing: [
    "byteme returned a stack of programming books to the LSU library four months late and now owes more in fines than the books cost new. He is sixteen, broke, and has convinced himself a hold on his card is the end of his life.",
    'The circulation server is a museum piece nobody has touched since before the modem was invented, or so it feels. Get in, make the fine go away, tidy up after yourself, and get out. This is your first real run — take your time and read the tips on the left.',
  ],
  known: ['catalog'],
  traceSeconds: 55,
  logHeat: 2,
  hints: [
    'Start with `connect 10.20.4.7` (the public catalog), then `scan` to find the machine behind it.',
    'On a locked host, `probe` shows the service ports; `crack <port>` breaks the one lock here.',
    'With a shell, `ls` to see the files, `cat` to read them, `rm` to delete the fine, then `wipe` the logs before you `disconnect`.',
  ],
  hosts: [
    {
      id: 'catalog',
      ip: '10.20.4.7',
      name: 'Lumen Public Catalog',
      banner: 'HOLLERITH ONLINE CATALOG — "Find a book, make a friend." Please REWIND after use.',
      ports: [{ port: 79, service: 'card-catalog', difficulty: 0 }],
      logs: false,
      proxy: false,
      links: ['circ'],
      files: [
        {
          name: 'welcome.txt',
          size: 210,
          content:
            'WELCOME TO THE LUMEN STATE LIBRARY CATALOG\n\nHours: Mon-Thu 8-9, Fri 8-6, Sat 10-4, closed Sundays and the second\nTuesday of every month for reasons lost to history.\n\nThe overdue-fines desk is handled by CIRCULATION, on the machine in the\nback office. Ask for Mrs. Halvorsen. Do not ask for the WiFi. There is no WiFi.',
        },
      ],
    },
    {
      id: 'circ',
      ip: '10.20.4.31',
      name: 'LSU Circulation Desk',
      banner: 'CIRC-SYS v3.1  ///  BE KIND, REWIND  ///  unauthorized users will be gently disappointed',
      ports: [{ port: 23, service: 'circ-desk', difficulty: 1 }],
      logs: true,
      proxy: false,
      files: [
        {
          name: 'patrons.idx',
          size: 4400,
          content:
            'PATRON INDEX (partial)\n  #40118  Alvarez, R.       — 0 holds, 1 overdue (a jigsaw puzzle, 3 pieces missing)\n  #41192  Pham, K.          — 1 HOLD (unpaid fines), 4 overdue\n  #41207  Tan, K.           — 0 holds, model patron, reads too fast\n  ...(313 more patrons, most of whom have simply forgotten this library exists)',
        },
        {
          name: 'fine_pham_k.rec',
          size: 320,
          content:
            'FINE RECORD — Patron #41192, Pham, Kevin\n  "The Little Book of Big Loops" .......... 118 days @ $0.25 = $29.50\n  "Networks for the Nervous" (2 copies!?) ........... 118 days @ $0.25 = $59.00\n  "Modems and You, Vol. II" ..................... 121 days @ $0.25 = $30.25\n  TOTAL OWED: $118.75   STATUS: CARD SUSPENDED\n  Note from desk: "Kid clearly reads them. Waive it? — M.H." (waiver never processed)',
        },
        {
          name: 'desk_notes.txt',
          size: 260,
          content:
            "Mrs. Halvorsen's desk notes:\n- The date stamp is stuck on the 14th again. Hit it with the ruler.\n- If the fine drawer jams, it's the ghost. Say thank you and try again.\n- Overdue notices go out Fridays. Half of them come back 'no such address.'\n- Someone keeps re-shelving the cookbooks under FICTION. They are not wrong.",
        },
      ],
    },
  ],
  goals: [
    { kind: 'delete', host: 'circ', file: 'fine_pham_k.rec' },
    { kind: 'wipeLogs', host: 'circ' },
  ],
}

/** byteme's plea — the only launcher for the tutorial run. */
const libraryChat: SceneDef = {
  id: 'm_library_card',
  channel: 'chat',
  title: 'byteme',
  from: 'byteme',
  start: 'ask',
  expiresDays: 10,
  onExpire: [{ npc: 'byteme', affinity: -2 }, { log: 'byteme paid his library fines with lawn-mowing money. He did not mention it again.', kind: 'info' }],
  nodes: {
    ask: {
      speaker: 'byteme',
      text: [
        'ok so. hypothetically. if a guy owed the lsu library $118.75',
        'and they suspended his card. and the card is his whole life',
        'could a different guy, who is very smart and cool, make that number be zero',
        'i would owe u forever. i would carry ur bag at the back room. i dont know what that means but i would',
      ],
      choices: [
        { text: 'lol fine. send me what you know about their system.', goto: 'brief' },
        { text: 'kid, just pay the fine. mow a lawn.', goto: 'nope' },
      ],
    },
    brief: {
      speaker: 'byteme',
      text: [
        'YES. ok the catalog is public, anyone can dial it. the fines live on some ancient desk machine behind it',
        'mrs halvorsen hits it with a ruler when it freezes. thats all the security intel i have',
        'dont get caught. or do and say it was me. no wait dont say it was me',
      ],
      mission: { mission: 'a1_library', success: 'won', fail: 'lost', auto: { skill: 'intrusion', dc: 8 } },
    },
    won: {
      speaker: 'byteme',
      text: [
        'DUDE',
        'i just checked out 3 books. THREE. the lady said "welcome back, kevin" like nothing happened',
        'ur a legend. im telling everyone. im telling no one. im telling everyone in a vague way',
      ],
      effects: [
        { npc: 'byteme', affinity: 6 },
        { stat: 'cred', add: 3 },
        { stat: 'heat', add: 1 },
        { xp: 'intrusion', add: 6 },
      ],
    },
    lost: {
      speaker: 'byteme',
      text: [
        'hey so the fine is still there but ALSO now theres a sign on the desk that says "we know it was a computer"',
        'nobody knows it was u. they think it was the ghost. mrs halvorsen left it a cookie',
        'its ok. i mowed like 4 lawns. thx for trying tho :)',
      ],
      effects: [{ npc: 'byteme', affinity: 2 }, { xp: 'intrusion', add: 3 }],
    },
    nope: {
      speaker: 'byteme',
      text: ['ugh. FINE. responsible. gross', 'if i die of lawn mowing its on u'],
      effects: [{ npc: 'byteme', affinity: -1 }],
    },
  },
}

const libraryTrigger: TriggerDef = {
  id: 'trig_m_library_card',
  when: { all: [{ var: 'act', eq: 1 }, { npc: 'byteme', met: true }, { day: true, gte: 20 }] },
  atHour: 16,
  effects: [{ scene: 'm_library_card' }],
}

export default defineContent({ missions: [a1_library], scenes: [libraryChat], triggers: [libraryTrigger] })
