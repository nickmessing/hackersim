/**
 * App registry: every desktop program. Each app is a Vue SFC in src/ui/apps/ with no required
 * props (it reads the game with `useGame()`); optional `props` can be passed via `openApp`.
 */
import { defineAsyncComponent, type Component } from 'vue'

export const APP_IDS = [
  'journal',
  'jobs',
  'schedule',
  'skills',
  'life',
  'contacts',
  'shop',
  'mail',
  'pager',
  'forum',
  'ops',
  'news',
  'terminal',
  'system',
] as const
export type AppId = (typeof APP_IDS)[number]

export interface AppMeta {
  id: AppId
  title: string
  /** Emoji-free short label for the pixel icon + a glyph. */
  glyph: string
  /** Desktop icon label. */
  label: string
  width: number
  height: number
  component: Component
  /** Shown on the desktop (others only in the Start menu). */
  desktop: boolean
}

export const APPS: Record<AppId, AppMeta> = {
  journal: { id: 'journal', title: 'Quest Journal', label: 'Journal', glyph: '📓', width: 720, height: 520, desktop: true, component: defineAsyncComponent(() => import('./apps/JournalApp.vue')) },
  jobs: { id: 'jobs', title: 'Career Center', label: 'Jobs', glyph: '💼', width: 760, height: 540, desktop: true, component: defineAsyncComponent(() => import('./apps/JobsApp.vue')) },
  schedule: { id: 'schedule', title: 'Daily Planner', label: 'Planner', glyph: '🗓', width: 760, height: 470, desktop: true, component: defineAsyncComponent(() => import('./apps/ScheduleApp.vue')) },
  skills: { id: 'skills', title: 'Skills & Study', label: 'Skills', glyph: '🎓', width: 760, height: 560, desktop: true, component: defineAsyncComponent(() => import('./apps/SkillsApp.vue')) },
  life: { id: 'life', title: 'Life', label: 'Life', glyph: '🏠', width: 720, height: 540, desktop: true, component: defineAsyncComponent(() => import('./apps/LifeApp.vue')) },
  contacts: { id: 'contacts', title: 'Contacts', label: 'People', glyph: '👥', width: 740, height: 540, desktop: true, component: defineAsyncComponent(() => import('./apps/ContactsApp.vue')) },
  shop: { id: 'shop', title: 'e-Shop', label: 'Shop', glyph: '🛒', width: 780, height: 560, desktop: true, component: defineAsyncComponent(() => import('./apps/ShopApp.vue')) },
  mail: { id: 'mail', title: 'Mail', label: 'Mail', glyph: '✉', width: 780, height: 540, desktop: true, component: defineAsyncComponent(() => import('./apps/MailApp.vue')) },
  pager: { id: 'pager', title: 'BuddyPager', label: 'BuddyPager', glyph: '💬', width: 640, height: 500, desktop: true, component: defineAsyncComponent(() => import('./apps/PagerApp.vue')) },
  forum: { id: 'forum', title: 'The Loft BBS', label: 'Forum', glyph: '🗨', width: 800, height: 560, desktop: true, component: defineAsyncComponent(() => import('./apps/ForumApp.vue')) },
  ops: { id: 'ops', title: 'Operations', label: 'Ops', glyph: '⚡', width: 760, height: 540, desktop: true, component: defineAsyncComponent(() => import('./apps/OpsApp.vue')) },
  news: { id: 'news', title: 'Lumen Herald Online', label: 'News', glyph: '📰', width: 720, height: 540, desktop: true, component: defineAsyncComponent(() => import('./apps/NewsApp.vue')) },
  terminal: { id: 'terminal', title: 'Terminal', label: 'Terminal', glyph: '▮', width: 760, height: 480, desktop: true, component: defineAsyncComponent(() => import('./apps/TerminalApp.vue')) },
  system: { id: 'system', title: 'Control Panel', label: 'System', glyph: '⚙', width: 680, height: 520, desktop: true, component: defineAsyncComponent(() => import('./apps/SystemApp.vue')) },
}
