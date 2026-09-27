<script setup lang="ts">
import { computed } from 'vue'
import { C, formatShortDate } from '@/engine'
import { isUnlocked } from '@/engine'
import { APP_IDS, APPS, type AppId } from '@/ui/apps'
import { quitToTitle, saveNow, useGame } from '@/ui/game'
import { exitApp, isDesktopApp, toggleFullscreen } from '@/ui/platform'
import { closeAll, openApp, persistLayout } from '@/ui/wm'
import AppIcon from './AppIcon.vue'
import { alertBox, confirmBox } from './msgbox'
import { nav, shellUi } from './nav'
import { clearToasts, pushToast } from './toasts'
import type { UnreadMap } from './unread'

defineProps<{ unread: UnreadMap }>()

const state = useGame()

const BLURBS: Record<AppId, string> = {
  journal: 'Quests, objectives and hints',
  jobs: 'Find work, climb the ladder',
  schedule: 'Paint your 24 hours',
  skills: 'Study, courses and training',
  life: 'Home, money, health',
  contacts: 'Friends, family, factions',
  shop: 'Hardware, software, books',
  mail: 'Your inbox',
  pager: 'Instant messages',
  forum: 'Message boards',
  ops: 'Contracts and heat',
  news: 'Local headlines',
  terminal: 'Command line',
  system: 'Saves, settings, statistics',
}

const programs = computed(() => APP_IDS.filter(id => id !== 'system' && isUnlocked(state, id)).map(id => APPS[id]))

const initials = computed(() => {
  const h = state.player.handle.replace(/[^A-Za-z0-9]/g, '')
  return (h.slice(0, 2) || '?').toUpperCase()
})
const home = computed(() => C.housing.get(state.housing)?.name ?? 'Port Lumen')

function close(): void {
  shellUi.startOpen = false
}

function open(id: AppId, props: Record<string, unknown> = {}): void {
  close()
  shellUi.noActive = false
  openApp(id, props)
}

function openSystem(tab: 'save' | 'settings' | 'stats' | 'log'): void {
  open('system', { tab, nonce: Date.now() })
}

function save(): void {
  close()
  if (saveNow('auto')) pushToast(`Game saved — ${formatShortDate(state.time.day)}.`, 'good', 'system')
  else pushToast('Could not save: browser storage is full or disabled.', 'bad', 'system')
}

async function about(): Promise<void> {
  close()
  await alertBox({
    title: 'About HackerSim 2001',
    icon: 'info',
    text:
      'HackerSim 2001 — Home Edition\nVersion 1.0 (Build 2600)\n\n' +
      'A life simulator about code, rent, friendship and consequences, set in Port Lumen at the turn of the millennium.\n\n' +
      'Every person, company and network in this game is fictional. The hacking is make-believe; the rent is, sadly, realistic.',
  })
}

const desktopApp = isDesktopApp()

function fullscreen(): void {
  close()
  void toggleFullscreen()
}

async function exitGame(): Promise<void> {
  close()
  const ok = await confirmBox({
    title: 'Exit HackerSim',
    icon: 'question',
    text: 'Exit to your real desktop? Your game is saved first.',
    ok: 'Exit',
  })
  if (!ok) return
  saveNow('auto')
  await exitApp()
}

async function quit(): Promise<void> {
  close()
  const ok = await confirmBox({
    title: 'Log Off HackerSim',
    icon: 'question',
    text: 'Quit to the title screen? Your game is saved automatically.',
    ok: 'Log Off',
  })
  if (!ok) return
  persistLayout()
  closeAll()
  clearToasts()
  nav.screen = 'title'
  quitToTitle()
}
</script>

<template>
  <div class="startmenu" role="menu" @pointerdown.stop>
    <div class="sm-head">
      <div class="sm-avatar" aria-hidden="true">{{ initials }}</div>
      <div class="sm-who">
        <div class="sm-handle">{{ state.player.handle }}</div>
        <div class="sm-name">{{ state.player.name }} · {{ home }}</div>
      </div>
    </div>
    <div class="sm-body">
      <div class="sm-left">
        <button v-for="app in programs" :key="app.id" type="button" class="sm-item" role="menuitem" :title="BLURBS[app.id]" @click="open(app.id)">
          <AppIcon :app="app.id" :size="22" />
          <span class="sm-item-text">
            <b>{{ app.title }}</b>
            <small>{{ BLURBS[app.id] }}</small>
          </span>
          <span v-if="(unread[app.id] ?? 0) > 0" class="sm-count">{{ unread[app.id] }}</span>
        </button>
      </div>
      <div class="sm-right">
        <button type="button" class="sm-place" role="menuitem" @click="save"><span class="sm-glyph">💾</span><b>Save Game</b></button>
        <button type="button" class="sm-place" role="menuitem" @click="openSystem('save')"><span class="sm-glyph">📁</span>Save &amp; Load…</button>
        <div class="sm-sep"></div>
        <button type="button" class="sm-place" role="menuitem" @click="openSystem('settings')"><span class="sm-glyph">⚙</span>Settings</button>
        <button type="button" class="sm-place" role="menuitem" @click="openSystem('stats')"><span class="sm-glyph">📊</span>Statistics</button>
        <button type="button" class="sm-place" role="menuitem" @click="openSystem('log')"><span class="sm-glyph">📜</span>Event Log</button>
        <div class="sm-sep"></div>
        <button type="button" class="sm-place" role="menuitem" @click="fullscreen"><span class="sm-glyph">⛶</span>Toggle Fullscreen <small class="muted">F11</small></button>
        <button type="button" class="sm-place" role="menuitem" @click="about"><span class="sm-glyph">❔</span>About HackerSim</button>
      </div>
    </div>
    <div class="sm-foot">
      <button type="button" class="sm-quit" role="menuitem" @click="quit"><span class="sm-quit-ico" aria-hidden="true">⏻</span>Quit to Title</button>
      <button v-if="desktopApp" type="button" class="sm-quit" role="menuitem" @click="exitGame"><span class="sm-quit-ico" aria-hidden="true">✕</span>Exit to Desktop</button>
    </div>
  </div>
