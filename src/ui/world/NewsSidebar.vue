<script setup lang="ts">
/** Herald sidebar: weather, markets, cost of living, and the web poll nobody asked for. */
import { computed, ref, watch } from 'vue'
import { formatShortDate } from '@/engine'
import { useGame } from '@/ui/game'
import { livingCosts, marketQuotes, pollOn, pollResults, weatherOn } from './newsData'

const state = useGame()

const today = computed(() => weatherOn(state.time.day))
const forecast = computed(() => [1, 2].map(d => ({ day: state.time.day + d, w: weatherOn(state.time.day + d) })))
const quotes = computed(() => marketQuotes(state))
const costs = computed(() => livingCosts(state))

const poll = computed(() => pollOn(state.time.day))
const voted = ref<number | null>(null)
watch(
  () => poll.value.id,
  () => {
    voted.value = null
  },
)
const results = computed(() => pollResults(poll.value.id, poll.value.poll.options.length))

function weekday(day: number): string {
  return formatShortDate(day).split(' ').slice(0, 2).join(' ')
}
</script>

<template>
  <aside class="sidebar">
    <section class="box">
      <h4 class="box-title">Port Lumen Weather</h4>
      <div class="wx">
        <div class="wx-icon" aria-hidden="true">{{ today.icon }}</div>
        <div>
          <div class="wx-temp">{{ today.high }}°F</div>
          <div class="wx-cond">{{ today.label }} · low {{ today.low }}°</div>
        </div>
      </div>
      <p class="wx-quip">{{ today.quip }}</p>
      <div class="fc">
        <div v-for="f in forecast" :key="f.day" class="fc-day" :title="f.w.quip">
          <div class="muted">{{ weekday(f.day) }}</div>
          <div><span aria-hidden="true">{{ f.w.icon }}</span> {{ f.w.high }}°/{{ f.w.low }}°</div>
        </div>
      </div>
    </section>

    <section class="box">
      <h4 class="box-title">Markets</h4>
      <table class="quotes">
        <tbody>
          <tr v-for="q in quotes" :key="q.sym" :title="q.name">
            <td class="sym">{{ q.sym }}</td>
            <template v-if="q.price !== null">
              <td class="px">{{ q.price.toFixed(2) }}</td>
              <td class="chg" :class="q.change >= 0 ? 'good' : 'bad'">
                {{ q.change >= 0 ? '▲' : '▼' }}{{ Math.abs(q.change * 100).toFixed(1) }}%
              </td>
            </template>
            <td v-else colspan="2" class="note muted">{{ q.note }}</td>
          </tr>
        </tbody>
      </table>
      <div class="muted tiny">Quotes delayed 20 minutes. Not investment advice.</div>
    </section>

    <section class="box">
      <h4 class="box-title">Cost of Living</h4>
      <div v-for="c in costs" :key="c.label" class="cost">
        <span>{{ c.label }}</span>
        <span :class="c.index > 100 ? 'bad' : c.index < 100 ? 'good' : 'muted'">{{ c.index }}</span>
      </div>
      <div class="muted tiny">Index, Sept. 2001 = 100</div>
    </section>

    <section class="box">
      <h4 class="box-title">Herald Web Poll</h4>
      <p class="poll-q">{{ poll.poll.q }}</p>
      <template v-if="voted === null">
        <button v-for="(o, i) in poll.poll.options" :key="i" type="button" class="poll-opt" @click="voted = i">
          ○ {{ o }}
        </button>
      </template>
      <div v-else class="poll-res">
        <div v-for="(o, i) in poll.poll.options" :key="i" class="poll-row" :class="{ mine: voted === i }">
          <div class="poll-label">{{ o }} <b>{{ results[i] }}%</b></div>
          <div class="poll-bar"><div :style="{ width: `${results[i] ?? 0}%` }"></div></div>
        </div>
        <div class="muted tiny">Thanks for voting! Not a scientific poll.</div>
      </div>
    </section>
  </aside>
</template>

<style scoped>
.sidebar {
  width: 176px;
  flex: none;
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-height: 0;
  overflow-y: auto;
  scrollbar-width: thin;
}
.box {
  flex: none;
}
.box {
  background: var(--panel-bg);
  border: 1px solid var(--herald-rule, var(--panel-border));
  font-size: 11px;
}
.box-title {
  background: var(--herald-navy, var(--info));
  color: var(--sel-fg);
  font-size: 11px;
  padding: 2px 6px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.wx {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 6px 2px;
}
.wx-icon {
  font-size: 28px;
  width: 34px;
  text-align: center;
  color: var(--info);
}
.wx-temp {
  font-size: 18px;
  font-weight: bold;
  font-family: Georgia, 'Times New Roman', serif;
}
.wx-cond {
  color: var(--muted);
}
.wx-quip {
  margin: 0;
  padding: 2px 6px 6px;
  font-style: italic;
  line-height: 1.35;
}
.fc {
  display: flex;
  border-top: 1px solid var(--panel-border);
}
.fc-day {
  flex: 1;
  padding: 3px 6px;
  text-align: center;
}
.fc-day + .fc-day {
  border-left: 1px solid var(--panel-border);
}
.quotes {
  width: 100%;
  border-collapse: collapse;
  font-family: var(--font-mono);
  font-size: 10px;
}
.quotes td {
  padding: 2px 4px;
  border-bottom: 1px dotted var(--panel-border);
}
.sym {
  font-weight: bold;
}
.px,
.chg {
  text-align: right;
}
.note {
  text-align: right;
  font-family: var(--font-ui);
  font-style: italic;
}
.tiny {
  font-size: 9px;
  padding: 3px 6px;
}
.cost {
  display: flex;
  justify-content: space-between;
  padding: 2px 6px;
  border-bottom: 1px dotted var(--panel-border);
}
.cost span:last-child {
  font-family: var(--font-mono);
  font-weight: bold;
}
.poll-q {
  margin: 0;
  padding: 6px 6px 2px;
  font-weight: bold;
  line-height: 1.3;
}
.poll-opt {
  display: block;
  width: 100%;
  text-align: left;
  font: inherit;
  background: none;
  border: none;
  padding: 2px 6px;
  color: var(--info);
  cursor: pointer;
}
.poll-opt:hover {
  text-decoration: underline;
}
.poll-opt:focus-visible {
  outline: 1px dotted var(--sel-bg);
}
.poll-res {
  padding: 2px 0 0;
}
.poll-row {
  padding: 2px 6px;
}
.poll-row.mine .poll-label {
  color: var(--info);
}
.poll-label {
  display: flex;
  justify-content: space-between;
  gap: 4px;
}
.poll-bar {
  height: 6px;
  background: var(--panel-alt);
  border: 1px solid var(--panel-border);
}
.poll-bar div {
  height: 100%;
  background: var(--herald-navy, var(--info));
}
</style>
