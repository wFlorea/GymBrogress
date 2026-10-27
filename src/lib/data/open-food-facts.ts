import 'server-only'
import { APP_VERSION } from '@/lib/version'
import type { CatalogFood } from '@/lib/types'

// Packaged and branded foods from Open Food Facts (openfoodfacts.org), an open database (ODbL) that needs no key.
// It asks apps to name themselves in the User-Agent.
const SEARCH_URL = 'https://search.openfoodfacts.org/search'
const USER_AGENT = `GymBrogress/${APP_VERSION} (https://github.com/wFlorea/GymBrogress)`
/** How many products a search returns. */
const MAX_PRODUCTS = 15

interface Product {
  code?: string
  product_name?: string
  product_name_en?: string
  brands?: string[] | string
  nutriments?: Record<string, unknown>
}

function amount(value: unknown): number | null {
  const number = typeof value === 'string' ? Number(value) : value
  return typeof number === 'number' && Number.isFinite(number) && number >= 0 ? number : null
}

/** The product with its nutrition per 100 g, or null when that's missing or can't be right. */
function toCatalogFood(product: Product): CatalogFood | null {
  const name = (product.product_name_en || product.product_name)?.trim()
  if (!product.code || !name) return null

  const nutriments = product.nutriments ?? {}
  const kilojoules = amount(nutriments.energy_100g)
  const calories = amount(nutriments['energy-kcal_100g']) ?? (kilojoules === null ? null : kilojoules / 4.184)
  const protein = amount(nutriments.proteins_100g)
  const carbs = amount(nutriments.carbohydrates_100g)
  const fat = amount(nutriments.fat_100g)
  if (calories === null || protein === null || carbs === null || fat === null) return null
  // 100 g of anything holds at most 100 g of macros, and pure fat is about 900 kcal.
  if (calories > 950 || protein + carbs + fat > 105) return null

  const brands = Array.isArray(product.brands) ? product.brands : product.brands?.split(',')
  const tenth = (value: number) => Math.round(value * 10) / 10
  return {
    id: `off-${product.code}`,
    name,
    brand: brands?.[0]?.trim() || undefined,
    per100g: { calories: tenth(calories), protein: tenth(protein), carbs: tenth(carbs), fat: tenth(fat) },
  }
}

/** Products matching `query`, best matches first, one per name and brand. Throws when Open Food Facts can't be reached. */
export async function searchProducts(query: string): Promise<CatalogFood[]> {
  const params = new URLSearchParams({
    q: query,
    langs: 'en',
    page_size: '30',
    fields: 'code,product_name,product_name_en,brands,nutriments',
  })
  const response = await fetch(`${SEARCH_URL}?${params}`, {
    headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' },
    signal: AbortSignal.timeout(6000),
  })
  if (!response.ok) throw new Error(`Open Food Facts answered ${response.status}`)
  const { hits } = (await response.json()) as { hits?: Product[] }

  const seen = new Set<string>()
  const foods: CatalogFood[] = []
  for (const product of hits ?? []) {
    const food = toCatalogFood(product)
    const key = food && `${food.name}|${food.brand ?? ''}`.toLowerCase()
    if (!food || !key || seen.has(key)) continue
    seen.add(key)
    foods.push(food)
    if (foods.length === MAX_PRODUCTS) break
  }
  return foods
}
