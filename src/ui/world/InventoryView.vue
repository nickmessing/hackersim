<script setup lang="ts">
/** e-Shop → My Account: your rig slot by slot, spare parts, and everything else you own. */
import { computed } from 'vue'
import { C, HW_SLOTS, money } from '@/engine'
import type { HardwareSlot, ItemCategory, ItemDef } from '@/engine'
import { useGame } from '@/ui/game'
import ProductArt from './ProductArt.vue'
import { describeMods } from './modText'
import { CATEGORY_LABELS, SLOT_LABELS, categoryRank, isHardware, shelfSort } from './shopData'

const state = useGame()

const owned = computed(() =>
  state.items.map(id => C.items.get(id)).filter((d): d is ItemDef => d !== undefined),
)

const rig = computed(() =>
  HW_SLOTS.map((slot: HardwareSlot) => {
    const id = state.equipped[slot]
    return { slot, def: id ? C.items.get(id) : undefined }
  }),
)

const spares = computed(() =>
  owned.value
    .filter((d): d is ItemDef & { category: HardwareSlot } => isHardware(d) && state.equipped[d.category] !== d.id)
    .sort(shelfSort),
)

const groups = computed(() => {
  const map = new Map<ItemCategory, ItemDef[]>()
  for (const d of owned.value) {
    if (isHardware(d)) continue
    const list = map.get(d.category) ?? []
    list.push(d)
    map.set(d.category, list)
  }
  return [...map.entries()]
    .sort((a, b) => categoryRank(a[0]) - categoryRank(b[0]))
    .map(([cat, items]) => ({ cat, label: CATEGORY_LABELS[cat], items: items.sort(shelfSort) }))
})

/** Gear upkeep as the daily bill sees it: hardware only while installed. */
const upkeep = computed(() =>
  owned.value.reduce((sum, d) => {
    if (!d.upkeepPerDay) return sum
    if (isHardware(d) && state.equipped[d.category] !== d.id) return sum
    return sum + d.upkeepPerDay
  }, 0),
)

function modsOf(d: ItemDef): string {
  const lines = describeMods(d.mods)
  if (lines.length) return lines.map(l => l.text).join(' · ')
  return isHardware(d) ? 'Baseline part — no bonuses.' : 'No measurable effect. Looks nice, though.'
}
</script>

<template>
  <div class="inv scroll">
    <section class="group">
      <div class="group-title">Your rig</div>
      <table class="table rig">
        <tbody>
          <tr v-for="r in rig" :key="r.slot">
            <th scope="row">{{ SLOT_LABELS[r.slot] }}</th>
            <td v-if="r.def" class="rig-item">
              <ProductArt :id="r.def.id" :name="r.def.name" :category="r.def.category" :tier="r.def.tier ?? 0" compact />
              <div class="grow">
                <div class="row">
                  <b>{{ r.def.name }}</b>
                  <span v-if="r.def.tier !== undefined" class="pill">Tier {{ r.def.tier }}</span>
                  <span class="pill good">Installed</span>
                </div>
                <div class="muted small">{{ modsOf(r.def) }}</div>
                <div v-if="r.def.upkeepPerDay" class="warn small">Upkeep {{ money(r.def.upkeepPerDay) }}/day</div>
              </div>
            </td>
            <td v-else class="muted empty-slot">— empty slot —</td>
          </tr>
        </tbody>
      </table>
    </section>

    <section v-if="spares.length" class="group">
      <div class="group-title">Spare parts (in the closet)</div>
      <ul class="plain">
        <li v-for="d in spares" :key="d.id">
          <b>{{ d.name }}</b>
          <span class="muted"> — {{ SLOT_LABELS[d.category] }}, Tier {{ d.tier ?? 0 }}</span>
        </li>
      </ul>
      <p class="muted small">Spare parts do nothing and cost nothing. Your mom calls it "the junk drawer."</p>
    </section>

    <section class="group">
      <div class="group-title">Everything else</div>
      <p v-if="groups.length === 0" class="muted">
        Nothing but the computer and a poster you've had since you were fourteen.
      </p>
      <div v-for="g in groups" :key="g.cat" class="cat">
        <h4>{{ g.label }}</h4>
        <ul class="plain">
          <li v-for="d in g.items" :key="d.id" class="owned-item">
            <div class="row">
              <b>{{ d.name }}</b>
              <span v-if="d.hidden" class="pill info" title="Not seized in police raids.">Easy to hide</span>
              <span v-if="d.unique" class="pill story">One of a kind</span>
              <span v-if="d.upkeepPerDay" class="warn small">{{ money(d.upkeepPerDay) }}/day</span>
            </div>
            <div class="muted small">{{ modsOf(d) }}</div>
          </li>
        </ul>
      </div>
    </section>

    <div class="total row">
      <span class="grow muted">{{ owned.length }} items owned</span>
      <span>Gear upkeep: <b :class="upkeep > 0 ? 'warn' : 'good'">{{ money(upkeep) }}/day</b></span>
    </div>
  </div>
</template>

<style scoped>
.inv {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.inv > .group {
  flex: none;
}
.small {
  font-size: 11px;
}
.rig th {
  width: 86px;
  color: var(--muted);
  font-weight: normal;
  vertical-align: middle;
}
.rig-item {
  display: flex;
  gap: 8px;
  align-items: center;
}
.empty-slot {
  font-style: italic;
  height: 40px;
}
.plain {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.cat + .cat {
  margin-top: 8px;
}
.cat h4 {
  margin-bottom: 4px;
  color: var(--muted);
  text-transform: uppercase;
  font-size: 10px;
  letter-spacing: 1px;
}
.owned-item {
  padding: 3px 6px;
  background: var(--panel-bg);
  border: 1px solid var(--panel-border);
}
.total {
  flex: none;
  padding: 4px 6px;
  border-top: 1px solid var(--panel-border);
}
</style>
