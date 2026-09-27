<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { deleteSave, formatShortDate, listSaves, SLOTS, type SaveMeta, type SaveSlot } from '@/engine'
import { loadFromCode, loadSlot } from '@/ui/game'
import { closeAll } from '@/ui/wm'
import { agoLabel, roman } from './describe'
import { confirmBox } from './msgbox'
import { nav } from './nav'
import { applySkin, skinState } from './skin'
import { exitApp, isDesktopApp } from '@/ui/platform'

const desktopApp = isDesktopApp()

// ── Boot sequence ──────────────────────────────────────────────────────────
type Phase = 'bios' | 'splash' | 'menu'
const phase = ref<Phase>(nav.booted ? 'menu' : 'bios')

interface BiosLine {
  at: number
  text: string
  mem?: boolean
}
const MEM_TOTAL = 65536
const BIOS: BiosLine[] = [
  { at: 0, text: 'LumenTek Modular BIOS v4.51PG, An Eco-Watt Ally' },
  { at: 90, text: 'Copyright (C) 1984-2001, LumenTek Software, Inc.' },
  { at: 150, text: '' },
  { at: 230, text: 'BEIGEBOX-686 Rev 2.1 — assembled by Port Lumen Electronics' },
  { at: 300, text: '' },
  { at: 420, text: 'Main Processor  : 686-class 350MHz' },
  { at: 520, text: '', mem: true },
  { at: 1420, text: 'Cache Memory    : 512K' },
  { at: 1500, text: '' },
  { at: 1580, text: 'Plug-n-Pray BIOS Extension v1.0A' },
  { at: 1700, text: 'Initialize Plug-n-Pray Cards...  PnP Init Completed' },
  { at: 1800, text: '' },
  { at: 1900, text: 'Detecting Primary Master   ... LUMDRIVE LD-4300A' },
  { at: 2080, text: 'Detecting Primary Slave    ... None' },
  { at: 2220, text: 'Detecting Secondary Master ... 24X CD-ROM' },
  { at: 2360, text: 'Detecting Secondary Slave  ... None' },
  { at: 2460, text: '' },
  { at: 2540, text: 'Modem on COM2 ............... DataFlux 33.6k Voice' },
  { at: 2680, text: 'Mouse on PS/2 ............... OK (ball needs cleaning)' },
  { at: 2820, text: 'Parental Supervision ........ Not Detected' },
  { at: 2960, text: '' },
  { at: 3060, text: 'Verifying DMI Pool Data ............ Update Success' },
  { at: 3360, text: 'Boot from HDD 0 ...' },
]
const BIOS_END = 3800
const SPLASH_MS = 2300

const shownLines = ref(0)
const memK = ref(0)
const timers: ReturnType<typeof setTimeout>[] = []
let memTimer: ReturnType<typeof setInterval> | null = null

function later(ms: number, fn: () => void): void {
  timers.push(setTimeout(fn, ms))
}

function clearBootTimers(): void {
  for (const t of timers) clearTimeout(t)
  timers.length = 0
  if (memTimer !== null) clearInterval(memTimer)
  memTimer = null
}

function runBoot(): void {
  BIOS.forEach((line, i) => {
    later(line.at, () => {
      shownLines.value = i + 1
      if (line.mem) {
        memTimer = setInterval(() => {
          memK.value = Math.min(MEM_TOTAL, memK.value + 2048)
          if (memK.value >= MEM_TOTAL && memTimer !== null) {
            clearInterval(memTimer)
            memTimer = null
          }
        }, 26)
      }
    })
  })
  later(BIOS_END, () => {
    phase.value = 'splash'
  })
  later(BIOS_END + SPLASH_MS, finishBoot)
}

function finishBoot(): void {
  clearBootTimers()
  memK.value = MEM_TOTAL
  nav.booted = true
  phase.value = 'menu'
}

/** A key that skipped the boot must not also "press" the freshly focused tile on keyup. */
let skippedByKey = false

function onBootKey(e: Event): void {
  if (phase.value === 'menu') return
  if (e.type === 'keydown') skippedByKey = true
  finishBoot()
}

// ── Menu ───────────────────────────────────────────────────────────────────
const saves = ref<SaveMeta[]>(listSaves())
const auto = computed(() => saves.value.find(s => s.slot === 'auto'))
const manual = computed(() => saves.value.filter(s => s.slot !== 'auto').length)
type Panel = 'none' | 'load' | 'import'
const panel = ref<Panel>('none')
const error = ref<string>('')
const code = ref<string>('')
const firstTile = ref<HTMLButtonElement | null>(null)

