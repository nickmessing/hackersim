/**
 * Window manager: open/close/focus/minimize/maximize desktop windows. UI-only (not saved,
 * except the open-window layout which is remembered in localStorage).
 */
import { reactive } from 'vue'
import { APPS, type AppId } from './apps'

export interface WinState {
  app: AppId
  x: number
  y: number
  w: number
  h: number
  z: number
  minimized: boolean
  maximized: boolean
  /** Optional props passed to the app component (e.g. { threadUid: 12 }). */
  props: Record<string, unknown>
}

export const wm = reactive({
  windows: [] as WinState[],
  zTop: 10,
})

let cascade = 0

export function isOpen(app: AppId): boolean {
  return wm.windows.some(w => w.app === app)
}

export function windowOf(app: AppId): WinState | undefined {
  return wm.windows.find(w => w.app === app)
}

/** Open (or focus) an app. Passing props updates the props of an already-open window. */
export function openApp(app: AppId, props: Record<string, unknown> = {}): void {
  const existing = windowOf(app)
  if (existing) {
    existing.minimized = false
    if (Object.keys(props).length) existing.props = { ...existing.props, ...props }
    focusApp(app)
    return
  }
  const meta = APPS[app]
  const vw = typeof window === 'undefined' ? 1280 : window.innerWidth
  const vh = typeof window === 'undefined' ? 800 : window.innerHeight - 40
  const w = Math.min(meta.width, vw - 20)
  const h = Math.min(meta.height, vh - 20)
  const off = (cascade++ % 8) * 26
  wm.windows.push({
    app,
    x: Math.max(0, Math.min(vw - w, 110 + off)),
    y: Math.max(0, Math.min(vh - h, 30 + off)),
    w,
    h,
    z: ++wm.zTop,
    minimized: false,
    maximized: false,
    props,
  })
  persistLayout()
}

export function closeApp(app: AppId): void {
  wm.windows = wm.windows.filter(w => w.app !== app)
  persistLayout()
}

export function focusApp(app: AppId): void {
  const win = windowOf(app)
  if (win) win.z = ++wm.zTop
}

export function minimizeApp(app: AppId): void {
  const win = windowOf(app)
  if (win) win.minimized = true
}

export function toggleMaximize(app: AppId): void {
  const win = windowOf(app)
  if (win) win.maximized = !win.maximized
}

/** Taskbar click: minimize if focused, else restore + focus. */
export function taskbarToggle(app: AppId): void {
  const win = windowOf(app)
  if (!win) return
  const top = Math.max(...wm.windows.filter(w => !w.minimized).map(w => w.z))
  if (!win.minimized && win.z === top) win.minimized = true
  else {
    win.minimized = false
    focusApp(app)
  }
}

export function focusedApp(): AppId | undefined {
  const visible = wm.windows.filter(w => !w.minimized)
  if (visible.length === 0) return undefined
  return visible.reduce((a, b) => (a.z > b.z ? a : b)).app
}

const LAYOUT_KEY = 'hackersim.layout'

export function persistLayout(): void {
  try {
    const data = wm.windows.map(({ app, x, y, w, h, maximized }) => ({ app, x, y, w, h, maximized }))
    localStorage.setItem(LAYOUT_KEY, JSON.stringify(data))
  } catch {
    // ignore
  }
}

export function restoreLayout(): void {
  try {
    const raw = localStorage.getItem(LAYOUT_KEY)
    if (!raw) return
    const data = JSON.parse(raw) as { app: AppId; x: number; y: number; w: number; h: number; maximized: boolean }[]
    wm.windows = data
      .filter(d => d.app in APPS)
      .map(d => ({ ...d, z: ++wm.zTop, minimized: false, props: {} }))
  } catch {
    // ignore
  }
}

export function closeAll(): void {
  wm.windows = []
}
