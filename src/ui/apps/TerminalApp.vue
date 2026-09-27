<script setup lang="ts">
/**
 * The Terminal: a free LumenOS shell, story missions (thread nodes), and hack ops (contracts).
 *
 * Hack ops follow REDESIGN_V2 §A: the op mission comes from opMission() (prep perks baked in),
 * generated ops run rigged at their tier, and the end result goes to completeOp() as an OpResult
 * (clean / messy / partial / traced / aborted), which prices the trail left behind. The debrief is
 * printed right here. While an op is live the clock stays frozen; walking away (closing the window,
 * launching something else, reloading) counts as jacking out — or as traced, if it was nearly on you.
 */
import { computed, onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue'
import {
  balance,
  C,
  completeOp,
  formatClock,
  formatDate,
  gainHeat,
  HW_SLOTS,
  missionAuto,
  missionResult,
  modMult,
  nodeOf,
  opMission,
  pause,
  pct,
  renderLine,
  resume,
  sceneOf,
  scriptChance,
  scriptOp,
  SKILLS,
  type MissionDef,
  type OpReport,
  type OpResult,
  type Text,
} from '@/engine'
import { useGame } from '@/ui/game'
import { closeApp, openApp } from '@/ui/wm'
import { pushToast } from '@/ui/shell/toasts'
import { debriefLines, markDebriefSeen } from '@/ui/ops/debrief'
import { deadlineDaysLeft, deadlineLabel, opTierOf } from '@/ui/ops/opsKit'
import MissionPanel from '@/ui/terminal/MissionPanel.vue'
import TerminalScreen from '@/ui/terminal/TerminalScreen.vue'
import { defaultEnv, MissionSim, type GoalView, type HostView, type OutLine, type RenderLine, type SimEnv, type Trace } from '@/ui/terminal/sim'
import { BANNER, completeShell, runShell, type ShellCtx, type ShellMissionEntry } from '@/ui/terminal/shell'
import { claimOp, clearOpMarker, markOpStarted, noteOpProgress, OP_LOCK_MESSAGE, opMarked, releaseOp, resolveStaleOp } from './opLive'

const props = defineProps<{ threadUid?: number; contractUid?: number }>()
const state = useGame()

type Mode = 'shell' | 'mission' | 'missing'
const mode = ref<Mode>('shell')
const lines = ref<RenderLine[]>([])
const inputText = ref('')
const cmdHistory = ref<string[]>([])
const finished = ref<'won' | 'lost' | null>(null)
const missionTitle = ref('')
const missionBriefing = ref<Text | undefined>(undefined)
const missionHints = ref<string[]>([])

const sim = shallowRef<MissionSim | null>(null)
const goalsView = ref<GoalView[]>([])
const hostsView = ref<HostView[]>([])
const traceView = ref<Trace>({ active: false, elapsed: 0, total: 0 })
const jobView = ref<{ label: string; progress: number } | null>(null)

/** The hack contract this session belongs to (null for the free shell and story missions). */
const opUid = ref<number | null>(null)
/** The op has really begun (host touched / trace running) — from here, walking away has a price. */
const opStarted = ref(false)
/** This session's result has been handed to the engine (or deliberately dropped). */
const settled = ref(false)

const screenRef = ref<{ focusInput: () => void } | null>(null)

let histPos = -1
let fortuneSeed = 0
let didPause = false
let resumeAfter = false
let raf = 0
let lastT = 0
let notedLogs = -1
let notedGoals = -1
/** Which job prop changed last (openApp merges props, so both may be set). */
let prefer = 'thread' as 'thread' | 'contract'

const REVEAL_CPS = 620
const MAX_LINES = 600
/** Walking away with the trace this far along means they already have your route. */
const WALKAWAY_TRACE_FRACTION = 0.75

// ── Derived ───────────────────────────────────────────────────────────────────

const contract = computed(() => (opUid.value === null ? undefined : state.contracts.active.find(c => c.uid === opUid.value && c.kind === 'hack')))
const isContract = computed(() => opUid.value !== null)

const scriptInfo = computed(() => {
  const c = contract.value
  if (!c) return null
  const chance = scriptChance(state, c)
  return {
    chance,
    label: `Script it [${pct(chance)}]`,
    tooltip: [
      'Hand the op to an unattended script instead of running it yourself.',
      `Success chance ${pct(chance)} (DC ${c.dc}, −${balance.SCRIPT_ROLL_PENALTY} to the roll: nobody is watching the trace).`,
      `On success: pay ×${balance.SCRIPT_PAY_MULT}, heat ×${balance.SCRIPT_HEAT_MULT}.`,
      'On failure: traced — no pay, heavy heat, a complication.',
      'Only before you touch the network.',
    ].join('\n'),
  }
})

// ── Prompt ──────────────────────────────────────────────────────────────────

const prompt = computed(() => {
  const s = sim.value
  if (mode.value === 'mission' && s) {
    const host = s.currentHostId ? s.hosts.get(s.currentHostId) : undefined
    return `${state.player.handle}@${host ? host.def.name.toLowerCase().replace(/\s+/g, '-') : 'net'}:~# `
  }
  return `${state.player.handle}@lumenos:~$ `
})

const locked = computed(() => finished.value !== null || mode.value === 'missing')

// ── Output plumbing ───────────────────────────────────────────────────────────

function push(out: readonly OutLine[], instant = false): void {
  for (const o of out) lines.value.push({ text: o.text, tone: o.tone, shown: instant ? o.text.length : 0 })
  if (lines.value.length > MAX_LINES) lines.value.splice(0, lines.value.length - MAX_LINES)
}

function flush(): void {
  for (const l of lines.value) l.shown = l.text.length
}

function clearScreen(): void {
  lines.value = []
}

function pulledLines(): OutLine[] {
  return [
    { text: '', tone: 'out' },
    { text: '✘ THE CLIENT PULLED THE JOB.', tone: 'err' },
    { text: 'The contract is off your books — whatever you did in there, nobody is paying for it now.', tone: 'dim' },
  ]
}

// ── Player snapshot for the free shell ────────────────────────────────────────

function missionEntries(): ShellMissionEntry[] {
  const out: ShellMissionEntry[] = []
  for (const t of state.threads) {
    if (t.status !== 'unread' && t.status !== 'open') continue
    const node = nodeOf(t)
    const mid = node?.mission?.mission
    if (!mid) continue
    const def = C.missions.get(mid)
    out.push({
      kind: 'thread',
      uid: t.uid,
      title: def?.title ?? sceneOf(t)?.title ?? 'Story job',
      detail: def ? clip(renderLine(state, def.briefing)) : 'mission data pending',
    })
  }
  for (const c of state.contracts.active) {
    if (c.kind !== 'hack' || c.status !== 'active') continue
    out.push({ kind: 'contract', uid: c.uid, title: c.title, detail: `Client: ${c.client} · ${deadlineLabel(deadlineDaysLeft(state, c))}` })
  }
  return out
}

function clip(s: string): string {
  return s.length > 64 ? `${s.slice(0, 61)}...` : s
}

function shellCtx(): ShellCtx {
  const hardware: { slot: string; name: string }[] = []
  for (const slot of HW_SLOTS) {
    const id = state.equipped[slot]
    const def = id ? C.items.get(id) : undefined
    if (def) hardware.push({ slot, name: def.name })
  }
  const skills = SKILLS.map(s => ({ label: balance.SKILL_LABELS[s], level: state.skills[s].level }))
  return {
    handle: state.player.handle,
    name: state.player.name,
    dateStr: formatDate(state.time.day),
    clockStr: formatClock(state.time.hour, state.time.frac),
    hardware,
    skills,
    missions: missionEntries(),
    history: cmdHistory.value,
    fortuneSeed,
  }
}

// ── Mission env ───────────────────────────────────────────────────────────────

function buildEnv(): SimEnv {
  const env: SimEnv = defaultEnv()
  env.intrusion = state.skills.intrusion.level
  env.cryptography = state.skills.cryptography.level
  env.opsec = state.skills.opsec.level
  env.crackSpeed = modMult(state, 'crack.speed')
  env.traceMult = modMult(state, 'trace') * (1 + state.skills.opsec.level * 0.012)
  return env
}

function threadMission(uid: number): MissionDef | null {
  const t = state.threads.find(x => x.uid === uid)
  const node = t ? nodeOf(t) : undefined
  const id = node?.mission?.mission
  return id ? (C.missions.get(id) ?? null) : null
}

// ── View refresh (mirror the plain sim into reactive refs) ────────────────────

function refreshView(): void {
  const s = sim.value
  if (!s) return
  goalsView.value = s.goals()
  hostsView.value = s.knownHosts()
  traceView.value = { ...s.trace }
  jobView.value = s.job ? { label: s.job.label, progress: s.jobProgress() } : null
}

/** Once the player touches the network (or the trace starts), the op is on — persist the marker. */
function checkStarted(): void {
  const s = sim.value
  const uid = opUid.value
  if (!s || uid === null || settled.value || finished.value) return
  if (!opStarted.value) {
    const touched = [...s.hosts.values()].some(h => h.touched || h.probed)
    if (!touched && !s.trace.active && s.goalsDone() === 0) return
    opStarted.value = true
    markOpStarted(state, uid)
  }
  const r = s.opResult()
  if (r.logsLeft !== notedLogs || r.goalsDone !== notedGoals) {
    notedLogs = r.logsLeft
    notedGoals = r.goalsDone
    noteOpProgress(state, r.logsLeft, r.goalsDone)
  }
}

// ── Init / teardown ───────────────────────────────────────────────────────────

function holdClock(): void {
  if (!didPause) {
    resumeAfter = state.time.speed > 0
    pause(state)
    didPause = true
  }
}

function releasePause(): void {
  if (didPause) {
    if (resumeAfter) resume(state)
    didPause = false
  }
}

function resetSession(): void {
  clearScreen()
  inputText.value = ''
  histPos = -1
  finished.value = null
  settled.value = false
  sim.value = null
  opUid.value = null
  opStarted.value = false
  notedLogs = -1
  notedGoals = -1
  missionBriefing.value = undefined
  missionHints.value = []
}

function init(): void {
  resetSession()

  // A save that still says an op was running (the game was reloaded mid-op) settles it now.
  const stale = resolveStaleOp(state)
  if (stale) {
    push(
      [
        { text: `Your last session on “${stale.title}” dropped mid-op. Walking away counts as jacking out.`, tone: 'warn' },
        ...debriefLines(stale.title, stale.report),
        { text: '', tone: 'out' },
      ],
      true,
    )
    markDebriefSeen(state, stale.uid)
  }

  const useThread = props.threadUid !== undefined && (prefer === 'thread' || props.contractUid === undefined)
  if (useThread) {
    holdClock()
    initThread(props.threadUid)
  } else if (props.contractUid !== undefined) {
    holdClock()
    initContract(props.contractUid)
  } else {
    mode.value = 'shell'
    releasePause()
    missionTitle.value = ''
    push(BANNER, true)
    push([{ text: '', tone: 'out' }], true)
  }
  focusSoon()
}

function initThread(uid: number): void {
  const def = threadMission(uid)
  if (def) {
    startSim(def, new MissionSim(def, buildEnv()))
    push(
      [
        { text: `LumenOS field console — ${def.title}`, tone: 'sys' },
        { text: 'Connection secured through your uplink. Objectives are on the left.', tone: 'dim' },
        { text: 'Type `help` for commands, `hosts` to begin. Get in, hit the goals, `wipe` your tracks, `disconnect`.', tone: 'dim' },
        { text: '', tone: 'out' },
      ],
      true,
    )
  } else {
    mode.value = 'missing'
    missionTitle.value = 'Story job'
    push(
      [
        { text: 'No interactive mission data is available for this job on this build.', tone: 'warn' },
        { text: 'You can still resolve it automatically with the button above.', tone: 'dim' },
      ],
      true,
    )
  }
}

function initContract(uid: number): void {
  const c = state.contracts.active.find(x => x.uid === uid)
  if (c?.kind !== 'hack' || c.status !== 'active') {
    mode.value = 'missing'
    missionTitle.value = c?.title ?? 'Contract'
    push(
      [
        c && c.kind !== 'hack'
          ? { text: 'Gigs are worked during your scheduled hours — there is nothing to run in here.', tone: 'warn' }
          : { text: 'That job is no longer on your books.', tone: 'warn' },
        { text: 'Type `missions` in a fresh terminal to see what you can launch.', tone: 'dim' },
      ],
      true,
    )
    return
  }
  opUid.value = uid
  missionTitle.value = c.title
  const def = opMission(state, uid)
  if (!def) {
    mode.value = 'missing'
    push(
      [
        { text: 'No interactive network data is available for this op on this build.', tone: 'warn' },
        { text: 'You can still hand it to a script with the button above.', tone: 'dim' },
      ],
      true,
    )
    return
  }
  claimOp(uid)
  startSim(def, new MissionSim(def, buildEnv(), { rig: c.missionDef !== undefined, tier: opTierOf(c), hints: state.totals.hacksDone < 3 }))
  const days = deadlineDaysLeft(state, c)
  push(
    [
      { text: `LumenOS field console — ${c.title}`, tone: 'sys' },
      { text: `Client: ${c.client} · pay $${c.pay.toLocaleString('en-US')} · window: ${deadlineLabel(days)}`, tone: 'dim' },
      { text: 'Connection secured through your uplink. Objectives are on the left. The clock is frozen while you work.', tone: 'dim' },
      { text: 'Type `help` for commands, `hosts` to begin. Hit the goals, `wipe` your tracks, `disconnect`.', tone: 'dim' },
      { text: 'Once you touch the network there is no walking away: closing this window counts as `jackout`.', tone: 'warn' },
      { text: '', tone: 'out' },
    ],
    true,
  )
}

function startSim(def: MissionDef, s: MissionSim): void {
  mode.value = 'mission'
  missionTitle.value = missionTitle.value || def.title
  missionBriefing.value = def.briefing
  missionHints.value = def.hints ?? []
  sim.value = s
  refreshView()
}

/**
 * The player leaves a live op without finishing it (closed the window, launched another job, or the
 * contract vanished under them). A started op settles as a jack-out — or as traced, if the trace was
 * already most of the way. Returns the engine's report, if one was made.
 */
function walkAway(): OpReport | null {
  const uid = opUid.value
  const s = sim.value
  if (uid === null || settled.value) return null
  settled.value = true
  if (!opStarted.value || !s || finished.value) {
    releaseOp(uid)
    return null
  }
  // A different save was loaded under us: that state has no op of ours to settle.
  if (!opMarked(state, uid)) {
    releaseOp(uid)
    return null
  }
  const r = s.opResult()
  const traced = s.trace.active && s.trace.total > 0 && s.trace.elapsed / s.trace.total >= WALKAWAY_TRACE_FRACTION
  const rep = submitOp({ ...r, traced, aborted: !traced })
  rep?.notes.push(
    traced ? 'You pulled the plug with the trace almost on you. Too late — they have your route.' : 'You walked away mid-op. It counts as jacking out.',
  )
  return rep
}

/** Hand an OpResult to the engine. Null when the contract vanished (deadline, abandon). */
function submitOp(result: OpResult): OpReport | null {
  const uid = opUid.value
  clearOpMarker(state)
  if (uid === null || !state.contracts.active.some(c => c.uid === uid && c.kind === 'hack')) return null
  return completeOp(state, uid, result)
}

function focusSoon(): void {
  window.setTimeout(() => screenRef.value?.focusInput(), 30)
}

// ── Command handling ──────────────────────────────────────────────────────────

function onSubmit(): void {
  const raw = inputText.value
  flush()
  push([{ text: prompt.value + raw, tone: 'in' }], true)
  const trimmed = raw.trim()
  if (trimmed !== '') {
    cmdHistory.value.push(trimmed)
    if (cmdHistory.value.length > 120) cmdHistory.value.shift()
  }
  histPos = -1
  inputText.value = ''
  if (finished.value) return

  if (mode.value === 'mission' && sim.value) {
    const out = sim.value.exec(raw)
    if (sim.value.consumeClear()) clearScreen()
    push(out)
    refreshView()
    checkStarted()
    if (sim.value.finished) onSimFinished()
  } else if (mode.value === 'missing') {
    push([{ text: 'No shell here. Use the button above, or close the window.', tone: 'warn' }])
  } else {
    const res = runShell(shellCtx(), raw)
    fortuneSeed++
    if (res.clear) clearScreen()
    push(res.lines)
    if (res.launch) openApp('terminal', res.launch.threadUid !== undefined ? { threadUid: res.launch.threadUid, contractUid: undefined } : { threadUid: undefined, contractUid: res.launch.contractUid })
  }
}

function onComplete(): void {
  const cands = mode.value === 'mission' && sim.value ? sim.value.complete(inputText.value) : mode.value === 'shell' ? completeShell(shellCtx(), inputText.value) : []
  if (cands.length === 0) return
  const parts = inputText.value.split(/\s+/)
  const head = parts.slice(0, -1)
  const common = commonPrefix(cands)
  if (cands.length === 1 || common.length > (parts[parts.length - 1] ?? '').length) {
    inputText.value = [...head, cands.length === 1 ? cands[0] : common].join(' ')
    if (cands.length === 1 && head.length > 0) inputText.value += ' '
  } else {
    push([{ text: cands.join('   '), tone: 'dim' }], true)
  }
}

function commonPrefix(list: string[]): string {
  if (list.length === 0) return ''
  let p = list[0] ?? ''
  for (const s of list) {
    while (!s.startsWith(p)) p = p.slice(0, -1)
    if (p === '') break
  }
  return p
}

function onHistory(dir: number): void {
  if (cmdHistory.value.length === 0) return
  if (histPos === -1) histPos = cmdHistory.value.length
  histPos = Math.max(0, Math.min(cmdHistory.value.length, histPos + dir))
  inputText.value = histPos >= cmdHistory.value.length ? '' : (cmdHistory.value[histPos] ?? '')
}

function onInterrupt(): void {
  const s = sim.value
  if (mode.value === 'mission' && s) {
    push(s.cancelJob())
    refreshView()
  } else {
    push([{ text: '^C', tone: 'dim' }], true)
    inputText.value = ''
  }
}

// ── Finishing ─────────────────────────────────────────────────────────────────

function onSimFinished(): void {
  const s = sim.value
  if (!s?.finished || finished.value) return
  finished.value = s.finished
  flush()
  if (isContract.value) {
    const uid = opUid.value
    const title = missionTitle.value
    settled.value = true
    const rep = submitOp(s.opResult())
    if (rep && uid !== null) {
      if (s.finished === 'lost' && s.lostReason) push([{ text: '', tone: 'out' }, { text: s.lostReason, tone: 'err' }])
      push(debriefLines(title, rep))
      markDebriefSeen(state, uid)
    } else {
      push(pulledLines())
    }
    push([{ text: '', tone: 'out' }, { text: 'Press Continue to close the session.', tone: 'dim' }])
    return
  }
  if (s.finished === 'won') {
    push([{ text: '', tone: 'out' }, { text: 'JOB COMPLETE. Press Continue to report back.', tone: 'good' }])
  } else {
    push([{ text: '', tone: 'out' }, { text: s.lostReason || 'The job failed.', tone: 'err' }, { text: 'Press Continue to report back.', tone: 'dim' }])
  }
}

/** Story missions: a trail you did not wipe costs the mission's log heat. */
function settleThreadTrail(): void {
  const s = sim.value
  if (s?.hasUnwipedTrail()) gainHeat(state, s.def.logHeat ?? 5)
}

function onContinue(): void {
  if (!isContract.value && props.threadUid !== undefined && !settled.value) {
    settled.value = true
    settleThreadTrail()
    missionResult(state, props.threadUid, finished.value === 'won')
  }
  releasePause()
  closeApp('terminal')
}

/** Story missions only: skip the terminal and let the dice decide. */
function autoResolveThread(): void {
  if (settled.value || props.threadUid === undefined) return
  settled.value = true
  missionAuto(state, props.threadUid)
  releasePause()
  closeApp('terminal')
}

/** Hack ops: hand the op to a script at the visible scripted odds (REDESIGN_V2 §A). */
function scriptIt(): void {
  const uid = opUid.value
  const c = contract.value
  if (uid === null || !c || settled.value || opStarted.value) return
  settled.value = true
  releaseOp(uid)
  const rep = scriptOp(state, uid)
  flush()
  push([{ text: '', tone: 'out' }, { text: `$ ./autorun --target "${c.title}" --unattended`, tone: 'in' }, { text: 'Script launched. You go and put the kettle on...', tone: 'dim' }])
  push(debriefLines(c.title, rep))
  push([{ text: '', tone: 'out' }, { text: 'Press Continue to close the session.', tone: 'dim' }])
  markDebriefSeen(state, uid)
  finished.value = rep.outcome === 'scripted' ? 'won' : 'lost'
}

function jackOut(): void {
  const s = sim.value
  if (!s || finished.value) return
  push(s.exec('jackout'))
  refreshView()
  checkStarted()
  if (s.finished) onSimFinished()
}

// ── Guards while an op is live ───────────────────────────────────────────────

// The weekly clock stays frozen during a live session (tray buttons / hotkeys included).
watch(
  () => state.time.speed,
  sp => {
    if (sp <= 0 || !sim.value || finished.value || settled.value) return
    pause(state)
    if (!didPause) didPause = true
    resumeAfter = true
    pushToast(OP_LOCK_MESSAGE, 'heat', 'terminal')
  },
)

// The contract disappeared under a live op (deadline passed, abandoned elsewhere).
watch(contract, (now, before) => {
  if (now || !before || settled.value || !sim.value || finished.value) return
  settled.value = true
  clearOpMarker(state)
  finished.value = 'lost'
  flush()
  push(pulledLines())
  push([{ text: 'Press Continue to close the session.', tone: 'dim' }])
})

// ── Real-time loop ────────────────────────────────────────────────────────────

function frame(t: number): void {
  const dt = lastT === 0 ? 0 : Math.min(0.1, (t - lastT) / 1000)
  lastT = t
  revealChars(dt)
  const s = sim.value
  if (mode.value === 'mission' && s && !finished.value) {
    const emitted = s.tick(dt)
    if (emitted.length) push(emitted)
    checkStarted()
    if (s.finished) onSimFinished()
    else refreshView()
  }
  raf = requestAnimationFrame(frame)
}

function revealChars(dt: number): void {
  let budget = Math.max(6, Math.ceil(dt * REVEAL_CPS))
  for (const l of lines.value) {
    if (l.shown >= l.text.length) continue
    const add = Math.min(budget, l.text.length - l.shown)
    l.shown += add
    budget -= add
    if (budget <= 0) break
  }
}

// ── Lifecycle ─────────────────────────────────────────────────────────────────

onMounted(() => {
  prefer = props.contractUid !== undefined && props.threadUid === undefined ? 'contract' : 'thread'
  init()
  lastT = 0
  raf = requestAnimationFrame(frame)
})

onBeforeUnmount(() => {
  cancelAnimationFrame(raf)
  const title = missionTitle.value
  const rep = walkAway()
  releasePause()
  if (rep) {
    pushToast(`Walked away from “${title}” — ${rep.outcome}. See the Ops debrief.`, 'bad', 'ops')
    // Show the debrief where it lives (the Terminal is gone). Deferred: we are mid-unmount.
    window.setTimeout(() => {
      openApp('ops', { tab: 'active' })
    }, 0)
  }
})

watch(
  () => [props.threadUid, props.contractUid] as const,
  ([th, co], [oldTh, oldCo]) => {
    if (co !== undefined && co !== oldCo) prefer = 'contract'
    else if (th !== undefined && th !== oldTh) prefer = 'thread'
    const title = missionTitle.value
    const rep = walkAway()
    if (rep) {
      pushToast(`Walked away from “${title}” — ${rep.outcome}. See the Ops debrief.`, 'bad', 'ops')
    }
    init()
  },
)
</script>


<template>
  <div class="app terminal-app">
    <div v-if="mode !== 'shell'" class="toolbar">
      <span class="ttitle mono">{{ missionTitle }}</span>
      <span class="grow"></span>
      <template v-if="!finished">
        <template v-if="isContract">
          <span v-if="opStarted" class="walk-note" title="Closing this window, launching another job or reloading counts as jacking out.">⚠ op live — closing = jack out</span>
          <button v-else-if="scriptInfo" type="button" class="btn small" :disabled="settled" :title="scriptInfo.tooltip" @click="scriptIt">🎲 {{ scriptInfo.label }}</button>
        </template>
        <button
          v-else-if="threadUid !== undefined"
          type="button"
          class="btn small"
          :disabled="settled"
          title="Skip the terminal and resolve this job with a skill check"
          @click="autoResolveThread"
        >
          Auto-resolve
        </button>
        <button v-if="mode === 'mission'" type="button" class="btn small danger" :disabled="settled" title="Leave now with whatever you have (same as `jackout`)" @click="jackOut">
          Jack out
        </button>
      </template>
      <template v-else>
        <button type="button" class="btn small primary" @click="onContinue">Continue</button>
      </template>
    </div>

    <div class="body" :class="{ split: mode !== 'shell' }">
      <MissionPanel
        v-if="mode !== 'shell'"
        :title="missionTitle"
        :briefing="missionBriefing"
        :goals="goalsView"
        :trace="traceView"
        :hosts="hostsView"
        :hints="missionHints"
        :job="jobView"
      />
      <TerminalScreen
        ref="screenRef"
        v-model:input="inputText"
        :lines="lines"
        :prompt="prompt"
        :locked="locked"
        @submit="onSubmit"
        @complete="onComplete"
        @history="onHistory"
        @interrupt="onInterrupt"
        @flush="flush"
      />
    </div>

    <div class="statusbar">
      <span v-if="mode === 'shell'" class="mono">LumenOS 2.1 — free shell</span>
      <span v-else-if="finished === 'won'" class="mono good">● {{ isContract ? 'op closed — see debrief' : 'objectives met — safe' }}</span>
      <span v-else-if="finished === 'lost'" class="mono bad">● connection lost</span>
      <span v-else-if="mode === 'missing'" class="mono warn">● no interactive mission</span>
      <span v-else-if="isContract" class="mono">● live op — real time · weekly clock frozen</span>
      <span v-else class="mono">● live session — real time</span>
      <span class="grow"></span>
      <span class="mono muted">{{ prompt.trim() }}</span>
    </div>
  </div>
</template>

<style scoped>
.terminal-app {
  padding: 6px;
  gap: 6px;
  background: #0a0d0a;
}
.toolbar {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 3px 4px;
  background: linear-gradient(#12331d, #0c2214);
  border: 1px solid #123f22;
  border-radius: 3px;
}
.ttitle {
  color: #6effa0;
  font-size: 12px;
  text-shadow: 0 0 3px rgb(51 255 102 / 40%);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.body {
  flex: 1;
  min-height: 0;
  display: flex;
  gap: 6px;
}
.body.split :deep(.mpanel) {
  background: var(--win-bg);
  border: 1px solid #123f22;
  border-radius: 3px;
  padding: 6px;
}
.statusbar {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
  padding: 2px 4px;
  color: var(--terminal-dim);
  border-top: 1px solid #123f22;
}
.statusbar .good {
  color: #6effa0;
}
.statusbar .bad {
  color: var(--terminal-err);
}
.statusbar .warn {
  color: var(--terminal-warn);
}
.grow {
  flex: 1;
}
.walk-note {
  font-size: 11px;
  color: var(--terminal-warn);
  white-space: nowrap;
  cursor: help;
}
@media (max-width: 620px) {
  .body.split {
    flex-direction: column;
  }
  .body.split :deep(.mpanel) {
    width: auto;
    max-height: 190px;
  }
}
</style>
