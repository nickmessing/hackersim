/**
 * Shared helpers for the story channels (dialog, mail, BuddyPager, BBS): speaker resolution,
 * fake period email addresses, check / roll labels. Pure functions over engine data — no game
 * rules are re-implemented here.
 */
import {
  C,
  balance,
  chanceOf,
  checkMod,
  describeCond,
  formatClock,
  formatShortDate,
  pct,
  type CheckPreview,
  type ChoiceView,
  type GameState,
  type MissionLaunch,
  type RollRecord,
  type SceneDef,
  type SkillId,
  type ThreadEntry,
  type ThreadState,
} from '@/engine'

export type ThreadVariant = 'mail' | 'chat' | 'forum' | 'dialog'

/** The fictional local ISP (story bible) — the player's mail lives here. */
export const PLAYER_MAIL_DOMAIN = 'northlink.net'

/** Invented period free-mail / ISP domains for NPC addresses. */
const NPC_MAIL_DOMAINS = [
  'northlink.net',
  'lumenmail.com',
  'dialtonic.net',
  'beigebox.org',
  'mailwagon.com',
  'harborline.net',
  'portlumen.net',
] as const

/** Stable 32-bit FNV-1a hash (for deterministic flavor: colors, domains, sigs, presence). */
export function hashStr(s: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return h >>> 0
}

export function pickBy<T>(list: readonly T[], seed: string): T | undefined {
  if (list.length === 0) return undefined
  return list[hashStr(seed) % list.length]
}

// ────────────────────────────────────────────────────────────────────────────
// Speakers
// ────────────────────────────────────────────────────────────────────────────

export type SpeakerKind = 'npc' | 'player' | 'narrator' | 'label'

export interface Speaker {
  kind: SpeakerKind
  /** npc id, 'player', 'narrator' or the free-form label. */
  id: string
  /** Real name (or the label). */
  name: string
  /** Online nickname (falls back to the name). */
  handle: string
  /** Avatar glyph + tile color. */
  avatar: string
  color: string
  role: string
}

function initials(label: string): string {
  const words = label
    .replace(/[^\p{L}\p{N} ]/gu, ' ')
    .split(/\s+/)
    .filter(Boolean)
  const a = words[0]?.[0] ?? '?'
  const b = words[1]?.[0] ?? words[0]?.[1] ?? ''
  return (a + b).toUpperCase()
}

/** Deterministic muted tile color for label senders. */
export function labelColor(label: string): string {
  return `hsl(${hashStr(label) % 360} 34% 40%)`
}

export function playerSpeaker(state: GameState): Speaker {
  return {
    kind: 'player',
    id: 'player',
    name: state.player.name,
    handle: state.player.handle,
    avatar: initials(state.player.handle || state.player.name),
    color: 'var(--sel-bg)',
    role: 'You',
  }
}

/**
 * Resolve a node speaker. `undefined` means "the thread's sender" (scene.from), falling back to
 * narration when the scene has no sender.
 */
export function speakerOf(state: GameState, raw: string | undefined, scene: SceneDef | undefined): Speaker {
  const id = raw ?? scene?.from ?? 'narrator'
  if (id === 'player') return playerSpeaker(state)
  if (id === 'narrator') {
    return { kind: 'narrator', id, name: '', handle: '', avatar: '', color: 'var(--muted)', role: '' }
  }
  const npc = C.npcs.get(id)
  if (npc) {
    return {
      kind: 'npc',
      id,
      name: npc.name,
      handle: npc.handle ?? npc.name,
      avatar: npc.avatar,
      color: npc.color ?? labelColor(id),
      role: npc.role,
    }
  }
  return { kind: 'label', id, name: id, handle: id, avatar: initials(id), color: labelColor(id), role: '' }
}

/** Sender of a thread (scene.from) as a speaker; unknown senders become a label. */
export function senderOf(state: GameState, scene: SceneDef | undefined): Speaker {
  if (!scene?.from) return speakerOf(state, 'Unknown sender', undefined)
  return speakerOf(state, scene.from, scene)
}

