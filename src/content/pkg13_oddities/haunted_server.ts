/**
 * PKG-13 — `side_haunted_server` (bible §8 #37, Oddity · Terminal · Act II–III).
 *
 * The cold thread from `side_haunted_modem`: a carrier tone coming up out of the old switching hut
 * by the tracks. Inside is RINGBACK — a dead phone phreak's dead-man's switch that has spent years
 * dialing friends who will never pick up. Six days ago, something finally answered.
 *
 * This is the package's genuinely eerie one, and it plants the finale: Augie "ringback" Przybylski
 * noticed, in 1998, a quiet new trunk spliced into the copper at the old exchange.
 *
 * Owns: quest `side_haunted_server`, scenes `haunted_server_vera` / `haunted_server_hut`, and the small
 *       terminal mission `haunted_server_ringback` (PKG-17 owns only the four main-line missions; this
 *       one belongs to this quest alone).
 * Sets: `item.old_tool` (both branches — the kit is physical, on the shelf), `side.ringback.done`
 *       (objective latch), `fac.hood(+)`, `npc.dialtone` affinity (if met), small heat/stress on fail.
 * Reads: `side_haunted_modem` completion, `side.met_dialtone` (PKG-12), `fitness`/`social`.
 *
 * FICTION NOTE: the "hut", the box, its lock and its line are an invented little network of
 * make-believe machines with invented game commands. Nothing here describes a real system or
 * technique.
 */
import { defineContent } from '@/engine/registry'
import type { Effect, MissionDef, QuestDef, SceneDef } from '@/engine/types'

const done: Effect = { flag: 'side.ringback.done' }
const toolbox: Effect[] = [
  { item: 'old_tool' },
  { notify: 'Found: Phreaker\'s Toolbox — traces run slower and locks give a little faster in the terminal.', kind: 'good' },
]

const quest: QuestDef = {
  id: 'side_haunted_server',
  title: 'Ringback',
  kind: 'side',
  act: 2,
  priority: 5,
  autoStart: {
    all: [
      { quest: 'side_haunted_modem', status: 'completed' },
      { var: 'act', gte: 2 },
      { day: true, gte: 520 },
    ],
  },
  rewards: 'A dead man\'s toolbox · the first map of who else is on the copper',
  summary: [
    'Years ago, sweeping a neighbor\'s haunted cordless phone, you caught a third signal: an automated carrier tone rising out of the old switching hut by the tracks, dialing numbers that stopped answering long ago.',
    'You wrote it on the outside of the drawer so you wouldn\'t forget. You didn\'t forget. Now it\'s louder.',
  ],
  start: 'hut',
  stages: {
    hut: {
      text: 'The carrier tone from the switching hut by the tracks is back, and louder. Go find out what a dead man left running down there.',
      hint: 'Read Vera\'s mail, then visit the hut at night. Fitness, Social or a friend who knows the old phone network gets you inside; the box itself is a short terminal job (or an auto-resolve on Systems).',
      onEnter: [{ scene: 'haunted_server_vera' }],
      objectives: [
        {
          id: 'box',
          text: 'Get inside Switch Hut 7 and see what\'s still dialing',
          when: { flag: 'side.ringback.done' },
          hint: 'Go to the hut (Vera\'s mail sends you). Inside, open the terminal or auto-resolve on Systems — even a failed run gets you out with the toolbox.',
        },
      ],
    },
  },
}

const vera: SceneDef = {
  id: 'haunted_server_vera',
  channel: 'mail',
  title: 'the ghost is back (a different one)',
  from: 'Vera Ostrowski',
  start: 'mail',
  nodes: {
    mail: {
      speaker: 'Vera Ostrowski',
      text: [
        'Hello dear, Vera from the blue shutters again.',
        'I know it is not Mr. Delgado this time, because the Delgado baby is three now and sleeps like a stone, and Mr. Delgado says the radio checks were "a dark period." But the telephone has a new ghost. Not a voice. A tone. Like a kettle that learned to sing one note. Every night at 3:12, for about a minute, and then it stops as if someone hung up.',
        'My son says static. I say static does not keep a schedule. You are the only person who ever took me seriously, so I am telling you.',
        'With affection and some cookies, Vera',
      ],
      choices: [
        {
          text: 'Reply: "3:12. I know that tone. I\'ll handle it." (Go to the hut tonight.)',
          effects: [{ scene: 'haunted_server_hut', delayHours: 6 }],
        },
        {
          text: 'Reply: "Probably the new phone lines. I\'ll look into it." (Put it off, then go anyway.)',
          effects: [
            { log: 'You told Vera it was probably nothing. At 3:12 a.m. you are standing by the tracks with a flashlight anyway.', kind: 'story' },
            { scene: 'haunted_server_hut', delayHours: 40 },
          ],
        },
      ],
    },
  },
}

