/**
 * PKG-17 — `a4_copper` — "The Green Pair" (bible §6.D ⌨ TERMINAL, Act IV finale, the copper exchange).
 *
 * The last run, and the one the whole decade has been walking toward. Inside the decommissioned
 * Cannery-Millgate copper exchange, ten thousand dead phone pairs and one live splice: the seam where
 * the old switched-copper network the city forgot meets the fiber trunk that now carries all its
 * watched traffic. Old net and new net, one room, full circle. You route in through exchanges that
 * have been dark for thirty years — the ones Marge Osgood swears they "forgot to disconnect" — reach
 * the aggregator that mirrors the city, and lift the proof that the whole thing was ever running.
 *
 * Launched from `a4_copper_breach` (PKG-04) as the hands-on breach; auto-resolve is [Intrusion DC 18].
 * The lane act (publish / sell / handoff / bury / made / bonfire / none) and the finale grand check
 * live in the scene, not here — this mission just gets you onto the wire. There is no game over; the
 * scene routes a failed run to the darker cut.
 *
 * FICTION NOTE: an entirely invented network of make-believe machines and dead phone switches.
 * Every host, IP, banner, service, file and note is authored game flavour. The terminal verbs are
 * invented game commands. Nothing here describes, resembles, or could be used against any real system,
 * telephone network, or piece of infrastructure.
 */
import { defineContent } from '@/engine/registry'
import type { MissionDef } from '@/engine/types'

