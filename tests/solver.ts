/**
 * Headless terminal solver. Plays the REAL Terminal simulator (src/ui/terminal/sim.ts `MissionSim`)
 * for a MissionDef the way a person would: typing invented game commands one at a time, with think
 * time between them, advancing simulated real time with `tick()` while jobs run and the trace fills.
 *
 * FICTION NOTE: every command here is one of the Terminal minigame's own invented verbs (`scan`,
 * `crack <port>`, `bounce <ip>`...) acting on in-memory puzzle data. Nothing here touches or
 * describes a real system.
 *
 * Player quality `q` (0..1) is separate from the character's skills (the SimEnv):
 *  - think time between commands shrinks with q (≈5 s weak → ≈1.5 s strong);
 *  - typos (unknown commands — noise under a watchdog) get rarer;
 *  - strong players bounce every relay they know before touching anything guarded, `probe -q`
 *    under watchdogs, `distract` admins, read careless credential notes on the way, never touch
 *    look-alike files, wipe logs as they go, and jack out when the trace will beat them;
 *  - weak players forget to bounce, probe loudly, grab look-alikes (honeypots), misjudge the trace.
 *
 * The solver only acts on what the player could see on screen (known hosts, scan results, probe
 * reports, connect warnings, `ls` tags, `stat` verdicts, the trace meter) — it never peeks at hidden
 * rigging such as which look-alike is bait.
 */
import type { MissionDef, OpResult } from '../src/engine'
import { crackSeconds, bypassSeconds, decryptSeconds, MissionSim, traceTotal, type SimEnv } from '../src/ui/terminal/sim'

export type SolveOutcome = 'clean' | 'messy' | 'partial' | 'aborted' | 'traced'

export interface SolveOptions {
  /** Player quality 0..1 (0.2 = fumbling beginner, 0.6 = competent, 1 = expert). */
  quality: number
  /** RNG seed for think-time jitter, typos and judgement calls. */
  seed?: number
  /** Rig the op (generated contract ops are rigged; hand-authored story missions are not). */
  rig?: boolean
  /** 1..5 — rigging tier. */
  tier?: number
  /** Give up (jack out) after this many simulated seconds. Default 600. */
  maxSeconds?: number
  /** Keep a transcript of commands (for debugging). */
  transcript?: boolean
}

export interface SolveResult {
  outcome: SolveOutcome
  result: OpResult
  /** The sim's own verdict (`won` = every objective done and disconnected). */
  finished: 'won' | 'lost'
  seconds: number
  commands: number
  typos: number
  bounces: number
  honeypots: number
  keysUsed: number
  /** Trace meter fill (0..1) when the op ended. */
  traceFill: number
  transcript: string[]
}

/** Outcome as the engine's completeOp classifies an OpResult. */
export function classify(r: OpResult): SolveOutcome {
  if (r.traced) return 'traced'
  if (r.goalsDone >= r.goalsTotal) return r.logsLeft === 0 ? 'clean' : 'messy'
  return r.goalsDone > 0 ? 'partial' : 'aborted'
}

/** A reasonable character build for a hacker who is working at `tier` (1..5). */
export function envForTier(tier: number): SimEnv {
  const t = Math.min(5, Math.max(1, Math.round(tier)))
  const intrusion = [12, 24, 36, 50, 64][t - 1] ?? 12
  const cryptography = [6, 15, 26, 38, 50][t - 1] ?? 6
  const opsec = [6, 15, 26, 38, 50][t - 1] ?? 6
  const networking = [10, 20, 32, 44, 56][t - 1] ?? 10
  const crackSpeed = [1, 1.15, 1.3, 1.5, 1.75][t - 1] ?? 1
  const traceGear = [1, 1.1, 1.2, 1.35, 1.5][t - 1] ?? 1
  return { intrusion, cryptography, opsec, networking, crackSpeed, traceMult: traceGear * (1 + opsec * 0.012) }
}

// ── Small deterministic RNG ──────────────────────────────────────────────────

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

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

const DT = 0.2
/** Look-alike names as a player reads them (the sim's own decoy suffixes). */
const LOOKALIKE_RE = /(_old|_backup|_copy|_draft|_DO_NOT_USE|_final_FINAL|_v2|_MIRROR)(_\d+)?(\.|$)/

