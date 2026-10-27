import 'server-only'
import { isMeal } from '@/lib/nutrition'
import type { FoodEntry, FoodItem, IsoDate } from '@/lib/types'
import { getSession } from './session'

/** How many foods the "Recent" list offers when adding a food. */
const RECENT_FOODS = 8

interface FoodRow {
  id: string
  date: IsoDate
  meal: string
  name: string
  calories: number
  protein: number | string
  carbs: number | string
  fat: number | string
  grams: number | string | null
}

function toFoodItem(row: Omit<FoodRow, 'id' | 'date' | 'meal'>): FoodItem {
  return {
    name: row.name,
    calories: row.calories,
    protein: Number(row.protein),
    carbs: Number(row.carbs),
    fat: Number(row.fat),
    grams: row.grams === null ? null : Number(row.grams),
  }
}

/** Foods logged on `date`, in the order they were added. */
export async function getFoodEntries(date: IsoDate): Promise<FoodEntry[]> {
  const { user, supabase } = await getSession()
  const { data, error } = await supabase
    .from('food_entries')
    .select('id, date, meal, name, calories, protein, carbs, fat, grams')
    .eq('user_id', user.id)
    .eq('date', date)
    .order('created_at')
  if (error) throw new Error(`Could not load your food log: ${error.message}`)

  return (data as FoodRow[]).map((row) => ({
    ...toFoodItem(row),
    id: row.id,
    date: row.date,
    meal: isMeal(row.meal) ? row.meal : 'snack',
  }))
}

/** The foods logged most recently, one per name, so they can be added again in a tap. */
export async function getRecentFoods(): Promise<FoodItem[]> {
  const { user, supabase } = await getSession()
  const { data, error } = await supabase
    .from('food_entries')
    .select('name, calories, protein, carbs, fat, grams')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(60)
  if (error) throw new Error(`Could not load your recent foods: ${error.message}`)

  const byName = new Map<string, FoodItem>()
  for (const row of data as Omit<FoodRow, 'id' | 'date' | 'meal'>[]) {
    const key = row.name.toLowerCase()
    if (!byName.has(key)) byName.set(key, toFoodItem(row))
  }
  return [...byName.values()].slice(0, RECENT_FOODS)
}
