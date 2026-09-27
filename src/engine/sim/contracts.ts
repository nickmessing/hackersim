/**
 * Contracts: hacking ops (terminal-launched) and freelance gigs (an idle queue).
 *
 * Hacks (REDESIGN_V2 §A): offer → accept (hold up to MAX_ACTIVE_HACKS) → recon/prep via scheduled
 * Hacking hours → launch in the Terminal any time before the deadline → debrief. Every accepted
 * hack carries a `missionDef` (generated from its template's `op`, or a sensible default for story
 * contracts without a hand-authored mission). `opMission` returns a prep-buffed copy for the
 * terminal; `completeOp` / `scriptOp` turn a terminal result into pay, heat, cred and consequences.
 *
 * Gigs (REDESIGN_V2 §B): accept up to MAX_ACTIVE_GIGS; scheduled Freelance hours work the FIRST gig
 * in the queue, rolling on to the next when it finishes. `moveContract` reorders the queue.
 *
 * Boards (§B): a HACK board (HACK_BOARD_SIZE) and a GIG board (GIG_BOARD_SIZE), each topped up every
 * weekly turn; offers last CONTRACT_OFFER_DAYS. Template pay is final (multipliers retired = 1).
 */
import {
  APPROACH,
  CONTRACT_OFFER_DAYS,
  CONTRACT_XP_PER_HOUR,
  DAYS_PER_STEP,
  CRED_TIERS,
  FREELANCE_TIERS,
  FREELANCE_PAY_MULT,
  GIG_BOARD_SIZE,
  GIG_FAIL_COMPLICATION_CHANCE,
  HACK_BOARD_SIZE,
  HACK_DEADLINE_DAYS,
  HACK_PAY_MULT_BY_TIER,
  HACK_SKILL_SPEED_DIV,
  incomeTax,
  MAX_ACTIVE_GIGS,
  MAX_ACTIVE_HACKS,
  PREP_HOURS_BY_TIER,
  SCRIPT_HEAT_MULT,
  SCRIPT_PAY_MULT,
  SCRIPT_ROLL_PENALTY,
  skillMod,
} from '../balance'
import { evalCond } from '../conditions'
import { addMoney, addStat, applyEffects, applyEffect } from '../effects'
import { triggerComplication } from '../events'
import { modAdd, modMult, worldMult } from '../mods'
import { C } from '../registry'
import { d20, pick, rand, randInt, weighted } from '../rng'
import { log, notify, renderLine } from '../text'
import type {
  ContractInstance,
  ContractKind,
  ContractTemplateDef,
  GameState,
  MissionDef,
  OpReport,
  OpResult,
  OpSpec,
  RollRecord,
  SkillId,
} from '../types'
import { gainHeat } from './heat'
import { generateMission, tierFromDc } from './missiongen'
import { addSkillXp, avgSkill } from './skills'

export function hackTier(state: GameState): number {
  let t = 1
  for (let i = 0; i < CRED_TIERS.length; i++) if (state.stats.cred >= (CRED_TIERS[i] ?? Infinity)) t = i + 1
  return t
}

export function freelanceTier(state: GameState): number {
  const lvl = Math.max(state.skills.programming.level, (state.skills.business.level + state.skills.programming.level) / 2)
  let t = 1
  for (let i = 0; i < FREELANCE_TIERS.length; i++) if (lvl >= (FREELANCE_TIERS[i] ?? Infinity)) t = i + 1
  return t
}

function tierFor(state: GameState, kind: ContractKind): number {
  return kind === 'hack' ? hackTier(state) : freelanceTier(state)
}

/** Effective severity tier of a contract (procedural carry a tier; story derive one from DC). */
function opTier(c: ContractInstance): number {
  return c.tier > 0 ? Math.min(5, Math.max(1, c.tier)) : tierFromDc(c.dc)
}

function lerpRange(r: [number, number], t: number): number {
  return r[0] + (r[1] - r[0]) * t
}

