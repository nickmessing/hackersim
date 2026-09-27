/**
 * Headless playtest bot. Plays the game with a simple strategy and records pacing metrics.
 * Used by tests/balance.test.ts (run with `BALANCE=1 npx vitest run tests/balance.test.ts`).
 *
 * Hack ops are PLAYED: the bot launches each accepted hack in the real terminal simulator through
 * the headless solver (tests/solver.ts) — its character's skills become the SimEnv and its hacking
 * skill becomes the solver's player quality — and feeds the sim's OpResult to `completeOp`, exactly
 * like the Terminal app does. Story-scene missions are played the same way (`missionResult`).
 */
import {
  C,
  balance,
  acceptContract,
  activeDialog,
  advance,
  buyItem,
  canAccept,
  canBuy,
  canTakeJob,
  choicesFor,
  choose,
  createState,
  dailyPay,
  enroll,
  finishThread,
  itemPrice,
  markRead,
  missionAuto,
  missionResult,
  modMult,
  opMission,
  completeOp,
  moveHousing,
  nodeOf,
  scriptOp,
  setJob,
  setLifestyle,
  simulateHour,
  successChance,
  evalCond,
  bootstrap,
  type GameState,
  type MissionDef,
  type OpReport,
  type SkillId,
  type ThreadState,
} from '../src/engine'
import type { SimEnv } from '../src/ui/terminal/sim'
import { solveMission, type SolveResult } from './solver'
import { applyPreset } from '../src/engine/sim/schedule'
import { dailyExpenses } from '../src/engine/sim/life'
import { rand } from '../src/engine/rng'

export type Strategy = 'legit' | 'hacker' | 'balanced'

export interface BotReport {
  strategy: Strategy
  seed: number
  days: number
  actDays: Record<number, number>
  ending: string | null
  endingDay: number | null
  snapshots: { day: number; money: number; skills: Record<string, number>; job: string | null; cred: number; heat: number; act: number }[]
  questsStarted: number
  questsCompleted: number
  questsFailed: number
  questIds: string[]
  scenesSeen: number
  raids: number
  burnouts: number
  hospital: number
  daysJailed: number
  hacks: number
  gigs: number
  /** Hack ops by debrief outcome (terminal-played via the solver, or scripted). */
  ops: Record<OpReport['outcome'], number>
  /** Story-scene terminal missions played through the solver. */
  sceneMissions: { won: number; lost: number; auto: number }
  /** Average trace fill (0..1) at the end of solver-played ops. */
  avgTraceFill: number
  /** Complication sub-stories that fired (any source). */
  complications: number
  /** Director events (non-complication) that fired. */
  eventsFired: number
  /** Distinct obligations (fines, loans, bills) taken on over the run. */
  obligations: string[]
  /** Scar traits gained over the run. */
  scars: string[]
  checksPassed: number
  checksFailed: number
  maxMoney: number
  minMoney: number
  errors: string[]
}

const FOCUS: Record<Strategy, SkillId[]> = {
  legit: ['programming', 'systems', 'networking', 'business', 'social'],
  hacker: ['intrusion', 'networking', 'opsec', 'cryptography', 'programming'],
  balanced: ['programming', 'intrusion', 'networking', 'social', 'opsec', 'systems'],
}

// ── Terminal ops through the solver ─────────────────────────────────────────

interface RunCtx {
  report: BotReport
  errors: string[]
  traceFillSum: number
  traceFillN: number
  obligations: Set<string>
}

/** The character's SimEnv, built the way the Terminal app builds it. */
function simEnv(state: GameState): SimEnv {
  return {
    intrusion: state.skills.intrusion.level,
    cryptography: state.skills.cryptography.level,
    opsec: state.skills.opsec.level,
    networking: state.skills.networking.level,
    crackSpeed: modMult(state, 'crack.speed'),
    traceMult: modMult(state, 'trace') * (1 + state.skills.opsec.level * 0.012),
  }
}

/**
 * Player quality for the solver: a character who has put years into intrusion/opsec plays the
 * terminal like someone who has done it a hundred times (≈0.25 fresh → ≈0.95 at the top).
 */
