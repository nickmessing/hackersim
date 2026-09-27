<script setup lang="ts">
import { nextTick, ref, watch } from 'vue'
import type { RenderLine } from './sim'

const props = defineProps<{
  lines: RenderLine[]
  prompt: string
  input: string
  /** When true the input is disabled (mission finished / no shell). */
  locked: boolean
}>()

const emit = defineEmits<{
  'update:input': [value: string]
  submit: []
  complete: []
  history: [dir: number]
  interrupt: []
  flush: []
}>()

const scrollEl = ref<HTMLDivElement | null>(null)
const inputEl = ref<HTMLInputElement | null>(null)
const focused = ref(false)

function onInput(e: Event): void {
  emit('update:input', (e.target as HTMLInputElement).value)
}

function onKey(e: KeyboardEvent): void {
  if ((e.ctrlKey || e.metaKey) && (e.key === 'c' || e.key === 'C')) {
    e.preventDefault()
    emit('interrupt')
    return
  }
  switch (e.key) {
    case 'Enter':
      e.preventDefault()
      emit('submit')
      break
    case 'Tab':
      e.preventDefault()
      emit('complete')
      break
    case 'ArrowUp':
      e.preventDefault()
      emit('history', -1)
      break
    case 'ArrowDown':
      e.preventDefault()
      emit('history', 1)
      break
    default:
      // Any keystroke flushes the typewriter so the screen never lags behind you.
      emit('flush')
  }
}

function focusInput(): void {
  inputEl.value?.focus()
}

defineExpose({ focusInput })

// Keep the newest output in view.
watch(
  () => props.lines.map(l => l.shown).reduce((a, b) => a + b, props.lines.length),
  () => {
    void nextTick(() => {
      const el = scrollEl.value
      if (el) el.scrollTop = el.scrollHeight
    })
  },
)
</script>

<template>
  <div class="screen" @click="focusInput">
    <div ref="scrollEl" class="scrollback">
      <div v-for="(ln, i) in lines" :key="i" class="ln" :class="`tone-${ln.tone}`">{{ ln.text.slice(0, ln.shown) || ' ' }}</div>
      <div class="ln in-line">
        <span class="prompt">{{ prompt }}</span>
        <span class="typed">{{ input }}</span>
        <span v-if="!locked" class="caret" :class="{ blink: focused }">&nbsp;</span>
      </div>
    </div>
    <input
      ref="inputEl"
      class="capture"
      type="text"
      autocomplete="off"
      autocorrect="off"
      autocapitalize="off"
      spellcheck="false"
      :value="input"
      :disabled="locked"
      aria-label="Terminal input"
      @input="onInput"
      @keydown="onKey"
      @focus="focused = true"
      @blur="focused = false"
    />
  </div>
</template>

<style scoped>
.screen {
  flex: 1;
  min-height: 0;
  position: relative;
  background: var(--terminal-bg);
  border: 1px solid #0b3d1a;
  box-shadow: inset 0 0 60px rgb(0 0 0 / 70%), inset 0 0 8px rgb(51 255 102 / 15%);
  border-radius: 3px;
  overflow: hidden;
  cursor: text;
}
.scrollback {
  position: absolute;
  inset: 0;
  overflow: auto;
  padding: 8px 10px;
  font-family: var(--font-mono);
  font-size: 13px;
  line-height: 1.35;
  color: var(--terminal-fg);
  text-shadow: 0 0 3px rgb(51 255 102 / 45%);
  scrollbar-width: thin;
  scrollbar-color: #1d8a3a #050805;
}
.scrollback::-webkit-scrollbar {
  width: 10px;
}
.scrollback::-webkit-scrollbar-thumb {
  background: #16632a;
  border: 2px solid #050805;
}
.ln {
  white-space: pre-wrap;
  word-break: break-word;
  min-height: 1.35em;
}
.tone-in {
  color: #8bffa9;
  opacity: 0.85;
}
.tone-out {
  color: var(--terminal-fg);
}
.tone-dim {
  color: var(--terminal-dim);
}
.tone-warn {
  color: var(--terminal-warn);
  text-shadow: 0 0 3px rgb(255 204 51 / 40%);
}
.tone-err {
  color: var(--terminal-err);
  text-shadow: 0 0 3px rgb(255 85 68 / 45%);
}
.tone-good {
  color: #6effa0;
  font-weight: bold;
}
.tone-sys {
  color: #43d0ff;
  text-shadow: 0 0 3px rgb(67 208 255 / 40%);
}
.in-line {
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
}
.prompt {
  color: #6effa0;
  white-space: pre;
}
.typed {
  color: var(--terminal-fg);
  white-space: pre-wrap;
}
.caret {
  display: inline-block;
  width: 0.62em;
  height: 1.05em;
  margin-left: 1px;
  background: var(--terminal-fg);
  box-shadow: 0 0 5px rgb(51 255 102 / 70%);
  transform: translateY(0.16em);
}
.caret.blink {
  animation: term-blink 1.05s step-end infinite;
}
@keyframes term-blink {
  0%,
  55% {
    opacity: 1;
  }
  56%,
  100% {
    opacity: 0;
  }
}
.capture {
  position: absolute;
  left: -9999px;
  width: 1px;
  height: 1px;
  opacity: 0;
  border: 0;
  padding: 0;
}
</style>
