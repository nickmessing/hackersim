/**
 * Procedural terminal ops. `generateMission` turns an `OpSpec` (network archetype, goal, loot,
 * flavor docs) plus a contract's tier and DC into a `MissionDef` the Terminal's MissionSim plays.
 *
 * FICTION NOTE: this is a puzzle generator for an imaginary game map. Hosts, "locks", files and
 * documents are whimsical invented texture; the terminal verbs are game verbs on in-memory data.
 * Nothing here describes or resembles a real system, product or procedure. Every address is a
 * made-up label in a private range.
 *
 * Shape of a generated op (a small graph puzzle):
 *   known:   the front door + one public relay
 *   chain:   front door -> 0..4 intermediate rooms -> vault (2..6 hosts, linked in order, found by `scan`)
 *   extras:  a second relay deeper in at tier >= 3, a look-alike decoy host at tier >= 2
 *   vault:   always logs; holds the goal file (encrypted at tier >= 3), decoy files and flavor docs
 *
 * Guarantees (checked by `missionProblems` and tests/ops.test.ts):
 *  - deterministic for a given game RNG state;
 *  - a 2..6 host chain, unique host ids, addresses, ports per host and file names per host;
 *  - every goal host is reachable from a starting host through `links`;
 *  - every goal file exists on its host, every upload goal has its payload, every wipe goal's host
 *    keeps logs — so every generated op is solvable.
 */
import { yearOf } from '../calendar'
import { rand, randInt } from '../rng'
import type { GameState, MissionDef, MissionFile, MissionGoal, MissionHost, MissionPort, OpNetwork, OpSpec } from '../types'

export const OP_NETWORKS: readonly OpNetwork[] = ['home', 'school', 'shop', 'corp', 'isp', 'bank', 'gov', 'lab', 'media']
export const OP_GOALS: readonly OpSpec['goal'][] = ['download', 'delete', 'upload', 'read', 'wipeLogs']

/** Options for one generated op (the contract it belongs to). */
export interface GenOptions {
  /** MissionDef id (contracts use `op_<uid>`). */
  id: string
  title: string
  /** 1..5 */
  tier: number
  dc: number
  client?: string
  /** The contract's `{target}` phrase; slugged into `{target}` file names. */
  target?: string
  /** Contract description, used as the briefing's opening paragraph. */
  desc?: string
}

// ────────────────────────────────────────────────────────────────────────────
// Scaling formulas
// ────────────────────────────────────────────────────────────────────────────

function clamp(n: number, lo: number, hi: number): number {
  return n < lo ? lo : n > hi ? hi : n
}

/** Story contracts carry no tier: derive one from the DC bands in CONTENT_GUIDE. */
export function tierFromDc(dc: number): number {
  if (dc <= 13) return 1
  if (dc <= 17) return 2
  if (dc <= 20) return 3
  if (dc <= 24) return 4
  return 5
}

/** Base lock difficulty (1..10) for a contract DC: DC 10 ≈ 2, DC 20 ≈ 6, DC 28 ≈ 9. */
export function portDifficultyFor(dc: number): number {
  return clamp(Math.round((dc - 6) / 2.5), 1, 10)
}

/** Trace budget before modifiers: ≈150 s at tier 1 down to ≈70 s at tier 5. */
export function traceSecondsFor(tier: number): number {
  return 150 - 20 * (clamp(Math.round(tier), 1, 5) - 1)
}

/** Length of the front door → vault chain by tier (inclusive range, always within 2..6). */
export const CHAIN_BY_TIER: readonly (readonly [number, number])[] = [
  [2, 3],
  [3, 4],
  [3, 5],
  [4, 6],
  [5, 6],
]

// ────────────────────────────────────────────────────────────────────────────
// Flavor data (all invented, deliberately whimsical)
// ────────────────────────────────────────────────────────────────────────────

interface DocDef {
  name: string
  content: string
}

interface Archetype {
  label: string
  /** Invented owner names for `{org}`. */
  orgs: string[]
  /** Second octet of the (private, made-up) address block. */
  block: [number, number]
  door: string[]
  rooms: string[]
  vault: string[]
  decoy: string[]
  /** Default goal file names when a spec has no loot. */
  loot: string[]
  /** Default payload names for upload goals. */
  payloads: string[]
  docs: DocDef[]
}

