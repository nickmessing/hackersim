import { ageOn, formatDate } from './calendar'
import { evalCond } from './conditions'
import { money } from './format'
import { LOG_MAX } from './balance'
import { C } from './registry'
import type { GameState, LogKind, Text } from './types'

export function interpolate(state: GameState, s: string): string {
  return s.replace(/\{(\w+)(?::([\w.]+))?\}/g, (whole, key: string, arg: string | undefined) => {
    switch (key) {
      case 'name':
        return state.player.name
      case 'handle':
        return state.player.handle
      case 'money':
        return money(state.stats.money)
      case 'date':
        return formatDate(state.time.day)
      case 'age':
        return String(Math.floor(ageOn(state.time.day)))
      case 'npc':
        return arg ? (C.npcs.get(arg)?.name ?? arg) : whole
      case 'nick':
        return arg ? (C.npcs.get(arg)?.handle ?? C.npcs.get(arg)?.name ?? arg) : whole
      case 'flag':
        return arg ? String(state.flags[arg] ?? '') : whole
      case 'var':
        return arg ? String(state.vars[arg] ?? 0) : whole
      default:
        return whole
    }
  })
}

/** Render rich text into paragraphs (conditional parts resolved, tokens interpolated). */
export function renderText(state: GameState, text: Text | undefined): string[] {
  if (text === undefined) return []
  if (typeof text === 'string') return text.split(/\n\n+/).map(p => interpolate(state, p))
  const out: string[] = []
  for (const part of text) {
    if (typeof part === 'string') out.push(interpolate(state, part))
    else if (evalCond(state, part.if)) out.push(interpolate(state, part.text))
    else if (part.else !== undefined) out.push(interpolate(state, part.else))
  }
  return out
}

export function renderLine(state: GameState, text: Text | undefined): string {
  return renderText(state, text).join(' ')
}

/** Listeners for toasts (UI subscribes). Not saved. */
type ToastListener = (text: string, kind: LogKind) => void
const toastListeners: ToastListener[] = []
export function onToast(fn: ToastListener): () => void {
  toastListeners.push(fn)
  return () => {
    const i = toastListeners.indexOf(fn)
    if (i >= 0) toastListeners.splice(i, 1)
  }
}

export function log(state: GameState, text: string, kind: LogKind = 'info', toast = false): void {
  state.log.push({ day: state.time.day, hour: state.time.hour, text, kind })
  if (state.log.length > LOG_MAX) state.log.splice(0, state.log.length - LOG_MAX)
  if (toast) for (const fn of toastListeners) fn(text, kind)
}

export function notify(state: GameState, text: string, kind: LogKind = 'info'): void {
  log(state, text, kind, true)
}
