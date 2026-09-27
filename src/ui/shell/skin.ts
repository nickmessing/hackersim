/** Desktop skin (Luna / Classic): a per-browser preference kept in localStorage, applied on <html>. */
import { reactive } from 'vue'

export type Skin = 'luna' | 'classic'

const KEY = 'hackersim.skin'

function readSkin(): Skin {
  try {
    return localStorage.getItem(KEY) === 'classic' ? 'classic' : 'luna'
  } catch {
    return 'luna'
  }
}

export const skinState = reactive({ skin: readSkin() })

export function applySkin(skin: Skin): void {
  skinState.skin = skin
  document.documentElement.dataset.skin = skin
  try {
    localStorage.setItem(KEY, skin)
  } catch {
    // storage unavailable: the skin still applies for this session
  }
}

/** Call once at startup. */
export function initSkin(): void {
  document.documentElement.dataset.skin = skinState.skin
}
