<script setup lang="ts">
/**
 * "Operations" — the contract desk. Board: offers with terms, odds and a per-approach forecast.
 * Active: progress, the schedule activity that drives it, ETA, execution when ready, abandon.
 * History: track record. A Heat panel explains heat, cooling, raid risk and cred tiers.
 */
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { balance, formatDate, hackTier, money, moveContract, pct, raidChance, type ContractInstance, type ContractKind, type ContractResult } from '@/engine'
import { useGame } from '@/ui/game'
import { openApp } from '@/ui/wm'
import ActiveCard from '@/ui/ops/ActiveCard.vue'
import DebriefModal from '@/ui/ops/DebriefModal.vue'
import HeatPanel from '@/ui/ops/HeatPanel.vue'
import HistoryTab from '@/ui/ops/HistoryTab.vue'
import HackOfferCard from '@/ui/ops/HackOfferCard.vue'
import OfferCard from '@/ui/ops/OfferCard.vue'
import { APPROACH_INFO, KIND_INFO, activityLabel, daysLabel, deadlineDaysLeft, gigQueueEta, heatLevel, prepFraction, type Approach } from '@/ui/ops/opsKit'
import DiceRoll from '@/ui/story/DiceRoll.vue'
import { opLive, resolveStaleOp } from './opLive'

const props = defineProps<{ tab?: string }>()
const state = useGame()

type Tab = 'board' | 'active' | 'history'
type Filter = 'all' | ContractKind

const view = ref<Tab>('board')
const filter = ref<Filter>('all')
const flash = ref('')
const result = ref<{ key: number; title: string; r: ContractResult } | null>(null)
let resultSeq = 0
let flashTimer = 0

const offers = computed(() => state.contracts.board.filter(c => c.status === 'offered'))
const board = computed(() =>
  offers.value
    .filter(c => filter.value === 'all' || c.kind === filter.value)
    .sort(
      (a, b) =>
        Number(b.def !== undefined) - Number(a.def !== undefined) ||
        (a.kind === b.kind ? 0 : a.kind === 'hack' ? -1 : 1) ||
        b.tier - a.tier ||
        b.pay - a.pay,
    ),
)
const counts = computed(() => ({
  all: offers.value.length,
  hack: offers.value.filter(c => c.kind === 'hack').length,
  freelance: offers.value.filter(c => c.kind === 'freelance').length,
}))

/** Gigs in working order (the queue); hacks run in parallel and are launched from the Terminal. */
const gigQueue = computed(() => state.contracts.active.filter(c => c.kind === 'freelance' && c.status === 'active'))
const gigEta = computed(() => new Map(gigQueueEta(state, gigQueue.value).map(e => [e.uid, e.days])))

interface ActiveRow {
  c: ContractInstance
  queuedBehind?: string
  /** Position in the gig queue (0 = being worked now), for gigs. */
  queuePos?: number
  /** Cumulative delivery ETA in days (counting every gig ahead of it), for gigs. */
  eta?: number | null
  live: boolean
}

const active = computed<ActiveRow[]>(() => {
  const lead = gigQueue.value[0]
  return state.contracts.active.map(c => {
    if (c.kind !== 'freelance' || c.status !== 'active') return { c, live: opLive.uid === c.uid }
    const pos = gigQueue.value.findIndex(g => g.uid === c.uid)
    return {
      c,
      queuedBehind: lead && lead.uid !== c.uid ? lead.title : undefined,
      queuePos: pos,
      eta: gigEta.value.get(c.uid) ?? null,
      live: false,
    }
  })
})
const gigsQueued = computed(() => gigQueue.value.length)
const activeHacks = computed(() => state.contracts.active.filter(c => c.kind === 'hack' && c.status === 'active'))
/** Hacks with full recon done — ready for their best possible run. */
const preppedCount = computed(() => activeHacks.value.filter(c => prepFraction(c) >= 1).length)
/** Hacks whose window closes within the week — launch them or lose them. */
const closingCount = computed(
  () =>
    activeHacks.value.filter(c => {
      const d = deadlineDaysLeft(state, c)
      return d !== null && d < 7
    }).length,
)
const urgentCount = computed(() => preppedCount.value + closingCount.value)
const historyCount = computed(() => Object.values(state.contracts.history).reduce((s, h) => s + h.done + h.failed, 0))

