<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { C, daysLeft, numRef, objectiveDone, renderLine, type QuestKind } from '@/engine'
import ProgressBar from '@/ui/components/ProgressBar.vue'
import { useGame } from '@/ui/game'
import { openApp } from '@/ui/wm'
import { shellUi } from './nav'

const state = useGame()

const COLLAPSE_KEY = 'hackersim.tracker.collapsed'
function readCollapsed(): boolean {
  try {
    return localStorage.getItem(COLLAPSE_KEY) === '1'
  } catch {
    return false
  }
}
const collapsed = ref<boolean>(readCollapsed())
watch(collapsed, v => {
  try {
    localStorage.setItem(COLLAPSE_KEY, v ? '1' : '0')
  } catch {
    // storage unavailable: the preference lasts this session only
  }
})

const KIND_LABEL: Record<QuestKind, string> = {
  tutorial: 'Tutorial',
  main: 'Main',
  faction: 'Faction',
  side: 'Side',
  personal: 'Personal',
}

const questId = computed(() => state.trackedQuest)
const def = computed(() => (questId.value ? C.quests.get(questId.value) : undefined))
const qs = computed(() => (questId.value ? state.quests[questId.value] : undefined))
const stage = computed(() => (def.value && qs.value ? def.value.stages[qs.value.stage] : undefined))
const visible = computed(() => def.value !== undefined && qs.value?.status === 'active' && stage.value !== undefined)

interface ObjView {
  id: string
  text: string
  done: boolean
  optional: boolean
  hint: string
  progress: { value: number; label: string } | null
}

const objectives = computed<ObjView[]>(() => {
  const st = stage.value
  const q = qs.value
  if (!st || !q) return []
  return st.objectives
    .filter(o => !o.hidden || objectiveDone(q, o))
    .map(o => {
      const done = objectiveDone(q, o)
      let progress: ObjView['progress'] = null
      if (o.progress && !done && o.progress.target > 0) {
        const cur = numRef(state, o.progress.of)
        const shown = Math.min(Math.floor(cur), o.progress.target)
        progress = { value: cur / o.progress.target, label: `${shown} / ${o.progress.target}` }
      }
      return { id: o.id, text: renderLine(state, o.text), done, optional: o.optional === true, hint: renderLine(state, o.hint), progress }
    })
})

const doneCount = computed(() => objectives.value.filter(o => o.done && !o.optional).length)
const requiredCount = computed(() => objectives.value.filter(o => !o.optional).length)

const left = computed(() => (questId.value ? daysLeft(state, questId.value) : undefined))
const leftLabel = computed(() => {
  const d = left.value
  if (d === undefined) return ''
  if (d <= 0) return 'Due today'
  return d === 1 ? '1 day left' : `${d} days left`
})

/** Hints for what's still required (optional ones only when nothing else is left), at most three. */
const hints = computed<string[]>(() => {
  const open = objectives.value.filter(o => !o.done && o.hint)
  const required = open.filter(o => !o.optional)
  const list = (required.length ? required : open).slice(0, 3).map(o => o.hint)
  if (list.length === 0 && stage.value?.hint) list.push(renderLine(state, stage.value.hint))
  return list
})

// Hints are hidden again whenever the quest or stage changes.
const hintOpen = ref<boolean>(false)
watch(
  () => `${questId.value ?? ''}:${qs.value?.stage ?? ''}`,
  () => {
    hintOpen.value = false
  },
)

function openJournal(): void {
  shellUi.noActive = false
  openApp('journal', questId.value ? { quest: questId.value } : {})
}
</script>

