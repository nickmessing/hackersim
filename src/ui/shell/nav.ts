/**
 * Shell navigation & UI-only desktop state (never saved): which pre-game screen is showing,
 * whether the boot intro already played this page session, the Start menu, icon selection.
 */
import { reactive } from 'vue'
import type { AppId } from '@/ui/apps'

export type Screen = 'title' | 'wizard'

export const nav = reactive<{ screen: Screen; booted: boolean }>({
  screen: 'title',
  /** The BIOS/boot intro plays once per page load. */
  booted: false,
})

export const shellUi = reactive({
  startOpen: false,
  /** Clicking the bare desktop deactivates every window (like the real thing). */
  noActive: false,
  selectedIcon: null as AppId | null,
})

const keys = new WeakMap<object, number>()
let nextKey = 1

/** Stable numeric identity for a state object (used to remount the desktop on load). */
export function stateKey(obj: object): number {
  let k = keys.get(obj)
  if (k === undefined) {
    k = nextKey++
    keys.set(obj, k)
  }
  return k
}
