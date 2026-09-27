<script setup lang="ts">
/** Requirement chips: each part of a `Cond` with a ✔ (met) or ✘ (unmet) and matching colour. */
import { computed } from 'vue'
import type { Cond } from '@/engine'
import { useGame } from '@/ui/game'
import { reqParts } from './reqs'

const props = withDefaults(defineProps<{ cond: Cond | undefined; label?: string; none?: string; compact?: boolean }>(), {
  label: 'Requires',
  none: 'No requirements',
  compact: false,
})

const state = useGame()
const parts = computed(() => reqParts(state, props.cond))
</script>

<template>
  <div class="reqs" :class="{ compact }">
    <span v-if="label" class="reqs-label muted">{{ label }}:</span>
    <span v-if="parts.length === 0" class="req met">{{ none }}</span>
    <span v-for="(p, i) in parts" :key="i" class="req" :class="{ met: p.met, unmet: !p.met, secret: p.secret }">
      <span class="req-mark" aria-hidden="true">{{ p.met ? '✔' : '✘' }}</span>
      {{ p.text }}<span class="sr-only">{{ p.met ? ' (met)' : ' (not met)' }}</span>
    </span>
  </div>
</template>

<style scoped>
.reqs {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 3px 6px;
  font-size: 11px;
}
.reqs-label {
  margin-right: 2px;
}
.req {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 0 5px;
  line-height: 16px;
  border-radius: 8px;
  border: 1px solid transparent;
}
.req.met {
  color: var(--good);
  background: #eaf6ea;
  border-color: #c3e3c3;
}
.req.unmet {
  color: var(--bad);
  background: #fbeceb;
  border-color: #efc5c1;
}
.req.secret {
  font-style: italic;
}
.req-mark {
  font-size: 10px;
}
.compact .req {
  padding: 0 4px;
}
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
}
</style>
