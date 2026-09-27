<script setup lang="ts">
/**
 * e-Shop: a 2001 online superstore (and, for those with the cred, a shady back-alley warez page).
 * Prices, availability and purchases are engine-driven; the checkout animation is cosmetic.
 */
import { computed, ref, watch } from 'vue'
import { C, buyItem, evalCond, itemPrice, money, yearOf } from '@/engine'
import type { ItemCategory, ItemDef, ShopId } from '@/engine'
import { useGame } from '@/ui/game'
import InventoryView from '@/ui/world/InventoryView.vue'
import OrderDialog from '@/ui/world/OrderDialog.vue'
import ShopCard from '@/ui/world/ShopCard.vue'
import { CATEGORY_LABELS, SHOPS, categoryRank, isHardware, shelfSort, type OrderReceipt } from '@/ui/world/shopData'
import { hashStr } from '@/ui/world/util'

type Tab = ShopId | 'account'

/** `shop` (or alias `tab`) opens a department: a ShopId or 'account'. */
const props = withDefaults(defineProps<{ shop?: Tab; tab?: Tab }>(), { shop: undefined, tab: undefined })

const state = useGame()

/** Cred needed before the back alley will even open the door. */
const ALLEY_CRED = 10

const alleyOpen = computed(
  () => state.stats.cred >= ALLEY_CRED || state.items.some(id => C.items.get(id)?.shop === 'blackmarket'),
)
const shops = computed(() => SHOPS.filter(s => s.id !== 'blackmarket' || alleyOpen.value))

const requested = ref<Tab>(props.shop ?? props.tab ?? 'computer')
watch(
  () => props.shop ?? props.tab,
  s => {
    if (s) requested.value = s
  },
)
const view = computed<Tab>(() => (requested.value === 'blackmarket' && !alleyOpen.value ? 'computer' : requested.value))
const shopMeta = computed(() => SHOPS.find(s => s.id === view.value))
const shady = computed(() => view.value === 'blackmarket')

const query = ref('')
const cat = ref<ItemCategory | 'all'>('all')

function selectTab(t: Tab): void {
  requested.value = t
  cat.value = 'all'
}

/** Everything this shop sells right now (availability is engine-evaluated). */
const stock = computed<ItemDef[]>(() => {
  const t = view.value
  if (t === 'account') return []
  const out: ItemDef[] = []
  for (const d of C.items.values()) {
    if (d.shop === t && !d.unique && evalCond(state, d.available)) out.push(d)
  }
  return out.sort(shelfSort)
})

const departments = computed(() => {
  const counts = new Map<ItemCategory, number>()
  for (const d of stock.value) counts.set(d.category, (counts.get(d.category) ?? 0) + 1)
  return [...counts.entries()]
    .sort((a, b) => categoryRank(a[0]) - categoryRank(b[0]))
    .map(([id, n]) => ({ id, n, label: CATEGORY_LABELS[id] }))
})

const shelf = computed(() => {
  const q = query.value.trim().toLowerCase()
  return stock.value.filter(
    d =>
      (cat.value === 'all' || d.category === cat.value) &&
      (q === '' || d.name.toLowerCase().includes(q) || CATEGORY_LABELS[d.category].toLowerCase().includes(q)),
  )
})

const order = ref<OrderReceipt | null>(null)

function buy(id: string): void {
  const def = C.items.get(id)
  if (!def || order.value) return
  const price = itemPrice(state, def)
  const ok = buyItem(state, id)
  const shadyDeal = def.shop === 'blackmarket'
  const n = 100000 + ((hashStr(def.id) + state.time.totalHours * 7919) % 900000)
  order.value = {
    def,
    price,
    ok,
    number: `${shadyDeal ? 'BA' : 'ES'}-${n}`,
    installed: ok && isHardware(def) && state.equipped[def.category] === def.id,
    balance: state.stats.money,
    shady: shadyDeal,
  }
}

const year = computed(() => yearOf(state.time.day))
const visitors = computed(() => String(48213 + state.time.day * 37 + (state.time.hour % 24) * 3).padStart(7, '0'))
</script>

