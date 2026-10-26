import 'server-only'
import { cache } from 'react'
import { getExercise } from '@/lib/exercises-data'
import type { ExerciseHistory, MonthlyBest } from '@/lib/types'
import { getSession } from './session'

/** Every exercise with a completed set, most recently done first (aggregated by a database view). */
export const getExerciseHistory = cache(async (): Promise<ExerciseHistory[]> => {
  const { user, supabase } = await getSession()
  const { data, error } = await supabase
    .from('exercise_history')
    .select('exercise_id, exercise_name, best_weight, last_date')
    .eq('user_id', user.id)
    .order('last_date', { ascending: false })
  if (error) throw new Error(`Could not load your exercises: ${error.message}`)

  return data.map((row) => ({
    exerciseId: row.exercise_id,
    name: getExercise(row.exercise_id)?.name ?? row.exercise_name,
    bestWeight: Number(row.best_weight ?? 0),
    lastDate: row.last_date,
  }))
})

/** The heaviest completed set of an exercise in each month it was done, oldest first. */
export async function getMonthlyBests(exerciseId: string): Promise<MonthlyBest[]> {
  const { user, supabase } = await getSession()
  const { data, error } = await supabase
    .from('exercise_monthly_bests')
    .select('month, max_weight')
    .eq('user_id', user.id)
    .eq('exercise_id', exerciseId)
    .order('month')
  if (error) throw new Error(`Could not load your progress: ${error.message}`)

  return data.map((row) => ({ month: row.month, maxWeight: Number(row.max_weight ?? 0) }))
}

/** `YYYY-MM` the account was created in, or null if the auth server can't be reached. */
export async function getAccountStartMonth(): Promise<string | null> {
  const { supabase } = await getSession()
  const { data } = await supabase.auth.getUser()
  return data.user?.created_at?.slice(0, 7) ?? null
}
