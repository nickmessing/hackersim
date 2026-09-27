import { HACK_DEADLINE_DAYS, PREP_HOURS_BY_TIER } from './balance'
import { C } from './registry'
import { generateMission, tierFromDc } from './sim/missiongen'
import type { ActivityId, ContractInstance, GameState, NpcState, OpSpec, Settings, SkillId } from './types'
import { SKILLS } from './types'

export const SAVE_VERSION = 2

/** Content ids the engine relies on. The content must define these. */
export const START_HOUSING = 'parents_flat'
export const START_LIFESTYLE = 'moms_cooking'
export const START_ITEMS = ['beige_pc_p2', 'ram_64mb', 'hdd_4gb', 'modem_33k', 'crt_14in']

export const DEFAULT_SETTINGS: Settings = {
  autoPauseDialogs: true,
  showRollMath: true,
  crt: true,
  sound: false,
}

export function defaultSchedule(): ActivityId[] {
  const s: ActivityId[] = []
  for (let h = 0; h < 24; h++) {
    if (h < 8) s.push('sleep')
    else if (h === 8 || h === 13 || h >= 22) s.push('relax')
    else if (h < 13) s.push('study')
    else if (h < 17) s.push('freelance')
    else if (h < 19) s.push('social')
    else s.push('hack')
  }
  return s
}

export interface NewGameOptions {
  name: string
  handle: string
  background: string
  traits: string[]
  seed?: number
}

export function createState(opts: NewGameOptions): GameState {
  const seed = opts.seed ?? Math.floor(Math.random() * 2 ** 31)
  const skills = {} as GameState['skills']
  for (const s of SKILLS) skills[s] = { level: 0, xp: 0 }

  const state: GameState = {
    version: SAVE_VERSION,
    seed,
    rng: seed,
    createdAt: Date.now(),
    savedAt: Date.now(),
    player: { name: opts.name, handle: opts.handle, background: opts.background, traits: [...opts.traits] },
    time: { day: 0, hour: 8, frac: 0, speed: 1, lastSpeed: 1, totalHours: 0 },
    stats: { money: 150, health: 85, energy: 80, stress: 15, mood: 60, heat: 0, cred: 0 },
    skills,
    schedule: defaultSchedule(),
    focus: { study: { kind: 'skill', skill: 'programming' }, social: null },
    job: null,
    jobs: {},
    workedToday: 0,
    edu: { enrolled: null, degrees: [], courses: [], courseProgress: {}, coursesOwned: [] },
    items: [],
    equipped: {},
    housing: START_HOUSING,
    lifestyle: START_LIFESTYLE,
    buffs: [],
    flags: {},
    vars: { act: 1 },
    factions: {},
    npcs: {},
    quests: {},
    trackedQuest: null,
    threads: [],
    nextUid: 1,
    pendingScenes: [],
    seenScenes: {},
    triggers: {},
    contracts: { board: [], active: [], history: {}, lastRefreshDay: -999 },
    missions: {},
    news: [],
    forum: [],
    jail: null,
    hospital: null,
    ending: null,
    endingsSeen: [],
    log: [],
    settings: { ...DEFAULT_SETTINGS },
    obligations: [],
    events: { fired: {}, quietTurns: 0, recent: [], lastSceneDay: 0 },
    lastReport: null,
    totals: {
      earned: 0,
      spent: 0,
      hacksDone: 0,
      hacksFailed: 0,
      gigsDone: 0,
      raids: 0,
      daysJailed: 0,
      checksPassed: 0,
      checksFailed: 0,
    },
  }

  // Background: starting skills, money, flags, items.
  const bg = C.backgrounds.get(opts.background)
  if (bg) {
    for (const [k, v] of Object.entries(bg.skills) as [SkillId, number][]) skills[k].level = v
    state.stats.money = bg.money
    for (const f of bg.flags ?? []) state.flags[f] = true
  }
  for (const t of opts.traits) {
    const tr = C.traits.get(t)
    for (const f of tr?.flags ?? []) state.flags[f] = true
  }
  for (const id of [...START_ITEMS, ...(bg?.items ?? [])]) grantItemRaw(state, id)

  for (const npc of C.npcs.values()) {
    if (npc.startsMet) state.npcs[npc.id] = { met: true, affinity: npc.startAffinity ?? 0, fate: 'normal', romance: 'none' }
  }
  return state
}