const refreshText = computed(() => {
  const n = state.contracts.lastRefreshDay + balance.BOARD_REFRESH_DAYS - state.time.day
  if (n <= 0) return 'Fresh offers arrive overnight'
  if (n === 1) return 'Fresh offers tomorrow'
  return `Fresh offers in ${n} days`
})

// Compact strip for narrow windows (the full Heat panel is the sidebar).
const heat = computed(() => state.stats.heat)
const level = computed(() => heatLevel(heat.value))
const raid = computed(() => raidChance(state))

function onAccepted(title: string, approach: Approach | null, kind: ContractKind): void {
  const act = activityLabel(kind)
  flash.value =
    kind === 'hack'
      ? `✔ Accepted “${title}”. Your ${act} hours do recon on it; launch it from the Terminal before the deadline — see Active.`
      : `✔ Queued “${title}” (${APPROACH_INFO[approach ?? 'normal'].label.toLowerCase()}). It moves during your ${act} hours — see Active.`
  window.clearTimeout(flashTimer)
  flashTimer = window.setTimeout(() => {
    flash.value = ''
  }, 6000)
}

function onResolved(title: string, r: ContractResult): void {
  result.value = { key: ++resultSeq, title, r }
}

function move(uid: number, dir: -1 | 1): void {
  moveContract(state, uid, dir)
}

function etaText(days: number | null | undefined, pos: number | undefined): string {
  const when = daysLabel(days ?? null)
  if (pos === undefined || pos <= 0) return `Queue ETA: ${when}`
  return `Queue ETA: ${when} (after ${pos} gig${pos === 1 ? '' : 's'} ahead)`
}

watch(
  () => props.tab,
  t => {
    if (t === 'board' || t === 'active' || t === 'history') view.value = t
    else if (t === undefined && closingCount.value > 0) view.value = 'active'
  },
  { immediate: true },
)

onMounted(() => {
  // A save reloaded mid-op still carries the op marker: settle it now (the debrief pops below).
  if (resolveStaleOp(state)) view.value = 'active'
})

onBeforeUnmount(() => {
  window.clearTimeout(flashTimer)
})
</script>

