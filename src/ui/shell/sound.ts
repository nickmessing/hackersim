/**
 * Tiny synthesized notification chimes (Web Audio, no assets). Only played when
 * `state.settings.sound` is on; silently does nothing where audio is unavailable.
 */
import type { LogKind } from '@/engine'

type Note = [freq: number, ms: number]

const TUNES: Record<LogKind, { wave: OscillatorType; notes: Note[] }> = {
  info: { wave: 'sine', notes: [[880, 90]] },
  good: { wave: 'triangle', notes: [[660, 80], [990, 120]] },
  bad: { wave: 'square', notes: [[220, 120], [185, 180]] },
  story: { wave: 'triangle', notes: [[784, 90], [1047, 90], [1319, 160]] },
  money: { wave: 'square', notes: [[1319, 60], [1760, 140]] },
  skill: { wave: 'triangle', notes: [[523, 70], [659, 70], [784, 140]] },
  heat: { wave: 'sawtooth', notes: [[330, 110], [247, 110], [330, 160]] },
  quest: { wave: 'triangle', notes: [[587, 90], [880, 180]] },
}

let ctx: AudioContext | null = null
let lastAt = 0

export function playChime(kind: LogKind, volume = 0.05): void {
  const now = Date.now()
  if (now - lastAt < 220) return
  lastAt = now
  try {
    ctx ??= new AudioContext()
    const ac = ctx
    if (ac.state === 'suspended') void ac.resume()
    const tune = TUNES[kind]
    let t = ac.currentTime + 0.01
    for (const [freq, ms] of tune.notes) {
      const osc = ac.createOscillator()
      const gain = ac.createGain()
      const dur = ms / 1000
      osc.type = tune.wave
      osc.frequency.setValueAtTime(freq, t)
      gain.gain.setValueAtTime(0.0001, t)
      gain.gain.exponentialRampToValueAtTime(volume, t + 0.012)
      gain.gain.exponentialRampToValueAtTime(0.0001, t + dur)
      osc.connect(gain).connect(ac.destination)
      osc.start(t)
      osc.stop(t + dur + 0.02)
      t += dur * 0.85
    }
  } catch {
    // no audio device / blocked autoplay: stay quiet
  }
}
