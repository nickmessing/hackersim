import { DAYS_PER_STEP, SKILL_LABELS } from './balance'
import { ageOn } from './calendar'
import { money } from './format'
import { C } from './registry'
import { rand } from './rng'
import { isUnlocked } from './unlocks'
import type { Cond, GameState, NpcState, NumRef, StatId } from './types'

/** Read-only default for NPCs that have no state yet (never inserts into state). */
function defaultNpcState(id: string): NpcState {
  const def = C.npcs.get(id)
  return { met: def?.startsMet ?? false, affinity: def?.startAffinity ?? 0, fate: 'normal', romance: 'none' }
}

const STAT_LABELS: Record<StatId, string> = {
  money: 'Money',
  health: 'Health',
  energy: 'Energy',
  stress: 'Stress',
  mood: 'Mood',
  heat: 'Heat',
  cred: 'Cred',
}

function asArray<T>(x: T | T[]): T[] {
  return Array.isArray(x) ? x : [x]
}

/**
 * Weekly turns: the calendar lands only on every DAYS_PER_STEP-th day, so a `day` condition holds if
 * ANY calendar day of the current turn [day, day + DAYS_PER_STEP - 1] satisfies it. Exact dates
 * (holidays, "this Sunday") and windows narrower than a week would otherwise be skipped entirely.
 */
function dayInTurn(day: number, r: { gte?: number; lte?: number; eq?: number }): boolean {
  const last = day + DAYS_PER_STEP - 1
  if (r.gte !== undefined && last < r.gte) return false
  if (r.lte !== undefined && day > r.lte) return false
  if (r.eq !== undefined && (r.eq < day || r.eq > last)) return false
  return true
}

function inRange(v: number, r: { gte?: number; lte?: number; eq?: number }): boolean {
  if (r.gte !== undefined && v < r.gte) return false
  if (r.lte !== undefined && v > r.lte) return false
  if (r.eq !== undefined && v !== r.eq) return false
  return true
}

export function numRef(state: GameState, ref: NumRef): number {
  if ('skill' in ref) return state.skills[ref.skill].level
  if ('stat' in ref) return state.stats[ref.stat]
  if ('var' in ref) return state.vars[ref.var] ?? 0
  if ('faction' in ref) return state.factions[ref.faction] ?? 0
  if ('affinity' in ref) return state.npcs[ref.affinity]?.affinity ?? 0
  if ('jobLevel' in ref) return state.jobs[ref.jobLevel]?.level ?? 0
  if ('flagNum' in ref) {
    const f = state.flags[ref.flagNum]
    return typeof f === 'number' ? f : f ? 1 : 0
  }
  if ('age' in ref) return ageOn(state.time.day)
  if ('day' in ref) return state.time.day
  return state.time.hour
}

export function evalCond(state: GameState, cond: Cond | undefined): boolean {
  if (!cond) return true
  if ('all' in cond) return cond.all.every(c => evalCond(state, c))
  if ('any' in cond) return cond.any.some(c => evalCond(state, c))
  if ('not' in cond) return !evalCond(state, cond.not)
  if ('always' in cond) return true
  if ('never' in cond) return false
  if ('flag' in cond) {
    const v = state.flags[cond.flag]
    if (cond.eq !== undefined) return v === cond.eq
    return v !== undefined && v !== false && v !== 0 && v !== ''
  }
  if ('skill' in cond) return inRange(state.skills[cond.skill].level, cond)
  if ('stat' in cond) return inRange(state.stats[cond.stat], cond)
  if ('var' in cond) return inRange(state.vars[cond.var] ?? 0, cond)
  if ('faction' in cond) return inRange(state.factions[cond.faction] ?? 0, cond)
  if ('age' in cond) return inRange(ageOn(state.time.day), cond)
  if ('day' in cond) return dayInTurn(state.time.day, cond)
  if ('hour' in cond) return inRange(state.time.hour, cond)
  if ('n' in cond) return inRange(numRef(state, cond.n), cond)
  if ('npc' in cond) {
    const s = state.npcs[cond.npc] ?? defaultNpcState(cond.npc)
    if (cond.met !== undefined && s.met !== cond.met) return false
    if (cond.fate !== undefined && !asArray(cond.fate).includes(s.fate)) return false
    if (cond.fateNot !== undefined && asArray(cond.fateNot).includes(s.fate)) return false
    if (cond.romance !== undefined && !asArray(cond.romance).includes(s.romance)) return false
    if (cond.affinityGte !== undefined && s.affinity < cond.affinityGte) return false
    if (cond.affinityLte !== undefined && s.affinity > cond.affinityLte) return false
    return true
  }
  if ('job' in cond) {
    if (cond.job === null) return state.job === null
    return state.job !== null && asArray(cond.job).includes(state.job)
  }
  if ('jobLevel' in cond) return inRange(state.jobs[cond.jobLevel]?.level ?? 0, cond)
  if ('jobTrack' in cond) {
    if (!state.job) return false
    const track = C.jobs.get(state.job)?.track
    return track !== undefined && asArray(cond.jobTrack).includes(track)
  }
  if ('quest' in cond) {
    const q = state.quests[cond.quest]
    if (cond.status === 'inactive') return !q
    if (!q) return false
    if (cond.status !== undefined && !asArray(cond.status).includes(q.status)) return false
    if (cond.stage !== undefined && !asArray(cond.stage).includes(q.stage)) return false
    return true
  }
  if ('item' in cond) return state.items.includes(cond.item)
  if ('housing' in cond) return asArray(cond.housing).includes(state.housing)
  if ('lifestyle' in cond) return asArray(cond.lifestyle).includes(state.lifestyle)
  if ('seen' in cond) return state.seenScenes[cond.seen] === true
  if ('contract' in cond) {
    const h = state.contracts.history[cond.contract]
    const active = state.contracts.active.some(c => c.def === cond.contract)
    const offered = state.contracts.board.some(c => c.def === cond.contract && c.status === 'offered')
    switch (cond.status) {
      case 'done':
        return (h?.done ?? 0) > 0
      case 'failed':
        return (h?.failed ?? 0) > 0
      case 'active':
        return active
      case 'offered':
        return offered
      case 'any':
        return active || offered || h !== undefined
    }
  }
  if ('mission' in cond) {
    const m = state.missions[cond.mission]
    return cond.status === 'any' ? m !== undefined : m === cond.status
  }
  if ('news' in cond) return state.news.some(n => n.id === cond.news)
  if ('enrolled' in cond) {
    const e = state.edu.enrolled
    return cond.enrolled === true ? e !== null : e?.program === cond.enrolled
  }
  if ('degree' in cond) return cond.degree === true ? state.edu.degrees.length > 0 : state.edu.degrees.includes(cond.degree)
  if ('course' in cond) return state.edu.courses.includes(cond.course)
  if ('background' in cond) return state.player.background === cond.background
  if ('trait' in cond) return state.player.traits.includes(cond.trait)
  if ('ending' in cond) return state.ending === cond.ending || state.endingsSeen.includes(cond.ending)
  if ('jailed' in cond) return (state.jail !== null) === cond.jailed
  if ('obligation' in cond) return state.obligations.some(o => o.id === cond.obligation)
  if ('eventFired' in cond) return (state.events.fired[cond.eventFired]?.count ?? 0) > 0
  if ('unlocked' in cond) return isUnlocked(state, cond.unlocked)
  // 'chance'
  return rand(state) < cond.chance
}

