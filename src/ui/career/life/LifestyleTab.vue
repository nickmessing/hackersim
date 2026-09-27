<script setup lang="ts">
/** Life → Lifestyle: food & living standard (daily cost vs. health / mood / stress). */
import { computed } from 'vue'
import { C, modMult, money, setLifestyle, signed } from '@/engine'
import { worldMult } from '@/engine/mods'
import { useGame } from '@/ui/game'
import RichText from '@/ui/components/RichText.vue'
import ReqList from '../ReqList.vue'
import { condMet } from '../reqs'

const state = useGame()
const deepDebt = computed(() => state.flags['sys.deep_debt'] === true)

const options = computed(() =>
  [...C.lifestyles.values()]
    .sort((a, b) => a.costPerDay - b.costPerDay)
    .map(l => {
      const here = l.id === state.lifestyle
      const reqOk = condMet(state, l.req)
      const cost = Math.round(l.costPerDay * worldMult(state, 'w.prices') * modMult(state, 'expenses'))
      return { l, here, reqOk, cost }
    }),
)

function tone(n: number, goodIfPositive: boolean): string {
  if (Math.abs(n) < 0.001) return 'muted'
  return n > 0 === goodIfPositive ? 'good' : 'bad'
}
function fmt(n: number): string {
  return Math.abs(n) < 0.001 ? '±0' : signed(n, Math.abs(n) < 1 ? 1 : 0)
}
</script>

<template>
  <div class="lifestyle">
    <p class="muted intro">What you eat and how you live. Applied every midnight — cheap living saves money but wears you down.</p>
    <div v-if="deepDebt" class="alert">
      ⚠ You're deep in debt: each night you're forced back onto the cheapest option until your balance recovers.
    </div>
    <div v-if="options.length === 0" class="muted empty">The fridge is empty and so is this list.</div>
    <table v-else class="table ls">
      <thead>
        <tr>
          <th>Option</th>
          <th class="num">Cost/day</th>
          <th class="num">Health</th>
          <th class="num">Mood</th>
          <th class="num">Stress</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="o in options" :key="o.l.id" :class="{ here: o.here, locked: !o.reqOk && !o.here }">
          <td class="opt">
            <b>{{ o.l.name }}</b>
            <div class="desc muted"><RichText :text="o.l.desc" /></div>
            <ReqList v-if="o.l.req && !o.here" :cond="o.l.req" compact />
          </td>
          <td class="num">{{ o.cost > 0 ? money(o.cost) : 'Free' }}</td>
          <td class="num" :class="tone(o.l.healthPerDay, true)">{{ fmt(o.l.healthPerDay) }}</td>
          <td class="num" :class="tone(o.l.moodPerDay, true)">{{ fmt(o.l.moodPerDay) }}</td>
          <td class="num" :class="tone(o.l.stressPerDay, false)">{{ fmt(o.l.stressPerDay) }}</td>
          <td class="act">
            <span v-if="o.here" class="pill good">Current</span>
            <button v-else type="button" class="btn small" :disabled="!o.reqOk" @click="setLifestyle(state, o.l.id)">Switch</button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.lifestyle {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.intro {
  font-size: 11px;
  margin: 0;
}
.alert {
  padding: 4px 8px;
  color: var(--bad);
  background: #fbeceb;
  border: 1px solid #efc5c1;
}
.empty {
  font-style: italic;
}
.ls {
  border: 1px solid var(--panel-border);
  font-size: 11px;
}
.ls td {
  vertical-align: top;
}
.ls .num {
  text-align: right;
  white-space: nowrap;
  font-family: var(--font-mono);
}
.ls th.num {
  font-family: var(--font-ui);
}
.ls tr.here td {
  background: #f1f9f1;
}
.ls tr.locked td {
  color: var(--muted);
}
.opt {
  min-width: 200px;
}
.desc {
  font-size: 10px;
}
.desc :deep(p) {
  margin: 0;
}
.act {
  text-align: right;
  width: 70px;
}
</style>
