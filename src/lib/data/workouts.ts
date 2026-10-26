import 'server-only'
import { cache } from 'react'
import { REST_DAY, isSplitType } from '@/lib/splits'
import type { DaySummary, IsoDate, WorkoutDay, WorkoutSet } from '@/lib/types'
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

/** Every logged or planned day, with set counts, for streaks and stats. */
export const getWorkoutHistory = cache(async (): Promise<DaySummary[]> => {
  const { user, supabase } = await getSession()
  const { data, error } = await supabase
    .from('workout_logs')
    .select('date, split, finished_at, workout_sets(is_completed)')
    .eq('user_id', user.id)
    .order('date')
  if (error) throw new Error(`Could not load your workout history: ${error.message}`)

  return data.map((row) => {
    const sets: { is_completed: boolean | null }[] = row.workout_sets ?? []
    return {
      date: row.date,
      split: isSplitType(row.split) ? row.split : REST_DAY,
      totalSets: sets.length,
      completedSets: sets.filter((s) => s.is_completed).length,
      finished: row.finished_at !== null,
    }
  })
})
