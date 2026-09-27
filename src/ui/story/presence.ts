/**
 * BuddyPager presence: a flavor layer that makes NPCs "sign on" and "go away" with the clock.
 * Deterministic per NPC / day / hour so it never flickers, and fate-aware: the dead and the
 * missing stay offline forever.
 */
import type { GameState } from '@/engine'
import { hashStr, pickBy } from './storyKit'

export type PresenceStatus = 'online' | 'away' | 'offline'

export interface Presence {
  status: PresenceStatus
  /** Away message / status line. */
  note: string
  /** Will never come back online (fate). */
  forever: boolean
}

const FATE_OFFLINE: Record<string, string> = {
  dead: 'Account dormant. Last sign-on was a long time ago.',
  missing: 'Not seen online in weeks. Messages go unanswered.',
  gone: 'Signed off for good.',
  arrested: 'Offline — no connection where they are now.',
  jailed: 'Offline — no connection where they are now.',
}

const AWAY_NOTES = {
  night: ['zzz', 'sleeping. do not page unless the server is on fire', 'gone to bed. for real this time'],
  morning: ['coffee first. words later', 'getting ready, brb', 'fighting the shower for hot water'],
  day: ['at work, page me l8r', 'in class. yes, actually', 'out running errands', 'on a job. back soon'],
  evening: ['brb, pizza', 'dinner. the real kind', 'afk — mom needs the phone line', 'watching a movie, ping me'],
  late: ['brb', 'compiling...', 'afk, snack run', 'burning a CD, do not disturb'],
} as const

type Band = keyof typeof AWAY_NOTES

/** Per-hour-band probability of being online (else away / offline). */
const BANDS: { from: number; to: number; band: Band; online: number; away: number }[] = [
  { from: 0, to: 6, band: 'night', online: 0.08, away: 0.22 },
  { from: 7, to: 8, band: 'morning', online: 0.3, away: 0.4 },
  { from: 9, to: 16, band: 'day', online: 0.42, away: 0.46 },
  { from: 17, to: 18, band: 'evening', online: 0.55, away: 0.35 },
  { from: 19, to: 23, band: 'late', online: 0.78, away: 0.17 },
]

/**
 * Presence of an NPC. `waiting` = they have an unanswered message for you (then they're
 * definitely online, watching the little window).
 */
export function presenceOf(state: GameState, npcId: string, waiting: boolean): Presence {
  const fate = state.npcs[npcId]?.fate ?? 'normal'
  const fateNote = FATE_OFFLINE[fate]
  if (fateNote) return { status: 'offline', note: fateNote, forever: fate === 'dead' || fate === 'missing' || fate === 'gone' }
  if (waiting) return { status: 'online', note: 'Online — waiting for your reply', forever: false }

  // Night owls live four hours later than everyone else.
  const owl = hashStr(npcId) % 3 === 0
  const local = (state.time.hour - (owl ? 4 : 0) + 24) % 24
  const band = BANDS.find(b => local >= b.from && local <= b.to) ?? BANDS[0]
  if (!band) return { status: 'offline', note: 'Offline', forever: false }
  const r = (hashStr(`${npcId}:${state.time.day}:${state.time.hour}`) % 1000) / 1000
  if (r < band.online) return { status: 'online', note: owl && band.band === 'late' ? 'Online — night owl hours' : 'Online', forever: false }
  if (r < band.online + band.away) {
    const note = pickBy(AWAY_NOTES[band.band], `${npcId}:${state.time.day}:${band.band}`) ?? 'away'
    return { status: 'away', note: `Away — "${note}"`, forever: false }
  }
  return { status: 'offline', note: 'Offline', forever: false }
}

export const PRESENCE_LABEL: Record<PresenceStatus, string> = {
  online: 'Online',
  away: 'Away',
  offline: 'Offline',
}
