/**
 * Operations helpers: labels for contract kinds / approaches / networks / heat, and forecasts built
 * only from engine functions (effectiveHours, workSpeed, successChance, efficiency, countSlots).
 *
 * Time model: one simulated day = one WEEK. Each scheduled hour of an activity does a week's worth
 * of that hour, so "hours of work ÷ scheduled hours per day" is already in calendar days.
 */
import {
  balance,
  C,
  countSlots,
  effectiveHours,
  efficiency,
  hoursLabel,
  successChance,
  tierFromDc,
  workSpeed,
  type ContractInstance,
  type ContractKind,
  type GameState,
  type OpNetwork,
  type OpSpec,
  type SkillId,
} from '@/engine'

export type Approach = ContractInstance['approach']
export const APPROACHES: readonly Approach[] = ['careful', 'normal', 'fast']

export const APPROACH_INFO: Record<Approach, { label: string; icon: string; blurb: string }> = {
  careful: { label: 'Careful', icon: '🐢', blurb: 'Slow and thorough. Triple-check everything, deliver something you are proud of.' },
  normal: { label: 'Normal', icon: '⚖', blurb: 'By the book. No heroics, no shortcuts.' },
  fast: { label: 'Fast', icon: '🐇', blurb: 'Rush it. Quick turnaround, sloppier odds.' },
}

export const KIND_INFO: Record<ContractKind, { icon: string; label: string; activity: 'hack' | 'freelance'; noun: string }> = {
  hack: { icon: '💀', label: 'Hack', activity: 'hack', noun: 'hack' },
  freelance: { icon: '💻', label: 'Gig', activity: 'freelance', noun: 'gig' },
}

export const NETWORK_INFO: Record<OpNetwork, { label: string; icon: string }> = {
  home: { label: 'Home setup', icon: '🏠' },
  school: { label: 'Campus', icon: '🎓' },
  shop: { label: 'Shop', icon: '🛒' },
  corp: { label: 'Office', icon: '🏢' },
  isp: { label: 'Provider', icon: '📡' },
  bank: { label: 'Counting-house', icon: '🏦' },
  gov: { label: 'Civic', icon: '🏛' },
  lab: { label: 'Research lab', icon: '🔬' },
  media: { label: 'Newsroom', icon: '📰' },
}

export const GOAL_INFO: Record<OpSpec['goal'], string> = {
  download: 'Pull a file',
  read: 'Read a file',
  delete: 'Erase a file',
  upload: 'Plant a file',
  wipeLogs: 'Scrub the logs',
}

export function activityLabel(kind: ContractKind): string {
  return balance.ACTIVITY_LABELS[KIND_INFO[kind].activity]
}

function times(n: number): string {
  return `×${Number.isInteger(n) ? n : n.toFixed(2).replace(/0$/, '')}`
}

/** "×1.5 work · +2 roll" (approaches only apply to gigs). */
export function approachSummary(a: Approach): string {
  const p = balance.APPROACH[a]
  const roll = p.roll === 0 ? '±0 roll' : `${p.roll > 0 ? '+' : ''}${p.roll} roll`
  return `${times(p.hours)} work · ${roll}`
}

export interface Forecast {
  approach: Approach
  /** Work units needed in total (hours at speed 1, after the approach). */
  total: number
  remaining: number
  /** Work units per worked hour = workSpeed × efficiency. */
  speed: number
  eff: number
  perHour: number
  /** Activity hours still needed. */
  hours: number
  /** Matching activity hours scheduled per day. */
  perDay: number
  /** Calendar days to finish, or null if it will never progress with the current schedule. */
  days: number | null
  chance: number
}

export function forecast(state: GameState, c: ContractInstance, approach: Approach = c.approach): Forecast {
  const x = approach === c.approach ? c : { ...c, approach }
  const total = effectiveHours(x)
  const remaining = Math.max(0, total - x.progress)
  const speed = workSpeed(state, x)
  const eff = efficiency(state)
  const perHour = speed * eff
  const hours = perHour > 0 ? remaining / perHour : Number.POSITIVE_INFINITY
  const perDay = countSlots(state, KIND_INFO[c.kind].activity)
  const days = perDay > 0 && perHour > 0 ? hours / perDay : null
  return { approach, total, remaining, speed, eff, perHour, hours, perDay, days, chance: successChance(state, x) }
}

export function daysLabel(days: number | null): string {
  if (days === null) return 'never (nothing scheduled)'
  if (days <= 7) return 'this week'
  const w = days / 7
  if (w < 1.5) return '≈ 1 week'
  return `≈ ${w < 10 ? w.toFixed(1).replace(/\.0$/, '') : Math.round(w)} weeks`
}

