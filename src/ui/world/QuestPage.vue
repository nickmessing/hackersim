<script setup lang="ts">
/** The right-hand journal page for one quest: header, current entry, objectives, hints, history. */
import { computed, ref } from 'vue'
import { C, evalCond, formatShortDate, renderLine } from '@/engine'
import { useGame } from '@/ui/game'
import Avatar from '@/ui/components/Avatar.vue'
import ProgressBar from '@/ui/components/ProgressBar.vue'
import RichText from '@/ui/components/RichText.vue'
import { KIND_LABELS, STATUS_LABELS, deadlineOf, objectiveViews, type QuestEntry } from './questData'
import { num1, roman } from './util'

const props = defineProps<{ entry: QuestEntry }>()

const state = useGame()

const def = computed(() => props.entry.def)
const q = computed(() => props.entry.q)
const active = computed(() => q.value.status === 'active')
const stage = computed(() => def.value.stages[q.value.stage])
const status = computed(() => STATUS_LABELS[q.value.status])
const kind = computed(() => KIND_LABELS[def.value.kind])

/** Consequence sub-stories (spawned by traced ops, failed gigs, bad checks) are titled "Complication: …". */
const COMPLICATION_PREFIX = 'Complication:'
const complication = computed(() => def.value.title.startsWith(COMPLICATION_PREFIX))
const title = computed(() =>
  complication.value ? def.value.title.slice(COMPLICATION_PREFIX.length).trim() || def.value.title : def.value.title,
)

const faction = computed(() => {
  const id = def.value.faction
  const f = id ? C.factions.get(id) : undefined
  return f && evalCond(state, f.revealWhen) ? f : undefined
})
const giver = computed(() => (def.value.giver ? C.npcs.get(def.value.giver) : undefined))

const objectives = computed(() => objectiveViews(state, props.entry, q.value.stage))
const deadline = computed(() => (active.value ? deadlineOf(state, props.entry) : undefined))
const tracked = computed(() => state.trackedQuest === props.entry.id)

/** Earlier journal entries (stages passed through), oldest first; excludes the current/final stage. */
const history = computed(() => {
  const ids = [...q.value.history]
  if (!active.value && ids[ids.length - 1] === q.value.stage) ids.pop()
  return ids
    .map((sid, i) => ({ key: `${sid}#${i}`, text: def.value.stages[sid]?.text }))
    .filter(h => h.text !== undefined)
})

const stageHint = computed(() => (active.value ? renderLine(state, stage.value?.hint) : ''))
const doneCount = computed(() => objectives.value.filter(o => o.done && o.def.optional !== true).length)
const requiredCount = computed(() => objectives.value.filter(o => o.def.optional !== true).length)

const shown = ref(new Set<string>())
function toggleHint(key: string): void {
  if (shown.value.has(key)) shown.value.delete(key)
  else shown.value.add(key)
}

function track(): void {
  if (active.value) state.trackedQuest = props.entry.id
}
function untrack(): void {
  if (tracked.value) state.trackedQuest = null
}
</script>

