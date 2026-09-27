<script setup lang="ts">
/**
 * Life → Money → "Obligations": fines, lawsuits, loan repayments and medical bills the story put
 * on you. Each costs a fixed amount per day (already part of the daily expenses) for a term, or
 * until something in the story settles it.
 */
import { computed } from 'vue'
import { balance, formatShortDate, money } from '@/engine'
import { useGame } from '@/ui/game'

const state = useGame()

interface ObligationRow {
  id: string
  label: string
  perDay: number
  /** Days left on the term; null = open-ended (until settled). */
  left: number | null
  dueDay: number | null
  /** Still owed over the rest of the term; null = open-ended. */
  remaining: number | null
}

const rows = computed<ObligationRow[]>(() =>
  state.obligations
    .map(o => {
      const left = o.untilDay === null ? null : Math.max(0, o.untilDay - state.time.day)
      return { id: o.id, label: o.label, perDay: o.perDay, left, dueDay: o.untilDay, remaining: left === null ? null : o.perDay * left }
    })
    // Fixed terms first (soonest done on top), then the open-ended ones, biggest first.
    .sort((a, b) => {
      if (a.left !== null && b.left !== null) return a.left - b.left
      if (a.left !== null) return -1
      if (b.left !== null) return 1
      return b.perDay - a.perDay
    }),
)

const perDay = computed(() => rows.value.reduce((s, r) => s + r.perDay, 0))
const owedFixed = computed(() => rows.value.reduce((s, r) => s + (r.remaining ?? 0), 0))
const openEnded = computed(() => rows.value.filter(r => r.left === null).length)

function term(r: ObligationRow): string {
  if (r.left === null) return 'until settled'
  if (r.left < balance.DAYS_PER_STEP) return 'ends this week'
  return `${r.left} day${r.left === 1 ? '' : 's'} left`
}
</script>

<template>
  <fieldset class="gbox obligations" :class="{ owing: rows.length > 0 }">
    <legend>Obligations</legend>
    <p v-if="rows.length === 0" class="muted empty">
      No fines, no lawsuits, no loans. Nobody is billing you for your mistakes. Yet.
    </p>
    <template v-else>
      <table class="ledger">
        <thead>
          <tr>
            <th>What you owe</th>
            <th class="num">Per day</th>
            <th>Term</th>
            <th class="num">Still owed</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="r in rows" :key="r.id">
            <td><span class="o-icon" aria-hidden="true">⚖</span> {{ r.label }}</td>
            <td class="num bad">{{ money(r.perDay) }}</td>
            <td :title="r.dueDay !== null ? `Last payment around ${formatShortDate(r.dueDay)}` : 'Open-ended: runs until the story settles it'">
              <span :class="r.left === null ? 'open' : ''">{{ term(r) }}</span>
              <span v-if="r.dueDay !== null" class="muted small"> · to {{ formatShortDate(r.dueDay) }}</span>
            </td>
            <td class="num">
              <template v-if="r.remaining !== null">{{ money(r.remaining) }}</template>
              <span v-else class="muted open">open-ended</span>
            </td>
          </tr>
        </tbody>
        <tfoot>
          <tr>
            <td>Total</td>
            <td class="num bad">{{ money(perDay) }}</td>
            <td class="muted small">{{ money(perDay * balance.DAYS_PER_STEP) }} a week</td>
            <td class="num">
              {{ money(owedFixed) }}<span v-if="openEnded > 0" class="muted small"> + open</span>
            </td>
          </tr>
        </tfoot>
      </table>
      <p v-if="openEnded > 0" class="muted small note">
        Open-ended obligations keep billing until something settles them — pay it off, talk your way out, or get a lawyer
        when the chance comes up.
      </p>
    </template>
  </fieldset>
</template>

<style scoped>
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
.gbox.owing {
  border-color: #e3b9b4;
  background: #fbf3f2;
}
.gbox.owing legend {
  color: var(--bad);
}
.empty {
  font-style: italic;
  margin: 0;
}
.small {
  font-size: 10px;
}
.ledger {
  width: 100%;
  border-collapse: collapse;
  background: var(--panel-bg);
  border: 1px solid #e0dfd3;
  font-size: 11px;
}
.ledger th {
  text-align: left;
  font-weight: normal;
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  color: var(--muted);
  padding: 2px 6px;
  border-bottom: 1px solid #e0dfd3;
  background: #fbfbf7;
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
.ledger tfoot .small {
  font-weight: normal;
}
.o-icon {
  color: var(--bad);
}
.open {
  font-style: italic;
}
.note {
  margin: 4px 0 0;
  font-size: 11px;
}
</style>
