<script setup lang="ts">
/**
 * An accepted contract. Gigs: work progress, what advances it and ETA (they deliver on their own).
 * Hacks: recon prep toward the milestones, the deadline window, and the two ways to run the op —
 * by hand in the Terminal (no roll) or scripted (a visible d20 roll at a penalty).
 */
import { computed, onBeforeUnmount, ref } from 'vue'
import { abandonContract, balance, money, pct, prepPerks, resolveContract, scriptChance, scriptOp, type ContractInstance, type ContractResult } from '@/engine'
import ProgressBar from '@/ui/components/ProgressBar.vue'
import { useGame } from '@/ui/game'
import { openApp } from '@/ui/wm'
import { chanceTone } from '@/ui/story/storyKit'
import {
  APPROACH_INFO,
  KIND_INFO,
  PREP_MILESTONES,
  activityLabel,
  chanceTooltip,
  daysLabel,
  deadlineDaysLeft,
  deadlineLabel,
  forecast,
  forecastTooltip,
  heatTooltip,
  prepDays,
  prepFraction,
  scriptTooltip,
  workHoursLabel,
} from './opsKit'

const props = defineProps<{
  contract: ContractInstance
  /** Title of the contract of the same kind that is worked first (this one waits). */
  queuedBehind?: string
}>()
const emit = defineEmits<{ resolved: [title: string, result: ContractResult] }>()

const state = useGame()
const confirming = ref(false)
let confirmTimer = 0
const confirmingScript = ref(false)
let scriptTimer = 0
const SCRIPT_PAY = balance.SCRIPT_PAY_MULT

const kind = computed(() => KIND_INFO[props.contract.kind])
const act = computed(() => activityLabel(props.contract.kind))
const f = computed(() => forecast(state, props.contract))
const isHack = computed(() => props.contract.kind === 'hack')
/** Legacy save state only: gigs now deliver themselves when the work is done. */
const ready = computed(() => !isHack.value && props.contract.status === 'ready')
const progress = computed(() => (f.value.total > 0 ? props.contract.progress / f.value.total : 1))

// Hack-only view model.
const prep = computed(() => prepFraction(props.contract))
const perks = computed(() => prepPerks(props.contract))
const prepEta = computed(() => prepDays(state, props.contract))
const deadlineDays = computed(() => deadlineDaysLeft(state, props.contract))
const deadline = computed(() => deadlineLabel(deadlineDays.value))
const deadlineTone = computed(() => {
  const d = deadlineDays.value
  if (d === null) return ''
  if (d < 7) return 'bad'
  return d < 14 ? 'warn' : ''
})
const scriptOdds = computed(() => scriptChance(state, props.contract))
const nextMilestone = computed(() => PREP_MILESTONES.find(m => prep.value < m.at) ?? null)
const prepLine = computed(() => {
  if (props.contract.prepNeeded <= 0) return 'No recon needed — this one is ready to go.'
  const done = `${Math.floor(props.contract.prep)} / ${props.contract.prepNeeded}h recon`
  if (prep.value >= 1) return `${done} · fully prepped`
  const m = nextMilestone.value
  const eta = prepEta.value
  const when = eta === null ? 'never at this schedule' : eta <= 7 ? 'this week' : daysLabel(eta)
  return `${done} · full prep ${when}${m ? ` · next: ${m.short}` : ''}`
})

const blocked = computed(() => {
  if (state.jail) return 'You are in custody — nothing moves until you are released.'
  if (state.hospital) return 'You are in hospital — work resumes once you are discharged.'
  return ''
})
const abandonCost = computed(() => {
  const parts: string[] = []
  if (props.contract.kind === 'hack') parts.push(`costs cred (−${Math.max(1, props.contract.cred / 2).toFixed(1)})`)
  if (props.contract.def) parts.push('may have story consequences')
  return parts.length > 0 ? `Walking away ${parts.join(' and ')}.` : 'Walking away costs nothing but pride.'
})

function abandon(): void {
  if (!confirming.value) {
    confirming.value = true
    window.clearTimeout(confirmTimer)
    confirmTimer = window.setTimeout(() => {
      confirming.value = false
    }, 4000)
    return
  }
  window.clearTimeout(confirmTimer)
  abandonContract(state, props.contract.uid)
}

function runTerminal(): void {
  openApp('terminal', { contractUid: props.contract.uid })
}

function scriptIt(): void {
  if (!confirmingScript.value) {
    confirmingScript.value = true
    window.clearTimeout(scriptTimer)
    scriptTimer = window.setTimeout(() => {
      confirmingScript.value = false
    }, 4000)
    return
  }
  window.clearTimeout(scriptTimer)
  confirmingScript.value = false
  // Settles the op and sets state.lastReport, which drives the Operation Debrief.
  scriptOp(state, props.contract.uid)
}