const hut: SceneDef = {
  id: 'haunted_server_hut',
  channel: 'dialog',
  title: 'Switch Hut 7',
  start: 'tracks',
  nodes: {
    tracks: {
      speaker: 'narrator',
      text: [
        'The switching hut squats by the freight line at the bottom of the Row, a brick box the size of a garden shed with PORT LUMEN TELEPHONE — HUT 7 stenciled over the door in paint that has been flaking since before you were born. A chain-link fence. A rail-yard floodlight that buzzes. And under the buzz, if you stand very still at 3:12 in the morning, a single held note coming through the brick.',
        { if: { flag: 'side.met_dialtone' }, text: 'You called Marge Osgood before you came. There was a long pause on her end of the line. "Hut Seven," she said at last. "That\'s Augie\'s. Augie Przybylski. Ringback, he called himself. The padlock\'s been cut since ninety-nine, love — he cut it himself. Go in the side. And be kind to it. He built it for his friends."' },
      ],
      choices: [
        {
          text: 'Marge\'s way: the side door with the cut padlock.',
          req: { flag: 'side.met_dialtone' },
          reqText: 'Requires someone who knew the old phone network (meet Marge Osgood)',
          goto: 'inside',
        },
        {
          text: '[Fitness] Over the fence, fast, before the floodlight\'s sweep comes back.',
          check: {
            skill: 'fitness',
            dc: 12,
            bonuses: [{ if: { trait: 'gym_rat' }, add: 2, label: '+2 (gym rat)' }],
            success: 'inside',
            fail: 'fence_fail',
            successEffects: [{ xp: 'fitness', add: 8 }],
            failEffects: [{ stat: 'health', add: -5 }, { xp: 'fitness', add: 3 }, { stat: 'stress', add: 2 }, { chance: 0.3, then: [{ complication: 'health' }] }],
          },
        },
        {
          text: '[Social] Talk to the yard watchman in the booth. Everybody\'s bored at 3 a.m.',
          check: {
            skill: 'social',
            dc: 12,
            success: 'watchman',
            fail: 'watchman_fail',
            successEffects: [{ xp: 'social', add: 8 }],
            failEffects: [{ money: -20 }, { stat: 'stress', add: 2 }, { flag: 'side.otis_paid_off' }],
          },
        },
      ],
    },
    fence_fail: {
      speaker: 'narrator',
      text: 'The fence has opinions. You leave a strip of jacket and some of your palm on the top wire and land in the gravel on your hip, hard, with the floodlight sliding over you like a searching hand. It slides on. Nobody comes. You limp to the hut door and find it was never locked — the padlock is hanging open, cut clean, rusted in place.',
      next: 'inside',
    },
    watchman: {
      speaker: 'narrator',
      text: [
        'The watchman is a big soft man named Otis with a thermos and a crossword. You tell him the truth, mostly — the tone, the old hut, your neighbor who can\'t sleep. He fills in 14-across and nods slowly. "The singing hut," he says. "Every night, three-twelve. I thought I was the only one heard it."',
        'He walks you over himself and holds the flashlight. At the door he stops. "I don\'t go in," he says, apologetic. "It\'s not that I believe in anything. It\'s that it sounds like it\'s waiting for somebody, and it ain\'t me."',
      ],
      next: 'inside',
    },
    watchman_fail: {
      speaker: 'narrator',
      text: 'The watchman is a big soft man named Otis who has heard every story, and yours is not the best one he\'s heard this week. He sighs, looks at the ceiling, and looks at your hand until you put a twenty in it. "Didn\'t see you," he says, going back to his crossword. "Don\'t touch the switch gear. And if it starts singing while you\'re in there, I definitely didn\'t see you."',
      next: 'inside',
    },
    inside: {
      speaker: 'narrator',
      text: [
        'Inside it smells of dust, hot solder and old paper. The walls are banks of dead switching frames, thousands of little brass contacts gone green. And in the corner, on a folding chair, wired straight into the punch-block with a neat, loving tangle of cable, sits a beige tower with a hand-lettered label: RINGBACK. A car battery on a trickle charger keeps it alive. A shelf above holds a dented lineman\'s handset, a spiral notebook, and a floppy in a sandwich bag.',
        'The monitor is on. Green text, patient as a clock:',
        'RINGBACK D.M.S. v4 — "IF I DON\'T CALL, YOU CALL." — A.P.\nOWNER CHECK-IN: OVERDUE 2,734 DAYS\nRELEASE ATTEMPTS: 9,970 — NO ANSWER\nLAST ANSWER: 6 DAYS AGO — RELEASE DELIVERED (1 OF 1)',
        'For seven years this box has been calling Augie\'s friends every night to tell them he\'s gone. None of them ever picked up. Six days ago, something did.',
      ],
      mission: {
        mission: 'haunted_server_ringback',
        success: 'archive',
        fail: 'switch_fires',
        auto: { skill: 'systems', dc: 15 },
      },
    },
    archive: {
      speaker: 'narrator',
      text: [
        'Augie\'s archive opens like a diary. He was a lineman for thirty-one years and a phone phreak for longer; he knew the Row\'s copper the way some men know a river. When his lungs started going, he built RINGBACK: if he ever stopped checking in, it would dial his old crew, one by one, and read them his notebook. His last jokes. Where he hid the good tools. How to tell the tone of a line that\'s being listened to.',
        'The crew list is a roll of the dead. DISCONNECTED \'96. MOVED TO RIDGEPORT. NO LONGER IN SERVICE. For seven years the box dialed them every night at 3:12, heard nothing, and tried again the next night. Faithful as a dog at a grave.',
        'And then the file he wrote last, in 1998, the one he locked hardest: WHO ELSE LISTENS. "Found a new splice in the cable vault at the old exchange. Clean work. Not ours. Not the phone company\'s. Fat new trunk, going up the hill toward Millgate, riding our copper like a tick. Somebody is on the line, boys. Somebody new. If you\'re reading this, you\'re the listener now. Somebody ought to listen to the listeners."',
        'Six days ago, one of the crew\'s old numbers — reassigned, rewired, folded into that fat new trunk — answered. Not a person. A machine, with a clean new handshake. And RINGBACK, faithful, read it Augie\'s whole notebook.',
      ],
      effects: [...toolbox, { faction: 'fac.hood', add: 1 }],
      next: 'after',
    },
    // Fail-forward, and the eerie one.
    switch_fires: {
      speaker: 'narrator',
      text: [
        'You push too hard. The box decides you are not Augie, and it does the only thing it was ever built to do: it tries to tell someone. The drive grinds. The screen scrolls RELEASE — RELEASE — RELEASE, and then wipes itself to black, one line at a time from the bottom up, like a man pulling a sheet over his face.',
        'On the wall, the old lineman\'s handset rings.',
        'You pick it up. Of course you pick it up. A modem shriek — clean, new, nothing like your old 33.6 — and then silence. Not dead-line silence. The other kind. The full, attentive silence of something on the far end that has stopped talking to hear you breathe. It goes on for eleven seconds. You count. Then a click.',
        'The notebook is still on the shelf. Paper doesn\'t wipe. On its last page, in pencil: WHO ELSE LISTENS — new splice, exchange cable vault, 1998, fat trunk up the hill toward Millgate. "Somebody is on the line, boys. If you\'re reading this, you\'re the listener now. Somebody ought to listen to the listeners."',
      ],
      effects: [
        ...toolbox,
        { stat: 'heat', add: 6 },
        { stat: 'stress', add: 8 },
        { flag: 'side.ringback_wiped' },
        { flag: 'side.ringback_heard_you' },
        { complication: 'hack' },
      ],
      next: 'after',
    },
    after: {
      speaker: 'narrator',
      text: [
        'You sit on the folding chair for a while with the handset in your lap. The hut ticks as it cools. Somewhere up the hill, a clean new machine now holds a dead lineman\'s last jokes, and you have his toolbox, and neither of you asked for any of it.',
        { if: { flag: 'side.ringback_heard_you' }, text: 'It also holds eleven seconds of you breathing into Augie\'s handset, from Switch Hut 7, at an hour when nobody honest is in a switch hut. The far end hung up. It did not forget.' },
      ],
      choices: [
        {
          text: 'Take the notebook to Marge. She should hear Augie\'s last jokes from a person.',
          req: { flag: 'side.met_dialtone' },
          reqText: 'Requires knowing someone from Augie\'s crew (meet Marge Osgood)',
          goto: 'marge',
        },
        {
          text: 'Let him rest. Unplug RINGBACK and close the door behind you.',
          goto: 'rest',
        },
        {
          text: 'Leave it running. Somebody ought to listen to the listeners.',
          goto: 'running',
        },
      ],
    },
    marge: {
      speaker: 'dialtone',
      text: [
        'Marge reads the notebook at her kitchen table with her reading glasses pushed up into her white hair, which means she can\'t actually see it, which means she knows it by heart already. At the joke about the supervisor and the pole-climbing belt she laughs so loud her cat leaves the room.',
        { if: { flag: 'side.ringback_wiped' }, text: 'You tell her the box wiped itself, that his voice is gone from it, that the recordings are just a black screen now. She nods slowly. "Then the paper\'s all that\'s left of him," she says. "Paper was always the part he was good at."' },
        '"He wanted to call me last," she says. "Said I\'d only cry." She wipes her eyes with a dish towel. "He was right, the old goat." Then she taps the WHO ELSE LISTENS page with one long nail, and her face goes somewhere much older and harder. "Cable vault. I knew it. I knew somebody\'d been in my vault." She looks at you. "You keep that notebook safe, love. One day you\'ll want to know which wires they forgot to disconnect."',
      ],
      effects: [{ npc: 'dialtone', affinity: 8 }, { faction: 'fac.hood', add: 3 }, { stat: 'mood', add: 6 }, done],
    },
    rest: {
      speaker: 'narrator',
      text: [
        'You find RINGBACK\'s power switch. It\'s a toggle with a strip of masking tape on it that says, in shaky ballpoint, "ONLY IF I\'M REALLY GONE." You hold your finger on it for a long moment. Then you flip it.',
        'The fan spins down. The green text fades. For the first time in seven years, nobody in Port Lumen gets a call at 3:12. Vera writes the next week to say the kettle ghost has stopped, and she slept all night, and she dreamed of her husband, and it was a nice dream.',
      ],
      effects: [{ faction: 'fac.hood', add: 2 }, { stat: 'mood', add: 5 }, done],
    },
    running: {
      speaker: 'narrator',
      text: [
        'You leave it. You swap the car battery for a fresh one from a junkyard and tape a new line under Augie\'s label: STILL LISTENING. You change the dial-out time from 3:12 to 3:13, so it stops waking Vera, and you put your own pager number at the top of the crew list.',
        { if: { flag: 'side.ringback_wiped' }, text: 'The box is empty now — the notebook drive a black screen — but the dialer still works, and the dialer was always the faithful part.' },
        'Some nights, weeks later, your pager goes off at 3:13 with a string of digits that doesn\'t mean anything to anyone but you: Augie\'s box, checking in, asking if you\'re still there. You always page back. It seems rude not to.',
      ],
      effects: [{ faction: 'fac.hood', add: 1 }, { stat: 'mood', add: 3 }, done],
    },
  },
}

