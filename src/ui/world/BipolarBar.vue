<script setup lang="ts">
/**
 * A centered meter for signed values (faction rep, affinity): fills left of the midpoint in the
 * negative color and right of it in `color`. Optional tick marks show tier boundaries.
 */
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    value: number
    min?: number
    max?: number
    color?: string
    negColor?: string
    ticks?: readonly number[]
    label?: string
    title?: string
    height?: number
  }>(),
  {
    min: -100,
    max: 100,
    color: 'var(--bar-fill)',
    negColor: 'var(--bad)',
    ticks: () => [],
    label: '',
    title: '',
    height: 14,
  },
)

const span = computed(() => props.max - props.min)
function pos(v: number): number {
  const c = Math.max(props.min, Math.min(props.max, v))
  return ((c - props.min) / span.value) * 100
}
const zero = computed(() => pos(0))
const at = computed(() => pos(props.value))
const fillStyle = computed(() => {
  const left = Math.min(zero.value, at.value)
  const width = Math.abs(at.value - zero.value)
  return {
    left: `${left}%`,
    width: `${width}%`,
    background: props.value < 0 ? props.negColor : props.color,
  }
})
const tickList = computed(() => props.ticks.filter(t => t > props.min && t < props.max && t !== 0).map(t => ({ t, left: `${pos(t)}%` })))
</script>

<template>
  <div
    class="bibar"
    :style="{ height: `${height}px` }"
    :title="title || label"
    role="meter"
    :aria-valuemin="min"
    :aria-valuemax="max"
    :aria-valuenow="Math.round(value)"
    :aria-label="title || label"
  >
    <div class="bibar-fill" :style="fillStyle"></div>
    <div v-for="tk in tickList" :key="tk.t" class="bibar-tick" :style="{ left: tk.left }"></div>
    <div class="bibar-zero" :style="{ left: `${zero}%` }"></div>
    <span v-if="label" class="bibar-label">{{ label }}</span>
  </div>
</template>

<style scoped>
.bibar {
  position: relative;
  border: 1px solid var(--bar-border);
  background: var(--bar-bg);
  border-radius: 2px;
  overflow: hidden;
  min-width: 60px;
  box-shadow: inset 0 1px 2px rgb(0 0 0 / 12%);
}
.bibar-fill {
  position: absolute;
  top: 0;
  bottom: 0;
  transition:
    left 0.25s ease,
    width 0.25s ease;
  mask-image: repeating-linear-gradient(90deg, #000 0 8px, transparent 8px 10px);
}
.bibar-zero {
  position: absolute;
  top: -1px;
  bottom: -1px;
  width: 1px;
  background: var(--bar-border);
}
.bibar-tick {
  position: absolute;
  top: 0;
  height: 4px;
  width: 1px;
  background: var(--muted);
  opacity: 0.7;
}
.bibar-label {
  position: absolute;
  inset: 0;
  font-size: 10px;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--win-fg);
  text-shadow: 0 0 2px var(--bar-bg), 0 0 2px var(--bar-bg);
  white-space: nowrap;
}
</style>