/** Invented lock names shown by `probe`. */
const LOCKS = ['bramble-lock', 'teapot-gate', 'moth-latch', 'lantern-seal', 'pigeon-post', 'velvet-rope', 'clockwork-bolt', 'marble-maze', 'kazoo-lock', 'paper-crane', 'owl-door', 'jam-jar']
/** Open-door "service" labels for ungated hosts. */
const OPEN_LABELS = ['welcome-mat', 'front-step', 'lobby', 'doorbell', 'porch-light']
/** Port numbers are just labels in the game. */
const PORT_LABELS = [7, 12, 42, 77, 101, 128, 256, 404, 512, 777, 1024, 1234, 2048, 3141, 4096, 5150, 6502, 8086]

const RELAY_NAMES = [
  'Lumen Public Library Kiosk',
  'Laundromat Coin-Op Terminal',
  'Cathode Diner Jukebox PC',
  'Pier 9 Ferry Timetable Screen',
  'Sodium Row Community Board',
  'Forgotten Demo Box (Millgate)',
  'Bowling Alley Score Terminal',
  'Night Bus Arrival Sign',
]
const RELAY_BANNERS = [
  'Guest access. Be kind, rewind, log off when you are done.',
  'This machine belongs to everybody and therefore to nobody.',
  'Free community relay. Donations of snacks accepted at the front desk.',
  'OUT OF ORDER. (It is in order. The sign is load-bearing.)',
]

const GENERIC_DOCS: DocDef[] = [
  { name: 'README.txt', content: 'If you are reading this, the new guy set up this machine.\nThe new guy has since left.\nPlease do not ask the new guy.' },
  { name: 'lunch_order.txt', content: 'FRIDAY LUNCH\n- 4x meatball sub\n- 1x "whatever is green"\n- Gary: nothing, Gary is "doing a cleanse"' },
  { name: 'haiku.txt', content: 'the backup ran late\nnobody noticed the gap\nautumn fog rolls in' },
  { name: 'motd.txt', content: 'Message of the day: The coffee machine is fixed.\nMessage of the next day: The coffee machine is not fixed.' },
  { name: 'desk_move.txt', content: 'Desk moves this weekend. Label your chair.\nLast time one person ended up with a filing cabinet.' },
  { name: 'complaint.txt', content: 'To whom it may concern,\nThe screensaver with the flying toasters is "unprofessional."\nPlease replace it with the one with the fish.' },
  { name: 'birthday.txt', content: 'Card for Linda is in the supply closet. Sign it.\nDo NOT write "happy retirement" again, she is 34.' },
  { name: 'plant_rota.txt', content: 'WHO WATERS THE FERN\nMon: Priya  Tue: Priya  Wed: Priya\nThu: "the fern looks fine"  Fri: the fern does not look fine' },
]

const RELAY_DOCS: DocDef[] = [
  { name: 'guestbook.txt', content: 'visited 3/4 — cool machine!!\nvisited 3/5 — this machine is slow\nvisited 3/6 — who keeps printing pictures of ducks' },
  { name: 'house_rules.txt', content: 'HOUSE RULES\n1. No food on the keyboard.\n2. No keyboard on the food.\n3. Be nice to the next person in line.' },
]

/** Definite fallbacks (avoid indexed access, which is possibly-undefined under strict TS). */
const FALLBACK_DOC: DocDef = { name: 'notes.txt', content: 'Somebody meant to write something here and got distracted by lunch.' }
const FALLBACK_RELAY_DOC: DocDef = { name: 'sign_in.txt', content: 'Please sign the book. The book is also missing. Please sign the wall.' }

const DECOY_SUFFIX = ['_old', '_backup', '_copy', '_draft', '_DO_NOT_USE', '_final_FINAL', '_v2']

