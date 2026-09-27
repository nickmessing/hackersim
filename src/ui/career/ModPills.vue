<script setup lang="ts">
/** Modifier list as small green (helps) / red (hurts) pills. */
import type { Modifier } from '@/engine'
import { modIsGood, modText } from './labels'

withDefaults(defineProps<{ mods: readonly Modifier[] | undefined; source?: string }>(), { source: '' })
</script>

<template>
  <span v-if="mods?.length" class="mods">
    <span v-for="(m, i) in mods" :key="i" class="pill" :class="modIsGood(m) ? 'good' : 'bad'" :title="source ? `From ${source}` : ''">{{ modText(m) }}</span>
  </span>
</template>

<style scoped>
.mods {
  display: inline-flex;
  flex-wrap: wrap;
  gap: 3px;
}
</style>
