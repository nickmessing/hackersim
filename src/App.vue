<script setup lang="ts">
import { computed } from 'vue'
import { hasGame, useGame } from '@/ui/game'
import Desktop from '@/ui/shell/Desktop.vue'
import MessageBox from '@/ui/shell/MessageBox.vue'
import { nav, stateKey } from '@/ui/shell/nav'
import NewGameWizard from '@/ui/shell/NewGameWizard.vue'
import TitleScreen from '@/ui/shell/TitleScreen.vue'

/** A new identity per loaded state remounts the desktop so every program reads the new game. */
const gameKey = computed(() => (hasGame() ? stateKey(useGame()) : 0))
</script>

<template>
  <Desktop v-if="gameKey" :key="gameKey" />
  <NewGameWizard v-else-if="nav.screen === 'wizard'" />
  <TitleScreen v-else />
  <MessageBox />
</template>