// ────────────────────────────────────────────────────────────────────────────
// Mail addresses
// ────────────────────────────────────────────────────────────────────────────

function mailLocal(s: string): string {
  return s
    .toLowerCase()
    .replace(/\s+/g, '.')
    .replace(/[^a-z0-9._-]/g, '')
    .replace(/\.{2,}/g, '.')
    .replace(/^[._-]+|[._-]+$/g, '')
}

export interface MailIdentity {
  name: string
  address: string | null
}

/** "Jax Ferreira" + "jax@dialtonic.net" for an NPC, the label as-is otherwise. */
export function mailIdentity(sp: Speaker): MailIdentity {
  switch (sp.kind) {
    case 'player': {
      const local = mailLocal(sp.handle) || mailLocal(sp.name) || 'user'
      return { name: sp.name, address: `${local}@${PLAYER_MAIL_DOMAIN}` }
    }
    case 'npc': {
      const local = mailLocal(sp.handle) || mailLocal(sp.name) || sp.id.replace(/[^a-z0-9]/g, '')
      const domain = pickBy(NPC_MAIL_DOMAINS, sp.id) ?? PLAYER_MAIL_DOMAIN
      return { name: sp.name, address: `${local}@${domain}` }
    }
    case 'label': {
      const at = sp.name.indexOf('@')
      if (at > 0 && !sp.name.includes(' ')) return { name: sp.name.slice(0, at), address: sp.name }
      return { name: sp.name, address: null }
    }
    case 'narrator':
      return { name: 'Unknown sender', address: null }
  }
}

export function formatIdentity(id: MailIdentity): string {
  return id.address ? `${id.name} <${id.address}>` : id.name
}

// ────────────────────────────────────────────────────────────────────────────
// Threads
// ────────────────────────────────────────────────────────────────────────────

export function isLive(t: ThreadState): boolean {
  return t.status === 'unread' || t.status === 'open'
}

/** Absolute receive time for sorting. */
export function receivedAt(t: ThreadState): number {
  return t.receivedDay * 24 + t.receivedHour
}

/** Newest first. */
export function byNewest(a: ThreadState, b: ThreadState): number {
  return receivedAt(b) - receivedAt(a) || b.uid - a.uid
}

export function threadStamp(t: ThreadState): string {
  return `${formatShortDate(t.receivedDay)} ${formatClock(t.receivedHour)}`
}

/** Days left to answer an expiring thread, or null. */
export function expiresIn(state: GameState, t: ThreadState, scene: SceneDef | undefined): number | null {
  if (!scene?.expiresDays || !isLive(t)) return null
  return Math.max(0, scene.expiresDays - (state.time.day - t.receivedDay))
}

export function expiryLabel(days: number): string {
  if (days <= 0) return 'Reply today or the moment passes'
  if (days === 1) return 'Reply within 1 day'
  return `Reply within ${days} days`
}

// ────────────────────────────────────────────────────────────────────────────
// Checks & rolls
// ────────────────────────────────────────────────────────────────────────────

export function skillLabel(skill: SkillId): string {
  return balance.SKILL_LABELS[skill]
}

export function signedMod(n: number): string {
  return n >= 0 ? `+${n}` : `${n}`
}

/** `[Intrusion 14 · DC 15 · 55%]` */
export function checkLabel(p: { skill: SkillId; level: number; dc: number; chance: number }): string {
  return `[${skillLabel(p.skill)} ${p.level} · DC ${p.dc} · ${pct(p.chance)}]`
}

export type ChanceTone = 'good' | 'warn' | 'bad'

export function chanceTone(chance: number): ChanceTone {
  if (chance >= 0.7) return 'good'
  if (chance >= 0.4) return 'warn'
  return 'bad'
}

function needLine(mod: number, dc: number): string {
  const need = dc - mod
  if (need <= 2) return 'Only a natural 1 fails.'
  if (need >= 20) return 'Needs a natural 20.'
  return `You need ${need}+ on the die.`
}

