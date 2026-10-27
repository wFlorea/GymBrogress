'use server'

import { revalidatePath } from 'next/cache'
import { MAX_AGE, MAX_HEIGHT_CM, MAX_WEIGHT_KG, MIN_AGE, MIN_HEIGHT_CM, MIN_WEIGHT_KG } from '@/lib/body'
import { MACROS, MAX_CALORIES, MAX_MACRO_GRAMS, MIN_CALORIE_GOAL } from '@/lib/nutrition'
import { dbFail, fail, ok } from '@/lib/data/action-result'
import { getSession } from '@/lib/data/session'
import type { ActionResult, BodyStats, NutritionGoals } from '@/lib/types'

function revalidateGoals() {
  revalidatePath('/dashboard')
  revalidatePath('/food')
}

function isAmount(value: unknown, min: number, max: number): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max
}

/** Null (not entered) or a number from `min` to `max`. */
function isOptionalAmount(value: unknown, min: number, max: number): value is number | null {
  return value === null || isAmount(value, min, max)
}

const tenth = (value: number | null) => (value === null ? null : Math.round(value * 10) / 10)

/** Saves the weight, height and age used for the BMI; null clears one. */
export async function saveBodyStats(body: BodyStats): Promise<ActionResult> {
  if (typeof body !== 'object' || body === null) return fail('Invalid details.')
  if (!isOptionalAmount(body.weight, MIN_WEIGHT_KG, MAX_WEIGHT_KG)) {
    return fail(`Enter a weight between ${MIN_WEIGHT_KG} and ${MAX_WEIGHT_KG} kg, or leave it empty.`)
  }
  if (!isOptionalAmount(body.height, MIN_HEIGHT_CM, MAX_HEIGHT_CM)) {
    return fail(`Enter a height between ${MIN_HEIGHT_CM} and ${MAX_HEIGHT_CM} cm, or leave it empty.`)
  }
  if (!isOptionalAmount(body.age, MIN_AGE, MAX_AGE) || (body.age !== null && !Number.isInteger(body.age))) {
    return fail(`Enter your age in whole years, from ${MIN_AGE} to ${MAX_AGE}, or leave it empty.`)
  }

  const { user, supabase } = await getSession()
  const { error } = await supabase.from('user_settings').upsert(
    {
      user_id: user.id,
      weight_kg: tenth(body.weight),
      height_cm: tenth(body.height),
      age: body.age,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' }
  )
  if (error) return dbFail('saveBodyStats', error, 'Could not save your details. Please try again.')

  revalidateGoals()
  return ok()
}

/** Saves the goal weight and the daily calorie and macro goals; null clears a goal. */
export async function saveGoals(goalWeight: number | null, goals: NutritionGoals): Promise<ActionResult> {
  if (!isOptionalAmount(goalWeight, MIN_WEIGHT_KG, MAX_WEIGHT_KG)) {
    return fail(`Set a goal weight between ${MIN_WEIGHT_KG} and ${MAX_WEIGHT_KG} kg, or leave it empty.`)
  }
  if (typeof goals !== 'object' || goals === null) return fail('Invalid goals.')
  const isGoal = (value: unknown, min: number, max: number) =>
    value === null || (Number.isInteger(value) && isAmount(value, min, max))
  if (!isGoal(goals.calories, MIN_CALORIE_GOAL, MAX_CALORIES)) {
    return fail(`Set a calorie goal between ${MIN_CALORIE_GOAL} and ${MAX_CALORIES.toLocaleString('en-GB')} kcal, or leave it empty.`)
  }
  if (MACROS.some(({ key }) => !isGoal(goals[key], 0, MAX_MACRO_GRAMS))) {
    return fail(`Macro goals must be whole grams between 0 and ${MAX_MACRO_GRAMS}, or empty.`)
  }

  const { user, supabase } = await getSession()
  const { error } = await supabase.from('user_settings').upsert(
    {
      user_id: user.id,
      goal_weight_kg: tenth(goalWeight),
      calorie_goal: goals.calories,
      protein_goal: goals.protein,
      carbs_goal: goals.carbs,
      fat_goal: goals.fat,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' }
  )
  if (error) return dbFail('saveGoals', error, 'Could not save your goals. Please try again.')

  revalidateGoals()
  return ok()
}
