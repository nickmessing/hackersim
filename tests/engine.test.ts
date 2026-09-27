import { describe, expect, it } from 'vitest'
import { balance, bootstrap, createState, simulateHours } from '../src/engine'

describe('engine smoke', () => {
  it('simulates 60 weekly turns without throwing', () => {
    const state = createState({ name: 'Test', handle: 'tester', background: '', traits: [], seed: 42 })
    bootstrap(state)
    simulateHours(state, 24 * 60, false)
    expect(state.time.day).toBe(60 * balance.DAYS_PER_STEP)
    expect(Number.isFinite(state.stats.money)).toBe(true)
    for (const s of Object.values(state.skills)) expect(Number.isFinite(s.level)).toBe(true)
  })
})
