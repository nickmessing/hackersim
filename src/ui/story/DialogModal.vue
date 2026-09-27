<script setup lang="ts">
/**
 * The CRPG conversation window. Watches `activeDialog(state)` and shows each queued dialog
 * scene in a modal retro window over a dimmed desktop. The shown thread stays up until the
 * player closes it (even after the engine marks it done), then the next queued dialog opens.
 * If the engine auto-paused the game for the dialog, time resumes when the queue is empty.
 * "Peek" (Esc / the _ button / opening the Terminal) hides the window without losing the thread.
 */
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { activeDialog, findThread, finishThread, formatClock, formatDate, resume, sceneOf } from '@/engine'
import { useGame } from '@/ui/game'
import ThreadView from './ThreadView.vue'

const state = useGame()

const shownUid = ref<number | null>(null)
const peeking = ref(false)
const winEl = ref<HTMLElement | null>(null)
/** The engine paused time because a dialog arrived (resume when we're done). */
let pausedByDialog = false

const pendingUid = computed(() => activeDialog(state)?.uid ?? null)
const thread = computed(() => (shownUid.value === null ? undefined : findThread(state, shownUid.value)))
const scene = computed(() => (thread.value ? sceneOf(thread.value) : undefined))
const title = computed(() => scene.value?.title ?? 'Conversation')
const waiting = computed(
  () => state.threads.filter(t => t.channel === 'dialog' && (t.status === 'unread' || t.status === 'open') && t.uid !== shownUid.value).length,
)
const clock = computed(() => `${formatDate(state.time.day)} · ${formatClock(state.time.hour, state.time.frac)}`)
const speedText = computed(() => (state.time.speed === 0 ? '⏸ Time paused' : `▶ Time running ×${state.time.speed}`))

function show(uid: number): void {
  shownUid.value = uid
  peeking.value = false
  void nextTick(() => winEl.value?.focus({ preventScroll: true }))
}

function gameOver(): boolean {
  return state.ending !== null && !state.flags['sys.postgame']
}

/** Close the current dialog; open the next queued one or give time back to the player. */
function finish(): void {
  shownUid.value = null
  peeking.value = false
  const next = activeDialog(state)
  if (next) {
    show(next.uid)
    return
  }
  if (pausedByDialog) {
    pausedByDialog = false
    if (state.time.speed === 0 && !gameOver()) resume(state)
  }
}

function peek(): void {
  peeking.value = true
}

function unpeek(): void {
  peeking.value = false
  void nextTick(() => winEl.value?.focus({ preventScroll: true }))
}

watch(
  pendingUid,
  uid => {
    if (shownUid.value === null && uid !== null) show(uid)
  },
  { immediate: true },
)

// The shown thread vanished (save loaded, history trimmed) or its scene is missing from content.
watch([thread, scene], ([t, sc]) => {
  if (shownUid.value === null) return
  if (!t) finish()
  else if (!sc) {
    finishThread(state, t.uid)
    finish()
  }
})

// A terminal mission resolved while we were peeking: come back to show the outcome.
watch(
  () => thread.value?.history.length ?? 0,
  (len, prev) => {
    if (peeking.value && len > prev) unpeek()
  },
)

// Detect the engine's auto-pause: speed drops to 0 in the same mutation that delivered a new
// (unread, not yet shown) dialog. Any manual speed change hands control back to the player.
watch(
  () => state.time.speed,
  (now, prev) => {
    if (now > 0) {
      pausedByDialog = false
      return
    }
    if (prev > 0 && state.threads.some(t => t.channel === 'dialog' && t.status === 'unread' && t.uid !== shownUid.value)) {
      pausedByDialog = true
    }
  },
  { flush: 'sync' },
)

