<script setup lang="ts">
/**
 * 24-hour paintable timeline. Click-and-drag paints the brush activity over hours (work/class
 * hours are locked); right-click picks the activity under the cursor. Keyboard: focus a cell and
 * press Enter/Space to paint it.
 */
import { computed, ref, useTemplateRef } from 'vue'
import { setSlot, type ActivityId, type PaintableActivity } from '@/engine'
import { useGame } from '@/ui/game'
import { ACTIVITY_META, activityLabel, activityVars, hh } from '../labels'
import NowMarker from './NowMarker.vue'

const props = defineProps<{ brush: PaintableActivity }>()
const emit = defineEmits<{
  /** A paint stroke changed the schedule; `before` is the schedule prior to the stroke. */
  stroke: [before: ActivityId[]]
  pick: [activity: PaintableActivity]
  hover: [hour: number | null]
}>()

const state = useGame()
const grid = useTemplateRef<HTMLDivElement>('grid')
const painting = ref<boolean>(false)
const hoverHour = ref<number | null>(null)
let last = -1
let before: ActivityId[] = []

const HOURS = Array.from({ length: 24 }, (_, i) => i)

function isPaintable(a: ActivityId | undefined): a is PaintableActivity {
  return a !== undefined && a !== 'work' && a !== 'class'
}

function hourAt(e: PointerEvent | MouseEvent): number {
  const el = grid.value
  if (!el) return 0
  const r = el.getBoundingClientRect()
  const h = Math.floor(((e.clientX - r.left) / r.width) * 24)
  return Math.max(0, Math.min(23, h))
}

function paintRange(a: number, b: number): void {
  const lo = Math.min(a, b)
  const hi = Math.max(a, b)
  for (let h = lo; h <= hi; h++) if (state.schedule[h] !== props.brush) setSlot(state, h, props.brush)
}

function changed(): boolean {
  return state.schedule.some((a, i) => a !== before[i])
}

function onDown(e: PointerEvent): void {
  if (e.button !== 0) return
  e.preventDefault()
  try {
    grid.value?.setPointerCapture(e.pointerId)
  } catch {
    // Synthetic pointers can't be captured; painting still works while over the grid.
  }
  painting.value = true
  before = [...state.schedule]
  last = hourAt(e)
  paintRange(last, last)
}

function onMove(e: PointerEvent): void {
  const h = hourAt(e)
  if (hoverHour.value !== h) {
    hoverHour.value = h
    emit('hover', h)
  }
  if (!painting.value) return
  if (h !== last) {
    paintRange(last, h)
    last = h
  }
}

function onUp(e: PointerEvent): void {
  if (!painting.value) return
  painting.value = false
  if (grid.value?.hasPointerCapture(e.pointerId)) grid.value.releasePointerCapture(e.pointerId)
  if (changed()) emit('stroke', before)
}

function onLeave(): void {
  if (painting.value) return
  hoverHour.value = null
  emit('hover', null)
}

function onContext(e: MouseEvent): void {
  e.preventDefault()
  const a = state.schedule[hourAt(e)]
  if (isPaintable(a)) emit('pick', a)
}

function onKey(e: KeyboardEvent, h: number): void {
  if (e.key !== 'Enter' && e.key !== ' ') return
  e.preventDefault()
  before = [...state.schedule]
  paintRange(h, h)
  if (changed()) emit('stroke', before)
}

interface Run {
  start: number
  len: number
  act: ActivityId
}

const runs = computed<Run[]>(() => {
  const out: Run[] = []
  for (let h = 0; h < 24; h++) {
    const act = state.schedule[h] ?? 'relax'
    const prev = out[out.length - 1]
    if (prev?.act === act) prev.len++
    else out.push({ start: h, len: 1, act })
  }
  return out
})

function runLabel(r: Run): string {
  const glyph = ACTIVITY_META[r.act].glyph
  if (r.len >= 3) return `${activityLabel(r.act)} · ${r.len}h`
  if (r.len === 2) return `${glyph} 2h`
  return glyph
}