function playerQuality(state: GameState): number {
  const s = state.skills
  const skill = s.intrusion.level * 0.5 + s.opsec.level * 0.3 + s.networking.level * 0.2
  return Math.min(0.95, Math.max(0.2, 0.2 + skill / 70))
}

function play(state: GameState, def: MissionDef, rig: boolean, tier: number, ctx: RunCtx): SolveResult {
  const r = solveMission(def, simEnv(state), { quality: playerQuality(state), seed: Math.floor(rand(state) * 1e9), rig, tier })
  ctx.traceFillSum += r.traceFill
  ctx.traceFillN++
  return r
}

/** Launch an accepted hack in the terminal (via the solver) and debrief it with completeOp. */
function launchOp(state: GameState, uid: number, ctx: RunCtx): void {
  const c = state.contracts.active.find(x => x.uid === uid)
  const def = opMission(state, uid)
  let rep: OpReport
  if (!c || !def) rep = scriptOp(state, uid)
  else {
    const r = play(state, def, c.missionDef !== undefined, c.tier > 0 ? c.tier : 1, ctx)
    rep = completeOp(state, uid, r.result)
  }
  ctx.report.ops[rep.outcome]++
}

function answerThreads(state: GameState, ctx: RunCtx): void {
  const errors = ctx.errors
  for (let guard = 0; guard < 60; guard++) {
    const t: ThreadState | undefined = activeDialog(state) ?? state.threads.find(x => x.status === 'unread' || x.status === 'open')
    if (!t) return
    markRead(state, t.uid)
    const node = nodeOf(t)
    if (!node) {
      errors.push(`thread ${t.scene} at missing node ${t.node}`)
      t.status = 'done'
      continue
    }
    if (t.status === 'done') continue
    if (node.mission) {
      const def = C.missions.get(node.mission.mission)
      // traceSeconds 0 = a "no adversary" mission the sim currently can't express (it floors every
      // trace at 4 s); take the skill-check route there instead of losing to a known sim issue.
      if (!def || def.traceSeconds <= 0) {
        missionAuto(state, t.uid)
        ctx.report.sceneMissions.auto++
      } else {
        const r = play(state, def, false, 1, ctx)
        const won = r.finished === 'won'
        missionResult(state, t.uid, won)
        ctx.report.sceneMissions[won ? 'won' : 'lost']++
      }
      continue
    }
    const views = choicesFor(state, t).filter(v => !v.locked)
    if (views.length > 0) {
      // Prefer checks with good odds, else a pseudo-random unlocked choice.
      const good = views.filter(v => v.check && v.check.chance >= 0.6)
      const pickList = good.length && rand(state) < 0.5 ? good : views
      const v = pickList[Math.floor(rand(state) * pickList.length)]
      if (v) choose(state, t.uid, v.index)
      continue
    }
    if (node.next) {
      advance(state, t.uid)
      continue
    }
    if (node.choices && node.choices.length > 0) {
      // All choices locked/hidden: a soft-lock.
      errors.push(`soft-lock: scene ${t.scene} node ${t.node} has no available choices`)
      t.status = 'done'
      continue
    }
    finishThread(state, t.uid)
  }
}

function manageCareer(state: GameState, strat: Strategy): void {
  const eligible = [...C.jobs.values()].filter(j => canTakeJob(state, j).ok && (strat !== 'hacker' || j.track !== 'management'))
  if (eligible.length === 0) return
  const score = (id: string): number => {
    const j = C.jobs.get(id)
    if (!j) return 0
    const base = dailyPay(state, j)
    const trackBonus = strat === 'hacker' && ['security', 'network', 'shady'].includes(j.track) ? 1.2 : 1
    return base * trackBonus
  }
  const best = eligible.reduce((a, b) => (score(a.id) >= score(b.id) ? a : b))
  const current = state.job ? score(state.job) : 0
  if (score(best.id) > current * 1.15 || !state.job) setJob(state, best.id)
}

