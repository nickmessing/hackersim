<script setup lang="ts">
export type CaptionButton = 'min' | 'max' | 'restore' | 'close'

withDefaults(defineProps<{ title: string; glyph?: string; active?: boolean; buttons?: CaptionButton[] }>(), {
  glyph: '',
  active: true,
  buttons: () => ['close'],
})
const emit = defineEmits<{ min: []; max: []; close: [] }>()

const LABELS: Record<CaptionButton, string> = {
  min: 'Minimize',
  max: 'Maximize',
  restore: 'Restore Down',
  close: 'Close',
}

function press(b: CaptionButton): void {
  if (b === 'min') emit('min')
  else if (b === 'close') emit('close')
  else emit('max')
}
</script>

<template>
  <div class="titlebar" :class="{ inactive: !active }">
    <span v-if="glyph" class="tglyph" aria-hidden="true">{{ glyph }}</span>
    <span class="ttext">{{ title }}</span>
    <span class="caps" @pointerdown.stop @dblclick.stop>
      <button
        v-for="b in buttons"
        :key="b"
        type="button"
        class="cap"
        :class="`cap-${b}`"
        :title="LABELS[b]"
        :aria-label="LABELS[b]"
        @click="press(b)"
      >
        <svg viewBox="0 0 10 10" fill="none" stroke="currentColor" aria-hidden="true">
          <path v-if="b === 'min'" d="M2 8.2h5" stroke-width="1.8" />
          <template v-else-if="b === 'max'">
            <rect x="1.2" y="1.2" width="7.6" height="7.6" stroke-width="1.1" />
            <path d="M1.2 2h7.6" stroke-width="1.8" />
          </template>
          <template v-else-if="b === 'restore'">
            <rect x="0.9" y="3.6" width="5.5" height="5.5" stroke-width="1.1" />
            <path d="M0.9 4.3h5.5" stroke-width="1.4" />
            <path d="M3.4 3.4V0.9h5.7v5.7H6.6" stroke-width="1.1" />
            <path d="M3.4 1.6h5.7" stroke-width="1.4" />
          </template>
          <path v-else d="M2 2l6 6M8 2L2 8" stroke-width="1.7" />
        </svg>
      </button>
    </span>
  </div>
</template>

<style scoped>
.titlebar {
  display: flex;
  align-items: center;
  gap: 5px;
  height: var(--title-h);
  padding: 0 3px 0 6px;
  background: var(--title-bg);
  color: var(--title-fg);
  font: var(--title-font);
  text-shadow: var(--title-shadow);
  border-radius: var(--title-radius);
  user-select: none;
  flex: none;
}
.titlebar.inactive {
  background: var(--title-bg-inactive);
  color: var(--title-fg-inactive);
  text-shadow: none;
}
.tglyph {
  font-family: var(--font-emoji);
  font-size: 14px;
  line-height: 1;
  text-shadow: none;
  filter: drop-shadow(0 1px 0 rgb(0 0 0 / 25%));
}
.ttext {
  flex: 1;
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  letter-spacing: 0.1px;
}
.caps {
  display: flex;
  gap: 2px;
  flex: none;
}
.cap {
  width: var(--cap-w);
  height: var(--cap-h);
  padding: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: var(--cap-border);
  border-radius: var(--cap-radius);
  background: var(--cap-bg);
  color: var(--cap-fg);
  box-shadow: var(--cap-bevel);
  cursor: pointer;
}
.cap svg {
  width: 62%;
  height: 62%;
}
.cap:hover {
  background: var(--cap-bg-hover);
}
.cap:active {
  box-shadow: var(--cap-bevel-pressed);
}
.cap-close {
  background: var(--cap-close-bg);
  margin-left: 2px;
}
.cap-close:hover {
  background: var(--cap-close-hover);
}
.titlebar.inactive .cap {
  opacity: 0.72;
}
.cap:focus-visible {
  outline: 1px dotted currentColor;
  outline-offset: -4px;
}
</style>
