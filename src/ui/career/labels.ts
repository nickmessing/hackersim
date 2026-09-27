/**
 * Display labels & small formatting helpers shared by the Jobs / Planner / Skills / Life apps.
 * Pure functions of their inputs — no game rules live here.
 */
import { balance, SKILLS, signed, type ActivityId, type Modifier, type ModKey, type RomanceState, type SkillId } from '@/engine'

// ── Skills ─────────────────────────────────────────────────────────────────

export function isSkill(s: string): s is SkillId {
  return (SKILLS as readonly string[]).includes(s)
}

export const SKILL_META: Record<SkillId, { glyph: string; blurb: string }> = {
  programming: { glyph: '💾', blurb: 'Writing code that mostly works. Powers freelance gigs, dev careers and your own little tools.' },
  networking: { glyph: '🌐', blurb: 'How the wires talk: routing, protocols, and knowing why the modem screams.' },
  intrusion: { glyph: '🔓', blurb: 'Finding the door somebody forgot to lock. The heart of every contract on the board.' },
  cryptography: { glyph: '🔐', blurb: 'Math with secrets. Ciphers, key puzzles, and keeping your own files unreadable.' },
  hardware: { glyph: '🔧', blurb: 'Soldering, overclocking, and resurrecting beige boxes from the curb.' },
  systems: { glyph: '🖥', blurb: 'Operating systems inside and out. Sysadmin work, and knowing where the logs live.' },
  social: { glyph: '💬', blurb: 'Talking your way in, out and past. Friendships, dates and the occasional con.' },
  opsec: { glyph: '🕶', blurb: 'Not getting caught. Cuts the heat your work draws and helps it fade faster.' },
  business: { glyph: '💼', blurb: 'Invoices, negotiation, and pretending you know what "synergy" means.' },
  fitness: { glyph: '💪', blurb: 'A body that survives all-nighters. Shields you from exhaustion and, later, from aging.' },
}

export function skillLabel(s: SkillId): string {
  return balance.SKILL_LABELS[s]
}

/** "Programming +4/h, Systems +2/h" */
export function skillXpList(xp: Partial<Record<SkillId, number>>): { skill: SkillId; label: string; xp: number }[] {
  const out: { skill: SkillId; label: string; xp: number }[] = []
  for (const [k, v] of Object.entries(xp)) {
    if (!isSkill(k) || !v) continue
    out.push({ skill: k, label: skillLabel(k), xp: v })
  }
  return out.sort((a, b) => b.xp - a.xp)
}

/** D&D-style modifier: "+5", "−1", "+0". */
export function dndMod(n: number): string {
  return n >= 0 ? `+${n}` : `−${Math.abs(n)}`
}

// ── Activities ─────────────────────────────────────────────────────────────

export const ACTIVITY_META: Record<ActivityId, { glyph: string; blurb: string }> = {
  sleep: { glyph: 'Zz', blurb: 'Restores energy (a comfier bed restores more) and melts a little stress.' },
  work: { glyph: '⚒', blurb: 'Your job shift. Locked in place; paid at midnight for the hours you showed up.' },
  class: { glyph: '✎', blurb: 'University lectures. Locked in place by your enrollment.' },
  study: { glyph: '📖', blurb: 'Skill XP for your study focus — or progress on a course you bought.' },
  hack: { glyph: '>_', blurb: 'Works your active hack contract, or practices Intrusion and Networking.' },
  freelance: { glyph: '$', blurb: 'Works your active freelance gig, or practices Programming and Business.' },
  exercise: { glyph: '♥', blurb: 'Fitness XP, health and a big stress drop — but it costs a lot of energy.' },
  social: { glyph: '☺', blurb: 'Time with your chosen person: affinity, mood, stress relief and Social XP.' },
  relax: { glyph: '~', blurb: 'Couch, TV, forums. The best stress relief there is, for almost no energy.' },
}

export function activityLabel(a: ActivityId): string {
  return balance.ACTIVITY_LABELS[a]
}

export function activityVars(a: ActivityId): Record<string, string> {
  return { background: `var(--act-${a})`, color: `var(--act-${a}-ink)` }
}

// ── Time ───────────────────────────────────────────────────────────────────

export function hh(h: number): string {
  return `${String(((h % 24) + 24) % 24).padStart(2, '0')}:00`
}

/** "09:00–17:00" (wraps past midnight). */
export function shiftLabel(start: number, hours: number): string {
  return `${hh(start)}–${hh(start + hours)}`
}

export function hoursSet(start: number, hours: number): Set<number> {
  const s = new Set<number>()
  for (let i = 0; i < hours; i++) s.add((start + i) % 24)
  return s
}

// ── Career tracks ──────────────────────────────────────────────────────────

export interface TrackInfo {
  label: string
  glyph: string
  blurb: string
}

const TRACKS: Record<string, TrackInfo> = {
  odd: { label: 'Odd Jobs', glyph: '🧰', blurb: 'Cash in hand, flexible-ish hours, sore feet.' },
  support: { label: 'Tech Support', glyph: '🎧', blurb: 'Have you tried turning it off and on again?' },
  dev: { label: 'Software Development', glyph: '⌨', blurb: 'Write code. Ship it. Fix it at 3 a.m.' },
  sysadmin: { label: 'System Administration', glyph: '🖥', blurb: 'Keep the servers humming and the users at bay.' },
  network: { label: 'Network Engineering', glyph: '🔌', blurb: 'Cables, routers and the patience of a saint.' },
  security: { label: 'Information Security', glyph: '🛡', blurb: 'Get paid to think like the people you stop.' },
  management: { label: 'Management', glyph: '📊', blurb: 'Meetings about meetings. Excellent dental plan.' },
  startup: { label: 'Startups', glyph: '🚀', blurb: 'Stock options, beanbags, and a terrifying burn rate.' },
  shady: { label: 'Under the Table', glyph: '🕶', blurb: 'No paperwork. No questions. No references.' },
}
const TRACK_ORDER = Object.keys(TRACKS)