function instantiate(state: GameState, tpl: ContractTemplateDef): ContractInstance {
  const t = rand(state)
  const target = tpl.targets.length ? pick(state, tpl.targets) : 'a target'
  const sub = (s: string): string => s.replace(/\{target\}/g, target)
  const payMult =
    tpl.kind === 'hack' ? worldMult(state, 'w.contractPay') * (HACK_PAY_MULT_BY_TIER[tpl.tier - 1] ?? 0.22) : worldMult(state, 'w.itSalary') * FREELANCE_PAY_MULT
  return {
    uid: state.nextUid++,
    template: tpl.id,
    kind: tpl.kind,
    title: sub(pick(state, tpl.titles)),
    client: pick(state, tpl.clients),
    desc: sub(pick(state, tpl.descs)),
    skills: [...tpl.skills],
    dc: Math.round(lerpRange(tpl.dc, t)),
    hours: Math.round(lerpRange(tpl.hours, t)),
    pay: Math.round((lerpRange(tpl.pay, t) * payMult) / 5) * 5,
    heat: Math.round(lerpRange(tpl.heat, t) * 10) / 10,
    cred: Math.round(lerpRange(tpl.cred, t) * 10) / 10,
    rep: { ...(tpl.rep ?? {}) },
    tier: tpl.tier,
    offeredDay: state.time.day,
    expiresDay: state.time.day + CONTRACT_OFFER_DAYS,
    progress: 0,
    prep: 0,
    prepNeeded: 0,
    approach: 'normal',
    status: 'offered',
    // The op recipe (network archetype/goal) rides along so the mission can be generated on accept.
    ...(tpl.op ? { opSpec: tpl.op } : {}),
  }
}

/** Read the op recipe stashed on an instance (procedural hacks) if any. */
function specOf(c: ContractInstance): OpSpec | undefined {
  return (c as ContractInstance & { opSpec?: OpSpec }).opSpec
}

/**
 * Refill both boards with procedural offers, keeping story offers. Each kind is topped up to its
 * own size (HACK_BOARD_SIZE / GIG_BOARD_SIZE) every weekly turn.
 */
export function refreshBoard(state: GameState, force = false): void {
  const b = state.contracts
  if (!force && b.lastRefreshDay === state.time.day && b.board.length > 0) return
  b.lastRefreshDay = state.time.day
  b.board = b.board.filter(c => c.status === 'offered' && (c.def !== undefined || c.expiresDay > state.time.day))
  topUp(state, 'hack', HACK_BOARD_SIZE)
  topUp(state, 'freelance', GIG_BOARD_SIZE)
}

function topUp(state: GameState, kind: ContractKind, size: number): void {
  const b = state.contracts
  const have = b.board.filter(c => !c.def && c.kind === kind).length
  const need = size - have
  if (need <= 0) return
  const tier = tierFor(state, kind)
  const pool = [...C.contractTemplates.values()].filter(t => t.kind === kind && t.tier <= tier && t.tier >= tier - 2 && evalCond(state, t.available))
  if (pool.length === 0) return
  for (let i = 0; i < need; i++) {
    const tpl = weighted(state, pool, t => (t.weight ?? 1) * (t.tier === tier ? 2 : 1))
    if (!tpl) break
    b.board.push(instantiate(state, tpl))
  }
}

export function offerStoryContract(state: GameState, id: string, direct: boolean): void {
  const def = C.contracts.get(id)
  if (!def) return
  const already = [...state.contracts.board, ...state.contracts.active].some(c => c.def === id)
  if (already) return
  const inst: ContractInstance = {
    uid: state.nextUid++,
    def: id,
    kind: def.kind,
    title: def.title,
    client: def.client,
    desc: renderLine(state, def.desc),
    skills: [...def.skills],
    dc: def.dc,
    hours: def.hours,
    pay: def.pay,
    heat: def.heat,
    cred: def.cred,
    rep: { ...(def.rep ?? {}) },
    tier: 0,
    offeredDay: state.time.day,
    expiresDay: def.expiresDays ? state.time.day + def.expiresDays : Number.MAX_SAFE_INTEGER,
    progress: 0,
    prep: 0,
    prepNeeded: 0,
    approach: 'normal',
    status: 'offered',
    ...(def.mission ? { mission: def.mission } : {}),
  }
  if (direct) {
    activate(state, inst)
    state.contracts.active.push(inst)
    notify(state, `New job: ${def.title}`, 'quest')
  } else {
    state.contracts.board.unshift(inst)
    notify(state, `New offer on the board: ${def.title}`, 'quest')
  }
}

