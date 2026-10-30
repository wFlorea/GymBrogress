import { describe, expect, it } from 'vitest'
import { estimateOneRepMax, isRestSeconds, isValidSetCount } from './sets'

describe('estimateOneRepMax', () => {
  it('is the weight itself for a single', () => {
    expect(estimateOneRepMax(100, 1)).toBe(100)
  })

  it('follows Epley, to the nearest 0.5 kg', () => {
    // 100 × (1 + 5/30) = 116.67
    expect(estimateOneRepMax(100, 5)).toBe(116.5)
    // 100 × (1 + 10/30) = 133.33
    expect(estimateOneRepMax(100, 10)).toBe(133.5)
  })

  it('is null for bodyweight sets, high reps and odd input', () => {
    expect(estimateOneRepMax(0, 5)).toBeNull()
    expect(estimateOneRepMax(100, 13)).toBeNull()
    expect(estimateOneRepMax(100, 0)).toBeNull()
    expect(estimateOneRepMax(100, 2.5)).toBeNull()
  })
})

describe('isValidSetCount and isRestSeconds', () => {
  it('accepts only the allowed values', () => {
    expect(isValidSetCount(3)).toBe(true)
    expect(isValidSetCount(6)).toBe(false)
    expect(isValidSetCount(2.5)).toBe(false)
    expect(isRestSeconds(90)).toBe(true)
    expect(isRestSeconds(45)).toBe(false)
  })
})
