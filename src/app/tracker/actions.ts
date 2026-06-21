'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

// Get today's active workout log or create one
export async function getTodayWorkoutLog() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD

  // Check if we already have a log for today
  const { data: existingLog } = await supabase
    .from('workout_logs')
    .select('*, workout_sets(*)')
    .eq('user_id', user.id)
    .eq('date', today)
    .single()

  if (existingLog) return existingLog

  // If not, let's see what's planned for today
  const dayOfWeek = (new Date().getDay() + 6) % 7 // Convert Sun=0,Mon=1 to Mon=0,Sun=6
  const { data: planned } = await supabase
    .from('weekly_plans')
    .select('workout_name')
    .eq('user_id', user.id)
    .eq('day_of_week', dayOfWeek)
    .single()

  const workoutName = planned?.workout_name || 'Antrenament Ad-hoc'

  // Create new log
  const { data: newLog, error } = await supabase
    .from('workout_logs')
    .insert({
      user_id: user.id,
      date: today,
      workout_name: workoutName
    })
    .select('*, workout_sets(*)')
    .single()

  if (error) {
    console.error('Error creating workout log:', error)
    return null
  }

  return newLog
}

export async function addExerciseSet(workoutLogId: string, exerciseId: string, exerciseName: string) {
  const supabase = await createClient()
  
  // Find highest set number for this exercise in this log
  const { data: existingSets } = await supabase
    .from('workout_sets')
    .select('set_number')
    .eq('workout_log_id', workoutLogId)
    .eq('exercise_id', exerciseId)
    .order('set_number', { ascending: false })
    .limit(1)

  const nextSetNumber = existingSets && existingSets.length > 0 ? existingSets[0].set_number + 1 : 1

  const { error } = await supabase
    .from('workout_sets')
    .insert({
      workout_log_id: workoutLogId,
      exercise_id: exerciseId,
      exercise_name: exerciseName,
      set_number: nextSetNumber,
      target_reps: 8,
      target_weight: 0,
      actual_reps: 8,
      actual_weight: 0,
      is_completed: false
    })

  if (error) console.error('Error adding set:', error)
  revalidatePath('/tracker')
}

export async function updateSet(setId: string, data: { actual_reps?: number, actual_weight?: number, is_completed?: boolean }) {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('workout_sets')
    .update(data)
    .eq('id', setId)

  if (error) console.error('Error updating set:', error)
  revalidatePath('/tracker')
}

export async function removeSet(setId: string) {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('workout_sets')
    .delete()
    .eq('id', setId)

  if (error) console.error('Error removing set:', error)
  revalidatePath('/tracker')
}
