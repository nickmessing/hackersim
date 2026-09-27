<script setup lang="ts">
/**
 * Life: a period "System Properties"-style dialog with tabs — Status (vitals, efficiency,
 * effects), Money (expenses, obligations, income, debt), Home (housing), Lifestyle, Personal (age,
 * record, scars & traits, partner, family). Jail / hospital / burnout / debt / obligation banners
 * sit above the tabs.
 */
import { computed, ref, watch } from 'vue'
import { C, efficiency, formatShortDate, money, pct } from '@/engine'
import { useGame } from '@/ui/game'
import StatusTab from '@/ui/career/life/StatusTab.vue'
import MoneyTab from '@/ui/career/life/MoneyTab.vue'
import HousingTab from '@/ui/career/life/HousingTab.vue'
import LifestyleTab from '@/ui/career/life/LifestyleTab.vue'
import PersonalTab from '@/ui/career/life/PersonalTab.vue'
import { ageText } from '@/ui/career/labels'
import { ageView } from '@/ui/career/life/vitals'
import '@/ui/career/career.css'

type Tab = 'status' | 'money' | 'home' | 'lifestyle' | 'personal'
const props = defineProps<{ tab?: Tab }>()
const state = useGame()
const tab = ref<Tab>(props.tab ?? 'status')
watch(
  () => props.tab,
  t => {
    if (t) tab.value = t
  },
)

const TABS: { id: Tab; label: string }[] = [
  { id: 'status', label: 'Status' },
  { id: 'money', label: 'Money' },
  { id: 'home', label: 'Home' },
  { id: 'lifestyle', label: 'Lifestyle' },
  { id: 'personal', label: 'Personal' },
]

const house = computed(() => C.housing.get(state.housing))
const life = computed(() => C.lifestyles.get(state.lifestyle))
const age = computed(() => ageView(state))
const eff = computed(() => efficiency(state))

const traitCounts = computed(() => {
  let traits = 0
  let scars = 0
  for (const id of state.player.traits) {
    const def = C.traits.get(id)
    if (!def) continue
    if (def.scar === true) scars++
    else traits++
  }
  return { traits, scars }
})
const traitSummary = computed(() => {
  const { traits, scars } = traitCounts.value
  const parts: string[] = []
  if (traits > 0) parts.push(`${traits} trait${traits === 1 ? '' : 's'}`)
  if (scars > 0) parts.push(`${scars} scar${scars === 1 ? '' : 's'}`)
  return parts.join(', ')
})

const banners = computed(() => {
  const out: { tone: 'bad' | 'warn' | 'info'; icon: string; text: string; tab?: Tab }[] = []
  const day = state.time.day
  if (state.hospital) {
    const left = Math.max(0, state.hospital.untilDay - day)
    out.push({ tone: 'warn', icon: '✚', text: `In hospital until ${formatShortDate(state.hospital.untilDay)} (${left} day${left === 1 ? '' : 's'} left). Bed rest restores energy and health; the bill is already paid.` })
  }
  if (state.jail) {
    const left = Math.max(0, state.jail.untilDay - day)
    out.push({ tone: 'bad', icon: '▦', text: `In custody until ${formatShortDate(state.jail.untilDay)} (${left} day${left === 1 ? '' : 's'} left). No work, no classes, no contracts — mood sinks a little every day.` })
  }
  if (state.buffs.some(b => b.id === 'burnout')) out.push({ tone: 'bad', icon: '☁', text: 'Burnout: you are running at a fraction of your usual speed. Rest, relax and see people until it passes.' })
  if (state.stats.money < 0) out.push({ tone: 'bad', icon: '$', text: `Overdrawn: ${money(state.stats.money)}. Debt stresses you out every night.` })
  if (state.stats.heat >= 70 && !state.jail) out.push({ tone: 'bad', icon: '!', text: 'Heat is critical — a police raid could come any night.' })
  if (state.obligations.length > 0 && tab.value !== 'money') {
    const perDay = state.obligations.reduce((s, o) => s + o.perDay, 0)
    const names = state.obligations.map(o => o.label)
    const shown = names.length > 2 ? `${names.slice(0, 2).join(', ')} and ${names.length - 2} more` : names.join(' and ')
    out.push({ tone: 'warn', icon: '⚖', text: `Obligations: ${money(perDay)} a day — ${shown}.`, tab: 'money' })
  }
  return out
})
</script>

