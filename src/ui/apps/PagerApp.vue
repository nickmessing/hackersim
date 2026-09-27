<script setup lang="ts">
/**
 * "BuddyPager" — an ICQ/AIM-style messenger. Buddy list = met NPCs with a handle (plus anyone
 * who has paged you), grouped by a flavor presence (clock + fate). The conversation pane stacks
 * every chat-channel thread from that buddy in order, each rendered by ThreadView (variant chat).
 * New pages trigger a sound-free "Uh-oh!" nudge.
 */
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { C, sceneOf, type ThreadState } from '@/engine'
import Avatar from '@/ui/components/Avatar.vue'
import RichText from '@/ui/components/RichText.vue'
import { useGame } from '@/ui/game'
import ThreadView from '@/ui/story/ThreadView.vue'
import { PRESENCE_LABEL, presenceOf, type Presence, type PresenceStatus } from '@/ui/story/presence'
import { hashStr, isLive, playerSpeaker, receivedAt, speakerOf, type Speaker } from '@/ui/story/storyKit'

const props = defineProps<{ npc?: string }>()
const state = useGame()

interface Buddy {
  key: string
  npc: string | null
  speaker: Speaker
  presence: Presence
  unread: number
  waiting: number
  threads: ThreadState[]
  last: number
}

const MAX_SESSIONS = 8

const selectedKey = ref<string | null>(null)
const showAll = ref(false)
const showProfile = ref(false)
const collapsed = ref<Record<string, boolean>>({})
const convoEl = ref<HTMLElement | null>(null)
const nudgeKey = ref<string | null>(null)
const nudgeText = ref('')
const shaking = ref(false)
let nudgeTimer = 0
let shakeTimer = 0

const me = computed(() => playerSpeaker(state))
const uin = computed(() => 100_000_000 + (hashStr(`uin:${state.player.handle}:${state.seed}`) % 899_999_999))

const chats = computed(() => state.threads.filter(t => t.channel === 'chat'))

function keyOf(t: ThreadState): string {
  const from = sceneOf(t)?.from
  if (from && C.npcs.has(from)) return from
  return `label:${from ?? 'Unknown'}`
}

function makeBuddy(key: string): Buddy {
  const npc = key.startsWith('label:') ? null : key
  const speaker = speakerOf(state, npc ?? key.slice(6), undefined)
  return { key, npc, speaker, presence: { status: 'offline', note: 'Offline', forever: false }, unread: 0, waiting: 0, threads: [], last: -1 }
}

const buddies = computed<Buddy[]>(() => {
  const map = new Map<string, Buddy>()
  const ensure = (key: string): Buddy => {
    let b = map.get(key)
    if (!b) {
      b = makeBuddy(key)
      map.set(key, b)
    }
    return b
  }
  for (const [id, s] of Object.entries(state.npcs)) {
    if (s.met && C.npcs.get(id)?.handle) ensure(id)
  }
  const ordered = [...chats.value].sort((a, b) => a.uid - b.uid)
  for (const t of ordered) {
    const b = ensure(keyOf(t))
    b.threads.push(t)
    if (t.status === 'unread') b.unread++
    if (isLive(t)) b.waiting++
    b.last = Math.max(b.last, receivedAt(t))
  }
  for (const b of map.values()) {
    b.presence = b.npc
      ? presenceOf(state, b.npc, b.waiting > 0)
      : b.waiting > 0
        ? { status: 'online', note: 'Online — not on your list', forever: false }
        : { status: 'offline', note: 'Offline — not on your list', forever: false }
  }
  return [...map.values()]
})

const GROUPS: PresenceStatus[] = ['online', 'away', 'offline']
const groups = computed(() =>
  GROUPS.map(status => ({
    status,
    list: buddies.value
      .filter(b => b.presence.status === status)
      .sort((a, b) => b.unread - a.unread || b.last - a.last || a.speaker.handle.localeCompare(b.speaker.handle)),
  })).filter(g => g.list.length > 0),
)
const onlineCount = computed(() => buddies.value.filter(b => b.presence.status === 'online').length)
const totalUnread = computed(() => buddies.value.reduce((s, b) => s + b.unread, 0))

const selected = computed<Buddy | undefined>(() => {
  const key = selectedKey.value
  if (!key) return undefined
  const found = buddies.value.find(b => b.key === key)
  if (found) return found
  if (!C.npcs.has(key)) return undefined
  const b = makeBuddy(key)
  b.presence = presenceOf(state, key, false)
  return b
})
const selectedDef = computed(() => (selected.value?.npc ? C.npcs.get(selected.value.npc) : undefined))
const selectedFaction = computed(() => (selectedDef.value?.faction ? C.factions.get(selectedDef.value.faction) : undefined))
const selectedAffinity = computed(() => {
  const id = selected.value?.npc
  const s = id ? state.npcs[id] : undefined
  return s?.met ? Math.round(s.affinity) : null
})
const sessions = computed(() => {
  const list = selected.value?.threads ?? []
  return showAll.value ? list : list.slice(-MAX_SESSIONS)
})
const hiddenSessions = computed(() => (selected.value?.threads.length ?? 0) - sessions.value.length)

