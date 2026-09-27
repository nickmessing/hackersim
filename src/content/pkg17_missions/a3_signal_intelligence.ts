/**
 * PKG-17 — `a3_signal_intelligence` — "The Bridge in the Basement" (bible §6.C, CP-C3 ⌨ TERMINAL,
 * Act III climax / the Meridian heist).
 *
 * The big multi-hop run. A year after the dry run (a2_meridian_recon) you are back on Meridian Trust,
 * and this time the target is the thing the rollout map warned about: the single, shared, never-rotated
 * bridge box in the branch basement, the one seam where the shiny new online bank still leans on a
 * mainframe older than everyone in the building. Get past the public front, through the app tier,
 * across the bridge, and onto the core ledger, then leave with the proof and no fingerprints.
 *
 * This is the mission the whole heist scene (pkg03 q8_heist `run_op`) hands you, whatever route you
 * chose (drain / sting / expose / sabotage). Auto-resolve is [Intrusion DC 18]; the heist scene owns
 * the crew/route consequences. Failure here is a setback + heat + a possible casualty (owned by the
 * scene's `loseAndCasualty`), never game over.
 *
 * FICTION NOTE: a wholly invented network. Every host, IP, banner, service, file and log line is
 * authored game flavour — bank memos, ops griping, the specific comedy of legacy finance software.
 * The terminal verbs are invented game commands. Nothing here describes or could be used against any
 * real system.
 */
import { defineContent } from '@/engine/registry'
import type { MissionDef } from '@/engine/types'

