<script setup lang="ts">
import { APPS, type AppId } from '@/ui/apps'
import { taskbarToggle, wm } from '@/ui/wm'
import AppIcon from './AppIcon.vue'
import { shellUi } from './nav'
import StartMenu from './StartMenu.vue'
import SystemTray from './SystemTray.vue'
import type { UnreadMap } from './unread'

defineProps<{ unread: UnreadMap; activeApp: AppId | undefined }>()

function toggleStart(): void {
  shellUi.startOpen = !shellUi.startOpen
}

function onTask(app: AppId): void {
  shellUi.startOpen = false
  shellUi.noActive = false
  taskbarToggle(app)
}
</script>

<template>
  <div class="taskbar" role="toolbar" aria-label="Taskbar">
    <button
      type="button"
      class="start"
      :class="{ open: shellUi.startOpen }"
      :aria-expanded="shellUi.startOpen"
      title="Click here to begin"
      @pointerdown.stop
      @click="toggleStart"
    >
      <span class="start-logo" aria-hidden="true"><span>&gt;_</span></span>
      <span class="start-text">start</span>
    </button>
    <StartMenu v-if="shellUi.startOpen" :unread="unread" />

    <div class="tasks">
      <button
        v-for="w in wm.windows"
        :key="w.app"
        type="button"
        class="task"
        :class="{ active: w.app === activeApp && !w.minimized, flash: (unread[w.app] ?? 0) > 0 }"
        :title="APPS[w.app].title"
        :aria-pressed="w.app === activeApp && !w.minimized"
        @click="onTask(w.app)"
      >
        <AppIcon :app="w.app" :size="16" />
        <span class="task-label">{{ APPS[w.app].title }}</span>
        <span v-if="(unread[w.app] ?? 0) > 0" class="task-count">{{ unread[w.app] }}</span>
      </button>
    </div>

    <SystemTray />
  </div>
</template>

<style scoped>
.taskbar {
  position: relative;
  z-index: 1000;
  display: flex;
  align-items: stretch;
  height: var(--tb-h);
  flex: none;
  background: var(--tb-bg);
  color: var(--tb-fg);
  box-shadow: 0 -1px 0 rgb(0 0 0 / 15%);
}
:root[data-skin='classic'] .taskbar {
  box-shadow:
    inset 0 1px #dfdfdf,
    inset 0 2px #fff;
}
.start {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 0 22px 0 10px;
  border: 0;
  border-radius: var(--start-radius);
  background: var(--start-bg);
  color: var(--start-fg);
  font: var(--start-font);
  text-shadow: 1px 1px 2px rgb(0 0 0 / 45%);
  box-shadow: var(--start-shadow);
  cursor: pointer;
  flex: none;
}
.start:hover {
  background: var(--start-bg-hover);
}
.start.open {
  background: var(--start-bg-open);
  box-shadow: inset 1px 1px 3px rgb(0 0 0 / 45%);
}
.start:focus-visible {
  outline: 1px dotted #fff;
  outline-offset: -4px;
}
:root[data-skin='classic'] .start {
  margin: 3px 2px;
  padding: 0 6px 0 4px;
  text-shadow: none;
}
:root[data-skin='classic'] .start.open {
  box-shadow: var(--bevel-sunken);
}
:root[data-skin='classic'] .start:focus-visible {
  outline-color: #000;
}
.start-logo {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: radial-gradient(circle at 35% 30%, #ffffff 0%, #d9f2d9 30%, #7bc47b 100%);
  box-shadow:
    0 0 0 1px rgb(0 0 0 / 25%),
    1px 1px 2px rgb(0 0 0 / 40%);
  transform: rotate(-8deg);
}
.start-logo span {
  font: bold 9px var(--font-mono);
  color: #1c5a1c;
  text-shadow: none;
  transform: rotate(8deg);
}
.start-text {
  letter-spacing: 0.5px;
}
:root[data-skin='classic'] .start-text {
  text-transform: capitalize;
}

.tasks {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 3px;
  padding: 0 6px;
  overflow: hidden;
}
.task {
  display: flex;
  align-items: center;
  gap: 5px;
  flex: 0 1 170px;
  min-width: 36px;
  height: 24px;
  padding: 0 7px;
  border: 0;
  border-radius: var(--tb-btn-radius);
  background: var(--tb-btn-bg);
  color: var(--tb-fg);
  box-shadow: var(--tb-btn-shadow);
  font: inherit;
  font-size: 11px;
  cursor: pointer;
  text-align: left;
}
.task:hover {
  background: var(--tb-btn-hover);
}
.task.active {
  background: var(--tb-btn-active);
  box-shadow: var(--tb-btn-active-shadow);
}
:root[data-skin='classic'] .task.active {
  font-weight: bold;
}
.task.flash:not(.active) {
  animation: task-flash 1s steps(1) 6 forwards;
  background: var(--tb-btn-flash);
}
:root[data-skin='classic'] .task.flash:not(.active) {
  color: #fff;
}
.task:focus-visible {
  outline: 1px dotted currentColor;
  outline-offset: -4px;
}
.task-label {
  flex: 1;
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.task-count {
  flex: none;
  min-width: 16px;
  padding: 0 4px;
  border-radius: 8px;
  background: var(--badge-bg);
  color: var(--badge-fg);
  font-size: 10px;
  font-weight: bold;
  line-height: 14px;
  text-align: center;
}
@keyframes task-flash {
  0% {
    background: var(--tb-btn-flash);
  }
  50% {
    background: var(--tb-btn-bg);
  }
}
</style>