<template>
  <article class="qpage" :class="{ comp: complication }">
    <div v-if="!active" class="stamp" :class="q.status" aria-hidden="true">{{ status.label }}</div>

    <header class="qhead">
      <div class="grow">
        <h2 class="qtitle">{{ title }}</h2>
        <div class="pills">
          <span v-if="complication" class="jpill comp" title="A consequence sub-story: its outcome leaves a lasting mark">⚠ Complication</span>
          <span class="jpill">{{ kind.glyph }} {{ kind.one }}</span>
          <span v-if="def.act" class="jpill">Act {{ roman(def.act) }}</span>
          <span v-if="faction" class="jpill fac" :style="{ borderColor: faction.color, color: faction.color }">
            {{ faction.icon }} {{ faction.short }}
          </span>
          <span class="jpill" :class="status.tone">{{ status.label }}</span>
        </div>
      </div>
      <div class="track">
        <button v-if="active && !tracked" type="button" class="jbtn" title="Show this quest in the tracker" @click="track">
          ◇ Track
        </button>
        <button v-else-if="tracked" type="button" class="jbtn on" title="Stop tracking this quest" @click="untrack">
          ◆ Tracked
        </button>
      </div>
    </header>

    <div v-if="giver" class="giver">
      <Avatar :npc="giver.id" :size="28" />
      <div>
        <div class="faded small">Given by</div>
        <div><b>{{ giver.name }}</b><span class="faded"> — {{ giver.role }}</span></div>
      </div>
    </div>

    <RichText class="summary" :text="def.summary" />

    <p v-if="complication && active" class="comp-note">
      Something went wrong, and it followed you home. How this ends can leave a scar, a debt, or a grudge — look for
      a way to pay, talk, or lie your way out before it escalates.
    </p>
    <p v-else-if="complication" class="comp-note faded">
      A consequence, now behind you — whatever it left is listed under Life → Personal → Scars &amp; Traits and
      Life → Money → Obligations.
    </p>

    <div v-if="deadline" class="deadline" :class="deadline.tone" title="While a deadline runs, time can go no faster than 2×.">
      ⌛ <b>{{ deadline.label }}</b>
      <span class="faded"> — due by {{ formatShortDate(deadline.dueDay) }}</span>
    </div>

    <section class="entry current">
      <h3 class="sect">
        {{ active ? 'Current entry' : 'Final entry' }}
        <span class="faded small">· {{ formatShortDate(q.stageDay) }}</span>
      </h3>
      <RichText v-if="stage" :text="stage.text" />
      <div v-if="stageHint" class="hintline">
        <button type="button" class="hintbtn" :aria-expanded="shown.has(`${entry.id}:${q.stage}:stage`)" @click="toggleHint(`${entry.id}:${q.stage}:stage`)">
          {{ shown.has(`${entry.id}:${q.stage}:stage`) ? 'Hide hint' : '✎ Show hint' }}
        </button>
        <p v-if="shown.has(`${entry.id}:${q.stage}:stage`)" class="hint">{{ stageHint }}</p>
      </div>
    </section>

    <section v-if="objectives.length" class="objectives">
      <h3 class="sect">
        Objectives
        <span v-if="requiredCount" class="faded small">· {{ doneCount }}/{{ requiredCount }}</span>
      </h3>
      <ul>
        <li
          v-for="o in objectives"
          :key="o.key"
          class="obj"
          :class="{ done: o.done, failed: !o.done && q.status === 'failed', optional: o.def.optional }"
        >
          <span class="box" aria-hidden="true">{{ o.done ? '✓' : q.status === 'failed' ? '✗' : '' }}</span>
          <div class="grow">
            <div class="otext">
              <span class="sr">{{ o.done ? 'Done:' : 'To do:' }}</span>
              {{ o.text }}
              <span v-if="o.def.optional" class="opt">(optional)</span>
            </div>
            <div v-if="o.progress" class="oprog">
              <ProgressBar class="grow" :value="o.progress.frac" :height="10" color="var(--j-gilt)" />
              <span class="faded small">{{ num1(Math.min(o.progress.value, o.progress.target)) }} / {{ o.progress.target }}</span>
            </div>
            <template v-if="o.hint && !o.done && active">
              <button type="button" class="hintbtn" :aria-expanded="shown.has(o.key)" @click="toggleHint(o.key)">
                {{ shown.has(o.key) ? 'Hide hint' : '✎ Show hint' }}
              </button>
              <p v-if="shown.has(o.key)" class="hint">{{ o.hint }}</p>
            </template>
          </div>
        </li>
      </ul>
    </section>

    <div v-if="def.rewards" class="rewards"><span class="faded">Rewards:</span> {{ def.rewards }}</div>

    <section v-if="history.length" class="history">
      <h3 class="sect">Earlier entries</h3>
      <div v-for="h in history" :key="h.key" class="past">
        <span class="tick" aria-hidden="true">✓</span>
        <RichText class="grow" :text="h.text" />
      </div>
    </section>

    <footer class="qfoot faded small">
      Begun {{ formatShortDate(q.startedDay) }}
      <template v-if="q.endedDay !== undefined"> · {{ status.label }} {{ formatShortDate(q.endedDay) }}</template>
    </footer>
  </article>
</template>

