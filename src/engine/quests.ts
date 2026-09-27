import { MIN_TIMER_DAYS, perStep } from './balance'
import { evalCond } from './conditions'
import { unlock } from './unlocks'
import { applyEffects } from './effects'
import { C } from './registry'
import { rand } from './rng'
import { log, notify } from './text'
import type { Effect, GameState, ObjectiveDef, QuestDef, QuestState, QuestStageDef } from './types'

type QuestEffect = Extract<Effect, { quest: string }>

export function startQuest(state: GameState, id: string): boolean {
  const def = C.quests.get(id)
  if (!def) {
    console.warn(`[quests] unknown quest "${id}"`)
    return false
  }
  if (state.quests[id]) return false
  const q: QuestState = {
    status: 'active',
    stage: def.start,
    startedDay: state.time.day,
    stageDay: state.time.day,
    done: [],
    history: [],
  }
  state.quests[id] = q
  if (def.kind === 'main') unlock(state, 'journal')
  notify(state, `New quest: ${def.title}`, 'quest')
  if (!state.trackedQuest || def.kind === 'main') {
    const tracked = state.trackedQuest ? C.quests.get(state.trackedQuest) : undefined
    if (!tracked || state.quests[tracked.id]?.status !== 'active' || def.kind === 'main') state.trackedQuest = id
  }
  enterStage(state, def, q, def.start)
  return true
}

function enterStage(state: GameState, def: QuestDef, q: QuestState, stageId: string): void {
  const stage = def.stages[stageId]
  if (!stage) {
    console.warn(`[quests] quest "${def.id}" has no stage "${stageId}"`)
    endQuest(state, def, q, 'failed')
    return
  }
  q.stage = stageId
  q.stageDay = state.time.day
  q.done = []
  applyEffects(state, stage.onEnter)
}

function endQuest(state: GameState, def: QuestDef, q: QuestState, outcome: 'completed' | 'failed'): void {
  if (q.status !== 'active') return
  q.status = outcome
  q.endedDay = state.time.day
  if (!q.history.includes(q.stage)) q.history.push(q.stage)
  notify(state, `${outcome === 'completed' ? 'Quest complete' : 'Quest failed'}: ${def.title}`, outcome === 'completed' ? 'quest' : 'bad')
  if (state.trackedQuest === def.id) state.trackedQuest = pickTracked(state)
}

function pickTracked(state: GameState): string | null {
  let best: { id: string; score: number } | null = null
  for (const [id, q] of Object.entries(state.quests)) {
    if (q.status !== 'active') continue
    const def = C.quests.get(id)
    if (!def) continue
    const score = (def.kind === 'main' ? 1000 : 0) + (def.priority ?? 0) + q.startedDay / 10000
    if (!best || score > best.score) best = { id, score }
  }
  return best?.id ?? null
}

function nextStage(state: GameState, stage: QuestStageDef): string | undefined {
  if (stage.next === undefined) return undefined
  if (typeof stage.next === 'string') return stage.next
  for (const b of stage.next) if (!b.if || evalCond(state, b.if)) return b.stage
  return undefined
}

function completeStage(state: GameState, def: QuestDef, q: QuestState, stage: QuestStageDef): void {
  applyEffects(state, stage.onComplete)
  if (!isActive(q)) return // effects may have ended/redirected it
  const next = nextStage(state, stage)
  q.history.push(q.stage)
  if (next) {
    enterStage(state, def, q, next)
    log(state, `Quest updated: ${def.title}`, 'quest')
  } else {
    endQuest(state, def, q, stage.outcome ?? 'completed')
  }
}

/** Status read through a function so TS doesn't narrow it across effect calls that mutate it. */
function isActive(q: QuestState): boolean {
  return q.status === 'active'
}

export function objectiveDone(q: QuestState, obj: ObjectiveDef): boolean {
  return q.done.includes(obj.id)
}