const ARCHETYPES: Record<OpNetwork, Archetype> = {
  home: {
    label: 'home setup',
    orgs: ['Delgado', 'Whitlock', 'Okafor', 'Brannigan', 'Pelletier'],
    block: [60, 69],
    door: ['{org} Family Router', 'LinkBox 400 ({org} house)'],
    rooms: ['Den PC', 'Printer That Is Always Out Of Cyan', 'Basement Media Box', 'Game Console Hub'],
    vault: ['{org} Study PC', 'The Big Beige Tower'],
    decoy: ['Old PC In The Garage', 'Box Of Floppies (networked, somehow)'],
    loot: ['scrapbook.dat', 'mixtape_list.txt', 'recipe_box.dat'],
    payloads: ['birthday_banner.bmp', 'confetti.scr'],
    docs: [
      { name: 'chore_chart.txt', content: 'CHORES\nDishes: Sam\nTrash: Sam\nLawn: Sam\nSam: "this is a conspiracy"' },
      { name: 'grocery_list.txt', content: 'milk\neggs\nthe good bread (NOT the sad bread)\ncake???' },
    ],
  },
  school: {
    label: 'campus network',
    orgs: ['Lumen Central', 'St. Brigid', 'Harbor Vocational', 'Millgate Community College'],
    block: [70, 79],
    door: ['{org} Front Office Relay', '{org} Library Desk'],
    rooms: ['Lab 204 Server', 'AV Cart Controller', 'Staffroom PC', 'Card Catalog Box'],
    vault: ['{org} Records Box', '{org} Main Office Tower'],
    decoy: ['Training Terminal (changes do not count)', 'Archive Box (1994 edition)'],
    loot: ['yearbook_draft.dat', 'bake_sale_ledger.txt', 'club_roster.dat'],
    payloads: ['schedule_fix.dat', 'mascot_banner.bmp'],
    docs: [
      { name: 'cafeteria_menu.txt', content: 'MONDAY: mystery loaf\nTUESDAY: mystery loaf (with gravy)\nTHURSDAY: tacos!!\nFRIDAY: see Monday' },
      { name: 'lost_and_found.txt', content: 'Lost & found:\n- 31 hoodies\n- 1 trombone\n- a calculator that only does long division, resentfully' },
    ],
  },
  shop: {
    label: 'shop network',
    orgs: ['Byte Barn', 'Harbor Hobby & Kite', 'Gadget Gulch', "Pixel Pete's"],
    block: [80, 89],
    door: ['{org} Web Counter', '{org} Order Line'],
    rooms: ['Stockroom Box', 'Register Hub', "Manager's Desk PC", 'Mail-Order Desk'],
    vault: ['{org} Back Room Server', '{org} Big Filing Box'],
    decoy: ['Staging Shop (never launched)', 'Old Storefront (two redesigns ago)'],
    loot: ['unlock_list.dat', 'catalog_master.dat', 'restock_plan.txt'],
    payloads: ['banner_swap.gif', 'price_tag.dat'],
    docs: [
      { name: 'shift_notes.txt', content: 'Closing shift: the door sticks. Lift and push. Lift MORE. Do not kick the door, the door remembers.' },
      { name: 'supplier_note.txt', content: 'Re: where is our shipment\nIt is on a boat. The boat is on the sea. The sea is large.' },
    ],
  },
  corp: {
    label: 'office network',
    orgs: ['Halvorsen Logistics', 'Brightline Direct', 'Pellucid Systems', 'Ostrander & Vey', 'Greymoor Holdings'],
    block: [90, 109],
    door: ['{org} Lobby Relay', '{org} Front Desk'],
    rooms: ['Third Floor Print Box', 'Intranet Portal', 'Facilities Box', 'Conference Room PC'],
    vault: ['{org} Top Floor Share', '{org} Archive Tower'],
    decoy: ['Legacy Share (decommissioned*)', 'Training Sandbox'],
    loot: ['memo_final_v7.doc', 'quarterly_slides.dat', 'project_codename.txt'],
    payloads: ['press_note.doc', 'org_chart_v2.dat'],
    docs: [
      { name: 'fwd_fwd_fwd.txt', content: 'FW: FW: FW: send this to 10 people or the office plant dies\n> I sent it to 11 just to be safe\n>> the plant died anyway' },
      { name: 'synergy.txt', content: 'Q3 THEMES\n- synergy\n- more synergy\n- a smaller, more focused synergy' },
    ],
  },
  isp: {
    label: 'provider network',
    orgs: ['LumenNet', 'HarborLink Online', 'SodiumWeb', 'FreeFrontier Hosting'],
    block: [110, 119],
    door: ['{org} Dial Pool', '{org} Member Portal'],
    rooms: ['Web Host #7', 'Mail Spool Box', 'Shared Hosting Box', 'Help Queue Box'],
    vault: ['{org} Member Pages Server', '{org} Control Box'],
    decoy: ['Mirror Server (out of date)', 'Old Member Pages (pre-move)'],
    loot: ['help_queue.txt', 'page_index.dat', 'hit_counter.dat'],
    payloads: ['calling_card.html', 'index_new.html'],
    docs: [
      { name: 'uptime.txt', content: 'UPTIME: 212 days\nUPTIME (actual): 212 days minus the Tuesday Dave tripped over the cable' },
      { name: 'help_macro.txt', content: 'Have you tried turning it off and on again?\n(If yes: have you tried turning it off and leaving it off?)' },
    ],
  },
  bank: {
    label: 'counting-house network',
    orgs: ['Meridian Trust', 'Harborside Mutual', 'Quillon Savings'],
    block: [120, 129],
    door: ['{org} Customer Kiosk', '{org} Front Counter'],
    rooms: ['Teller Hall Box', 'Statement Printer', 'Branch Office PC', 'Hold-Music Server'],
    vault: ['{org} Records Vault', '{org} Ledger Room'],
    decoy: ['Staging Ledger (fake numbers)', 'Old Passbook Archive'],
    loot: ['ledger_{year}.dat', 'statements_{year}.dat', 'branch_notes.txt'],
    payloads: ['statement_fix.dat', 'notice_slip.dat'],
    docs: [
      { name: 'hold_music.txt', content: 'The hold-music loop is 47 seconds long. It has played for eleven years.\nInternally it is known as "The Loop Of Sorrows."' },
      { name: 'lobby_pens.txt', content: 'RE: the pens are chained to the desk again\nRE: yes\nRE: the chains are also now missing' },
    ],
  },
  gov: {
    label: 'civic network',
    orgs: ['Port Lumen City Hall', 'County Records Office', 'Harbor Permits Bureau', 'Parks & Recreation'],
    block: [130, 139],
    door: ['{org} Public Kiosk', '{org} Reception Relay'],
    rooms: ['Permit Queue Box', 'Microfiche Reader PC', 'Forms Cabinet Server', 'Meeting Minutes Box'],
    vault: ['{org} Registry Tower', '{org} Records Room'],
    decoy: ['Draft Registry (unofficial)', 'Old Filing Room (pre-flood)'],
    loot: ['registry_{year}.dat', 'permit_ledger.dat', 'meeting_minutes.txt'],
    payloads: ['form_stamp.dat', 'notice_post.dat'],
    docs: [
      { name: 'form_27b.txt', content: 'To file Form 27B you must first file Form 27A.\nTo file Form 27A you must first file Form 27B.\nSee the front desk. The front desk sees no one.' },
      { name: 'parking.txt', content: 'STAFF PARKING\nSpaces: 12\nStaff: 40\nMood: escalating' },
    ],
  },
  lab: {
    label: 'research network',
    orgs: ['Cinder Point Institute', 'Harbor Marine Lab', 'Lumen Observatory', 'Greenhouse Annex'],
    block: [140, 149],
    door: ['{org} Visitor Terminal', '{org} Reception Box'],
    rooms: ['Sensor Array Box', 'Sample Freezer Controller', 'Grad Student PC', 'Telescope Scheduler'],
    vault: ['{org} Results Server', '{org} Data Room'],
    decoy: ['Practice Dataset (all zeros)', 'Old Experiment Box (retired)'],
    loot: ['results_{year}.dat', 'sample_log.dat', 'grant_draft.doc'],
    payloads: ['dataset_patch.dat', 'poster_swap.dat'],
    docs: [
      { name: 'freezer.txt', content: 'DO NOT UNPLUG THE FREEZER.\nThe freezer is labelled "DO NOT UNPLUG."\nThe label is holding the plug in.' },
      { name: 'coffee_science.txt', content: 'HYPOTHESIS: the third pot tastes worse.\nMETHOD: drink all three.\nRESULT: inconclusive, hands shaking.' },
    ],
  },
  media: {
    label: 'newsroom network',
    orgs: ['Port Lumen Gazette', 'Harbor Community Radio', 'Channel 9 News', 'Sodium Row Zine Co-op'],
    block: [150, 159],
    door: ['{org} Tip Line Box', '{org} Front Desk Relay'],
    rooms: ['Layout Room PC', 'Wire Feed Box', 'Archive Morgue Server', 'Ad Sales Box'],
    vault: ['{org} Editor Desk', '{org} Publishing Server'],
    decoy: ['Spiked Stories Box', 'Old Print Server (pre-web)'],
    loot: ['front_page_draft.dat', 'source_notes.txt', 'archive_index.dat'],
    payloads: ['correction_slip.dat', 'banner_ad.gif'],
    docs: [
      { name: 'stylebook.txt', content: 'HOUSE STYLE\n- one space after a period (this is a hill people die on here)\n- "harbour" or "harbor"? yes\n- never bury the lede (this note is at the bottom of the file)' },
      { name: 'headlines.txt', content: 'REJECTED HEADLINES\n- "Local Man Does Thing"\n- "Weather Continues"\n- "Council Meets, Nothing Happens, Details Inside"' },
    ],
  },
}

