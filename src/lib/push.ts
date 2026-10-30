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
