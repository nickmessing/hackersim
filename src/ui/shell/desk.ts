/** Geometry of the desktop work area (the space windows live in, above the taskbar). */
import { reactive } from 'vue'
import { clamp } from '@/engine'
import type { WinState } from '@/ui/wm'

export const MIN_W = 300
export const MIN_H = 180

export const desk = reactive({
  w: typeof window === 'undefined' ? 1024 : window.innerWidth,
  h: typeof window === 'undefined' ? 700 : window.innerHeight - 30,
})

/** Shrink and move a window so it sits fully inside the work area. */
export function clampWindow(win: WinState): void {
  const maxW = Math.max(160, desk.w)
  const maxH = Math.max(120, desk.h)
  win.w = Math.round(clamp(win.w, Math.min(MIN_W, maxW), maxW))
  win.h = Math.round(clamp(win.h, Math.min(MIN_H, maxH), maxH))
  win.x = Math.round(clamp(win.x, 0, Math.max(0, desk.w - win.w)))
  win.y = Math.round(clamp(win.y, 0, Math.max(0, desk.h - win.h)))
}
