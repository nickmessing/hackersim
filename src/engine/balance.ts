/**
 * All tunable numbers in one place. The balance simulation test (tests/balance.test.ts)
 * plays a scripted run with these values to keep pacing in the 8-15 real hours band.
 */
import type { ActivityId, SkillId } from './types'

/**
 * Weekly turns: each simulated 24-hour cycle is a *typical day* of one week, and the calendar
 * advances DAYS_PER_STEP days per cycle. Accumulating things (XP, pay, expenses, contract work,
 * heat decay...) are multiplied by DAYS_PER_STEP so per-calendar-day balance is unchanged;
 * energy/stress/mood keep their per-hour daily rhythm.
 */
export const DAYS_PER_STEP = 7
/** Real seconds per simulated hour at 1x (24 h * 2.5 s = 60 s per week). */
export const REAL_SECONDS_PER_GAME_HOUR = 2.5
/** Timers/reply windows shorter than this many calendar days are stretched to it (2 turns). */
export const MIN_TIMER_DAYS = DAYS_PER_STEP * 2
/** Convert a per-calendar-day probability into a per-step probability. */
export function perStep(pDay: number): number {
  return 1 - Math.pow(1 - Math.min(1, Math.max(0, pDay)), DAYS_PER_STEP)
}
export const SPEEDS = [0, 1, 2, 5, 10] as const

/** Day 0 of the calendar. */
export const START_YEAR = 2001
export const START_MONTH = 8 // 0-based: September
export const START_DAY_OF_MONTH = 1
export const START_AGE = 18

// ── Skills ──────────────────────────────────────────────────────────────────
export const SKILL_MAX = 100
/** XP needed to go from `level` to `level + 1`. */
export function xpToNext(level: number): number {
  return Math.floor(12 * Math.pow(level + 1, 1.45))
}
/** Base study XP per hour at efficiency 1. */
export const STUDY_XP = 14
/** Skill-check modifier from a skill level (d20 + mod vs DC). */
export function skillMod(level: number): number {
  return Math.floor(level / 4)
}

// ── Energy / stress / mood per hour of activity ─────────────────────────────
export interface ActivityProfile {
  energy: number
  stress: number
  mood: number
  health: number
}
export const ACTIVITY: Record<ActivityId, ActivityProfile> = {
  sleep: { energy: 12.5, stress: -1.2, mood: 0, health: 0.05 },
  work: { energy: -4, stress: 1.2, mood: -0.1, health: 0 },
  class: { energy: -3.5, stress: 0.9, mood: 0, health: 0 },
  study: { energy: -4, stress: 0.9, mood: -0.05, health: 0 },
  hack: { energy: -4.5, stress: 1.1, mood: 0.1, health: 0 },
  freelance: { energy: -4, stress: 1.0, mood: 0, health: 0 },
  exercise: { energy: -7, stress: -2.5, mood: 0.4, health: 0.35 },
  social: { energy: -2.5, stress: -2.2, mood: 0.8, health: 0 },
  relax: { energy: -1.2, stress: -3.2, mood: 0.4, health: 0.02 },
}
/** Awake hours beyond this without sleep hurt health. */
export const EXHAUSTION_ENERGY = 5

// ── Efficiency ──────────────────────────────────────────────────────────────
export function efficiencyFrom(energy: number, stress: number, health: number, mood: number): number {
  let e = 1
  if (energy < 10) e *= 0.35
  else if (energy < 25) e *= 0.65
  else if (energy < 40) e *= 0.85
  if (stress > 90) e *= 0.5
  else if (stress > 75) e *= 0.75
  else if (stress > 60) e *= 0.9
  e *= 0.6 + 0.4 * (health / 100)
  e *= 0.85 + 0.3 * (mood / 100)
  return e
}

// ── Jobs ────────────────────────────────────────────────────────────────────
export const JOB_XP_PER_HOUR = 10
export function jobXpToNext(level: number): number {
  // Weekly turns (~500 job XP per turn on a full-time schedule): the first promotion is a
  // probation review (~6 turns ≈ 1.5 months), then steady raises; a 15-level job caps in ~6 months.
  if (level <= 0) return 3000
  return Math.floor(560 * Math.pow(1.03, level))
}
/** Pay grows +5% per job level. */
export const JOB_PAY_GROWTH = 0.05
/** Promotions cap out so moving up the ladder beats staying put. */
export const JOB_MAX_LEVEL_DEFAULT = 12

// ── Money / life ────────────────────────────────────────────────────────────
/** Below this, "broke" consequences start (no food upgrades, mood hit, debt events). */
export const DEBT_LIMIT = -2000
export const HOSPITAL_COST_PER_DAY = 120
export const HOSPITAL_DAYS = 3
/** Stress at 100 triggers a burnout debuff. */
export const BURNOUT_DAYS = 7
/** After this age health slowly declines unless fitness compensates. */
export const AGING_START = 27
export const AGING_HEALTH_PER_YEAR = 0.012

// ── Taxes & household ───────────────────────────────────────────────────────
/** Income tax on paychecks and freelance pay (hack money is off the books). */
export function incomeTax(gross: number): number {
  // Per-payment brackets on daily-scale amounts: 12% to $60, 22% to $200, 34% to $400, 42% above.
  const a = Math.min(gross, 60) * 0.12
  const b = Math.max(0, Math.min(gross, 200) - 60) * 0.22
  const c = Math.max(0, Math.min(gross, 400) - 200) * 0.34
  const d = Math.max(0, gross - 400) * 0.42
  return Math.round(a + b + c + d)
}
/** Household contribution while living with your parents: grows from day 60, capped. */
export function parentsContribution(day: number): number {
  if (day < 60) return 0
  return Math.min(22, 3 + (day - 60) / 45)
}
/** Procedural contract pay multipliers (templates were authored generous). */
/** Per-tier multiplier for procedural hack pay (tiers 1..5): the top tiers were the money firehose. */
/** Retired multipliers (templates now carry final pay); kept at 1 for clarity. */
export const HACK_PAY_MULT_BY_TIER = [1, 1, 1, 1, 1] as const
export const FREELANCE_PAY_MULT = 1

