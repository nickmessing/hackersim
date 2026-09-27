<script setup lang="ts">
/** Contacts → Factions: who in Port Lumen is keeping score on you, and what it's worth. */
import { computed, ref } from 'vue'
import { signed } from '@/engine'
import type { FactionDef } from '@/engine'
import { useGame } from '@/ui/game'
import Avatar from '@/ui/components/Avatar.vue'
import RichText from '@/ui/components/RichText.vue'
import BipolarBar from './BipolarBar.vue'
import { metPeople, rankOf, repTone, revealedFactions, type Person, type RankView } from './people'

const emit = defineEmits<{ person: [id: string] }>()

const state = useGame()

interface FactionRow {
  def: FactionDef
  rep: number
  rank: RankView
  members: Person[]
}

/** Expanded cards; `null` = the default (top-ranked faction open). */
const open = ref<Set<string> | null>(null)
function isOpen(id: string): boolean {
  return open.value ? open.value.has(id) : rows.value[0]?.def.id === id
}
function toggle(id: string): void {
  const next = new Set(open.value ?? (rows.value[0] ? [rows.value[0].def.id] : []))
  if (next.has(id)) next.delete(id)
  else next.add(id)
  open.value = next
}

const rows = computed<FactionRow[]>(() => {
  const people = metPeople(state)
  return revealedFactions(state)
    .map(def => {
      const rep = state.factions[def.id] ?? 0
      return { def, rep, rank: rankOf(def, rep), members: people.filter(p => p.def.faction === def.id) }
    })
    .sort((a, b) => b.rep - a.rep || a.def.name.localeCompare(b.def.name))
})
</script>

<template>
  <div class="factions scroll">
    <div v-if="rows.length === 0" class="empty panel muted">
      <p><b>Nobody is keeping score on you yet.</b></p>
      <p>No crews, no companies, no feds. Enjoy the anonymity while it lasts — in this town, it never does.</p>
    </div>
    <article v-for="row in rows" :key="row.def.id" class="fcard panel" :class="{ open: isOpen(row.def.id) }">
      <header class="row">
        <div class="ficon" :style="{ background: row.def.color }" aria-hidden="true">{{ row.def.icon }}</div>
        <div class="grow col tight">
          <h3 class="row tight">
            <button
              type="button"
              class="fname"
              :aria-expanded="isOpen(row.def.id)"
              :aria-controls="`fac-${row.def.id}`"
              @click="toggle(row.def.id)"
            >
              <span class="caret" aria-hidden="true">{{ isOpen(row.def.id) ? '▾' : '▸' }}</span>
              {{ row.def.name }}
              <span class="muted short">({{ row.def.short }})</span>
            </button>
          </h3>
          <div class="row">
            <BipolarBar
              class="grow"
              :value="row.rep"
              :color="row.def.color"
              :ticks="row.rank.ladder.map(r => r.at)"
              :label="`${signed(Math.round(row.rep))} · ${row.rank.label}`"
              :title="`Reputation ${signed(Math.round(row.rep))} (−100 … +100)`"
              :height="16"
            />
            <span class="pill" :class="repTone(row.rep)">{{ row.rank.label }}</span>
          </div>
          <div class="muted small">
            <template v-if="row.rank.next">
              Next: <b>{{ row.rank.next.label }}</b> at {{ row.rank.next.at }}
              ({{ Math.ceil(row.rank.next.at - row.rep) }} to go)
            </template>
            <template v-else>Top of the ladder. They can't think any more highly of you.</template>
          </div>
        </div>
      </header>

      <div v-if="isOpen(row.def.id)" :id="`fac-${row.def.id}`" class="details">
        <RichText class="desc" :text="row.def.desc" />

        <div class="ladder" role="list" :aria-label="`${row.def.name} standing tiers`">
          <span
            v-for="r in row.rank.ladder"
            :key="r.at"
            role="listitem"
            class="step"
            :class="{ reached: r.at <= row.rep, current: row.rank.current?.at === r.at }"
            :style="row.rank.current?.at === r.at ? { borderColor: row.def.color } : {}"
            :title="`${r.label}: reputation ${r.at >= 0 ? `${r.at}+` : r.at}`"
          >
            <span class="step-at">{{ r.at > 0 ? `+${r.at}` : r.at }}</span>
            {{ r.label }}
          </span>
        </div>

        <div v-if="row.members.length" class="members row wrap">
          <span class="muted small">People you know:</span>
          <button
            v-for="m in row.members"
            :key="m.def.id"
            type="button"
            class="member"
            :title="`${m.def.name} — ${m.def.role}`"
            @click="emit('person', m.def.id)"
          >
            <Avatar :npc="m.def.id" :size="20" />
            <span>{{ m.def.name }}</span>
          </button>
        </div>
      </div>
    </article>
  </div>
</template>

<style scoped>
.factions {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.empty {
  padding: 24px;
  text-align: center;
}
.fcard {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 8px 10px;
  flex: none;
}
.fcard header {
  align-items: flex-start;
  gap: 10px;
}
.ficon {
  width: 40px;
  height: 40px;
  flex: none;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  font-weight: bold;
  color: var(--sel-fg);
  border: 1px solid rgb(0 0 0 / 30%);
  border-radius: var(--radius);
  text-shadow: 0 1px 2px rgb(0 0 0 / 45%);
  box-shadow: inset 0 1px 0 rgb(255 255 255 / 35%);
}
.tight {
  gap: 4px;
}
.short {
  font-weight: normal;
  font-size: 11px;
}
.small {
  font-size: 11px;
}
.details {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding-top: 6px;
  border-top: 1px dotted var(--panel-border);
}
.desc {
  color: var(--win-fg);
}
.fname {
  font: inherit;
  font-weight: bold;
  display: inline-flex;
  align-items: baseline;
  gap: 4px;
  background: none;
  border: none;
  padding: 0;
  color: var(--win-fg);
  cursor: pointer;
  text-align: left;
}
.fname:hover {
  color: var(--info);
  text-decoration: underline;
}
.fname:focus-visible {
  outline: 1px dotted var(--sel-bg);
  outline-offset: 1px;
}
.caret {
  width: 10px;
  color: var(--muted);
}
.ladder {
  display: flex;
  flex-wrap: wrap;
  gap: 3px;
}
.step {
  font-size: 10px;
  padding: 1px 6px;
  border: 1px solid var(--panel-border);
  border-radius: 8px;
  color: var(--muted);
  background: var(--panel-alt);
}
.step.reached {
  color: var(--win-fg);
}
.step.current {
  font-weight: bold;
  border-width: 2px;
  padding: 0 5px;
  background: var(--panel-bg);
}
.step-at {
  color: var(--muted);
  margin-right: 2px;
}
.members {
  gap: 4px;
  padding-top: 4px;
  border-top: 1px dotted var(--panel-border);
}
.member {
  font: inherit;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 1px 6px 1px 1px;
  border: 1px solid var(--panel-border);
  border-radius: 12px;
  background: var(--panel-alt);
  cursor: pointer;
}
.member:hover {
  background: var(--btn-hover);
  border-color: var(--sel-bg);
}
.member:focus-visible {
  outline: 1px dotted var(--sel-bg);
}
</style>
