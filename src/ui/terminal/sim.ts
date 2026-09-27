/**
 * Pure, framework-free simulator for the Terminal minigame — an "Uplink-lite" op on a WHOLLY
 * FICTIONAL network described by a MissionDef. Every command here is an invented game verb working
 * on invented in-memory data; nothing in this file describes, resembles, or could be used against a
 * real system. The Vue layer drives it: `exec()` on Enter, `tick(dt)` every animation frame, and it
 * reads the plain fields for rendering.
 *
 * On top of the MissionDef, generated contract ops are "rigged" (deterministically, from the
 * mission id) with a few invented puzzle pieces so no two runs feel the same:
 *  - firewalls: a wall in front of a host's locks — `bypass` it before you can `crack`;
 *  - watchdogs: a listener that jumps the trace when you are noisy (`probe` loudly, fumble commands,
 *    or crack while it watches) — `probe -q` is slower but silent;
 *  - admin sessions: a sysop is logged in and the trace runs faster while they are — `distract`
 *    sends them off to fix an imaginary paper jam for a while;
 *  - honeypots: look-alike files that phone home when touched (trace jump + a beacon that counts as
 *    a trail you cannot wipe) — `stat` a file first;
 *  - credential notes: a careless note on some other machine holds the key to a lock on the target;
 *    read it and that lock opens instantly.
 * Story missions (hand-authored) run un-rigged so their tuning stays exactly as written.
 */
import type { MissionDef, MissionFile, MissionGoal, MissionHost, MissionPort, OpResult } from '@/engine'

// ── Output model ─────────────────────────────────────────────────────────────

export type Tone = 'in' | 'out' | 'dim' | 'warn' | 'err' | 'good' | 'sys' | 'hint'

export interface OutLine {
  text: string
  tone: Tone
}

/** A line on the CRT plus how many characters the typewriter has revealed so far. */
export interface RenderLine extends OutLine {
  shown: number
}

function line(text: string, tone: Tone = 'out'): OutLine {
  return { text, tone }
}

/** Player-derived tuning read once when the mission opens. */
export interface SimEnv {
  intrusion: number
  cryptography: number
  opsec: number
  networking: number
  /** modMult(state, 'crack.speed') — higher cracks faster. */
  crackSpeed: number
  /** modMult(state, 'trace') folded with opsec — higher = slower trace = safer. */
  traceMult: number
}

export function defaultEnv(): SimEnv {
  return { intrusion: 0, cryptography: 0, opsec: 0, networking: 0, crackSpeed: 1, traceMult: 1 }
}

export interface SimOptions {
  /** Add the variety mechanics (firewalls, watchdogs, admins, honeypots, credential notes). */
  rig?: boolean
  /** 1..5 — scales the rigging and a few timings. */
  tier?: number
  /** Print contextual hints as things happen (first-time players). */
  hints?: boolean
}

// ── Timing formulas (exported for tests) ─────────────────────────────────────

function clampNum(n: number, lo: number, hi: number): number {
  return n < lo ? lo : n > hi ? hi : n
}

/** Real seconds to crack a service, scaled by difficulty vs. the player's intrusion & gear. */
export function crackSeconds(difficulty: number, env: SimEnv): number {
  if (difficulty <= 0) return 0
  const speed = Math.max(0.2, env.crackSpeed) * (1 + env.intrusion / 22)
  return clampNum((difficulty * 2.4) / speed, 0.7, 45)
}

/** Real seconds to decrypt a file, scaled by size vs. the player's cryptography & gear. */
export function decryptSeconds(file: MissionFile, env: SimEnv): number {
  const bulk = 1 + Math.min(3, file.size / 1500)
  const speed = Math.max(0.2, env.crackSpeed) * (1 + env.cryptography / 20)
  return clampNum((6 * bulk) / speed, 1, 30)
}

/** Real seconds to take a firewall down, scaled by tier vs. networking & gear. */
export function bypassSeconds(tier: number, env: SimEnv): number {
  const speed = Math.sqrt(Math.max(0.2, env.crackSpeed)) * (1 + env.networking / 25)
  return clampNum((3 + tier * 1.4) / speed, 1.5, 20)
}

/** Total real seconds the trace needs to lock onto you, once it starts. */
export function traceTotal(def: MissionDef, env: SimEnv, bounces: number): number {
  const mult = Math.max(0.35, env.traceMult)
  return Math.max(4, def.traceSeconds * mult * (1 + bounces * 0.35))
}

/** Trace jumps (fractions of the full meter). */
export const NOISE = { probe: 0.1, fumble: 0.03, honeypot: 0.12 } as const
/** Trace speed while an admin watches your host / while you crack under a watchdog. */
export const ADMIN_TRACE_MULT = 1.6
export const WATCHDOG_CRACK_MULT = 1.5
/** Seconds an admin stays away after `distract`. */
export const DISTRACT_SECONDS = 40
const QUIET_PROBE_SECONDS = 2.5
const DISTRACT_JOB_SECONDS = 2

// ── Deterministic rigging RNG ────────────────────────────────────────────────

