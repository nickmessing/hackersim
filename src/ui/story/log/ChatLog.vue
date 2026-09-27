<script setup lang="ts">
/** BuddyPager conversation: IM bubbles with handles and timestamps. */
import { computed } from 'vue'
import { formatDate, type SceneDef, type ThreadState } from '@/engine'
import Avatar from '@/ui/components/Avatar.vue'
import { hashStr, missionLine, rollLine, type DisplayEntry, type Speaker } from '../storyKit'

const props = defineProps<{
  entries: DisplayEntry[]
  thread: ThreadState
  scene: SceneDef
  showMath: boolean
  player: Speaker
}>()

interface ChatLine {
  key: string
  who: 'them' | 'me' | 'sys'
  speaker: Speaker
  text: string
  tag: string | undefined
  tone: '' | 'good' | 'bad'
  stamp: string
  /** First line of a run from the same speaker (shows the handle + avatar). */
  first: boolean
  latest: boolean
}

function clock(totalMin: number): string {
  const m = ((totalMin % 1440) + 1440) % 1440
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
}

const lines = computed<ChatLine[]>(() => {
  const out: ChatLine[] = []
  // Chat logs carry per-line clocks; the thread only knows when it arrived, so lines tick forward
  // a minute or two each from there (deterministically, so the log never reshuffles).
  let minute = props.thread.receivedHour * 60 + (hashStr(`chat:${props.thread.uid}`) % 20)
  const push = (line: Omit<ChatLine, 'stamp' | 'first'>): void => {
    const prev = out[out.length - 1]
    if (prev) minute += line.who === 'sys' ? 0 : 1 + (hashStr(line.key) % 2)
    const sameRun = prev?.who === line.who && prev.speaker.id === line.speaker.id
    out.push({ ...line, stamp: clock(minute), first: !sameRun })
  }
  for (const e of props.entries) {
    const who = e.speaker.kind === 'narrator' ? 'sys' : e.speaker.kind === 'player' ? 'me' : 'them'
    e.paragraphs.forEach((p, i) => {
      push({ key: `${e.key}:${i}`, who, speaker: e.speaker, text: p, tag: undefined, tone: '', latest: e.latest && !e.reply && i === 0 })
    })
    if (e.reply) push({ key: `${e.key}:r`, who: 'me', speaker: props.player, text: e.reply.text, tag: e.reply.tag, tone: '', latest: e.latest })
    if (e.roll && !e.rollPending) {
      push({ key: `${e.key}:roll`, who: 'sys', speaker: e.speaker, text: rollLine(e.roll, props.showMath), tag: undefined, tone: e.roll.success ? 'good' : 'bad', latest: false })
    }
    if (e.mission) push({ key: `${e.key}:m`, who: 'sys', speaker: e.speaker, text: missionLine(e.mission), tag: undefined, tone: '', latest: false })
  }
  return out
})
</script>

<template>
  <div class="chat-log">
    <div class="chat-divider">
      <span>{{ scene.title }} · {{ formatDate(thread.receivedDay) }}</span>
    </div>
    <div
      v-for="l in lines"
      :key="l.key"
      class="line"
      :class="[l.who, { first: l.first }]"
      :data-latest="l.latest ? 'true' : undefined"
    >
      <template v-if="l.who === 'sys'">
        <div class="sys-text" :class="l.tone">*** {{ l.text }} ***</div>
      </template>
      <template v-else>
        <div class="av">
          <template v-if="l.first && l.who === 'them'">
            <Avatar v-if="l.speaker.kind === 'npc'" :npc="l.speaker.id" :size="24" />
            <Avatar v-else :text="l.speaker.avatar" :color="l.speaker.color" :size="24" />
          </template>
        </div>
        <div class="bubble">
          <div v-if="l.first" class="meta">
            <b class="nick">{{ l.speaker.handle }}</b>
          </div>
          <div class="text">
            <b v-if="l.tag" class="tag">{{ `${l.tag} ` }}</b>{{ l.text }}<span class="stamp" :title="`Sent ${l.stamp}`">{{ l.stamp }}</span>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
.chat-log {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.chat-divider {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 6px 0 4px;
  color: var(--muted);
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.chat-divider::before,
.chat-divider::after {
  content: '';
  flex: 1;
  border-top: 1px dotted var(--panel-border);
}
.line {
  display: flex;
  align-items: flex-end;
  gap: 5px;
}
.line.first {
  margin-top: 5px;
}
.line.me {
  flex-direction: row-reverse;
}
.av {
  flex: none;
  width: 24px;
}
.me .av {
  display: none;
}
.bubble {
  max-width: 78%;
  padding: 3px 8px 4px;
  border: 1px solid var(--panel-border);
  border-radius: 9px 9px 9px 2px;
  background: var(--panel-bg);
  box-shadow: 0 1px 0 rgb(0 0 0 / 8%);
}
.me .bubble {
  border-radius: 9px 9px 2px 9px;
  background: color-mix(in srgb, var(--sel-bg) 14%, var(--panel-bg));
  border-color: color-mix(in srgb, var(--sel-bg) 40%, var(--panel-bg));
}
.meta {
  font-size: 11px;
  line-height: 1.2;
}
.them .nick {
  color: var(--bad);
}
.me .nick {
  color: var(--info);
}
.text {
  white-space: pre-wrap;
  line-height: 1.4;
  word-wrap: break-word;
}
.stamp {
  float: right;
  margin: 3px 0 0 8px;
  font-size: 9px;
  color: var(--muted);
}
.tag {
  color: var(--story);
}
.line.sys {
  justify-content: center;
  margin: 4px 0;
}
.sys-text {
  font-size: 11px;
  font-style: italic;
  color: var(--muted);
  text-align: center;
  white-space: pre-wrap;
}
.sys-text.good {
  color: var(--good);
  font-style: normal;
}
.sys-text.bad {
  color: var(--bad);
  font-style: normal;
}
</style>
