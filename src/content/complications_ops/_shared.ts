/**
 * COMPLICATION PACK "complications_ops" — shared helpers.
 *
 * This pack owns the *consequence sub-stories* for three complication sources (REDESIGN_V2 §C):
 *   - 'hack'  — traced/blown ops (spawned by the engine on a traced op, and by { complication:'hack' })
 *   - 'gig'   — failed freelance gigs (spawned by the engine, GIG_FAIL_COMPLICATION_CHANCE)
 *   - 'legal' — court/fines/probation/suits/federal letters (spawned by { complication:'legal' } in
 *               fail branches across the game, including escalations inside THIS pack; the engine
 *               never picks 'legal' on its own)
 *
 * Files: hack_traces.ts (hack T1-3), gig.ts (gig T1-5), legal.ts (legal T1-5; its arraignment,
 * civil suit and federal letter also answer traced hack ops at T2-5), scars.ts (every TraitDef).
 * Each source keeps at least one repeatable entry per tier so its
 * pool never empties back to the generic 'any' pool.
 *
 * Every id in the pack is prefixed `cx_ops_`. Every scar TraitDef lives in `scars.ts`.
 * Complications leave LASTING marks: scars (traits), obligations (recurring costs, settle-early),
 * week-long debuffs (buffs), faction damage, confiscations, job loss, and `cx_ops.*` flags that
 * later text in this same pack reads.
 *
 * Guarded rule: this pack never writes an `fate` onto a canonical story NPC and never touches a
 * story flag it doesn't own — institutional grudges are expressed as `{ faction, add }` deltas and
 * as this pack's own `cx_ops.*` flags; antagonists are invented labels (spaces/caps), never bare ids.
 *
 * Hacking is fiction: the "terminal", tools, services and techniques named here are invented and
 * describe abstract game mechanics only — never a real procedure.
 *
 * Every file under src/content is auto-discovered, so this helper module also exports an empty pack.
 */
import { defineContent } from '@/engine/registry'
import type { Cond, Effect, Modifier } from '@/engine/types'

/** A week-long (or longer) named debuff. Shown in red. */
export function debuff(id: string, name: string, days: number, mods: Modifier[], desc?: string): Effect {
  return { buff: { id, name, days, mods, bad: true, ...(desc !== undefined ? { desc } : {}) } }
}

/** A short positive buff (e.g. "you lawyered up and slept better"). */
export function buff(id: string, name: string, days: number, mods: Modifier[], desc?: string): Effect {
  return { buff: { id, name, days, mods, ...(desc !== undefined ? { desc } : {}) } }
}

/** Recurring cost (fine / settlement / retainer / loan). Settle early with { removeObligation:id }. */
export function owe(id: string, label: string, perDay: number, days?: number): Effect {
  return { obligation: days !== undefined ? { id, label, perDay, days } : { id, label, perDay } }
}

/** Currently employed anywhere (job-loss complications gate on this). */
export const employed: Cond = { not: { job: null } }

/**
 * Same-named marks exist in sibling packs (events_underground, pkg15_life, complications_life).
 * Holding two versions of one mark would stack their mods, so every grant in this pack goes through
 * `scar()`, which skips the grant when the player already carries any sibling. Bonuses that reward a
 * mark read `hasScar()`, which accepts any sibling id. (Our own versions also carry distinct names.)
 */
const SCAR_SIBLINGS: Record<string, string[]> = {
  cx_ops_scar_known_to_police: ['ev_under_known_to_police'],
  cx_ops_scar_burned_bridge: ['ev_under_burned_bridge'],
  cx_ops_scar_paranoid_sleeper: ['ev_under_paranoid_sleeper', 'pkg15_life_paranoid_sleeper'],
  cx_ops_scar_street_smart: ['ev_under_street_smart', 'cx_life_street_smart'],
  cx_ops_scar_on_a_list: ['ev_under_open_file'],
}

/** Any of this mark's ids (ours plus same-named siblings from other packs). */
export function hasScar(id: string): Cond {
  return { any: [id, ...(SCAR_SIBLINGS[id] ?? [])].map(t => ({ trait: t })) }
}

/** Grant one of this pack's scars, unless the player already carries it or a sibling of it. */
export function scar(id: string): Effect {
  return { if: { not: hasScar(id) }, then: [{ trait: id }] }
}

/** A tidy "you are at least this far into the game" gate. */
export const actGte = (n: number): Cond => ({ var: 'act', gte: n })

/** Mom is alive, present and still talking to you (guards every scene she appears in). */
export const momOk: Cond = {
  all: [{ not: { var: 'w.mom_gone', eq: 1 } }, { npc: 'mom', fateNot: ['passed', 'estranged'] }],
}

/** You still live under Mom's roof — her mailbox, her phone line, her kitchen table. */
export const atHome: Cond = { all: [{ housing: 'parents_flat' }, momOk] }

/** A favor you can actually call in: the scene or the Row still likes you enough. */
export const loftFavor: Cond = { faction: 'fac.loft', gte: 20 }
export const hoodFavor: Cond = { faction: 'fac.hood', gte: 15 }

export default defineContent({})
