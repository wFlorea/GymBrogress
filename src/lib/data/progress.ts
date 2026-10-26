import 'server-only'
import { cache } from 'react'
import { getExercise } from '@/lib/exercises-data'
import type { ExerciseHistory, IsoDate, WorkoutBest } from '@/lib/types'
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

/** Rows per request; PostgREST returns at most 1000 at a time. */
const PAGE_SIZE = 1000

/** The heaviest completed set of an exercise in each workout it was done in, oldest first. */
export async function getWorkoutBests(exerciseId: string): Promise<WorkoutBest[]> {
  const { user, supabase } = await getSession()
  const bests = new Map<IsoDate, number>()

  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await supabase
      .from('workout_sets')
      .select('actual_weight, workout_logs!inner(date)')
      .eq('workout_logs.user_id', user.id)
      .eq('exercise_id', exerciseId)
      .eq('is_completed', true)
      .order('id')
      .range(from, from + PAGE_SIZE - 1)
    if (error) throw new Error(`Could not load your progress: ${error.message}`)

    // Each set belongs to one log (one per date), so the embedded log is a single object.
    const rows = data as unknown as { actual_weight: number | string | null; workout_logs: { date: IsoDate } }[]
    for (const { actual_weight, workout_logs } of rows) {
      const weight = Number(actual_weight ?? 0)
      bests.set(workout_logs.date, Math.max(weight, bests.get(workout_logs.date) ?? 0))
    }
    if (rows.length < PAGE_SIZE) break
  }

  return [...bests]
    .map(([date, maxWeight]) => ({ date, maxWeight }))
    .sort((a, b) => a.date.localeCompare(b.date))
}