type Host = MissionSim['hosts'] extends Map<string, infer H> ? H : never

class Player {
  readonly sim: MissionSim
  readonly q: number
  readonly rng: () => number
  readonly maxSeconds: number
  readonly log: string[] | null
  commands = 0
  typos = 0
  honeypots = 0
  keysUsed = 0
  /** Per-host judgement calls, rolled once (so a player is consistent within an op). */
  private willDistract = new Map<string, boolean>()
  private willQuiet = new Map<string, boolean>()
  private willBounce = new Map<string, boolean>()
  private listed = new Set<string>()
  private looked = new Set<string>()
  private statted = new Set<string>()
  private fiddled = new Set<string>()
  private wipeAsYouGo: boolean
  private careless: boolean
  private stubborn: boolean
  /** Trails the player has decided they cannot afford to go back and wipe. */
  private abandoned = new Set<string>()
  /** Decided once, when the objectives are all done: bother covering tracks? */
  private wantsClean: boolean | null = null

  constructor(sim: MissionSim, opts: SolveOptions) {
    this.sim = sim
    this.q = Math.min(1, Math.max(0, opts.quality))
    this.rng = mulberry((opts.seed ?? 1) * 2654435761 + 7)
    this.maxSeconds = opts.maxSeconds ?? 600
    this.log = opts.transcript ? [] : null
    this.wipeAsYouGo = this.rng() < lerp(0.1, 1, this.q)
    this.careless = this.rng() < lerp(0.55, 0, this.q)
    // Stubborn players keep pushing when the meter says run.
    this.stubborn = this.rng() < lerp(0.75, 0, Math.min(1, this.q * 1.4))
  }

  private roll(map: Map<string, boolean>, key: string, p: number): boolean {
    let v = map.get(key)
    if (v === undefined) {
      v = this.rng() < p
      map.set(key, v)
    }
    return v
  }

  // ── Time ────────────────────────────────────────────────────────────────

  private thinkSeconds(): number {
    const mean = lerp(5, 1.5, this.q)
    return mean * (0.6 + this.rng() * 0.8)
  }

  /** Advance real time; stop early if the op ends. */
  private wait(seconds: number): void {
    let left = seconds
    while (left > 1e-9 && !this.sim.finished) {
      const dt = Math.min(DT, left)
      this.sim.tick(dt)
      left -= dt
    }
  }

  /** Seconds of trace left at the current rate (Infinity if not running). */
  slack(): number {
    const t = this.sim.trace
    if (!t.active) return Infinity
    return (t.total - t.elapsed) / this.sim.traceRate()
  }

  /** Type a command (with think time and the odd typo), then wait out any job it starts. */
  private over(): boolean {
    return this.sim.finished !== null
  }

  private type(cmd: string): void {
    if (this.over()) return
    this.wait(this.thinkSeconds())
    if (this.over()) return
    const typoRate = lerp(0.12, 0.01, this.q)
    if (this.rng() < typoRate) {
      this.typos++
      this.commands++
      const bad = cmd.length > 3 ? cmd.slice(0, 1) + cmd.slice(2) : `${cmd}x`
      this.log?.push(`[${this.sim.seconds.toFixed(1)}] > ${bad}   (typo)`)
      this.sim.exec(bad)
      this.wait(this.thinkSeconds() * 0.6)
      if (this.over()) return
    }
    this.commands++
    this.log?.push(`[${this.sim.seconds.toFixed(1)}] > ${cmd}`)
    const beacons = this.sim.beacons
    this.sim.exec(cmd)
    if (this.sim.beacons > beacons) this.honeypots += this.sim.beacons - beacons
    this.waitJob()
  }

  /** Wait for a running job; a sharp player cancels and bails if it would outlast the trace. */
  private waitJob(): void {
    // Whether the player glances at the meter while this job runs is decided once per job.
    const watching = this.noticesDanger()
    while (this.sim.job && !this.over()) {
      const job = this.sim.job
      const left = job.total - job.elapsed
      if (watching && this.sim.trace.active && left > this.slack()) {
        this.sim.cancelJob()
        this.log?.push(`[${this.sim.seconds.toFixed(1)}] ^C (job would outlast the trace)`)
        return
      }
      this.wait(DT)
    }
  }

