/**
 * HACKERSIM — core type contracts.
 *
 * Everything the game knows is split into:
 *  - CONTENT (static, authored data: scenes, quests, jobs, items, ...) — see `ContentPack`.
 *  - STATE   (mutable, saved: `GameState`).
 * Engine functions operate on a `GameState` passed in; the UI wraps it in Vue `reactive()`.
 *
 * Content authors: prefer the compact object forms of `Cond` and `Effect` below.
 * All ids are snake_case strings. Flags are namespaced ("a1.met_rook", "side.grandma_pc.done").
 */

// ────────────────────────────────────────────────────────────────────────────
// Basic ids
// ────────────────────────────────────────────────────────────────────────────

export const SKILLS = [
  'programming',
  'networking',
  'intrusion',
  'cryptography',
  'hardware',
  'systems',
  'social',
  'opsec',
  'business',
  'fitness',
] as const
export type SkillId = (typeof SKILLS)[number]

/** Numeric player stats. `money` is dollars; the rest are 0..100 except `cred` (0..100 underground rep). */
export const STATS = ['money', 'health', 'energy', 'stress', 'mood', 'heat', 'cred'] as const
export type StatId = (typeof STATS)[number]

export const ACTIVITIES = [
  'sleep',
  'work',
  'class',
  'study',
  'hack',
  'freelance',
  'exercise',
  'social',
  'relax',
] as const
export type ActivityId = (typeof ACTIVITIES)[number]
/** Activities the player can paint on the schedule (work/class are placed by the job / university). */
export const PAINTABLE_ACTIVITIES = ['sleep', 'study', 'hack', 'freelance', 'exercise', 'social', 'relax'] as const
export type PaintableActivity = (typeof PAINTABLE_ACTIVITIES)[number]

export type SceneId = string
export type NodeId = string
export type QuestId = string
export type NpcId = string
export type FactionId = string
export type JobId = string
export type ItemId = string
export type HousingId = string
export type LifestyleId = string
export type ContractId = string
export type ContractTemplateId = string
export type MissionId = string
export type NewsId = string
export type EndingId = string
export type ProgramId = string
export type CourseId = string
export type TriggerId = string
export type ForumThreadId = string
export type BackgroundId = string
export type TraitId = string

export type FlagValue = boolean | number | string

export type RomanceState = 'none' | 'flirting' | 'dating' | 'partner' | 'engaged' | 'married' | 'ex'

/** Common NPC fates. Content may use other strings too. */
export type NpcFate =
  | 'normal'
  | 'ally'
  | 'enemy'
  | 'arrested'
  | 'jailed'
  | 'missing'
  | 'dead'
  | 'gone'
  | 'betrayer'
  | 'informant'
  | (string & {})

export type QuestStatus = 'active' | 'completed' | 'failed'
export type QuestKind = 'tutorial' | 'main' | 'faction' | 'side' | 'personal'

// ────────────────────────────────────────────────────────────────────────────
// Rich text
// ────────────────────────────────────────────────────────────────────────────

/**
 * Text shown to the player. Either a string, or a list of paragraphs where a paragraph may be
 * conditional. Tokens: {name} (player name), {handle} (player nick), {npc:ID} (npc name),
 * {nick:ID} (npc handle), {money} (current money), {date} (current date), {age}.
 */
export type TextPart = string | { if: Cond; text: string; else?: string }
export type Text = string | TextPart[]

// ────────────────────────────────────────────────────────────────────────────
// Numeric references & conditions
// ────────────────────────────────────────────────────────────────────────────

/** A number read from state. Used by `{ n: ... }` conditions and objective progress bars. */
export type NumRef =
  | { skill: SkillId }
  | { stat: StatId }
  | { var: string }
  | { faction: FactionId }
  | { affinity: NpcId }
  | { jobLevel: JobId }
  | { flagNum: string }
  | { age: true }
  | { day: true }
  | { hour: true }

interface Range {
  gte?: number
  lte?: number
  eq?: number
}

/**
 * Condition. Plain objects; exactly one "head" key per object (all/any/not/flag/skill/...).
 * Range keys (gte/lte/eq) are inclusive.
 */