// ────────────────────────────────────────────────────────────────────────────
// Deterministic helpers
// ────────────────────────────────────────────────────────────────────────────

function draw<T>(state: GameState, list: readonly T[], fallback: T): T {
  if (list.length === 0) return fallback
  return list[Math.floor(rand(state) * list.length)] ?? fallback
}

/** Slug a free-text target phrase into a file-name-safe token. */
function slug(s: string): string {
  const out = s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 24)
  return out || 'target'
}

function substitute(name: string, org: string, year: number, targetSlug: string): string {
  return name.replace(/\{org\}/g, org).replace(/\{year\}/g, String(year)).replace(/\{target\}/g, targetSlug)
}

/** A whimsical body for a goal file so `cat`/`get` have something to show. */
function lootBody(file: string, org: string, year: number): string {
  return [
    `== ${file} ==`,
    `Belongs to: ${org}`,
    `Last touched: sometime in ${year}, by someone who meant to come back to it.`,
    'The contents are exactly what the job said they would be, and nothing you did not ask for.',
    'Somebody, somewhere, is going to be mildly inconvenienced by this. Such is the work.',
  ].join('\n')
}

// ────────────────────────────────────────────────────────────────────────────
// Generation
// ────────────────────────────────────────────────────────────────────────────

interface Builder {
  state: GameState
  arch: Archetype
  org: string
  year: number
  targetSlug: string
  block: number
  third: number
  fourth: number
  usedNames: Set<string>
  hosts: MissionHost[]
}

