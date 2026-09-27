<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    /** 0..1 */
    value: number
    label?: string
    color?: string
    height?: number
    /** XP-style segmented look. */
    segmented?: boolean
  }>(),
  { label: '', color: 'var(--bar-fill)', height: 14, segmented: true },
)

const pct = computed(() => `${Math.max(0, Math.min(1, props.value)) * 100}%`)
</script>

<template>
  <div class="pbar" :style="{ height: `${height}px` }" :title="label">
    <div class="pbar-fill" :class="{ segmented }" :style="{ width: pct, background: color }"></div>
    <span v-if="label" class="pbar-label">{{ label }}</span>
  </div>
</template>

<style scoped>
.pbar {
  position: relative;
  border: 1px solid var(--bar-border);
  background: var(--bar-bg);
  border-radius: 2px;
  overflow: hidden;
  min-width: 40px;
}
.pbar-fill {
  height: 100%;
  transition: width 0.2s linear;
}
.pbar-fill.segmented {
  mask-image: repeating-linear-gradient(90deg, #000 0 8px, transparent 8px 10px);
}
.pbar-label {
  position: absolute;
  inset: 0;
  font-size: 10px;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #000;
  text-shadow: 0 0 2px #fff;
}
</style>