const suspended = computed(() => state.jail !== null || state.hospital !== null)

function cellTitle(h: number): string {
  const a = state.schedule[h] ?? 'relax'
  const lock = a === 'work' ? ' (locked: job shift)' : a === 'class' ? ' (locked: classes)' : ''
  return `${hh(h)}–${hh(h + 1)}: ${activityLabel(a)}${lock}`
}
</script>

<template>
  <div class="tl" :class="{ painting, suspended }">
    <div class="tl-hours" aria-hidden="true">
      <span v-for="h in HOURS" :key="h" :class="{ now: h === state.time.hour, major: h % 6 === 0 }">{{ String(h).padStart(2, '0') }}</span>
    </div>
    <div
      ref="grid"
      class="tl-grid"
      role="group"
      aria-label="Daily schedule, 24 hours"
      @pointerdown="onDown"
      @pointermove="onMove"
      @pointerup="onUp"
      @pointercancel="onUp"
      @pointerleave="onLeave"
      @contextmenu="onContext"
    >
      <button
        v-for="h in HOURS"
        :key="h"
        type="button"
        class="tl-cell"
        :class="{ locked: !isPaintable(state.schedule[h]), hot: hoverHour === h }"
        :style="activityVars(state.schedule[h] ?? 'relax')"
        :title="cellTitle(h)"
        :aria-label="cellTitle(h)"
        @keydown="onKey($event, h)"
      ></button>
      <div class="tl-runs" aria-hidden="true">
        <span
          v-for="r in runs"
          :key="`${r.start}-${r.act}`"
          class="tl-run"
          :class="{ locked: !isPaintable(r.act) }"
          :style="{ gridColumn: `${r.start + 1} / span ${r.len}`, color: `var(--act-${r.act}-ink)` }"
        >
          <span v-if="!isPaintable(r.act)" class="lock">🔒</span>{{ runLabel(r) }}
        </span>
      </div>
      <NowMarker class="tl-now" />
    </div>
  </div>
</template>

<style scoped>
.tl {
  user-select: none;
}
.tl-hours {
  display: grid;
  grid-template-columns: repeat(24, 1fr);
  font-size: 9px;
  color: var(--muted);
  margin-bottom: 1px;
}
.tl-hours span {
  padding-left: 2px;
  border-left: 1px solid #d8d6c8;
}
.tl-hours span.major {
  color: var(--win-fg);
  border-left-color: #9d9b8c;
}
.tl-hours span.now {
  color: var(--bad);
  font-weight: bold;
}
.tl-grid {
  position: relative;
  display: grid;
  grid-template-columns: repeat(24, 1fr);
  gap: 1px;
  height: 46px;
  padding: 1px;
  background: #fff;
  border: 1px solid var(--panel-border);
  cursor: crosshair;
  touch-action: none;
}
.tl-cell {
  all: unset;
  display: block;
  height: 100%;
  border-radius: 1px;
  box-shadow: inset 0 -8px 12px rgb(0 0 0 / 10%), inset 0 1px 0 rgb(255 255 255 / 30%);
}
.tl-cell.locked {
  background-image: var(--career-hatch);
  cursor: not-allowed;
}
.tl-cell.hot:not(.locked) {
  outline: 2px solid #fff;
  outline-offset: -3px;
}
.tl-cell:focus-visible {
  outline: 2px dotted #000;
  outline-offset: -3px;
}
.tl-runs {
  position: absolute;
  inset: 1px;
  display: grid;
  grid-template-columns: repeat(24, 1fr);
  gap: 1px;
  pointer-events: none;
}
.tl-run {
  grid-row: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  white-space: nowrap;
  font-size: 10px;
  font-weight: bold;
  text-shadow: 0 1px 1px rgb(0 0 0 / 20%);
  padding: 0 2px;
}
.lock {
  font-size: 8px;
  margin-right: 2px;
}
.tl-now {
  top: -4px;
  bottom: -2px;
}
.suspended .tl-grid {
  filter: grayscale(0.7);
  opacity: 0.8;
}
</style>