const mission: MissionDef = {
  id: 'haunted_server_ringback',
  title: 'Ringback',
  briefing: [
    'You are sitting at Augie Przybylski\'s own console in Switch Hut 7. RINGBACK has been running for seven years on a car battery and loyalty. Its notebook drive is behind the old man\'s own lock, and one file on it is scrambled harder than the rest.',
    'The moment you touch the lock, RINGBACK starts counting — it is a dead-man\'s switch, and it will try to "release" again if you take too long. Get the toolbox image, read what Augie wanted his friends to know, and leave the far line alone unless you like being listened to.',
  ],
  known: ['console'],
  traceSeconds: 60,
  logHeat: 1,
  hints: [
    'You start on the console. `ls` and `cat` Augie\'s notes, then `scan` to find the notebook drive and the line it dials.',
    'The notebook drive has one easy lock: `probe`, then `crack` the port it shows.',
    '`decrypt who_else_listens.txt` before you `cat` it, and `get` the toolbox image. You do not need to touch the far line — but nobody is stopping you.',
  ],
  hosts: [
    {
      id: 'console',
      ip: '10.7.0.1',
      name: 'RINGBACK console (Hut 7)',
      banner: 'RINGBACK D.M.S. v4  ///  "IF I DON\'T CALL, YOU CALL."  ///  A.P. 1998',
      ports: [{ port: 1, service: 'hut-console', difficulty: 0 }],
      logs: false,
      proxy: false,
      links: ['notebook', 'farline'],
      files: [
        {
          name: 'read_me_first.txt',
          size: 380,
          content:
            'If you are reading this at this console you are either one of the boys or you are a nosy kid.\nEither way: hello. My name is Augie. I climbed poles for Port Lumen Telephone 31 years.\nThis box calls my crew if I stop calling it. If it is calling, I stopped.\nDon\'t be sad. Be useful. The good stuff is on the notebook drive.\nAnd wipe your feet, this is a clean hut.   -- ringback',
        },
        {
          name: 'crew.lst',
          size: 290,
          content:
            'CREW (dial nightly 03:12 if owner check-in overdue)\n  BIG LOU ........... DISCONNECTED 96\n  SPARKY ............ MOVED TO RIDGEPORT, NO FWD\n  THE REVEREND ...... NO LONGER IN SERVICE\n  HANK & DOT ........ NO LONGER IN SERVICE\n  M.O. (EXCHANGE) ... DIAL LAST. SHE\'LL ONLY CRY.\n  PAYPHONE, SODIUM ROW ... NUMBER REASSIGNED  <<< ANSWERED 6 DAYS AGO',
        },
      ],
    },
    {
      id: 'notebook',
      ip: '10.7.0.2',
      name: 'Augie\'s Notebook Drive',
      banner: 'NOTEBOOK — owner\'s lock. "Knock like you mean it."',
      ports: [{ port: 7, service: 'owners-lock', difficulty: 2 }],
      logs: false,
      proxy: false,
      files: [
        {
          name: 'toolbox.img',
          size: 1440,
          content: '[floppy image: SWITCHROOM ROUTINES, A.P. — old, strange, patient. Modern boxes will not know what to make of it.]',
        },
        {
          name: 'jokes.txt',
          size: 520,
          content:
            'THINGS I WANT READ AT MY WAKE (in order)\n1. The one about the supervisor and the pole belt.\n2. The one about the pole belt again, it gets better.\n3. Lou, you still owe me eleven dollars from the 1974 linemen\'s bowling final.\n4. Nobody ever figured out it was me who wired the Christmas lights at the exchange to blink in morse. It said MARGE RUNS THIS PLACE. It was true.',
        },
        {
          name: 'who_else_listens.txt',
          size: 610,
          encrypted: true,
          content:
            'WHO ELSE LISTENS  (1998)\nFound a new splice in the cable vault at the old exchange. Clean work. Not ours.\nNot the phone company\'s. Fat new trunk, going up the hill toward Millgate, riding our\ncopper like a tick. Tone on the Row lines changed the week it went in. Quieter. Fuller.\nThe way a room sounds when somebody is standing in it.\nSomebody is on the line, boys. Somebody new.\nIf you\'re reading this, you\'re the listener now. Somebody ought to listen to the listeners.',
        },
      ],
    },
    {
      id: 'farline',
      ip: '10.99.0.1',
      name: 'Reassigned line (answering)',
      banner: '(no banner. only a carrier. it is very patient.)',
      ports: [{ port: 3, service: 'carrier', difficulty: 5 }],
      logs: true,
      proxy: false,
      files: [
        {
          name: 'handshake.log',
          size: 90,
          content: 'RINGBACK -> [trunk]  RELEASE 1 OF 1 ... ACK\n[trunk] -> RINGBACK  ...\n[trunk] -> RINGBACK  still there?',
        },
      ],
    },
  ],
  goals: [
    { kind: 'download', host: 'notebook', file: 'toolbox.img' },
    { kind: 'read', host: 'notebook', file: 'who_else_listens.txt' },
  ],
}

export default defineContent({ quests: [quest], scenes: [vera, hut], missions: [mission] })
