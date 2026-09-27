<script setup lang="ts">
import { computed } from 'vue'
import { isUnlocked } from '@/engine'
import { APP_IDS, APPS, type AppId } from '@/ui/apps'
import { useGame } from '@/ui/game'
import { openApp } from '@/ui/wm'
import AppIcon from './AppIcon.vue'
import { shellUi } from './nav'
import type { UnreadMap } from './unread'

defineProps<{ unread: UnreadMap }>()

const state = useGame()
/** Only programs the player has discovered (Act 0 gradual discovery). */
const icons = computed(() => APP_IDS.filter(id => APPS[id].desktop && isUnlocked(state, id)).map(id => APPS[id]))
const isNew = (id: AppId): boolean => state.flags[`ui.new.${id}`] === true

function select(id: AppId): void {
  shellUi.selectedIcon = id
  shellUi.noActive = true
  shellUi.startOpen = false
}

function open(id: AppId): void {
  shellUi.selectedIcon = id
  shellUi.noActive = false
  openApp(id)
}

function deselect(): void {
  shellUi.selectedIcon = null
  shellUi.noActive = true
}
</script>

<template>
  <div class="icons" @pointerdown.self="deselect">
    <button
      v-for="app in icons"
      :key="app.id"
      type="button"
      class="icon"
      :class="{ selected: shellUi.selectedIcon === app.id }"
      :title="`${app.title} — double-click to open`"
      @pointerdown.stop="select(app.id)"
      @dblclick="open(app.id)"
      @keydown.enter.prevent="open(app.id)"
    >
      <span class="icon-art">
        <AppIcon :app="app.id" :size="34" />
        <span v-if="isNew(app.id)" class="new-pill" aria-label="new program">NEW</span>
        <span v-if="(unread[app.id] ?? 0) > 0" class="badge" :aria-label="`${unread[app.id]} new`">{{ (unread[app.id] ?? 0) > 99 ? '99+' : unread[app.id] }}</span>
      </span>
      <span class="icon-label">{{ app.label }}</span>
    </button>
    <p v-if="icons.length === 0" class="empty-hint">
      Your desktop is empty for now.<br />Programs appear the first time you need them.
    </p>
  </div>
</template>

<style scoped>
.new-pill {
  position: absolute;
  left: -6px;
  top: -4px;
  padding: 0 4px;
  border-radius: 6px;
  background: #ffd23c;
  color: #3a2a00;
  font-size: 9px;
  font-weight: bold;
  line-height: 14px;
  box-shadow: 0 1px 2px rgb(0 0 0 / 40%);
  animation: new-pulse 1.2s ease-in-out infinite;
}
@keyframes new-pulse {
  50% {
    transform: scale(1.12);
  }
}
@media (prefers-reduced-motion: reduce) {
  .new-pill {
    animation: none;
  }
}
.empty-hint {
  grid-row: 1 / span 3;
  width: 240px;
  margin: 24px 0 0 12px;
  color: var(--desktop-fg);
  opacity: 0.75;
  text-shadow: 0 1px 2px rgb(0 0 0 / 60%);
  line-height: 1.5;
}
.icons {
  position: absolute;
  inset: 6px auto 6px 6px;
  z-index: 1;
  display: grid;
  grid-auto-flow: column;
  grid-template-rows: repeat(auto-fill, 78px);
  grid-auto-columns: 80px;
  gap: 2px 4px;
  align-content: start;
}
.icon {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  width: 80px;
  height: 78px;
  padding: 4px 2px;
  border: 1px solid transparent;
  background: none;
  font: inherit;
  cursor: default;
  color: var(--icon-label-fg);
}
.icon-art {
  position: relative;
  display: inline-flex;
  padding: 2px;
  border-radius: 3px;
}
.icon-label {
  max-width: 76px;
  padding: 1px 3px;
  line-height: 1.25;
  text-align: center;
  text-shadow: var(--icon-label-shadow);
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  word-break: break-word;
}
.icon.selected .icon-art {
  background: rgb(49 106 197 / 45%);
}
.icon.selected .icon-label {
  background: var(--icon-sel);
  text-shadow: none;
}
.icon:focus-visible {
  outline: none;
}
.icon:focus-visible .icon-label {
  outline: 1px dotted var(--icon-label-fg);
}
.badge {
  position: absolute;
  top: -4px;
  right: -8px;
  min-width: 17px;
  height: 17px;
  padding: 0 4px;
  border-radius: 9px;
  background: var(--badge-bg);
  color: var(--badge-fg);
  border: 1px solid #fff;
  font: bold 10px/15px var(--font-ui);
  text-align: center;
  box-shadow: 0 1px 2px rgb(0 0 0 / 45%);
  animation: badge-pop 0.25s ease-out;
}
@keyframes badge-pop {
  from {
    transform: scale(0.3);
  }
  70% {
    transform: scale(1.2);
  }
  to {
    transform: scale(1);
  }
}
</style>