<template>
  <div class="app ops">
    <div class="strip" :title="`Heat ${heat.toFixed(1)} (${level.label}) · raid risk ${pct(raid)}/day · cred ${state.stats.cred.toFixed(1)}`">
      <span>🔥 Heat <b :class="level.tone">{{ Math.round(heat) }}</b> · {{ level.label }}</span>
      <span>🚔 {{ raid > 0 ? `${pct(raid)}/day` : 'no raid risk' }}</span>
      <span>★ Cred {{ state.stats.cred.toFixed(1) }} · T{{ hackTier(state) }}</span>
    </div>

    <div class="tabs" role="tablist">
      <button type="button" role="tab" :aria-selected="view === 'board'" :class="{ active: view === 'board' }" @click="view = 'board'">
        📋 Board <span class="cnt">{{ counts.all }}</span>
      </button>
      <button type="button" role="tab" :aria-selected="view === 'active'" :class="{ active: view === 'active' }" @click="view = 'active'">
        ⚙ Active <span class="cnt">{{ state.contracts.active.length }}</span>
        <span
          v-if="urgentCount > 0"
          class="pill ready"
          :class="closingCount > 0 ? 'warn' : 'good'"
          :title="`${preppedCount} hack${preppedCount === 1 ? '' : 's'} fully prepped · ${closingCount} closing this week`"
        >
          <template v-if="preppedCount > 0">{{ preppedCount }} prepped</template>
          <template v-if="preppedCount > 0 && closingCount > 0"> · </template>
          <template v-if="closingCount > 0">{{ closingCount }} closing</template>
        </span>
      </button>
      <button type="button" role="tab" :aria-selected="view === 'history'" :class="{ active: view === 'history' }" @click="view = 'history'">
        📜 History <span class="cnt">{{ historyCount }}</span>
      </button>
    </div>

    <div class="ops-body">
      <main class="ops-main">
        <!-- Board -->
        <template v-if="view === 'board'">
          <div class="toolbar">
            <div class="filters" role="group" aria-label="Filter offers">
              <button type="button" class="btn small" :class="{ on: filter === 'all' }" :aria-pressed="filter === 'all'" @click="filter = 'all'">All ({{ counts.all }})</button>
              <button type="button" class="btn small" :class="{ on: filter === 'hack' }" :aria-pressed="filter === 'hack'" @click="filter = 'hack'">
                {{ KIND_INFO.hack.icon }} Hacks ({{ counts.hack }})
              </button>
              <button type="button" class="btn small" :class="{ on: filter === 'freelance' }" :aria-pressed="filter === 'freelance'" @click="filter = 'freelance'">
                {{ KIND_INFO.freelance.icon }} Gigs ({{ counts.freelance }})
              </button>
            </div>
            <span class="grow"></span>
            <span class="muted refresh" :title="`The board restocks every ${balance.BOARD_REFRESH_DAYS} days; offers expire after a week.`">🔄 {{ refreshText }}</span>
          </div>
          <div v-if="flash" class="flash" role="status">{{ flash }}</div>
          <div v-if="state.jail" class="notice bad">🚔 You're in custody until {{ formatDate(state.jail.untilDay) }}. The board will wait. Probably.</div>
          <div class="scroll list">
            <template v-for="c in board" :key="c.uid">
              <HackOfferCard v-if="c.kind === 'hack'" :contract="c" @accepted="title => onAccepted(title, null, 'hack')" />
              <OfferCard v-else :contract="c" :queued="gigsQueued" @accepted="(title, approach) => onAccepted(title, approach, 'freelance')" />
            </template>
            <div v-if="board.length === 0" class="empty">
              <template v-if="counts.all === 0">The board is bare. Check back after the restock — or build some cred and the good stuff finds you.</template>
              <template v-else>Nothing of that kind right now. Try another filter.</template>
            </div>
          </div>
        </template>

        <!-- Active -->
        <template v-else-if="view === 'active'">
          <DiceRoll v-if="result" :key="result.key" :roll="result.r.roll" :label="`Auto-resolve · ${result.title}`" :show-math="state.settings.showRollMath" continue-label="Dismiss" @continue="result = null">
            <div class="res-line">
              <template v-if="result.r.success">💰 <b class="money">+{{ money(result.r.pay) }}</b></template>
              <template v-else><span class="bad">No pay. The client won't be calling back.</span></template>
              <template v-if="result.r.heat > 0"> · 🔥 <b class="heat">+{{ result.r.heat.toFixed(1) }} heat</b></template>
            </div>
          </DiceRoll>
          <div class="scroll list">
            <div v-for="a in active" :key="a.c.uid" class="a-row" :class="{ live: a.live }">
              <div v-if="a.live" class="live-banner" role="status">
                ▮ Live in the Terminal — finish the op or jack out first.
                <button type="button" class="link" @click="openApp('terminal', { threadUid: undefined, contractUid: a.c.uid })">Go to Terminal</button>
              </div>
              <ActiveCard :contract="a.c" :queued-behind="a.queuedBehind" :inert="a.live || undefined" @resolved="onResolved" />
              <div v-if="a.queuePos !== undefined" class="queue-bar">
                <span class="q-pos">#{{ a.queuePos + 1 }} in the gig queue</span>
                <span class="muted" title="Counts every gig ahead of this one at your current schedule.">{{ etaText(a.eta, a.queuePos) }}</span>
                <span class="grow"></span>
                <button type="button" class="btn small" :disabled="a.queuePos <= 0" title="Work this gig sooner" aria-label="Move earlier in the queue" @click="move(a.c.uid, -1)">▲</button>
                <button
                  type="button"
                  class="btn small"
                  :disabled="a.queuePos >= gigsQueued - 1"
                  title="Work this gig later"
                  aria-label="Move later in the queue"
                  @click="move(a.c.uid, 1)"
                >
                  ▼
                </button>
              </div>
            </div>
            <div v-if="active.length === 0" class="empty">
              No active jobs. Idle hands make idle bandwidth — pick something off the
              <button type="button" class="link" @click="view = 'board'">Board</button>.
              <div class="muted hint">
                With nothing on, {{ activityLabel('hack') }} and {{ activityLabel('freelance') }} hours still count as practice (a little XP).
                <button type="button" class="link" @click="openApp('schedule')">Open Planner</button>
              </div>
            </div>
          </div>
        </template>

        <!-- History -->
        <HistoryTab v-else />
      </main>

      <HeatPanel class="ops-side scroll" />
    </div>

    <DebriefModal />
  </div>
