/**
 * Content registry. Every file under src/content/ that `export default defineContent({...})`
 * is discovered automatically (no central index to edit), merged, and indexed by id.
 */
import type {
  BackgroundDef,
  ContentPack,
  ContractDef,
  ContractTemplateDef,
  CourseDef,
  EventDef,
  EndingDef,
  FactionDef,
  ForumThreadDef,
  HousingDef,
  ItemDef,
  JobDef,
  LifestyleDef,
  MissionDef,
  NewsDef,
  NpcDef,
  ProgramDef,
  QuestDef,
  SceneDef,
  TraitDef,
  TriggerDef,
} from './types'

/** Identity helper so content files get full type checking. */
export function defineContent(pack: ContentPack): ContentPack {
  return pack
}

export interface Registry {
  scenes: Map<string, SceneDef>
  quests: Map<string, QuestDef>
  triggers: TriggerDef[]
  npcs: Map<string, NpcDef>
  factions: Map<string, FactionDef>
  news: Map<string, NewsDef>
  forum: Map<string, ForumThreadDef>
  endings: Map<string, EndingDef>
  jobs: Map<string, JobDef>
  programs: Map<string, ProgramDef>
  courses: Map<string, CourseDef>
  items: Map<string, ItemDef>
  housing: Map<string, HousingDef>
  lifestyles: Map<string, LifestyleDef>
  backgrounds: Map<string, BackgroundDef>
  traits: Map<string, TraitDef>
  contracts: Map<string, ContractDef>
  contractTemplates: Map<string, ContractTemplateDef>
  missions: Map<string, MissionDef>
  events: Map<string, EventDef>
  /** Where each id came from, for error messages: "kind:id" -> file. */
  origin: Map<string, string>
  /** Duplicate-id problems found while merging. */
  errors: string[]
  /** Quests that auto-start. */
  autoQuests: QuestDef[]
  /** Ambient news pool. */
  ambientNews: NewsDef[]
  /** Forum threads that appear by condition. */
  conditionalForum: ForumThreadDef[]
}

type MapKey = {
  [K in keyof Registry]: Registry[K] extends Map<string, unknown> ? K : never
}[keyof Registry]

const MAP_KINDS = [
  'scenes',
  'quests',
  'npcs',
  'factions',
  'news',
  'forum',
  'endings',
  'jobs',
  'programs',
  'courses',
  'items',
  'housing',
  'lifestyles',
  'backgrounds',
  'traits',
  'contracts',
  'contractTemplates',
  'missions',
  'events',
] as const satisfies readonly (MapKey & keyof ContentPack)[]

export function buildRegistry(modules: Record<string, unknown>): Registry {
  const reg: Registry = {
    scenes: new Map(),
    quests: new Map(),
    triggers: [],
    npcs: new Map(),
    factions: new Map(),
    news: new Map(),
    forum: new Map(),
    endings: new Map(),
    jobs: new Map(),
    programs: new Map(),
    courses: new Map(),
    items: new Map(),
    housing: new Map(),
    lifestyles: new Map(),
    backgrounds: new Map(),
    traits: new Map(),
    contracts: new Map(),
    contractTemplates: new Map(),
    missions: new Map(),
    events: new Map(),
    origin: new Map(),
    errors: [],
    autoQuests: [],
    ambientNews: [],
    conditionalForum: [],
  }
  const triggerIds = new Set<string>()
  const files = Object.keys(modules).sort()
  for (const file of files) {
    const mod = modules[file] as { default?: ContentPack } | undefined
    const pack = mod?.default
    if (!pack) {
      reg.errors.push(`${file}: no default export (use \`export default defineContent({...})\`)`)
      continue
    }
    for (const kind of MAP_KINDS) {
      const list = pack[kind] as { id: string }[] | undefined
      if (!list) continue
      const map = reg[kind] as Map<string, { id: string }>
      for (const def of list) {
        const key = `${kind}:${def.id}`
        const prev = reg.origin.get(key)
        if (prev) {
          reg.errors.push(`duplicate ${kind} id "${def.id}" in ${file} (already in ${prev})`)
          continue
        }
        reg.origin.set(key, file)
        map.set(def.id, def)
      }
    }
    for (const t of pack.triggers ?? []) {
      if (triggerIds.has(t.id)) {
        reg.errors.push(`duplicate trigger id "${t.id}" in ${file}`)
        continue
      }
      triggerIds.add(t.id)
      reg.origin.set(`triggers:${t.id}`, file)
      reg.triggers.push(t)
    }
  }
  reg.triggers.sort((a, b) => (a.priority ?? 100) - (b.priority ?? 100))
  for (const q of reg.quests.values()) if (q.autoStart) reg.autoQuests.push(q)
  for (const n of reg.news.values()) if (n.ambient) reg.ambientNews.push(n)
  for (const f of reg.forum.values()) if (f.appears) reg.conditionalForum.push(f)
  return reg
}

const modules = import.meta.glob('../content/**/*.ts', { eager: true })

/** The global content registry. */
export const C: Registry = buildRegistry(modules)

if (C.errors.length > 0) {
  for (const e of C.errors) console.error(`[content] ${e}`)
}
