<script setup lang="ts">
/**
 * Renders one story thread (a delivered scene) in any channel style and drives it through the
 * engine: history with chosen replies and roll records, the current node, then the actions
 * (choices / Continue / terminal mission / Done). Skill-check rolls play a dice animation before
 * the resulting node is revealed; chat/mail/forum show a short "typing…" beat; the dialog variant
 * can type text out CRPG-style and take 1-9 / Enter hotkeys.
 */
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import {
  C,
  advance,
  choicesFor,
  choose,
  findThread,
  finishThread,
  isTerminal,
  markRead,
  missionAuto,
  nodeOf,
  renderLine,
  renderText,
  sceneOf,
  type ChoiceView,
  type RollRecord,
} from '@/engine'
import Avatar from '@/ui/components/Avatar.vue'
import { useGame } from '@/ui/game'
import { openApp } from '@/ui/wm'
import DiceRoll from './DiceRoll.vue'
import ThreadActions from './ThreadActions.vue'
import ChatLog from './log/ChatLog.vue'
import DialogLog from './log/DialogLog.vue'
import ForumLog from './log/ForumLog.vue'
import MailLog from './log/MailLog.vue'
import {
  isLive,
  missionCheck,
  playerSpeaker,
  senderOf,
  skillLabel,
  speakerOf,
  type DisplayEntry,
  type MissionView,
  type Speaker,
  type ThreadVariant,
} from './storyKit'

const props = withDefaults(
  defineProps<{
    uid: number
    variant?: ThreadVariant
    /** 'fill': own scroll area with actions pinned below. 'inline': natural height (stack several). */
    layout?: 'fill' | 'inline'
    /** Type the newest line out (dialog). */
    typewriter?: boolean
    /** Global 1-9 / Enter / Space shortcuts (only for the focused modal). */
    hotkeys?: boolean
  }>(),
  { variant: undefined, layout: 'fill', typewriter: false, hotkeys: false },
)
const emit = defineEmits<{
  /** The player closed a finished thread. */
  done: []
  /** The terminal was opened for this thread's mission. */
  terminal: []
  /** Visible content changed (for parents that scroll an inline stack). */
  changed: []
}>()

const state = useGame()
const reduced = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

const thread = computed(() => findThread(state, props.uid))
const scene = computed(() => (thread.value ? sceneOf(thread.value) : undefined))
const kind = computed<ThreadVariant>(() => props.variant ?? thread.value?.channel ?? 'mail')
const player = computed(() => playerSpeaker(state))
const showMath = computed(() => state.settings.showRollMath)
const live = computed(() => (thread.value ? isLive(thread.value) : false))
const node = computed(() => (thread.value ? nodeOf(thread.value) : undefined))
const sender = computed(() => senderOf(state, scene.value))

// ── Holds: dice animation / "typing…" beat before the next node is revealed ──────────────────
type Hold = { kind: 'dice'; roll: RollRecord; label: string } | { kind: 'wait'; label: string }
const hold = ref<Hold | null>(null)
let holdTimer = 0

function clearHold(): void {
  window.clearTimeout(holdTimer)
  hold.value = null
}

// ── Display model ─────────────────────────────────────────────────────────────────────────────
const entries = computed<DisplayEntry[]>(() => {
  const t = thread.value
  const sc = scene.value
  if (!t || !sc) return []
  const h = hold.value
  const upto = Math.max(0, t.history.length - (h ? 1 : 0))
  const out: DisplayEntry[] = []
  for (let i = 0; i < upto; i++) {
    const e = t.history[i]
    const n = e ? sc.nodes[e.node] : undefined
    if (!e || !n) continue
    const picked = e.choice !== undefined ? n.choices?.[e.choice] : undefined
    out.push({
      key: `${i}:${e.node}`,
      index: i,
      speaker: speakerOf(state, n.speaker, sc),
      paragraphs: renderText(state, n.text),
      reply: picked ? { text: renderLine(state, picked.text), tag: picked.tag } : undefined,
      roll: e.roll,
      rollPending: h?.kind === 'dice' && i === upto - 1,
      mission: e.mission,
      current: false,
      latest: false,
    })
  }
  const last = out[out.length - 1]
  if (last) {
    last.latest = true
    last.current = isLive(t) && !h
  }
  return out
})

