/**
 * Platform glue: runs as a plain web page or inside the Tauri desktop app (fullscreen by
 * default). Fullscreen toggling and quitting use Tauri's window API when available and fall
 * back to the browser Fullscreen API.
 */
import { getCurrentWindow } from '@tauri-apps/api/window'

export function isDesktopApp(): boolean {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window
}

export async function toggleFullscreen(): Promise<void> {
  if (isDesktopApp()) {
    const win = getCurrentWindow()
    await win.setFullscreen(!(await win.isFullscreen()))
    return
  }
  if (document.fullscreenElement) await document.exitFullscreen()
  else await document.documentElement.requestFullscreen()
}

/** Close the desktop app (no-op in a browser tab). */
export async function exitApp(): Promise<void> {
  if (isDesktopApp()) await getCurrentWindow().close()
}

/** Global F11 = toggle fullscreen, everywhere (title screen included). */
export function installPlatformKeys(): void {
  window.addEventListener('keydown', e => {
    if (e.key !== 'F11') return
    e.preventDefault()
    void toggleFullscreen()
  })
}