function select(key: string): void {
  if (selectedKey.value !== key) {
    showAll.value = false
    showProfile.value = false
  }
  selectedKey.value = key
  void nextTick(() => {
    scrollConvo(false)
  })
}

function toggleGroup(status: string): void {
  collapsed.value = { ...collapsed.value, [status]: !collapsed.value[status] }
}

function scrollConvo(smooth: boolean): void {
  const el = convoEl.value
  if (!el) return
  el.scrollTo({ top: el.scrollHeight, behavior: smooth ? 'smooth' : 'auto' })
}

function onThreadChanged(): void {
  void nextTick(() => {
    scrollConvo(true)
  })
}

function statusGlyph(s: PresenceStatus): string {
  return s === 'online' ? '●' : s === 'away' ? '◐' : '○'
}

// ── "Uh-oh!" nudge on new pages ─────────────────────────────────────────────────────────────
let seenMax = chats.value.reduce((m, t) => Math.max(m, t.uid), 0)

function nudge(key: string, handle: string): void {
  window.clearTimeout(nudgeTimer)
  window.clearTimeout(shakeTimer)
  nudgeKey.value = key
  nudgeText.value = `${handle} paged you!`
  shaking.value = true
  shakeTimer = window.setTimeout(() => {
    shaking.value = false
  }, 600)
  nudgeTimer = window.setTimeout(() => {
    nudgeKey.value = null
  }, 2800)
}

watch(
  () => chats.value.length,
  () => {
    const fresh = chats.value.filter(t => t.uid > seenMax)
    if (fresh.length === 0) return
    seenMax = fresh.reduce((m, t) => Math.max(m, t.uid), seenMax)
    const newest = fresh[fresh.length - 1]
    if (!newest) return
    const key = keyOf(newest)
    const b = buddies.value.find(x => x.key === key)
    nudge(key, b?.speaker.handle ?? 'Someone')
    if (selectedKey.value === null) select(key)
    else if (selectedKey.value === key) onThreadChanged()
  },
)

watch(
  () => props.npc,
  id => {
    if (id) select(C.npcs.has(id) ? id : `label:${id}`)
  },
  { immediate: true },
)

onMounted(() => {
  if (selectedKey.value !== null) return
  const withUnread = buddies.value.filter(b => b.unread > 0).sort((a, b) => b.last - a.last)[0]
  const recent = [...buddies.value].filter(b => b.threads.length > 0).sort((a, b) => b.last - a.last)[0]
  const pick = withUnread ?? recent
  if (pick) select(pick.key)
})

onBeforeUnmount(() => {
  window.clearTimeout(nudgeTimer)
  window.clearTimeout(shakeTimer)
})
</script>