const a3_signal_intelligence: MissionDef = {
  id: 'a3_signal_intelligence',
  title: 'Meridian — The Bridge',
  briefing: [
    'A hundred and forty years of Meridian Trust, and the whole modern bank balances on one machine in a basement in a branch on Harbor Point — the bridge box, the translator between the website everyone uses and the mainframe nobody understands anymore. One admin account. Shared. Never changed. "Pragmatic," the vendor called it. Tonight it is your front door.',
    'Public front, app tier, the bridge, then the core ledger behind it. The core is guarded and it traces hard, so bounce your route before you knock. Get the ledger proof, do what you came to do, and wipe every log behind you. Meridian will survive a reader. It will not survive being caught not noticing one.',
  ],
  known: ['front'],
  traceSeconds: 70,
  logHeat: 22,
  hints: [
    'Chain your proxies first: the branch cache (10.66.1.44) and the ATM switch (10.66.9.2) are both willing relays. `bounce` both before you touch the core.',
    'The path is front → app → bridge → core. `scan` each host to reveal the next. The bridge shares one admin lock; crack it once and the core is reachable.',
    'The ledger extract is encrypted — `decrypt`, then `get`. There are logs on the app tier, the bridge AND the core; `wipe` all three before you `disconnect`, or you leave a very expensive trail.',
  ],
  hosts: [
    {
      id: 'front',
      ip: '10.66.1.10',
      name: 'MeridianOnline — Public',
      banner: 'Meridian Trust — "A Century of Trust, Now Online." Bill pay: coming soon (est. Q3, some year).',
      ports: [{ port: 80, service: 'front-desk', difficulty: 0 }],
      logs: false,
      proxy: false,
      links: ['cache', 'atm', 'app'],
      files: [
        {
          name: 'sitemap.txt',
          size: 320,
          content:
            'MERIDIANONLINE PUBLIC PATHS\n  /balances     (live)\n  /statements   (live, PDFs render sideways on some machines, "known")\n  /transfers    (LIVE NOW! runs through the branch bridge — see ops if it hangs)\n  /billpay      (soon)\n  /careers      (hiring: "COBOL maintenance, competitive salary, must be calm")',
        },
      ],
    },
    {
      id: 'cache',
      ip: '10.66.1.44',
      name: 'Meridian Static Cache',
      banner: 'edge-cache node — logos, hold music, and the 1998 annual report nobody asked for',
      ports: [{ port: 8080, service: 'cache-relay', difficulty: 0 }],
      logs: false,
      proxy: true,
      files: [
        {
          name: 'notice.txt',
          size: 180,
          content:
            'To whoever keeps using this box as a relay: we know, we do not care, please stop caching the hold music, it is four minutes long and it is called The Loop of Sorrows for a reason.',
        },
      ],
    },
    {
      id: 'atm',
      ip: '10.66.9.2',
      name: 'Meridian ATM Switch',
      banner: 'ATM-SWITCH — routes cash, gossip, and, apparently, whoever asks politely',
      ports: [{ port: 5000, service: 'switch-relay', difficulty: 2 }],
      logs: true,
      proxy: true,
      files: [
        {
          name: 'atm_notes.txt',
          size: 260,
          content:
            'ATM ops shift log\n- Machine 4 on Sodium Row dispenses in the wrong denominations after midnight. Customers love it. Do not fix.\n- The switch reboots itself every 47 hours for reasons the vendor calls "elegant."\n- If you can read this you are on the switch and you are not supposed to be. Hi.',
        },
      ],
    },
    {
      id: 'app',
      ip: '10.66.4.9',
      name: 'MeridianOnline App Tier',
      banner: 'APPSERVER-02 /// vendor: NorthStar Integrations /// "sessions are FINE now (v2)"',
      ports: [{ port: 443, service: 'session-lock', difficulty: 4 }],
      logs: true,
      proxy: false,
      links: ['atm', 'bridge'],
      files: [
        {
          name: 'app_config.txt',
          size: 560,
          content:
            'APP TIER CONFIG (do not ship, again)\n- Transfers proxy to the BRIDGE at 10.66.7.7. If the bridge is down, transfers "queue" (they do not queue, they vanish, ops is aware).\n- The bridge admin login is shared. The password is on a sticky note in the basement and also, regrettably, in this file: it is the branch address with the year backwards. Change it. (This note is two years old.)\n- Sessions v2 fixed the timeout. Sessions v2 introduced a new, more interesting bug. See v3.',
        },
      ],
    },
    {
      id: 'bridge',
      ip: '10.66.7.7',
      name: 'Branch Bridge (basement)',
      banner: 'BRIDGE-01 --- translates modern → mainframe --- "if this box sneezes, the bank has a cold"',
      ports: [{ port: 22, service: 'admin-lock', difficulty: 6 }],
      logs: true,
      proxy: false,
      links: ['core'],
      files: [
        {
          name: 'bridge_readme.txt',
          size: 480,
          content:
            'THE BRIDGE — read before touching, then touch nothing\nThis box is the only path between MeridianOnline and the CORE ledger mainframe\n(10.66.7.40). One admin account, shared by four people and, per the audit, "possibly\na fifth we cannot account for." The account has never been rotated because rotating it\nrequires a maintenance window and the last maintenance window was declined by a VP\nwho has since retired. The mainframe speaks a language three living people still read.\nBe gentle. It is load-bearing for an entire city\'s payroll.',
        },
        {
          name: 'maintenance.log',
          size: 300,
          content:
            'BRIDGE MAINTENANCE (partial)\n  last patch: never\n  last reboot: the flood\n  known issues: all of them\n  mitigation: hope, and a UPS the size of a refrigerator\n  escalation path: Wes at NorthLink, who will sigh',
        },
      ],
    },
    {
      id: 'core',
      ip: '10.66.7.40',
      name: 'CORE — Ledger Mainframe',
      banner: 'MERIDIAN CORE /// est. 1974 /// "THE LEDGER IS THE BANK" /// authorized operators ONLY',
      ports: [{ port: 1974, service: 'ledger-console', difficulty: 7 }],
      logs: true,
      proxy: false,
      files: [
        {
          name: 'ledger_extract.enc',
          size: 4200,
          encrypted: true,
          content:
            'MERIDIAN CORE LEDGER — EXTRACT (CONFIDENTIAL)\nThe whole shape of the bank, in one file: the settlement accounts, the overnight\nsweeps, and — three layers down, where the auditors stopped looking — a standing\ninstruction that routes a slice of every fee through a correspondent account whose\nbeneficial owner is a Millgate "data hygiene" firm. Aperture, on the bank\'s own books,\nin the bank\'s own hand. This is the thread the rollout map promised. Pull it and the\nwhole sweater comes apart: who paid, who knew, and how long the oldest bank in Port\nLumen has been quietly feeding the newest predator in it.',
        },
        {
          name: 'operators.txt',
          size: 240,
          content:
            'CORE OPERATOR ROSTER\n  Present: 2 (one nearing retirement, one who calls the mainframe "she")\n  Retired but still knows the passwords: 4\n  The console beeps at 3 a.m. Nobody knows why. It has always beeped at 3 a.m.\n  If you are reading this and you are not on the roster, you have gone very far indeed.',
        },
      ],
    },
  ],
  goals: [
    { kind: 'download', host: 'core', file: 'ledger_extract.enc' },
    { kind: 'wipeLogs', host: 'app' },
    { kind: 'wipeLogs', host: 'bridge' },
    { kind: 'wipeLogs', host: 'core' },
  ],
}

export default defineContent({ missions: [a3_signal_intelligence] })