export type Cond =
  | { all: Cond[] }
  | { any: Cond[] }
  | { not: Cond }
  | { always: true }
  | { never: true }
  /** Flag is truthy (or equals `eq`). */
  | { flag: string; eq?: FlagValue }
  | ({ skill: SkillId } & Range)
  | ({ stat: StatId } & Range)
  | ({ var: string } & Range)
  | ({ faction: FactionId } & Range)
  | ({ age: true } & Range)
  /** Game day number (day 0 = 2001-09-01). */
  | ({ day: true } & Range)
  /** Hour of day 0..23. */
  | ({ hour: true } & Range)
  | ({ n: NumRef } & Range)
  | {
      npc: NpcId
      met?: boolean
      fate?: NpcFate | NpcFate[]
      /** Fate is NOT one of these. */
      fateNot?: NpcFate | NpcFate[]
      romance?: RomanceState | RomanceState[]
      affinityGte?: number
      affinityLte?: number
    }
  /** Currently employed in one of these jobs (null = unemployed). */
  | { job: JobId | JobId[] | null }
  | ({ jobLevel: JobId } & Range)
  /** Job career track currently employed in. */
  | { jobTrack: string | string[] }
  | { quest: QuestId; status?: QuestStatus | QuestStatus[] | 'inactive'; stage?: string | string[] }
  | { item: ItemId }
  | { housing: HousingId | HousingId[] }
  | { lifestyle: LifestyleId | LifestyleId[] }
  | { seen: SceneId }
  /** A story contract's history: 'done' = succeeded at least once. */
  | { contract: ContractId; status: 'done' | 'failed' | 'active' | 'offered' | 'any' }
  | { mission: MissionId; status: 'won' | 'lost' | 'any' }
  | { news: NewsId }
  | { enrolled: ProgramId | true }
  | { degree: ProgramId | true }
  | { course: CourseId }
  | { background: BackgroundId }
  | { trait: TraitId }
  | { ending: EndingId }
  | { jailed: boolean }
  /** Random roll each time the condition is evaluated (0..1 probability). Use in triggers. */
  | { chance: number }
  /** An obligation (recurring cost) with this id is currently active. */
  | { obligation: string }
  /** This event (or complication) has fired at least once. */
  | { eventFired: string }
  /** A desktop program has been revealed (see src/engine/unlocks.ts). */
  | { unlocked: string }

// ────────────────────────────────────────────────────────────────────────────
// Modifiers (item / housing / buff / trait bonuses)
// ────────────────────────────────────────────────────────────────────────────

/**
 * Modifier keys read by the simulation. `add` stacks additively, `mult` multiplicatively
 * (mult 1.2 = +20%). Unknown keys are ignored.
 */
export type ModKey =
  | `xp.${SkillId}` // study XP multiplier for a skill (mult); add = flat XP/hour
  | 'xp.all' // study XP for all skills
  | 'jobXp' // job experience gain
  | 'pay' // salary multiplier
  | 'hack.speed' // contract work speed
  | 'hack.roll' // flat bonus to contract rolls
  | 'hack.heat' // heat gained from hacking (mult)
  | 'freelance.speed'
  | 'freelance.pay'
  | 'energy.regen' // sleep regeneration (mult)
  | 'energy.drain' // awake energy drain (mult)
  | 'stress.gain' // stress gained (mult)
  | 'stress.relief' // stress relieved (mult)
  | 'mood.daily' // add to mood per day
  | 'health.daily' // add to health per day
  | 'heat.decay' // add to daily heat decay
  | 'efficiency' // overall efficiency multiplier
  | 'expenses' // daily expenses multiplier
  | 'cred.gain'
  | 'trace' // terminal trace time multiplier (higher = slower trace = better)
  | 'crack.speed' // terminal cracking speed multiplier
  | `check.${SkillId}` // flat bonus to dialog skill checks with that skill
  | 'check.all'

export interface Modifier {
  key: ModKey
  add?: number
  mult?: number
}

// ────────────────────────────────────────────────────────────────────────────
// Effects
// ────────────────────────────────────────────────────────────────────────────

