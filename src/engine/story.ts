import { DAYS_PER_STEP, MIN_TIMER_DAYS, skillMod } from './balance'
import { evalCond } from './conditions'
import { applyEffects } from './effects'
import { modAdd } from './mods'
import { C } from './registry'
import { d20, rand, weighted } from './rng'
import { log, notify, renderLine } from './text'
import { pause, touchNpc } from './time'
import { unlock } from './unlocks'
import type { Choice, GameState, RollRecord, SceneDef, SceneNode, SkillCheck, SkillId, ThreadState } from './types'

// ────────────────────────────────────────────────────────────────────────────
// Skill checks
// ────────────────────────────────────────────────────────────────────────────

export interface CheckPreview {
  skill: SkillId
  level: number
  mod: number
  dc: number
  /** Probability of success, 0..1. */
  chance: number
  bonuses: { label: string; add: number }[]
}

/** Base check modifier for a skill: floor(level/4) + gear/buff/trait bonuses. */
export function checkMod(state: GameState, skill: SkillId): number {
  return skillMod(state.skills[skill].level) + modAdd(state, `check.${skill}`) + modAdd(state, 'check.all')
}

export function chanceOf(mod: number, dc: number): number {
  const need = dc - mod // need d20 >= need
  const wins = Math.min(19, Math.max(1, 21 - need))
  return wins / 20
}

export function previewCheck(state: GameState, check: SkillCheck): CheckPreview {
  const bonuses = (check.bonuses ?? []).filter(b => evalCond(state, b.if)).map(b => ({ label: b.label, add: b.add }))
  const mod = checkMod(state, check.skill) + bonuses.reduce((s, b) => s + b.add, 0)
  return {
    skill: check.skill,
    level: state.skills[check.skill].level,
    mod,
    dc: check.dc,
    chance: chanceOf(mod, check.dc),
    bonuses,
  }
}

export function rollCheck(state: GameState, skill: SkillId, dc: number, extra = 0): RollRecord {
  const die = d20(state)
  const mod = checkMod(state, skill) + extra
  const total = die + mod
  const success = die === 20 || (die !== 1 && total >= dc)
  if (success) state.totals.checksPassed += 1
  else state.totals.checksFailed += 1
  return { skill, d20: die, mod, dc, total, success }
}

// ────────────────────────────────────────────────────────────────────────────
// Threads (a delivered scene instance)
// ────────────────────────────────────────────────────────────────────────────

export function sceneOf(thread: ThreadState): SceneDef | undefined {
  return C.scenes.get(thread.scene)
}

export function nodeOf(thread: ThreadState): SceneNode | undefined {
  return sceneOf(thread)?.nodes[thread.node]
}

export function findThread(state: GameState, uid: number): ThreadState | undefined {
  return state.threads.find(t => t.uid === uid)
}

/** Deliver a scene now, or schedule it `delayHours` later. */
export function deliverScene(state: GameState, id: string, delayHours?: number): ThreadState | undefined {
  const scene = C.scenes.get(id)
  if (!scene) {
    console.warn(`[story] unknown scene "${id}"`)
    return undefined
  }
  if (delayHours !== undefined && delayHours > 0) {
    // Content delays are calendar hours. Under a day they stay as-is (a beat later this turn);
    // longer ones shrink by DAYS_PER_STEP because each simulated day is a whole week.
    const simHours = delayHours < 24 ? delayHours : Math.max(1, Math.round(delayHours / DAYS_PER_STEP))
    state.pendingScenes.push({ scene: id, atHour: state.time.totalHours + simHours })
    return undefined
  }
  // Don't duplicate a scene that is still pending an answer.
  const live = state.threads.find(t => t.scene === id && (t.status === 'unread' || t.status === 'open'))
  if (live) return live
  const thread: ThreadState = {
    uid: state.nextUid++,
    scene: id,
    channel: scene.channel,
    node: scene.start,
    status: 'unread',
    receivedDay: state.time.day,
    receivedHour: state.time.hour,
    history: [],
  }
  state.threads.push(thread)
  state.seenScenes[id] = true
  state.events.lastSceneDay = state.time.day
  if (scene.channel === 'mail') unlock(state, 'mail')
  else if (scene.channel === 'chat') unlock(state, 'pager')
  else if (scene.channel === 'forum') unlock(state, 'forum')
  enterNode(state, thread, scene.start)
  const from = scene.from ? (C.npcs.get(scene.from)?.name ?? scene.from) : undefined
  switch (scene.channel) {
    case 'mail':
      notify(state, `New mail${from ? ` from ${from}` : ''}: ${scene.title}`, 'story')
      break
    case 'chat':
      notify(state, `${from ?? 'Someone'} is messaging you`, 'story')
      break
    case 'forum':
      notify(state, `Forum: ${scene.title}`, 'story')
      break
    case 'dialog':
      log(state, scene.title, 'story')
      break
  }
  if (scene.from) touchNpc(state, scene.from)
  const shouldPause = scene.pause ?? scene.channel === 'dialog'
  if (shouldPause && state.settings.autoPauseDialogs) {
    pause(state)
    // Speed governor: story beats resume at 2x at most.
    state.time.lastSpeed = Math.min(state.time.lastSpeed, 2)
  }
  return thread
}