export function workHoursLabel(h: number): string {
  return Number.isFinite(h) ? hoursLabel(h) : '∞'
}

export function forecastTooltip(state: GameState, c: ContractInstance, f: Forecast): string {
  const act = activityLabel(c.kind)
  const skills = skillsText(state, c.skills)
  return [
    `Work: ${c.hours}h base ${times(balance.APPROACH[f.approach].hours)} (${APPROACH_INFO[f.approach].label.toLowerCase()}) = ${f.total.toFixed(1)} work units${f.remaining < f.total ? `, ${f.remaining.toFixed(1)} left` : ''}.`,
    `Speed ${times(Math.round(f.speed * 100) / 100)} from your skills (${skills || '—'}) and gear, × ${Math.round(f.eff * 100)}% efficiency (energy, stress, health, mood).`,
    `≈ ${workHoursLabel(f.hours)} of ${act} time. You have ${f.perDay}h/day of ${act} on your schedule → ${daysLabel(f.days)}.`,
  ].join('\n')
}

/** The roll bonus implied by a displayed chance (exact unless clamped at 5% / 95%). */
export function impliedBonus(chance: number, dc: number): number | null {
  const wins = Math.round(chance * 20)
  if (wins <= 1 || wins >= 19) return null
  return wins - 21 + dc
}

export function chanceTooltip(c: ContractInstance, chance: number): string {
  const bonus = impliedBonus(chance, c.dc)
  return [
    `Rolled when the work is done: d20${bonus === null ? ' + your bonus' : ` ${bonus >= 0 ? '+' : ''}${bonus}`} vs DC ${c.dc}.`,
    'Bonus = average contract skill ÷ 4, plus the approach (careful +2, fast −2).',
    'A natural 20 always succeeds, a natural 1 always fails.',
  ].join('\n')
}

/** Odds breakdown for "Script it" on a hack (the Terminal itself has no roll). */
export function scriptTooltip(c: ContractInstance, chance: number): string {
  const bonus = impliedBonus(chance, c.dc)
  return [
    `Script it: d20${bonus === null ? ' + your bonus' : ` ${bonus >= 0 ? '+' : ''}${bonus}`} vs DC ${c.dc} — your bonus already includes the −${balance.SCRIPT_ROLL_PENALTY} scripting penalty.`,
    'Bonus = average contract skill ÷ 4. A natural 20 always succeeds, a natural 1 always fails.',
    `Success pays ×${balance.SCRIPT_PAY_MULT} with ×${balance.SCRIPT_HEAT_MULT} heat; failure counts as traced.`,
    'The Terminal has no roll — your play decides.',
  ].join('\n')
}

/** How a hack's base heat turns into real heat, by how the run ends (before opsec and gear). */
export function heatTooltip(c: ContractInstance): string {
  const h = c.heat
  const f = (n: number): string => (Math.round(n * 10) / 10).toString()
  return [
    `Base heat ${f(h)}. What you actually take depends on how the run ends:`,
    `Clean run ×0.6 (${f(h * 0.6)}) · each machine you leave a trail on +35% · traced ×2.5 (${f(h * 2.5)}).`,
    `Scripted instead of run by hand ×${balance.SCRIPT_HEAT_MULT} (${f(h * balance.SCRIPT_HEAT_MULT)}).`,
    'Your OpSec skill and gear shave some of it off.',
  ].join('\n')
}

export function skillsText(state: GameState, skills: readonly SkillId[]): string {
  return skills.map(s => `${balance.SKILL_LABELS[s]} ${state.skills[s].level}`).join(', ')
}

/** Days until a board offer expires (null = no deadline). */
export function offerDaysLeft(state: GameState, c: ContractInstance): number | null {
  const d = c.expiresDay - state.time.day
  return d > 100_000 ? null : Math.max(0, d)
}

export function tierLabel(c: ContractInstance): string {
  return c.def ? '★ Story' : `Tier ${c.tier}`
}

// ── Hack ops ────────────────────────────────────────────────────────────────

/** Severity tier of a hack (procedural carry one; story contracts derive it from the DC). */
export function opTierOf(c: ContractInstance): number {
  return c.tier > 0 ? Math.min(5, Math.max(1, c.tier)) : tierFromDc(c.dc)
}

