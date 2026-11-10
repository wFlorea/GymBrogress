import { describe, expect, it } from 'vitest'
import { HEALTH_CONSENT_KEY, hasHealthConsent } from './legal'

describe('hasHealthConsent', () => {
  it('is true once a consent date is saved', () => {
    expect(hasHealthConsent({ [HEALTH_CONSENT_KEY]: '2026-11-09T10:00:00.000Z' })).toBe(true)
  })

  it('is false without one, or after it was withdrawn', () => {
    expect(hasHealthConsent(undefined)).toBe(false)
    expect(hasHealthConsent({ name: 'Sam' })).toBe(false)
    expect(hasHealthConsent({ [HEALTH_CONSENT_KEY]: null })).toBe(false)
  })
})
