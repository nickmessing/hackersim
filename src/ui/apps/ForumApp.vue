<script setup lang="ts">
/**
 * "The Loft BBS" — a phpBB-era board. Boards list → topic list → topic. Topics mix authored
 * flavor threads (ForumThreadDef, from state.forum) with forum-channel story threads (rendered
 * by ThreadView, variant forum). The members-only warez board opens with Loft rep 20 or as soon
 * as something is posted there for you. The Jobs board points at the Operations app.
 */
import { computed, nextTick, ref, watch } from 'vue'
import { C, formatClock, formatDate, formatShortDate, renderText, sceneOf, type ForumBoard, type ThreadState } from '@/engine'
import { useGame } from '@/ui/game'
import { openApp } from '@/ui/wm'
import PostCard from '@/ui/story/PostCard.vue'
import ThreadView from '@/ui/story/ThreadView.vue'
import { BACK_ROOM_REP, BOARDS, LOFT_FACTION, boardMeta, playerPostCount, type BoardMeta } from '@/ui/story/bbs'
import { presenceOf } from '@/ui/story/presence'
import { hashStr, isLive, playerSpeaker, senderOf, speakerOf, type Speaker } from '@/ui/story/storyKit'

const props = defineProps<{ threadUid?: number; topic?: string; board?: string }>()
const state = useGame()

type TopicRef = { type: 'flavor'; id: string } | { type: 'story'; uid: number }
type View = { kind: 'index' } | { kind: 'board'; board: ForumBoard } | { kind: 'topic'; board: ForumBoard; ref: TopicRef }

interface Topic {
  key: string
  ref: TopicRef
  board: ForumBoard
  title: string
  author: Speaker
  lastAuthor: Speaker
  posts: number
  at: number
  day: number
  unread: boolean
  pinned: boolean
  story: boolean
  awaiting: boolean
  closed: boolean
}

const BANNER = [
  String.raw` _____  _               _              __  _`,
  String.raw`|_   _|| |__    ___    | |      ___   / _|| |_`,
  String.raw`  | |  | '_ \  / _ \   | |     / _ \ | |_ | __|`,
  String.raw`  | |  | | | ||  __/   | |___ | (_) ||  _|| |_`,
  String.raw`  |_|  |_| |_| \___|   |_____| \___/ |_|   \__|`,
].join('\n')

const CATEGORIES: { title: string; boards: ForumBoard[] }[] = [
  { title: 'The Scene', boards: ['general', 'security', 'warez'] },
  { title: 'Trading Post', boards: ['market', 'jobs'] },
  { title: 'The Lounge', boards: ['offtopic'] },
]

const view = ref<View>({ kind: 'index' })
const denied = ref<ForumBoard | null>(null)
const scrollEl = ref<HTMLElement | null>(null)

// ── Topics ───────────────────────────────────────────────────────────────────────────────────
function storyTopic(t: ThreadState): Topic | null {
  const sc = sceneOf(t)
  if (!sc) return null
  const author = senderOf(state, sc)
  const last = t.history[t.history.length - 1]
  const lastNode = last ? sc.nodes[last.node] : undefined
  const lastAuthor = last?.choice !== undefined ? playerSpeaker(state) : speakerOf(state, lastNode?.speaker, sc)
  const replies = t.history.filter(e => e.choice !== undefined).length
  return {
    key: `s:${t.uid}`,
    ref: { type: 'story', uid: t.uid },
    board: sc.board ?? 'general',
    title: sc.title,
    author,
    lastAuthor,
    posts: t.history.length + replies,
    at: t.receivedDay * 24 + t.receivedHour,
    day: t.receivedDay,
    unread: t.status === 'unread',
    pinned: false,
    story: true,
    awaiting: t.status === 'open',
    closed: !isLive(t),
  }
}

const topics = computed<Topic[]>(() => {
  const out: Topic[] = []
  for (const f of state.forum) {
    const def = C.forum.get(f.id)
    if (!def) continue
    const first = def.posts[0]
    const last = def.posts[def.posts.length - 1]
    out.push({
      key: `f:${f.id}`,
      ref: { type: 'flavor', id: f.id },
      board: def.board,
      title: def.title,
      author: speakerOf(state, first?.author ?? 'anonymous', undefined),
      lastAuthor: speakerOf(state, last?.author ?? first?.author ?? 'anonymous', undefined),
      posts: def.posts.length,
      at: f.day * 24 + 8 + (hashStr(f.id) % 15),
      day: f.day,
      unread: !f.read,
      pinned: def.pinned ?? false,
      story: false,
      awaiting: false,
      closed: false,
    })
  }
  for (const t of state.threads) {
    if (t.channel !== 'forum') continue
    const topic = storyTopic(t)
    if (topic) out.push(topic)
  }
  return out
})

