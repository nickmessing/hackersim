<script setup lang="ts">
import { computed, ref } from 'vue'
import { C, evalCond, formatDate, renderText, resume, type EndingDef } from '@/engine'
import { quitToTitle, useGame } from '@/ui/game'
import { closeAll, persistLayout } from '@/ui/wm'
import { confirmBox } from './msgbox'
import { nav } from './nav'
import { clearToasts } from './toasts'

const state = useGame()

const FALLBACK: EndingDef = {
  id: 'unknown',
  title: 'The End',
  tagline: 'Every story stops somewhere. Yours stopped here.',
  text: 'The details are fuzzy, like a VHS tape recorded over one too many times. What matters is that you made it this far — and that Port Lumen will remember your handle for a while.',
  epilogues: [],
  tone: 'bittersweet',
}

const ending = computed<EndingDef>(() => (state.ending ? C.endings.get(state.ending) : undefined) ?? FALLBACK)

/** Epilogue slides are decided when the screen opens. */
const epilogues = ending.value.epilogues.filter(e => evalCond(state, e.if))

const TONE_LABEL: Record<EndingDef['tone'], string> = {
  good: 'A good ending',
  bittersweet: 'A bittersweet ending',
  bad: 'A bad ending',
  weird: 'A strange ending',
}

/** 0 = the ending card, 1..n = epilogues, n+1 = final choices. */
const slide = ref<number>(0)
const lastSlide = epilogues.length + 1
const epilogue = computed(() => (slide.value >= 1 && slide.value <= epilogues.length ? epilogues[slide.value - 1] : undefined))

const mainText = computed(() => renderText(state, ending.value.text))
const epilogueText = computed(() => (epilogue.value ? renderText(state, epilogue.value.text) : []))

const discovered = computed(() => state.endingsSeen.length)
const total = computed(() => Math.max(C.endings.size, discovered.value))

function next(): void {
  if (slide.value < lastSlide) slide.value++
}
function skip(): void {
  slide.value = lastSlide
}

function continuePostgame(): void {
  state.flags['sys.postgame'] = true
  resume(state)
}

async function leave(to: 'title' | 'wizard'): Promise<void> {
  if (to === 'wizard') {
    const ok = await confirmBox({
      title: 'Start Over',
      icon: 'question',
      text: 'Start a brand-new life? Setup will back this playthrough up to a free save slot, if one is available, before installing.',
      ok: 'New Game',
    })
    if (!ok) return
  }
  persistLayout()
  closeAll()
  clearToasts()
  nav.screen = to
  quitToTitle()
}
</script>

<template>
  <div class="ending" :class="`tone-${ending.tone}`" role="dialog" aria-label="Ending">
    <div class="bar top" aria-hidden="true"></div>
    <div class="stage">
      <Transition name="slide" mode="out-in">
        <section v-if="slide === 0" key="card" class="card">
          <div class="kicker">{{ TONE_LABEL[ending.tone] }} · {{ formatDate(state.time.day) }}</div>
          <h1 class="title">{{ ending.title }}</h1>
          <p class="tagline">{{ ending.tagline }}</p>
          <div class="text">
            <p v-for="(p, i) in mainText" :key="i">{{ p }}</p>
          </div>
        </section>
        <section v-else-if="epilogue" :key="`ep-${slide}`" class="card epi">
          <div class="kicker">Epilogue {{ slide }} of {{ epilogues.length }}</div>
          <h2 class="epi-title">{{ epilogue.title }}</h2>
          <div class="text">
            <p v-for="(p, i) in epilogueText" :key="i">{{ p }}</p>
          </div>
        </section>
        <section v-else key="final" class="card final">
          <div class="kicker">The End</div>
          <h2 class="epi-title">{{ state.player.name }} “{{ state.player.handle }}”</h2>
          <p class="tagline">{{ ending.title }} — {{ ending.tagline }}</p>
          <p class="found">Endings discovered: <b>{{ discovered }}</b> of {{ total }}</p>
          <div class="choices">
            <button type="button" class="btn primary big" @click="continuePostgame">Continue playing (postgame)</button>
            <button type="button" class="btn big" @click="leave('wizard')">New Game</button>
            <button type="button" class="btn big" @click="leave('title')">Title Screen</button>
          </div>
          <p class="fine">Postgame keeps the world running: your job, your friends, your debts. The story has had its say.</p>
        </section>
      </Transition>
    </div>
    <div class="bar bottom">
      <div class="dots" aria-hidden="true">
        <span v-for="i in lastSlide + 1" :key="i" class="dot" :class="{ on: i - 1 === slide }"></span>
      </div>
      <div v-if="slide < lastSlide" class="nav">
        <button v-if="epilogues.length > 0 && slide < epilogues.length" type="button" class="link" @click="skip">Skip epilogues</button>
        <button type="button" class="btn primary" @click="next">Next ▸</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.ending {
  --accent: #f0c070;
  position: fixed;
  inset: 0;
  z-index: 2000;
  display: flex;
  flex-direction: column;
  background: radial-gradient(ellipse at 50% 40%, #1c1a28 0%, #07060b 75%);
  color: #ece6d6;
  animation: fade-in 1.2s ease;
}
.tone-good {
  --accent: #8fdc9a;
}
.tone-bittersweet {
  --accent: #f0c070;
}
.tone-bad {
  --accent: #ff7b6b;
}
.tone-weird {
  --accent: #c9a2ff;
}
.bar {
  flex: none;
  height: 64px;
  background: #000;
}
.bar.bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 28px;
}
.stage {
  flex: 1;
  min-height: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  overflow: auto;
}
.card {
  max-width: 640px;
  width: 100%;
  text-align: center;
}
.kicker {
  color: var(--accent);
  letter-spacing: 3px;
  text-transform: uppercase;
  font-size: 11px;
  margin-bottom: 14px;
}
.title {
  font: bold 42px/1.1 var(--font-serif);
  color: #fff;
  margin-bottom: 10px;
  text-shadow: 0 0 24px color-mix(in srgb, var(--accent) 45%, transparent);
}
.epi-title {
  font: bold 26px/1.2 var(--font-serif);
  color: #fff;
  margin-bottom: 12px;
}
.tagline {
  font: italic 16px/1.4 var(--font-serif);
  color: var(--accent);
  margin-bottom: 22px;
}
.text {
  text-align: left;
  font: 15px/1.65 var(--font-serif);
  color: #ddd6c4;
}
.text p {
  margin-bottom: 12px;
  white-space: pre-wrap;
}
.found {
  font-size: 13px;
  color: #bdb6a4;
  margin-bottom: 18px;
}
.choices {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}
.btn.big {
  min-width: 260px;
  padding: 6px 16px;
  font-size: 13px;
}
.fine {
  margin-top: 16px;
  font-size: 11px;
  color: #8a8474;
}
.dots {
  display: flex;
  gap: 6px;
}
.dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #3b3848;
}
.dot.on {
  background: var(--accent);
}
.nav {
  display: flex;
  align-items: center;
  gap: 16px;
}
.link {
  border: 0;
  background: none;
  color: #9b9484;
  font: inherit;
  text-decoration: underline;
  cursor: pointer;
}
.link:hover {
  color: #fff;
}
.slide-enter-active,
.slide-leave-active {
  transition:
    opacity 0.5s ease,
    transform 0.5s ease;
}
.slide-enter-from {
  opacity: 0;
  transform: translateY(12px);
}
.slide-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
@keyframes fade-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
</style>
