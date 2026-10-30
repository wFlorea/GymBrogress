import { describe, expect, it } from 'vitest'
import { dayOfWeek } from './date'
import { REST_DAY } from './splits'
import { computeStreakStats } from './streak'
import type { DaySummary, IsoDate, SplitType, WeeklyPlan } from './types'

// Monday to Sunday
const pushPullLegs: WeeklyPlan = ['Push', 'Pull', 'Legs', REST_DAY, 'Upper', 'Lower', REST_DAY]
const mondaysOnly: WeeklyPlan = ['Full Body', REST_DAY, REST_DAY, REST_DAY, REST_DAY, REST_DAY, REST_DAY]

/** A day in the history: trained (some sets done) or not, on the plan's split unless another is given. */
function day(date: IsoDate, trained: boolean, plan: WeeklyPlan, split?: SplitType): DaySummary {
  return {
    date,
    split: split ?? plan[dayOfWeek(date)],
    totalSets: 3,
    completedSets: trained ? 3 : 0,
    totalExercises: 1,
    completedExercises: trained ? 1 : 0,
    finished: trained,
  }
}

const trained = (plan: WeeklyPlan, ...dates: IsoDate[]) => dates.map((date) => day(date, true, plan))

describe('computeStreakStats', () => {
  it('starts at zero without a history', () => {
    expect(computeStreakStats([], pushPullLegs, '2026-10-30')).toEqual({
      streak: 0,
      skippedDays: 0,
      restoresLeftThisMonth: 3,
      missedYesterday: false,
    })
  })

  it('counts gym days and lets rest days pass', () => {
    // Mon to Wed trained, Thursday is a rest day
    const history = trained(pushPullLegs, '2026-10-26', '2026-10-27', '2026-10-28')
    const stats = computeStreakStats(history, pushPullLegs, '2026-10-30')
    expect(stats.streak).toBe(3)
    expect(stats.missedYesterday).toBe(false)
  })

  it("counts today once it's trained, and never misses it", () => {
    const history = trained(pushPullLegs, '2026-10-26', '2026-10-27', '2026-10-28')
    expect(computeStreakStats([...history, day('2026-10-30', true, pushPullLegs)], pushPullLegs, '2026-10-30').streak).toBe(4)
    expect(computeStreakStats(history, pushPullLegs, '2026-10-30').skippedDays).toBe(0)
  })

  it('uses a restore for a missed workout day', () => {
    // Tuesday's Pull was missed
    const history = trained(pushPullLegs, '2026-10-26', '2026-10-28')
    expect(computeStreakStats(history, pushPullLegs, '2026-10-30')).toEqual({
      streak: 2,
      skippedDays: 1,
      restoresLeftThisMonth: 2,
      missedYesterday: false,
    })
  })

  it('resets the streak on a fourth miss in a month', () => {
    // Every Monday in October missed
    const history = trained(mondaysOnly, '2026-09-28')
    expect(computeStreakStats(history, mondaysOnly, '2026-10-30')).toEqual({
      streak: 0,
      skippedDays: 4,
      restoresLeftThisMonth: 0,
      missedYesterday: false,
    })
  })

  it('keeps the streak through three misses in a month', () => {
    const history = trained(mondaysOnly, '2026-09-28', '2026-10-26')
    expect(computeStreakStats(history, mondaysOnly, '2026-10-30')).toMatchObject({
      streak: 2,
      skippedDays: 3,
      restoresLeftThisMonth: 0,
    })
  })

  it('gives three restores again each month', () => {
    const history = trained(mondaysOnly, '2026-09-28', '2026-11-02')
    expect(computeStreakStats(history, mondaysOnly, '2026-11-03')).toMatchObject({ streak: 1, restoresLeftThisMonth: 3 })
  })

  it('says when yesterday was missed', () => {
    const history = trained(mondaysOnly, '2026-09-28', '2026-10-05', '2026-10-12', '2026-10-19')
    expect(computeStreakStats(history, mondaysOnly, '2026-10-27')).toEqual({
      streak: 4,
      skippedDays: 1,
      restoresLeftThisMonth: 2,
      missedYesterday: true,
    })
  })

  it('follows a day changed to a rest day over the plan', () => {
    const history = [...trained(mondaysOnly, '2026-10-19'), day('2026-10-26', false, mondaysOnly, REST_DAY)]
    expect(computeStreakStats(history, mondaysOnly, '2026-10-27')).toMatchObject({ streak: 1, skippedDays: 0 })
  })
})
