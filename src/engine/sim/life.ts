import { DAYS_PER_STEP, perStep, parentsContribution, AGING_HEALTH_PER_YEAR, AGING_START, BURNOUT_DAYS, DEBT_LIMIT, HOSPITAL_COST_PER_DAY, HOSPITAL_DAYS } from '../balance'
import { ageOn } from '../calendar'
import { evalCond } from '../conditions'
import { addMoney, addStat } from '../effects'
import { clamp } from '../format'
import { modAdd, modMult, worldMult } from '../mods'
import { C } from '../registry'
import { START_HOUSING, grantItemRaw } from '../state'
import { log, notify } from '../text'
import type { GameState, HousingId, ItemDef, LifestyleId } from '../types'

export interface ExpenseLine {
  label: string
  amount: number
}

/** Every recurring cost per day, including obligations (for the UI and the daily-cost total). */
export function expenseBreakdown(state: GameState): ExpenseLine[] {
  return [...livingCostLines(state), ...state.obligations.map(o => ({ label: o.label, amount: Math.round(o.perDay) }))]
}

/** Recurring costs that run every day with no end date (rent, lifestyle, upkeep...). */
function livingCostLines(state: GameState): ExpenseLine[] {
  const lines: ExpenseLine[] = []
  const mult = modMult(state, 'expenses')
  const house = C.housing.get(state.housing)
  if (house && !house.owned && house.rentPerDay > 0) {
    lines.push({ label: `Rent: ${house.name}`, amount: house.rentPerDay * worldMult(state, 'w.rent') * mult })
  }
  if (state.housing === START_HOUSING) {
    const c = parentsContribution(state.time.day)
    if (c > 0) lines.push({ label: 'Household contribution (Mom insists)', amount: c * mult })
  }
  const life = C.lifestyles.get(state.lifestyle)
  if (life && life.costPerDay > 0) lines.push({ label: `Lifestyle: ${life.name}`, amount: life.costPerDay * worldMult(state, 'w.prices') * mult })
  for (const id of state.items) {
    const def = C.items.get(id)
    if (def?.upkeepPerDay && isActiveItem(state, def)) lines.push({ label: def.name, amount: def.upkeepPerDay * mult })
  }
  const upkeep = state.vars['life.extraUpkeep'] ?? 0
  if (upkeep > 0) lines.push({ label: 'Other obligations', amount: upkeep })
  return lines.map(l => ({ ...l, amount: Math.round(l.amount) }))
}

function isActiveItem(state: GameState, def: ItemDef): boolean {
  const c = def.category
  if (c === 'cpu' || c === 'ram' || c === 'storage' || c === 'network' || c === 'monitor') return state.equipped[c] === def.id
  return true
}

export function dailyExpenses(state: GameState): number {
  return expenseBreakdown(state).reduce((s, l) => s + l.amount, 0)
}

export function moveHousing(state: GameState, id: HousingId, force = false): boolean {
  const h = C.housing.get(id)
  if (!h) return false
  if (!force) {
    if (!evalCond(state, h.req) || !evalCond(state, h.available)) return false
    if (state.stats.money < h.moveCost) return false
    addMoney(state, -h.moveCost)
  }
  state.housing = id
  notify(state, `Moved to: ${h.name}`, 'good')
  return true
}

export function setLifestyle(state: GameState, id: LifestyleId): boolean {
  const l = C.lifestyles.get(id)
  if (!l) return false
  state.lifestyle = id
  log(state, `Lifestyle: ${l.name}`, 'info')
  return true
}

export function canBuy(state: GameState, def: ItemDef): { ok: boolean; reason?: string } {
  if (state.items.includes(def.id)) return { ok: false, reason: 'Owned' }
  if (!evalCond(state, def.req)) return { ok: false, reason: def.reqText ?? 'Locked' }
  const price = itemPrice(state, def)
  if (state.stats.money < price) return { ok: false, reason: 'Not enough money' }
  return { ok: true }
}

export function itemPrice(state: GameState, def: ItemDef): number {
  return Math.round(def.price * worldMult(state, def.category === 'book' || def.category === 'misc' ? 'w.prices' : 'w.techPrices'))
}

export function buyItem(state: GameState, id: string): boolean {
  const def = C.items.get(id)
  if (!def) return false
  if (!canBuy(state, def).ok) return false
  addMoney(state, -itemPrice(state, def))
  grantItemRaw(state, id)
  notify(state, `Bought ${def.name}`, 'money')
  return true
}

/**
 * Calendar days of an obligation that fall inside the turn starting on `day`. Time-limited
 * obligations are prorated so the total billed equals the stated "$X/day for N days".
 */
function obligationDaysThisTurn(o: GameState['obligations'][number], day: number): number {
  if (o.untilDay === null) return DAYS_PER_STEP
  return clamp(o.untilDay - day, 0, DAYS_PER_STEP)
}

