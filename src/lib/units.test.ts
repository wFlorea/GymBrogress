import { describe, expect, it } from 'vitest'
import { fromKg, isWeightUnit, roundWeight, toKg, weightText } from './units'

describe('fromKg and toKg', () => {
  it('leaves kg as it is', () => {
    expect(fromKg(72.5, 'kg')).toBe(72.5)
    expect(toKg(72.5, 'kg')).toBe(72.5)
  })

  it('converts to and from lb', () => {
    expect(fromKg(100, 'lb')).toBeCloseTo(220.462, 3)
    expect(toKg(220.462, 'lb')).toBeCloseTo(100, 3)
  })
})

describe('roundWeight', () => {
  it('keeps kg to 0.01 and lb to 0.1', () => {
    expect(roundWeight(22.254, 'kg')).toBe(22.25)
    expect(roundWeight(160.04, 'lb')).toBe(160)
    expect(roundWeight(160.06, 'lb')).toBe(160.1)
  })
})

describe('weightText', () => {
  it('is empty without a weight', () => {
    expect(weightText(null, 'kg')).toBe('')
  })

  it('shows a weight in the unit picked', () => {
    expect(weightText(72.5, 'kg')).toBe('72.5')
    expect(weightText(100, 'lb')).toBe('220.5')
  })

  it('gives back a weight typed in lb once it is kept to 0.01 kg', () => {
    for (const typed of [45, 100, 135.5, 160.2, 225, 881]) {
      const kept = Math.round(toKg(typed, 'lb') * 100) / 100
      expect(weightText(kept, 'lb')).toBe(String(typed))
    }
  })
})

describe('isWeightUnit', () => {
  it('accepts kg and lb only', () => {
    expect(isWeightUnit('kg')).toBe(true)
    expect(isWeightUnit('lb')).toBe(true)
    expect(isWeightUnit('lbs')).toBe(false)
    expect(isWeightUnit(null)).toBe(false)
  })
})
