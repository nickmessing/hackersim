<script setup lang="ts">
import { computed } from 'vue'
import { balance, formatDate, money } from '@/engine'
import { useGame } from '@/ui/game'

const state = useGame()

function daysText(n: number): string {
  if (n <= 0) return 'tonight'
  return n === 1 ? 'in 1 day' : `in ${n} days`
}

const banner = computed(() => {
  if (state.hospital) {
    const left = state.hospital.untilDay - state.time.day
    return {
      cls: 'hospital',
      icon: '✚',
      head: 'HOSPITALIZED — Port Lumen General, Ward 3',
      text: `You collapsed and the doctors won't let you near a keyboard. Discharge ${daysText(left)} (${formatDate(state.hospital.untilDay)}). Bed rest restores energy and health; the bill runs ${money(balance.HOSPITAL_COST_PER_DAY)} a day. Your schedule resumes when you're out.`,
    }
  }
  if (state.jail) {
    const left = state.jail.untilDay - state.time.day
    return {
      cls: 'jail',
      icon: '🔒',
      head: 'IN CUSTODY — Port Lumen Central Holding',
      text: `No computer, no phone, no visitors worth mentioning. Release ${daysText(left)} (${formatDate(state.jail.untilDay)}). Your schedule is suspended and quest deadlines are frozen while you're held. You can speed up time to wait it out.`,
    }
  }
  return null
})
</script>

<template>
  <div v-if="banner" class="banner" :class="banner.cls" role="status">
    <span class="b-icon" aria-hidden="true">{{ banner.icon }}</span>
    <div class="b-body">
      <b class="b-head">{{ banner.head }}</b>
      <span class="b-text">{{ banner.text }}</span>
    </div>
  </div>
</template>

<style scoped>
.banner {
  position: relative;
  z-index: 5;
  flex: none;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 14px;
  color: #fff;
  box-shadow: 0 2px 6px rgb(0 0 0 / 40%);
  text-shadow: 1px 1px 1px rgb(0 0 0 / 45%);
}
.banner.jail {
  background:
    repeating-linear-gradient(-45deg, rgb(0 0 0 / 18%) 0 14px, transparent 14px 28px),
    linear-gradient(#7d1a12, #5a0f0a);
  border-bottom: 2px solid #ffcc33;
}
.banner.hospital {
  background:
    repeating-linear-gradient(90deg, rgb(255 255 255 / 6%) 0 2px, transparent 2px 22px),
    linear-gradient(#1f6fae, #134d80);
  border-bottom: 2px solid #ffffff;
}
.b-icon {
  flex: none;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: rgb(255 255 255 / 18%);
  border: 1px solid rgb(255 255 255 / 55%);
  font-family: var(--font-emoji);
  font-size: 16px;
  line-height: 28px;
  text-align: center;
}
.banner.hospital .b-icon {
  background: #fff;
  color: #d0142c;
  font-weight: bold;
  font-family: var(--font-ui);
  font-size: 20px;
  text-shadow: none;
}
.b-body {
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
}
.b-head {
  letter-spacing: 1px;
  font-size: 12px;
}
.b-text {
  font-size: 11px;
  opacity: 0.95;
  line-height: 1.35;
}
</style>
