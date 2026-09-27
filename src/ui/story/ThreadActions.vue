<script setup lang="ts">
/**
 * The "what do you do?" block under a thread: numbered choices (tags, skill checks with odds,
 * locked options with their requirement), Continue, terminal-mission launchers and end states.
 * Pure presentation — ThreadView owns the logic.
 */
import type { ChoiceView } from '@/engine'
import {
  chanceTone,
  checkLabel,
  checkTooltip,
  lockText,
  missionTooltip,
  type MissionView,
  type ThreadVariant,
} from './storyKit'

const props = defineProps<{
  variant: ThreadVariant
  choices: ChoiceView[]
  canContinue: boolean
  mission: MissionView | null
  ended: boolean
  expired: boolean
  /** Show numeric hotkey hints. */
  hotkeys: boolean
}>()
const emit = defineEmits<{
  pick: [view: ChoiceView]
  continue: []
  auto: []
  terminal: []
  done: []
}>()

const HEADS: Record<ThreadVariant, string> = {
  mail: 'Reply with:',
  chat: 'Your reply:',
  forum: 'Post a reply:',
  dialog: '',
}

function tooltip(v: ChoiceView): string {
  if (v.locked) return `Locked — ${lockText(v)}`
  if (v.check) return checkTooltip(v.check)
  return ''
}

function endText(): string {
  switch (props.variant) {
    case 'dialog':
      return '— End of conversation —'
    case 'mail':
      return 'End of thread. Nothing left to reply to.'
    case 'chat':
      return '— end of conversation —'
    case 'forum':
      return 'Topic resolved. Nothing left to add.'
  }
}
</script>

<template>
  <div class="acts" :class="variant">
    <div v-if="expired || ended" class="acts-end" :class="{ expired }">
      <span>{{ expired ? '⌛ You never answered. The moment passed.' : endText() }}</span>
      <button v-if="variant === 'dialog' || variant === 'mail'" type="button" class="btn primary done-btn" @click="emit('done')">
        {{ variant === 'dialog' ? 'Close ▸' : 'Done' }}<span v-if="hotkeys" class="key">Enter</span>
      </button>
    </div>

    <template v-else>
      <div v-if="HEADS[variant] && (choices.length > 0 || canContinue)" class="acts-head">{{ HEADS[variant] }}</div>
      <ol v-if="choices.length > 0 || canContinue" class="choices">
        <li v-for="(v, i) in choices" :key="v.index">
          <button
            type="button"
            class="choice"
            :class="{ locked: v.locked, checked: !!v.check }"
            :disabled="v.locked"
            :title="tooltip(v)"
            @click="emit('pick', v)"
          >
            <span class="c-num">{{ i + 1 }}.</span>
            <span class="c-body">
              <span v-if="v.choice.tag" class="c-tag">{{ v.choice.tag }}</span>
              <span v-if="v.check" class="c-check" :class="chanceTone(v.check.chance)">{{ checkLabel(v.check) }}</span>
              <span class="c-text">{{ v.text }}</span>
              <span v-if="v.locked" class="c-lock">🔒 {{ lockText(v) }}</span>
            </span>
          </button>
        </li>
        <li v-if="canContinue">
          <button type="button" class="choice continue" @click="emit('continue')">
            <span class="c-num">{{ choices.length + 1 }}.</span>
            <span class="c-body"><span class="c-text">Continue ▸</span></span>
            <span v-if="hotkeys" class="key">Enter</span>
          </button>
        </li>
      </ol>

      <div v-if="mission" class="mission">
        <div class="mission-title">⌨ {{ mission.title }}</div>
        <p v-if="mission.briefing" class="mission-brief">{{ mission.briefing }}</p>
        <div class="row wrap">
          <button type="button" class="btn primary" title="Do it by hand in the fictional terminal. Skill and nerve can beat the dice." @click="emit('terminal')">
            ▮ Open Terminal
          </button>
          <button type="button" class="btn" :title="missionTooltip(mission.check)" @click="emit('auto')">
            🎲 Auto-resolve
            <span class="c-check" :class="chanceTone(mission.check.chance)">{{ checkLabel(mission.check) }}</span>
          </button>
        </div>
      </div>

      <div v-if="choices.length === 0 && !canContinue && !mission" class="acts-end muted">…</div>
    </template>
  </div>
</template>

