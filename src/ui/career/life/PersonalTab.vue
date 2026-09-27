<script setup lang="ts">
/** Life → Personal: age & aging, your record, scars & traits, partner and family at a glance. */
import { computed } from 'vue'
import { balance, C, formatShortDate, type RomanceState } from '@/engine'
import { useGame } from '@/ui/game'
import { openApp } from '@/ui/wm'
import Avatar from '@/ui/components/Avatar.vue'
import ProgressBar from '@/ui/components/ProgressBar.vue'
import { ageText, COMMITTED, fateIsGrim, fateLabel, isFamilyRole, ROMANCE_LABELS } from '../labels'
import { ageView } from './vitals'
import TraitsPanel from './TraitsPanel.vue'

const state = useGame()
const age = computed(() => ageView(state))

interface PersonRow {
  id: string
  name: string
  role: string
  affinity: number
  fate: string
  romance: RomanceState
}

function row(id: string): PersonRow | null {
  const def = C.npcs.get(id)
  const s = state.npcs[id]
  if (!def || !s) return null
  return { id, name: def.name, role: def.role, affinity: Math.round(s.affinity), fate: s.fate, romance: s.romance }
}

const partners = computed(() =>
  Object.entries(state.npcs)
    .filter(([, s]) => COMMITTED.includes(s.romance))
    .map(([id]) => row(id))
    .filter((r): r is PersonRow => r !== null)
    .sort((a, b) => COMMITTED.indexOf(b.romance) - COMMITTED.indexOf(a.romance)),
)
const flirts = computed(() =>
  Object.entries(state.npcs)
    .filter(([, s]) => s.romance === 'flirting')
    .map(([id]) => row(id))
    .filter((r): r is PersonRow => r !== null),
)
const family = computed(() =>
  [...C.npcs.values()]
    .filter(n => isFamilyRole(n.role) && state.npcs[n.id]?.met === true)
    .map(n => row(n.id))
    .filter((r): r is PersonRow => r !== null),
)

function lastSeen(id: string): string {
  const d = state.vars[`aff.last.${id}`]
  if (d === undefined) return ''
  const ago = state.time.day - d
  return ago <= 0 ? 'talked today' : ago === 1 ? 'talked yesterday' : `last talked ${ago} days ago`
}

function affinityWord(a: number): string {
  if (a >= 80) return 'Devoted'
  if (a >= 60) return 'Close'
  if (a >= 35) return 'Warm'
  if (a >= 10) return 'Friendly'
  if (a > -10) return 'Neutral'
  if (a > -40) return 'Cold'
  return 'Hostile'
}

const record = computed(() => [
  { label: 'Police raids', value: state.totals.raids },
  { label: 'Days in custody', value: state.totals.daysJailed },
  { label: 'Hospital stays', value: state.vars['sys.hospitalized'] ?? 0 },
  { label: 'Burnouts', value: state.vars['sys.burnouts'] ?? 0 },
])
</script>

