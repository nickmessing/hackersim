/**
 * The Loft BBS flavor: board metadata, user ranks, post counts and signature lines.
 * Deterministic per author so a handle always wears the same sig.
 */
import { C, hackTier, type ForumBoard, type GameState } from '@/engine'
import { hashStr, pickBy, type Speaker } from './storyKit'

export interface BoardMeta {
  id: ForumBoard
  name: string
  desc: string
  icon: string
}

export const BOARDS: readonly BoardMeta[] = [
  { id: 'general', name: 'General Discussion', desc: 'Introduce yourself, argue about text editors, post your rig.', icon: '💬' },
  { id: 'security', name: 'Security', desc: 'Advisories, patch notes, and people pretending they found a bug.', icon: '🛡' },
  { id: 'warez', name: 'Warez · Members Only', desc: 'The Loft\'s back room. Releases, leads, and the stuff that stays in here.', icon: '🏴' },
  { id: 'market', name: 'Marketplace', desc: 'Buy, sell, trade. No refunds, no questions, no cops.', icon: '💾' },
  { id: 'jobs', name: 'Jobs & Gigs', desc: 'Paid work. Legit, legit-ish, and "don\'t ask".', icon: '💼' },
  { id: 'offtopic', name: 'Off-Topic', desc: 'Anything goes. Mostly pizza, sometimes feelings.', icon: '🍕' },
]

export function boardMeta(id: ForumBoard): BoardMeta {
  return BOARDS.find(b => b.id === id) ?? { id, name: id, desc: '', icon: '📁' }
}

/** The underground scene's faction (story bible constant) — gates the members-only board. */
export const LOFT_FACTION = 'fac.loft'
export const BACK_ROOM_REP = 20

const RANKS = ['Member', 'Regular', 'Old-timer', 'Lurker', 'Veteran', 'Night Shift', 'Modem Whisperer', 'Senior Member'] as const
const PLAYER_RANKS = ['Newbie', 'Regular', 'Known Handle', 'Respected', 'Legend'] as const

const SIGS = [
  'Powered by instant ramen and spite.',
  'My other computer is a pocket calculator.',
  '~~ the modem screams so I don\'t have to ~~',
  'If it compiles, ship it. If it ships, run.',
  'Port Lumen represent. Cannery Row til I die.',
  'ASCII a stupid question, get a stupid ANSI.',
  'There is no cloud. It\'s just someone else\'s basement.',
  'Real programmers count from zero. Then lose count.',
  '-=[ 51 floppies and not one of them labeled ]=-',
  'Sent from a beige box that smells faintly of toast.',
  'I\'m not anti-social, I\'m on a 33.6k line.',
  'Keep the commons. Wipe your prints.',
  '"Works on my machine." — last words',
  'Reply hazy, try again after the reboot.',
] as const

/** Rank shown under a poster's handle. */
export function rankOf(state: GameState, sp: Speaker): string {
  if (sp.kind === 'player') return PLAYER_RANKS[hackTier(state) - 1] ?? 'Member'
  if (/sysop|admin|moderator/i.test(sp.role)) return 'Sysop'
  if (sp.kind === 'npc') {
    const fac = C.npcs.get(sp.id)?.faction
    if (fac === LOFT_FACTION && hashStr(sp.id) % 2 === 0) return 'Loft Regular'
  }
  return pickBy(RANKS, sp.id) ?? 'Member'
}

/** Posts the player has made across story forum threads (their replies). */
export function playerPostCount(state: GameState): number {
  let n = 0
  for (const t of state.threads) {
    if (t.channel !== 'forum') continue
    for (const e of t.history) if (e.choice !== undefined) n++
  }
  return n
}

export function postCountOf(state: GameState, sp: Speaker): number {
  if (sp.kind === 'player') return playerPostCount(state)
  // Old accounts post a lot; grows slowly with the calendar.
  return 20 + (hashStr(sp.id) % 1400) + Math.floor(state.time.day / (4 + (hashStr(sp.id) % 9)))
}

export function sigOf(state: GameState, sp: Speaker): string {
  if (sp.kind === 'player') {
    const net = state.equipped.network ? C.items.get(state.equipped.network)?.name : undefined
    return net ? `${sp.handle} :: online via ${net} and proud of it` : `${sp.handle} :: online against all odds`
  }
  return pickBy(SIGS, sp.id) ?? ''
}