export type Effect =
  /** Add (negative = remove) dollars. */
  | { money: number }
  | { stat: Exclude<StatId, 'money'>; add?: number; set?: number }
  | { xp: SkillId; add: number }
  /** Set flag (default true). */
  | { flag: string; set?: FlagValue }
  | { clearFlag: string }
  | { var: string; add?: number; set?: number }
  | { faction: FactionId; add: number }
  | {
      npc: NpcId
      met?: boolean
      affinity?: number
      fate?: NpcFate
      romance?: RomanceState
    }
  /**
   * Quest control. `start` starts it (no-op if already started), `stage` jumps to a stage,
   * `objective` marks an objective done, `complete`/`fail` ends it.
   */
  | { quest: QuestId; start?: true; stage?: string; objective?: string; complete?: true; fail?: true }
  /** Deliver a scene (mail / chat / forum thread / dialog). Optional delay in game hours. */
  | { scene: SceneId; delayHours?: number }
  | { news: NewsId }
  | { item: ItemId; remove?: true }
  /** Set current job (null = fired / quit). `force` ignores requirements. */
  | { job: JobId | null }
  | { jobXp: JobId; add: number }
  | { housing: HousingId }
  | { lifestyle: LifestyleId }
  /** Offer a story contract on the board (or directly if `direct`). */
  | { contract: ContractId; direct?: true }
  | { buff: BuffDef }
  | { removeBuff: string }
  /** Go to jail for N days. */
  | { jail: number }
  /** Police raid: confiscation, fines, jail per engine rules. */
  | { raid: true }
  | { enroll: ProgramId }
  | { dropout: true }
  | { degree: ProgramId }
  | { course: CourseId }
  | { forum: ForumThreadId }
  | { ending: EndingId }
  /** Toast + log line. */
  | { notify: Text; kind?: LogKind }
  /** Log line only. */
  | { log: Text; kind?: LogKind }
  | { chance: number; then: Effect[]; else?: Effect[] }
  | { if: Cond; then: Effect[]; else?: Effect[] }
  /** Pick one weighted branch. */
  | { random: { weight: number; effects: Effect[] }[] }
  /** Pause the game (e.g. before an important reveal). */
  | { pause: true }
  /** Gain (or with `remove`, lose) a permanent trait — e.g. a "scar" earned by a bad outcome. */
  | { trait: TraitId; remove?: true }
  /** A recurring daily cost (fine, lawsuit, loan, medical bill). `days` omitted = until removed. */
  | { obligation: { id: string; label: string; perDay: number; days?: number } }
  | { removeObligation: string }
  /**
   * Spawn a complication sub-story from the complication pool (an EventDef with `complication`)
   * matching this source. `tier` 1..5 scales severity (defaults to the current act).
   */
  | { complication: ComplicationSource; tier?: number }
  /** Fire a specific event from the event pool now (ignores its `when`, respects nothing else). */
  | { event: string }
  /** Reveal desktop programs (Act 0 gradual discovery). Ids: see FEATURES in src/engine/unlocks.ts. */
  | { unlock: string | string[] }

export type LogKind = 'info' | 'good' | 'bad' | 'story' | 'money' | 'skill' | 'heat' | 'quest'

export interface BuffDef {
  id: string
  name: string
  desc?: string
  days: number
  mods: Modifier[]
  /** Negative buff (debuff) — shown in red. */
  bad?: boolean
}

// ────────────────────────────────────────────────────────────────────────────
// Scenes (dialogue trees, delivered through channels)
// ────────────────────────────────────────────────────────────────────────────

export type Channel = 'dialog' | 'mail' | 'chat' | 'forum'

export interface SkillCheck {
  skill: SkillId
  dc: number
  /** Situational bonuses shown to the player, e.g. "+2 (you read his file)". */
  bonuses?: { if: Cond; add: number; label: string }[]
  /** Node to go to. */
  success: NodeId
  fail: NodeId
  successEffects?: Effect[]
  failEffects?: Effect[]
}

export interface Choice {
  text: Text
  /** Hidden entirely unless true. */
  if?: Cond
  /** Shown but disabled (greyed with `reqText`) unless true. */
  req?: Cond
  reqText?: string
  check?: SkillCheck
  effects?: Effect[]
  /** Node to go to (ignored when `check` is present). Omit to end the scene. */
  goto?: NodeId
  /** Tag shown before the text, e.g. "[Lie]", "[Bribe $200]". */
  tag?: string
}

export interface MissionLaunch {
  mission: MissionId
  success: NodeId
  fail: NodeId
  /** Auto-resolve alternative (skip the terminal). */
  auto: { skill: SkillId; dc: number }
}

export interface SceneNode {
  /** npc id, 'player', 'narrator', or a free-form label like "Unknown sender". */
  speaker?: string
  text: Text
  choices?: Choice[]
  /** Auto-continue target (a "Continue" button). */
  next?: NodeId
  /** Applied when the node is entered. */
  effects?: Effect[]
  /** Launch a terminal mission from this node. */
  mission?: MissionLaunch
}

