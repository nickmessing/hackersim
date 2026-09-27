/**
 * PKG-16 — News, Forum & World-Var Wiring: shared helpers.
 *
 * Every file under src/content is auto-discovered, so this helper module also exports an empty pack.
 *
 * Ownership notes (bible §11.4 / §13):
 *  - The story choice PUBLISHES a headline; the NewsDef.effects in this package OWN every world
 *    delta attached to it (single-count rule). Other packages never duplicate these deltas.
 *  - `publishNews` is idempotent (a headline is printed once), so this package also carries
 *    "press desk" backup triggers that publish a story headline from the world state it reports on.
 *    A story beat and its backup can both fire; the paper still prints it once.
 */
import { dayOf } from '@/engine/calendar'
import { defineContent } from '@/engine/registry'
import type { Cond, FlagValue, ForumBoard, ForumPostDef, ForumThreadDef, Text } from '@/engine/types'

// ── Calendar ────────────────────────────────────────────────────────────────

/** Game day of a calendar date (1-based month, for readability). */
export const d = (year: number, month: number, day = 1): number => dayOf(year, month - 1, day)

/** On or after this date. */
export const from = (year: number, month: number, day = 1): Cond => ({ day: true, gte: d(year, month, day) })

/** On or before this date. */
export const until = (year: number, month: number, day = 1): Cond => ({ day: true, lte: d(year, month, day) })

/** Between two dates (inclusive). */
export const during = (y1: number, m1: number, y2: number, m2: number): Cond => ({
  day: true,
  gte: d(y1, m1),
  lte: d(y2, m2),
})

// ── Condition shorthands ────────────────────────────────────────────────────

export const all = (...c: Cond[]): Cond => ({ all: c })
export const any = (...c: Cond[]): Cond => ({ any: c })
export const not = (c: Cond): Cond => ({ not: c })
export const has = (flag: string): Cond => ({ flag })
export const is = (flag: string, eq: FlagValue): Cond => ({ flag, eq })
export const act = (n: number): Cond => ({ var: 'act', eq: n })
export const actGte = (n: number): Cond => ({ var: 'act', gte: n })
export const printed = (news: string): Cond => ({ news })

/** Fates after which someone is no longer around to post, visit or be visited. */
export const GONE_FATES = ['dead', 'arrested', 'arrested_young', 'jailed', 'missing', 'gone', 'exile', 'martyred', 'passed', 'casualty']

// ── Forum ───────────────────────────────────────────────────────────────────

/** One forum post. Authors are NPC ids (rendered with their handle) or free-form handles. */
export const post = (author: string, text: Text): ForumPostDef => ({ author, text })

/** A flavor thread that appears on its own when `appears` holds (checked daily). */
export const thread = (
  id: string,
  board: ForumBoard,
  title: string,
  appears: Cond,
  posts: ForumPostDef[],
  pinned?: boolean,
): ForumThreadDef => ({ id, board, title, appears, posts, ...(pinned ? { pinned } : {}) })

export default defineContent({})