/** Keep Tab focus inside the modal window. */
function trapTab(e: KeyboardEvent): void {
  const win = winEl.value
  if (!win) return
  const items = [...win.querySelectorAll<HTMLElement>('button:not(:disabled), [href], [tabindex]:not([tabindex="-1"])')]
  const first = items[0]
  const last = items[items.length - 1]
  if (!first || !last) {
    e.preventDefault()
    win.focus()
    return
  }
  const active = document.activeElement
  const inside = active instanceof Node && win.contains(active)
  if (e.shiftKey && (active === first || !inside)) {
    e.preventDefault()
    last.focus()
  } else if (!e.shiftKey && (active === last || !inside)) {
    e.preventDefault()
    first.focus()
  }
}

/** Esc peeks (never closes — a conversation has to be finished). Return via the floating tab. */
function onKey(e: KeyboardEvent): void {
  if (!thread.value || peeking.value) return
  if (e.key === 'Tab') {
    trapTab(e)
    return
  }
  if (e.key !== 'Escape') return
  e.preventDefault()
  peek()
}

onMounted(() => {
  // A dialog delivered before the desktop mounted (new game, loaded save) paused the game.
  if (activeDialog(state) && state.time.speed === 0 && state.settings.autoPauseDialogs) pausedByDialog = true
  window.addEventListener('keydown', onKey)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKey)
})
</script>

<template>
  <Teleport to="body">
    <Transition name="dlg">
      <div v-if="thread" v-show="!peeking" class="dlg-overlay">
        <div ref="winEl" class="dlg-window" role="dialog" aria-modal="true" :aria-label="title" tabindex="-1">
          <div class="dlg-title">
            <span class="dlg-icon" aria-hidden="true">💬</span>
            <span class="dlg-caption">{{ title }}</span>
            <span v-if="waiting > 0" class="dlg-queue" :title="`${waiting} more conversation${waiting === 1 ? '' : 's'} queued after this one`">
              +{{ waiting }} waiting
            </span>
            <button type="button" class="dlg-tbtn" title="Peek at the desktop (Esc). The conversation will wait for you." aria-label="Peek at the desktop" @click="peek">
              <span aria-hidden="true">_</span>
            </button>
          </div>
          <div class="dlg-body">
            <ThreadView :key="thread.uid" :uid="thread.uid" variant="dialog" typewriter :hotkeys="!peeking" @done="finish" @terminal="peek" />
          </div>
          <div class="dlg-status">
            <span class="cell">{{ clock }}</span>
            <span class="cell">{{ speedText }}</span>
            <span class="cell grow keys">1–9 choose · Enter continue · Esc peek</span>
          </div>
        </div>
      </div>
    </Transition>
    <Transition name="tab">
      <button v-if="thread && peeking" type="button" class="dlg-peek-tab" title="Return to the conversation" @click="unpeek">
        <span class="blink" aria-hidden="true">💬</span> {{ title }} — <b>return to conversation</b>
      </button>
    </Transition>
  </Teleport>
</template>

