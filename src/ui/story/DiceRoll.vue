<script setup lang="ts">
/**
 * d20 roll animation + result banner. The die tumbles through random faces (visual only — the
 * real result comes from the engine), lands on `roll.d20`, then shows the math and the verdict.
 * Click during the tumble to skip; "Continue" (or Enter/Space when `hotkeys`) emits `continue`.
 */
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import type { RollRecord } from '@/engine'
import { signedMod, skillLabel } from './storyKit'

const props = withDefaults(
  defineProps<{
    roll: RollRecord
    /** Heading, e.g. "Intrusion check" or "Auto-resolve". */
    label?: string
    showMath?: boolean
    /** Handle Enter/Space globally (used inside the modal dialog). */
    hotkeys?: boolean
    continueLabel?: string
  }>(),
  { label: '', showMath: true, hotkeys: false, continueLabel: 'Continue ▸' },
)
const emit = defineEmits<{ continue: [] }>()

const TUMBLE_MS = 950
const face = ref<number>(Math.floor(Math.random() * 20) + 1)
const landed = ref(false)
const btn = ref<HTMLButtonElement | null>(null)
let timer = 0
let stopAt = 0

const reduced = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

const heading = computed(() => props.label || `${skillLabel(props.roll.skill)} check`)
const nat = computed(() => (props.roll.d20 === 20 ? 'Natural 20!' : props.roll.d20 === 1 ? 'Natural 1…' : ''))
const math = computed(() => `d20 ${props.roll.d20} ${signedMod(props.roll.mod)} = ${props.roll.total} vs DC ${props.roll.dc}`)
const margin = computed(() => props.roll.total - props.roll.dc)
const marginText = computed(() => {
  if (props.roll.d20 === 20 && margin.value < 0) return 'The dice love you today.'
  if (props.roll.d20 === 1 && margin.value >= 0) return 'Skill was not enough. Fate had other plans.'
  if (margin.value >= 8) return 'Effortless.'
  if (margin.value >= 3) return 'Comfortably done.'
  if (margin.value >= 0) return 'By a hair.'
  if (margin.value >= -3) return 'So close it hurts.'
  return 'Not even close.'
})

function land(): void {
  if (landed.value) return
  window.clearInterval(timer)
  face.value = props.roll.d20
  landed.value = true
  void nextTick(() => btn.value?.focus({ preventScroll: true }))
}

function tumble(): void {
  if (Date.now() >= stopAt) {
    land()
    return
  }
  let n = Math.floor(Math.random() * 20) + 1
  if (n === face.value) n = (n % 20) + 1
  face.value = n
}

function onKey(e: KeyboardEvent): void {
  if (!props.hotkeys || e.ctrlKey || e.metaKey || e.altKey) return
  const el = e.target as HTMLElement | null
  if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable)) return
  if (e.key !== 'Enter' && e.key !== ' ' && !/^[1-9]$/.test(e.key)) return
  // A focused button activates natively on Enter/Space; don't double-fire.
  if (el?.tagName === 'BUTTON' && (e.key === 'Enter' || e.key === ' ')) return
  e.preventDefault()
  if (!landed.value) land()
  else emit('continue')
}

onMounted(() => {
  if (reduced) land()
  else {
    stopAt = Date.now() + TUMBLE_MS
    timer = window.setInterval(tumble, 60)
  }
  window.addEventListener('keydown', onKey)
})

onBeforeUnmount(() => {
  window.clearInterval(timer)
  window.removeEventListener('keydown', onKey)
})
</script>

<template>
  <div class="dice" :class="{ landed, win: landed && roll.success, lose: landed && !roll.success }" @click="land">
    <div class="die-wrap" :class="{ tumbling: !landed }" aria-hidden="true">
      <div class="die">
        <span class="die-face">{{ face }}</span>
      </div>
    </div>
    <div class="dice-body" aria-live="polite">
      <div class="dice-head">🎲 {{ heading }}</div>
      <template v-if="landed">
        <div v-if="showMath" class="dice-math mono">{{ math }}</div>
        <div class="dice-verdict">
          <span class="stamp">{{ roll.success ? 'SUCCESS' : 'FAILURE' }}</span>
          <span v-if="nat" class="nat">{{ nat }}</span>
        </div>
        <div class="dice-flavor muted">{{ marginText }}</div>
        <slot />
      </template>
      <div v-else class="dice-math muted">Rolling… <span class="hint">(click to skip)</span></div>
    </div>
    <div v-if="landed" class="dice-actions">
      <button ref="btn" type="button" class="btn primary" @click.stop="emit('continue')">{{ continueLabel }}</button>
    </div>
  </div>