  /** Does the player look at the meter and take it seriously right now? */
  private noticesDanger(): boolean {
    if (this.stubborn) return this.rng() < 0.02
    return this.rng() < lerp(0.08, 0.6, this.q)
  }

  // ── Knowledge helpers (only what is on screen) ──────────────────────────

  private cur(): Host | null {
    return this.sim.currentHostId ? (this.sim.hosts.get(this.sim.currentHostId) ?? null) : null
  }

  private host(id: string): Host | undefined {
    return this.sim.hosts.get(id)
  }


  private hasTrail(h: Host): boolean {
    return h.touched && h.def.logs && !h.logsWiped
  }

  private keyFor(h: Host): number | undefined {
    return h.def.ports.find(p => p.difficulty > 0 && this.sim.keys.has(`${h.def.id}:${p.port}`) && !h.cracked.has(p.port))?.port
  }

  private easiestPort(h: Host): { port: number; difficulty: number } | undefined {
    return [...h.def.ports].filter(p => !h.cracked.has(p.port)).sort((a, b) => a.difficulty - b.difficulty)[0]
  }

  /** Rough seconds to finish the remaining objectives from here. */
  private eta(): number {
    const think = lerp(5, 1.5, this.q)
    let seconds = 0
    const pending = this.sim.def.goals.filter((_, i) => !(this.sim.goals()[i]?.done ?? false))
    const seenHosts = new Set<string>()
    for (const g of pending) {
      const h = this.host(g.host)
      if (!h) continue
      seconds += think * 1.5
      if (!seenHosts.has(h.def.id)) {
        seenHosts.add(h.def.id)
        if (!h.known) seconds += think * 4
        if (this.sim.currentHostId !== h.def.id) seconds += think
        if (!h.access) {
          seconds += think * 2
          if (h.firewall && !h.firewallDown) seconds += bypassSeconds(this.sim.tier, this.sim.env)
          const p = this.easiestPort(h)
          if (p && this.keyFor(h) === undefined) seconds += crackSeconds(h.probed ? p.difficulty : Math.max(1, p.difficulty), this.sim.env) * (h.watchdog ? 1.5 : 1)
        }
      }
      if (g.kind === 'read') {
        const f = h.files.get(g.file)
        if (f?.def.encrypted && !f.decrypted) seconds += decryptSeconds(f.def, this.sim.env) + think
      }
    }
    return seconds
  }

  // ── The loop ─────────────────────────────────────────────────────────────

  play(): void {
    for (let guard = 0; guard < 400 && !this.sim.finished; guard++) {
      if (this.sim.seconds > this.maxSeconds) {
        this.type('jackout')
        break
      }
      this.step()
    }
    if (!this.sim.finished) this.sim.exec('jackout')
  }

