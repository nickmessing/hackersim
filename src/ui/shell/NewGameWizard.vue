<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { balance, C, formatDate, listSaves, loadGame, money, saveGame, SKILLS, SLOTS, START_HOUSING, type SkillId } from '@/engine'
import { newGame } from '@/ui/game'
import { closeAll, persistLayout } from '@/ui/wm'
import { describeMods, plainParagraphs } from './describe'
import { confirmBox } from './msgbox'
import { nav } from './nav'
import TitleBar from './TitleBar.vue'

type StepId = 'welcome' | 'identity' | 'background' | 'traits' | 'summary' | 'install'
const STEPS: { id: StepId; title: string; sub: string; glyph: string }[] = [
  { id: 'welcome', title: 'Welcome', sub: '', glyph: '' },
  { id: 'identity', title: 'User Information', sub: 'Tell Port Lumen who you are — and who you are online.', glyph: '🪪' },
  { id: 'background', title: 'Choose Background', sub: 'Where you came from decides what you start out good at.', glyph: '🧰' },
  { id: 'traits', title: 'Select Traits', sub: 'Pick your quirks. They stay with you for life.', glyph: '🎲' },
  { id: 'summary', title: 'Ready to Install', sub: 'Review your character record before Setup begins.', glyph: '📋' },
  { id: 'install', title: 'Installing HackerSim 2001', sub: 'Please wait while Setup installs your new life.', glyph: '💿' },
]

const step = ref<number>(0)

// ── Existing life in the autosave: keep a copy in a free slot before installing over it ──
const saves = listSaves()
const previous = saves.find(s => s.slot === 'auto')
const backupSlot = previous ? SLOTS.find(slot => slot !== 'auto' && !saves.some(s => s.slot === slot)) : undefined

function backupPrevious(): void {
  if (!previous || !backupSlot) return
  const old = loadGame('auto')
  if (old) saveGame(old, backupSlot)
}
const current = computed(() => STEPS[step.value] ?? STEPS[0])
const stepId = computed<StepId>(() => current.value?.id ?? 'welcome')

// ── Identity ───────────────────────────────────────────────────────────────
const name = ref<string>('')
const handle = ref<string>('')
const tried = ref<boolean>(false)
const nameInput = ref<HTMLInputElement | null>(null)