function sortTopics(a: Topic, b: Topic): number {
  return Number(b.pinned) - Number(a.pinned) || Number(b.awaiting) - Number(a.awaiting) || b.at - a.at
}

const byBoard = computed(() => {
  const map = new Map<ForumBoard, Topic[]>()
  for (const b of BOARDS) map.set(b.id, [])
  for (const t of topics.value) {
    const list = map.get(t.board)
    if (list) list.push(t)
    else map.set(t.board, [t])
  }
  for (const list of map.values()) list.sort(sortTopics)
  return map
})

function topicsOf(board: ForumBoard): Topic[] {
  return byBoard.value.get(board) ?? []
}

const loftRep = computed(() => Math.round(state.factions[LOFT_FACTION] ?? 0))
const loftName = computed(() => C.factions.get(LOFT_FACTION)?.name ?? 'The Loft')

function isOpen(board: ForumBoard): boolean {
  if (board !== 'warez') return true
  return loftRep.value >= BACK_ROOM_REP || topicsOf('warez').length > 0
}

interface BoardRow {
  meta: BoardMeta
  open: boolean
  topics: number
  posts: number
  latest: Topic | undefined
  fresh: boolean
  awaiting: number
}

function boardRow(id: ForumBoard): BoardRow {
  const list = topicsOf(id)
  let latest: Topic | undefined
  for (const t of list) if (!latest || t.at > latest.at) latest = t
  return {
    meta: boardMeta(id),
    open: isOpen(id),
    topics: list.length,
    posts: list.reduce((s, t) => s + t.posts, 0),
    latest,
    fresh: list.some(t => t.unread),
    awaiting: list.filter(t => t.awaiting).length,
  }
}

const categories = computed(() => CATEGORIES.map(c => ({ title: c.title, rows: c.boards.map(boardRow) })))
const newPosts = computed(() => topics.value.filter(t => t.unread && isOpen(t.board)).length)
const offers = computed(() => state.contracts.board.length)

// ── Current topic ────────────────────────────────────────────────────────────────────────────
const currentBoard = computed<ForumBoard | null>(() => (view.value.kind === 'index' ? null : view.value.board))
const currentTopic = computed<Topic | undefined>(() => {
  const v = view.value
  if (v.kind !== 'topic') return undefined
  const key = v.ref.type === 'flavor' ? `f:${v.ref.id}` : `s:${v.ref.uid}`
  return topics.value.find(t => t.key === key)
})
const flavorPosts = computed(() => {
  const v = view.value
  if (v.kind !== 'topic' || v.ref.type !== 'flavor') return []
  const def = C.forum.get(v.ref.id)
  if (!def) return []
  return def.posts.map((p, i) => ({ key: i, speaker: speakerOf(state, p.author, undefined), paragraphs: renderText(state, p.text) }))
})
const flavorDate = computed(() => {
  const v = view.value
  if (v.kind !== 'topic' || v.ref.type !== 'flavor') return ''
  const id = v.ref.id
  const entry = state.forum.find(f => f.id === id)
  return entry ? formatDate(entry.day) : ''
})

function go(v: View): void {
  denied.value = null
  view.value = v
  void nextTick(() => scrollEl.value?.scrollTo({ top: 0 }))
}

function openBoard(board: ForumBoard): void {
  if (!isOpen(board)) {
    denied.value = board
    return
  }
  go({ kind: 'board', board })
}

function openTopic(t: Topic): void {
  go({ kind: 'topic', board: t.board, ref: t.ref })
}

function markFlavorRead(id: string): void {
  const entry = state.forum.find(f => f.id === id)
  if (entry && !entry.read) entry.read = true
}

function markBoardRead(board: ForumBoard | null): void {
  for (const f of state.forum) {
    if (f.read) continue
    const def = C.forum.get(f.id)
    if (def && (board === null || def.board === board) && isOpen(def.board)) f.read = true
  }
}