// ── Hacking / contracts ─────────────────────────────────────────────────────
/** Cred required for hack contract tiers 1..5. */
export const CRED_TIERS = [0, 8, 22, 42, 68] as const
/** Freelance tiers keyed by programming level. */
export const FREELANCE_TIERS = [0, 10, 25, 42, 62] as const
/** Offers kept on the boards (topped up every weekly turn). */
export const HACK_BOARD_SIZE = 5
export const GIG_BOARD_SIZE = 8
/** @deprecated use HACK_BOARD_SIZE / GIG_BOARD_SIZE */
export const BOARD_SIZE = HACK_BOARD_SIZE + GIG_BOARD_SIZE
export const BOARD_REFRESH_DAYS = 7
export const CONTRACT_OFFER_DAYS = 21
/** Accepted hacks you can hold at once (prep goes to the first unprepped one). */
export const MAX_ACTIVE_HACKS = 3
/** Gig work queue length (worked in order). */
export const MAX_ACTIVE_GIGS = 6
/** An accepted hack must be run within this many days (8 weekly turns). */
export const HACK_DEADLINE_DAYS = 56
/**
 * Recon work-hours for full prep, by tier 1..5. Sized for weekly turns: a night-owl schedule
 * (~6 Hacking hours a day) fully preps a tier-1 op in about a turn and a tier-5 op in ~3 turns, so a
 * dedicated hacker runs roughly one op every 1–1.5 turns.
 */
export const PREP_HOURS_BY_TIER = [45, 80, 135, 195, 255] as const
/** "Script it" (auto-run a hack without the terminal): pay and heat multipliers, roll penalty. */
export const SCRIPT_PAY_MULT = 0.6
export const SCRIPT_HEAT_MULT = 1.5
export const SCRIPT_ROLL_PENALTY = 3
/** Chance a failed freelance gig spawns a 'gig' complication. */
export const GIG_FAIL_COMPLICATION_CHANCE = 0.3

// ── Event director ──────────────────────────────────────────────────────────
/** Base chance per weekly turn that the director fires a random event. */
export const EVENT_BASE_CHANCE = 0.45
/** Added per consecutive quiet turn (no event or story scene). */
export const EVENT_QUIET_BONUS = 0.2
/** Default cooldown for repeatable events. */
export const EVENT_DEFAULT_COOLDOWN = 120
/** Categories remembered to avoid repeats. */
export const EVENT_RECENT_MEMORY = 3
export const APPROACH = {
  careful: { hours: 1.5, heat: 0.55, roll: 2 },
  normal: { hours: 1, heat: 1, roll: 0 },
  fast: { hours: 0.65, heat: 1.6, roll: -2 },
} as const
/** Work progress per hour = efficiency * (1 + avgSkill / HACK_SKILL_SPEED_DIV) * mods. */
export const HACK_SKILL_SPEED_DIV = 42
/** XP granted per hour of contract work to each contract skill. */
export const CONTRACT_XP_PER_HOUR = 9
/** Practice (no active contract) XP per hour. */
export const PRACTICE_XP_PER_HOUR = 6
/** Failure multiplies heat. */
export const FAIL_HEAT_MULT = 1.8

// ── Heat ────────────────────────────────────────────────────────────────────
/**
 * Base heat decay per calendar day (x7 per weekly turn). Kept low so heat is a real throttle on op
 * frequency: opsec, gear, housing and story perks add decay on top.
 */
export const HEAT_DECAY_BASE = 0.18
/** Extra decay per opsec level. */
export const HEAT_DECAY_PER_OPSEC = 0.005
/** Raid chance per day when heat >= RAID_HEAT: (heat - RAID_HEAT + 5) / RAID_DIV. */
export const RAID_HEAT = 52
export const RAID_DIV = 160
/** Share of cash seized by a raid. */
export const RAID_FINE_FRACTION = 0.25
/** Heat right after a raid (the cops took your gear; you start cold, not fresh). */
export const RAID_HEAT_AFTER = 15

// ── Relationships ───────────────────────────────────────────────────────────
export const SOCIAL_AFFINITY_PER_HOUR = 0.6

// ── Misc ────────────────────────────────────────────────────────────────────
export const LOG_MAX = 250
export const NEWS_AMBIENT_EVERY_DAYS = 2
export const AUTOSAVE_REAL_SECONDS = 20

export const SKILL_LABELS: Record<SkillId, string> = {
  programming: 'Programming',
  networking: 'Networking',
  intrusion: 'Intrusion',
  cryptography: 'Cryptography',
  hardware: 'Hardware',
  systems: 'Systems',
  social: 'Social',
  opsec: 'OpSec',
  business: 'Business',
  fitness: 'Fitness',
}

export const ACTIVITY_LABELS: Record<ActivityId, string> = {
  sleep: 'Sleep',
  work: 'Work',
  class: 'Classes',
  study: 'Study',
  hack: 'Hacking',
  freelance: 'Freelance',
  exercise: 'Exercise',
  social: 'Social',
  relax: 'Relax',
}
