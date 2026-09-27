/**
 * Promise-based message boxes ("Are you sure?"), rendered by <MessageBox /> in App.vue so they
 * work on every screen. Requests queue up; the first one is shown.
 */
import { reactive } from 'vue'

export type MsgIcon = 'info' | 'warn' | 'error' | 'question'

export interface MsgBoxOptions {
  title: string
  text: string
  icon?: MsgIcon
  ok?: string
  /** null = no cancel button (alert). */
  cancel?: string | null
  /** Style the OK button as a destructive action. */
  danger?: boolean
}

export interface MsgBoxRequest {
  title: string
  text: string
  icon: MsgIcon
  ok: string
  cancel: string | null
  danger: boolean
  resolve: (ok: boolean) => void
}

export const msgbox = reactive({ queue: [] as MsgBoxRequest[] })

export function confirmBox(opts: MsgBoxOptions): Promise<boolean> {
  return new Promise(resolve => {
    msgbox.queue.push({
      title: opts.title,
      text: opts.text,
      icon: opts.icon ?? 'question',
      ok: opts.ok ?? 'OK',
      cancel: opts.cancel === undefined ? 'Cancel' : opts.cancel,
      danger: opts.danger ?? false,
      resolve,
    })
  })
}

export async function alertBox(opts: Omit<MsgBoxOptions, 'cancel'>): Promise<void> {
  await confirmBox({ icon: 'info', ...opts, cancel: null })
}

export function answerBox(ok: boolean): void {
  const req = msgbox.queue.shift()
  if (req) req.resolve(ok)
}

export function msgboxOpen(): boolean {
  return msgbox.queue.length > 0
}