export function canAccept(state: GameState, c: ContractInstance): { ok: boolean; reason?: string } {
  if (c.status !== 'offered') return { ok: false, reason: 'Not available' }
  const limit = c.kind === 'hack' ? MAX_ACTIVE_HACKS : MAX_ACTIVE_GIGS
  const active = state.contracts.active.filter(a => a.kind === c.kind).length
  if (active >= limit) return { ok: false, reason: `You can hold ${limit} ${c.kind === 'hack' ? 'hacks' : 'gigs'} at once` }
  if (state.jail) return { ok: false, reason: 'In jail' }
  return { ok: true }
}

/** Prepare a contract for active work (prep budget, deadline, generated mission for hacks). */
function activate(state: GameState, c: ContractInstance): void {
  c.status = 'active'
  c.progress = 0
  if (c.kind !== 'hack') return
  const tier = opTier(c)
  c.prep = 0
  c.prepNeeded = PREP_HOURS_BY_TIER[tier - 1] ?? PREP_HOURS_BY_TIER[0]
  c.deadlineDay = state.time.day + HACK_DEADLINE_DAYS
  // Story contracts with a hand-authored mission keep it; everyone else gets a generated op.
  if (!c.mission && !c.missionDef) {
    const spec: OpSpec = specOf(c) ?? { network: 'corp', goal: 'download', loot: [] }
    c.missionDef = generateMission(state, spec, {
      id: `op_${c.uid}`,
      title: c.title,
      tier,
      dc: c.dc,
      client: c.client,
      target: c.title,
      desc: c.desc,
    })
  }
}

export function acceptContract(state: GameState, uid: number, approach: ContractInstance['approach'] = 'normal'): boolean {
  const i = state.contracts.board.findIndex(c => c.uid === uid)
  const c = state.contracts.board[i]
  if (!c || !canAccept(state, c).ok) return false
  state.contracts.board.splice(i, 1)
  c.approach = approach
  activate(state, c)
  state.contracts.active.push(c)
  log(state, `Accepted: ${c.title}`, 'info')
  return true
}

export function abandonContract(state: GameState, uid: number): void {
  const c = state.contracts.active.find(x => x.uid === uid)
  if (!c) return
  state.contracts.active = state.contracts.active.filter(x => x.uid !== uid)
  c.status = 'failed'
  if (c.kind === 'hack') addStat(state, 'cred', -Math.max(1, c.cred / 2))
  recordHistory(state, c, false)
  if (c.def) applyEffects(state, C.contracts.get(c.def)?.onFail)
  log(state, `Abandoned: ${c.title}`, 'bad')
}

/** Reorder a contract within its kind's queue. dir -1 = earlier (sooner), +1 = later. */
export function moveContract(state: GameState, uid: number, dir: -1 | 1): boolean {
  const list = state.contracts.active
  const idx = list.findIndex(c => c.uid === uid)
  if (idx < 0) return false
  const me = list[idx]
  if (!me) return false
  // Find the nearest neighbour of the same kind in the requested direction.
  for (let j = idx + dir; j >= 0 && j < list.length; j += dir) {
    const other = list[j]
    if (other?.kind === me.kind) {
      list[idx] = other
      list[j] = me
      return true
    }
  }
  return false
}

export function effectiveHours(c: ContractInstance): number {
  return c.hours * APPROACH[c.approach].hours
}

export function workSpeed(state: GameState, c: ContractInstance): number {
  const avg = avgSkill(state, c.skills)
  const key = c.kind === 'hack' ? 'hack.speed' : 'freelance.speed'
  return (1 + avg / HACK_SKILL_SPEED_DIV) * modMult(state, key)
}

export function rollBonus(state: GameState, c: ContractInstance): number {
  const avg = avgSkill(state, c.skills)
  return skillMod(avg) + APPROACH[c.approach].roll + (c.kind === 'hack' ? modAdd(state, 'hack.roll') : 0)
}

/** Probability of success (d20 + bonus >= dc; nat 20 always wins, nat 1 always fails). */
export function successChance(state: GameState, c: ContractInstance): number {
  return chanceFor(c.dc - rollBonus(state, c))
}

function chanceFor(need: number): number {
  const wins = Math.min(19, Math.max(1, 21 - need))
  return wins / 20
}

