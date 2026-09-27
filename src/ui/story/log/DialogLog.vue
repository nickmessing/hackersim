<script setup lang="ts">
/** CRPG conversation transcript: SPEAKER: line, narration in italics, your replies, roll results. */
import { missionLine, rollLine, type DisplayEntry } from '../storyKit'

defineProps<{
  entries: DisplayEntry[]
  showMath: boolean
  /** The latest entry is still being typed out. */
  typing: boolean
}>()

function nameColor(e: DisplayEntry): string {
  return `color-mix(in srgb, ${e.speaker.color} 45%, var(--dlg-fg, var(--win-title-fg)))`
}
</script>

<template>
  <div class="dlg-log">
    <template v-for="e in entries" :key="e.key">
      <div class="line" :class="[e.speaker.kind, { past: !e.latest || !!e.reply }]" :data-latest="e.latest && !e.reply ? 'true' : undefined">
        <div v-if="e.speaker.kind === 'npc' || e.speaker.kind === 'label'" class="who" :style="{ color: nameColor(e) }">
          {{ e.speaker.name }}
        </div>
        <div v-else-if="e.speaker.kind === 'player'" class="who you">You</div>
        <p v-for="(p, i) in e.paragraphs" :key="i">
          {{ p }}<span v-if="typing && e.latest && i === e.paragraphs.length - 1" class="caret">▌</span>
        </p>
      </div>
      <div v-if="e.reply" class="line reply" :class="{ past: !e.latest }" :data-latest="e.latest ? 'true' : undefined">
        <span class="who you">You:</span><span v-if="e.reply.tag" class="tag">{{ e.reply.tag }}</span>{{ e.reply.text }}
      </div>
      <div v-if="e.roll && !e.rollPending" class="roll mono" :class="e.roll.success ? 'ok' : 'ko'">{{ rollLine(e.roll, showMath) }}</div>
      <div v-if="e.mission" class="roll mono">{{ missionLine(e.mission) }}</div>
    </template>
  </div>
</template>

<style scoped>
.dlg-log {
  display: flex;
  flex-direction: column;
  gap: 10px;
  font-size: 13px;
  line-height: 1.55;
}
.line p {
  margin: 0 0 6px;
  white-space: pre-wrap;
}
.line p:last-child {
  margin-bottom: 0;
}
.line.past {
  opacity: 0.62;
}
.who {
  font-weight: bold;
  font-size: 11px;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  margin-bottom: 1px;
}
.who.you {
  color: var(--dlg-you, var(--info));
}
.line.narrator {
  font-style: italic;
  color: var(--dlg-narr, var(--muted));
}
.line.reply {
  color: var(--dlg-you, var(--info));
  padding-left: 10px;
  border-left: 2px solid var(--dlg-you, var(--info));
}
.line.reply .who {
  display: inline;
  margin-right: 6px;
}
.tag {
  font-weight: bold;
  color: var(--dlg-tag, var(--story));
  margin-right: 5px;
}
.roll {
  align-self: flex-start;
  font-size: 11px;
  padding: 2px 8px;
  border: 1px solid var(--dlg-dim, var(--panel-border));
  border-radius: 2px;
  color: var(--dlg-dim, var(--muted));
}
.roll.ok {
  color: var(--dlg-good, var(--good));
  border-color: currentcolor;
}
.roll.ko {
  color: var(--dlg-bad, var(--bad));
  border-color: currentcolor;
}
.caret {
  animation: blink 0.8s steps(2) infinite;
  margin-left: 1px;
}
@keyframes blink {
  to {
    visibility: hidden;
  }
}
</style>
