import 'server-only'
import { cache } from 'react'
import { REST_DAY, isSplitType, isWorkoutSplit } from '@/lib/splits'
import type { DatePlans, IsoDate, RoutineTemplates, WeeklyPlan } from '@/lib/types'
import { getSession } from './session'

/** The repeating week, always 7 entries (Monday first); days without a row are rest days. */
export const getWeeklyPlan = cache(async (): Promise<WeeklyPlan> => {
  const { user, supabase } = await getSession()
  const { data, error } = await supabase
    .from('weekly_plans')
    .select('day_of_week, split')
    .eq('user_id', user.id)
  if (error) throw new Error(`Could not load the weekly plan: ${error.message}`)

  const plan: WeeklyPlan = Array.from({ length: 7 }, () => REST_DAY)
  for (const row of data) {
    if (row.day_of_week >= 0 && row.day_of_week < 7 && isSplitType(row.split)) plan[row.day_of_week] = row.split
  }
  return plan
})

/** Splits chosen for specific dates in [from, to]. */
export async function getDatePlans(from: IsoDate, to: IsoDate): Promise<DatePlans> {
  const { user, supabase } = await getSession()
  const { data, error } = await supabase
    .from('workout_logs')
    .select('date, split')
    .eq('user_id', user.id)
    .gte('date', from)
    .lte('date', to)
  if (error) throw new Error(`Could not load the schedule: ${error.message}`)

  const plans: DatePlans = {}
  for (const row of data) {
    if (isSplitType(row.split)) plans[row.date] = row.split
  }
  return plans
}

export const getRoutineTemplates = cache(async (): Promise<RoutineTemplates> => {
  const { user, supabase } = await getSession()
  const { data, error } = await supabase
    .from('routine_templates')
    .select('split, exercise_ids')
    .eq('user_id', user.id)
  if (error) throw new Error(`Could not load your routines: ${error.message}`)

  const templates: RoutineTemplates = {}
  for (const row of data) {
    if (isWorkoutSplit(row.split)) templates[row.split] = row.exercise_ids ?? []
  }
  return templates
})
