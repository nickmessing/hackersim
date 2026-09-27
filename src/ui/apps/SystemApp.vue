<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import {
  ageOn,
  C,
  deleteSave,
  exportSave,
  formatClock,
  formatDate,
  formatShortDate,
  listSaves,
  money,
  SLOTS,
  type EndingDef,
  type LogEntry,
  type LogKind,
  type SaveMeta,
  type SaveSlot,
} from '@/engine'
import { loadFromCode, loadSlot, saveNow, session, useGame } from '@/ui/game'
import { closeAll, persistLayout, wm } from '@/ui/wm'
import { agoLabel, roman } from '@/ui/shell/describe'
import { desk } from '@/ui/shell/desk'
import { confirmBox } from '@/ui/shell/msgbox'
import { applySkin, skinState, type Skin } from '@/ui/shell/skin'
import { playChime } from '@/ui/shell/sound'
import { KIND_META, LOG_KINDS, pushToast } from '@/ui/shell/toasts'

type Tab = 'save' | 'settings' | 'stats' | 'log'

const props = withDefaults(defineProps<{ tab?: Tab; nonce?: number }>(), { tab: undefined, nonce: undefined })

const state = useGame()

const TABS: { id: Tab; label: string; glyph: string }[] = [
  { id: 'save', label: 'Save / Load', glyph: '💾' },
  { id: 'settings', label: 'Settings', glyph: '⚙' },
  { id: 'stats', label: 'Statistics', glyph: '📊' },
  { id: 'log', label: 'Event Log', glyph: '📜' },
]
const tab = ref<Tab>(props.tab ?? 'save')
watch(
  () => [props.tab, props.nonce] as const,
  ([t]) => {
    if (t) tab.value = t
  },
)

// ── Save / Load ────────────────────────────────────────────────────────────
const saves = ref<SaveMeta[]>(listSaves())
function refresh(): void {
  saves.value = listSaves()
}
watch(() => session.lastSaveAt, refresh)

const slotRows = computed(() => SLOTS.map(slot => ({ slot, meta: saves.value.find(s => s.slot === slot) })))

function slotName(slot: SaveSlot): string {
  return slot === 'auto' ? 'Autosave' : `Slot ${slot}`
}

async function saveTo(slot: SaveSlot, existing: SaveMeta | undefined): Promise<void> {
  if (existing && slot !== 'auto') {
    const ok = await confirmBox({
      title: 'Overwrite Save',
      icon: 'warn',
      text: `${slotName(slot)} already holds ${existing.name} “${existing.handle}” (day ${existing.day + 1}). Overwrite it?`,
      ok: 'Overwrite',
    })
    if (!ok) return
  }
  if (saveNow(slot)) pushToast(`Saved to ${slotName(slot)}.`, 'good')
  else pushToast('Could not save: browser storage is full or disabled.', 'bad')
  refresh()
}

async function loadFrom(slot: SaveSlot, meta: SaveMeta): Promise<void> {
  const ok = await confirmBox({
    title: 'Load Game',
    icon: 'question',
    text: `Load ${slotName(slot)} — ${meta.name} “${meta.handle}”, day ${meta.day + 1}? Anything since your last save will be lost.`,
    ok: 'Load',
  })
  if (!ok) return
  if (!loadSlot(slot)) {
    pushToast(`${slotName(slot)} would not load — it may be damaged.`, 'bad')
    refresh()
  }
}

async function remove(slot: SaveSlot, meta: SaveMeta): Promise<void> {
  const ok = await confirmBox({
    title: 'Delete Save',
    icon: 'warn',
    text: `Delete ${slotName(slot)} (${meta.name}, day ${meta.day + 1})? This cannot be undone.`,
    ok: 'Delete',
    danger: true,
  })
  if (!ok) return
  deleteSave(slot)
  refresh()
}

