/**
 * Engine mechanics tests with inline test content injected into the registry (ids prefixed
 * `t_` so they never collide with real content).
 */
import { beforeAll, describe, expect, it } from 'vitest'
import {
  C,
  acceptContract,
  advance,
  applyEffects,
  balance,
  bootstrap,
  choicesFor,
  choose,
  completeOp,
  createState,
  deserialize,
  evalCond,
  findThread,
  refreshBoard,
  serialize,
  setJob,
  setSlot,
  simulateHours,
  startQuest,
  type GameState,
} from '../src/engine'
import { applyPreset } from '../src/engine/sim/schedule'
import { resolveContract } from '../src/engine/sim/contracts'

function fresh(): GameState {
  const s = createState({ name: 'T', handle: 't', background: '', traits: [], seed: 7 })
  s.settings.autoPauseDialogs = false
  return s
}

beforeAll(() => {
  C.scenes.set('t_mail', {
    id: 't_mail',
    channel: 'mail',
    title: 'Test mail',
    from: 'Test Sender',
    start: 'a',
    nodes: {
      a: {
        text: 'Hello {name}.',
        effects: [{ flag: 't.delivered' }],
        choices: [
          { text: 'Yes', effects: [{ flag: 't.yes' }], goto: 'b' },
          { text: 'Locked', req: { skill: 'intrusion', gte: 99 }, reqText: 'Intrusion 99', goto: 'b' },
          { text: 'Hidden', if: { flag: 't.never' }, goto: 'b' },
          { text: 'Roll', check: { skill: 'social', dc: 1, success: 'win', fail: 'lose' } },
        ],
      },
      b: { text: 'Bye', next: 'c' },
      c: { text: 'End.' },
      win: { text: 'Won', effects: [{ flag: 't.won' }] },
      lose: { text: 'Lost' },
    },
  })
  C.quests.set('t_quest', {
    id: 't_quest',
    title: 'Test quest',
    kind: 'side',
    summary: 'x',
    start: 's1',
    stages: {
      s1: {
        text: 'do it',
        objectives: [{ id: 'o1', text: 'flag', when: { flag: 't.go' }, hint: 'set it' }],
        onComplete: [{ flag: 't.s1done' }],
        next: [{ if: { flag: 't.branch' }, stage: 's3' }, { stage: 's2' }],
      },
      s2: { text: 'second', objectives: [{ id: 'o2', text: 'money', when: { stat: 'money', gte: 1_000_000 }, hint: 'get rich' }] },
      s3: { text: 'third', objectives: [], outcome: 'failed' },
    },
  })
  C.quests.set('t_timed', {
    id: 't_timed',
    title: 'Timed',
    kind: 'side',
    summary: 'x',
    start: 's1',
    stages: {
      s1: {
        text: 'hurry',
        timeLimitDays: 2,
        onTimeout: { effects: [{ flag: 't.timeout' }], fail: true },
        objectives: [{ id: 'o', text: 'never', when: { never: true }, hint: 'no' }],
      },
    },
  })
  C.triggers.push(
    { id: 't_trig_once', when: { flag: 't.trig' }, effects: [{ var: 't.count', add: 1 }] },
    { id: 't_trig_repeat', when: { flag: 't.rep' }, once: false, cooldownDays: 1, effects: [{ var: 't.rep', add: 1 }] },
  )
  C.jobs.set('t_job', {
    id: 't_job',
    title: 'Tester',
    employer: 'Test Co',
    track: 'support',
    desc: 'x',
    pay: 100,
    shiftStart: 9,
    hours: 8,
    skillXp: { systems: 3 },
    stressPerHour: 1,
    energyPerHour: 4,
  })
  C.contracts.set('t_contract', {
    id: 't_contract',
    kind: 'hack',
    title: 'Test hack',
    client: 'x',
    desc: 'x',
    skills: ['intrusion'],
    dc: 1,
    hours: 2,
    pay: 500,
    heat: 10,
    cred: 3,
    onSuccess: [{ flag: 't.hacked' }],
  })
})