<template>
  <div class="app eshop" :class="{ alley: shady }">
    <header class="banner">
      <template v-if="!shady">
        <div class="logo">
          <span class="e">e</span><span class="dash">-</span><span class="word">Shop</span><span class="tld">.lumen</span>
        </div>
        <div class="slogan">Port Lumen's #1 Online Superstore!</div>
      </template>
      <template v-else>
        <pre class="alley-logo" aria-label="The Back Alley">-=[ T H E   B A C K   A L L E Y ]=-</pre>
        <div class="slogan">you didn't find this page. it found you.</div>
      </template>
      <div class="grow"></div>
      <div class="search">
        <label for="eshop-q">{{ shady ? 'grep:' : 'Search:' }}</label>
        <input id="eshop-q" v-model="query" type="text" :placeholder="shady ? '...' : 'Find a product'" />
      </div>
    </header>

    <nav class="navbar" role="tablist" aria-label="Departments">
      <button
        v-for="s in shops"
        :key="s.id"
        type="button"
        role="tab"
        :aria-selected="view === s.id"
        :class="{ active: view === s.id, alleytab: s.id === 'blackmarket' }"
        @click="selectTab(s.id)"
      >
        {{ s.id === 'blackmarket' ? '☠ ' : '' }}{{ s.label }}
      </button>
      <div class="grow"></div>
      <button type="button" role="tab" :aria-selected="view === 'account'" :class="{ active: view === 'account' }" @click="selectTab('account')">
        👤 My Account
      </button>
    </nav>

    <div class="promo" aria-hidden="true">
      <div class="marquee">
        <span v-if="!shady">
          ★ FREE SHIPPING on orders over $50!* ★ New arrivals every week ★ Secure 128-bit checkout ★ Tell your friends about e-Shop! ★
          <small>*Port Lumen only. Shipping is a guy on a bike.</small>
        </span>
        <span v-else>
          *** cash only *** no refunds *** no cops *** fresh stock when the van comes in *** greetz to the night shift ***
        </span>
      </div>
    </div>

    <div class="site">
      <aside class="sidebar">
        <template v-if="view !== 'account'">
          <div class="box">
            <div class="box-title">{{ shady ? '[ menu ]' : 'Departments' }}</div>
            <button type="button" class="dept" :class="{ on: cat === 'all' }" @click="cat = 'all'">
              {{ shady ? '> ' : '» ' }}All products <span class="count">({{ stock.length }})</span>
            </button>
            <button
              v-for="d in departments"
              :key="d.id"
              type="button"
              class="dept"
              :class="{ on: cat === d.id }"
              @click="cat = d.id"
            >
              {{ shady ? '> ' : '» ' }}{{ d.label }} <span class="count">({{ d.n }})</span>
            </button>
          </div>
        </template>
        <div class="box">
          <div class="box-title">{{ shady ? '[ you ]' : 'Your Account' }}</div>
          <div class="acct">
            <div>{{ shady ? 'cash:' : 'Balance:' }} <b :class="state.stats.money < 0 ? 'bad' : 'money'">{{ money(state.stats.money) }}</b></div>
            <div class="muted">{{ shady ? `handle: ${state.player.handle}` : `Welcome back, ${state.player.name}!` }}</div>
            <button type="button" class="btn small" @click="selectTab('account')">{{ shady ? 'stash' : 'View my stuff' }}</button>
          </div>
        </div>
        <div v-if="!shady" class="box badge">
          <div>🔒 <b>SECURE</b> SHOPPING</div>
          <div class="muted">Customer service:<br />555-0142 (9–5, Mon–Fri)</div>
        </div>
        <div v-else class="box badge">
          <div>no logs. no names.</div>
          <div class="muted">if you're a cop you have to tell us.</div>
        </div>
      </aside>

      <main class="shelf scroll">
        <InventoryView v-if="view === 'account'" />
        <template v-else>
          <div class="shelf-head">
            <h2>{{ shopMeta?.label }}<span v-if="cat !== 'all'"> › {{ CATEGORY_LABELS[cat] }}</span></h2>
            <div class="muted tagline">{{ shopMeta?.tagline }}</div>
          </div>
          <div v-if="shelf.length" class="grid">
            <ShopCard v-for="d in shelf" :key="d.id" :def="d" :shady="shady" :busy="order !== null" @buy="buy" />
          </div>
          <div v-else-if="stock.length === 0" class="empty">
            <template v-if="shady">Nothing on the table tonight. Come back when the van clears the bridge.</template>
            <template v-else>
              <b>Our shelves are being restocked!</b><br />
              The delivery truck is stuck in the fog on the Sound Bridge. Please check back soon.
            </template>
          </div>
          <div v-else class="empty">
            {{ shady ? `nothing matches "${query}". stop typing so loud.` : `No products match "${query}". Try fewer words — we're a shop, not a search engine.` }}
          </div>
        </template>
      </main>
    </div>

    <footer class="foot">
      <span>© {{ year }} {{ shady ? 'nobody. this site does not exist.' : 'e-Shop.lumen Inc. All rights reserved.' }}</span>
      <span class="grow"></span>
      <span v-if="!shady">Best viewed at 800×600 · </span>
      <span>{{ shady ? 'hits' : 'Visitors' }}: <span class="counter">{{ visitors }}</span></span>
    </footer>

    <OrderDialog v-if="order" :order="order" @close="order = null" />
  </div>