/** Add an item and auto-equip hardware (engine-internal, no side effects). */
export function grantItemRaw(state: GameState, id: string): void {
  const def = C.items.get(id)
  if (!def) return
  if (!state.items.includes(id)) state.items.push(id)
  const cat = def.category
  if (cat === 'cpu' || cat === 'ram' || cat === 'storage' || cat === 'network' || cat === 'monitor') {
    const cur = state.equipped[cat]
    const curTier = cur ? (C.items.get(cur)?.tier ?? 0) : -1
    if ((def.tier ?? 0) >= curTier) state.equipped[cat] = id
  }
}

export function npcState(state: GameState, id: string): NpcState {
  let s = state.npcs[id]
  if (!s) {
    const def = C.npcs.get(id)
    s = { met: def?.startsMet ?? false, affinity: def?.startAffinity ?? 0, fate: 'normal', romance: 'none' }
    state.npcs[id] = s
  }
  return s
}

/**
 * SAVE_VERSION 1 → 2: hacks accepted before the ops redesign carry no prep budget, deadline or
 * mission. Give them what accepting one does today, or they could never be prepped, launched or
 * expired and would hold an active-hack slot forever. Progress already logged is kept.
 */
function migrateLegacyHack(state: GameState, c: ContractInstance): void {
  const tier = c.tier > 0 ? Math.min(5, Math.max(1, c.tier)) : tierFromDc(c.dc)
  if (c.prepNeeded <= 0) c.prepNeeded = PREP_HOURS_BY_TIER[tier - 1] ?? PREP_HOURS_BY_TIER[0]
  c.deadlineDay ??= state.time.day + HACK_DEADLINE_DAYS
  // A hand-authored mission that no longer exists in content falls back to a generated op.
  const authored = c.mission !== undefined && C.missions.has(c.mission)
  if (authored || c.missionDef) return
  const stashed = (c as ContractInstance & { opSpec?: OpSpec }).opSpec
  const spec: OpSpec = stashed ?? C.contractTemplates.get(c.template ?? '')?.op ?? { network: 'corp', goal: 'download', loot: [] }
  c.missionDef = generateMission(state, spec, {
    id: `op_${String(c.uid)}`,
    title: c.title,
    tier,
    dc: c.dc,
    client: c.client,
    target: c.title,
    desc: c.desc,
  })
}

/** Fill in fields missing from older saves. */
export function hydrate(raw: Partial<GameState>): GameState {
  const base = createState({
    name: raw.player?.name ?? 'Player',
    handle: raw.player?.handle ?? 'n00b',
    background: raw.player?.background ?? '',
    traits: raw.player?.traits ?? [],
    seed: raw.seed ?? 1,
  })
  const merged: GameState = { ...base, ...raw }
  merged.settings = { ...DEFAULT_SETTINGS, ...raw.settings }
  merged.totals = { ...base.totals, ...raw.totals }
  merged.time = { ...base.time, ...raw.time }
  merged.stats = { ...base.stats, ...raw.stats }
  const skills: Partial<GameState['skills']> = merged.skills
  for (const s of SKILLS) skills[s] ??= { level: 0, xp: 0 }
  if (merged.schedule.length !== 24) merged.schedule = defaultSchedule()
  merged.edu = { ...base.edu, ...raw.edu }
  merged.contracts = { ...base.contracts, ...raw.contracts }
  merged.events = { ...base.events, ...raw.events }
  merged.obligations = raw.obligations ?? []
  // Contracts saved before the ops redesign have no prep fields.
  for (const c of [...merged.contracts.board, ...merged.contracts.active]) {
    const legacy = c as Partial<typeof c>
    c.prep = legacy.prep ?? 0
    c.prepNeeded = legacy.prepNeeded ?? 0
  }
  for (const c of merged.contracts.active) {
    if (c.kind === 'hack' && c.status === 'active') migrateLegacyHack(merged, c)
  }
  // Offline progress was removed; drop the old settings keys.
  const legacySettings = merged.settings as unknown as Record<string, unknown>
  delete legacySettings.offlineProgress
  delete legacySettings.offlineCapDays
  merged.version = SAVE_VERSION
  return merged
}
