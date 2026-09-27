<script setup lang="ts">
/**
 * In-app modal message box (XP style): dims its app and asks a question. Place it inside an
 * element with `position: relative` (the app root). Emits `ok` / `cancel`.
 */
import { onMounted, useTemplateRef } from 'vue'

const props = withDefaults(
  defineProps<{
    title: string
    icon?: 'warn' | 'question' | 'info' | 'error' | 'ok'
    okLabel?: string
    cancelLabel?: string
    /** Hide the cancel button (information boxes). */
    noCancel?: boolean
    /** Destructive action: focus Cancel by default and style OK as danger. */
    danger?: boolean
    okDisabled?: boolean
  }>(),
  { icon: 'question', okLabel: 'OK', cancelLabel: 'Cancel', noCancel: false, danger: false, okDisabled: false },
)
const emit = defineEmits<{ ok: []; cancel: [] }>()

const okBtn = useTemplateRef<HTMLButtonElement>('okBtn')
const cancelBtn = useTemplateRef<HTMLButtonElement>('cancelBtn')

const ICONS: Record<NonNullable<typeof props.icon>, string> = {
  warn: '!',
  question: '?',
  info: 'i',
  error: '×',
  ok: '✓',
}

onMounted(() => {
  if (props.danger && cancelBtn.value) cancelBtn.value.focus()
  else okBtn.value?.focus()
})

function dismiss(): void {
  if (props.noCancel) emit('ok')
  else emit('cancel')
}

function onKey(e: KeyboardEvent): void {
  if (e.key === 'Escape') {
    e.stopPropagation()
    dismiss()
  }
}
</script>

<template>
  <div class="mb-overlay" @keydown="onKey" @pointerdown.self="!noCancel && emit('cancel')">
    <div class="mb-box" role="alertdialog" aria-modal="true" :aria-label="title">
      <div class="mb-title">
        <span>{{ title }}</span>
        <button class="mb-x" type="button" aria-label="Close" @click="dismiss">×</button>
      </div>
      <div class="mb-body">
        <div class="mb-icon" :class="icon" aria-hidden="true">{{ ICONS[icon] }}</div>
        <div class="mb-content"><slot /></div>
      </div>
      <div class="mb-buttons">
        <button ref="okBtn" type="button" class="btn primary" :class="{ danger }" :disabled="okDisabled" @click="emit('ok')">{{ okLabel }}</button>
        <button v-if="!noCancel" ref="cancelBtn" type="button" class="btn" @click="emit('cancel')">{{ cancelLabel }}</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.mb-overlay {
  position: absolute;
  inset: 0;
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgb(0 0 0 / 22%);
  padding: 12px;
}
.mb-box {
  width: min(400px, 100%);
  max-height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--win-bg);
  border: 1px solid var(--win-border);
  border-radius: var(--radius) var(--radius) 0 0;
  box-shadow: var(--win-shadow);
  animation: mb-pop 0.12s ease-out;
}
@keyframes mb-pop {
  from {
    transform: scale(0.96);
    opacity: 0.4;
  }
}
.mb-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 3px 4px 3px 8px;
  font-weight: bold;
  color: var(--win-title-fg);
  background: linear-gradient(90deg, var(--win-title-a), var(--win-title-b));
  border-radius: var(--radius) var(--radius) 0 0;
}
.mb-x {
  font: inherit;
  font-weight: bold;
  width: 21px;
  height: 21px;
  line-height: 1;
  border: 1px solid #fff;
  border-radius: var(--radius);
  color: #fff;
  background: linear-gradient(#e0735a, #c2401f);
  cursor: pointer;
}
.mb-body {
  display: flex;
  gap: 12px;
  padding: 14px 14px 8px;
  overflow: auto;
}
.mb-icon {
  flex: none;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font: bold 20px Georgia, serif;
  color: #fff;
  border: 1px solid rgb(0 0 0 / 25%);
  box-shadow: inset 0 -3px 6px rgb(0 0 0 / 20%), inset 0 3px 5px rgb(255 255 255 / 35%);
}
.mb-icon.question,
.mb-icon.info {
  background: var(--info);
}
.mb-icon.warn {
  background: var(--warn);
  border-radius: 4px;
}
.mb-icon.error {
  background: var(--bad);
}
.mb-icon.ok {
  background: var(--good);
}
.mb-content {
  flex: 1;
  min-width: 0;
  line-height: 1.45;
}
.mb-buttons {
  display: flex;
  justify-content: center;
  gap: 8px;
  padding: 6px 12px 12px;
}
.mb-buttons .btn {
  min-width: 76px;
}
.btn:focus-visible,
.mb-x:focus-visible {
  outline: 1px dotted #000;
  outline-offset: -4px;
}
</style>