/**
 * End-of-turn life processing: expenses, lifestyle, mood drift, aging, debt, burnout, buffs.
 *
 * Turn convention for timed states (buffs, obligations, hospital; custody in heat.ts): a turn
 * covers calendar days [day, day + DAYS_PER_STEP). A timed state ends at the end of the turn that
 * covers its last day (`untilDay <= day + DAYS_PER_STEP`), so anything of 7 days or less that
 * starts during a turn is over when that turn ends. States that begin in the end-of-turn
 * processing itself (burnout, hospital) are counted from the next turn.
 */
export function endOfDayLife(state: GameState): void {
  /** Calendar days this end-of-turn covers. */
  const K = DAYS_PER_STEP
  const day = state.time.day
  const turnEnd = day + K
  const living = livingCostLines(state).reduce((sum, l) => sum + l.amount, 0) * K
  const owed = state.obligations.reduce((sum, o) => sum + Math.round(o.perDay) * obligationDaysThisTurn(o, day), 0)
  if (living + owed > 0) addMoney(state, -(living + owed))

  const life = C.lifestyles.get(state.lifestyle)
  if (life) {
    addStat(state, 'health', life.healthPerDay * K)
    addStat(state, 'mood', life.moodPerDay * K)
    addStat(state, 'stress', life.stressPerDay * K)
  }
  const house = C.housing.get(state.housing)
  if (house) addStat(state, 'mood', (house.comfort - 1) * 4 * K)
  addStat(state, 'mood', modAdd(state, 'mood.daily') * K)
  addStat(state, 'health', modAdd(state, 'health.daily') * K)

  // Mood drifts toward 50 slowly; stress pulls it down.
  const m = state.stats.mood
  addStat(state, 'mood', (50 - m) * perStep(0.04) - Math.max(0, state.stats.stress - 60) * 0.05 * K)

  // Aging.
  const age = ageOn(state.time.day)
  if (age > AGING_START) {
    const fitnessShield = state.skills.fitness.level / 100
    addStat(state, 'health', -AGING_HEALTH_PER_YEAR * (age - AGING_START) * (1 - fitnessShield * 0.8) * K)
  }

  // Debt.
  if (state.stats.money < 0) {
    addStat(state, 'stress', 2 * K)
    addStat(state, 'mood', -2 * K)
    state.vars['sys.daysInDebt'] = (state.vars['sys.daysInDebt'] ?? 0) + K
    if (state.stats.money < DEBT_LIMIT) {
      state.flags['sys.deep_debt'] = true
      const cheapest = [...C.lifestyles.values()].sort((a, b) => a.costPerDay - b.costPerDay)[0]
      if (cheapest && state.lifestyle !== cheapest.id) {
        state.lifestyle = cheapest.id
        notify(state, `Deep in debt — you had to switch to "${cheapest.name}".`, 'bad')
      }
    }
  } else {
    state.vars['sys.daysInDebt'] = 0
    state.flags['sys.deep_debt'] = false
  }

  // Obligations run out.
  const expired = state.obligations.filter(o => o.untilDay !== null && o.untilDay <= turnEnd)
  if (expired.length > 0) {
    state.obligations = state.obligations.filter(o => !expired.includes(o))
    for (const o of expired) log(state, `Paid off: ${o.label}`, 'good')
  }

  // Buff expiry.
  const before = state.buffs.length
  state.buffs = state.buffs.filter(b => b.untilDay > turnEnd)
  if (state.buffs.length < before) log(state, 'Some effects wore off.', 'info')

  // Burnout.
  if (state.stats.stress >= 100 && !state.buffs.some(b => b.id === 'burnout')) {
    state.buffs.push({
      id: 'burnout',
      name: 'Burnout',
      desc: 'You are completely fried. Everything takes longer.',
      days: BURNOUT_DAYS,
      // Burnout sets in at the end of this turn: it costs the whole next turn (or more).
      untilDay: turnEnd + BURNOUT_DAYS,
      mods: [
        { key: 'efficiency', mult: 0.4 },
        { key: 'stress.relief', mult: 1.5 },
      ],
      bad: true,
    })
    state.vars['sys.burnouts'] = (state.vars['sys.burnouts'] ?? 0) + 1
    notify(state, 'BURNOUT. You stare at the screen and nothing happens. Rest up.', 'bad')
  }

  // Hospital.
  if (state.stats.health <= 0 && !state.hospital) {
    // Admitted at the end of this turn: the stay (and the convalescence around it) is next week.
    state.hospital = { untilDay: turnEnd + HOSPITAL_DAYS }
    state.stats.health = 30
    addMoney(state, -HOSPITAL_COST_PER_DAY * HOSPITAL_DAYS)
    state.vars['sys.hospitalized'] = (state.vars['sys.hospitalized'] ?? 0) + 1
    notify(state, `You collapsed and woke up in a hospital bed. ${HOSPITAL_DAYS} days on the ward and the rest of the week in bed — next week is a write-off.`, 'bad')
  }
  if (state.hospital && state.hospital.untilDay <= turnEnd) {
    state.hospital = null
    state.stats.energy = clamp(state.stats.energy, 60, 100)
    log(state, 'Discharged from hospital.', 'good')
  }
}
