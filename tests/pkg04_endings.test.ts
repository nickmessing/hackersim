/**
 * PKG-04 — the ending assembler's guarantees (bible §10).
 *
 * Enumerates representative flag combinations and asserts:
 *   - exactly one ending fires for every combination (the matrix is total; E9 is the unconditional
 *     last row);
 *   - no CP-D1 option A–F (publish / bury / sell / handoff / made / bonfire) resolves to E9;
 *   - the primary key (`a4.leverage`) selects the expected ending family;
 *   - the special/floor endings (E-SECRET, E7, E9) fire on their signature states.
 */
import { describe, expect, it } from 'vitest'
import { C, applyEffects, createState, evalCond, type GameState } from '../src/engine'
import type { FactionId, FlagValue, NpcFate, RomanceState, SkillId } from '../src/engine/types'
import { ENDING_MATRIX, assembleEnding } from '../src/content/pkg04_act4/endings'

interface Scenario {
  flags?: Record<string, FlagValue>
  vars?: Record<string, number>
  factions?: Partial<Record<FactionId, number>>
  skills?: Partial<Record<SkillId, number>>
  stats?: Partial<Record<'health' | 'money' | 'mood' | 'stress' | 'heat' | 'cred' | 'energy', number>>
  npcs?: Record<string, { met?: boolean; affinity?: number; fate?: NpcFate; romance?: RomanceState }>
}

function stateOf(s: Scenario): GameState {
  const state: GameState = createState({ name: 'T', handle: 't', background: '', traits: [], seed: 1 })
  for (const [k, v] of Object.entries(s.flags ?? {})) state.flags[k] = v
  for (const [k, v] of Object.entries(s.vars ?? {})) state.vars[k] = v
  for (const [k, v] of Object.entries(s.factions ?? {})) if (v !== undefined) state.factions[k] = v
  for (const [k, v] of Object.entries(s.skills ?? {})) state.skills[k as SkillId] = { level: v, xp: 0 }
  for (const [k, v] of Object.entries(s.stats ?? {})) state.stats[k as keyof GameState['stats']] = v
  for (const [id, n] of Object.entries(s.npcs ?? {})) {
    state.npcs[id] = { met: n.met ?? true, affinity: n.affinity ?? 0, fate: n.fate ?? 'normal', romance: n.romance ?? 'none' }
  }
  return state
}

/** Fresh state + scenario overrides, run the assembler, return the chosen ending id. */
function endingOf(s: Scenario): { id: string | null; seen: number } {
  const state = stateOf(s)
  applyEffects(state, assembleEnding())
  return { id: state.ending, seen: state.endingsSeen.length }
}

/** Cartesian product helper. */
function product<T extends Record<string, readonly unknown[]>>(axes: T): { [K in keyof T]: T[K][number] }[] {
  let out: Record<string, unknown>[] = [{}]
  for (const [k, vals] of Object.entries(axes)) out = out.flatMap(o => vals.map(v => ({ ...o, [k]: v })))
  return out as { [K in keyof T]: T[K][number] }[]
}

const LANES_AF = ['publish', 'bury', 'sell', 'handoff', 'made', 'bonfire'] as const
const SPINES = ['aperture', 'bureau', 'halcyon', 'loft', 'double', 'none'] as const

