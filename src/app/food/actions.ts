'use server'

import { revalidatePath } from 'next/cache'
import { isIsoDate } from '@/lib/date'
import { formatMl } from '@/lib/format'
import {
  MACROS,
  MAX_CALORIES,
  MAX_FOOD_GRAMS,
  MAX_FOOD_NAME_LENGTH,
  MAX_MACRO_GRAMS,
  MAX_SAVED_MEAL_FOODS,
  MAX_SAVED_MEAL_NAME_LENGTH,
  MAX_WATER_ML,
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

/** Why nothing can be logged on `date`, or null when it can (today or an earlier day). */
async function dateProblem(date: IsoDate): Promise<string | null> {
  if (!isIsoDate(date)) return 'Invalid date.'
  if (date > (await getToday())) return "You can't log anything for a day that hasn't happened yet."
  return null
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
  const problem = await dateProblem(date)
  if (problem) return fail(problem)
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

/** Adds checked foods to `meal` on `date`, in one go. */
async function logFoods(date: IsoDate, meal: Meal, foods: FoodItem[], context: string): Promise<ActionResult> {
  const { user, supabase } = await getSession()
  const { error } = await supabase
    .from('food_entries')
    .insert(foods.map((food) => ({ user_id: user.id, date, meal, ...food })))
  if (error) return dbFail(context, error, 'Could not log the foods. Please try again.')

  revalidateFood()
  return ok()
}

/** Logs the foods of `meal` on `fromDate` in the same meal on `date`. */
export async function copyMeal(fromDate: IsoDate, date: IsoDate, meal: Meal): Promise<ActionResult> {
  const problem = isIsoDate(fromDate) ? await dateProblem(date) : 'Invalid date.'
  if (problem) return fail(problem)
  if (!isMeal(meal)) return fail('Unknown meal.')

  const { user, supabase } = await getSession()
  const { data, error } = await supabase
    .from('food_entries')
    .select('name, calories, protein, carbs, fat, grams')
    .eq('user_id', user.id)
    .eq('date', fromDate)
    .eq('meal', meal)
    .order('created_at')
  if (error) return dbFail('copyMeal', error, 'Could not copy the meal. Please try again.')
  if (data.length === 0) return fail('There was nothing to copy.')

  return logFoods(date, meal, data as FoodItem[], 'copyMeal')
}

/** Saves foods together under a name, to log them again later in one tap. */
export async function saveMeal(name: string, foods: FoodItem[]): Promise<ActionResult> {
  const title = typeof name === 'string' ? name.trim() : ''
  if (!title) return fail('Give the meal a name.')
  if (title.length > MAX_SAVED_MEAL_NAME_LENGTH) return fail(`Keep the name under ${MAX_SAVED_MEAL_NAME_LENGTH} characters.`)
  if (!Array.isArray(foods) || foods.length === 0) return fail('Log a food in the meal first.')
  if (foods.length > MAX_SAVED_MEAL_FOODS) return fail(`A saved meal can hold up to ${MAX_SAVED_MEAL_FOODS} foods.`)
  const clean = foods.map(cleanFood)
  const problem = clean.find((food) => typeof food === 'string')
  if (problem) return fail(problem)

  const { user, supabase } = await getSession()
  const { error } = await supabase.from('saved_meals').insert({ user_id: user.id, name: title, foods: clean })
  if (error) return dbFail('saveMeal', error, 'Could not save the meal. Please try again.')

  revalidatePath('/food')
  return ok()
}

/** Logs the foods of a saved meal in `meal` on `date`. */
export async function logSavedMeal(id: string, date: IsoDate, meal: Meal): Promise<ActionResult> {
  if (typeof id !== 'string' || !UUID.test(id)) return fail('Unknown saved meal.')
  const problem = await dateProblem(date)
  if (problem) return fail(problem)
  if (!isMeal(meal)) return fail('Unknown meal.')

  const { user, supabase } = await getSession()
  const { data, error } = await supabase
    .from('saved_meals')
    .select('foods')
    .eq('id', id)
    .eq('user_id', user.id)
    .maybeSingle()
  if (error) return dbFail('logSavedMeal', error, 'Could not log the meal. Please try again.')
  if (!data) return fail('That saved meal is no longer there.')

  // Checked again, since rows can be written without going through saveMeal.
  const foods = (Array.isArray(data.foods) ? data.foods : [])
    .map(cleanFood)
    .filter((food): food is FoodItem => typeof food !== 'string')
  if (foods.length === 0) return fail('That saved meal has no foods in it.')

  return logFoods(date, meal, foods, 'logSavedMeal')
}

export async function deleteSavedMeal(id: string): Promise<ActionResult> {
  if (typeof id !== 'string' || !UUID.test(id)) return fail('Unknown saved meal.')

  const { user, supabase } = await getSession()
  const { error } = await supabase.from('saved_meals').delete().eq('id', id).eq('user_id', user.id)
  if (error) return dbFail('deleteSavedMeal', error, 'Could not delete the saved meal. Please try again.')

  revalidatePath('/food')
  return ok()
}

/** Sets how much water was drunk on `date`, in ml. */
export async function saveWater(date: IsoDate, ml: number): Promise<ActionResult> {
  const problem = await dateProblem(date)
  if (problem) return fail(problem)
  if (!Number.isInteger(ml) || ml < 0 || ml > MAX_WATER_ML) return fail(`Water must be between 0 and ${formatMl(MAX_WATER_ML)}.`)

  const { user, supabase } = await getSession()
  const { error } = await supabase
    .from('water_logs')
    .upsert({ user_id: user.id, date, ml, updated_at: new Date().toISOString() }, { onConflict: 'user_id,date' })
  if (error) return dbFail('saveWater', error, 'Could not save your water. Please try again.')

  revalidatePath('/food')
  return ok()
}
