<script setup lang="ts">
/** A university degree program: tuition, class schedule, entrance exam odds, warnings, Enroll. */
import { computed } from 'vue'
import { C, chanceOf, checkMod, formatShortDate, money, pct, type ProgramDef } from '@/engine'
import { shiftsOverlap } from '@/engine/sim/jobs'
import { useGame } from '@/ui/game'
import RichText from '@/ui/components/RichText.vue'
import ReqList from '../ReqList.vue'
import { activityLabel, dndMod, hoursSet, shiftLabel, skillLabel, skillXpList, SKILL_META } from '../labels'
import { condMet } from '../reqs'

const props = defineProps<{ prog: ProgramDef }>()
const emit = defineEmits<{ enroll: [] }>()
const state = useGame()

const graduated = computed(() => state.edu.degrees.includes(props.prog.id))
const enrolledHere = computed(() => state.edu.enrolled?.program === props.prog.id)
const enrolledElsewhere = computed(() => state.edu.enrolled !== null && !enrolledHere.value)
const reqOk = computed(() => condMet(state, props.prog.req))
const affordable = computed(() => state.stats.money >= props.prog.tuitionPerSemester)
const xp = computed(() => skillXpList(props.prog.skillXp))
const daysPerSemester = computed(() => Math.ceil(props.prog.hoursPerSemester / Math.max(1, props.prog.classHours)))

const exam = computed(() => {
  const e = props.prog.exam
  if (!e) return null
  const mod = checkMod(state, e.skill)
  return { skill: e.skill, dc: e.dc, mod, chance: chanceOf(mod, e.dc) }
})

const retryDay = computed(() => {
  const v = state.flags[`edu.exam_retry_day.${props.prog.id}`]
  return typeof v === 'number' && v > state.time.day ? v : null
})

const jobClash = computed(() => {
  if (!state.job) return null
  const job = C.jobs.get(state.job)
  if (!job) return null
  return shiftsOverlap(job.shiftStart, job.hours, props.prog.classStart, props.prog.classHours) ? job : null
})

const takes = computed(() => {
  const counts = new Map<string, number>()
  for (const h of hoursSet(props.prog.classStart, props.prog.classHours)) {
    const a = state.schedule[h]
    if (a === undefined || a === 'work' || a === 'class') continue
    const label = activityLabel(a)
    counts.set(label, (counts.get(label) ?? 0) + 1)
  }
  return [...counts.entries()].map(([label, n]) => `${label} ${n}h`)
})

const history = computed(() => {
  const id = props.prog.id
  const out: string[] = []
  if (state.flags[`edu.expelled.${id}`]) out.push('You were expelled once for unpaid tuition.')
  else if (state.flags[`edu.dropout.${id}`]) out.push('You dropped out of this program before.')
  if (state.flags[`edu.exam_failed.${id}`] && !graduated.value && !enrolledHere.value) out.push('You failed its entrance exam before.')
  return out
})

const blocker = computed(() => {
  if (graduated.value) return 'Degree earned.'
  if (enrolledHere.value) return 'You are enrolled.'
  if (enrolledElsewhere.value) return 'You are already enrolled in another program.'
  if (state.jail) return 'Hard to attend lectures from a cell.'
  if (!reqOk.value) return 'Requirements not met.'
  if (retryDay.value !== null) return `Next exam sitting: ${formatShortDate(retryDay.value)}.`
  if (jobClash.value) return `Classes clash with your ${jobClash.value.title} shift.`
  if (!affordable.value) return `Tuition is ${money(props.prog.tuitionPerSemester)} up front.`
  return ''
})
</script>

<template>
  <div class="prog" :class="{ done: graduated, here: enrolledHere }">
    <div class="p-head">
      <span class="p-crest" aria-hidden="true">🎓</span>
      <div class="grow">
        <div class="p-name">{{ prog.name }}</div>
        <div class="muted">{{ prog.semesters }} semesters · {{ money(prog.tuitionPerSemester) }} per semester · {{ money(prog.tuitionPerSemester * prog.semesters) }} total</div>
      </div>
      <span v-if="graduated" class="pill good">✔ Graduated</span>
      <span v-else-if="enrolledHere" class="pill info">Enrolled</span>
    </div>
    <div class="p-desc"><RichText :text="prog.desc" /></div>
    <div class="p-grid">
      <div><span class="k">Classes</span> {{ shiftLabel(prog.classStart, prog.classHours) }} daily <span class="muted">({{ prog.classHours }}h)</span></div>
      <div><span class="k">Semester</span> {{ prog.hoursPerSemester }} class hours <span class="muted">(≈ {{ daysPerSemester }} days)</span></div>
      <div class="wide">
        <span class="k">Teaches</span>
        <span v-if="xp.length === 0" class="muted">Mostly how to stay awake in lectures.</span>
        <span v-for="x in xp" :key="x.skill" class="xp">{{ SKILL_META[x.skill].glyph }} {{ x.label }} +{{ x.xp }}/h</span>
      </div>
      <div v-if="exam" class="wide">
        <span class="k">Entrance exam</span>
        <b>[{{ skillLabel(exam.skill) }} · DC {{ exam.dc }} · {{ pct(exam.chance) }}]</b>
        <span class="muted"> you roll d20 {{ dndMod(exam.mod) }}</span>
      </div>
    </div>
    <ReqList :cond="prog.req" none="High school diploma (you have one)" />
    <div v-if="!graduated && !enrolledHere && (jobClash || takes.length)" class="p-warn">
      <div v-if="jobClash" class="bad">⚠ Classes overlap your job shift ({{ shiftLabel(jobClash.shiftStart, jobClash.hours) }}). You'd have to change jobs first.</div>
      <div v-if="takes.length" class="muted">Classes would replace {{ takes.join(', ') }} on your planner.</div>
    </div>
    <div v-for="(h, i) in history" :key="i" class="p-hist muted">{{ h }}</div>
    <div v-if="!graduated && !enrolledHere" class="p-foot">
      <span class="grow" :class="blocker ? 'bad' : 'good'">{{ blocker || 'You can enroll.' }}</span>
      <button type="button" class="btn primary small" :disabled="blocker !== ''" @click="emit('enroll')">{{ exam ? 'Take exam & enroll…' : 'Enroll…' }}</button>
    </div>
  </div>
</template>

<style scoped>
.prog {
  background: var(--panel-bg);
  border: 1px solid var(--panel-border);
  border-radius: var(--radius);
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 5px;
}
.prog.done {
  background: #f4faf4;
}
.prog.here {
  border-color: var(--sel-bg);
}
.p-head {
  display: flex;
  align-items: center;
  gap: 8px;
}
.p-crest {
  font-size: 22px;
}
.p-name {
  font-weight: bold;
  font-size: 13px;
  color: var(--win-title-a);
}
.p-desc {
  font-size: 11px;
}
.p-desc :deep(p) {
  margin: 0 0 3px;
}
.p-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2px 12px;
  font-size: 11px;
}
.p-grid .wide {
  grid-column: 1 / -1;
}
.k {
  display: inline-block;
  min-width: 84px;
  color: var(--muted);
}
.xp {
  margin-right: 10px;
  white-space: nowrap;
}
.p-warn {
  font-size: 11px;
  border-left: 3px solid var(--warn);
  padding-left: 6px;
}
.p-hist {
  font-size: 10px;
  font-style: italic;
}
.p-foot {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
  border-top: 1px dotted #d0d0bf;
  padding-top: 5px;
}
</style>
