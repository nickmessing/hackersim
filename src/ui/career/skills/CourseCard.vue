<script setup lang="ts">
/** A course in the catalog (buy) or in progress (progress bar, ETA, set as study focus). */
import { computed } from 'vue'
import { efficiency, money, pct, type CourseDef } from '@/engine'
import { useGame } from '@/ui/game'
import ProgressBar from '@/ui/components/ProgressBar.vue'
import RichText from '@/ui/components/RichText.vue'
import ReqList from '../ReqList.vue'
import { skillXpList, SKILL_META } from '../labels'
import { condMet } from '../reqs'
import { studyHoursPerDay } from './study'

const props = defineProps<{ course: CourseDef; owned: boolean }>()
const emit = defineEmits<{ buy: [] }>()
const state = useGame()

const xp = computed(() => skillXpList(props.course.skillXp))
const done = computed(() => state.edu.courseProgress[props.course.id] ?? 0)
const frac = computed(() => (props.course.hours > 0 ? Math.min(1, done.value / props.course.hours) : 0))
const focused = computed(() => state.focus.study.kind === 'course' && state.focus.study.course === props.course.id)
const reqOk = computed(() => condMet(state, props.course.req))
const affordable = computed(() => state.stats.money >= props.course.price)
const eta = computed(() => {
  const hpd = studyHoursPerDay(state)
  const left = Math.max(0, props.course.hours - done.value)
  if (!focused.value) return 'Not your study focus — no progress.'
  if (hpd === 0) return 'No study hours on your planner.'
  const days = left / (hpd * Math.max(0.05, efficiency(state)))
  return `≈ ${days < 1 ? 'under a day' : `${days.toFixed(days < 10 ? 1 : 0)} days`} left at ${hpd}h/day`
})

function focus(): void {
  state.focus.study = { kind: 'course', course: props.course.id }
}
</script>

<template>
  <div class="course" :class="{ focused, locked: !owned && !reqOk }">
    <div class="c-head">
      <span class="c-icon" aria-hidden="true">📚</span>
      <span class="c-name">{{ course.name }}</span>
      <span class="grow"></span>
      <span v-if="!owned" class="c-price money">{{ money(course.price) }}</span>
    </div>
    <div class="c-desc"><RichText :text="course.desc" /></div>
    <div class="c-meta">
      <span>⏱ {{ course.hours }} study hours</span>
      <span v-for="x in xp" :key="x.skill">{{ SKILL_META[x.skill].glyph }} {{ x.label }} <b>+{{ x.xp }}</b> XP/h</span>
    </div>
    <template v-if="owned">
      <ProgressBar :value="frac" :height="13" color="var(--skill)" :label="`${Math.floor(done)} / ${course.hours} h · ${pct(frac)}`" />
      <div class="c-foot">
        <span class="muted">{{ eta }}</span>
        <span class="grow"></span>
        <span v-if="focused" class="focus-tag">★ Current study focus</span>
        <button v-else type="button" class="btn small primary" @click="focus">Study this</button>
      </div>
    </template>
    <template v-else>
      <div class="c-foot">
        <ReqList :cond="course.req" compact none="Open enrollment" />
        <span class="grow"></span>
        <span v-if="reqOk && !affordable" class="bad small">Need {{ money(course.price - state.stats.money) }} more</span>
        <button type="button" class="btn small primary" :disabled="!reqOk || !affordable" @click="emit('buy')">Buy course</button>
      </div>
    </template>
  </div>
</template>

<style scoped>
.course {
  background: var(--panel-bg);
  border: 1px solid var(--panel-border);
  border-radius: var(--radius);
  padding: 6px 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.course.focused {
  border-color: var(--sel-bg);
  box-shadow: inset 3px 0 0 var(--sel-bg);
}
.course.locked {
  background: #fafaf7;
}
.c-head {
  display: flex;
  align-items: center;
  gap: 6px;
}
.c-name {
  font-weight: bold;
}
.c-price {
  font-weight: bold;
  font-size: 13px;
}
.c-desc {
  font-size: 11px;
  color: #333;
}
.c-desc :deep(p) {
  margin: 0;
}
.c-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 2px 12px;
  font-size: 11px;
}
.c-foot {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px 6px;
  font-size: 11px;
}
.focus-tag {
  font-weight: bold;
  color: var(--sel-bg);
}
.small {
  font-size: 10px;
}
</style>
