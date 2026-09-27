/**
 * Small presentation helpers shared by the social & world apps (Contacts, e-Shop, Herald, Journal).
 * Pure functions only — no game rules live here.
 */

/** Tone keys map 1:1 to the shared text/pill color classes in widgets.css. */
export type Tone = 'good' | 'bad' | 'warn' | 'info' | 'story' | 'muted'

/** Deterministic 32-bit string hash (FNV-1a). Used for cosmetic, stable per-id variety. */
export function hashStr(s: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return h >>> 0
}

/** Deterministic 0..1 noise for an integer seed (cosmetic only; never touches the game RNG). */
export function noise01(seed: number): number {
  let x = Math.imul(seed ^ 0x9e3779b9, 0x85ebca6b)
  x ^= x >>> 13
  x = Math.imul(x, 0xc2b2ae35)
  x ^= x >>> 16
  return (x >>> 0) / 4294967296
}

/** "snake_case_thing" → "Snake case thing". */
export function humanize(id: string): string {
  const s = id.replace(/[_.-]+/g, ' ').trim()
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : id
}

/** Display a number with at most one decimal, dropping ".0". */
export function num1(n: number): string {
  const r = Math.round(n * 10) / 10
  return Number.isInteger(r) ? String(r) : r.toFixed(1)
}

/** Signed number with a real minus sign: "+2", "−0.5". */
export function signedNum(n: number): string {
  return n >= 0 ? `+${num1(n)}` : `−${num1(-n)}`
}

/** "1 day" / "3 days". */
export function plural(n: number, one: string, many = `${one}s`): string {
  return `${n} ${n === 1 ? one : many}`
}

const ROMAN: [number, string][] = [
  [10, 'X'],
  [9, 'IX'],
  [5, 'V'],
  [4, 'IV'],
  [1, 'I'],
]

/** Act numbers as roman numerals (1..39). */
export function roman(n: number): string {
  let out = ''
  let rest = Math.max(0, Math.floor(n))
  for (const [v, s] of ROMAN) {
    while (rest >= v) {
      out += s
      rest -= v
    }
  }
  return out || String(n)
}

/** "today" / "yesterday" / "5 days ago". */
export function daysAgo(days: number): string {
  if (days <= 0) return 'today'
  if (days === 1) return 'yesterday'
  if (days < 60) return `${days} days ago`
  if (days < 730) return `${Math.round(days / 30)} months ago`
  return `${Math.round(days / 365)} years ago`
}
