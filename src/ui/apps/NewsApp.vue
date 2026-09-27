<script setup lang="ts">
/** Lumen Herald Online: Port Lumen's paper of record, as rendered by a 2001 web portal. */
import { computed, nextTick, ref, useTemplateRef, watch } from 'vue'
import { C, formatClock, formatDate, renderText, yearOf } from '@/engine'
import type { GameState, NewsDef } from '@/engine'
import { useGame } from '@/ui/game'
import RichText from '@/ui/components/RichText.vue'
import NewsSidebar from '@/ui/world/NewsSidebar.vue'
import { NEWS_CATEGORIES, categoryMeta, marketQuotes, weatherOn, type NewsCategory } from '@/ui/world/newsData'
import { daysAgo } from '@/ui/world/util'

type Section = 'front' | NewsCategory

/** `id` (or alias `news`) opens that article. */
const props = withDefaults(defineProps<{ id?: string; news?: string }>(), { id: undefined, news: undefined })

const state = useGame()

interface Article {
  entry: GameState['news'][number]
  def: NewsDef
  order: number
}

const section = ref<Section>('front')
const openId = ref<string | null>(null)
const mainEl = useTemplateRef<HTMLElement>('mainEl')

const articles = computed<Article[]>(() => {
  const out: Article[] = []
  state.news.forEach((entry, order) => {
    const def = C.news.get(entry.id)
    if (def) out.push({ entry, def, order })
  })
  return out.sort((a, b) => b.entry.day - a.entry.day || b.order - a.order)
})

const inSection = computed(() =>
  section.value === 'front' ? articles.value : articles.value.filter(a => a.def.category === section.value),
)
const hero = computed(() => inSection.value[0])
const rest = computed(() => inSection.value.slice(1))

const unreadBy = computed(() => {
  const m = new Map<Section, number>()
  for (const a of articles.value) {
    if (a.entry.read) continue
    m.set('front', (m.get('front') ?? 0) + 1)
    m.set(a.def.category, (m.get(a.def.category) ?? 0) + 1)
  }
  return m
})

const opened = computed(() => (openId.value ? articles.value.find(a => a.entry.id === openId.value) : undefined))
const related = computed(() => {
  const cur = opened.value
  if (!cur) return []
  return articles.value.filter(a => a.def.category === cur.def.category && a.entry.id !== cur.entry.id).slice(0, 4)
})

const breaking = computed(() => {
  const a = articles.value[0]
  return a?.entry.day === state.time.day ? a : undefined
})

function scrollTop(): void {
  void nextTick(() => mainEl.value?.scrollTo({ top: 0 }))
}

function openArticle(id: string): void {
  openId.value = id
  const a = articles.value.find(x => x.entry.id === id)
  if (a) a.entry.read = true
  scrollTop()
}

function goSection(s: Section): void {
  section.value = s
  openId.value = null
  scrollTop()
}

function markAllRead(): void {
  for (const n of state.news) n.read = true
}

watch(
  () => props.id ?? props.news,
  id => {
    if (id) openArticle(id)
  },
  { immediate: true },
)

function excerpt(def: NewsDef, max = 220): string {
  const first = renderText(state, def.body)[0] ?? ''
  if (first.length <= max) return first
  const cut = first.slice(0, max)
  return `${cut.slice(0, Math.max(0, cut.lastIndexOf(' ')))}…`
}

function when(day: number): string {
  return day === state.time.day ? 'Today' : daysAgo(state.time.day - day).replace(/^./, c => c.toUpperCase())
}

const longDate = computed(() => {
  const [wd = '', d = '', mon = '', y = ''] = formatDate(state.time.day).split(' ')
  const days: Record<string, string> = { Sun: 'Sunday', Mon: 'Monday', Tue: 'Tuesday', Wed: 'Wednesday', Thu: 'Thursday', Fri: 'Friday', Sat: 'Saturday' }
  return `${days[wd] ?? wd}, ${mon} ${d}, ${y}`
})
const weather = computed(() => weatherOn(state.time.day))
const ticker = computed(() =>
  marketQuotes(state)
    .map(q =>
      q.price === null
        ? `${q.sym} ${q.note ?? ''}`
        : `${q.sym} ${q.price.toFixed(2)} ${q.change >= 0 ? '▲' : '▼'}${Math.abs(q.change * 100).toFixed(1)}%`,
    )
    .join('   ·   '),
)
const year = computed(() => yearOf(state.time.day))
const edition = computed(() => (state.time.hour < 12 ? 'Morning Edition' : state.time.hour < 18 ? 'Afternoon Edition' : 'Late Edition'))
</script>

