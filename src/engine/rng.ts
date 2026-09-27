import type { GameState } from './types'

/** Seeded PRNG (mulberry32). State lives in `state.rng` so saves are deterministic. */
export function rand(state: GameState): number {
  let t = (state.rng = (state.rng + 0x6d2b79f5) | 0)
  t = Math.imul(t ^ (t >>> 15), t | 1)
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}

export function randInt(state: GameState, min: number, max: number): number {
  return min + Math.floor(rand(state) * (max - min + 1))
}

export function d20(state: GameState): number {
  return randInt(state, 1, 20)
}

export function pick<T>(state: GameState, list: readonly T[]): T {
  if (list.length === 0) throw new Error('pick from empty list')
  return list[Math.floor(rand(state) * list.length)] as T
}

export function weighted<T>(state: GameState, list: readonly T[], weight: (t: T) => number): T | undefined {
  let total = 0
  for (const t of list) total += Math.max(0, weight(t))
  if (total <= 0) return undefined
  let r = rand(state) * total
  for (const t of list) {
    r -= Math.max(0, weight(t))
    if (r <= 0) return t
  }
  return list[list.length - 1]
}
