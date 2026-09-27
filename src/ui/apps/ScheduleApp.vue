<script setup lang="ts">
/**
 * Daily Planner: paint a 24-hour routine with a brush palette, apply presets, see the day's
 * estimated energy/stress balance and a 24h forecast, and choose what study / social /
 * hacking / freelance hours are spent on.
 */
import { computed, ref, useTemplateRef } from 'vue'
import {
  applyPreset,
  C,
  countSlots,
  effectiveHours,
  efficiency,
  PAINTABLE_ACTIVITIES,
  PRESETS,
  SKILLS,
  setSlot,
  signed,
  workSpeed,
  type ActivityId,
  type ContractKind,
  type PaintableActivity,
} from '@/engine'
import { useGame } from '@/ui/game'
import { openApp } from '@/ui/wm'
import Timeline from '@/ui/career/planner/Timeline.vue'
import DayForecast from '@/ui/career/planner/DayForecast.vue'
import { daySummary, hourDelta } from '@/ui/career/forecast'
import { ACTIVITY_META, activityLabel, hh, shiftLabel, skillLabel, SKILL_META } from '@/ui/career/labels'
import { currentJob } from '@/ui/career/jobs'
import '@/ui/career/career.css'

const state = useGame()
const root = useTemplateRef<HTMLDivElement>('root')

// ── Brush & painting ───────────────────────────────────────────────────────
const brush = ref<PaintableActivity>('study')
const undoStack = ref<ActivityId[][]>([])
const hoverHour = ref<number | null>(null)

function pushUndo(before: ActivityId[]): void {
  undoStack.value = [...undoStack.value, before].slice(-25)
}

function undo(): void {
  const snap = undoStack.value[undoStack.value.length - 1]
  if (!snap) return
  undoStack.value = undoStack.value.slice(0, -1)
  snap.forEach((a, h) => {
    if (a !== 'work' && a !== 'class' && state.schedule[h] !== a) setSlot(state, h, a)
  })
}

const presetChoice = ref<string>('')
function onPreset(): void {
  const key = presetChoice.value
  presetChoice.value = ''
  if (!key) return
  pushUndo([...state.schedule])
  applyPreset(state, key)
}

function onKey(e: KeyboardEvent): void {
  const t = e.target as HTMLElement
  if (t.tagName === 'SELECT' || t.tagName === 'INPUT') return
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
    e.preventDefault()
    undo()
    return
  }
  const n = Number(e.key)
  const act = Number.isInteger(n) && n >= 1 ? PAINTABLE_ACTIVITIES[n - 1] : undefined
  if (act) {
    brush.value = act
    e.preventDefault()
  }
}

function focusRoot(e: PointerEvent): void {
  const t = e.target as HTMLElement
  if (t.closest('select, input, button:not(.tl-cell)')) return
  root.value?.focus({ preventScroll: true })
}

// ── Summary ────────────────────────────────────────────────────────────────
const summary = computed(() => daySummary(state))
const rows = computed(() =>
  (Object.keys(summary.value.hours) as ActivityId[])
    .filter(a => summary.value.hours[a] > 0)
    .map(a => ({ act: a, label: activityLabel(a), hours: summary.value.hours[a], d: summary.value.byActivity[a] }))
    .sort((x, y) => y.hours - x.hours),
)
const sleepHours = computed(() => summary.value.hours.sleep)

const warnings = computed(() => {
  const out: { kind: 'bad' | 'warn'; text: string }[] = []
  if (sleepHours.value === 0) out.push({ kind: 'bad', text: 'No sleep scheduled at all. You will collapse — probably face-first into the keyboard.' })
  else if (sleepHours.value < 6) out.push({ kind: 'bad', text: `Only ${sleepHours.value}h of sleep. Energy will crater and efficiency with it. Aim for 7–8h.` })
  const t = summary.value.total
  if (t.energy < -4) out.push({ kind: 'warn', text: `Energy drains about ${Math.round(-t.energy)}/day on this routine. Add sleep or cut the heavy hours.` })
  if (t.stress > 3) out.push({ kind: 'warn', text: `Stress builds about ${Math.round(t.stress)}/day. At 100 you burn out — add Relax, Social or Exercise.` })
  return out
})

function fmt(n: number): string {
  return Math.abs(n) < 0.05 ? '0' : signed(n, Math.abs(n) < 10 ? 1 : 0)
}

// ── Hover readout ──────────────────────────────────────────────────────────
const hoverText = computed(() => {
  const h = hoverHour.value
  if (h === null) return ''
  const a = state.schedule[h] ?? 'relax'
  const d = hourDelta(state, a)
  let what = activityLabel(a)
  if (a === 'study') what += ` (${studyFocusLabel.value})`
  if (a === 'social') what += ` (${socialTarget.value ? socialTarget.value.name : 'anyone around'})`
  if (a === 'work') what += ` (${job.value?.title ?? 'no job'})`
  return `${hh(h)}–${hh(h + 1)} · ${what}: energy ${fmt(d.energy)}/h, stress ${fmt(d.stress)}/h`
})

