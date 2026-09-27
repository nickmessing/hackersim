/**
 * The live hack op — the one contract the Terminal is running right now.
 *
 * - `opLive.uid` is session-only, reactive UI state: other widgets (the tray clock, desktop
 *   hotkeys, the Ops cards) read it to refuse speed changes / abandon / script while an op is live.
 * - `sys.opLive` / `sys.opLogs` in `state.vars` are the persisted marker: set at launch, cleared when
 *   the op settles. A save that still carries the marker with no live sim means the game was
 *   reloaded mid-op — that op is resolved as a jack-out, so reloading is never a free retry.
 */
import { reactive } from 'vue'
import { completeOp, type GameState, type OpReport } from '@/engine'

export const OP_LIVE_VAR = 'sys.opLive'
export const OP_LOGS_VAR = 'sys.opLogs'
export const OP_GOALS_VAR = 'sys.opGoals'

export const opLive = reactive({ uid: null as number | null })

export const OP_LOCK_MESSAGE = 'Finish or jack out of the op first — the clock is frozen while you are connected.'

/** True when the persisted marker says this state has an op underway for `uid`. */
export function opMarked(state: GameState, uid: number): boolean {
  return state.vars[OP_LIVE_VAR] === uid
}

export function isOpLive(uid?: number): boolean {
  return opLive.uid !== null && (uid === undefined || opLive.uid === uid)
}

/** The Terminal has an op open for this contract (session only: locks the clock, abandon, script). */
export function claimOp(uid: number): void {
  opLive.uid = uid
}

/** The Terminal released the op without it having started (nothing was touched yet). */
export function releaseOp(uid: number): void {
  if (opLive.uid === uid) opLive.uid = null
}

/** The op has really begun (a host touched or the trace running): persist the save-scum marker. */
export function markOpStarted(state: GameState, uid: number): void {
  opLive.uid = uid
  state.vars[OP_LIVE_VAR] = uid
  state.vars[OP_LOGS_VAR] = 0
  state.vars[OP_GOALS_VAR] = 0
}

/** Keep the persisted marker's picture of the op current (trail left, goals met). */
export function noteOpProgress(state: GameState, logsLeft: number, goalsDone: number): void {
  if (opLive.uid === null) return
  state.vars[OP_LOGS_VAR] = logsLeft
  state.vars[OP_GOALS_VAR] = goalsDone
}

/** Clear both the session flag and the persisted marker. */
export function clearOpMarker(state: GameState): void {
  opLive.uid = null
  dropSavedMarker(state)
}

function dropSavedMarker(state: GameState): void {
  Reflect.deleteProperty(state.vars, OP_LIVE_VAR)
  Reflect.deleteProperty(state.vars, OP_LOGS_VAR)
  Reflect.deleteProperty(state.vars, OP_GOALS_VAR)
}

/**
 * If the save says an op was running but no sim is live in this session (the game was reloaded
 * mid-op), settle it as a jack-out with whatever it had done. Returns the report, if one was made.
 */
export function resolveStaleOp(state: GameState): { uid: number; title: string; report: OpReport } | null {
  const uid = state.vars[OP_LIVE_VAR]
  if (uid === undefined || opLive.uid === uid) return null
  const c = state.contracts.active.find(x => x.uid === uid && x.kind === 'hack')
  const logsLeft = state.vars[OP_LOGS_VAR] ?? 1
  const goalsDone = state.vars[OP_GOALS_VAR] ?? 0
  dropSavedMarker(state)
  if (!c) return null
  const report = completeOp(state, uid, {
    goalsDone,
    goalsTotal: 0,
    traced: false,
    aborted: true,
    logsLeft: Math.max(1, logsLeft),
  })
  report.notes.push('The connection dropped mid-op. Walking away counts as jacking out.')
  return { uid, title: c.title, report }
}
