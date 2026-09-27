<script setup lang="ts">
/** A static (non-managed) window: wizards, message boxes, popups. */
import TitleBar from './TitleBar.vue'

withDefaults(defineProps<{ title: string; glyph?: string; width?: string; closable?: boolean; active?: boolean }>(), {
  glyph: '',
  width: '420px',
  closable: false,
  active: true,
})
const emit = defineEmits<{ close: [] }>()
</script>

<template>
  <div class="rwin hs-window" :style="{ width }" role="dialog" :aria-label="title">
    <TitleBar :title="title" :glyph="glyph" :active="active" :buttons="closable ? ['close'] : []" @close="emit('close')" />
    <div class="rwin-body">
      <slot />
    </div>
    <div v-if="$slots.footer" class="rwin-foot">
      <slot name="footer" />
    </div>
  </div>
</template>

<style scoped>
.rwin {
  display: flex;
  flex-direction: column;
  max-width: calc(100vw - 16px);
  max-height: calc(100vh - 16px);
  background: var(--win-bg);
  border: var(--frame-bw) solid var(--frame-active);
  border-top-width: var(--frame-bw-top);
  border-radius: var(--frame-radius);
  padding: var(--frame-pad);
  box-shadow: var(--frame-bevel), var(--win-shadow);
}
.rwin-body {
  flex: 1;
  min-height: 0;
  overflow: auto;
}
.rwin-foot {
  flex: none;
  display: flex;
  justify-content: flex-end;
  gap: 6px;
  padding: 8px 10px 10px;
}
</style>
