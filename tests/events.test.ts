import { beforeAll, describe, expect, it } from 'vitest'
import { C, applyEffects, balance, createState, directorTick, evalCond, simulateHours, type GameState } from '../src/engine'
import { expenseBreakdown } from '../src/engine/sim/life'

function fresh(): GameState {
  const s = createState({ name: 'T', handle: 't', background: '', traits: [], seed: 11 })
  s.settings.autoPauseDialogs = false
  return s
}

beforeAll(() => {
  C.scenes.set('t_ev_scene', { id: 't_ev_scene', channel: 'mail', title: 'x', start: 'a', nodes: { a: { text: 'hi' } } })
  C.traits.set('t_scar', { id: 't_scar', name: 'Burned Fingers', desc: 'x', mods: [{ key: 'efficiency', mult: 0.9 }], scar: true, bad: true })
  C.events.set('t_ev_once', { id: 't_ev_once', category: 'weird', weight: 1000, scene: 't_ev_scene', effects: [{ flag: 't.ev_once' }] })
  C.events.set('t_comp_hack', {
    id: 't_comp_hack',
    category: 'underground',
    complication: { sources: ['hack'], minTier: 1, maxTier: 5 },
    effects: [{ trait: 't_scar' }, { obligation: { id: 't_fine', label: 'Court fine', perDay: 5, days: 14 } }],
  })
})

describe('event director', () => {
  it('fires events and records them, and a once-event never repeats', () => {
    const s = fresh()
    for (let i = 0; i < 20; i++) directorTick(s)
    expect(s.flags['t.ev_once']).toBe(true)
    expect(s.events.fired.t_ev_once?.count).toBe(1)
    expect(evalCond(s, { eventFired: 't_ev_once' })).toBe(true)
  })

  it('quiet turns raise the odds', () => {
    const s = fresh()
    s.events.quietTurns = 3
    expect(balance.EVENT_BASE_CHANCE + 3 * balance.EVENT_QUIET_BONUS).toBeGreaterThan(balance.EVENT_BASE_CHANCE)
  })
})

describe('complications', () => {
  it('spawn from effects, apply scars and obligations, and obligations expire', () => {
    const s = fresh()
    // Real content also registers hack complications; make this one the only candidate.
    for (const [id, e] of C.events) if (e.complication && id !== 't_comp_hack') C.events.delete(id)
    applyEffects(s, [{ complication: 'hack', tier: 2 }])
    expect(s.player.traits).toContain('t_scar')
    expect(evalCond(s, { obligation: 't_fine' })).toBe(true)
    expect(expenseBreakdown(s).some(l => l.label === 'Court fine')).toBe(true)
    simulateHours(s, 24 * 3, false)
    expect(evalCond(s, { obligation: 't_fine' })).toBe(false)
  })

  it('returns nothing when no complication matches', () => {
    const s = fresh()
    const before = JSON.stringify(s.player.traits)
    applyEffects(s, [{ complication: 'legal', tier: 1 }])
    expect(JSON.stringify(s.player.traits)).toBe(before)
  })
})