/** Next unique address in this mission's made-up private block. */
function nextIp(b: Builder): string {
  b.fourth += 1
  if (b.fourth > 250) {
    b.fourth = 2
    b.third += 1
  }
  return `10.${b.block}.${b.third}.${b.fourth}`
}

function uniqueName(b: Builder, base: string): string {
  if (!b.usedNames.has(base)) {
    b.usedNames.add(base)
    return base
  }
  const dot = base.lastIndexOf('.')
  const stem = dot > 0 ? base.slice(0, dot) : base
  const ext = dot > 0 ? base.slice(dot) : ''
  for (let i = 2; i < 99; i++) {
    const cand = `${stem}_${i}${ext}`
    if (!b.usedNames.has(cand)) {
      b.usedNames.add(cand)
      return cand
    }
  }
  const cand = `${stem}_${b.fourth}${ext}`
  b.usedNames.add(cand)
  return cand
}

/** Build one door/relay style host (open, ungated). */
function openHost(b: Builder, id: string, name: string, opts: { proxy?: boolean; docs?: DocDef[]; banner?: string }): MissionHost {
  const files: MissionFile[] = []
  for (const d of opts.docs ?? []) files.push({ name: uniqueNameLocal(files, d.name), size: 200 + d.content.length, content: d.content })
  return {
    id,
    ip: nextIp(b),
    name,
    ...(opts.banner ? { banner: opts.banner } : {}),
    ports: [{ port: draw(b.state, PORT_LABELS, 80), service: draw(b.state, OPEN_LABELS, 'lobby'), difficulty: 0 }],
    files,
    logs: false,
    ...(opts.proxy ? { proxy: true } : {}),
  }
}

/** Names inside a single host must not collide (files map is keyed by name). */
function uniqueNameLocal(files: MissionFile[], base: string): string {
  if (!files.some(f => f.name === base)) return base
  const dot = base.lastIndexOf('.')
  const stem = dot > 0 ? base.slice(0, dot) : base
  const ext = dot > 0 ? base.slice(dot) : ''
  for (let i = 2; i < 99; i++) {
    const cand = `${stem}_${i}${ext}`
    if (!files.some(f => f.name === cand)) return cand
  }
  return `${stem}_x${ext}`
}

function gatedPorts(b: Builder, diff: number, count: number): MissionPort[] {
  const ports: MissionPort[] = []
  const usedPorts = new Set<number>()
  for (let i = 0; i < count; i++) {
    let port = draw(b.state, PORT_LABELS, 22)
    let guard = 0
    while (usedPorts.has(port) && guard++ < 20) port = draw(b.state, PORT_LABELS, 22)
    usedPorts.add(port)
    const d = clamp(diff + randInt(b.state, -1, 1), 1, 10)
    ports.push({ port, service: draw(b.state, LOCKS, 'moth-latch'), difficulty: i === 0 ? Math.max(1, diff) : d })
  }
  return ports
}