// ── Assignments ────────────────────────────────────────────────────────────
const job = computed(() => currentJob(state))
const program = computed(() => (state.edu.enrolled ? C.programs.get(state.edu.enrolled.program) : undefined))

const studyValue = computed<string>({
  get() {
    const f = state.focus.study
    return f.kind === 'skill' ? `skill:${f.skill}` : `course:${f.course}`
  },
  set(v: string) {
    const [kind, id] = v.split(':')
    if (!id) return
    if (kind === 'course') state.focus.study = { kind: 'course', course: id }
    else {
      const skill = SKILLS.find(s => s === id)
      if (skill) state.focus.study = { kind: 'skill', skill }
    }
  },
})
const ownedCourses = computed(() =>
  state.edu.coursesOwned
    .map(id => C.courses.get(id))
    .filter(c => c !== undefined)
    .map(c => ({ id: c.id, name: c.name, pct: Math.min(100, Math.round(((state.edu.courseProgress[c.id] ?? 0) / Math.max(1, c.hours)) * 100)) })),
)
const studyFocusLabel = computed(() => {
  const f = state.focus.study
  if (f.kind === 'skill') return skillLabel(f.skill)
  return C.courses.get(f.course)?.name ?? 'a course'
})

const UNAVAILABLE = ['dead', 'missing', 'gone', 'jailed', 'arrested']
const socialOptions = computed(() =>
  [...C.npcs.values()]
    .filter(n => n.social === true)
    .map(n => ({ def: n, s: state.npcs[n.id] }))
    .filter(x => x.s?.met === true && !UNAVAILABLE.includes(x.s.fate))
    .map(x => ({ id: x.def.id, name: x.def.name, affinity: Math.round(x.s?.affinity ?? 0) }))
    .sort((a, b) => b.affinity - a.affinity),
)
const socialValue = computed<string>({
  get: () => state.focus.social ?? '',
  set: (v: string) => {
    state.focus.social = v || null
  },
})
const socialTarget = computed(() => socialOptions.value.find(o => o.id === state.focus.social))
const socialLost = computed(() => (state.focus.social && !socialTarget.value ? (C.npcs.get(state.focus.social)?.name ?? state.focus.social) : ''))

function workInfo(kind: ContractKind): { title: string; detail: string; ready: boolean; active: boolean } {
  const hours = countSlots(state, kind)
  const c = state.contracts.active.find(x => x.kind === kind)
  if (!c) {
    return {
      title: 'Practice',
      detail: kind === 'hack' ? 'No active contract — practicing Intrusion & Networking.' : 'No active gig — practicing Programming & Business, plus the odd tip.',
      ready: false,
      active: false,
    }
  }
  if (c.status === 'ready') return { title: c.title, detail: 'Work is done. Ready to execute — open Ops.', ready: true, active: true }
  const need = effectiveHours(c)
  const perHour = workSpeed(state, c) * efficiency(state)
  const left = Math.max(0, need - c.progress)
  const pct = need > 0 ? Math.round((c.progress / need) * 100) : 0
  const eta = hours > 0 && perHour > 0 ? `≈ ${Math.max(0.1, left / perHour / hours).toFixed(1)} days at ${hours}h/day` : 'no hours scheduled — it will not progress'
  return { title: c.title, detail: `${pct}% done · ${eta}`, ready: false, active: true }
}
const hackInfo = computed(() => workInfo('hack'))
const gigInfo = computed(() => workInfo('freelance'))

const suspended = computed(() => {
  if (state.hospital) return 'You are in hospital. The planner is on hold until you are discharged.'
  if (state.jail) return 'You are in custody. Only your sleep hours still mean anything in a cell.'
  return ''
})
</script>

