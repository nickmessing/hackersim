<script setup lang="ts">
/** Contacts: the people you know and the factions keeping score on you. */
import { computed, ref, watch } from 'vue'
import { useGame } from '@/ui/game'
import PeopleTab from '@/ui/world/PeopleTab.vue'
import FactionsTab from '@/ui/world/FactionsTab.vue'
import { metPeople, revealedFactions } from '@/ui/world/people'

type Tab = 'people' | 'factions'

/** `npc` selects a person (switching to People); `tab` picks 'people' or 'factions'. */
const props = withDefaults(defineProps<{ npc?: string; tab?: Tab }>(), { npc: undefined, tab: undefined })

const state = useGame()
const tab = ref<Tab>(props.tab ?? 'people')
const selected = ref<string | null>(props.npc ?? state.focus.social)

watch(
  () => props.npc,
  id => {
    if (id) {
      selected.value = id
      tab.value = 'people'
    }
  },
)
watch(
  () => props.tab,
  t => {
    if (t) tab.value = t
  },
)

const peopleCount = computed(() => metPeople(state).length)
const factionCount = computed(() => revealedFactions(state).length)

function showPerson(id: string): void {
  selected.value = id
  tab.value = 'people'
}
</script>

<template>
  <div class="app contacts">
    <div class="tabs" role="tablist">
      <button type="button" role="tab" :aria-selected="tab === 'people'" :class="{ active: tab === 'people' }" @click="tab = 'people'">
        👥 People ({{ peopleCount }})
      </button>
      <button type="button" role="tab" :aria-selected="tab === 'factions'" :class="{ active: tab === 'factions' }" @click="tab = 'factions'">
        ⚑ Factions ({{ factionCount }})
      </button>
    </div>
    <PeopleTab v-if="tab === 'people'" :selected-id="selected" @select="selected = $event" />
    <FactionsTab v-else @person="showPerson" />
  </div>
</template>

<style scoped>
.contacts {
  background: var(--win-bg);
}
</style>