</template>

<style scoped>
.dice {
  display: flex;
  align-items: center;
  gap: 12px;
  color: var(--win-fg);
  font-style: normal;
  padding: 10px 12px;
  border: 1px solid var(--panel-border);
  border-radius: var(--radius);
  background: linear-gradient(var(--panel-bg), var(--panel-alt));
  box-shadow: inset 0 0 0 1px rgb(255 255 255 / 60%);
  cursor: default;
  user-select: none;
}
.dice.win {
  border-color: var(--good);
  background: linear-gradient(var(--panel-bg), color-mix(in srgb, var(--good) 12%, var(--panel-bg)));
}
.dice.lose {
  border-color: var(--bad);
  background: linear-gradient(var(--panel-bg), color-mix(in srgb, var(--bad) 10%, var(--panel-bg)));
}
.die-wrap {
  flex: none;
  width: 58px;
  height: 58px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.die-wrap.tumbling {
  animation: tumble 0.28s linear infinite;
}
.landed .die-wrap {
  animation: thud 0.32s ease-out;
}
.die {
  width: 54px;
  height: 58px;
  clip-path: polygon(50% 0, 96% 25%, 96% 75%, 50% 100%, 4% 75%, 4% 25%);
  background: linear-gradient(160deg, color-mix(in srgb, var(--info) 55%, #fff), var(--info) 60%, var(--win-title-a));
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}
.die::before {
  content: '';
  position: absolute;
  inset: 11px 8px 14px;
  clip-path: polygon(50% 0, 100% 100%, 0 100%);
  background: rgb(255 255 255 / 18%);
}
.win .die {
  background: linear-gradient(160deg, color-mix(in srgb, var(--good) 50%, #fff), var(--good) 60%, color-mix(in srgb, var(--good) 60%, #000));
}
.lose .die {
  background: linear-gradient(160deg, color-mix(in srgb, var(--bad) 50%, #fff), var(--bad) 60%, color-mix(in srgb, var(--bad) 60%, #000));
}
.die-face {
  position: relative;
  color: #fff;
  font-weight: bold;
  font-size: 19px;
  font-family: var(--font-mono);
  text-shadow: 0 1px 2px rgb(0 0 0 / 55%);
  margin-top: 6px;
}
.dice-body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.dice-head {
  font-weight: bold;
  color: var(--info);
}
.dice-math {
  font-size: 12px;
}
.hint {
  font-size: 11px;
}
.dice-verdict {
  display: flex;
  align-items: baseline;
  gap: 8px;
}
.stamp {
  font-weight: bold;
  font-size: 16px;
  letter-spacing: 2px;
  padding: 0 6px;
  border: 2px solid currentcolor;
  border-radius: 2px;
  transform: rotate(-2deg);
  animation: stamp 0.25s ease-out;
}
.win .stamp {
  color: var(--good);
}
.lose .stamp {
  color: var(--bad);
}
.nat {
  font-weight: bold;
  color: var(--warn);
}
.dice-flavor {
  font-style: italic;
  font-size: 11px;
}
.dice-actions {
  flex: none;
  align-self: flex-end;
}
@keyframes tumble {
  0% {
    transform: rotate(0deg) scale(1);
  }
  50% {
    transform: rotate(180deg) scale(0.9);
  }
  100% {
    transform: rotate(360deg) scale(1);
  }
}
@keyframes thud {
  0% {
    transform: scale(1.25);
  }
  60% {
    transform: scale(0.94);
  }
  100% {
    transform: scale(1);
  }
}
@keyframes stamp {
  0% {
    transform: rotate(-2deg) scale(1.8);
    opacity: 0;
  }
  100% {
    transform: rotate(-2deg) scale(1);
    opacity: 1;
  }
}
@media (prefers-reduced-motion: reduce) {
  .die-wrap.tumbling,
  .landed .die-wrap,
  .stamp {
    animation: none;
  }
}
</style>
