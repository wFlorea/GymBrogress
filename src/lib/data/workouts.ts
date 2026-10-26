import 'server-only'
import { cache } from 'react'
import { REST_DAY, isSplitType } from '@/lib/splits'
import type { DaySummary, IsoDate, SetValues, WorkoutDay, WorkoutSet } from '@/lib/types'
import { getSession } from './session'

export const SET_COLUMNS = 'id, exercise_id, exercise_name, set_number, actual_reps, actual_weight, is_completed'

interface SetRow {
  id: string
  exercise_id: string
  exercise_name: string
  set_number: number
  actual_reps: number | null
  actual_weight: number | string | null
  is_completed: boolean | null
}

export function toWorkoutSet(row: SetRow): WorkoutSet {
  return {
    id: row.id,
    exercise_id: row.exercise_id,
    exercise_name: row.exercise_name,
    set_number: row.set_number,
    actual_reps: Number(row.actual_reps ?? 0),
    actual_weight: Number(row.actual_weight ?? 0),
    is_completed: Boolean(row.is_completed),
  }
}

/** Sets in the order they should be shown: by when the exercise was added, then by set number. */
export function sortSets(sets: WorkoutSet[]): WorkoutSet[] {
  const firstSeen = new Map<string, number>()
  sets.forEach((s, i) => {
    if (!firstSeen.has(s.exercise_id)) firstSeen.set(s.exercise_id, i)
  })
  return [...sets].sort(
    (a, b) => firstSeen.get(a.exercise_id)! - firstSeen.get(b.exercise_id)! || a.set_number - b.set_number
  )
}

export const getWorkoutDay = cache(async (date: IsoDate): Promise<WorkoutDay | null> => {
  const { user, supabase } = await getSession()
  const { data, error } = await supabase
    .from('workout_logs')
    .select(`id, date, split, finished_at, workout_sets(${SET_COLUMNS}, created_at)`)
    .eq('user_id', user.id)
    .eq('date', date)
    .order('created_at', { referencedTable: 'workout_sets' })
    .maybeSingle()
  if (error) throw new Error(`Could not load the workout: ${error.message}`)
  if (!data) return null

  return {
    id: data.id,
    date: data.date,
    split: isSplitType(data.split) ? data.split : REST_DAY,
    finished_at: data.finished_at,
    sets: sortSets((data.workout_sets ?? []).map(toWorkoutSet)),
  }
})

/** Rows read per lookup; enough for the last few sessions of every exercise in a routine. */
const LAST_PERFORMANCE_ROWS = 500

/**
 * Reps and weight of each exercise's completed sets from the last day before `before` it was
 * done, in set order, so new sets can start from what the user lifted last time.
 */
export async function getLastPerformance(exerciseIds: string[], before: IsoDate): Promise<Map<string, SetValues[]>> {
  const result = new Map<string, SetValues[]>()
  if (exerciseIds.length === 0) return result

  const { user, supabase } = await getSession()
  const { data, error } = await supabase
    .from('workout_sets')
    .select('exercise_id, set_number, actual_reps, actual_weight, workout_logs!inner(date)')
    .eq('workout_logs.user_id', user.id)
    .lt('workout_logs.date', before)
    .in('exercise_id', exerciseIds)
    .eq('is_completed', true)
    .order('created_at', { ascending: false })
    .limit(LAST_PERFORMANCE_ROWS)
  if (error) throw new Error(`Could not load your previous sets: ${error.message}`)

  // Each set belongs to one log, so the embedded log is a single object.
  const rows = data as unknown as (Omit<SetRow, 'id' | 'exercise_name' | 'is_completed'> & { workout_logs: { date: IsoDate } })[]
  const lastDates = new Map<string, IsoDate>()
  for (const row of rows) {
    const date = row.workout_logs.date
    if (date > (lastDates.get(row.exercise_id) ?? '')) lastDates.set(row.exercise_id, date)
  }
  const lastSets = rows
    .filter((row) => row.workout_logs.date === lastDates.get(row.exercise_id))
    .sort((a, b) => a.set_number - b.set_number)
  for (const row of lastSets) {
    const values = { actual_reps: Number(row.actual_reps ?? 0), actual_weight: Number(row.actual_weight ?? 0) }
    result.set(row.exercise_id, [...(result.get(row.exercise_id) ?? []), values])
  }
  return result
}

/** Every logged or planned day, with set counts, for streaks and stats. */
export const getWorkoutHistory = cache(async (): Promise<DaySummary[]> => {
  const { user, supabase } = await getSession()
  const { data, error } = await supabase
    .from('workout_logs')
    .select('date, split, finished_at, workout_sets(exercise_id, is_completed)')
    .eq('user_id', user.id)
    .order('date')
  if (error) throw new Error(`Could not load your workout history: ${error.message}`)

  return data.map((row) => {
    const sets: { exercise_id: string; is_completed: boolean | null }[] = row.workout_sets ?? []
    const exerciseIds = new Set(sets.map((s) => s.exercise_id))
    const unfinishedIds = new Set(sets.filter((s) => !s.is_completed).map((s) => s.exercise_id))
    return {
      date: row.date,
      split: isSplitType(row.split) ? row.split : REST_DAY,
      totalSets: sets.length,
      completedSets: sets.filter((s) => s.is_completed).length,
      totalExercises: exerciseIds.size,
      completedExercises: exerciseIds.size - unfinishedIds.size,
      finished: row.finished_at !== null,
    }
  })
})