describe('scenes', () => {
  it('delivers, runs start effects, renders choices, follows gotos and ends', () => {
    const s = fresh()
    applyEffects(s, [{ scene: 't_mail' }])
    const t = s.threads.find(x => x.scene === 't_mail')
    expect(t).toBeDefined()
    if (!t) return
    expect(s.flags['t.delivered']).toBe(true)
    const views = choicesFor(s, t)
    expect(views.map(v => v.text)).toEqual(['Yes', 'Locked', 'Roll'])
    expect(views[1]?.locked).toBe(true)
    expect(choose(s, t.uid, 1).ok).toBe(false) // locked
    expect(choose(s, t.uid, 0).ok).toBe(true)
    expect(s.flags['t.yes']).toBe(true)
    expect(t.node).toBe('b')
    expect(advance(s, t.uid)).toBe(true)
    expect(t.node).toBe('c')
    expect(t.status).toBe('done')
  })

  it('rolls checks and branches (DC 1 nearly always succeeds; nat 1 fails)', () => {
    let wins = 0
    for (let i = 0; i < 40; i++) {
      const s = createState({ name: 'T', handle: 't', background: '', traits: [], seed: 100 + i })
      applyEffects(s, [{ scene: 't_mail' }])
      const t = s.threads[0]
      if (!t) continue
      const r = choose(s, t.uid, 3)
      expect(r.roll).toBeDefined()
      if (r.roll?.success) {
        wins++
        expect(t.node).toBe('win')
      } else expect(t.node).toBe('lose')
    }
    expect(wins).toBeGreaterThan(30)
  })

  it('does not duplicate an unanswered scene and supports delayed delivery', () => {
    const s = fresh()
    applyEffects(s, [{ scene: 't_mail' }, { scene: 't_mail' }])
    expect(s.threads.filter(t => t.scene === 't_mail').length).toBe(1)
    const s2 = fresh()
    applyEffects(s2, [{ scene: 't_mail', delayHours: 5 }])
    // Real content (e.g. the auto-started Act 1 quest) may deliver its own
    // scenes during the simulated hours, so only count the test scene.
    const mailThreads = (): number => s2.threads.filter(t => t.scene === 't_mail').length
    expect(mailThreads()).toBe(0)
    simulateHours(s2, 4, false)
    expect(mailThreads()).toBe(0)
    simulateHours(s2, 1, false)
    expect(mailThreads()).toBe(1)
  })
})

describe('quests', () => {
  it('latches objectives, runs onComplete and branches', () => {
    const s = fresh()
    startQuest(s, 't_quest')
    simulateHours(s, 1, false)
    expect(s.quests.t_quest?.stage).toBe('s1')
    s.flags['t.go'] = true
    simulateHours(s, 1, false)
    expect(s.flags['t.s1done']).toBe(true)
    expect(s.quests.t_quest?.stage).toBe('s2')
    expect(s.quests.t_quest?.history).toContain('s1')
  })

  it('takes the conditional branch and ends with the stage outcome', () => {
    const s = fresh()
    s.flags['t.branch'] = true
    startQuest(s, 't_quest')
    s.flags['t.go'] = true
    simulateHours(s, 1, false)
    expect(s.quests.t_quest?.status).toBe('failed')
  })

  it('times out and caps speed while timed', () => {
    const s = fresh()
    startQuest(s, 't_timed')
    s.time.speed = 10
    simulateHours(s, 24 * 3, false)
    expect(s.flags['t.timeout']).toBe(true)
    expect(s.quests.t_timed?.status).toBe('failed')
  })
})

describe('triggers', () => {
  it('once triggers fire once; repeatable respect cooldown', () => {
    const s = fresh()
    s.flags['t.trig'] = true
    s.flags['t.rep'] = true
    simulateHours(s, 24 * 3, false)
    expect(s.vars['t.count']).toBe(1)
    const rep = s.vars['t.rep'] ?? 0
    expect(rep).toBeGreaterThanOrEqual(3)
    expect(rep).toBeLessThanOrEqual(4)
  })
})