function rangeText(r: { gte?: number; lte?: number; eq?: number }, fmt: (n: number) => string = String): string {
  if (r.eq !== undefined) return `= ${fmt(r.eq)}`
  if (r.gte !== undefined && r.lte !== undefined) return `${fmt(r.gte)}–${fmt(r.lte)}`
  if (r.gte !== undefined) return `${fmt(r.gte)}+`
  if (r.lte !== undefined) return `≤ ${fmt(r.lte)}`
  return ''
}

/** Short human-readable requirement text for locked choices, job requirements and hints. */
export function describeCond(cond: Cond | undefined): string {
  if (!cond) return ''
  if ('all' in cond) return cond.all.map(describeCond).filter(Boolean).join(', ')
  if ('any' in cond) return cond.any.map(describeCond).filter(Boolean).join(' or ')
  if ('not' in cond) {
    const inner = describeCond(cond.not)
    return inner ? `not (${inner})` : ''
  }
  if ('skill' in cond) return `${SKILL_LABELS[cond.skill]} ${rangeText(cond)}`
  if ('stat' in cond) return `${STAT_LABELS[cond.stat]} ${rangeText(cond, cond.stat === 'money' ? money : String)}`
  if ('faction' in cond) return `${C.factions.get(cond.faction)?.name ?? cond.faction} rep ${rangeText(cond)}`
  if ('age' in cond) return `Age ${rangeText(cond)}`
  if ('npc' in cond) {
    const name = C.npcs.get(cond.npc)?.name ?? cond.npc
    if (cond.affinityGte !== undefined) return `${name} affinity ${cond.affinityGte}+`
    if (cond.romance !== undefined) return `${name}: ${Array.isArray(cond.romance) ? cond.romance.join('/') : cond.romance}`
    if (cond.met) return `Know ${name}`
    return name
  }
  if ('job' in cond) {
    if (cond.job === null) return 'Unemployed'
    return asArray(cond.job)
      .map(j => C.jobs.get(j)?.title ?? j)
      .join(' or ')
  }
  if ('jobLevel' in cond) return `${C.jobs.get(cond.jobLevel)?.title ?? cond.jobLevel} level ${rangeText(cond)}`
  if ('jobTrack' in cond) return `Work in ${asArray(cond.jobTrack).join('/')}`
  if ('item' in cond) return `Own ${C.items.get(cond.item)?.name ?? cond.item}`
  if ('housing' in cond) return `Live in ${asArray(cond.housing).map(h => C.housing.get(h)?.name ?? h).join(' or ')}`
  if ('degree' in cond) return cond.degree === true ? 'A degree' : `Degree: ${C.programs.get(cond.degree)?.name ?? cond.degree}`
  if ('enrolled' in cond) return cond.enrolled === true ? 'Enrolled in university' : `Enrolled: ${C.programs.get(cond.enrolled)?.name ?? cond.enrolled}`
  if ('course' in cond) return `Course: ${C.courses.get(cond.course)?.name ?? cond.course}`
  if ('quest' in cond) return `Quest: ${C.quests.get(cond.quest)?.title ?? cond.quest}`
  if ('trait' in cond) return `Trait: ${C.traits.get(cond.trait)?.name ?? cond.trait}`
  if ('background' in cond) return `Background: ${C.backgrounds.get(cond.background)?.name ?? cond.background}`
  if ('day' in cond || 'hour' in cond || 'chance' in cond || 'flag' in cond || 'var' in cond || 'n' in cond) return ''
  if ('jailed' in cond) return cond.jailed ? 'In jail' : 'Not in jail'
  return ''
}