/** The op recipe of a hack offer (network archetype and goal), when known. */
export function opSpecOf(c: ContractInstance): OpSpec | null {
  const tpl = c.template ? C.contractTemplates.get(c.template) : undefined
  return tpl?.op ?? null
}

/** Network label for a hack: from its recipe, or "Custom job" for hand-authored story ops. */
export function networkLabel(c: ContractInstance): { label: string; icon: string } {
  const spec = opSpecOf(c)
  if (spec) return NETWORK_INFO[spec.network]
  return c.def ? { label: 'Custom job', icon: '★' } : NETWORK_INFO.corp
}

/** Recon hours for full prep: the accepted value, or what it would be for an offer. */
export function prepHoursFor(c: ContractInstance): number {
  if (c.prepNeeded > 0) return c.prepNeeded
  return balance.PREP_HOURS_BY_TIER[opTierOf(c) - 1] ?? balance.PREP_HOURS_BY_TIER[0]
}

export const PREP_MILESTONES: readonly { at: number; short: string; long: string }[] = [
  { at: 0.25, short: 'Map', long: 'Every machine on the network is on your map from the start.' },
  { at: 0.5, short: 'Weak spots', long: 'Every lock is one notch easier.' },
  { at: 0.75, short: 'Slow trace', long: 'The trace runs about 35% slower.' },
  { at: 1, short: 'Inside man', long: 'The trace runs about 60% slower and one lock on the target starts open.' },
]

export function prepFraction(c: ContractInstance): number {
  return c.prepNeeded > 0 ? Math.max(0, Math.min(1, c.prep / c.prepNeeded)) : 0
}

/** Calendar days until prep is complete with the current schedule (null = never; 0 = done). */
export function prepDays(state: GameState, c: ContractInstance): number | null {
  const left = Math.max(0, c.prepNeeded - c.prep)
  if (left <= 0) return 0
  const perHour = workSpeed(state, c) * efficiency(state)
  const perDay = countSlots(state, 'hack')
  if (perHour <= 0 || perDay <= 0) return null
  return left / perHour / perDay
}

/** Days before an accepted hack's window closes (null = no deadline). */
export function deadlineDaysLeft(state: GameState, c: ContractInstance): number | null {
  if (c.deadlineDay === undefined) return null
  return c.deadlineDay - state.time.day
}

export function deadlineLabel(days: number | null): string {
  if (days === null) return 'no deadline'
  if (days < 0) return 'window closed'
  if (days < 7) return 'closes this week'
  const w = Math.floor(days / 7)
  return `${w} week${w === 1 ? '' : 's'} left`
}

// ── Gig queue ───────────────────────────────────────────────────────────────

export interface QueueEta {
  uid: number
  /** Calendar days until this gig is delivered, counting every gig ahead of it (null = never). */
  days: number | null
}

/** Cumulative ETAs for the gig queue in its working order. */
export function gigQueueEta(state: GameState, gigs: readonly ContractInstance[]): QueueEta[] {
  const perDay = countSlots(state, 'freelance')
  const eff = efficiency(state)
  let hoursAhead = 0
  let stuck = perDay <= 0 || eff <= 0
  return gigs.map(g => {
    const perHour = workSpeed(state, g) * eff
    if (perHour <= 0) stuck = true
    if (stuck) return { uid: g.uid, days: null }
    hoursAhead += Math.max(0, effectiveHours(g) - g.progress) / perHour
    return { uid: g.uid, days: hoursAhead / perDay }
  })
}

// ── Heat ────────────────────────────────────────────────────────────────────

export const HACK_TIER_NAMES = ['Newbie', 'Regular', 'Known Handle', 'Respected', 'Legend'] as const
export const FREELANCE_TIER_NAMES = ['Odd jobs', 'Junior', 'Professional', 'Senior', 'Consultant'] as const

export interface HeatLevel {
  label: string
  tone: 'good' | 'warn' | 'bad'
  color: string
}

export function heatLevel(heat: number): HeatLevel {
  if (heat < 10) return { label: 'Ghost', tone: 'good', color: 'var(--good)' }
  if (heat < 30) return { label: 'Low profile', tone: 'good', color: 'var(--good)' }
  if (heat < 50) return { label: 'On a watchlist', tone: 'warn', color: 'var(--warn)' }
  if (heat < balance.RAID_HEAT) return { label: 'Watched', tone: 'warn', color: 'var(--warn)' }
  if (heat < 85) return { label: 'Hot', tone: 'bad', color: 'var(--heat)' }
  return { label: 'Door-kicking hot', tone: 'bad', color: 'var(--bad)' }
}
