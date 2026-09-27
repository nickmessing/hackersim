/**
 * PKG-01 — Act I "The Whir of the Modem": shared ids and conditions.
 *
 * This file carries no content of its own (the registry requires a default export from every
 * content file, so it exports an empty pack). Everything here is plain data reused by the other
 * PKG-01 files.
 */
import { defineContent } from '@/engine/registry'
import type { Cond } from '@/engine/types'
import { SKILLS } from '@/engine/types'

export const Q1 = 'main_a1_q1_boot_sequence'
export const Q2 = 'main_a1_q2_first_money'
export const Q2B = 'main_a1_q2b_first_upgrade'
export const Q3 = 'main_a1_q3_back_room'
export const Q4 = 'main_a1_q4_rivalry'
export const Q5 = 'main_a1_q5_dads_layoff'
export const Q6 = 'main_a1_q6_grandma_job'

/** Story contract owned by PKG-18 (bible §6.A Door B). PKG-01 owns the story reaction to it. */
export const CRACK_CONTRACT = 'a1_crack_starter'
/** Job owned by PKG-18 (bible §6.A Door A). */
export const BENCH_JOB = 'job_compcastle_bench'

export const inAct1: Cond = { var: 'act', eq: 1 }

/** Road (a): any one skill at 25. */
export const roadSkill: Cond = { any: SKILLS.map(s => ({ skill: s, gte: 25 })) }
/** Road (b): CompCastle level 4 (or Halcyon junior level 2), or Known with the Loft. */
export const roadStanding: Cond = {
  any: [
    { jobLevel: BENCH_JOB, gte: 4 },
    { jobLevel: 'job_halcyon_junior', gte: 2 },
    { faction: 'fac.loft', gte: 20 },
  ],
}
/** Road (c): two Act I side quests finished. */
export const roadSides: Cond = { flag: 'a1.two_side_done' }
/** Road (d): $3,000 in your pocket. */
export const roadMoney: Cond = { stat: 'money', gte: 3000 }

const ROADS: Cond[] = [roadSkill, roadStanding, roadSides, roadMoney]

/**
 * "Any three of the four roads" (tightened after playtests: two roads opened by ~day 90, long
 * before the day-240 floor). Written out as combinations since the engine has no counting cond.
 * Kept under its original export name, which other files import.
 */
export const twoRoads: Cond = {
  any: ROADS.map((_, skip): Cond => ({ all: ROADS.filter((__, i) => i !== skip) })),
}

/** Employed anywhere, or finished any paid gig/contract. */
export const hasWorked: Cond = {
  any: [
    { not: { job: null } },
    { var: 'sys.gigsDone', gte: 1 },
    { var: 'sys.hacksDone', gte: 1 },
    { contract: CRACK_CONTRACT, status: 'active' },
    { contract: CRACK_CONTRACT, status: 'done' },
    { contract: CRACK_CONTRACT, status: 'failed' },
  ],
}

/** Items that count as "your first upgrade" (hardware, tools, books, a proper chair). */
export const UPGRADE_ITEMS = [
  'modem_56k',
  'ram_128mb',
  'hdd_20gb',
  'crt_17in',
  'cpu_p3_450',
  'sw_portscan',
  'sw_debugger',
  'sw_cracker',
  'sw_sniffer',
  'sw_proxy',
  'sw_logcleaner',
  'sw_crypto_suite',
  'sw_sandbox',
  'sw_anon_os',
  'book_programming',
  'book_networking',
  'book_intrusion',
  'book_crypto',
  'book_hardware',
  'book_systems',
  'book_social',
  'book_opsec',
  'book_business',
  'book_fitness',
  'furn_chair',
  'furn_desk',
  'gad_coffee',
] as const

export const boughtUpgrade: Cond = { any: UPGRADE_ITEMS.map(item => ({ item })) }

/**
 * Act I side quests (bible §8) that count toward road (c). Owned by PKG-11/12/13; PKG-01 only
 * reads their status. `side_grandma_pc` is excluded: it is recurring through Act III.
 */
export const ACT1_SIDES = [
  'side_y2k_leftovers',
  'side_byteme_snowday',
  'side_vanishing_highscore',
  'side_overdue',
  'side_wedding_avi',
  'side_haunted_modem',
  'side_51_floppies',
  'side_press_any_key',
  'side_tamagotchi_triage',
] as const

export default defineContent({})