function hashStr(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

function mulberry(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function pickOf<T>(r: () => number, list: readonly T[], fallback: T): T {
  if (list.length === 0) return fallback
  return list[Math.floor(r() * list.length)] ?? fallback
}

const ADMIN_NAMES = ['marge', 'dwayne', 'priya.k', 'night-shift', 'gary', 'the-intern', 'b.okafor', 'sysop-lou', 'deb', 'r.whitlock']
const NOTE_NAMES = ['sticky_note.txt', 'keyring.txt', 'passwords_DO_NOT_READ.txt', 'admin_reminders.txt', 'postit_scan.txt', 'todo_before_vacation.txt']
const KEY_WORDS = ['marmalade', 'lighthouse', 'pickle', 'accordion', 'teacup', 'moonboot', 'waffle', 'harbor', 'ferret', 'bluebell', 'saxophone', 'noodle']
const DISTRACTIONS = [
  'a printer on the third floor reporting PC LOAD LETTER',
  'an urgent memo titled "WHO MICROWAVED FISH"',
  'a paper jam that is somehow also a toner fire (it is not)',
  'the coffee machine emailing them directly',
  'a phantom "your lights are on" note about their car',
]
/** Look-alike suffixes the op generator uses for decoys. */
const DECOY_RE = /(_old|_backup|_copy|_draft|_DO_NOT_USE|_final_FINAL|_v2|_MIRROR)(_\d+)?(\.|$)/

// ── Runtime state ────────────────────────────────────────────────────────────

interface FileRuntime {
  def: MissionFile
  decrypted: boolean
  downloaded: boolean
  read: boolean
  deleted: boolean
  /** A look-alike of the real thing (harmless unless it is also a honeypot). */
  decoy: boolean
  /** Bait: touching it jumps the trace and plants a beacon. */
  honeypot: boolean
  tripped: boolean
  /** Credential note: reading it yields a key for this lock. */
  grants?: { host: string; port: number }
}

interface AdminRuntime {
  name: string
  /** Seconds until they come back (0 = at the keyboard). */
  away: number
  distracted: boolean
}

interface HostRuntime {
  def: MissionHost
  known: boolean
  scanned: boolean
  probed: boolean
  access: boolean
  cracked: Set<number>
  logsWiped: boolean
  touched: boolean
  files: Map<string, FileRuntime>
  uploaded: Set<string>
  firewall: boolean
  firewallDown: boolean
  watchdog: boolean
  admin: AdminRuntime | null
}

type JobKind = 'crack' | 'decrypt' | 'bypass' | 'probe' | 'distract'

interface Job {
  kind: JobKind
  label: string
  elapsed: number
  total: number
  /** Host the job runs on (watchdog noise while cracking). */
  host: string | null
  finish: () => OutLine[]
}

export interface Trace {
  active: boolean
  elapsed: number
  total: number
}

export interface GoalView {
  label: string
  done: boolean
}

export interface HostView {
  ip: string
  name: string
  current: boolean
  access: boolean
  logsWiped: boolean
  guarded: boolean
  /** Only once you have seen them (connect/probe). */
  firewall: 'none' | 'up' | 'down'
  watchdog: boolean
  admin: 'none' | 'present' | 'away'
  proxy: boolean
  bounced: boolean
  trail: boolean
}

export type EndReason = 'done' | 'traced' | 'aborted'

const COMMANDS = [
  'help',
  'guide',
  'hint',
  'hints',
  'hosts',
  'scan',
  'connect',
  'disconnect',
  'probe',
  'bypass',
  'crack',
  'keys',
  'who',
  'distract',
  'ls',
  'stat',
  'cat',
  'get',
  'put',
  'rm',
  'decrypt',
  'logs',
  'wipe',
  'bounce',
  'route',
  'goals',
  'status',
  'payloads',
  'clear',
  'jackout',
  'abort',
] as const

/** Per-command manual pages for `help <cmd>`. */
const MAN: Record<string, string[]> = {
  hosts: ['hosts', 'Lists every machine on your map with what you know about it.'],
  scan: ['scan', 'Maps the machines linked to the host you are on. No shell needed — just a connection.'],
  connect: ['connect <ip>', 'Opens a session to a known host. Guarded hosts start (or feed) the back-trace.'],
  disconnect: ['disconnect', 'Logs off the current host. With every objective done, this ends the op cleanly.'],
  probe: ['probe [-q]', 'Lists the locks (ports) on this host and any firewall, watchdog or admin.', 'A watchdog hears a plain probe and jumps the trace. `probe -q` takes a few seconds but stays silent.'],
  bypass: ['bypass', 'Takes down a firewall so its locks can be cracked. Takes time; networking helps.'],
  crack: ['crack <port>', 'Breaks a lock and gives you a shell. Time depends on difficulty and your intrusion.', 'Under a watchdog the trace runs faster while you crack. A found key opens the lock instantly.'],
  keys: ['keys', 'Shows the keys you have found in careless notes, and which lock each one opens.'],
  who: ['who', 'Shows who else is logged in to this host. An admin at the keyboard speeds up the trace.'],
  distract: ['distract', 'Sends the admin on this host off to chase an imaginary emergency for a while. Once per host.'],
  ls: ['ls', 'Lists files on the host (needs a shell).'],
  stat: ['stat <file>', 'Quietly checks a file: genuine, stale look-alike, or bait with a tripwire. Always safe.'],
  cat: ['cat <file>', 'Reads a file. Encrypted files must be decrypted first. Credential notes give you keys.'],
  get: ['get <file>', 'Downloads a file to your drive.'],
  put: ['put <payload>', 'Uploads a file you carry (see `payloads`).'],
  rm: ['rm <file>', 'Deletes a file on the host.'],
  decrypt: ['decrypt <file>', 'Unscrambles an encrypted file so it can be read. Cryptography helps.'],
  logs: ['logs', 'Shows the access log on this host — your visit is written there.'],
  wipe: ['wipe', 'Clears this host’s access log. Every logging host you touched and did not wipe = heat.'],
  bounce: ['bounce <ip>', 'Adds a public relay to your route. Each hop makes the trace slower. Works any time.'],
  route: ['route', 'Shows your bounce chain.'],
  goals: ['goals', 'Objectives and the trace meter.'],
  status: ['status', 'Everything at a glance: objectives, trace, route, keys, beacons, trail.'],
  payloads: ['payloads', 'Files you are carrying for upload objectives.'],
  guide: ['guide [n]', 'The field manual, in five short pages. Start here if this is your first op.'],
  hint: ['hint', 'Suggests a sensible next step for where you are right now.'],
  hints: ['hints on|off', 'Turns the automatic tips on or off.'],
  jackout: ['jackout', 'Leave NOW with whatever you have. Some objectives done = partial pay; none = the op is blown.'],
  abort: ['abort', 'Same as `jackout`.'],
  clear: ['clear', 'Clears the screen.'],
}

const GUIDE: string[][] = [
  [
    'FIELD MANUAL 1/5 — THE MAP',
    'An op is a small network of made-up machines. You start knowing the front door and a public relay.',
    '  hosts            what you know        connect <ip>     step onto a machine',
    '  scan             reveal what the current machine links to',
    'Follow the links from the front door to the machine your objectives name.',
  ],
  [
    'FIELD MANUAL 2/5 — GETTING IN',
    'Machines with locks need a shell before you can touch their files.',
    '  probe            list the locks       crack <port>     break one (takes time)',
    '  bypass           a firewall blocks cracking until you take it down',
    '  keys             careless notes on other machines can hold a key — then a lock opens instantly',
  ],
  [
    'FIELD MANUAL 3/5 — DOING THE JOB',
    '  ls / stat <f>    list files / check a file quietly before you touch it',
    '  get / cat / rm   download, read, delete        put <payload>   leave a file',
    '  decrypt <f>      scrambled files must be unscrambled before reading',
    'Only take the file named in your objectives. Look-alikes can be bait (honeypots).',
  ],
  [
    'FIELD MANUAL 4/5 — STAYING HIDDEN',
    'Guarded machines start the back-trace. If the meter fills, you are traced: no pay, heat, trouble.',
    '  bounce <ip>      route through a public relay — each hop slows the trace (do it early!)',
    '  watchdogs        noisy commands jump the trace — use `probe -q`, avoid typos, crack fast',
    '  admins           the trace runs faster while they watch — `who`, then `distract`',
  ],
  [
    'FIELD MANUAL 5/5 — GETTING OUT',
    '  wipe             clear the log on each logging machine you touched (or it becomes heat)',
    '  disconnect       with every objective done: a CLEAN run (logs wiped) or a MESSY one (trail left)',
    '  jackout          bail early: some objectives = PARTIAL pay, none = ABORTED',
    'Stuck? `hint` suggests a next step. `help <command>` explains any command.',
  ],
]

export class MissionSim {
  readonly def: MissionDef
  readonly env: SimEnv
  readonly tier: number
  hosts = new Map<string, HostRuntime>()
  payloads = new Map<string, MissionFile>()
  currentHostId: string | null = null
  bounces: string[] = []
  trace: Trace = { active: false, elapsed: 0, total: 0 }
  job: Job | null = null
  /** Keys found in credential notes: `${hostId}:${port}` → the note it came from. */
  keys = new Map<string, string>()
  /** Honeypot beacons planted (each counts as a trail you cannot wipe). */
  beacons = 0
  /** Real seconds spent in the op so far. */
  seconds = 0
  /** Set once the mission ends. `won` = a clean exit with every objective done. */
  finished: 'won' | 'lost' | null = null
  endReason: EndReason | null = null
  lostReason = ''
  hintsOn: boolean
  private hinted = new Set<string>()
  private wantClear = false

  constructor(def: MissionDef, env: SimEnv, opts: SimOptions = {}) {
    this.def = def
    this.env = env
    this.tier = clampNum(Math.round(opts.tier ?? 1), 1, 5)
    this.hintsOn = opts.hints ?? false
    const goalFiles = new Set(def.goals.map(g => ('file' in g ? `${g.host}/${g.file}` : '')))
    for (const h of def.hosts) {
      const files = new Map<string, FileRuntime>()
      for (const f of h.files) {
        const isGoal = goalFiles.has(`${h.id}/${f.name}`)
        files.set(f.name, {
          def: f,
          decrypted: !f.encrypted,
          downloaded: false,
          read: false,
          deleted: false,
          decoy: !isGoal && (DECOY_RE.test(f.name) || (h.id === 'decoy' && f.name.includes('_MIRROR'))),
          honeypot: false,
          tripped: false,
        })
      }
      this.hosts.set(h.id, {
        def: h,
        known: false,
        scanned: false,
        probed: false,
        access: false,
        cracked: new Set(),
        logsWiped: false,
        touched: false,
        files,
        uploaded: new Set(),
        firewall: false,
        firewallDown: false,
        watchdog: false,
        admin: null,
      })
    }
    for (const id of def.known) {
      const h = this.hosts.get(id)
      if (h) h.known = true
    }
    for (const p of def.payloads ?? []) this.payloads.set(p.name, p)
    if (opts.rig) this.rig()
  }

  // ── Rigging (deterministic variety for generated ops) ─────────────────────

  private rig(): void {
    const r = mulberry(hashStr(`${this.def.id}|${this.def.hosts.map(h => h.ip).join(',')}`))
    const t = this.tier
    const goalHosts = new Set(this.def.goals.map(g => g.host))
    const locked = (h: HostRuntime): boolean => h.def.ports.some(p => p.difficulty > 0)

    for (const h of this.hosts.values()) {
      if (h.def.proxy) continue
      const isGoal = goalHosts.has(h.def.id)
      if (isGoal) {
        if (locked(h) && (t >= 3 || (t === 2 && r() < 0.5))) h.firewall = true
        if (h.def.logs && r() < ([0.15, 0.35, 0.55, 0.7, 0.8][t - 1] ?? 0.5)) h.watchdog = true
        if (t >= 2 && r() < 0.3 + 0.1 * (t - 2)) h.admin = { name: pickOf(r, ADMIN_NAMES, 'sysop'), away: 0, distracted: false }
      } else if (locked(h)) {
        if (t >= 4 && r() < 0.35) h.firewall = true
        if (h.def.logs && t >= 2 && r() < 0.3) h.watchdog = true
        if (t >= 3 && r() < 0.2) h.admin = { name: pickOf(r, ADMIN_NAMES, 'sysop'), away: 0, distracted: false }
      }
      const baitChance = [0.4, 0.6, 0.8, 1, 1][t - 1] ?? 0.6
      for (const f of h.files.values()) if (f.decoy && r() < baitChance) f.honeypot = true
    }

    // A careless credential note somewhere else, for a lock on the target.
    const target = [...this.hosts.values()].find(h => goalHosts.has(h.def.id) && locked(h))
    const noteChance = [0.45, 0.6, 0.7, 0.75, 0.8][t - 1] ?? 0.6
    if (target && r() < noteChance) {
      const holders = [...this.hosts.values()].filter(h => !goalHosts.has(h.def.id) && !h.def.proxy && h.def.id !== 'decoy')
      const holder = pickOf(r, holders, undefined)
      const port = target.def.ports.find(p => p.difficulty > 0)
      if (holder && port) {
        let name = pickOf(r, NOTE_NAMES, 'note.txt')
        for (let i = 2; holder.files.has(name); i++) name = name.replace(/(_\d+)?\.txt$/, `_${i}.txt`)
        const word = `${pickOf(r, KEY_WORDS, 'teacup')}-${Math.floor(r() * 90) + 10}`
        const content = [
          'NOTE TO SELF (do not lose this again):',
          `  ${target.def.name} — the ${port.service} on port ${port.port}`,
          `  key: "${word}"`,
          'Change it after the audit. (There was no audit.)',
        ].join('\n')
        holder.files.set(name, {
          def: { name, size: 90 + content.length, content },
          decrypted: true,
          downloaded: false,
          read: false,
          deleted: false,
          decoy: false,
          honeypot: false,
          tripped: false,
          grants: { host: target.def.id, port: port.port },
        })
      }
    }
  }

  // ── Derived views ──────────────────────────────────────────────────────────

  private guarded(h: HostRuntime): boolean {
    return h.def.logs || h.def.ports.some(p => p.difficulty > 0)
  }

  knownHosts(): HostView[] {
    const out: HostView[] = []
    for (const h of this.hosts.values()) {
      if (!h.known) continue
      const seen = h.touched || h.probed
      out.push({
        ip: h.def.ip,
        name: h.def.name,
        current: h.def.id === this.currentHostId,
        access: h.access,
        logsWiped: h.logsWiped,
        guarded: this.guarded(h),
        firewall: !seen || !h.firewall ? 'none' : h.firewallDown ? 'down' : 'up',
        watchdog: seen && h.watchdog,
        admin: !seen || !h.admin ? 'none' : h.admin.away > 0 ? 'away' : 'present',
        proxy: h.def.proxy === true,
        bounced: this.bounces.includes(h.def.id),
        trail: h.touched && h.def.logs && !h.logsWiped,
      })
    }
    return out
  }

  private goalText(g: MissionGoal): string {
    const host = this.hosts.get(g.host)?.def.name ?? g.host
    switch (g.kind) {
      case 'download':
        return `Download ${g.file} from ${host}`
      case 'read':
        return `Read ${g.file} on ${host}`
      case 'delete':
        return `Delete ${g.file} on ${host}`
      case 'upload':
        return `Upload ${g.file} to ${host}`
      case 'wipeLogs':
        return `Wipe the access logs on ${host}`
    }
  }

  private goalDone(g: MissionGoal): boolean {
    const h = this.hosts.get(g.host)
    if (!h) return false
    switch (g.kind) {
      case 'download':
        return h.files.get(g.file)?.downloaded === true
      case 'read':
        return h.files.get(g.file)?.read === true
      case 'delete':
        return h.files.get(g.file)?.deleted === true
      case 'upload':
        return h.uploaded.has(g.file)
      case 'wipeLogs':
        return h.logsWiped
    }
  }

  goals(): GoalView[] {
    return this.def.goals.map(g => ({ label: this.goalText(g), done: this.goalDone(g) }))
  }

  goalsDone(): number {
    return this.def.goals.filter(g => this.goalDone(g)).length
  }

  allGoalsDone(): boolean {
    return this.def.goals.every(g => this.goalDone(g))
  }

  /** Logging hosts you connected to and did not wipe. */
  trailCount(): number {
    let n = 0
    for (const h of this.hosts.values()) if (h.touched && h.def.logs && !h.logsWiped) n++
    return n
  }

  /** Hosts you connected to whose logs still carry your footprints. */
  hasUnwipedTrail(): boolean {
    return this.trailCount() > 0
  }

  jobProgress(): number {
    return this.job ? clampNum(this.job.elapsed / this.job.total, 0, 1) : 0
  }

  /** Current trace speed multiplier (admins watching, cracking under a watchdog). */
  traceRate(): number {
    let rate = 1
    const host = this.cur()
    if (host?.admin && host.admin.away <= 0) rate *= ADMIN_TRACE_MULT
    if (this.job?.kind === 'crack' && this.job.host && this.hosts.get(this.job.host)?.watchdog) rate *= WATCHDOG_CRACK_MULT
    return rate
  }

  /** Why the trace is faster right now (for the UI). */
  traceReasons(): string[] {
    const out: string[] = []
    const host = this.cur()
    if (host?.admin && host.admin.away <= 0) out.push(`admin ${host.admin.name} watching`)
    if (this.job?.kind === 'crack' && this.job.host && this.hosts.get(this.job.host)?.watchdog) out.push('cracking under a watchdog')
    return out
  }

  /** The report the Terminal hands to the engine (completeOp) when the op ends. */
  opResult(): OpResult {
    return {
      goalsDone: this.goalsDone(),
      goalsTotal: this.def.goals.length,
      traced: this.endReason === 'traced',
      aborted: this.endReason === 'aborted',
      logsLeft: this.trailCount() + this.beacons,
      secondsUsed: Math.round(this.seconds),
    }
  }

  consumeClear(): boolean {
    const c = this.wantClear
    this.wantClear = false
    return c
  }

  // ── Hints ──────────────────────────────────────────────────────────────────

  private tip(key: string, text: string): OutLine[] {
    if (!this.hintsOn || this.hinted.has(key)) return []
    this.hinted.add(key)
    return [line(`tip: ${text}`, 'hint')]
  }

  /** A sensible next step for the current situation (the `hint` command). */
  nextStep(): string {
    if (this.finished) return 'The op is over.'
    if (this.job) return `Wait for ${this.job.label} to finish (Ctrl-C cancels it).`
    const here = this.cur()
    if (this.allGoalsDone()) {
      if (here && here.touched && here.def.logs && !here.logsWiped && here.access) return 'Objectives done. `wipe` this host’s log, then `disconnect`.'
      const trail = [...this.hosts.values()].find(h => h.touched && h.def.logs && !h.logsWiped && h.access)
      if (trail) return `Objectives done. You left a trail on ${trail.def.name} — \`connect ${trail.def.ip}\` and \`wipe\`, or \`disconnect\` now for a messy run.`
      return 'Objectives done and tracks covered. `disconnect` to finish clean.'
    }
    const goal = this.def.goals.find(g => !this.goalDone(g))
    if (!goal) return '`disconnect` to finish.'
    const gh = this.hosts.get(goal.host)
    if (!gh) return 'Check `goals`.'
    if (this.bounces.length === 0 && !this.trace.active) {
      const relay = [...this.hosts.values()].find(h => h.known && h.def.proxy)
      if (relay) return `Before you touch anything guarded: \`bounce ${relay.def.ip}\` — it slows the trace for the whole op.`
    }
    if (!gh.known) {
      if (here && !here.scanned && (here.def.links ?? []).length > 0) return '`scan` to see what this machine links to.'
      const frontier = [...this.hosts.values()].find(h => h.known && !h.scanned && (h.def.links ?? []).some(l => !this.hosts.get(l)?.known))
      if (frontier) return `\`connect ${frontier.def.ip}\` (${frontier.def.name}) and \`scan\` from there.`
      return 'Keep mapping: `connect` to hosts you know and `scan`.'
    }
    if (this.currentHostId !== gh.def.id) return `\`connect ${gh.def.ip}\` — ${gh.def.name} is where the job is.`
    if (!gh.access) {
      if (gh.firewall && !gh.firewallDown) return 'A firewall is up. `bypass` it first.'
      const keyed = gh.def.ports.find(p => this.keys.has(`${gh.def.id}:${p.port}`) && !gh.cracked.has(p.port))
      if (keyed) return `You have a key: \`crack ${keyed.port}\` opens instantly.`
      if (!gh.probed) return gh.watchdog ? 'A watchdog listens: `probe -q` to see the locks quietly.' : '`probe` to see the locks.'
      const easiest = [...gh.def.ports].sort((a, b) => a.difficulty - b.difficulty)[0]
      const note = [...this.hosts.values()].some(h => h !== gh && [...h.files.values()].some(f => f.grants?.host === gh.def.id && !f.read))
      if (note && this.tier >= 2) return `Crack it (\`crack ${easiest?.port ?? '?'}\`) — or look around other machines for a careless note with the key.`
      return `\`crack ${easiest?.port ?? '<port>'}\` — the easiest lock.`
    }
    if (gh.admin && gh.admin.away <= 0 && !gh.admin.distracted) return `Admin ${gh.admin.name} is watching (faster trace). \`distract\` them, then get to work.`
    switch (goal.kind) {
      case 'download':
        return `\`get ${goal.file}\``
      case 'read': {
        const f = gh.files.get(goal.file)
        return f?.def.encrypted && !f.decrypted ? `\`decrypt ${goal.file}\`, then \`cat\` it.` : `\`cat ${goal.file}\``
      }
      case 'delete':
        return `\`rm ${goal.file}\``
      case 'upload':
        return `\`put ${goal.file}\``
      case 'wipeLogs':
        return '`wipe`'
    }
  }

  // ── Real-time advance ────────────────────────────────────────────────────

  tick(dt: number): OutLine[] {
    if (this.finished) return []
    const out: OutLine[] = []
    this.seconds += dt
    const rate = this.traceRate()
    if (this.job) {
      this.job.elapsed += dt
      if (this.job.elapsed >= this.job.total) {
        const done = this.job
        this.job = null
        out.push(...done.finish())
      }
    }
    for (const h of this.hosts.values()) {
      if (h.admin && h.admin.away > 0) {
        h.admin.away = Math.max(0, h.admin.away - dt)
        if (h.admin.away === 0 && h.def.id === this.currentHostId) {
          out.push(line(`! ${h.admin.name} is back at the keyboard on ${h.def.name}. The trace speeds up.`, 'warn'))
        }
      }
    }
    if (this.trace.active) this.advanceTrace(dt * rate, out)
    return out
  }

  private advanceTrace(amount: number, out: OutLine[]): void {
    const before = this.trace.elapsed
    this.trace.elapsed += amount
    for (const mark of [0.5, 0.75, 0.9]) {
      const t = this.trace.total * mark
      if (before < t && this.trace.elapsed >= t) {
        out.push(line(`! trace ${Math.round(mark * 100)}% — they are narrowing the route. Wrap it up.`, 'warn'))
        if (mark === 0.75 && this.allGoalsDone()) out.push(line('  Objectives are done — `disconnect` now if you want out.', 'warn'))
      }
    }
    if (this.trace.elapsed >= this.trace.total) {
      this.trace.elapsed = this.trace.total
      this.finished = 'lost'
      this.endReason = 'traced'
      this.job = null
      this.lostReason = 'The trace completed. Your connection was pinned before you got clear.'
      out.push(line('', 'out'))
      out.push(line('*** TRACE COMPLETE — CONNECTION PINNED ***', 'err'))
    }
  }

  /** Missions authored with traceSeconds <= 0 are untraced (e.g. a family laptop): no clock at all. */
  private get untraced(): boolean {
    return this.def.traceSeconds <= 0
  }

  private startTrace(): void {
    if (this.trace.active || this.untraced) return
    this.trace.active = true
    this.trace.elapsed = 0
    this.trace.total = traceTotal(this.def, this.env, this.bounces.length)
  }

  /** Jump the trace by a fraction of the meter (noise, honeypots). Starts it if needed. */
  private spike(frac: number, why: string, out: OutLine[]): void {
    if (this.untraced) return
    this.startTrace()
    out.push(line(`▲ ${why} — trace +${Math.round(frac * 100)}%`, 'err'))
    this.advanceTrace(this.trace.total * frac, out)
  }

  private recomputeTrace(): void {
    if (!this.trace.active) return
    const frac = this.trace.total > 0 ? this.trace.elapsed / this.trace.total : 0
    this.trace.total = traceTotal(this.def, this.env, this.bounces.length)
    this.trace.elapsed = this.trace.total * frac
  }

  cancelJob(): OutLine[] {
    if (!this.job) return [line('Nothing running.', 'dim')]
    const label = this.job.label
    this.job = null
    return [line(`^C  ${label} cancelled.`, 'warn')]
  }

  // ── Command execution ──────────────────────────────────────────────────────

  private cur(): HostRuntime | null {
    return this.currentHostId ? (this.hosts.get(this.currentHostId) ?? null) : null
  }

  private requireHost(): { host: HostRuntime } | { error: OutLine[] } {
    const host = this.cur()
    if (!host) return { error: [line('Not connected. Use `connect <ip>` first (`hosts` lists what you know).', 'err')] }
    return { host }
  }

  private requireAccess(host: HostRuntime): OutLine[] | null {
    if (host.access) return null
    return [
      line(`Access denied on ${host.def.name}.`, 'err'),
      line('You have a connection but no shell. Crack a lock first (`probe`, then `crack <port>`).', 'dim'),
      ...this.tip('denied', 'every lock you crack on a host gives the same shell — pick the easiest one.'),
    ]
  }

  /** A fumbled command on a watchdog host makes noise. */
  private fumble(out: OutLine[]): OutLine[] {
    const host = this.cur()
    if (host?.watchdog && host.touched && !this.finished) this.spike(NOISE.fumble, 'The watchdog heard a fumbled command', out)
    return out
  }

  exec(raw: string): OutLine[] {
    if (this.finished) return []
    const input = raw.trim()
    if (input === '') return []
    const parts = input.split(/\s+/)
    const cmd = (parts[0] ?? '').toLowerCase()
    const arg = parts[1] ?? ''
    // Help-type commands work even while a process runs.
    switch (cmd) {
      case 'help':
      case 'man':
      case '?':
        return this.cmdHelp(arg)
      case 'guide':
      case 'tutorial':
        return this.cmdGuide(arg)
      case 'hint':
        return [line(`hint: ${this.nextStep()}`, 'hint')]
      case 'hints':
        return this.cmdHints(arg)
      case 'goals':
        return this.cmdGoals()
      case 'status':
        return this.cmdStatus()
      case 'clear':
      case 'cls':
        this.wantClear = true
        return []
      case 'jackout':
      case 'abort':
      case 'quit':
        return this.cmdJackout()
      default:
        break
    }
    if (this.job) {
      return [line(`Busy: ${this.job.label} is still running. Wait, or press Ctrl-C to cancel it.`, 'warn')]
    }
    switch (cmd) {
      case 'hosts':
      case 'map':
        return this.cmdHosts()
      case 'scan':
        return this.cmdScan()
      case 'connect':
      case 'link':
      case 'ssh':
        return this.cmdConnect(arg)
      case 'disconnect':
      case 'exit':
      case 'logout':
        return this.cmdDisconnect()
      case 'probe':
        return this.cmdProbe(parts.slice(1))
      case 'bypass':
        return this.cmdBypass()
      case 'crack':
        return this.cmdCrack(arg)
      case 'keys':
        return this.cmdKeys()
      case 'who':
        return this.cmdWho()
      case 'distract':
        return this.cmdDistract()
      case 'ls':
      case 'dir':
        return this.cmdLs()
      case 'stat':
      case 'inspect':
        return this.cmdStat(arg)
      case 'cat':
      case 'read':
        return this.cmdCat(arg)
      case 'get':
      case 'download':
        return this.cmdGet(arg)
      case 'put':
      case 'upload':
        return this.cmdPut(arg)
      case 'rm':
      case 'del':
        return this.cmdRm(arg)
      case 'decrypt':
        return this.cmdDecrypt(arg)
      case 'logs':
        return this.cmdLogs()
      case 'wipe':
        return this.cmdWipe()
      case 'bounce':
        return this.cmdBounce(arg)
      case 'route':
        return this.cmdRoute()
      case 'payloads':
        return this.cmdPayloads()
      default:
        return this.fumble([line(`${cmd}: unknown command. Type \`help\` (or \`hint\` if you are stuck).`, 'err')])
    }
  }

  private cmdHelp(arg: string): OutLine[] {
    const topic = arg.toLowerCase()
    if (topic) {
      const page = MAN[topic]
      if (!page) return [line(`help: no manual entry for "${arg}". Type \`help\` for the list.`, 'err')]
      const [usage, ...body] = page
      return [line(usage ?? topic, 'sys'), ...body.map(b => line(`  ${b}`))]
    }
    return [
      line('LumenOS field console — commands  (`help <cmd>` for details, `guide` for the manual)', 'sys'),
      line('  MAP      hosts · scan · connect <ip> · disconnect'),
      line('  GET IN   probe [-q] · bypass · crack <port> · keys · who · distract'),
      line('  FILES    ls · stat <f> · cat <f> · get <f> · put <p> · rm <f> · decrypt <f> · payloads'),
      line('  HIDE     bounce <ip> · route · logs · wipe'),
      line('  OP       goals · status · hint · hints on|off · jackout · clear'),
      line('  Tab completes commands, addresses, ports and files. ↑/↓ recalls history. Ctrl-C stops a process.', 'dim'),
    ]
  }

  private cmdGuide(arg: string): OutLine[] {
    const n = arg ? Number.parseInt(arg, 10) : 1
    const idx = Number.isNaN(n) ? 0 : clampNum(n, 1, GUIDE.length) - 1
    const page = GUIDE[idx] ?? []
    const out = page.map((t, i) => line(i === 0 ? t : `  ${t}`, i === 0 ? 'sys' : 'out'))
    out.push(line(idx + 1 < GUIDE.length ? `  (\`guide ${idx + 2}\` for the next page)` : '  (end of the manual — good luck out there)', 'dim'))
    return out
  }

  private cmdHints(arg: string): OutLine[] {
    const a = arg.toLowerCase()
    if (a === 'on' || a === 'off') this.hintsOn = a === 'on'
    else if (a === '') this.hintsOn = !this.hintsOn
    else return [line('usage: hints on|off', 'dim')]
    return [line(`Automatic tips ${this.hintsOn ? 'ON' : 'OFF'}. (\`hint\` always works.)`, 'dim')]
  }

  private cmdHosts(): OutLine[] {
    const hs = this.knownHosts()
    if (hs.length === 0) return [line('No hosts known yet. If you are connected, try `scan`.', 'dim')]
    const out: OutLine[] = [line('KNOWN HOSTS', 'sys')]
    for (const h of hs) {
      const flags = [
        h.current ? 'here' : '',
        h.access ? 'shell' : '',
        h.proxy ? (h.bounced ? 'relay(in route)' : 'relay') : h.guarded ? 'guarded' : 'open',
        h.firewall === 'up' ? 'firewall' : '',
        h.watchdog ? 'watchdog' : '',
        h.admin === 'present' ? 'admin' : '',
        h.trail ? 'TRAIL' : '',
      ]
        .filter(Boolean)
        .join(' ')
      out.push(line(`  ${h.ip.padEnd(15)} ${h.name.slice(0, 30).padEnd(31)} ${flags}`))
    }
    return out
  }

  private cmdScan(): OutLine[] {
    const r = this.requireHost()
    if ('error' in r) return r.error
    const host = r.host
    host.scanned = true
    const links = host.def.links ?? []
    if (links.length === 0) return [line('scan: no further machines are reachable from here. (A dead end.)', 'dim')]
    const out: OutLine[] = [line(`Mapping links from ${host.def.name}...`, 'dim')]
    let found = 0
    for (const id of links) {
      const t = this.hosts.get(id)
      if (!t) continue
      const isNew = !t.known
      t.known = true
      if (isNew) found++
      out.push(line(`  + ${t.def.ip.padEnd(15)} ${t.def.name}${t.def.proxy ? '   (public relay — `bounce` it)' : ''}`, isNew ? 'good' : 'out'))
    }
    out.push(line(found ? `${found} new host(s) added to your map.` : 'No new hosts (all already known).', 'dim'))
    return out
  }

  private hostByIp(ip: string): HostRuntime | undefined {
    for (const h of this.hosts.values()) if (h.def.ip === ip) return h
    return undefined
  }

  private cmdConnect(arg: string): OutLine[] {
    if (!arg) return [line('usage: connect <ip>   (Tab completes known addresses)', 'dim')]
    const host = this.hostByIp(arg)
    if (!host?.known) return this.fumble([line(`connect: no route to ${arg}. Is it on your \`hosts\` list?`, 'err')])
    if (host.def.id === this.currentHostId) return [line(`Already connected to ${host.def.name}.`, 'dim')]
    this.currentHostId = host.def.id
    const out: OutLine[] = []
    if (this.bounces.length) out.push(line(`Routing through ${this.bounces.length} relay hop(s)...`, 'dim'))
    out.push(line(`Connected to ${host.def.name} [${host.def.ip}]`, 'good'))
    if (host.def.banner) out.push(line(host.def.banner, 'sys'))
    const firstTouch = !host.touched
    host.touched = true
    // Open ports (difficulty 0) grant a shell immediately; otherwise you must crack in.
    if (host.def.ports.every(p => p.difficulty <= 0)) host.access = true
    if (this.guarded(host)) {
      const wasActive = this.trace.active
      this.startTrace()
      if (host.def.logs) out.push(line(`This host keeps logs.${wasActive ? '' : ' A back-trace has started — watch the meter.'}`, 'warn'))
      else if (!wasActive) out.push(line('This host is guarded. A back-trace has started — watch the meter.', 'warn'))
      if (!wasActive) out.push(...this.tip('trace', this.bounces.length ? 'bounce through more relays to slow the trace further.' : 'no relays in your route — `bounce <relay ip>` slows the trace even now.'))
    }
    if (host.firewall && !host.firewallDown) {
      out.push(line('⛨ A firewall stands in front of the locks here.', 'warn'))
      out.push(...this.tip('firewall', '`bypass` takes the firewall down; then you can crack.'))
    }
    if (host.watchdog) {
      out.push(line('◉ A watchdog is listening on this host. Noisy commands will jump the trace.', 'warn'))
      out.push(...this.tip('watchdog', 'use `probe -q` (quiet) and avoid typos here. Cracking while it watches speeds the trace.'))
    }
    if (host.admin && host.admin.away <= 0) {
      out.push(line(`☺ Admin session active: ${host.admin.name} is at the keyboard. The trace runs faster while they watch.`, 'warn'))
      out.push(...this.tip('admin', '`distract` sends them off for a while (once per host).'))
    }
    if (firstTouch && host.access && !this.guarded(host)) out.push(...this.tip('scan', '`scan` shows what this machine links to; `ls` lists its files.'))
    return out
  }

  private cmdDisconnect(): OutLine[] {
    if (this.allGoalsDone()) {
      this.finished = 'won'
      this.endReason = 'done'
      const trail = this.trailCount() + this.beacons
      return [
        line('All objectives complete. Logging off...', 'good'),
        trail > 0 ? line(`You leave a trail on ${trail} machine(s). It will cost you heat.`, 'warn') : line('No trail left behind. Ghost.', 'good'),
        line('*** DISCONNECTED — JOB DONE ***', 'good'),
      ]
    }
    if (!this.currentHostId) return [line('Not connected. (To leave the op early, `jackout`.)', 'dim')]
    const name = this.cur()?.def.name ?? 'host'
    this.currentHostId = null
    return [
      line(`Disconnected from ${name}.`, 'out'),
      line('Objectives are not all done — the trace keeps running. Reconnect and finish, or `jackout` to bail.', 'dim'),
    ]
  }

  private cmdJackout(): OutLine[] {
    this.finished = 'lost'
    this.endReason = 'aborted'
    this.job = null
    const done = this.goalsDone()
    if (done > 0) {
      this.lostReason = `You jacked out with ${done}/${this.def.goals.length} objectives done.`
      return [line(`Jacking out with ${done}/${this.def.goals.length} objectives. Better than nothing.`, 'warn')]
    }
    this.lostReason = 'You pulled the plug and walked away. The job is blown.'
    return [line('Session aborted with nothing to show for it.', 'err')]
  }

  private cmdProbe(args: string[]): OutLine[] {
    const r = this.requireHost()
    if ('error' in r) return r.error
    const host = r.host
    const quiet = args.some(a => a === '-q' || a === '--quiet' || a === 'quiet')
    if (host.def.ports.length === 0) return [line('probe: no locks exposed on this host.', 'dim')]
    if (quiet && host.watchdog && !host.probed) {
      this.job = {
        kind: 'probe',
        label: 'quiet probe',
        elapsed: 0,
        total: QUIET_PROBE_SECONDS,
        host: host.def.id,
        finish: () => {
          host.probed = true
          return this.probeReport(host)
        },
      }
      return [line('Probing quietly, one lock at a time...', 'dim')]
    }
    const out: OutLine[] = []
    if (host.watchdog && !quiet) this.spike(NOISE.probe, 'The watchdog heard a loud probe', out)
    if (this.finished) return out
    host.probed = true
    return [...out, ...this.probeReport(host)]
  }

  private probeReport(host: HostRuntime): OutLine[] {
    const out: OutLine[] = [line(`Lock survey of ${host.def.name}:`, 'sys')]
    if (host.firewall) out.push(line(`  firewall          ${host.firewallDown ? 'DOWN' : 'UP — `bypass` first'}`, host.firewallDown ? 'good' : 'warn'))
    if (host.watchdog) out.push(line('  watchdog          LISTENING — keep it quiet', 'warn'))
    if (host.admin) out.push(line(`  admin session     ${host.admin.name} (${host.admin.away > 0 ? 'away' : 'at the keyboard'})`, host.admin.away > 0 ? 'dim' : 'warn'))
    for (const p of host.def.ports) {
      const key = this.keys.has(`${host.def.id}:${p.port}`)
      const st = p.difficulty <= 0 ? 'OPEN' : host.cracked.has(p.port) ? 'CRACKED' : `LOCKED (diff ${p.difficulty})${key ? ' — you have the key' : ''}`
      const eta = p.difficulty > 0 && !host.cracked.has(p.port) && !key ? `  ~${crackSeconds(p.difficulty, this.env).toFixed(0)}s` : ''
      out.push(line(`  port ${String(p.port).padEnd(6)} ${p.service.padEnd(16)} ${st}${eta}`, host.cracked.has(p.port) || p.difficulty <= 0 || key ? 'good' : 'out'))
    }
    return out
  }

  private cmdBypass(): OutLine[] {
    const r = this.requireHost()
    if ('error' in r) return r.error
    const host = r.host
    if (!host.firewall) return this.fumble([line('bypass: there is no firewall on this host.', 'dim')])
    if (host.firewallDown) return [line('The firewall is already down.', 'dim')]
    const total = bypassSeconds(this.tier, this.env)
    this.job = {
      kind: 'bypass',
      label: 'firewall bypass',
      elapsed: 0,
      total,
      host: host.def.id,
      finish: () => {
        host.firewallDown = true
        return [line(`✓ Firewall on ${host.def.name} folded like a lawn chair. The locks are exposed.`, 'good')]
      },
    }
    return [line(`Walking the firewall’s rulebook for a gap... (~${total.toFixed(1)}s)`, 'dim')]
  }

  private cmdCrack(arg: string): OutLine[] {
    const r = this.requireHost()
    if ('error' in r) return r.error
    const host = r.host
    const portNum = Number.parseInt(arg, 10)
    if (!arg || Number.isNaN(portNum)) return [line('usage: crack <port>  (see `probe`)', 'dim')]
    const port = host.def.ports.find(p => p.port === portNum)
    if (!port) return this.fumble([line(`crack: no lock on port ${arg}. (\`probe\` lists them.)`, 'err')])
    if (port.difficulty <= 0) {
      host.access = true
      return [line(`Port ${portNum} is already open — shell granted.`, 'good')]
    }
    if (host.cracked.has(portNum)) return [line(`Port ${portNum} is already cracked.`, 'dim')]
    if (host.firewall && !host.firewallDown) {
      return [line(`crack: the firewall is in the way. \`bypass\` it first.`, 'err'), ...this.tip('firewall', '`bypass` takes the firewall down; then you can crack.')]
    }
    const keySource = this.keys.get(`${host.def.id}:${portNum}`)
    if (keySource) {
      host.cracked.add(portNum)
      host.access = true
      return [line(`You try the key from ${keySource}... it fits. ${port.service}:${portNum} opens. Shell established.`, 'good')]
    }
    const total = crackSeconds(port.difficulty, this.env)
    this.job = {
      kind: 'crack',
      label: `crack ${port.service}:${portNum}`,
      elapsed: 0,
      total,
      host: host.def.id,
      finish: () => this.finishCrack(host, port),
    }
    const out = [line(`Working the ${port.service} on port ${portNum} (difficulty ${port.difficulty})...`, 'dim'), line(`Estimated ${total.toFixed(1)}s at your intrusion level.`, 'dim')]
    if (host.watchdog) out.push(line('The watchdog is watching — the trace runs faster until this is done.', 'warn'))
    return out
  }

  private finishCrack(host: HostRuntime, port: MissionPort): OutLine[] {
    host.cracked.add(port.port)
    host.access = true
    const out = [line(`✓ ${port.service}:${port.port} cracked. Shell established on ${host.def.name}.`, 'good')]
    if (host.def.logs) out.push(...this.tip('wipe', 'this host logs your visit — `wipe` before you leave for a clean run.'))
    return out
  }

  private cmdKeys(): OutLine[] {
    if (this.keys.size === 0) return [line('No keys found yet. Careless people leave notes on other machines...', 'dim')]
    const out: OutLine[] = [line('KEYS ON YOUR DRIVE', 'sys')]
    for (const [k, src] of this.keys) {
      const [hid, port] = k.split(':')
      const h = this.hosts.get(hid ?? '')
      out.push(line(`  ${h?.def.name ?? hid ?? '?'} port ${port ?? '?'}   (from ${src})`, 'good'))
    }
    return out
  }

  private cmdWho(): OutLine[] {
    const r = this.requireHost()
    if ('error' in r) return r.error
    const host = r.host
    const out: OutLine[] = [line(`Sessions on ${host.def.name}:`, 'sys'), line('  you          (via your route)')]
    if (host.admin) {
      out.push(line(`  ${host.admin.name.padEnd(12)} admin — ${host.admin.away > 0 ? `away (${Math.ceil(host.admin.away)}s)` : 'at the keyboard'}`, host.admin.away > 0 ? 'dim' : 'warn'))
    } else out.push(line('  nobody else. Nice and quiet.', 'dim'))
    return out
  }

  private cmdDistract(): OutLine[] {
    const r = this.requireHost()
    if ('error' in r) return r.error
    const host = r.host
    const admin = host.admin
    if (!admin) return this.fumble([line('distract: nobody here to distract.', 'dim')])
    if (admin.away > 0) return [line(`${admin.name} is already away.`, 'dim')]
    if (admin.distracted) return [line(`${admin.name} will not fall for that twice. They are watching now.`, 'err')]
    const what = DISTRACTIONS[hashStr(admin.name + host.def.id) % DISTRACTIONS.length] ?? DISTRACTIONS[0] ?? 'a paper jam'
    this.job = {
      kind: 'distract',
      label: 'distraction',
      elapsed: 0,
      total: DISTRACT_JOB_SECONDS,
      host: host.def.id,
      finish: () => {
        admin.distracted = true
        admin.away = DISTRACT_SECONDS
        return [line(`✓ ${admin.name} wanders off to deal with ${what}. You have about ${DISTRACT_SECONDS}s.`, 'good')]
      },
    }
    return [line('Cooking up a small emergency somewhere down the hall...', 'dim')]
  }

  private fileOn(host: HostRuntime, name: string): FileRuntime | undefined {
    const f = host.files.get(name)
    return f && !f.deleted ? f : undefined
  }

  private cmdLs(): OutLine[] {
    const r = this.requireHost()
    if ('error' in r) return r.error
    const host = r.host
    const gate = this.requireAccess(host)
    if (gate) return gate
    const files = [...host.files.values()].filter(f => !f.deleted)
    if (files.length === 0) return [line('(no files)', 'dim')]
    const out: OutLine[] = [line(`Files on ${host.def.name}:`, 'sys')]
    const goalNames = new Set(this.def.goals.filter(g => g.host === host.def.id && 'file' in g).map(g => ('file' in g ? g.file : '')))
    for (const f of files) {
      const tags: string[] = []
      if (f.def.encrypted && !f.decrypted) tags.push('[encrypted]')
      if (goalNames.has(f.def.name)) tags.push('← objective')
      if (f.grants && !f.read) tags.push('[note]')
      out.push(line(`  ${String(f.def.size).padStart(7)}  ${f.def.name}${tags.length ? `  ${tags.join(' ')}` : ''}`, goalNames.has(f.def.name) ? 'good' : f.def.encrypted && !f.decrypted ? 'warn' : 'out'))
    }
    if (files.some(f => f.decoy)) out.push(...this.tip('decoy', 'look-alike files can be bait. `stat <file>` checks one quietly; take only what the objectives name.'))
    if (files.some(f => f.def.encrypted && !f.decrypted)) out.push(...this.tip('encrypted', 'encrypted files need `decrypt <file>` before they can be read.'))
    if (files.some(f => f.grants && !f.read)) out.push(...this.tip('note', 'that note looks careless. `cat` it.'))
    return out
  }

  private cmdStat(arg: string): OutLine[] {
    const r = this.requireHost()
    if ('error' in r) return r.error
    const host = r.host
    const gate = this.requireAccess(host)
    if (gate) return gate
    if (!arg) return [line('usage: stat <file>', 'dim')]
    const f = this.fileOn(host, arg)
    if (!f) return this.fumble([line(`stat: ${arg}: no such file.`, 'err')])
    const out: OutLine[] = [line(`${f.def.name}: ${f.def.size} bytes${f.def.encrypted && !f.decrypted ? ', encrypted' : ''}`, 'sys')]
    if (f.honeypot) out.push(line('  checksum: FORGED — a tripwire is stitched into it. Bait. Do not touch.', 'err'))
    else if (f.decoy) out.push(line('  checksum: stale — an old look-alike. Harmless, and useless.', 'warn'))
    else if (f.grants) out.push(line('  a plain text note, last edited by somebody in a hurry.', 'out'))
    else out.push(line('  checksum: consistent — this is a genuine file.', 'good'))
    return out
  }

  /** Touching bait: trace jump + a beacon. Returns true if the op just ended. */
  private touch(f: FileRuntime, out: OutLine[]): boolean {
    if (!f.honeypot || f.tripped) return false
    f.tripped = true
    this.beacons += 1
    out.push(line(`▲ HONEYPOT — ${f.def.name} was bait. It phoned home the moment you touched it.`, 'err'))
    out.push(line('  A beacon is on record now: that is a trail you cannot wipe.', 'warn'))
    this.spike(NOISE.honeypot, 'The tripwire lit up', out)
    return this.finished !== null
  }

  private cmdCat(arg: string): OutLine[] {
    const r = this.requireHost()
    if ('error' in r) return r.error
    const host = r.host
    const gate = this.requireAccess(host)
    if (gate) return gate
    if (!arg) return [line('usage: cat <file>', 'dim')]
    const f = this.fileOn(host, arg)
    if (!f) return this.fumble([line(`cat: ${arg}: no such file.`, 'err')])
    const out: OutLine[] = []
    if (this.touch(f, out)) return out
    if (f.def.encrypted && !f.decrypted) {
      return [...out, line(`cat: ${arg} is encrypted — run \`decrypt ${arg}\` first.`, 'err'), line('The bytes read as noise: ░▒▓█▒ ▓█░▒█▓ ▒█░', 'dim')]
    }
    f.read = true
    const body = f.def.content ?? '(the file is empty)'
    out.push(line(`== ${f.def.name} ==`, 'sys'))
    for (const l of body.split('\n')) out.push(line(l))
    if (f.grants) out.push(...this.learnKey(f))
    out.push(...this.goalCheck())
    return out
  }

  private learnKey(f: FileRuntime): OutLine[] {
    const g = f.grants
    if (!g) return []
    const k = `${g.host}:${g.port}`
    if (this.keys.has(k)) return []
    this.keys.set(k, f.def.name)
    const h = this.hosts.get(g.host)
    return [
      line(`🔑 Key noted: port ${g.port} on ${h?.def.name ?? g.host}. \`crack ${g.port}\` there opens instantly.`, 'good'),
      ...this.tip('key', '`keys` lists every key you have found.'),
    ]
  }

  private cmdGet(arg: string): OutLine[] {
    const r = this.requireHost()
    if ('error' in r) return r.error
    const host = r.host
    const gate = this.requireAccess(host)
    if (gate) return gate
    if (!arg) return [line('usage: get <file>', 'dim')]
    const f = this.fileOn(host, arg)
    if (!f) return this.fumble([line(`get: ${arg}: no such file.`, 'err')])
    const out: OutLine[] = []
    if (this.touch(f, out)) return out
    f.downloaded = true
    if (!f.def.encrypted || f.decrypted) f.read = true
    out.push(line(`Downloading ${f.def.name} (${f.def.size} bytes)... done. Saved to your drive.`, 'good'))
    if (f.grants) out.push(...this.learnKey(f))
    out.push(...this.goalCheck())
    return out
  }

  private cmdPut(arg: string): OutLine[] {
    const r = this.requireHost()
    if ('error' in r) return r.error
    const host = r.host
    const gate = this.requireAccess(host)
    if (gate) return gate
    if (!arg) return [line('usage: put <payload>  (see `payloads`)', 'dim')]
    const p = this.payloads.get(arg)
    if (!p) return this.fumble([line(`put: no payload named ${arg} on your drive. Try \`payloads\`.`, 'err')])
    host.uploaded.add(p.name)
    return [line(`Uploaded ${p.name} to ${host.def.name}. It is in place.`, 'good'), ...this.goalCheck()]
  }

  private cmdRm(arg: string): OutLine[] {
    const r = this.requireHost()
    if ('error' in r) return r.error
    const host = r.host
    const gate = this.requireAccess(host)
    if (gate) return gate
    if (!arg) return [line('usage: rm <file>', 'dim')]
    const f = this.fileOn(host, arg)
    if (!f) return this.fumble([line(`rm: ${arg}: no such file.`, 'err')])
    const out: OutLine[] = []
    if (this.touch(f, out)) return out
    f.deleted = true
    out.push(line(`Removed ${f.def.name}. It won’t be on the next backup.`, 'good'))
    out.push(...this.goalCheck())
    return out
  }

  private cmdDecrypt(arg: string): OutLine[] {
    const r = this.requireHost()
    if ('error' in r) return r.error
    const host = r.host
    const gate = this.requireAccess(host)
    if (gate) return gate
    if (!arg) return [line('usage: decrypt <file>', 'dim')]
    const f = this.fileOn(host, arg)
    if (!f) return this.fumble([line(`decrypt: ${arg}: no such file.`, 'err')])
    if (!f.def.encrypted || f.decrypted) return [line(`${arg} is already readable.`, 'dim')]
    const total = decryptSeconds(f.def, this.env)
    this.job = {
      kind: 'decrypt',
      label: `decrypt ${f.def.name}`,
      elapsed: 0,
      total,
      host: host.def.id,
      finish: () => {
        f.decrypted = true
        if (f.downloaded) f.read = true
        return [line(`✓ ${f.def.name} decrypted. It reads clean now.`, 'good'), ...this.goalCheck()]
      },
    }
    return [line(`Running the cipher wheel against ${f.def.name}... (${total.toFixed(1)}s)`, 'dim')]
  }

  private cmdLogs(): OutLine[] {
    const r = this.requireHost()
    if ('error' in r) return r.error
    const host = r.host
    const gate = this.requireAccess(host)
    if (gate) return gate
    if (!host.def.logs) return [line('This host keeps no access logs. Nothing to see.', 'dim')]
    if (host.logsWiped) return [line('Access log is empty — you wiped it.', 'dim')]
    return [
      line(`Access log — ${host.def.name}`, 'sys'),
      line('  ..:.. session opened from an unrecognised route'),
      line('  ..:.. shell granted to "guest-ish"'),
      line('  ..:.. somebody poked around the files'),
      line('Your visit is written here. `wipe` clears it.', 'warn'),
    ]
  }

  private cmdWipe(): OutLine[] {
    const r = this.requireHost()
    if ('error' in r) return r.error
    const host = r.host
    const gate = this.requireAccess(host)
    if (gate) return gate
    if (!host.def.logs) return [line('No logs on this host to wipe.', 'dim')]
    if (host.logsWiped) return [line('Already wiped.', 'dim')]
    host.logsWiped = true
    return [line(`Access log on ${host.def.name} wiped. You were never here.`, 'good'), ...this.goalCheck()]
  }

  /** Announce when every objective is ticked off (always, not a tip). */
  private goalCheck(): OutLine[] {
    if (!this.allGoalsDone() || this.hinted.has('all-done')) return []
    this.hinted.add('all-done')
    const trail = this.trailCount()
    return [
      line('★ All objectives complete.', 'good'),
      line(trail > 0 ? `  ${trail} machine(s) still carry your trail — \`wipe\` them for a clean run, or \`disconnect\` now.` : '  Tracks covered. `disconnect` to finish clean.', 'hint'),
    ]
  }

  private cmdBounce(arg: string): OutLine[] {
    if (!arg) {
      const relays = [...this.hosts.values()].filter(h => h.known && h.def.proxy && !this.bounces.includes(h.def.id))
      return [line(`usage: bounce <ip>${relays.length ? `   (relays you know: ${relays.map(h => h.def.ip).join(', ')})` : ''}`, 'dim')]
    }
    const host = this.hostByIp(arg)
    if (!host?.known) return this.fumble([line(`bounce: ${arg} is not a host you know.`, 'err')])
    if (!host.def.proxy) return [line(`bounce: ${host.def.name} won’t relay for you (not a public relay).`, 'err')]
    if (this.bounces.includes(host.def.id)) return [line(`${host.def.name} is already in the route.`, 'dim')]
    this.bounces.push(host.def.id)
    this.recomputeTrace()
    return [line(`+ ${host.def.name} added to your route (${this.bounces.length} hop(s)). Trace slowed.`, 'good')]
  }

  private cmdRoute(): OutLine[] {
    if (this.bounces.length === 0) return [line('Route: direct (no relays). `bounce <ip>` to add hops.', 'dim')]
    const out: OutLine[] = [line('Route:', 'sys'), line('  you')]
    this.bounces.forEach(id => {
      const h = this.hosts.get(id)
      out.push(line(`  → ${h?.def.name ?? id} [${h?.def.ip ?? '?'}]`))
    })
    out.push(line('  → target', 'dim'))
    return out
  }

  private cmdPayloads(): OutLine[] {
    if (this.payloads.size === 0) return [line('You are not carrying any payloads for this job.', 'dim')]
    const out: OutLine[] = [line('Payloads on your drive:', 'sys')]
    for (const p of this.payloads.values()) out.push(line(`  ${String(p.size).padStart(7)}  ${p.name}`))
    return out
  }

  private traceLine(): OutLine {
    if (!this.trace.active) return line('Trace: not started.', 'dim')
    const pctv = Math.round((this.trace.elapsed / this.trace.total) * 100)
    const rate = this.traceRate()
    const left = (this.trace.total - this.trace.elapsed) / rate
    return line(`Trace: ${pctv}%  (~${left.toFixed(0)}s of slack${rate > 1 ? `, running ×${rate.toFixed(1)}: ${this.traceReasons().join(', ')}` : ''})`, pctv > 75 ? 'err' : 'warn')
  }

  private cmdGoals(): OutLine[] {
    const out: OutLine[] = [line('OBJECTIVES', 'sys')]
    for (const g of this.goals()) out.push(line(`  [${g.done ? '✓' : ' '}] ${g.label}`, g.done ? 'good' : 'out'))
    out.push(this.traceLine())
    out.push(line('When every box is checked, `disconnect` to finish.', 'dim'))
    return out
  }

  private cmdStatus(): OutLine[] {
    const out = this.cmdGoals().slice(0, -1)
    out.push(line(`Route: ${this.bounces.length ? `${this.bounces.length} relay hop(s)` : 'direct'}   Keys: ${this.keys.size}   Beacons: ${this.beacons}   Trail: ${this.trailCount()} host(s)`, 'dim'))
    if (this.job) out.push(line(`Running: ${this.job.label} (${Math.round(this.jobProgress() * 100)}%)`, 'dim'))
    return out
  }

  // ── Tab completion ─────────────────────────────────────────────────────────

  complete(input: string): string[] {
    const parts = input.split(/\s+/)
    if (parts.length <= 1) {
      const p = (parts[0] ?? '').toLowerCase()
      return COMMANDS.filter(c => c.startsWith(p))
    }
    const cmd = (parts[0] ?? '').toLowerCase()
    const frag = parts[parts.length - 1] ?? ''
    if (cmd === 'connect' || cmd === 'link' || cmd === 'ssh') {
      return this.knownHosts()
        .map(h => h.ip)
        .filter(ip => ip.startsWith(frag))
    }
    if (cmd === 'bounce') {
      return this.knownHosts()
        .filter(h => h.proxy)
        .map(h => h.ip)
        .filter(ip => ip.startsWith(frag))
    }
    if (cmd === 'crack') {
      const host = this.cur()
      if (!host) return []
      return host.def.ports.map(p => String(p.port)).filter(s => s.startsWith(frag))
    }
    if (cmd === 'probe') return ['-q'].filter(s => s.startsWith(frag))
    if (cmd === 'hints') return ['on', 'off'].filter(s => s.startsWith(frag))
    if (cmd === 'help' || cmd === 'man') return Object.keys(MAN).filter(s => s.startsWith(frag))
    if (cmd === 'guide') return GUIDE.map((_, i) => String(i + 1)).filter(s => s.startsWith(frag))
    if (cmd === 'put' || cmd === 'upload') {
      return [...this.payloads.keys()].filter(n => n.startsWith(frag))
    }
    if (['cat', 'read', 'get', 'download', 'rm', 'del', 'decrypt', 'stat', 'inspect'].includes(cmd)) {
      const host = this.cur()
      if (!host?.access) return []
      return [...host.files.values()].filter(f => !f.deleted).map(f => f.def.name).filter(n => n.startsWith(frag))
    }
    return []
  }
}