function refreshSaves(): void {
  saves.value = listSaves()
}

function slotName(slot: SaveSlot): string {
  return slot === 'auto' ? 'Autosave' : `Slot ${slot}`
}

function slotMeta(slot: SaveSlot): SaveMeta | undefined {
  return saves.value.find(s => s.slot === slot)
}

const slotRows = computed(() => SLOTS.map(slot => ({ slot, meta: slotMeta(slot) })))

function describeSave(s: SaveMeta): string {
  return `${s.name} “${s.handle}” · Day ${s.day + 1}, ${formatShortDate(s.day)} · Act ${roman(s.act)}`
}

function toggle(p: Panel): void {
  error.value = ''
  panel.value = panel.value === p ? 'none' : p
}

function load(slot: SaveSlot): void {
  error.value = ''
  closeAll()
  if (!loadSlot(slot)) {
    error.value = `${slotName(slot)} would not load. The file may be damaged or from an incompatible version.`
    refreshSaves()
  }
}

function newGame(): void {
  nav.screen = 'wizard'
}

async function remove(slot: SaveSlot): Promise<void> {
  const meta = slotMeta(slot)
  if (!meta) return
  const ok = await confirmBox({
    title: 'Delete Saved Game',
    icon: 'warn',
    text: `Delete ${slotName(slot)} (${meta.name} “${meta.handle}”, day ${meta.day + 1})? This cannot be undone.`,
    ok: 'Delete',
    danger: true,
  })
  if (!ok) return
  deleteSave(slot)
  refreshSaves()
}

function importCode(): void {
  error.value = ''
  const c = code.value.trim()
  if (!c) {
    error.value = 'Paste a save code into the box first.'
    return
  }
  closeAll()
  if (!loadFromCode(c)) error.value = "That code didn't parse. Make sure you copied all of it — save codes are long and fragile."
}

// Typewriter quips under the logo.
const QUIPS = [
  'Your parents think you are doing homework.',
  'Every packet leaves a footprint.',
  'Rent is due on the first. So is the revolution.',
  'Port Lumen never sleeps. Neither will you.',
  'Trust the code. Doubt the people. Call your mother.',
  "The modem screams so you don't have to.",
  'Somewhere in this city, a server is waiting for you.',
]
const typed = ref<string>('')
let quipIndex = Math.floor(Math.random() * QUIPS.length)
let typeTimer: ReturnType<typeof setTimeout> | null = null

function typeNext(pos: number): void {
  const quip = QUIPS[quipIndex % QUIPS.length] ?? ''
  if (pos <= quip.length) {
    typed.value = quip.slice(0, pos)
    typeTimer = setTimeout(() => {
      typeNext(pos + 1)
    }, 42)
  } else {
    typeTimer = setTimeout(() => {
      quipIndex++
      typeNext(0)
    }, 2800)
  }
}

watch(
  phase,
  async p => {
    if (p !== 'menu') return
    refreshSaves()
    if (typeTimer === null) typeNext(0)
    if (skippedByKey) return
    await nextTick()
    firstTile.value?.focus()
  },
  { immediate: true },
)

onMounted(() => {
  if (phase.value === 'bios') runBoot()
  window.addEventListener('keydown', onBootKey)
  window.addEventListener('pointerdown', onBootKey)
})

onBeforeUnmount(() => {
  clearBootTimers()
  if (typeTimer !== null) clearTimeout(typeTimer)
  window.removeEventListener('keydown', onBootKey)
  window.removeEventListener('pointerdown', onBootKey)
})

const year = new Date().getFullYear()
</script>