// Flavor topics are read as soon as they're opened (story threads mark themselves via ThreadView).
watch(
  view,
  v => {
    if (v.kind === 'topic' && v.ref.type === 'flavor') markFlavorRead(v.ref.id)
  },
  { immediate: true },
)

watch(
  () => [props.threadUid, props.topic, props.board] as const,
  ([uid, topic, board]) => {
    if (uid !== undefined) {
      const t = state.threads.find(x => x.uid === uid && x.channel === 'forum')
      const sc = t ? sceneOf(t) : undefined
      if (t && sc) go({ kind: 'topic', board: sc.board ?? 'general', ref: { type: 'story', uid } })
    } else if (topic) {
      const def = C.forum.get(topic)
      if (def && state.forum.some(f => f.id === topic)) go({ kind: 'topic', board: def.board, ref: { type: 'flavor', id: topic } })
    } else if (board && BOARDS.some(b => b.id === board)) {
      openBoard(board as ForumBoard)
    }
  },
  { immediate: true },
)

// ── Who's online ─────────────────────────────────────────────────────────────────────────────
const online = computed(() => {
  const names: string[] = []
  for (const [id, s] of Object.entries(state.npcs)) {
    const def = C.npcs.get(id)
    if (!s.met || !def?.handle) continue
    if (presenceOf(state, id, false).status === 'online') names.push(def.handle)
  }
  names.sort((a, b) => a.localeCompare(b))
  const guests = 1 + (hashStr(`guests:${state.time.day}:${state.time.hour}`) % 6)
  return { names, guests }
})
const myPosts = computed(() => playerPostCount(state))

function lastPostText(t: Topic | undefined): string {
  if (!t) return 'No posts'
  return `${formatShortDate(t.day)} ${formatClock(t.at % 24)}`
}
</script>

<template>
  <div class="app bbs">
    <header class="masthead">
      <pre class="banner" aria-label="The Loft BBS">{{ BANNER }}</pre>
      <div class="mast-side">
        <div class="mast-title">B·B·S</div>
        <div>est. 1994 · node 1 of 1</div>
        <div>"keep the commons"</div>
      </div>
    </header>

    <div class="navbar">
      <nav class="crumbs" aria-label="Breadcrumbs">
        <button type="button" class="link" @click="go({ kind: 'index' })">🏠 The Loft BBS</button>
        <template v-if="currentBoard">
          <span class="sep">»</span>
          <button type="button" class="link" @click="openBoard(currentBoard)">{{ boardMeta(currentBoard).name }}</button>
        </template>
        <template v-if="currentTopic">
          <span class="sep">»</span>
          <span class="here">{{ currentTopic.title }}</span>
        </template>
      </nav>
      <div class="whoami">
        Logged in as <b>{{ state.player.handle }}</b>
        <span v-if="newPosts > 0" class="pill warn">{{ newPosts }} new</span>
      </div>
    </div>

    <div ref="scrollEl" class="page" :class="{ 'topic-page': view.kind === 'topic' && currentTopic?.story }">
      <!-- Access denied -->
      <div v-if="denied" class="denied">
        <pre class="denied-art">+-----------------------------+
