import { hydrate } from './state'
import type { GameState } from './types'

const PREFIX = 'hackersim.save.'
export const SLOTS = ['auto', '1', '2', '3'] as const
export type SaveSlot = (typeof SLOTS)[number]

export interface SaveMeta {
  slot: SaveSlot
  name: string
  handle: string
  day: number
  savedAt: number
  act: number
}

function storage(): Storage | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage
  } catch {
    return null
  }
}

export function serialize(state: GameState): string {
  return JSON.stringify(state)
}

export function deserialize(json: string): GameState {
  return hydrate(JSON.parse(json) as Partial<GameState>)
}

export function saveGame(state: GameState, slot: SaveSlot = 'auto'): boolean {
  const ls = storage()
  if (!ls) return false
  state.savedAt = Date.now()
  try {
    ls.setItem(PREFIX + slot, serialize(state))
    return true
  } catch {
    return false
  }
}

export function loadGame(slot: SaveSlot = 'auto'): GameState | null {
  const ls = storage()
  if (!ls) return null
  try {
    const raw = ls.getItem(PREFIX + slot)
    return raw ? deserialize(raw) : null
  } catch {
    return null
  }
}

export function deleteSave(slot: SaveSlot): void {
  try {
    storage()?.removeItem(PREFIX + slot)
  } catch {
    // ignore
  }
}

export function listSaves(): SaveMeta[] {
  const out: SaveMeta[] = []
  const ls = storage()
  if (!ls) return out
  for (const slot of SLOTS) {
    try {
      const raw = ls.getItem(PREFIX + slot)
      if (!raw) continue
      const s = JSON.parse(raw) as Partial<GameState>
      out.push({
        slot,
        name: s.player?.name ?? '?',
        handle: s.player?.handle ?? '?',
        day: s.time?.day ?? 0,
        savedAt: s.savedAt ?? 0,
        act: s.vars?.act ?? 1,
      })
    } catch {
      // skip corrupt slot
    }
  }
  return out
}

/** Portable save string (base64 JSON) for export/import. */
export function exportSave(state: GameState): string {
  const bytes = new TextEncoder().encode(serialize(state))
  let bin = ''
  for (const b of bytes) bin += String.fromCharCode(b)
  return btoa(bin)
}

export function importSave(code: string): GameState {
  const bin = atob(code.trim())
  const bytes = Uint8Array.from(bin, c => c.charCodeAt(0))
  return deserialize(new TextDecoder().decode(bytes))
}
