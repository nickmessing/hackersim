<script setup lang="ts">
/**
 * Life → Personal → "Scars & Traits": the quirks you picked at creation, and the scars the story
 * left on you (permanent traits from bad outcomes and big moments). Modifiers in plain English.
 */
import { computed } from 'vue'
import { C, renderLine } from '@/engine'
import type { TraitDef } from '@/engine'
import { useGame } from '@/ui/game'
import { describeMods, type ModLine } from '@/ui/world/modText'

const state = useGame()

interface TraitRow {
  id: string
  name: string
  desc: string
  lines: ModLine[]
  scar: boolean
  bad: boolean
}

function toRow(def: TraitDef): TraitRow {
  return {
    id: def.id,
    name: def.name,
    desc: renderLine(state, def.desc),
    lines: describeMods(def.mods),
    scar: def.scar === true,
    bad: def.bad === true,
  }
}

const rows = computed(() =>
  state.player.traits
    .map(id => C.traits.get(id))
    .filter((d): d is TraitDef => d !== undefined)
    .map(toRow),
)
const traits = computed(() => rows.value.filter(r => !r.scar))
/** Scars: the hurtful ones first, then the double-edged or hard-won ones. */
const scars = computed(() => rows.value.filter(r => r.scar).sort((a, b) => Number(b.bad) - Number(a.bad)))

function kindLabel(r: TraitRow): string {
  if (!r.scar) return 'Trait'
  return r.bad ? 'Scar' : 'Scar · hard-won'
}
</script>

<template>
  <fieldset class="gbox traits-panel">
    <legend>Scars &amp; Traits</legend>

    <div class="sub">
      <span class="sub-title">Who you are</span>
      <span class="muted small">Picked when you set up this life. They stay with you.</span>
    </div>
    <p v-if="traits.length === 0" class="muted empty">No particular quirks. Refreshingly ordinary.</p>
    <div v-for="t in traits" :key="t.id" class="trait">
      <div class="t-head">
        <span class="t-icon" aria-hidden="true">◆</span>
        <b>{{ t.name }}</b>
        <span class="grow"></span>
        <span class="pill info">{{ kindLabel(t) }}</span>
      </div>
      <div class="t-desc muted">{{ t.desc }}</div>
      <div v-if="t.lines.length" class="t-mods">
        <span v-for="(l, i) in t.lines" :key="i" class="pill" :class="l.good ? 'good' : 'bad'">{{ l.text }}</span>
      </div>
    </div>

    <div class="sub">
      <span class="sub-title">What happened to you</span>
      <span class="muted small">Scars are permanent — marks left by things that went wrong, or went very right.</span>
    </div>
    <p v-if="scars.length === 0" class="muted empty">No scars yet. Everybody in Port Lumen picks up one or two eventually.</p>
    <div v-for="s in scars" :key="s.id" class="trait scar" :class="{ bad: s.bad }">
      <span class="stitch" aria-hidden="true"></span>
      <div class="t-body">
        <div class="t-head">
          <b>{{ s.name }}</b>
          <span class="grow"></span>
          <span class="pill" :class="s.bad ? 'bad' : 'warn'">{{ kindLabel(s) }}</span>
        </div>
        <div class="t-desc">{{ s.desc }}</div>
        <div v-if="s.lines.length" class="t-mods">
          <span v-for="(l, i) in s.lines" :key="i" class="pill" :class="l.good ? 'good' : 'bad'">{{ l.text }}</span>
        </div>
        <div v-else class="muted small">No number on it. Just a thing people remember — and some stories will.</div>
      </div>
    </div>
  </fieldset>
</template>

<style scoped>
.gbox {
  margin: 0;
  border: 1px solid #d0d0bf;
  border-radius: var(--radius);
  padding: 4px 8px 8px;
  background: var(--panel-alt);
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 5px;
}
.gbox legend {
  color: var(--info);
  font-weight: bold;
  padding: 0 4px;
}
.small {
  font-size: 11px;
}
.empty {
  font-style: italic;
  margin: 0;
  font-size: 11px;
}
.sub {
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 2px 8px;
  padding-bottom: 1px;
  border-bottom: 1px dotted #deddcf;
}
.sub:not(:first-of-type) {
  margin-top: 4px;
}
.sub-title {
  font-weight: bold;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--muted);
}
.trait {
  border: 1px solid #c9d6ec;
  background: #f5f8fd;
  border-radius: var(--radius);
  padding: 4px 6px;
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.t-head {
  display: flex;
  align-items: center;
  gap: 5px;
}
.t-icon {
  font-size: 9px;
  color: var(--info);
}
.t-desc {
  font-size: 11px;
  line-height: 1.35;
}
.t-mods {
  display: flex;
  flex-wrap: wrap;
  gap: 3px;
}

/* Scars: amber by default (double-edged / hard-won), red when they only hurt. A stitched seam
   runs down the left edge. */
.trait.scar {
  --scar: var(--warn);
  flex-direction: row;
  gap: 7px;
  border-color: #f0d6a8;
  background: #fdf7ec;
  padding-left: 4px;
}
.trait.scar.bad {
  --scar: var(--bad);
  border-color: #efc5c1;
  background: #fdf1f0;
}
.trait.scar b {
  color: var(--scar);
}
.t-body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.stitch {
  flex: none;
  width: 9px;
  align-self: stretch;
  background:
    linear-gradient(var(--scar), var(--scar)) center / 1.5px 100% no-repeat,
    repeating-linear-gradient(to bottom, transparent 0 2px, var(--scar) 2px 3.5px, transparent 3.5px 6px) center / 9px 100% no-repeat;
  opacity: 0.8;
}
</style>