/**
 * Generate a solvable terminal op from a spec and a contract's tier/DC. Deterministic given the
 * game RNG. Story contracts pass a tier via `tierFromDc(dc)`.
 */
export function generateMission(state: GameState, spec: OpSpec, opts: GenOptions): MissionDef {
  const tier = clamp(Math.round(opts.tier), 1, 5)
  const arch = ARCHETYPES[spec.network]
  const org = draw(state, arch.orgs, 'Somebody')
  const year = yearOf(state.time.day)
  const targetSlug = slug(opts.target ?? org)
  const [lo, hi] = arch.block
  const b: Builder = {
    state,
    arch,
    org,
    year,
    targetSlug,
    block: randInt(state, lo, hi),
    third: randInt(state, 1, 9),
    fourth: randInt(state, 1, 40),
    usedNames: new Set(),
    hosts: [],
  }

  const [cLo, cHi] = CHAIN_BY_TIER[tier - 1] ?? [2, 3]
  const chainLen = clamp(randInt(state, cLo, cHi), 2, 6)
  const roomCount = chainLen - 2 // door + rooms + vault
  const baseDiff = portDifficultyFor(opts.dc)

  // Front door: known, open, links into the chain.
  const door = openHost(b, 'door', substitute(draw(state, arch.door, '{org} Front Door'), org, year, targetSlug), {
    banner: `${org} — front door. The lights are on.`,
    docs: [draw(state, arch.docs, FALLBACK_DOC)],
  })
  b.hosts.push(door)

  // Intermediate rooms.
  const roomIds: string[] = []
  const roomPool = [...arch.rooms]
  for (let i = 0; i < roomCount; i++) {
    const id = `room${i + 1}`
    roomIds.push(id)
    const nmeIdx = Math.floor(rand(state) * Math.max(1, roomPool.length))
    const name = roomPool.splice(nmeIdx, 1)[0] ?? `Back Room ${i + 1}`
    // Rooms are lightly gated; you can `scan` through them without a shell, so this is optional bite.
    const guarded = rand(state) < 0.5 || tier >= 3
    b.hosts.push({
      id,
      ip: nextIp(b),
      name,
      banner: draw(state, ['Staff only. (The sign is very stern.)', 'Please log off when finished. Nobody does.', 'This room hums. It has always hummed.'], 'Staff only.'),
      ports: guarded ? gatedPorts(b, clamp(baseDiff - 1, 1, 10), 1) : [{ port: draw(state, PORT_LABELS, 80), service: draw(state, OPEN_LABELS, 'lobby'), difficulty: 0 }],
      files: [makeDoc(b, draw(state, [...arch.docs, ...GENERIC_DOCS], FALLBACK_DOC))],
      logs: guarded && rand(state) < 0.4,
    })
  }

  // Vault: the goal host. Always logs, always gated.
  const vaultPortCount = tier >= 4 ? 2 : 1
  const vault: MissionHost = {
    id: 'vault',
    ip: nextIp(b),
    name: substitute(draw(state, arch.vault, '{org} Vault'), org, year, targetSlug),
    banner: `${org} — the room the job is about. Mind the logs.`,
    ports: gatedPorts(b, baseDiff, vaultPortCount),
    files: [],
    logs: true,
  }

  // Goal file / payload.
  const goalPool = spec.loot.length ? spec.loot : arch.loot
  const rawGoal = substitute(draw(state, goalPool, arch.loot[0] ?? 'the_file.dat'), org, year, targetSlug)
  const goals: MissionGoal[] = []
  const payloads: MissionFile[] = []
  const encrypt = tier >= 3 && (spec.goal === 'read' || spec.goal === 'download')

  if (spec.goal === 'upload') {
    const payloadName = uniqueName(b, rawGoal)
    payloads.push({ name: payloadName, size: randInt(state, 300, 1800), content: `${payloadName}: a small file the client wants left in place at ${org}. It sits quietly and does nothing dramatic.` })
    goals.push({ kind: 'upload', host: 'vault', file: payloadName })
  } else if (spec.goal === 'wipeLogs') {
    goals.push({ kind: 'wipeLogs', host: 'vault' })
    // Give the vault a file to look at, so the room is not empty.
    vault.files.push(makeGoalFile(b, rawGoal, org, year, false))
  } else {
    const goalFile = makeGoalFile(b, rawGoal, org, year, encrypt)
    vault.files.push(goalFile)
    goals.push({ kind: spec.goal, host: 'vault', file: goalFile.name })
  }

  // Decoy files on the vault (look-alikes) + flavor docs.
  const decoyCount = tier >= 2 ? randInt(state, 1, 2) : (rand(state) < 0.5 ? 1 : 0)
  for (let i = 0; i < decoyCount; i++) {
    const base = substitute(draw(state, goalPool, arch.loot[0] ?? 'the_file.dat'), org, year, targetSlug)
    const decoyName = uniqueNameLocal(vault.files, addSuffix(base, draw(state, DECOY_SUFFIX, '_old')))
    vault.files.push({ name: decoyName, size: randInt(state, 200, 2600), content: `${decoyName}: looks like the real thing, is not the real thing. Somebody kept it "just in case."` })
  }
  for (const d of spec.docs ?? []) vault.files.push(makeDoc(b, d))
  vault.files.push(makeDoc(b, draw(state, [...arch.docs, ...GENERIC_DOCS], FALLBACK_DOC)))

  b.hosts.push(vault)

  // Link the chain: door -> room1 -> ... -> vault.
  const chain = ['door', ...roomIds, 'vault']
  for (let i = 0; i < chain.length - 1; i++) {
    const hereId = chain[i]
    const nextId = chain[i + 1]
    const here = b.hosts.find(h => h.id === hereId)
    if (here && nextId !== undefined) here.links = [...(here.links ?? []), nextId]
  }

  // Public relay (proxy) — known at start, for bouncing.
  const relay1 = openHost(b, 'relay1', draw(state, RELAY_NAMES, 'Public Kiosk'), {
    proxy: true,
    banner: draw(state, RELAY_BANNERS, 'Guest access.'),
    docs: [draw(state, RELAY_DOCS, FALLBACK_RELAY_DOC)],
  })
  b.hosts.push(relay1)

  const known = ['door', 'relay1']

  // A second, deeper relay at tier >= 3, discovered by scanning a room (or the door).
  if (tier >= 3) {
    const relay2 = openHost(b, 'relay2', draw(state, RELAY_NAMES, 'Community Relay'), {
      proxy: true,
      banner: draw(state, RELAY_BANNERS, 'Free community relay.'),
      docs: [draw(state, RELAY_DOCS, FALLBACK_RELAY_DOC)],
    })
    b.hosts.push(relay2)
    const anchor = b.hosts.find(h => h.id === (roomIds[0] ?? 'door'))
    if (anchor) anchor.links = [...(anchor.links ?? []), 'relay2']
  }

  // Decoy host at tier >= 2 — a dead-end look-alike hung off a room (or the door).
  if (tier >= 2) {
    const decoyHost: MissionHost = {
      id: 'decoy',
      ip: nextIp(b),
      name: draw(state, arch.decoy, 'Old Box'),
      banner: draw(state, ['Nothing important here. (This is what all the important ones say.)', 'DECOMMISSIONED — please ignore. Everyone does.'], 'Old box.'),
      ports: gatedPorts(b, clamp(baseDiff - 1, 1, 10), 1),
      files: [
        { name: uniqueName(b, addSuffix(rawGoal, '_MIRROR')), size: randInt(state, 200, 1800), content: 'A tempting duplicate. It is out of date, and it knows it, and it is a little sad about it.' },
        makeDoc(b, draw(state, GENERIC_DOCS, FALLBACK_DOC)),
      ],
      logs: rand(state) < 0.5,
    }
    b.hosts.push(decoyHost)
    const anchor = b.hosts.find(h => h.id === (roomIds[roomIds.length - 1] ?? 'door'))
    if (anchor) anchor.links = [...(anchor.links ?? []), 'decoy']
  }

  const briefing = buildBriefing(opts, spec, org, arch)
  const hints = buildHints(spec, tier, encrypt)

  return {
    id: opts.id,
    title: opts.title,
    briefing,
    known,
    hosts: b.hosts,
    goals,
    traceSeconds: traceSecondsFor(tier),
    ...(payloads.length ? { payloads } : {}),
    hints,
    logHeat: 3 + tier * 2,
  }
}

