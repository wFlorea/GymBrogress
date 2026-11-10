import { describe, expect, it } from 'vitest'
import { cleanProduct, isOwnProductPhoto, parsePer100g } from './products'

const per100g = { calories: 406.4, protein: 8.04, carbs: 45.55, fat: 21 }

describe('parsePer100g', () => {
  it('reads all four numbers', () => {
    expect(parsePer100g({ calories: '406', protein: '8', carbs: '45,5', fat: '21' })).toEqual({
      calories: 406,
      protein: 8,
      carbs: 45.5,
      fat: 21,
    })
  })

  it('needs every number', () => {
    expect(parsePer100g({ calories: '406', protein: '', carbs: '45', fat: '21' })).toBeNull()
    expect(parsePer100g({ calories: 'lots', protein: '8', carbs: '45', fat: '21' })).toBeNull()
  })
})

describe('cleanProduct', () => {
  it('trims the name and rounds the numbers', () => {
    expect(cleanProduct({ name: '  Croissant ', per100g })).toEqual({
      name: 'Croissant',
      per100g: { calories: 406, protein: 8, carbs: 45.6, fat: 21 },
    })
  })

  it('needs a name that fits', () => {
    expect(cleanProduct({ name: '   ', per100g })).toBe('Give the product a name.')
    expect(typeof cleanProduct({ name: 'x'.repeat(81), per100g })).toBe('string')
  })

  it('rejects numbers no label could show', () => {
    expect(typeof cleanProduct({ name: 'A', per100g: { ...per100g, calories: 901 } })).toBe('string')
    expect(typeof cleanProduct({ name: 'A', per100g: { ...per100g, fat: 101 } })).toBe('string')
    expect(typeof cleanProduct({ name: 'A', per100g: { ...per100g, protein: -1 } })).toBe('string')
  })

  it('rejects macros that add up to more than the 100 g, allowing for rounding', () => {
    expect(typeof cleanProduct({ name: 'A', per100g: { calories: 500, protein: 40, carbs: 40, fat: 30 } })).toBe('string')
    expect(typeof cleanProduct({ name: 'Oil', per100g: { calories: 900, protein: 0.5, carbs: 0.3, fat: 100 } })).toBe('object')
  })
})

describe('isOwnProductPhoto', () => {
  const user = '11111111-1111-4111-8111-111111111111'
  const file = '22222222-2222-4222-8222-222222222222.jpg'

  it('accepts a photo in the own folder', () => {
    expect(isOwnProductPhoto(`${user}/${file}`, user)).toBe(true)
  })

  it("refuses someone else's folder and odd paths", () => {
    expect(isOwnProductPhoto(`33333333-3333-4333-8333-333333333333/${file}`, user)).toBe(false)
    expect(isOwnProductPhoto(`${user}/../other/${file}`, user)).toBe(false)
    expect(isOwnProductPhoto(`${user}/photo.png`, user)).toBe(false)
    expect(isOwnProductPhoto(null, user)).toBe(false)
  })
})
