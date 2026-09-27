<script setup lang="ts">
/** "My Career" current-position card: pay, level & promotion progress, days worked, perks. */
import { computed } from 'vue'
import { balance, jobLevelProgress, money, pct, type JobDef } from '@/engine'
import { useGame } from '@/ui/game'
import ProgressBar from '@/ui/components/ProgressBar.vue'
import ModPills from '../ModPills.vue'
import { shiftLabel, skillXpList, SKILL_META, trackInfo } from '../labels'
import { maxLevel, payInfo } from '../jobs'

const props = defineProps<{ job: JobDef }>()
const emit = defineEmits<{ quit: []; view: [] }>()
const state = useGame()

const progress = computed(() => state.jobs[props.job.id] ?? { level: 0, xp: 0, days: 0 })
const cap = computed(() => maxLevel(props.job))
const atCap = computed(() => progress.value.level >= cap.value)
const levelFrac = computed(() => (atCap.value ? 1 : jobLevelProgress(state, props.job.id)))
const xpNeed = computed(() => balance.jobXpToNext(progress.value.level))
const pay = computed(() => payInfo(state, props.job))
const track = computed(() => trackInfo(props.job.track))
const trains = computed(() => skillXpList(props.job.skillXp))
const clocked = computed(() => Math.min(state.workedToday, props.job.hours))
const onShiftNow = computed(() => state.schedule[state.time.hour] === 'work' && !state.jail && !state.hospital)
const absent = computed(() => (state.jail ? 'You are in custody — no shifts, no paycheck.' : state.hospital ? 'You are in hospital. Your manager sent a card. No paycheck, though.' : ''))
</script>

<template>
  <div class="cj">
    <div class="cj-head">
      <div class="cj-badge" aria-hidden="true">{{ track.glyph }}</div>
      <div class="grow">
        <div class="cj-kicker">Current position</div>
        <h2 class="cj-title">{{ job.title }}</h2>
        <div class="cj-emp">
          {{ job.employer }} · <span class="pill info">{{ track.label }}</span>
          <span v-if="onShiftNow" class="pill good">On shift now</span>
        </div>
      </div>
      <div class="cj-pay" :title="pay.why">
        <div class="cj-pay-num money">{{ money(pay.total) }}</div>
        <div class="muted">per day</div>
      </div>
    </div>

    <div v-if="absent" class="cj-alert">{{ absent }}</div>

    <div class="cj-grid">
      <div class="cj-cell">
        <div class="cj-label">Level</div>
        <div class="cj-value">
          <b>{{ progress.level }}</b><span class="muted"> / {{ cap }}</span>
        </div>
        <ProgressBar :value="levelFrac" :label="atCap ? 'Top of the ladder' : `${pct(levelFrac)} to level ${progress.level + 1}`" :height="13" color="var(--site-orange, #ff8a00)" />
        <div class="cj-sub muted">
          <template v-if="!atCap">Promotion at {{ xpNeed }} job XP · next raise {{ pay.next !== null ? money(pay.next) : '' }}/day</template>
          <template v-else>No more promotions here. Time to look up?</template>
        </div>
      </div>
      <div class="cj-cell">
        <div class="cj-label">Shift</div>
        <div class="cj-value">{{ shiftLabel(job.shiftStart, job.hours) }}</div>
        <ProgressBar :value="job.hours > 0 ? clocked / job.hours : 0" :label="`Clocked today: ${clocked}/${job.hours}h`" :height="13" color="var(--act-work)" />
        <div class="cj-sub muted">{{ money(pay.perHour) }}/h · paid at midnight for hours worked</div>
      </div>
      <div class="cj-cell">
        <div class="cj-label">Days on the job</div>
        <div class="cj-value"><b>{{ progress.days }}</b></div>
        <div class="cj-sub muted">
          Strain: <span :class="job.stressPerHour > 1.5 ? 'bad' : ''">stress +{{ job.stressPerHour }}/h</span>, energy −{{ job.energyPerHour }}/h
        </div>
      </div>
    </div>

    <div class="cj-row">
      <span class="cj-label">Trains</span>
      <span v-if="trains.length === 0" class="muted">Mostly patience.</span>
      <span v-for="t in trains" :key="t.skill" class="cj-train">{{ SKILL_META[t.skill].glyph }} {{ t.label }} +{{ t.xp }}/h</span>
    </div>
    <div v-if="job.perk || job.mods?.length" class="cj-row">
      <span class="cj-label">Perks</span>
      <span v-if="job.perk">{{ job.perk }}</span>
      <ModPills :mods="job.mods" :source="job.title" />
    </div>

    <div class="cj-actions">
      <button type="button" class="btn small" @click="emit('view')">View job posting</button>
      <button type="button" class="btn small danger" @click="emit('quit')">Resign…</button>
    </div>
  </div>
</template>

<style scoped>
.cj {
  border: 1px solid var(--site-rule);
  background: linear-gradient(#fff, var(--site-sky) 260%);
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.cj-head {
  display: flex;
  align-items: center;
  gap: 10px;
}
.cj-badge {
  width: 44px;
  height: 44px;
  flex: none;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  border: 1px solid var(--site-rule);
  background: #fff;
  border-radius: 4px;
}
.cj-kicker {
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: var(--site-orange-ink);
  font-weight: bold;
}
.cj-title {
  font-family: Verdana, var(--font-ui);
  font-size: 16px;
  color: var(--site-navy);
}
.cj-emp {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-wrap: wrap;
}
.cj-pay {
  text-align: right;
  cursor: help;
}
.cj-pay-num {
  font-size: 20px;
  font-weight: bold;
  font-family: Verdana, var(--font-ui);
}
.cj-alert {
  border: 1px solid #efc5c1;
  background: #fbeceb;
  color: var(--bad);
  padding: 4px 8px;
}
.cj-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 8px;
}
.cj-cell {
  border: 1px solid #d5e0f0;
  background: #fff;
  padding: 6px 8px;
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.cj-label {
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--site-navy);
  font-weight: bold;
}
.cj-value {
  font-size: 14px;
}
.cj-sub {
  font-size: 10px;
}
.cj-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px 10px;
}
.cj-train {
  white-space: nowrap;
}
.cj-actions {
  display: flex;
  justify-content: flex-end;
  gap: 6px;
}
</style>
