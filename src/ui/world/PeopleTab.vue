<script setup lang="ts">
/** Contacts → People: your little black book (met NPCs) with a relationship detail pane. */
import { computed, ref } from 'vue'
import { balance, countSlots, efficiency, formatDate, formatShortDate, C } from '@/engine'
import { useGame } from '@/ui/game'
import { openApp } from '@/ui/wm'
import Avatar from '@/ui/components/Avatar.vue'
import RichText from '@/ui/components/RichText.vue'
import BipolarBar from './BipolarBar.vue'
import {
  RELATION_TICKS,
  ROMANCE_LABELS,
  canSocialize,
  driftOf,
  fateOf,
  metPeople,
  relationOf,
  revealedFactionOf,
  type Person,
} from './people'
import { daysAgo, num1, plural } from './util'

const props = withDefaults(defineProps<{ selectedId?: string | null }>(), { selectedId: null })
const emit = defineEmits<{ select: [id: string] }>()

const state = useGame()

type SortKey = 'close' | 'name' | 'recent'
const query = ref('')
const sortKey = ref<SortKey>('close')

const people = computed(() => metPeople(state))

function lastContact(p: Person): number {
  return state.vars[`aff.last.${p.def.id}`] ?? -1e9
}

function reachable(p: Person): boolean {
  return fateOf(p.st.fate)?.reachable ?? true
}

const listed = computed(() => {
  const q = query.value.trim().toLowerCase()
  const focus = state.focus.social
  const rows = people.value.filter(
    p => q === '' || [p.def.name, p.def.handle ?? '', p.def.role].some(s => s.toLowerCase().includes(q)),
  )
  rows.sort((a, b) => {
    const fa = a.def.id === focus ? 0 : 1
    const fb = b.def.id === focus ? 0 : 1
    if (fa !== fb) return fa - fb
    const ra = reachable(a) ? 0 : 1
    const rb = reachable(b) ? 0 : 1
    if (ra !== rb) return ra - rb
    if (sortKey.value === 'name') return a.def.name.localeCompare(b.def.name)
    if (sortKey.value === 'recent') return lastContact(b) - lastContact(a) || a.def.name.localeCompare(b.def.name)
    return b.st.affinity - a.st.affinity || a.def.name.localeCompare(b.def.name)
  })
  return rows
})

const current = computed<Person | undefined>(
  () => people.value.find(p => p.def.id === props.selectedId) ?? listed.value[0],
)

const rel = computed(() => (current.value ? relationOf(current.value.st.affinity) : undefined))
const fate = computed(() => (current.value ? fateOf(current.value.st.fate) : undefined))
const romance = computed(() => {
  const p = current.value
  if (!p || p.st.romance === 'none') return undefined
  return ROMANCE_LABELS[p.st.romance]
})
const faction = computed(() => (current.value ? revealedFactionOf(state, current.value.def) : undefined))
const drift = computed(() => (current.value ? driftOf(state, current.value) : undefined))

const isFocus = computed(() => state.focus.social !== null && state.focus.social === current.value?.def.id)
const focusDef = computed(() => (state.focus.social ? C.npcs.get(state.focus.social) : undefined))
const socialOk = computed(() => (current.value ? canSocialize(current.value.def, current.value.st) : false))
const socialHours = computed(() => countSlots(state, 'social'))

/** Display estimate of the engine's social-hour affinity gain (sim/time.ts). */
const estimate = computed(() => {
  const perHour = balance.SOCIAL_AFFINITY_PER_HOUR * (1 + state.skills.social.level / 60)
  const eff = efficiency(state)
  const perDay = perHour * socialHours.value * eff
  return {
    perDay,
    title: `${plural(socialHours.value, 'social hour')}/day × ${num1(perHour)} per hour (Social ${state.skills.social.level}) × ${Math.round(eff * 100)}% efficiency`,
  }
})

const hangOutReason = computed(() => {
  const p = current.value
  if (!p) return ''
  if (!p.def.social) return ''
  if (!socialOk.value) return `${p.def.name} can't be reached right now.`
  return 'Your Social schedule blocks will be spent with them.'
})

function hangOut(): void {
  const p = current.value
  if (p && socialOk.value) state.focus.social = p.def.id
}

function stopHangingOut(): void {
  state.focus.social = null
}

function openChat(): void {
  if (current.value) openApp('pager', { npc: current.value.def.id })
}

function onKey(e: KeyboardEvent): void {
  if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return
  e.preventDefault()
  const rows = listed.value
  const i = rows.findIndex(p => p.def.id === current.value?.def.id)
  const next = rows[Math.max(0, Math.min(rows.length - 1, i + (e.key === 'ArrowDown' ? 1 : -1)))]
  if (next) emit('select', next.def.id)
}
</script>