<template>
  <div class="app herald">
    <header class="masthead">
      <div class="mast-top">
        <span>{{ longDate }}</span>
        <span class="grow"></span>
        <span>{{ weather.icon }} {{ weather.high }}°F {{ weather.label }}</span>
        <span class="sep">|</span>
        <span>{{ edition }} · Updated {{ formatClock(state.time.hour) }}</span>
      </div>
      <div class="mast-title" role="button" tabindex="0" title="Front page" @click="goSection('front')" @keydown.enter="goSection('front')">
        The Lumen Herald<span class="online">Online</span>
      </div>
      <div class="mast-motto">Port Lumen's Paper of Record Since 1887</div>
    </header>

    <nav class="nav" aria-label="Sections">
      <button type="button" :class="{ on: section === 'front' && !openId }" @click="goSection('front')">
        Front Page<span v-if="unreadBy.get('front')" class="count">{{ unreadBy.get('front') }}</span>
      </button>
      <button
        v-for="c in NEWS_CATEGORIES"
        :key="c.id"
        type="button"
        :class="{ on: section === c.id && !openId }"
        @click="goSection(c.id)"
      >
        {{ c.label }}<span v-if="unreadBy.get(c.id)" class="count">{{ unreadBy.get(c.id) }}</span>
      </button>
      <span class="grow"></span>
      <button type="button" class="util" :disabled="!unreadBy.get('front')" @click="markAllRead">Mark all read</button>
    </nav>

    <div v-if="breaking && !openId" class="breaking" role="button" tabindex="0" @click="openArticle(breaking.entry.id)" @keydown.enter="openArticle(breaking.entry.id)">
      <span class="brk-tag">BREAKING</span>
      <span class="brk-text">{{ breaking.def.headline }}</span>
    </div>

    <div v-else class="ticker" aria-hidden="true">
      <span class="tk-tag">MARKETS</span>
      <div class="tk-track"><span class="tk-run">{{ ticker }}</span></div>
    </div>

    <div class="page">
      <main ref="mainEl" class="main scroll">
        <!-- Article view -->
        <article v-if="openId && opened" class="article">
          <button type="button" class="back" @click="openId = null">« Back to {{ section === 'front' ? 'Front Page' : categoryMeta(section).label }}</button>
          <div class="kicker" :class="categoryMeta(opened.def.category).tone">{{ categoryMeta(opened.def.category).label }}</div>
          <h1 class="headline big">{{ opened.def.headline }}</h1>
          <div class="dateline">
            {{ opened.def.source }} · {{ formatDate(opened.entry.day) }}
          </div>
          <div class="body">
            <RichText v-if="opened.def.body" :text="opened.def.body" />
            <p v-else class="muted"><i>This is a developing story. The Herald will update this page as details become available.</i></p>
          </div>
          <div class="endmark" aria-hidden="true">■</div>
          <section v-if="related.length" class="related">
            <h4>More from {{ categoryMeta(opened.def.category).label }}</h4>
            <ul>
              <li v-for="r in related" :key="r.entry.id">
                <button type="button" class="link" :class="{ unread: !r.entry.read }" @click="openArticle(r.entry.id)">{{ r.def.headline }}</button>
                <span class="muted small"> — {{ when(r.entry.day) }}</span>
              </li>
            </ul>
          </section>
        </article>

        <div v-else-if="openId" class="notfound">
          <h2>404 — Page Not Found</h2>
          <p>The page you requested could not be found. It may have been moved, or it may never have existed.</p>
          <button type="button" class="btn" @click="goSection('front')">Return to the Front Page</button>
        </div>

        <!-- Section / front page -->
        <template v-else>
          <div v-if="!hero" class="empty">
            <h2>{{ section === 'front' ? 'The presses are warming up.' : `No ${categoryMeta(section).label} stories yet.` }}</h2>
            <p>
              {{ section === 'front'
                ? 'No stories have been filed yet. Our reporters are out chasing ambulances and city council members. Check back after the next edition.'
                : 'A quiet stretch on this beat. Enjoy it — in Port Lumen, quiet never lasts.' }}
            </p>
          </div>
          <template v-else>
            <article class="hero" :class="{ unread: !hero.entry.read }">
              <div class="kicker" :class="categoryMeta(hero.def.category).tone">
                {{ categoryMeta(hero.def.category).label }}
                <span v-if="!hero.entry.read" class="new">NEW!</span>
              </div>
              <h1 class="headline big">
                <button type="button" class="link" @click="openArticle(hero.entry.id)">{{ hero.def.headline }}</button>
              </h1>
              <div class="dateline">{{ hero.def.source }} · {{ formatDate(hero.entry.day) }}</div>
              <p v-if="hero.def.body" class="lede">{{ excerpt(hero.def) }}</p>
              <button type="button" class="more" @click="openArticle(hero.entry.id)">Full story »</button>
            </article>

            <section v-if="rest.length" class="list">
              <h4 class="list-title">{{ section === 'front' ? 'More Headlines' : `More ${categoryMeta(section).label} News` }}</h4>
              <div v-for="a in rest" :key="a.entry.id" class="item" :class="{ unread: !a.entry.read }">
                <span class="tag" :class="categoryMeta(a.def.category).tone">{{ categoryMeta(a.def.category).label }}</span>
                <button type="button" class="link grow" @click="openArticle(a.entry.id)">{{ a.def.headline }}</button>
                <span v-if="!a.entry.read" class="new">NEW!</span>
                <span class="muted small when">{{ when(a.entry.day) }}</span>
              </div>
            </section>
          </template>
        </template>
      </main>

      <NewsSidebar />
    </div>

    <footer class="foot">
      <span>© {{ year }} Lumen Herald Media Group</span>
      <span class="sep">|</span>
      <span>Best viewed in 800×600</span>
      <span class="sep">|</span>
      <span>Contact the webmaster</span>
      <span class="grow"></span>
      <span class="muted">Page generated in 0.{{ String(40 + (state.time.day % 57)).padStart(2, '0') }} seconds</span>
    </footer>
  </div>