export interface SceneDef {
  id: SceneId
  channel: Channel
  /** Mail subject / chat title / forum thread title / dialog window title. */
  title: string
  /** Sender: npc id or a label (mail "From:", chat contact, forum author). */
  from?: string
  /** Forum board for channel 'forum'. */
  board?: ForumBoard
  start: NodeId
  nodes: Record<NodeId, SceneNode>
  /** Pause the game when delivered (default: true for dialog, false otherwise). */
  pause?: boolean
  /** Unanswered thread expires (becomes unavailable) after N days. */
  expiresDays?: number
  /** Effects when the thread expires unanswered. */
  onExpire?: Effect[]
}

// ────────────────────────────────────────────────────────────────────────────
// Quests
// ────────────────────────────────────────────────────────────────────────────

export interface ObjectiveDef {
  id: string
  text: Text
  /** Completes (latched) when true. Use `{ never: true }` for objectives completed only by effects. */
  when: Cond
  optional?: boolean
  hidden?: boolean
  hint?: Text
  /** Progress bar for the journal. */
  progress?: { of: NumRef; target: number }
}

export interface QuestStageDef {
  /** Journal entry for this stage. */
  text: Text
  hint?: Text
  objectives: ObjectiveDef[]
  onEnter?: Effect[]
  /** When all non-optional objectives are done. */
  onComplete?: Effect[]
  /**
   * Next stage: a stage id, or a list of branches (first whose `if` holds; no `if` = default).
   * Omitted = the quest ends with `outcome` (default 'completed').
   */
  next?: string | { if?: Cond; stage: string }[]
  outcome?: 'completed' | 'failed'
  /** Fail/redirect if the stage is not done in time. */
  timeLimitDays?: number
  onTimeout?: { effects?: Effect[]; stage?: string; fail?: boolean }
}

export interface QuestDef {
  id: QuestId
  title: string
  kind: QuestKind
  act?: number
  faction?: FactionId
  giver?: NpcId
  summary: Text
  start: string
  stages: Record<string, QuestStageDef>
  /** Start automatically when this holds (checked hourly). */
  autoStart?: Cond
  /** Short rewards teaser shown in the journal. */
  rewards?: string
  /** Journal sort weight (higher first). */
  priority?: number
}

// ────────────────────────────────────────────────────────────────────────────
// Triggers (story glue & random events)
// ────────────────────────────────────────────────────────────────────────────

export interface TriggerDef {
  id: TriggerId
  when: Cond
  effects: Effect[]
  /** Default true: fires once per playthrough. */
  once?: boolean
  /** For repeatable triggers: minimum days between firings. */
  cooldownDays?: number
  /** Per-check probability once `when` holds (checked hourly; use small numbers, e.g. 0.01). */
  chance?: number
  /** Check only at this hour of day (e.g. 8 for "morning mail"). */
  atHour?: number
  /** Lower runs first. */
  priority?: number
}

// ────────────────────────────────────────────────────────────────────────────
// World: NPCs, factions, news, forum, endings
// ────────────────────────────────────────────────────────────────────────────

export interface NpcDef {
  id: NpcId
  name: string
  /** Online nickname (messenger/forum). */
  handle?: string
  faction?: FactionId
  role: string
  bio: Text
  /** 1-2 chars or emoji for the avatar tile. */
  avatar: string
  /** CSS color for the avatar tile. */
  color?: string
  /** Can be picked as the target of the 'social' activity once met. */
  social?: boolean
  /** Can be romanced (content still drives romance via scenes). */
  romanceable?: boolean
  /** Starts already met (family, best friend). */
  startsMet?: boolean
  startAffinity?: number
  /**
   * Weekly affinity loss while neglected: no social time with them and no scene from them
   * in the last 7 days (engine-applied; positive affinity only, floor 0). Inner circle ≈ 1, family ≈ 0.5.
   */
  decay?: number
  /** Expected affinity baseline (read by content selectors that compare affinity − baseline). */
  baseline?: number
}

export interface FactionDef {
  id: FactionId
  name: string
  short: string
  desc: Text
  color: string
  icon: string
  /** Hidden in the UI until this holds. */
  revealWhen?: Cond
  /** Reputation threshold labels, e.g. [{ at: 20, label: 'Known' }]. */
  ranks?: { at: number; label: string }[]
}

export interface NewsDef {
  id: NewsId
  headline: string
  body?: Text
  source: string
  category: 'tech' | 'crime' | 'business' | 'local' | 'world' | 'culture'
  /** Ambient news: may be auto-published when this holds. Story news omit it and use `{ news }` effects. */
  ambient?: Cond
  weight?: number
  /** Effects when published (e.g. world var changes). */
  effects?: Effect[]
}

export type ForumBoard = 'general' | 'warez' | 'security' | 'market' | 'offtopic' | 'jobs'