<style scoped>
.acts {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.acts-head {
  font-weight: bold;
  color: var(--info);
  font-size: 11px;
}
.choices {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.choice {
  font: inherit;
  display: flex;
  align-items: flex-start;
  gap: 6px;
  width: 100%;
  text-align: left;
  padding: 4px 8px;
  border: 1px solid var(--panel-border);
  border-radius: var(--radius);
  background: linear-gradient(var(--panel-bg), var(--panel-alt));
  color: var(--win-fg);
  cursor: pointer;
  line-height: 1.4;
}
.choice:hover:not(:disabled) {
  border-color: var(--sel-bg);
  background: color-mix(in srgb, var(--sel-bg) 10%, var(--panel-bg));
}
.choice:focus-visible {
  outline: 2px solid var(--sel-bg);
  outline-offset: 1px;
}
.choice:disabled {
  cursor: not-allowed;
  color: var(--btn-disabled-fg);
  background: var(--panel-alt);
}
.c-num {
  flex: none;
  min-width: 16px;
  font-weight: bold;
  color: var(--info);
}
.c-body {
  flex: 1;
  min-width: 0;
}
.c-tag {
  font-weight: bold;
  color: var(--story);
  margin-right: 4px;
}
.c-check {
  font-weight: bold;
  margin-right: 4px;
  white-space: nowrap;
}
.c-check.good {
  color: var(--good);
}
.c-check.warn {
  color: var(--warn);
}
.c-check.bad {
  color: var(--bad);
}
.locked .c-num,
.locked .c-tag,
.locked .c-check {
  color: var(--btn-disabled-fg);
}
.c-lock {
  display: block;
  font-size: 11px;
  color: var(--bad);
  opacity: 0.8;
}
.continue .c-text {
  font-weight: bold;
}
.key {
  flex: none;
  margin-left: 6px;
  font-size: 10px;
  padding: 0 4px;
  border: 1px solid var(--panel-border);
  border-radius: 2px;
  color: var(--muted);
  background: var(--panel-bg);
}
.acts-end {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 4px;
  color: var(--muted);
  font-style: italic;
}
.acts-end.expired {
  color: var(--warn);
}
.done-btn {
  font-style: normal;
}
.mission {
  border: 1px solid var(--panel-border);
  border-left: 4px solid var(--terminal-dim);
  background: color-mix(in srgb, var(--terminal-fg) 7%, var(--panel-bg));
  padding: 6px 8px;
  border-radius: var(--radius);
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.mission-title {
  font-weight: bold;
  font-family: var(--font-mono);
}
.mission-brief {
  margin: 0;
  font-size: 11px;
  color: var(--muted);
}

/* ── chat: reply chips in a compose tray ─────────────────────────────── */
.chat .choice {
  border-radius: 10px;
  padding: 3px 10px;
}

/* ── forum: phpBB-ish reply buttons ──────────────────────────────────── */
.forum .acts-head {
  background: linear-gradient(var(--win-title-b), var(--win-title-a));
  color: var(--win-title-fg);
  padding: 3px 6px;
  border-radius: var(--radius) var(--radius) 0 0;
}
.forum .choice {
  border-radius: 0;
}

/* ── dialog: CRPG list on a dark panel ───────────────────────────────── */
.dialog .choice {
  border: 1px solid transparent;
  background: transparent;
  color: var(--dlg-fg, var(--win-fg));
  padding: 3px 6px;
}
.dialog .choice:hover:not(:disabled),
.dialog .choice:focus-visible {
  background: var(--dlg-hover, color-mix(in srgb, var(--sel-bg) 15%, transparent));
  border-color: var(--dlg-accent, var(--sel-bg));
}
.dialog .choice:disabled {
  color: var(--dlg-dim, var(--btn-disabled-fg));
  background: transparent;
}
.dialog .c-num {
  color: var(--dlg-accent, var(--info));
}
.dialog .c-tag {
  color: var(--dlg-tag, var(--story));
}
.dialog .c-check.good {
  color: var(--dlg-good, var(--good));
}
.dialog .c-check.warn {
  color: var(--dlg-warn, var(--warn));
}
.dialog .c-check.bad {
  color: var(--dlg-bad, var(--bad));
}
.dialog .locked .c-num,
.dialog .locked .c-tag,
.dialog .locked .c-check {
  color: var(--dlg-dim, var(--btn-disabled-fg));
}
.dialog .c-lock {
  color: var(--dlg-bad, var(--bad));
}
.dialog .key {
  background: transparent;
  color: var(--dlg-dim, var(--muted));
  border-color: var(--dlg-dim, var(--panel-border));
}
.dialog .acts-end {
  color: var(--dlg-dim, var(--muted));
}
.dialog .mission {
  background: rgb(255 255 255 / 5%);
  border-color: var(--dlg-dim, var(--panel-border));
  border-left-color: var(--terminal-fg);
}
.dialog .mission-title {
  color: var(--terminal-fg);
}
.dialog .mission-brief {
  color: var(--dlg-dim, var(--muted));
}
</style>