function manageSchedule(state: GameState, strat: Strategy, day: number): void {
  if (state.stats.stress > 72 || state.stats.health < 35) applyPreset(state, 'recover')
  else if (strat === 'hacker') applyPreset(state, 'hacker')
  else if (strat === 'legit') applyPreset(state, day % 3 === 0 ? 'balanced' : 'grind')
  else applyPreset(state, 'balanced')
  // Study the weakest focus skill.
  const focus = FOCUS[strat]
  const weakest = focus.reduce((a, b) => (state.skills[a].level <= state.skills[b].level ? a : b))
  if (state.focus.study.kind === 'skill') state.focus.study = { kind: 'skill', skill: weakest }
  // Social: least-liked met social NPC.
  const social = Object.entries(state.npcs)
    .filter(([id, s]) => s.met && C.npcs.get(id)?.social && !['dead', 'missing', 'gone', 'jailed', 'arrested'].includes(s.fate))
    .sort((a, b) => a[1].affinity - b[1].affinity)[0]
  state.focus.social = social ? social[0] : null
}

function manageContracts(state: GameState, strat: Strategy, ctx: RunCtx): void {
  // Hacks are terminal ops: scheduled Hacking hours build recon (prep) on accepted hacks, and the
  // bot launches each one in the terminal (through the solver) once prepped — or when the deadline
  // is closing in. Gigs run themselves off the queue via Freelance hours.
  for (const c of [...state.contracts.active]) {
    if (c.kind !== 'hack') continue
    const prepped = c.prepNeeded <= 0 || c.prep >= c.prepNeeded
    const deadlineClose = c.deadlineDay !== undefined && c.deadlineDay - state.time.day <= balance.DAYS_PER_STEP * 2
    if (prepped || deadlineClose) launchOp(state, c.uid, ctx)
  }
  const heatOk = state.stats.heat < (strat === 'hacker' ? 55 : 35)
  const offers = [...state.contracts.board]
    .filter(c => c.status === 'offered' && canAccept(state, c).ok)
    .filter(c => c.kind === 'freelance' || (strat !== 'legit' && heatOk) || c.def !== undefined)
    .sort((a, b) => successChance(state, b) * b.pay - successChance(state, a) * a.pay)
  for (const c of offers) {
    if (!canAccept(state, c).ok) continue // limits can fill up mid-loop
    if (c.kind === 'hack' && successChance(state, c) < 0.5 && c.def === undefined) continue
    acceptContract(state, c.uid, state.stats.heat > 40 ? 'careful' : 'normal')
  }
}

function manageShopping(state: GameState): void {
  const reserve = dailyExpenses(state) * 30 + 200
  const candidates = [...C.items.values()]
    .filter(i => !i.unique && evalCond(state, i.available) && canBuy(state, i).ok && i.shop !== 'blackmarket')
    .filter(i => {
      const slot = i.category
      if (slot === 'cpu' || slot === 'ram' || slot === 'storage' || slot === 'network' || slot === 'monitor') {
        const cur = state.equipped[slot]
        return (i.tier ?? 0) > (cur ? (C.items.get(cur)?.tier ?? 0) : -1)
      }
      return i.category === 'book' || i.category === 'software' || i.category === 'tool' || i.category === 'furniture'
    })
    .sort((a, b) => itemPrice(state, a) - itemPrice(state, b))
  for (const i of candidates) {
    if (state.stats.money - itemPrice(state, i) < reserve) break
    buyItem(state, i.id)
  }
}

function manageLife(state: GameState): void {
  const daily = dailyExpenses(state)
  const homes = [...C.housing.values()]
    .filter(h => !h.owned && evalCond(state, h.req) && evalCond(state, h.available) && h.id !== state.housing)
    .sort((a, b) => b.comfort - a.comfort)
  const cur = C.housing.get(state.housing)
  const job = state.job ? C.jobs.get(state.job) : undefined
  const income = job ? dailyPay(state, job) : 0
  for (const h of homes) {
    if (h.comfort <= (cur?.comfort ?? 1)) break
    if (h.rentPerDay * 3 < income && state.stats.money > h.moveCost + h.rentPerDay * 60) {
      moveHousing(state, h.id)
      break
    }
  }
  const styles = [...C.lifestyles.values()].filter(l => evalCond(state, l.req)).sort((a, b) => b.costPerDay - a.costPerDay)
  const affordable = styles.find(l => l.costPerDay * 4 < income + 1 && state.stats.money > l.costPerDay * 30)
  if (affordable && affordable.id !== state.lifestyle) setLifestyle(state, affordable.id)
  if (state.stats.money < 0 && daily > 0) {
    const cheapest = styles[styles.length - 1]
    if (cheapest) setLifestyle(state, cheapest.id)
  }
}

