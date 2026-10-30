'use server'

import { getSession } from '@/lib/data/session'
import { authErrorMessage } from '@/app/login/auth-errors'
import { MIN_PASSWORD_LENGTH, field, type AuthState } from '@/app/login/auth-state'

/** Sets a new password for the signed-in user (after a reset link, or from Settings). */
export async function updatePassword(_previous: AuthState, formData: FormData): Promise<AuthState> {
  const password = field(formData, 'password')
  if (password.length < MIN_PASSWORD_LENGTH) {
    return { error: `Your password needs at least ${MIN_PASSWORD_LENGTH} characters.` }
  }
  if (password !== field(formData, 'confirmPassword')) return { error: 'The passwords don’t match.' }

  const { supabase } = await getSession()
  const { error } = await supabase.auth.updateUser({ password })
  if (error) return { error: authErrorMessage(error) }

  return { notice: 'Your password is changed. Use it next time you sign in.' }
}
