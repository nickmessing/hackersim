<script setup lang="ts">
/**
 * "Mail" — an Outlook-Express-style client for mail-channel story threads. Inbox holds threads
 * that still need you (plus the one you're reading), Archive holds finished ones. The reading
 * pane shows period headers and the thread itself via ThreadView (variant mail).
 */
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { formatClock, formatDate, sceneOf, type ThreadState } from '@/engine'
import Avatar from '@/ui/components/Avatar.vue'
import { useGame } from '@/ui/game'
import ThreadView from '@/ui/story/ThreadView.vue'
import {
  byNewest,
  expiresIn,
  expiryLabel,
  formatIdentity,
  isLive,
  mailIdentity,
  playerSpeaker,
  senderOf,
  threadStamp,
} from '@/ui/story/storyKit'

const props = defineProps<{ threadUid?: number }>()
const state = useGame()

type Folder = 'inbox' | 'archive'
const folder = ref<Folder>('inbox')
const selected = ref<number | null>(null)
/** The thread being read stays in the Inbox list until you move on, even once it's finished. */
const sticky = ref<number | null>(null)
const status = ref('')
const listEl = ref<HTMLElement | null>(null)
let statusTimer = 0

interface Row {
  uid: number
  thread: ThreadState
  from: string
  subject: string
  date: string
  icon: string
  iconTitle: string
  unread: boolean
  expires: number | null
}

const mail = computed(() => state.threads.filter(t => t.channel === 'mail'))
const unread = computed(() => mail.value.filter(t => t.status === 'unread').length)
const awaiting = computed(() => mail.value.filter(t => t.status === 'open').length)

function rowOf(t: ThreadState): Row {
  const scene = sceneOf(t)
  const from = senderOf(state, scene)
  let icon = '✓'
  let iconTitle = 'Finished'
  if (t.status === 'unread') {
    icon = '✉'
    iconTitle = 'Unread'
  } else if (t.status === 'open') {
    icon = '↩'
    iconTitle = 'Waiting for your reply'
  } else if (t.status === 'expired') {
    icon = '⌛'
    iconTitle = 'Expired — you never replied'
  }
  return {
    uid: t.uid,
    thread: t,
    from: mailIdentity(from).name,
    subject: scene?.title ?? '(no subject)',
    date: threadStamp(t),
    icon,
    iconTitle,
    unread: t.status === 'unread',
    expires: expiresIn(state, t, scene),
  }
}

const inboxRows = computed(() => mail.value.filter(t => isLive(t) || t.uid === sticky.value).sort(byNewest).map(rowOf))
const archiveRows = computed(() => mail.value.filter(t => !isLive(t) && t.uid !== sticky.value).sort(byNewest).map(rowOf))
const rows = computed(() => (folder.value === 'inbox' ? inboxRows.value : archiveRows.value))

const current = computed(() => (selected.value === null ? undefined : mail.value.find(t => t.uid === selected.value)))
const currentScene = computed(() => (current.value ? sceneOf(current.value) : undefined))
const headers = computed(() => {
  const t = current.value
  if (!t) return null
  const sc = currentScene.value
  const from = senderOf(state, sc)
  return {
    from,
    fromText: formatIdentity(mailIdentity(from)),
    toText: formatIdentity(mailIdentity(playerSpeaker(state))),
    date: `${formatDate(t.receivedDay)} ${formatClock(t.receivedHour)}`,
    subject: sc?.title ?? '(no subject)',
    expires: expiresIn(state, t, sc),
  }
})

function select(uid: number): void {
  selected.value = uid
  sticky.value = folder.value === 'inbox' ? uid : null
}

function setFolder(f: Folder): void {
  if (folder.value === f) return
  folder.value = f
  selected.value = null
  sticky.value = null
}

function nextUnread(): void {
  const r = inboxRows.value.find(x => x.unread && x.uid !== selected.value)
  if (!r) return
  folder.value = 'inbox'
  select(r.uid)
  void nextTick(() => listEl.value?.querySelector('tr.selected')?.scrollIntoView({ block: 'nearest' }))
}

/** ThreadView "Done": move on to the next message that needs you. */
function onDone(): void {
  const next = inboxRows.value.find(x => x.uid !== selected.value && isLive(x.thread))
  if (next) select(next.uid)
  else {
    selected.value = null
    sticky.value = null
  }
}

function sendRecv(): void {
  window.clearTimeout(statusTimer)
  status.value = 'Connecting to mail.northlink.net… (the modem screams)'
  statusTimer = window.setTimeout(() => {
    status.value = unread.value > 0 ? `Connected. You have ${unread.value} unread message${unread.value === 1 ? '' : 's'}.` : 'Connected. No new messages on the server.'
    statusTimer = window.setTimeout(() => {
      status.value = ''
    }, 4000)
  }, 1100)
}