const a4_copper: MissionDef = {
  id: 'a4_copper',
  title: 'The Copper Exchange',
  briefing: [
    'The frame room hums the way a warm CRT hums — a hundred years of copper in the dark, and running through the middle of it a green pair that does not belong: the splice where the old exchange meets the new fiber trunk. Everything the city says, thinks, and searches goes past this room. Tonight so do you.',
    'The dead exchanges still answer if you know how to knock; route through them and the live aggregator cannot see where you really are. Reach the mirror, take the routing proof that says the whole tap was ever real, and wipe the copper behind you. Marge patched this city for thirty years. She left you the keys and the knowledge. Use both.',
  ],
  known: ['frame'],
  traceSeconds: 64,
  logHeat: 18,
  hints: [
    'The dead exchanges — Cannery (10.1.0.14) and Sodium (10.1.0.31) — are the ones "they forgot to disconnect." `scan` the frame to find them, then `bounce` both: nobody traces a route through a switch that officially does not exist.',
    'Path: frame → trunk → aggregator. The trunk is the fiber splice; crack it, `scan`, and the aggregator (the city mirror) comes into view.',
    'The mirror manifest is encrypted — `decrypt`, then `get` it. Logs live on the trunk and the aggregator; `wipe` both before you `disconnect`. Leave the copper the way Marge would: quiet.',
  ],
  hosts: [
    {
      id: 'frame',
      ip: '10.1.0.1',
      name: 'Frame Room — Local Access',
      banner: 'CANNERY-MILLGATE EXCHANGE /// frame room /// "BE KIND, THE COPPER IS OLDER THAN YOU"',
      ports: [{ port: 0, service: 'lineman-jack', difficulty: 0 }],
      logs: false,
      proxy: false,
      links: ['cannery', 'sodium', 'trunk'],
      files: [
        {
          name: 'marge_notes.txt',
          size: 420,
          content:
            'In Marge\'s cramped ballpoint, taped to the frame:\n"Whoever\'s reading this — hello, love. The green pair on rack 40, third from the top, is\ntheirs, not ours. They spliced it in without asking, the way they do everything.\nThe two old switches (Cannery, Sodium) were never truly cut; the crew ran out of\nFriday. Route through them and nobody on the new side knows which door you came in.\nRewind when you\'re done. — M.O., who patched this city when it still said please."',
        },
        {
          name: 'rack_map.txt',
          size: 300,
          content:
            'FRAME RACK MAP (as left)\n  racks 1-39 ... dead pairs, dial tones for ghosts\n  rack 40 ...... the anomaly. one green pair, warm to the touch, going somewhere new\n  rack 41+ ..... flooded in \'98, do not open, the smell never left\n  NOTE: the 3 a.m. beep is the old test board. It is not a person. Probably.',
        },
      ],
    },
    {
      id: 'cannery',
      ip: '10.1.0.14',
      name: 'Cannery Exchange (dark)',
      banner: 'CANNERY SWITCH — decommissioned 19— (the sign faded) — still, somehow, answering',
      ports: [{ port: 211, service: 'step-relay', difficulty: 3 }],
      logs: false,
      proxy: true,
      files: [
        {
          name: 'last_call.txt',
          size: 200,
          content:
            'Scrawled on the switch frame: "Last call routed through this office: a woman calling\nher son, long distance, the night the mill closed. Operator stayed on past her shift\nto keep the line up. Then they cut the funding, not the copper. We just walked away."',
        },
      ],
    },
    {
      id: 'sodium',
      ip: '10.1.0.31',
      name: 'Sodium Row Exchange (dark)',
      banner: 'SODIUM ROW SWITCH — "temporarily" out of service since before you could dial',
      ports: [{ port: 211, service: 'step-relay', difficulty: 3 }],
      logs: false,
      proxy: true,
      files: [
        {
          name: 'phreak_ledger.txt',
          size: 260,
          content:
            'A ledger in three different hands, decades apart:\n"blue box, works, do not tell"\n"they changed the tones, use the OTHER thing"\n"dialtone showed me. she showed everyone. be worthy of it"\nThe last entry is dated the year you were born.',
        },
      ],
    },
    {
      id: 'trunk',
      ip: '10.9.9.9',
      name: 'Fiber Trunk — The Splice',
      banner: 'TRUNK-AGG-INGRESS /// NorthLink managed /// "carrier-grade, carries everyone"',
      ports: [{ port: 443, service: 'splice-lock', difficulty: 6 }],
      logs: true,
      proxy: false,
      links: ['mirror'],
      files: [
        {
          name: 'splice_order.txt',
          size: 480,
          content:
            'WORK ORDER (internal, NorthLink → "client")\nInstall passive tap, Cannery-Millgate frame, rack 40. Ingest to aggregator. Mirror\nALL. Retention: indefinite. Client contact: Special Accounts (do not name in ticket).\nInstaller note: "This is a lot of copper to hang a whole city on. Asked no questions,\ngot paid, hated it. If anyone ever pulls this, the green pair is the one you want."\nSignature illegible. Below it, in different ink: "Wes was here. Wes is sorry."',
        },
      ],
    },
    {
      id: 'mirror',
      ip: '10.9.9.40',
      name: 'Aggregator — The City Mirror',
      banner: 'PARALLAX INGEST /// "we do not read the mail, we read the envelope" /// AUTHORIZED ONLY',
      ports: [{ port: 8443, service: 'ingest-console', difficulty: 8 }],
      logs: true,
      proxy: false,
      files: [
        {
          name: 'mirror_manifest.enc',
          size: 4600,
          encrypted: true,
          content:
            'PARALLAX INGEST MANIFEST (CONFIDENTIAL)\nThe whole apparatus in one file: every ISP feed, every retention window, the correlation\nrules that turn who-called-whom and who-searched-what into a risk score, and the client\nlist that rents the god-view — insurers, the Bureau, a bank, a council campaign. It does\nnot store what you said. It stores that you said it, to whom, how often, and what that\npredicts you will do next. This is the proof that it was ever real: not a rumor, not a\nhoax, but a manifest, signed, with a green pair and a work order and a whole city on the\nother end of it. Whatever you decided to do with the truth — it is in your hands now.',
        },
        {
          name: 'ingest_stats.txt',
          size: 300,
          content:
            'INGEST — live (sampled)\n  feeds: all of them\n  lines watched: the whole city, and three towns that share the trunk by accident\n  false positives: "acceptable"\n  the model\'s current favorite prediction: yours\n  uptime: since the mill became a data campus. It has never once gone down.',
        },
      ],
    },
  ],
  goals: [
    { kind: 'download', host: 'mirror', file: 'mirror_manifest.enc' },
    { kind: 'wipeLogs', host: 'trunk' },
    { kind: 'wipeLogs', host: 'mirror' },
  ],
}

export default defineContent({ missions: [a4_copper] })