const latest = computed(() => entries.value[entries.value.length - 1])

// ── Typewriter (dialog) ───────────────────────────────────────────────────────────────────────
const CHARS_PER_SECOND = 75
const typed = ref(Number.POSITIVE_INFINITY)
let raf = 0
let lastFrame = 0
const latestChars = computed(() => latest.value?.paragraphs.reduce((s, p) => s + p.length, 0) ?? 0)
const typing = computed(() => typed.value < latestChars.value)

function typeStep(t: number): void {
  const dt = lastFrame === 0 ? 0 : Math.min(0.1, (t - lastFrame) / 1000)
  lastFrame = t
  typed.value += dt * CHARS_PER_SECOND
  if (typed.value < latestChars.value) raf = requestAnimationFrame(typeStep)
  else typed.value = Number.POSITIVE_INFINITY
}

function skipTyping(): void {
  cancelAnimationFrame(raf)
  typed.value = Number.POSITIVE_INFINITY
}

watch(
  () => latest.value?.key,
  key => {
    cancelAnimationFrame(raf)
    const e = latest.value
    // Type out freshly entered nodes (not ones the player already answered).
    if (!props.typewriter || reduced || !key || !e || e.reply) {
      typed.value = Number.POSITIVE_INFINITY
      return
    }
    typed.value = 1
    lastFrame = 0
    raf = requestAnimationFrame(typeStep)
  },
  { immediate: true },
)

const shown = computed<DisplayEntry[]>(() => {
  const list = entries.value
  const last = list[list.length - 1]
  if (!typing.value || !last) return list
  let budget = Math.floor(typed.value)
  const paragraphs: string[] = []
  for (const p of last.paragraphs) {
    if (budget <= 0) break
    paragraphs.push(p.slice(0, budget))
    budget -= p.length
  }
  return [...list.slice(0, -1), { ...last, paragraphs }]
})

// ── Actions ───────────────────────────────────────────────────────────────────────────────────
const interactive = computed(() => live.value && hold.value === null && !typing.value)
const choices = computed<ChoiceView[]>(() => (interactive.value && thread.value ? choicesFor(state, thread.value) : []))
const canContinue = computed(() => interactive.value && !!node.value?.next)
const mission = computed<MissionView | null>(() => {
  const m = interactive.value ? node.value?.mission : undefined
  if (!m) return null
  const def = C.missions.get(m.mission)
  return {
    title: def?.title ?? 'Terminal job',
    briefing: def ? (renderText(state, def.briefing)[0] ?? '') : '',
    check: missionCheck(state, m),
  }
})
const expired = computed(() => thread.value?.status === 'expired' && hold.value === null)
const ended = computed(
  () => hold.value === null && !typing.value && !!thread.value && (!live.value || (!!node.value && isTerminal(node.value))),
)
/** Re-mount the actions per node so a focused button never carries over to the next node's choice. */
const actionsKey = computed(() => `${latest.value?.key ?? 'none'}:${thread.value?.status ?? ''}`)

function waitLabel(sp: Speaker): string {
  switch (kind.value) {
    case 'chat':
      return `${sp.handle || 'Someone'} is typing…`
    case 'mail':
      return sp.kind === 'narrator' ? 'Reply sent.' : `Reply sent. Waiting for ${sp.name}…`
    case 'forum':
      return 'Posting… refreshing topic'
    case 'dialog':
      return '…'
  }
}

/** A short beat before the other side's answer appears (not for dialogs, which type out). */
function startWait(): void {
  if (kind.value === 'dialog' || reduced) return
  const t = thread.value
  const sc = scene.value
  const last = t?.history[t.history.length - 1]
  const n = last && sc ? sc.nodes[last.node] : undefined
  if (!n || !sc) return
  const sp = speakerOf(state, n.speaker, sc)
  if (sp.kind === 'player') return
  const ms = Math.min(1400, 450 + renderLine(state, n.text).length * 8)
  hold.value = { kind: 'wait', label: waitLabel(sp) }
  window.clearTimeout(holdTimer)
  holdTimer = window.setTimeout(() => {
    if (hold.value?.kind === 'wait') hold.value = null
  }, ms)
}

