/** Vitals readouts & efficiency breakdown for the Life app (explanations around engine math). */
import {
  ageOn,
  balance,
  dailyHeatDecay,
  efficiency,
  hackTier,
  modSources,
  pct,
  raidChance,
  type GameState,
  type StatId,
} from '@/engine'

export type Tone = 'good' | 'warn' | 'bad' | ''

export interface VitalView {
  id: Exclude<StatId, 'money'>
  label: string
  value: number
  color: string
  note: string
  tone: Tone
  /** Short right-aligned figure (e.g. efficiency factor, raid odds). */
  side: string
  sideTitle: string
}

/** Isolated efficiency factors (each computed by the engine formula with the others neutral). */
export function efficiencyFactors(state: GameState): { label: string; value: number; note: string }[] {
  const s = state.stats
  const f = balance.efficiencyFrom
  const modMultTotal = efficiency(state) / f(s.energy, s.stress, s.health, s.mood)
  const sources = modSources(state)
    .map(src => ({ label: src.label, m: src.mods.filter(m => m.key === 'efficiency' && m.mult !== undefined && m.mult !== 1) }))
    .filter(x => x.m.length > 0)
    .map(x => `${x.label} ×${x.m.reduce((p, m) => p * (m.mult ?? 1), 1).toFixed(2)}`)
  return [
    { label: 'Energy', value: f(s.energy, 0, 100, 50), note: s.energy < 40 ? 'tired' : 'rested' },
    { label: 'Stress', value: f(100, s.stress, 100, 50), note: s.stress > 60 ? 'frazzled' : 'fine' },
    { label: 'Health', value: f(100, 0, s.health, 50), note: s.health < 100 ? 'below 100' : 'perfect' },
    { label: 'Mood', value: f(100, 0, 100, s.mood), note: s.mood >= 50 ? 'upbeat' : 'down' },
    { label: 'Gear, home & effects', value: Number.isFinite(modMultTotal) ? modMultTotal : 1, note: sources.join(', ') || 'none' },
  ]
}

export function vitals(state: GameState): VitalView[] {
  const s = state.stats
  const f = balance.efficiencyFrom
  const out: VitalView[] = []

  const hf = f(100, 0, s.health, 50)
  out.push({
    id: 'health',
    label: 'Health',
    value: s.health,
    color: 'var(--vital-health)',
    note:
      s.health >= 75
        ? 'In decent shape. Keep sleeping and eating something green.'
        : s.health >= 50
          ? 'A little worn down. Exercise and better food will help.'
          : s.health >= 25
            ? 'Your body is filing complaints. Rest, eat properly, exercise.'
            : 'Critical. At 0 you collapse and wake up in a hospital bed.',
    tone: s.health >= 50 ? '' : s.health >= 25 ? 'warn' : 'bad',
    side: `×${hf.toFixed(2)}`,
    sideTitle: 'Efficiency factor from health',
  })

  const ef = f(s.energy, 0, 100, 50)
  out.push({
    id: 'energy',
    label: 'Energy',
    value: s.energy,
    color: 'var(--vital-energy)',
    note:
      s.energy <= balance.EXHAUSTION_ENERGY
        ? 'Empty. Every hour awake now damages your health. Sleep!'
        : s.energy < 10
          ? 'Running on fumes — you work at a third of your speed.'
          : s.energy < 25
            ? 'Exhausted. Efficiency drops hard below 25.'
            : s.energy < 40
              ? 'Getting tired. Efficiency slips below 40.'
              : 'Rested enough to be useful.',
    tone: s.energy < 10 ? 'bad' : s.energy < 40 ? 'warn' : '',
    side: `×${ef.toFixed(2)}`,
    sideTitle: 'Efficiency factor from energy',
  })

  const sf = f(100, s.stress, 100, 50)
  out.push({
    id: 'stress',
    label: 'Stress',
    value: s.stress,
    color: 'var(--vital-stress)',
    note:
      s.stress >= 90
        ? 'On the edge — efficiency halved. At 100 you burn out for days.'
        : s.stress > 75
          ? 'Frayed. Efficiency drops to three quarters. Relax, socialize, exercise.'
          : s.stress > 60
            ? 'Tense. Mood suffers and efficiency slips above 60.'
            : 'Manageable. Stay below 60 to work at full speed.',
    tone: s.stress > 75 ? 'bad' : s.stress > 60 ? 'warn' : '',
    side: `×${sf.toFixed(2)}`,
    sideTitle: 'Efficiency factor from stress',
  })

  const mf = f(100, 0, 100, s.mood)
  out.push({
    id: 'mood',
    label: 'Mood',
    value: s.mood,
    color: 'var(--vital-mood)',
    note:
      s.mood >= 70
        ? 'Good spirits. Mood scales efficiency between ×0.85 and ×1.15.'
        : s.mood >= 40
          ? 'Okay. Mood drifts toward 50; good food, a nice home and friends lift it.'
          : 'Low. High stress and debt drag mood down — fix those first.',
    tone: s.mood < 25 ? 'bad' : s.mood < 40 ? 'warn' : '',
    side: `×${mf.toFixed(2)}`,
    sideTitle: 'Efficiency factor from mood',
  })

  const raid = raidChance(state)
  const decay = dailyHeatDecay(state)
  out.push({
    id: 'heat',
    label: 'Heat',
    value: s.heat,
    color: 'var(--vital-heat)',
    note:
      s.heat >= balance.RAID_HEAT
        ? `Someone is building a case. Raid risk ${pct(raid)} per day. Lay low!`
        : s.heat >= 45
          ? `You're on a list somewhere. Raids start at ${balance.RAID_HEAT}. Cools ${decay.toFixed(1)}/day.`
          : s.heat >= 20
            ? `A few logs mention you. Cools ${decay.toFixed(1)}/day (OpSec speeds it up).`
            : 'Nobody is looking. Keep it that way.',
    tone: s.heat >= balance.RAID_HEAT ? 'bad' : s.heat >= 45 ? 'warn' : '',
    side: raid > 0 ? `${pct(raid)}/day` : `−${decay.toFixed(1)}/d`,
    sideTitle: raid > 0 ? 'Chance of a police raid each day' : 'Heat decay per day',
  })

  const tier = hackTier(state)
  const next = balance.CRED_TIERS[tier]
  out.push({
    id: 'cred',
    label: 'Cred',
    value: s.cred,
    color: 'var(--vital-cred)',
    note:
      next !== undefined
        ? `Underground rep. Tier ${tier} contracts; tier ${tier + 1} opens at ${next} cred.`
        : `Underground rep. Top tier — the scene knows your handle.`,
    tone: '',
    side: `Tier ${tier}`,
    sideTitle: 'Hack contract tier',
  })
  return out
}

export interface AgeView {
  age: number
  nextBirthdayDay: number
  turning: number
  /** Health lost per day to aging (0 before AGING_START). */
  agingPerDay: number
  fitnessShield: number
}

export function ageView(state: GameState): AgeView {
  const age = ageOn(state.time.day)
  const turning = Math.floor(age) + 1
  const nextBirthdayDay = Math.ceil((turning - balance.START_AGE) * 365.25)
  const fitnessShield = (state.skills.fitness.level / 100) * 0.8
  const agingPerDay = age > balance.AGING_START ? balance.AGING_HEALTH_PER_YEAR * (age - balance.AGING_START) * (1 - fitnessShield) : 0
  return { age, nextBirthdayDay, turning, agingPerDay, fitnessShield }
}