function enterNode(state: GameState, thread: ThreadState, nodeId: string): void {
  const scene = sceneOf(thread)
  const node = scene?.nodes[nodeId]
  if (!scene || !node) {
    console.warn(`[story] scene "${thread.scene}" has no node "${nodeId}"`)
    thread.status = 'done'
    return
  }
  thread.node = nodeId
  thread.history.push({ node: nodeId })
  applyEffects(state, node.effects)
  if (isTerminal(node)) thread.status = thread.status === 'unread' ? 'unread' : 'done'
}

/** A node with no way forward ends the thread. */
export function isTerminal(node: SceneNode): boolean {
  return !node.next && !node.mission && (!node.choices || node.choices.length === 0)
}

export function markRead(state: GameState, uid: number): void {
  const t = findThread(state, uid)
  if (t?.status !== 'unread') return
  const node = nodeOf(t)
  t.status = node && isTerminal(node) ? 'done' : 'open'
}

export interface ChoiceView {
  index: number
  choice: Choice
  text: string
  locked: boolean
  reqText: string
  check?: CheckPreview
}

export function choicesFor(state: GameState, thread: ThreadState): ChoiceView[] {
  const node = nodeOf(thread)
  if (!node?.choices) return []
  const out: ChoiceView[] = []
  node.choices.forEach((choice, index) => {
    if (choice.if && !evalCond(state, choice.if)) return
    const locked = choice.req !== undefined && !evalCond(state, choice.req)
    out.push({
      index,
      choice,
      text: renderLine(state, choice.text),
      locked,
      reqText: locked ? (choice.reqText ?? 'Requirements not met') : '',
      ...(choice.check ? { check: previewCheck(state, choice.check) } : {}),
    })
  })
  return out
}

export interface ChooseResult {
  ok: boolean
  roll?: RollRecord
}

export function choose(state: GameState, uid: number, index: number): ChooseResult {
  const thread = findThread(state, uid)
  if (!thread || thread.status === 'done' || thread.status === 'expired') return { ok: false }
  const node = nodeOf(thread)
  const choice = node?.choices?.[index]
  if (!choice) return { ok: false }
  if (choice.if && !evalCond(state, choice.if)) return { ok: false }
  if (choice.req && !evalCond(state, choice.req)) return { ok: false }
  const entry = thread.history[thread.history.length - 1]
  if (entry) entry.choice = index
  thread.status = 'open'
  applyEffects(state, choice.effects)
  if (choice.check) {
    const preview = previewCheck(state, choice.check)
    const bonus = preview.mod - checkMod(state, choice.check.skill)
    const roll = rollCheck(state, choice.check.skill, choice.check.dc, bonus)
    if (entry) entry.roll = roll
    applyEffects(state, roll.success ? choice.check.successEffects : choice.check.failEffects)
    enterNode(state, thread, roll.success ? choice.check.success : choice.check.fail)
    return { ok: true, roll }
  }
  if (choice.goto) enterNode(state, thread, choice.goto)
  else thread.status = 'done'
  return { ok: true }
}

/** "Continue" on a node with `next`. */
export function advance(state: GameState, uid: number): boolean {
  const thread = findThread(state, uid)
  if (!thread) return false
  const node = nodeOf(thread)
  if (!node?.next) return false
  thread.status = 'open'
  enterNode(state, thread, node.next)
  return true
}

/** Close a thread that has reached a terminal node. */
export function finishThread(state: GameState, uid: number): void {
  const thread = findThread(state, uid)
  if (!thread) return
  const node = nodeOf(thread)
  if (!node || isTerminal(node)) thread.status = 'done'
}

/** Terminal mission finished by hand. */
export function missionResult(state: GameState, uid: number, won: boolean): void {
  const thread = findThread(state, uid)
  const node = thread ? nodeOf(thread) : undefined
  if (!thread || !node?.mission) return
  state.missions[node.mission.mission] = won ? 'won' : 'lost'
  const entry = thread.history[thread.history.length - 1]
  if (entry) entry.mission = won ? 'won' : 'lost'
  enterNode(state, thread, won ? node.mission.success : node.mission.fail)
}

