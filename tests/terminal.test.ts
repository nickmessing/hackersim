import { describe, expect, it } from 'vitest'
import type { MissionDef } from '../src/engine'
import { crackSeconds, decryptSeconds, defaultEnv, MissionSim, type SimEnv, traceTotal } from '../src/ui/terminal/sim'

function mission(): MissionDef {
  return {
    id: 'test_job',
    title: 'Test Job',
    briefing: 'Grab the ledger, wipe the logs, get out clean.',
    known: ['gw'],
    hosts: [
      {
        id: 'gw',
        ip: '10.0.0.1',
        name: 'Gateway',
        ports: [{ port: 21, service: 'front-relay', difficulty: 0 }],
        files: [],
        logs: false,
        links: ['vault'],
        proxy: true,
      },
      {
        id: 'vault',
        ip: '10.0.0.9',
        name: 'Vault',
        banner: 'VAULT OS',
        ports: [{ port: 80, service: 'lobby-lock', difficulty: 3 }],
        files: [
          { name: 'ledger.txt', size: 120, content: 'numbers that do not add up' },
          { name: 'safe.dat', size: 400, content: 'the real numbers', encrypted: true },
        ],
        logs: true,
        links: [],
      },
    ],
    goals: [
      { kind: 'download', host: 'vault', file: 'ledger.txt' },
      { kind: 'wipeLogs', host: 'vault' },
    ],
    traceSeconds: 30,
    payloads: [{ name: 'calling-card.txt', size: 10 }],
    logHeat: 7,
  }
}

function fastEnv(): SimEnv {
  const env = defaultEnv()
  env.intrusion = 60
  env.cryptography = 60
  env.crackSpeed = 2
  env.traceMult = 1
  return env
}

describe('timing formulas', () => {
  it('crackSeconds grows with difficulty and shrinks with intrusion, staying bounded', () => {
    const low = defaultEnv()
    const high = fastEnv()
    expect(crackSeconds(0, low)).toBe(0)
    expect(crackSeconds(8, low)).toBeGreaterThan(crackSeconds(3, low))
    expect(crackSeconds(8, high)).toBeLessThan(crackSeconds(8, low))
    expect(crackSeconds(10, low)).toBeLessThanOrEqual(45)
    expect(crackSeconds(10, low)).toBeGreaterThan(0)
  })

  it('decryptSeconds is bounded and easier with cryptography', () => {
    const file = { name: 'x', size: 4000, encrypted: true }
    expect(decryptSeconds(file, fastEnv())).toBeLessThan(decryptSeconds(file, defaultEnv()))
    expect(decryptSeconds(file, defaultEnv())).toBeLessThanOrEqual(30)
  })

  it('traceTotal increases with bounce hops', () => {
    const def = mission()
    const env = defaultEnv()
    expect(traceTotal(def, env, 2)).toBeGreaterThan(traceTotal(def, env, 0))
  })
})

describe('MissionSim happy path', () => {
  it('walks connect → scan → crack → get → wipe → disconnect to a win', () => {
    const sim = new MissionSim(mission(), fastEnv())
    // Only the gateway is known at first.
    expect(sim.knownHosts().map(h => h.ip)).toEqual(['10.0.0.1'])

    sim.exec('connect 10.0.0.1')
    expect(sim.currentHostId).toBe('gw')
    expect(sim.trace.active).toBe(false) // unguarded host

    sim.exec('scan')
    expect(sim.knownHosts().map(h => h.ip).sort()).toEqual(['10.0.0.1', '10.0.0.9'])

    sim.exec('connect 10.0.0.9')
    expect(sim.trace.active).toBe(true) // vault has logs → trace begins

    // No shell yet: file ops are refused.
    const denied = sim.exec('get ledger.txt')
    expect(denied.some(l => l.tone === 'err')).toBe(true)

    sim.exec('crack 80')
    expect(sim.job).not.toBeNull()
    sim.tick(10) // let the crack complete
    expect(sim.job).toBeNull()

    sim.exec('get ledger.txt')
    expect(sim.goals()[0]?.done).toBe(true)
    expect(sim.allGoalsDone()).toBe(false)

    sim.exec('wipe')
    expect(sim.goals()[1]?.done).toBe(true)
    expect(sim.allGoalsDone()).toBe(true)
    expect(sim.hasUnwipedTrail()).toBe(false)

    sim.exec('disconnect')
    expect(sim.finished).toBe('won')
  })

  it('leaves a trail when logs are not wiped', () => {
    const sim = new MissionSim(mission(), fastEnv())
    sim.exec('connect 10.0.0.1')
    sim.exec('scan')
    sim.exec('connect 10.0.0.9')
    sim.exec('crack 80')
    sim.tick(10)
    sim.exec('get ledger.txt')
    expect(sim.hasUnwipedTrail()).toBe(true)
  })
})

