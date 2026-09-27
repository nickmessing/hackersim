<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { answerBox, msgbox, type MsgIcon } from './msgbox'
import RetroWindow from './RetroWindow.vue'

const current = computed(() => msgbox.queue[0])
const okBtn = ref<HTMLButtonElement | null>(null)

const ICONS: Record<MsgIcon, { glyph: string; cls: string }> = {
  info: { glyph: 'i', cls: 'ico-info' },
  warn: { glyph: '!', cls: 'ico-warn' },
  error: { glyph: '✕', cls: 'ico-error' },
  question: { glyph: '?', cls: 'ico-question' },
}

watch(current, async c => {
  if (!c) return
  await nextTick()
  okBtn.value?.focus()
})

function onKey(e: KeyboardEvent): void {
  const c = current.value
  if (!c) return
  if (e.key === 'Escape') {
    e.preventDefault()
    e.stopPropagation()
    answerBox(c.cancel === null)
  } else if (e.key === 'Enter') {
    e.preventDefault()
    e.stopPropagation()
    answerBox(true)
  }
}

onMounted(() => {
  window.addEventListener('keydown', onKey, true)
})
onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKey, true)
})
</script>

<template>
  <Transition name="mb">
    <div v-if="current" class="mb-overlay" @pointerdown.self.prevent>
      <RetroWindow :title="current.title" width="400px" closable @close="answerBox(current.cancel === null)">
        <div class="mb-body">
          <span class="mb-icon" :class="ICONS[current.icon].cls" aria-hidden="true">{{ ICONS[current.icon].glyph }}</span>
          <p class="mb-text">{{ current.text }}</p>
        </div>
        <template #footer>
          <button ref="okBtn" type="button" class="btn primary" :class="{ danger: current.danger }" @click="answerBox(true)">{{ current.ok }}</button>
          <button v-if="current.cancel !== null" type="button" class="btn" @click="answerBox(false)">{{ current.cancel }}</button>
        </template>
      </RetroWindow>
    </div>
  </Transition>
</template>

<style scoped>
.mb-overlay {
  position: fixed;
  inset: 0;
  z-index: 3000;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgb(0 0 0 / 18%);
}
.mb-body {
  display: flex;
  gap: 14px;
  align-items: flex-start;
  padding: 16px 16px 4px;
}
.mb-text {
  margin: 4px 0 0;
  white-space: pre-line;
  line-height: 1.5;
}
.mb-icon {
  flex: none;
  width: 34px;
  height: 34px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font: bold 20px var(--font-serif);
  box-shadow: 1px 2px 3px rgb(0 0 0 / 35%);
}
.ico-info {
  background: radial-gradient(circle at 35% 30%, #9cc6ff, #1f5fd0 65%, #0c3688);
  font-style: italic;
}
.ico-question {
  background: radial-gradient(circle at 35% 30%, #9cc6ff, #1f5fd0 65%, #0c3688);
}
.ico-error {
  background: radial-gradient(circle at 35% 30%, #ff9a8c, var(--bad) 60%, #7a130d);
  font-family: var(--font-ui);
}
.ico-warn {
  border-radius: 4px;
  clip-path: polygon(50% 0, 100% 100%, 0 100%);
  background: linear-gradient(#ffe066, #f0b400);
  color: #000;
  padding-top: 10px;
  box-shadow: none;
}
.mb-enter-active,
.mb-leave-active {
  transition: opacity 0.12s ease;
}
.mb-enter-from,
.mb-leave-to {
  opacity: 0;
}
</style>
