import { dayOfWeek, hourIn, isValidTimeZone, todayIn } from './date'
import type { IsoDate } from './types'

/**
 * Push services of the browsers (Chrome and most others, Firefox, Safari, Edge); subscriptions to any other host are
 * refused, so the reminder cron never posts elsewhere. push_subscriptions has the same check.
 */
const PUSH_HOSTS = ['.googleapis.com', '.mozilla.com', '.push.apple.com', '.notify.windows.com']

/** Whether `value` is an https URL of one of the browsers' push services. */
export function isPushEndpoint(value: unknown): value is string {
  if (typeof value !== 'string' || value.length > 2048) return false
  try {
    const url = new URL(value)
    return url.protocol === 'https:' && PUSH_HOSTS.some((host) => url.hostname.endsWith(host))
  } catch {
    return false
  }
}

/** Local hours the reminder may arrive in: from 07:00 to 21:59, never at night. */
const FIRST_HOUR = 7
const LAST_HOUR = 21

/**
 * The Monday it is in the device's time zone when that's daytime, so the reminder can go out; null on any other
 * day or at night. Devices without a time zone count as UTC.
 */
export function reminderMonday(timeZone: string | null, now: Date): IsoDate | null {
  const zone = timeZone && isValidTimeZone(timeZone) ? timeZone : 'UTC'
  const today = todayIn(zone, now)
  const hour = hourIn(zone, now)
  return dayOfWeek(today) === 0 && hour >= FIRST_HOUR && hour <= LAST_HOUR ? today : null
}
