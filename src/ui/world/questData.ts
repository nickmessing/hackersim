/**
 * Quest Journal view-model: groups, labels, and per-objective state as the journal shows it.
 * All progress logic (latching, stages, timers) is the engine's; this only reads it.
 */
import { C, daysLeft, numRef, objectiveDone, renderLine } from '@/engine'
import type { GameState, ObjectiveDef, QuestDef, QuestKind, QuestState, QuestStatus } from '@/engine'
import type { Tone } from './util'

export const KIND_ORDER: readonly QuestKind[] = ['main', 'faction', 'side', 'personal', 'tutorial']

export const KIND_LABELS: Record<QuestKind, { group: string; one: string; glyph: string }> = {
  main: { group: 'Main Story', one: 'Main Quest', glyph: '✦' },
  faction: { group: 'Factions', one: 'Faction Quest', glyph: '⚑' },
  side: { group: 'Side Quests', one: 'Side Quest', glyph: '❧' },
  personal: { group: 'Personal', one: 'Personal', glyph: '♥' },
  tutorial: { group: 'Getting Started', one: 'Tutorial', glyph: '✎' },
}

export const STATUS_LABELS: Record<QuestStatus, { label: string; tone: Tone }> = {
  active: { label: 'Active', tone: 'info' },
  completed: { label: 'Completed', tone: 'good' },
  failed: { label: 'Failed', tone: 'bad' },
}

export interface QuestEntry {
  id: string
  def: QuestDef
  q: QuestState
}

/** Every started quest that still has a definition. */
export function questEntries(state: GameState): QuestEntry[] {
  const out: QuestEntry[] = []
  for (const [id, q] of Object.entries(state.quests)) {
    const def = C.quests.get(id)
    if (def) out.push({ id, def, q })
  }
  return out
}

/** Journal order: active quests by priority then newest; finished ones by most recently ended. */
export function questSort(a: QuestEntry, b: QuestEntry): number {
  if (a.q.status === 'active' && b.q.status === 'active') {
    return (b.def.priority ?? 0) - (a.def.priority ?? 0) || b.q.startedDay - a.q.startedDay || a.def.title.localeCompare(b.def.title)
  }
  return (b.q.endedDay ?? 0) - (a.q.endedDay ?? 0) || a.def.title.localeCompare(b.def.title)
}

export interface ObjectiveView {
  def: ObjectiveDef
  key: string
  done: boolean
  text: string
  hint: string
  progress: { value: number; target: number; frac: number } | undefined
}

/** Objectives of a stage as the journal shows them (hidden ones only once done). */
export function objectiveViews(state: GameState, e: QuestEntry, stageId: string): ObjectiveView[] {
  const stage = e.def.stages[stageId]
  if (!stage) return []
  const current = stageId === e.q.stage
  const out: ObjectiveView[] = []
  for (const obj of stage.objectives) {
    // `q.done` only describes the current stage; earlier stages were finished to move on.
    const done = current ? objectiveDone(e.q, obj) : obj.optional !== true
    if (obj.hidden && !done) continue
    let progress: ObjectiveView['progress']
    if (obj.progress && obj.progress.target > 0) {
      const value = done ? Math.max(obj.progress.target, numRef(state, obj.progress.of)) : numRef(state, obj.progress.of)
      progress = { value, target: obj.progress.target, frac: Math.min(1, Math.max(0, value / obj.progress.target)) }
    }
    out.push({
      def: obj,
      key: `${e.id}:${stageId}:${obj.id}`,
      done,
      text: renderLine(state, obj.text),
      hint: renderLine(state, obj.hint),
      progress,
    })
  }
  return out
}

export interface Deadline {
  days: number
  label: string
  tone: Tone
  dueDay: number
}

export function deadlineOf(state: GameState, e: QuestEntry): Deadline | undefined {
  const left = daysLeft(state, e.id)
  if (left === undefined) return undefined
  const dueDay = state.time.day + Math.max(0, left)
  const label = left <= 0 ? 'Due today' : left === 1 ? '1 day left' : `${left} days left`
  const tone: Tone = left <= 1 ? 'bad' : left <= 3 ? 'warn' : 'info'
  return { days: left, label, tone, dueDay }
}
