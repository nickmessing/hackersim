/**
 * Lumen Herald Online sidebar flavor: deterministic weather for a foggy port city, and a market
 * ticker driven by the world variables the simulation and story already track. Cosmetic only.
 */
import { dateOf } from '@/engine'
import type { GameState, NewsDef } from '@/engine'
import { noise01 } from './util'
import type { Tone } from './util'

export type NewsCategory = NewsDef['category']

export const NEWS_CATEGORIES: readonly { id: NewsCategory; label: string; tone: Tone }[] = [
  { id: 'local', label: 'Local', tone: 'warn' },
  { id: 'tech', label: 'Tech', tone: 'info' },
  { id: 'business', label: 'Business', tone: 'good' },
  { id: 'crime', label: 'Crime', tone: 'bad' },
  { id: 'world', label: 'World', tone: 'muted' },
  { id: 'culture', label: 'Culture', tone: 'story' },
]

export function categoryMeta(id: NewsCategory): { label: string; tone: Tone } {
  return NEWS_CATEGORIES.find(c => c.id === id) ?? { label: id, tone: 'muted' }
}

// ── Weather ────────────────────────────────────────────────────────────────

export interface Weather {
  label: string
  icon: string
  high: number
  low: number
  quip: string
}

interface Cond {
  label: string
  icon: string
  quip: string
  weight: number
}

/** Average daily highs (°F) by month for Port Lumen, on the grey Lumen Sound. */
const AVG_HIGH = [44, 47, 51, 56, 62, 67, 72, 72, 66, 57, 49, 44] as const

const WINTER: Cond[] = [
  { label: 'Rain', icon: '☂', quip: 'Steady rain off the Sound. The gutters on Cannery Row are winning.', weight: 30 },
  { label: 'Drizzle', icon: '☂', quip: 'The kind of drizzle that gets into your keyboard.', weight: 20 },
  { label: 'Fog', icon: '≋', quip: 'Pea-soup fog. Foghorns all night long.', weight: 15 },
  { label: 'Overcast', icon: '☁', quip: 'Grey on grey. Classic Port Lumen.', weight: 20 },
  { label: 'Sleet', icon: '❄', quip: 'Sleet on the Harbor Point bridges. Drive slow.', weight: 10 },
  { label: 'Clear & cold', icon: '☀', quip: 'Clear and bitter. Good night for stargazing up on the Hill.', weight: 5 },
]
const SPRING: Cond[] = [
  { label: 'Showers', icon: '☂', quip: 'On-and-off showers. Bring the umbrella you keep forgetting.', weight: 25 },
  { label: 'Overcast', icon: '☁', quip: 'Mild and grey. The gulls are complaining again.', weight: 20 },
  { label: 'Morning fog', icon: '≋', quip: 'Fog until noon, then maybe not.', weight: 15 },
  { label: 'Sunny breaks', icon: '⛅', quip: 'Sun breaks through by afternoon. Everyone pretends it is summer.', weight: 25 },
  { label: 'Clear', icon: '☀', quip: 'A rare clear day. Millgate office workers eat lunch outside.', weight: 15 },
]
const SUMMER: Cond[] = [
  { label: 'Morning fog', icon: '≋', quip: 'Marine layer burns off by eleven.', weight: 30 },
  { label: 'Sunny', icon: '☀', quip: 'Sunny and warm. The ferries are packed.', weight: 35 },
  { label: 'Clear', icon: '☀', quip: 'Clear skies. Perfect weather to stay inside and code.', weight: 25 },
  { label: 'Muggy', icon: '☁', quip: 'Sticky and still. Your CRT is a space heater.', weight: 10 },
]
const AUTUMN: Cond[] = [
  { label: 'Fog', icon: '≋', quip: 'Fog rolls in off the Sound at dusk.', weight: 25 },
  { label: 'Drizzle', icon: '☂', quip: 'Drizzle and falling leaves. Sweater weather.', weight: 20 },
  { label: 'Overcast', icon: '☁', quip: 'Overcast. The mill smokestacks disappear into the clouds.', weight: 25 },
  { label: 'Sunny breaks', icon: '⛅', quip: 'Crisp, with sunny breaks. Enjoy it while it lasts.', weight: 20 },
  { label: 'Windy', icon: '≋', quip: 'Gusty winds on the waterfront. Hold on to your hat.', weight: 10 },
]