</template>

<style scoped>
.startmenu {
  position: absolute;
  left: 0;
  bottom: 100%;
  width: 410px;
  max-height: calc(100vh - var(--tb-h) - 4px);
  display: flex;
  flex-direction: column;
  border: 1px solid var(--sm-border);
  border-radius: var(--sm-radius);
  background: var(--sm-left);
  box-shadow: 3px 3px 10px rgb(0 0 0 / 45%), var(--bevel-raised);
  overflow: hidden;
  color: var(--win-fg);
  animation: sm-in 0.12s ease-out;
}
.sm-head {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  background: var(--sm-head);
  color: var(--sm-head-fg);
  flex: none;
}
.sm-avatar {
  width: 42px;
  height: 42px;
  border: 2px solid #fff;
  border-radius: 4px;
  background: linear-gradient(135deg, #f6c343, #e0761f);
  color: #fff;
  font: bold 18px/38px var(--font-title);
  text-align: center;
  text-shadow: 1px 1px 1px rgb(0 0 0 / 40%);
  box-shadow: 1px 1px 3px rgb(0 0 0 / 35%);
}
.sm-handle {
  font: bold 15px var(--font-title);
  text-shadow: 1px 1px 1px rgb(0 0 0 / 40%);
}
.sm-name {
  font-size: 11px;
  opacity: 0.9;
}
.sm-body {
  display: flex;
  min-height: 0;
  flex: 1;
  border-top: 2px solid #e9953b;
}
.sm-left {
  flex: 1.25;
  padding: 4px;
  overflow: auto;
  background: var(--sm-left);
}
.sm-right {
  flex: 1;
  padding: 6px 4px;
  background: var(--sm-right);
  border-left: 1px solid var(--sm-right-border);
  display: flex;
  flex-direction: column;
  gap: 1px;
}
.sm-item,
.sm-place {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 3px 6px;
  border: 0;
  background: none;
  font: inherit;
  color: inherit;
  text-align: left;
  cursor: pointer;
  border-radius: 2px;
}
.sm-item-text {
  display: flex;
  flex-direction: column;
  min-width: 0;
  flex: 1;
}
.sm-item-text small {
  font-size: 10px;
  color: var(--muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.sm-item:hover,
.sm-item:focus-visible,
.sm-place:hover,
.sm-place:focus-visible {
  background: var(--sm-hover);
  color: var(--sm-hover-fg);
  outline: none;
}
.sm-item:hover small,
.sm-item:focus-visible small {
  color: inherit;
  opacity: 0.85;
}
.sm-count {
  min-width: 18px;
  padding: 0 5px;
  border-radius: 9px;
  background: var(--badge-bg);
  color: var(--badge-fg);
  font-size: 10px;
  font-weight: bold;
  line-height: 16px;
  text-align: center;
}
.sm-place {
  padding: 5px 6px;
  color: #0a246a;
}
:root[data-skin='classic'] .sm-place {
  color: #000;
}
.sm-glyph {
  width: 20px;
  text-align: center;
  font-family: var(--font-emoji);
  font-size: 16px;
}
.sm-sep {
  height: 1px;
  margin: 4px 6px;
  background: linear-gradient(90deg, transparent, #88a9dc, transparent);
}
.sm-foot {
  flex: none;
  display: flex;
  justify-content: flex-end;
  padding: 5px 8px;
  background: var(--sm-foot);
}
.sm-quit {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 3px 8px;
  border: 0;
  background: none;
  color: var(--sm-head-fg);
  font: inherit;
  cursor: pointer;
  border-radius: 3px;
}
:root[data-skin='classic'] .sm-quit {
  color: #000;
  box-shadow: var(--bevel-raised);
}
.sm-quit:hover,
.sm-quit:focus-visible {
  background: rgb(255 255 255 / 18%);
  outline: none;
}
.sm-quit-ico {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: 4px;
  background: linear-gradient(#f7a24a, #d8640f);
  border: 1px solid #fff;
  color: #fff;
  font-weight: bold;
}
@keyframes sm-in {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: none;
  }
}
</style>
