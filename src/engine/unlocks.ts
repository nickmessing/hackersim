/**
 * Gradual discovery: desktop programs start hidden and appear the first time they matter.
 *
 * Automatic reveals (engine hooks): mail/chat/forum scenes reveal Mail/BuddyPager/Forum, the first
 * headline reveals News, the first skill level-up reveals Skills, meeting a few people reveals
 * People, starting a main-story quest reveals the Journal. Story content reveals the rest with the
 * `{ unlock }` effect (Planner, Jobs, Ops, Shop, Life, Terminal). Control Panel is always there.
 */
import { log, notify } from './text'
import type { GameState } from './types'

export const FEATURES = [
  'mail',
  'pager',
  'forum',
  'news',
  'journal',
  'schedule',
  'skills',
  'jobs',
  'life',
  'contacts',
  'shop',
  'ops',
  'terminal',
  'system',
] as const
export type Feature = (typeof FEATURES)[number]

/** Always available (saving and settings must never be locked). */
export const ALWAYS_UNLOCKED: readonly Feature[] = ['system']

const LABELS: Record<Feature, string> = {
  mail: 'Mail',
  pager: 'BuddyPager',
  forum: 'The Loft BBS',
  news: 'Lumen Herald Online',
  journal: 'Quest Journal',
  schedule: 'Daily Planner',
  skills: 'Skills & Study',
  jobs: 'Career Center',
  life: 'Life',
  contacts: 'Contacts',
  shop: 'e-Shop',
  ops: 'Operations',
  terminal: 'Terminal',
  system: 'Control Panel',
}

export function isFeature(id: string): id is Feature {
  return (FEATURES as readonly string[]).includes(id)
}

export function isUnlocked(state: GameState, id: string): boolean {
  return (ALWAYS_UNLOCKED as readonly string[]).includes(id) || state.unlocked.includes(id)
}

/** Reveal programs. Returns the ids that were newly revealed. */
export function unlock(state: GameState, ids: string | readonly string[], quiet = false): string[] {
  const list = typeof ids === 'string' ? [ids] : ids
  const fresh: string[] = []
  for (const id of list) {
    if (!isFeature(id)) {
      console.warn(`[unlocks] unknown feature "${id}"`)
      continue
    }
    if (isUnlocked(state, id)) continue
    state.unlocked.push(id)
    state.flags[`ui.new.${id}`] = true
    fresh.push(id)
    if (quiet) log(state, `New on your desktop: ${LABELS[id]}`, 'info')
    else notify(state, `New on your desktop: ${LABELS[id]}`, 'info')
  }
  return fresh
}

export function unlockAll(state: GameState): void {
  for (const f of FEATURES) if (!state.unlocked.includes(f)) state.unlocked.push(f)
}

export function featureLabel(id: string): string {
  return isFeature(id) ? LABELS[id] : id
}

/** Meeting this many people reveals Contacts. */
export const CONTACTS_UNLOCK_MET = 3