<template>
  <aside v-if="visible && def" class="tracker" :class="{ collapsed }" aria-label="Tracked quest">
    <header class="tr-head" title="Open the Quest Journal" @click="openJournal">
      <span class="tr-star" aria-hidden="true">★</span>
      <span class="tr-title">{{ def.title }}</span>
      <span v-if="leftLabel" class="tr-due" :class="{ urgent: (left ?? 9) <= 1 }">{{ leftLabel }}</span>
      <button
        type="button"
        class="tr-toggle"
        :title="collapsed ? 'Expand' : 'Collapse'"
        :aria-label="collapsed ? 'Expand quest tracker' : 'Collapse quest tracker'"
        :aria-expanded="!collapsed"
        @click.stop="collapsed = !collapsed"
      >
        {{ collapsed ? '▸' : '▾' }}
      </button>
    </header>
    <div v-if="!collapsed" class="tr-body" title="Open the Quest Journal" @click="openJournal">
      <div class="tr-meta">
        <span class="pill" :class="{ story: def.kind === 'main', info: def.kind !== 'main' }">{{ KIND_LABEL[def.kind] }}</span>
        <span v-if="requiredCount > 0" class="muted">{{ doneCount }}/{{ requiredCount }} done</span>
      </div>
      <ul v-if="objectives.length" class="tr-list">
        <li v-for="o in objectives" :key="o.id" class="tr-obj" :class="{ done: o.done }">
          <span class="tr-check" aria-hidden="true">{{ o.done ? '☑' : '☐' }}</span>
          <div class="tr-obj-body">
            <span class="tr-text">{{ o.text }}<em v-if="o.optional" class="muted"> (optional)</em></span>
            <ProgressBar v-if="o.progress" class="tr-bar" :value="o.progress.value" :label="o.progress.label" :height="11" />
          </div>
        </li>
      </ul>
      <p v-else class="muted tr-empty">Nothing to tick off right now. Let time pass and see who calls.</p>
      <div v-if="hints.length" class="tr-hints">
        <button v-if="!hintOpen" type="button" class="btn small" @click.stop="hintOpen = true">💡 Hint</button>
        <div v-else class="tr-hint" @click.stop="hintOpen = false">
          <p v-for="(h, i) in hints" :key="i">💡 {{ h }}</p>
        </div>
      </div>
    </div>
  </aside>
</template>

<style scoped>
.tracker {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 2;
  width: 270px;
  max-height: calc(100% - 20px);
  display: flex;
  flex-direction: column;
  background: rgb(255 255 240 / 93%);
  border: 1px solid #a89a5a;
  border-radius: 6px;
  box-shadow: 2px 3px 10px rgb(0 0 0 / 35%);
  color: #1c1c1c;
  overflow: hidden;
  backdrop-filter: blur(2px);
}
:root[data-skin='classic'] .tracker {
  border-radius: 0;
  background: var(--win-bg);
  border: 0;
  box-shadow:
    var(--bevel-raised),
    2px 2px 0 rgb(0 0 0 / 30%);
}
.tr-head {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 5px 6px 5px 8px;
  background: linear-gradient(#f8e7a2, #ecd27a);
  border-bottom: 1px solid #c9b060;
  cursor: pointer;
}
:root[data-skin='classic'] .tr-head {
  background: linear-gradient(90deg, #000080, #1084d0);
  color: #fff;
  border-bottom: 0;
}
.tracker.collapsed .tr-head {
  border-bottom: 0;
}
.tr-star {
  color: #b77900;
  text-shadow: 0 1px 0 #fff6;
}
:root[data-skin='classic'] .tr-star {
  color: #ffd84a;
}
.tr-title {
  flex: 1;
  min-width: 0;
  font-weight: bold;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.tr-due {
  flex: none;
  padding: 0 6px;
  border-radius: 8px;
  background: #fff3cf;
  border: 1px solid #d49c1c;
  color: #8a5200;
  font-size: 10px;
  font-weight: bold;
  line-height: 15px;
}
.tr-due.urgent {
  background: var(--bad);
  border-color: #fff;
  color: #fff;
  animation: hs-blink 1s steps(1) infinite;
}
.tr-toggle {
  flex: none;
  width: 18px;
  height: 18px;
  padding: 0;
  border: 1px solid rgb(0 0 0 / 20%);
  border-radius: 3px;
  background: rgb(255 255 255 / 60%);
  color: inherit;
  font-size: 10px;
  line-height: 16px;
  cursor: pointer;
}
:root[data-skin='classic'] .tr-toggle {
  border: 0;
  border-radius: 0;
  background: #c0c0c0;
  color: #000;
  box-shadow: var(--bevel-raised);
}
.tr-body {
  padding: 6px 8px 8px;
  overflow: auto;
  cursor: pointer;
}
.tr-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 4px;
  font-size: 11px;
}
.tr-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 5px;
}
.tr-obj {
  display: flex;
  gap: 5px;
  align-items: flex-start;
  line-height: 1.35;
}
.tr-check {
  flex: none;
  width: 14px;
  font-size: 13px;
  line-height: 16px;
  color: #6a5a20;
}
.tr-obj.done .tr-check {
  color: var(--good);
}
.tr-obj.done .tr-text {
  color: var(--muted);
  text-decoration: line-through;
}
.tr-obj-body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.tr-bar {
  width: 100%;
}
.tr-empty {
  margin: 2px 0;
  font-style: italic;
}
.tr-hints {
  margin-top: 7px;
}
.tr-hint {
  padding: 5px 7px;
  background: var(--balloon-bg);
  border: 1px dashed #b89a3a;
  border-radius: 4px;
  font-style: italic;
}
.tr-hint p:last-child {
  margin-bottom: 0;
}
</style>
