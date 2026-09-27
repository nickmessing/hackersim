<script setup lang="ts">
import { computed } from 'vue'
import {
  ageOn,
  currentActivity,
  dailyExpenses,
  dailyHeatDecay,
  efficiency,
  formatClock,
  formatWeek,
  formatShortDate,
  maxSpeed,
  money,
  pause,
  pct,
  raidChance,
  resume,
  setSpeed,
} from '@/engine'
import { useGame } from '@/ui/game'
import { openApp } from '@/ui/wm'
import { ACTIVITY_GLYPHS, activityLabel } from './describe'

const state = useGame()

const SPEEDS = [
  { speed: 1, label: '1×', name: 'Normal speed', key: '1' },
  { speed: 2, label: '2×', name: 'Fast', key: '2' },
  { speed: 5, label: '5×', name: 'Faster', key: '3' },
  { speed: 10, label: '10×', name: 'Fastest', key: '4' },
] as const

const cap = computed(() => maxSpeed(state))
const paused = computed(() => state.time.speed <= 0)

function speedTitle(s: (typeof SPEEDS)[number]): string {
  if (s.speed > cap.value) return 'Story timer running — max 2x'
  return `${s.name} (${s.key})`
}

function togglePause(): void {
  if (paused.value) resume(state)
  else pause(state)
}

// ── Clock ──────────────────────────────────────────────────────────────────
const clock = computed(() => formatClock(state.time.hour, state.time.frac))
const shortDate = computed(() => `wk ${formatShortDate(state.time.day)}`)
const activity = computed(() => currentActivity(state))
const clockTitle = computed(
  () =>
    `${formatWeek(state.time.day)} · Age ${Math.floor(ageOn(state.time.day))}\nEach turn is one week: the clock shows a typical day of it.\nNow: ${activityLabel(activity.value)}\nClick to open the Daily Planner`,
)

// ── Money ──────────────────────────────────────────────────────────────────
const cash = computed(() => money(state.stats.money))
const moneyTitle = computed(() => {
  const exp = dailyExpenses(state)
  const lines = [`Cash: ${money(state.stats.money)}`, `Daily expenses: ${money(exp)}`]
  const obl = state.obligations
  if (obl.length > 0) {
    const perDay = obl.reduce((s, o) => s + o.perDay, 0)
    lines.push(`Obligations: ${money(perDay)}/day (included above)`)
    const MAX = 4
    for (const o of obl.slice(0, MAX)) {
      const term = o.untilDay === null ? 'until settled' : `${Math.max(0, o.untilDay - state.time.day)}d left`
      lines.push(`  • ${o.label} — ${money(o.perDay)}/day, ${term}`)
    }
    if (obl.length > MAX) lines.push(`  • …and ${obl.length - MAX} more`)
  }
  if (state.stats.money < 0) lines.push('You are in debt.')
  lines.push('Click to open Life')
  return lines.join('\n')
})

// ── Vitals ─────────────────────────────────────────────────────────────────
interface Vital {
  id: 'energy' | 'stress' | 'health'
  short: string
  label: string
  value: number
  color: string
  warn: boolean
}
const vitals = computed<Vital[]>(() => {
  const s = state.stats
  const tone = (good: boolean, bad: boolean): string => (bad ? 'var(--bad)' : good ? 'var(--bar-fill)' : 'var(--warn)')
  return [
    { id: 'energy', short: 'E', label: 'Energy', value: s.energy, color: tone(s.energy >= 40, s.energy < 20), warn: s.energy < 20 },
    { id: 'stress', short: 'S', label: 'Stress', value: s.stress, color: tone(s.stress <= 50, s.stress > 75), warn: s.stress > 75 },
    { id: 'health', short: 'H', label: 'Health', value: s.health, color: tone(s.health >= 50, s.health < 25), warn: s.health < 25 },
  ]
})
const vitalsTitle = computed(() => {
  const s = state.stats
  return `Energy ${Math.round(s.energy)}/100 · Stress ${Math.round(s.stress)}/100 · Health ${Math.round(s.health)}/100\nMood ${Math.round(s.mood)}/100 · Efficiency ${pct(efficiency(state))}`
})

// ── Heat ───────────────────────────────────────────────────────────────────
const heat = computed(() => Math.round(state.stats.heat))
const heatLevel = computed(() => {
  const h = state.stats.heat
  if (h >= 70) return { cls: 'burning', label: 'Burning' }
  if (h >= 50) return { cls: 'hot', label: 'Hot' }
  if (h >= 30) return { cls: 'warm', label: 'Warm' }
  return { cls: 'cold', label: 'Cold' }
})
const heatTitle = computed(() => {
  const chance = raidChance(state)
  const decay = dailyHeatDecay(state)
  const raid = chance > 0 ? `Raid chance: ${(chance * 100).toFixed(1)}% per day` : 'Raid chance: none (below 70)'
  return `Heat ${heat.value}/100 — ${heatLevel.value.label}\n${raid}\nCooling off: −${decay.toFixed(1)} per day\nClick to open Operations`
})

