/**
 * OPS ENGINE tests (REDESIGN_V2 §A/§B): procedural terminal-op generation (determinism &
 * solvability across every network/goal/tier), prep perks, the completeOp outcome table, scriptOp,
 * the gig queue (order & reorder), hack deadlines, and per-kind board sizes.
 *
 * The engine registry is mocked with an empty, well-shaped one so these unit tests exercise the
 * ops engine in isolation — they do not depend on the game's content loading (and stay green even
 * while content packs are mid-edit). Test contracts/templates/events are injected into the mock.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Registry } from '../src/engine/registry'

const reg = vi.hoisted((): Registry => {
  return {
    scenes: new Map(),
    quests: new Map(),
    triggers: [],
    npcs: new Map(),
    factions: new Map(),
    news: new Map(),
    forum: new Map(),
    endings: new Map(),
    jobs: new Map(),
    programs: new Map(),
    courses: new Map(),
    items: new Map(),
    housing: new Map(),
    lifestyles: new Map(),
    backgrounds: new Map(),
    traits: new Map(),
    contracts: new Map(),
    contractTemplates: new Map(),
    missions: new Map(),
    events: new Map(),
    origin: new Map(),
    errors: [],
    autoQuests: [],
    ambientNews: [],
    conditionalForum: [],
  }
})

vi.mock('../src/engine/registry', () => ({ C: reg, defineContent: (pack: unknown) => pack }))

import {
  balance,
  acceptContract,
  completeOp,
  createState,
  dailyContracts,
  effectiveHours,
  generateMission,
  missionProblems,
  moveContract,
  opMission,
  prepPerks,
  refreshBoard,
  scriptChance,
  scriptOp,
  workHour,
  OP_GOALS,
  OP_NETWORKS,
  type ContractInstance,
  type ContractTemplateDef,
  type EventDef,
  type GameState,
  type MissionDef,
  type OpSpec,
} from '../src/engine'

function fresh(seed = 42): GameState {
  return createState({ name: 'T', handle: 't', background: '', traits: [], seed })
}

function craftHack(state: GameState, over: Partial<ContractInstance> = {}): ContractInstance {
  const tier = over.tier ?? 3
  const dc = over.dc ?? 15
  const spec: OpSpec = { network: 'corp', goal: 'download', loot: [] }
  const mission = over.missionDef ?? generateMission(state, spec, { id: `op_${state.nextUid}`, title: 'Test Op', tier, dc })
  const c: ContractInstance = {
    uid: state.nextUid++,
    kind: 'hack',
    title: 'Test Hack',
    client: 'a client',
    desc: 'x',
    skills: ['intrusion'],
    dc,
    hours: 20,
    pay: 1000,
    heat: 10,
    cred: 4,
    rep: {},
    tier,
    offeredDay: 0,
    expiresDay: 999,
    progress: 0,
    approach: 'normal',
    status: 'active',
    missionDef: mission,
    prep: 0,
    prepNeeded: 20,
    deadlineDay: state.time.day + balance.HACK_DEADLINE_DAYS,
    ...over,
  }
  state.contracts.active.push(c)
  return c
}

function craftGig(state: GameState, over: Partial<ContractInstance> = {}): ContractInstance {
  const c: ContractInstance = {
    uid: state.nextUid++,
    kind: 'freelance',
    title: 'Test Gig',
    client: 'a client',
    desc: 'x',
    skills: ['programming'],
    dc: 8,
    hours: 1,
    pay: 200,
    heat: 0,
    cred: 0,
    rep: {},
    tier: 1,
    offeredDay: 0,
    expiresDay: 999,
    progress: 0,
    approach: 'normal',
    status: 'active',
    prep: 0,
    prepNeeded: 0,
    ...over,
  }
  state.contracts.active.push(c)
  return c
}

function hackTemplate(id: string, tier: number, op: OpSpec): ContractTemplateDef {
  return {
    id,
    kind: 'hack',
    tier,
    titles: [`Job ${id}`],
    descs: ['do the thing to {target}'],
    targets: ['a target'],
    clients: ['a client'],
    skills: ['intrusion'],
    dc: [12, 14],
    hours: [6, 12],
    pay: [150, 300],
    heat: [3, 5],
    cred: [0.5, 1.2],
    op,
  }
}

function gigTemplate(id: string, tier: number): ContractTemplateDef {
  return {
    id,
    kind: 'freelance',
    tier,
    titles: [`Gig ${id}`],
    descs: ['build the thing'],
    targets: [],
    clients: ['a client'],
    skills: ['programming'],
    dc: [8, 12],
    hours: [6, 12],
    pay: [80, 200],
    heat: [0, 0],
    cred: [0, 0],
  }
}

beforeEach(() => {
  reg.contractTemplates.clear()
  reg.contracts.clear()
  reg.events.clear()
  reg.missions.clear()
})

// ────────────────────────────────────────────────────────────────────────────

describe('generateMission — determinism & solvability', () => {
  it('is deterministic for a given RNG state', () => {
    for (const network of OP_NETWORKS) {
      const a = generateMission(fresh(7), { network, goal: 'download', loot: [] }, { id: 'op', title: 'X', tier: 3, dc: 18 })
      const b = generateMission(fresh(7), { network, goal: 'download', loot: [] }, { id: 'op', title: 'X', tier: 3, dc: 18 })
      expect(JSON.stringify(b)).toBe(JSON.stringify(a))
    }
  })

  it('produces a solvable op for every network × goal × tier', () => {
    const state = fresh(101)
    for (const network of OP_NETWORKS) {
      for (const goal of OP_GOALS) {
        for (let tier = 1; tier <= 5; tier++) {
          const dc = 8 + tier * 4
          const def = generateMission(state, { network, goal, loot: [] }, { id: `op_${network}_${goal}_${tier}`, title: 'Op', tier, dc, target: 'the mark' })
          const problems = missionProblems(def)
          expect(problems, `${network}/${goal}/t${tier}: ${problems.join('; ')}`).toEqual([])
          expect(def.hosts.length).toBeGreaterThanOrEqual(2)
          expect(def.hosts.length).toBeLessThanOrEqual(9)
          expect(def.known.length).toBeGreaterThan(0)
          expect(def.goals.length).toBeGreaterThan(0)
          // The chain (door -> ... -> vault) sits inside the 2..6 band.
          const chain = def.hosts.filter(h => !h.proxy && h.id !== 'decoy')
          expect(chain.length).toBeGreaterThanOrEqual(2)
          expect(chain.length).toBeLessThanOrEqual(6)
        }
      }
    }
  })

  it('scales trace time and lock difficulty with tier', () => {
    const t1 = generateMission(fresh(3), { network: 'corp', goal: 'download', loot: [] }, { id: 'a', title: 'A', tier: 1, dc: 11 })
    const t5 = generateMission(fresh(3), { network: 'corp', goal: 'download', loot: [] }, { id: 'b', title: 'B', tier: 5, dc: 27 })
    expect(t1.traceSeconds).toBeGreaterThan(t5.traceSeconds)
    const vault1 = t1.hosts.find(h => h.id === 'vault')
    const vault5 = t5.hosts.find(h => h.id === 'vault')
    const maxDiff = (h?: MissionDef['hosts'][number]): number => Math.max(0, ...(h?.ports.map(p => p.difficulty) ?? [0]))
    expect(maxDiff(vault5)).toBeGreaterThan(maxDiff(vault1))
  })

  it('honours the requested goal (payload for upload, logs for wipe, encryption at high tier)', () => {
    const state = fresh(5)
    const up = generateMission(state, { network: 'shop', goal: 'upload', loot: [] }, { id: 'u', title: 'U', tier: 2, dc: 15 })
    const upGoal = up.goals[0]
    expect(upGoal?.kind).toBe('upload')
    expect((up.payloads ?? []).some(p => upGoal?.kind === 'upload' && p.name === upGoal.file)).toBe(true)

    const wipe = generateMission(state, { network: 'school', goal: 'wipeLogs', loot: [] }, { id: 'w', title: 'W', tier: 2, dc: 15 })
    const wipeGoal = wipe.goals[0]
    expect(wipeGoal?.kind).toBe('wipeLogs')
    const wipeHost = wipe.hosts.find(h => wipeGoal?.kind === 'wipeLogs' && h.id === wipeGoal.host)
    expect(wipeHost?.logs).toBe(true)

    const read = generateMission(state, { network: 'bank', goal: 'read', loot: [] }, { id: 'r', title: 'R', tier: 5, dc: 26 })
    const rGoal = read.goals[0]
    const rHost = read.hosts.find(h => rGoal?.kind === 'read' && h.id === rGoal.host)
    const rFile = rHost?.files.find(f => rGoal?.kind === 'read' && f.name === rGoal.file)
    expect(rFile?.encrypted).toBe(true)
  })

  it('uses spec loot names when provided', () => {
    const def = generateMission(fresh(9), { network: 'corp', goal: 'download', loot: ['secret_dossier.dat'] }, { id: 'x', title: 'X', tier: 2, dc: 15 })
    const g = def.goals[0]
    expect(g?.kind === 'download' && g.file.startsWith('secret_dossier')).toBe(true)
  })

  it('flags a hand-broken mission as unsolvable', () => {
    const def: MissionDef = {
      id: 'broken',
      title: 'Broken',
      briefing: 'x',
      known: ['door'],
      traceSeconds: 100,
      hosts: [
        { id: 'door', ip: '10.0.0.1', name: 'Door', ports: [{ port: 80, service: 'lobby', difficulty: 0 }], files: [], logs: false },
        { id: 'vault', ip: '10.0.0.2', name: 'Vault', ports: [{ port: 22, service: 'moth-latch', difficulty: 5 }], files: [], logs: true },
      ],
      goals: [{ kind: 'download', host: 'vault', file: 'ghost.dat' }],
    }
    const problems = missionProblems(def)
    expect(problems.some(p => p.includes('not reachable'))).toBe(true)
    expect(problems.some(p => p.includes('ghost.dat'))).toBe(true)
  })
})

// ────────────────────────────────────────────────────────────────────────────

describe('prep perks & opMission', () => {
  it('prepPerks reports thresholds as recon accrues', () => {
    const state = fresh()
    const c = craftHack(state, { prepNeeded: 20 })
    c.prep = 0
    expect(prepPerks(c)).toEqual([])
    c.prep = 5 // 25%
    expect(prepPerks(c).length).toBe(1)
    c.prep = 10 // 50%
    expect(prepPerks(c).length).toBe(2)
    c.prep = 16 // 80%
    expect(prepPerks(c).length).toBe(3)
    c.prep = 20 // 100%
    expect(prepPerks(c).length).toBe(3)
  })

  it('opMission applies map / difficulty / trace / pre-open perks and never mutates the base', () => {
    const state = fresh(21)
    const c = craftHack(state, { prepNeeded: 20, tier: 3, dc: 18 })
    const base = c.missionDef
    expect(base).toBeDefined()
    if (!base) return
    const baseKnown = base.known.length
    const baseTrace = base.traceSeconds
    const baseDiffSum = base.hosts.flatMap(h => h.ports.map(p => p.difficulty)).reduce((a, b) => a + b, 0)

    c.prep = 0
    const m0 = opMission(state, c.uid)
    expect(m0?.known.length).toBe(baseKnown)
    expect(m0?.traceSeconds).toBe(baseTrace)

    c.prep = 5 // 25% — full map
    expect(opMission(state, c.uid)?.known.length).toBe(base.hosts.length)

    c.prep = 10 // 50% — every lock one notch easier
    const m50 = opMission(state, c.uid)
    const diff50 = (m50?.hosts.flatMap(h => h.ports.map(p => p.difficulty)) ?? []).reduce((a, b) => a + b, 0)
    expect(diff50).toBeLessThan(baseDiffSum)

    c.prep = 15 // 75% — trace ×1.35
    expect(opMission(state, c.uid)?.traceSeconds).toBe(Math.round(baseTrace * 1.35))

    c.prep = 20 // 100% — trace ×1.6 and one goal-host lock pre-opened
    const m100 = opMission(state, c.uid)
    expect(m100?.traceSeconds).toBe(Math.round(baseTrace * 1.6))
    const goalHosts = new Set((m100?.goals ?? []).map(g => g.host))
    const vault = m100?.hosts.find(h => goalHosts.has(h.id))
    expect(vault?.ports.some(p => p.difficulty === 0)).toBe(true)

    // Base is untouched by all of that.
    expect(base.known.length).toBe(baseKnown)
    expect(base.traceSeconds).toBe(baseTrace)
  })
})

// ────────────────────────────────────────────────────────────────────────────

describe('completeOp — outcome table', () => {
  it('clean: full pay, reduced heat, full cred', () => {
    const state = fresh()
    const c = craftHack(state)
    const r = completeOp(state, c.uid, { goalsDone: 1, goalsTotal: 1, traced: false, aborted: false, logsLeft: 0 })
    expect(r.outcome).toBe('clean')
    expect(r.pay).toBe(1000)
    expect(state.stats.cred).toBeGreaterThan(0)
    expect(state.stats.heat).toBeGreaterThan(0)
    expect(state.contracts.active).toHaveLength(0)
    expect(state.contracts.history['tpl:unknown']?.done).toBe(1)
    expect(state.lastReport?.report.outcome).toBe('clean')
  })

  it('messy: full pay but hotter than clean when logs are left', () => {
    const clean = fresh()
    const cc = craftHack(clean)
    const cr = completeOp(clean, cc.uid, { goalsDone: 1, goalsTotal: 1, traced: false, aborted: false, logsLeft: 0 })

    const messy = fresh()
    const mc = craftHack(messy)
    const mr = completeOp(messy, mc.uid, { goalsDone: 1, goalsTotal: 1, traced: false, aborted: false, logsLeft: 2 })
    expect(mr.outcome).toBe('messy')
    expect(mr.pay).toBe(1000)
    expect(mr.heat).toBeGreaterThan(cr.heat)
  })

  it('partial: scaled pay, half cred', () => {
    const state = fresh()
    const c = craftHack(state)
    const r = completeOp(state, c.uid, { goalsDone: 1, goalsTotal: 2, traced: false, aborted: false, logsLeft: 1 })
    expect(r.outcome).toBe('partial')
    expect(r.pay).toBe(Math.round((1000 * 1) / 2 * 0.6))
    expect(r.cred).toBeCloseTo(2, 5)
  })

  it('aborted: no pay, a cred hit', () => {
    const state = fresh()
    state.stats.cred = 20
    const c = craftHack(state)
    const r = completeOp(state, c.uid, { goalsDone: 0, goalsTotal: 2, traced: false, aborted: true, logsLeft: 1 })
    expect(r.outcome).toBe('aborted')
    expect(r.pay).toBe(0)
    expect(r.cred).toBeLessThan(0)
    expect(state.stats.cred).toBeLessThan(20)
    expect(state.contracts.history['tpl:unknown']?.failed).toBe(1)
  })

  it('traced: no pay, big heat, cred loss, and a complication is spawned', () => {
    const state = fresh()
    const complication: EventDef = {
      id: 'comp_hack_test',
      category: 'underground',
      complication: { sources: ['hack'] },
      effects: [{ flag: 'comp.fired' }],
    }
    reg.events.set(complication.id, complication)
    state.stats.cred = 20
    const c = craftHack(state)
    const before = state.stats.cred
    const r = completeOp(state, c.uid, { goalsDone: 0, goalsTotal: 1, traced: true, aborted: false, logsLeft: 1 })
    expect(r.outcome).toBe('traced')
    expect(r.pay).toBe(0)
    expect(r.heat).toBeGreaterThan(0)
    expect(state.stats.cred).toBeLessThan(before)
    expect(r.complication).toBe('comp_hack_test')
    expect(state.flags['comp.fired']).toBe(true)
  })

  it('runs story onSuccess / onFail effects', () => {
    reg.contracts.set('story_hack', {
      id: 'story_hack',
      kind: 'hack',
      title: 'Story Hack',
      client: 'x',
      desc: 'x',
      skills: ['intrusion'],
      dc: 15,
      hours: 10,
      pay: 500,
      heat: 5,
      cred: 3,
      onSuccess: [{ flag: 'story.win' }],
      onFail: [{ flag: 'story.lose' }],
    })
    const win = fresh()
    const wc = craftHack(win, { def: 'story_hack' })
    completeOp(win, wc.uid, { goalsDone: 1, goalsTotal: 1, traced: false, aborted: false, logsLeft: 0 })
    expect(win.flags['story.win']).toBe(true)

    const lose = fresh()
    const lc = craftHack(lose, { def: 'story_hack' })
    completeOp(lose, lc.uid, { goalsDone: 0, goalsTotal: 1, traced: true, aborted: false, logsLeft: 1 })
    expect(lose.flags['story.lose']).toBe(true)
  })
})

// ────────────────────────────────────────────────────────────────────────────

describe('scriptOp & scriptChance', () => {
  it('scriptChance is a probability that drops as DC rises', () => {
    const state = fresh()
    const easy = craftHack(state, { dc: 10 })
    const hard = craftHack(state, { dc: 25 })
    const ce = scriptChance(state, easy)
    const ch = scriptChance(state, hard)
    expect(ce).toBeGreaterThan(0)
    expect(ce).toBeLessThanOrEqual(1)
    expect(ce).toBeGreaterThan(ch)
  })

  it('produces both a scripted win and a scripted-fail, with the right consequences', () => {
    const state = fresh(3)
    const outcomes = new Set<string>()
    let sawWin = false
    let sawFail = false
    for (let i = 0; i < 400 && !(sawWin && sawFail); i++) {
      const c = craftHack(state, { dc: 15 })
      const r = scriptOp(state, c.uid)
      outcomes.add(r.outcome)
      if (r.outcome === 'scripted') {
        sawWin = true
        expect(r.pay).toBe(Math.round(1000 * balance.SCRIPT_PAY_MULT))
      }
      if (r.outcome === 'scripted-fail') {
        sawFail = true
        expect(r.pay).toBe(0)
      }
      expect(state.contracts.active).toHaveLength(0)
    }
    expect(sawWin).toBe(true)
    expect(sawFail).toBe(true)
  })
})

// ────────────────────────────────────────────────────────────────────────────

describe('gig queue — order & reorder', () => {
  it('freelance hours work the first gig, then roll to the next', () => {
    const state = fresh()
    const a = craftGig(state, { title: 'First', hours: 1, progress: effectiveHoursFor(1) - 0.001 })
    // Big enough that the leftover work rolling over from the first gig can't finish it too.
    const b = craftGig(state, { title: 'Second', hours: 40 })
    // One hour finishes the (nearly-done) first gig.
    expect(workHour(state, 'freelance', 5)).toBe(true)
    expect(state.contracts.active.some(x => x.uid === a.uid)).toBe(false)
    expect(state.contracts.active.some(x => x.uid === b.uid)).toBe(true)
    // Now the queue rolls to the second gig.
    expect(workHour(state, 'freelance', 5)).toBe(true)
  })

  it('workHour returns false (→ practice) when nothing is queued', () => {
    const state = fresh()
    expect(workHour(state, 'freelance', 5)).toBe(false)
    expect(workHour(state, 'hack', 5)).toBe(false)
  })

  it('moveContract reorders within a kind, skipping other kinds', () => {
    const state = fresh()
    const a = craftGig(state, { title: 'A' })
    const h = craftHack(state, { title: 'H' })
    const b = craftGig(state, { title: 'B' })
    expect(state.contracts.active.map(c => c.uid)).toEqual([a.uid, h.uid, b.uid])
    // Move B earlier: it should swap with A (the nearest gig), leaving the hack in place.
    expect(moveContract(state, b.uid, -1)).toBe(true)
    expect(state.contracts.active.map(c => c.uid)).toEqual([b.uid, h.uid, a.uid])
    // A is already last among gigs; moving later does nothing.
    expect(moveContract(state, a.uid, 1)).toBe(false)
  })
})

// ────────────────────────────────────────────────────────────────────────────

describe('hack prep & deadlines', () => {
  it('hack hours prep the first unprepped hack, then fall through', () => {
    const state = fresh()
    const a = craftHack(state, { prep: 0, prepNeeded: 20 })
    const b = craftHack(state, { prep: 0, prepNeeded: 20 })
    expect(workHour(state, 'hack', 5)).toBe(true)
    expect(a.prep).toBeGreaterThan(0)
    expect(b.prep).toBe(0)
    // Finish a's prep, then hours move to b.
    a.prep = a.prepNeeded
    expect(workHour(state, 'hack', 5)).toBe(true)
    expect(b.prep).toBeGreaterThan(0)
    // Both fully prepped → nothing left to prep.
    b.prep = b.prepNeeded
    expect(workHour(state, 'hack', 5)).toBe(false)
  })

  it('an accepted hack past its deadline fails (cred loss, removed from active)', () => {
    const state = fresh()
    state.stats.cred = 20
    const c = craftHack(state, { deadlineDay: state.time.day - 1, cred: 4 })
    const credBefore = state.stats.cred
    dailyContracts(state)
    expect(state.contracts.active.some(x => x.uid === c.uid)).toBe(false)
    expect(state.stats.cred).toBeLessThan(credBefore)
    expect(state.contracts.history['tpl:unknown']?.failed).toBe(1)
  })

  it('expires stale board offers', () => {
    const state = fresh()
    const stale = craftGig(state, {})
    // Move it to the board as an expired offer.
    state.contracts.active = []
    stale.status = 'offered'
    stale.expiresDay = state.time.day
    state.contracts.board.push(stale)
    dailyContracts(state)
    expect(state.contracts.board.some(c => c.uid === stale.uid)).toBe(false)
  })
})

// ────────────────────────────────────────────────────────────────────────────

describe('boards — per-kind sizes topped up each turn', () => {
  it('fills the hack board to HACK_BOARD_SIZE and the gig board to GIG_BOARD_SIZE', () => {
    reg.contractTemplates.set('h1', hackTemplate('h1', 1, { network: 'isp', goal: 'download', loot: [] }))
    reg.contractTemplates.set('h2', hackTemplate('h2', 1, { network: 'shop', goal: 'upload', loot: [] }))
    reg.contractTemplates.set('g1', gigTemplate('g1', 1))
    reg.contractTemplates.set('g2', gigTemplate('g2', 1))
    const state = fresh()
    refreshBoard(state, true)
    const hacks = state.contracts.board.filter(c => c.kind === 'hack' && !c.def)
    const gigs = state.contracts.board.filter(c => c.kind === 'freelance' && !c.def)
    expect(hacks.length).toBe(balance.HACK_BOARD_SIZE)
    expect(gigs.length).toBe(balance.GIG_BOARD_SIZE)
  })

  it('accepting a hack generates its mission, sets prep budget and a deadline', () => {
    reg.contractTemplates.set('h1', hackTemplate('h1', 1, { network: 'corp', goal: 'download', loot: [] }))
    const state = fresh()
    refreshBoard(state, true)
    const offer = state.contracts.board.find(c => c.kind === 'hack' && !c.def)
    expect(offer).toBeDefined()
    if (!offer) return
    expect(acceptContract(state, offer.uid)).toBe(true)
    const active = state.contracts.active.find(c => c.uid === offer.uid)
    expect(active?.status).toBe('active')
    const md = active?.missionDef
    expect(md).toBeDefined()
    if (md) expect(missionProblems(md)).toEqual([])
    expect(active?.prepNeeded ?? 0).toBeGreaterThan(0)
    expect(active?.deadlineDay).toBe(state.time.day + balance.HACK_DEADLINE_DAYS)
  })
})

function effectiveHoursFor(hours: number): number {
  return effectiveHours({ hours, approach: 'normal' } as ContractInstance)
}