</template>

<style scoped>
.eshop {
  --shop-a: #1d4f91;
  --shop-b: #3f7fd0;
  --shop-accent: #ffcc33;
  --shop-bg: #f2f5fa;
  --shop-side: #e3eaf5;
  --alley-bg: #030703;
  --alley-fg: #39ff6a;
  --alley-dim: #1f9c44;
  --alley-hot: #ff3fd0;
  position: relative;
  padding: 0;
  gap: 0;
  background: var(--shop-bg);
}

/* Banner */
.banner {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 6px 10px;
  background: linear-gradient(180deg, var(--shop-b), var(--shop-a));
  color: var(--sel-fg);
  border-bottom: 3px solid var(--shop-accent);
  flex: none;
}
.logo {
  font-family: 'Trebuchet MS', Verdana, sans-serif;
  font-weight: bold;
  font-size: 24px;
  font-style: italic;
  letter-spacing: -1px;
  text-shadow: 2px 2px 0 rgb(0 0 0 / 35%);
  line-height: 1;
}
.logo .e {
  color: var(--shop-accent);
  font-size: 28px;
}
.logo .tld {
  font-size: 12px;
  font-style: normal;
  letter-spacing: 0;
  opacity: 0.85;
}
.slogan {
  font-size: 11px;
  font-style: italic;
  opacity: 0.9;
}
.search {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
}
.search input {
  width: 140px;
}

/* Nav */
.navbar {
  display: flex;
  gap: 1px;
  background: var(--shop-a);
  padding: 0 6px;
  flex: none;
}
.navbar button {
  font: inherit;
  font-size: 11px;
  font-weight: bold;
  color: var(--sel-fg);
  background: transparent;
  border: none;
  padding: 4px 10px;
  cursor: pointer;
}
.navbar button:hover {
  background: rgb(255 255 255 / 15%);
}
.navbar button.active {
  background: var(--shop-bg);
  color: var(--shop-a);
}
.navbar button:focus-visible {
  outline: 1px dotted var(--shop-accent);
  outline-offset: -2px;
}
.navbar button.alleytab {
  color: var(--alley-fg);
  font-family: var(--font-mono);
}

/* Promo marquee */
.promo {
  overflow: hidden;
  white-space: nowrap;
  background: var(--shop-accent);
  color: var(--win-fg);
  font-size: 11px;
  font-weight: bold;
  padding: 2px 0;
  flex: none;
}
.marquee {
  display: inline-block;
  padding-left: 100%;
  animation: marquee 28s linear infinite;
}
.marquee small {
  font-weight: normal;
  margin-left: 12px;
}
@keyframes marquee {
  to {
    transform: translateX(-100%);
  }
}
@media (prefers-reduced-motion: reduce) {
  .marquee {
    animation: none;
    padding-left: 8px;
  }
}