<template>
  <div class="app life-app">
    <div class="who">
      <div class="who-pic" aria-hidden="true">{{ state.player.name.slice(0, 1).toUpperCase() }}</div>
      <div class="grow">
        <div class="who-name">{{ state.player.name }} <span class="muted">"{{ state.player.handle }}"</span></div>
        <div class="muted small">
          {{ ageText(age.age) }} · {{ house?.name ?? 'No fixed address' }} · {{ life?.name ?? 'Eating whatever' }}
          <template v-if="traitSummary">
            ·
            <button type="button" class="who-link" :class="{ scarred: traitCounts.scars > 0 }" title="Open Scars and Traits on the Personal tab" @click="tab = 'personal'">
              {{ traitSummary }}
            </button>
          </template>
        </div>
      </div>
      <div class="who-stats">
        <div :class="state.stats.money < 0 ? 'bad' : 'money'"><b>{{ money(state.stats.money) }}</b></div>
        <div class="muted small">Efficiency {{ pct(eff) }}</div>
      </div>
    </div>

    <div v-for="(b, i) in banners" :key="i" class="banner" :class="b.tone" role="status">
      <span class="b-icon" aria-hidden="true">{{ b.icon }}</span>
      <span class="grow">{{ b.text }}</span>
      <button v-if="b.tab" type="button" class="b-link" @click="tab = b.tab">Details…</button>
    </div>

    <div class="tabs" role="tablist">
      <button v-for="t in TABS" :key="t.id" type="button" role="tab" :aria-selected="tab === t.id" :class="{ active: tab === t.id }" @click="tab = t.id">
        {{ t.label }}
      </button>
    </div>
    <div class="scroll pane" role="tabpanel">
      <StatusTab v-if="tab === 'status'" />
      <MoneyTab v-else-if="tab === 'money'" />
      <HousingTab v-else-if="tab === 'home'" />
      <LifestyleTab v-else-if="tab === 'lifestyle'" />
      <PersonalTab v-else />
    </div>
  </div>
</template>

<style scoped>
.life-app {
  position: relative;
  gap: 6px;
}
.who {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 10px;
  border: 1px solid var(--panel-border);
  border-radius: var(--radius);
  background: linear-gradient(90deg, #fff, #e8eef9);
}
.who-pic {
  width: 34px;
  height: 34px;
  flex: none;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: bold;
  color: #fff;
  background: linear-gradient(135deg, #5c86d6, var(--win-title-a));
  border: 1px solid var(--win-title-a);
  border-radius: 4px;
  text-shadow: 0 1px 1px rgb(0 0 0 / 40%);
}
.who-name {
  font-weight: bold;
  font-size: 13px;
}
.who-stats {
  text-align: right;
  font-size: 13px;
}
.small {
  font-size: 11px;
}
.banner {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 4px 8px;
  border: 1px solid;
  border-radius: var(--radius);
  font-size: 11px;
}
.banner.bad {
  color: var(--bad);
  background: #fbeceb;
  border-color: #efc5c1;
}
.banner.warn {
  color: var(--warn);
  background: #fdf3e2;
  border-color: #f0d6a8;
}
.banner.info {
  color: var(--info);
  background: #eaf0fa;
  border-color: #bccde9;
}
.b-icon {
  font-weight: bold;
  width: 14px;
  text-align: center;
}
.b-link,
.who-link {
  font: inherit;
  padding: 0;
  border: 0;
  background: none;
  color: var(--info);
  text-decoration: underline;
  cursor: pointer;
}
.b-link {
  flex: none;
  color: inherit;
  font-weight: bold;
}
.who-link.scarred {
  color: var(--bad);
}
.b-link:focus-visible,
.who-link:focus-visible {
  outline: 1px dotted currentcolor;
  outline-offset: 1px;
}
.pane {
  padding: 8px;
  border: 1px solid var(--panel-border);
  border-top: none;
  background: var(--win-bg);
  margin-top: -6px;
}
</style>