export interface ForumPostDef {
  author: string
  text: Text
}

export interface ForumThreadDef {
  id: ForumThreadId
  board: ForumBoard
  title: string
  posts: ForumPostDef[]
  /** Appears (daily check) when this holds. Omit = only via `{ forum }` effect. */
  appears?: Cond
  pinned?: boolean
}

export interface EndingDef {
  id: EndingId
  title: string
  /** One-line tagline shown on the ending card. */
  tagline: string
  text: Text
  /** Per-NPC / world epilogue slides, shown if their condition holds. */
  epilogues: { if?: Cond; title: string; text: Text }[]
  tone: 'good' | 'bittersweet' | 'bad' | 'weird'
}

// ────────────────────────────────────────────────────────────────────────────
// Career, education, life
// ────────────────────────────────────────────────────────────────────────────

export interface JobDef {
  id: JobId
  title: string
  employer: string
  /** Career track id: 'odd', 'support', 'dev', 'sysadmin', 'network', 'security', 'management', 'startup', 'shady', ... */
  track: string
  desc: Text
  /** Base pay per day at level 0. */
  pay: number
  /** Shift start hour and length. Shifts may wrap past midnight. */
  shiftStart: number
  hours: number
  /** Skill XP per worked hour. */
  skillXp: Partial<Record<SkillId, number>>
  stressPerHour: number
  energyPerHour: number
  /** Requirements to be hired. */
  req?: Cond
  /** Hide from the job board unless this holds (defaults to `req` being "close"). */
  visible?: Cond
  maxLevel?: number
  /** Extra modifiers while employed (e.g. access to company hardware). */
  mods?: Modifier[]
  /** Job-specific perk description. */
  perk?: string
}

export interface ProgramDef {
  id: ProgramId
  name: string
  desc: Text
  tuitionPerSemester: number
  semesters: number
  /** Class hours placed on the schedule. */
  classStart: number
  classHours: number
  /** Skill XP per class hour. */
  skillXp: Partial<Record<SkillId, number>>
  req?: Cond
  /** Entrance exam (skill check, rolled on enrollment). */
  exam?: { skill: SkillId; dc: number }
  /** Class hours needed per semester. */
  hoursPerSemester: number
  onGraduate?: Effect[]
}

export interface CourseDef {
  id: CourseId
  name: string
  desc: Text
  price: number
  /** Study hours needed (study activity with this course as focus). */
  hours: number
  /** Skill XP per study hour while taking it (replaces normal study). */
  skillXp: Partial<Record<SkillId, number>>
  req?: Cond
  onComplete?: Effect[]
}

export type ItemCategory =
  | 'cpu'
  | 'ram'
  | 'storage'
  | 'network'
  | 'monitor'
  | 'software'
  | 'tool'
  | 'book'
  | 'furniture'
  | 'gadget'
  | 'vehicle'
  | 'misc'

/** Hardware slots: one equipped item per slot, the newest purchase replaces the old one. */
export const HW_SLOTS = ['cpu', 'ram', 'storage', 'network', 'monitor'] as const
export type HardwareSlot = (typeof HW_SLOTS)[number]

export type ShopId = 'computer' | 'software' | 'books' | 'life' | 'blackmarket'

export interface ItemDef {
  id: ItemId
  name: string
  category: ItemCategory
  shop: ShopId
  price: number
  desc: Text
  mods: Modifier[]
  /** Visible in shop only when this holds (e.g. DSL after 2003). */
  available?: Cond
  /** Can be bought only when this holds (shown locked otherwise). */
  req?: Cond
  reqText?: string
  upkeepPerDay?: number
  /** Not taken in raids. */
  hidden?: boolean
  /** Not sold in shops (quest reward). */
  unique?: boolean
  /** Sort order within the category (tier). */
  tier?: number
}

export interface HousingDef {
  id: HousingId
  name: string
  desc: Text
  rentPerDay: number
  /** One-time cost to move in. */
  moveCost: number
  /** Sleep energy regen multiplier. */
  comfort: number
  mods: Modifier[]
  req?: Cond
  available?: Cond
  /** Owned (bought) housing has no rent. */
  owned?: boolean
}

export interface LifestyleDef {
  id: LifestyleId
  name: string
  desc: Text
  costPerDay: number
  healthPerDay: number
  moodPerDay: number
  stressPerDay: number
  req?: Cond
}

export interface BackgroundDef {
  id: BackgroundId
  name: string
  desc: Text
  skills: Partial<Record<SkillId, number>>
  money: number
  flags?: string[]
  items?: ItemId[]
}