// ── Custody / hospital ─────────────────────────────────────────────────────
const confinement = computed(() => {
  if (state.hospital) {
    const d = Math.max(0, state.hospital.untilDay - state.time.day)
    return { cls: 'hospital', text: `✚ Hospital ${d}d`, title: `In hospital until ${formatShortDate(state.hospital.untilDay)}` }
  }
  if (state.jail) {
    const d = Math.max(0, state.jail.untilDay - state.time.day)
    return { cls: 'jail', text: `🔒 Custody ${d}d`, title: `Held until ${formatShortDate(state.jail.untilDay)}` }
  }
  return null
})
</script>

<template>
  <div class="tray">
    <span v-if="confinement" class="confine" :class="confinement.cls" :title="confinement.title">{{ confinement.text }}</span>

    <div class="speed" role="group" aria-label="Game speed">
      <button type="button" class="sp" :class="{ on: paused }" :title="paused ? 'Resume (Space)' : 'Pause (Space)'" :aria-pressed="paused" @click="togglePause">
        <svg viewBox="0 0 10 10" aria-hidden="true"><rect x="2" y="1.5" width="2.2" height="7" /><rect x="5.8" y="1.5" width="2.2" height="7" /></svg>
      </button>
      <span v-for="s in SPEEDS" :key="s.speed" class="sp-wrap" :class="{ locked: s.speed > cap }" :title="speedTitle(s)">
        <button
          type="button"
          class="sp"
          :class="{ on: !paused && state.time.speed === s.speed }"
          :disabled="s.speed > cap"
          :aria-label="speedTitle(s)"
          :aria-pressed="!paused && state.time.speed === s.speed"
          @click="setSpeed(state, s.speed)"
        >
          {{ s.label }}
        </button>
      </span>
    </div>

    <span class="sep" aria-hidden="true"></span>

    <button type="button" class="seg activity" :title="`Now: ${activityLabel(activity)}`" @click="openApp('schedule')">
      <span class="emo" aria-hidden="true">{{ ACTIVITY_GLYPHS[activity] }}</span>
      <span class="act-label">{{ activityLabel(activity) }}</span>
    </button>

    <button type="button" class="seg vitals" :title="vitalsTitle" aria-label="Vitals" @click="openApp('life')">
      <span v-for="v in vitals" :key="v.id" class="vital" :class="{ warn: v.warn }" :title="`${v.label} ${Math.round(v.value)}/100`">
        <span class="vbar"><span class="vfill" :style="{ height: `${Math.max(4, Math.min(100, v.value))}%`, background: v.color }"></span></span>
        <span class="vlabel">{{ v.short }}</span>
      </span>
    </button>

    <button type="button" class="seg heat" :class="heatLevel.cls" :title="heatTitle" @click="openApp('ops')">
      <span class="emo" aria-hidden="true">♨</span>
      <span class="heat-bar"><span class="heat-fill" :style="{ width: `${Math.min(100, heat)}%` }"></span></span>
      <span class="heat-num">{{ heat }}</span>
    </button>

    <button type="button" class="seg cash" :class="{ debt: state.stats.money < 0 }" :title="moneyTitle" @click="openApp('life')">{{ cash }}</button>

    <button type="button" class="seg clock" :title="clockTitle" @click="openApp('schedule')">
      <span class="time">{{ clock }}</span>
      <span class="date">{{ shortDate }}</span>
    </button>
  </div>
</template>

<style scoped>
.tray {
  display: flex;
  align-items: center;
  gap: 2px;
  height: 100%;
  padding: 0 6px 0 8px;
  background: var(--tray-bg);
  border-left: 1px solid var(--tray-border);
  box-shadow: inset 1px 0 1px rgb(255 255 255 / 25%), var(--bevel-field);
  color: var(--tray-fg);
  flex: none;
  font-size: 11px;
}
:root[data-skin='classic'] .tray {
  margin: 3px 2px;
  height: calc(100% - 6px);
  border-left: 0;
}
.seg {
  display: flex;
  align-items: center;
  gap: 4px;
  height: 24px;
  padding: 0 5px;
  border: 0;
  border-radius: 2px;
  background: none;
  color: inherit;
  font: inherit;
  cursor: pointer;
  white-space: nowrap;
}
.seg:hover {
  background: var(--tray-btn-hover);
}
.seg:active {
  background: var(--tray-btn-active);
}
.seg:focus-visible,
.sp:focus-visible {
  outline: 1px dotted currentColor;
  outline-offset: -2px;
}
.emo {
  font-family: var(--font-emoji);
  font-size: 13px;
  line-height: 1;
}
.sep {
  width: 1px;
  height: 18px;
  margin: 0 3px;
  background: rgb(255 255 255 / 35%);
  box-shadow: 1px 0 rgb(0 0 0 / 15%);
}
:root[data-skin='classic'] .sep {
  background: #808080;
  box-shadow: 1px 0 #fff;
}

