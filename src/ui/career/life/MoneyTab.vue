<script setup lang="ts">
/**
 * Life → Money: balance, daily expenses breakdown (obligations marked), income estimate, runway and
 * debt warnings, and the Obligations panel (fines, lawsuits, loans, bills).
 */
import { computed } from 'vue'
import { balance, C, countSlots, dailyPay, expenseBreakdown, money } from '@/engine'
import { useGame } from '@/ui/game'
import { openApp } from '@/ui/wm'
import ObligationsPanel from './ObligationsPanel.vue'

const state = useGame()

const expenses = computed(() => expenseBreakdown(state))
const expenseTotal = computed(() => expenses.value.reduce((s, l) => s + l.amount, 0))
/** Expense lines with the ones that come from `state.obligations` marked. */
const ledger = computed(() => {
  const pool = state.obligations.map(o => ({ label: o.label, amount: Math.round(o.perDay) }))
  return expenses.value.map(l => {
    const i = pool.findIndex(p => p.label === l.label && p.amount === l.amount)
    if (i >= 0) pool.splice(i, 1)
    return { ...l, obligation: i >= 0 }
  })
})

const income = computed(() => {
  const lines: { label: string; amount: number; note: string }[] = []
  const job = state.job ? C.jobs.get(state.job) : undefined
  if (job) {
    const worked = Math.min(countSlots(state, 'work'), job.hours)
    const blocked = state.jail !== null || state.hospital !== null
    const pay = blocked || job.hours <= 0 ? 0 : Math.round((dailyPay(state, job) * worked) / job.hours)
    lines.push({ label: `Salary: ${job.title}`, amount: pay, note: blocked ? 'not while you are away' : `${worked}h shift` })
  }
  return lines
})
const incomeTotal = computed(() => income.value.reduce((s, l) => s + l.amount, 0))
const net = computed(() => incomeTotal.value - expenseTotal.value)

const pending = computed(() =>
  state.contracts.active.map(c => ({ uid: c.uid, title: c.title, kind: c.kind, pay: c.pay, ready: c.status === 'ready' })),
)

const m = computed(() => state.stats.money)
const daysInDebt = computed(() => state.vars['sys.daysInDebt'] ?? 0)
const runway = computed(() => (net.value < 0 && m.value > 0 ? Math.floor(m.value / -net.value) : null))

const alert = computed<{ tone: 'bad' | 'warn'; title: string; text: string } | null>(() => {
  if (m.value < balance.DEBT_LIMIT)
    return {
      tone: 'bad',
      title: 'Deep in debt',
      text: `You're past ${money(balance.DEBT_LIMIT)}. Every night you fall back to the cheapest food, and stress and mood take a hit. ${daysInDebt.value} day${daysInDebt.value === 1 ? '' : 's'} in the red.`,
    }
  if (m.value < 0)
    return {
      tone: 'bad',
      title: 'In the red',
      text: `Overdrawn for ${daysInDebt.value} day${daysInDebt.value === 1 ? '' : 's'}: +2 stress and −2 mood every night. Below ${money(balance.DEBT_LIMIT)} you lose your food budget too.`,
    }
  if (runway.value !== null && runway.value < 10)
    return { tone: 'warn', title: 'Money is running out', text: `At this rate you're broke in about ${runway.value} day${runway.value === 1 ? '' : 's'}.` }
  return null
})
</script>

