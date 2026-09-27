<script setup lang="ts">
/** One product on an e-Shop shelf: art, specs in plain English, price, ownership and the Buy button. */
import { computed } from 'vue'
import { C, canBuy, describeCond, evalCond, itemPrice, money, renderLine } from '@/engine'
import type { ItemDef } from '@/engine'
import { useGame } from '@/ui/game'
import ProductArt from './ProductArt.vue'
import { describeMods } from './modText'
import { SLOT_LABELS, isHardware } from './shopData'
import { hashStr, num1 } from './util'

const props = withDefaults(defineProps<{ def: ItemDef; shady?: boolean; busy?: boolean }>(), {
  shady: false,
  busy: false,
})
const emit = defineEmits<{ buy: [id: string] }>()

const state = useGame()

const price = computed(() => itemPrice(state, props.def))
/** Only a real markdown (10%+) earns the blinking ribbon. */
const onSale = computed(() => price.value <= props.def.price * 0.9)
const pricier = computed(() => price.value > props.def.price)
const owned = computed(() => state.items.includes(props.def.id))
const hw = computed(() => isHardware(props.def))
const installed = computed(() => {
  const d = props.def
  return isHardware(d) && state.equipped[d.category] === d.id
})
/** The part currently in this item's slot, if it is a hardware item. */
const slotItem = computed(() => {
  const d = props.def
  if (!isHardware(d)) return undefined
  const cur = state.equipped[d.category]
  const curDef = cur ? C.items.get(cur) : undefined
  return curDef ? { def: curDef, tier: curDef.tier ?? 0, slot: SLOT_LABELS[d.category] } : undefined
})
/** Buying a lower-tier part doesn't replace the installed one (engine auto-equip rule). */
const wontInstall = computed(() => hw.value && !owned.value && slotItem.value !== undefined && (props.def.tier ?? 0) < slotItem.value.tier)

const locked = computed(() => !evalCond(state, props.def.req))
const lockText = computed(() => props.def.reqText ?? (describeCond(props.def.req) || 'Not available to you yet'))
const check = computed(() => canBuy(state, props.def))
const shortBy = computed(() => Math.max(0, price.value - state.stats.money))
const mods = computed(() => describeMods(props.def.mods))
const desc = computed(() => renderLine(state, props.def.desc))
const stars = computed(() => {
  const n = 3 + (hashStr(`${props.def.id}:stars`) % 3)
  return { n, text: `${'★'.repeat(n)}${'☆'.repeat(5 - n)}` }
})
</script>

<template>
  <div class="card" :class="{ shady, owned, locked }">
    <ProductArt :id="def.id" :name="def.name" :category="def.category" :tier="def.tier ?? 0" :shady="shady" />
    <span v-if="onSale && !owned" class="ribbon sale">{{ shady ? 'HOT' : 'SALE!' }}</span>
    <span v-else-if="installed" class="ribbon inst">Installed</span>
    <span v-else-if="owned" class="ribbon own">Owned</span>

    <div class="body">
      <div class="name" :title="def.name">{{ def.name }}</div>
      <div class="meta">
        <span v-if="def.tier !== undefined" class="tier" :title="hw ? `Hardware generation ${def.tier}` : `Grade ${def.tier}`">
          {{ shady ? `lvl ${def.tier}` : `Tier ${def.tier}` }}
        </span>
        <span v-if="!shady" class="stars" :title="`Customer rating: ${stars.n} out of 5`">{{ stars.text }}</span>
      </div>
      <p class="desc" :title="desc">{{ desc }}</p>
      <ul v-if="mods.length" class="mods">
        <li v-for="(m, i) in mods" :key="i" :class="m.good ? 'good' : 'bad'">
          <span class="arrow">{{ m.good ? '▲' : '▼' }}</span> {{ m.text }}
        </li>
      </ul>
      <div v-if="def.upkeepPerDay" class="upkeep" title="Charged every day while you own it (hardware: while installed).">
        Upkeep: {{ money(def.upkeepPerDay) }}/day
      </div>
      <div v-if="wontInstall && slotItem" class="note warn" :title="`Installed: ${slotItem.def.name} (Tier ${slotItem.tier})`">
        Older than your {{ slotItem.slot }} — won't be installed.
      </div>
      <div v-if="def.hidden" class="note muted" title="Not seized in police raids.">Easy to hide</div>
    </div>

    <div class="foot">
      <div class="price-row">
        <span class="price" :title="price !== def.price ? `List price ${money(def.price)}; market adjusted` : ''">
          {{ money(price) }}<span v-if="!shady" class="cents">.00</span>
        </span>
        <span v-if="onSale" class="was">{{ money(def.price) }}</span>
        <span v-else-if="pricier" class="up" title="Prices have gone up around town">▲ {{ num1((price / def.price - 1) * 100) }}%</span>
      </div>
      <div v-if="owned" class="status good">
        ✓ {{ installed ? 'Installed in your rig' : hw ? 'Owned (spare part)' : 'Owned' }}
      </div>
      <div v-else-if="locked" class="status lock" :title="lockText">🔒 {{ lockText }}</div>
      <template v-else>
        <button
          type="button"
          class="btn primary buy"
          :disabled="!check.ok || busy"
          :title="check.ok ? `Buy for ${money(price)}` : check.reason"
          @click="emit('buy', def.id)"
        >
          {{ shady ? 'Make it happen' : 'Buy Now' }}
        </button>
        <div v-if="!check.ok && shortBy > 0" class="status bad">Need {{ money(shortBy) }} more</div>
      </template>
    </div>
  </div>
