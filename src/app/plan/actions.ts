'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import {
  PlannedExerciseItem,
  RoutineTemplatesMap,
  DEFAULT_ROUTINE_TEMPLATES,
  parseWeeklyPlan,
  serializeWeeklyPlan,
} from '@/lib/types'

export async function getRoutineTemplates(): Promise<RoutineTemplatesMap> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return DEFAULT_ROUTINE_TEMPLATES

  const userTemplates = user.user_metadata?.routine_templates as RoutineTemplatesMap | undefined
  if (!userTemplates || Object.keys(userTemplates).length === 0) {
    return DEFAULT_ROUTINE_TEMPLATES
  }

  // Merge with defaults so any missing split still has defaults
  return {
    ...DEFAULT_ROUTINE_TEMPLATES,
    ...userTemplates,
  }
}

export async function addExerciseToSplitTemplate(splitKey: string, exercise: PlannedExerciseItem) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const currentTemplates = await getRoutineTemplates()
  const splitExercises = currentTemplates[splitKey] || []

  // Prevent duplicates in same split
  if (splitExercises.some((e) => e.id === exercise.id)) {
    return { success: true, message: 'Exercițiul este deja în această rutină' }
  }

  const updatedExercises = [...splitExercises, exercise]
  const updatedTemplates: RoutineTemplatesMap = {
    ...currentTemplates,
    [splitKey]: updatedExercises,
  }

  // 1. Update user metadata
  const { error: userMetaError } = await supabase.auth.updateUser({
    data: { routine_templates: updatedTemplates },
  })

  if (userMetaError) {
    console.error('Error saving routine templates:', userMetaError)
  }

  // 2. Cascade update to any day in weekly_plans that uses this split
  try {
    const { data: weeklyPlans } = await supabase
      .from('weekly_plans')
      .select('id, day_of_week, workout_name')
      .eq('user_id', user.id)

    if (weeklyPlans && weeklyPlans.length > 0) {
      for (const p of weeklyPlans) {
        const parsed = parseWeeklyPlan(p.workout_name)
        if (
          parsed.split.toLowerCase() === splitKey.toLowerCase() ||
          parsed.split.toLowerCase().startsWith(splitKey.toLowerCase())
        ) {
          const newWorkoutName = serializeWeeklyPlan(parsed.split, updatedExercises)
          await supabase
            .from('weekly_plans')
            .update({ workout_name: newWorkoutName })
            .eq('id', p.id)
        }
      }
    }
  } catch (syncErr) {
    console.error('Error syncing weekly plans with template:', syncErr)
  }

  revalidatePath('/plan')
  revalidatePath('/schedule')
  revalidatePath('/calendar')
  revalidatePath('/tracker')
  revalidatePath('/dashboard')

  return { success: true }
}

export async function removeExerciseFromSplitTemplate(splitKey: string, exerciseId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const currentTemplates = await getRoutineTemplates()
  const splitExercises = currentTemplates[splitKey] || []
  const updatedExercises = splitExercises.filter((e) => e.id !== exerciseId)

  const updatedTemplates: RoutineTemplatesMap = {
    ...currentTemplates,
    [splitKey]: updatedExercises,
  }

  // 1. Update user metadata
  const { error: userMetaError } = await supabase.auth.updateUser({
    data: { routine_templates: updatedTemplates },
  })

  if (userMetaError) {
    console.error('Error saving routine templates:', userMetaError)
  }

  // 2. Cascade update to weekly_plans
  try {
    const { data: weeklyPlans } = await supabase
      .from('weekly_plans')
      .select('id, day_of_week, workout_name')
      .eq('user_id', user.id)

    if (weeklyPlans && weeklyPlans.length > 0) {
      for (const p of weeklyPlans) {
        const parsed = parseWeeklyPlan(p.workout_name)
        if (
          parsed.split.toLowerCase() === splitKey.toLowerCase() ||
          parsed.split.toLowerCase().startsWith(splitKey.toLowerCase())
        ) {
          const newWorkoutName = serializeWeeklyPlan(parsed.split, updatedExercises)
          await supabase
            .from('weekly_plans')
            .update({ workout_name: newWorkoutName })
            .eq('id', p.id)
        }
      }
    }
  } catch (syncErr) {
    console.error('Error syncing weekly plans with template:', syncErr)
  }

  revalidatePath('/plan')
  revalidatePath('/schedule')
  revalidatePath('/calendar')
  revalidatePath('/tracker')
  revalidatePath('/dashboard')

  return { success: true }
}