function onListKey(e: KeyboardEvent): void {
  if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return
  const list = rows.value
  if (list.length === 0) return
  e.preventDefault()
  const i = list.findIndex(r => r.uid === selected.value)
  const j = i < 0 ? 0 : Math.max(0, Math.min(list.length - 1, i + (e.key === 'ArrowDown' ? 1 : -1)))
  const r = list[j]
  if (r) select(r.uid)
  void nextTick(() => listEl.value?.querySelector('tr.selected')?.scrollIntoView({ block: 'nearest' }))
}

watch(
  () => props.threadUid,
  uid => {
    if (uid === undefined) return
    const t = mail.value.find(x => x.uid === uid)
    if (!t) return
    folder.value = isLive(t) ? 'inbox' : 'archive'
    select(uid)
  },
  { immediate: true },
)

onMounted(() => {
  if (selected.value !== null) return
  const first = inboxRows.value.find(r => r.unread)
  if (first) select(first.uid)
})

onBeforeUnmount(() => {
  window.clearTimeout(statusTimer)
})
</script>

<template>
  <div class="app mail">
    <div class="toolbar">
      <button type="button" class="tb" :disabled="unread === 0" title="Open the next unread message" @click="nextUnread">
        <span class="tb-ic" aria-hidden="true">📨</span><span>Next unread</span>
      </button>
      <button type="button" class="tb" title="Check the server for new mail" @click="sendRecv">
        <span class="tb-ic" aria-hidden="true">🔄</span><span>Send/Recv</span>
      </button>
      <div class="grow"></div>
      <div class="brand">NorthLink <b>Mail</b></div>
    </div>

    <div class="panes">
      <nav class="folders" aria-label="Folders">
        <div class="f-root">🖥 Local Folders</div>
        <button type="button" class="folder" :class="{ active: folder === 'inbox' }" @click="setFolder('inbox')">
          📥 Inbox <b v-if="unread > 0">({{ unread }})</b>
        </button>
        <button type="button" class="folder" :class="{ active: folder === 'archive' }" @click="setFolder('archive')">
          🗄 Archive <span v-if="archiveRows.length > 0" class="muted">{{ archiveRows.length }}</span>
        </button>
        <div class="f-help muted">
          Finished conversations move to the Archive once you leave them.
        </div>
      </nav>

      <section class="right">
        <div ref="listEl" class="list-pane" tabindex="0" aria-label="Messages" @keydown="onListKey">
          <table v-if="rows.length > 0" class="table msgs">
            <thead>
              <tr>
                <th class="c-ic" aria-label="Status"></th>
                <th class="c-from">From</th>
                <th>Subject</th>
                <th class="c-date">Received</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="r in rows"
                :key="r.uid"
                :class="{ selected: r.uid === selected, unread: r.unread, dead: r.thread.status === 'expired' }"
                @click="select(r.uid)"
              >
                <td class="c-ic" :title="r.iconTitle">{{ r.icon }}</td>
                <td class="c-from">{{ r.from }}</td>
                <td class="c-subj">
                  {{ r.subject }}
                  <span v-if="r.expires !== null" class="pill warn" :title="expiryLabel(r.expires)">⏳ {{ r.expires }}d</span>
                </td>
                <td class="c-date">{{ r.date }}</td>
              </tr>
            </tbody>
          </table>
          <div v-else class="empty">
            <template v-if="folder === 'inbox'">No new mail. Even the spammers forgot you.</template>
            <template v-else>The Archive is empty. Finished conversations get filed here.</template>
          </div>
        </div>

        <div class="preview">
          <template v-if="current && headers">
            <div class="hdr">
              <Avatar v-if="headers.from.kind === 'npc'" :npc="headers.from.id" :size="34" />
              <Avatar v-else :text="headers.from.avatar" :color="headers.from.color" :size="34" />
              <table class="hdr-table">
                <tbody>
                  <tr>
                    <th>From:</th>
                    <td>{{ headers.fromText }}</td>
                  </tr>
                  <tr>
                    <th>To:</th>
                    <td>{{ headers.toText }}</td>
                  </tr>
                  <tr>
                    <th>Date:</th>
                    <td>{{ headers.date }}</td>
                  </tr>
                  <tr>
                    <th>Subject:</th>
                    <td>
                      <b>{{ headers.subject }}</b>
                      <span v-if="headers.expires !== null" class="pill warn">⏳ {{ expiryLabel(headers.expires) }}</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div class="body">
              <ThreadView :key="current.uid" :uid="current.uid" variant="mail" @done="onDone" />
            </div>
          </template>
          <div v-else class="empty big">
            <div class="env" aria-hidden="true">✉</div>
            <div>Select a message to read it.</div>
            <div v-if="unread > 0" class="muted">{{ unread }} unread in your Inbox.</div>
          </div>
        </div>
      </section>
    </div>

    <div class="statusbar">
      <span class="cell">{{ rows.length }} message{{ rows.length === 1 ? '' : 's' }}, {{ unread }} unread<template v-if="awaiting > 0">, {{ awaiting }} awaiting reply</template></span>
      <span class="cell grow">{{ status }}</span>
      <span class="cell">🌐 Working Online</span>
    </div>
  </div>
</template>

