import 'server-only'
import { cache } from 'react'
import { getExercise } from '@/lib/exercises-data'
import { estimateOneRepMax } from '@/lib/sets'
import type { ExerciseHistory, IsoDate, MuscleGroup, MuscleGroupSets, WorkoutBest } from '@/lib/types'
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

/** Completed sets per muscle group in the workouts from `since` on, most first. */
export async function getSetsPerMuscleGroup(since: IsoDate): Promise<MuscleGroupSets[]> {
  const { user, supabase } = await getSession()
  // A week of sets fits in one request.
  const { data, error } = await supabase
    .from('workout_sets')
    .select('exercise_id, workout_logs!inner(date)')
    .eq('workout_logs.user_id', user.id)
    .gte('workout_logs.date', since)
    .eq('is_completed', true)
    .limit(PAGE_SIZE)
  if (error) throw new Error(`Could not load your sets: ${error.message}`)

  const counts = new Map<MuscleGroup, number>()
  for (const { exercise_id } of data) {
    const group = getExercise(exercise_id)?.muscle_group
    if (group) counts.set(group, (counts.get(group) ?? 0) + 1)
  }
  return [...counts].map(([group, sets]) => ({ group, sets })).sort((a, b) => b.sets - a.sets)
}

/** The heaviest completed set of an exercise in each workout it was done in, and its best one-rep max, oldest first. */
export async function getWorkoutBests(exerciseId: string): Promise<WorkoutBest[]> {
  const { user, supabase } = await getSession()
  const bests = new Map<IsoDate, WorkoutBest>()

  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await supabase
      .from('workout_sets')
      .select('actual_weight, actual_reps, workout_logs!inner(date)')
      .eq('workout_logs.user_id', user.id)
      .eq('exercise_id', exerciseId)
      .eq('is_completed', true)
      .order('id')
      .range(from, from + PAGE_SIZE - 1)
    if (error) throw new Error(`Could not load your progress: ${error.message}`)

    // Each set belongs to one log (one per date), so the embedded log is a single object.
    const rows = data as unknown as {
      actual_weight: number | string | null
      actual_reps: number | null
      workout_logs: { date: IsoDate }
    }[]
    for (const { actual_weight, actual_reps, workout_logs } of rows) {
      const { date } = workout_logs
      const weight = Number(actual_weight ?? 0)
      const oneRepMax = estimateOneRepMax(weight, actual_reps ?? 0)
      const best = bests.get(date) ?? { date, maxWeight: 0, oneRepMax: null }
      bests.set(date, {
        date,
        maxWeight: Math.max(weight, best.maxWeight),
        oneRepMax: oneRepMax === null ? best.oneRepMax : Math.max(oneRepMax, best.oneRepMax ?? 0),
      })
    }
    if (rows.length < PAGE_SIZE) break
  }

  return [...bests.values()].sort((a, b) => a.date.localeCompare(b.date))
}
