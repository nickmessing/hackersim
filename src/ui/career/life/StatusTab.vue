<script setup lang="ts">
/** Life → Status: vitals with explanations, efficiency breakdown, active buffs/debuffs. */
import { computed } from 'vue'
import { efficiency, pct } from '@/engine'
import { useGame } from '@/ui/game'
import ProgressBar from '@/ui/components/ProgressBar.vue'
import ModPills from '../ModPills.vue'
import { efficiencyFactors, vitals } from './vitals'

const state = useGame()
const rows = computed(() => vitals(state))
const eff = computed(() => efficiency(state))
const factors = computed(() => efficiencyFactors(state))
const buffs = computed(() =>
  [...state.buffs]
    .map(b => ({ ...b, left: Math.max(0, b.untilDay - state.time.day) }))
    .sort((a, b) => Number(b.bad ?? false) - Number(a.bad ?? false) || a.left - b.left),
)
const effTone = computed(() => (eff.value >= 0.9 ? 'good' : eff.value >= 0.6 ? 'warn' : 'bad'))
</script>

<template>
  <div class="status">
    <fieldset class="gbox">
      <legend>Vitals</legend>
      <div v-for="v in rows" :key="v.id" class="vital">
        <span class="v-label">{{ v.label }}</span>
        <ProgressBar class="v-bar" :value="v.value / 100" :color="v.color" :height="12" />
        <span class="v-num"><b>{{ Math.round(v.value) }}</b><span class="muted">/100</span></span>
        <span class="v-side" :title="v.sideTitle">{{ v.side }}</span>
        <span class="v-note" :class="v.tone">{{ v.note }}</span>
      </div>
    </fieldset>

    <div class="split">
      <fieldset class="gbox eff">
        <legend>Efficiency</legend>
        <div class="eff-top">
          <span class="eff-num" :class="effTone">{{ pct(eff) }}</span>
          <span class="muted">Scales study XP, job experience and contract progress.</span>
        </div>
        <table class="eff-table">
          <tbody>
            <tr v-for="f in factors" :key="f.label">
              <td>{{ f.label }}</td>
              <td class="num" :class="f.value < 0.999 ? (f.value < 0.75 ? 'bad' : 'warn') : f.value > 1.001 ? 'good' : ''">×{{ f.value.toFixed(2) }}</td>
              <td class="muted note">{{ f.note }}</td>
            </tr>
          </tbody>
        </table>
      </fieldset>

      <fieldset class="gbox buffs">
        <legend>Active effects</legend>
        <p v-if="buffs.length === 0" class="muted empty">Nothing unusual. Just you, the hum of the CRT and a slightly sticky keyboard.</p>
        <div v-for="b in buffs" :key="b.id" class="buff" :class="{ bad: b.bad }">
          <div class="b-head">
            <span class="b-icon" aria-hidden="true">{{ b.bad ? '▼' : '▲' }}</span>
            <b>{{ b.name }}</b>
            <span class="grow"></span>
            <span class="pill" :class="b.bad ? 'bad' : 'good'">{{ b.left <= 0 ? 'wears off tonight' : `${b.left} day${b.left === 1 ? '' : 's'} left` }}</span>
          </div>
          <div v-if="b.desc" class="b-desc muted">{{ b.desc }}</div>
          <ModPills :mods="b.mods" :source="b.name" />
        </div>
      </fieldset>
    </div>
  </div>
</template>

<style scoped>
.status {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.gbox {
  margin: 0;
  border: 1px solid #d0d0bf;
  border-radius: var(--radius);
  padding: 4px 8px 8px;
  background: var(--panel-alt);
  min-width: 0;
}
.gbox legend {
  color: var(--info);
  font-weight: bold;
  padding: 0 4px;
}
.vital {
  display: grid;
  grid-template-columns: 50px 120px 48px 54px 1fr;
  align-items: center;
  gap: 2px 8px;
  padding: 3px 0;
  border-bottom: 1px dotted #deddcf;
}
.vital:last-child {
  border-bottom: none;
}
.v-label {
  font-weight: bold;
}
.v-num {
  font-size: 11px;
  text-align: right;
  white-space: nowrap;
}
.v-side {
  font: 11px var(--font-mono);
  text-align: right;
  cursor: help;
}
.v-note {
  font-size: 11px;
  line-height: 1.3;
}
.split {
  display: flex;
  gap: 8px;
  align-items: stretch;
}
.eff {
  flex: 1;
}
.buffs {
  flex: 1.1;
  display: flex;
  flex-direction: column;
  gap: 5px;
}
.eff-top {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 4px;
}
.eff-num {
  font-size: 26px;
  font-weight: bold;
  font-family: var(--font-ui);
  line-height: 1;
}
.eff-top .muted {
  font-size: 11px;
}
.eff-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 11px;
}
.eff-table td {
  padding: 2px 4px;
  border-top: 1px solid #e6e5da;
}
.eff-table .num {
  font-family: var(--font-mono);
  text-align: right;
  width: 50px;
}
.eff-table .note {
  font-size: 10px;
}
.empty {
  font-style: italic;
  margin: 0;
}
.buff {
  border: 1px solid #c3e3c3;
  background: #f4fbf4;
  border-radius: var(--radius);
  padding: 4px 6px;
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.buff.bad {
  border-color: #efc5c1;
  background: #fdf4f3;
}
.b-head {
  display: flex;
  align-items: center;
  gap: 5px;
}
.b-icon {
  font-size: 9px;
  color: var(--good);
}
.buff.bad .b-icon {
  color: var(--bad);
}
.b-desc {
  font-size: 11px;
}
</style>