<template>
  <div class="title-root">
    <!-- BIOS power-on self test -->
    <div v-if="phase === 'bios'" class="bios" aria-label="Boot sequence — press any key to skip">
      <div class="eco" aria-hidden="true">
        <span class="eco-star">✶</span>
        <span class="eco-name">LUMEN</span>
        <span class="eco-sub">eco·watt</span>
      </div>
      <div class="bios-lines">
        <template v-for="(line, i) in BIOS" :key="i">
          <div v-if="i < shownLines" class="bios-line">
            <template v-if="line.mem">{{ `Memory Testing  : ${memK}K${memK >= MEM_TOTAL ? ' OK' : ''}` }}</template>
            <template v-else>{{ line.text || ' ' }}</template>
          </div>
        </template>
        <div class="bios-line"><span class="caret">_</span></div>
      </div>
      <div class="bios-foot">
        <div>Press <b>DEL</b> to enter SETUP</div>
        <div>09/01/2001-LX686-BEIGEBOX-2A69LT0C-00</div>
      </div>
      <div class="skip">Press any key to skip</div>
    </div>

    <!-- Splash -->
    <div v-else-if="phase === 'splash'" class="splash">
      <div class="logo big">
        <div class="logo-mark" aria-hidden="true"><span class="screen"><i>&gt;_</i></span></div>
        <div class="logo-words">
          <span class="logo-hacker">Hacker</span><span class="logo-sim">Sim</span><span class="logo-year">2001</span>
        </div>
        <div class="logo-sub">Home Edition</div>
      </div>
      <div class="splash-bar" aria-hidden="true"><i></i><i></i><i></i></div>
      <div class="splash-copy">Copyright © 2001 The HackerSim Team · Port Lumen</div>
    </div>

    <!-- Welcome / main menu -->
    <div v-else class="welcome">
      <div class="w-top">
        <span>Port Lumen · September 2001</span>
      </div>
      <div class="w-mid">
        <div class="w-left">
          <div class="logo">
            <div class="logo-mark" aria-hidden="true"><span class="screen"><i>&gt;_</i></span></div>
            <div class="logo-words">
              <span class="logo-hacker">Hacker</span><span class="logo-sim">Sim</span><span class="logo-year">2001</span>
            </div>
            <div class="logo-sub">Home Edition</div>
          </div>
          <p class="quip" aria-live="off">&gt; {{ typed }}<span class="caret">_</span></p>
          <p class="w-hint">To begin, click an option.</p>
        </div>

        <div class="w-divider" aria-hidden="true"><span class="packet"></span></div>

        <div class="w-right">
          <button ref="firstTile" type="button" class="tile" :disabled="!auto" @click="load('auto')">
            <span class="tile-ico continue" aria-hidden="true">▶</span>
            <span class="tile-txt">
              <b>Continue</b>
              <small v-if="auto">{{ describeSave(auto) }} · saved {{ agoLabel(auto.savedAt) }}</small>
              <small v-else>No life in progress yet.</small>
            </span>
          </button>
          <button type="button" class="tile" @click="newGame">
            <span class="tile-ico new" aria-hidden="true">✚</span>
            <span class="tile-txt">
              <b>New Game</b>
              <small>Install a new life: name, handle, background, traits.</small>
            </span>
          </button>
          <button type="button" class="tile" :class="{ open: panel === 'load' }" :aria-expanded="panel === 'load'" @click="toggle('load')">
            <span class="tile-ico load" aria-hidden="true">📂</span>
            <span class="tile-txt">
              <b>Load Game</b>
              <small>{{ manual ? `${manual} saved slot${manual === 1 ? '' : 's'}` : 'Autosave and three manual slots' }}</small>
            </span>
          </button>
          <div v-if="panel === 'load'" class="sub">
            <div v-for="row in slotRows" :key="row.slot" class="slot" :class="{ empty: !row.meta }">
              <div class="slot-info">
                <b>{{ slotName(row.slot) }}</b>
                <small v-if="row.meta">{{ describeSave(row.meta) }} · {{ agoLabel(row.meta.savedAt) }}</small>
                <small v-else>— empty —</small>
              </div>
              <template v-if="row.meta">
                <button type="button" class="btn small" @click="load(row.slot)">Load</button>
                <button type="button" class="btn small danger" :title="`Delete ${slotName(row.slot)}`" @click="remove(row.slot)">✕</button>
              </template>
            </div>
          </div>
          <button type="button" class="tile" :class="{ open: panel === 'import' }" :aria-expanded="panel === 'import'" @click="toggle('import')">
            <span class="tile-ico import" aria-hidden="true">⇪</span>
            <span class="tile-txt">
              <b>Import Save Code</b>
              <small>Bring a life over from another computer.</small>
            </span>
          </button>
          <div v-if="panel === 'import'" class="sub">
            <label class="imp-label" for="import-code">Paste your save code:</label>
            <textarea id="import-code" v-model="code" class="imp-code" rows="4" spellcheck="false" placeholder="eyJ2ZXJzaW9uIjox…"></textarea>
            <div class="row">
              <span class="grow"></span>
              <button type="button" class="btn primary" @click="importCode">Load from code</button>
            </div>
          </div>
          <button v-if="desktopApp" type="button" class="tile" @click="exitApp">
            <span class="tile-ico" aria-hidden="true">✕</span>
            <span class="tile-txt">
              <b>Exit</b>
              <small>Back to your real desktop. (F11 toggles fullscreen.)</small>
            </span>
          </button>
          <p v-if="error" class="w-error" role="alert">⚠ {{ error }}</p>
        </div>
      </div>
      <div class="w-bottom">
        <div class="credits">
          HackerSim 2001 · a life sim about code, rent and consequences · © {{ year }} The HackerSim Team.
          <br />Port Lumen and everyone in it are fictional. All hacking is make-believe; no real systems were harmed.
        </div>
        <div class="skin-pick" role="group" aria-label="Desktop style">
          <span>Look:</span>
          <button type="button" class="skin-btn" :class="{ on: skinState.skin === 'luna' }" @click="applySkin('luna')">Luna</button>
          <button type="button" class="skin-btn" :class="{ on: skinState.skin === 'classic' }" @click="applySkin('classic')">Classic</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.title-root {
  position: fixed;
  inset: 0;
  background: #000;
  color: #fff;
  overflow: hidden;
  user-select: none;
}
.caret {
  animation: hs-blink 1s steps(1) infinite;
}

