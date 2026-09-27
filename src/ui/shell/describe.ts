/** Presentation helpers for the shell: modifier text, stateless text rendering, housing tiers. */
import { balance, C, type ActivityId, type GameState, type Modifier, type SkillId, type Text } from '@/engine'

export interface ModLine {
  text: string
  /** true = helps the player, false = hurts. */
  good: boolean
}

const SKILL_SET = new Set<string>(Object.keys(balance.SKILL_LABELS))

function skillLabel(id: string): string {
  return SKILL_SET.has(id) ? balance.SKILL_LABELS[id as SkillId] : id
}

/** Modifier keys where a smaller multiplier is the good direction. */
const LOWER_IS_BETTER = new Set(['hack.heat', 'energy.drain', 'stress.gain', 'expenses'])

const KEY_LABELS: Record<string, string> = {
  'xp.all': 'study XP (all skills)',
  jobXp: 'job experience',
  pay: 'salary',
  'hack.speed': 'hacking speed',
  'hack.roll': 'hack contract rolls',
  'hack.heat': 'heat from hacking',
  'freelance.speed': 'freelance speed',
  'freelance.pay': 'freelance pay',
  'energy.regen': 'sleep recovery',
  'energy.drain': 'energy drain',
  'stress.gain': 'stress gained',
  'stress.relief': 'stress relief',
  'mood.daily': 'mood per day',
  'health.daily': 'health per day',
  'heat.decay': 'heat decay per day',
  efficiency: 'efficiency',
  expenses: 'daily expenses',
  'cred.gain': 'cred gained',
  trace: 'trace time',
  'crack.speed': 'cracking speed',
  'check.all': 'all skill checks',
}

function keyLabel(key: string): string {
  const known = KEY_LABELS[key]
  if (known) return known
  if (key.startsWith('xp.')) return `${skillLabel(key.slice(3))} study XP`
  if (key.startsWith('check.')) return `${skillLabel(key.slice(6))} checks`
  return key
}

function num(n: number): string {
  const r = Math.round(n * 10) / 10
  return `${r >= 0 ? '+' : '−'}${Math.abs(r)}`
}

/** "+20% Programming study XP", "+2 Social checks", "−10% energy drain". */
export function describeMod(m: Modifier): ModLine[] {
  const out: ModLine[] = []
  const label = keyLabel(m.key)
  const lower = LOWER_IS_BETTER.has(m.key)
  if (m.mult !== undefined && m.mult !== 1) {
    const pctChange = Math.round((m.mult - 1) * 100)
    out.push({ text: `${num(pctChange)}% ${label}`, good: lower ? m.mult < 1 : m.mult > 1 })
  }
  if (m.add !== undefined && m.add !== 0) {
    const suffix = m.key.startsWith('xp.') && m.key !== 'xp.all' ? ' per hour' : ''
    out.push({ text: `${num(m.add)} ${label}${suffix}`, good: lower ? m.add < 0 : m.add > 0 })
  }
  return out
}

export function describeMods(mods: Modifier[] | undefined): ModLine[] {
  return (mods ?? []).flatMap(describeMod)
}

/** Render Text without a game state (title screen / wizard): conditional parts are skipped. */
export function plainParagraphs(text: Text | undefined): string[] {
  if (text === undefined) return []
  if (typeof text === 'string') return text.split(/\n\n+/)
  const out: string[] = []
  for (const part of text) {
    if (typeof part === 'string') out.push(part)
  }
  return out
}

export function roman(n: number): string {
  const table: [number, string][] = [
    [10, 'X'],
    [9, 'IX'],
    [5, 'V'],
    [4, 'IV'],
    [1, 'I'],
  ]
  let v = Math.max(1, Math.floor(n))
  let s = ''
  for (const [k, r] of table) {
    while (v >= k) {
      s += r
      v -= k
    }
  }
  return s
}

export const WALLPAPERS = ['Clouds', 'Grid', 'Rolling Hills', 'Aurora', 'Carbon', 'Skyline'] as const

/** Housing tier 0..5 from the housing's economics (content-agnostic). */
export function housingTier(state: GameState): number {
  const h = C.housing.get(state.housing)
  if (!h) return 0
  if (h.owned) return 5
  const rent = h.rentPerDay
  if (rent <= 0) return 0
  if (rent < 15) return 1
  if (rent < 30) return 2
  if (rent < 50) return 3
  if (rent < 100) return 4
  return 5
}

export const ACTIVITY_GLYPHS: Record<ActivityId | 'jail' | 'hospital', string> = {
  sleep: '💤',
  work: '💼',
  class: '🎓',
  study: '📖',
  hack: '⚡',
  freelance: '⌨',
  exercise: '🏃',
  social: '☕',
  relax: '📺',
  jail: '🔒',
  hospital: '✚',
}

export function activityLabel(act: ActivityId | 'jail' | 'hospital'): string {
  if (act === 'jail') return 'In custody'
  if (act === 'hospital') return 'Hospital'
  return balance.ACTIVITY_LABELS[act]
}

/** "2 days, 5 hours" */
export function spanLabel(hours: number): string {
  const d = Math.floor(hours / 24)
  const h = Math.round(hours % 24)
  const parts: string[] = []
  if (d > 0) parts.push(`${d} day${d === 1 ? '' : 's'}`)
  if (h > 0 || d === 0) parts.push(`${h} hour${h === 1 ? '' : 's'}`)
  return parts.join(', ')
}

/** "3 minutes ago" for a real-world timestamp. */
export function agoLabel(ts: number, now = Date.now()): string {
  if (!ts) return 'never'
  const s = Math.max(0, Math.round((now - ts) / 1000))
  if (s < 45) return 'just now'
  const m = Math.round(s / 60)
  if (m < 60) return `${m} min ago`
  const h = Math.round(m / 60)
  if (h < 24) return `${h} hour${h === 1 ? '' : 's'} ago`
  const d = Math.round(h / 24)
  return `${d} day${d === 1 ? '' : 's'} ago`
}
