<script setup lang="ts">
/**
 * Career Center — "LumenJobs.net", a 2002 job portal inside a period web browser.
 * Pages: My Career (current job), Job Board (by career track), a job posting, and My Résumé.
 */
import { computed, onBeforeUnmount, ref, useTemplateRef } from 'vue'
import { C, canTakeJob, money, setJob, type JobDef } from '@/engine'
import { useGame } from '@/ui/game'
import { openApp } from '@/ui/wm'
import type { AppId } from '@/ui/apps'
import BrowserFrame from '@/ui/career/BrowserFrame.vue'
import MsgBox from '@/ui/career/MsgBox.vue'
import ReqList from '@/ui/career/ReqList.vue'
import CurrentJobCard from '@/ui/career/jobs/CurrentJobCard.vue'
import JobListing from '@/ui/career/jobs/JobListing.vue'
import JobPosting from '@/ui/career/jobs/JobPosting.vue'
import { shiftLabel, sortTracks, trackInfo } from '@/ui/career/labels'
import { applyStatus, currentJob, levelOf, payInfo, shiftTakes } from '@/ui/career/jobs'
import { jobVisible } from '@/ui/career/reqs'
import '@/ui/career/career.css'

const state = useGame()

// ── Mini router with browser history ───────────────────────────────────────
type Page = { kind: 'home' } | { kind: 'board'; track: string } | { kind: 'job'; id: string } | { kind: 'resume' }

const pages = ref<Page[]>([{ kind: 'home' }])
const pageIdx = ref<number>(0)
const page = computed<Page>(() => pages.value[pageIdx.value] ?? { kind: 'home' })
const loading = ref<boolean>(false)
const viewEl = useTemplateRef<HTMLElement>('viewEl')
let loadTimer: ReturnType<typeof setTimeout> | undefined

function blip(): void {
  loading.value = true
  if (loadTimer !== undefined) clearTimeout(loadTimer)
  loadTimer = setTimeout(() => {
    loading.value = false
  }, 280)
  viewEl.value?.scrollTo({ top: 0 })
}
onBeforeUnmount(() => {
  if (loadTimer !== undefined) clearTimeout(loadTimer)
})

function go(p: Page): void {
  pages.value = [...pages.value.slice(0, pageIdx.value + 1), p].slice(-30)
  pageIdx.value = pages.value.length - 1
  blip()
}
function back(): void {
  if (pageIdx.value > 0) {
    pageIdx.value--
    blip()
  }
}
function forward(): void {
  if (pageIdx.value < pages.value.length - 1) {
    pageIdx.value++
    blip()
  }
}
function stop(): void {
  if (loadTimer !== undefined) clearTimeout(loadTimer)
  loading.value = false
}

const url = computed(() => {
  const base = 'http://www.lumenjobs.net'
  const p = page.value
  switch (p.kind) {
    case 'home':
      return `${base}/mycareer.asp`
    case 'board':
      return `${base}/board.asp?cat=${encodeURIComponent(p.track)}`
    case 'job':
      return `${base}/posting.asp?id=${encodeURIComponent(p.id)}`
    case 'resume':
      return `${base}/resume.asp?user=${encodeURIComponent(state.player.handle)}`
  }
})

// ── Data ───────────────────────────────────────────────────────────────────
const allJobs = computed(() => [...C.jobs.values()])
const job = computed(() => currentJob(state))
const visibleJobs = computed(() => allJobs.value.filter(j => jobVisible(state, j)))
const tracks = computed(() => sortTracks(allJobs.value.map(j => j.track)))
const openings = computed(() => visibleJobs.value.filter(j => j.id !== state.job).length)

const trackStats = computed(() =>
  tracks.value.map(t => {
    const vis = visibleJobs.value.filter(j => j.track === t)
    const ok = vis.filter(j => applyStatus(state, j).status === 'ok').length
    return { track: t, info: trackInfo(t), visible: vis.length, ok, mine: job.value?.track === t }
  }),
)

const boardTrack = computed(() => (page.value.kind === 'board' ? page.value.track : ''))
const boardJobs = computed(() => visibleJobs.value.filter(j => j.track === boardTrack.value).sort((a, b) => a.pay - b.pay || a.title.localeCompare(b.title)))
const hiddenInTrack = computed(() => allJobs.value.filter(j => j.track === boardTrack.value).length - boardJobs.value.length)

