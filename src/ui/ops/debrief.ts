/**
 * Operation debriefs: presentation for an `OpReport` (headline, tone, blurb) and a tiny
 * session-scoped "already shown" registry so a report is presented exactly once — by the Terminal's
 * own end-of-op summary or by the Ops debrief window, whichever the player sees first.
 */
import { reactive } from 'vue'
import { C, type GameState, type OpReport } from '@/engine'

export type DebriefTone = 'good' | 'warn' | 'bad'

export interface OutcomeInfo {
  headline: string
  tone: DebriefTone
  blurb: string
  /** Small tag under the headline (e.g. "scripted run"). */
  tag?: string
}

export const OUTCOME_INFO: Record<OpReport['outcome'], OutcomeInfo> = {
  clean: { headline: 'CLEAN', tone: 'good', blurb: 'In and out. Nobody will ever know you were there.' },
  messy: { headline: 'MESSY', tone: 'warn', blurb: 'The job is done — but you left footprints, and footprints get followed.' },
  partial: { headline: 'PARTIAL', tone: 'warn', blurb: 'You got some of it. The client pays for some of it.' },
  traced: { headline: 'TRACED', tone: 'bad', blurb: 'They pinned your route before you got clear. Expect consequences.' },
  aborted: { headline: 'ABORTED', tone: 'bad', blurb: 'You walked away with nothing. Live to hack another day.' },
  scripted: { headline: 'SCRIPTED', tone: 'good', blurb: 'The script did its thing while you watched the kettle. Lower pay, louder footprint.', tag: 'scripted run' },
  'scripted-fail': { headline: 'TRACED', tone: 'bad', blurb: 'The script blundered into a trace it could not dodge. Nobody was at the wheel.', tag: 'scripted run' },
}

/** Session-only memory of which reports were shown (keyed by contract uid). */
const shown = reactive(new Set<number>())

export function debriefSeen(uid: number): boolean {
  return shown.has(uid)
}

/** Mark a report as presented and clear it from the save so it does not pop up again. */
export function markDebriefSeen(state: GameState, uid: number): void {
  shown.add(uid)
  if (state.lastReport?.uid === uid) state.lastReport = null
}

/** Human-readable title of a spawned complication (its scene title), if any. */
export function complicationTitle(id: string | undefined): string | null {
  if (!id) return null
  const ev = C.events.get(id)
  const scene = ev?.scene ? C.scenes.get(ev.scene) : undefined
  return scene?.title ?? null
}

/** Plain-text lines for the Terminal's own end-of-op summary. */
export function debriefLines(title: string, r: OpReport): { text: string; tone: 'good' | 'warn' | 'err' | 'dim' | 'sys' | 'out' }[] {
  const info = OUTCOME_INFO[r.outcome]
  const tone = info.tone === 'bad' ? 'err' : info.tone
  const bar = '═'.repeat(44)
  const out: { text: string; tone: 'good' | 'warn' | 'err' | 'dim' | 'sys' | 'out' }[] = [
    { text: '', tone: 'out' },
    { text: `╔${bar}╗`, tone: 'sys' },
    { text: `  OPERATION DEBRIEF — ${title}`.slice(0, 46), tone: 'sys' },
    { text: `╚${bar}╝`, tone: 'sys' },
    { text: `  OUTCOME: ${info.headline}${info.tag ? ` (${info.tag})` : ''}`, tone },
    { text: `  ${info.blurb}`, tone: 'dim' },
    { text: `  Pay   ${r.pay > 0 ? `+$${r.pay.toLocaleString('en-US')}` : '—'}`, tone: r.pay > 0 ? 'good' : 'dim' },
    { text: `  Heat  ${r.heat > 0 ? `+${r.heat.toFixed(1)}` : '±0'}`, tone: r.heat > 5 ? 'warn' : 'out' },
    { text: `  Cred  ${r.cred > 0 ? '+' : ''}${r.cred.toFixed(1)}`, tone: r.cred >= 0 ? 'out' : 'err' },
  ]
  for (const n of r.notes) out.push({ text: `  · ${n}`, tone: 'out' })
  if (r.complication) {
    const t = complicationTitle(r.complication)
    out.push({ text: `  ⚠ Complication: ${t ?? 'somebody is pulling on a thread'} — watch your inbox.`, tone: 'err' })
  }
  return out
}