  private step(): void {
    const sim = this.sim
    // 1) Bounce through every relay we know and mean to use (cheap, works any time).
    for (const h of sim.hosts.values()) {
      if (!h.known || h.def.proxy !== true || sim.bounces.includes(h.def.id)) continue
      if (this.roll(this.willBounce, h.def.id, lerp(0.25, 1, this.q))) {
        this.type(`bounce ${h.def.ip}`)
        return
      }
    }

    // 2) Everything done: cover tracks if there is time, then leave.
    if (sim.allGoalsDone()) {
      this.coverTracksAndLeave()
      return
    }

    // 3) The trace will beat us: bail with what we have (if we look at the meter).
    if (sim.trace.active) {
      const slack = this.slack()
      const eta = this.eta() * lerp(0.5, 1.05, this.q) * (0.8 + this.rng() * 0.4)
      if (eta > slack && this.noticesDanger()) {
        this.type('jackout')
        return
      }
    }

    const goalIdx = sim.goals().findIndex(g => !g.done)
    const goal = sim.def.goals[goalIdx]
    if (!goal) {
      this.type('disconnect')
      return
    }
    const gh = this.host(goal.host)
    if (!gh) {
      this.type('jackout')
      return
    }

    const here = this.cur()

    // 4) On a host with a shell: look around once (credential notes), maybe fiddle, wipe as you go.
    if (here && here.access && here.def.id !== gh.def.id) {
      if (this.maybeLookAround(here)) return
      if (this.hasTrail(here) && this.wipeAsYouGo) {
        this.type('wipe')
        return
      }
    }

    // 5) Find the goal host.
    if (!gh.known) {
      if (here && !here.scanned) {
        this.type('scan')
        return
      }
      const frontier = [...sim.hosts.values()]
        .filter(h => h.known && !h.scanned && h.def.id !== sim.currentHostId)
        .sort((a, b) => Number(a.def.proxy === true) - Number(b.def.proxy === true))
      const next = frontier[frontier.length > 1 && !this.careless ? 0 : Math.floor(this.rng() * frontier.length)] ?? frontier[0]
      if (next) {
        this.type(`connect ${next.def.ip}`)
        return
      }
      this.type('jackout')
      return
    }

    // 6) Go there.
    if (sim.currentHostId !== gh.def.id) {
      if (here && here.access && this.hasTrail(here) && this.wipeAsYouGo) {
        this.type('wipe')
        return
      }
      this.type(`connect ${gh.def.ip}`)
      return
    }

    // 7) Get a shell.
    const admin = gh.admin
    if (admin && admin.away <= 0 && !admin.distracted && this.roll(this.willDistract, gh.def.id, lerp(0.1, 1, this.q))) {
      this.type('distract')
      return
    }
    if (!gh.access) {
      if (gh.firewall && !gh.firewallDown) {
        this.type('bypass')
        return
      }
      const keyed = this.keyFor(gh)
      if (keyed !== undefined) {
        this.keysUsed++
        this.type(`crack ${keyed}`)
        return
      }
      if (!gh.probed && gh.def.ports.length > 0) {
        const quiet = gh.watchdog && this.roll(this.willQuiet, gh.def.id, lerp(0.15, 1, this.q))
        this.type(quiet ? 'probe -q' : 'probe')
        return
      }
      // A sharp player who has not looked for a key yet goes hunting when the lock is slow.
      const p = this.easiestPort(gh)
      if (!p) {
        this.type('jackout')
        return
      }
      if (p.difficulty <= 0) {
        this.type(`crack ${p.port}`)
        return
      }
      const crack = crackSeconds(p.difficulty, sim.env) * (gh.watchdog ? 1.5 : 1)
      if (crack > 12 && this.q >= 0.7 && this.hostsToSearch().length > 0 && this.slack() > crack * 2.5) {
        const h = this.hostsToSearch()[0]
        if (h) {
          this.type(`connect ${h.def.ip}`)
          return
        }
      }
      this.type(`crack ${p.port}`)
      return
    }

    // 8) Do the job (weak players sometimes grab a look-alike first).
    if (this.maybeFiddle(gh)) return
    switch (goal.kind) {
      case 'download':
        this.type(`get ${goal.file}`)
        return
      case 'read': {
        const f = gh.files.get(goal.file)
        this.type(f?.def.encrypted && !f.decrypted ? `decrypt ${goal.file}` : `cat ${goal.file}`)
        return
      }
      case 'delete':
        this.type(`rm ${goal.file}`)
        return
      case 'upload':
        this.type(`put ${goal.file}`)
        return
      case 'wipeLogs':
        this.type('wipe')
        return
    }
  }

  /** Accessible, un-listed non-goal hosts where a careless note might sit. */
  private hostsToSearch(): Host[] {
    const goalHosts = new Set(this.sim.def.goals.map(g => g.host))
    return [...this.sim.hosts.values()].filter(h => h.known && h.access && !this.listed.has(h.def.id) && !goalHosts.has(h.def.id) && h.def.proxy !== true)
  }

  /** `ls` a host once and read any [note] it shows. Returns true if a command was typed. */
  private maybeLookAround(h: Host): boolean {
    if (h.def.proxy === true) return false
    if (!this.listed.has(h.def.id)) {
      this.listed.add(h.def.id)
      if (this.rng() < lerp(0.3, 0.95, this.q)) {
        this.looked.add(h.def.id)
        this.type('ls')
        return true
      }
      return false
    }
    const note = [...h.files.values()].find(f => f.grants && !f.read && !f.deleted)
    if (note && this.looked.has(h.def.id) && this.q >= 0.35) {
      this.type(`cat ${note.def.name}`)
      return true
    }
    return false
  }

