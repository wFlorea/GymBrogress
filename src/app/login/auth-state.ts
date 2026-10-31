// Shared by the login and password forms and their server actions ('use server' files can only export functions).

export const MIN_PASSWORD_LENGTH = 6
export const MAX_NAME_LENGTH = 50

/** Where a password link from an email ends up: the only place to set a new password. */
export const NEW_PASSWORD_PATH = '/password'

/** Where a sign-up confirmation link ends up. */
export const CONFIRMED_PATH = '/dashboard'

/** How long after opening a password link from an email the new password can be set. */
export const PASSWORD_LINK_MINUTES = 30

/** How a session started (Supabase's `amr` claim) when it came from a link or code in one of our emails. */
const EMAIL_METHODS = ['recovery', 'email/signup', 'magiclink', 'otp', 'invite']

/**
 * Whether the session was started from one of our emails in the last {@link PASSWORD_LINK_MINUTES} minutes, so the
 * user has shown they own the email. Signing in with the password alone isn't enough to change it.
 */
export function isFreshEmailSession(amr: unknown, now = Date.now()): boolean {
  if (!Array.isArray(amr)) return false
  return amr.some(
    (entry) =>
      EMAIL_METHODS.includes(entry?.method) &&
      typeof entry.timestamp === 'number' &&
      now / 1000 - entry.timestamp < PASSWORD_LINK_MINUTES * 60
  )
}

/**
 * What a login, signup or password attempt tells the form. `unconfirmed`: the account's email isn't confirmed yet, so
 * the form offers to send the confirmation link again.
 */
export type AuthState = { error?: string; notice?: string; unconfirmed?: boolean } | null

export function field(formData: FormData, name: string): string {
  const value = formData.get(name)
  return typeof value === 'string' ? value : ''
}