function autoResolve(): void {
  const title = props.contract.title
  const r = resolveContract(state, props.contract.uid)
  if (r) emit('resolved', title, r)
}

onBeforeUnmount(() => {
  window.clearTimeout(confirmTimer)
  window.clearTimeout(scriptTimer)
})
</script>

<template>
  <article class="active" :class="[contract.kind, { ready, queued: !!queuedBehind }]">
    <header class="a-head">
      <span class="kind">{{ kind.icon }} {{ kind.label }}</span>
      <h3 class="a-title">{{ contract.title }}</h3>
      <span v-if="!isHack" class="pill" :title="APPROACH_INFO[contract.approach].blurb">{{ APPROACH_INFO[contract.approach].icon }} {{ APPROACH_INFO[contract.approach].label }}</span>
      <span v-if="isHack" class="pill" :class="prep >= 1 ? 'good' : 'info'">{{ prep >= 1 ? 'Fully prepped' : 'Ready to launch' }}</span>
      <span v-else-if="ready" class="pill good">Ready to deliver</span>
      <span v-else-if="queuedBehind" class="pill warn">Queued</span>
      <span v-else class="pill info">In progress</span>
    </header>

    <div class="a-meta">
      <span>Client: <b>{{ contract.client }}</b></span>
      <span>💰 <b class="money">{{ money(contract.pay) }}</b></span>
      <template v-if="isHack">
        <span :title="scriptTooltip(contract, scriptOdds)">🎯 DC {{ contract.dc }} · script <b :class="chanceTone(scriptOdds)">{{ pct(scriptOdds) }}</b></span>
        <span :title="heatTooltip(contract)">🔥 heat {{ contract.heat }}</span>
        <span :class="deadlineTone" title="Launch it by hand or script it before the window closes, or the client walks (cred loss).">📅 <b :class="deadlineTone">{{ deadline }}</b></span>
      </template>
      <span v-else :title="chanceTooltip(contract, f.chance)">🎯 DC {{ contract.dc }} · <b :class="chanceTone(f.chance)">{{ pct(f.chance) }}</b></span>
    </div>

    <template v-if="isHack">
      <div class="prep" :title="PREP_MILESTONES.map(m => `${Math.round(m.at * 100)}% ${m.short}: ${m.long}`).join('\n')">
        <ProgressBar :value="prep" :height="16" :color="prep >= 1 ? 'var(--good)' : 'var(--heat)'" :label="`Recon ${pct(prep)}`" />
        <div class="ticks" aria-hidden="true">
          <span
            v-for="m in PREP_MILESTONES"
            :key="m.at"
            class="tick"
            :class="{ hit: prep >= m.at, end: m.at >= 1 }"
            :style="{ left: `${m.at * 100}%` }"
          >
            <i></i><em>{{ m.short }}</em>
          </span>
        </div>
      </div>
      <div class="a-line" :title="`Scheduled ${act} hours do recon on one hack at a time — the earliest accepted one that still needs it. Prep is optional — launch whenever you like.`">
        {{ kind.icon }} {{ prepLine }}
      </div>
      <ul v-if="perks.length > 0" class="perks">
        <li v-for="p in perks" :key="p" class="good">✔ {{ p }}</li>
      </ul>
      <div v-if="blocked" class="a-warn bad">⚠ {{ blocked }}</div>
      <div v-else-if="prep < 1 && f.perDay === 0 && contract.prepNeeded > 0" class="a-warn warn">
        ⚠ No {{ act }} hours on your schedule — recon is paused. You can still launch it unprepped.
      </div>

      <div class="a-ready hack-run">
        <div class="row wrap">
          <button
            type="button"
            class="btn primary"
            :disabled="!!blocked"
            title="Play the op yourself in the fictional terminal. No dice: your play decides the outcome, and prep perks apply."
            @click="runTerminal"
          >
            ▮ Launch in Terminal
          </button>
          <button type="button" class="btn" :disabled="!!blocked" :title="scriptTooltip(contract, scriptOdds)" @click="scriptIt">
            <template v-if="confirmingScript">Run the script? Click again</template>
            <template v-else>⚙ Script it <b :class="chanceTone(scriptOdds)">[{{ pct(scriptOdds) }}]</b></template>
          </button>
        </div>
        <span class="muted hint">Scripting skips the Terminal: ×{{ SCRIPT_PAY }} pay, more heat, and a miss counts as traced.</span>
      </div>
    </template>

    <template v-else>
      <ProgressBar :value="progress" :height="16" :color="ready ? 'var(--good)' : 'var(--money)'" :label="`${pct(progress)} done`" />
      <div v-if="ready" class="a-ready">
        <span>✔ The work is done. Hand it over and see how the client takes it.</span>
        <div class="row wrap">
          <button type="button" class="btn primary" :title="chanceTooltip(contract, f.chance)" @click="autoResolve">
            📦 Deliver <b :class="chanceTone(f.chance)">[DC {{ contract.dc }} · {{ pct(f.chance) }}]</b>
          </button>
        </div>
      </div>
      <template v-else>
        <div class="a-line" :title="forecastTooltip(state, contract, f)">
          Advances during <b>{{ kind.icon }} {{ act }}</b> hours: {{ f.perDay }}h/day scheduled ·
          {{ workHoursLabel(f.hours) }} of work left · ETA <b>{{ daysLabel(f.days) }}</b>
        </div>
        <div v-if="queuedBehind" class="a-warn warn">
          ⏸ You work one {{ kind.noun }} at a time — this starts after “{{ queuedBehind }}”.
        </div>
        <div v-else-if="blocked" class="a-warn bad">⚠ {{ blocked }}</div>
        <div v-else-if="f.perDay === 0" class="a-warn bad">
          ⚠ No {{ act }} hours on your schedule — this job is frozen.
        </div>
      </template>
    </template>

    <footer class="a-foot">
      <button type="button" class="btn small" @click="openApp('schedule')">🗓 Planner</button>
      <span class="grow"></span>
      <button type="button" class="btn small danger" :title="abandonCost" @click="abandon">
        {{ confirming ? 'Really abandon? Click again' : 'Abandon' }}
      </button>
    </footer>
  </article>
