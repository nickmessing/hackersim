<script setup lang="ts">
/** Web-style facts table for a job posting: pay, shift, training, strain, perks. */
import { computed } from 'vue'
import { balance, money, type JobDef } from '@/engine'
import { useGame } from '@/ui/game'
import ModPills from '../ModPills.vue'
import { shiftLabel, skillXpList, SKILL_META } from '../labels'
import { maxLevel, payInfo } from '../jobs'

const props = defineProps<{ job: JobDef }>()
const state = useGame()

const pay = computed(() => payInfo(state, props.job))
const trains = computed(() => skillXpList(props.job.skillXp))
const growth = Math.round(balance.JOB_PAY_GROWTH * 100)
const shiftTag = computed(() => {
  const j = props.job
  if (j.shiftStart >= 20 || j.shiftStart + j.hours > 24) return 'Night shift'
  if (j.shiftStart < 7) return 'Early start'
  if (j.shiftStart >= 15) return 'Evening shift'
  return ''
})
</script>

<template>
  <table class="facts">
    <tbody>
      <tr>
        <th scope="row">Salary</th>
        <td>
          <b class="money" :title="pay.why">{{ money(pay.total) }}</b>/day
          <span class="muted">({{ money(pay.perHour) }}/h at your level)</span>
          <span v-if="pay.next !== null" class="muted"> · next level {{ money(pay.next) }}/day</span>
        </td>
      </tr>
      <tr>
        <th scope="row">Shift</th>
        <td>
          {{ shiftLabel(job.shiftStart, job.hours) }} <span class="muted">({{ job.hours }}h, every day)</span>
          <span v-if="shiftTag" class="pill info">{{ shiftTag }}</span>
        </td>
      </tr>
      <tr>
        <th scope="row">You'll learn</th>
        <td>
          <span v-if="trains.length === 0" class="muted">Nothing a résumé would mention.</span>
          <span v-for="t in trains" :key="t.skill" class="train">{{ SKILL_META[t.skill].glyph }} {{ t.label }} <b>+{{ t.xp }}</b>/h</span>
        </td>
      </tr>
      <tr>
        <th scope="row">Wear &amp; tear</th>
        <td>
          <span :class="job.stressPerHour > 1.5 ? 'bad' : job.stressPerHour > 1 ? 'warn' : ''">Stress +{{ job.stressPerHour }}/h</span>
          ·
          <span :class="job.energyPerHour > 4.5 ? 'bad' : job.energyPerHour > 3.5 ? 'warn' : ''">Energy −{{ job.energyPerHour }}/h</span>
        </td>
      </tr>
      <tr>
        <th scope="row">Career path</th>
        <td>Up to level {{ maxLevel(job) }} <span class="muted">(+{{ growth }}% pay per level; promotions come with hours worked)</span></td>
      </tr>
      <tr v-if="job.perk || job.mods?.length">
        <th scope="row">Perks</th>
        <td>
          <div v-if="job.perk">{{ job.perk }}</div>
          <ModPills :mods="job.mods" :source="job.title" />
        </td>
      </tr>
    </tbody>
  </table>
</template>

<style scoped>
.facts {
  width: 100%;
  border-collapse: collapse;
  font-size: 11px;
  font-family: Verdana, var(--font-ui);
}
.facts th,
.facts td {
  border: 1px solid var(--site-rule, #9fb6d9);
  padding: 3px 6px;
  text-align: left;
  vertical-align: top;
}
.facts th {
  width: 96px;
  background: var(--site-sky, #e6eef9);
  color: var(--site-navy, #1c3f7a);
  font-weight: bold;
  white-space: nowrap;
}
.train {
  display: inline-block;
  margin-right: 10px;
  white-space: nowrap;
}
.pill {
  margin-left: 4px;
}
</style>
