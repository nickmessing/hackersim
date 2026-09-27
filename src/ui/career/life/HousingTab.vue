<script setup lang="ts">
/** Life → Home: housing options (rent, move-in cost, sleep comfort, perks) and moving. */
import { computed, ref } from 'vue'
import { C, modMult, money, moveHousing, type HousingDef } from '@/engine'
import { worldMult } from '@/engine/mods'
import { useGame } from '@/ui/game'
import RichText from '@/ui/components/RichText.vue'
import MsgBox from '../MsgBox.vue'
import ModPills from '../ModPills.vue'
import ReqList from '../ReqList.vue'
import { condMet } from '../reqs'

const state = useGame()

function rentOf(h: HousingDef): number {
  if (h.owned) return 0
  return Math.round(h.rentPerDay * worldMult(state, 'w.rent') * modMult(state, 'expenses'))
}

const options = computed(() =>
  [...C.housing.values()]
    .filter(h => h.id === state.housing || condMet(state, h.available))
    .sort((a, b) => Number(b.id === state.housing) - Number(a.id === state.housing) || rentOf(a) - rentOf(b))
    .map(h => {
      const here = h.id === state.housing
      const reqOk = condMet(state, h.req)
      const afford = state.stats.money >= h.moveCost
      const reason = here ? '' : state.jail ? 'Hard to sign a lease from a cell.' : !reqOk ? 'Requirements not met.' : !afford ? `Need ${money(h.moveCost - state.stats.money)} more for the move.` : ''
      return { h, here, rent: rentOf(h), reqOk, reason }
    }),
)
const current = computed(() => C.housing.get(state.housing))
const confirm = ref<HousingDef | null>(null)
const moved = ref<string>('')

function doMove(h: HousingDef): void {
  confirm.value = null
  if (moveHousing(state, h.id)) moved.value = `You moved into ${h.name}. The boxes can wait until tomorrow.`
}

function comfortText(c: number): string {
  const p = Math.round((c - 1) * 100)
  return p === 0 ? 'Standard sleep' : `Sleep ${p > 0 ? '+' : '−'}${Math.abs(p)}% energy`
}
</script>

<template>
  <div class="housing">
    <div v-if="moved" class="note good" role="status">
      <span class="grow">{{ moved }}</span>
      <button type="button" class="btn small" @click="moved = ''">OK</button>
    </div>
    <p v-if="current" class="muted intro">
      Home is where you sleep: comfort multiplies the energy you get back each night, and a nicer place lifts your mood every day.
    </p>
    <div v-if="options.length === 0" class="muted empty">No listings in the classifieds this week.</div>
    <div v-for="o in options" :key="o.h.id" class="home" :class="{ here: o.here }">
      <div class="h-head">
        <span class="h-icon" aria-hidden="true">{{ o.here ? '🏠' : '🏢' }}</span>
        <b class="h-name">{{ o.h.name }}</b>
        <span v-if="o.here" class="pill good">You live here</span>
        <span class="grow"></span>
        <span class="h-rent" :title="o.h.owned ? 'You own it' : `Base ${money(o.h.rentPerDay)}/day, adjusted for the market and your perks`">
          <template v-if="o.h.owned">Owned · no rent</template>
          <template v-else-if="o.rent === 0">Free</template>
          <template v-else><b>{{ money(o.rent) }}</b>/day</template>
        </span>
      </div>
      <div class="h-desc"><RichText :text="o.h.desc" /></div>
      <div class="h-meta">
        <span class="pill" :class="o.h.comfort > 1 ? 'good' : o.h.comfort < 1 ? 'bad' : ''">{{ comfortText(o.h.comfort) }}</span>
        <ModPills :mods="o.h.mods" :source="o.h.name" />
        <span v-if="!o.here" class="muted">Move-in: {{ o.h.moveCost > 0 ? money(o.h.moveCost) : 'free' }}</span>
      </div>
      <div v-if="!o.here" class="h-foot">
        <ReqList :cond="o.h.req" compact none="Anyone can rent" />
        <span class="grow"></span>
        <span v-if="o.reason" class="bad small">{{ o.reason }}</span>
        <button type="button" class="btn small primary" :disabled="o.reason !== ''" @click="confirm = o.h">Move in…</button>
      </div>
    </div>

    <MsgBox v-if="confirm" title="Move house" icon="question" ok-label="Move" @ok="doMove(confirm)" @cancel="confirm = null">
      <p>Move into <b>{{ confirm.name }}</b>?</p>
      <p>
        Move-in cost: <b class="money">{{ money(confirm.moveCost) }}</b>.
        <template v-if="!confirm.owned">Rent: <b>{{ money(rentOf(confirm)) }}/day</b>, charged every midnight.</template>
      </p>
      <p v-if="current" class="muted">You'll leave {{ current.name }}.</p>
    </MsgBox>
  </div>
</template>

<style scoped>
.housing {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.intro {
  font-size: 11px;
  margin: 0;
}
.note {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 8px;
  border: 1px solid #b9dcb9;
  background: #eaf6ea;
  font-weight: bold;
}
.empty {
  font-style: italic;
}
.home {
  border: 1px solid var(--panel-border);
  background: var(--panel-bg);
  border-radius: var(--radius);
  padding: 6px 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.home.here {
  border-color: var(--good);
  background: linear-gradient(#fff, #f1f9f1);
}
.h-head {
  display: flex;
  align-items: center;
  gap: 6px;
}
.h-icon {
  font-size: 16px;
}
.h-name {
  font-size: 12px;
}
.h-rent {
  cursor: help;
}
.h-desc {
  font-size: 11px;
}
.h-desc :deep(p) {
  margin: 0;
}
.h-meta,
.h-foot {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 3px 6px;
  font-size: 11px;
}
.small {
  font-size: 10px;
}
</style>