const exported = ref<string>('')
const copied = ref<boolean>(false)
const exportBox = ref<HTMLTextAreaElement | null>(null)
function generate(): void {
  exported.value = exportSave(state)
  copied.value = false
}
async function copyCode(): Promise<void> {
  if (!exported.value) generate()
  exportBox.value?.select()
  try {
    await navigator.clipboard.writeText(exported.value)
    copied.value = true
  } catch {
    pushToast('Clipboard blocked — the code is selected, press Ctrl+C.', 'info')
  }
}

const importText = ref<string>('')
const importError = ref<string>('')
async function importCode(): Promise<void> {
  importError.value = ''
  const code = importText.value.trim()
  if (!code) {
    importError.value = 'Paste a save code first.'
    return
  }
  const ok = await confirmBox({
    title: 'Import Save Code',
    icon: 'question',
    text: 'Replace the current game with the one in this code? Anything since your last save will be lost.',
    ok: 'Import',
  })
  if (!ok) return
  if (!loadFromCode(code)) importError.value = "That code didn't parse. Make sure you copied all of it."
}

// ── Settings ───────────────────────────────────────────────────────────────
const skin = computed<Skin>({
  get: () => skinState.skin,
  set: v => {
    applySkin(v)
  },
})

function testSound(): void {
  playChime('story', 0.07)
}

function resetWindows(): void {
  closeAll()
  persistLayout()
}

function cascade(): void {
  const list = [...wm.windows].sort((a, b) => a.z - b.z)
  list.forEach((w, i) => {
    w.maximized = false
    w.minimized = false
    w.w = Math.min(w.w, Math.max(300, desk.w - 140))
    w.h = Math.min(w.h, Math.max(200, desk.h - 140))
    w.x = Math.min(24 + i * 28, Math.max(0, desk.w - w.w))
    w.y = Math.min(16 + i * 28, Math.max(0, desk.h - w.h))
  })
  persistLayout()
}

// ── Statistics ─────────────────────────────────────────────────────────────
const age = computed(() => Math.floor(ageOn(state.time.day)))
const background = computed(() => C.backgrounds.get(state.player.background)?.name ?? '—')
const traitNames = computed(() => state.player.traits.map(t => C.traits.get(t)?.name ?? t).join(', ') || '—')
const t = computed(() => state.totals)
const checksTotal = computed(() => t.value.checksPassed + t.value.checksFailed)
const checkRate = computed(() => (checksTotal.value ? Math.round((t.value.checksPassed / checksTotal.value) * 100) : 0))
const hacksTotal = computed(() => t.value.hacksDone + t.value.hacksFailed)
const endingsSeen = computed(() =>
  state.endingsSeen.map(id => ({ id, def: C.endings.get(id) })).map(e => ({ id: e.id, title: e.def?.title ?? e.id, tone: e.def?.tone })),
)
const endingsTotal = computed(() => Math.max(C.endings.size, state.endingsSeen.length))
const TONE_PILL: Record<EndingDef['tone'], string> = { good: 'good', bittersweet: 'warn', bad: 'bad', weird: 'story' }
const questsDone = computed(() => Object.values(state.quests).filter(q => q.status === 'completed').length)
const questsFailed = computed(() => Object.values(state.quests).filter(q => q.status === 'failed').length)
const peopleMet = computed(() => Object.values(state.npcs).filter(n => n.met).length)
const startedOn = computed(() => (state.createdAt ? new Date(state.createdAt).toLocaleDateString() : '—'))

