<script setup lang="ts">
import { computed, onBeforeUnmount, onErrorCaptured, ref } from 'vue'
import { clamp } from '@/engine'
import { APPS, type AppId } from '@/ui/apps'
import { closeApp, focusApp, minimizeApp, persistLayout, toggleMaximize, windowOf, wm } from '@/ui/wm'
import { desk, MIN_H, MIN_W } from './desk'
import { shellUi } from './nav'
import TitleBar, { type CaptionButton } from './TitleBar.vue'

const props = defineProps<{ app: AppId; active: boolean }>()

type Edge = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw'
const EDGES: Edge[] = ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw']

const win = computed(() => windowOf(props.app))
const meta = computed(() => APPS[props.app])
const buttons = computed<CaptionButton[]>(() => ['min', win.value?.maximized ? 'restore' : 'max', 'close'])

const style = computed(() => {
  const w = win.value
  if (!w) return {}
  if (w.maximized) return { zIndex: w.z }
  return { left: `${w.x}px`, top: `${w.y}px`, width: `${w.w}px`, height: `${w.h}px`, zIndex: w.z }
})

// ── Focus ──────────────────────────────────────────────────────────────────
function onFocus(): void {
  shellUi.noActive = false
  shellUi.startOpen = false
  const w = win.value
  if (w && w.z !== wm.zTop) focusApp(props.app)
}

// ── Drag & resize ──────────────────────────────────────────────────────────
let cleanup: (() => void) | null = null

function begin(e: PointerEvent, mode: 'move' | Edge): void {
  const w = win.value
  if (!w || e.button !== 0 || w.maximized) return
  e.preventDefault()
  onFocus()
  const start = { px: e.clientX, py: e.clientY, x: w.x, y: w.y, w: w.w, h: w.h }
  const onMove = (ev: PointerEvent): void => {
    const dx = ev.clientX - start.px
    const dy = ev.clientY - start.py
    if (mode === 'move') {
      w.x = Math.round(clamp(start.x + dx, 0, Math.max(0, desk.w - w.w)))
      w.y = Math.round(clamp(start.y + dy, 0, Math.max(0, desk.h - w.h)))
      return
    }
    const minW = Math.min(MIN_W, desk.w)
    const minH = Math.min(MIN_H, desk.h)
    if (mode.includes('e')) {
      const right = clamp(start.x + start.w + dx, start.x + minW, desk.w)
      w.w = Math.round(right - start.x)
    }
    if (mode.includes('w')) {
      const left = clamp(start.x + dx, 0, start.x + start.w - minW)
      w.x = Math.round(left)
      w.w = Math.round(start.x + start.w - left)
    }
    if (mode.includes('s')) {
      const bottom = clamp(start.y + start.h + dy, start.y + minH, desk.h)
      w.h = Math.round(bottom - start.y)
    }
    if (mode.includes('n')) {
      const top = clamp(start.y + dy, 0, start.y + start.h - minH)
      w.y = Math.round(top)
      w.h = Math.round(start.y + start.h - top)
    }
  }
  const onUp = (): void => {
    stop()
    persistLayout()
  }
  const stop = (): void => {
    window.removeEventListener('pointermove', onMove)
    window.removeEventListener('pointerup', onUp)
    window.removeEventListener('pointercancel', onUp)
    document.body.classList.remove('hs-dragging')
    document.body.style.cursor = ''
    cleanup = null
  }
  cleanup?.()
  cleanup = stop
  window.addEventListener('pointermove', onMove)
  window.addEventListener('pointerup', onUp)
  window.addEventListener('pointercancel', onUp)
  document.body.classList.add('hs-dragging')
  document.body.style.cursor = mode === 'move' ? 'default' : `${mode}-resize`
}

onBeforeUnmount(() => {
  cleanup?.()
})

function onMaximize(): void {
  toggleMaximize(props.app)
  persistLayout()
}

function onMinimize(): void {
  minimizeApp(props.app)
  shellUi.noActive = false
}

function onClose(): void {
  closeApp(props.app)
}

// ── Crash guard: a failing program shows an error box instead of breaking the desktop ──
const crashed = ref<string | null>(null)
const showDetails = ref(false)
const runKey = ref(0)

onErrorCaptured(err => {
  crashed.value = err instanceof Error ? `${err.name}: ${err.message}` : 'Unknown error'
  console.error(`[${props.app}]`, err)
  return false
})

function restart(): void {
  crashed.value = null
  showDetails.value = false
  runKey.value++
}
</script>

<template>
  <Transition name="hs-win" appear>
    <div
      v-if="win"
      v-show="!win.minimized"
      class="window hs-window"
      :class="{ active, maximized: win.maximized }"
      :style="style"
      role="dialog"
      :aria-label="meta.title"
      @pointerdown.capture="onFocus"
    >
      <TitleBar
        :title="meta.title"
        :glyph="meta.glyph"
        :active="active"
        :buttons="buttons"
        @pointerdown="begin($event, 'move')"
        @dblclick="onMaximize"
        @min="onMinimize"
        @max="onMaximize"
        @close="onClose"
      />
      <div class="wbody">
        <div v-if="crashed" class="crash">
          <div class="crash-head">
            <span class="crash-icon" aria-hidden="true">✕</span>
            <div>
              <h3>{{ meta.title }} has encountered a problem and needs to close.</h3>
              <p class="muted">We are sorry for the inconvenience. If you were in the middle of something, it has been kept in your save — only this window gave up.</p>
            </div>
          </div>
          <div class="row">
            <button type="button" class="btn primary" @click="restart">Restart program</button>
            <button type="button" class="btn" @click="onClose">Close</button>
            <span class="grow"></span>
            <button type="button" class="btn small" @click="showDetails = !showDetails">{{ showDetails ? 'Hide details' : 'Details »' }}</button>
          </div>
          <pre v-if="showDetails" class="crash-details">{{ crashed }}</pre>
        </div>
        <Suspense v-else :key="runKey">
          <component :is="meta.component" v-bind="win.props" />
          <template #fallback>
            <div class="loading">
              <span class="hourglass" aria-hidden="true">⌛</span>
              <span>Loading {{ meta.title }}…</span>
              <span class="marquee" aria-hidden="true"><i></i><i></i><i></i></span>
            </div>
          </template>
        </Suspense>
      </div>
      <template v-if="!win.maximized">
        <span v-for="edge in EDGES" :key="edge" class="grip" :class="`grip-${edge}`" @pointerdown.stop="begin($event, edge)"></span>
      </template>
    </div>
  </Transition>
