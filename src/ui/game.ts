/**
 * The game session: the single reactive GameState, the real-time loop, autosave, and
 * new/load/save helpers. Components get the state with `useGame()` and call engine functions
 * directly on it (e.g. `setJob(state, id)`), which Vue then re-renders reactively.
 */
import { reactive, ref } from 'vue'
import type { GameState, NewGameOptions, SaveSlot } from '@/engine'
import {
  AUTOSAVE_SECONDS,
  bootstrap,
  createState,
  importSave,
  loadGame,
  saveGame,
  tick,
} from './engineFacade'

const current = ref<GameState | null>(null)

/** UI-only session info (not saved). */
export const session = reactive({
  lastSaveAt: 0,
  running: false,
})

/** The active game state. Only call inside the desktop (a game is guaranteed to be loaded). */
export function useGame(): GameState {
  const s = current.value
  if (!s) throw new Error('useGame() called with no game loaded')
  return s
}

export function hasGame(): boolean {
  return current.value !== null
}

export function newGame(opts: NewGameOptions): GameState {
  const s = createState(opts)
  current.value = s
  const r = useGame()
  bootstrap(r)
  saveGame(r, 'auto')
  startLoop()
  return r
}

export function loadSlot(slot: SaveSlot = 'auto'): boolean {
  const s = loadGame(slot)
  if (!s) return false
  current.value = s
  startLoop()
  return true
}

export function loadFromCode(code: string): boolean {
  try {
    current.value = importSave(code)
    startLoop()
    return true
  } catch {
    return false
  }
}

export function saveNow(slot: SaveSlot = 'auto'): boolean {
  const s = current.value
  if (!s) return false
  const ok = saveGame(s, slot)
  if (ok) session.lastSaveAt = Date.now()
  return ok
}

export function quitToTitle(): void {
  saveNow('auto')
  stopLoop()
  current.value = null
}

// ── Real-time loop ─────────────────────────────────────────────────────────

let rafId = 0
let last = 0
let sinceSave = 0

function frame(t: number): void {
  const s = current.value
  if (!s) {
    session.running = false
    return
  }
  // Clamp: a hidden tab pauses the game instead of fast-forwarding (story timers only run
  // while visible — bible §5.3).
  const dt = last === 0 ? 0 : Math.min(0.25, (t - last) / 1000)
  last = t
  tick(s, dt)
  sinceSave += dt
  if (sinceSave >= AUTOSAVE_SECONDS) {
    sinceSave = 0
    saveNow('auto')
  }
  rafId = requestAnimationFrame(frame)
}

export function startLoop(): void {
  if (session.running) return
  session.running = true
  last = 0
  rafId = requestAnimationFrame(frame)
}

export function stopLoop(): void {
  cancelAnimationFrame(rafId)
  session.running = false
}

if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') saveNow('auto')
    last = 0
  })
  window.addEventListener('beforeunload', () => saveNow('auto'))
}