describe('pkg04 ending assembler', () => {
  it('every ending id in the matrix is a registered EndingDef', () => {
    for (const id of ['end_long_con', 'end_scorched', 'end_reckoning', 'end_ghost_king', 'end_handoff', 'end_vesting', 'end_witness', 'end_keeper', 'end_civilian', 'end_burnout', 'end_fog']) {
      expect(C.endings.has(id), `missing ending ${id}`).toBe(true)
    }
  })

  it('always fires exactly one ending, even for an empty state', () => {
    const r = endingOf({})
    expect(r.id).toBe('end_fog')
    expect(r.seen).toBe(1)
  })

  it('no CP-D1 option A–F resolves to the fog (E9), across spines and evidence', () => {
    for (const leverage of LANES_AF) {
      for (const sp of SPINES) {
        for (const evidence of [true, false]) {
          const r = endingOf({
            flags: { 'a4.leverage': leverage, 'a2.spine': sp, ...(evidence ? { 'end.has_evidence': true } : {}) },
          })
          expect(r.seen, `${leverage}/${sp}/${evidence}`).toBe(1)
          expect(r.id, `${leverage}/${sp}/${evidence} fell through to the fog`).not.toBe('end_fog')
        }
      }
    }
  })

  it('the leverage key selects the expected ending family', () => {
    expect(endingOf({ flags: { 'a4.leverage': 'publish', 'end.has_evidence': true } }).id).toBe('end_reckoning')
    expect(endingOf({ flags: { 'a4.leverage': 'sell' } }).id).toBe('end_ghost_king')
    expect(endingOf({ flags: { 'a4.leverage': 'made' } }).id).toBe('end_ghost_king')
    expect(endingOf({ flags: { 'a4.leverage': 'handoff', 'a4.handoff_to': 'priya' } }).id).toBe('end_handoff')
    expect(endingOf({ flags: { 'a4.leverage': 'bonfire' } }).id).toBe('end_scorched')
    // Bury with a life to point to → the Civilian; without → still the Civilian (never the fog).
    expect(endingOf({ flags: { 'a4.leverage': 'bury' }, factions: { 'fac.hood': 60 }, npcs: { mom: { fate: 'healthy' } } }).id).toBe('end_civilian')
    expect(endingOf({ flags: { 'a4.leverage': 'bury' } }).id).toBe('end_civilian')
  })

  it('E10 Vesting: halcyon spine + bury/none + founder or partner', () => {
    expect(endingOf({ flags: { 'a2.spine': 'halcyon', 'a4.leverage': 'bury', 'end.clean_startup': true } }).id).toBe('end_vesting')
    expect(endingOf({ flags: { 'a2.spine': 'halcyon', 'a4.leverage': 'none', 'fac.halcyon.made_partner': true } }).id).toBe('end_vesting')
  })

  it('E6 Cooperating Witness: bureau spine + informant', () => {
    expect(endingOf({ flags: { 'a2.spine': 'bureau', 'fac.bureau.informant': true, 'a4.leverage': 'bury' } }).id).toBe('end_witness')
  })

  it('E5 Keeper of the Commons: sysop + intact + reformed', () => {
    const r = endingOf({
      flags: { 'fac.loft.sysop': 'player', 'fac.loft.intact': true, 'w.scene_state': 'reformed', 'a4.leverage': 'bury' },
      npcs: { corvid: { met: true } },
    })
    expect(r.id).toBe('end_keeper')
  })

  it('E-SECRET The Long Con: double agent + evidence + two doubles + high opsec', () => {
    const r = endingOf({
      flags: { 'a2.double_agent': true, 'end.has_evidence': true, 'a4.leverage': 'publish' },
      vars: { 'end.doubles': 2 },
      skills: { opsec: 72 },
    })
    expect(r.id).toBe('end_long_con')
  })

  it('E8 Scorched Earth: double-agent variant with three hostile factions', () => {
    const r = endingOf({
      flags: { 'a2.double_agent': true, 'a4.leverage': 'bury' },
      vars: { 'end.doubles': 2, factions_at_hostile: 3 },
    })
    expect(r.id).toBe('end_scorched')
  })

  it('E7 Burnout: broken body + neglected circle + no evidence, over any bury/none', () => {
    const neglected = { jax: { affinity: 5 }, mira: { affinity: 0 }, priya: { affinity: 0 }, corvid: { affinity: 0 }, grace: { affinity: 0 } }
    expect(endingOf({ stats: { health: 20 }, npcs: neglected }).id).toBe('end_burnout')
    // Burnout beats the Civilian even when the player chose "bury".
    expect(endingOf({ flags: { 'a4.leverage': 'bury' }, stats: { health: 20 }, npcs: neglected }).id).toBe('end_burnout')
  })

  it('E9 fog: uncommitted, no choice, nothing to point to', () => {
    expect(endingOf({ flags: { 'a4.leverage': 'none' } }).id).toBe('end_fog')
    expect(endingOf({ flags: { 'a4.leverage': 'none', 'end.uncommitted': true } }).id).toBe('end_fog')
  })

  it('enumerated flag combinations: exactly one ending, matching the first matrix row, never fog for A–F', () => {
    const combos = product({
      leverage: [...LANES_AF, 'none', undefined] as const,
      spine: ['aperture', 'bureau', 'halcyon', 'loft', 'double'] as const,
      evidence: [false, true] as const,
      doubleAgent: [false, true] as const,
      doubles: [0, 2] as const,
      hostile: [0, 3] as const,
      opsec: [40, 72] as const,
      body: ['fine', 'broken'] as const,
      extra: ['none', 'keeper', 'founder', 'partner', 'informant', 'married', 'family'] as const,
      finaleFail: [false, true] as const,
    })
    const counts: Record<string, number> = {}
    for (const c of combos) {
      const flags: Record<string, FlagValue> = { 'a2.spine': c.spine }
      if (c.leverage) flags['a4.leverage'] = c.leverage
      if (c.evidence) flags['end.has_evidence'] = true
      if (c.doubleAgent) flags['a2.double_agent'] = true
      if (c.finaleFail) flags['end.finale_fail'] = true
      // A broken body also means a neglected circle (E7 needs both).
      const npcs: Scenario['npcs'] =
        c.body === 'broken' ? { jax: { affinity: 5 }, mira: { affinity: 0 }, priya: { affinity: 0 }, corvid: { affinity: 0 }, grace: { affinity: 0 } } : {}
      const factions: Scenario['factions'] = {}
      if (c.extra === 'keeper') Object.assign(flags, { 'fac.loft.sysop': 'player', 'fac.loft.intact': true, 'w.scene_state': 'reformed' })
      if (c.extra === 'keeper') npcs.corvid = { met: true, affinity: 60 }
      if (c.extra === 'founder') flags['end.clean_startup'] = true
      if (c.extra === 'partner') flags['fac.halcyon.made_partner'] = true
      if (c.extra === 'informant') flags['fac.bureau.informant'] = true
      if (c.extra === 'married') npcs.grace = { met: true, affinity: 70, romance: 'married' }
      if (c.extra === 'family') {
        npcs.mom = { met: true, fate: 'healthy' }
        factions['fac.hood'] = 60
      }
      const scenario: Scenario = {
        flags,
        npcs,
        factions,
        vars: { 'end.doubles': c.doubles, factions_at_hostile: c.hostile },
        skills: { opsec: c.opsec },
        stats: { health: c.body === 'broken' ? 20 : 80 },
      }
      const state = stateOf(scenario)
      applyEffects(state, assembleEnding())
      const label = JSON.stringify(c)
      expect(state.endingsSeen.length, label).toBe(1)
      expect(state.ending, label).not.toBeNull()
      // The assembler's pick is the first matrix row that holds in the post-assembly state (fates and
      // end.burnout are settled by then), or the fog.
      const first = ENDING_MATRIX.find(row => evalCond(state, row.cond))?.id ?? 'end_fog'
      expect(state.ending, label).toBe(first)
      if (c.leverage && c.leverage !== 'none') expect(state.ending, `${label} fell through to the fog`).not.toBe('end_fog')
      const id = state.ending ?? 'null'
      counts[id] = (counts[id] ?? 0) + 1
    }
    // Every ending is reachable from the enumeration.
    for (const id of C.endings.keys()) {
      if (id.startsWith('end_')) expect(counts[id] ?? 0, `ending ${id} never selected`).toBeGreaterThan(0)
    }
  })

  it('publish without evidence is still the Reckoning (its hoax cut)', () => {
    expect(endingOf({ flags: { 'a4.leverage': 'publish' } }).id).toBe('end_reckoning')
  })

  it('darker cut is a slide, not a separate ending (finale_fail keeps the same family)', () => {
    expect(endingOf({ flags: { 'a4.leverage': 'publish', 'end.has_evidence': true, 'end.finale_fail': true } }).id).toBe('end_reckoning')
    expect(endingOf({ flags: { 'a4.leverage': 'sell', 'end.finale_fail': true } }).id).toBe('end_ghost_king')
  })
})
