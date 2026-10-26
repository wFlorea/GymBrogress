'use server'

import { revalidatePath } from 'next/cache'
import { getExercise } from '@/lib/exercises-data'
import { isWorkoutSplit } from '@/lib/splits'
import { dbFail, fail, ok } from '@/lib/data/action-result'
import { getSession } from '@/lib/data/session'
import type { ActionResult, WorkoutSplit } from '@/lib/types'

const MAX_ROUTINE_EXERCISES = 30

function revalidateRoutines() {
  revalidatePath('/plan')
  revalidatePath('/schedule')
  revalidatePath('/dashboard')
  revalidatePath('/tracker')
}

/** Replaces a split's exercise list (ordered exercise ids). */
export async function saveRoutine(split: WorkoutSplit, exerciseIds: string[]): Promise<ActionResult> {
  if (!isWorkoutSplit(split)) return fail('Unknown workout type.')
  if (!Array.isArray(exerciseIds) || !exerciseIds.every((id) => typeof id === 'string' && getExercise(id))) {
    return fail('Unknown exercise.')
  }
  const ids = [...new Set(exerciseIds)]
  if (ids.length > MAX_ROUTINE_EXERCISES) return fail(`A routine can have at most ${MAX_ROUTINE_EXERCISES} exercises.`)

  const { user, supabase } = await getSession()
  const { error } = await supabase
    .from('routine_templates')
    .upsert(
      { user_id: user.id, split, exercise_ids: ids, updated_at: new Date().toISOString() },
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
