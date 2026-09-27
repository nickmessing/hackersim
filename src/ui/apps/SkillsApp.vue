<script setup lang="ts">
/**
 * Skills & Study: the 10 skills (level, XP, check modifier, boosters, study focus), the course
 * catalog (buy / progress / completed) and Lumen State University (enroll with an entrance exam
 * roll, semester progress, dropout, degrees).
 */
import { computed, ref, watch } from 'vue'
import {
  buyCourse,
  C,
  chanceOf,
  checkMod,
  dropout,
  enroll,
  money,
  pct,
  SKILLS,
  type CourseDef,
  type EnrollResult,
  type ProgramDef,
} from '@/engine'
import { useGame } from '@/ui/game'
import { openApp } from '@/ui/wm'
import ProgressBar from '@/ui/components/ProgressBar.vue'
import MsgBox from '@/ui/career/MsgBox.vue'
import DiceRoll from '@/ui/career/DiceRoll.vue'
import SkillCard from '@/ui/career/skills/SkillCard.vue'
import CourseCard from '@/ui/career/skills/CourseCard.vue'
import ProgramCard from '@/ui/career/skills/ProgramCard.vue'
import { dndMod, modIsGood, modText, shiftLabel, skillLabel, SKILL_META } from '@/ui/career/labels'
import { condMet } from '@/ui/career/reqs'
import { allSkillBoosters, studyHoursPerDay, studyRate, trainedBy } from '@/ui/career/skills/study'
import '@/ui/career/career.css'

type Tab = 'skills' | 'courses' | 'uni'
const props = defineProps<{ tab?: Tab }>()
const state = useGame()
const tab = ref<Tab>(props.tab ?? 'skills')
watch(
  () => props.tab,
  t => {
    if (t) tab.value = t
  },
)

// ── Header: study focus ────────────────────────────────────────────────────
const studyHours = computed(() => studyHoursPerDay(state))
const focusInfo = computed(() => {
  const f = state.focus.study
  if (f.kind === 'skill') {
    const r = studyRate(state, f.skill)
    return { glyph: SKILL_META[f.skill].glyph, label: skillLabel(f.skill), detail: `≈ ${r.rate.toFixed(1)} XP per study hour`, why: r.why }
  }
  const c = C.courses.get(f.course)
  const done = state.edu.courseProgress[f.course] ?? 0
  return { glyph: '📚', label: c?.name ?? 'Course', detail: c ? `${pct(Math.min(1, done / Math.max(1, c.hours)))} complete` : '', why: '' }
})
const totalLevels = computed(() => SKILLS.reduce((s, k) => s + state.skills[k].level, 0))
const trained = computed(() => trainedBy(state))
const globalBoosts = computed(() => allSkillBoosters(state))

// ── Courses ────────────────────────────────────────────────────────────────
const owned = computed(() => state.edu.coursesOwned.map(id => C.courses.get(id)).filter((c): c is CourseDef => c !== undefined))
const catalog = computed(() =>
  [...C.courses.values()]
    .filter(c => !state.edu.courses.includes(c.id) && !state.edu.coursesOwned.includes(c.id))
    .sort((a, b) => Number(condMet(state, b.req)) - Number(condMet(state, a.req)) || a.price - b.price),
)
const completed = computed(() => state.edu.courses.map(id => ({ id, def: C.courses.get(id) })))

// ── University ─────────────────────────────────────────────────────────────
const programs = computed(() => [...C.programs.values()].sort((a, b) => a.tuitionPerSemester * a.semesters - b.tuitionPerSemester * b.semesters))
const enrolled = computed(() => {
  const e = state.edu.enrolled
  if (!e) return null
  const prog = C.programs.get(e.program)
  if (!prog) return null
  const semFrac = prog.hoursPerSemester > 0 ? Math.min(1, e.hours / prog.hoursPerSemester) : 0
  const daysLeftSem = Math.ceil(Math.max(0, prog.hoursPerSemester - e.hours) / Math.max(1, prog.classHours))
  const semestersAfter = prog.semesters - e.semester
  const daysToGrad = daysLeftSem + semestersAfter * Math.ceil(prog.hoursPerSemester / Math.max(1, prog.classHours))
  const lastSemester = e.semester >= prog.semesters
  return { e, prog, semFrac, daysLeftSem, daysToGrad, lastSemester, tuitionShort: !lastSemester && state.stats.money < prog.tuitionPerSemester }
})
const degrees = computed(() => state.edu.degrees.map(id => ({ id, name: C.programs.get(id)?.name ?? id })))