// ────────────────────────────────────────────────────────────────────────────
// Scheduled work
// ────────────────────────────────────────────────────────────────────────────

/** The mission a hack will actually play (generated op, or a hand-authored story mission). */
function missionOf(c: ContractInstance): MissionDef | undefined {
  return c.missionDef ?? (c.mission ? C.missions.get(c.mission) : undefined)
}

function goalsTotalOf(c: ContractInstance): number {
  return missionOf(c)?.goals.length ?? 1
}

/**
 * One hour of scheduled work. The hour is a budget of `efficiency` work-hours:
 * - Hacks: recon/prep the first accepted hack that still needs prep; once it is fully prepped the
 *   rest of the hour carries on to the next accepted hack that needs prep.
 * - Gigs: work the first gig in the queue; when it finishes (and resolves) the leftover time
 *   rolls into the next gig, converted at that gig's own work speed.
 * Returns true if any contract was worked on (false → the caller runs idle practice).
 */
export function workHour(state: GameState, kind: ContractKind, efficiency: number): boolean {
  let budget = efficiency
  let lastSkills: SkillId[] | null = null
  // Bounded: every pass either finishes a contract (removing it from the candidates) or spends the budget.
  for (let guard = 0; guard < 64 && budget > 1e-9; guard++) {
    const c =
      kind === 'hack'
        ? state.contracts.active.find(x => x.kind === 'hack' && x.status === 'active' && x.prep < x.prepNeeded)
        : state.contracts.active.find(x => x.kind === 'freelance' && x.status === 'active')
    if (!c) break
    const speed = workSpeed(state, c)
    if (speed <= 0) break
    const need = kind === 'hack' ? c.prepNeeded - c.prep : effectiveHours(c) - c.progress
    const spent = Math.min(budget, Math.max(0, need) / speed)
    budget -= spent
    lastSkills = c.skills
    for (const s of c.skills) addSkillXp(state, s, (CONTRACT_XP_PER_HOUR * spent) / Math.max(1, c.skills.length))
    if (kind === 'hack') {
      c.prep = spent * speed >= need ? c.prepNeeded : c.prep + spent * speed
    } else if (spent * speed >= need) {
      c.progress = effectiveHours(c)
      resolveContract(state, c.uid)
    } else {
      c.progress += spent * speed
    }
  }
  if (!lastSkills) return false
  // Queue ran dry mid-hour: the rest of the hour is tidying up — still skill time, just no progress.
  if (budget > 1e-9) for (const s of lastSkills) addSkillXp(state, s, (CONTRACT_XP_PER_HOUR * budget) / Math.max(1, lastSkills.length))
  return true
}

/** Idle practice when no contract is active (tiny XP + pocket change for freelance). */
export function practiceHour(state: GameState, kind: ContractKind, efficiency: number, xpPerHour: number): void {
  if (kind === 'hack') {
    addSkillXp(state, 'intrusion', xpPerHour * efficiency * 0.6)
    addSkillXp(state, 'networking', xpPerHour * efficiency * 0.4)
  } else {
    addSkillXp(state, 'programming', xpPerHour * efficiency * 0.7)
    addSkillXp(state, 'business', xpPerHour * efficiency * 0.3)
    if (rand(state) < 0.08) addMoney(state, randInt(state, 3, 12) * DAYS_PER_STEP)
  }
}

// ────────────────────────────────────────────────────────────────────────────
// Prep perks & the terminal-ready mission
// ────────────────────────────────────────────────────────────────────────────

function prepFraction(c: ContractInstance): number {
  if (c.prepNeeded <= 0) return 0
  return Math.max(0, Math.min(1, c.prep / c.prepNeeded))
}

/** Human-readable list of the recon perks a hack has earned so far (for the UI). */
export function prepPerks(c: ContractInstance): string[] {
  const f = prepFraction(c)
  const lines: string[] = []
  if (f >= 0.25) lines.push('The whole network is mapped from the start — no blind scanning.')
  if (f >= 0.5) lines.push('You found the weak spots: every lock is one notch easier.')
  if (f >= 1) lines.push('Total prep: the trace crawls (~60% slower) and one lock on the target is already open.')
  else if (f >= 0.75) lines.push('Deep prep: the trace runs about 35% slower.')
  return lines
}

