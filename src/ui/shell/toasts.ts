/**
 * Toast notifications: the engine's `onToast` feed plus shell messages ("Game saved."), stacked
 * bottom-right above the tray. Real-time auto-dismiss (paused while hovered).
 */
import { reactive } from 'vue'
import { C, type GameState, type LogKind, type ThreadState } from '@/engine'
import type { AppId } from '@/ui/apps'

export interface Toast {
  id: number
  text: string
  kind: LogKind
  /** Program (and selection) opened when the toast is clicked. */
  target: ToastLink | null
  /** Identical toasts in a row collapse into one with a counter. */
  count: number
}

export interface KindMeta {
  label: string
  glyph: string
  color: string
}

/** Presentation per log kind (shared by toasts and the event log). */
export const KIND_META: Record<LogKind, KindMeta> = {
  info: { label: 'Notice', glyph: 'i', color: 'var(--info)' },
  good: { label: 'Good news', glyph: '✓', color: 'var(--good)' },
  bad: { label: 'Trouble', glyph: '!', color: 'var(--bad)' },
  story: { label: 'Message', glyph: '✉', color: 'var(--story)' },
  money: { label: 'Money', glyph: '$', color: 'var(--money)' },
  skill: { label: 'Skill up', glyph: '▲', color: 'var(--skill)' },
  heat: { label: 'Heat', glyph: '♨', color: 'var(--heat)' },
  quest: { label: 'Quest', glyph: '★', color: 'var(--warn)' },
}

export const LOG_KINDS = Object.keys(KIND_META) as LogKind[]

const MAX_TOASTS = 5

export const toastStore = reactive({ items: [] as Toast[] })

const timers = new Map<number, ReturnType<typeof setTimeout>>()
const lifetimes = new Map<number, number>()
let nextId = 1

function lifetime(text: string, kind: LogKind): number {
  const base = kind === 'story' || kind === 'heat' || kind === 'quest' ? 7000 : 5000
  return Math.min(11000, base + text.length * 35)
}

function arm(id: number): void {
  const ms = lifetimes.get(id) ?? 5000
  const old = timers.get(id)
  if (old !== undefined) clearTimeout(old)
  timers.set(
    id,
    setTimeout(() => {
      dismissToast(id)
    }, ms),
  )
}

export function pushToast(text: string, kind: LogKind = 'info', target: ToastLink | AppId | null = null): void {
  const last = toastStore.items[toastStore.items.length - 1]
  if (last?.text === text && last.kind === kind) {
    last.count += 1
    arm(last.id)
    return
  }
  const id = nextId++
  const to = typeof target === 'string' ? link(target) : target
  toastStore.items.push({ id, text, kind, target: to, count: 1 })
  lifetimes.set(id, lifetime(text, kind))
  arm(id)
  while (toastStore.items.length > MAX_TOASTS) {
    const first = toastStore.items[0]
    if (!first) break
    dismissToast(first.id)
  }
}

export function dismissToast(id: number): void {
  const t = timers.get(id)
  if (t !== undefined) clearTimeout(t)
  timers.delete(id)
  lifetimes.delete(id)
  toastStore.items = toastStore.items.filter(x => x.id !== id)
}

/** Hovering a toast keeps it on screen. */
export function holdToast(id: number): void {
  const t = timers.get(id)
  if (t !== undefined) clearTimeout(t)
  timers.delete(id)
}

export function releaseToast(id: number): void {
  if (toastStore.items.some(x => x.id === id)) arm(id)
}

export function clearToasts(): void {
  for (const t of timers.values()) clearTimeout(t)
  timers.clear()
  lifetimes.clear()
  toastStore.items = []
}

/** Where a toast click leads: a program, plus props that select the relevant item. */
export interface ToastLink {
  app: AppId
  props: Record<string, unknown>
}

function link(app: AppId, props: Record<string, unknown> = {}): ToastLink {
  return { app, props }
}

function latestUnread(state: GameState, channel: ThreadState['channel']): ThreadState | undefined {
  for (let i = state.threads.length - 1; i >= 0; i--) {
    const t = state.threads[i]
    if (t?.channel === channel && t.status === 'unread') return t
  }
  return undefined
}

function mailLink(state: GameState): ToastLink {
  const t = latestUnread(state, 'mail')
  return link('mail', t ? { threadUid: t.uid } : {})
}

function pagerLink(state: GameState): ToastLink {
  const t = latestUnread(state, 'chat')
  const from = t ? C.scenes.get(t.scene)?.from : undefined
  return link('pager', from && C.npcs.has(from) ? { npc: from } : {})
}

function forumLink(state: GameState): ToastLink {
  const t = latestUnread(state, 'forum')
  return link('forum', t ? { threadUid: t.uid } : {})
}

/** Which program a toast is about, when that is obvious. */
export function toastTarget(state: GameState, text: string, kind: LogKind): ToastLink | null {
  if (text.startsWith('New mail')) return mailLink(state)
  if (text.includes('is messaging you')) return pagerLink(state)
  if (text.startsWith('Forum:')) return forumLink(state)
  if (text.startsWith('📰')) {
    const latest = [...state.news].reverse().find(n => !n.read)
    return link('news', latest ? { id: latest.id } : {})
  }
  if (text.startsWith('Ready to execute') || text.startsWith('✔') || text.startsWith('✘')) return link('ops')
  if (text.startsWith('Quest') || text.startsWith('New quest') || text.startsWith('Out of time')) {
    return link('journal', state.trackedQuest ? { quest: state.trackedQuest } : {})
  }
  switch (kind) {
    case 'quest':
      return link('journal', state.trackedQuest ? { quest: state.trackedQuest } : {})
    case 'story': {
      const latest = [...state.threads].reverse().find(t => t.status === 'unread')
      if (latest?.channel === 'chat') return pagerLink(state)
      if (latest?.channel === 'forum') return forumLink(state)
      return mailLink(state)
    }
    case 'money':
      return link('life')
    case 'skill':
      return link('skills')
    case 'info':
    case 'good':
    case 'bad':
    case 'heat':
      return null
  }
}