/** Multi-line tooltip that explains where a check's odds come from. */
export function checkTooltip(p: CheckPreview): string {
  const extra = p.bonuses.reduce((s, b) => s + b.add, 0)
  const base = p.mod - extra
  const fromSkill = balance.skillMod(p.level)
  const gear = base - fromSkill
  const lines = [`Skill check: d20 ${signedMod(p.mod)} vs DC ${p.dc}`, `${skillLabel(p.skill)} ${p.level} → ${signedMod(fromSkill)}`]
  if (gear !== 0) lines.push(`Gear, traits & buffs → ${signedMod(gear)}`)
  for (const b of p.bonuses) lines.push(`${b.label} → ${signedMod(b.add)}`)
  lines.push(needLine(p.mod, p.dc), `Chance: ${pct(p.chance)} · a natural 20 always succeeds, a natural 1 always fails.`)
  return lines.join('\n')
}

export interface MissionCheck {
  skill: SkillId
  level: number
  mod: number
  dc: number
  chance: number
}

/** Odds of the auto-resolve alternative of a terminal mission. */
export function missionCheck(state: GameState, m: MissionLaunch): MissionCheck {
  const mod = checkMod(state, m.auto.skill)
  return { skill: m.auto.skill, level: state.skills[m.auto.skill].level, mod, dc: m.auto.dc, chance: chanceOf(mod, m.auto.dc) }
}

/** What ThreadActions needs to render a terminal-mission launcher. */
export interface MissionView {
  title: string
  briefing: string
  check: MissionCheck
}

export function missionTooltip(c: MissionCheck): string {
  return [
    `Auto-resolve skips the terminal: d20 ${signedMod(c.mod)} vs DC ${c.dc} (${skillLabel(c.skill)} ${c.level}).`,
    needLine(c.mod, c.dc),
    `Chance: ${pct(c.chance)}. Running it by hand in the Terminal lets skill and nerve beat the dice.`,
  ].join('\n')
}

/** `🎲 Intrusion · d20 14 +5 = 19 vs DC 15 — SUCCESS` */
export function rollLine(roll: RollRecord, showMath = true): string {
  const verdict = roll.success ? 'SUCCESS' : 'FAILURE'
  const nat = roll.d20 === 20 ? ' (natural 20!)' : roll.d20 === 1 ? ' (natural 1)' : ''
  if (!showMath) return `🎲 ${skillLabel(roll.skill)} check — ${verdict}${nat}`
  return `🎲 ${skillLabel(roll.skill)} · d20 ${roll.d20} ${signedMod(roll.mod)} = ${roll.total} vs DC ${roll.dc} — ${verdict}${nat}`
}

export function missionLine(outcome: NonNullable<ThreadEntry['mission']>): string {
  switch (outcome) {
    case 'won':
      return '⌨ Terminal run — objective complete, clean exit.'
    case 'lost':
      return '⌨ Terminal run — it went sideways.'
    case 'auto-won':
      return '⌨ Auto-resolved — the job got done.'
    case 'auto-lost':
      return '⌨ Auto-resolved — the job fell apart.'
  }
}

/** Requirement text for a locked choice: authored reqText, else the described condition. */
export function lockText(v: ChoiceView): string {
  return v.choice.reqText ?? (describeCond(v.choice.req) || v.reqText || 'Requirements not met')
}

// ────────────────────────────────────────────────────────────────────────────
// Display model for ThreadView
// ────────────────────────────────────────────────────────────────────────────

export interface DisplayEntry {
  key: string
  /** Index into thread.history. */
  index: number
  speaker: Speaker
  paragraphs: string[]
  /** The reply the player picked at this node. */
  reply: { text: string; tag: string | undefined } | undefined
  roll: RollRecord | undefined
  /** Roll is being animated right now (hide its static line). */
  rollPending: boolean
  mission: ThreadEntry['mission']
  /** Awaiting the player's input. */
  current: boolean
  /** Last visible entry. */
  latest: boolean
}