// ── Dialogs ────────────────────────────────────────────────────────────────
type Dialog =
  | { kind: 'buy'; course: CourseDef }
  | { kind: 'enroll'; prog: ProgramDef }
  | { kind: 'result'; prog: ProgramDef; res: EnrollResult }
  | { kind: 'dropout' }
  | null
const dialog = ref<Dialog>(null)
const rollDone = ref<boolean>(false)

function confirmBuy(c: CourseDef): void {
  dialog.value = null
  if (buyCourse(state, c.id)) tab.value = 'courses'
}

function confirmEnroll(p: ProgramDef): void {
  const res = enroll(state, p.id)
  rollDone.value = !res.roll
  dialog.value = { kind: 'result', prog: p, res }
}

function confirmDropout(): void {
  dialog.value = null
  dropout(state)
}

const enrollOdds = computed(() => {
  if (dialog.value?.kind !== 'enroll') return null
  const ex = dialog.value.prog.exam
  if (!ex) return null
  const mod = checkMod(state, ex.skill)
  return { label: skillLabel(ex.skill), dc: ex.dc, mod, chance: chanceOf(mod, ex.dc) }
})
</script>

<template>
  <div class="app skills-app">
    <div class="focusbar">
      <span class="fb-icon" aria-hidden="true">{{ focusInfo.glyph }}</span>
      <div class="grow">
        <div>Study focus: <b>{{ focusInfo.label }}</b> <span class="muted" :title="focusInfo.why">· {{ focusInfo.detail }}</span></div>
        <div class="muted small">
          {{ studyHours }}h of study on your planner per day<template v-if="studyHours === 0"> — <a href="#" @click.prevent="openApp('schedule')">paint some in the Planner</a></template>
          · {{ totalLevels }} total skill levels
        </div>
        <div v-if="globalBoosts.length" class="boosts">
          <span class="muted small">All skills:</span>
          <span v-for="(b, i) in globalBoosts" :key="i" class="pill" :class="modIsGood(b.mod) ? 'good' : 'bad'" :title="`From ${b.source}`">{{ modText(b.mod) }} · {{ b.source }}</span>
        </div>
      </div>
      <button type="button" class="btn small" @click="openApp('schedule')">Open Planner</button>
    </div>

    <div class="tabs" role="tablist">
      <button type="button" role="tab" :aria-selected="tab === 'skills'" :class="{ active: tab === 'skills' }" @click="tab = 'skills'">Skills</button>
      <button type="button" role="tab" :aria-selected="tab === 'courses'" :class="{ active: tab === 'courses' }" @click="tab = 'courses'">
        Courses<span v-if="owned.length" class="count">{{ owned.length }}</span>
      </button>
      <button type="button" role="tab" :aria-selected="tab === 'uni'" :class="{ active: tab === 'uni' }" @click="tab = 'uni'">
        University<span v-if="state.edu.enrolled" class="count">●</span>
      </button>
    </div>

    <!-- SKILLS -->
    <div v-if="tab === 'skills'" class="scroll pane">
      <div class="skill-grid">
        <SkillCard v-for="s in SKILLS" :key="s" :skill="s" :trained="trained[s]" />
      </div>
      <p class="legend muted">
        The badge is your check modifier: skill checks roll d20 + modifier against a DC. Level ÷ 4, plus gear and perks.
        Hover numbers for the math.
      </p>
    </div>

    <!-- COURSES -->
    <div v-else-if="tab === 'courses'" class="scroll pane">
      <div class="group">
        <div class="group-title">My courses</div>
        <div v-if="owned.length" class="stack">
          <CourseCard v-for="c in owned" :key="c.id" :course="c" owned />
        </div>
        <p v-else class="muted empty">No courses in progress. Buy one below — a course replaces normal study with focused, faster XP.</p>
      </div>
      <div class="group">
        <div class="group-title">Lumen Learning Annex — catalog</div>
        <div v-if="catalog.length" class="stack">
          <CourseCard v-for="c in catalog" :key="c.id" :course="c" :owned="false" @buy="dialog = { kind: 'buy', course: c }" />
        </div>
        <p v-else-if="C.courses.size === 0" class="muted empty">The new catalog is still at the printer. Check back soon.</p>
        <p v-else class="muted empty">You've taken everything the Annex offers. They're considering naming a vending machine after you.</p>
      </div>
      <div v-if="completed.length" class="group">
        <div class="group-title">Completed</div>
        <ul class="done-list">
          <li v-for="c in completed" :key="c.id"><span class="good">✔</span> {{ c.def?.name ?? c.id }}</li>
        </ul>
      </div>
    </div>

    <!-- UNIVERSITY -->
    <div v-else class="scroll pane">
      <div v-if="enrolled" class="group enrolled">
        <div class="group-title">Current enrollment</div>
        <div class="en-head">
          <b>{{ enrolled.prog.name }}</b>
          <span class="pill info">Semester {{ enrolled.e.semester }} of {{ enrolled.prog.semesters }}</span>
        </div>
        <ProgressBar
          :value="enrolled.semFrac"
          :height="14"
          color="var(--act-class)"
          :label="`${enrolled.e.hours} / ${enrolled.prog.hoursPerSemester} class hours this semester`"
        />
        <div class="en-facts">
          <span>Classes {{ shiftLabel(enrolled.prog.classStart, enrolled.prog.classHours) }} daily</span>
          <span>Semester ends in ≈ {{ enrolled.daysLeftSem }} day{{ enrolled.daysLeftSem === 1 ? '' : 's' }}</span>
          <span>Graduation in ≈ {{ enrolled.daysToGrad }} days</span>
        </div>
        <div v-if="!enrolled.lastSemester" class="en-tuition" :class="{ bad: enrolled.tuitionShort }">
          Next tuition: {{ money(enrolled.prog.tuitionPerSemester) }}, due when this semester ends.
          <template v-if="enrolled.tuitionShort"> You can't cover it yet — unpaid tuition means expulsion.</template>
        </div>
        <div v-else class="en-tuition good">Final semester — no more tuition. The finish line smells like cheap champagne.</div>
        <div class="en-actions">
          <button type="button" class="btn small danger" @click="dialog = { kind: 'dropout' }">Drop out…</button>
        </div>
      </div>

      <div class="group">
        <div class="group-title">Lumen State University — programs</div>
        <div v-if="programs.length" class="stack">
          <ProgramCard v-for="p in programs" :key="p.id" :prog="p" @enroll="dialog = { kind: 'enroll', prog: p }" />
        </div>
        <p v-else class="muted empty">Admissions is closed while the registrar's office gets a new fax machine.</p>
      </div>

      <div class="group">
        <div class="group-title">Degrees earned</div>
        <ul v-if="degrees.length" class="done-list">
          <li v-for="d in degrees" :key="d.id"><span aria-hidden="true">🎓</span> {{ d.name }}</li>
        </ul>
        <p v-else class="muted empty">None yet. Your wall has a nail waiting for a frame.</p>
      </div>
    </div>

    <!-- Dialogs -->
    <MsgBox v-if="dialog?.kind === 'buy'" title="Buy course" ok-label="Buy" @ok="confirmBuy(dialog.course)" @cancel="dialog = null">
      <p>Enroll in <b>{{ dialog.course.name }}</b> for <b class="money">{{ money(dialog.course.price) }}</b>?</p>
      <p class="muted">{{ dialog.course.hours }} study hours. It becomes your study focus right away.</p>
    </MsgBox>

    <MsgBox
      v-else-if="dialog?.kind === 'enroll'"
      title="Lumen State University — Admissions"
      :ok-label="dialog.prog.exam ? 'Take the exam' : 'Enroll'"
      @ok="confirmEnroll(dialog.prog)"
      @cancel="dialog = null"
    >
      <p>Enroll in <b>{{ dialog.prog.name }}</b>?</p>
      <p>
        First semester tuition: <b class="money">{{ money(dialog.prog.tuitionPerSemester) }}</b>, charged on admission.
        Classes run {{ shiftLabel(dialog.prog.classStart, dialog.prog.classHours) }} every day.
      </p>
      <p v-if="enrollOdds">
        Entrance exam: <b>[{{ enrollOdds.label }} · DC {{ enrollOdds.dc }} · {{ pct(enrollOdds.chance) }}]</b> — d20 {{ dndMod(enrollOdds.mod) }}.
        <span class="muted">Fail and you can retake it later. Tuition is only charged if you pass.</span>
      </p>
    </MsgBox>

    <MsgBox
      v-else-if="dialog?.kind === 'result'"
      :title="!rollDone ? 'Entrance exam' : dialog.res.ok ? 'Admission granted' : 'Admission denied'"
      :icon="!rollDone ? 'info' : dialog.res.ok ? 'ok' : 'error'"
      no-cancel
      ok-label="Close"
      :ok-disabled="!rollDone"
      @ok="dialog = null"
    >
      <DiceRoll v-if="dialog.res.roll" :roll="dialog.res.roll" caption="Entrance exam" @done="rollDone = true" />
      <template v-if="rollDone">
        <p v-if="dialog.res.ok" class="result good">
          Welcome to {{ dialog.prog.name }}! Your student ID photo is terrible, as is tradition. Lectures run
          {{ shiftLabel(dialog.prog.classStart, dialog.prog.classHours) }} — they're already on your planner.
        </p>
        <p v-else class="result bad">
          {{ dialog.res.reason ?? 'Admission denied.' }}
          <template v-if="dialog.res.roll"> Study up and try again at the next sitting.</template>
        </p>
      </template>
    </MsgBox>

    <MsgBox v-else-if="dialog?.kind === 'dropout' && enrolled" title="Drop out" icon="warn" ok-label="Drop out" danger @ok="confirmDropout" @cancel="dialog = null">
      <p>Walk away from <b>{{ enrolled.prog.name }}</b> in semester {{ enrolled.e.semester }}?</p>
      <p class="muted">Tuition already paid is gone, and this semester's progress is lost. Your class hours go back to the planner.</p>
    </MsgBox>
  </div>
