<script setup lang="ts">
/**
 * Cosmetic checkout: the purchase already happened (engine state changed immediately); this just
 * gives it that "Processing order... please do not press Back" feel, then shows a receipt.
 */
import { computed, nextTick, onBeforeUnmount, onMounted, ref, useTemplateRef } from 'vue'
import { money } from '@/engine'
import ProgressBar from '@/ui/components/ProgressBar.vue'
import { isHardware, type OrderReceipt } from './shopData'

const props = defineProps<{ order: OrderReceipt }>()
const emit = defineEmits<{ close: [] }>()

const NORMAL_STEPS = [
  'Connecting to secure server...',
  'Encrypting your order (128-bit)...',
  'Authorizing payment...',
  'Scheduling delivery...',
] as const
const SHADY_STEPS = [
  'Paging the guy who knows a guy...',
  'Bouncing the order through three pay phones...',
  'Counting the cash. Twice...',
  'Arranging a pick-up under the overpass...',
] as const

const progress = ref(0)
const done = computed(() => progress.value >= 1)
const steps = computed(() => (props.order.shady ? SHADY_STEPS : NORMAL_STEPS))
const stepText = computed(() => {
  const list = steps.value
  const i = Math.min(list.length - 1, Math.floor(progress.value * list.length))
  return list[i] ?? ''
})

const okBtn = useTemplateRef<HTMLButtonElement>('okBtn')
let timer = 0

onMounted(() => {
  timer = window.setInterval(() => {
    progress.value = Math.min(1, progress.value + 0.045 + Math.random() * 0.03)
    if (progress.value >= 1) {
      window.clearInterval(timer)
      void nextTick(() => okBtn.value?.focus())
    }
  }, 70)
})
onBeforeUnmount(() => {
  window.clearInterval(timer)
})

const deliveryLine = computed(() => {
  const o = props.order
  if (o.shady) {
    return o.installed
      ? 'Already slotted into your rig. Serial numbers? What serial numbers.'
      : 'The package is where we said it would be. You were never here.'
  }
  if (o.installed) return `Your new ${o.def.name} has been installed. Reboot not required (for once).`
  if (isHardware(o.def)) return 'Delivered. It lives in the closet — the part in your rig is better.'
  return 'Delivered to your door. The courier says hi.'
})

function onKey(e: KeyboardEvent): void {
  if (done.value && (e.key === 'Escape' || e.key === 'Enter')) {
    e.preventDefault()
    emit('close')
  }
}
</script>

<template>
  <div class="overlay" @keydown="onKey">
    <div class="dlg" :class="{ shady: order.shady }" role="dialog" aria-modal="true" :aria-label="done ? 'Order complete' : 'Processing order'">
      <div class="dlg-title">{{ order.shady ? 'c0nnect.exe' : 'Secure Checkout' }}</div>
      <div class="dlg-body">
        <template v-if="!done">
          <div class="row">
            <div class="spinner" aria-hidden="true"></div>
            <div class="grow">
              <b>{{ order.shady ? 'Working...' : 'Processing order...' }}</b>
              <div class="muted step">{{ stepText }}</div>
            </div>
          </div>
          <ProgressBar :value="progress" :height="16" :color="order.shady ? 'var(--terminal-fg)' : 'var(--sel-bg)'" />
          <div class="muted small">{{ order.shady ? 'Do not hang up. Do not say names.' : 'Please do not press Back or Refresh.' }}</div>
        </template>

        <template v-else-if="order.ok">
          <div class="confirm">{{ order.shady ? 'DEAL DONE.' : '✓ Thank you for your order!' }}</div>
          <table class="receipt">
            <tbody>
              <tr><th>Order #</th><td class="mono">{{ order.number }}</td></tr>
              <tr><th>Item</th><td>{{ order.def.name }}</td></tr>
              <tr><th>{{ order.shady ? 'Cash' : 'Total charged' }}</th><td>{{ money(order.price) }}</td></tr>
              <tr><th>Balance</th><td>{{ money(order.balance) }}</td></tr>
            </tbody>
          </table>
          <p class="delivery">{{ deliveryLine }}</p>
        </template>

        <template v-else>
          <div class="confirm declined">{{ order.shady ? 'NO DEAL.' : '✗ Transaction declined' }}</div>
          <p>
            {{ order.shady
              ? 'The guy stopped answering. Maybe count your money before you call next time.'
              : 'Your payment could not be authorized. Please check your balance and try again.' }}
          </p>
        </template>

        <div v-if="done" class="row end">
          <button ref="okBtn" type="button" class="btn primary" @click="emit('close')">
            {{ order.shady ? 'Walk away' : 'Continue Shopping' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.overlay {
  position: absolute;
  inset: 0;
  z-index: 5;
  background: rgb(0 0 0 / 28%);
  display: flex;
  align-items: center;
  justify-content: center;
}
.dlg {
  width: min(340px, 92%);
  background: var(--win-bg);
  border: 1px solid var(--win-border);
  border-radius: var(--radius) var(--radius) 0 0;
  box-shadow: var(--win-shadow);
}
.dlg-title {
  background: linear-gradient(90deg, var(--win-title-a), var(--win-title-b));
  color: var(--win-title-fg);
  font-weight: bold;
  padding: 4px 8px;
}
.dlg-body {
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.spinner {
  width: 24px;
  height: 24px;
  flex: none;
  border-radius: 50%;
  border: 3px solid var(--panel-border);
  border-top-color: var(--sel-bg);
  border-right-color: var(--sel-bg);
  animation: spin 0.9s linear infinite;
}
.shady .spinner {
  border-color: var(--shady-dim);
  border-top-color: var(--shady-fg);
  border-right-color: var(--shady-fg);
  border-radius: 0;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
@media (prefers-reduced-motion: reduce) {
  .spinner {
    animation: none;
  }
}
.step {
  font-size: 11px;
}
.small {
  font-size: 10px;
}
.confirm {
  font-size: 14px;
  font-weight: bold;
  color: var(--good);
}
.confirm.declined {
  color: var(--bad);
}
.receipt {
  border-collapse: collapse;
  background: var(--panel-bg);
  border: 1px dashed var(--panel-border);
  width: 100%;
}
.receipt th,
.receipt td {
  padding: 2px 8px;
  text-align: left;
  font-size: 11px;
}
.receipt th {
  color: var(--muted);
  font-weight: normal;
  width: 40%;
}
.delivery {
  margin: 0;
  font-style: italic;
}
.end {
  justify-content: flex-end;
}

/* Back-alley skin */
.dlg.shady {
  --shady-fg: #39ff6a;
  --shady-dim: #1f9c44;
  background: #050a05;
  border: 1px solid var(--shady-dim);
  border-radius: 0;
  color: var(--shady-fg);
  font-family: var(--font-mono);
}
.shady .dlg-title {
  background: #0c1f0f;
  color: var(--shady-fg);
  border-bottom: 1px solid var(--shady-dim);
}
.shady .muted,
.shady .receipt th {
  color: var(--shady-dim);
}
.shady .receipt {
  background: transparent;
  border-color: var(--shady-dim);
}
.shady .confirm {
  color: var(--shady-fg);
  letter-spacing: 2px;
}
.shady .btn {
  background: #0c1f0f;
  color: var(--shady-fg);
  border-color: var(--shady-fg);
  border-radius: 0;
  font-family: var(--font-mono);
}
</style>
