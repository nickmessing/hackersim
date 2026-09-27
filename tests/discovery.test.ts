/** Act 0 gradual discovery: a new game reveals programs one at a time. */
import { describe, expect, it } from 'vitest'
import {
  activeDialog,
  advance,
  bootstrap,
  choicesFor,
  choose,
  createState,
  hydrate,
  isUnlocked,
  markRead,
  nodeOf,
  serialize,
  simulateHours,
  type GameState,
} from '../src/engine'
import { applyPreset } from '../src/engine/sim/schedule'

function answerAll(s: GameState): void {
  for (let guard = 0; guard < 40; guard++) {
    const t = activeDialog(s) ?? s.threads.find(x => x.status === 'unread' || x.status === 'open')
    if (!t) return
    markRead(s, t.uid)
    const node = nodeOf(t)
    if (!node || t.status === 'done') continue
    const open = choicesFor(s, t).filter(c => !c.locked)
    const first = open[0]
    if (first) choose(s, t.uid, first.index)
    else if (node.next) advance(s, t.uid)
    else t.status = 'done'
  }
}

describe('Act 0 — gradual discovery', () => {
  it('starts paused on an empty desktop with only the NorthLink mail', () => {
    const s = createState({ name: 'T', handle: 't', background: '', traits: [], seed: 5 })
    bootstrap(s)
    expect(s.time.speed).toBe(0)
    expect(s.unlocked).toEqual(['mail'])
    expect(isUnlocked(s, 'system')).toBe(true)
    expect(isUnlocked(s, 'schedule')).toBe(false)
    expect(s.quests.act0_hello_world?.status).toBe('active')
  })

  it('reveals the planner, then the story, as the player goes', () => {
    const s = createState({ name: 'T', handle: 't', background: '', traits: [], seed: 5 })
    s.settings.autoPauseDialogs = false
    bootstrap(s)
    answerAll(s) // the NorthLink mail
    simulateHours(s, 1, false) // Mom's talk arrives
    answerAll(s)
    expect(isUnlocked(s, 'schedule')).toBe(true)
    expect(isUnlocked(s, 'jobs')).toBe(false)
    applyPreset(s, 'balanced')
    for (let h = 0; h < 24 * 2 && !s.flags['act0.done']; h++) {
      simulateHours(s, 1, false)
      answerAll(s)
    }
    expect(s.flags['act0.done']).toBe(true)
    // Act I begins: the main story reveals the Journal; Jax's page reveals BuddyPager.
    for (let h = 0; h < 6; h++) {
      simulateHours(s, 1, false)
      answerAll(s)
    }
    expect(s.quests.main_a1_q1_boot_sequence).toBeDefined()
    expect(isUnlocked(s, 'journal')).toBe(true)
    expect(isUnlocked(s, 'pager')).toBe(true)
    expect(isUnlocked(s, 'terminal')).toBe(false)
  })

  it('old saves keep everything on the desktop', () => {
    const s = createState({ name: 'T', handle: 't', background: '', traits: [], seed: 5 })
    const raw = JSON.parse(serialize(s)) as Record<string, unknown>
    delete raw.unlocked
    const loaded = hydrate(raw)
    expect(isUnlocked(loaded, 'terminal')).toBe(true)
    expect(isUnlocked(loaded, 'ops')).toBe(true)
  })
})
