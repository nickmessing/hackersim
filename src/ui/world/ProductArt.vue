<script setup lang="ts">
/** A little "product photo": ASCII art for hardware & gadgets, CSS box/cover art for software & books. */
import { computed } from 'vue'
import type { ItemCategory } from '@/engine'
import { ASCII_ART, MONITOR_CRT, MONITOR_FLAT } from './shopData'
import { hashStr } from './util'

const props = withDefaults(
  defineProps<{
    id: string
    name: string
    category: ItemCategory
    tier?: number
    shady?: boolean
    compact?: boolean
  }>(),
  { tier: 0, shady: false, compact: false },
)

const hue = computed(() => hashStr(props.id) % 360)
const ascii = computed(() => {
  if (props.category === 'monitor') return props.tier >= 3 ? MONITOR_FLAT : MONITOR_CRT
  return ASCII_ART[props.category]
})
/** Short title for box/cover art: the first two meaningful words. */
const coverTitle = computed(() =>
  props.name
    .replace(/[^\p{L}\p{N}\s'&+.-]/gu, '')
    .split(/\s+/)
    .filter(w => w.length > 0)
    .slice(0, 3)
    .join(' '),
)
const initial = computed(() => coverTitle.value.charAt(0).toUpperCase() || '?')
const style = computed(() => ({
  '--art-h': String(hue.value),
}))
</script>

<template>
  <div class="art" :class="{ shady, compact }" :style="style" aria-hidden="true">
    <pre v-if="ascii" class="ascii">{{ ascii }}</pre>
    <div v-else-if="category === 'book'" class="book">
      <div class="spine"></div>
      <div class="cover">
        <div class="book-title">{{ coverTitle }}</div>
        <div class="book-rule"></div>
        <div class="book-foot">2nd Edition</div>
      </div>
    </div>
    <div v-else class="box">
      <div class="box-face">
        <div class="box-logo">{{ initial }}</div>
        <div class="box-title">{{ coverTitle }}</div>
        <div class="box-ribbon">CD-ROM</div>
      </div>
      <div class="box-side"></div>
    </div>
  </div>
</template>

<style scoped>
.art {
  --art-bg: hsl(var(--art-h) 35% 94%);
  --art-ink: hsl(var(--art-h) 45% 28%);
  --art-cover-a: hsl(var(--art-h) 55% 45%);
  --art-cover-b: hsl(var(--art-h) 60% 30%);
  height: 86px;
  display: flex;
  align-items: center;
  justify-content: center;
  background:
    radial-gradient(ellipse at 50% 90%, rgb(0 0 0 / 10%), transparent 60%),
    linear-gradient(var(--panel-bg), var(--art-bg));
  border: 1px solid var(--panel-border);
  overflow: hidden;
}
.art.compact {
  height: 56px;
  width: 72px;
  flex: none;
}
.art.compact .ascii {
  font-size: 7px;
}
.art.compact .book,
.art.compact .box {
  transform: scale(0.62);
}
.art.shady {
  --art-bg: #0b140b;
  --art-ink: #39ff6a;
  --art-cover-a: hsl(var(--art-h) 70% 30%);
  --art-cover-b: #000;
  background:
    repeating-linear-gradient(0deg, rgb(57 255 106 / 5%) 0 1px, transparent 1px 3px),
    #050a05;
  border-color: #1e5c2b;
}
.ascii {
  margin: 0;
  font-family: var(--font-mono);
  font-size: 10px;
  line-height: 1.1;
  color: var(--art-ink);
  text-shadow: 0 1px 0 rgb(255 255 255 / 60%);
}
.shady .ascii {
  text-shadow: 0 0 4px rgb(57 255 106 / 60%);
}

/* Book cover */
.book {
  display: flex;
  height: 70px;
  filter: drop-shadow(2px 3px 2px rgb(0 0 0 / 30%));
}
.spine {
  width: 8px;
  background: linear-gradient(90deg, var(--art-cover-b), var(--art-cover-a));
  border-radius: 2px 0 0 2px;
}
.cover {
  width: 52px;
  padding: 5px 4px;
  background: linear-gradient(135deg, var(--art-cover-a), var(--art-cover-b));
  color: #fff;
  display: flex;
  flex-direction: column;
  gap: 3px;
  border-radius: 0 2px 2px 0;
}
.book-title {
  font-family: Georgia, 'Times New Roman', serif;
  overflow-wrap: anywhere;
  font-size: 8px;
  line-height: 1.15;
  font-weight: bold;
  overflow: hidden;
  max-height: 38px;
}
.book-rule {
  height: 1px;
  background: rgb(255 255 255 / 60%);
}
.book-foot {
  margin-top: auto;
  font-size: 6px;
  opacity: 0.8;
}

/* Software box */
.box {
  display: flex;
  height: 70px;
  filter: drop-shadow(2px 3px 2px rgb(0 0 0 / 30%));
}
.box-face {
  position: relative;
  width: 56px;
  background: linear-gradient(160deg, var(--art-cover-a), var(--art-cover-b));
  color: #fff;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 5px 3px;
  gap: 2px;
  border: 1px solid rgb(0 0 0 / 35%);
  overflow: hidden;
}
.box-logo {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: radial-gradient(circle at 35% 35%, #fff, rgb(255 255 255 / 30%) 60%, transparent 62%);
  color: var(--art-cover-b);
  font-weight: bold;
  font-size: 13px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.box-title {
  overflow-wrap: anywhere;
  font-size: 7px;
  line-height: 1.1;
  text-align: center;
  font-weight: bold;
  max-height: 24px;
  overflow: hidden;
}
.box-ribbon {
  position: absolute;
  bottom: 3px;
  left: 0;
  right: 0;
  font-size: 6px;
  text-align: center;
  background: rgb(255 255 255 / 85%);
  color: var(--art-cover-b);
  font-weight: bold;
  letter-spacing: 1px;
}
.box-side {
  width: 8px;
  background: linear-gradient(90deg, var(--art-cover-b), rgb(0 0 0 / 60%));
  transform: skewY(-20deg);
  transform-origin: left top;
  margin-top: 3px;
}
</style>