/** A copy of the hack's mission with prep perks baked in, ready for the Terminal. */
export function opMission(state: GameState, uid: number): MissionDef | null {
  const c = state.contracts.active.find(x => x.uid === uid && x.kind === 'hack')
  if (!c) return null
  const base = missionOf(c)
  if (!base) return null
  const def = JSON.parse(JSON.stringify(base)) as MissionDef
  const f = prepFraction(c)

  if (f >= 0.25) def.known = def.hosts.map(h => h.id)
  if (f >= 0.5) {
    for (const h of def.hosts) for (const p of h.ports) if (p.difficulty > 0) p.difficulty = Math.max(1, p.difficulty - 1)
  }
  if (f >= 1) {
    def.traceSeconds = Math.round(def.traceSeconds * 1.6)
    // Pre-open one lock on the goal host(s).
    const goalHosts = new Set(def.goals.map(g => g.host))
    for (const h of def.hosts) {
      if (!goalHosts.has(h.id)) continue
      const locked = h.ports.find(p => p.difficulty > 0)
      if (locked) locked.difficulty = 0
    }
  } else if (f >= 0.75) {
    def.traceSeconds = Math.round(def.traceSeconds * 1.35)
  }
  return def
}

// ────────────────────────────────────────────────────────────────────────────
// Resolution
// ────────────────────────────────────────────────────────────────────────────

export interface ContractResult {
  success: boolean
  roll: RollRecord
  heat: number
  pay: number
}

/**
 * Resolve a finished contract with a d20 roll (gigs), or map an old `forced` boolean to a hack
 * op outcome (kept for callers that predate the terminal ops model: forced true → clean, forced
 * false → traced, undefined → a roll).
 */
export function resolveContract(state: GameState, uid: number, forced?: boolean): ContractResult | null {
  const c = state.contracts.active.find(x => x.uid === uid)
  if (!c) return null
  if (c.kind === 'hack') return resolveHackCompat(state, c, forced)
  return resolveGig(state, c)
}

function resolveHackCompat(state: GameState, c: ContractInstance, forced?: boolean): ContractResult {
  const total = goalsTotalOf(c)
  let success: boolean
  const die = d20(state)
  const mod = rollBonus(state, c)
  if (forced === true) success = true
  else if (forced === false) success = false
  else success = die === 20 || (die !== 1 && die + mod >= c.dc)
  const result: OpResult = success
    ? { goalsDone: total, goalsTotal: total, traced: false, aborted: false, logsLeft: 0 }
    : { goalsDone: 0, goalsTotal: total, traced: true, aborted: false, logsLeft: total }
  const report = completeOp(state, c.uid, result)
  const roll: RollRecord = { skill: c.skills[0] ?? 'intrusion', d20: die, mod, dc: c.dc, total: die + mod, success }
  return { success, roll, heat: report.heat, pay: report.pay }
}

function resolveGig(state: GameState, c: ContractInstance): ContractResult {
  const die = d20(state)
  const mod = rollBonus(state, c)
  const total = die + mod
  const success = die === 20 || (die !== 1 && total >= c.dc)
  const roll: RollRecord = { skill: c.skills[0] ?? 'programming', d20: die, mod, dc: c.dc, total, success }
  state.contracts.active = state.contracts.active.filter(x => x.uid !== c.uid)
  c.status = success ? 'done' : 'failed'
  recordHistory(state, c, success)
  let pay = 0
  if (success) {
    pay = Math.round(c.pay * modMult(state, 'freelance.pay'))
    pay -= incomeTax(pay)
    addMoney(state, pay)
    state.totals.gigsDone += 1
    state.vars['sys.gigsDone'] = (state.vars['sys.gigsDone'] ?? 0) + 1
    for (const [fac, v] of Object.entries(c.rep)) if (v) applyEffect(state, { faction: fac, add: v })
    notify(state, `✔ ${c.title}: delivered (${total} vs DC ${c.dc}). +$${pay}`, 'money')
    if (c.def) applyEffects(state, C.contracts.get(c.def)?.onSuccess)
  } else {
    addStat(state, 'stress', 5)
    notify(state, `✘ ${c.title}: the gig fell through (${total} vs DC ${c.dc}).`, 'bad')
    if (c.def) applyEffects(state, C.contracts.get(c.def)?.onFail)
    if (rand(state) < GIG_FAIL_COMPLICATION_CHANCE) triggerComplication(state, 'gig', opTier(c))
  }
  return { success, roll, heat: 0, pay }
}

