<script setup lang="ts">
/** A freelance gig on the board: terms, an approach picker with its effects, "Add to queue". */
import { computed, ref } from 'vue'
import { C, acceptContract, canAccept, money, pct, type ContractInstance } from '@/engine'
import { useGame } from '@/ui/game'
import { chanceTone } from '@/ui/story/storyKit'
import {
  APPROACHES,
  APPROACH_INFO,
  approachSummary,
  chanceTooltip,
  daysLabel,
  forecast,
  forecastTooltip,
  offerDaysLeft,
  skillsText,
  tierLabel,
  workHoursLabel,
  type Approach,
} from './opsKit'

const props = defineProps<{
  contract: ContractInstance
  /** Gigs already in the queue (this one would land behind them). */
  queued: number
}>()
const emit = defineEmits<{ accepted: [title: string, approach: Approach] }>()

const state = useGame()
const approach = ref<Approach>('normal')

const f = computed(() => forecast(state, props.contract, approach.value))
const options = computed(() => APPROACHES.map(a => ({ a, info: APPROACH_INFO[a], f: forecast(state, props.contract, a) })))
const can = computed(() => canAccept(state, props.contract))
const daysLeft = computed(() => offerDaysLeft(state, props.contract))
const rep = computed(() =>
  Object.entries(props.contract.rep)
    .filter(([, v]) => v !== undefined && v !== 0)
    .map(([id, v]) => ({ id, name: C.factions.get(id)?.short ?? id, v: v ?? 0 })),
)

function accept(): void {
  const title = props.contract.title
  if (acceptContract(state, props.contract.uid, approach.value)) emit('accepted', title, approach.value)
}
</script>

<template>
  <article class="offer" :class="{ story: !!contract.def }">
    <header class="o-head">
      <span class="kind">💻 Gig</span>
      <h3 class="o-title">{{ contract.title }}</h3>
      <span class="pill" :class="contract.def ? 'story' : 'info'" :title="contract.def ? 'A one-off job tied to the story' : 'Gig tiers open up with programming and business'">{{ tierLabel(contract) }}</span>
    </header>
    <div class="o-meta">
      <span>Client: <b>{{ contract.client }}</b></span>
      <span v-if="contract.skills.length > 0" title="Your levels in the skills this gig uses (they set speed and the roll bonus)">Skills: {{ skillsText(state, contract.skills) }}</span>
      <span v-if="daysLeft !== null" :class="{ warn: daysLeft <= 7 }">⏳ Offer ends {{ daysLeft <= 7 ? 'this week' : `in ${Math.ceil(daysLeft / 7)} weeks` }}</span>
    </div>
    <p class="o-desc">{{ contract.desc }}</p>

    <div class="o-stats">
      <span class="stat" title="Paid (minus income tax) when delivered">💰 <b class="money">{{ money(contract.pay) }}</b></span>
      <span class="stat" :title="chanceTooltip(contract, f.chance)">🎯 DC {{ contract.dc }} · <b :class="chanceTone(f.chance)">{{ pct(f.chance) }}</b></span>
      <span class="stat" :title="forecastTooltip(state, contract, f)">⏱ {{ workHoursLabel(f.hours) }} of work</span>
      <span v-for="r in rep" :key="r.id" class="stat" title="Faction reputation on success">
        {{ r.name }} <b :class="r.v > 0 ? 'good' : 'bad'">{{ r.v > 0 ? '+' : '' }}{{ r.v }}</b>
      </span>
    </div>

    <div class="approach" role="radiogroup" :aria-label="`Approach for ${contract.title}`">
      <button
        v-for="o in options"
        :key="o.a"
        type="button"
        role="radio"
        class="ap"
        :class="{ active: o.a === approach }"
        :aria-checked="o.a === approach"
        :title="`${o.info.blurb}\n${approachSummary(o.a)}`"
        @click="approach = o.a"
      >
        <b>{{ o.info.icon }} {{ o.info.label }}</b>
        <span class="ap-nums">{{ workHoursLabel(o.f.hours) }} · <span :class="chanceTone(o.f.chance)">{{ pct(o.f.chance) }}</span></span>
        <span class="ap-sum">{{ approachSummary(o.a) }}</span>
      </button>
    </div>

    <footer class="o-foot">
      <span class="muted" :title="forecastTooltip(state, contract, f)">
        Alone: {{ daysLabel(f.days) }}<template v-if="queued > 0"> · lands #{{ queued + 1 }} in your queue</template>
      </span>
      <span v-if="!can.ok" class="bad reason">⛔ {{ can.reason }}</span>
      <span class="grow"></span>
      <button type="button" class="btn primary" :disabled="!can.ok" :title="can.ok ? `Queue it with the ${APPROACH_INFO[approach].label.toLowerCase()} approach` : can.reason" @click="accept">
        ➕ Add to queue · {{ APPROACH_INFO[approach].label }}
      </button>
    </footer>
  </article>
</template>

<style scoped>
.offer {
  border: 1px solid var(--panel-border);
  border-left: 4px solid var(--money);
  border-radius: var(--radius);
  background: var(--panel-bg);
  padding: 6px 8px;
  display: flex;
  flex-direction: column;
  gap: 5px;
}
.offer.story {
  background: linear-gradient(90deg, color-mix(in srgb, var(--story) 7%, var(--panel-bg)), var(--panel-bg) 60%);
}
.o-head {
  display: flex;
  align-items: center;
  gap: 8px;
}
.kind {
  flex: none;
  font-size: 11px;
  font-weight: bold;
  padding: 0 6px;
  border-radius: 2px;
  color: #fff;
  background: var(--money);
}
.o-title {
  flex: 1;
  min-width: 0;
  font-size: 13px;
}
.o-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 12px;
  font-size: 11px;
  color: var(--muted);
}
.o-meta b {
  color: var(--win-fg);
}
.o-desc {
  margin: 0;
  line-height: 1.45;
}
.o-stats {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}
.stat {
  padding: 1px 7px;
  border: 1px solid color-mix(in srgb, var(--panel-border) 60%, var(--panel-bg));
  border-radius: 9px;
  background: var(--panel-alt);
  font-size: 11px;
  white-space: nowrap;
  cursor: help;
}
.approach {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 4px;
}
.ap {
  font: inherit;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 1px;
  padding: 3px 6px;
  border: 1px solid var(--panel-border);
  border-radius: var(--radius);
  background: linear-gradient(var(--panel-bg), var(--panel-alt));
  color: var(--win-fg);
  cursor: pointer;
  text-align: left;
  min-width: 0;
}
.ap:hover {
  border-color: var(--sel-bg);
}
.ap:focus-visible {
  outline: 2px solid var(--sel-bg);
  outline-offset: 1px;
}
.ap.active {
  border-color: var(--sel-bg);
  background: color-mix(in srgb, var(--sel-bg) 13%, var(--panel-bg));
  box-shadow: inset 0 0 0 1px var(--sel-bg);
}
.ap-nums {
  font-size: 11px;
}
.ap-sum {
  font-size: 10px;
  color: var(--muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 100%;
}
.o-foot {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
  flex-wrap: wrap;
}
.reason {
  font-weight: bold;
}
</style>
