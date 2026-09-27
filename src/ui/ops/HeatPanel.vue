<script setup lang="ts">
/** Heat & reputation sidebar: heat bar with the raid line, cooling rate, raid odds, cred tiers. */
import { computed } from 'vue'
import { balance, dailyHeatDecay, formatDate, freelanceTier, hackTier, pct, raidChance } from '@/engine'
import ProgressBar from '@/ui/components/ProgressBar.vue'
import { useGame } from '@/ui/game'
import { FREELANCE_TIER_NAMES, HACK_TIER_NAMES, heatLevel } from './opsKit'

const state = useGame()

const heat = computed(() => state.stats.heat)
const level = computed(() => heatLevel(heat.value))
const decay = computed(() => dailyHeatDecay(state))
const raid = computed(() => raidChance(state))
const raidsHeld = computed(() => !!state.flags['sys.no_raids'])
const coolDays = computed(() => {
  if (heat.value < balance.RAID_HEAT || decay.value <= 0) return null
  return Math.ceil((heat.value - balance.RAID_HEAT) / decay.value + 0.001)
})
const clearDays = computed(() => (decay.value > 0 ? Math.ceil(heat.value / decay.value) : null))
const raidPct = `${balance.RAID_HEAT}%`

const decayTip = computed(() =>
  [
    `Heat cools by ${balance.HEAT_DECAY_BASE}/day, +${balance.HEAT_DECAY_PER_OPSEC} per OpSec level (you: ${state.skills.opsec.level}), plus gear.`,
    'A city-wide crackdown slows the cooling and makes every job hotter.',
  ].join('\n'),
)
const raidTip = [
  `Raids can happen once heat reaches ${balance.RAID_HEAT}. Daily chance = (heat − ${balance.RAID_HEAT} + 5) ÷ ${balance.RAID_DIV}.`,
  `A raid seizes tools and hardware, fines you ${pct(balance.RAID_FINE_FRACTION)} of your cash, blows active hacks and puts you in custody.`,
].join('\n')

const cred = computed(() => state.stats.cred)
const hTier = computed(() => hackTier(state))
const fTier = computed(() => freelanceTier(state))
const hackLadder = computed(() =>
  balance.CRED_TIERS.map((at, i) => ({ tier: i + 1, at, name: HACK_TIER_NAMES[i] ?? `Tier ${i + 1}`, reached: cred.value >= at, current: i + 1 === hTier.value })),
)
const nextHack = computed(() => {
  const lo = balance.CRED_TIERS[hTier.value - 1] ?? 0
  const hi = balance.CRED_TIERS[hTier.value]
  if (hi === undefined) return null
  return { at: hi, progress: (cred.value - lo) / (hi - lo) }
})
const nextFree = computed(() => balance.FREELANCE_TIERS[fTier.value] ?? null)
</script>

