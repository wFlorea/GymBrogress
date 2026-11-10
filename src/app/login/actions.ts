'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { MIN_AGE } from '@/lib/body'
import { LEGAL_VERSION } from '@/lib/legal'
import { createClient } from '@/utils/supabase/server'
import { authErrorMessage } from './auth-errors'
import {
  CONFIRMED_PATH,
  MAX_NAME_LENGTH,
  MIN_PASSWORD_LENGTH,
  NEW_PASSWORD_PATH,
  field,
  type AuthState,
} from './auth-state'
import { emailLinkTo } from './email-link'

export async function login(_previous: AuthState, formData: FormData): Promise<AuthState> {
  const email = field(formData, 'email').trim()
  const password = field(formData, 'password')
  if (!email || !password) return { error: 'Enter your email and password.' }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) return { error: authErrorMessage(error), unconfirmed: error.code === 'email_not_confirmed' }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

export async function signup(_previous: AuthState, formData: FormData): Promise<AuthState> {
  const name = field(formData, 'name').trim()
  const email = field(formData, 'email').trim()
  const password = field(formData, 'password')

  if (!name) return { error: 'Enter a name or nickname.' }
  if (name.length > MAX_NAME_LENGTH) return { error: `Keep your name under ${MAX_NAME_LENGTH} characters.` }
  if (!email) return { error: 'Enter your email.' }
  if (password.length < MIN_PASSWORD_LENGTH) {
    return { error: `Your password needs at least ${MIN_PASSWORD_LENGTH} characters.` }
  }
  if (password !== field(formData, 'confirmPassword')) return { error: 'The passwords don’t match.' }
  if (field(formData, 'accepted') !== 'yes') {
    return { error: `Confirm you’re ${MIN_AGE} or older and accept the Terms to create an account.` }
  }

  const supabase = await createClient()
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name, terms_accepted_at: new Date().toISOString(), terms_version: LEGAL_VERSION },
      emailRedirectTo: await emailLinkTo(CONFIRMED_PATH),
    },
  })
  if (error) return { error: authErrorMessage(error) }

  // With email confirmation on, Supabase creates the user but no session until the link in the email is opened.
  if (!data.session) {
    return { notice: `Almost there! We sent a confirmation link to ${email}. Open it to start.` }
  }

  revalidatePath('/', 'layout')
  redirect(CONFIRMED_PATH)
}

/** Sends the sign-up confirmation link again, for an account that can't sign in until its email is confirmed. */
export async function resendConfirmation(_previous: AuthState, formData: FormData): Promise<AuthState> {
  const email = field(formData, 'email').trim()
  if (!email) return { error: 'Enter your email.' }

  const supabase = await createClient()
  const { error } = await supabase.auth.resend({
    type: 'signup',
    email,
    options: { emailRedirectTo: await emailLinkTo(CONFIRMED_PATH) },
  })
  if (error) return { error: authErrorMessage(error) }

  return { notice: `We sent a new confirmation link to ${email}. Open it to start.` }
}

/** Emails a link that signs the user in and opens the new-password page. Says the same whether or not the email has an account. */
export async function requestPasswordReset(_previous: AuthState, formData: FormData): Promise<AuthState> {
  const email = field(formData, 'email').trim()
  if (!email) return { error: 'Enter your email.' }

  const supabase = await createClient()
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: await emailLinkTo(NEW_PASSWORD_PATH) })
  if (error) return { error: authErrorMessage(error) }

  return { notice: `If ${email} has an account, a link to set a new password is on its way. Check your inbox.` }
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/login')
}