/* Speed controls */
.speed {
  display: flex;
  gap: 1px;
  padding: 1px;
  border-radius: 3px;
  background: rgb(0 0 40 / 22%);
  box-shadow: inset 0 1px 2px rgb(0 0 0 / 30%);
}
:root[data-skin='classic'] .speed {
  background: none;
  box-shadow: none;
}
.sp {
  min-width: 24px;
  height: 20px;
  padding: 0 4px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 0;
  border-radius: 2px;
  background: none;
  color: inherit;
  font: bold 10px var(--font-ui);
  cursor: pointer;
  box-shadow: var(--bevel-raised);
}
.sp svg {
  width: 10px;
  height: 10px;
  fill: currentColor;
}
.sp:hover:not(:disabled) {
  background: var(--tray-btn-hover);
}
.sp.on {
  background: linear-gradient(#fff6c9, #ffd35c);
  color: #3b2a00;
  box-shadow: inset 0 1px 2px rgb(0 0 0 / 35%);
}
:root[data-skin='classic'] .sp.on {
  background: repeating-conic-gradient(#ffffff 0% 25%, #dfdfdf 0% 50%) 0 0 / 2px 2px;
  color: #000;
  box-shadow: var(--bevel-sunken);
}
.sp-wrap {
  display: inline-flex;
}
.sp-wrap.locked {
  cursor: not-allowed;
}
.sp:disabled {
  opacity: 0.4;
  /* let the wrapper show its "why" tooltip */
  pointer-events: none;
}

/* Activity */
.act-label {
  max-width: 74px;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Vitals */
.vitals {
  gap: 3px;
}
.vital {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1px;
}
.vbar {
  position: relative;
  width: 7px;
  height: 15px;
  border: 1px solid rgb(0 0 0 / 45%);
  background: rgb(255 255 255 / 85%);
  border-radius: 1px;
  overflow: hidden;
}
.vfill {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  transition: height 0.4s linear;
}
.vlabel {
  font-size: 8px;
  line-height: 8px;
  font-weight: bold;
  opacity: 0.9;
}
.vital.warn .vlabel {
  animation: hs-blink 1s steps(1) infinite;
}

/* Heat */
.heat-bar {
  width: 28px;
  height: 7px;
  border: 1px solid rgb(0 0 0 / 45%);
  background: rgb(255 255 255 / 85%);
  border-radius: 1px;
  overflow: hidden;
}
.heat-fill {
  display: block;
  height: 100%;
  transition: width 0.4s linear;
}
.heat-num {
  min-width: 14px;
  font-weight: bold;
  text-align: right;
}
.heat.cold .heat-fill {
  background: #4fb34f;
}
.heat.warm .heat-fill {
  background: #e3c028;
}
.heat.hot .heat-fill {
  background: #ef7d1a;
}
.heat.burning .heat-fill {
  background: #e3261b;
}
.heat.burning {
  background: rgb(220 30 20 / 45%);
  animation: hs-blink 1.2s steps(1) infinite;
}

/* Money */
.cash {
  font-weight: bold;
  font-variant-numeric: tabular-nums;
}
.cash.debt {
  color: #ffd0cc;
  background: rgb(180 20 10 / 45%);
}
:root[data-skin='classic'] .cash.debt {
  color: var(--bad);
  background: none;
}

/* Clock */
.clock {
  flex-direction: column;
  justify-content: center;
  gap: 0;
  line-height: 1.05;
  min-width: 62px;
}
.time {
  font-size: 12px;
  font-weight: bold;
  font-variant-numeric: tabular-nums;
}
.date {
  font-size: 9px;
  opacity: 0.9;
}

/* Confinement badge */
.confine {
  padding: 1px 6px;
  border-radius: 8px;
  font-weight: bold;
  font-size: 10px;
  color: #fff;
  white-space: nowrap;
  margin-right: 4px;
}
.confine.jail {
  background: #8a1c14;
  border: 1px solid #ffb0a8;
}
.confine.hospital {
  background: #b0182b;
  border: 1px solid #fff;
}

@media (max-width: 900px) {
  .act-label,
  .heat-bar {
    display: none;
  }
}
</style>
