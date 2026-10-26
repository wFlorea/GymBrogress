import 'server-only'
import { cache } from 'react'
import { isWorkoutSplit } from '@/lib/splits'
import type { UserSettings } from '@/lib/types'
import { getSession } from './session'

/** The user's preferences; users without a row get the defaults. */
export const getUserSettings = cache(async (): Promise<UserSettings> => {
  const { user, supabase } = await getSession()
  const { data, error } = await supabase
    .from('user_settings')
    .select('split_order, tracked_exercise_ids')
    .eq('user_id', user.id)
    .maybeSingle()
  if (error) throw new Error(`Could not load your settings: ${error.message}`)

  return {
    splitOrder: (data?.split_order ?? []).filter(isWorkoutSplit),
    trackedExerciseIds: data?.tracked_exercise_ids ?? [],
  }
})
