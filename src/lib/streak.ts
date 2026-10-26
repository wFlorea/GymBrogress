/**
 * Streak rules:
 * - a day with at least one completed set is a gym day (+1 to the streak)
 * - a rest day without training is neutral (it neither adds to nor breaks the streak)
 * - a planned workout day that was missed uses a streak restore automatically, at most
 *   MAX_RESTORES_PER_MONTH per calendar month; one more miss that month resets the streak
 * - today only counts once you have trained; it is never "missed" while it is still going
 */
import { addDays, dayOfWeek, monthOf } from './date'
import { REST_DAY } from './splits'
import type { DaySummary, IsoDate, WeeklyPlan } from './types'

export const MAX_RESTORES_PER_MONTH = 3

export interface StreakStats {
  streak: number
  skippedDays: number
  restoresLeftThisMonth: number
  missedYesterday: boolean
}

type DayKind = 'gym' | 'rest' | 'missed'

export function computeStreakStats(history: DaySummary[], weeklyPlan: WeeklyPlan, today: IsoDate): StreakStats {
  const byDate = new Map(history.map((day) => [day.date, day]))
  const firstDate = history.reduce<IsoDate | null>((min, day) => (!min || day.date < min ? day.date : min), null)

  if (!firstDate || firstDate > today) {
    return { streak: 0, skippedDays: 0, restoresLeftThisMonth: MAX_RESTORES_PER_MONTH, missedYesterday: false }
  }

  const kindOf = (date: IsoDate): DayKind => {
    const day = byDate.get(date)
    if (day && day.completedSets > 0) return 'gym'
    const split = day?.split ?? weeklyPlan[dayOfWeek(date)] ?? REST_DAY
    return split === REST_DAY ? 'rest' : 'missed'
  }

  // Walk forward so a month that ran out of restores resets only the streak built before it.
  const yesterday = addDays(today, -1)
  const missesPerMonth = new Map<string, number>()
  let streak = 0
  let skippedDays = 0

  for (let date = firstDate; date <= yesterday; date = addDays(date, 1)) {
    const kind = kindOf(date)
    if (kind === 'gym') {
      streak++
    } else if (kind === 'missed') {
      skippedDays++
      const month = monthOf(date)
      const misses = (missesPerMonth.get(month) ?? 0) + 1
      missesPerMonth.set(month, misses)
      if (misses > MAX_RESTORES_PER_MONTH) streak = 0
    }
  }

  if (kindOf(today) === 'gym') streak++

  return {
    streak,
    skippedDays,
    restoresLeftThisMonth: Math.max(0, MAX_RESTORES_PER_MONTH - (missesPerMonth.get(monthOf(today)) ?? 0)),
    missedYesterday: yesterday >= firstDate && kindOf(yesterday) === 'missed',
  }
}
