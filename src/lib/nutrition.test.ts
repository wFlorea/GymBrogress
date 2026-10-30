import { describe, expect, it } from 'vitest'
import {
  caloriesFromMacros,
  goalsForCalories,
  macrosForCalories,
  nutritionFor,
  parseAmount,
  per100gOf,
  planCalories,
  recommendedGoals,
  sumNutrition,
  waterGoalMl,
  weeklyWeightChange,
} from './nutrition'
import type { BodyStats } from './types'

describe('waterGoalMl', () => {
  it('is 2 litres without a weight', () => {
    expect(waterGoalMl(null)).toBe(2000)
  })

  it('is about 35 ml per kg, in whole glasses', () => {
    // 70 × 35 = 2450 ml, 9.8 glasses
    expect(waterGoalMl(70)).toBe(2500)
  })

  it('stays between 1.5 and 4 litres', () => {
    expect(waterGoalMl(30)).toBe(1500)
    expect(waterGoalMl(150)).toBe(4000)
  })
})

describe('caloriesFromMacros', () => {
  it('counts 4 kcal per gram of protein and carbs and 9 per gram of fat', () => {
    expect(caloriesFromMacros({ protein: 10, carbs: 20, fat: 5 })).toBe(165)
  })
})

describe('macrosForCalories', () => {
  it('gives 2 g of protein per kg, a quarter of the calories from fat, and carbs for the rest', () => {
    expect(macrosForCalories(2000, 80)).toEqual({ protein: 160, carbs: 214, fat: 56 })
  })

  it('gives no carbs when protein and fat use up the calories', () => {
    expect(macrosForCalories(800, 150).carbs).toBe(0)
  })
})

describe('planCalories', () => {
  it('moves the maintenance by the pace, to the nearest hundred', () => {
    expect(planCalories(2800, 'maintain', 10)).toBe(2800)
    expect(planCalories(2800, 'cut', 10)).toBe(2500)
    expect(planCalories(2800, 'bulk', 15)).toBe(3200)
  })
})

describe('weeklyWeightChange', () => {
  it('is the weekly calorie difference over 7700 kcal a kg', () => {
    expect(weeklyWeightChange(2300, 2850)).toBeCloseTo(-0.5)
    expect(weeklyWeightChange(2850, 2850)).toBe(0)
  })
})

describe('goalsForCalories', () => {
  it('keeps the calories within the goal limits', () => {
    expect(goalsForCalories(300, 70).calories).toBe(500)
    expect(goalsForCalories(20_000, 70).calories).toBe(10_000)
  })

  it('caps each macro', () => {
    expect(goalsForCalories(20_000, 70).carbs).toBe(1000)
  })
})

describe('recommendedGoals', () => {
  const body: BodyStats = { weight: 80, height: 180, age: 30, sex: 'male', bodyFat: null, activity: 'moderate' }

  it('follows the maintenance and the plan', () => {
    expect(recommendedGoals(body, 'cut', 10)).toEqual({ calories: 2500, protein: 160, carbs: 310, fat: 69 })
  })

  it('is null until the stats are all there', () => {
    expect(recommendedGoals({ ...body, weight: null }, 'cut', 10)).toBeNull()
  })
})

describe('sumNutrition', () => {
  it('adds the foods up', () => {
    expect(sumNutrition([])).toEqual({ calories: 0, protein: 0, carbs: 0, fat: 0 })
    expect(
      sumNutrition([
        { calories: 100, protein: 5, carbs: 10, fat: 2 },
        { calories: 50, protein: 1, carbs: 4, fat: 3 },
      ])
    ).toEqual({ calories: 150, protein: 6, carbs: 14, fat: 5 })
  })
})

describe('nutritionFor and per100gOf', () => {
  const apple = { calories: 52, protein: 1, carbs: 14, fat: 0.2 }

  it('scales from 100 g, to whole kcal and 0.1 g', () => {
    expect(nutritionFor(apple, 150)).toEqual({ calories: 78, protein: 1.5, carbs: 21, fat: 0.3 })
  })

  it('works back to 100 g', () => {
    expect(per100gOf({ calories: 78, protein: 1.5, carbs: 21, fat: 0.3 }, 150)).toEqual({
      calories: 52,
      protein: 1,
      carbs: 14,
      fat: expect.closeTo(0.2),
    })
  })
})

describe('parseAmount', () => {
  it('is null for an empty field', () => {
    expect(parseAmount('')).toBeNull()
    expect(parseAmount('  ')).toBeNull()
  })

  it('reads a dot or a comma as the decimal point', () => {
    expect(parseAmount('12')).toBe(12)
    expect(parseAmount(' 12.5 ')).toBe(12.5)
    expect(parseAmount('12,5')).toBe(12.5)
    expect(parseAmount('.5')).toBe(0.5)
  })

  it('is NaN for anything else', () => {
    expect(parseAmount('abc')).toBeNaN()
    expect(parseAmount('1.2.3')).toBeNaN()
    expect(parseAmount('-5')).toBeNaN()
  })
})
