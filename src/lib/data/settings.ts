import 'server-only'
import { cache } from 'react'
import { isActivityLevel, isSex } from '@/lib/body'
import { DEFAULT_PLAN_PACE, isPlanPace, isWeightPlan } from '@/lib/nutrition'
import { DEFAULT_REST_SECONDS, isRestSeconds } from '@/lib/sets'
import { isWorkoutSplit } from '@/lib/splits'
import { DEFAULT_WEIGHT_UNIT, isWeightUnit } from '@/lib/units'
import type { UserSettings } from '@/lib/types'
import { getSession } from './session'

/** The user's preferences; users without a row get the defaults. */
export const getUserSettings = cache(async (): Promise<UserSettings> => {
  const { user, supabase } = await getSession()
  const { data, error } = await supabase
    .from('user_settings')
    .select(
      'split_order, tracked_exercise_ids, calorie_goal, protein_goal, carbs_goal, fat_goal, weight_kg, height_cm, age, sex, goal_weight_kg, weight_plan, plan_pace, body_fat, activity_level, rest_timer_on, rest_timer_seconds, weight_unit'
    )
    .eq('user_id', user.id)
    .maybeSingle()
  if (error) throw new Error(`Could not load your settings: ${error.message}`)
  // DECIMAL columns arrive as strings.
  const decimal = (value: number | string | null | undefined) => (value == null ? null : Number(value))

  return {
    splitOrder: (data?.split_order ?? []).filter(isWorkoutSplit),
    trackedExerciseIds: data?.tracked_exercise_ids ?? [],
    nutritionGoals: {
      calories: data?.calorie_goal ?? null,
      protein: data?.protein_goal ?? null,
      carbs: data?.carbs_goal ?? null,
      fat: data?.fat_goal ?? null,
    },
    body: {
      weight: decimal(data?.weight_kg),
      height: decimal(data?.height_cm),
      age: data?.age ?? null,
      sex: isSex(data?.sex) ? data.sex : null,
      bodyFat: decimal(data?.body_fat),
      activity: isActivityLevel(data?.activity_level) ? data.activity_level : null,
    },
    goalWeight: decimal(data?.goal_weight_kg),
    weightPlan: isWeightPlan(data?.weight_plan) ? data.weight_plan : 'maintain',
    planPace: isPlanPace(data?.plan_pace) ? data.plan_pace : DEFAULT_PLAN_PACE,
    restTimer: {
      on: data?.rest_timer_on ?? true,
      seconds: isRestSeconds(data?.rest_timer_seconds) ? data.rest_timer_seconds : DEFAULT_REST_SECONDS,
    },
    weightUnit: isWeightUnit(data?.weight_unit) ? data.weight_unit : DEFAULT_WEIGHT_UNIT,
  }
})