</template>

<style scoped>
.skills-app {
  position: relative;
  gap: 6px;
}
.focusbar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 5px 8px;
  border: 1px solid var(--panel-border);
  background: linear-gradient(#fff, #e9eef8);
  border-radius: var(--radius);
}
.fb-icon {
  font-size: 20px;
}
.small {
  font-size: 11px;
}
.boosts {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 3px;
  margin-top: 2px;
}
.count {
  display: inline-block;
  margin-left: 4px;
  min-width: 14px;
  padding: 0 3px;
  font-size: 10px;
  line-height: 14px;
  border-radius: 7px;
  background: var(--sel-bg);
  color: #fff;
  font-weight: bold;
}
.pane {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-top: 2px;
}
.skill-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 6px;
}
.legend {
  font-size: 10px;
  margin: 0;
}
.stack {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.empty {
  font-style: italic;
  margin: 0;
}
.done-list {
  margin: 0;
  padding-left: 4px;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.enrolled {
  display: flex;
  flex-direction: column;
  gap: 5px;
  border-color: var(--sel-bg);
}
.enrolled .group-title {
  margin-bottom: 0;
}
.en-head {
  display: flex;
  align-items: center;
  gap: 8px;
}
.en-facts {
  display: flex;
  flex-wrap: wrap;
  gap: 2px 14px;
  font-size: 11px;
}
.en-tuition {
  font-size: 11px;
}
.en-actions {
  display: flex;
  justify-content: flex-end;
}
.result {
  margin-top: 8px;
  font-weight: bold;
}
</style>
