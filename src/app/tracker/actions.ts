'use server'

import { revalidatePath } from 'next/cache'
import { getExercise } from '@/lib/exercises-data'
import { resolveRoutine } from '@/lib/routines'
import { DEFAULT_REPS, DEFAULT_SETS_PER_EXERCISE, MAX_REPS, MAX_WEIGHT_KG } from '@/lib/sets'
import { isSplitType, isWorkoutSplit } from '@/lib/splits'
import { dbFail, fail, ok } from '@/lib/data/action-result'
import { getRoutineTemplates } from '@/lib/data/plans'
import { getSession, getToday } from '@/lib/data/session'
import { SET_COLUMNS, sortSets, toWorkoutSet } from '@/lib/data/workouts'
import type { ActionResult, Exercise, WorkoutSet, WorkoutSplit } from '@/lib/types'


/** The tracker keeps its own state after sync/finish, so it only needs a refresh on start. */
function revalidateWorkout({ tracker = false } = {}) {
  if (tracker) revalidatePath('/tracker')
  revalidatePath('/dashboard')
  revalidatePath('/schedule')
  revalidatePath('/profile')
}

function seedSets(logId: string, exercises: Exercise[]) {
  return exercises.flatMap((exercise) =>
    Array.from({ length: DEFAULT_SETS_PER_EXERCISE }, (_, i) => ({
      workout_log_id: logId,
      exercise_id: exercise.id,
      exercise_name: exercise.name,
      set_number: i + 1,
      actual_reps: DEFAULT_REPS,
      actual_weight: 0,
      is_completed: false,
    }))
  )
}

/** Starts today's workout with `split`, adding its routine if the day has no sets yet. */
export async function startWorkout(split: WorkoutSplit): Promise<ActionResult> {
  if (!isWorkoutSplit(split)) return fail('Unknown workout type.')

  const [{ user, supabase }, today, templates] = await Promise.all([
    getSession(),
    getToday(),
    getRoutineTemplates(),
  ])

  const { data: log, error } = await supabase
    .from('workout_logs')
    .upsert({ user_id: user.id, date: today, split }, { onConflict: 'user_id,date' })
    .select('id, workout_sets(count)')
    .single()
  if (error) return dbFail('startWorkout', error, 'Could not start the workout. Please try again.')

  const setCount: number = log.workout_sets?.[0]?.count ?? 0
  if (setCount === 0) {
    const sets = seedSets(log.id, resolveRoutine(split, templates))
    if (sets.length > 0) {
      const { error: seedError } = await supabase.from('workout_sets').insert(sets)
      if (seedError) return dbFail('startWorkout', seedError, 'Could not add the exercises. Please try again.')
    }
  }

  revalidateWorkout({ tracker: true })
  return ok()
}

export type SetPatch = Partial<Pick<WorkoutSet, 'actual_reps' | 'actual_weight' | 'is_completed'>>
export type SetValues = Pick<WorkoutSet, 'actual_reps' | 'actual_weight'>

function validatePatch(patch: SetPatch): SetPatch | string {
  const clean: SetPatch = {}
  if (patch.actual_reps !== undefined) {
    const reps = patch.actual_reps
    if (!Number.isInteger(reps) || reps < 0 || reps > MAX_REPS) return `Reps must be a whole number from 0 to ${MAX_REPS}.`
    clean.actual_reps = reps
  }
  if (patch.actual_weight !== undefined) {
    const weight = patch.actual_weight
    if (!Number.isFinite(weight) || weight < 0 || weight > MAX_WEIGHT_KG) return `Weight must be between 0 and ${MAX_WEIGHT_KG} kg.`
    clean.actual_weight = Math.round(weight * 100) / 100
  }
  if (patch.is_completed !== undefined) {
    if (typeof patch.is_completed !== 'boolean') return 'Invalid value.'
    clean.is_completed = patch.is_completed
  }
  return Object.keys(clean).length > 0 ? clean : 'Nothing to save.'
}