/* ── BIOS ── */
.bios {
  position: absolute;
  inset: 0;
  padding: 28px 36px;
  background: #000;
  color: #c0c0c0;
  font: 15px/1.35 var(--font-mono);
  cursor: default;
}
.bios-line {
  white-space: pre;
  min-height: 1.35em;
}
.bios-lines .bios-line:first-child {
  color: #fff;
}
.eco {
  position: absolute;
  top: 24px;
  right: 36px;
  width: 150px;
  height: 84px;
  border: 2px solid #5fd35f;
  border-radius: 10px;
  display: grid;
  grid-template-columns: 44px 1fr;
  grid-template-rows: 1fr 1fr;
  align-items: center;
  padding: 6px 10px;
  color: #5fd35f;
  background: radial-gradient(circle at 25% 50%, rgb(95 211 95 / 18%), transparent 60%);
}
.eco-star {
  grid-row: 1 / 3;
  font-size: 40px;
  line-height: 1;
  color: #ffd84a;
}
.eco-name {
  font: bold 22px var(--font-title);
  letter-spacing: 2px;
  align-self: end;
}
.eco-sub {
  font: italic 13px var(--font-title);
  align-self: start;
}
.bios-foot {
  position: absolute;
  left: 36px;
  bottom: 24px;
  font-size: 14px;
}
.bios-foot b {
  color: #fff;
}
.skip {
  position: absolute;
  right: 36px;
  bottom: 24px;
  font-size: 13px;
  color: #808080;
  animation: hs-blink 1.4s steps(1) infinite;
}

