/** "Needs attention" counts per program, derived from the game state (badges + taskbar flashing). */
import { computed, type ComputedRef } from 'vue'
import { daysLeft, type GameState } from '@/engine'
import type { AppId } from '@/ui/apps'

export type UnreadMap = Partial<Record<AppId, number>>

export function useUnread(state: GameState): ComputedRef<UnreadMap> {
  return computed(() => {
    let mail = 0
    let pager = 0
    let forum = 0
    for (const t of state.threads) {
      if (t.status !== 'unread') continue
      if (t.channel === 'mail') mail++
      else if (t.channel === 'chat') pager++
      else if (t.channel === 'forum') forum++
    }
    for (const f of state.forum) if (!f.read) forum++
    let news = 0
    for (const n of state.news) if (!n.read) news++
    // Journal: quests that started/advanced today, or are on the clock.
    let journal = 0
    for (const [id, q] of Object.entries(state.quests)) {
      if (q.status !== 'active') continue
      if (q.stageDay === state.time.day || daysLeft(state, id) !== undefined) journal++
    }
    let ops = 0
    for (const c of state.contracts.active) if (c.status === 'ready') ops++
    return { mail, pager, forum, news, journal, ops }
  })
}
