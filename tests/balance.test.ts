/**
 * Balance / pacing playtest. Slow — opt in with BALANCE=1:
 *   BALANCE=1 npx vitest run tests/balance.test.ts
 * Optional: BALANCE_DAYS=4200 BALANCE_SEEDS=3 BALANCE_OUT=docs/balance-report.md
 *
 * Besides "no crashes, every run reaches an ending", this guards the REDESIGN_V2 §E targets
 * (weekly turns): ~8–10 real hours per run, something happening at least every ~2 turns,
 * legit ≈ $300k–700k / hacker ≈ $0.8–2M end money with real risk, a hack op every 1–3 turns,
 * first promotion within ~2 months, associate ≈ 1 year and BS ≈ 2 years. The bands are soft
 * (a little wider than the spec) so small content tweaks don't flap the test; every miss is
 * collected and reported together.
 */
import { writeFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import * as balance from '../src/engine/balance'
import { C } from '../src/engine/registry'
import type { GameState } from '../src/engine/types'
import { formatReport, runBot, runBotState, type BotReport, type Strategy } from './bot'

const enabled = process.env.BALANCE === '1'
const days = Number(process.env.BALANCE_DAYS ?? 4200)
const seeds = Number(process.env.BALANCE_SEEDS ?? 1)

const TURN = balance.DAYS_PER_STEP
/** §E: first job promotion after ~1–2 months. */
const FIRST_PROMOTION_MAX_DAYS = 70
/** §E: associate ≈ 1 year, BS ≈ 2 years (tolerance in calendar days). */
const DEGREE_TARGET_DAYS: Record<string, number> = { lsu_cs_assoc: 364, lsu_cs_bs: 728 }
const DEGREE_TOLERANCE_DAYS = 3 * TURN

/** Timeline facts the report doesn't carry, gathered from a replay of the same seed. */
interface Timeline {
  finalMoney: number
  /** Days from first taking a job to its first promotion, per job that was ever promoted. */
  promotionDelays: number[]
  /** Calendar days from enrolment to graduation, per completed program. */
  degreeDays: Record<string, number>
}

function trackTimeline(strategy: Strategy, seed: number): Timeline {
  const hired: Record<string, number> = {}
  const promoted: Record<string, number> = {}
  const enrolledAt: Record<string, number> = {}
  const degreeDays: Record<string, number> = {}
  const onDay = (s: GameState): void => {
    const day = s.time.day
    if (s.job && hired[s.job] === undefined) hired[s.job] = day
    for (const [id, p] of Object.entries(s.jobs)) if (p.level >= 1 && promoted[id] === undefined) promoted[id] = day
    const e = s.edu.enrolled
    if (e && enrolledAt[e.program] === undefined) enrolledAt[e.program] = day
    for (const id of s.edu.degrees) {
      const start = enrolledAt[id]
      if (start !== undefined && degreeDays[id] === undefined) degreeDays[id] = day - start
    }
  }
  const state = runBotState(strategy, seed, days, onDay)
  const promotionDelays = Object.entries(promoted).flatMap(([id, d]) => {
    const h = hired[id]
    return h === undefined ? [] : [d - h]
  })
  return { finalMoney: state.stats.money, promotionDelays, degreeDays }
}

const realHours = (r: BotReport): number => ((r.endingDay ?? r.days) / TURN) * 24 * balance.REAL_SECONDS_PER_GAME_HOUR / 3600
const turnsOf = (r: BotReport): number => Math.max(1, (r.endingDay ?? r.days) / TURN)
const opsPlayed = (r: BotReport): number => r.ops.clean + r.ops.messy + r.ops.partial + r.ops.aborted + r.ops.traced
const fmtMoney = (n: number): string => `$${Math.round(n).toLocaleString('en-US')}`

describe('balance targets (content)', () => {
  it('degree programs take ~1 year (associate) and ~2 years (BS) of weekly turns', () => {
    for (const [id, target] of Object.entries(DEGREE_TARGET_DAYS)) {
      const prog = C.programs.get(id)
      expect(prog, `program ${id}`).toBeDefined()
      if (!prog) continue
      const hoursPerTurn = prog.classHours * TURN
      const days = Math.ceil((prog.semesters * prog.hoursPerSemester) / hoursPerTurn) * TURN
      expect(Math.abs(days - target), `${id}: ${days} days vs ~${target}`).toBeLessThanOrEqual(DEGREE_TOLERANCE_DAYS)
    }
  })

  it('the first promotion needs no more than ~2 months of full-time work', () => {
    // ~5 eight-hour shifts a week at base efficiency.
    const xpPerTurn = balance.JOB_XP_PER_HOUR * 8 * 5
    const turns = Math.ceil(balance.jobXpToNext(0) / xpPerTurn)
    expect(turns * TURN).toBeLessThanOrEqual(FIRST_PROMOTION_MAX_DAYS)
  })
})

describe.skipIf(!enabled)('balance playtest', () => {
  it(
    'plays full runs without crashes or soft-locks, within the §E pacing targets',
    () => {
      const strategies: Strategy[] = ['legit', 'hacker', 'balanced']
      const runs: { report: BotReport; timeline: Timeline }[] = []
      for (const strat of strategies)
        for (let i = 0; i < seeds; i++) {
          const seed = 1000 + i * 17
          runs.push({ report: runBot(strat, seed, days), timeline: trackTimeline(strat, seed) })
        }
      const reports = runs.map(r => r.report)
      const text = runs
        .map(({ report, timeline }) => {
          const extra = [
            `end money ${fmtMoney(timeline.finalMoney)}`,
            `first promotions after ${timeline.promotionDelays.join('/') || '—'} days`,
            `degrees ${Object.entries(timeline.degreeDays).map(([id, d]) => `${id} ${d}d`).join(', ') || '—'}`,
          ].join('; ')
          return `${formatReport(report)}\n${extra}`
        })
        .join('\n\n')
      console.log(text)
      const out = process.env.BALANCE_OUT
      if (out) writeFileSync(out, `# Balance report\n\n\`\`\`\n${text}\n\`\`\`\n`)

      const crashes = reports.flatMap(r => r.errors.filter(e => !e.startsWith('soft-lock')))
      expect(crashes).toEqual([])
      // Every run must reach an ending (guards against story soft-locks like the Act IV copper bug).
      expect(reports.filter(r => !r.ending).map(r => `${r.strategy}/${r.seed}`)).toEqual([])

      // §E soft targets: collect every miss, then assert once so the report shows them all.
      const misses: string[] = []
      const check = (ok: boolean, msg: string): void => {
        if (!ok) misses.push(msg)
      }
      for (const { report: r, timeline: t } of runs) {
        const tag = `${r.strategy}/${r.seed}`
        const hours = realHours(r)
        check(hours >= 7.5 && hours <= 10.5, `${tag}: real time ${hours.toFixed(1)} h (target 8–10 h)`)
        const happenings = (r.eventsFired + r.scenesSeen) / turnsOf(r)
        check(happenings >= 0.5, `${tag}: ${happenings.toFixed(2)} events+scenes per turn (target ≥ 1 per 2 turns)`)
        if (r.strategy === 'legit') {
          check(t.finalMoney >= 300_000 && t.finalMoney <= 700_000, `${tag}: end money ${fmtMoney(t.finalMoney)} (target $300k–700k)`)
          const first = t.promotionDelays.length ? Math.min(...t.promotionDelays) : Infinity
          check(first <= FIRST_PROMOTION_MAX_DAYS, `${tag}: first promotion after ${first} days (target ≤ ${FIRST_PROMOTION_MAX_DAYS})`)
        }
        if (r.strategy === 'hacker') {
          check(t.finalMoney >= 800_000 && t.finalMoney <= 2_000_000, `${tag}: end money ${fmtMoney(t.finalMoney)} (target $0.8–2M)`)
          check(r.raids >= 1 || r.ops.traced > 0, `${tag}: no raids and no traced ops (target: real risk, raids ≥ 1)`)
          const perTurn = opsPlayed(r) / turnsOf(r)
          check(perTurn >= 1 / 3 && perTurn <= 1.5, `${tag}: ${perTurn.toFixed(2)} ops per turn (target one every 1–3 turns)`)
        }
        for (const [id, d] of Object.entries(t.degreeDays)) {
          const target = DEGREE_TARGET_DAYS[id]
          if (target !== undefined)
            check(Math.abs(d - target) <= DEGREE_TOLERANCE_DAYS * 2, `${tag}: ${id} took ${d} days (target ~${target})`)
        }
      }
      expect(misses).toEqual([])
    },
    30 * 60 * 1000,
  )
})
