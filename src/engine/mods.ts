import { C } from './registry'
import type { GameState, ModKey, Modifier } from './types'

export interface ModSource {
  label: string
  mods: Modifier[]
}

/** Every active modifier source (items, housing, lifestyle, job, traits, buffs). */
export function modSources(state: GameState): ModSource[] {
  const out: ModSource[] = []
  const equipped = new Set(Object.values(state.equipped))
  for (const id of state.items) {
    const def = C.items.get(id)
    if (!def) continue
    const isHw = def.category === 'cpu' || def.category === 'ram' || def.category === 'storage' || def.category === 'network' || def.category === 'monitor'
    if (isHw && !equipped.has(id)) continue
    if (def.mods.length) out.push({ label: def.name, mods: def.mods })
  }
  const house = C.housing.get(state.housing)
  if (house?.mods.length) out.push({ label: house.name, mods: house.mods })
  if (state.job) {
    const job = C.jobs.get(state.job)
    if (job?.mods?.length) out.push({ label: job.title, mods: job.mods })
  }
  for (const t of state.player.traits) {
    const def = C.traits.get(t)
    if (def?.mods.length) out.push({ label: def.name, mods: def.mods })
  }
  for (const b of state.buffs) out.push({ label: b.name, mods: b.mods })
  return out
}

/** Aggregate a modifier: returns { add, mult }. */
export function modOf(state: GameState, key: ModKey): { add: number; mult: number } {
  let add = 0
  let mult = 1
  for (const src of modSources(state)) {
    for (const m of src.mods) {
      if (m.key !== key) continue
      if (m.add !== undefined) add += m.add
      if (m.mult !== undefined) mult *= m.mult
    }
  }
  return { add, mult }
}

export function modMult(state: GameState, key: ModKey): number {
  return modOf(state, key).mult
}

export function modAdd(state: GameState, key: ModKey): number {
  return modOf(state, key).add
}

/** World variable used as a multiplier (default 1). */
export function worldMult(state: GameState, v: string): number {
  return state.vars[v] ?? 1
}
