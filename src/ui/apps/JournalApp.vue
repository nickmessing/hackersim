<script setup lang="ts">
/**
 * Quest Journal: a leather-bound CRPG journal — an index of quests on the left, the page on the right.
 * Complications (consequence sub-stories, titled "Complication: …") get their own red-inked section.
 */
import { computed, ref, watch } from 'vue'
import { formatShortDate } from '@/engine'
import type { QuestKind, QuestStatus } from '@/engine'
import { useGame } from '@/ui/game'
import QuestPage from '@/ui/world/QuestPage.vue'
import { KIND_LABELS, KIND_ORDER, deadlineOf, questEntries, questSort, type QuestEntry } from '@/ui/world/questData'

/** `quest` (or alias `id`) opens the journal on that quest. */
const props = withDefaults(defineProps<{ quest?: string; id?: string }>(), { quest: undefined, id: undefined })

const state = useGame()

const FILTERS: readonly { id: QuestStatus; label: string }[] = [
  { id: 'active', label: 'Active' },
  { id: 'completed', label: 'Completed' },
  { id: 'failed', label: 'Failed' },
]

const EMPTY: Record<QuestStatus, string> = {
  active: 'No active quests. Enjoy the quiet — or go looking for trouble.',
  completed: "Nothing finished yet. Rome wasn't coded in a day.",
  failed: 'No failures on record. Yet.',
}

const filter = ref<QuestStatus>('active')
const selected = ref<string | null>(props.quest ?? props.id ?? state.trackedQuest)

const entries = computed(() => questEntries(state))
const counts = computed(() => {
  const c: Record<QuestStatus, number> = { active: 0, completed: 0, failed: 0 }
  for (const e of entries.value) c[e.q.status] += 1
  return c
})
const filtered = computed(() => entries.value.filter(e => e.q.status === filter.value).sort(questSort))

const COMPLICATION_PREFIX = 'Complication:'
function isComplication(e: QuestEntry): boolean {
  return e.def.title.startsWith(COMPLICATION_PREFIX)
}
/** Title as the index shows it: complications sit in their own section, so the prefix goes. */
function indexTitle(e: QuestEntry): string {
  return isComplication(e) ? e.def.title.slice(COMPLICATION_PREFIX.length).trim() || e.def.title : e.def.title
}
const COMPLICATION_GROUP = { group: 'Complications', glyph: '⚠' } as const
const activeComplications = computed(() => entries.value.filter(e => e.q.status === 'active' && isComplication(e)).length)

interface Group {
  kind: QuestKind | 'complication'
  label: { group: string; glyph: string }
  items: QuestEntry[]
}
const groups = computed<Group[]>(() => {
  const comps = filtered.value.filter(isComplication)
  const rest = filtered.value.filter(e => !isComplication(e))
  const byKind: Group[] = KIND_ORDER.map(kind => ({ kind, label: KIND_LABELS[kind], items: rest.filter(e => e.def.kind === kind) }))
  // Consequences come right after the main story: they are the fires you are putting out.
  const out: Group[] = [...byKind.slice(0, 1), { kind: 'complication', label: COMPLICATION_GROUP, items: comps }, ...byKind.slice(1)]
  return out.filter(g => g.items.length > 0)
})

const current = computed<QuestEntry | undefined>(() => {
  const id = selected.value
  const hit = id ? entries.value.find(e => e.id === id && e.q.status === filter.value) : undefined
  return hit ?? filtered.value[0]
})

function select(e: QuestEntry): void {
  selected.value = e.id
}

function focusQuest(id: string | undefined | null): void {
  if (!id) return
  const e = entries.value.find(x => x.id === id)
  if (!e) return
  filter.value = e.q.status
  selected.value = id
}

watch(
  () => props.quest ?? props.id,
  id => {
    focusQuest(id)
  },
)
// Open on the requested (or tracked) quest's tab.
focusQuest(props.quest ?? props.id ?? state.trackedQuest)

function deadline(e: QuestEntry): string {
  const d = deadlineOf(state, e)
  return d ? `⌛${Math.max(0, d.days)}d` : ''
}

function onKey(ev: KeyboardEvent): void {
  if (ev.key !== 'ArrowDown' && ev.key !== 'ArrowUp') return
  ev.preventDefault()
  const flat = groups.value.flatMap(g => g.items)
  const i = flat.findIndex(e => e.id === current.value?.id)
  const next = flat[Math.max(0, Math.min(flat.length - 1, i + (ev.key === 'ArrowDown' ? 1 : -1)))]
  if (next) select(next)
}
</script>

