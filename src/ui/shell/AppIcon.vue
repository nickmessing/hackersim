<script setup lang="ts">
import { computed } from 'vue'
import { APPS, type AppId } from '@/ui/apps'

const props = withDefaults(defineProps<{ app: AppId; size?: number }>(), { size: 32 })

const glyph = computed(() => APPS[props.app].glyph)
const isTerminal = computed(() => props.app === 'terminal')
</script>

<template>
  <span class="app-icon" :style="{ width: `${size}px`, height: `${size}px`, fontSize: `${Math.round(size * 0.84)}px` }" aria-hidden="true">
    <span v-if="isTerminal" class="term" :style="{ fontSize: `${Math.max(6, Math.round(size * 0.34))}px` }">&gt;_</span>
    <span v-else class="glyph">{{ glyph }}</span>
  </span>
</template>

<style scoped>
.app-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: none;
  line-height: 1;
  font-family: var(--font-emoji);
  user-select: none;
}
.glyph {
  filter: drop-shadow(1px 1px 1px rgb(0 0 0 / 35%));
}
.term {
  width: 88%;
  height: 76%;
  display: flex;
  align-items: flex-start;
  justify-content: flex-start;
  padding: 8% 10%;
  border-radius: 12%;
  background: linear-gradient(#1b1f1b, #050805);
  border: max(1px, 0.06em) solid #9aa39a;
  box-shadow: 1px 1px 1px rgb(0 0 0 / 40%);
  color: var(--terminal-fg);
  font-family: var(--font-mono);
  font-weight: bold;
}
</style>
