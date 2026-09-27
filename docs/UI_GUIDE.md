# HackerSim — UI Guide

Vue 3 (`<script setup lang="ts">` SFCs only), no UI libraries, strict TS + strict type-checked ESLint.
The UI is a retro fake desktop (Windows XP "Luna"-ish by default, Win98 "classic" skin optional) set in
2001–2012. Everything must feel like period software: bevels, gradients, Tahoma 12px, tiny icons,
status bars, menu bars, "Loading..." flavor — but readable and polished.

## Architecture (already in place — do not rewrite)

- `src/engine/` — the whole simulation (read `src/engine/index.ts` for the public API and
  `src/engine/types.ts` for the data model). **UI never re-implements game rules**: call engine functions.
- `src/ui/game.ts` — session: `useGame()` returns the reactive `GameState`; `newGame(opts)`,
  `loadSlot(slot)`, `loadFromCode(code)`, `saveNow(slot)`, `quitToTitle()`, `hasGame()`, `session`
  (offline result, running). The rAF loop calls `tick()`; autosaves every 20 s.
- Mutate state only through engine functions, e.g. `setJob(state, id)`, `setSlot(state, h, 'study')`,
  `choose(state, uid, index)`, `acceptContract(state, uid, 'careful')`, `buyItem(state, id)`,
  `setSpeed(state, 2)`. Simple UI-owned fields may be set directly: `state.focus.study`,
  `state.focus.social`, `state.trackedQuest`, `state.settings.*`, `thread`/news/forum `read` flags.
- `src/ui/wm.ts` — window manager: `openApp(id, props?)`, `closeApp`, `focusApp`, `minimizeApp`,
  `toggleMaximize`, `taskbarToggle`, `wm.windows`, `restoreLayout()`, `persistLayout()`.
- `src/ui/apps.ts` — app registry (`APPS`, `AppId`). Each app = `src/ui/apps/<Name>App.vue`, rendered
  inside a window frame; root element should be `<div class="app">` (fills the window, column flex).
  Apps may receive props via `openApp('mail', { threadUid: 12 })` → declare them as optional props.
- Content registry: `import { C } from '@/engine'` — `C.jobs`, `C.items`, `C.npcs`, `C.scenes`, ...
  (Maps). It is static; don't make it reactive.
- Styles: `src/ui/styles/theme.css` (design tokens — always use `var(--…)`), `src/ui/styles/widgets.css`
  (shared classes: `.btn`, `.panel`, `.group`, `.tabs`, `.list`/`.list-item`, `.table`, `.pill`, `.row`,
  `.col`, `.grow`, `.scroll`, text colors). Component styles are `<style scoped>`.
- Shared components in `src/ui/components/`: `ProgressBar.vue` (`value` 0..1, `label`, `color`),
  `Avatar.vue` (`npc` id or `text`, `size`), `RichText.vue` (`text: Text` → paragraphs). Create more
  shared components only in your own files/dirs as assigned.

## Conventions

- Strict typing: `defineProps<{...}>()`, `ref<T>()` typed, `computed` typed by inference, no `any`.
- ESLint must pass (`npx eslint src/ui`), `npx vue-tsc --build` must pass.
- Keep numbers formatted with engine helpers: `money()`, `formatDate()`, `formatClock()`, `pct()`,
  `hoursLabel()`; skill names via `balance.SKILL_LABELS`, activity names via `balance.ACTIVITY_LABELS`.
- Show *why*: locked things display requirements (`describeCond(cond)`), numbers show breakdowns in
  tooltips (`title=`), checks show `[Skill lvl · DC n · 55%]`.
- Empty states are written in-world ("No new mail. Even the spammers forgot you.").
- Everything must fit windows ~640×460 and scale up; use `.scroll` for long lists.
- Performance: the state changes several times per second. Prefer `computed`, avoid deep watchers,
  never copy the whole state.
- No emoji-only affordances without text labels (emoji as small icons next to text are fine).
- Accessibility basics: buttons are `<button>`, inputs have labels, focus visible.

## Game-feel notes

- The desktop is the game: wallpaper changes with housing (parents' flat → apartment), a CRT
  scanline overlay (toggle `state.settings.crt`), a tray with clock/date/speed/money/energy/heat,
  "You've got mail" style toasts, the taskbar blinking for unread messages.
- The story dialog is modal-ish (dims the desktop) and styled like a CRPG conversation window inside the
  retro frame: speaker avatar + name, narration in italics, choices numbered `1.` `2.`…, skill checks
  shown as `[Intrusion 14 · DC 15 · 55%]`, locked choices greyed with their requirement, a dice roll
  animation for checks (d20 result, modifiers, total vs DC, SUCCESS/FAILURE).
- Hacking is abstract fiction: UI text/commands/tools are invented and never real attack procedures.
