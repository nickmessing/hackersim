<script setup lang="ts">
/**
 * "Operation Debrief" — a retro report window over the Ops app, shown once per finished hack op
 * (state.lastReport) unless the Terminal already presented its own end-of-op summary.
 */
import { computed, nextTick, ref, watch } from 'vue'
import { money } from '@/engine'
import { useGame } from '@/ui/game'
import { OUTCOME_INFO, complicationTitle, debriefSeen, markDebriefSeen } from './debrief'

const state = useGame()
const okBtn = ref<HTMLButtonElement | null>(null)

const report = computed(() => {
  const r = state.lastReport
  if (!r || debriefSeen(r.uid)) return null
  return r
})
const info = computed(() => (report.value ? OUTCOME_INFO[report.value.report.outcome] : null))
const complication = computed(() => {
  const id = report.value?.report.complication
  return id ? (complicationTitle(id) ?? 'Somebody is pulling on a thread') : null
})

function dismiss(): void {
  const r = report.value
  if (r) markDebriefSeen(state, r.uid)
}

watch(
  () => report.value?.uid,
  uid => {
    if (uid !== undefined) void nextTick(() => okBtn.value?.focus())
  },
  { immediate: true },
)
</script>

<template>
  <div v-if="report && info" class="debrief-veil" role="dialog" aria-modal="true" aria-labelledby="debrief-title" @keydown.esc="dismiss">
    <div class="debrief" :class="info.tone">
      <div class="db-bar">
        <span id="debrief-title">📁 Operation Debrief</span>
        <button type="button" class="db-x" aria-label="Close debrief" @click="dismiss">✕</button>
      </div>
      <div class="db-body">
        <div class="db-file mono">FILE #{{ String(report.uid).padStart(4, '0') }} · {{ report.title }}</div>
        <div class="db-stamp" :class="info.tone">
          <span class="db-head">{{ info.headline }}</span>
          <span v-if="info.tag" class="db-tag">{{ info.tag }}</span>
        </div>
        <p class="db-blurb">{{ info.blurb }}</p>
        <dl class="db-stats">
          <div>
            <dt>💰 Pay</dt>
            <dd :class="report.report.pay > 0 ? 'money' : 'muted'">{{ report.report.pay > 0 ? `+${money(report.report.pay)}` : 'nothing' }}</dd>
          </div>
          <div title="Heat raises raid risk. It cools off week by week.">
            <dt>🔥 Heat</dt>
            <dd :class="report.report.heat > 5 ? 'bad' : ''">{{ report.report.heat > 0 ? `+${report.report.heat.toFixed(1)}` : '±0' }}</dd>
          </div>
          <div title="Underground reputation — unlocks higher hack tiers.">
            <dt>★ Cred</dt>
            <dd :class="report.report.cred < 0 ? 'bad' : 'good'">{{ report.report.cred > 0 ? '+' : '' }}{{ report.report.cred.toFixed(1) }}</dd>
          </div>
        </dl>
        <ul v-if="report.report.notes.length" class="db-notes">
          <li v-for="(n, i) in report.report.notes" :key="i">{{ n }}</li>
        </ul>
        <div v-if="complication" class="db-comp" role="alert">
          <b>⚠ Complication:</b> {{ complication }}. This isn't over — watch your inbox.
        </div>
      </div>
      <div class="db-foot">
        <button ref="okBtn" type="button" class="btn primary" @click="dismiss">File report</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.debrief-veil {
  position: absolute;
  inset: 0;
  z-index: 20;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgb(0 0 0 / 35%);
  padding: 12px;
}
.debrief {
  width: min(420px, 100%);
  max-height: 100%;
  display: flex;
  flex-direction: column;
  border: 1px solid var(--panel-border);
  border-radius: var(--radius);
  background: var(--win-bg);
  box-shadow: 0 8px 28px rgb(0 0 0 / 45%);
  overflow: hidden;
  animation: db-in 0.18s ease-out;
}
@keyframes db-in {
  from {
    transform: translateY(8px) scale(0.98);
    opacity: 0;
  }
  to {
    transform: none;
    opacity: 1;
  }
}
.db-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 3px 6px;
  font-weight: bold;
  color: #fff;
  background: linear-gradient(#2d4f8e, #1b3566);
}
.debrief.bad .db-bar {
  background: linear-gradient(#8e2d2d, #5e1616);
}
.debrief.good .db-bar {
  background: linear-gradient(#2d7a45, #185a2d);
}
.db-x {
  font: inherit;
  border: 1px solid rgb(255 255 255 / 50%);
  background: rgb(255 255 255 / 12%);
  color: #fff;
  border-radius: 2px;
  width: 20px;
  height: 18px;
  line-height: 1;
  cursor: pointer;
}
.db-body {
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  overflow: auto;
  background:
    repeating-linear-gradient(0deg, transparent 0 21px, color-mix(in srgb, var(--info) 8%, transparent) 21px 22px),
    var(--panel-bg);
}
.db-file {
  font-size: 11px;
  color: var(--muted);
}
.db-stamp {
  align-self: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 4px 18px;
  border: 3px double currentcolor;
  border-radius: 4px;
  transform: rotate(-4deg);
  font-family: var(--font-mono);
  letter-spacing: 3px;
  animation: stamp 0.35s cubic-bezier(0.2, 1.6, 0.4, 1);
}
.db-stamp.good {
  color: var(--good);
}
.db-stamp.warn {
  color: var(--warn);
}
.db-stamp.bad {
  color: var(--bad);
}
@keyframes stamp {
  from {
    transform: rotate(-4deg) scale(1.8);
    opacity: 0;
  }
  to {
    transform: rotate(-4deg) scale(1);
    opacity: 1;
  }
}
.db-head {
  font-size: 26px;
  font-weight: bold;
}
.db-tag {
  font-size: 10px;
  letter-spacing: 1px;
  text-transform: uppercase;
}
.db-blurb {
  margin: 0;
  text-align: center;
  font-style: italic;
  color: var(--muted);
}
.db-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;
  margin: 0;
}
.db-stats > div {
  border: 1px solid var(--panel-border);
  border-radius: var(--radius);
  background: var(--panel-alt);
  padding: 4px 6px;
  text-align: center;
  cursor: help;
}
.db-stats dt {
  font-size: 10px;
  color: var(--muted);
}
.db-stats dd {
  margin: 0;
  font-size: 15px;
  font-weight: bold;
}
.db-notes {
  margin: 0;
  padding-left: 18px;
  font-size: 12px;
  line-height: 1.45;
}
.db-comp {
  padding: 5px 8px;
  border: 1px solid var(--bad);
  border-radius: var(--radius);
  background: color-mix(in srgb, var(--bad) 10%, var(--panel-bg));
  font-size: 12px;
}
.db-foot {
  display: flex;
  justify-content: flex-end;
  padding: 6px 10px;
  border-top: 1px solid var(--panel-border);
  background: var(--panel-alt);
}
</style>
