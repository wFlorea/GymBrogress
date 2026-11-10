// How long data that nobody is using stays around. The weekly cleanup (`api/cron/cleanup`) applies these, and the
// Privacy page and the send-a-product form quote them.

/** A sign-up whose email was never confirmed is removed after this many days. */
export const UNCONFIRMED_SIGNUP_DAYS = 7
/** A sent-in product that nobody checked is removed, with its photos, after this many days. */
export const WAITING_PRODUCT_DAYS = 30
/** An uploaded photo that no product points to (the upload finished, sending the form didn't). */
export const STRAY_PHOTO_DAYS = 2

const DAY_MS = 24 * 60 * 60 * 1000

/** The moment before which something is more than `days` old, as an ISO timestamp. */
export function cutoff(days: number, now: Date): string {
  return new Date(now.getTime() - days * DAY_MS).toISOString()
}

/** A missing or unreadable date counts as new, so nothing is deleted on a guess. */
function isOlderThan(timestamp: string | null | undefined, days: number, now: Date): boolean {
  if (!timestamp) return false
  const time = Date.parse(timestamp)
  return !Number.isNaN(time) && now.getTime() - time > days * DAY_MS
}

/** The fields of a Supabase auth user this decision needs. */
type SignUp = { created_at: string; email_confirmed_at?: string | null; last_sign_in_at?: string | null }

/** Never confirmed, never signed in and old enough. An account that has signed in even once is never touched. */
export function isStaleSignup(user: SignUp, now: Date): boolean {
  return !user.email_confirmed_at && !user.last_sign_in_at && isOlderThan(user.created_at, UNCONFIRMED_SIGNUP_DAYS, now)
}

/** The photos no waiting product points to, once they're old enough that their form can't still be on its way. */
export function strayPhotos(files: { path: string; createdAt: string | null | undefined }[], waiting: ReadonlySet<string>, now: Date): string[] {
  return files.filter((file) => !waiting.has(file.path) && isOlderThan(file.createdAt, STRAY_PHOTO_DAYS, now)).map((file) => file.path)
}
