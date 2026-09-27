<script setup lang="ts">
/** Animated d20 roll readout: die face, modifier, total vs DC, SUCCESS / FAILURE. */
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import type { RollRecord } from '@/engine'
import { dndMod, skillLabel } from './labels'

const props = defineProps<{ roll: RollRecord; caption?: string }>()
const emit = defineEmits<{ done: [] }>()

const face = ref<number>(1)
const settled = ref<boolean>(false)
let timer: ReturnType<typeof setInterval> | undefined

function settle(): void {
  if (timer !== undefined) clearInterval(timer)
  timer = undefined
  face.value = props.roll.d20
  settled.value = true
  emit('done')
}

onMounted(() => {
  const reduce = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (reduce) {
    settle()
    return
  }
  let ticks = 0
  timer = setInterval(() => {
    ticks++
    face.value = 1 + Math.floor(Math.random() * 20)
    if (ticks >= 14) settle()
  }, 55)
})
onBeforeUnmount(() => {
  if (timer !== undefined) clearInterval(timer)
})

const natNote = computed(() => {
  if (props.roll.d20 === 20) return 'Natural 20!'
  if (props.roll.d20 === 1) return 'Natural 1...'
  return ''
})
</script>

<template>
  <div class="dice" :class="{ settled, success: settled && roll.success, fail: settled && !roll.success }" aria-live="polite">
    <div v-if="caption" class="dice-caption">{{ caption }}</div>
    <div class="dice-row">
      <div class="d20" :class="{ spinning: !settled }" :title="`d20 rolled ${roll.d20}`">
        <svg viewBox="0 0 40 40" aria-hidden="true">
          <polygon points="20,2 37,11 37,29 20,38 3,29 3,11" class="d20-body" />
          <polygon points="20,8 31,27 9,27" class="d20-face" />
        </svg>
        <span class="d20-num">{{ face }}</span>
      </div>
      <div class="dice-math mono">
        <span>d20 <b>{{ settled ? roll.d20 : '…' }}</b></span>
        <span>{{ dndMod(roll.mod) }} <span class="muted">{{ skillLabel(roll.skill) }}</span></span>
        <span>= <b>{{ settled ? roll.total : '…' }}</b></span>
        <span class="muted">vs DC {{ roll.dc }}</span>
      </div>
    </div>
    <div class="dice-verdict">
      <template v-if="settled">
        <b>{{ roll.success ? 'SUCCESS' : 'FAILURE' }}</b>
        <span v-if="natNote" class="muted"> — {{ natNote }}</span>
      </template>
      <span v-else class="muted">Rolling…</span>
    </div>
  </div>
</template>

<style scoped>
.dice {
  border: 1px solid var(--panel-border);
  background: var(--panel-bg);
  padding: 8px 10px;
  border-radius: var(--radius);
}
.dice-caption {
  font-weight: bold;
  margin-bottom: 6px;
}
.dice-row {
  display: flex;
  align-items: center;
  gap: 12px;
}
.d20 {
  position: relative;
  width: 46px;
  height: 46px;
  flex: none;
}
.d20 svg {
  width: 100%;
  height: 100%;
}
.d20-body {
  fill: var(--sel-bg);
  stroke: var(--win-title-a);
  stroke-width: 1.5;
}
.d20-face {
  fill: rgb(255 255 255 / 18%);
}
.dice.success .d20-body {
  fill: var(--good);
}
.dice.fail .d20-body {
  fill: var(--bad);
}
.d20-num {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-weight: bold;
  font-size: 15px;
  text-shadow: 0 1px 1px rgb(0 0 0 / 50%);
}
.d20.spinning {
  animation: d20-wobble 0.22s linear infinite;
}
@keyframes d20-wobble {
  0% {
    transform: rotate(-10deg);
  }
  50% {
    transform: rotate(10deg) scale(1.05);
  }
  100% {
    transform: rotate(-10deg);
  }
}
.dice-math {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 10px;
  font-size: 12px;
}
.dice-verdict {
  margin-top: 6px;
  font-size: 13px;
  letter-spacing: 0.5px;
}
.dice.success .dice-verdict b {
  color: var(--good);
}
.dice.fail .dice-verdict b {
  color: var(--bad);
}
</style>