export interface TraitDef {
  id: TraitId
  name: string
  desc: Text
  mods: Modifier[]
  flags?: string[]
  /** Gained through play (bad outcomes, big moments); never offered at character creation. */
  scar?: boolean
  /** Shown in red in the UI. */
  bad?: boolean
}

// ────────────────────────────────────────────────────────────────────────────
// Random events & complications (the event director)
// ────────────────────────────────────────────────────────────────────────────

export type EventCategory =
  | 'life'
  | 'family'
  | 'work'
  | 'tech'
  | 'city'
  | 'underground'
  | 'romance'
  | 'health'
  | 'money'
  | 'weird'
  | 'era'

export type ComplicationSource = 'hack' | 'gig' | 'social' | 'work' | 'legal' | 'health' | 'any'

/**
 * A random event in the director's pool (or, with `complication`, a consequence sub-story).
 * The director considers one pick per weekly turn; quiet stretches raise the odds.
 */
export interface EventDef {
  id: string
  category: EventCategory
  /** Eligible only while this holds (use act/job/housing/relationship/background/trait conds). */
  when?: Cond
  /** Relative pick weight (default 1). */
  weight?: number
  /** Default false: fires at most once per playthrough. */
  repeatable?: boolean
  /** For repeatables: minimum calendar days between firings (default 120). */
  cooldownDays?: number
  /** Scene delivered when the event fires (dialog/mail/chat/forum). */
  scene?: SceneId
  /** Effects applied when the event fires (in addition to the scene). */
  effects?: Effect[]
  /**
   * Makes this a COMPLICATION: never picked by the director; only by `{ complication }` effects,
   * traced/failed hack ops and failed gigs whose source matches. Tier gates severity.
   */
  complication?: { sources: ComplicationSource[]; minTier?: number; maxTier?: number }
}

// ────────────────────────────────────────────────────────────────────────────
// Contracts (hacking + freelance gigs)
// ────────────────────────────────────────────────────────────────────────────

export type ContractKind = 'hack' | 'freelance'

/** Unique story contract. */
export interface ContractDef {
  id: ContractId
  kind: ContractKind
  title: string
  client: string
  desc: Text
  skills: SkillId[]
  dc: number
  /** Work hours needed at speed 1. */
  hours: number
  pay: number
  heat: number
  cred: number
  rep?: Partial<Record<FactionId, number>>
  expiresDays?: number
  onSuccess?: Effect[]
  onFail?: Effect[]
  /** Optional terminal mission to resolve it by hand. */
  mission?: MissionId
}

/** Procedural contract template for the idle board. `{target}` in title/desc is replaced. */
export interface ContractTemplateDef {
  id: ContractTemplateId
  kind: ContractKind
  /** 1..5; tier N requires cred >= CRED_TIERS[N-1] (hack) or business/programming (freelance). */
  tier: number
  titles: string[]
  descs: string[]
  targets: string[]
  clients: string[]
  skills: SkillId[]
  dc: [number, number]
  hours: [number, number]
  pay: [number, number]
  heat: [number, number]
  cred: [number, number]
  rep?: Partial<Record<FactionId, number>>
  available?: Cond
  weight?: number
  /** Hack templates: how the generated terminal op looks (network archetype, goal, loot). */
  op?: OpSpec
}

export type OpNetwork = 'home' | 'school' | 'shop' | 'corp' | 'isp' | 'bank' | 'gov' | 'lab' | 'media'

/** Recipe for a procedurally generated terminal op (see src/engine/sim/missiongen.ts). */
export interface OpSpec {
  network: OpNetwork
  goal: 'download' | 'delete' | 'upload' | 'read' | 'wipeLogs'
  /** Candidate target file names; one is picked (e.g. 'grades_2002.db'). `{target}` is substituted. */
  loot: string[]
  /** Flavor documents scattered on hosts (memos, logs) — in-world texture, never real technique. */
  docs?: { name: string; content: string }[]
}

/** What the terminal reports back when an op ends. */
export interface OpResult {
  goalsDone: number
  goalsTotal: number
  /** The trace completed before you got out. */
  traced: boolean
  /** Player aborted / disconnected early. */
  aborted: boolean
  /** Hosts you touched whose logs you did not wipe. */
  logsLeft: number
  secondsUsed?: number
}

export interface OpReport {
  outcome: 'clean' | 'messy' | 'partial' | 'traced' | 'aborted' | 'scripted' | 'scripted-fail'
  pay: number
  heat: number
  cred: number
  /** Complication event id spawned by this op, if any. */
  complication?: string
  notes: string[]
}