<template>
  <div class="people">
    <div class="side col">
      <div class="row">
        <label class="sr" for="people-q">Find</label>
        <input id="people-q" v-model="query" class="grow" type="text" placeholder="Find a name or handle..." />
      </div>
      <div class="row small">
        <label for="people-sort" class="muted">Sort:</label>
        <select id="people-sort" v-model="sortKey" class="grow">
          <option value="close">Closest first</option>
          <option value="recent">Recently in touch</option>
          <option value="name">Name (A–Z)</option>
        </select>
      </div>
      <div class="list grow" tabindex="0" role="listbox" aria-label="People you know" @keydown="onKey">
        <div
          v-for="p in listed"
          :key="p.def.id"
          class="list-item person"
          :class="{ selected: current?.def.id === p.def.id, disabled: !reachable(p) }"
          role="option"
          :aria-selected="current?.def.id === p.def.id"
          @click="emit('select', p.def.id)"
        >
          <Avatar :npc="p.def.id" :size="28" />
          <div class="grow">
            <div class="pname">
              {{ p.def.name }}
              <span v-if="state.focus.social === p.def.id" class="star" title="Social focus">★</span>
              <span v-if="p.st.romance !== 'none' && p.st.romance !== 'ex'" class="heart" :title="ROMANCE_LABELS[p.st.romance].label">♥</span>
            </div>
            <div class="muted ellipsis">{{ p.def.handle ? `"${p.def.handle}" · ` : '' }}{{ p.def.role }}</div>
          </div>
          <div class="aff" :class="relationOf(p.st.affinity).tone" :title="relationOf(p.st.affinity).label">
            {{ Math.round(p.st.affinity) }}
            <span v-if="driftOf(state, p).level === 'warn'" class="drift" title="Drifting apart">⚠</span>
          </div>
        </div>
        <div v-if="people.length === 0" class="empty muted">
          Your address book is empty. Even the telemarketers lost your number.
        </div>
        <div v-else-if="listed.length === 0" class="empty muted">Nobody by that name in your little black book.</div>
      </div>
      <div class="muted small">{{ plural(people.length, 'contact') }}</div>
    </div>

    <div v-if="current && rel" class="detail panel col">
      <div class="head row">
        <Avatar :npc="current.def.id" :size="56" />
        <div class="grow col tight">
          <h2 class="row wrap tight">
            {{ current.def.name }}
            <span v-if="isFocus" class="pill info">★ Social focus</span>
          </h2>
          <div class="muted">
            <span v-if="current.def.handle" class="mono">"{{ current.def.handle }}"</span>
            <span v-if="current.def.handle"> · </span>{{ current.def.role }}
          </div>
          <div class="row wrap tight">
            <span
              v-if="faction"
              class="pill fpill"
              :style="{ background: faction.color }"
              :title="faction.name"
            >{{ faction.icon }} {{ faction.short }}</span>
            <span v-if="romance" class="pill" :class="romance.tone">♥ {{ romance.label }}</span>
            <span v-if="fate" class="pill" :class="fate.tone">{{ fate.label }}</span>
          </div>
        </div>
      </div>

      <div class="actions row wrap">
        <template v-if="current.def.social">
          <button v-if="isFocus" type="button" class="btn" @click="stopHangingOut">Stop hanging out</button>
          <button
            v-else
            type="button"
            class="btn primary"
            :disabled="!socialOk"
            :title="hangOutReason"
            @click="hangOut"
          >
            Hang out (set as social focus)
          </button>
        </template>
        <button type="button" class="btn" @click="openChat">Open chat</button>
      </div>

      <div class="scroll col">
        <div class="group">
          <div class="group-title">Relationship</div>
          <div class="row">
            <BipolarBar
              class="grow"
              :value="current.st.affinity"
              :ticks="RELATION_TICKS"
              :color="rel.tone === 'story' ? 'var(--story)' : 'var(--good)'"
              :label="`${rel.label} · ${Math.round(current.st.affinity)}`"
              :title="`Affinity ${Math.round(current.st.affinity)} (−100 … 100)`"
              :height="16"
            />
          </div>
          <p v-if="fate?.reachable !== false" class="blurb" :class="rel.tone">{{ rel.blurb }}</p>
          <div v-if="drift" class="contact">
            <div v-if="drift.lastDay !== undefined && drift.since !== undefined">
              Last in touch <b>{{ daysAgo(drift.since) }}</b> <span class="muted">({{ formatDate(drift.lastDay) }})</span>
            </div>
            <div v-else class="muted">No contact on record.</div>
            <div v-if="drift.level === 'warn' && drift.lossDay !== undefined" class="warn drift-line">
              ⚠ Drifting apart: {{ current.def.name }} loses {{ num1(drift.decay) }} affinity on
              {{ formatShortDate(drift.lossDay) }} unless you get in touch before then.
            </div>
            <div v-else-if="drift.level === 'covered'" class="muted drift-line">
              You see each other every day. Neglect would cost {{ num1(drift.decay) }} affinity a week.
            </div>
            <div v-else-if="drift.level === 'ok' && drift.lossDay !== undefined" class="muted drift-line">
              In touch recently — no drift before {{ formatShortDate(drift.lossDay) }}. A week of silence
              costs {{ num1(drift.decay) }} affinity.
            </div>
          </div>
        </div>

        <div v-if="fate" class="group fate" :class="fate.tone">
          <div class="group-title">Status: {{ fate.label }}</div>
          <p v-if="fate.line">{{ fate.line }}</p>
          <p v-if="!fate.reachable && current.def.social" class="muted">You can't spend time with them anymore.</p>
        </div>

        <div v-if="current.def.social && (socialOk || isFocus)" class="group">
          <div class="group-title">Social time</div>
          <template v-if="isFocus">
            <p v-if="!socialOk" class="bad">
              {{ current.def.name }} can't be reached anymore — your Social hours are going nowhere. Pick someone
              else to spend time with.
            </p>
            <p v-else-if="socialHours > 0">
              Your {{ plural(socialHours, 'Social hour') }} a day go to {{ current.def.name }}:
              <b class="good" :title="estimate.title">≈ +{{ num1(estimate.perDay) }} affinity/day</b>.
            </p>
            <p v-else class="warn">
              No Social hours in your planner — {{ current.def.name }} is your focus, but you never actually
              show up.
              <button type="button" class="btn small" @click="openApp('schedule')">Open Planner</button>
            </p>
          </template>
          <p v-else-if="focusDef" class="muted">
            Your Social time currently goes to {{ focusDef.name }}.
          </p>
          <p v-else class="muted">
            Nobody is your social focus — Social hours only train the skill. Pick someone to hang out with.
          </p>
        </div>

        <div class="group">
          <div class="group-title">About {{ current.def.name }}</div>
          <RichText :text="current.def.bio" />
        </div>
      </div>
    </div>
    <div v-else class="detail panel empty-detail muted">
      <p>Select someone to see how things stand between you.</p>
    </div>
  </div>