<template>
  <div class="app journal">
    <div class="book">
      <!-- Left page: index -->
      <section class="page index">
        <div class="ribbons" role="tablist" aria-label="Quest status">
          <button
            v-for="f in FILTERS"
            :key="f.id"
            type="button"
            role="tab"
            class="ribbon"
            :class="[f.id, { on: filter === f.id }]"
            :aria-selected="filter === f.id"
            @click="filter = f.id"
          >
            {{ f.label }} <span class="n">{{ counts[f.id] }}</span>
            <span
              v-if="f.id === 'active' && activeComplications > 0"
              class="cbadge"
              :title="`${activeComplications} active complication${activeComplications === 1 ? '' : 's'}`"
            >⚠{{ activeComplications }}</span>
          </button>
        </div>

        <div class="toc scroll" tabindex="0" aria-label="Quests" @keydown="onKey">
          <template v-if="entries.length === 0">
            <p class="blank">Your journal is blank.</p>
            <p class="blank faded">Every legend starts on a boring Tuesday. Log on, look around — trouble finds people like you.</p>
          </template>
          <p v-else-if="groups.length === 0" class="blank faded">{{ EMPTY[filter] }}</p>
          <div v-for="g in groups" :key="g.kind" class="grp" :class="{ comp: g.kind === 'complication' }">
            <h4 class="grp-title"><span aria-hidden="true">{{ g.label.glyph }}</span> {{ g.label.group }} <span class="faded">({{ g.items.length }})</span></h4>
            <p v-if="g.kind === 'complication' && filter === 'active'" class="grp-note">Things went wrong. How these end leaves a mark.</p>
            <button
              v-for="e in g.items"
              :key="e.id"
              type="button"
              class="qitem"
              :class="{ sel: current?.id === e.id }"
              :aria-current="current?.id === e.id"
              @click="select(e)"
            >
              <span class="mark" :title="state.trackedQuest === e.id ? 'Tracked' : ''">{{ state.trackedQuest === e.id ? '◆' : '' }}</span>
              <span class="qname" :title="e.def.title">{{ indexTitle(e) }}</span>
              <span v-if="e.q.status === 'active' && deadline(e)" class="due">{{ deadline(e) }}</span>
              <span v-else-if="e.q.status !== 'active' && e.q.endedDay !== undefined" class="when faded">{{ formatShortDate(e.q.endedDay) }}</span>
            </button>
          </div>
        </div>
      </section>

      <div class="gutter" aria-hidden="true"></div>

      <!-- Right page: the quest -->
      <section class="page main scroll">
        <QuestPage v-if="current" :entry="current" />
        <div v-else class="nothing">
          <div class="flourish" aria-hidden="true">❦</div>
          <p>
            {{ entries.length === 0 ? 'The pages are empty, waiting for your story.' : 'This page is blank. Try another ribbon.' }}
          </p>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.journal {
  --j-leather-a: #6a4428;
  --j-leather-b: #3b2414;
  --j-stitch: rgb(236 206 150 / 45%);
  --j-parch: #f4e8cc;
  --j-parch-dark: #e5d2a8;
  --j-ink: #3a2816;
  --j-ink-faded: #7b6247;
  --j-ink-red: #8a2b1b;
  --j-gilt: #c9a040;
  --j-rule: rgb(122 92 58 / 35%);
  --j-serif: 'Palatino Linotype', 'Book Antiqua', Palatino, Georgia, serif;
  position: relative;
  padding: 10px;
  background:
    radial-gradient(ellipse at 30% 20%, rgb(255 255 255 / 10%), transparent 55%),
    repeating-radial-gradient(circle at 20% 30%, rgb(0 0 0 / 6%) 0 1px, transparent 1px 4px),
    repeating-radial-gradient(circle at 80% 70%, rgb(255 255 255 / 4%) 0 1px, transparent 1px 5px),
    linear-gradient(160deg, var(--j-leather-a), var(--j-leather-b));
}
.journal::before {
  content: '';
  position: absolute;
  inset: 4px;
  border: 1px dashed var(--j-stitch);
  border-radius: 4px;
  pointer-events: none;
}
.book {
  flex: 1;
  min-height: 0;
  display: flex;
  filter: drop-shadow(0 2px 4px rgb(0 0 0 / 45%));
}
.page {
  min-height: 0;
  color: var(--j-ink);
  background:
    radial-gradient(ellipse at 10% 0%, rgb(255 255 255 / 45%), transparent 50%),
    radial-gradient(circle at 85% 90%, rgb(150 100 40 / 14%), transparent 45%),
    radial-gradient(circle at 15% 80%, rgb(150 100 40 / 8%), transparent 35%),
    repeating-linear-gradient(0deg, rgb(120 90 40 / 3.5%) 0 1px, transparent 1px 3px),
    var(--j-parch);
  box-shadow: inset 0 0 28px rgb(120 80 30 / 22%);
}
.index {
  width: 236px;
  flex: none;
  display: flex;
  flex-direction: column;
  border-radius: 4px 0 0 4px;
  padding: 0 0 8px;
}
.gutter {
  width: 10px;
  flex: none;
  background: linear-gradient(90deg, rgb(90 60 30 / 35%), rgb(60 40 20 / 60%) 50%, rgb(90 60 30 / 35%));
}
.main {
  flex: 1;
  min-width: 0;
  border-radius: 0 4px 4px 0;
  padding: 14px 18px 12px;
}
.ribbons {
  display: flex;
  gap: 3px;
  padding: 0 8px;
}
.ribbon {
  font-family: var(--j-serif);
  font-size: 11px;
  flex: 1;
  padding: 6px 4px 4px;
  border: none;
  color: var(--j-parch);
  background: var(--j-ink-faded);
  cursor: pointer;
  clip-path: polygon(0 0, 100% 0, 100% 100%, 50% 82%, 0 100%);
  padding-bottom: 9px;
  opacity: 0.75;
  transition: opacity 0.1s, padding 0.1s;
}
.ribbon.active {
  background: var(--info);
}
.ribbon.completed {
  background: var(--good);
}
.ribbon.failed {
  background: var(--j-ink-red);
}
.ribbon.on {
  opacity: 1;
  padding-bottom: 13px;
  font-weight: bold;
}
.ribbon:hover {
  opacity: 1;
}
.ribbon:focus-visible {
  outline: 1px dotted var(--j-ink);
}
.n {
  font-size: 10px;
  opacity: 0.85;
}
.toc {
  padding: 6px 10px 0;
}
.toc:focus-visible {
  outline: 1px dotted var(--j-ink-red);
  outline-offset: -3px;
}
.blank {
  font-family: var(--j-serif);
  font-style: italic;
  text-align: center;
  margin: 16px 6px 4px;
}
.faded {
  color: var(--j-ink-faded);
}
.grp + .grp {
  margin-top: 8px;
}
.grp-title {
  font-family: var(--j-serif);
  font-variant: small-caps;
  letter-spacing: 1px;
  font-size: 12px;
  color: var(--j-ink-red);
  border-bottom: 1px solid var(--j-rule);
  margin-bottom: 2px;
  padding-bottom: 1px;
}
.grp-title .faded {
  font-variant: normal;
  letter-spacing: 0;
  font-size: 10px;
}
/* Complications: a red-inked section with a torn-paper tab, so consequence arcs stand out. */
.grp.comp {
  padding: 3px 4px 4px;
  border-left: 2px solid var(--j-ink-red);
  background: repeating-linear-gradient(135deg, rgb(138 43 27 / 5%) 0 6px, transparent 6px 12px);
  border-radius: 0 2px 2px 0;
}
.grp.comp .grp-title {
  color: var(--j-parch);
  background: var(--j-ink-red);
  border-bottom: none;
  padding: 1px 6px;
  margin: -3px -4px 3px;
  clip-path: polygon(0 0, 100% 0, 97% 100%, 0 100%);
}
.grp.comp .grp-title .faded {
  color: rgb(244 232 204 / 80%);
}
.grp-note {
  font-family: var(--j-serif);
  font-style: italic;
  font-size: 11px;
  color: var(--j-ink-red);
  margin: 0 0 2px 4px;
}
.grp.comp .qitem {
  color: var(--j-ink-red);
}
.cbadge {
  display: inline-block;
  margin-left: 2px;
  padding: 0 3px;
  font-size: 9px;
  line-height: 12px;
  font-weight: bold;
  color: var(--j-ink-red);
  background: var(--j-parch);
  border-radius: 6px;
  vertical-align: 1px;
}
.qitem {
  display: flex;
  align-items: baseline;
  gap: 4px;
  width: 100%;
  text-align: left;
  font: inherit;
  font-family: var(--j-serif);
  font-size: 12px;
  color: var(--j-ink);
  background: none;
  border: none;
  border-radius: 2px;
  padding: 3px 4px;
  cursor: pointer;
}
.qitem:hover {
  background: rgb(201 160 64 / 18%);
}
.qitem.sel {
  background: rgb(138 43 27 / 12%);
  box-shadow: inset 2px 0 0 var(--j-ink-red);
  font-weight: bold;
}
.qitem:focus-visible {
  outline: 1px dotted var(--j-ink-red);
}
.mark {
  width: 10px;
  flex: none;
  color: var(--j-ink-red);
  font-size: 10px;
}
.qname {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.due {
  flex: none;
  font-size: 10px;
  color: var(--bad);
  font-family: var(--font-ui);
}
.when {
  flex: none;
  font-size: 10px;
  font-weight: normal;
}
.nothing {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-family: var(--j-serif);
  font-style: italic;
  color: var(--j-ink-faded);
  text-align: center;
}
.flourish {
  font-size: 40px;
  color: var(--j-gilt);
  margin-bottom: 8px;
}
</style>