/** Skip the terminal: resolve the mission with a skill check. */
export function missionAuto(state: GameState, uid: number): RollRecord | undefined {
  const thread = findThread(state, uid)
  const node = thread ? nodeOf(thread) : undefined
  if (!thread || !node?.mission) return undefined
  const roll = rollCheck(state, node.mission.auto.skill, node.mission.auto.dc)
  state.missions[node.mission.mission] = roll.success ? 'won' : 'lost'
  const entry = thread.history[thread.history.length - 1]
  if (entry) {
    entry.mission = roll.success ? 'auto-won' : 'auto-lost'
    entry.roll = roll
  }
  enterNode(state, thread, roll.success ? node.mission.success : node.mission.fail)
  return roll
}

/** Deliver scheduled scenes whose time has come. */
export function deliverPending(state: GameState): void {
  if (state.pendingScenes.length === 0) return
  const due = state.pendingScenes.filter(p => p.atHour <= state.time.totalHours)
  if (due.length === 0) return
  state.pendingScenes = state.pendingScenes.filter(p => p.atHour > state.time.totalHours)
  for (const p of due) deliverScene(state, p.scene)
}

/** Daily: expire unanswered threads. */
export function expireThreads(state: GameState): void {
  for (const t of state.threads) {
    if (t.status !== 'unread' && t.status !== 'open') continue
    const scene = sceneOf(t)
    if (!scene?.expiresDays) continue
    if (state.time.day - t.receivedDay >= Math.max(scene.expiresDays, MIN_TIMER_DAYS)) {
      t.status = 'expired'
      log(state, `No reply sent: "${scene.title}" — the moment passed.`, 'bad')
      applyEffects(state, scene.onExpire)
    }
  }
  // Keep the thread list bounded: drop old finished non-dialog threads beyond 400.
  if (state.threads.length > 400) {
    const keep = state.threads.filter(t => t.status === 'unread' || t.status === 'open')
    const done = state.threads.filter(t => t.status === 'done' || t.status === 'expired')
    state.threads = [...done.slice(-300), ...keep]
  }
}

/** The dialog the UI should show now (oldest unfinished dialog-channel thread). */
export function activeDialog(state: GameState): ThreadState | undefined {
  return state.threads.find(t => t.channel === 'dialog' && (t.status === 'unread' || t.status === 'open'))
}

// ────────────────────────────────────────────────────────────────────────────
// News, forum, endings
// ────────────────────────────────────────────────────────────────────────────

export function publishNews(state: GameState, id: string): void {
  const def = C.news.get(id)
  if (!def) {
    console.warn(`[story] unknown news "${id}"`)
    return
  }
  if (state.news.some(n => n.id === id)) return
  state.news.push({ id, day: state.time.day, read: false })
  unlock(state, 'news')
  applyEffects(state, def.effects)
  if (!def.ambient) notify(state, `📰 ${def.headline}`, 'story')
  else log(state, `📰 ${def.headline}`, 'info')
}

/** Daily: occasionally publish an eligible ambient headline. */
/** Once per turn: maybe publish an eligible ambient headline (`everyDays` = average spacing). */
export function ambientNews(state: GameState, everyDays: number): void {
  if (rand(state) >= Math.min(1, DAYS_PER_STEP / Math.max(1, everyDays) / 3)) return
  const pool = C.ambientNews.filter(n => !state.news.some(p => p.id === n.id) && evalCond(state, n.ambient))
  const pickDef = weighted(state, pool, n => n.weight ?? 1)
  if (pickDef) publishNews(state, pickDef.id)
}

export function postForum(state: GameState, id: string): void {
  if (!C.forum.has(id)) {
    console.warn(`[story] unknown forum thread "${id}"`)
    return
  }
  if (state.forum.some(f => f.id === id)) return
  unlock(state, 'forum', true)
  state.forum.push({ id, day: state.time.day, read: false })
}

/** Daily: conditional forum threads appear. */
export function dailyForum(state: GameState): void {
  for (const f of C.conditionalForum) {
    if (state.forum.some(p => p.id === f.id)) continue
    if (evalCond(state, f.appears)) postForum(state, f.id)
  }
}

export function reachEnding(state: GameState, id: string): void {
  if (!C.endings.has(id)) {
    console.warn(`[story] unknown ending "${id}"`)
    return
  }
  state.ending = id
  if (!state.endingsSeen.includes(id)) state.endingsSeen.push(id)
  state.flags['sys.postgame'] = false
  pause(state)
}