const postingJob = computed(() => (page.value.kind === 'job' ? C.jobs.get(page.value.id) : undefined))

const qualifying = computed(() =>
  visibleJobs.value
    .filter(j => applyStatus(state, j).status === 'ok')
    .sort((a, b) => payInfo(state, b).total - payInfo(state, a).total),
)
const upgrades = computed(() => {
  const cur = job.value ? payInfo(state, job.value).total : 0
  return qualifying.value.filter(j => payInfo(state, j).total > cur).slice(0, 4)
})

const resume = computed(() =>
  Object.entries(state.jobs)
    .map(([id, p]) => ({ id, def: C.jobs.get(id), p }))
    .filter((r): r is { id: string; def: JobDef; p: (typeof r)['p'] } => r.def !== undefined)
    .sort((a, b) => (a.id === state.job ? -1 : b.id === state.job ? 1 : b.p.days - a.p.days)),
)
const careerDays = computed(() => Object.values(state.jobs).reduce((s, p) => s + p.days, 0))
const bestLevel = computed(() => resume.value.reduce((m, r) => Math.max(m, r.p.level), 0))

function defaultTrack(): string {
  if (job.value) return job.value.track
  return trackStats.value.find(t => t.ok > 0)?.track ?? trackStats.value.find(t => t.visible > 0)?.track ?? tracks.value[0] ?? 'odd'
}
function openBoard(track?: string): void {
  go({ kind: 'board', track: track ?? defaultTrack() })
}
function openJob(j: JobDef): void {
  go({ kind: 'job', id: j.id })
}

interface Ad {
  head: string
  body: string
  cta: string
  app: AppId
  props: Record<string, unknown>
}
const ADS: [Ad, ...Ad[]] = [
  { head: 'Learn a trade from home!', body: 'The Lumen Learning Annex offers evening certificate courses at student prices. Employers love a laminated certificate.', cta: 'See courses', app: 'skills', props: { tab: 'courses' } },
  { head: 'Get a degree, get ahead.', body: 'Lumen State University is accepting applications. Entrance exams every day of the week!', cta: 'Admissions', app: 'skills', props: { tab: 'uni' } },
  { head: 'Burning the candle at both ends?', body: 'Top performers sleep 8 hours. Plan a routine that won\'t fry you.', cta: 'Open the Planner', app: 'schedule', props: {} },
  { head: 'New job, new place?', body: 'Studios and shared rooms all over Port Lumen. Your commute to the fridge has never been shorter.', cta: 'Browse housing', app: 'life', props: { tab: 'home' } },
]
const ad = computed(() => ADS[state.time.day % ADS.length] ?? ADS[0])
function openAd(): void {
  openApp(ad.value.app, ad.value.props)
}

const hitCounter = computed(() => String(48213 + state.time.day * 37 + (state.time.totalHours % 29)).padStart(7, '0'))
const ticker = computed(() => (qualifying.value.length ? qualifying.value : visibleJobs.value).filter(j => j.id !== state.job).slice(0, 6))
const tickerLoop = computed(() => [...ticker.value, ...ticker.value])

// ── Apply / resign flow ───────────────────────────────────────────────────
type Dialog = { kind: 'apply'; job: JobDef } | { kind: 'quit' } | { kind: 'refused'; job: JobDef; reason: string } | null
const dialog = ref<Dialog>(null)
const banner = ref<{ kind: 'good' | 'info'; text: string } | null>(null)

function requestApply(j: JobDef): void {
  const check = canTakeJob(state, j)
  if (!check.ok) {
    dialog.value = { kind: 'refused', job: j, reason: check.reason ?? 'Application declined.' }
    return
  }
  dialog.value = { kind: 'apply', job: j }
}

function confirmApply(j: JobDef): void {
  dialog.value = null
  const prev = job.value
  if (setJob(state, j.id)) {
    const returning = (state.jobs[j.id]?.days ?? 0) > 0
    banner.value = {
      kind: 'good',
      text: returning
        ? `Welcome back to ${j.employer}! You start again as ${j.title} at level ${levelOf(state, j)}.`
        : `Congratulations! ${j.employer} hired you as ${j.title}.${prev ? ` Your badge at ${prev.employer} has been deactivated.` : ''} First shift: ${shiftLabel(j.shiftStart, j.hours)}.`,
    }
    go({ kind: 'home' })
  } else {
    const check = canTakeJob(state, j)
    dialog.value = { kind: 'refused', job: j, reason: check.reason ?? 'The position was filled.' }
  }
}