// ────────────────────────────────────────────────────────────────────────────
// Terminal missions (Uplink-lite)
// ────────────────────────────────────────────────────────────────────────────

export interface MissionFile {
  name: string
  size: number
  /** Shown by `cat`. */
  content?: string
  /** Encrypted: needs `decrypt` (cryptography). */
  encrypted?: boolean
}

export interface MissionPort {
  port: number
  service: string
  /** Crack difficulty 1..10. 0 = open without cracking. */
  difficulty: number
}

export interface MissionHost {
  id: string
  ip: string
  name: string
  banner?: string
  ports: MissionPort[]
  files: MissionFile[]
  /** Host keeps access logs (wipe them to avoid heat). */
  logs: boolean
  /** Hosts reachable/visible via `scan` from this host. */
  links?: string[]
  /** Can be used as a bounce proxy. */
  proxy?: boolean
}

export type MissionGoal =
  | { kind: 'download'; host: string; file: string }
  | { kind: 'delete'; host: string; file: string }
  | { kind: 'upload'; host: string; file: string }
  | { kind: 'read'; host: string; file: string }
  | { kind: 'wipeLogs'; host: string }

export interface MissionDef {
  id: MissionId
  title: string
  briefing: Text
  /** Starting known IPs (host ids). */
  known: string[]
  hosts: MissionHost[]
  goals: MissionGoal[]
  /** Real seconds until trace completes once you connect to a guarded host (before modifiers). */
  traceSeconds: number
  /** Files the player carries for `upload` goals. */
  payloads?: MissionFile[]
  hints?: string[]
  /** Heat if you disconnect without wiping logs. */
  logHeat?: number
}

// ────────────────────────────────────────────────────────────────────────────
// Content pack (what content files export)
// ────────────────────────────────────────────────────────────────────────────

export interface ContentPack {
  scenes?: SceneDef[]
  quests?: QuestDef[]
  triggers?: TriggerDef[]
  npcs?: NpcDef[]
  factions?: FactionDef[]
  news?: NewsDef[]
  forum?: ForumThreadDef[]
  endings?: EndingDef[]
  jobs?: JobDef[]
  programs?: ProgramDef[]
  courses?: CourseDef[]
  items?: ItemDef[]
  housing?: HousingDef[]
  lifestyles?: LifestyleDef[]
  backgrounds?: BackgroundDef[]
  traits?: TraitDef[]
  contracts?: ContractDef[]
  contractTemplates?: ContractTemplateDef[]
  missions?: MissionDef[]
  events?: EventDef[]
}

// ────────────────────────────────────────────────────────────────────────────
// Mutable game state (saved)
// ────────────────────────────────────────────────────────────────────────────

export interface NpcState {
  met: boolean
  affinity: number
  fate: NpcFate
  romance: RomanceState
}

export interface QuestState {
  status: QuestStatus
  stage: string
  startedDay: number
  stageDay: number
  done: string[]
  /** Stage ids passed through, for the journal history. */
  history: string[]
  endedDay?: number
}

export interface RollRecord {
  skill: SkillId
  d20: number
  mod: number
  dc: number
  total: number
  success: boolean
}

export interface ThreadEntry {
  node: NodeId
  /** Index into the node's choices that was picked. */
  choice?: number
  roll?: RollRecord
  /** Terminal mission outcome at this node. */
  mission?: 'won' | 'lost' | 'auto-won' | 'auto-lost'
}

export interface ThreadState {
  uid: number
  scene: SceneId
  channel: Channel
  node: NodeId
  status: 'unread' | 'open' | 'done' | 'expired'
  receivedDay: number
  receivedHour: number
  history: ThreadEntry[]
}

export interface ContractInstance {
  uid: number
  /** Story contract def id, or undefined for procedural. */
  def?: ContractId
  template?: ContractTemplateId
  kind: ContractKind
  title: string
  client: string
  desc: string
  skills: SkillId[]
  dc: number
  hours: number
  pay: number
  heat: number
  cred: number
  rep: Partial<Record<FactionId, number>>
  tier: number
  offeredDay: number
  expiresDay: number
  progress: number
  /** Freelance gigs only (hacks are played in the terminal). */
  approach: 'careful' | 'normal' | 'fast'
  status: 'offered' | 'active' | 'ready' | 'done' | 'failed' | 'expired'
  /** Story contracts: a hand-authored MissionDef id. */
  mission?: MissionId
  /** Procedural hacks: the generated op network (saved with the contract). */
  missionDef?: MissionDef
  /** Hacks: recon work-hours done (scheduled 'hack' hours) and needed for full recon. */
  prep: number
  prepNeeded: number
  /** Hacks: must be run by this day once accepted, or the client walks. */
  deadlineDay?: number
  /** Filled in when the contract resolves (debrief). */
  report?: OpReport
}