/** Adds a set to an exercise with the reps and weight the app shows for it. */
export async function addSet(logId: string, exerciseId: string, values: SetValues): Promise<ActionResult<WorkoutSet>> {
  const exercise = getExercise(exerciseId)
  if (typeof logId !== 'string' || !exercise) return fail('Unknown exercise.')
  const clean = validatePatch({
    actual_reps: values?.actual_reps ?? DEFAULT_REPS,
    actual_weight: values?.actual_weight ?? 0,
  })
  if (typeof clean === 'string') return fail(clean)

  const { supabase } = await getSession()
  const { data: last, error: readError } = await supabase
    .from('workout_sets')
    .select('set_number')
    .eq('workout_log_id', logId)
    .eq('exercise_id', exerciseId)
    .order('set_number', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (readError) return dbFail('addSet', readError)

  const { data, error } = await supabase
    .from('workout_sets')
    .insert({
      workout_log_id: logId,
      exercise_id: exercise.id,
      exercise_name: exercise.name,
      set_number: (last?.set_number ?? 0) + 1,
      actual_reps: clean.actual_reps,
      actual_weight: clean.actual_weight,
      is_completed: false,
    })
    .select(SET_COLUMNS)
    .single()
  // Row-level security rejects logs that belong to someone else.
  if (error) return dbFail('addSet', error, 'Could not add the set. Please try again.')

  return ok(toWorkoutSet(data))
}

export async function updateSet(setId: string, patch: SetPatch): Promise<ActionResult> {
  const clean = validatePatch(patch ?? {})
  if (typeof clean === 'string') return fail(clean)

  const { supabase } = await getSession()
  const { data, error } = await supabase.from('workout_sets').update(clean).eq('id', setId).select('id')
  if (error) return dbFail('updateSet', error, 'Could not save the set. Please try again.')
  if (data.length === 0) return fail('This set no longer exists. Reload the page.')
  return ok()
}

export async function removeSet(setId: string): Promise<ActionResult> {
  const { supabase } = await getSession()
  const { error } = await supabase.from('workout_sets').delete().eq('id', setId)
  if (error) return dbFail('removeSet', error, 'Could not remove the set. Please try again.')
  return ok()
}

/**
 * Matches the session to the day's current routine: adds planned exercises that have no sets
 * and drops exercises that left the plan, unless they already have completed sets.
 * Returns the session's sets afterwards.
 */
export async function syncWithPlan(logId: string): Promise<ActionResult<WorkoutSet[]>> {
  const [{ user, supabase }, templates] = await Promise.all([getSession(), getRoutineTemplates()])

  const { data: log, error } = await supabase
    .from('workout_logs')
    .select(`id, split, workout_sets(${SET_COLUMNS})`)
    .eq('id', logId)
    .eq('user_id', user.id)
    .maybeSingle()
  if (error) return dbFail('syncWithPlan', error)
  if (!log || !isSplitType(log.split)) return fail('This workout no longer exists. Reload the page.')

  const sets: WorkoutSet[] = (log.workout_sets ?? []).map(toWorkoutSet)
  const planned = resolveRoutine(log.split, templates)
  const plannedIds = new Set(planned.map((e) => e.id))
  const loggedIds = new Set(sets.map((s) => s.exercise_id))
  const completedIds = new Set(sets.filter((s) => s.is_completed).map((s) => s.exercise_id))

  const staleSetIds = sets
    .filter((s) => !plannedIds.has(s.exercise_id) && !completedIds.has(s.exercise_id))
    .map((s) => s.id)
  if (staleSetIds.length > 0) {
    const { error: deleteError } = await supabase.from('workout_sets').delete().in('id', staleSetIds)
    if (deleteError) return dbFail('syncWithPlan', deleteError)
  }

  const missing = planned.filter((e) => !loggedIds.has(e.id))
  if (missing.length > 0) {
    const { error: insertError } = await supabase.from('workout_sets').insert(seedSets(log.id, missing))
    if (insertError) return dbFail('syncWithPlan', insertError)
  }

  const { data: fresh, error: reloadError } = await supabase
    .from('workout_sets')
    .select(SET_COLUMNS)
    .eq('workout_log_id', log.id)
    .order('created_at')
  if (reloadError) return dbFail('syncWithPlan', reloadError)

  revalidateWorkout()
  return ok(sortSets(fresh.map(toWorkoutSet)))
}

export async function finishWorkout(logId: string): Promise<ActionResult> {
  const { user, supabase } = await getSession()
  const { error } = await supabase
    .from('workout_logs')
    .update({ finished_at: new Date().toISOString() })
    .eq('id', logId)
    .eq('user_id', user.id)
  if (error) return dbFail('finishWorkout', error, 'Could not finish the workout. Please try again.')

  revalidateWorkout()
  return ok()
}