function confirmQuit(): void {
  dialog.value = null
  const prev = job.value
  if (!prev) return
  setJob(state, null)
  banner.value = { kind: 'info', text: `You handed in your badge at ${prev.employer}. Your level there (${levelOf(state, prev)}) stays on your résumé if you ever come back.` }
  go({ kind: 'home' })
}

const applyTakes = computed(() => (dialog.value?.kind === 'apply' ? shiftTakes(state, dialog.value.job) : []))
</script>

<template>
  <div class="app jobs-app">
    <BrowserFrame
      :url="url"
      :can-back="pageIdx > 0"
      :can-forward="pageIdx < pages.length - 1"
      :loading="loading"
      :status="state.jail ? 'Connection monitored.' : 'Done'"
      @back="back"
      @forward="forward"
      @refresh="blip"
      @home="go({ kind: 'home' })"
      @stop="stop"
    >
      <div ref="viewEl" class="site scroll">
        <header class="site-head">
          <div class="logo" role="img" aria-label="LumenJobs.net">
            <span class="logo-a">Lumen</span><span class="logo-b">Jobs</span><span class="logo-c">.net</span>
          </div>
          <div class="tagline">Port Lumen's #1 career portal!</div>
          <div class="welcome">
            Welcome back, <b>{{ state.player.handle }}</b>!<br />
            <span class="muted">{{ openings }} opening{{ openings === 1 ? '' : 's' }} in your area</span>
          </div>
        </header>
        <nav class="site-nav" aria-label="Site">
          <a href="#" :class="{ on: page.kind === 'home' }" @click.prevent="go({ kind: 'home' })">My Career</a>
          <a href="#" :class="{ on: page.kind === 'board' || page.kind === 'job' }" @click.prevent="openBoard()">Job Board</a>
          <a href="#" :class="{ on: page.kind === 'resume' }" @click.prevent="go({ kind: 'resume' })">My Résumé</a>
          <span class="nav-hot" aria-hidden="true">NEW!</span>
          <span class="nav-hint">Over 200 employers trust LumenJobs</span>
        </nav>
        <div v-if="ticker.length" class="ticker" aria-label="Hot jobs">
          <span class="ticker-tag">HOT JOBS</span>
          <div class="ticker-track">
            <div class="ticker-inner">
              <a v-for="(t, i) in tickerLoop" :key="i" href="#" tabindex="-1" @click.prevent="openJob(t)">★ {{ t.title }} @ {{ t.employer }} — {{ money(payInfo(state, t).total) }}/day</a>
            </div>
          </div>
        </div>

        <main class="site-main">
          <div v-if="banner" class="banner" :class="banner.kind" role="status">
            <span>{{ banner.text }}</span>
            <button type="button" class="btn small" @click="banner = null">Dismiss</button>
          </div>

          <!-- MY CAREER -->
          <template v-if="page.kind === 'home'">
            <div class="two-col">
              <div class="col-main">
                <h1 class="page-title">My Career</h1>
                <CurrentJobCard v-if="job" :job="job" @quit="dialog = { kind: 'quit' }" @view="openJob(job)" />
                <div v-else class="nojob">
                  <div class="nojob-icon" aria-hidden="true">📋</div>
                  <div>
                    <h2>You are currently between opportunities.</h2>
                    <p>
                      That's recruiter-speak for "unemployed". A steady paycheck buys rent, hardware and the occasional
                      pizza — and every hour on the clock trains real skills.
                    </p>
                    <button type="button" class="btn primary" @click="openBoard()">
                      {{ qualifying.length ? `Browse ${qualifying.length} job${qualifying.length === 1 ? '' : 's'} you qualify for »` : 'Browse the job board »' }}
                    </button>
                  </div>
                </div>

                <h3 class="section">{{ job ? 'Better-paying openings for you' : 'Recommended for you' }}</h3>
                <div v-if="upgrades.length" class="rec-list">
                  <div v-for="r in upgrades" :key="r.id" class="rec">
                    <span class="rec-glyph" aria-hidden="true">{{ trackInfo(r.track).glyph }}</span>
                    <a href="#" @click.prevent="openJob(r)">{{ r.title }}</a>
                    <span class="muted">{{ r.employer }}</span>
                    <span class="grow"></span>
                    <b class="money">{{ money(payInfo(state, r).total) }}/day</b>
                  </div>
                </div>
                <p v-else class="muted empty">
                  {{ job ? 'Nothing out there pays better than what you have — for now. Level up your skills and check back.' : 'No openings match your profile yet. Even the paper route wants references. Try again after some studying.' }}
                </p>
              </div>
              <aside class="col-side">
                <div class="side-box">
                  <div class="side-title">Career stats</div>
                  <div class="kv"><span>Days worked</span><b>{{ careerDays }}</b></div>
                  <div class="kv"><span>Employers</span><b>{{ resume.length }}</b></div>
                  <div class="kv"><span>Highest level</span><b>{{ bestLevel }}</b></div>
                  <div class="kv"><span>Lifetime earnings</span><b class="money">{{ money(state.totals.earned) }}</b></div>
                </div>
                <a href="#" class="side-box ad-box" @click.prevent="openAd">
                  <div class="side-title">Sponsored</div>
                  <p><b>{{ ad.head }}</b> {{ ad.body }}</p>
                  <span class="ad-cta">{{ ad.cta }} »</span>
                </a>
              </aside>
            </div>
          </template>

          <!-- JOB BOARD -->
          <template v-else-if="page.kind === 'board'">
            <div v-if="allJobs.length === 0" class="construction">
              <div class="cone" aria-hidden="true">🚧</div>
              <h2>This page is under construction!</h2>
              <p class="muted">Our webmaster is busy uploading this week's listings over a 33.6k modem. Please check back soon.</p>
              <a href="#" @click.prevent="go({ kind: 'home' })">« Back to My Career</a>
            </div>
            <div v-else class="two-col">
              <aside class="col-side cats">
                <div class="side-title">Categories</div>
                <p v-if="trackStats.length === 0" class="muted">No categories yet.</p>
                <a
                  v-for="t in trackStats"
                  :key="t.track"
                  href="#"
                  class="cat"
                  :class="{ on: t.track === boardTrack }"
                  @click.prevent="openBoard(t.track)"
                >
                  <span class="cat-glyph" aria-hidden="true">{{ t.info.glyph }}</span>
                  <span class="grow">{{ t.info.label }}<span v-if="t.mine" class="cat-mine" title="Your current field"> ★</span></span>
                  <span class="cat-count" :title="`${t.visible} listed, ${t.ok} you qualify for`">{{ t.visible }}</span>
                  <span v-if="t.ok" class="cat-ok" :title="`${t.ok} you qualify for`">✔{{ t.ok }}</span>
                </a>
              </aside>
              <div class="col-main">
                <h1 class="page-title">{{ trackInfo(boardTrack).glyph }} {{ trackInfo(boardTrack).label }}</h1>
                <p class="track-blurb muted">{{ trackInfo(boardTrack).blurb }}</p>
                <div v-if="boardJobs.length" class="ads">
                  <JobListing v-for="j in boardJobs" :key="j.id" :job="j" @open="openJob(j)" @apply="requestApply(j)" />
                </div>
                <div v-else class="empty-board">
                  <b>No listings in this category match your profile.</b>
                  <p class="muted">Employers here want more experience than you have. Keep training — postings appear as you get close to qualifying.</p>
                </div>
                <p v-if="hiddenInTrack > 0" class="hidden-note">
                  🔒 {{ hiddenInTrack }} more premium listing{{ hiddenInTrack === 1 ? '' : 's' }} in this category {{ hiddenInTrack === 1 ? 'is' : 'are' }} hidden until
                  your profile is a closer match.
                </p>
              </div>
            </div>
          </template>

          <!-- POSTING -->
          <template v-else-if="page.kind === 'job'">
            <JobPosting
              v-if="postingJob"
              :job="postingJob"
              @apply="requestApply(postingJob)"
              @quit="dialog = { kind: 'quit' }"
              @track="openBoard($event)"
            />
            <div v-else class="notfound">
              <h2>404 — Posting not found</h2>
              <p class="muted">This position has been filled or removed. The early bird gets the worm, and the early worm gets hired.</p>
              <a href="#" @click.prevent="openBoard()">Back to the Job Board</a>
            </div>
          </template>

          <!-- RESUME -->
          <template v-else>
            <h1 class="page-title">My Résumé</h1>
            <div class="resume-head">
              <div>
                <b>{{ state.player.name }}</b> <span class="muted">a.k.a. {{ state.player.handle }}</span><br />
                <span class="muted">Port Lumen · Available {{ job ? 'for the right offer' : 'immediately' }}</span>
              </div>
            </div>
            <table v-if="resume.length" class="resume">
              <thead>
                <tr>
                  <th>Position</th>
                  <th>Employer</th>
                  <th>Level</th>
                  <th>Days</th>
                  <th>Pay now</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="r in resume" :key="r.id" :class="{ cur: r.id === state.job }">
                  <td>
                    <a href="#" @click.prevent="openJob(r.def)">{{ r.def.title }}</a>
                    <span v-if="r.id === state.job" class="pill good">Current</span>
                  </td>
                  <td>{{ r.def.employer }}</td>
                  <td>{{ r.p.level }}</td>
                  <td>{{ r.p.days }}</td>
                  <td class="money">{{ money(payInfo(state, r.def).total) }}</td>
                  <td>
                    <button
                      v-if="r.id !== state.job"
                      type="button"
                      class="btn small"
                      :disabled="applyStatus(state, r.def).status !== 'ok'"
                      :title="applyStatus(state, r.def).reason"
                      @click="requestApply(r.def)"
                    >
                      Rehire
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
            <p v-else class="muted empty">Work experience: none yet. Hobbies: computers. References: your mom (biased).</p>
          </template>
        </main>

        <footer class="site-foot">
          <div>© 2002 LumenJobs Network · <span class="fake-link">Privacy</span> · <span class="fake-link">Employers</span> · <span class="fake-link">Contact webmaster</span></div>
          <div class="muted">Best viewed at 800×600 in any 4.0 browser.</div>
          <div class="counter" title="Visitors since 1999">
            <span v-for="(d, i) in hitCounter" :key="i">{{ d }}</span>
          </div>
        </footer>
      </div>
    </BrowserFrame>

    <MsgBox
      v-if="dialog?.kind === 'apply'"
      title="Submit application"
      icon="question"
      ok-label="Accept offer"
      @ok="confirmApply(dialog.job)"
      @cancel="dialog = null"
    >
      <p>
        <b>{{ dialog.job.employer }}</b> is ready to hire you as <b>{{ dialog.job.title }}</b> at
        <b class="money">{{ money(payInfo(state, dialog.job).total) }}/day</b>.
      </p>
      <p>Shift: {{ shiftLabel(dialog.job.shiftStart, dialog.job.hours) }}, every day.</p>
      <p v-if="applyTakes.length" class="muted">The shift replaces {{ applyTakes.map(t => `${t.label} ${t.hours}h`).join(', ') }} in your planner.</p>
      <p v-if="job" class="warn">You will resign as {{ job.title }} at {{ job.employer }}.</p>
    </MsgBox>

    <MsgBox v-else-if="dialog?.kind === 'quit' && job" title="Resign" icon="warn" ok-label="Resign" danger @ok="confirmQuit" @cancel="dialog = null">
      <p>Hand in your notice as <b>{{ job.title }}</b> at {{ job.employer }}?</p>
      <p class="muted">No more paychecks. Your level ({{ levelOf(state, job) }}) stays on file if you are ever rehired.</p>
    </MsgBox>

    <MsgBox v-else-if="dialog?.kind === 'refused'" title="Application declined" icon="error" no-cancel @ok="dialog = null">
      <p>
        <b>{{ dialog.job.employer }}</b> regrets to inform you that your application for <b>{{ dialog.job.title }}</b> was not successful.
      </p>
      <p class="bad">{{ dialog.reason }}</p>
      <ReqList :cond="dialog.job.req" />
    </MsgBox>
  </div>
