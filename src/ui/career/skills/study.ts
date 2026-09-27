/** Study math for the Skills app (display estimates around engine constants & modifiers). */
import { balance, C, efficiency, modAdd, modMult, modSources, SKILLS, type GameState, type Modifier, type SkillId } from '@/engine'
import { isSkill } from '../labels'

/** Estimated XP per study hour for a skill right now (base × boosters × efficiency). */
export function studyRate(state: GameState, skill: SkillId): { rate: number; why: string } {
  const mult = modMult(state, `xp.${skill}`) * modMult(state, 'xp.all')
  const add = modAdd(state, `xp.${skill}`)
  const eff = efficiency(state)
  const rate = (balance.STUDY_XP * mult + add) * eff
  const lines = [`Base ${balance.STUDY_XP} XP/h`]
  if (mult !== 1) lines.push(`Boosters ×${mult.toFixed(2)}`)
  if (add) lines.push(`Flat +${add} XP/h`)
  lines.push(`Efficiency ×${eff.toFixed(2)}`)
  return { rate, why: `${lines.join(' · ')} = ${rate.toFixed(1)} XP/h` }
}

export interface Booster {
  source: string
  mod: Modifier
}

/** Active modifiers that affect one specific skill's XP or its checks (not the all-skill ones). */
export function boostersFor(state: GameState, skill: SkillId): { xp: Booster[]; check: Booster[] } {
  const xp: Booster[] = []
  const check: Booster[] = []
  for (const src of modSources(state)) {
    for (const m of src.mods) {
      if (m.key === `xp.${skill}`) xp.push({ source: src.label, mod: m })
      if (m.key === `check.${skill}`) check.push({ source: src.label, mod: m })
    }
  }
  return { xp, check }
}

/** Modifiers that affect every skill (study XP for all, all checks). */
export function allSkillBoosters(state: GameState): Booster[] {
  const out: Booster[] = []
  for (const src of modSources(state)) for (const m of src.mods) if (m.key === 'xp.all' || m.key === 'check.all') out.push({ source: src.label, mod: m })
  return out
}

/** Where else a skill gets XP from right now (job, classes). */
export function trainedBy(state: GameState): Record<SkillId, string[]> {
  const out = {} as Record<SkillId, string[]>
  for (const s of SKILLS) out[s] = []
  const job = state.job ? C.jobs.get(state.job) : undefined
  if (job) for (const [k, v] of Object.entries(job.skillXp)) if (v && isSkill(k)) out[k].push(`job +${v}/h`)
  const prog = state.edu.enrolled ? C.programs.get(state.edu.enrolled.program) : undefined
  if (prog) for (const [k, v] of Object.entries(prog.skillXp)) if (v && isSkill(k)) out[k].push(`classes +${v}/h`)
  return out
}

/** Study hours per day on the planner. */
export function studyHoursPerDay(state: GameState): number {
  return state.schedule.filter(a => a === 'study').length
}
