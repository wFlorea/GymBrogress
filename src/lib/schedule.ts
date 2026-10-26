import { addDays, dayOfWeek, mondayOf } from './date'
import type { DatePlans, IsoDate, SplitType, WeeklyPlan } from './types'

/** How many weeks can be planned, counting the current one. */
export const PLANNING_WEEKS = 4

/** Dates that can be planned: today through the last day of the planning window. */
export function planningWindow(today: IsoDate) {
  const weekStart = mondayOf(today)
  return { weekStart, first: today, last: addDays(weekStart, PLANNING_WEEKS * 7 - 1) }
}

/** A date's split: its own plan if it has one, otherwise the repeating week. */
export function splitForDate(date: IsoDate, datePlans: DatePlans, weeklyPlan: WeeklyPlan): SplitType {
  return datePlans[date] ?? weeklyPlan[dayOfWeek(date)]
}