function seasonOf(month0: number): Cond[] {
  if (month0 === 11 || month0 <= 1) return WINTER
  if (month0 <= 4) return SPRING
  if (month0 <= 7) return SUMMER
  return month0 === 10 ? WINTER : AUTUMN
}

function pickWeighted(list: Cond[], r: number): Cond {
  const total = list.reduce((s, c) => s + c.weight, 0)
  let x = r * total
  for (const c of list) {
    x -= c.weight
    if (x < 0) return c
  }
  return list[list.length - 1] ?? { label: 'Overcast', icon: '☁', quip: 'Grey.', weight: 1 }
}

export function weatherOn(day: number): Weather {
  const month = dateOf(day).getUTCMonth()
  const cond = pickWeighted(seasonOf(month), noise01(day * 31 + 7))
  const base = AVG_HIGH[month] ?? 55
  const high = Math.round(base + (noise01(day * 17 + 3) - 0.5) * 12 - (cond.icon === '☂' ? 3 : 0))
  const low = Math.round(high - 8 - noise01(day * 13 + 5) * 6)
  return { label: cond.label, icon: cond.icon, high, low, quip: cond.quip }
}

// ── Markets ────────────────────────────────────────────────────────────────

export interface Quote {
  sym: string
  name: string
  /** null = not trading (private, halted, delisted). */
  price: number | null
  /** Day-over-day change as a fraction. */
  change: number
  note?: string
}

function flag(state: GameState, key: string, fallback: string): string {
  const v = state.flags[key]
  return typeof v === 'string' && v !== '' ? v : fallback
}

function wv(state: GameState, key: string, fallback: number): number {
  return state.vars[key] ?? fallback
}

/** Smooth-ish deterministic wobble around 1.0 for a ticker on a given day. */
function wave(day: number, seed: number, amp: number): number {
  return (
    1 +
    amp * Math.sin(day / 23 + seed) +
    amp * 0.5 * Math.sin(day / 7.3 + seed * 2) +
    amp * 0.35 * (noise01(day * 101 + seed * 977) - 0.5)
  )
}

/** The dot-com bust (Sep 2001 → mid-2002), the slow recovery, then steady growth. */
function eraCurve(day: number): number {
  if (day < 300) return 1 - 0.38 * (day / 300)
  if (day < 1000) return 0.62 + 0.4 * ((day - 300) / 700)
  return 1.02 + (day - 1000) * 0.00012
}

function quote(sym: string, name: string, priceOn: (day: number) => number, day: number, forceDown = false): Quote {
  const today = priceOn(day)
  const prev = priceOn(day - 1)
  let change = prev > 0 ? today / prev - 1 : 0
  if (forceDown) change = -Math.abs(change) - 0.035
  return { sym, name, price: today, change }
}

const HALCYON_BASE: Record<string, number | undefined> = { rising: 24, wobble: 11.5, crashed: 3.2, clean: 17 }