function blurActive(): void {
  const el = document.activeElement
  if (el instanceof HTMLElement) el.blur()
}

function pick(v: ChoiceView): void {
  const t = thread.value
  if (!t || v.locked || !interactive.value) return
  const before = t.history.length
  const res = choose(state, props.uid, v.index)
  if (!res.ok) return
  blurActive()
  if (res.roll) hold.value = { kind: 'dice', roll: res.roll, label: `${skillLabel(res.roll.skill)} check` }
  else if (t.history.length > before) startWait()
}

function onContinue(): void {
  if (!canContinue.value) return
  blurActive()
  if (advance(state, props.uid)) startWait()
}

function onAuto(): void {
  if (!mission.value) return
  const title = mission.value.title
  const roll = missionAuto(state, props.uid)
  blurActive()
  if (roll) hold.value = { kind: 'dice', roll, label: `Auto-resolve · ${title}` }
}

function onTerminal(): void {
  openApp('terminal', { threadUid: props.uid })
  emit('terminal')
}

function onDone(): void {
  finishThread(state, props.uid)
  emit('done')
}

// ── Keyboard (modal only) ────────────────────────────────────────────────────────────────────
function onKey(e: KeyboardEvent): void {
  if (!props.hotkeys || e.ctrlKey || e.metaKey || e.altKey) return
  const el = e.target instanceof HTMLElement ? e.target : null
  if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT' || el.isContentEditable)) return
  if (hold.value !== null) return // the dice banner handles its own keys
  const confirm = e.key === 'Enter' || e.key === ' '
  const digit = /^[1-9]$/.test(e.key) ? Number(e.key) : 0
  if (!confirm && digit === 0) return
  if (confirm && el?.tagName === 'BUTTON') return // let the focused button activate natively
  if (typing.value) {
    e.preventDefault()
    skipTyping()
    return
  }
  if (ended.value) {
    if (confirm) {
      e.preventDefault()
      onDone()
    }
    return
  }
  if (digit > 0) {
    const v = choices.value[digit - 1]
    if (v) {
      e.preventDefault()
      pick(v)
    } else if (canContinue.value && digit === choices.value.length + 1) {
      e.preventDefault()
      onContinue()
    }
    return
  }
  if (canContinue.value) {
    e.preventDefault()
    onContinue()
  }
}

// ── Scrolling ────────────────────────────────────────────────────────────────────────────────
const logEl = ref<HTMLElement | null>(null)

/** Show the top of the newest message if it's tall, otherwise stick to the bottom. */
function scrollToLatest(smooth: boolean): void {
  const box = logEl.value
  if (!box || props.layout !== 'fill') return
  const max = box.scrollHeight - box.clientHeight
  const target = hold.value?.kind === 'wait' ? null : box.querySelector<HTMLElement>('[data-latest="true"]')
  const top = target ? Math.min(max, Math.max(0, target.offsetTop - 8)) : max
  if (Math.abs(box.scrollTop - top) < 2) return
  box.scrollTo({ top, behavior: smooth && !reduced ? 'smooth' : 'auto' })
}

watch(
  () => [shown.value.length, latest.value?.key, hold.value?.kind, thread.value?.status] as const,
  () => {
    void nextTick(() => {
      scrollToLatest(true)
      emit('changed')
    })
  },
)
watch(typed, () => {
  if (typing.value) void nextTick(() => { scrollToLatest(false) })
})

