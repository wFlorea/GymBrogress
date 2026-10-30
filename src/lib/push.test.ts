import { describe, expect, it } from 'vitest'
import { isPushEndpoint, reminderMonday } from './push'

describe('isPushEndpoint', () => {
  it("accepts the browsers' push services over https", () => {
    expect(isPushEndpoint('https://fcm.googleapis.com/fcm/send/abc')).toBe(true)
    expect(isPushEndpoint('https://web.push.apple.com/abc')).toBe(true)
    expect(isPushEndpoint('https://updates.push.services.mozilla.com/wpush/v2/abc')).toBe(true)
  })

  it('refuses any other host or protocol', () => {
    expect(isPushEndpoint('http://fcm.googleapis.com/fcm/send/abc')).toBe(false)
    expect(isPushEndpoint('https://googleapis.com.example.com/abc')).toBe(false)
    expect(isPushEndpoint('https://example.com/?to=fcm.googleapis.com')).toBe(false)
  })

  it('refuses what is not a URL', () => {
    expect(isPushEndpoint('not a url')).toBe(false)
    expect(isPushEndpoint(42)).toBe(false)
    expect(isPushEndpoint(`https://fcm.googleapis.com/${'a'.repeat(2048)}`)).toBe(false)
  })
})

describe('reminderMonday', () => {
  // Bucharest is UTC+2 after the clocks went back on 25 October 2026.
  it('is the Monday in daytime', () => {
    expect(reminderMonday('Europe/Bucharest', new Date('2026-10-26T06:00:00Z'))).toBe('2026-10-26')
    expect(reminderMonday('Europe/Bucharest', new Date('2026-10-26T19:59:00Z'))).toBe('2026-10-26')
  })

  it('is null at night', () => {
    expect(reminderMonday('Europe/Bucharest', new Date('2026-10-26T04:00:00Z'))).toBeNull()
    expect(reminderMonday('Europe/Bucharest', new Date('2026-10-26T20:00:00Z'))).toBeNull()
  })

  it('is null on other days', () => {
    expect(reminderMonday('Europe/Bucharest', new Date('2026-10-27T10:00:00Z'))).toBeNull()
  })

  it("follows the device's day, not the server's", () => {
    // Sunday evening in UTC is Monday morning in Auckland.
    expect(reminderMonday('Pacific/Auckland', new Date('2026-10-25T20:00:00Z'))).toBe('2026-10-26')
  })

  it('uses UTC without a valid time zone', () => {
    const mondayMorning = new Date('2026-10-26T10:00:00Z')
    expect(reminderMonday(null, mondayMorning)).toBe('2026-10-26')
    expect(reminderMonday('Not/AZone', mondayMorning)).toBe('2026-10-26')
  })
})
