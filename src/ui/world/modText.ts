/**
 * Modifier keys → plain English ("+20% Programming study XP", "−10% heat from hacking").
 * Shared by the e-Shop product cards and the inventory view.
 */
import { balance, SKILLS } from '@/engine'
import type { Modifier, SkillId } from '@/engine'
import { num1 } from './util'

export interface ModLine {
  text: string
  /** Beneficial for the player. */
  good: boolean
}

/** Keys where a smaller number is the better one. */
const LOWER_IS_BETTER = new Set<string>(['hack.heat', 'energy.drain', 'stress.gain', 'expenses'])

function isSkill(s: string): s is SkillId {
  return (SKILLS as readonly string[]).includes(s)
}

interface Phrase {
  /** Subject for multiplier mods: "{±N%} {subject}". */
  mult: string
  /** Full text for additive mods, given the signed amount. */
  add: (n: string) => string
}

function phraseFor(key: string): Phrase {
  if (key.startsWith('xp.') && key !== 'xp.all') {
    const s = key.slice(3)
    const label = isSkill(s) ? balance.SKILL_LABELS[s] : s
    return { mult: `${label} study XP`, add: n => `${n} ${label} XP per study hour` }
  }
  if (key.startsWith('check.') && key !== 'check.all') {
    const s = key.slice(6)
    const label = isSkill(s) ? balance.SKILL_LABELS[s] : s
    return { mult: `${label} checks`, add: n => `${n} to ${label} checks` }
  }
  switch (key) {
    case 'xp.all':
      return { mult: 'study XP (all skills)', add: n => `${n} XP per study hour (all skills)` }
    case 'check.all':
      return { mult: 'all skill checks', add: n => `${n} to all skill checks` }
    case 'jobXp':
      return { mult: 'job experience', add: n => `${n} job experience per shift hour` }
    case 'pay':
      return { mult: 'salary', add: n => `${n} salary` }
    case 'hack.speed':
      return { mult: 'hacking speed', add: n => `${n} hacking speed` }
    case 'hack.roll':
      return { mult: 'hacking rolls', add: n => `${n} to hacking contract rolls` }
    case 'hack.heat':
      return { mult: 'heat from hacking', add: n => `${n} heat per hack` }
    case 'freelance.speed':
      return { mult: 'freelance speed', add: n => `${n} freelance speed` }
    case 'freelance.pay':
      return { mult: 'freelance pay', add: n => `${n} freelance pay` }
    case 'energy.regen':
      return { mult: 'energy from sleep', add: n => `${n} energy per hour of sleep` }
    case 'energy.drain':
      return { mult: 'energy drain while awake', add: n => `${n} energy drain` }
    case 'stress.gain':
      return { mult: 'stress build-up', add: n => `${n} stress build-up` }
    case 'stress.relief':
      return { mult: 'stress relief', add: n => `${n} stress relief` }
    case 'mood.daily':
      return { mult: 'daily mood', add: n => `${n} mood per day` }
    case 'health.daily':
      return { mult: 'daily health', add: n => `${n} health per day` }
    case 'heat.decay':
      return { mult: 'heat cool-off', add: n => `${n} heat cool-off per day` }
    case 'efficiency':
      return { mult: 'overall efficiency', add: n => `${n} efficiency` }
    case 'expenses':
      return { mult: 'daily expenses', add: n => `${n} daily expenses` }
    case 'cred.gain':
      return { mult: 'cred gained', add: n => `${n} cred per contract` }
    case 'trace':
      return { mult: 'time before a trace finds you', add: n => `${n} trace time` }
    case 'crack.speed':
      return { mult: 'cracking speed (Terminal)', add: n => `${n} cracking speed` }
    default:
      return { mult: key, add: n => `${n} ${key}` }
  }
}

function pctText(mult: number): string {
  const p = (mult - 1) * 100
  const r = Math.abs(p) < 1 ? num1(Math.abs(p)) : String(Math.round(Math.abs(p)))
  return `${p >= 0 ? '+' : '−'}${r}%`
}

function addText(n: number): string {
  return n >= 0 ? `+${num1(n)}` : `−${num1(-n)}`
}

/** One modifier → one or two lines (a modifier may carry both `add` and `mult`). */
export function describeMod(m: Modifier): ModLine[] {
  const ph = phraseFor(m.key)
  const lower = LOWER_IS_BETTER.has(m.key)
  const out: ModLine[] = []
  if (m.mult !== undefined && m.mult !== 1) {
    out.push({ text: `${pctText(m.mult)} ${ph.mult}`, good: m.mult > 1 !== lower })
  }
  if (m.add !== undefined && m.add !== 0) {
    out.push({ text: ph.add(addText(m.add)), good: m.add > 0 !== lower })
  }
  return out
}

export function describeMods(mods: readonly Modifier[]): ModLine[] {
  return mods.flatMap(describeMod)
}