<style scoped>
.app.mail {
  padding: 0;
  gap: 0;
  container-type: inline-size;
}
.toolbar {
  flex: none;
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 3px 6px;
  border-bottom: 1px solid var(--panel-border);
  background: linear-gradient(var(--panel-bg), var(--win-bg));
}
.tb {
  font: inherit;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1px;
  min-width: 64px;
  padding: 2px 6px;
  border: 1px solid transparent;
  border-radius: var(--radius);
  background: transparent;
  cursor: pointer;
  font-size: 11px;
  color: var(--win-fg);
}
.tb:hover:not(:disabled) {
  border-color: var(--panel-border);
  background: var(--panel-bg);
}
.tb:disabled {
  color: var(--btn-disabled-fg);
  cursor: default;
}
.tb:disabled .tb-ic {
  filter: grayscale(1);
  opacity: 0.5;
}
.tb-ic {
  font-size: 16px;
  line-height: 1.1;
}
.brand {
  font-size: 14px;
  color: var(--info);
  font-style: italic;
  padding-right: 4px;
}
.panes {
  flex: 1;
  min-height: 0;
  display: flex;
}
.folders {
  flex: none;
  width: 138px;
  display: flex;
  flex-direction: column;
  gap: 1px;
  padding: 6px 4px;
  background: var(--panel-bg);
  border-right: 1px solid var(--panel-border);
}
.f-root {
  font-weight: bold;
  padding: 2px 4px 4px;
}
.folder {
  font: inherit;
  text-align: left;
  padding: 3px 6px 3px 14px;
  border: 1px solid transparent;
  background: transparent;
  cursor: pointer;
  color: var(--win-fg);
  border-radius: 2px;
}
.folder:hover {
  background: color-mix(in srgb, var(--sel-bg) 10%, var(--panel-bg));
}
.folder.active {
  background: var(--sel-bg);
  color: var(--sel-fg);
}
.folder.active .muted {
  color: var(--sel-fg);
}
.f-help {
  margin-top: auto;
  font-size: 10px;
  line-height: 1.35;
  padding: 4px;
}
.right {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}
.list-pane {
  flex: 0 0 32%;
  min-height: 80px;
  overflow: auto;
  background: var(--panel-bg);
  border-bottom: 3px double var(--panel-border);
  outline: none;
}
.list-pane:focus-visible {
  box-shadow: inset 0 0 0 1px var(--sel-bg);
}
.msgs {
  table-layout: fixed;
}
.msgs th {
  position: sticky;
  top: 0;
  z-index: 1;
}
.msgs td {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  cursor: pointer;
  padding: 2px 6px;
}
.msgs tr:hover td {
  background: color-mix(in srgb, var(--sel-bg) 8%, var(--panel-bg));
}
.msgs tr.selected td {
  background: var(--sel-bg);
  color: var(--sel-fg);
}
.msgs tr.unread td {
  font-weight: bold;
}
.msgs tr.dead td {
  color: var(--muted);
  font-style: italic;
}
.msgs tr.selected.dead td {
  color: var(--sel-fg);
}
.c-ic {
  width: 30px;
  text-align: center !important;
  text-overflow: clip !important;
  padding: 2px 0 !important;
}
.c-from {
  width: 30%;
}
.c-date {
  width: 118px;
}
.c-subj .pill {
  margin-left: 4px;
  font-weight: normal;
}
.preview {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  background: var(--panel-bg);
}
.hdr {
  flex: none;
  display: flex;
  gap: 8px;
  align-items: flex-start;
  padding: 6px 8px;
  background: linear-gradient(var(--panel-alt), var(--win-bg));
  border-bottom: 1px solid var(--panel-border);
}
.hdr-table {
  border-collapse: collapse;
  font-size: 11px;
  min-width: 0;
}
.hdr-table th {
  text-align: right;
  font-weight: bold;
  padding: 0 6px 0 0;
  color: var(--muted);
  vertical-align: top;
  white-space: nowrap;
}
.hdr-table td {
  padding: 0;
  word-break: break-word;
}
.hdr-table .pill {
  margin-left: 6px;
}
.body {
  flex: 1;
  min-height: 0;
  padding: 8px 10px 8px;
}
.empty {
  padding: 18px;
  text-align: center;
  color: var(--muted);
  font-style: italic;
}
.empty.big {
  margin: auto;
  display: flex;
  flex-direction: column;
  gap: 4px;
  align-items: center;
}
.env {
  font-size: 40px;
  opacity: 0.35;
  font-style: normal;
}
.statusbar {
  flex: none;
  display: flex;
  gap: 2px;
  padding: 2px;
  font-size: 11px;
  border-top: 1px solid var(--panel-border);
  background: var(--win-bg);
}
.statusbar .cell {
  padding: 1px 6px;
  border: 1px solid;
  border-color: var(--panel-border) var(--panel-bg) var(--panel-bg) var(--panel-border);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
@container (max-width: 560px) {
  .folders {
    width: 100px;
  }
  .f-help {
    display: none;
  }
}
</style>
