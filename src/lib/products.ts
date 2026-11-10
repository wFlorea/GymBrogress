import { MACROS, MAX_FOOD_NAME_LENGTH, parseAmount } from './nutrition'
import type { Nutrition } from './types'

/** The private storage bucket for the photos people send with a product. */
export const PRODUCT_PHOTOS_BUCKET = 'product-photos'
/** Products one person can have waiting for review at once. */
export const MAX_WAITING_PRODUCTS = 10
/** Pure fat is about 900 kcal per 100 g, so a label can't say more. */
export const MAX_KCAL_PER_100G = 900
/** A macro can't weigh more than the 100 g it's part of. */
export const MAX_MACRO_PER_100G = 100
/** Labels round each macro, so they can add up to slightly over 100 g. */
const MAX_MACROS_TOTAL = 101

export type ProductAmounts = Record<keyof Nutrition, string>

export const NO_PRODUCT_AMOUNTS: ProductAmounts = { calories: '', protein: '', carbs: '', fat: '' }

export interface ProductDetails {
  name: string
  per100g: Nutrition
}

/** The numbers as typed, or null unless all four are numbers. */
export function parsePer100g(amounts: ProductAmounts): Nutrition | null {
  const per100g = {
    calories: parseAmount(amounts.calories),
    protein: parseAmount(amounts.protein),
    carbs: parseAmount(amounts.carbs),
    fat: parseAmount(amounts.fat),
  }
  return Object.values(per100g).some((value) => value === null || Number.isNaN(value)) ? null : (per100g as Nutrition)
}

function inRange(value: unknown, max: number): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= max
}

/** The product as it's stored (trimmed name, whole kcal, macros to 0.1 g), or what's wrong with it. */
export function cleanProduct(product: ProductDetails): ProductDetails | string {
  if (typeof product !== 'object' || product === null) return 'Invalid product.'
  const name = typeof product.name === 'string' ? product.name.trim() : ''
  if (!name) return 'Give the product a name.'
  if (name.length > MAX_FOOD_NAME_LENGTH) return `Keep the name under ${MAX_FOOD_NAME_LENGTH} characters.`

  const values = product.per100g
  if (typeof values !== 'object' || values === null) return 'Fill in the calories, protein, carbs and fat.'
  if (!inRange(values.calories, MAX_KCAL_PER_100G)) return `Calories per 100 g must be between 0 and ${MAX_KCAL_PER_100G}.`
  if (MACROS.some(({ key }) => !inRange(values[key], MAX_MACRO_PER_100G))) {
    return `Protein, carbs and fat per 100 g must be between 0 and ${MAX_MACRO_PER_100G} g.`
  }
  if (values.protein + values.carbs + values.fat > MAX_MACROS_TOTAL) {
    return "Protein, carbs and fat can't add up to more than 100 g. Check the label's per 100 g column."
  }

  const tenths = (value: number) => Math.round(value * 10) / 10
  return {
    name,
    per100g: {
      calories: Math.round(values.calories),
      protein: tenths(values.protein),
      carbs: tenths(values.carbs),
      fat: tenths(values.fat),
    },
  }
}

const PHOTO_FILE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.jpg$/i

/** Whether `path` is a photo in this user's own folder, as `uploadProductPhoto` names them. */
export function isOwnProductPhoto(path: unknown, userId: string): path is string {
  if (typeof path !== 'string') return false
  const [folder, file, ...rest] = path.split('/')
  return folder === userId && rest.length === 0 && PHOTO_FILE.test(file ?? '')
}