export interface JobProgress {
  level: number
  xp: number
  /** Total days worked. */
  days: number
}

export interface LogEntry {
  day: number
  hour: number
  text: string
  kind: LogKind
}

export interface BuffState extends BuffDef {
  untilDay: number
}

export interface Settings {
  autoPauseDialogs: boolean
  /** Show d20 math on checks. */
  showRollMath: boolean
  crt: boolean
  sound: boolean
}

export interface GameState {
  version: number
  seed: number
  rng: number
  createdAt: number
  savedAt: number
  player: {
    name: string
    handle: string
    background: BackgroundId
    traits: TraitId[]
  }
  time: {
    /** Day index; day 0 = 2001-09-01. */
    day: number
    /** Hour 0..23 of the hour currently being simulated. */
    hour: number
    /** Fraction 0..1 of the current hour (for the clock display). */
    frac: number
    /** 0 = paused, else multiplier. */
    speed: number
    /** Speed to restore after an auto-pause. */
    lastSpeed: number
    totalHours: number
  }
  stats: Record<StatId, number>
  skills: Record<SkillId, { level: number; xp: number }>
  schedule: ActivityId[]
  focus: {
    study: { kind: 'skill'; skill: SkillId } | { kind: 'course'; course: CourseId }
    social: NpcId | null
  }
  job: JobId | null
  jobs: Record<JobId, JobProgress>
  /** Hours worked today (for salary). */
  workedToday: number
  edu: {
    enrolled: { program: ProgramId; semester: number; hours: number } | null
    degrees: ProgramId[]
    courses: CourseId[]
    /** Progress on the course currently being studied. */
    courseProgress: Record<CourseId, number>
    /** Paid (bought) courses not yet completed. */
    coursesOwned: CourseId[]
  }
  items: ItemId[]
  equipped: Partial<Record<HardwareSlot, ItemId>>
  housing: HousingId
  lifestyle: LifestyleId
  buffs: BuffState[]
  flags: Record<string, FlagValue>
  vars: Record<string, number>
  factions: Record<FactionId, number>
  npcs: Record<NpcId, NpcState>
  quests: Record<QuestId, QuestState>
  trackedQuest: QuestId | null
  threads: ThreadState[]
  nextUid: number
  /** Scenes scheduled for delivery at an absolute game hour. */
  pendingScenes: { scene: SceneId; atHour: number }[]
  seenScenes: Record<SceneId, true>
  triggers: Record<TriggerId, { fired: number; lastDay: number }>
  contracts: {
    board: ContractInstance[]
    active: ContractInstance[]
    history: Record<string, { done: number; failed: number }>
    lastRefreshDay: number
  }
  missions: Record<MissionId, 'won' | 'lost'>
  news: { id: NewsId; day: number; read: boolean }[]
  forum: { id: ForumThreadId; day: number; read: boolean }[]
  jail: { untilDay: number } | null
  hospital: { untilDay: number } | null
  ending: EndingId | null
  endingsSeen: EndingId[]
  log: LogEntry[]
  settings: Settings
  /** Aggregates for the stats screen. */
  /** Desktop programs revealed so far (gradual discovery; see src/engine/unlocks.ts). */
  unlocked: string[]
  /** Recurring costs from fines, lawsuits, loans, medical bills (see `obligation` effect). */
  obligations: { id: string; label: string; perDay: number; untilDay: number | null }[]
  /** Event director bookkeeping. */
  events: {
    fired: Record<string, { count: number; lastDay: number }>
    /** Consecutive weekly turns with no event/story scene. */
    quietTurns: number
    /** Last few event categories (for variety). */
    recent: EventCategory[]
    /** Day a story scene was last delivered (quiet-turn detection). */
    lastSceneDay: number
  }
  /** Most recent contract debrief (the UI shows it once). */
  lastReport: { uid: number; title: string; kind: ContractKind; report: OpReport } | null
  totals: {
    earned: number
    spent: number
    hacksDone: number
    hacksFailed: number
    gigsDone: number
    raids: number
    daysJailed: number
    checksPassed: number
    checksFailed: number
  }
}