function titleCase(s: string): string {
  return s
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

export function trackInfo(track: string): TrackInfo {
  return TRACKS[track] ?? { label: titleCase(track), glyph: '📁', blurb: 'Specialized positions.' }
}

export function sortTracks(tracks: Iterable<string>): string[] {
  return [...new Set(tracks)].sort((a, b) => {
    const ia = TRACK_ORDER.indexOf(a)
    const ib = TRACK_ORDER.indexOf(b)
    if (ia >= 0 && ib >= 0) return ia - ib
    if (ia >= 0) return -1
    if (ib >= 0) return 1
    return a.localeCompare(b)
  })
}

// ── Modifiers ──────────────────────────────────────────────────────────────

const MOD_LABELS: Partial<Record<ModKey, string>> = {
  'xp.all': 'study XP (all skills)',
  jobXp: 'job experience',
  pay: 'salary',
  'hack.speed': 'hacking speed',
  'hack.roll': 'hack rolls',
  'hack.heat': 'heat from hacking',
  'freelance.speed': 'freelance speed',
  'freelance.pay': 'freelance pay',
  'energy.regen': 'sleep regeneration',
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

/** Keys where a smaller multiplier / negative add is the good direction. */
const LOWER_IS_BETTER = new Set<ModKey>(['hack.heat', 'energy.drain', 'stress.gain', 'expenses'])

export function modKeyLabel(key: ModKey): string {
  const fixed = MOD_LABELS[key]
  if (fixed) return fixed
  if (key.startsWith('xp.')) {
    const s = key.slice(3)
    return isSkill(s) ? `${skillLabel(s)} XP` : `${s} XP`
  }
  if (key.startsWith('check.')) {
    const s = key.slice(6)
    return isSkill(s) ? `${skillLabel(s)} checks` : `${s} checks`
  }
  return key
}

/** One-line description: "+20% Programming XP", "+2 to hack rolls", "+1.5 heat decay per day". */
export function modText(m: Modifier): string {
  const parts: string[] = []
  const label = modKeyLabel(m.key)
  if (m.mult !== undefined && m.mult !== 1) {
    const pctChange = Math.round((m.mult - 1) * 100)
    parts.push(`${pctChange >= 0 ? '+' : '−'}${Math.abs(pctChange)}% ${label}`)
  }
  if (m.add !== undefined && m.add !== 0) {
    const n = Math.abs(m.add) >= 10 || Number.isInteger(m.add) ? signed(m.add) : signed(m.add, 1)
    if (m.key.startsWith('check.') || m.key === 'hack.roll') parts.push(`${n} to ${label}`)
    else if (m.key.startsWith('xp.')) parts.push(`${n} ${label}/h`)
    else parts.push(`${n} ${label}`)
  }
  return parts.join(', ') || label
}

/** True when the modifier helps the player. */
export function modIsGood(m: Modifier): boolean {
  const dir = (m.mult !== undefined ? m.mult - 1 : 0) + (m.add ?? 0)
  return LOWER_IS_BETTER.has(m.key) ? dir <= 0 : dir >= 0
}

// ── People ─────────────────────────────────────────────────────────────────

export const ROMANCE_LABELS: Record<RomanceState, string> = {
  none: 'Just friends',
  flirting: 'Flirting',
  dating: 'Dating',
  partner: 'Living together',
  engaged: 'Engaged',
  married: 'Married',
  ex: 'Ex',
}

export const COMMITTED: readonly RomanceState[] = ['dating', 'partner', 'engaged', 'married']

const FAMILY_ROLE = /\b(mother|father|mom|mum|dad|parent|grand\w*|gran|nana|sister|brother|sibling|aunt|uncle|cousin|son|daughter|family|stepmother|stepfather)\b/i

export function isFamilyRole(role: string): boolean {
  return FAMILY_ROLE.test(role)
}

const FATE_LABELS: Record<string, string> = {
  normal: '',
  ally: 'Ally',
  enemy: 'Enemy',
  arrested: 'Arrested',
  jailed: 'In prison',
  missing: 'Missing',
  dead: 'Passed away',
  passed: 'Passed away',
  gone: 'Gone',
  betrayer: 'Betrayed you',
  informant: 'Informant',
  estranged: 'Estranged',
}

export function fateLabel(fate: string): string {
  return FATE_LABELS[fate] ?? titleCase(fate)
}

export function fateIsGrim(fate: string): boolean {
  return ['dead', 'passed', 'missing', 'gone', 'jailed', 'arrested', 'estranged', 'enemy', 'betrayer'].includes(fate)
}

/** "19 years, 4 months" */
export function ageText(age: number): string {
  const years = Math.floor(age)
  const months = Math.floor((age - years) * 12)
  return months > 0 ? `${years} years, ${months} month${months === 1 ? '' : 's'}` : `${years} years`
}