function manageEducation(state: GameState, strat: Strategy): void {
  if (strat === 'hacker' || state.edu.enrolled) return
  for (const p of C.programs.values()) {
    if (state.edu.degrees.includes(p.id)) continue
    const retry = state.flags[`edu.exam_retry_day.${p.id}`]
    if (typeof retry === 'number' && state.time.day < retry) continue
    if (state.stats.money > p.tuitionPerSemester * 2) {
      const r = enroll(state, p.id)
      if (r.ok) return
    }
  }
}

export function runBotState(strategy: Strategy, seed: number, maxDays: number, onDay?: (s: GameState) => void): GameState {
  return runBotInner(strategy, seed, maxDays, onDay).state
}

export function runBot(strategy: Strategy, seed: number, maxDays: number): BotReport {
  return runBotInner(strategy, seed, maxDays).report
}

function runBotInner(strategy: Strategy, seed: number, maxDays: number, onDay?: (s: GameState) => void): { state: GameState; report: BotReport } {
  const bgs = [...C.backgrounds.keys()]
  const traits = [...C.traits.keys()]
  const state = createState({
    name: 'Bot',
    handle: 'b0t',
    background: bgs[seed % Math.max(1, bgs.length)] ?? '',
    traits: traits.slice(seed % Math.max(1, traits.length), (seed % Math.max(1, traits.length)) + 2),
    seed,
  })
  state.settings.autoPauseDialogs = false
  bootstrap(state)
  const errors: string[] = []
  const report: BotReport = {
    strategy,
    seed,
    days: 0,
    actDays: { 1: 0 },
    ending: null,
    endingDay: null,
    snapshots: [],
    questsStarted: 0,
    questsCompleted: 0,
    questsFailed: 0,
    questIds: [],
    scenesSeen: 0,
    raids: 0,
    burnouts: 0,
    hospital: 0,
    daysJailed: 0,
    hacks: 0,
    gigs: 0,
    ops: { clean: 0, messy: 0, partial: 0, aborted: 0, traced: 0, scripted: 0, 'scripted-fail': 0 },
    sceneMissions: { won: 0, lost: 0, auto: 0 },
    avgTraceFill: 0,
    complications: 0,
    eventsFired: 0,
    obligations: [],
    scars: [],
    checksPassed: 0,
    checksFailed: 0,
    maxMoney: state.stats.money,
    minMoney: state.stats.money,
    errors,
  }
  const ctx: RunCtx = { report, errors, traceFillSum: 0, traceFillN: 0, obligations: new Set() }
  const startTraits = new Set(state.player.traits)
  const snapDays = new Set([30, 120, 240, 500, 800, 1200, 1600, 2000, 2400, 2900, 3400, 4000])
  let lastAct = 1
  for (let day = 0; state.time.day < maxDays; day++) {
    try {
      manageCareer(state, strategy)
      manageEducation(state, strategy)
      manageSchedule(state, strategy, day)
      manageContracts(state, strategy, ctx)
      manageShopping(state)
      manageLife(state)
      for (let h = 0; h < 24; h++) {
        simulateHour(state)
        answerThreads(state, ctx)
        for (const o of state.obligations) ctx.obligations.add(o.label)
        state.time.speed = 1
      }
    } catch (e) {
      errors.push(`day ${state.time.day}: ${e instanceof Error ? e.stack ?? e.message : String(e)}`)
      break
    }
    onDay?.(state)
    const act = state.vars.act ?? 1
    if (act !== lastAct) {
      report.actDays[act] = state.time.day
      lastAct = act
    }
    report.maxMoney = Math.max(report.maxMoney, state.stats.money)
    report.minMoney = Math.min(report.minMoney, state.stats.money)
    const snapDay = [...snapDays].find(d => d <= state.time.day && !report.snapshots.some(x => x.day >= d))
    if (snapDay !== undefined) {
      report.snapshots.push({
        day: state.time.day,
        money: Math.round(state.stats.money),
        skills: Object.fromEntries(Object.entries(state.skills).map(([k, v]) => [k, v.level])),
        job: state.job,
        cred: Math.round(state.stats.cred),
        heat: Math.round(state.stats.heat),
        act,
      })
    }
    if (state.ending) {
      report.ending = state.ending
      report.endingDay = state.time.day
      break
    }
  }
  report.days = state.time.day
  const qs = Object.entries(state.quests)
  report.questsStarted = qs.length
  report.questsCompleted = qs.filter(([, q]) => q.status === 'completed').length
  report.questsFailed = qs.filter(([, q]) => q.status === 'failed').length
  report.questIds = qs.map(([id, q]) => `${id}:${q.status}:${q.stage}`)
  report.scenesSeen = Object.keys(state.seenScenes).length
  report.raids = state.totals.raids
  report.burnouts = state.vars['sys.burnouts'] ?? 0
  report.hospital = state.vars['sys.hospitalized'] ?? 0
  report.daysJailed = state.totals.daysJailed
  report.hacks = state.totals.hacksDone
  report.gigs = state.totals.gigsDone
  report.checksPassed = state.totals.checksPassed
  report.checksFailed = state.totals.checksFailed
  report.avgTraceFill = ctx.traceFillN ? ctx.traceFillSum / ctx.traceFillN : 0
  for (const [id, f] of Object.entries(state.events.fired)) {
    if (C.events.get(id)?.complication) report.complications += f.count
    else report.eventsFired += f.count
  }
  report.obligations = [...ctx.obligations]
  report.scars = state.player.traits.filter(t => !startTraits.has(t) && C.traits.get(t)?.scar === true)
  return { state, report }
}

