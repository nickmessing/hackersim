/** Weekly turns: exact-date content must still fire within the turn that contains the date. */
import { describe, expect, it } from 'vitest'
import { balance, createState, evalCond, simulateHours, startQuest, unlockAll } from '../src/engine'
import { setSlot } from '../src/engine/sim/schedule'

describe('day conditions under weekly turns', () => {
  it('an exact day matches the turn that contains it', () => {
    const s = createState({ name: 'T', handle: 't', background: '', traits: [], seed: 3 })
    s.time.day = 500 - (500 % balance.DAYS_PER_STEP) // turn start before day 500
    expect(evalCond(s, { day: true, eq: s.time.day + 1 })).toBe(true)
    expect(evalCond(s, { day: true, eq: s.time.day + balance.DAYS_PER_STEP })).toBe(false)
    expect(evalCond(s, { day: true, gte: s.time.day + 3, lte: s.time.day + 4 })).toBe(true)
  })

  it('the Slideshow counts a week spent socializing with family', () => {
    const s = createState({ name: 'T', handle: 't', background: '', traits: [], seed: 3 })
    s.settings.autoPauseDialogs = false
    unlockAll(s)
    s.time.day = 504 // a turn start (multiple of 7)
    s.time.hour = 0
    s.flags['act0.done'] = true
    startQuest(s, 'side_slideshow')
    const q = s.quests.side_slideshow
    expect(q).toBeDefined()
    if (!q) return
    q.stage = 'sundays'
    q.stageDay = s.time.day
    for (let h = 18; h < 21; h++) setSlot(s, h, 'social')
    s.focus.social = 'mom'
    simulateHours(s, 24, false)
    expect(s.vars['side.slideshow_count'] ?? 0).toBeGreaterThanOrEqual(1)
  })
})