<template>
  <div class="money-tab">
    <div class="balance" :class="{ neg: m < 0 }">
      <div>
        <div class="bal-label">Checking account</div>
        <div class="bal-num">{{ money(m) }}</div>
      </div>
      <div class="bal-net">
        <div class="bal-label">Net per day <span class="muted">(estimate)</span></div>
        <div class="net-num" :class="net >= 0 ? 'good' : 'bad'">{{ net >= 0 ? '+' : '−' }}{{ money(Math.abs(net)) }}</div>
        <div v-if="runway !== null" class="muted small">≈ {{ runway }} days until broke</div>
      </div>
    </div>

    <div v-if="alert" class="alert" :class="alert.tone" role="status">
      <b>⚠ {{ alert.title }}.</b> {{ alert.text }}
    </div>

    <div class="split">
      <fieldset class="gbox">
        <legend>Daily expenses</legend>
        <table class="ledger">
          <tbody>
            <tr v-for="(l, i) in ledger" :key="i" :class="{ obl: l.obligation }" :title="l.obligation ? 'Obligation — see the Obligations panel below' : undefined">
              <td><span v-if="l.obligation" class="o-icon" aria-hidden="true">⚖ </span>{{ l.label }}</td>
              <td class="num">{{ money(l.amount) }}</td>
            </tr>
            <tr v-if="expenses.length === 0">
              <td colspan="2" class="muted empty">Nothing. Living rent-free has its perks.</td>
            </tr>
          </tbody>
          <tfoot>
            <tr>
              <td>Total per day <span class="muted small">· billed weekly, {{ money(expenseTotal * balance.DAYS_PER_STEP) }}</span></td>
              <td class="num bad">{{ money(expenseTotal) }}</td>
            </tr>
          </tfoot>
        </table>
      </fieldset>

      <fieldset class="gbox">
        <legend>Income</legend>
        <table class="ledger">
          <tbody>
            <tr v-for="(l, i) in income" :key="i">
              <td>{{ l.label }} <span class="muted small">· {{ l.note }}</span></td>
              <td class="num">{{ money(l.amount) }}</td>
            </tr>
            <tr v-if="income.length === 0">
              <td colspan="2" class="muted empty">
                No steady paycheck. <a href="#" @click.prevent="openApp('jobs')">Browse the job board</a>
              </td>
            </tr>
          </tbody>
          <tfoot>
            <tr>
              <td>Steady income per day</td>
              <td class="num good">{{ money(incomeTotal) }}</td>
            </tr>
          </tfoot>
        </table>
        <div v-if="pending.length" class="pending">
          <div class="muted small">Payouts on completion:</div>
          <div v-for="p in pending" :key="p.uid" class="pend-row">
            <span class="pill" :class="p.kind === 'hack' ? 'story' : 'info'">{{ p.kind === 'hack' ? 'Hack' : 'Gig' }}</span>
            <span class="grow">{{ p.title }}<span v-if="p.ready" class="good"> · ready</span></span>
            <span class="money">{{ money(p.pay) }}</span>
          </div>
        </div>
      </fieldset>
    </div>

    <ObligationsPanel />

    <fieldset class="gbox">
      <legend>Lifetime</legend>
      <div class="life-row">
        <span>Earned <b class="money">{{ money(state.totals.earned) }}</b></span>
        <span>Spent <b :class="{ bad: state.totals.spent > 0 }">{{ money(state.totals.spent) }}</b></span>
        <span>Gigs finished <b>{{ state.totals.gigsDone }}</b></span>
        <span>Contracts pulled off <b>{{ state.totals.hacksDone }}</b></span>
      </div>
    </fieldset>
  </div>
</template>

<style scoped>
.money-tab {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.balance {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 12px;
  padding: 8px 12px;
  border: 1px solid var(--panel-border);
  border-radius: var(--radius);
  background: linear-gradient(#fff, #eef6ef);
}
.balance.neg {
  background: linear-gradient(#fff, #fbeceb);
}
.bal-label {
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--muted);
}
.bal-num {
  font-size: 28px;
  font-weight: bold;
  color: var(--money);
  line-height: 1.1;
}
.balance.neg .bal-num {
  color: var(--bad);
}
.bal-net {
  text-align: right;
}
.net-num {
  font-size: 18px;
  font-weight: bold;
}
.small {
  font-size: 10px;
}
.alert {
  padding: 5px 8px;
  border: 1px solid;
  border-radius: var(--radius);
}
.alert.bad {
  color: var(--bad);
  background: #fbeceb;
  border-color: #efc5c1;
}
.alert.warn {
  color: var(--warn);
  background: #fdf3e2;
  border-color: #f0d6a8;
}
.split {
  display: flex;
  gap: 8px;
  align-items: flex-start;
}
.split > .gbox {
  flex: 1;
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
.ledger {
  width: 100%;
  border-collapse: collapse;
  background: var(--panel-bg);
  border: 1px solid #e0dfd3;
  font-size: 11px;
}
.ledger td {
  padding: 3px 6px;
  border-bottom: 1px dotted #e0dfd3;
}
.ledger .num {
  text-align: right;
  font-family: var(--font-mono);
  white-space: nowrap;
}
.ledger tfoot td {
  font-weight: bold;
  border-top: 1px solid #c8c6b6;
  background: #fbfbf7;
}
.empty {
  font-style: italic;
}
.ledger tfoot .small {
  font-weight: normal;
}
.ledger tr.obl td {
  color: var(--bad);
}
.o-icon {
  font-size: 10px;
}
.pending {
  margin-top: 6px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-size: 11px;
}
.pend-row {
  display: flex;
  align-items: center;
  gap: 5px;
}
.life-row {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 18px;
}
</style>