<template>
  <div class="app pager" :class="{ shaking }">
    <Transition name="nudge">
      <div v-if="nudgeKey" class="nudge" role="status">
        <b>Uh-oh!</b> {{ nudgeText }}
      </div>
    </Transition>

    <aside class="buddies">
      <div class="me">
        <Avatar :text="me.avatar" :color="me.color" :size="30" />
        <div class="me-info">
          <b>{{ me.handle }}</b>
          <div class="muted uin">UIN #{{ uin }}</div>
        </div>
        <span class="st online" title="You are online">● Online</span>
      </div>

      <div class="blist" role="listbox" aria-label="Buddy list">
        <template v-for="g in groups" :key="g.status">
          <button type="button" class="ghead" :aria-expanded="!collapsed[g.status]" @click="toggleGroup(g.status)">
            <span class="caret">{{ collapsed[g.status] ? '▸' : '▾' }}</span>
            {{ PRESENCE_LABEL[g.status] }} ({{ g.list.length }})
          </button>
          <template v-if="!collapsed[g.status]">
            <button
              v-for="b in g.list"
              :key="b.key"
              type="button"
              class="buddy"
              role="option"
              :aria-selected="b.key === selectedKey"
              :class="[b.presence.status, { selected: b.key === selectedKey, flash: b.key === nudgeKey, gone: b.presence.forever }]"
              :title="`${b.speaker.name}${b.speaker.role ? ` — ${b.speaker.role}` : ''}\n${b.presence.note}`"
              @click="select(b.key)"
            >
              <span class="st" :class="b.presence.status" aria-hidden="true">{{ statusGlyph(b.presence.status) }}</span>
              <span class="bname">{{ b.speaker.handle }}</span>
              <span v-if="b.unread > 0" class="badge" :title="`${b.unread} unread`">{{ b.unread }}</span>
              <span v-else-if="b.waiting > 0" class="waiting" title="Waiting for your reply">↩</span>
            </button>
          </template>
        </template>
        <div v-if="buddies.length === 0" class="bempty">
          Your buddy list is empty. Meet people — they'll show up here once you've swapped handles.
        </div>
      </div>

      <div class="bfoot muted">{{ onlineCount }} online<template v-if="totalUnread > 0"> · <b class="unread">{{ totalUnread }} new</b></template></div>
    </aside>

    <section class="convo">
      <template v-if="selected">
        <header class="chead">
          <Avatar v-if="selected.npc" :npc="selected.npc" :size="36" />
          <Avatar v-else :text="selected.speaker.avatar" :color="selected.speaker.color" :size="36" />
          <div class="chead-info">
            <div>
              <b class="chandle">{{ selected.speaker.handle }}</b>
              <span v-if="selected.speaker.name !== selected.speaker.handle" class="muted"> ({{ selected.speaker.name }})</span>
            </div>
            <div class="cstatus" :class="selected.presence.status">
              {{ statusGlyph(selected.presence.status) }} {{ selected.presence.note }}
            </div>
          </div>
          <button v-if="selectedDef" type="button" class="btn small" :aria-pressed="showProfile" @click="showProfile = !showProfile">
            ⓘ Profile
          </button>
        </header>

        <div v-if="showProfile && selectedDef" class="profile">
          <div class="row wrap">
            <b>{{ selectedDef.name }}</b>
            <span class="muted">· {{ selectedDef.role }}</span>
            <span v-if="selectedFaction" class="pill" :style="{ background: selectedFaction.color, color: '#fff' }">{{ selectedFaction.icon }} {{ selectedFaction.short }}</span>
            <span v-if="selectedAffinity !== null" class="pill story" title="How they feel about you (−100…100)">♥ {{ selectedAffinity }}</span>
          </div>
          <RichText :text="selectedDef.bio" />
        </div>

        <div ref="convoEl" class="cscroll">
          <button v-if="hiddenSessions > 0" type="button" class="btn small older" @click="showAll = true">
            Show {{ hiddenSessions }} earlier conversation{{ hiddenSessions === 1 ? '' : 's' }}
          </button>
          <ThreadView
            v-for="t in sessions"
            :key="t.uid"
            :uid="t.uid"
            variant="chat"
            layout="inline"
            class="session"
            @changed="onThreadChanged"
          />
          <div v-if="sessions.length === 0" class="cempty">
            <div class="big" aria-hidden="true">💬</div>
            <div>No messages with <b>{{ selected.speaker.handle }}</b> yet.</div>
            <div class="muted">{{ selected.presence.forever ? 'This account has gone quiet for good.' : 'Conversations start when they page you.' }}</div>
          </div>
        </div>
      </template>
      <div v-else class="cempty splash">
        <div class="logo" aria-hidden="true">✿</div>
        <div class="logo-text">Buddy<b>Pager</b></div>
        <div class="muted">
          <template v-if="buddies.length > 0">Pick a buddy to see your conversations. {{ onlineCount }} online right now.</template>
          <template v-else>Nobody to talk to yet. Get out there — or at least get online.</template>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.app.pager {
  position: relative;
  flex-direction: row;
  padding: 6px;
  gap: 6px;
}
.app.pager.shaking {
  animation: shake 0.55s ease-in-out;
}
@keyframes shake {
  0%,
  100% {
    transform: translate(0, 0);
  }
  15% {
    transform: translate(-5px, 1px);
  }
  30% {
    transform: translate(5px, -1px);
  }
  45% {
    transform: translate(-4px, 0);
  }
  60% {
    transform: translate(4px, 1px);
  }
  80% {
    transform: translate(-2px, 0);
  }
}
.nudge {
  position: absolute;
  z-index: 3;
  top: 10px;
  left: 50%;
  transform: translateX(-50%);
  padding: 5px 14px;
  border: 2px solid var(--good);
  border-radius: 14px;
  background: linear-gradient(var(--panel-bg), color-mix(in srgb, var(--good) 18%, var(--panel-bg)));
  box-shadow: var(--win-shadow);
  font-size: 13px;
  white-space: nowrap;
  pointer-events: none;
}
.nudge b {
  color: var(--good);
  font-size: 15px;
}
.nudge-enter-active {
  animation: pop 0.35s ease-out;
}
.nudge-leave-active {
  transition: opacity 0.4s ease;
}
.nudge-leave-to {
  opacity: 0;
}
@keyframes pop {
  0% {
    transform: translateX(-50%) scale(0.4);
    opacity: 0;
  }
  70% {
    transform: translateX(-50%) scale(1.12);
    opacity: 1;
  }
  100% {
    transform: translateX(-50%) scale(1);
  }
}

