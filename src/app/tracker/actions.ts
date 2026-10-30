'use server'

import { revalidatePath } from 'next/cache'
import { getExercise } from '@/lib/exercises-data'
import { resolveRoutine } from '@/lib/routines'
import { DEFAULT_REPS, MAX_REPS, MAX_SETS_PER_EXERCISE, MAX_WEIGHT_KG, MIN_SETS_PER_EXERCISE, isValidSetCount } from '@/lib/sets'
import { isSplitType, isWorkoutSplit } from '@/lib/splits'
import { dbFail, fail, ok } from '@/lib/data/action-result'
import { getRoutineTemplates } from '@/lib/data/plans'
import { getSession, getToday } from '@/lib/data/session'
import { SET_COLUMNS, getLastPerformance, sortSets, toWorkoutSet } from '@/lib/data/workouts'
import type { ActionResult, IsoDate, PlannedExercise, SetValues, WorkoutSet, WorkoutSplit } from '@/lib/types'

/** Postgres' error code for a duplicate key. */
const UNIQUE_VIOLATION = '23505'

/** The tracker keeps its own state after sync/finish, so it only needs a refresh on start. */
function revalidateWorkout({ tracker = false } = {}) {
  if (tracker) revalidatePath('/tracker')
  revalidatePath('/dashboard')
  revalidatePath('/schedule')
  revalidatePath('/profile')
}

/**
 * New sets that bring `exercises` up to as many as the routine asks for, after the sets they
 * already have in `logged`. Each starts from the reps and weight of the same set last time;
 * extra sets repeat the set before them. Nothing is ticked off.
 */
async function seedSets(logId: string, exercises: PlannedExercise[], today: IsoDate, logged: WorkoutSet[] = []) {
  // Starting from defaults beats failing the whole workout when the history can't be read.
  const previous = await getLastPerformance(exercises.map((e) => e.id), today).catch((error) => {
    console.error('[seedSets]', error)
    return new Map<string, SetValues[]>()
  })
  return exercises.flatMap((exercise) => {
    const last = previous.get(exercise.id) ?? []
    const current = sortSets(logged.filter((s) => s.exercise_id === exercise.id))
    const lastNumber = current.at(-1)?.set_number ?? 0
    return Array.from({ length: Math.max(exercise.sets - current.length, 0) }, (_, k) => {
      const i = current.length + k
      const values = last[i] ?? current.at(-1) ?? last.at(-1)
      return {
        workout_log_id: logId,
        exercise_id: exercise.id,
        exercise_name: exercise.name,
        set_number: lastNumber + k + 1,
        actual_reps: values?.actual_reps ?? DEFAULT_REPS,
        actual_weight: values?.actual_weight ?? 0,
        is_completed: false,
      }
    })
  })
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
    const sets = await seedSets(log.id, resolveRoutine(split, templates), today)
    if (sets.length > 0) {
      const { error: seedError } = await supabase.from('workout_sets').insert(sets)
      if (seedError) return dbFail('startWorkout', seedError, 'Could not add the exercises. Please try again.')
    }
  }

  revalidateWorkout({ tracker: true })
  return ok()
}

export type SetPatch = Partial<Pick<WorkoutSet, 'actual_reps' | 'actual_weight' | 'is_completed'>>

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

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * Adds a set to an exercise with the reps and weight the app shows for it. The device picks the set's id, so the
 * same set sent again (after an answer lost to a bad connection) is found instead of added twice.
 */
export async function addSet(
  logId: string,
  setId: string,
  exerciseId: string,
  values: SetValues
): Promise<ActionResult<WorkoutSet>> {
  const exercise = getExercise(exerciseId)
  if (typeof logId !== 'string' || !exercise) return fail('Unknown exercise.')
  if (typeof setId !== 'string' || !UUID.test(setId)) return fail('Invalid set.')
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
      id: setId,
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
  if (error?.code === UNIQUE_VIOLATION) {
    // Row-level security hides a set with this id that belongs to someone else, so it reads as missing.
    const { data: saved } = await supabase.from('workout_sets').select(SET_COLUMNS).eq('id', setId).maybeSingle()
    return saved ? ok(toWorkoutSet(saved)) : fail('Could not add the set. Please try again.')
  }
  // Row-level security rejects logs that belong to someone else.
  if (error) return dbFail('addSet', error, 'Could not add the set. Please try again.')

  return ok(toWorkoutSet(data))
}

