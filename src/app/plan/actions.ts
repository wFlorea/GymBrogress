'use server'

import { revalidatePath } from 'next/cache'
import { getExercise } from '@/lib/exercises-data'
import { MAX_SETS_PER_EXERCISE, MIN_SETS_PER_EXERCISE, isValidSetCount } from '@/lib/sets'
import { WORKOUT_SPLIT_OPTIONS, isWorkoutSplit } from '@/lib/splits'
import { dbFail, fail, ok } from '@/lib/data/action-result'
import { getSession } from '@/lib/data/session'
import type { ActionResult, RoutineItem, WorkoutSplit } from '@/lib/types'

const MAX_ROUTINE_EXERCISES = 30

function revalidateRoutines() {
  revalidatePath('/plan')
  revalidatePath('/schedule')
  revalidatePath('/dashboard')
  revalidatePath('/tracker')
}

/** Replaces a split's routine: its exercises in order, each with its number of sets. */
export async function saveRoutine(split: WorkoutSplit, items: RoutineItem[]): Promise<ActionResult> {
  if (!isWorkoutSplit(split)) return fail('Unknown workout type.')
  if (!Array.isArray(items) || !items.every((item) => typeof item?.exerciseId === 'string' && getExercise(item.exerciseId))) {
    return fail('Unknown exercise.')
  }
  if (!items.every((item) => isValidSetCount(item.sets))) {
    return fail(`Each exercise needs ${MIN_SETS_PER_EXERCISE} to ${MAX_SETS_PER_EXERCISE} sets.`)
  }
  const unique = [...new Map(items.map((item) => [item.exerciseId, item.sets])).entries()]
  if (unique.length > MAX_ROUTINE_EXERCISES) return fail(`A routine can have at most ${MAX_ROUTINE_EXERCISES} exercises.`)

  const { user, supabase } = await getSession()
  const { error } = await supabase.from('routine_templates').upsert(
    {
      user_id: user.id,
      split,
      exercise_ids: unique.map(([id]) => id),
      exercise_sets: Object.fromEntries(unique),
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,split' }
  )
  if (error) return dbFail('saveRoutine', error, 'Could not save the routine. Please try again.')

  revalidateRoutines()
  return ok()
}

/** Goes back to the app's default exercises for a split. */
export async function resetRoutine(split: WorkoutSplit): Promise<ActionResult> {
  if (!isWorkoutSplit(split)) return fail('Unknown workout type.')

  const { user, supabase } = await getSession()
  const { error } = await supabase.from('routine_templates').delete().eq('user_id', user.id).eq('split', split)
  if (error) return dbFail('resetRoutine', error, 'Could not reset the routine. Please try again.')

  revalidateRoutines()
  return ok()
}

/** Saves the order the routines are listed in. */
export async function saveSplitOrder(order: WorkoutSplit[]): Promise<ActionResult> {
  const valid =
    Array.isArray(order) &&
    order.length === WORKOUT_SPLIT_OPTIONS.length &&
    order.every(isWorkoutSplit) &&
    new Set(order).size === order.length
  if (!valid) return fail('Invalid order.')

  const { user, supabase } = await getSession()
  const { error } = await supabase
    .from('user_settings')
    .upsert({ user_id: user.id, split_order: order, updated_at: new Date().toISOString() }, { onConflict: 'user_id' })
  if (error) return dbFail('saveSplitOrder', error, 'Could not save the order. Please try again.')

  revalidatePath('/plan')
  return ok()
}
