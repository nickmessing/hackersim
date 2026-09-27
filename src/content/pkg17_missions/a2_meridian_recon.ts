/**
 * PKG-17 — `a2_meridian_recon` — "Dry Run" (bible §6.B, CP-B5 ⌨ TERMINAL, Act II hinge).
 *
 * Kroll's "just a look" job on Meridian Trust's rushed new online-banking rollout. This is RECON:
 * you are not draining anything, only pulling the pilot's own rollout map back to your drive so
 * Aperture (and you) can see how the new system is wired. It is the first host that actually bites
 * back — a real trace, an encrypted target file, and logs on two machines. Launched from
 * `a2_hinge` (PKG-02); auto-resolves at [Intrusion DC 15]. Failure raises heat, never ends the run.
 *
 * FICTION NOTE: invented network, invented "services", flavour-only files. No real technique.
 */
import { defineContent } from '@/engine/registry'
import type { MissionDef } from '@/engine/types'

const a2_meridian_recon: MissionDef = {
  id: 'a2_meridian_recon',
  title: 'Meridian — Dry Run',
  briefing: [
    '"Nothing you\'d go to prison for," Kroll said over the tiramisu. "A look. A map. The bank paid a consultancy a fortune to bolt online banking onto a mainframe older than you are, and I want to know where the seams are before my clients do."',
    'Get onto the staging tier, lift the rollout map — it is encrypted, so bring your cryptography — and get out quiet. Meridian will not notice a reader. It will absolutely notice a mess. Leave Kroll\'s beacon behind, and wipe the staging logs on your way out.',
  ],
  known: ['edge'],
  traceSeconds: 34,
  logHeat: 8,
  hints: [
    'The public front (10.66.1.10) is wide open — connect and `scan` to reach the app and staging tiers.',
    "Staging is guarded, so the trace starts when you connect. `bounce` the CDN relay first to buy yourself time.",
    'The rollout map is encrypted: `decrypt rollout_map.enc`, then `get` it, `put beacon.pkt`, and `wipe` staging\'s logs before you `disconnect`.',
  ],
  hosts: [
    {
      id: 'edge',
      ip: '10.66.1.10',
      name: 'MeridianOnline — Public',
      banner: 'Meridian Trust — "A Century of Trust, Now Online(ish)."  [BETA] Some features may bank differently.',
      ports: [{ port: 80, service: 'front-desk', difficulty: 0 }],
      logs: false,
      proxy: false,
      links: ['cdn', 'app'],
      files: [
        {
          name: 'index.html',
          size: 900,
          content:
            '<!-- MeridianOnline landing page -->\nWelcome to MeridianOnline! Check balances, view statements, and* pay bills\nfrom the comfort of your home computer.\n  *bill pay coming Q3. Or Q4. The vendor is "confident."\nHaving trouble? Call 1-800-MERIDIAN weekdays 9-4, or visit any branch and\nspeak to a human, which honestly is faster.',
        },
      ],
    },
    {
      id: 'cdn',
      ip: '10.66.1.44',
      name: 'Meridian Static Cache',
      banner: 'edge-cache node — serves logos and hold music, relays for whoever asks nicely',
      ports: [{ port: 8080, service: 'cache-relay', difficulty: 0 }],
      logs: false,
      proxy: true,
      files: [
        {
          name: 'assets.list',
          size: 300,
          content:
            'CACHED ASSETS\n  meridian_logo_v2_FINAL_final(2).gif\n  hold_music_loop.wav  (4 minutes; internally known as "The Loop of Sorrows")\n  under_construction.gif  (still. always. forever.)\n  a 40MB PDF of the 1998 annual report nobody asked for',
        },
      ],
    },
    {
      id: 'app',
      ip: '10.66.4.9',
      name: 'MeridianOnline App Tier',
      banner: 'APPSERVER-01  ///  vendor: NorthStar Integrations  ///  "session handling is FINE"',
      ports: [{ port: 443, service: 'session-lock', difficulty: 3 }],
      logs: true,
      proxy: false,
      links: ['stage'],
      files: [
        {
          name: 'session_notes.txt',
          size: 520,
          content:
            'INTERNAL — App team scratch notes (do not ship)\n- Timeout is 30 min. QA said 90 sec. We compromised on "whatever the demo needs."\n- The retry loop retries forever. Ops noticed when the log filled a whole tape.\n- The vendor manual is 400 pages. Nobody has read past the welcome letter.\n- TODO: remove this file before go-live. (This TODO has survived three go-lives.)',
        },
      ],
    },
    {
      id: 'stage',
      ip: '10.66.4.23',
      name: 'MeridianOnline Staging',
      banner: 'STAGING — NOT FOR PRODUCTION DATA (contains, per usual, all of production\'s data)',
      ports: [{ port: 22, service: 'admin-lock', difficulty: 4 }],
      logs: true,
      proxy: false,
      files: [
        {
          name: 'readme_staging.txt',
          size: 380,
          content:
            'STAGING ENVIRONMENT\nMirror of production, refreshed nightly, minus the parts we forget.\nThe real rollout plan (topology, cutover dates, the mainframe bridge) lives\nin rollout_map.enc — encrypted because Legal asked, using the passphrase\nLegal then emailed to nineteen people. Do not read it. Obviously.',
        },
        {
          name: 'rollout_map.enc',
          size: 2600,
          encrypted: true,
          content:
            'MERIDIANONLINE — ROLLOUT MAP (CONFIDENTIAL)\nPhase 1: read-only balances via the app tier (LIVE, held together with duct\n  tape and a merger).\nPhase 2: transfers, gated behind the old mainframe through a single bridge\n  box in the branch basement. If the bridge sneezes, the whole bank is offline.\nPhase 3: bill pay, "confident," see vendor.\nRISK LOG: the bridge box has one admin account, shared, never rotated. The\n  vendor calls this "pragmatic." Everyone who has seen it calls it a matter of time.\nThis map is exactly the thing a careful person would want a year before they needed it.',
        },
      ],
    },
  ],
  payloads: [{ name: 'beacon.pkt', size: 640, content: "Kroll's quiet little beacon. It does nothing but sit very still and remember that you were welcome here." }],
  goals: [
    { kind: 'download', host: 'stage', file: 'rollout_map.enc' },
    { kind: 'upload', host: 'stage', file: 'beacon.pkt' },
    { kind: 'wipeLogs', host: 'stage' },
  ],
}

export default defineContent({ missions: [a2_meridian_recon] })