// ── Portrait (dialog) ────────────────────────────────────────────────────────────────────────
const portrait = computed<Speaker>(() => {
  for (let i = shown.value.length - 1; i >= 0; i--) {
    const sp = shown.value[i]?.speaker
    if (sp && (sp.kind === 'npc' || sp.kind === 'label')) return sp
  }
  if (scene.value?.from) return sender.value
  return { kind: 'label', id: 'scene', name: scene.value?.title ?? '', handle: '', avatar: '✦', color: 'var(--win-title-a)', role: '' }
})
const affinity = computed(() => {
  const p = portrait.value
  if (p.kind !== 'npc') return null
  const s = state.npcs[p.id]
  return s?.met ? Math.round(s.affinity) : null
})

// ── Lifecycle ────────────────────────────────────────────────────────────────────────────────
watch(
  () => props.uid,
  uid => {
    clearHold()
    markRead(state, uid)
  },
)

onMounted(() => {
  markRead(state, props.uid)
  window.addEventListener('keydown', onKey)
  void nextTick(() => {
    scrollToLatest(false)
  })
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKey)
  window.clearTimeout(holdTimer)
  cancelAnimationFrame(raf)
})
</script>

<template>
  <div v-if="thread && scene" class="tv" :class="[kind, layout]">
    <aside v-if="kind === 'dialog'" class="tv-portrait">
      <div class="pp-frame">
        <Avatar v-if="portrait.kind === 'npc'" :npc="portrait.id" :size="96" />
        <Avatar v-else :text="portrait.avatar" :color="portrait.color" :size="96" />
      </div>
      <div class="pp-name">{{ portrait.name }}</div>
      <div v-if="portrait.role" class="pp-role">{{ portrait.role }}</div>
      <div v-if="affinity !== null" class="pp-aff" :title="`How ${portrait.name} feels about you (−100…100). Time together and choices move it.`">
        ♥ {{ affinity }}
      </div>
    </aside>

    <div class="tv-main">
      <div ref="logEl" class="tv-log" @click="skipTyping">
        <MailLog v-if="kind === 'mail'" :entries="shown" :scene="scene" :show-math="showMath" />
        <ChatLog v-else-if="kind === 'chat'" :entries="shown" :thread="thread" :scene="scene" :show-math="showMath" :player="player" />
        <ForumLog v-else-if="kind === 'forum'" :entries="shown" :thread="thread" :scene="scene" :show-math="showMath" :player="player" />
        <DialogLog v-else :entries="shown" :show-math="showMath" :typing="typing" />
        <div v-if="hold?.kind === 'wait'" class="tv-wait" aria-live="polite">
          <span class="dots" aria-hidden="true"><i></i><i></i><i></i></span>
          {{ hold.label }}
        </div>
      </div>

      <div class="tv-actions">
        <DiceRoll
          v-if="hold?.kind === 'dice'"
          :roll="hold.roll"
          :label="hold.label"
          :show-math="showMath"
          :hotkeys="hotkeys"
          @continue="clearHold"
        />
        <button v-else-if="typing" type="button" class="tv-skip" @click="skipTyping">▸ Click or press Space to skip</button>
        <ThreadActions
          v-else-if="hold === null"
          :key="actionsKey"
          :variant="kind"
          :choices="choices"
          :can-continue="canContinue"
          :mission="mission"
          :ended="ended && !expired"
          :expired="expired"
          :hotkeys="hotkeys"
          @pick="pick"
          @continue="onContinue"
          @auto="onAuto"
          @terminal="onTerminal"
          @done="onDone"
        />
      </div>
    </div>
  </div>
  <div v-else class="tv-missing muted">This conversation is no longer available. The line just hums.</div>
</template>

