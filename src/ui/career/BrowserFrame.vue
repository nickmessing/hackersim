<script setup lang="ts">
/**
 * A period web browser ("Lumen Navigator 5"): menu strip, toolbar with Back / Forward / Stop /
 * Refresh / Home, address bar, page viewport (default slot) and a status bar with a load meter.
 */
defineProps<{
  url: string
  canBack: boolean
  canForward: boolean
  loading: boolean
  status?: string
}>()
const emit = defineEmits<{ back: []; forward: []; refresh: []; home: []; stop: [] }>()
</script>

<template>
  <div class="browser">
    <div class="br-menu" aria-hidden="true">
      <span><u>F</u>ile</span><span><u>E</u>dit</span><span><u>V</u>iew</span><span>F<u>a</u>vorites</span><span><u>T</u>ools</span><span><u>H</u>elp</span>
      <span class="br-brand" :class="{ spinning: loading }" title="Lumen Navigator">◉</span>
    </div>
    <div class="br-toolbar">
      <button type="button" class="br-tool" :disabled="!canBack" title="Back" @click="emit('back')"><span class="br-ico back">◀</span><span>Back</span></button>
      <button type="button" class="br-tool" :disabled="!canForward" title="Forward" @click="emit('forward')"><span class="br-ico fwd">▶</span></button>
      <button type="button" class="br-tool" :disabled="!loading" title="Stop" @click="emit('stop')"><span class="br-ico stop">■</span></button>
      <button type="button" class="br-tool" title="Refresh" @click="emit('refresh')"><span class="br-ico refresh">↻</span></button>
      <button type="button" class="br-tool" title="Home" @click="emit('home')"><span class="br-ico home">⌂</span><span>Home</span></button>
    </div>
    <div class="br-address">
      <label for="br-url" class="muted">Address</label>
      <div class="br-url-box">
        <span class="br-page-ico" aria-hidden="true">e</span>
        <input id="br-url" type="text" :value="url" readonly spellcheck="false" />
      </div>
      <button type="button" class="br-go" title="Go" @click="emit('refresh')"><span aria-hidden="true">➔</span> Go</button>
    </div>
    <div class="br-view">
      <slot />
    </div>
    <div class="br-status">
      <span class="br-status-text">{{ loading ? `Opening page ${url}...` : (status ?? 'Done') }}</span>
      <span class="br-meter" :class="{ active: loading }" aria-hidden="true"><span></span></span>
      <span class="br-zone"><span aria-hidden="true">🌐</span> Internet</span>
    </div>
  </div>
</template>

<style scoped>
.browser {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  background: var(--win-bg);
}
.br-menu {
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 1px 4px;
  border-bottom: 1px solid #d6d3c2;
  user-select: none;
}
.br-menu > span {
  padding: 1px 6px;
}
.br-brand {
  margin-left: auto;
  font-size: 15px;
  color: var(--sel-bg);
  line-height: 1;
}
.br-brand.spinning {
  animation: br-spin 0.9s linear infinite;
}
@keyframes br-spin {
  to {
    transform: rotate(360deg);
  }
}
.br-toolbar {
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 2px 4px;
  border-bottom: 1px solid #d6d3c2;
}
.br-tool {
  font: inherit;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 6px;
  min-height: 26px;
  border: 1px solid transparent;
  border-radius: var(--radius);
  background: transparent;
  cursor: pointer;
}
.br-tool:hover:not(:disabled) {
  border-color: #c1d2ee;
  background: linear-gradient(#fff, #e3ebf8);
}
.br-tool:disabled {
  color: var(--btn-disabled-fg);
  cursor: default;
}
.br-tool:focus-visible,
.br-go:focus-visible {
  outline: 1px dotted #000;
}
.br-ico {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  font-size: 10px;
  color: #fff;
  background: radial-gradient(circle at 35% 30%, #8fd98f, var(--good));
  border: 1px solid rgb(0 0 0 / 25%);
}
.br-tool:disabled .br-ico {
  filter: grayscale(1);
  opacity: 0.55;
}
.br-ico.stop {
  background: radial-gradient(circle at 35% 30%, #f2a39b, var(--bad));
  border-radius: 4px;
}
.br-ico.refresh {
  background: radial-gradient(circle at 35% 30%, #9ec3f5, var(--info));
  font-size: 13px;
}
.br-ico.home {
  background: radial-gradient(circle at 35% 30%, #ffe08a, var(--warn));
  font-size: 13px;
  border-radius: 4px;
}
.br-address {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 3px 4px;
  border-bottom: 1px solid #b9b6a4;
}
.br-url-box {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 4px;
  border: 1px solid var(--panel-border);
  background: #fff;
  padding: 0 4px;
  min-width: 0;
}
.br-page-ico {
  font: italic bold 12px Georgia, serif;
  color: var(--info);
}
.br-url-box input {
  flex: 1;
  min-width: 0;
  border: none;
  padding: 2px 0;
  outline: none;
  background: transparent;
}
.br-go {
  font: inherit;
  display: inline-flex;
  align-items: center;
  gap: 3px;
  border: 1px solid transparent;
  background: transparent;
  cursor: pointer;
  padding: 1px 4px;
}
.br-go span {
  color: var(--good);
  font-weight: bold;
}
.br-go:hover {
  border-color: #c1d2ee;
}
.br-view {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  margin: 0 2px;
  border: 1px solid #7f9db9;
  border-bottom: none;
  background: #fff;
}
.br-status {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 2px 6px;
  border-top: 1px solid #b9b6a4;
  font-size: 11px;
}
.br-status-text {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.br-meter {
  width: 90px;
  height: 11px;
  border: 1px solid var(--bar-border);
  background: #fff;
  overflow: hidden;
  visibility: hidden;
}
.br-meter.active {
  visibility: visible;
}
.br-meter span {
  display: block;
  height: 100%;
  width: 40%;
  background: var(--bar-fill);
  mask-image: repeating-linear-gradient(90deg, #000 0 6px, transparent 6px 8px);
  animation: br-load 0.5s linear infinite;
}
@keyframes br-load {
  from {
    transform: translateX(-100%);
  }
  to {
    transform: translateX(250%);
  }
}
.br-zone {
  padding-left: 8px;
  border-left: 1px solid #c9c6b4;
}
@media (prefers-reduced-motion: reduce) {
  .br-brand.spinning,
  .br-meter span {
    animation: none;
  }
}
</style>
