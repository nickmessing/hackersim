export function money(n: number): string {
  const sign = n < 0 ? '-' : ''
  const abs = Math.abs(Math.round(n))
  return `${sign}$${abs.toLocaleString('en-US')}`
}

export function signed(n: number, digits = 0): string {
  const s = n.toFixed(digits)
  return n >= 0 ? `+${s}` : s
}

export function pct(n: number): string {
  return `${Math.round(n * 100)}%`
}

export function clamp(n: number, min: number, max: number): number {
  return n < min ? min : n > max ? max : n
}

export function hoursLabel(h: number): string {
  if (h < 1) return `${Math.round(h * 60)}m`
  if (h < 48) return `${h.toFixed(h < 10 ? 1 : 0)}h`
  return `${(h / 24).toFixed(1)}d`
}
