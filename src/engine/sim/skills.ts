import { SKILL_LABELS, SKILL_MAX, xpToNext } from '../balance'
import { log } from '../text'
import type { GameState, SkillId } from '../types'

export function addSkillXp(state: GameState, skill: SkillId, amount: number): void {
  if (amount <= 0) return
  const s = state.skills[skill]
  if (s.level >= SKILL_MAX) return
  s.xp += amount
  let need = xpToNext(s.level)
  while (s.xp >= need && s.level < SKILL_MAX) {
    s.xp -= need
    s.level += 1
    log(state, `${SKILL_LABELS[skill]} reached level ${s.level}`, 'skill', s.level % 5 === 0)
    need = xpToNext(s.level)
  }
  if (s.level >= SKILL_MAX) s.xp = 0
}

/** Progress 0..1 toward the next level. */
export function skillProgress(state: GameState, skill: SkillId): number {
  const s = state.skills[skill]
  if (s.level >= SKILL_MAX) return 1
  return s.xp / xpToNext(s.level)
}

export function avgSkill(state: GameState, skills: readonly SkillId[]): number {
  if (skills.length === 0) return 0
  let sum = 0
  for (const s of skills) sum += state.skills[s].level
  return sum / skills.length
}
