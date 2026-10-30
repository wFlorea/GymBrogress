import { describe, expect, it } from 'vitest'
import {
  bmiCategory,
  bmiOf,
  bmrOf,
  goalProgress,
  goalWeightText,
  maintenanceCaloriesFor,
  missingForCalories,
  weightRangeText,
} from './body'
import type { BodyStats } from './types'

const body: BodyStats = { weight: 80, height: 180, age: 30, sex: 'male', bodyFat: null, activity: 'moderate' }

describe('bmrOf', () => {
  it('follows Mifflin–St Jeor', () => {
    expect(bmrOf(80, 180, 30, 'male')).toBe(1780)
    expect(bmrOf(80, 180, 30, 'female')).toBe(1614)
  })
})

describe('maintenanceCaloriesFor', () => {
  it('is the BMR times the activity level, to the nearest hundred', () => {
    // 1780 × 1.55 = 2759
    expect(maintenanceCaloriesFor(body)).toBe(2800)
  })

  it('needs every stat but the body fat', () => {
    expect(maintenanceCaloriesFor({ ...body, age: null })).toBeNull()
    expect(maintenanceCaloriesFor({ ...body, activity: null })).toBeNull()
  })
})

describe('missingForCalories', () => {
  it('names what is still missing', () => {
    expect(missingForCalories(body)).toEqual([])
    expect(missingForCalories({ ...body, height: null, sex: null })).toEqual(['height', 'sex'])
  })
})

describe('bmiOf and bmiCategory', () => {
  it('works out the BMI to one decimal', () => {
    expect(bmiOf(80, 180)).toBe(24.7)
  })

  it('puts each limit in the range above it', () => {
    expect(bmiCategory(18.4).label).toBe('Underweight')
    expect(bmiCategory(18.5).label).toBe('Healthy weight')
    expect(bmiCategory(25).label).toBe('Overweight')
    expect(bmiCategory(42).label).toBe('Obese')
  })
})

describe('goalWeightText', () => {
  it('says how much is left to lose or gain', () => {
    expect(goalWeightText(80, 75, 'kg')).toBe('5 kg to lose')
    expect(goalWeightText(70, 72.5, 'kg')).toBe('2.5 kg to gain')
  })

  it('works in lb', () => {
    expect(goalWeightText(80, 75, 'lb')).toBe('11 lb to lose')
  })

  it('says when the goal is reached', () => {
    expect(goalWeightText(80, 80, 'kg')).toBe("You're at your goal")
    expect(goalWeightText(80, 80.02, 'kg')).toBe("You're at your goal")
  })
})

describe('weightRangeText', () => {
  it('keeps inside the kg limits', () => {
    expect(weightRangeText('kg')).toBe('20 and 400 kg')
    expect(weightRangeText('lb')).toBe('45 and 881 lb')
  })
})

describe('goalProgress', () => {
  it('is the share of the way to the goal', () => {
    expect(goalProgress(90, 85, 80)).toBe(0.5)
    expect(goalProgress(70, 72, 80)).toBeCloseTo(0.2)
  })

  it('stays between 0 and 1', () => {
    expect(goalProgress(90, 78, 80)).toBe(1)
    expect(goalProgress(90, 92, 80)).toBe(0)
  })

  it('is null when the start was the goal', () => {
    expect(goalProgress(80, 79, 80)).toBeNull()
  })
})
