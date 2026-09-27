<script setup lang="ts">
/** One skill: level, XP progress, D&D check modifier, active boosters, study-focus button. */
import { computed } from 'vue'
import { balance, checkMod, skillProgress, type SkillId } from '@/engine'
import { useGame } from '@/ui/game'
import ProgressBar from '@/ui/components/ProgressBar.vue'
import { dndMod, modIsGood, modText, skillLabel, SKILL_META } from '../labels'
import { boostersFor, studyRate } from './study'

const props = defineProps<{ skill: SkillId; trained: string[] }>()
const state = useGame()

const s = computed(() => state.skills[props.skill])
const maxed = computed(() => s.value.level >= balance.SKILL_MAX)
const progress = computed(() => skillProgress(state, props.skill))
const need = computed(() => balance.xpToNext(s.value.level))
const mod = computed(() => checkMod(state, props.skill))
const baseMod = computed(() => balance.skillMod(s.value.level))
const boosts = computed(() => boostersFor(state, props.skill))
const rate = computed(() => studyRate(state, props.skill))
const focused = computed(() => state.focus.study.kind === 'skill' && state.focus.study.skill === props.skill)
const modTitle = computed(() => {
  const extra = mod.value - baseMod.value
  return `Skill checks roll d20 ${dndMod(mod.value)}: level ${s.value.level} ÷ 4 = ${dndMod(baseMod.value)}${extra ? `, gear & perks ${dndMod(extra)}` : ''}`
})

function focus(): void {
  state.focus.study = { kind: 'skill', skill: props.skill }
}
</script>

<template>
  <div class="sk" :class="{ focused }">
    <div class="sk-icon" aria-hidden="true">{{ SKILL_META[skill].glyph }}</div>
    <div class="sk-main">
      <div class="sk-top">
        <span class="sk-name">{{ skillLabel(skill) }}</span>
        <span class="sk-lvl">Lv <b>{{ s.level }}</b></span>
        <span class="grow"></span>
        <span class="sk-mod" :title="modTitle" :aria-label="modTitle">{{ dndMod(mod) }}</span>
      </div>
      <ProgressBar
        :value="progress"
        :height="12"
        color="var(--skill)"
        :label="maxed ? 'MASTERED' : `${Math.floor(s.xp)} / ${need} XP`"
      />
      <div class="sk-blurb muted" :title="SKILL_META[skill].blurb">{{ SKILL_META[skill].blurb }}</div>
      <div class="sk-bottom">
        <span v-for="(b, i) in boosts.xp" :key="`x${i}`" class="pill" :class="modIsGood(b.mod) ? 'good' : 'bad'" :title="`From ${b.source}`">{{ modText(b.mod) }}</span>
        <span v-for="(b, i) in boosts.check" :key="`c${i}`" class="pill info" :title="`From ${b.source}`">{{ modText(b.mod) }}</span>
        <span v-if="trained.length" class="muted tr">Also: {{ trained.join(', ') }}</span>
        <span class="grow"></span>
        <span v-if="focused" class="focus-tag" :title="rate.why">★ Studying · {{ rate.rate.toFixed(1) }} XP/h</span>
        <button v-else type="button" class="btn small" :disabled="maxed" :title="rate.why" @click="focus">Study this</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.sk {
  display: flex;
  gap: 8px;
  padding: 6px 8px;
  background: var(--panel-bg);
  border: 1px solid var(--panel-border);
  border-radius: var(--radius);
  min-width: 0;
}
.sk.focused {
  border-color: var(--sel-bg);
  background: linear-gradient(#fff, #eaf1fc);
  box-shadow: inset 3px 0 0 var(--sel-bg);
}
.sk-icon {
  width: 30px;
  height: 30px;
  flex: none;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 17px;
  background: linear-gradient(#fdfdfb, #e9e7dc);
  border: 1px solid #c9c7b8;
  border-radius: 4px;
}
.sk-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.sk-top {
  display: flex;
  align-items: baseline;
  gap: 6px;
}
.sk-name {
  font-weight: bold;
  font-size: 12px;
}
.sk-lvl {
  color: var(--skill);
}
.sk-lvl b {
  font-size: 14px;
}
.sk-mod {
  min-width: 30px;
  text-align: center;
  font: bold 12px var(--font-mono);
  color: #fff;
  background: linear-gradient(#4f78c4, var(--win-title-a));
  border: 1px solid var(--win-title-a);
  padding: 1px 4px;
  border-radius: 3px 3px 8px 8px;
  cursor: help;
  text-shadow: 0 1px 0 rgb(0 0 0 / 40%);
}
.sk-blurb {
  font-size: 10px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.sk-bottom {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 3px 4px;
  min-height: 19px;
}
.tr {
  font-size: 10px;
}
.focus-tag {
  font-size: 11px;
  font-weight: bold;
  color: var(--sel-bg);
  cursor: help;
}
</style>
