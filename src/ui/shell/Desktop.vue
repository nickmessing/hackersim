<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { activeDialog, C, maxSpeed, pause, resume, setSpeed } from '@/engine'
import { useGame } from '@/ui/game'
import DialogModal from '@/ui/story/DialogModal.vue'
import { closeApp, focusedApp, restoreLayout, wm } from '@/ui/wm'
import { clampWindow, desk } from './desk'
import { housingTier, WALLPAPERS } from './describe'
import DesktopIcons from './DesktopIcons.vue'
import EndingScreen from './EndingScreen.vue'
import { msgboxOpen } from './msgbox'
import { shellUi } from './nav'
import QuestTracker from './QuestTracker.vue'
import StatusBanner from './StatusBanner.vue'
import Taskbar from './Taskbar.vue'
import { pushToast } from './toasts'
import ToastStack from './ToastStack.vue'
import { useUnread } from './unread'
import WindowFrame from './WindowFrame.vue'

const state = useGame()
const unread = useUnread(state)

const activeApp = computed(() => (shellUi.noActive ? undefined : focusedApp()))
const endingVisible = computed(() => state.ending !== null && !state.flags['sys.postgame'])

// ── Wallpaper ──────────────────────────────────────────────────────────────
const tier = computed(() => housingTier(state))
const wallpaperName = computed(() => WALLPAPERS[tier.value] ?? WALLPAPERS[0])
const homeName = computed(() => C.housing.get(state.housing)?.name ?? 'Port Lumen')
/** The room gets darker as the story does. */
const dim = computed(() => {
  const act = state.vars.act ?? 1
  if (act >= 4) return 0.55
  if (act >= 3) return 0.3
  return 0
})

// ── Work area geometry ─────────────────────────────────────────────────────
const area = ref<HTMLElement | null>(null)
let observer: ResizeObserver | null = null

function measure(): void {
  const el = area.value
  if (!el) return
  desk.w = el.clientWidth
  desk.h = el.clientHeight
}

function clampAll(): void {
  for (const w of wm.windows) clampWindow(w)
}

watch(() => [desk.w, desk.h, wm.windows.length], clampAll)

// ── Keyboard shortcuts ─────────────────────────────────────────────────────
const SPEED_KEYS: Record<string, number> = { '1': 1, '2': 2, '3': 5, '4': 10 }

function isTyping(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  if (target.isContentEditable) return true
  if (target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement) return true
  if (target instanceof HTMLInputElement) return !['checkbox', 'radio', 'button', 'submit', 'range', 'reset'].includes(target.type)
  return false
}

function onKey(e: KeyboardEvent): void {
  if (e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey) return
  if (msgboxOpen() || endingVisible.value) return
  if (activeDialog(state)) return
  if (isTyping(e.target)) return
  if (e.key === ' ') {
    e.preventDefault()
    if (state.time.speed > 0) pause(state)
    else resume(state)
    return
  }
  const speed = SPEED_KEYS[e.key]
  if (speed !== undefined) {
    e.preventDefault()
    if (speed > maxSpeed(state)) pushToast('Story timer running — max 2x', 'info')
    setSpeed(state, speed)
    return
  }
  if (e.key === 'Escape') {
    if (shellUi.startOpen) {
      shellUi.startOpen = false
      return
    }
    const app = activeApp.value
    if (app) {
      e.preventDefault()
      closeApp(app)
    }
  }
}

// ── Desktop background clicks ──────────────────────────────────────────────
function onDesktopDown(): void {
  shellUi.startOpen = false
}

function onAreaDown(e: PointerEvent): void {
  if (e.target !== e.currentTarget) return
  shellUi.selectedIcon = null
  shellUi.noActive = true
}

onMounted(() => {
  if (wm.windows.length === 0) restoreLayout()
  measure()
  clampAll()
  if (area.value && typeof ResizeObserver !== 'undefined') {
    observer = new ResizeObserver(measure)
    observer.observe(area.value)
  }
  window.addEventListener('keydown', onKey)
})

onBeforeUnmount(() => {
  observer?.disconnect()
  window.removeEventListener('keydown', onKey)
  shellUi.startOpen = false
})
</script>

<template>
  <div class="desktop" @pointerdown="onDesktopDown">
    <div class="hs-wp" :class="`hs-wp-${tier}`" aria-hidden="true"></div>
    <div class="hs-wp-dim" :style="{ opacity: dim }" aria-hidden="true"></div>

    <StatusBanner />

    <div ref="area" class="area" @pointerdown="onAreaDown">
      <div class="watermark" aria-hidden="true">
        <div>HackerSim 2001 Home Edition</div>
        <div>{{ homeName }} · Wallpaper: {{ wallpaperName }}</div>
      </div>
      <DesktopIcons :unread="unread" />
      <QuestTracker />
      <div class="win-layer">
        <WindowFrame v-for="w in wm.windows" :key="w.app" :app="w.app" :active="w.app === activeApp" />
      </div>
    </div>

    <ToastStack />
    <Taskbar :unread="unread" :active-app="activeApp" />

    <div class="layer-dialog">
      <DialogModal />
    </div>
    <EndingScreen v-if="endingVisible" />
    <div v-if="state.settings.crt" class="hs-crt" aria-hidden="true"></div>
  </div>
</template>

<style scoped>
.desktop {
  position: fixed;
  inset: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: var(--desktop-bg);
  color: var(--win-fg);
}
.area {
  position: relative;
  flex: 1;
  min-height: 0;
  z-index: 1;
}
.win-layer {
  position: absolute;
  inset: 0;
  z-index: 3;
  pointer-events: none;
}
.win-layer > :deep(*) {
  pointer-events: auto;
}
.watermark {
  position: absolute;
  right: 14px;
  bottom: 10px;
  text-align: right;
  color: #fff;
  opacity: 0.55;
  font-size: 11px;
  line-height: 1.35;
  text-shadow: 1px 1px 1px rgb(0 0 0 / 60%);
  pointer-events: none;
  user-select: none;
}
.layer-dialog {
  position: relative;
  z-index: 1500;
}
</style>