describe('jobs & schedule', () => {
  it('places shift slots, pays salary, trains skills', () => {
    const s = fresh()
    expect(setJob(s, 't_job')).toBe(true)
    for (let h = 9; h < 17; h++) expect(s.schedule[h]).toBe('work')
    expect(setSlot(s, 10, 'relax')).toBe(false)
    const before = s.stats.money
    // advance to next midnight + a full day
    simulateHours(s, 24 * 2, false)
    expect(s.stats.money).toBeGreaterThan(before + 100)
    expect(s.skills.systems.xp + s.skills.systems.level).toBeGreaterThan(0)
    setJob(s, null)
    expect(s.schedule.includes('work')).toBe(false)
  })

  it('presets fill free hours only', () => {
    const s = fresh()
    setJob(s, 't_job')
    applyPreset(s, 'grind')
    expect(s.schedule.filter(a => a === 'work').length).toBe(8)
    expect(s.schedule.filter(a => a === 'sleep').length).toBe(7)
  })
})

describe('contracts', () => {
  it('offers, accepts, preps via hack hours, completes as a terminal op with rewards and heat', () => {
    const s = fresh()
    applyEffects(s, [{ contract: 't_contract' }])
    const offer = s.contracts.board.find(c => c.def === 't_contract')
    expect(offer).toBeDefined()
    if (!offer) return
    expect(acceptContract(s, offer.uid, 'normal')).toBe(true)
    for (let h = 0; h < 24; h++) setSlot(s, h, 'hack')
    s.stats.energy = 100
    simulateHours(s, 12, false)
    const c = s.contracts.active.find(x => x.uid === offer.uid)
    expect(c).toBeDefined()
    if (!c) return
    // Hack hours do recon (prep) — hacks never auto-resolve; the Terminal launches them.
    expect(c.prep).toBeGreaterThan(0)
    expect(s.contracts.history.t_contract).toBeUndefined()
    const report = completeOp(s, c.uid, { goalsDone: 1, goalsTotal: 1, traced: false, aborted: false, logsLeft: 1 })
    expect(report.outcome).toBe('messy')
    const done = s.contracts.history.t_contract
    expect(done?.done).toBe(1)
    expect(s.flags['t.hacked']).toBe(true)
    expect(s.stats.heat).toBeGreaterThan(0)
  })

  it('forced resolution works (terminal minigame result)', () => {
    const s = fresh()
    applyEffects(s, [{ contract: 't_contract', direct: true }])
    const c = s.contracts.active[0]
    expect(c).toBeDefined()
    if (!c) return
    const r = resolveContract(s, c.uid, false)
    expect(r?.success).toBe(false)
    expect(s.contracts.history.t_contract?.failed).toBe(1)
  })

  it('board refresh does not throw with any content', () => {
    const s = fresh()
    refreshBoard(s, true)
    expect(Array.isArray(s.contracts.board)).toBe(true)
  })
})

describe('conditions', () => {
  it('evaluates composite conditions', () => {
    const s = fresh()
    s.flags.a = true
    s.vars.v = 5
    expect(evalCond(s, { all: [{ flag: 'a' }, { var: 'v', gte: 5 }, { not: { flag: 'b' } }] })).toBe(true)
    expect(evalCond(s, { any: [{ flag: 'b' }, { var: 'v', lte: 4 }] })).toBe(false)
    expect(evalCond(s, { day: true, gte: 0, lte: 0 })).toBe(true)
    s.flags.str = 'thriving'
    expect(evalCond(s, { flag: 'str', eq: 'thriving' })).toBe(true)
    expect(evalCond(s, { npc: 'nobody_here', fate: 'normal' })).toBe(true)
  })
})

describe('save', () => {
  it('round-trips through serialize/deserialize and keeps simulating', () => {
    const s = fresh()
    bootstrap(s)
    simulateHours(s, 50, false)
    const copy = deserialize(serialize(s))
    expect(copy.time.day).toBe(s.time.day)
    expect(copy.stats.money).toBe(s.stats.money)
    simulateHours(copy, 24, false)
    expect(copy.time.day).toBe(s.time.day + balance.DAYS_PER_STEP)
  })

  it('findThread works after load', () => {
    const s = fresh()
    applyEffects(s, [{ scene: 't_mail' }])
    const copy = deserialize(serialize(s))
    const uid = s.threads[0]?.uid ?? -1
    expect(findThread(copy, uid)?.scene).toBe('t_mail')
  })
})
