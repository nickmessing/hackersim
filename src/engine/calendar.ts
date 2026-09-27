import { START_AGE, START_DAY_OF_MONTH, START_MONTH, START_YEAR } from './balance'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const

const EPOCH = Date.UTC(START_YEAR, START_MONTH, START_DAY_OF_MONTH)
const MS_PER_DAY = 86_400_000

export function dateOf(day: number): Date {
  return new Date(EPOCH + Math.floor(day) * MS_PER_DAY)
}

export function yearOf(day: number): number {
  return dateOf(day).getUTCFullYear()
}

/** "Mon 3 Sep 2001" */
export function formatDate(day: number): string {
  const d = dateOf(day)
  return `${WEEKDAYS[d.getUTCDay()] ?? ''} ${d.getUTCDate()} ${MONTHS[d.getUTCMonth()] ?? ''} ${d.getUTCFullYear()}`
}

/** "Week of 3 Sep 2001" — the game moves in weekly turns. */
export function formatWeek(day: number): string {
  return `Week of ${formatShortDate(day)}`
}

/** "3 Sep 2001" */
export function formatShortDate(day: number): string {
  const d = dateOf(day)
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()] ?? ''} ${d.getUTCFullYear()}`
}

export function formatClock(hour: number, frac = 0): string {
  const minutes = Math.floor(frac * 60)
  return `${String(hour).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
}

/** Player age in (fractional) years. */
export function ageOn(day: number): number {
  return START_AGE + day / 365.25
}

/** Day number for a calendar date (useful in content: `{ day: true, gte: dayOf(2003, 0, 1) }`). */
export function dayOf(year: number, month0: number, dayOfMonth: number): number {
  return Math.round((Date.UTC(year, month0, dayOfMonth) - EPOCH) / MS_PER_DAY)
}

export function isWeekend(day: number): boolean {
  const wd = dateOf(day).getUTCDay()
  return wd === 0 || wd === 6
}
