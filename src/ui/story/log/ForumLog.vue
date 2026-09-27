<script setup lang="ts">
/** A story thread rendered as phpBB-style posts: author column, post body, sig line. */
import { computed } from 'vue'
import { formatDate, type SceneDef, type ThreadState } from '@/engine'
import { useGame } from '@/ui/game'
import PostCard from '../PostCard.vue'
import { missionLine, rollLine, type DisplayEntry, type Speaker } from '../storyKit'

const props = defineProps<{
  entries: DisplayEntry[]
  thread: ThreadState
  scene: SceneDef
  showMath: boolean
  player: Speaker
}>()

const state = useGame()

interface Post {
  key: string
  speaker: Speaker
  paragraphs: string[]
  tag: string | undefined
  notes: { text: string; tone: '' | 'good' | 'bad' }[]
  latest: boolean
}

const posts = computed<Post[]>(() => {
  const out: Post[] = []
  for (const e of props.entries) {
    const post: Post = { key: e.key, speaker: e.speaker, paragraphs: e.paragraphs, tag: undefined, notes: [], latest: e.latest && !e.reply }
    out.push(post)
    let last = post
    if (e.reply) {
      last = { key: `${e.key}:r`, speaker: props.player, paragraphs: [e.reply.text], tag: e.reply.tag, notes: [], latest: e.latest }
      out.push(last)
    }
    if (e.roll && !e.rollPending) last.notes.push({ text: rollLine(e.roll, props.showMath), tone: e.roll.success ? 'good' : 'bad' })
    if (e.mission) last.notes.push({ text: missionLine(e.mission), tone: '' })
  }
  return out
})

const date = computed(() => formatDate(props.thread.receivedDay))
</script>

<template>
  <div class="forum-log">
    <PostCard
      v-for="(p, i) in posts"
      :key="p.key"
      :speaker="p.speaker"
      :paragraphs="p.paragraphs"
      :tag="p.tag"
      :subject="i === 0 ? scene.title : `Re: ${scene.title}`"
      :date="date"
      :number="i + 1"
      :alt="i % 2 === 1"
      :data-latest="p.latest ? 'true' : undefined"
    >
      <div v-for="(n, j) in p.notes" :key="j" class="note mono" :class="n.tone">{{ n.text }}</div>
    </PostCard>
    <div v-if="posts.length === 0" class="muted">This topic has no posts. {{ state.player.handle }} could be the first.</div>
  </div>
</template>

<style scoped>
.forum-log {
  display: flex;
  flex-direction: column;
  border: 1px solid var(--panel-border);
}
.note {
  margin-top: 6px;
  font-size: 11px;
  padding: 2px 6px;
  border: 1px dashed var(--panel-border);
  background: var(--panel-alt);
  display: inline-block;
}
.note.good {
  color: var(--good);
}
.note.bad {
  color: var(--bad);
}
</style>
