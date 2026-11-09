import { afterEach, describe, expect, it, vi } from 'vitest'
import { lookupBarcode } from './open-food-facts'

vi.mock('server-only', () => ({}))

const CODE = '3017620422003'
const NUTRIMENTS = { 'energy-kcal_100g': 539, proteins_100g: 6.3, carbohydrates_100g: 57.5, fat_100g: 30.9 }

function answer(status: number, body: unknown) {
  vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify(body), { status })))
}

afterEach(() => vi.unstubAllGlobals())

describe('lookupBarcode', () => {
  it('returns a food when the product has full nutrition', async () => {
    answer(200, { status: 1, product: { product_name: 'Nutella', brands: 'Ferrero, Nutella', nutriments: NUTRIMENTS } })
    await expect(lookupBarcode(CODE)).resolves.toEqual({
      status: 'found',
      food: {
        id: `off-${CODE}`,
        name: 'Nutella',
        brand: 'Ferrero',
        per100g: { calories: 539, protein: 6.3, carbs: 57.5, fat: 30.9 },
      },
    })
  })

  it('returns the name when nutrition is missing', async () => {
    answer(200, { status: 1, product: { product_name: 'Borsec', nutriments: { 'energy-kcal_100g': 0 } } })
    await expect(lookupBarcode(CODE)).resolves.toEqual({ status: 'incomplete', name: 'Borsec' })
  })

  it('keeps names within what the food log accepts', async () => {
    answer(200, { status: 1, product: { product_name: 'x'.repeat(200) } })
    const result = await lookupBarcode(CODE)
    expect(result.status === 'incomplete' && result.name.length).toBe(80)
  })

  it('treats a 404 as an unknown barcode', async () => {
    answer(404, { status: 0, status_verbose: 'product not found' })
    await expect(lookupBarcode(CODE)).resolves.toEqual({ status: 'unknown' })
  })

  it('treats a product with no name or nutrition as unknown', async () => {
    answer(200, { status: 1, product: {} })
    await expect(lookupBarcode(CODE)).resolves.toEqual({ status: 'unknown' })
  })

  it('throws when the database is down', async () => {
    answer(503, {})
    await expect(lookupBarcode(CODE)).rejects.toThrow('503')
  })
})