/* Body */
.site {
  flex: 1;
  min-height: 0;
  display: flex;
}
.sidebar {
  width: 158px;
  flex: none;
  background: var(--shop-side);
  border-right: 1px solid var(--panel-border);
  padding: 8px 6px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  overflow: auto;
}
.box {
  background: var(--panel-bg);
  border: 1px solid var(--panel-border);
}
.box-title {
  background: linear-gradient(var(--shop-b), var(--shop-a));
  color: var(--sel-fg);
  font-weight: bold;
  font-size: 11px;
  padding: 2px 6px;
}
.dept {
  display: block;
  width: 100%;
  text-align: left;
  font: inherit;
  font-size: 11px;
  background: none;
  border: none;
  border-bottom: 1px dotted var(--panel-border);
  padding: 3px 6px;
  color: var(--info);
  cursor: pointer;
}
.dept:hover {
  text-decoration: underline;
  background: var(--panel-alt);
}
.dept.on {
  font-weight: bold;
  color: var(--win-fg);
  background: var(--panel-alt);
}
.dept:focus-visible {
  outline: 1px dotted var(--sel-bg);
  outline-offset: -2px;
}
.count {
  color: var(--muted);
  font-weight: normal;
}
.acct {
  padding: 6px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 11px;
}
.badge {
  padding: 6px;
  font-size: 10px;
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.shelf {
  padding: 8px 10px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.shelf-head h2 {
  color: var(--shop-a);
  font-family: 'Trebuchet MS', Verdana, sans-serif;
}
.tagline {
  font-size: 11px;
  font-style: italic;
}
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(168px, 1fr));
  gap: 8px;
}
.empty {
  padding: 24px 12px;
  text-align: center;
  color: var(--muted);
  line-height: 1.6;
  border: 1px dashed var(--panel-border);
  background: var(--panel-bg);
}
.foot {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 10px;
  padding: 3px 10px;
  color: var(--muted);
  border-top: 1px solid var(--panel-border);
  background: var(--shop-side);
  flex: none;
}
.counter {
  font-family: var(--font-mono);
  background: var(--win-fg);
  color: var(--terminal-fg);
  padding: 0 3px;
  letter-spacing: 1px;
}

/* ── The Back Alley skin ──────────────────────────────────────────────── */
.alley {
  background: var(--alley-bg);
  color: var(--alley-fg);
  font-family: var(--font-mono);
}
.alley .banner {
  background: repeating-linear-gradient(0deg, rgb(57 255 106 / 6%) 0 1px, transparent 1px 3px), #000;
  border-bottom: 1px dashed var(--alley-dim);
  color: var(--alley-fg);
}
.alley-logo {
  margin: 0;
  font-size: 13px;
  font-weight: bold;
  color: var(--alley-hot);
  text-shadow: 0 0 6px rgb(255 63 208 / 70%);
}
.alley .slogan {
  color: var(--alley-dim);
}
.alley .search input {
  background: #000;
  color: var(--alley-fg);
  border-color: var(--alley-dim);
  font-family: var(--font-mono);
}
.alley .navbar {
  background: #000;
  border-bottom: 1px solid var(--alley-dim);
}
.alley .navbar button {
  color: var(--alley-dim);
  font-family: var(--font-mono);
}
.alley .navbar button.active {
  background: var(--alley-bg);
  color: var(--alley-fg);
  text-decoration: underline;
}
.alley .promo {
  background: #000;
  color: var(--alley-hot);
  border-bottom: 1px dashed var(--alley-dim);
}
.alley .sidebar {
  background: #000;
  border-right: 1px dashed var(--alley-dim);
}
.alley .box {
  background: transparent;
  border: 1px dashed var(--alley-dim);
}
.alley .box-title {
  background: transparent;
  color: var(--alley-hot);
}
.alley .dept {
  color: var(--alley-fg);
  border-bottom-color: #0d3316;
  font-family: var(--font-mono);
}
.alley .dept.on,
.alley .dept:hover {
  background: #0c1f0f;
  color: var(--alley-fg);
}
.alley .count,
.alley .muted {
  color: var(--alley-dim);
}
.alley .acct .money {
  color: var(--alley-fg);
}
.alley .btn {
  background: #0c1f0f;
  color: var(--alley-fg);
  border-color: var(--alley-dim);
  border-radius: 0;
  font-family: var(--font-mono);
}
.alley .shelf-head h2 {
  color: var(--alley-fg);
  font-family: var(--font-mono);
  text-transform: lowercase;
}
.alley .empty {
  background: transparent;
  border-color: var(--alley-dim);
  color: var(--alley-dim);
}
.alley .foot {
  background: #000;
  border-top: 1px dashed var(--alley-dim);
  color: var(--alley-dim);
}
</style>