/** Adds an exercise that has no sets in the workout yet, with `setCount` sets filled in from last time. */
export async function addExerciseToWorkout(
  logId: string,
  exerciseId: string,
  setCount: number
): Promise<ActionResult<WorkoutSet[]>> {
  const exercise = getExercise(exerciseId)
  if (typeof logId !== 'string' || !exercise) return fail('Unknown exercise.')
  if (!isValidSetCount(setCount)) return fail(`Pick ${MIN_SETS_PER_EXERCISE} to ${MAX_SETS_PER_EXERCISE} sets.`)

  const [{ supabase }, today] = await Promise.all([getSession(), getToday()])
  const { count, error: readError } = await supabase
    .from('workout_sets')
    .select('id', { count: 'exact', head: true })
    .eq('workout_log_id', logId)
    .eq('exercise_id', exerciseId)
  if (readError) return dbFail('addExerciseToWorkout', readError)
  if (count) return fail(`${exercise.name} is already in this workout.`)

  const { data, error } = await supabase
    .from('workout_sets')
    .insert(await seedSets(logId, [{ ...exercise, sets: setCount }], today))
    .select(SET_COLUMNS)
  // Row-level security rejects logs that belong to someone else.
  if (error) return dbFail('addExerciseToWorkout', error, 'Could not add the exercise. Please try again.')

  return ok(sortSets(data.map(toWorkoutSet)))
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

/** Deletes a set and renumbers the exercise's other sets so they stay 1, 2, 3… */
export async function removeSet(setId: string): Promise<ActionResult> {
  const { supabase } = await getSession()
  const { data: removed, error } = await supabase
    .from('workout_sets')
    .delete()
    .eq('id', setId)
    .select('workout_log_id, exercise_id')
    .maybeSingle()
  if (error) return dbFail('removeSet', error, 'Could not remove the set. Please try again.')

  // The set is gone either way; a numbering gap only shows until the next delete.
  if (removed) {
    const renumbered = await renumberSets(supabase, removed.workout_log_id, removed.exercise_id)
    if (renumbered.error) console.error('removeSet:', renumbered.error.message)
  }
  return ok()
}

async function renumberSets(
  supabase: Awaited<ReturnType<typeof getSession>>['supabase'],
  logId: string,
  exerciseId: string
): Promise<{ error: { message: string } | null }> {
  const { data: sets, error } = await supabase
    .from('workout_sets')
    .select('id, set_number')
    .eq('workout_log_id', logId)
    .eq('exercise_id', exerciseId)
    .order('set_number')
  if (error) return { error }

  // In ascending order, so a set only ever moves down into a number that is already free.
  for (const [i, set] of sets.entries()) {
    if (set.set_number === i + 1) continue
    const { error: updateError } = await supabase.from('workout_sets').update({ set_number: i + 1 }).eq('id', set.id)
    if (updateError) return { error: updateError }
  }
  return { error: null }
}

/**
 * Matches the session to the day's current routine: adds planned exercises that have no sets,
 * tops up exercises with nothing ticked off to the planned number of sets, and drops exercises
 * that left the plan, unless they already have completed sets.
 * Returns the session's sets afterwards.
 */
export async function syncWithPlan(logId: string): Promise<ActionResult<WorkoutSet[]>> {
  const [{ user, supabase }, templates, today] = await Promise.all([getSession(), getRoutineTemplates(), getToday()])

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
  const completedIds = new Set(sets.filter((s) => s.is_completed).map((s) => s.exercise_id))

  const staleSetIds = sets
    .filter((s) => !plannedIds.has(s.exercise_id) && !completedIds.has(s.exercise_id))
    .map((s) => s.id)
  if (staleSetIds.length > 0) {
    const { error: deleteError } = await supabase.from('workout_sets').delete().in('id', staleSetIds)
    if (deleteError) return dbFail('syncWithPlan', deleteError)
  }

  const behind = planned.filter(
    (e) => !completedIds.has(e.id) && sets.filter((s) => s.exercise_id === e.id).length < e.sets
  )
  if (behind.length > 0) {
    const { error: insertError } = await supabase
      .from('workout_sets')
      .insert(await seedSets(log.id, behind, today, sets))
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
