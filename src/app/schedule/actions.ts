'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import {
  parseWeeklyPlan,
  serializeWeeklyPlan,
  SplitType,
  getExercisesForSplit,
  RoutineTemplatesMap,
  DEFAULT_ROUTINE_TEMPLATES,
} from '@/lib/types'

export async function getWeeklyPlans() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('weekly_plans')
    .select('*')
    .eq('user_id', user.id)
    .order('day_of_week', { ascending: true })

  if (error) {
    console.error('Error fetching weekly plans:', error)
    return []
  }

  return data
}

export async function updateDaySplit(dayOfWeek: number, newSplit: SplitType) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // Fetch current plan for this day
  const { data: existingPlan } = await supabase
    .from('weekly_plans')
    .select('id, workout_name')
    .eq('user_id', user.id)
    .eq('day_of_week', dayOfWeek)
    .maybeSingle()

  // Get master exercises for this split from user's configured templates
  const userTemplates = (user.user_metadata?.routine_templates as RoutineTemplatesMap) || DEFAULT_ROUTINE_TEMPLATES
  const exercises = getExercisesForSplit(newSplit, userTemplates)

  const serialized = serializeWeeklyPlan(newSplit, exercises)

  let error
  if (existingPlan) {
    const { error: updateError } = await supabase
      .from('weekly_plans')
      .update({ workout_name: serialized })
      .eq('id', existingPlan.id)
    error = updateError
  } else {
    const { error: insertError } = await supabase
      .from('weekly_plans')
      .insert({
        user_id: user.id,
        day_of_week: dayOfWeek,
        workout_name: serialized,
      })
    error = insertError
  }

  if (error) {
    console.error('Error updating day split:', error)
    throw new Error('Nu s-a putut salva programul.')
  }

  revalidatePath('/schedule')
  revalidatePath('/calendar')
  revalidatePath('/plan')
  revalidatePath('/planner')
  revalidatePath('/tracker')
  revalidatePath('/dashboard')

  return { success: true }
}