<style scoped>
.tv {
  display: flex;
  min-width: 0;
  min-height: 0;
}
.tv.fill {
  height: 100%;
}
.tv-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
  min-height: 0;
}
.tv-log {
  position: relative;
}
.tv.fill .tv-log {
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: 2px 4px 6px 2px;
}
.tv-actions {
  flex: none;
}
.tv.fill .tv-actions {
  max-height: 55%;
  overflow: auto;
}
.tv-actions:empty {
  display: none;
}
.tv-wait {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 8px;
  font-size: 11px;
  font-style: italic;
  color: var(--muted);
}
.dots {
  display: inline-flex;
  gap: 3px;
}
.dots i {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: currentcolor;
  animation: dot 1s infinite ease-in-out;
}
.dots i:nth-child(2) {
  animation-delay: 0.15s;
}
.dots i:nth-child(3) {
  animation-delay: 0.3s;
}
@keyframes dot {
  0%,
  80%,
  100% {
    opacity: 0.25;
    transform: translateY(0);
  }
  40% {
    opacity: 1;
    transform: translateY(-2px);
  }
}
.tv-skip {
  font: inherit;
  font-size: 11px;
  background: none;
  border: none;
  padding: 4px;
  width: 100%;
  text-align: center;
  cursor: pointer;
  color: var(--dlg-dim, var(--muted));
}
.tv-missing {
  padding: 16px;
  font-style: italic;
}

/* ── chat: compose tray look for the actions ─────────────────────────── */
.tv.chat .tv-actions {
  border-top: 1px solid var(--panel-border);
  background: var(--panel-alt);
  padding: 5px 6px;
  border-radius: 0 0 var(--radius) var(--radius);
}
.tv.chat.inline .tv-actions {
  border: 1px solid var(--panel-border);
  border-radius: var(--radius);
  margin-top: 4px;
}

/* ── mail: reply box ─────────────────────────────────────────────────── */
.tv.mail .tv-actions {
  border-top: 1px solid var(--panel-border);
  padding-top: 6px;
}

/* ── dialog: dark CRPG panel ─────────────────────────────────────────── */
.tv.dialog {
  --dlg-bg: color-mix(in srgb, var(--win-title-a) 22%, #0c0e13);
  --dlg-fg: color-mix(in srgb, var(--win-title-fg) 90%, var(--warn));
  --dlg-dim: color-mix(in srgb, var(--win-title-fg) 45%, transparent);
  --dlg-narr: color-mix(in srgb, var(--win-title-fg) 66%, transparent);
  --dlg-accent: color-mix(in srgb, var(--warn) 60%, var(--win-title-fg));
  --dlg-you: color-mix(in srgb, var(--sel-bg) 45%, var(--win-title-fg));
  --dlg-good: color-mix(in srgb, var(--good) 50%, var(--win-title-fg));
  --dlg-bad: color-mix(in srgb, var(--bad) 50%, var(--win-title-fg));
  --dlg-warn: color-mix(in srgb, var(--warn) 65%, var(--win-title-fg));
  --dlg-tag: color-mix(in srgb, var(--story) 40%, var(--win-title-fg));
  --dlg-hover: rgb(255 255 255 / 7%);
  container-type: inline-size;
  gap: 14px;
  padding: 12px 12px 10px;
  background:
    radial-gradient(ellipse at 20% 0%, color-mix(in srgb, var(--win-title-b) 25%, transparent), transparent 60%),
    var(--dlg-bg);
  color: var(--dlg-fg);
}
.tv.dialog .tv-actions {
  border-top: 1px solid color-mix(in srgb, var(--dlg-accent) 35%, transparent);
  padding-top: 8px;
}
.tv.dialog .tv-log {
  scrollbar-color: var(--dlg-dim) transparent;
}
.tv-portrait {
  flex: none;
  width: 118px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  text-align: center;
}
.pp-frame {
  padding: 4px;
  border: 1px solid color-mix(in srgb, var(--dlg-accent) 60%, transparent);
  box-shadow:
    0 0 0 3px rgb(0 0 0 / 35%),
    0 0 16px color-mix(in srgb, var(--win-title-b) 45%, transparent);
  background: rgb(0 0 0 / 30%);
}
.pp-name {
  margin-top: 4px;
  font-weight: bold;
  font-size: 12px;
  letter-spacing: 1px;
  text-transform: uppercase;
  color: var(--dlg-accent);
}
.pp-role {
  font-size: 11px;
  color: var(--dlg-dim);
  line-height: 1.3;
}
.pp-aff {
  font-size: 11px;
  color: var(--dlg-bad);
  cursor: help;
}
@container (max-width: 480px) {
  .tv-portrait {
    display: none;
  }
}
</style>