export function marketQuotes(state: GameState): Quote[] {
  const day = state.time.day
  const it = wv(state, 'w.itSalary', 1)
  const tech = wv(state, 'w.techPrices', 1)
  const broadband = wv(state, 'w.broadband', 0)
  const enclosure = wv(state, 'w.enclosure', 0)
  const out: Quote[] = []

  out.push(quote('LTX', 'Lumen Tech Index', d => 1180 * it * (1 + 0.06 * broadband) * eraCurve(d) * wave(d, 1, 0.025), day))

  const halcyon = flag(state, 'w.halcyon_state', 'startup')
  if (halcyon === 'startup') out.push({ sym: 'HLCN', name: 'Halcyon Systems', price: null, change: 0, note: 'Private · IPO rumored' })
  else if (halcyon === 'dead') out.push({ sym: 'HLCN', name: 'Halcyon Systems', price: null, change: 0, note: 'Delisted' })
  else {
    const base = HALCYON_BASE[halcyon] ?? 18
    out.push(quote('HLCN', 'Halcyon Systems', d => base * it * wave(d, 2, halcyon === 'wobble' ? 0.07 : 0.035), day, halcyon === 'wobble' || halcyon === 'crashed'))
  }

  const meridian = flag(state, 'w.meridian_state', 'healthy')
  if (meridian === 'collapsed') out.push({ sym: 'MRDN', name: 'Meridian Trust', price: null, change: 0, note: 'Trading halted' })
  else {
    const base = meridian === 'breached' ? 27 : 38
    out.push(quote('MRDN', 'Meridian Trust', d => base * wave(d, 3, 0.015), day, meridian === 'breached'))
  }

  out.push(quote('NLNK', 'NorthLink ISP', d => 8.5 * (1 + 0.45 * broadband) * eraCurve(d) * wave(d, 4, 0.03), day))

  const aperture = flag(state, 'w.aperture_state', 'thriving')
  if (aperture === 'destroyed') out.push({ sym: 'APDS', name: 'Aperture Data', price: null, change: 0, note: 'Delisted' })
  else {
    const base = aperture === 'exposed' ? 13 : 41 + enclosure * 2.5
    out.push(quote('APDS', 'Aperture Data', d => base * wave(d, 5, 0.02), day, aperture === 'exposed'))
  }

  out.push(quote('CCST', 'CompCastle', d => (6.4 / Math.max(0.3, tech)) * eraCurve(d) * wave(d, 6, 0.03), day))
  return out
}

export interface LivingCost {
  label: string
  index: number
}

/** Cost-of-living indices (100 = Sep 2001) from the world price multipliers. */
export function livingCosts(state: GameState): LivingCost[] {
  return [
    { label: 'Rents', index: Math.round(wv(state, 'w.rent', 1) * 100) },
    { label: 'Groceries', index: Math.round(wv(state, 'w.prices', 1) * 100) },
    { label: 'Electronics', index: Math.round(wv(state, 'w.techPrices', 1) * 100) },
    { label: 'IT wages', index: Math.round(wv(state, 'w.itSalary', 1) * 100) },
  ]
}

// ── Web poll ───────────────────────────────────────────────────────────────

export interface Poll {
  q: string
  options: string[]
}

const POLLS: readonly Poll[] = [
  { q: 'Is the dot-com party over for good?', options: ['Yes, sell everything', 'It’s a correction', 'What party?'] },
  { q: 'How do you get online at home?', options: ['Dial-up', 'The library', 'My neighbor’s phone line'] },
  { q: 'Should the city bring back the streetcars?', options: ['Yes!', 'Only downtown', 'Buses are fine'] },
  { q: 'Will broadband ever reach Cannery Row?', options: ['Next year', 'In our lifetime', 'What’s broadband?'] },
  { q: 'Best late-night food in Port Lumen?', options: ['The diner on Sodium Row', 'Gas-station burritos', 'Cold pizza'] },
  { q: 'Do you trust online banking?', options: ['Completely', 'For small stuff', 'I keep cash in a sock'] },
  { q: 'Would you let a company track your shopping for a discount?', options: ['Sure, why not', 'Depends on the discount', 'Absolutely not'] },
  { q: 'Should ISPs have to keep logs of what you do online?', options: ['Yes, for safety', 'Only with a warrant', 'Never'] },
  { q: 'Do you still own a pager?', options: ['Yes, proudly', 'In a drawer somewhere', 'I have a phone that takes pictures'] },
  { q: 'Where do you get your news?', options: ['The Herald, obviously', 'TV', 'Forums'] },
]

/** A new poll every ~5 weeks. */
export function pollOn(day: number): { id: number; poll: Poll } {
  const id = Math.floor(day / 35)
  const poll = POLLS[id % POLLS.length] ?? { q: 'Do you read the Herald every day?', options: ['Yes', 'No'] }
  return { id, poll }
}

/** Fake but stable poll results (percentages summing to 100). */
export function pollResults(id: number, n: number): number[] {
  const raw = Array.from({ length: n }, (_, i) => 0.25 + noise01(id * 53 + i * 7))
  const total = raw.reduce((s, x) => s + x, 0)
  const pct = raw.map(x => Math.round((x / total) * 100))
  const diff = 100 - pct.reduce((s, x) => s + x, 0)
  if (pct.length > 0) pct[0] = (pct[0] ?? 0) + diff
  return pct
}