const NAME_RE = /^\p{L}[\p{L} .'-]{0,23}$/u
const HANDLE_RE = /^[A-Za-z0-9_.-]{2,16}$/
const nameOk = computed(() => NAME_RE.test(name.value.trim()))
const handleOk = computed(() => HANDLE_RE.test(handle.value.trim()))

const FIRST = ['Casey', 'Robin', 'Sam', 'Jordan', 'Toni', 'Mika', 'Dana', 'Nico', 'Kit', 'Remy', 'Ari', 'Jules']
const LAST = ['Moreau', 'Kowalski', 'Okafor', 'Lindqvist', 'Brandt', 'Ferreira', 'Nakamura', 'Doyle', 'Petrov', 'Castell', 'Whitlow', 'Abara']
const HANDLES = ['bytewren', 'd1alt0ne', 'lumenrat', 'nullpilot', 'staticmoth', 'packetfox', 'modemwolf', 'gh0stpager', 'lowbaud', 'hexmoth', 'tinfoilkid', 'c0ldsolder', 'quietkeys', 'rustbucket']

function pick<T>(list: readonly T[], avoid?: T): T | undefined {
  const pool = list.filter(x => x !== avoid)
  return pool[Math.floor(Math.random() * pool.length)]
}
function suggestName(): void {
  name.value = `${pick(FIRST) ?? 'Casey'} ${pick(LAST) ?? 'Moreau'}`
}
function suggestHandle(): void {
  handle.value = pick(HANDLES, handle.value) ?? 'bytewren'
}

// ── Background ─────────────────────────────────────────────────────────────
const backgrounds = [...C.backgrounds.values()]
const bgId = ref<string>(backgrounds[0]?.id ?? '')
const bg = computed(() => C.backgrounds.get(bgId.value))
const DEFAULT_MONEY = 150

function bonusList(skills: Partial<Record<SkillId, number>>): { skill: SkillId; label: string; value: number }[] {
  return SKILLS.filter(s => (skills[s] ?? 0) !== 0).map(s => ({ skill: s, label: balance.SKILL_LABELS[s], value: skills[s] ?? 0 }))
}
function itemNames(ids: string[] | undefined): string[] {
  return (ids ?? []).map(id => C.items.get(id)?.name).filter((n): n is string => n !== undefined)
}

// ── Traits ─────────────────────────────────────────────────────────────────
// Scars are earned through play (bad outcomes, big moments) — never picked at creation.
const traits = [...C.traits.values()].filter(t => t.scar !== true)
const needTraits = Math.min(2, traits.length)
const picked = ref<string[]>([])

function toggleTrait(id: string): void {
  if (picked.value.includes(id)) picked.value = picked.value.filter(t => t !== id)
  else if (picked.value.length < needTraits) picked.value = [...picked.value, id]
}

// ── Summary ────────────────────────────────────────────────────────────────
const sheet = computed(() =>
  SKILLS.map(s => {
    const level = bg.value?.skills[s] ?? 0
    return { skill: s, label: balance.SKILL_LABELS[s], level, mod: balance.skillMod(level) }
  }),
)
const startMoney = computed(() => bg.value?.money ?? DEFAULT_MONEY)
const home = C.housing.get(START_HOUSING)?.name ?? "Parents' flat"
const pickedTraits = computed(() => picked.value.map(id => C.traits.get(id)).filter(t => t !== undefined))

// ── Navigation ─────────────────────────────────────────────────────────────
const canNext = computed(() => {
  switch (stepId.value) {
    case 'identity':
      return nameOk.value && handleOk.value
    case 'background':
      return backgrounds.length === 0 || bg.value !== undefined
    case 'traits':
      return picked.value.length === needTraits
    case 'welcome':
    case 'summary':
      return true
    case 'install':
      return false
  }
})

function next(): void {
  if (stepId.value === 'identity') tried.value = true
  if (!canNext.value) return
  if (stepId.value === 'summary') {
    install()
    return
  }
  step.value = Math.min(step.value + 1, STEPS.length - 1)
}

function back(): void {
  if (stepId.value === 'install') return
  step.value = Math.max(0, step.value - 1)
}

async function cancel(): Promise<void> {
  const ok = await confirmBox({
    title: 'Exit Setup',
    icon: 'question',
    text: 'HackerSim 2001 is not installed yet. Are you sure you want to exit Setup?',
    ok: 'Exit Setup',
    cancel: 'Resume',
  })
  if (ok) nav.screen = 'title'
}

const nextBtn = ref<HTMLButtonElement | null>(null)

onMounted(() => {
  nextBtn.value?.focus()
})

// Keep the keyboard flowing: focus the first field, or the Next button, on every page.
watch(stepId, async id => {
  await nextTick()
  if (id === 'identity') nameInput.value?.focus()
  else nextBtn.value?.focus()
})

// ── Fake installer ─────────────────────────────────────────────────────────
const INSTALL_LINES = [
  'Unpacking adolescence.cab…',
  'Copying bad_habits.dll…',
  'Registering curiosity.ocx…',
  'Configuring modem init string ATZ…',
  'Syncing parental expectations…',
  'Updating Port Lumen street map…',
  'Setting the clock to 1 Sep 2001, 08:00…',
  'Creating shortcuts on your desktop…',
]
const installAt = ref<number>(0)
const installText = computed(() => INSTALL_LINES[Math.min(installAt.value, INSTALL_LINES.length - 1)] ?? '')
const installPct = computed(() => Math.min(1, installAt.value / INSTALL_LINES.length))
let installTimer: ReturnType<typeof setInterval> | null = null

function install(): void {
  step.value = STEPS.findIndex(s => s.id === 'install')
  installAt.value = 0
  installTimer = setInterval(() => {
    installAt.value++
    if (installAt.value > INSTALL_LINES.length) finish()
  }, 300)
}

function finish(): void {
  if (installTimer !== null) clearInterval(installTimer)
  installTimer = null
  backupPrevious()
  closeAll()
  persistLayout()
  nav.screen = 'title'
  newGame({
    name: name.value.trim(),
    handle: handle.value.trim(),
    background: bg.value?.id ?? '',
    traits: [...picked.value],
  })
}

onBeforeUnmount(() => {
  if (installTimer !== null) clearInterval(installTimer)
})

const innerSteps = STEPS.filter(s => s.id !== 'welcome' && s.id !== 'install')
const innerIndex = computed(() => innerSteps.findIndex(s => s.id === stepId.value))
</script>

<template>
  <div class="setup">
    <div class="setup-brand" aria-hidden="true">
      <span class="brand-title">HackerSim 2001</span>
      <span class="brand-sub">Setup</span>
    </div>

    <form class="wizard hs-window" role="dialog" aria-label="HackerSim 2001 Setup Wizard" @submit.prevent="next">
      <TitleBar title="HackerSim 2001 Setup Wizard" glyph="💿" :buttons="stepId === 'install' ? [] : ['close']" @close="cancel" />

      <!-- Welcome page: big side banner -->
      <div v-if="stepId === 'welcome'" class="page split">
        <div class="side" aria-hidden="true">
          <div class="side-disc"><span>HS</span></div>
          <div class="side-name">HackerSim<br /><b>2001</b></div>
        </div>
        <div class="split-body">
          <h1>Welcome to the HackerSim 2001 Setup Wizard</h1>
          <p>This wizard will install a new life on your computer.</p>
          <p>
            Port Lumen, September 2001. You are eighteen. You live with your parents, you own a beige PC with a
            33.6k modem, and you have a head full of ideas that nobody has asked for yet.
          </p>
          <p>
            It is strongly recommended that you close all other programs before continuing — especially your
            homework.
          </p>
          <p v-if="previous" class="prev" :class="{ warn: !backupSlot }">
            <template v-if="backupSlot">
              Setup found an existing life — {{ previous.name }} “{{ previous.handle }}”, day {{ previous.day + 1 }}. It will be backed up to
              <b>Slot {{ backupSlot }}</b> before installing.
            </template>
            <template v-else>
              Setup found an existing life — {{ previous.name }} “{{ previous.handle }}”, day {{ previous.day + 1 }} — and every save slot is full. Installing
              will overwrite its autosave. Cancel and delete a slot under Load Game if you want to keep it.
            </template>
          </p>
          <p class="muted">Click Next to continue, or Cancel to exit Setup.</p>
        </div>
      </div>

      <!-- Inner pages: header band -->
      <template v-else>
        <div class="band">
          <div class="band-text">
            <b>{{ current?.title }}</b>
            <span>{{ current?.sub }}</span>
          </div>
          <span v-if="innerIndex >= 0" class="band-step">Step {{ innerIndex + 1 }} of {{ innerSteps.length }}</span>
          <span class="band-ico" aria-hidden="true">{{ current?.glyph }}</span>
        </div>

        <div class="page">
          <!-- Identity -->
          <div v-if="stepId === 'identity'" class="identity">
            <p>Setup uses this information to address you. People in Port Lumen will know your name; people online will only know your handle.</p>
            <div class="field">
              <label for="ng-name">Full <u>n</u>ame:</label>
              <div class="row">
                <input id="ng-name" ref="nameInput" v-model="name" type="text" maxlength="24" autocomplete="off" placeholder="e.g. Casey Moreau" accesskey="n" />
                <button type="button" class="btn small" @click="suggestName">Suggest</button>
              </div>
              <span v-if="tried && !nameOk" class="err">Enter a name (letters, spaces, apostrophes or hyphens, up to 24).</span>
            </div>
            <div class="field">
              <label for="ng-handle">Online <u>h</u>andle:</label>
              <div class="row">
                <input id="ng-handle" v-model="handle" type="text" maxlength="16" autocomplete="off" spellcheck="false" placeholder="e.g. bytewren" accesskey="h" />
                <button type="button" class="btn small" @click="suggestHandle">Suggest</button>
              </div>
              <span v-if="tried && !handleOk" class="err">2–16 characters: letters, digits, _ . or -</span>
              <span v-else class="muted hint">Shown on the forum, the pager and in the logs you forget to wipe.</span>
            </div>
            <div class="field">
              <label for="ng-org">Organization:</label>
              <input id="ng-org" type="text" :value="`${home}, Port Lumen`" disabled />
            </div>
          </div>

          <!-- Background -->
          <div v-else-if="stepId === 'background'" class="choose">
            <template v-if="backgrounds.length">
              <div class="list bg-list" role="radiogroup" aria-label="Background">
                <label v-for="b in backgrounds" :key="b.id" class="list-item bg-item" :class="{ selected: b.id === bgId }">
                  <input v-model="bgId" type="radio" name="bg" :value="b.id" />
                  <span class="grow">
                    <b>{{ b.name }}</b>
                    <small class="muted">{{ money(b.money) }} to start</small>
                  </span>
                </label>
              </div>
              <div v-if="bg" class="panel detail">
                <h3>{{ bg.name }}</h3>
                <p v-for="(p, i) in plainParagraphs(bg.desc)" :key="i">{{ p }}</p>
                <div class="group-title">Starting skills</div>
                <div class="chips">
                  <span v-for="s in bonusList(bg.skills)" :key="s.skill" class="chip good">+{{ s.value }} {{ s.label }}</span>
                  <span v-if="bonusList(bg.skills).length === 0" class="muted">No head start — just raw potential.</span>
                </div>
                <div class="group-title">Pocket money</div>
                <p class="money">{{ money(bg.money) }}</p>
                <template v-if="itemNames(bg.items).length">
                  <div class="group-title">Also brings</div>
                  <p>{{ itemNames(bg.items).join(', ') }}</p>
                </template>
              </div>
            </template>
            <div v-else class="panel empty">
              <h3>No backgrounds found on the installation disc</h3>
              <p>You'll begin as a blank slate: no skill bonuses and {{ money(DEFAULT_MONEY) }} in your pocket. Some of the best hackers started exactly like that.</p>
            </div>
          </div>

          <!-- Traits -->
          <div v-else-if="stepId === 'traits'" class="traits">
            <template v-if="traits.length">
              <p class="traits-head">
                Choose exactly {{ needTraits }} trait{{ needTraits === 1 ? '' : 's' }}.
                <span class="pill" :class="picked.length === needTraits ? 'good' : 'info'">{{ picked.length }} of {{ needTraits }} selected</span>
              </p>
              <div class="trait-grid">
                <label
                  v-for="t in traits"
                  :key="t.id"
                  class="trait"
                  :class="{ on: picked.includes(t.id), off: !picked.includes(t.id) && picked.length >= needTraits }"
                >
                  <input type="checkbox" :checked="picked.includes(t.id)" :disabled="!picked.includes(t.id) && picked.length >= needTraits" @change="toggleTrait(t.id)" />
                  <span class="trait-body">
                    <b>{{ t.name }}</b>
                    <span class="trait-desc">{{ plainParagraphs(t.desc).join(' ') }}</span>
                    <span class="chips">
                      <span v-for="(m, i) in describeMods(t.mods)" :key="i" class="chip" :class="m.good ? 'good' : 'bad'">{{ m.text }}</span>
                    </span>
                  </span>
                </label>
              </div>
            </template>
            <div v-else class="panel empty">
              <h3>No traits available</h3>
              <p>You're refreshingly average. That is its own kind of superpower.</p>
            </div>
          </div>

          <!-- Summary: character sheet -->
          <div v-else-if="stepId === 'summary'" class="sheet">
            <div class="sheet-head">
              <span class="sheet-stamp">Character Record</span>
              <span class="muted">Port Lumen · {{ formatDate(0) }}</span>
            </div>
            <div class="sheet-ids">
              <div class="box"><small>Name</small><b>{{ name.trim() }}</b></div>
              <div class="box"><small>Handle</small><b class="mono">{{ handle.trim() }}</b></div>
              <div class="box"><small>Age</small><b>{{ balance.START_AGE }}</b></div>
              <div class="box"><small>Background</small><b>{{ bg?.name ?? 'Blank slate' }}</b></div>
              <div class="box"><small>Home</small><b>{{ home }}</b></div>
              <div class="box"><small>Funds</small><b class="money">{{ money(startMoney) }}</b></div>
            </div>
            <div class="scores">
              <div v-for="s in sheet" :key="s.skill" class="score" :class="{ boosted: s.level > 0 }" :title="`${s.label} level ${s.level} — skill checks roll d20 + ${s.mod}`">
                <small>{{ s.label }}</small>
                <b>{{ s.level }}</b>
                <span class="oval">+{{ s.mod }}</span>
              </div>
            </div>
            <div class="sheet-traits">
              <small class="sheet-label">Traits</small>
              <div v-if="pickedTraits.length" class="sheet-trait-list">
                <div v-for="t in pickedTraits" :key="t.id" class="sheet-trait">
                  <b>{{ t.name }}</b>
                  <span class="chips">
                    <span v-for="(m, i) in describeMods(t.mods)" :key="i" class="chip" :class="m.good ? 'good' : 'bad'">{{ m.text }}</span>
                  </span>
                </div>
              </div>
              <span v-else class="muted">None</span>
            </div>
            <p class="muted sheet-foot">Setup has enough information to begin. Click <b>Install</b> to start your life, or <b>Back</b> to change anything.</p>
          </div>

          <!-- Installing -->
          <div v-else-if="stepId === 'install'" class="installing">
            <p>Please wait while the Setup Wizard installs HackerSim 2001. This may take several years.</p>
            <p class="muted mono inst-line">{{ installText }}</p>
            <div class="inst-bar" role="progressbar" :aria-valuenow="Math.round(installPct * 100)" aria-valuemin="0" aria-valuemax="100">
              <span :style="{ width: `${installPct * 100}%` }"></span>
            </div>
          </div>
        </div>
      </template>

      <div class="foot">
        <span class="foot-etch">HackerSim Setup</span>
        <span class="grow"></span>
        <button type="button" class="btn" :disabled="step === 0 || stepId === 'install'" @click="back">&lt; <u>B</u>ack</button>
        <button ref="nextBtn" type="submit" class="btn primary" :disabled="stepId === 'install' || (!canNext && stepId !== 'identity')">
          <template v-if="stepId === 'summary'"><u>I</u>nstall</template>
          <template v-else><u>N</u>ext &gt;</template>
        </button>
        <button type="button" class="btn cancel" :disabled="stepId === 'install'" @click="cancel">Cancel</button>
      </div>
    </form>
  </div>
</template>

<style scoped>
.setup {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background:
    radial-gradient(ellipse 60% 50% at 20% 0%, rgb(90 140 255 / 35%), transparent 70%),
    linear-gradient(to bottom, #0b2a8a 0%, #1b4fc4 55%, #0a2170 100%);
  overflow: auto;
  padding: 16px;
}
.setup-brand {
  position: absolute;
  top: 22px;
  left: 30px;
  display: flex;
  flex-direction: column;
  color: #fff;
  text-shadow: 3px 3px 0 rgb(0 0 40 / 55%);
  pointer-events: none;
}
.brand-title {
  font: bold italic 34px var(--font-title);
}
.brand-sub {
  font: italic 20px var(--font-title);
  opacity: 0.85;
  margin-left: 4px;
}
.wizard {
  position: relative;
  width: 660px;
  max-width: 100%;
  display: flex;
  flex-direction: column;
  background: var(--win-bg);
  border: var(--frame-bw) solid var(--frame-active);
  border-top-width: var(--frame-bw-top);
  border-radius: var(--frame-radius);
  padding: var(--frame-pad);
  box-shadow:
    var(--frame-bevel),
    6px 8px 24px rgb(0 0 30 / 55%);
  margin-top: 40px;
}
.page {
  height: 380px;
  overflow: auto;
  padding: 14px 18px;
  background: var(--win-bg);
}
.page.split {
  display: flex;
  padding: 0;
  background: var(--panel-bg);
}
.side {
  flex: none;
  width: 170px;
  background:
    radial-gradient(circle at 30% 20%, rgb(255 255 255 / 30%), transparent 45%),
    linear-gradient(160deg, #1c5ad8 0%, #0a2f8f 60%, #051c5c 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 18px;
  color: #fff;
}
.side-disc {
  width: 96px;
  height: 96px;
  border-radius: 50%;
  background:
    radial-gradient(circle, #0a2f8f 0 12px, #d8dde8 13px 15px, transparent 16px),
    conic-gradient(from 20deg, #f6d1ff, #b7e8ff, #d6ffcf, #fff3b0, #ffd0c0, #f6d1ff);
  box-shadow: 2px 4px 10px rgb(0 0 0 / 45%);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  animation: spin 7s linear infinite;
}
.side-disc span {
  font: bold 12px var(--font-title);
  color: #1a2b6d;
  margin-bottom: 14px;
}
.side-name {
  font: italic 22px/1.1 var(--font-title);
  text-align: center;
  text-shadow: 2px 2px 0 rgb(0 0 0 / 35%);
}
.side-name b {
  font-size: 30px;
  color: #ffc55c;
}
.split-body {
  flex: 1;
  padding: 18px 22px;
  overflow: auto;
}
.prev {
  padding: 6px 8px;
  border: 1px solid #9fc0ef;
  background: #eef4ff;
  border-radius: var(--radius);
}
.prev.warn {
  border-color: #e6b86a;
  background: #fff6e0;
}
.split-body h1 {
  font: bold 17px/1.3 var(--font-title);
  margin-bottom: 14px;
}
.band {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px 10px 22px;
  background: var(--panel-bg);
  border-bottom: 1px solid #aca899;
  box-shadow: 0 1px 0 #fff;
}
.band-text {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.band-text span {
  padding-left: 12px;
  color: var(--muted);
}
.band-step {
  font-size: 11px;
  color: var(--muted);
}
.band-ico {
  width: 44px;
  height: 44px;
  flex: none;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-emoji);
  font-size: 30px;
}
.foot {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 12px 12px;
  border-top: 1px solid #aca899;
  box-shadow: inset 0 1px 0 #fff;
}
.foot .btn {
  min-width: 78px;
}
.foot .cancel {
  margin-left: 8px;
}
.foot-etch {
  color: #aca899;
  text-shadow: 1px 1px 0 #fff;
  font-size: 11px;
}

/* Identity */
.identity {
  display: flex;
  flex-direction: column;
  gap: 14px;
  max-width: 440px;
}
.field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.field input[type='text'] {
  width: 280px;
  height: 22px;
}
.err {
  color: var(--bad);
  font-size: 11px;
}
.hint {
  font-size: 11px;
}

/* Background */
.choose {
  display: flex;
  gap: 12px;
  height: 100%;
}
.bg-list {
  flex: none;
  width: 200px;
  height: 100%;
}
.bg-item {
  display: flex;
  align-items: center;
  gap: 8px;
}
.bg-item small {
  display: block;
}
.bg-item.selected small {
  color: #dde6f5;
}
.detail {
  flex: 1;
  min-width: 0;
  overflow: auto;
}
.detail h3 {
  margin-bottom: 6px;
}
.detail .group-title {
  margin: 10px 0 4px;
}
.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}
.chip {
  padding: 1px 7px;
  border-radius: 9px;
  font-size: 11px;
  border: 1px solid transparent;
}
.chip.good {
  background: #e3f5e3;
  border-color: #9fd49f;
  color: var(--good);
}
.chip.bad {
  background: #fbe4e2;
  border-color: #eaa9a3;
  color: var(--bad);
}
.empty {
  flex: 1;
  align-self: flex-start;
}
.empty h3 {
  margin-bottom: 6px;
}

/* Traits */
.traits-head {
  display: flex;
  align-items: center;
  gap: 10px;
}
.trait-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
}
.trait {
  display: flex;
  gap: 8px;
  align-items: flex-start;
  padding: 7px 8px;
  background: var(--panel-bg);
  border: 1px solid var(--panel-border);
  border-radius: var(--radius);
  cursor: pointer;
}
.trait.on {
  border-color: var(--sel-bg);
  background: #eef4ff;
  box-shadow: inset 0 0 0 1px var(--sel-bg);
}
.trait.off {
  opacity: 0.55;
  cursor: default;
}
.trait-body {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
}
.trait-desc {
  font-size: 11px;
  color: #333;
  line-height: 1.35;
}

/* Character sheet */
.sheet {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px 12px;
  background:
    repeating-linear-gradient(to bottom, transparent 0 23px, rgb(120 100 60 / 8%) 23px 24px),
    #fbf6e6;
  border: 1px solid #b9a978;
  box-shadow: inset 0 0 20px rgb(160 130 60 / 15%);
  color: #2a2418;
}
.sheet-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.sheet-stamp {
  font: bold 14px var(--font-serif);
  letter-spacing: 3px;
  text-transform: uppercase;
  color: #6b3f12;
  border: 2px solid #6b3f12;
  padding: 1px 8px;
  transform: rotate(-1.5deg);
}
.sheet-ids {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;
}
.box {
  display: flex;
  flex-direction: column;
  padding: 3px 7px 4px;
  border: 1px solid #b9a978;
  background: rgb(255 255 255 / 55%);
  border-radius: 3px;
  min-width: 0;
}
.box small,
.score small,
.sheet-label {
  font-size: 9px;
  letter-spacing: 1px;
  text-transform: uppercase;
  color: #7a6a44;
}
.box b {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.scores {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 6px;
}
.score {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 4px 2px 5px;
  border: 2px solid #b9a978;
  border-radius: 8px 8px 12px 12px;
  background: rgb(255 255 255 / 60%);
}
.score small {
  font-size: 8px;
}
.score b {
  font: bold 20px/1.1 var(--font-serif);
}
.score.boosted {
  border-color: #6b3f12;
  background: #fff8df;
}
.oval {
  margin-top: 1px;
  padding: 0 8px;
  border: 1px solid #b9a978;
  border-radius: 10px;
  background: #fff;
  font-size: 10px;
  font-weight: bold;
}
.sheet-traits {
  display: flex;
  gap: 10px;
  align-items: flex-start;
}
.sheet-label {
  flex: none;
  margin-top: 3px;
}
.sheet-trait-list {
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.sheet-trait {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
}
.sheet-foot {
  margin: 0;
}

/* Installing */
.installing {
  padding-top: 40px;
  max-width: 480px;
}
.inst-line {
  min-height: 1.4em;
}
.inst-bar {
  height: 18px;
  border: 1px solid var(--bar-border);
  background: var(--bar-bg);
  border-radius: 2px;
  padding: 1px;
}
.inst-bar span {
  display: block;
  height: 100%;
  background: var(--bar-fill);
  mask-image: repeating-linear-gradient(90deg, #000 0 8px, transparent 8px 10px);
  transition: width 0.3s linear;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
@media (max-width: 700px) {
  .setup-brand {
    display: none;
  }
  .side {
    display: none;
  }
  .trait-grid,
  .sheet-ids {
    grid-template-columns: 1fr;
  }
  .scores {
    grid-template-columns: repeat(2, 1fr);
  }
  .choose {
    flex-direction: column;
  }
  .bg-list {
    width: 100%;
    height: auto;
  }
}
</style>