// ── Event log ──────────────────────────────────────────────────────────────
const kindOn = ref<Record<LogKind, boolean>>(Object.fromEntries(LOG_KINDS.map(k => [k, true])) as Record<LogKind, boolean>)
const search = ref<string>('')
const counts = computed(() => {
  const c = Object.fromEntries(LOG_KINDS.map(k => [k, 0])) as Record<LogKind, number>
  for (const e of state.log) c[e.kind]++
  return c
})
const allOn = computed(() => LOG_KINDS.every(k => kindOn.value[k]))
function toggleKind(k: LogKind): void {
  kindOn.value = { ...kindOn.value, [k]: !kindOn.value[k] }
}
function setAll(v: boolean): void {
  kindOn.value = Object.fromEntries(LOG_KINDS.map(k => [k, v])) as Record<LogKind, boolean>
}
const entries = computed(() => {
  const q = search.value.trim().toLowerCase()
  const out: { i: number; e: LogEntry }[] = []
  for (let i = state.log.length - 1; i >= 0; i--) {
    const e = state.log[i]
    if (!e || !kindOn.value[e.kind]) continue
    if (q && !e.text.toLowerCase().includes(q)) continue
    out.push({ i, e })
  }
  return out
})
</script>

<template>
  <div class="app system">
    <div class="tabs" role="tablist">
      <button v-for="tb in TABS" :key="tb.id" type="button" role="tab" :class="{ active: tab === tb.id }" :aria-selected="tab === tb.id" @click="tab = tb.id">
        <span class="emo" aria-hidden="true">{{ tb.glyph }}</span> {{ tb.label }}
      </button>
    </div>

    <!-- SAVE / LOAD -->
    <div v-if="tab === 'save'" class="pane scroll">
      <div class="group">
        <div class="group-title">Saved games</div>
        <table class="table slots">
          <thead>
            <tr>
              <th>Slot</th>
              <th>Character</th>
              <th>In game</th>
              <th>Saved</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in slotRows" :key="row.slot">
              <td><b>{{ slotName(row.slot) }}</b></td>
              <template v-if="row.meta">
                <td>{{ row.meta.name }} <span class="muted">“{{ row.meta.handle }}”</span></td>
                <td>Day {{ row.meta.day + 1 }} · {{ formatShortDate(row.meta.day) }} <span class="muted">· Act {{ roman(row.meta.act) }}</span></td>
                <td :title="new Date(row.meta.savedAt).toLocaleString()">{{ agoLabel(row.meta.savedAt) }}</td>
              </template>
              <td v-else colspan="3" class="muted">— empty —</td>
              <td class="acts">
                <button
                  type="button"
                  class="btn small"
                  :disabled="row.slot === 'auto'"
                  :title="row.slot === 'auto' ? 'The autosave is written every 20 seconds' : `Save to ${slotName(row.slot)}`"
                  @click="saveTo(row.slot, row.meta)"
                >
                  Save
                </button>
                <button v-if="row.meta" type="button" class="btn small" @click="loadFrom(row.slot, row.meta)">Load</button>
                <button v-if="row.meta && row.slot !== 'auto'" type="button" class="btn small danger" :title="`Delete ${slotName(row.slot)}`" @click="remove(row.slot, row.meta)">✕</button>
              </td>
            </tr>
          </tbody>
        </table>
        <p class="muted note">The game autosaves every 20 seconds, when you switch tabs and when you quit.</p>
      </div>

      <div class="group">
        <div class="group-title">Export save code</div>
        <p class="muted">A save code carries your whole life — choices, debts, secrets — to another browser or computer.</p>
        <textarea ref="exportBox" class="code" rows="3" readonly :value="exported" placeholder="Click “Generate code”…" aria-label="Exported save code" @focus="exportBox?.select()"></textarea>
        <div class="row">
          <button type="button" class="btn" @click="generate">Generate code</button>
          <button type="button" class="btn" :disabled="!exported" @click="copyCode">Copy to clipboard</button>
          <span v-if="copied" class="good">✓ Copied</span>
          <span v-else-if="exported" class="muted">{{ exported.length.toLocaleString() }} characters</span>
        </div>
      </div>

      <div class="group">
        <div class="group-title">Import save code</div>
        <label class="muted" for="sys-import">Paste a code to replace the current game:</label>
        <textarea id="sys-import" v-model="importText" class="code" rows="3" spellcheck="false"></textarea>
        <div class="row">
          <button type="button" class="btn primary" :disabled="!importText.trim()" @click="importCode">Import</button>
          <span v-if="importError" class="bad">{{ importError }}</span>
        </div>
      </div>
    </div>

    <!-- SETTINGS -->
    <div v-else-if="tab === 'settings'" class="pane scroll">
      <div class="group">
        <div class="group-title">Gameplay</div>
        <label class="opt">
          <input v-model="state.settings.autoPauseDialogs" type="checkbox" />
          <span><b>Pause for story scenes</b><small>Time stops when a conversation or important message arrives.</small></span>
        </label>
        <label class="opt">
          <input v-model="state.settings.showRollMath" type="checkbox" />
          <span><b>Show dice math</b><small>Display the d20 roll, modifiers and DC on every skill check.</small></span>
        </label>
      </div>

      <div class="group">
        <div class="group-title">Display</div>
        <div class="opt skins" role="radiogroup" aria-label="Desktop style">
          <label class="skin" :class="{ on: skin === 'luna' }">
            <input v-model="skin" type="radio" name="skin" value="luna" />
            <span class="swatch luna" aria-hidden="true"><i></i></span>
            <span><b>Luna</b><small>Blue, glossy, very 2001.</small></span>
          </label>
          <label class="skin" :class="{ on: skin === 'classic' }">
            <input v-model="skin" type="radio" name="skin" value="classic" />
            <span class="swatch classic" aria-hidden="true"><i></i></span>
            <span><b>Classic</b><small>Grey bevels, the way the '90s intended.</small></span>
          </label>
        </div>
        <label class="opt">
          <input v-model="state.settings.crt" type="checkbox" />
          <span><b>CRT scanlines</b><small>A faint scanline and vignette overlay, like your 14" monitor.</small></span>
        </label>
      </div>

      <div class="group">
        <div class="group-title">Sound</div>
        <div class="opt">
          <label class="opt inline">
            <input v-model="state.settings.sound" type="checkbox" />
            <span><b>Notification sounds</b><small>Little chimes for mail, money, trouble and quests.</small></span>
          </label>
          <span class="grow"></span>
          <button type="button" class="btn small" @click="testSound">▶ Test</button>
        </div>
      </div>

      <div class="group">
        <div class="group-title">Windows</div>
        <div class="row wrap">
          <button type="button" class="btn" @click="cascade">Cascade windows</button>
          <button type="button" class="btn" @click="resetWindows">Close all windows</button>
        </div>
        <p class="muted note">Shortcuts: <b>Space</b> pause/resume · <b>1–4</b> speed 1×/2×/5×/10× · <b>Esc</b> close the active window.</p>
      </div>
    </div>

    <!-- STATISTICS -->
    <div v-else-if="tab === 'stats'" class="pane scroll">
      <div class="cols">
        <div class="group">
          <div class="group-title">{{ state.player.name }} “{{ state.player.handle }}”</div>
          <table class="table kv">
            <tbody>
              <tr><th>Age</th><td>{{ age }}</td></tr>
              <tr><th>Date</th><td>{{ formatDate(state.time.day) }}</td></tr>
              <tr><th>Days played</th><td>{{ state.time.day }}</td></tr>
              <tr><th>Hours lived</th><td>{{ state.time.totalHours.toLocaleString() }}</td></tr>
              <tr><th>Background</th><td>{{ background }}</td></tr>
              <tr><th>Traits</th><td>{{ traitNames }}</td></tr>
              <tr><th>Chapter</th><td>Act {{ roman(state.vars.act ?? 1) }}</td></tr>
              <tr><th>People met</th><td>{{ peopleMet }}</td></tr>
              <tr><th>Started</th><td>{{ startedOn }}</td></tr>
            </tbody>
          </table>
        </div>
        <div class="group">
          <div class="group-title">Lifetime totals</div>
          <table class="table kv">
            <tbody>
              <tr><th>Money earned</th><td class="money">{{ money(t.earned) }}</td></tr>
              <tr><th>Money spent</th><td>{{ money(t.spent) }}</td></tr>
              <tr><th>Net</th><td :class="t.earned - t.spent >= 0 ? 'good' : 'bad'">{{ money(t.earned - t.spent) }}</td></tr>
              <tr><th>Hacks</th><td>{{ t.hacksDone }} done · {{ t.hacksFailed }} failed<span v-if="hacksTotal" class="muted"> ({{ Math.round((t.hacksDone / hacksTotal) * 100) }}%)</span></td></tr>
              <tr><th>Freelance gigs</th><td>{{ t.gigsDone }}</td></tr>
              <tr><th>Skill checks</th><td>{{ t.checksPassed }} passed · {{ t.checksFailed }} failed<span v-if="checksTotal" class="muted"> ({{ checkRate }}%)</span></td></tr>
              <tr><th>Quests</th><td>{{ questsDone }} completed · {{ questsFailed }} failed</td></tr>
              <tr><th>Police raids</th><td :class="{ heat: t.raids > 0 }">{{ t.raids }}</td></tr>
              <tr><th>Days in custody</th><td>{{ t.daysJailed }}</td></tr>
            </tbody>
          </table>
        </div>
      </div>
      <div class="group">
        <div class="group-title">Endings discovered<template v-if="endingsTotal > 0"> — {{ endingsSeen.length }} of {{ endingsTotal }}</template></div>
        <div v-if="endingsSeen.length" class="endings">
          <span v-for="e in endingsSeen" :key="e.id" class="pill" :class="e.tone ? TONE_PILL[e.tone] : ''">{{ e.title }}</span>
        </div>
        <p v-else class="muted">None yet. Port Lumen has plenty of ways for this to end — and you'll only see one at a time.</p>
        <div v-if="endingsTotal > endingsSeen.length" class="locked muted" aria-hidden="true">
          <span v-for="i in endingsTotal - endingsSeen.length" :key="i" class="lock">???</span>
        </div>
      </div>
    </div>

    <!-- EVENT LOG -->
    <div v-else class="pane log-pane">
      <div class="row wrap filters">
        <button type="button" class="btn small" :title="allOn ? 'Hide every kind' : 'Show every kind'" @click="setAll(!allOn)">{{ allOn ? 'Clear' : 'Show all' }}</button>
        <button
          v-for="k in LOG_KINDS"
          :key="k"
          type="button"
          class="kind"
          :class="{ on: kindOn[k] }"
          :style="{ '--k': KIND_META[k].color }"
          :aria-pressed="kindOn[k]"
          @click="toggleKind(k)"
        >
          {{ KIND_META[k].label }} <span class="muted">{{ counts[k] }}</span>
        </button>
        <span class="grow"></span>
        <input v-model="search" type="text" class="search" placeholder="Search…" aria-label="Search the log" />
      </div>
      <div class="list log">
        <div v-for="{ i, e } in entries" :key="i" class="log-row">
          <span class="log-when">{{ formatShortDate(e.day) }} {{ formatClock(e.hour) }}</span>
          <span class="log-kind" :style="{ '--k': KIND_META[e.kind].color }">{{ KIND_META[e.kind].glyph }}</span>
          <span class="log-text">{{ e.text }}</span>
        </div>
        <p v-if="entries.length === 0" class="muted empty">{{ state.log.length ? 'Nothing matches those filters.' : 'Nothing has happened yet. Give it an hour.' }}</p>
      </div>
      <div class="statusbar muted">{{ entries.length }} of {{ state.log.length }} entries · newest first · the log keeps the last 250</div>
    </div>
  </div>
