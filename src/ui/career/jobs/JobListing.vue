<script setup lang="ts">
/** One classified-ad style row on the job board. */
import { computed } from 'vue'
import { money, type JobDef } from '@/engine'
import { useGame } from '@/ui/game'
import ReqList from '../ReqList.vue'
import { shiftLabel, skillXpList } from '../labels'
import { applyStatus, levelOf, payInfo } from '../jobs'

const props = defineProps<{ job: JobDef }>()
const emit = defineEmits<{ open: []; apply: [] }>()
const state = useGame()

const pay = computed(() => payInfo(state, props.job))
const status = computed(() => applyStatus(state, props.job))
const trains = computed(() => skillXpList(props.job.skillXp))
const pastLevel = computed(() => (state.jobs[props.job.id] && state.job !== props.job.id ? levelOf(state, props.job) : null))
</script>

<template>
  <article class="ad" :class="status.status">
    <div class="ad-top">
      <a href="#" class="ad-title" @click.prevent="emit('open')">{{ job.title }}</a>
      <span v-if="status.status === 'current'" class="pill good">Your job</span>
      <span v-else-if="status.status === 'ok'" class="pill good">✔ You qualify</span>
      <span v-if="pastLevel !== null" class="pill">Former employee · lvl {{ pastLevel }}</span>
      <span class="ad-pay money" :title="pay.why">{{ money(pay.total) }}<small>/day</small></span>
    </div>
    <div class="ad-emp">{{ job.employer }}</div>
    <div class="ad-meta">
      <span>🕘 {{ shiftLabel(job.shiftStart, job.hours) }} ({{ job.hours }}h)</span>
      <span v-if="trains.length">📈 {{ trains.map(t => `${t.label} +${t.xp}`).join(', ') }} XP/h</span>
      <span :class="job.stressPerHour > 1.5 ? 'bad' : ''">Stress +{{ job.stressPerHour }}/h</span>
      <span>Energy −{{ job.energyPerHour }}/h</span>
    </div>
    <div class="ad-bottom">
      <ReqList :cond="job.req" compact />
      <span class="grow"></span>
      <span v-if="status.status === 'locked'" class="ad-reason bad">{{ status.reason }}</span>
      <button type="button" class="btn small" @click="emit('open')">Details</button>
      <button v-if="status.status !== 'current'" type="button" class="btn small primary" :disabled="status.status !== 'ok'" @click="emit('apply')">Apply</button>
    </div>
  </article>
</template>

<style scoped>
.ad {
  border: 1px solid var(--site-rule);
  border-left: 4px solid var(--site-rule);
  background: #fff;
  padding: 6px 8px;
  display: flex;
  flex-direction: column;
  gap: 3px;
  font-family: Verdana, var(--font-ui);
  font-size: 11px;
}
.ad.ok {
  border-left-color: var(--good);
}
.ad.current {
  border-left-color: var(--site-orange);
  background: #fffaf0;
}
.ad.locked {
  background: #fafafa;
}
.ad-top {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}
.ad-title {
  font-weight: bold;
  font-size: 12px;
  color: var(--site-link);
}
.ad-title:visited {
  color: var(--site-link);
}
.ad-title:hover {
  color: var(--site-orange-ink);
}
.ad-pay {
  margin-left: auto;
  font-weight: bold;
  font-size: 13px;
  cursor: help;
}
.ad-pay small {
  font-weight: normal;
  font-size: 10px;
}
.ad-emp {
  color: var(--muted);
}
.ad-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 2px 12px;
}
.ad-bottom {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px 6px;
  margin-top: 2px;
}
.ad-reason {
  font-size: 10px;
}
</style>
