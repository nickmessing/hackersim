<script setup lang="ts">
/** One phpBB-style post: author column (handle, rank, avatar, post count), body and sig. */
import { computed } from 'vue'
import Avatar from '@/ui/components/Avatar.vue'
import { useGame } from '@/ui/game'
import { postCountOf, rankOf, sigOf } from './bbs'
import type { Speaker } from './storyKit'

const props = withDefaults(
  defineProps<{
    speaker: Speaker
    paragraphs: string[]
    tag?: string
    subject: string
    date: string
    number: number
    alt?: boolean
  }>(),
  { tag: undefined, alt: false },
)

const state = useGame()
const narr = computed(() => props.speaker.kind === 'narrator')
const rank = computed(() => (narr.value ? 'Board notice' : rankOf(state, props.speaker)))
const posts = computed(() => postCountOf(state, props.speaker))
const sig = computed(() => (narr.value ? '' : sigOf(state, props.speaker)))
const sysop = computed(() => rank.value === 'Sysop')
</script>

<template>
  <div class="post-wrap">
    <article class="post" :class="{ alt, narr }">
      <aside class="author">
        <b class="handle" :class="{ sysop, me: speaker.kind === 'player' }">{{ narr ? '[ SYSTEM ]' : speaker.handle }}</b>
        <div class="rank">{{ rank }}</div>
        <template v-if="!narr">
          <Avatar v-if="speaker.kind === 'npc'" :npc="speaker.id" :size="40" class="av" />
          <Avatar v-else :text="speaker.avatar" :color="speaker.color" :size="40" class="av" />
          <div class="stats">Posts: {{ posts }}</div>
        </template>
      </aside>
      <div class="main">
        <div class="meta">
          <span>📄 Posted: {{ date }}</span>
          <span class="subj">Post subject: {{ subject }}</span>
          <span class="num">#{{ number }}</span>
        </div>
        <div class="body">
          <p v-for="(p, i) in paragraphs" :key="i"><b v-if="tag && i === 0" class="tag">{{ `${tag} ` }}</b>{{ p }}</p>
        </div>
        <slot />
        <div v-if="sig" class="sig">{{ sig }}</div>
      </div>
    </article>
  </div>
</template>

<style scoped>
.post-wrap {
  container-type: inline-size;
}
.post {
  display: flex;
  background: var(--panel-bg);
  border-bottom: 1px solid var(--panel-border);
}
.post.alt {
  background: color-mix(in srgb, var(--info) 5%, var(--panel-bg));
}
.author {
  flex: none;
  width: 130px;
  padding: 6px 8px;
  border-right: 1px solid color-mix(in srgb, var(--panel-border) 60%, var(--panel-bg));
  display: flex;
  flex-direction: column;
  gap: 3px;
  align-items: flex-start;
  font-size: 11px;
}
.handle {
  font-size: 12px;
  color: var(--info);
  word-break: break-all;
}
.handle.sysop {
  color: var(--bad);
}
.handle.me {
  color: var(--good);
}
.rank {
  color: var(--muted);
}
.av {
  margin: 2px 0;
}
.stats {
  color: var(--muted);
}
.main {
  flex: 1;
  min-width: 0;
  padding: 6px 10px 8px;
  display: flex;
  flex-direction: column;
}
.meta {
  display: flex;
  gap: 10px;
  font-size: 10px;
  color: var(--muted);
  border-bottom: 1px solid color-mix(in srgb, var(--panel-border) 50%, var(--panel-bg));
  padding-bottom: 3px;
  margin-bottom: 6px;
}
.subj {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.num {
  font-family: var(--font-mono);
}
.body p {
  white-space: pre-wrap;
  line-height: 1.5;
  margin: 0 0 6px;
}
.tag {
  color: var(--story);
}
.narr .body {
  font-style: italic;
  color: var(--muted);
}
.narr .handle {
  color: var(--warn);
}
.sig {
  margin-top: 8px;
  font-size: 10px;
  color: var(--muted);
}
.sig::before {
  content: '';
  display: block;
  width: 140px;
  margin-bottom: 3px;
  border-top: 1px solid color-mix(in srgb, var(--muted) 60%, transparent);
}
@container (max-width: 440px) {
  .post {
    flex-direction: column;
  }
  .author {
    width: auto;
    flex-direction: row;
    align-items: center;
    flex-wrap: wrap;
    gap: 6px;
    border-right: none;
    border-bottom: 1px dotted var(--panel-border);
  }
  .av {
    order: -1;
    margin: 0;
  }
}
</style>
