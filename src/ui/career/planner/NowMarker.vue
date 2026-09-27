<script setup lang="ts">
/**
 * Current-time vertical marker for 24-hour strips. Isolated in its own component so only this
 * element re-renders as the clock ticks every frame (not the whole timeline).
 */
import { computed } from 'vue'
import { useGame } from '@/ui/game'

const state = useGame()
const left = computed(() => `${((state.time.hour + state.time.frac) / 24) * 100}%`)
</script>

<template>
  <div class="now" :style="{ left }" aria-hidden="true"></div>
</template>

<style scoped>
.now {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 2px;
  margin-left: -1px;
  background: var(--bad);
  box-shadow: 0 0 0 1px rgb(255 255 255 / 70%);
  pointer-events: none;
  z-index: 2;
}
</style>
