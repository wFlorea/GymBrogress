'use server'

import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import {
  MAX_AGE,
  MAX_BODY_FAT,
  MAX_HEIGHT_CM,
  MAX_WEIGHT_KG,
  MIN_AGE,
  MIN_BODY_FAT,
  MIN_HEIGHT_CM,
  MIN_WEIGHT_KG,
  isActivityLevel,
  isSex,
  weightRangeText,
} from '@/lib/body'
import { mondayOf } from '@/lib/date'
import {
  MACROS,
  MAX_CALORIES,
  MAX_MACRO_GRAMS,
  MIN_CALORIE_GOAL,
  isPlanPace,
  isWeightPlan,
  recommendedGoals,
} from '@/lib/nutrition'
import { dbFail, fail, ok } from '@/lib/data/action-result'
import { getSession, getToday } from '@/lib/data/session'
import { getUserSettings } from '@/lib/data/settings'
import { CHECK_IN_DISMISSED_COOKIE } from '@/lib/data/weight'
import type { ActionResult, BodyStats, Nutrition, NutritionGoals, PlanPace, WeightPlan } from '@/lib/types'

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
/** Weights are kept to 0.01 kg, so one typed in lb comes back as typed. */
const hundredth = (value: number | null) => (value === null ? null : Math.round(value * 100) / 100)

/** The weights allowed, like "20 and 400 kg", in the unit the user picked. */
async function weightRange() {
  return weightRangeText((await getUserSettings()).weightUnit)
}

/** The daily goal columns for `goals`; none when the stats behind them are incomplete. */
const goalColumns = (goals: Nutrition | null) =>
  goals && { calorie_goal: goals.calories, protein_goal: goals.protein, carbs_goal: goals.carbs, fat_goal: goals.fat }

/**
 * Saves the weight, height, age and sex, the body fat and the activity level; null clears one. Once the stats behind
 * the daily calories are all there, the calorie and macro goals are set to the ones they and the user's weight plan
 * give (see `recommendedGoals`).
 */
export async function saveBodyStats(body: BodyStats): Promise<ActionResult> {
  if (typeof body !== 'object' || body === null) return fail('Invalid details.')
  if (!isOptionalAmount(body.weight, MIN_WEIGHT_KG, MAX_WEIGHT_KG)) {
    return fail(`Enter a weight between ${await weightRange()}, or leave it empty.`)
  }
  if (!isOptionalAmount(body.height, MIN_HEIGHT_CM, MAX_HEIGHT_CM)) {
    return fail(`Enter a height between ${MIN_HEIGHT_CM} and ${MAX_HEIGHT_CM} cm, or leave it empty.`)
  }
  if (!isOptionalAmount(body.age, MIN_AGE, MAX_AGE) || (body.age !== null && !Number.isInteger(body.age))) {
    return fail(`Enter your age in whole years, from ${MIN_AGE} to ${MAX_AGE}, or leave it empty.`)
  }
  if (body.sex !== null && !isSex(body.sex)) return fail('Pick male or female.')
  if (!isOptionalAmount(body.bodyFat, MIN_BODY_FAT, MAX_BODY_FAT)) {
    return fail(`Body fat must be between ${MIN_BODY_FAT}% and ${MAX_BODY_FAT}%.`)
  }
  if (body.activity !== null && !isActivityLevel(body.activity)) return fail('Pick one of the activity levels.')

  const weight = hundredth(body.weight)
  const height = tenth(body.height)
  const { weightPlan, planPace } = await getUserSettings()
  const goals = recommendedGoals({ ...body, weight, height }, weightPlan, planPace)
  const { user, supabase } = await getSession()
  const { error } = await supabase.from('user_settings').upsert(
    {
      user_id: user.id,
      weight_kg: weight,
      height_cm: height,
      age: body.age,
      sex: body.sex,
      body_fat: tenth(body.bodyFat),
      activity_level: body.activity,
      ...goalColumns(goals),
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' }
  )
  if (error) return dbFail('saveBodyStats', error, 'Could not save your details. Please try again.')

  revalidateGoals()
  return ok()
}

/**
 * Logs this week's weigh-in (checking in again the same week replaces it) and makes it the current weight, so the
 * BMI and the daily goals follow it as they do in `saveBodyStats`.
 */
export async function logWeeklyWeight(weight: number): Promise<ActionResult> {
  if (!isAmount(weight, MIN_WEIGHT_KG, MAX_WEIGHT_KG)) {
    return fail(`Enter a weight between ${await weightRange()}.`)
  }

  const kg = Math.round(weight * 100) / 100
  const [{ body, weightPlan, planPace }, today] = await Promise.all([getUserSettings(), getToday()])
  const goals = recommendedGoals({ ...body, weight: kg }, weightPlan, planPace)
  const { user, supabase } = await getSession()
  const updatedAt = new Date().toISOString()
  const { error: logError } = await supabase
    .from('weight_logs')
    .upsert(
      { user_id: user.id, week_start: mondayOf(today), weight_kg: kg, updated_at: updatedAt },
      { onConflict: 'user_id,week_start' }
    )
  if (logError) return dbFail('logWeeklyWeight', logError, 'Could not save your weight. Please try again.')

  const { error } = await supabase
    .from('user_settings')
    .upsert({ user_id: user.id, weight_kg: kg, ...goalColumns(goals), updated_at: updatedAt }, { onConflict: 'user_id' })
  if (error) return dbFail('logWeeklyWeight', error, 'Your check-in is saved, but your current weight could not be updated.')

  revalidateGoals()
  revalidatePath('/profile')
  return ok()
}

/** Hides the weekly check-in reminder on this device until next week; checking in stays possible from Profile. */
export async function dismissWeeklyCheckIn(): Promise<void> {
  const week = mondayOf(await getToday())
  const cookieStore = await cookies()
  cookieStore.set(CHECK_IN_DISMISSED_COOKIE, week, {
    path: '/',
    maxAge: 7 * 24 * 60 * 60,
    sameSite: 'lax',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
  })
  revalidatePath('/dashboard')
}

/** Saves the goal weight, the weight plan and its pace, and the daily calorie and macro goals; null clears a goal. */
export async function saveGoals(
  goalWeight: number | null,
  plan: WeightPlan,
  pace: PlanPace,
  goals: NutritionGoals
): Promise<ActionResult> {
  if (!isOptionalAmount(goalWeight, MIN_WEIGHT_KG, MAX_WEIGHT_KG)) {
    return fail(`Set a goal weight between ${await weightRange()}, or leave it empty.`)
  }
  if (!isWeightPlan(plan)) return fail('Pick cut, maintain or bulk.')
  if (!isPlanPace(pace)) return fail('Pick one of the paces.')
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
      goal_weight_kg: hundredth(goalWeight),
      weight_plan: plan,
      plan_pace: pace,
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
