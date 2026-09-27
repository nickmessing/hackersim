<script setup lang="ts">
import { computed } from 'vue'
import { renderText, type Text } from '@/engine'
import { useGame } from '@/ui/game'

const props = defineProps<{ text: Text | undefined }>()
const state = useGame()
const paragraphs = computed(() => renderText(state, props.text))
</script>

<template>
  <div class="rich">
    <p v-for="(p, i) in paragraphs" :key="i">{{ p }}</p>
  </div>
</template>

<style scoped>
.rich p {
  white-space: pre-wrap;
}
</style>