describe('MissionSim decrypt', () => {
  it('turns an encrypted file readable and satisfies a read', () => {
    const def = mission()
    def.goals = [{ kind: 'read', host: 'vault', file: 'safe.dat' }]
    const sim = new MissionSim(def, fastEnv())
    sim.exec('connect 10.0.0.1')
    sim.exec('scan')
    sim.exec('connect 10.0.0.9')
    sim.exec('crack 80')
    sim.tick(10)
    // Reading it encrypted must not satisfy the goal.
    const enc = sim.exec('cat safe.dat')
    expect(enc.some(l => l.tone === 'err')).toBe(true)
    expect(sim.goals()[0]?.done).toBe(false)
    sim.exec('decrypt safe.dat')
    sim.tick(3) // finish the decrypt without running the trace out
    expect(sim.finished).toBeNull()
    sim.exec('cat safe.dat')
    expect(sim.goals()[0]?.done).toBe(true)
  })
})

describe('MissionSim trace & failure', () => {
  it('loses when the trace completes', () => {
    const sim = new MissionSim(mission(), fastEnv())
    sim.exec('connect 10.0.0.1')
    sim.exec('scan')
    sim.exec('connect 10.0.0.9')
    expect(sim.trace.active).toBe(true)
    const out = sim.tick(sim.trace.total + 1)
    expect(sim.finished).toBe('lost')
    expect(out.some(l => l.tone === 'err')).toBe(true)
  })

  it('bounce through a proxy slows the trace', () => {
    const sim = new MissionSim(mission(), fastEnv())
    sim.exec('connect 10.0.0.1')
    sim.exec('scan')
    sim.exec('connect 10.0.0.9')
    const before = sim.trace.total
    const res = sim.exec('bounce 10.0.0.1') // gateway is a proxy
    expect(res.some(l => l.tone === 'good')).toBe(true)
    expect(sim.trace.total).toBeGreaterThan(before)
  })

  it('rejects bouncing through a non-proxy host', () => {
    const def = mission()
    const gw = def.hosts[0]
    if (gw) gw.proxy = false
    const sim = new MissionSim(def, fastEnv())
    sim.exec('connect 10.0.0.1')
    sim.exec('scan')
    const res = sim.exec('bounce 10.0.0.1')
    expect(res.some(l => l.tone === 'err')).toBe(true)
    expect(sim.bounces.length).toBe(0)
  })

  it('abort ends the mission as a loss', () => {
    const sim = new MissionSim(mission(), fastEnv())
    sim.exec('connect 10.0.0.1')
    sim.exec('abort')
    expect(sim.finished).toBe('lost')
  })
})

describe('MissionSim tab completion', () => {
  it('completes commands, known ips, ports and files', () => {
    const sim = new MissionSim(mission(), fastEnv())
    expect(sim.complete('con')).toContain('connect')
    sim.exec('connect 10.0.0.1')
    sim.exec('scan')
    expect(sim.complete('connect 10.0.0.')).toEqual(expect.arrayContaining(['10.0.0.1', '10.0.0.9']))
    sim.exec('connect 10.0.0.9')
    expect(sim.complete('crack ')).toContain('80')
    sim.exec('crack 80')
    sim.tick(10)
    expect(sim.complete('cat ')).toEqual(expect.arrayContaining(['ledger.txt', 'safe.dat']))
    expect(sim.complete('put ')).toContain('calling-card.txt')
  })
})

describe('MissionSim busy guard', () => {
  it('refuses new commands while a process runs, and Ctrl-C cancels it', () => {
    const sim = new MissionSim(mission(), fastEnv())
    sim.exec('connect 10.0.0.1')
    sim.exec('scan')
    sim.exec('connect 10.0.0.9')
    sim.exec('crack 80')
    const busy = sim.exec('ls')
    expect(busy.some(l => l.tone === 'warn')).toBe(true)
    sim.cancelJob()
    expect(sim.job).toBeNull()
  })
})