</template>

<style scoped>
.active {
  border: 1px solid var(--panel-border);
  border-left: 4px solid var(--info);
  border-radius: var(--radius);
  background: var(--panel-bg);
  padding: 6px 8px;
  display: flex;
  flex-direction: column;
  gap: 5px;
}
.active.hack {
  border-left-color: var(--heat);
}
.active.freelance {
  border-left-color: var(--money);
}
.active.ready {
  border-color: var(--good);
  border-left-color: var(--good);
  box-shadow: 0 0 0 1px color-mix(in srgb, var(--good) 35%, transparent);
}
.active.queued {
  opacity: 0.85;
}
.a-head {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}
.kind {
  flex: none;
  font-size: 11px;
  font-weight: bold;
  padding: 0 6px;
  border-radius: 2px;
  color: #fff;
  background: var(--info);
}
.hack .kind {
  background: var(--heat);
}
.freelance .kind {
  background: var(--money);
}
.a-title {
  flex: 1;
  min-width: 120px;
  font-size: 13px;
}
.a-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 14px;
  font-size: 11px;
  color: var(--muted);
}
.a-meta b:not([class]) {
  color: var(--win-fg);
}
.a-line {
  font-size: 11px;
  cursor: help;
}
.a-warn {
  font-size: 11px;
  font-weight: bold;
}
.a-ready {
  display: flex;
  flex-direction: column;
  gap: 5px;
  padding: 6px;
  border: 1px dashed var(--good);
  background: color-mix(in srgb, var(--good) 8%, var(--panel-bg));
  border-radius: var(--radius);
}
.prep {
  position: relative;
  padding-bottom: 13px;
  cursor: help;
}
.ticks {
  position: absolute;
  inset: 0;
  pointer-events: none;
}
.tick {
  position: absolute;
  top: 0;
  height: 100%;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
}
.tick i {
  display: block;
  width: 2px;
  height: 16px;
  background: color-mix(in srgb, var(--win-fg) 45%, transparent);
}
.tick.hit i {
  background: var(--good);
}
.tick em {
  font-style: normal;
  font-size: 9px;
  line-height: 12px;
  white-space: nowrap;
  color: var(--muted);
}
.tick.hit em {
  color: var(--good);
  font-weight: bold;
}
.tick.end {
  transform: translateX(-100%);
  align-items: flex-end;
}
.tick.end i {
  display: none;
}
.perks {
  margin: 0;
  padding: 0;
  list-style: none;
  font-size: 11px;
}
.hack-run {
  border-color: var(--heat);
  background: color-mix(in srgb, var(--heat) 6%, var(--panel-bg));
}
.hint {
  font-size: 10px;
}
.a-foot {
  display: flex;
  align-items: center;
  gap: 6px;
}
</style>
