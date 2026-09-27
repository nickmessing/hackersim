import { DAYS_PER_STEP, perStep, HEAT_DECAY_BASE, HEAT_DECAY_PER_OPSEC, RAID_DIV, RAID_FINE_FRACTION, RAID_HEAT, RAID_HEAT_AFTER } from '../balance'
import { addMoney, addStat } from '../effects'
import { modAdd, modMult, worldMult } from '../mods'
import { C } from '../registry'
import { failHack } from './contracts'
import { rand } from '../rng'
import { log, notify } from '../text'
import type { GameState } from '../types'

/**
 * Floor on the stacked `hack.heat` multiplier from gear, software, jobs and perks. Content mods are
 * authored one at a time (0.9 here, 0.85 there); stacked late-game they would otherwise multiply
 * down to ~0.3 and, on top of opsec, make even a tier-5 op nearly heat-free.
 */
export const HACK_HEAT_MULT_FLOOR = 0.5
/**
 * Ceiling on the extra daily decay that `heat.decay` mods can add. Bonuses stack with diminishing
 * returns toward this cap (small bonuses count almost fully; a pile of them saturates), so a fully
 * kitted safehouse roughly doubles base+opsec decay instead of making heat evaporate every turn.
 * Penalties (negative mods from scars) always apply in full.
 */
export const HEAT_DECAY_MOD_CAP = 0.6

/** The effective `hack.heat` multiplier after the engine floor. */
export function hackHeatMult(state: GameState): number {
  return Math.max(HACK_HEAT_MULT_FLOOR, modMult(state, 'hack.heat'))
}

/** The effective extra daily decay from `heat.decay` mods (diminishing returns, capped). */
export function heatDecayBonus(state: GameState): number {
  const raw = modAdd(state, 'heat.decay')
  if (raw <= 0) return raw
  return HEAT_DECAY_MOD_CAP * (1 - Math.exp(-raw / HEAT_DECAY_MOD_CAP))
}

/** Add heat from an illegal action, applying opsec, gear and world crackdown modifiers. */
export function gainHeat(state: GameState, base: number): number {
  if (base <= 0) return 0
  const opsec = state.skills.opsec.level
  const amount = base * (1 - Math.min(0.45, opsec / 180)) * hackHeatMult(state) * worldMult(state, 'w.heatGain')
  addStat(state, 'heat', amount)
  return amount
}

/**
 * Share of current heat that cools off per calendar day on top of the flat decay: old trails go
 * cold faster the hotter they are, so a burst of ops spikes heat without pinning it at the ceiling.
 */
export const HEAT_DECAY_PROPORTIONAL = 0.02

/** Heat lost per calendar day (x DAYS_PER_STEP per turn); never negative. */
export function dailyHeatDecay(state: GameState): number {
  const perDay =
    HEAT_DECAY_BASE +
    state.skills.opsec.level * HEAT_DECAY_PER_OPSEC +
    heatDecayBonus(state) +
    state.stats.heat * HEAT_DECAY_PROPORTIONAL
  return Math.max(0, perDay) / worldMult(state, 'w.heatGain')
}

/**
 * After a raid the task force has what it came for: no second raid for RAID_QUIET_DAYS, then the
 * odds ramp back to full over RAID_RAMP_DAYS. Without this a raid (which also seizes the gear
 * that keeps heat down) snowballs into a raid every few weeks.
 */
export const RAID_QUIET_DAYS = 120
export const RAID_RAMP_DAYS = 240

/** Daily raid probability (0..1). */
export function raidChance(state: GameState): number {
  const h = state.stats.heat
  if (h < RAID_HEAT) return 0
  const last = state.vars['sys.lastRaidDay']
  const since = last === undefined ? Infinity : state.time.day - last
  const ramp = Math.min(1, Math.max(0, (since - RAID_QUIET_DAYS) / RAID_RAMP_DAYS))
  return ((h - RAID_HEAT + 5) / RAID_DIV) * ramp
}

/** Daily: decay heat, maybe raid. Story may disable raids with flag `sys.no_raids`. */
export function dailyHeat(state: GameState): void {
  addStat(state, 'heat', -dailyHeatDecay(state) * DAYS_PER_STEP)
  if (state.jail || state.flags['sys.no_raids']) return
  if (rand(state) < perStep(raidChance(state))) raid(state, true)
}

