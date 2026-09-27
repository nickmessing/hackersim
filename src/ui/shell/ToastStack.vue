<script setup lang="ts">
import { onBeforeUnmount, onMounted } from 'vue'
import { isUnlocked, onToast } from '@/engine'
import { useGame } from '@/ui/game'
import { openApp } from '@/ui/wm'
import { shellUi } from './nav'
import { playChime } from './sound'
import { dismissToast, holdToast, KIND_META, pushToast, releaseToast, toastStore, toastTarget, type Toast } from './toasts'

const state = useGame()

let unsubscribe: (() => void) | null = null

onMounted(() => {
  unsubscribe = onToast((text, kind) => {
    pushToast(text, kind, toastTarget(state, text, kind))
    if (state.settings.sound) playChime(kind)
  })
})

onBeforeUnmount(() => {
  unsubscribe?.()
})

function activate(t: Toast): void {
  dismissToast(t.id)
  // Clicking a toast never reveals a program the player hasn't discovered yet.
  if (t.target && isUnlocked(state, t.target.app)) {
    shellUi.noActive = false
    openApp(t.target.app, t.target.props)
  }
}
</script>

<template>
  <div class="toasts" aria-live="polite">
    <TransitionGroup name="toast">
      <div
        v-for="t in toastStore.items"
        :key="t.id"
        class="toast"
        :class="[`k-${t.kind}`, { clickable: t.target }]"
        :style="{ '--k': KIND_META[t.kind].color }"
        role="status"
        :title="t.target ? 'Click to open' : ''"
        @click="activate(t)"
        @mouseenter="holdToast(t.id)"
        @mouseleave="releaseToast(t.id)"
      >
        <span class="t-ico" aria-hidden="true">{{ KIND_META[t.kind].glyph }}</span>
        <div class="t-body">
          <div class="t-head">
            <b>{{ KIND_META[t.kind].label }}</b>
            <span v-if="t.count > 1" class="t-count">×{{ t.count }}</span>
          </div>
          <div class="t-text">{{ t.text }}</div>
        </div>
        <button type="button" class="t-close" aria-label="Dismiss" title="Dismiss" @click.stop="dismissToast(t.id)">×</button>
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.toasts {
  position: absolute;
  right: 10px;
  bottom: calc(var(--tb-h) + 10px);
  z-index: 1100;
  width: 310px;
  max-width: calc(100vw - 20px);
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  gap: 6px;
  pointer-events: none;
}
.toast {
  position: relative;
  display: flex;
  gap: 8px;
  align-items: flex-start;
  padding: 7px 8px 8px 10px;
  background: var(--balloon-bg);
  border: 1px solid var(--balloon-border);
  border-left: 5px solid var(--k);
  border-radius: 6px;
  box-shadow: 2px 3px 8px rgb(0 0 0 / 35%);
  color: #000;
  pointer-events: auto;
  cursor: default;
}
:root[data-skin='classic'] .toast {
  border-radius: 0;
  background: var(--win-bg);
  box-shadow:
    var(--bevel-raised),
    2px 2px 0 rgb(0 0 0 / 35%);
}
.toast.clickable {
  cursor: pointer;
}
.toast.clickable:hover {
  filter: brightness(1.03);
  box-shadow: 2px 3px 10px rgb(0 0 0 / 45%);
}
.t-ico {
  flex: none;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: var(--k);
  color: #fff;
  font: bold 13px/22px var(--font-ui);
  text-align: center;
  box-shadow: inset 0 -2px 3px rgb(0 0 0 / 25%);
}
.t-body {
  flex: 1;
  min-width: 0;
}
.t-head {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--k);
  font-size: 11px;
  margin-bottom: 1px;
}
.t-count {
  padding: 0 5px;
  border-radius: 7px;
  background: var(--k);
  color: #fff;
  font-size: 10px;
  font-weight: bold;
}
.t-text {
  line-height: 1.35;
  word-break: break-word;
}
.t-close {
  flex: none;
  width: 16px;
  height: 16px;
  padding: 0;
  border: 1px solid transparent;
  border-radius: 2px;
  background: none;
  color: var(--muted);
  font: bold 13px/12px var(--font-ui);
  cursor: pointer;
}
.t-close:hover {
  border-color: var(--panel-border);
  background: #fff;
  color: var(--bad);
}
.k-story {
  animation: toast-nudge 0.5s ease-out 0.35s;
}
.toast-enter-active {
  transition:
    opacity 0.22s ease-out,
    transform 0.22s ease-out;
}
.toast-leave-active {
  transition:
    opacity 0.3s ease-in,
    transform 0.3s ease-in;
}
.toast-enter-from {
  opacity: 0;
  transform: translateX(40px);
}
.toast-leave-to {
  opacity: 0;
  transform: translateX(20px) scale(0.96);
}
.toast-move {
  transition: transform 0.22s ease;
}
@keyframes toast-nudge {
  0%,
  100% {
    transform: none;
  }
  25% {
    transform: translateX(-4px);
  }
  50% {
    transform: translateX(3px);
  }
  75% {
    transform: translateX(-2px);
  }
}
</style>
