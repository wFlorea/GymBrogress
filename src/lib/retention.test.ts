import { describe, expect, it } from 'vitest'
import { STRAY_PHOTO_DAYS, UNCONFIRMED_SIGNUP_DAYS, WAITING_PRODUCT_DAYS, cutoff, isStaleSignup, strayPhotos } from './retention'

const now = new Date('2026-11-09T12:00:00Z')
const daysAgo = (days: number) => new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString()

describe('cutoff', () => {
  it('counts back whole days', () => {
    expect(cutoff(WAITING_PRODUCT_DAYS, now)).toBe('2026-10-10T12:00:00.000Z')
  })
})

describe('isStaleSignup', () => {
  const old = daysAgo(UNCONFIRMED_SIGNUP_DAYS + 1)

  it('removes an old sign-up that never confirmed or signed in', () => {
    expect(isStaleSignup({ created_at: old }, now)).toBe(true)
    expect(isStaleSignup({ created_at: old, email_confirmed_at: null, last_sign_in_at: null }, now)).toBe(true)
  })

  it('keeps a recent sign-up', () => {
    expect(isStaleSignup({ created_at: daysAgo(UNCONFIRMED_SIGNUP_DAYS - 1) }, now)).toBe(false)
  })

  it('never touches an account that confirmed or signed in', () => {
    expect(isStaleSignup({ created_at: old, email_confirmed_at: daysAgo(30) }, now)).toBe(false)
    expect(isStaleSignup({ created_at: old, last_sign_in_at: daysAgo(30) }, now)).toBe(false)
  })

  it('keeps an account with an unreadable date', () => {
    expect(isStaleSignup({ created_at: 'not a date' }, now)).toBe(false)
  })
})

describe('strayPhotos', () => {
  const old = daysAgo(STRAY_PHOTO_DAYS + 1)

  it('picks old photos no waiting product points to', () => {
    expect(strayPhotos([{ path: 'u/a.jpg', createdAt: old }], new Set(), now)).toEqual(['u/a.jpg'])
  })

  it('keeps photos of waiting products, however old', () => {
    expect(strayPhotos([{ path: 'u/a.jpg', createdAt: daysAgo(29) }], new Set(['u/a.jpg']), now)).toEqual([])
  })

  it('keeps recent photos, whose form may still be on its way', () => {
    expect(strayPhotos([{ path: 'u/a.jpg', createdAt: daysAgo(1) }], new Set(), now)).toEqual([])
  })

  it('keeps a photo with no date', () => {
    expect(strayPhotos([{ path: 'u/a.jpg', createdAt: null }], new Set(), now)).toEqual([])
  })
})