function makeGoalFile(b: Builder, base: string, org: string, year: number, encrypted: boolean): MissionFile {
  const name = uniqueName(b, base)
  return { name, size: randInt(b.state, 400, 4000), content: lootBody(name, org, year), ...(encrypted ? { encrypted: true } : {}) }
}

function makeDoc(b: Builder, d: DocDef): MissionFile {
  const name = uniqueName(b, d.name)
  return { name, size: 180 + d.content.length, content: d.content }
}

function addSuffix(file: string, suffix: string): string {
  const dot = file.lastIndexOf('.')
  if (dot <= 0) return `${file}${suffix}`
  return `${file.slice(0, dot)}${suffix}${file.slice(dot)}`
}

function buildBriefing(opts: GenOptions, spec: OpSpec, org: string, arch: Archetype): string[] {
  const lines: string[] = []
  if (opts.desc) lines.push(opts.desc)
  const verb: Record<OpSpec['goal'], string> = {
    download: `pull the file off ${org}'s ${arch.label} and get out clean`,
    read: `read what ${org} keeps on their ${arch.label} — then leave no trace`,
    delete: `make one file on ${org}'s ${arch.label} quietly disappear`,
    upload: `leave the client's file in place on ${org}'s ${arch.label}`,
    wipeLogs: `scrub the access logs on ${org}'s ${arch.label} so nobody knows anyone was there`,
  }
  lines.push(`The job: ${verb[spec.goal]}. Find the way in from the front door, follow the links, mind the trace.`)
  return lines
}