<style scoped>
.dlg-overlay {
  position: fixed;
  inset: 0;
  z-index: 5000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px;
  background:
    radial-gradient(ellipse at center, rgb(0 0 0 / 25%), rgb(0 0 0 / 62%)),
    repeating-linear-gradient(0deg, rgb(0 0 0 / 8%) 0 1px, transparent 1px 3px);
}
.dlg-window {
  width: min(760px, 100%);
  height: min(580px, 100%);
  display: flex;
  flex-direction: column;
  background: var(--win-bg);
  border: 1px solid var(--win-border);
  border-radius: calc(var(--radius) * 2.5) calc(var(--radius) * 2.5) var(--radius) var(--radius);
  box-shadow:
    var(--win-shadow),
    0 12px 48px rgb(0 0 0 / 55%);
  padding: 0 3px 3px;
  outline: none;
  font-family: var(--font-ui);
  font-size: var(--font-size);
}
.dlg-title {
  flex: none;
  display: flex;
  align-items: center;
  gap: 6px;
  height: 28px;
  margin: 0 -3px;
  padding: 0 6px 0 8px;
  color: var(--win-title-fg);
  font-weight: bold;
  font-size: 13px;
  text-shadow: 1px 1px 0 rgb(0 0 0 / 45%);
  border-radius: calc(var(--radius) * 2.5) calc(var(--radius) * 2.5) 0 0;
  background: linear-gradient(180deg, var(--win-title-b), var(--win-title-a) 40%, var(--win-title-a) 88%, var(--win-title-b));
  user-select: none;
}
.dlg-icon {
  font-size: 14px;
}
.dlg-caption {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.dlg-queue {
  font-size: 10px;
  font-weight: normal;
  padding: 1px 6px;
  border-radius: 8px;
  background: rgb(255 255 255 / 20%);
}
.dlg-tbtn {
  font: inherit;
  width: 21px;
  height: 21px;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding: 0 0 5px;
  line-height: 1;
  border: 1px solid rgb(255 255 255 / 70%);
  border-radius: var(--radius);
  background: linear-gradient(color-mix(in srgb, var(--win-title-b) 60%, #fff), var(--win-title-b));
  color: var(--win-title-fg);
  cursor: pointer;
}
.dlg-tbtn:hover {
  filter: brightness(1.15);
}
.dlg-tbtn:focus-visible {
  outline: 1px dotted var(--win-title-fg);
  outline-offset: 1px;
}
.dlg-body {
  flex: 1;
  min-height: 0;
  border: 1px solid var(--panel-border);
  border-top: none;
  overflow: hidden;
}
.dlg-status {
  flex: none;
  display: flex;
  gap: 2px;
  margin-top: 3px;
  font-size: 11px;
  color: var(--muted);
}
.dlg-status .cell {
  padding: 1px 6px;
  border: 1px solid var(--panel-border);
  border-color: var(--panel-border) var(--panel-alt) var(--panel-alt) var(--panel-border);
  white-space: nowrap;
}
.dlg-status .keys {
  text-align: right;
  overflow: hidden;
  text-overflow: ellipsis;
}
.dlg-peek-tab {
  position: fixed;
  z-index: 5000;
  left: 50%;
  bottom: 52px;
  transform: translateX(-50%);
  font: inherit;
  font-family: var(--font-ui);
  font-size: var(--font-size);
  padding: 6px 14px;
  border: 1px solid var(--win-border);
  border-radius: 14px;
  background: linear-gradient(var(--panel-bg), var(--btn-bg));
  color: var(--win-fg);
  box-shadow: var(--win-shadow);
  cursor: pointer;
}
.dlg-peek-tab:hover {
  box-shadow:
    var(--win-shadow),
    inset 0 0 0 1px #f8b636;
}
.blink {
  animation: blink 1.2s steps(2) infinite;
}
@keyframes blink {
  50% {
    opacity: 0.25;
  }
}

.dlg-enter-active,
.dlg-leave-active {
  transition: opacity 0.18s ease;
}
.dlg-enter-active .dlg-window,
.dlg-leave-active .dlg-window {
  transition: transform 0.18s ease;
}
.dlg-enter-from,
.dlg-leave-to {
  opacity: 0;
}
.dlg-enter-from .dlg-window,
.dlg-leave-to .dlg-window {
  transform: scale(0.96) translateY(10px);
}
.tab-enter-active,
.tab-leave-active {
  transition:
    opacity 0.15s ease,
    transform 0.15s ease;
}
.tab-enter-from,
.tab-leave-to {
  opacity: 0;
  transform: translate(-50%, 10px);
}
@media (prefers-reduced-motion: reduce) {
  .dlg-enter-active,
  .dlg-leave-active,
  .dlg-enter-active .dlg-window,
  .dlg-leave-active .dlg-window,
  .tab-enter-active,
  .tab-leave-active {
    transition: none;
  }
  .blink {
    animation: none;
  }
}
</style>