|   ACCESS  DENIED  ::  401   |
+-----------------------------+</pre>
        <p>
          <b>{{ boardMeta(denied).name }}</b> is for {{ loftName }} members. Earn their trust — reputation {{ BACK_ROOM_REP }} opens
          the door. (You: {{ loftRep }}.)
        </p>
        <button type="button" class="btn" @click="denied = null">Back to the boards</button>
      </div>

      <!-- Index -->
      <template v-else-if="view.kind === 'index'">
        <div class="welcome">
          Welcome back, <b>{{ state.player.handle }}</b>.
          <template v-if="newPosts > 0">There {{ newPosts === 1 ? 'is' : 'are' }} <b>{{ newPosts }}</b> new topic{{ newPosts === 1 ? '' : 's' }} since your last visit.</template>
          <template v-else>Nothing new since your last visit. The board hums quietly.</template>
          <button v-if="newPosts > 0" type="button" class="link small" @click="markBoardRead(null)">Mark all read</button>
        </div>
        <table class="forumline">
          <thead>
            <tr>
              <th class="c-ic"></th>
              <th>Forum</th>
              <th class="c-num">Topics</th>
              <th class="c-num">Posts</th>
              <th class="c-last">Last Post</th>
            </tr>
          </thead>
          <tbody v-for="cat in categories" :key="cat.title">
            <tr class="cat">
              <td colspan="5">{{ cat.title }}</td>
            </tr>
            <tr v-for="r in cat.rows" :key="r.meta.id" class="brow" :class="{ locked: !r.open }" @click="openBoard(r.meta.id)">
              <td class="c-ic" :title="!r.open ? 'Locked' : r.fresh ? 'New posts' : 'No new posts'">
                <span v-if="!r.open">🔒</span>
                <span v-else :class="r.fresh ? 'dot-new' : 'dot-old'">{{ r.fresh ? '●' : '○' }}</span>
              </td>
              <td>
                <button type="button" class="link bname" @click.stop="openBoard(r.meta.id)">{{ r.meta.icon }} {{ r.meta.name }}</button>
                <div class="bdesc">
                  <template v-if="r.open">{{ r.meta.desc }}</template>
                  <template v-else>Members only — {{ loftName }} reputation {{ BACK_ROOM_REP }} required (you: {{ loftRep }}).</template>
                </div>
                <div v-if="r.awaiting > 0" class="bnote">💬 {{ r.awaiting }} topic{{ r.awaiting === 1 ? '' : 's' }} waiting for your reply</div>
                <button v-if="r.meta.id === 'jobs'" type="button" class="link small ops" @click.stop="openApp('ops', { tab: 'board' })">
                  ⚡ {{ offers }} live contract{{ offers === 1 ? '' : 's' }} on the Operations board →
                </button>
              </td>
              <td class="c-num">{{ r.open ? r.topics : '—' }}</td>
              <td class="c-num">{{ r.open ? r.posts : '—' }}</td>
              <td class="c-last">
                <template v-if="r.open && r.latest">
                  <div>{{ lastPostText(r.latest) }}</div>
                  <div class="muted">by {{ r.latest.lastAuthor.handle || 'system' }}</div>
                </template>
                <span v-else class="muted">{{ r.open ? 'No posts' : '—' }}</span>
              </td>
            </tr>
          </tbody>
        </table>

        <div class="who">
          <div class="who-head">Who is online</div>
          <div class="who-body">
            <div>
              In total there are <b>{{ online.names.length + 1 + online.guests }}</b> users online ::
              {{ online.names.length + 1 }} registered and {{ online.guests }} guest{{ online.guests === 1 ? '' : 's' }}.
            </div>
            <div>
              Registered users: <b class="me">{{ state.player.handle }}</b><template v-for="n in online.names" :key="n">, <span>{{ n }}</span></template>
            </div>
            <div class="muted">Your posts: {{ myPosts }} · Most users ever online was 23 on {{ formatDate(0) }}.</div>
          </div>
        </div>
        <div class="legend muted">● New posts · ○ No new posts · 📌 Sticky · 💬 Waiting for you · 🔒 Locked / resolved</div>
      </template>

      <!-- Board -->
      <template v-else-if="view.kind === 'board'">
        <div class="board-head">
          <h2>{{ boardMeta(view.board).icon }} {{ boardMeta(view.board).name }}</h2>
          <div class="muted">{{ boardMeta(view.board).desc }}</div>
        </div>
        <div v-if="view.board === 'jobs'" class="ops-callout">
          <span>💼 Looking for paid work? The <b>Operations</b> board has {{ offers }} open offer{{ offers === 1 ? '' : 's' }} with pay, odds and heat up front.</span>
          <button type="button" class="btn small primary" @click="openApp('ops', { tab: 'board' })">Open Operations</button>
        </div>
        <div class="board-tools">
          <button type="button" class="link small" @click="markBoardRead(view.board)">Mark topics read</button>
        </div>
        <table class="forumline">
          <thead>
            <tr>
              <th class="c-ic"></th>
              <th>Topics</th>
              <th class="c-num">Replies</th>
              <th class="c-author">Author</th>
              <th class="c-last">Last Post</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="t in topicsOf(view.board)" :key="t.key" class="trow" :class="{ fresh: t.unread }" @click="openTopic(t)">
              <td class="c-ic">
                <span v-if="t.awaiting" title="Waiting for your reply">💬</span>
                <span v-else-if="t.pinned" title="Sticky">📌</span>
                <span v-else-if="t.story && t.closed" title="Resolved">🔒</span>
                <span v-else :class="t.unread ? 'dot-new' : 'dot-old'" :title="t.unread ? 'New posts' : 'No new posts'">{{ t.unread ? '●' : '○' }}</span>
              </td>
              <td>
                <span v-if="t.pinned" class="sticky">Sticky:</span>
                <button type="button" class="link tname" @click.stop="openTopic(t)">{{ t.title }}</button>
                <span v-if="t.unread" class="pill warn new">new</span>
              </td>
              <td class="c-num">{{ Math.max(0, t.posts - 1) }}</td>
              <td class="c-author">{{ t.author.handle || 'system' }}</td>
              <td class="c-last">
                <div>{{ lastPostText(t) }}</div>
                <div class="muted">by {{ t.lastAuthor.handle || 'system' }}</div>
              </td>
            </tr>
          </tbody>
        </table>
        <div v-if="topicsOf(view.board).length === 0" class="empty">
          No topics here yet. Tumbleweeds roll across a 640×480 desert.
        </div>
      </template>

      <!-- Topic -->
      <template v-else-if="currentTopic">
        <div class="topic-head">
          <h2>{{ currentTopic.title }}</h2>
          <span v-if="currentTopic.awaiting" class="pill info">💬 waiting for your reply</span>
          <span v-else-if="currentTopic.story && currentTopic.closed" class="pill">🔒 resolved</span>
        </div>
        <div v-if="currentTopic.ref.type === 'story'" class="story-topic">
          <ThreadView :key="currentTopic.ref.uid" :uid="currentTopic.ref.uid" variant="forum" />
        </div>
        <div v-else class="flavor-topic">
          <PostCard
            v-for="(p, i) in flavorPosts"
            :key="p.key"
            :speaker="p.speaker"
            :paragraphs="p.paragraphs"
            :subject="i === 0 ? currentTopic.title : `Re: ${currentTopic.title}`"
            :date="flavorDate"
            :number="i + 1"
            :alt="i % 2 === 1"
          />
          <div class="flavor-foot muted">— End of topic. Nothing here needs you; it's just the scene talking to itself. —</div>
        </div>
      </template>
      <div v-else class="empty">
        This topic has been moved or deleted. Classic sysop.
        <button type="button" class="btn small" @click="go({ kind: 'index' })">Back to the index</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.app.bbs {
  padding: 0;
  gap: 0;
  background: var(--panel-bg);
  container-type: inline-size;
}
.masthead {
  flex: none;
  display: flex;
  align-items: stretch;
  gap: 10px;
  padding: 6px 10px;
  background: var(--terminal-bg);
  color: var(--terminal-fg);
  border-bottom: 2px solid var(--terminal-dim);
  overflow: hidden;
}
.banner {
  margin: 0;
  font-family: var(--font-mono);
  font-size: 10px;
  line-height: 1.1;
  text-shadow: 0 0 4px color-mix(in srgb, var(--terminal-fg) 60%, transparent);
  white-space: pre;
}
.mast-side {
  display: flex;
  flex-direction: column;
  justify-content: center;
  font-family: var(--font-mono);
  font-size: 10px;
  color: var(--terminal-dim);
  white-space: nowrap;
}
.mast-title {
  font-size: 18px;
  font-weight: bold;
  letter-spacing: 3px;
  color: var(--terminal-warn);
}
.navbar {
  flex: none;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 10px;
  background: linear-gradient(var(--panel-alt), var(--win-bg));
  border-bottom: 1px solid var(--panel-border);
  font-size: 11px;
}
.crumbs {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 4px;
  overflow: hidden;
  white-space: nowrap;
}
.here {
  overflow: hidden;
  text-overflow: ellipsis;
  font-weight: bold;
}
.sep {
  color: var(--muted);
}
.whoami {
  flex: none;
  white-space: nowrap;
}
.link {
  font: inherit;
  padding: 0;
  border: none;
  background: none;
  color: var(--info);
  cursor: pointer;
  text-align: left;
}
.link:hover {
  text-decoration: underline;
  color: var(--bad);
}
.link:focus-visible {
  outline: 1px dotted var(--info);
}
.link.small {
  font-size: 11px;
}
.page {
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: 8px 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.page.topic-page {
  overflow: hidden;
}
.welcome {
  font-size: 11px;
}
.welcome .link {
  margin-left: 6px;
}
.forumline {
  width: 100%;
  border-collapse: collapse;
  border: 1px solid var(--panel-border);
  font-size: 12px;
}
.forumline th {
  background: linear-gradient(var(--win-title-b), var(--win-title-a));
  color: var(--win-title-fg);
  font-weight: bold;
  font-size: 11px;
  padding: 4px 6px;
  text-align: left;
  white-space: nowrap;
}
.forumline td {
  padding: 5px 6px;
  border-top: 1px solid color-mix(in srgb, var(--panel-border) 55%, var(--panel-bg));
  vertical-align: middle;
}
.cat td {
  background: color-mix(in srgb, var(--info) 14%, var(--panel-bg));
  font-weight: bold;
  color: var(--info);
  font-size: 11px;
  letter-spacing: 0.5px;
  text-transform: uppercase;
}
.brow,
.trow {
  cursor: pointer;
}
.brow td,
.trow td {
  background: var(--panel-bg);
}
.brow:nth-child(odd) td,
.trow:nth-child(even) td {
  background: var(--panel-alt);
}
.brow:hover td,
.trow:hover td {
  background: color-mix(in srgb, var(--sel-bg) 9%, var(--panel-bg));
}
.brow.locked td {
  color: var(--muted);
}
.brow.locked .bname {
  color: var(--muted);
}
.c-ic {
  width: 26px;
  text-align: center !important;
}
.c-num {
  width: 56px;
  text-align: center !important;
}
.c-author {
  width: 110px;
}
.c-last {
  width: 130px;
  font-size: 11px;
}
.bname {
  font-weight: bold;
  font-size: 12px;
}
.bdesc {
  font-size: 11px;
  color: var(--muted);
  margin-top: 1px;
}
.bnote {
  font-size: 11px;
  color: var(--warn);
  margin-top: 2px;
}
.ops {
  margin-top: 2px;
  color: var(--money);
}
.dot-new {
  color: var(--warn);
}
.dot-old {
  color: var(--muted);
}
.tname {
  font-weight: bold;
}
.fresh .tname {
  color: var(--bad);
}
.sticky {
  font-weight: bold;
  margin-right: 3px;
}
.new {
  margin-left: 4px;
}
.who {
  border: 1px solid var(--panel-border);
}
.who-head {
  background: linear-gradient(var(--win-title-b), var(--win-title-a));
  color: var(--win-title-fg);
  font-weight: bold;
  font-size: 11px;
  padding: 3px 6px;
}
.who-body {
  padding: 6px;
  font-size: 11px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  background: var(--panel-alt);
}
.who-body .me {
  color: var(--good);
}
.legend {
  font-size: 10px;
  text-align: center;
}
.board-head h2,
.topic-head h2 {
  font-size: 15px;
}
.topic-head {
  flex: none;
  display: flex;
  align-items: center;
  gap: 8px;
}
.board-tools {
  display: flex;
  justify-content: flex-end;
  margin-bottom: -4px;
}
.ops-callout {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 8px;
  border: 1px solid color-mix(in srgb, var(--money) 45%, var(--panel-bg));
  background: color-mix(in srgb, var(--money) 8%, var(--panel-bg));
  border-radius: var(--radius);
}
.ops-callout span {
  flex: 1;
}
.story-topic {
  flex: 1;
  min-height: 0;
}
.flavor-topic {
  border: 1px solid var(--panel-border);
}
.flavor-foot {
  padding: 8px;
  font-size: 11px;
  text-align: center;
  font-style: italic;
  background: var(--panel-alt);
}
.empty {
  padding: 18px;
  text-align: center;
  color: var(--muted);
  font-style: italic;
}
.denied {
  margin: auto;
  max-width: 420px;
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: center;
}
.denied-art {
  margin: 0;
  padding: 8px 12px;
  font-family: var(--font-mono);
  font-size: 11px;
  background: var(--terminal-bg);
  color: var(--terminal-err);
}
@container (max-width: 600px) {
  .mast-side,
  .c-author,
  .c-last {
    display: none;
  }
  .banner {
    font-size: 8px;
  }
}
</style>