function buildHints(spec: OpSpec, tier: number, encrypt: boolean): string[] {
  const hints = [
    'Start at the front door: `connect` to a known address, then `scan` to map what it links to.',
    'Guarded rooms start a back-trace when you connect — `bounce` a public relay first to buy time.',
  ]
  if (encrypt) hints.push('The goal file is encrypted: `decrypt` it before you can `cat` it.')
  if (spec.goal === 'upload') hints.push('Check `payloads`, then `put` the file on the vault once you have a shell.')
  if (tier >= 3) hints.push('`wipe` the logs on every host you touched before you `disconnect`, or the heat follows you home.')
  return hints
}

// ────────────────────────────────────────────────────────────────────────────
// Solvability / integrity check (used by tests and as a runtime guard)
// ────────────────────────────────────────────────────────────────────────────

/** Returns a list of structural problems with a MissionDef. Empty = well-formed and solvable. */
export function missionProblems(def: MissionDef): string[] {
  const problems: string[] = []
  const hosts = new Map(def.hosts.map(h => [h.id, h]))
  // 2..6 in the door->vault chain, plus up to two relays and one decoy = at most 9 hosts total.
  if (def.hosts.length < 2 || def.hosts.length > 9) problems.push(`host count ${def.hosts.length} out of range`)

  // Unique host ids and addresses.
  const ids = new Set<string>()
  const ips = new Set<string>()
  for (const h of def.hosts) {
    if (ids.has(h.id)) problems.push(`duplicate host id "${h.id}"`)
    ids.add(h.id)
    if (ips.has(h.ip)) problems.push(`duplicate address "${h.ip}"`)
    ips.add(h.ip)
    const fnames = new Set<string>()
    for (const f of h.files) {
      if (fnames.has(f.name)) problems.push(`host ${h.id} has duplicate file "${f.name}"`)
      fnames.add(f.name)
    }
    const pnums = new Set<number>()
    for (const p of h.ports) {
      if (pnums.has(p.port)) problems.push(`host ${h.id} has duplicate port ${p.port}`)
      pnums.add(p.port)
    }
    for (const l of h.links ?? []) if (!hosts.has(l)) problems.push(`host ${h.id} links to missing "${l}"`)
  }

  for (const k of def.known) if (!hosts.has(k)) problems.push(`known host "${k}" missing`)

  // Reachability: BFS from known hosts through links.
  const seen = new Set(def.known.filter(k => hosts.has(k)))
  const queue = [...seen]
  while (queue.length > 0) {
    const id = queue.shift()
    if (id === undefined) continue
    for (const l of hosts.get(id)?.links ?? []) {
      if (!seen.has(l)) {
        seen.add(l)
        queue.push(l)
      }
    }
  }

  for (const g of def.goals) {
    const h = hosts.get(g.host)
    if (!h) {
      problems.push(`goal host "${g.host}" missing`)
      continue
    }
    if (!seen.has(g.host)) problems.push(`goal host "${g.host}" not reachable from a known host`)
    if ((g.kind === 'download' || g.kind === 'delete' || g.kind === 'read') && !h.files.some(f => f.name === g.file)) {
      problems.push(`goal file "${g.file}" not on host ${g.host}`)
    }
    if (g.kind === 'upload' && !(def.payloads ?? []).some(f => f.name === g.file)) problems.push(`upload payload "${g.file}" missing`)
    if (g.kind === 'wipeLogs' && !h.logs) problems.push(`wipeLogs goal host ${g.host} keeps no logs`)
  }
  if (def.goals.length === 0) problems.push('mission has no goals')
  return problems
}