  /** Weak players touch look-alikes on the target (checking with `stat` first if they are careful). */
  private maybeFiddle(h: Host): boolean {
    if (!this.careless) return false
    for (const f of h.files.values()) {
      if (f.deleted || this.fiddled.has(`${h.def.id}/${f.def.name}`) || !LOOKALIKE_RE.test(f.def.name)) continue
      this.fiddled.add(`${h.def.id}/${f.def.name}`)
      if (this.rng() > 0.5) continue
      const key = `${h.def.id}/${f.def.name}`
      if (!this.statted.has(key) && this.rng() < this.q) {
        this.statted.add(key)
        this.type(`stat ${f.def.name}`)
        return true
      }
      this.type(`get ${f.def.name}`)
      return true
    }
    return false
  }

  /** Seconds to get a shell back on `h` (bypass + crack or key), plus the wipe itself. */
  private reentryCost(h: Host): number {
    const sim = this.sim
    const think = lerp(5, 1.5, this.q)
    let cost = think * 1.5
    if (h.access) return cost
    if (h.firewall && !h.firewallDown) cost += bypassSeconds(sim.tier, sim.env) + think
    if (!h.probed && h.def.ports.length > 0) cost += think * 1.5
    const p = this.easiestPort(h)
    if (p && this.keyFor(h) === undefined) cost += crackSeconds(p.difficulty, sim.env) * (h.watchdog ? 1.5 : 1)
    return cost + think
  }

  /** Can the player afford `cost` more seconds under the trace (with a quality-dependent margin)? */
  private affords(cost: number): boolean {
    return !this.sim.trace.active || this.slack() > cost * lerp(2.5, 1.4, this.q)
  }

  private coverTracksAndLeave(): void {
    const sim = this.sim
    const here = this.cur()
    const think = lerp(5, 1.5, this.q)
    this.wantsClean ??= this.wipeAsYouGo || this.rng() < lerp(0.3, 1, this.q)
    if (this.wantsClean) {
      // Wipe (or win back a shell and wipe) where we stand.
      if (here && this.hasTrail(here) && !this.abandoned.has(here.def.id)) {
        if (here.access) {
          if (this.affords(think * 1.5)) {
            this.type('wipe')
            return
          }
        } else if (this.affords(this.reentryCost(here))) {
          if (here.firewall && !here.firewallDown) this.type('bypass')
          else if (!here.probed && here.def.ports.length > 0) this.type(here.watchdog ? 'probe -q' : 'probe')
          else {
            const p = this.easiestPort(here)
            if (p) this.type(`crack ${this.keyFor(here) ?? p.port}`)
            else this.abandoned.add(here.def.id)
          }
          return
        }
        this.abandoned.add(here.def.id)
      }
      // Hop to the cheapest remaining trail we can still afford.
      const trails = [...sim.hosts.values()]
        .filter(h => this.hasTrail(h) && !this.abandoned.has(h.def.id) && h.def.id !== sim.currentHostId)
        .map(h => ({ h, cost: this.reentryCost(h) + think }))
        .sort((a, b) => a.cost - b.cost)
      for (const { h, cost } of trails) {
        if (this.affords(cost)) {
          this.type(`connect ${h.def.ip}`)
          return
        }
        this.abandoned.add(h.def.id)
      }
    }
    this.type('disconnect')
  }
}

/** Play `def` in the real terminal sim with a player of the given quality. */
export function solveMission(def: MissionDef, env: SimEnv, opts: SolveOptions): SolveResult {
  const sim = new MissionSim(def, env, { rig: opts.rig ?? false, tier: opts.tier ?? 1, hints: false })
  const p = new Player(sim, opts)
  p.play()
  const result = sim.opResult()
  const trace = sim.trace
  return {
    outcome: classify(result),
    result,
    finished: sim.finished ?? 'lost',
    seconds: Math.round(sim.seconds * 10) / 10,
    commands: p.commands,
    typos: p.typos,
    bounces: sim.bounces.length,
    honeypots: p.honeypots,
    keysUsed: p.keysUsed,
    traceFill: trace.active && trace.total > 0 ? trace.elapsed / trace.total : 0,
    transcript: p.log ?? [],
  }
}

/** Total trace seconds a mission gives this env with every starting relay bounced (for reports). */
export function traceBudget(def: MissionDef, env: SimEnv): number {
  return traceTotal(def, env, def.hosts.filter(h => h.proxy === true && def.known.includes(h.id)).length)
}
