'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { parseWeeklyPlan, serializeWeeklyPlan, PlannedExerciseItem } from '@/lib/types'

export async function addExerciseToPlan(dayOfWeek: number, exercise: PlannedExerciseItem) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: existingPlan } = await supabase
    .from('weekly_plans')
    .select('id, workout_name')
    .eq('user_id', user.id)
    .eq('day_of_week', dayOfWeek)
    .maybeSingle()

  const current = parseWeeklyPlan(existingPlan?.workout_name)

  // Avoid duplicates in the same day
  if (current.exercises.some((e) => e.id === exercise.id)) {
    return { success: true, message: 'Exercițiul este deja în plan' }
  }

  const updatedExercises = [...current.exercises, exercise]
  const serialized = serializeWeeklyPlan(current.split, updatedExercises)

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
    console.error('Error adding exercise to plan:', error)
    throw new Error('Eroare la adăugarea exercițiului')
  }

  revalidatePath('/plan')
  revalidatePath('/schedule')
  revalidatePath('/tracker')
  revalidatePath('/dashboard')

  return { success: true }
}

export async function removeExerciseFromPlan(dayOfWeek: number, exerciseId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: existingPlan } = await supabase
    .from('weekly_plans')
    .select('id, workout_name')
    .eq('user_id', user.id)
    .eq('day_of_week', dayOfWeek)
    .maybeSingle()

  if (!existingPlan) return { success: true }

  const current = parseWeeklyPlan(existingPlan.workout_name)
  const updatedExercises = current.exercises.filter((e) => e.id !== exerciseId)
  const serialized = serializeWeeklyPlan(current.split, updatedExercises)

  const { error } = await supabase
    .from('weekly_plans')
    .update({ workout_name: serialized })
    .eq('id', existingPlan.id)

  if (error) {
    console.error('Error removing exercise from plan:', error)
    throw new Error('Eroare la ștergerea exercițiului')
  }

  revalidatePath('/plan')
  revalidatePath('/schedule')
  revalidatePath('/tracker')
  revalidatePath('/dashboard')

  return { success: true }
}
