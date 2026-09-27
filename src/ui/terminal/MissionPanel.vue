<script setup lang="ts">
import { computed } from 'vue'
import type { Text } from '@/engine'
import ProgressBar from '@/ui/components/ProgressBar.vue'
import RichText from '@/ui/components/RichText.vue'
import type { GoalView, HostView, Trace } from './sim'

const props = defineProps<{
  title: string
  briefing: Text | undefined
  goals: GoalView[]
  trace: Trace
  hosts: HostView[]
  hints: string[]
  job: { label: string; progress: number } | null
}>()

const tracePct = computed(() => (props.trace.total > 0 ? props.trace.elapsed / props.trace.total : 0))
const traceColor = computed(() => {
  const p = tracePct.value
  if (p > 0.75) return 'var(--terminal-err)'
  if (p > 0.45) return 'var(--terminal-warn)'
  return 'var(--bar-fill)'
})
const traceLabel = computed(() => {
  if (!props.trace.active) return 'idle'
  const left = Math.max(0, props.trace.total - props.trace.elapsed)
  return `${Math.round(tracePct.value * 100)}%  ·  ${left.toFixed(0)}s left`
})
const doneCount = computed(() => props.goals.filter(g => g.done).length)
</script>

<template>
  <div class="mpanel">
    <div class="group">
      <div class="group-title">{{ title }}</div>
      <div class="briefing"><RichText :text="briefing" /></div>
      <p v-if="hints.length" class="muted hint">
        <strong>Tip:</strong> {{ hints[0] }}
      </p>
    </div>

    <div class="group">
      <div class="group-title">Trace</div>
      <ProgressBar :value="tracePct" :color="traceColor" :label="traceLabel" :height="16" :segmented="false" />
      <div v-if="job" class="job">
        <span class="mono">{{ job.label }}</span>
        <ProgressBar :value="job.progress" color="var(--skill)" :height="12" :segmented="false" />
      </div>
      <p v-else class="muted small">No process running.</p>
    </div>

    <div class="group goals-group">
      <div class="group-title">Objectives · {{ doneCount }}/{{ goals.length }}</div>
      <ul class="goals">
        <li v-for="(g, i) in goals" :key="i" :class="{ done: g.done }">
          <span class="box">[{{ g.done ? '✓' : ' ' }}]</span> {{ g.label }}
        </li>
        <li v-if="goals.length === 0" class="muted">No objectives listed.</li>
      </ul>
    </div>

    <div class="group hosts-group">
      <div class="group-title">Network</div>
      <ul class="hosts">
        <li v-for="h in hosts" :key="h.ip" :class="{ current: h.current }">
          <div class="hrow">
            <span class="mono ip">{{ h.ip }}</span>
            <span class="hname">{{ h.name }}</span>
          </div>
          <div class="tags">
            <span v-if="h.current" class="pill info">here</span>
            <span v-if="h.access" class="pill good">shell</span>
            <span :class="['pill', h.guarded ? 'warn' : 'good']">{{ h.guarded ? 'guarded' : 'open' }}</span>
            <span v-if="h.logsWiped" class="pill">clean</span>
          </div>
        </li>
        <li v-if="hosts.length === 0" class="muted">Nothing mapped yet. Connect and <span class="mono">scan</span>.</li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
.mpanel {
  width: 236px;
  flex: none;
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-height: 0;
  overflow: auto;
  padding-right: 2px;
}
.group {
  flex: none;
}
.briefing {
  max-height: 150px;
  overflow: auto;
  font-size: 11.5px;
  line-height: 1.4;
}
.hint {
  margin: 6px 0 0;
  font-size: 11px;
}
.small {
  font-size: 11px;
  margin: 4px 0 0;
}
.job {
  margin: 6px 0 0;
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.goals {
  list-style: none;
  margin: 0;
  padding: 0;
  font-size: 12px;
}
.goals li {
  padding: 2px 0;
  line-height: 1.3;
}
.goals li.done {
  color: var(--good);
  text-decoration: line-through;
  text-decoration-color: rgb(26 127 26 / 45%);
}
.goals .box {
  font-family: var(--font-mono);
}
.hosts {
  list-style: none;
  margin: 0;
  padding: 0;
}
.hosts li {
  padding: 4px 5px;
  border-bottom: 1px solid #eee;
}
.hosts li.current {
  background: #eaf3ff;
}
.hrow {
  display: flex;
  justify-content: space-between;
  gap: 6px;
  align-items: baseline;
}
.ip {
  font-size: 11px;
  color: var(--info);
}
.hname {
  font-size: 11px;
  text-align: right;
  color: var(--muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 3px;
  margin-top: 3px;
}
</style>
