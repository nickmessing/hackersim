<script setup lang="ts">
/** Full job posting page: description, facts, requirements, planner impact and Apply. */
import { computed } from 'vue'
import { formatShortDate, type JobDef } from '@/engine'
import { useGame } from '@/ui/game'
import RichText from '@/ui/components/RichText.vue'
import ReqList from '../ReqList.vue'
import JobFacts from './JobFacts.vue'
import { trackInfo } from '../labels'
import { applyStatus, currentJob, shiftTakes } from '../jobs'

const props = defineProps<{ job: JobDef }>()
const emit = defineEmits<{ apply: []; quit: []; track: [track: string] }>()
const state = useGame()

const status = computed(() => applyStatus(state, props.job))
const track = computed(() => trackInfo(props.job.track))
const takes = computed(() => shiftTakes(state, props.job))
const current = computed(() => currentJob(state))
const postedOn = computed(() => formatShortDate(Math.max(0, state.time.day - ((props.job.id.length * 7) % 12))))
const refNo = computed(() => {
  let h = 0
  for (const ch of props.job.id) h = (h * 31 + ch.charCodeAt(0)) % 99991
  return `PL-${String(h).padStart(5, '0')}`
})
</script>

<template>
  <div class="posting">
    <div class="crumbs">
      <a href="#" @click.prevent="emit('track', job.track)">{{ track.label }}</a> &raquo; <span>{{ job.title }}</span>
    </div>
    <div class="post-head">
      <div>
        <h2>{{ job.title }}</h2>
        <div class="muted">{{ job.employer }} · Port Lumen · Ref. {{ refNo }} · Posted {{ postedOn }}</div>
      </div>
    </div>

    <div class="post-desc">
      <RichText :text="job.desc" />
    </div>

    <JobFacts :job="job" />

    <div class="post-reqs">
      <h3>Requirements</h3>
      <ReqList :cond="job.req" label="" none="None. Pulse preferred." />
    </div>

    <div class="post-apply" :class="status.status">
      <template v-if="status.status === 'current'">
        <div><b>You work here.</b> Show up for your shifts and the promotions will follow.</div>
        <button type="button" class="btn small danger" @click="emit('quit')">Resign…</button>
      </template>
      <template v-else>
        <div class="grow">
          <div v-if="status.status === 'ok'"><b class="good">✔ You meet all requirements.</b></div>
          <div v-else class="bad"><b>✘ {{ status.reason }}</b></div>
          <div v-if="takes.length" class="muted">
            Your planner will give up: {{ takes.map(t => `${t.label} ${t.hours}h`).join(', ') }}.
          </div>
          <div v-if="current" class="warn">Taking this job means resigning as {{ current.title }}.</div>
        </div>
        <button type="button" class="btn primary" :disabled="status.status !== 'ok'" @click="emit('apply')">Apply now »</button>
      </template>
    </div>
  </div>
</template>

<style scoped>
.posting {
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-family: Verdana, var(--font-ui);
  font-size: 11px;
}
.crumbs a {
  color: var(--site-link);
}
h2 {
  font-size: 16px;
  color: var(--site-navy);
}
h3 {
  font-size: 12px;
  color: var(--site-navy);
  margin-bottom: 4px;
  border-bottom: 1px solid var(--site-rule);
  padding-bottom: 2px;
}
.post-desc {
  border-left: 3px solid var(--site-orange);
  padding: 4px 10px;
  background: #fffaf0;
  font-size: 12px;
  font-family: var(--font-ui);
}
.post-desc :deep(p:last-child) {
  margin-bottom: 0;
}
.post-apply {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border: 1px solid var(--site-rule);
  background: var(--site-sky);
}
.post-apply.locked {
  background: #fbf3f2;
  border-color: #efc5c1;
}
.post-apply.current {
  justify-content: space-between;
  background: #fffaf0;
}
</style>
