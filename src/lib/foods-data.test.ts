import { describe, expect, it } from 'vitest'
import { COMMON_FOODS, searchCommonFoods } from './foods-data'

const names = (query: string) => searchCommonFoods(query).map((food) => food.name)

describe('COMMON_FOODS', () => {
  it('has no repeated foods', () => {
    expect(new Set(COMMON_FOODS.map((food) => food.id)).size).toBe(COMMON_FOODS.length)
    expect(new Set(COMMON_FOODS.map((food) => food.name)).size).toBe(COMMON_FOODS.length)
  })

  it('has values that can be right', () => {
    for (const { name, per100g } of COMMON_FOODS) {
      expect(per100g.protein + per100g.carbs + per100g.fat, name).toBeLessThanOrEqual(100.5)
      expect(per100g.calories, name).toBeLessThanOrEqual(900)
    }
  })
})

describe('searchCommonFoods', () => {
  it('finds both kinds of fries', () => {
    expect(names('french fries').slice(0, 2)).toEqual(['French fries (fried in oil)', 'French fries (oven/air fryer)'])
    expect(names('air fryer')).toContain('French fries (oven/air fryer)')
  })

  it('finds fries by their other names', () => {
    expect(names('chips')).toContain('French fries (fried in oil)')
    expect(names('frites')).toContain('French fries (oven/air fryer)')
  })

  it('puts the plain food before foods named after it', () => {
    expect(names('egg')[0]).toBe('Egg')
    expect(names('chicken')[0]).toBe('Chicken breast (raw)')
  })

  it('finds takeaway meals and drinks', () => {
    expect(names('pizza')).toEqual(['Pizza, cheese', 'Pizza, pepperoni'])
    expect(names('kebab')).toContain('Gyro (pita wrap)')
    expect(names('prosecco')).toContain('Sparkling wine')
  })

  it('is empty without a search', () => {
    expect(searchCommonFoods('  ')).toEqual([])
  })
})
