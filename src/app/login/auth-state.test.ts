import { describe, expect, it } from 'vitest'
import { PASSWORD_LINK_MINUTES, isFreshEmailSession } from './auth-state'

const now = Date.parse('2026-10-31T12:00:00Z')
/** Unix seconds, like the `amr` claim, this many minutes before `now`. */
const minutesAgo = (minutes: number) => now / 1000 - minutes * 60

describe('isFreshEmailSession', () => {
  it('accepts a session from a password link just opened', () => {
    expect(isFreshEmailSession([{ method: 'recovery', timestamp: minutesAgo(1) }], now)).toBe(true)
  })

  it('accepts the other email methods', () => {
    expect(isFreshEmailSession([{ method: 'email/signup', timestamp: minutesAgo(1) }], now)).toBe(true)
    expect(isFreshEmailSession([{ method: 'otp', timestamp: minutesAgo(1) }], now)).toBe(true)
  })

  it('refuses a password sign-in, however recent', () => {
    expect(isFreshEmailSession([{ method: 'password', timestamp: minutesAgo(0) }], now)).toBe(false)
  })

  it('refuses a link opened too long ago', () => {
    expect(isFreshEmailSession([{ method: 'recovery', timestamp: minutesAgo(PASSWORD_LINK_MINUTES + 1) }], now)).toBe(false)
  })

  it('refuses what is not a list of sign-in methods', () => {
    expect(isFreshEmailSession(undefined, now)).toBe(false)
    expect(isFreshEmailSession('recovery', now)).toBe(false)
    expect(isFreshEmailSession([null, { method: 'recovery' }, { method: 'recovery', timestamp: '1' }], now)).toBe(false)
  })
})
