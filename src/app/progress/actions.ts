'use server'

import { revalidatePath } from 'next/cache'
import { getExercise } from '@/lib/exercises-data'
import { dbFail, fail, ok } from '@/lib/data/action-result'
import { getSession } from '@/lib/data/session'
import { getUserSettings } from '@/lib/data/settings'
import type { ActionResult } from '@/lib/types'

const MAX_TRACKED_EXERCISES = 30

/** Pins an exercise to the top of the Progress page, or unpins it. */
export async function setTracked(exerciseId: string, tracked: boolean): Promise<ActionResult> {
  if (typeof exerciseId !== 'string' || !getExercise(exerciseId)) return fail('Unknown exercise.')
  if (typeof tracked !== 'boolean') return fail('Invalid value.')

  const [{ user, supabase }, settings] = await Promise.all([getSession(), getUserSettings()])
  const others = settings.trackedExerciseIds.filter((id) => id !== exerciseId)
  const next = tracked ? [...others, exerciseId] : others
  if (next.length > MAX_TRACKED_EXERCISES) return fail(`You can track up to ${MAX_TRACKED_EXERCISES} exercises.`)

  const { error } = await supabase
    .from('user_settings')
    .upsert({ user_id: user.id, tracked_exercise_ids: next, updated_at: new Date().toISOString() }, { onConflict: 'user_id' })
  if (error) return dbFail('setTracked', error, 'Could not save your list. Please try again.')

  revalidatePath('/progress')
  return ok()
}