</template>

<style scoped>
.window {
  position: absolute;
  display: flex;
  flex-direction: column;
  min-width: 0;
  background: var(--win-bg);
  border: var(--frame-bw) solid var(--frame-inactive);
  border-top-width: var(--frame-bw-top);
  border-radius: var(--frame-radius);
  padding: var(--frame-pad);
  box-shadow: var(--frame-bevel), 1px 2px 6px rgb(0 0 0 / 25%);
}
.window.active {
  border-color: var(--frame-active);
  box-shadow: var(--frame-bevel), var(--win-shadow);
}
.window.maximized {
  inset: 0;
  border-radius: 0;
}
.window.maximized :deep(.titlebar) {
  border-radius: 0;
}
.wbody {
  position: relative;
  flex: 1;
  min-height: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
.wbody > :deep(*) {
  flex: 1;
  min-height: 0;
}

/* Resize grips */
.grip {
  position: absolute;
  z-index: 2;
}
.grip-n,
.grip-s {
  left: 8px;
  right: 8px;
  height: 7px;
  cursor: ns-resize;
}
.grip-n {
  top: -4px;
}
.grip-s {
  bottom: -4px;
}
.grip-e,
.grip-w {
  top: 8px;
  bottom: 8px;
  width: 7px;
  cursor: ew-resize;
}
.grip-e {
  right: -4px;
}
.grip-w {
  left: -4px;
}
.grip-ne,
.grip-nw,
.grip-se,
.grip-sw {
  width: 14px;
  height: 14px;
}
.grip-ne {
  top: -4px;
  right: -4px;
  cursor: nesw-resize;
}
.grip-sw {
  bottom: -4px;
  left: -4px;
  cursor: nesw-resize;
}
.grip-nw {
  top: -4px;
  left: -4px;
  cursor: nwse-resize;
}
.grip-se {
  bottom: -4px;
  right: -4px;
  cursor: nwse-resize;
}
.grip-se::after {
  /* the dotted size grip in the corner */
  content: '';
  position: absolute;
  right: 5px;
  bottom: 5px;
  width: 10px;
  height: 10px;
  background:
    radial-gradient(circle, var(--muted) 1px, transparent 1.3px) 0 0 / 4px 4px;
  mask-image: linear-gradient(135deg, transparent 50%, #000 50%);
  opacity: 0.7;
  pointer-events: none;
}

/* Loading & crash views */
.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  color: var(--muted);
}
.hourglass {
  font-family: var(--font-emoji);
  font-size: 26px;
  animation: hs-spin 1.6s steps(8) infinite;
}
.marquee {
  position: relative;
  width: 150px;
  height: 14px;
  border: 1px solid var(--bar-border);
  border-radius: 3px;
  background: var(--bar-bg);
  overflow: hidden;
}
.marquee i {
  position: absolute;
  top: 2px;
  width: 8px;
  height: 8px;
  border-radius: 1px;
  background: linear-gradient(#8ee68e, var(--bar-fill));
  animation: hs-slide 1.6s linear infinite;
}
.marquee i:nth-child(2) {
  animation-delay: 0.12s;
}
.marquee i:nth-child(3) {
  animation-delay: 0.24s;
}
.crash {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  overflow: auto;
}
.crash-head {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}
.crash-icon {
  flex: none;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: radial-gradient(circle at 35% 30%, #ff8a7a, var(--bad) 60%, #7a130d);
  color: #fff;
  font-weight: bold;
  font-size: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 1px 1px 2px rgb(0 0 0 / 40%);
}
.crash h3 {
  margin-bottom: 6px;
}
.crash-details {
  margin: 0;
  padding: 8px;
  background: var(--panel-bg);
  border: 1px solid var(--panel-border);
  font-family: var(--font-mono);
  font-size: 11px;
  white-space: pre-wrap;
  word-break: break-word;
}

/* Open / minimize / restore */
.hs-win-enter-active {
  transition:
    opacity 0.14s ease-out,
    transform 0.14s ease-out;
}
.hs-win-leave-active {
  transition:
    opacity 0.16s ease-in,
    transform 0.16s ease-in;
}
.hs-win-enter-from {
  opacity: 0;
  transform: scale(0.96) translateY(8px);
}
.hs-win-leave-to {
  opacity: 0;
  transform: scale(0.85) translateY(60px);
}

@keyframes hs-slide {
  from {
    left: -30px;
  }
  to {
    left: 160px;
  }
}
@keyframes hs-spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
@media (prefers-reduced-motion: reduce) {
  .hs-win-enter-active,
  .hs-win-leave-active {
    transition: none;
  }
}
</style>
