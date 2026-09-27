import { dayOf } from '@/engine/calendar'
import { defineContent } from '@/engine/registry'

/**
 * ECON — Software & tools (all product names invented). Tools improve contract rolls, slow the
 * trace, reduce heat, or speed the terminal. Black-market gear is gated behind underground
 * reputation (`cred`) and is `hidden` so a raid can't seize it — you keep it stashed.
 * Nothing here describes real technique; these are game objects with dice-modifying stats.
 */
export default defineContent({
  items: [
    // ── Off-the-shelf & shareware (raid-seizable) ───────────────────────────
    {
      id: 'sw_portscan',
      name: 'LumenScan',
      category: 'software',
      shop: 'software',
      price: 120,
      tier: 1,
      desc: 'A tidy little port scanner with a progress bar that lies to you cheerfully. Tells you which doors exist before you knock.',
      mods: [{ key: 'hack.roll', add: 1 }],
    },
    {
      id: 'sw_debugger',
      name: 'DisAsm Pro',
      category: 'software',
      shop: 'software',
      price: 130,
      tier: 1,
      desc: 'A disassembler and debugger that turns a program inside-out and lays its guts on the table. Half the shareware in town falls over the second you open it in here.',
      mods: [
        { key: 'xp.programming', mult: 1.15 },
        { key: 'crack.speed', mult: 1.2 },
      ],
    },
    {
      id: 'sw_cracker',
      name: 'KeyForge',
      category: 'software',
      shop: 'software',
      price: 200,
      tier: 2,
      desc: "The scene's favorite key generator toolkit. Comes with a chiptune that plays while it works, because of course it does.",
      mods: [
        { key: 'crack.speed', mult: 1.3 },
        { key: 'hack.roll', add: 1 },
      ],
    },
    {
      id: 'sw_sniffer',
      name: 'PacketPeek',
      category: 'software',
      shop: 'software',
      price: 140,
      tier: 2,
      desc: 'Watches the wire and prints everything that crosses it, most of it boring, some of it not. Reads a network like a gossip reads a room.',
      mods: [
        { key: 'hack.roll', add: 1 },
        { key: 'trace', mult: 1.15 },
      ],
    },
    {
      id: 'sw_proxy',
      name: 'FogRelay',
      category: 'tool',
      shop: 'software',
      price: 180,
      tier: 2,
      desc: 'Bounces your connection through a chain of tired volunteer machines in cities you\'ll never visit. Slow, and gloriously hard to follow home.',
      mods: [
        { key: 'trace', mult: 1.3 },
        { key: 'hack.heat', mult: 0.93 },
      ],
    },
    {
      id: 'sw_logcleaner',
      name: 'WipeWell',
      category: 'tool',
      shop: 'software',
      price: 150,
      tier: 2,
      desc: 'Tidies up after you the way a good guest does the dishes. Leaves a room looking like nobody was ever in it.',
      mods: [
        { key: 'heat.decay', add: 0.12 },
        { key: 'hack.heat', mult: 0.95 },
      ],
    },
    {
      id: 'sw_crypto_suite',
      name: 'IronVault',
      category: 'software',
      shop: 'software',
      price: 160,
      tier: 2,
      desc: 'An encryption suite you can actually understand, with a manual written by someone who wanted you to. Locks things up; helps you pick the locks that matter.',
      mods: [
        { key: 'xp.cryptography', mult: 1.15 },
        { key: 'trace', mult: 1.2 },
      ],
    },
    {
      id: 'sw_sandbox',
      name: 'CleanRoom VM',
      category: 'tool',
      shop: 'software',
      price: 170,
      tier: 2,
      desc: 'Runs the sketchy stuff inside a sealed pretend computer, so when it explodes it only takes the pretend computer with it. A very good habit.',
      mods: [
        { key: 'hack.heat', mult: 0.93 },
        { key: 'heat.decay', add: 0.08 },
      ],
    },
    {
      id: 'sw_anon_os',
      name: 'TailWind Live Disc',
      category: 'tool',
      shop: 'software',
      price: 90,
      tier: 2,
      desc: "A whole operating system on one CD that forgets everything the moment you pop it out. Boots slow, remembers nothing, loves you for it.",
      mods: [
        { key: 'hack.heat', mult: 0.9 },
        { key: 'trace', mult: 1.25 },
      ],
    },
    {
      id: 'sw_vulnscan',
      name: 'SiegeScope',
      category: 'software',
      shop: 'software',
      price: 450,
      tier: 3,
      available: { day: true, gte: dayOf(2003, 0, 1) },
      desc: 'The professional-grade auditor the consultants charge four figures to run. It finds the soft spots and files them in a neat, damning report.',
      mods: [{ key: 'hack.roll', add: 2 }],
    },

    // ── Black market (gated by cred; hidden = raid-safe) ─────────────────────
    {
      id: 'bm_burner_kit',
      name: 'Burner Identity Kit',
      category: 'tool',
      shop: 'blackmarket',
      price: 1200,
      tier: 3,
      hidden: true,
      req: { stat: 'cred', gte: 22 },
      reqText: 'Requires cred 22 (the guy behind the counter has to know your face)',
      desc: 'A rotating set of throwaway accounts, prepaid lines and false names that never quite point back at you. The vendor communicates entirely in nods.',
      mods: [
        { key: 'trace', mult: 1.5 },
        { key: 'hack.heat', mult: 0.85 },
      ],
    },
    {
      id: 'bm_persistence',
      name: 'GhostNail Kit',
      category: 'tool',
      shop: 'blackmarket',
      price: 600,
      tier: 3,
      hidden: true,
      req: { stat: 'cred', gte: 22 },
      reqText: 'Requires cred 22',
      desc: 'Quietly keeps a foot in the door after you leave, and sweeps its own footprints on the way out. The scene argues about the ethics of it constantly and buys it anyway.',
      mods: [
        { key: 'heat.decay', add: 0.16 },
        { key: 'hack.heat', mult: 0.9 },
      ],
    },
    {
      id: 'bm_zeroday',
      name: 'Nightmarket Pack',
      category: 'tool',
      shop: 'blackmarket',
      price: 2500,
      tier: 4,
      hidden: true,
      req: { stat: 'cred', gte: 42 },
      reqText: 'Requires cred 42 (Inner-circle handshake only)',
      desc: 'A folder of fresh, unpublished keys to doors nobody has patched yet. Expensive, dangerous to hold, and the single most powerful thing in your bag.',
      mods: [{ key: 'hack.roll', add: 3 }],
    },
    {
      id: 'bm_goodchain',
      name: 'The Good Chain',
      category: 'tool',
      shop: 'blackmarket',
      price: 6000,
      tier: 5,
      hidden: true,
      req: { stat: 'cred', gte: 68 },
      reqText: 'Requires cred 68 (they only sell this to people they trust with their own freedom)',
      desc: 'Not the volunteer relays — a private, curated set of bounce points run by people who owe each other their lives. If this can be followed home, nobody has managed it yet.',
      mods: [
        { key: 'trace', mult: 1.5 },
        { key: 'hack.roll', add: 1 },
      ],
    },
  ],
})