/**
 * Police raid. `atTurnEnd` = the raid lands in the end-of-turn processing (the weekly heat roll),
 * so custody starts with the next turn; otherwise (a story effect mid-turn) it starts right away.
 */
export function raid(state: GameState, atTurnEnd = false): void {
  state.totals.raids += 1
  state.vars['sys.raids'] = (state.vars['sys.raids'] ?? 0) + 1
  state.vars['sys.lastRaidDay'] = state.time.day
  state.flags['sys.raided'] = true

  // Confiscate tools and unhidden hardware except the monitor.
  const lost: string[] = []
  state.items = state.items.filter(id => {
    const def = C.items.get(id)
    if (!def || def.hidden) return true
    const take = def.category === 'tool' || def.category === 'cpu' || def.category === 'storage'
    if (take) lost.push(def.name)
    return !take
  })
  for (const slot of ['cpu', 'storage'] as const) {
    const cur = state.equipped[slot]
    if (cur && !state.items.includes(cur)) {
      // Fall back to the best remaining item for the slot, if any.
      const replacement = state.items
        .map(id => C.items.get(id))
        .filter(d => d?.category === slot)
        .sort((a, b) => (b?.tier ?? 0) - (a?.tier ?? 0))[0]
      if (replacement) state.equipped[slot] = replacement.id
      // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
      else delete state.equipped[slot]
    }
  }
  const fine = state.stats.money > 0 ? Math.round(state.stats.money * RAID_FINE_FRACTION) : 0
  if (fine > 0) addMoney(state, -fine)
  const days = 2 + Math.floor(state.stats.heat / 15)
  state.stats.heat = RAID_HEAT_AFTER
  addStat(state, 'cred', -5)
  addStat(state, 'stress', 25)
  addStat(state, 'mood', -20)
  notify(
    state,
    `POLICE RAID! Seized: ${lost.length ? lost.join(', ') : 'nothing important'}. Fine: $${fine}. You are held for ${days} days${atTurnEnd ? ' — ' + turnsText(days) + ' in custody' : ''}.`,
    'heat',
  )
  // Active hack contracts are blown: the same failure path as a missed deadline.
  for (const c of state.contracts.active.filter(x => x.kind === 'hack')) failHack(state, c, 'the raid blew it — the client cut contact.')
  sendToJail(state, days, atTurnEnd)
}

function turnsText(days: number): string {
  const turns = Math.max(1, Math.ceil(days / DAYS_PER_STEP))
  return turns === 1 ? 'the whole next week' : `the next ${turns} weeks`
}

/**
 * Put the player in custody for `days` calendar days.
 *
 * Turn convention (shared with buffs, hospital and obligations): the game moves in whole weekly
 * turns, so a timed state lasts for every turn that overlaps its days and ends at the end of the
 * turn that covers its last day. Custody that starts at the end of a turn (`startsNextTurn`) is
 * counted from the next turn, so a 2–7 day hold is exactly one week in the cell.
 */
export function sendToJail(state: GameState, days: number, startsNextTurn = false): void {
  const from = startsNextTurn ? state.time.day + DAYS_PER_STEP : state.time.day
  const until = Math.max(state.jail?.untilDay ?? 0, from + days)
  if (!state.jail) state.vars['sys.jailFromDay'] = from
  state.jail = { untilDay: until }
  state.flags['sys.jailed_once'] = true
  log(state, `In custody until day ${until}.`, 'heat')
}

/** End of turn: serve custody days (freezing quest timers for exactly those days), maybe release. */
export function dailyJail(state: GameState): void {
  if (!state.jail) return
  const day = state.time.day
  const turnEnd = day + DAYS_PER_STEP
  const from = Math.max(day, state.vars['sys.jailFromDay'] ?? day)
  // Custody booked at the end of this turn begins next turn: nothing served yet.
  if (from >= turnEnd) return
  const served = Math.max(0, Math.min(state.jail.untilDay, turnEnd) - from)
  state.totals.daysJailed += served
  // Timed quest stages are frozen while in custody (bible §5.3).
  for (const q of Object.values(state.quests)) if (q.status === 'active') q.stageDay += served
  addStat(state, 'mood', -10)
  if (state.jail.untilDay <= turnEnd) {
    state.jail = null
    delete state.vars['sys.jailFromDay']
    notify(state, 'Released. The air outside smells like freedom and exhaust fumes.', 'good')
  }
}
