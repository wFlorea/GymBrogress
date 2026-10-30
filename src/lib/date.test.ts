import { describe, expect, it } from 'vitest'
import {
  addDays,
  addMonths,
  dayOfWeek,
  daysBetween,
  daysInMonth,
  formatDate,
  hourIn,
  isIsoDate,
  mondayOf,
  todayIn,
} from './date'

describe('isIsoDate', () => {
  it('accepts real YYYY-MM-DD dates only', () => {
    expect(isIsoDate('2024-02-29')).toBe(true)
    expect(isIsoDate('2026-02-29')).toBe(false)
    expect(isIsoDate('2026-13-01')).toBe(false)
    expect(isIsoDate('2026-1-01')).toBe(false)
    expect(isIsoDate(20261030)).toBe(false)
  })
})

describe('addDays', () => {
  it('crosses months, years and leap days', () => {
    expect(addDays('2024-02-28', 1)).toBe('2024-02-29')
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28')
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01')
  })

  it("doesn't skip or repeat a day when the clocks change", () => {
    expect(addDays('2026-10-24', 2)).toBe('2026-10-26')
    expect(addDays('2026-03-28', 2)).toBe('2026-03-30')
  })
})

describe('dayOfWeek and mondayOf', () => {
  it('counts from Monday', () => {
    expect(dayOfWeek('2026-10-26')).toBe(0)
    expect(dayOfWeek('2026-10-30')).toBe(4)
    expect(dayOfWeek('2026-11-01')).toBe(6)
  })

  it('finds the Monday of the week', () => {
    expect(mondayOf('2026-11-01')).toBe('2026-10-26')
    expect(mondayOf('2026-10-26')).toBe('2026-10-26')
  })
})

describe('months', () => {
  it('moves to the first of another month', () => {
    expect(addMonths('2026-01-31', 1)).toBe('2026-02-01')
    expect(addMonths('2026-11-15', 2)).toBe('2027-01-01')
    expect(addMonths('2026-01-15', -1)).toBe('2025-12-01')
  })

  it('knows how long a month is', () => {
    expect(daysInMonth('2024-02-10')).toBe(29)
    expect(daysInMonth('2026-02-01')).toBe(28)
    expect(daysInMonth('2026-10-30')).toBe(31)
  })
})

describe('daysBetween', () => {
  it('counts whole days either way', () => {
    expect(daysBetween('2026-10-26', '2026-11-01')).toBe(6)
    expect(daysBetween('2026-11-01', '2026-10-26')).toBe(-6)
    expect(daysBetween('2026-10-30', '2026-10-30')).toBe(0)
  })
})

describe('todayIn and hourIn', () => {
  const noonUtc = new Date('2026-10-30T12:00:00Z')

  it('gives the date in the time zone', () => {
    expect(todayIn('UTC', noonUtc)).toBe('2026-10-30')
    expect(todayIn('Pacific/Auckland', noonUtc)).toBe('2026-10-31')
    expect(todayIn('America/Los_Angeles', new Date('2026-10-30T03:00:00Z'))).toBe('2026-10-29')
  })

  it('gives the hour in the time zone, summer time included', () => {
    expect(hourIn('Europe/Bucharest', new Date('2026-01-15T12:00:00Z'))).toBe(14)
    expect(hourIn('Europe/Bucharest', new Date('2026-07-15T12:00:00Z'))).toBe(15)
  })

  it('calls midnight 0, not 24', () => {
    expect(hourIn('UTC', new Date('2026-01-15T00:30:00Z'))).toBe(0)
  })
})

describe('formatDate', () => {
  it('formats the calendar date whatever the time zone', () => {
    expect(formatDate('2026-10-30', { weekday: 'long', day: 'numeric', month: 'long' })).toBe('Friday 30 October')
  })
})