/* ── Logo ── */
.logo {
  display: grid;
  grid-template-columns: auto auto;
  grid-template-rows: auto auto;
  column-gap: 14px;
  align-items: center;
  justify-content: end;
}
.logo-mark {
  grid-row: 1 / 3;
  width: 64px;
  height: 58px;
  border-radius: 6px 6px 4px 4px;
  background: linear-gradient(#efe9d6, #cfc6ac);
  border: 1px solid #8f876c;
  padding: 6px 6px 12px;
  box-shadow:
    2px 3px 6px rgb(0 0 0 / 45%),
    inset 0 -3px 0 #b3aa8e;
  position: relative;
}
.logo-mark::after {
  content: '';
  position: absolute;
  left: 22px;
  right: 22px;
  bottom: -8px;
  height: 7px;
  background: linear-gradient(#cfc6ac, #a79f84);
  border-radius: 0 0 4px 4px;
}
.screen {
  display: block;
  text-align: left;
  width: 100%;
  height: 100%;
  border-radius: 4px;
  background: radial-gradient(ellipse at 40% 35%, #0f3a1f, #041208 75%);
  box-shadow: inset 0 0 6px #000;
  padding: 4px 5px;
}
.screen i {
  font: bold 14px var(--font-mono);
  font-style: normal;
  color: var(--terminal-fg);
  text-shadow: 0 0 6px var(--terminal-fg);
  animation: hs-blink 1.2s steps(1) infinite;
}
.logo-words {
  font: bold italic 46px/1 var(--font-title);
  letter-spacing: -1px;
  white-space: nowrap;
}
.logo-hacker {
  color: #fff;
  text-shadow: 2px 3px 4px rgb(0 0 0 / 45%);
}
.logo-sim {
  background: linear-gradient(#ffe29a, #ff9f1c 55%, #e3650a);
  background-clip: text;
  -webkit-background-clip: text;
  color: transparent;
  filter: drop-shadow(2px 3px 3px rgb(0 0 0 / 45%));
}
.logo-year {
  display: inline-block;
  margin-left: 8px;
  padding: 2px 6px;
  border: 2px solid #fff;
  border-radius: 4px;
  font: bold 15px var(--font-title);
  font-style: normal;
  letter-spacing: 1px;
  vertical-align: super;
  color: #fff;
  background: rgb(0 0 0 / 18%);
}
.logo-sub {
  justify-self: end;
  font: italic 15px var(--font-title);
  color: #dfe8ff;
  letter-spacing: 1px;
}

/* ── Splash ── */
.splash {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 40px;
  background: #000;
  animation: fade 0.6s ease;
}
.splash .logo {
  justify-content: center;
}
.splash-bar {
  position: relative;
  width: 124px;
  height: 14px;
  border: 1px solid #b2b2b2;
  border-radius: 4px;
  overflow: hidden;
}
.splash-bar i {
  position: absolute;
  top: 2px;
  width: 8px;
  height: 8px;
  border-radius: 1px;
  background: linear-gradient(#6f9cff, #1f4fd8);
  animation: slide 1.5s linear infinite;
}
.splash-bar i:nth-child(2) {
  animation-delay: 0.12s;
}
.splash-bar i:nth-child(3) {
  animation-delay: 0.24s;
}
.splash-copy {
  position: absolute;
  bottom: 28px;
  font-size: 11px;
  color: #777;
}

/* ── Welcome screen ── */
.welcome {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  background: #5a7edc;
  animation: fade 0.5s ease;
}
.w-top,
.w-bottom {
  flex: none;
  background: #00309c;
  position: relative;
}
.w-top {
  height: 72px;
  display: flex;
  align-items: flex-end;
  justify-content: flex-end;
  padding: 0 36px 10px;
  font: 13px var(--font-title);
  color: #b9cdf5;
  letter-spacing: 1px;
}
.w-top::after,
.w-bottom::before {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  height: 2px;
}
.w-top::after {
  bottom: -2px;
  background: linear-gradient(90deg, #00309c 0%, #ffffff 35%, #ffffff 55%, #00309c 100%);
}
.w-bottom::before {
  top: -2px;
  background: linear-gradient(90deg, #00309c 0%, #f3a13a 35%, #f3a13a 55%, #00309c 100%);
}
.w-mid {
  flex: 1;
  min-height: 0;
  display: flex;
  align-items: center;
  background:
    radial-gradient(ellipse 45% 60% at 12% 8%, rgb(160 190 250 / 75%), transparent 70%),
    radial-gradient(ellipse 30% 40% at 90% 100%, rgb(20 50 150 / 45%), transparent 70%),
    #5a7edc;
  position: relative;
  overflow: hidden;
}
.w-mid::before {
  /* slow drifting light */
  content: '';
  position: absolute;
  inset: -20%;
  background: radial-gradient(circle at 50% 50%, rgb(255 255 255 / 10%), transparent 35%);
  animation: drift 18s ease-in-out infinite alternate;
  pointer-events: none;
}
.w-left {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  padding: 0 36px;
  text-align: right;
  position: relative;
}
.quip {
  margin: 22px 0 6px;
  min-height: 1.4em;
  font: 13px var(--font-mono);
  color: #eaf1ff;
  text-shadow: 1px 1px 1px rgb(0 0 0 / 35%);
}
.w-hint {
  font: 15px var(--font-title);
  color: #fff;
  opacity: 0.9;
}
.w-divider {
  position: relative;
  flex: none;
  width: 1px;
  align-self: stretch;
  margin: 50px 0;
  background: linear-gradient(to bottom, transparent, rgb(255 255 255 / 85%) 30%, rgb(255 255 255 / 85%) 70%, transparent);
}
.packet {
  position: absolute;
  left: -2px;
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: #ffd46a;
  box-shadow: 0 0 8px 2px #ffd46a;
  animation: packet 4.5s ease-in-out infinite;
}
.w-right {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 6px;
  padding: 0 36px;
  max-height: 100%;
  overflow: auto;
  position: relative;
  user-select: text;
}
.tile {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 400px;
  max-width: 100%;
  padding: 6px 14px 6px 6px;
  border: 0;
  border-radius: 8px;
  background: none;
  color: #fff;
  font: inherit;
  text-align: left;
  cursor: pointer;
}
.tile:hover:not(:disabled),
.tile:focus-visible,
.tile.open {
  background: linear-gradient(90deg, rgb(10 40 140 / 55%), rgb(10 40 140 / 0%));
  outline: none;
}
.tile:disabled {
  cursor: default;
  opacity: 0.55;
}
.tile-ico {
  flex: none;
  width: 48px;
  height: 48px;
  border: 2px solid #fff;
  border-radius: 5px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-emoji);
  font-size: 24px;
  color: #fff;
  box-shadow: 1px 2px 4px rgb(0 0 0 / 35%);
  transition: border-color 0.15s;
}
.tile:hover:not(:disabled) .tile-ico,
.tile:focus-visible .tile-ico,
.tile.open .tile-ico {
  border-color: #fbca3a;
}
.tile-ico.continue {
  background: linear-gradient(135deg, #58c858, #1f8a1f);
  font-family: var(--font-ui);
}
.tile-ico.new {
  background: linear-gradient(135deg, #ffb65c, #e0661a);
  font-family: var(--font-ui);
  font-weight: bold;
}
.tile-ico.load {
  background: linear-gradient(135deg, #9fc3ff, #3a6ed8);
}
.tile-ico.import {
  background: linear-gradient(135deg, #d4a8ff, #7a3fc8);
  font-family: var(--font-ui);
  font-weight: bold;
}
.tile-txt {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}
.tile-txt b {
  font: 18px var(--font-title);
  text-shadow: 1px 1px 2px rgb(0 0 0 / 40%);
}
.tile-txt small {
  font-size: 11px;
  color: #dbe6ff;
  overflow: hidden;
  text-overflow: ellipsis;
}
.sub {
  width: 400px;
  max-width: 100%;
  margin: -2px 0 4px 62px;
  padding: 8px 10px;
  border-radius: 6px;
  background: rgb(0 30 110 / 45%);
  border: 1px solid rgb(255 255 255 / 25%);
  display: flex;
  flex-direction: column;
  gap: 6px;
  color: #fff;
}
.slot {
  display: flex;
  align-items: center;
  gap: 6px;
}
.slot-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}
.slot-info small {
  color: #cfdcff;
  font-size: 11px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.slot.empty {
  opacity: 0.6;
}
.imp-label {
  font-size: 11px;
}
.imp-code {
  width: 100%;
  resize: vertical;
  font: 11px var(--font-mono);
  color: #000;
}
.w-error {
  width: 400px;
  max-width: 100%;
  margin: 6px 0 0;
  padding: 6px 10px;
  border-radius: 5px;
  background: rgb(160 20 10 / 70%);
  border: 1px solid rgb(255 255 255 / 45%);
}
.w-bottom {
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  padding: 0 36px;
}
.credits {
  font-size: 11px;
  line-height: 1.5;
  color: #b9cdf5;
}
.skin-pick {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: #b9cdf5;
  flex: none;
}
.skin-btn {
  padding: 2px 8px;
  border: 1px solid rgb(255 255 255 / 45%);
  border-radius: 3px;
  background: none;
  color: #fff;
  font: inherit;
  cursor: pointer;
}
.skin-btn.on {
  background: #fff;
  color: #00309c;
  font-weight: bold;
}

@keyframes slide {
  from {
    left: -30px;
  }
  to {
    left: 134px;
  }
}
@keyframes fade {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
@keyframes drift {
  from {
    transform: translate(-18%, -10%);
  }
  to {
    transform: translate(18%, 12%);
  }
}
@keyframes packet {
  0% {
    top: 0%;
    opacity: 0;
  }
  15% {
    opacity: 1;
  }
  85% {
    opacity: 1;
  }
  100% {
    top: 100%;
    opacity: 0;
  }
}

@media (max-width: 860px) {
  .w-mid {
    flex-direction: column;
    justify-content: center;
    gap: 16px;
    overflow: auto;
  }
  .w-left {
    align-items: center;
    text-align: center;
  }
  .logo {
    justify-content: center;
  }
  .w-divider {
    display: none;
  }
  .w-right {
    align-items: center;
    overflow: visible;
  }
  .sub {
    margin-left: 0;
  }
  .logo-words {
    font-size: 34px;
  }
}
</style>
