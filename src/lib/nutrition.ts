// Food log constants and helpers.
import type { Meal, Nutrition } from './types'

export const MEALS: Meal[] = ['breakfast', 'lunch', 'dinner', 'snack']

export const MEAL_LABELS: Record<Meal, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snack: 'Snacks',
}

export const MEAL_EMOJIS: Record<Meal, string> = {
  breakfast: '🍳',
  lunch: '🥗',
  dinner: '🍝',
  snack: '🍎',
}

/** The macros in display order, with the theme colour of each. */
export const MACROS = [
  { key: 'protein', label: 'Protein', short: 'P', bar: 'bg-protein', text: 'text-protein' },
  { key: 'carbs', label: 'Carbs', short: 'C', bar: 'bg-carbs', text: 'text-carbs' },
  { key: 'fat', label: 'Fat', short: 'F', bar: 'bg-fat', text: 'text-fat' },
] as const satisfies { key: keyof Nutrition; label: string; short: string; bar: string; text: string }[]

export const MAX_FOOD_NAME_LENGTH = 80
export const MAX_CALORIES = 10_000
export const MAX_MACRO_GRAMS = 1000
export const MIN_CALORIE_GOAL = 500
/** The most a single logged food can weigh. */
export const MAX_FOOD_GRAMS = 5000

const NO_NUTRITION: Nutrition = { calories: 0, protein: 0, carbs: 0, fat: 0 }

export function isMeal(value: unknown): value is Meal {
  return MEALS.includes(value as Meal)
}

/** 4 kcal per gram of protein and carbs, 9 per gram of fat. */
export function caloriesFromMacros({ protein, carbs, fat }: Omit<Nutrition, 'calories'>): number {
  return Math.round(protein * 4 + carbs * 4 + fat * 9)
}

/** Daily protein: grams per kg of body weight. */
export const PROTEIN_PER_KG = 2
/** The share of the daily calories that comes from fat. */
export const FAT_SHARE = 0.25

/**
 * Splits a daily calorie goal into macros, in whole grams: 2 g of protein per kg the user weighs, 25% of the
 * calories from fat, and carbs for the rest (none when protein and fat already use up the calories).
 */
export function macrosForCalories(calories: number, weightKg: number): Omit<Nutrition, 'calories'> {
  const protein = Math.round(weightKg * PROTEIN_PER_KG)
  const fat = Math.round((calories * FAT_SHARE) / 9)
  const carbs = Math.max(0, Math.round((calories - protein * 4 - fat * 9) / 4))
  return { protein, carbs, fat }
}

export function sumNutrition(items: Nutrition[]): Nutrition {
  return items.reduce(
    (sum, item) => ({
      calories: sum.calories + item.calories,
      protein: sum.protein + item.protein,
      carbs: sum.carbs + item.carbs,
      fat: sum.fat + item.fat,
    }),
    NO_NUTRITION
  )
}

/** What `grams` of a food holds, from its nutrition per 100 g: whole kcal, macros to 0.1 g. */
export function nutritionFor(per100g: Nutrition, grams: number): Nutrition {
  const scaled = (value: number) => (value * grams) / 100
  const tenth = (value: number) => Math.round(value * 10) / 10
  return {
    calories: Math.round(scaled(per100g.calories)),
    protein: tenth(scaled(per100g.protein)),
    carbs: tenth(scaled(per100g.carbs)),
    fat: tenth(scaled(per100g.fat)),
  }
}

/** Nutrition per 100 g, worked back from what `grams` of a food holds (for logged foods, which store totals). */
export function per100gOf(food: Nutrition, grams: number): Nutrition {
  const per100g = (value: number) => (value * 100) / grams
  return {
    calories: per100g(food.calories),
    protein: per100g(food.protein),
    carbs: per100g(food.carbs),
    fat: per100g(food.fat),
  }
}

/** A number typed into a form ("12", "12.5" or "12,5"); null when the field is empty, NaN when it isn't a number. */
export function parseAmount(text: string): number | null {
  const trimmed = text.trim().replace(',', '.')
  if (!trimmed) return null
  return /^\d*\.?\d+$/.test(trimmed) ? Number(trimmed) : NaN
}