export function formatReport(r: BotReport): string {
  const o = r.ops
  const opsPlayed = o.clean + o.messy + o.partial + o.aborted + o.traced
  const turns = r.days / balance.DAYS_PER_STEP
  const lines = [
    `## ${r.strategy} (seed ${r.seed}) — ${r.days} days (${((r.days / balance.DAYS_PER_STEP) * 24 * balance.REAL_SECONDS_PER_GAME_HOUR / 3600).toFixed(1)} h @1x)`,
    `acts reached: ${Object.entries(r.actDays).map(([a, d]) => `A${a}@${d}`).join(' ')}; ending: ${r.ending ?? '—'}${r.endingDay ? `@${r.endingDay}` : ''}`,
    `quests: ${r.questsStarted} started, ${r.questsCompleted} completed, ${r.questsFailed} failed; scenes seen ${r.scenesSeen}`,
    `hacks ${r.hacks}, gigs ${r.gigs}, raids ${r.raids}, jailed ${r.daysJailed}d, burnouts ${r.burnouts}, hospital ${r.hospital}, checks ${r.checksPassed}/${r.checksPassed + r.checksFailed}`,
    `ops ${opsPlayed} played: clean ${o.clean}, messy ${o.messy}, partial ${o.partial}, aborted ${o.aborted}, traced ${o.traced}` +
      (o.scripted + o['scripted-fail'] ? `; scripted ${o.scripted}/${o.scripted + o['scripted-fail']}` : '') +
      `; avg trace fill ${Math.round(r.avgTraceFill * 100)}%; scene missions won ${r.sceneMissions.won}, lost ${r.sceneMissions.lost}, auto ${r.sceneMissions.auto}`,
    `events ${r.eventsFired} (${turns ? ((r.eventsFired / turns) * 10).toFixed(1) : '0'}/10 turns), complications ${r.complications}, raids ${r.raids}`,
    `obligations ${r.obligations.length}${r.obligations.length ? ` (${r.obligations.join('; ')})` : ''}; scars ${r.scars.length}${r.scars.length ? ` (${r.scars.join(', ')})` : ''}`,
    `money min ${Math.round(r.minMoney)} max ${Math.round(r.maxMoney)}`,
    ...r.snapshots.map(
      s =>
        `  d${s.day} A${s.act} $${s.money} job=${s.job ?? '-'} cred=${s.cred} heat=${s.heat} ` +
        Object.entries(s.skills)
          .map(([k, v]) => `${k.slice(0, 4)}${v}`)
          .join(' '),
    ),
    ...(r.errors.length ? ['ERRORS:', ...r.errors.slice(0, 30).map(e => `  ${e}`)] : []),
  ]
  return lines.join('\n')
}
