<script setup lang="ts">
/** Track record: per-contract (story) and per-template (board) results plus lifetime totals. */
import { computed } from 'vue'
import { C, money, pct, type ContractKind } from '@/engine'
import { useGame } from '@/ui/game'
import { KIND_INFO } from './opsKit'

const state = useGame()

interface HistRow {
  key: string
  title: string
  example: string
  kind: ContractKind | null
  story: boolean
  done: number
  failed: number
  total: number
  rate: number
}

const rows = computed<HistRow[]>(() =>
  Object.entries(state.contracts.history)
    .map(([key, h]): HistRow => {
      const total = h.done + h.failed
      const base = { key, done: h.done, failed: h.failed, total, rate: total > 0 ? h.done / total : 0 }
      if (key.startsWith('tpl:')) {
        const tpl = C.contractTemplates.get(key.slice(4))
        return {
          ...base,
          title: tpl ? `${KIND_INFO[tpl.kind].label} jobs · Tier ${tpl.tier}` : 'Board jobs',
          example: tpl?.titles[0]?.replace(/\{target\}/g, '…') ?? '',
          kind: tpl?.kind ?? null,
          story: false,
        }
      }
      const def = C.contracts.get(key)
      return { ...base, title: def?.title ?? key, example: def ? `for ${def.client}` : '', kind: def?.kind ?? null, story: true }
    })
    .sort((a, b) => Number(b.story) - Number(a.story) || b.total - a.total || a.title.localeCompare(b.title)),
)

const sum = computed(() => rows.value.reduce((s, r) => ({ done: s.done + r.done, failed: s.failed + r.failed }), { done: 0, failed: 0 }))
const t = computed(() => state.totals)
const hackRate = computed(() => {
  const n = t.value.hacksDone + t.value.hacksFailed
  return n > 0 ? t.value.hacksDone / n : null
})
</script>

<template>
  <div class="history">
    <div class="cards">
      <div class="card" title="Hack contracts completed / blown">
        <div class="c-label">💀 Hacks</div>
        <div class="c-val">
          <b class="good">{{ t.hacksDone }}</b> <span class="muted">/</span> <b class="bad">{{ t.hacksFailed }}</b>
        </div>
        <div class="c-sub muted">{{ hackRate === null ? 'no record yet' : `${pct(hackRate)} clean` }}</div>
      </div>
      <div class="card" title="Freelance gigs delivered">
        <div class="c-label">💻 Gigs</div>
        <div class="c-val"><b class="good">{{ t.gigsDone }}</b></div>
        <div class="c-sub muted">delivered</div>
      </div>
      <div class="card" title="Times the police came knocking">
        <div class="c-label">🚔 Raids</div>
        <div class="c-val"><b :class="t.raids > 0 ? 'bad' : ''">{{ t.raids }}</b></div>
        <div class="c-sub muted">{{ t.daysJailed }} day{{ t.daysJailed === 1 ? '' : 's' }} in custody</div>
      </div>
      <div class="card" title="Total money earned from every source">
        <div class="c-label">💰 Earned</div>
        <div class="c-val"><b class="money">{{ money(t.earned) }}</b></div>
        <div class="c-sub muted">lifetime, all sources</div>
      </div>
    </div>

    <div class="scroll tbl-wrap">
      <table v-if="rows.length > 0" class="table">
        <thead>
          <tr>
            <th>Contract</th>
            <th class="n">Done</th>
            <th class="n">Failed</th>
            <th class="n">Success</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="r in rows" :key="r.key">
            <td>
              <span v-if="r.kind" class="k">{{ KIND_INFO[r.kind].icon }}</span>
              <span v-if="r.story" class="pill story">★</span>
              <b>{{ r.title }}</b>
              <div v-if="r.example" class="muted ex">{{ r.story ? r.example : `e.g. “${r.example}”` }}</div>
            </td>
            <td class="n good">{{ r.done }}</td>
            <td class="n" :class="{ bad: r.failed > 0 }">{{ r.failed }}</td>
            <td class="n">{{ pct(r.rate) }}</td>
          </tr>
        </tbody>
        <tfoot>
          <tr>
            <th>Total</th>
            <th class="n">{{ sum.done }}</th>
            <th class="n">{{ sum.failed }}</th>
            <th class="n">{{ sum.done + sum.failed > 0 ? pct(sum.done / (sum.done + sum.failed)) : '—' }}</th>
          </tr>
        </tfoot>
      </table>
      <div v-else class="empty">Your record is spotless. Suspiciously spotless.</div>
    </div>
  </div>
</template>

<style scoped>
.history {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-height: 0;
  flex: 1;
}
.cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(110px, 1fr));
  gap: 6px;
}
.card {
  border: 1px solid var(--panel-border);
  border-radius: var(--radius);
  background: var(--panel-bg);
  padding: 5px 8px;
  cursor: help;
}
.c-label {
  font-size: 11px;
  color: var(--info);
  font-weight: bold;
}
.c-val {
  font-size: 16px;
}
.c-sub {
  font-size: 10px;
}
.tbl-wrap {
  border: 1px solid var(--panel-border);
  background: var(--panel-bg);
}
.n {
  width: 64px;
  text-align: center !important;
}
.k {
  margin-right: 4px;
}
.pill {
  margin-right: 4px;
}
.ex {
  font-size: 11px;
}
tfoot th {
  border-top: 1px solid var(--panel-border);
  font-weight: bold;
}
.empty {
  padding: 24px;
  text-align: center;
  color: var(--muted);
  font-style: italic;
}
</style>