/* ── buddy list ─────────────────────────────────────────────────────── */
.buddies {
  flex: none;
  width: 190px;
  display: flex;
  flex-direction: column;
  border: 1px solid var(--panel-border);
  background: var(--panel-bg);
  min-height: 0;
}
.me {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px;
  background: linear-gradient(color-mix(in srgb, var(--good) 14%, var(--panel-bg)), var(--panel-bg));
  border-bottom: 1px solid var(--panel-border);
}
.me-info {
  flex: 1;
  min-width: 0;
  overflow: hidden;
}
.me-info b {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.uin {
  font-size: 10px;
}
.blist {
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: 2px 0;
}
.ghead {
  font: inherit;
  display: flex;
  align-items: center;
  gap: 4px;
  width: 100%;
  padding: 3px 6px;
  border: none;
  background: transparent;
  font-weight: bold;
  color: var(--info);
  cursor: pointer;
  text-align: left;
}
.caret {
  width: 10px;
  font-size: 10px;
}
.buddy {
  font: inherit;
  display: flex;
  align-items: center;
  gap: 6px;
  width: 100%;
  padding: 3px 8px 3px 18px;
  border: 1px solid transparent;
  background: transparent;
  cursor: pointer;
  color: var(--win-fg);
  text-align: left;
}
.buddy:hover {
  background: color-mix(in srgb, var(--sel-bg) 10%, var(--panel-bg));
}
.buddy:focus-visible {
  outline: 1px dotted var(--sel-bg);
  outline-offset: -2px;
}
.buddy.selected {
  background: var(--sel-bg);
  color: var(--sel-fg);
}
.buddy.selected .st {
  color: var(--sel-fg);
}
.buddy.offline:not(.selected) .bname {
  color: var(--muted);
}
.buddy.gone:not(.selected) .bname {
  font-style: italic;
  opacity: 0.7;
}
.buddy.flash {
  animation: flash 0.5s steps(2) 5;
}
@keyframes flash {
  50% {
    background: color-mix(in srgb, var(--good) 35%, var(--panel-bg));
  }
}
.bname {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.st {
  flex: none;
  font-size: 11px;
}
.st.online {
  color: var(--good);
}
.st.away {
  color: var(--warn);
}
.st.offline {
  color: var(--muted);
}
.badge {
  flex: none;
  min-width: 16px;
  padding: 0 4px;
  border-radius: 8px;
  background: var(--bad);
  color: #fff;
  font-size: 10px;
  font-weight: bold;
  text-align: center;
  line-height: 15px;
}
.waiting {
  flex: none;
  color: var(--warn);
  font-weight: bold;
}
.selected .waiting {
  color: var(--sel-fg);
}
.bempty {
  padding: 10px;
  color: var(--muted);
  font-style: italic;
  line-height: 1.4;
}
.bfoot {
  flex: none;
  padding: 3px 6px;
  border-top: 1px solid var(--panel-border);
  font-size: 11px;
  background: var(--panel-alt);
}
.bfoot .unread {
  color: var(--bad);
}

/* ── conversation ───────────────────────────────────────────────────── */
.convo {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  border: 1px solid var(--panel-border);
  background: var(--panel-bg);
  min-height: 0;
}
.chead {
  flex: none;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 5px 8px;
  border-bottom: 1px solid var(--panel-border);
  background: linear-gradient(var(--panel-alt), var(--win-bg));
}
.chead-info {
  flex: 1;
  min-width: 0;
}
.chandle {
  font-size: 13px;
}
.cstatus {
  font-size: 11px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.cstatus.online {
  color: var(--good);
}
.cstatus.away {
  color: var(--warn);
}
.cstatus.offline {
  color: var(--muted);
}
.profile {
  flex: none;
  max-height: 40%;
  overflow: auto;
  padding: 6px 8px;
  border-bottom: 1px solid var(--panel-border);
  background: var(--panel-alt);
  font-size: 11px;
}
.profile .row {
  margin-bottom: 4px;
}
.cscroll {
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: 4px 8px 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.older {
  align-self: center;
  margin: 4px 0;
}
.session {
  flex: none;
}
.cempty {
  margin: auto;
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 4px;
  align-items: center;
  padding: 16px;
}
.cempty .big {
  font-size: 34px;
  opacity: 0.4;
}
.splash .logo {
  font-size: 46px;
  color: var(--good);
  line-height: 1;
  text-shadow: 0 2px 0 color-mix(in srgb, var(--good) 40%, transparent);
}
.logo-text {
  font-size: 20px;
  color: var(--info);
  letter-spacing: 0.5px;
}
.logo-text b {
  color: var(--good);
}
@media (prefers-reduced-motion: reduce) {
  .app.pager.shaking,
  .buddy.flash,
  .nudge-enter-active {
    animation: none;
  }
}
</style>