<template>
  <div class="personal">
    <div class="split">
      <fieldset class="gbox">
        <legend>Age</legend>
        <div class="age-num">{{ ageText(age.age) }}</div>
        <div class="muted small">Next birthday {{ formatShortDate(age.nextBirthdayDay) }} — turning {{ age.turning }}.</div>
        <p v-if="age.agingPerDay <= 0" class="small aging">
          Your body still forgives everything. After {{ balance.AGING_START }}, health starts to slip a little each day unless you keep fit.
        </p>
        <p v-else class="small aging warn">
          Aging costs about {{ age.agingPerDay.toFixed(3) }} health per day. Fitness currently shields
          {{ Math.round(age.fitnessShield * 100) }}% of it.
        </p>
      </fieldset>

      <fieldset class="gbox">
        <legend>Record</legend>
        <div v-for="r in record" :key="r.label" class="kv">
          <span>{{ r.label }}</span><b :class="{ bad: r.value > 0 && r.label !== 'Hospital stays' }">{{ r.value }}</b>
        </div>
        <div v-if="state.totals.raids === 0 && state.totals.daysJailed === 0" class="muted small clean">Clean sheet. For now.</div>
      </fieldset>
    </div>

    <TraitsPanel />

    <fieldset class="gbox">
      <legend>Relationship</legend>
      <div v-if="partners.length === 0 && flirts.length === 0" class="muted empty">
        Single. The only thing that calls you after midnight is the dial-up modem.
      </div>
      <div v-for="p in partners" :key="p.id" class="person">
        <Avatar :npc="p.id" :size="30" />
        <div class="grow">
          <div><b>{{ p.name }}</b> <span class="pill story">{{ ROMANCE_LABELS[p.romance] }}</span></div>
          <div class="muted small">{{ p.role }}<template v-if="lastSeen(p.id)"> · {{ lastSeen(p.id) }}</template></div>
        </div>
        <div class="aff">
          <ProgressBar :value="Math.max(0, p.affinity) / 100" color="var(--act-social)" :height="10" />
          <span class="small">♥ {{ p.affinity }} · {{ affinityWord(p.affinity) }}</span>
        </div>
      </div>
      <div v-for="p in flirts" :key="p.id" class="person faint">
        <Avatar :npc="p.id" :size="24" />
        <div class="grow small">Something is in the air with <b>{{ p.name }}</b>.</div>
      </div>
    </fieldset>

    <fieldset class="gbox">
      <legend>Family</legend>
      <div v-if="family.length === 0" class="muted empty">Nobody listed. Families are complicated.</div>
      <div v-for="p in family" :key="p.id" class="person">
        <Avatar :npc="p.id" :size="30" />
        <div class="grow">
          <div>
            <b>{{ p.name }}</b> <span class="muted small">· {{ p.role }}</span>
            <span v-if="fateLabel(p.fate)" class="pill" :class="fateIsGrim(p.fate) ? 'bad' : 'info'">{{ fateLabel(p.fate) }}</span>
          </div>
          <div v-if="lastSeen(p.id)" class="muted small">{{ lastSeen(p.id) }}</div>
          <div v-else-if="state.time.day > 7" class="muted small">No recent contact</div>
        </div>
        <div class="aff">
          <ProgressBar :value="Math.max(0, p.affinity) / 100" color="var(--vital-mood)" :height="10" />
          <span class="small">{{ p.affinity }} · {{ affinityWord(p.affinity) }}</span>
        </div>
      </div>
      <div class="foot">
        <button type="button" class="btn small" @click="openApp('contacts')">Open Contacts…</button>
      </div>
    </fieldset>
  </div>
</template>

<style scoped>
.personal {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.split {
  display: flex;
  gap: 8px;
  align-items: stretch;
}
.split > .gbox:first-child {
  flex: 1.6;
}
.split > .gbox:last-child {
  flex: 1;
}
.gbox {
  margin: 0;
  border: 1px solid #d0d0bf;
  border-radius: var(--radius);
  padding: 4px 8px 8px;
  background: var(--panel-alt);
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 5px;
}
.gbox legend {
  color: var(--info);
  font-weight: bold;
  padding: 0 4px;
}
.age-num {
  font-size: 18px;
  font-weight: bold;
}
.small {
  font-size: 11px;
}
.aging {
  margin: 0;
}
.kv {
  display: flex;
  justify-content: space-between;
}
.clean {
  font-style: italic;
}
.empty {
  font-style: italic;
}
.person {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 3px 0;
  border-bottom: 1px dotted #deddcf;
}
.person:last-of-type {
  border-bottom: none;
}
.person.faint {
  opacity: 0.85;
}
.aff {
  width: 130px;
  display: flex;
  flex-direction: column;
  gap: 1px;
  text-align: right;
}
.foot {
  display: flex;
  justify-content: flex-end;
}
</style>