<template>
  <div ref="root" class="app planner" tabindex="-1" @keydown="onKey" @pointerdown.capture="focusRoot">
    <div class="toolbar">
      <div class="palette" role="radiogroup" aria-label="Brush">
        <button
          v-for="(a, i) in PAINTABLE_ACTIVITIES"
          :key="a"
          type="button"
          role="radio"
          class="brush"
          :class="{ on: brush === a }"
          :aria-checked="brush === a"
          :title="`${ACTIVITY_META[a].blurb} (key ${i + 1})`"
          @click="brush = a"
        >
          <span class="sw" :style="{ background: `var(--act-${a})`, color: `var(--act-${a}-ink)` }">{{ ACTIVITY_META[a].glyph }}</span>
          <span>{{ activityLabel(a) }}</span>
        </button>
      </div>
      <span class="grow"></span>
      <label class="sr-only" for="preset-select">Routine preset</label>
      <select id="preset-select" v-model="presetChoice" class="preset" @change="onPreset">
        <option value="">Presets…</option>
        <option v-for="(p, key) in PRESETS" :key="key" :value="key">{{ p.label }}</option>
      </select>
      <button type="button" class="btn small" :disabled="undoStack.length === 0" title="Undo (Ctrl+Z)" @click="undo">↶ Undo</button>
    </div>

    <div v-if="suspended" class="banner bad">{{ suspended }}</div>

    <div class="board panel">
      <Timeline :brush="brush" @stroke="pushUndo" @pick="brush = $event" @hover="hoverHour = $event" />
      <DayForecast />
      <div class="hoverbar">
        <template v-if="hoverText">{{ hoverText }}</template>
        <span v-else class="muted">Drag to paint with <b>{{ activityLabel(brush) }}</b> · right-click an hour to pick its activity · keys 1–7 switch brush · Ctrl+Z undoes</span>
      </div>
    </div>

    <div class="lower scroll">
      <div class="group sum">
        <div class="group-title">Day at a glance <span class="muted est">(estimate)</span></div>
        <table class="table sum-table">
          <thead>
            <tr>
              <th>Activity</th>
              <th class="num">Hours</th>
              <th class="num">Energy</th>
              <th class="num">Stress</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="r in rows" :key="r.act">
              <td>
                <span class="dot" :style="{ background: `var(--act-${r.act})` }"></span>{{ r.label }}
                <span v-if="r.act === 'study'" class="muted">· {{ studyFocusLabel }}</span>
              </td>
              <td class="num">{{ r.hours }}h</td>
              <td class="num" :class="r.d.energy >= 0 ? 'good' : ''">{{ fmt(r.d.energy) }}</td>
              <td class="num" :class="r.d.stress <= 0 ? 'good' : r.d.stress > 3 ? 'bad' : ''">{{ fmt(r.d.stress) }}</td>
            </tr>
            <tr class="daily" title="Food, home comfort and daily perks, applied at midnight">
              <td><span class="dot daily-dot"></span>Food, home &amp; perks</td>
              <td class="num">—</td>
              <td class="num">{{ fmt(summary.daily.energy) }}</td>
              <td class="num">{{ fmt(summary.daily.stress) }}</td>
            </tr>
          </tbody>
          <tfoot>
            <tr>
              <td>Net per day</td>
              <td class="num">24h</td>
              <td class="num" :class="summary.total.energy >= 0 ? 'good' : 'bad'">{{ fmt(summary.total.energy) }}</td>
              <td class="num" :class="summary.total.stress <= 0 ? 'good' : 'bad'">{{ fmt(summary.total.stress) }}</td>
            </tr>
          </tfoot>
        </table>
        <div class="extra muted">Mood {{ fmt(summary.total.mood) }}/day · Health {{ fmt(summary.total.health) }}/day · Energy is capped at 0–100, so surplus sleep is wasted.</div>
        <div v-for="(w, i) in warnings" :key="i" class="warnline" :class="w.kind">⚠ {{ w.text }}</div>
      </div>

      <div class="group assign">
        <div class="group-title">What your hours go to</div>

        <div class="field">
          <label for="study-focus"><span class="dot" style="background: var(--act-study)"></span>Study</label>
          <select id="study-focus" v-model="studyValue">
            <optgroup label="Skills">
              <option v-for="s in SKILLS" :key="s" :value="`skill:${s}`">{{ SKILL_META[s].glyph }} {{ skillLabel(s) }} (Lv {{ state.skills[s].level }})</option>
            </optgroup>
            <optgroup v-if="ownedCourses.length" label="My courses">
              <option v-for="c in ownedCourses" :key="c.id" :value="`course:${c.id}`">📚 {{ c.name }} — {{ c.pct }}%</option>
            </optgroup>
          </select>
          <span class="hint muted">{{ countSlots(state, 'study') }}h/day</span>
        </div>

        <div class="field">
          <label for="social-target"><span class="dot" style="background: var(--act-social)"></span>Social</label>
          <select id="social-target" v-model="socialValue">
            <option value="">Nobody in particular</option>
            <option v-for="o in socialOptions" :key="o.id" :value="o.id">{{ o.name }} (♥ {{ o.affinity }})</option>
          </select>
          <span class="hint muted">{{ countSlots(state, 'social') }}h/day</span>
        </div>
        <div v-if="socialLost" class="sub bad">{{ socialLost }} can't be reached right now.</div>
        <div v-else-if="socialOptions.length === 0" class="sub muted">You haven't met anyone to hang out with yet. The forums are a start.</div>

        <div class="field static">
          <span class="lbl"><span class="dot" style="background: var(--act-hack)"></span>Hacking</span>
          <span class="val">
            <b :class="{ good: hackInfo.ready }">{{ hackInfo.title }}</b>
            <span class="muted"> — {{ hackInfo.detail }}</span>
          </span>
          <span class="hint muted">{{ countSlots(state, 'hack') }}h/day</span>
        </div>
        <div class="field static">
          <span class="lbl"><span class="dot" style="background: var(--act-freelance)"></span>Freelance</span>
          <span class="val">
            <b :class="{ good: gigInfo.ready }">{{ gigInfo.title }}</b>
            <span class="muted"> — {{ gigInfo.detail }}</span>
          </span>
          <span class="hint muted">{{ countSlots(state, 'freelance') }}h/day</span>
        </div>
        <div class="sub">
          <button type="button" class="btn small" @click="openApp('ops')">Open Operations…</button>
        </div>

        <div class="field static">
          <span class="lbl"><span class="dot" style="background: var(--act-work)"></span>Work</span>
          <span v-if="job" class="val">{{ job.title }} · {{ shiftLabel(job.shiftStart, job.hours) }} <span class="muted">(locked)</span></span>
          <span v-else class="val muted">Unemployed. <a href="#" @click.prevent="openApp('jobs')">Find a job</a></span>
        </div>
        <div v-if="program" class="field static">
          <span class="lbl"><span class="dot" style="background: var(--act-class)"></span>Classes</span>
          <span class="val">{{ program.name }} · {{ shiftLabel(program.classStart, program.classHours) }} <span class="muted">(locked)</span></span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.planner {
  position: relative;
  outline: none;
  gap: 6px;
}
.toolbar {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}
.palette {
  display: flex;
  flex-wrap: wrap;
  gap: 2px;
}
.brush {
  font: inherit;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 6px 2px 2px;
  border: 1px solid #bdbba9;
  border-radius: var(--radius);
  background: linear-gradient(#fff, var(--btn-bg));
  cursor: pointer;
}
.brush:hover {
  box-shadow: inset 0 0 0 1px #f8b636;
}
.brush.on {
  border-color: var(--btn-border);
  background: linear-gradient(#dfe9f8, #fff);
  font-weight: bold;
  box-shadow: inset 0 1px 2px rgb(0 0 0 / 20%);
}
.brush:focus-visible,
.preset:focus-visible {
  outline: 1px dotted #000;
  outline-offset: 1px;
}
.sw {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 18px;
  padding: 0 2px;
  border-radius: 2px;
  font-size: 9px;
  font-weight: bold;
  box-shadow: inset 0 -4px 6px rgb(0 0 0 / 12%);
}
.preset {
  height: 21px;
}
.banner {
  padding: 4px 8px;
  border: 1px solid #efc5c1;
  background: #fbeceb;
}
.board {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 8px 8px 4px;
  background: var(--panel-alt);
}
.hoverbar {
  font-size: 11px;
  min-height: 15px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.lower {
  display: flex;
  gap: 8px;
  align-items: flex-start;
}
.sum {
  flex: 1.1;
  min-width: 0;
}
.assign {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 5px;
}
.est {
  font-weight: normal;
  font-size: 11px;
}
.sum-table {
  font-size: 11px;
}
.sum-table th,
.sum-table td {
  padding: 2px 6px;
}
.sum-table .num {
  text-align: right;
  white-space: nowrap;
}
.sum-table tfoot td {
  font-weight: bold;
  border-top: 1px solid #c8c6b6;
  background: #fbfbf7;
}
.daily td {
  color: var(--muted);
}
.dot {
  display: inline-block;
  width: 9px;
  height: 9px;
  border-radius: 2px;
  margin-right: 5px;
  vertical-align: -1px;
  border: 1px solid rgb(0 0 0 / 15%);
}
.daily-dot {
  background: repeating-linear-gradient(135deg, #c9c7b8 0 2px, #fff 2px 4px);
}
.extra {
  font-size: 10px;
  margin-top: 4px;
}
.warnline {
  margin-top: 4px;
  padding: 3px 6px;
  font-size: 11px;
  border: 1px solid;
  border-radius: var(--radius);
}
.warnline.bad {
  color: var(--bad);
  background: #fbeceb;
  border-color: #efc5c1;
}
.warnline.warn {
  color: var(--warn);
  background: #fdf3e2;
  border-color: #f0d6a8;
}
.field {
  display: flex;
  align-items: center;
  gap: 6px;
}
.field label,
.field .lbl {
  width: 74px;
  flex: none;
  font-weight: bold;
}
.field select {
  flex: 1;
  min-width: 0;
}
.field .val {
  flex: 1;
  min-width: 0;
  font-size: 11px;
}
.field.static {
  align-items: flex-start;
}
.hint {
  font-size: 10px;
  white-space: nowrap;
}
.sub {
  margin-left: 80px;
  font-size: 11px;
}
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
}
</style>
