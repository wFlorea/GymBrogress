'use server'

import { revalidatePath } from 'next/cache'
import { isIsoDate } from '@/lib/date'
import {
  MACROS,
  MAX_CALORIES,
  MAX_FOOD_GRAMS,
  MAX_FOOD_NAME_LENGTH,
  MAX_MACRO_GRAMS,
  isMeal,
} from '@/lib/nutrition'
import { dbFail, fail, ok } from '@/lib/data/action-result'
import { searchProducts } from '@/lib/data/open-food-facts'
import { getSession, getToday, requireUser } from '@/lib/data/session'
import type { ActionResult, CatalogFood, FoodItem, IsoDate, Meal } from '@/lib/types'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function revalidateFood() {
  revalidatePath('/food')
  revalidatePath('/dashboard')
}

function isAmount(value: unknown, min: number, max: number): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max
}

/** The food as it's stored (trimmed name, whole kcal, macros and weight to 0.1 g), or an error message. */
function cleanFood(food: FoodItem): FoodItem | string {
  if (typeof food !== 'object' || food === null) return 'Invalid food.'
  const name = typeof food.name === 'string' ? food.name.trim() : ''
  if (!name) return 'Give the food a name.'
  if (name.length > MAX_FOOD_NAME_LENGTH) return `Keep the name under ${MAX_FOOD_NAME_LENGTH} characters.`
  if (!isAmount(food.calories, 0, MAX_CALORIES)) return `Calories must be between 0 and ${MAX_CALORIES.toLocaleString('en-GB')}.`
  if (MACROS.some(({ key }) => !isAmount(food[key], 0, MAX_MACRO_GRAMS))) {
    return `Protein, carbs and fat must be between 0 and ${MAX_MACRO_GRAMS} g.`
  }
  const weight = food.grams ?? null
  if (weight !== null && !isAmount(weight, 0.1, MAX_FOOD_GRAMS)) {
    return `The amount must be between 0.1 and ${MAX_FOOD_GRAMS.toLocaleString('en-GB')} g.`
  }

  const grams = (value: number) => Math.round(value * 10) / 10
  return {
    name,
    calories: Math.round(food.calories),
    protein: grams(food.protein),
    carbs: grams(food.carbs),
    fat: grams(food.fat),
    grams: weight === null ? null : grams(weight),
  }
}

/** Packaged and branded foods from Open Food Facts that match `query`. */
export async function searchFoodProducts(query: string): Promise<ActionResult<CatalogFood[]>> {
  const text = typeof query === 'string' ? query.trim() : ''
  if (text.length < 2 || text.length > 60) return fail('Search with 2 to 60 characters.')
  // Signed-in users only, so the action isn't an open proxy to Open Food Facts.
  await requireUser()

  try {
    return ok(await searchProducts(text))
  } catch (error) {
    console.error('searchFoodProducts:', error instanceof Error ? error.message : error)
    return fail("Couldn't reach the product database. Check your connection and try again.")
  }
}

/** Logs a food on `date` (today or an earlier day). Returns the new entry's id. */
export async function addFoodEntry(date: IsoDate, meal: Meal, food: FoodItem): Promise<ActionResult<string>> {
  if (!isIsoDate(date)) return fail('Invalid date.')
  if (date > (await getToday())) return fail("You can't log food for a day that hasn't happened yet.")
  if (!isMeal(meal)) return fail('Unknown meal.')
  const clean = cleanFood(food)
  if (typeof clean === 'string') return fail(clean)

  const { user, supabase } = await getSession()
  const { data, error } = await supabase
    .from('food_entries')
    .insert({ user_id: user.id, date, meal, ...clean })
    .select('id')
    .single()
  if (error) return dbFail('addFoodEntry', error, 'Could not log the food. Please try again.')

  revalidateFood()
  return ok(data.id as string)
}

/** Changes a logged food, or moves it to another meal of the same day. */
export async function updateFoodEntry(id: string, meal: Meal, food: FoodItem): Promise<ActionResult> {
  if (typeof id !== 'string' || !UUID.test(id)) return fail('Unknown food.')
  if (!isMeal(meal)) return fail('Unknown meal.')
  const clean = cleanFood(food)
  if (typeof clean === 'string') return fail(clean)

  const { user, supabase } = await getSession()
  const { data, error } = await supabase
    .from('food_entries')
    .update({ meal, ...clean })
    .eq('id', id)
    .eq('user_id', user.id)
    .select('id')
  if (error) return dbFail('updateFoodEntry', error, 'Could not save the food. Please try again.')
  if (data.length === 0) return fail('That food is no longer in your log.')

  revalidateFood()
  return ok()
}

export async function deleteFoodEntry(id: string): Promise<ActionResult> {
  if (typeof id !== 'string' || !UUID.test(id)) return fail('Unknown food.')

  const { user, supabase } = await getSession()
  const { error } = await supabase.from('food_entries').delete().eq('id', id).eq('user_id', user.id)
  if (error) return dbFail('deleteFoodEntry', error, 'Could not delete the food. Please try again.')

  revalidateFood()
  return ok()
}