</template>

<style scoped>
.herald {
  --herald-navy: #1c2f5e;
  --herald-red: #a4161a;
  --herald-paper: #fbfaf6;
  --herald-rule: #c9c3b5;
  --herald-serif: Georgia, 'Times New Roman', Times, serif;
  padding: 0;
  gap: 0;
  background: var(--herald-paper);
}
.masthead {
  flex: none;
  padding: 4px 10px 6px;
  border-bottom: 3px double var(--herald-navy);
  text-align: center;
  background: var(--panel-bg);
}
.mast-top {
  display: flex;
  gap: 6px;
  font-size: 10px;
  color: var(--muted);
  border-bottom: 1px solid var(--herald-rule);
  padding-bottom: 2px;
}
.sep {
  color: var(--herald-rule);
}
.mast-title {
  font-family: var(--herald-serif);
  font-size: 30px;
  font-weight: bold;
  letter-spacing: 1px;
  color: var(--win-fg);
  line-height: 1.15;
  margin-top: 2px;
  cursor: pointer;
}
.mast-title:focus-visible {
  outline: 1px dotted var(--sel-bg);
}
.online {
  font-size: 14px;
  font-style: italic;
  color: var(--herald-red);
  margin-left: 6px;
  vertical-align: super;
}
.mast-motto {
  font-family: var(--herald-serif);
  font-style: italic;
  font-size: 10px;
  color: var(--muted);
}

.nav {
  flex: none;
  display: flex;
  background: var(--herald-navy);
  padding: 0 4px;
}
.nav button {
  font: inherit;
  font-size: 11px;
  font-weight: bold;
  background: none;
  border: none;
  color: var(--sel-fg);
  padding: 4px 8px;
  cursor: pointer;
}
.nav button:hover:not(:disabled) {
  background: rgb(255 255 255 / 15%);
  text-decoration: underline;
}
.nav button.on {
  background: var(--herald-paper);
  color: var(--herald-navy);
}
.nav button:focus-visible {
  outline: 1px dotted var(--sel-fg);
  outline-offset: -2px;
}
.nav button.util {
  font-weight: normal;
}
.nav button:disabled {
  opacity: 0.5;
  cursor: default;
}
.count {
  display: inline-block;
  margin-left: 4px;
  padding: 0 4px;
  border-radius: 6px;
  background: var(--herald-red);
  color: var(--sel-fg);
  font-size: 9px;
  line-height: 13px;
}

.breaking {
  flex: none;
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--herald-red);
  color: var(--sel-fg);
  font-weight: bold;
  font-size: 11px;
  padding: 3px 10px;
  cursor: pointer;
  overflow: hidden;
  white-space: nowrap;
}
.breaking:hover .brk-text {
  text-decoration: underline;
}
.breaking:focus-visible {
  outline: 1px dotted var(--sel-fg);
  outline-offset: -3px;
}
.brk-tag {
  background: var(--sel-fg);
  color: var(--herald-red);
  padding: 0 4px;
  animation: pulse 1s steps(2, start) infinite;
}
.brk-text {
  overflow: hidden;
  text-overflow: ellipsis;
}
@keyframes pulse {
  to {
    opacity: 0.35;
  }
}
@media (prefers-reduced-motion: reduce) {
  .brk-tag {
    animation: none;
  }
}