</template>

<style scoped>
.card {
  --card-accent: var(--sel-bg);
  position: relative;
  display: flex;
  flex-direction: column;
  background: var(--panel-bg);
  border: 1px solid var(--panel-border);
  border-radius: var(--radius);
  padding: 6px;
  gap: 4px;
  min-width: 0;
  transition: box-shadow 0.15s;
}
.card:hover {
  box-shadow: 0 0 0 2px rgb(49 106 197 / 25%);
}
.card.locked {
  opacity: 0.85;
}
.ribbon {
  position: absolute;
  top: 10px;
  right: 2px;
  font-size: 10px;
  font-weight: bold;
  padding: 1px 6px;
  color: var(--sel-fg);
  border-radius: 2px 0 0 2px;
  box-shadow: 1px 1px 2px rgb(0 0 0 / 30%);
}
.ribbon.sale {
  background: var(--bad);
  animation: blink 1.2s steps(2, start) infinite;
}
.ribbon.inst {
  background: var(--good);
}
.ribbon.own {
  background: var(--info);
}
@keyframes blink {
  to {
    visibility: hidden;
  }
}
@media (prefers-reduced-motion: reduce) {
  .ribbon.sale {
    animation: none;
  }
}
.body {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
  min-height: 0;
}
.name {
  font-weight: bold;
  color: var(--info);
  text-decoration: underline;
  line-height: 1.25;
}
.meta {
  display: flex;
  gap: 6px;
  align-items: center;
  font-size: 10px;
}
.tier {
  background: var(--panel-alt);
  border: 1px solid var(--panel-border);
  padding: 0 4px;
  border-radius: 2px;
}
.stars {
  color: var(--warn);
  letter-spacing: 1px;
}
.desc {
  margin: 2px 0;
  font-size: 11px;
  line-height: 1.35;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.mods {
  list-style: none;
  margin: 0;
  padding: 0;
  font-size: 11px;
  line-height: 1.35;
}
.arrow {
  font-size: 8px;
}
.upkeep {
  font-size: 11px;
  color: var(--warn);
}
.note {
  font-size: 10px;
}
.foot {
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding-top: 4px;
  border-top: 1px dotted var(--panel-border);
}
.price-row {
  display: flex;
  align-items: baseline;
  gap: 6px;
}
.price {
  font-size: 15px;
  font-weight: bold;
  color: var(--bad);
}
.cents {
  font-size: 10px;
  vertical-align: super;
}
.was {
  text-decoration: line-through;
  color: var(--muted);
  font-size: 11px;
}
.up {
  font-size: 10px;
  color: var(--warn);
}
.buy {
  width: 100%;
}
.status {
  font-size: 11px;
  font-weight: bold;
}
.status.lock {
  color: var(--muted);
  font-weight: normal;
}

/* Back-alley skin */
.card.shady {
  --shady-fg: #39ff6a;
  --shady-dim: #1f9c44;
  --shady-hot: #ff3fd0;
  background: #070d07;
  border: 1px dashed var(--shady-dim);
  border-radius: 0;
  color: var(--shady-fg);
  font-family: var(--font-mono);
}
.card.shady:hover {
  box-shadow: 0 0 8px rgb(57 255 106 / 35%);
}
.shady .name {
  color: var(--shady-hot);
  text-decoration: none;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.shady .tier {
  background: transparent;
  border-color: var(--shady-dim);
}
.shady .stars {
  color: var(--shady-dim);
}
.shady .mods .good {
  color: var(--shady-fg);
}
.shady .mods .bad {
  color: var(--shady-hot);
}
.shady .foot {
  border-top-color: var(--shady-dim);
}
.shady .price {
  color: var(--shady-fg);
}
.shady .upkeep,
.shady .note,
.shady .status.lock {
  color: var(--shady-dim);
}
.shady .buy {
  background: #0c1f0f;
  color: var(--shady-fg);
  border: 1px solid var(--shady-fg);
  border-radius: 0;
  font-family: var(--font-mono);
  text-transform: uppercase;
}
.shady .buy:hover:not(:disabled) {
  background: #133d1b;
  box-shadow: 0 0 6px rgb(57 255 106 / 50%);
}
.shady .buy:disabled {
  color: var(--shady-dim);
  border-color: var(--shady-dim);
}
.shady .ribbon.sale {
  background: var(--shady-hot);
}
</style>