</template>

<style scoped>
.app.ops {
  position: relative;
  container-type: inline-size;
  gap: 6px;
}
.a-row {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.a-row.live :deep(.active) {
  opacity: 0.6;
}
.live-banner {
  padding: 3px 8px;
  font-size: 11px;
  font-weight: bold;
  border: 1px solid var(--heat);
  border-radius: var(--radius);
  background: color-mix(in srgb, var(--heat) 12%, var(--panel-bg));
}
.queue-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  padding: 2px 8px;
  font-size: 11px;
}
.q-pos {
  font-weight: bold;
}
.grow {
  flex: 1;
}
.strip {
  display: none;
  flex-wrap: wrap;
  gap: 4px 12px;
  padding: 3px 8px;
  font-size: 11px;
  border: 1px solid var(--panel-border);
  border-radius: var(--radius);
  background: var(--panel-alt);
  cursor: help;
}
.tabs .cnt {
  font-weight: normal;
  font-size: 10px;
  color: var(--muted);
  margin-left: 2px;
}
.tabs .ready {
  margin-left: 4px;
}
.ops-body {
  flex: 1;
  min-height: 0;
  display: flex;
  gap: 8px;
}
.ops-main {
  flex: 1;
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.ops-side {
  flex: none;
  width: 206px;
}
.toolbar {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}
.filters {
  display: flex;
  gap: 2px;
}
.filters .btn.on {
  background: var(--sel-bg);
  color: var(--sel-fg);
  border-color: var(--sel-bg);
}
.refresh {
  font-size: 11px;
  cursor: help;
}
.list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding-right: 2px;
}
.flash {
  padding: 4px 8px;
  border: 1px solid var(--good);
  background: color-mix(in srgb, var(--good) 10%, var(--panel-bg));
  border-radius: var(--radius);
  font-size: 11px;
}
.notice {
  padding: 4px 8px;
  border: 1px solid currentcolor;
  border-radius: var(--radius);
  font-size: 11px;
  font-weight: bold;
}
.empty {
  margin: 24px auto;
  max-width: 380px;
  text-align: center;
  color: var(--muted);
  font-style: italic;
  line-height: 1.5;
}
.hint {
  margin-top: 6px;
  font-size: 11px;
}
.link {
  font: inherit;
  padding: 0;
  border: none;
  background: none;
  color: var(--info);
  text-decoration: underline;
  cursor: pointer;
  font-style: normal;
}
.res-line {
  margin-top: 2px;
  font-size: 12px;
}
@container (max-width: 620px) {
  .ops-side {
    display: none;
  }
  .strip {
    display: flex;
  }
}
</style>
