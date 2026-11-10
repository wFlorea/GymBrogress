import 'server-only'
import { HEALTH_CONSENT_KEY, hasHealthConsent } from '@/lib/legal'
import type { AuthUser } from '@/utils/supabase/auth-user'
import type { createClient } from '@/utils/supabase/server'
import { dbFail, fail } from './action-result'

type Supabase = Awaited<ReturnType<typeof createClient>>

/** Saves when the user consented to us keeping their body details, or clears it (`null`); answers with any error. */
export async function setHealthConsent(supabase: Supabase, consentedAt: string | null) {
  const { error } = await supabase.auth.updateUser({ data: { [HEALTH_CONSENT_KEY]: consentedAt } })
  if (error) return error
  // The signed-in user is read from the session token, so swap it for one that has the change in it.
  const { error: refreshError } = await supabase.auth.refreshSession()
  if (refreshError) console.error('setHealthConsent:', refreshError.message)
  return null
}

/**
 * Before saving body details: null when the user has consented, now (`given`) or earlier; otherwise the failure to
 * answer with.
 */
export async function requireHealthConsent({ user, supabase }: { user: AuthUser; supabase: Supabase }, given: unknown) {
  if (hasHealthConsent(user.user_metadata)) return null
  if (given !== true) return fail('Tick the box to agree that we can keep your body details.')
  const error = await setHealthConsent(supabase, new Date().toISOString())
  return error ? dbFail('requireHealthConsent', error, 'Could not save your consent. Please try again.') : null
}
