<script setup lang="ts">
import { computed } from 'vue'
import { C } from '@/engine'

const props = withDefaults(defineProps<{ npc?: string; text?: string; color?: string; size?: number }>(), {
  npc: undefined,
  text: undefined,
  color: undefined,
  size: 32,
})

const def = computed(() => (props.npc ? C.npcs.get(props.npc) : undefined))
const glyph = computed(() => props.text ?? def.value?.avatar ?? (props.npc ? props.npc.slice(0, 2).toUpperCase() : '?'))
const bg = computed(() => props.color ?? def.value?.color ?? '#5a7bb5')
</script>

<template>
  <div class="avatar" :style="{ width: `${size}px`, height: `${size}px`, background: bg, fontSize: `${Math.round(size * 0.45)}px` }" :title="def?.name ?? ''">
    {{ glyph }}
  </div>
</template>

<style scoped>
.avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: none;
  border-radius: 3px;
  border: 1px solid rgb(0 0 0 / 30%);
  color: #fff;
  font-weight: bold;
  text-shadow: 0 1px 1px rgb(0 0 0 / 40%);
  user-select: none;
}
</style>