/**
 * Turn a Terminal op result into pay, heat, cred and consequences (REDESIGN_V2 §A). Also called by
 * the `forced` compat path above. Sets the contract's report, `state.lastReport`, history, notify.
 */
export function completeOp(state: GameState, uid: number, result: OpResult): OpReport {
  const c = state.contracts.active.find(x => x.uid === uid && x.kind === 'hack')
  if (!c) return { outcome: 'aborted', pay: 0, heat: 0, cred: 0, notes: ['No such op.'] }
  const total = Math.max(1, result.goalsTotal || goalsTotalOf(c))
  const done = Math.max(0, Math.min(total, result.goalsDone))
  const logs = Math.max(0, result.logsLeft)
  const tier = opTier(c)

  let outcome: OpReport['outcome']
  let pay = 0
  let heatBase = 0
  let cred = 0
  let complication = false
  const notes: string[] = []

  if (result.traced) {
    outcome = 'traced'
    heatBase = c.heat * 2.5
    cred = -Math.max(1, c.cred / 2)
    complication = true
    notes.push('The trace pinned you. No pay, and someone now has a thread to pull.')
  } else if (done >= total) {
    if (logs === 0) {
      outcome = 'clean'
      pay = c.pay
      heatBase = c.heat * 0.6
      cred = c.cred
      notes.push('Clean run — every objective met, logs wiped, ghost in and out.')
    } else {
      outcome = 'messy'
      pay = c.pay
      heatBase = c.heat * (1 + 0.35 * logs)
      cred = c.cred
      notes.push(`Job done, but you left footprints on ${logs} machine${logs === 1 ? '' : 's'}. Heat is up.`)
    }
  } else if (done > 0) {
    outcome = 'partial'
    pay = Math.round((c.pay * done) / total * 0.6)
    heatBase = c.heat * (1 + 0.35 * logs)
    cred = c.cred / 2
    notes.push(`Partial: ${done}/${total} objectives. Reduced pay, half the cred.`)
  } else {
    outcome = 'aborted'
    heatBase = 0.3 * c.heat * logs
    cred = -1
    notes.push('You backed out with nothing to show. The client remembers.')
  }

  return settleHack(state, c, { outcome, pay, heatBase, cred, complication, tier, notes })
}

/** Skip the terminal (REDESIGN_V2 §A): auto-run a hack at the visible scripted odds. */
export function scriptOp(state: GameState, uid: number): OpReport {
  const c = state.contracts.active.find(x => x.uid === uid && x.kind === 'hack')
  if (!c) return { outcome: 'aborted', pay: 0, heat: 0, cred: 0, notes: ['No such op.'] }
  const tier = opTier(c)
  const die = d20(state)
  const mod = rollBonus(state, c) - SCRIPT_ROLL_PENALTY
  const success = die === 20 || (die !== 1 && die + mod >= c.dc)
  if (success) {
    return settleHack(state, c, {
      outcome: 'scripted',
      pay: Math.round(c.pay * SCRIPT_PAY_MULT),
      heatBase: c.heat * SCRIPT_HEAT_MULT,
      cred: c.cred,
      complication: false,
      tier,
      notes: [`Script ran clean (${die + mod} vs DC ${c.dc}). Reduced pay, extra noise — you weren't watching the trace.`],
    })
  }
  return settleHack(state, c, {
    outcome: 'scripted-fail',
    pay: 0,
    heatBase: c.heat * 2.5,
    cred: -Math.max(1, c.cred / 2),
    complication: true,
    tier,
    notes: [`The script tripped a trace you couldn't react to (${die + mod} vs DC ${c.dc}). It went bad.`],
  })
}

/** Visible success chance for "script it" (contract odds with the scripted-roll penalty). */
export function scriptChance(state: GameState, c: ContractInstance): number {
  return chanceFor(c.dc - (rollBonus(state, c) - SCRIPT_ROLL_PENALTY))
}

interface HackSettle {
  outcome: OpReport['outcome']
  pay: number
  heatBase: number
  cred: number
  complication: boolean
  tier: number
  notes: string[]
}

