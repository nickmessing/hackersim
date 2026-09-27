<script setup lang="ts">
/** Mail thread body: older messages quoted Outlook-style, the newest one in full. */
import type { SceneDef } from '@/engine'
import { missionLine, rollLine, type DisplayEntry } from '../storyKit'

const props = defineProps<{
  entries: DisplayEntry[]
  scene: SceneDef
  showMath: boolean
}>()

function isSender(e: DisplayEntry): boolean {
  return e.speaker.id === (props.scene.from ?? '')
}

function headOf(e: DisplayEntry): string {
  if (e.speaker.kind === 'narrator') return ''
  if (e.speaker.kind === 'player') return 'You wrote:'
  if (e.latest && !e.reply) return isSender(e) ? '' : `${e.speaker.name} writes:`
  return `${e.speaker.name} wrote:`
}
</script>

<template>
  <div class="mail-log">
    <template v-for="e in entries" :key="e.key">
      <section
        class="msg"
        :class="{ quoted: !e.latest || !!e.reply, narr: e.speaker.kind === 'narrator', mine: e.speaker.kind === 'player' }"
        :data-latest="e.latest && !e.reply ? 'true' : undefined"
      >
        <div v-if="headOf(e)" class="msg-head">{{ headOf(e) }}</div>
        <div class="msg-body">
          <p v-for="(p, i) in e.paragraphs" :key="i">{{ p }}</p>
        </div>
      </section>
      <section v-if="e.reply" class="msg reply" :class="{ quoted: !e.latest }" :data-latest="e.latest ? 'true' : undefined">
        <div class="msg-head">↩ Your reply:</div>
        <div class="msg-body">
          <p><b v-if="e.reply.tag" class="tag">{{ `${e.reply.tag} ` }}</b>{{ e.reply.text }}</p>
        </div>
      </section>
      <div v-if="e.roll && !e.rollPending" class="note roll mono" :class="e.roll.success ? 'good' : 'bad'">{{ rollLine(e.roll, showMath) }}</div>
      <div v-if="e.mission" class="note mono">{{ missionLine(e.mission) }}</div>
    </template>
  </div>
</template>

<style scoped>
.mail-log {
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-family: var(--font-ui);
}
.msg-body p {
  white-space: pre-wrap;
  margin: 0 0 8px;
  line-height: 1.5;
}
.msg-body p:last-child {
  margin-bottom: 0;
}
.msg-head {
  font-size: 11px;
  color: var(--muted);
  margin-bottom: 2px;
}
.msg.quoted {
  border-left: 3px solid color-mix(in srgb, var(--info) 45%, var(--panel-bg));
  padding: 2px 0 2px 10px;
  color: color-mix(in srgb, var(--win-fg) 62%, var(--panel-bg));
}
.msg.quoted .msg-body p {
  margin-bottom: 4px;
}
.msg.reply {
  background: color-mix(in srgb, var(--sel-bg) 8%, var(--panel-bg));
  border: 1px solid color-mix(in srgb, var(--sel-bg) 30%, var(--panel-bg));
  border-radius: var(--radius);
  padding: 4px 8px;
}
.msg.reply.quoted {
  background: transparent;
  border: none;
  border-left: 3px solid color-mix(in srgb, var(--sel-bg) 55%, var(--panel-bg));
  border-radius: 0;
  padding: 2px 0 2px 10px;
}
.msg.reply .msg-head {
  color: var(--info);
  font-weight: bold;
}
.msg.narr .msg-body {
  font-style: italic;
  color: var(--muted);
}
.tag {
  color: var(--story);
}
.note {
  font-size: 11px;
  padding: 2px 8px;
  border: 1px dashed var(--panel-border);
  background: var(--panel-alt);
  align-self: flex-start;
}
</style>
