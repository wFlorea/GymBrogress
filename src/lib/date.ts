// Calendar dates are handled as `YYYY-MM-DD` strings and computed in UTC,
// so results never depend on the server's or the browser's time zone.
import type { IsoDate } from './types'

export const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

function toUtc(iso: IsoDate): Date {
  return new Date(`${iso}T00:00:00Z`)
}

function fromUtc(date: Date): IsoDate {
  return date.toISOString().slice(0, 10)
}

export function isIsoDate(value: unknown): value is IsoDate {
  if (typeof value !== 'string' || !ISO_DATE.test(value)) return false
  const date = toUtc(value)
  return !Number.isNaN(date.getTime()) && fromUtc(date) === value
}

export function addDays(iso: IsoDate, days: number): IsoDate {
  const date = toUtc(iso)
  date.setUTCDate(date.getUTCDate() + days)
  return fromUtc(date)
}

/** 0 = Monday … 6 = Sunday. */
export function dayOfWeek(iso: IsoDate): number {
  return (toUtc(iso).getUTCDay() + 6) % 7
}

export function mondayOf(iso: IsoDate): IsoDate {
  return addDays(iso, -dayOfWeek(iso))
}

/** `YYYY-MM` */
export function monthOf(iso: IsoDate): string {
  return iso.slice(0, 7)
}

export function firstOfMonth(iso: IsoDate): IsoDate {
  return `${monthOf(iso)}-01`
}

export function addMonths(iso: IsoDate, months: number): IsoDate {
  const date = toUtc(firstOfMonth(iso))
  date.setUTCMonth(date.getUTCMonth() + months)
  return fromUtc(date)
}

export function daysInMonth(iso: IsoDate): number {
  const date = toUtc(firstOfMonth(iso))
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).getUTCDate()
}

export function isValidTimeZone(timeZone: string): boolean {
  try {
    new Intl.DateTimeFormat('en-GB', { timeZone })
    return true
  } catch {
    return false
  }
}

/** Today's date as seen in `timeZone` (an IANA name such as `Europe/Bucharest`). */
export function todayIn(timeZone: string, now: Date = new Date()): IsoDate {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now)
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === type)?.value
  return `${part('year')}-${part('month')}-${part('day')}`
}

export function formatDate(iso: IsoDate, options: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat('en-GB', { ...options, timeZone: 'UTC' }).format(toUtc(iso))
}

/** Whole days from `from` to `to` (negative when `to` is earlier). */
export function daysBetween(from: IsoDate, to: IsoDate): number {
  return Math.round((toUtc(to).getTime() - toUtc(from).getTime()) / 86_400_000)
}

/** Cookie holding the browser's IANA time zone, so the server knows the user's "today". */
export const TIMEZONE_COOKIE = 'tz'