function settleHack(state: GameState, c: ContractInstance, s: HackSettle): OpReport {
  state.contracts.active = state.contracts.active.filter(x => x.uid !== c.uid)
  const storySuccess = s.outcome === 'clean' || s.outcome === 'messy' || s.outcome === 'scripted'
  c.status = storySuccess ? 'done' : 'failed'
  recordHistory(state, c, storySuccess)

  if (s.pay > 0) addMoney(state, s.pay) // hack money is off the books (untaxed)
  const heat = s.heatBase > 0 ? gainHeat(state, s.heatBase) : 0
  if (s.cred > 0) addStat(state, 'cred', s.cred * modMult(state, 'cred.gain'))
  else if (s.cred < 0) addStat(state, 'cred', s.cred)

  if (storySuccess) {
    state.totals.hacksDone += 1
    state.vars['sys.hacksDone'] = (state.vars['sys.hacksDone'] ?? 0) + 1
    for (const [fac, v] of Object.entries(c.rep)) if (v) applyEffect(state, { faction: fac, add: v })
  } else {
    state.totals.hacksFailed += 1
    state.vars['sys.hacksFailed'] = (state.vars['sys.hacksFailed'] ?? 0) + 1
  }

  let complicationId: string | undefined
  if (s.complication) complicationId = triggerComplication(state, 'hack', s.tier)

  const report: OpReport = {
    outcome: s.outcome,
    pay: s.pay,
    heat: Math.round(heat * 10) / 10,
    cred: Math.round(s.cred * 10) / 10,
    ...(complicationId ? { complication: complicationId } : {}),
    notes: s.notes,
  }
  c.report = report
  state.lastReport = { uid: c.uid, title: c.title, kind: c.kind, report }
  if (c.def) applyEffects(state, storySuccess ? C.contracts.get(c.def)?.onSuccess : C.contracts.get(c.def)?.onFail)

  const label = s.pay > 0 ? ` +$${s.pay}` : ''
  notify(state, `${storySuccess ? '✔' : '✘'} ${c.title}: ${s.outcome}.${label}`, storySuccess ? 'money' : 'bad')
  return report
}

function recordHistory(state: GameState, c: ContractInstance, success: boolean): void {
  const key = c.def ?? `tpl:${c.template ?? 'unknown'}`
  const h = (state.contracts.history[key] ??= { done: 0, failed: 0 })
  if (success) h.done += 1
  else h.failed += 1
}

/**
 * Fail an accepted hack that never ran (missed deadline, blown by a raid): drop it from the queue,
 * lose cred, count it as a failed hack and fire the story contract's `onFail`, so content gated on
 * `{ contract, status: 'failed' }` sees it.
 */
export function failHack(state: GameState, c: ContractInstance, reason: string): void {
  if (!state.contracts.active.some(x => x.uid === c.uid)) return
  state.contracts.active = state.contracts.active.filter(x => x.uid !== c.uid)
  c.status = 'failed'
  addStat(state, 'cred', -Math.max(1, c.cred / 2))
  recordHistory(state, c, false)
  state.totals.hacksFailed += 1
  state.vars['sys.hacksFailed'] = (state.vars['sys.hacksFailed'] ?? 0) + 1
  if (c.def) applyEffects(state, C.contracts.get(c.def)?.onFail)
  notify(state, `✘ ${c.title}: ${reason}`, 'bad')
}

/** Daily/turn: expire stale offers, fail hacks past their deadline, top up the boards. */
export function dailyContracts(state: GameState): void {
  for (const c of state.contracts.board) {
    if (c.status === 'offered' && c.expiresDay <= state.time.day) {
      c.status = 'expired'
      if (c.def) applyEffects(state, C.contracts.get(c.def)?.onFail)
    }
  }
  state.contracts.board = state.contracts.board.filter(c => c.status === 'offered')

  // Accepted hacks not launched in time fall through (cred loss, story onFail).
  const expired = state.contracts.active.filter(c => c.kind === 'hack' && c.deadlineDay !== undefined && state.time.day > c.deadlineDay)
  for (const c of expired) failHack(state, c, 'the window closed before you ran it. The client walked.')

  refreshBoard(state)
}