<style scoped>
.qpage {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 10px;
  color: var(--j-ink);
}
.qhead {
  display: flex;
  gap: 8px;
  align-items: flex-start;
  padding-bottom: 6px;
  border-bottom: 1px solid var(--j-rule);
}
.qtitle {
  font-family: var(--j-serif);
  font-size: 20px;
  line-height: 1.15;
  color: var(--j-ink-red);
  margin-bottom: 4px;
  padding-right: 90px;
}
.pills {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}
.jpill {
  font-size: 10px;
  padding: 0 6px;
  line-height: 16px;
  border: 1px solid var(--j-ink-faded);
  border-radius: 8px;
  color: var(--j-ink-faded);
  background: rgb(255 255 255 / 25%);
}
.jpill.good {
  color: var(--good);
  border-color: var(--good);
}
.jpill.bad {
  color: var(--bad);
  border-color: var(--bad);
}
.jpill.info {
  color: var(--info);
  border-color: var(--info);
}
.jpill.fac {
  font-weight: bold;
}
.jpill.comp {
  color: var(--j-parch);
  background: var(--j-ink-red);
  border-color: var(--j-ink-red);
  font-weight: bold;
}
.qpage.comp .qhead {
  border-bottom: 2px solid var(--j-ink-red);
}
.comp-note {
  margin: 0;
  padding: 4px 8px;
  border-left: 3px solid var(--j-ink-red);
  font-family: var(--j-serif);
  font-size: 12px;
  line-height: 1.4;
  color: var(--j-ink-red);
  background: repeating-linear-gradient(135deg, rgb(138 43 27 / 6%) 0 6px, transparent 6px 12px);
}
.comp-note.faded {
  color: var(--j-ink-faded);
  border-left-color: var(--j-ink-faded);
}
.track {
  flex: none;
}
.jbtn {
  font-family: var(--j-serif);
  font-size: 12px;
  padding: 2px 10px;
  border: 1px solid var(--j-ink-faded);
  border-radius: 2px;
  color: var(--j-ink);
  background: linear-gradient(var(--j-parch), var(--j-parch-dark));
  box-shadow: 0 1px 0 rgb(255 255 255 / 50%) inset, 0 1px 2px rgb(60 40 20 / 25%);
  cursor: pointer;
}
.jbtn:hover {
  border-color: var(--j-ink-red);
  color: var(--j-ink-red);
}
.jbtn.on {
  color: var(--j-ink-red);
  font-weight: bold;
}
.jbtn:focus-visible,
.hintbtn:focus-visible {
  outline: 1px dotted var(--j-ink-red);
  outline-offset: 1px;
}
.giver {
  display: flex;
  align-items: center;
  gap: 8px;
}
.faded {
  color: var(--j-ink-faded);
}
.small {
  font-size: 11px;
}
.summary {
  font-family: var(--j-serif);
  font-style: italic;
  font-size: 13px;
  line-height: 1.5;
}
.deadline {
  font-size: 12px;
  padding: 4px 8px;
  border: 1px dashed currentcolor;
  border-radius: 2px;
  background: rgb(255 255 255 / 25%);
}
.deadline.bad {
  color: var(--bad);
}
.deadline.warn {
  color: var(--warn);
}
.deadline.info {
  color: var(--info);
}
.sect {
  font-family: var(--j-serif);
  font-size: 13px;
  font-variant: small-caps;
  letter-spacing: 1px;
  color: var(--j-ink-red);
  border-bottom: 1px solid var(--j-rule);
  margin-bottom: 6px;
  padding-bottom: 1px;
}
.sect .small {
  font-variant: normal;
  letter-spacing: 0;
}
.entry {
  font-family: var(--j-serif);
  font-size: 13px;
  line-height: 1.5;
}
.objectives ul {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.obj {
  display: flex;
  gap: 6px;
  align-items: flex-start;
}
.box {
  width: 13px;
  height: 13px;
  margin-top: 1px;
  flex: none;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1.5px solid var(--j-ink);
  border-radius: 2px;
  background: rgb(255 255 255 / 35%);
  font-family: var(--j-serif);
  font-size: 13px;
  font-weight: bold;
  line-height: 1;
}
.obj.optional .box {
  border-style: dashed;
}
.obj.done .box {
  color: var(--good);
  border-color: var(--j-ink-faded);
}
.obj.failed .box {
  color: var(--bad);
  border-color: var(--j-ink-faded);
}
.otext {
  font-size: 12px;
  line-height: 1.4;
}
.obj.done .otext {
  color: var(--j-ink-faded);
  text-decoration: line-through;
  text-decoration-color: rgb(60 40 20 / 40%);
}
.obj.failed .otext {
  color: var(--j-ink-faded);
}
.opt {
  font-style: italic;
  color: var(--j-ink-faded);
  font-size: 11px;
}
.sr {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
}
.oprog {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 3px;
  max-width: 280px;
}
.hintline {
  margin-top: 2px;
}
.hintbtn {
  font: inherit;
  font-family: var(--j-serif);
  font-size: 11px;
  font-style: italic;
  color: var(--j-ink-red);
  background: none;
  border: none;
  padding: 0;
  margin-top: 2px;
  cursor: pointer;
  text-decoration: underline dotted;
}
.hint {
  margin: 3px 0 0;
  padding: 3px 8px;
  border-left: 2px solid var(--j-gilt);
  font-family: var(--j-serif);
  font-style: italic;
  font-size: 12px;
  background: rgb(255 240 200 / 45%);
}
.rewards {
  font-size: 12px;
  font-family: var(--j-serif);
}
.history .past {
  display: flex;
  gap: 6px;
  color: var(--j-ink-faded);
  font-family: var(--j-serif);
  font-size: 12px;
  line-height: 1.45;
  padding-bottom: 4px;
  margin-bottom: 4px;
  border-bottom: 1px dotted var(--j-rule);
}
.tick {
  color: var(--good);
  flex: none;
}
.qfoot {
  text-align: right;
  font-style: italic;
  font-family: var(--j-serif);
}

/* The rubber stamp on finished quests */
.stamp {
  position: absolute;
  top: 2px;
  right: 4px;
  transform: rotate(-12deg);
  font-family: var(--j-serif);
  font-weight: bold;
  font-size: 15px;
  letter-spacing: 3px;
  text-transform: uppercase;
  padding: 2px 8px;
  border: 3px double currentcolor;
  border-radius: 4px;
  opacity: 0.72;
  pointer-events: none;
  mix-blend-mode: multiply;
}
.stamp.completed {
  color: var(--good);
}
.stamp.failed {
  color: var(--bad);
}
</style>
