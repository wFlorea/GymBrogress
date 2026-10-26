'use server'

import { revalidatePath } from 'next/cache'
import { dayOfWeek, isIsoDate } from '@/lib/date'
import { isSplitType } from '@/lib/splits'
import { planningWindow } from '@/lib/schedule'
import { dbFail, fail, ok } from '@/lib/data/action-result'
import { getSession, getToday } from '@/lib/data/session'
import { getWeeklyPlan } from '@/lib/data/plans'
import type { ActionResult, IsoDate, SplitType } from '@/lib/types'

function revalidateSchedule() {
  revalidatePath('/schedule')
  revalidatePath('/dashboard')
  revalidatePath('/tracker')
}

async function checkPlannableDate(date: unknown): Promise<string | null> {
  if (!isIsoDate(date)) return 'Invalid date.'
  const { first, last } = planningWindow(await getToday())
  if (date < first || date > last) return 'You can only plan from today up to 4 weeks ahead.'
  return null
}

/** Plans a split for one date (today or later, within the planning window). */
export async function saveScheduleDay(date: IsoDate, split: SplitType): Promise<ActionResult> {
  const dateError = await checkPlannableDate(date)
  if (dateError) return fail(dateError)
  if (!isSplitType(split)) return fail('Unknown workout type.')

  const { user, supabase } = await getSession()
  const { error } = await supabase
    .from('workout_logs')
    .upsert({ user_id: user.id, date, split }, { onConflict: 'user_id,date' })
  if (error) return dbFail('saveScheduleDay', error, 'Could not save the schedule. Please try again.')

  revalidateSchedule()
  return ok()
}

/** Makes a date follow the repeating week again. Returns the split it falls back to. */
export async function resetScheduleDay(date: IsoDate): Promise<ActionResult<SplitType>> {
  const dateError = await checkPlannableDate(date)
  if (dateError) return fail(dateError)

  const { user, supabase } = await getSession()
  const fallback = (await getWeeklyPlan())[dayOfWeek(date)]

  const { data: log, error: readError } = await supabase
    .from('workout_logs')
    .select('id, workout_sets(count)')
    .eq('user_id', user.id)
    .eq('date', date)
    .maybeSingle()
  if (readError) return dbFail('resetScheduleDay', readError)

  if (log) {
    const setCount: number = log.workout_sets?.[0]?.count ?? 0
    // A day with logged sets keeps its row (the sets belong to it); only its split changes.
    const { error } =
      setCount > 0
        ? await supabase.from('workout_logs').update({ split: fallback }).eq('id', log.id)
        : await supabase.from('workout_logs').delete().eq('id', log.id)
    if (error) return dbFail('resetScheduleDay', error, 'Could not reset the day. Please try again.')
  }

  revalidateSchedule()
  return ok(fallback)
}

/** Sets the split a weekday uses whenever a date has no plan of its own. */
export async function saveWeeklyDefault(day: number, split: SplitType): Promise<ActionResult> {
  if (!Number.isInteger(day) || day < 0 || day > 6) return fail('Invalid weekday.')
  if (!isSplitType(split)) return fail('Unknown workout type.')

  const { user, supabase } = await getSession()
  const { error } = await supabase
    .from('weekly_plans')
    .upsert({ user_id: user.id, day_of_week: day, split }, { onConflict: 'user_id,day_of_week' })
  if (error) return dbFail('saveWeeklyDefault', error, 'Could not save the weekly plan. Please try again.')

  revalidateSchedule()
  return ok()
}
