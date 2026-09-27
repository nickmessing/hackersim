<script setup lang="ts">
/** A hack job on the board: target, network, pay, heat, prep needed, deadline window, Accept. */
import { computed } from 'vue'
import { C, acceptContract, balance, canAccept, money, traceSecondsFor, type ContractInstance } from '@/engine'
import { useGame } from '@/ui/game'
import { GOAL_INFO, activityLabel, heatTooltip, networkLabel, offerDaysLeft, opSpecOf, opTierOf, prepHoursFor, skillsText, tierLabel } from './opsKit'

const props = defineProps<{ contract: ContractInstance }>()
const emit = defineEmits<{ accepted: [title: string] }>()

const state = useGame()
const net = computed(() => networkLabel(props.contract))
const spec = computed(() => opSpecOf(props.contract))
const tier = computed(() => opTierOf(props.contract))
const can = computed(() => canAccept(state, props.contract))
const daysLeft = computed(() => offerDaysLeft(state, props.contract))
const prepH = computed(() => prepHoursFor(props.contract))
const windowWeeks = Math.round(balance.HACK_DEADLINE_DAYS / 7)
const rep = computed(() =>
  Object.entries(props.contract.rep)
    .filter(([, v]) => v !== undefined && v !== 0)
    .map(([id, v]) => ({ id, name: C.factions.get(id)?.short ?? id, v: v ?? 0 })),
)
const traceSecs = computed(() => traceSecondsFor(tier.value))

function accept(): void {
  const title = props.contract.title
  if (acceptContract(state, props.contract.uid)) emit('accepted', title)
}
</script>

<template>
  <article class="offer hack" :class="{ story: !!contract.def }">
    <header class="o-head">
      <span class="kind">💀 Hack</span>
      <h3 class="o-title">{{ contract.title }}</h3>
      <span class="pill" :class="contract.def ? 'story' : 'info'" :title="contract.def ? 'A one-off job tied to the story' : `Tier ${tier}: tiers open up as your cred grows`">{{ tierLabel(contract) }}</span>
    </header>
    <div class="o-meta">
      <span title="The kind of network you will be walking through">{{ net.icon }} <b>{{ net.label }}</b><template v-if="spec"> · {{ GOAL_INFO[spec.goal] }}</template></span>
      <span>Client: <b>{{ contract.client }}</b></span>
      <span v-if="daysLeft !== null" :class="{ warn: daysLeft <= 7 }">⏳ Offer ends {{ daysLeft <= 7 ? 'this week' : `in ${Math.ceil(daysLeft / 7)} weeks` }}</span>
    </div>
    <p class="o-desc">{{ contract.desc }}</p>

    <div class="o-stats">
      <span class="stat" title="Full pay for a clean or messy run; partial runs pay less">💰 <b class="money">{{ money(contract.pay) }}</b></span>
      <span class="stat" :title="heatTooltip(contract)">🔥 heat {{ contract.heat }}</span>
      <span v-if="contract.cred > 0" class="stat" title="Underground reputation on success — unlocks higher hack tiers">★ cred +{{ contract.cred }}</span>
      <span class="stat" :title="`Scheduled ${activityLabel('hack')} hours do recon. Prep is optional but makes the op easier (map, weaker locks, slower trace).`">🔎 prep {{ prepH }}h</span>
      <span class="stat" :title="`Once accepted you have ${windowWeeks} weeks to run it in the Terminal (or script it) before the client walks.`">📅 {{ windowWeeks }}-week window</span>
      <span class="stat" :title="`Rough trace budget before prep, relays and OpSec: ~${traceSecs}s of real time.`">⏱ ~{{ traceSecs }}s trace</span>
      <span v-for="r in rep" :key="r.id" class="stat" title="Faction reputation on success">
        {{ r.name }} <b :class="r.v > 0 ? 'good' : 'bad'">{{ r.v > 0 ? '+' : '' }}{{ r.v }}</b>
      </span>
    </div>

    <footer class="o-foot">
      <span class="muted" :title="`Skills that matter: ${skillsText(state, contract.skills)}`">⌨ Played live in the Terminal</span>
      <span v-if="!can.ok" class="bad reason">⛔ {{ can.reason }}</span>
      <span class="grow"></span>
      <button type="button" class="btn primary" :disabled="!can.ok" :title="can.ok ? 'Take the job. Prep it with Hacking hours, then launch it from Active (or type `missions` in the Terminal).' : can.reason" @click="accept">Accept</button>
    </footer>
  </article>
</template>

<style scoped>
.offer {
  border: 1px solid var(--panel-border);
  border-left: 4px solid var(--heat);
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
  background: var(--heat);
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
.o-foot {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
}
.reason {
  font-weight: bold;
}
</style>
