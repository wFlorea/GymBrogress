'use server'

import { fail, ok } from '@/lib/data/action-result'
import { getSession } from '@/lib/data/session'
import type { ActionResult } from '@/lib/types'
import { authErrorMessage } from '@/app/login/auth-errors'
import { MIN_PASSWORD_LENGTH, NEW_PASSWORD_PATH, field, isFreshEmailSession, type AuthState } from '@/app/login/auth-state'
import { emailLinkTo } from '@/app/login/email-link'

/** Emails the signed-in user a link to the new-password page: the only way to change the password. */
export async function sendPasswordLink(): Promise<ActionResult> {
  const { user, supabase } = await getSession()
  if (!user.email) return fail('Your account has no email to send the link to.')

  const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
    redirectTo: await emailLinkTo(NEW_PASSWORD_PATH),
  })
  if (error) return fail(authErrorMessage(error))
  return ok()
}

/**
 * Sets a new password for the signed-in user, if they came from a password link in their email (see
 * `isFreshEmailSession`), then signs them out on their other devices.
 */
export async function updatePassword(_previous: AuthState, formData: FormData): Promise<AuthState> {
  const password = field(formData, 'password')
  if (password.length < MIN_PASSWORD_LENGTH) {
    return { error: `Your password needs at least ${MIN_PASSWORD_LENGTH} characters.` }
  }
  if (password !== field(formData, 'confirmPassword')) return { error: 'The passwords don’t match.' }

  const { supabase } = await getSession()
  const { data } = await supabase.auth.getClaims()
  if (!isFreshEmailSession(data?.claims.amr)) {
    return { error: 'This link has run out. Send yourself a new one from Settings → Change password.' }
  }

  const { error } = await supabase.auth.updateUser({ password })
  if (error) return { error: authErrorMessage(error) }

  const { error: signOutError } = await supabase.auth.signOut({ scope: 'others' })
  if (signOutError) console.error('updatePassword: signing out other devices:', signOutError.message)

  return { notice: 'Your password is changed, and you’re signed out on your other devices.' }
}
