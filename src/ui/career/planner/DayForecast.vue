<script setup lang="ts">
/**
 * 24-hour energy & stress projection aligned with the planner timeline (x = clock hour).
 * The line runs from NOW to midnight, then wraps to 00:00 and continues ("tomorrow", drawn
 * lighter) until the current hour. Hover for exact values. It's an estimate.
 */
import { computed, ref } from 'vue'
import { useGame } from '@/ui/game'
import { forecast, type ForecastPoint } from '../forecast'
import { hh } from '../labels'
import NowMarker from './NowMarker.vue'

const state = useGame()
// Recompute only when the hour, schedule or relevant stats change (not every animation frame).
const fc = computed(() => forecast(state))

const W = 240
const H = 100
function y(v: number): number {
  return H - 4 - (v / 100) * (H - 8)
}
function path(pts: ForecastPoint[], key: 'energy' | 'stress'): string {
  return pts.map(p => `${(p.x * W) / 24},${y(p[key])}`).join(' ')
}

const lines = computed(() => ({
  eToday: path(fc.value.today, 'energy'),
  sToday: path(fc.value.today, 'stress'),
  eTom: path(fc.value.tomorrow, 'energy'),
  sTom: path(fc.value.tomorrow, 'stress'),
}))

const all = computed(() => [...fc.value.today.slice(1), ...fc.value.tomorrow.filter(p => p.x > 0)])
const endOfDay = computed(() => fc.value.today[fc.value.today.length - 1])

const hover = ref<number | null>(null)
const hovered = computed(() => {
  if (hover.value === null) return undefined
  const x = hover.value + 1
  return all.value.find(p => p.x === x)
})

function onMove(e: PointerEvent): void {
  const el = e.currentTarget as HTMLElement
  const r = el.getBoundingClientRect()
  hover.value = Math.max(0, Math.min(23, Math.floor(((e.clientX - r.left) / r.width) * 24)))
}

function when(p: ForecastPoint): string {
  const tomorrow = state.time.hour + p.offset > 24
  return `${tomorrow ? 'Tomorrow' : 'Today'} ${hh(p.x)}`
}

const summary = computed(() => {
  const end = endOfDay.value
  if (!end) return ''
  return `Forecast: energy ${Math.round(state.stats.energy)} now, about ${Math.round(end.energy)} at midnight; stress ${Math.round(state.stats.stress)} now, about ${Math.round(end.stress)} at midnight.`
})
</script>

<template>
  <div class="fc">
    <div class="fc-legend">
      <span class="fc-title">Next 24h <span class="muted">(estimate)</span></span>
      <span class="key"><i class="swatch energy"></i>Energy {{ Math.round(state.stats.energy) }} → {{ Math.round(endOfDay?.energy ?? state.stats.energy) }} <span class="muted">by 24:00</span></span>
      <span class="key"><i class="swatch stress"></i>Stress {{ Math.round(state.stats.stress) }} → {{ Math.round(endOfDay?.stress ?? state.stats.stress) }}</span>
      <span class="grow"></span>
      <span v-if="hovered" class="fc-readout">
        {{ when(hovered) }} · Energy <b>{{ Math.round(hovered.energy) }}</b> · Stress <b>{{ Math.round(hovered.stress) }}</b>
      </span>
    </div>
    <div class="fc-plot" role="img" :aria-label="summary" @pointermove="onMove" @pointerleave="hover = null">
      <svg :viewBox="`0 0 ${W} ${H}`" preserveAspectRatio="none" aria-hidden="true">
        <line v-for="g in [25, 50, 75]" :key="g" x1="0" :x2="W" :y1="y(g)" :y2="y(g)" class="grid" />
        <polyline :points="lines.eTom" class="ln energy tomorrow" />
        <polyline :points="lines.sTom" class="ln stress tomorrow" />
        <polyline :points="lines.eToday" class="ln energy" />
        <polyline :points="lines.sToday" class="ln stress" />
        <line v-if="hovered" :x1="(hovered.x * W) / 24" :x2="(hovered.x * W) / 24" y1="0" :y2="H" class="cross" />
      </svg>
      <NowMarker class="fc-now" />
      <template v-if="hovered">
        <span class="dot energy" :style="{ left: `${(hovered.x / 24) * 100}%`, top: `${y(hovered.energy)}%` }"></span>
        <span class="dot stress" :style="{ left: `${(hovered.x / 24) * 100}%`, top: `${y(hovered.stress)}%` }"></span>
      </template>
      <span class="fc-axis top" aria-hidden="true">100</span>
      <span class="fc-axis bottom" aria-hidden="true">0</span>
    </div>
  </div>
</template>

<style scoped>
.fc {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.fc-legend {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 11px;
  min-height: 16px;
}
.fc-title {
  font-weight: bold;
}
.key {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  white-space: nowrap;
}
.swatch {
  display: inline-block;
  width: 14px;
  height: 3px;
  border-radius: 2px;
}
.swatch.energy {
  background: var(--vital-energy);
}
.swatch.stress {
  background: var(--vital-stress);
}
.fc-readout {
  white-space: nowrap;
}
.fc-plot {
  position: relative;
  height: 50px;
  background: var(--panel-bg);
  border: 1px solid var(--panel-border);
  cursor: crosshair;
}
.fc-plot svg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  overflow: visible;
}
.grid {
  stroke: #ececec;
  stroke-width: 1;
  vector-effect: non-scaling-stroke;
}
.ln {
  fill: none;
  stroke-width: 2;
  stroke-linejoin: round;
  stroke-linecap: round;
  vector-effect: non-scaling-stroke;
}
.ln.energy {
  stroke: var(--vital-energy);
}
.ln.stress {
  stroke: var(--vital-stress);
}
.ln.tomorrow {
  opacity: 0.45;
}
.cross {
  stroke: #9a9a9a;
  stroke-width: 1;
  vector-effect: non-scaling-stroke;
}
.fc-now {
  opacity: 0.8;
  box-shadow: none;
}
.dot {
  position: absolute;
  width: 8px;
  height: 8px;
  margin: -4px 0 0 -4px;
  border-radius: 50%;
  box-shadow: 0 0 0 2px var(--panel-bg);
  pointer-events: none;
}
.dot.energy {
  background: var(--vital-energy);
}
.dot.stress {
  background: var(--vital-stress);
}
.fc-axis {
  position: absolute;
  left: 2px;
  font-size: 8px;
  color: var(--muted);
  pointer-events: none;
}
.fc-axis.top {
  top: 0;
}
.fc-axis.bottom {
  bottom: 0;
}
</style>