/** Evaluate objectives, advance stages, handle time limits. Runs hourly. */
export function checkQuests(state: GameState): void {
  for (const def of C.autoQuests) {
    if (!state.quests[def.id] && evalCond(state, def.autoStart)) startQuest(state, def.id)
  }
  for (const [id, q] of Object.entries(state.quests)) {
    if (q.status !== 'active') continue
    const def = C.quests.get(id)
    if (!def) continue
    // Loop: completing a stage may immediately satisfy the next one.
    for (let guard = 0; guard < 12 && isActive(q); guard++) {
      const stage = def.stages[q.stage]
      if (!stage) break
      for (const obj of stage.objectives) {
        if (!objectiveDone(q, obj) && evalCond(state, obj.when)) {
          q.done.push(obj.id)
          if (!obj.hidden) log(state, `✓ ${typeof obj.text === 'string' ? obj.text : def.title}`, 'quest')
        }
      }
      const allDone = stage.objectives.every(o => o.optional === true || objectiveDone(q, o))
      if (allDone) {
        const before = q.stage
        completeStage(state, def, q, stage)
        if (q.stage === before) break
        continue
      }
      if (stage.timeLimitDays !== undefined && state.time.day - q.stageDay >= effectiveLimit(stage.timeLimitDays)) {
        const t = stage.onTimeout
        applyEffects(state, t?.effects)
        if (!isActive(q)) break
        if (t?.stage) {
          q.history.push(q.stage)
          enterStage(state, def, q, t.stage)
          notify(state, `Out of time: ${def.title}`, 'bad')
          continue
        }
        endQuest(state, def, q, t?.fail === false ? 'completed' : 'failed')
      }
      break
    }
  }
}

export function questEffect(state: GameState, e: QuestEffect): void {
  const def = C.quests.get(e.quest)
  if (!def) {
    console.warn(`[quests] unknown quest "${e.quest}"`)
    return
  }
  if (e.start) startQuest(state, e.quest)
  // Stage/objective on a never-started quest: start it first.
  if (!state.quests[e.quest] && (e.stage !== undefined || e.objective !== undefined || e.complete || e.fail)) {
    startQuest(state, e.quest)
  }
  const qs = state.quests[e.quest]
  if (qs?.status !== 'active') return
  if (e.stage) {
    qs.history.push(qs.stage)
    enterStage(state, def, qs, e.stage)
  }
  if (e.objective && !qs.done.includes(e.objective)) qs.done.push(e.objective)
  if (e.complete) endQuest(state, def, qs, 'completed')
  if (e.fail) endQuest(state, def, qs, 'failed')
}

/** Timers shorter than two turns are stretched so the player gets to react. */
function effectiveLimit(days: number): number {
  return Math.max(days, MIN_TIMER_DAYS)
}

/** Days left on the current stage's time limit (undefined if none). */
export function daysLeft(state: GameState, id: string): number | undefined {
  const q = state.quests[id]
  const def = C.quests.get(id)
  if (!q || !def || q.status !== 'active') return undefined
  const stage = def.stages[q.stage]
  if (stage?.timeLimitDays === undefined) return undefined
  return effectiveLimit(stage.timeLimitDays) - (state.time.day - q.stageDay)
}

/** Any active quest with a running timer (the speed governor caps speed while true). */
export function hasTimedQuest(state: GameState): boolean {
  for (const id of Object.keys(state.quests)) if (daysLeft(state, id) !== undefined) return true
  return false
}

// ────────────────────────────────────────────────────────────────────────────
// Triggers
// ────────────────────────────────────────────────────────────────────────────

export function checkTriggers(state: GameState): void {
  for (const t of C.triggers) {
    const rec = state.triggers[t.id]
    const once = t.once ?? true
    if (once && rec && rec.fired > 0) continue
    if (rec && t.cooldownDays !== undefined && state.time.day - rec.lastDay < t.cooldownDays) continue
    if (t.atHour !== undefined && t.atHour !== state.time.hour) continue
    if (!evalCond(state, t.when)) continue
    // Trigger chances were authored per daily/hourly check; a turn covers a whole week.
    if (t.chance !== undefined && rand(state) >= perStep(t.chance)) continue
    state.triggers[t.id] = { fired: (rec?.fired ?? 0) + 1, lastDay: state.time.day }
    applyEffects(state, t.effects)
  }
}