</template>

<style scoped>
.system {
  gap: 0;
}
.tabs {
  flex: none;
}
.emo {
  font-family: var(--font-emoji);
}
.pane {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 8px;
  background: var(--panel-bg);
  border: 1px solid var(--panel-border);
  border-top: 0;
}
.note {
  margin: 6px 0 0;
  font-size: 11px;
}
.slots td {
  vertical-align: middle;
}
.acts {
  white-space: nowrap;
  text-align: right;
}
.acts .btn + .btn {
  margin-left: 3px;
}
.code {
  width: 100%;
  resize: vertical;
  font: 11px var(--font-mono);
  word-break: break-all;
  margin: 4px 0 6px;
}

/* Settings */
.opt {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 4px 0;
}
.opt > span,
.opt.inline > span {
  display: flex;
  flex-direction: column;
  gap: 1px;
}
.opt small {
  color: var(--muted);
  font-size: 11px;
}
.opt.inline {
  padding: 0;
}
.opt input[type='checkbox'],
.opt input[type='radio'] {
  margin-top: 2px;
}
.opt.sub {
  align-items: center;
  padding-left: 22px;
}
.opt.sub.disabled {
  opacity: 0.55;
}
.skins {
  gap: 10px;
}
.skin {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  border: 1px solid var(--panel-border);
  border-radius: var(--radius);
  background: var(--panel-bg);
  cursor: pointer;
}
.skin.on {
  border-color: var(--sel-bg);
  box-shadow: inset 0 0 0 1px var(--sel-bg);
}
.skin > span:last-child {
  display: flex;
  flex-direction: column;
}
.skin small {
  color: var(--muted);
  font-size: 11px;
}
.swatch {
  flex: none;
  width: 46px;
  height: 34px;
  border: 1px solid #555;
  position: relative;
}
.swatch i {
  position: absolute;
  left: 6px;
  right: 6px;
  top: 6px;
  bottom: 6px;
}
.swatch.luna {
  background: linear-gradient(#3a78c9, #9cc8f0);
}
.swatch.luna i {
  background: #ece9d8;
  border: 2px solid #0831d9;
  border-top: 6px solid #0058ee;
  border-radius: 3px 3px 0 0;
}
.swatch.classic {
  background: #008080;
}
.swatch.classic i {
  background: #c0c0c0;
  border-top: 5px solid #000080;
  box-shadow:
    inset -1px -1px #0a0a0a,
    inset 1px 1px #fff;
}

/* Statistics */
.cols {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}
.kv th {
  width: 42%;
  color: var(--muted);
  background: none;
  border-bottom: 1px solid #eee;
}
.kv td {
  font-weight: bold;
}
.endings {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}
.locked {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 6px;
}
.lock {
  padding: 0 6px;
  border: 1px dashed #bbb;
  border-radius: 8px;
  font-size: 11px;
  line-height: 16px;
}

/* Event log */
.log-pane {
  flex: 1;
  min-height: 0;
}
.filters {
  gap: 4px;
}
.kind {
  padding: 1px 8px;
  border: 1px solid var(--panel-border);
  border-left: 4px solid var(--k);
  border-radius: 10px;
  background: #f1f1ec;
  font: inherit;
  font-size: 11px;
  cursor: pointer;
  opacity: 0.55;
}
.kind.on {
  opacity: 1;
  background: #fff;
  font-weight: bold;
}
.search {
  width: 140px;
}
.log {
  flex: 1;
  min-height: 0;
  padding: 2px 0;
}
.log-row {
  display: flex;
  gap: 8px;
  align-items: baseline;
  padding: 2px 8px;
  border-bottom: 1px solid #f0f0f0;
  line-height: 1.4;
}
.log-when {
  flex: none;
  width: 116px;
  color: var(--muted);
  font-size: 11px;
  font-variant-numeric: tabular-nums;
}
.log-kind {
  flex: none;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--k);
  color: #fff;
  font: bold 10px/16px var(--font-ui);
  text-align: center;
}
.log-text {
  flex: 1;
  min-width: 0;
  word-break: break-word;
}
.empty {
  padding: 12px;
  font-style: italic;
}
.statusbar {
  flex: none;
  font-size: 11px;
  padding: 2px 4px 0;
}
@media (max-width: 600px) {
  .cols {
    grid-template-columns: 1fr;
  }
}
</style>
