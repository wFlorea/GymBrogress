'use server'

import { createClient } from '@/utils/supabase/server'
import { getAuthUser } from '@/utils/supabase/auth-user'
import { revalidatePath } from 'next/cache'
import {
  PlannedExerciseItem,
  RoutineTemplatesMap,
  DEFAULT_ROUTINE_TEMPLATES,
  SPLIT_INDEX_MAP,
  parseWeeklyPlan,
  serializeWeeklyPlan,
} from '@/lib/types'

export async function getRoutineTemplates(): Promise<RoutineTemplatesMap> {
  const supabase = await createClient()
  const user = await getAuthUser()
  if (!user) return DEFAULT_ROUTINE_TEMPLATES

  // Fetch templates from weekly_plans where day_of_week >= 100
  const { data: dbTemplates, error } = await supabase
    .from('weekly_plans')
    .select('day_of_week, workout_name')
    .eq('user_id', user.id)
    .gte('day_of_week', 100)

  if (error) {
    console.error('Error fetching routine templates from DB:', error)
  }

  const result: RoutineTemplatesMap = { ...DEFAULT_ROUTINE_TEMPLATES }

  if (dbTemplates && dbTemplates.length > 0) {
    for (const row of dbTemplates) {
      const splitKey = Object.keys(SPLIT_INDEX_MAP).find(
        (k) => SPLIT_INDEX_MAP[k] === row.day_of_week
      )
      if (splitKey) {
        const parsed = parseWeeklyPlan(row.workout_name)
        if (parsed.exercises && parsed.exercises.length > 0) {
          result[splitKey] = parsed.exercises
        }
      }
    }
  }

  return result
}

export async function addExerciseToSplitTemplate(splitKey: string, exercise: PlannedExerciseItem) {
  const supabase = await createClient()
  const user = await getAuthUser()
  if (!user) throw new Error('Not authenticated')

  const currentTemplates = await getRoutineTemplates()
  const splitExercises = currentTemplates[splitKey] || []

  // Prevent duplicates in same split
  if (splitExercises.some((e) => e.id === exercise.id)) {
    return { success: true, message: 'Exercițiul este deja în această rutină' }
  }

  const updatedExercises = [...splitExercises, exercise]
  const splitIndex = SPLIT_INDEX_MAP[splitKey] || 100
  const serialized = serializeWeeklyPlan(splitKey, updatedExercises)

  // 1. Upsert template into weekly_plans table (day_of_week >= 100)
  const { data: existingTemplate } = await supabase
    .from('weekly_plans')
    .select('id')
    .eq('user_id', user.id)
    .eq('day_of_week', splitIndex)
    .maybeSingle()

  if (existingTemplate) {
    await supabase
      .from('weekly_plans')
      .update({ workout_name: serialized })
      .eq('id', existingTemplate.id)
  } else {
    await supabase
      .from('weekly_plans')
      .insert({
        user_id: user.id,
        day_of_week: splitIndex,
        workout_name: serialized,
      })
  }

  // 2. Cascade update to any recurring day (0..6) that uses this split
  try {
    const { data: weeklyPlans } = await supabase
      .from('weekly_plans')
      .select('id, day_of_week, workout_name')
      .eq('user_id', user.id)
      .gte('day_of_week', 0)
      .lte('day_of_week', 6)

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
  const user = await getAuthUser()
  if (!user) throw new Error('Not authenticated')

  const currentTemplates = await getRoutineTemplates()
  const splitExercises = currentTemplates[splitKey] || []
  const updatedExercises = splitExercises.filter((e) => e.id !== exerciseId)

  const splitIndex = SPLIT_INDEX_MAP[splitKey] || 100
  const serialized = serializeWeeklyPlan(splitKey, updatedExercises)

  // 1. Upsert template into weekly_plans table
  const { data: existingTemplate } = await supabase
    .from('weekly_plans')
    .select('id')
    .eq('user_id', user.id)
    .eq('day_of_week', splitIndex)
    .maybeSingle()

  if (existingTemplate) {
    await supabase
      .from('weekly_plans')
      .update({ workout_name: serialized })
      .eq('id', existingTemplate.id)
  } else {
    await supabase
      .from('weekly_plans')
      .insert({
        user_id: user.id,
        day_of_week: splitIndex,
        workout_name: serialized,
      })
  }

  // 2. Cascade update to recurring days (0..6)
  try {
    const { data: weeklyPlans } = await supabase
      .from('weekly_plans')
      .select('id, day_of_week, workout_name')
      .eq('user_id', user.id)
      .gte('day_of_week', 0)
      .lte('day_of_week', 6)

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
