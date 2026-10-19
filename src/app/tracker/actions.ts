'use server'

import { createClient } from '@/utils/supabase/server'
import { getAuthUser } from '@/utils/supabase/auth-user'
import { revalidatePath } from 'next/cache'
import {
  parseWeeklyPlan,
  parseCalendarWorkout,
  serializeCalendarWorkout,
  getExercisesForSplit,
} from '@/lib/types'
import { getRoutineTemplates } from '@/app/plan/actions'

export async function getTodayWorkoutLog() {
  const supabase = await createClient()
  const user = await getAuthUser()
  if (!user) return null

  const now = new Date()
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  const dayOfWeek = (now.getDay() + 6) % 7 // Monday = 0, Sunday = 6

  // 1. Fetch today's log from workout_logs table (which holds calendar entries)
  const { data: existingLog } = await supabase
    .from('workout_logs')
    .select('*, workout_sets(*)')
    .eq('user_id', user.id)
    .eq('date', today)
    .maybeSingle()

  const parsedLog = parseCalendarWorkout(existingLog?.workout_name)

  let split = ''
  let workStatus = parsedLog.workStatus

  // Prioritize calendar split if set
  if (parsedLog.split) {
    split = parsedLog.split
  } else {
    // Fall back to recurring weekly schedule
    const { data: planned } = await supabase
      .from('weekly_plans')
      .select('workout_name')
      .eq('user_id', user.id)
      .eq('day_of_week', dayOfWeek)
      .maybeSingle()

    split = parseWeeklyPlan(planned?.workout_name).split
  }

  const isRestDay =
    !split ||
    split.toLowerCase().includes('rest') ||
    split.toLowerCase().includes('pauz') ||
    split.toLowerCase().includes('odihn')

  // Retrieve exercises for this split from user templates
  const userTemplates = await getRoutineTemplates()
  const exercises = getExercisesForSplit(split, userTemplates)

  if (existingLog) {
    // If the log exists but has no sets yet and we have planned exercises, auto-seed Set 1 for each
    if (
      (!existingLog.workout_sets || existingLog.workout_sets.length === 0) &&
      exercises.length > 0 &&
      !isRestDay
    ) {
      const setsToInsert = exercises.map((ex) => ({
        workout_log_id: existingLog.id,
        exercise_id: ex.id,
        exercise_name: ex.name,
        set_number: 1,
        target_reps: 10,
        target_weight: 0,
        actual_reps: 10,
        actual_weight: 0,
        is_completed: false,
      }))

      await supabase.from('workout_sets').insert(setsToInsert)

      // Re-fetch updated log
      const { data: reloadedLog } = await supabase
        .from('workout_logs')
        .select('*, workout_sets(*)')
        .eq('id', existingLog.id)
        .single()

      return {
        ...reloadedLog,
        splitName: split,
        workStatus,
        isRestDay: false,
        plannedExercises: exercises,
      }
    }

    return {
      ...existingLog,
      splitName: split,
      workStatus,
      isRestDay,
      plannedExercises: exercises,
    }
  }

  // If today is a Rest Day and no log exists yet, return rest state
  if (isRestDay) {
    return {
      id: null,
      date: today,
      workout_name: 'Rest Day',
      splitName: 'Rest Day',
      workStatus,
      isRestDay: true,
      plannedExercises: [],
      workout_sets: [],
    }
  }

  // Otherwise, create a new workout log for today
  const workoutName = serializeCalendarWorkout(split as any, workStatus)
  const { data: newLog, error } = await supabase
    .from('workout_logs')
    .insert({
      user_id: user.id,
      date: today,
      workout_name: workoutName,
    })
    .select('*')
    .single()

  if (error || !newLog) {
    console.error('Error creating workout log:', error)
    return null
  }

  // Auto-populate Set 1 for each planned exercise
  if (exercises.length > 0) {
    const setsToInsert = exercises.map((ex) => ({
      workout_log_id: newLog.id,
      exercise_id: ex.id,
      exercise_name: ex.name,
      set_number: 1,
      target_reps: 10,
      target_weight: 0,
      actual_reps: 10,
      actual_weight: 0,
      is_completed: false,
    }))

    await supabase.from('workout_sets').insert(setsToInsert)
  }

  // Fetch complete created log
  const { data: completeLog } = await supabase
    .from('workout_logs')
    .select('*, workout_sets(*)')
    .eq('id', newLog.id)
    .single()

  return {
    ...completeLog,
    splitName: split,
    workStatus,
    isRestDay: false,
    plannedExercises: exercises,
  }
}

export async function startAdHocWorkout() {
  const supabase = await createClient()
  const user = await getAuthUser()
  if (!user) throw new Error('Not authenticated')

  const now = new Date()
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`

  const { data: newLog, error } = await supabase
    .from('workout_logs')
    .insert({
      user_id: user.id,
      date: today,
      workout_name: serializeCalendarWorkout('Full Body', 'none'),
    })
    .select('*, workout_sets(*)')
    .single()

  if (error) {
    console.error('Error starting ad-hoc workout:', error)
    throw new Error('Eroare la crearea antrenamentului')
  }

  revalidatePath('/tracker')
  revalidatePath('/dashboard')
  return newLog
}

export async function addExerciseSet(
  workoutLogId: string,
  exerciseId: string,
  exerciseName: string,
  copyWeight = 0,
  copyReps = 10
) {
  const supabase = await createClient()

  // Find highest set number for this exercise in this log
  const { data: existingSets } = await supabase
    .from('workout_sets')
    .select('set_number, actual_weight, actual_reps')
    .eq('workout_log_id', workoutLogId)
    .eq('exercise_id', exerciseId)
    .order('set_number', { ascending: false })
    .limit(1)

  const nextSetNumber = existingSets && existingSets.length > 0 ? existingSets[0].set_number + 1 : 1
  const defaultWeight = existingSets && existingSets.length > 0 ? existingSets[0].actual_weight : copyWeight
  const defaultReps = existingSets && existingSets.length > 0 ? existingSets[0].actual_reps : copyReps

  const { data: newSet, error } = await supabase
    .from('workout_sets')
    .insert({
      workout_log_id: workoutLogId,
      exercise_id: exerciseId,
      exercise_name: exerciseName,
      set_number: nextSetNumber,
      target_reps: defaultReps,
      target_weight: defaultWeight,
      actual_reps: defaultReps,
      actual_weight: defaultWeight,
      is_completed: false,
    })
    .select('*')
    .single()

  if (error) {
    console.error('Error adding set:', error)
    throw error
  }

  revalidatePath('/tracker')
  revalidatePath('/dashboard')
  return newSet
}

export async function updateSet(
  setId: string,
  data: { actual_reps?: number; actual_weight?: number; is_completed?: boolean }
) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('workout_sets')
    .update(data)
    .eq('id', setId)

  if (error) console.error('Error updating set:', error)
  revalidatePath('/tracker')
  revalidatePath('/dashboard')
}

export async function removeSet(setId: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('workout_sets')
    .delete()
    .eq('id', setId)

  if (error) console.error('Error removing set:', error)
  revalidatePath('/tracker')
  revalidatePath('/dashboard')
}