</template>

<style scoped>
.people {
  flex: 1;
  min-height: 0;
  display: flex;
  gap: 8px;
}
.side {
  width: 232px;
  flex: none;
}
.small {
  font-size: 11px;
}
.sr {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
}
.list:focus-visible {
  outline: 1px dotted var(--sel-bg);
  outline-offset: 1px;
}
.person {
  display: flex;
  align-items: center;
  gap: 6px;
}
.person.disabled {
  opacity: 0.65;
}
.pname {
  font-weight: bold;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.ellipsis {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 11px;
}
.star {
  color: var(--warn);
}
.heart {
  color: var(--story);
}
.list-item.selected .star,
.list-item.selected .heart,
.list-item.selected .aff {
  color: var(--sel-fg);
}
.aff {
  font-weight: bold;
  font-size: 11px;
  min-width: 26px;
  text-align: right;
}
.drift {
  color: var(--warn);
}
.empty {
  padding: 16px 10px;
  text-align: center;
  line-height: 1.5;
}
.detail {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.empty-detail {
  align-items: center;
  justify-content: center;
}
.head {
  align-items: flex-start;
  gap: 10px;
  padding-bottom: 6px;
  border-bottom: 1px solid var(--panel-border);
}
.tight {
  gap: 4px;
}
.fpill {
  color: var(--sel-fg);
  text-shadow: 0 1px 1px rgb(0 0 0 / 35%);
}
.actions {
  gap: 6px;
}
.blurb {
  margin: 6px 0 0;
  font-style: italic;
}
.contact {
  display: flex;
  flex-direction: column;
  gap: 3px;
  margin-top: 6px;
}
.drift-line {
  font-size: 11px;
  line-height: 1.4;
}
.group.fate.bad {
  border-color: var(--bad);
}
.group.fate.bad .group-title {
  color: var(--bad);
}
.group.fate.good .group-title {
  color: var(--good);
}
.group.fate.warn .group-title {
  color: var(--warn);
}
</style>