.ticker {
  flex: none;
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--win-fg);
  color: var(--terminal-warn);
  font-family: var(--font-mono);
  font-size: 10px;
  padding: 2px 0 2px 10px;
  overflow: hidden;
  white-space: nowrap;
}
.tk-tag {
  flex: none;
  color: var(--win-fg);
  background: var(--terminal-warn);
  font-weight: bold;
  padding: 0 4px;
}
.tk-track {
  flex: 1;
  overflow: hidden;
}
.tk-run {
  display: inline-block;
  padding-left: 100%;
  animation: ticker 40s linear infinite;
}
@keyframes ticker {
  to {
    transform: translateX(-100%);
  }
}
@media (prefers-reduced-motion: reduce) {
  .tk-run {
    animation: none;
    padding-left: 0;
  }
}
.page {
  flex: 1;
  min-height: 0;
  display: flex;
  gap: 10px;
  padding: 8px 10px;
}
.main {
  background: var(--panel-bg);
  border: 1px solid var(--herald-rule);
  padding: 10px 14px;
}
.kicker {
  font-size: 10px;
  font-weight: bold;
  text-transform: uppercase;
  letter-spacing: 1px;
}
.headline {
  font-family: var(--herald-serif);
  font-weight: bold;
  line-height: 1.15;
  margin: 2px 0 4px;
}
.headline.big {
  font-size: 22px;
}
.link {
  font: inherit;
  color: var(--win-fg);
  background: none;
  border: none;
  padding: 0;
  text-align: left;
  cursor: pointer;
}
.link:hover {
  color: var(--herald-red);
  text-decoration: underline;
}
.link:focus-visible {
  outline: 1px dotted var(--sel-bg);
}
.dateline {
  font-size: 10px;
  color: var(--muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding-bottom: 6px;
  border-bottom: 1px solid var(--herald-rule);
  margin-bottom: 8px;
}
.lede {
  font-family: var(--herald-serif);
  font-size: 13px;
  line-height: 1.5;
}
.more {
  font: inherit;
  font-size: 11px;
  font-weight: bold;
  color: var(--info);
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
}
.more:hover {
  text-decoration: underline;
}
.new {
  display: inline-block;
  font-size: 9px;
  font-weight: bold;
  color: var(--sel-fg);
  background: var(--herald-red);
  padding: 0 3px;
  margin-left: 4px;
  letter-spacing: 0;
  font-style: italic;
}
.hero {
  padding-bottom: 10px;
  margin-bottom: 10px;
  border-bottom: 3px double var(--herald-rule);
}
.list-title {
  font-family: var(--herald-serif);
  font-size: 13px;
  border-bottom: 2px solid var(--herald-navy);
  margin-bottom: 4px;
  padding-bottom: 2px;
}
.item {
  display: flex;
  align-items: baseline;
  gap: 6px;
  padding: 4px 0;
  border-bottom: 1px dotted var(--herald-rule);
}
.item .link {
  font-family: var(--herald-serif);
  font-size: 13px;
}
.item.unread .link,
.related .link.unread {
  font-weight: bold;
}
.tag {
  flex: none;
  width: 56px;
  font-size: 9px;
  font-weight: bold;
  text-transform: uppercase;
}
.when {
  flex: none;
}
.small {
  font-size: 10px;
}
.article .back {
  font: inherit;
  font-size: 11px;
  color: var(--info);
  background: none;
  border: none;
  padding: 0;
  margin-bottom: 8px;
  cursor: pointer;
}
.article .back:hover {
  text-decoration: underline;
}
.body {
  font-family: var(--herald-serif);
  font-size: 13px;
  line-height: 1.55;
}
.body :deep(p:first-child)::first-letter {
  float: left;
  font-size: 34px;
  line-height: 0.9;
  padding: 3px 4px 0 0;
  font-weight: bold;
  color: var(--herald-navy);
}
.endmark {
  font-size: 8px;
  color: var(--herald-navy);
  margin: 4px 0 12px;
}
.related h4 {
  font-family: var(--herald-serif);
  border-bottom: 2px solid var(--herald-navy);
  padding-bottom: 2px;
  margin-bottom: 4px;
}
.related ul {
  margin: 0;
  padding-left: 16px;
}
.related li {
  padding: 2px 0;
}
.empty,
.notfound {
  text-align: center;
  padding: 30px 16px;
  color: var(--muted);
}
.empty h2,
.notfound h2 {
  font-family: var(--herald-serif);
  color: var(--win-fg);
  margin-bottom: 8px;
}
.foot {
  flex: none;
  display: flex;
  gap: 6px;
  font-size: 10px;
  padding: 3px 10px;
  border-top: 1px solid var(--herald-rule);
  color: var(--info);
  background: var(--panel-bg);
}
</style>