</template>

<style scoped>
.jobs-app {
  position: relative;
  padding: 0;
  gap: 0;
  --site-navy: #1c3f7a;
  --site-sky: #e6eef9;
  --site-rule: #9fb6d9;
  --site-link: #0033cc;
  --site-orange: #ff8a00;
  --site-orange-ink: #b35900;
}
.site {
  container-type: inline-size;
  font-family: Verdana, var(--font-ui);
  font-size: 11px;
  background: #fff;
  display: flex;
  flex-direction: column;
}
.site > * {
  flex: none;
}
.site a {
  color: var(--site-link);
}
.site-head {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 8px 12px;
  color: #fff;
  background: linear-gradient(180deg, #2c5aa0, var(--site-navy));
  border-bottom: 3px solid var(--site-orange);
}
.logo {
  font: italic bold 22px 'Trebuchet MS', Verdana, sans-serif;
  letter-spacing: -0.5px;
  text-shadow: 1px 1px 0 rgb(0 0 0 / 40%);
  white-space: nowrap;
}
.logo-b {
  color: var(--site-orange);
}
.logo-c {
  font-size: 12px;
  color: #cfe0ff;
}
.tagline {
  flex: 1;
  font-size: 11px;
  font-style: italic;
  color: #cfe0ff;
}
.welcome {
  text-align: right;
  font-size: 10px;
}
.welcome .muted {
  color: #bcd0f0;
}
.site-nav {
  display: flex;
  align-items: center;
  gap: 1px;
  padding: 0 8px;
  background: var(--site-sky);
  border-bottom: 1px solid var(--site-rule);
}
.site-nav a {
  padding: 4px 10px;
  font-weight: bold;
  text-decoration: none;
  color: var(--site-navy);
}
.site-nav a:hover {
  text-decoration: underline;
}
.site-nav a.on {
  background: #fff;
  color: var(--site-orange-ink);
  box-shadow: inset 0 2px 0 var(--site-orange);
}
.nav-hot {
  margin-left: 4px;
  font-size: 9px;
  font-weight: bold;
  color: #fff;
  background: #e0141e;
  padding: 0 4px;
  animation: blink 1.2s steps(2, start) infinite;
}
@keyframes blink {
  to {
    visibility: hidden;
  }
}
.nav-hint {
  margin-left: auto;
  font-size: 10px;
  color: var(--muted);
}
.ticker {
  display: flex;
  align-items: center;
  border-bottom: 1px dotted var(--site-rule);
  background: #fffdf2;
  overflow: hidden;
}
.ticker-tag {
  flex: none;
  font-size: 9px;
  font-weight: bold;
  color: #fff;
  background: var(--site-orange);
  padding: 2px 6px;
}
.ticker-track {
  flex: 1;
  overflow: hidden;
  white-space: nowrap;
}
.ticker-inner {
  display: inline-block;
  padding-left: 100%;
  animation: ticker 32s linear infinite;
}
.ticker:hover .ticker-inner {
  animation-play-state: paused;
}
.ticker-inner a {
  margin-right: 34px;
  font-size: 10px;
  text-decoration: none;
}
.ticker-inner a:hover {
  text-decoration: underline;
}
@keyframes ticker {
  from {
    transform: translateX(0);
  }
  to {
    transform: translateX(-100%);
  }
}
@media (prefers-reduced-motion: reduce) {
  .ticker-inner,
  .nav-hot {
    animation: none;
  }
  .ticker-inner {
    padding-left: 8px;
  }
}
.site > .site-main {
  flex: 1 0 auto;
}
.site-main {
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.page-title {
  font-family: 'Trebuchet MS', Verdana, sans-serif;
  font-size: 17px;
  color: var(--site-navy);
  margin-bottom: 6px;
}
.section {
  margin: 10px 0 4px;
  font-size: 12px;
  color: var(--site-navy);
  border-bottom: 1px solid var(--site-rule);
  padding-bottom: 2px;
}
.banner {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  border: 1px solid;
  font-weight: bold;
}
.banner span {
  flex: 1;
}
.banner.good {
  color: var(--good);
  background: #eaf6ea;
  border-color: #b9dcb9;
}
.banner.info {
  color: var(--info);
  background: #eaf0fa;
  border-color: #bccde9;
}
.two-col {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}
.col-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}
.col-side {
  width: 170px;
  flex: none;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.two-col > .col-side:first-child {
  order: 0;
}
.side-box {
  border: 1px solid var(--site-rule);
  background: var(--site-sky);
  padding: 6px 8px;
}
.side-title {
  font-weight: bold;
  color: var(--site-navy);
  border-bottom: 1px solid var(--site-rule);
  padding-bottom: 2px;
  margin-bottom: 4px;
  font-size: 11px;
}
.kv {
  display: flex;
  justify-content: space-between;
  padding: 1px 0;
}
.ad-box {
  background: #fffdf2;
  border-style: dashed;
}
.ad-box {
  display: block;
  text-decoration: none;
  color: inherit;
}
.site a.ad-box {
  color: inherit;
}
.ad-box:hover {
  border-color: var(--site-orange);
}
.ad-box p {
  font-size: 10px;
  margin: 0;
}
.ad-cta {
  display: inline-block;
  margin-top: 4px;
  font-size: 10px;
  font-weight: bold;
  color: var(--site-link);
  text-decoration: underline;
}
.nojob {
  display: flex;
  gap: 12px;
  padding: 12px;
  border: 1px solid var(--site-rule);
  background: linear-gradient(#fff, var(--site-sky));
}
.nojob-icon {
  font-size: 34px;
}
.nojob h2 {
  font-size: 14px;
  color: var(--site-navy);
  margin-bottom: 4px;
}
.rec-list {
  display: flex;
  flex-direction: column;
}
.rec {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 4px;
  border-bottom: 1px dotted var(--site-rule);
}
.rec a {
  font-weight: bold;
}
.empty {
  font-style: italic;
}
.cats {
  border: 1px solid var(--site-rule);
  background: var(--site-sky);
  padding: 6px;
  gap: 1px;
}
.cat {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 3px 4px;
  text-decoration: none;
  border: 1px solid transparent;
}
.cat:hover {
  background: #fff;
  border-color: var(--site-rule);
}
.cat.on {
  background: #fff;
  border-color: var(--site-orange);
  font-weight: bold;
}
.cat-mine {
  color: var(--site-orange-ink);
}
.cat-count {
  color: var(--muted);
  font-size: 10px;
}
.cat-ok {
  font-size: 9px;
  color: var(--good);
  font-weight: bold;
}
.track-blurb {
  margin-top: -4px;
  font-style: italic;
}
.ads {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.empty-board {
  border: 1px dashed var(--site-rule);
  padding: 12px;
  background: #fafcff;
}
.hidden-note {
  margin-top: 8px;
  font-size: 10px;
  color: var(--muted);
}
.construction {
  text-align: center;
  padding: 24px 12px;
  border: 2px dashed #f0c040;
  background: repeating-linear-gradient(135deg, #fffbe6 0 14px, #fff4c2 14px 28px);
}
.construction .cone {
  font-size: 34px;
}
.construction h2 {
  font-size: 15px;
  color: var(--site-navy);
  margin: 4px 0;
}
.notfound h2 {
  font-size: 16px;
  color: var(--site-navy);
}
.resume-head {
  padding: 8px;
  border: 1px solid var(--site-rule);
  background: var(--site-sky);
  margin-bottom: 6px;
}
.resume {
  width: 100%;
  border-collapse: collapse;
}
.resume th,
.resume td {
  border: 1px solid var(--site-rule);
  padding: 3px 6px;
  text-align: left;
}
.resume th {
  background: var(--site-navy);
  color: #fff;
}
.resume .pill {
  margin-left: 6px;
}
.resume tr.cur td {
  background: #fffaf0;
}
.site-foot {
  margin-top: 12px;
  padding: 8px 12px 12px;
  border-top: 1px solid var(--site-rule);
  text-align: center;
  font-size: 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  background: #f7f9fc;
}
.fake-link {
  color: var(--site-link);
  text-decoration: underline;
}
.counter {
  display: inline-flex;
  gap: 1px;
  margin-top: 2px;
}
.counter span {
  font: bold 11px var(--font-mono);
  color: #7fff7f;
  background: #111;
  padding: 1px 3px;
  border: 1px solid #444;
}
@container (max-width: 560px) {
  .two-col {
    flex-direction: column;
  }
  .col-side {
    width: 100%;
  }
}
</style>