<template>
  <aside class="heat-panel">
    <section class="hp-box">
      <div class="hp-title">🔥 Heat</div>
      <div class="hp-big" :class="level.tone">
        <b>{{ Math.round(heat) }}</b><span class="of">/100</span>
        <span class="lvl">{{ level.label }}</span>
      </div>
      <div class="bar-wrap" :title="`Heat ${heat.toFixed(1)}. Raids start at ${balance.RAID_HEAT}.`">
        <ProgressBar :value="heat / 100" :color="level.color" :height="14" :segmented="true" />
        <div class="raid-mark" :style="{ left: raidPct }" aria-hidden="true"></div>
      </div>
      <dl class="hp-list">
        <div :title="decayTip">
          <dt>Cooling</dt>
          <dd class="good">−{{ decay.toFixed(2) }}/day</dd>
        </div>
        <div :title="raidTip">
          <dt>Raid risk</dt>
          <dd :class="raid > 0 && !raidsHeld ? 'bad' : 'good'">
            <template v-if="raidsHeld">on hold</template>
            <template v-else-if="raid > 0">{{ pct(raid) }}/day</template>
            <template v-else>none</template>
          </dd>
        </div>
        <div v-if="coolDays !== null" title="Days of lying low until you're back under the raid line">
          <dt>Below raid line</dt>
          <dd class="warn">in {{ coolDays }}d</dd>
        </div>
        <div v-else-if="clearDays !== null && heat >= 1" title="Days of lying low until the heat is gone entirely">
          <dt>Fully cold</dt>
          <dd>in {{ clearDays }}d</dd>
        </div>
      </dl>
      <p v-if="raidsHeld" class="hp-note muted">Something bigger has everyone's attention. Nobody's kicking doors — for now.</p>
      <p v-else-if="raid > 0" class="hp-note bad">You're hot. Lie low: pick careful approaches, skip hacks for a while, level OpSec.</p>
      <p v-if="state.jail" class="hp-note bad">🚔 In custody until {{ formatDate(state.jail.untilDay) }}.</p>
    </section>

    <section class="hp-box">
      <div class="hp-title" title="Underground reputation. Earned from hacks, lost on failures and raids. Unlocks harder, better-paid hack contracts.">★ Cred</div>
      <div class="hp-big">
        <b>{{ cred.toFixed(1) }}</b>
        <span class="lvl">{{ HACK_TIER_NAMES[hTier - 1] }}</span>
      </div>
      <ol class="ladder" aria-label="Hack tiers">
        <li v-for="t in hackLadder" :key="t.tier" :class="{ reached: t.reached, current: t.current }" :title="`Tier ${t.tier} hack contracts need cred ${t.at}+`">
          <span class="t-n">T{{ t.tier }}</span>
          <span class="t-name">{{ t.name }}</span>
          <span class="t-at">{{ t.at }}</span>
        </li>
      </ol>
      <div v-if="nextHack" class="next">
        <ProgressBar :value="nextHack.progress" :height="8" :segmented="false" color="var(--story)" />
        <span class="muted">Next hack tier at cred {{ nextHack.at }}</span>
      </div>
      <div v-else class="next muted">Top tier. The scene says your handle quietly.</div>
    </section>

    <section class="hp-box">
      <div class="hp-title" title="Freelance tiers follow your Programming level (or the Programming/Business average, if higher).">💻 Freelance</div>
      <div class="hp-big">
        <b>T{{ fTier }}</b>
        <span class="lvl">{{ FREELANCE_TIER_NAMES[fTier - 1] }}</span>
      </div>
      <div class="next muted">
        Programming {{ state.skills.programming.level }} · Business {{ state.skills.business.level }}
        <template v-if="nextFree !== null"><br />Next tier at skill {{ nextFree }}</template>
        <template v-else><br />Top tier — clients call you now.</template>
      </div>
    </section>
  </aside>
</template>

<style scoped>
.heat-panel {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}
.hp-box {
  border: 1px solid var(--panel-border);
  border-radius: var(--radius);
  background: var(--panel-alt);
  padding: 6px 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.hp-title {
  font-weight: bold;
  color: var(--info);
  cursor: help;
}
.hp-big {
  display: flex;
  align-items: baseline;
  gap: 4px;
}
.hp-big b {
  font-size: 20px;
  line-height: 1;
}
.hp-big .of {
  color: var(--muted);
  font-size: 11px;
}
.lvl {
  margin-left: auto;
  font-size: 11px;
  font-weight: bold;
}
.bar-wrap {
  position: relative;
}
.raid-mark {
  position: absolute;
  top: -3px;
  bottom: -3px;
  width: 2px;
  margin-left: -1px;
  background: var(--bad);
  box-shadow: 0 0 0 1px var(--panel-bg);
}
.hp-list {
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 1px;
  font-size: 11px;
}
.hp-list > div {
  display: flex;
  justify-content: space-between;
  gap: 6px;
  cursor: help;
}
.hp-list dt {
  color: var(--muted);
}
.hp-list dd {
  margin: 0;
  font-weight: bold;
}
.hp-note {
  margin: 0;
  font-size: 11px;
  line-height: 1.35;
}
.ladder {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 1px;
  font-size: 11px;
}
.ladder li {
  display: flex;
  gap: 6px;
  padding: 0 4px;
  color: var(--muted);
  border-radius: 2px;
  cursor: help;
}
.ladder li.reached {
  color: var(--win-fg);
}
.ladder li.current {
  background: color-mix(in srgb, var(--story) 16%, var(--panel-bg));
  color: var(--story);
  font-weight: bold;
}
.t-n {
  width: 18px;
}
.t-name {
  flex: 1;
}
.next {
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-size: 11px;
}
</style>
