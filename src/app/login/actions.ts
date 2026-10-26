'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import type { AuthError } from '@supabase/supabase-js'
import { createClient } from '@/utils/supabase/server'
import { MAX_NAME_LENGTH, MIN_PASSWORD_LENGTH, type AuthState } from './auth-state'

function field(formData: FormData, name: string): string {
  const value = formData.get(name)
  return typeof value === 'string' ? value : ''
}

/** Turns a Supabase auth error into a message that is safe and useful to show. */
function authErrorMessage(error: AuthError): string {
  switch (error.code) {
    case 'invalid_credentials':
      return 'Wrong email or password.'
    case 'email_not_confirmed':
      return 'Please confirm your email first. Check your inbox for the link.'
    case 'user_already_exists':
    case 'email_exists':
      return 'An account with this email already exists. Sign in instead.'
    case 'weak_password':
      return error.message
    case 'over_request_rate_limit':
    case 'over_email_send_rate_limit':
      return 'Too many attempts. Wait a minute and try again.'
    default:
      console.error('[auth]', error.code, error.message)
      return 'Something went wrong. Please try again.'
  }
}

export async function login(_previous: AuthState, formData: FormData): Promise<AuthState> {
  const email = field(formData, 'email').trim()
  const password = field(formData, 'password')
  if (!email || !password) return { error: 'Enter your email and password.' }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) return { error: authErrorMessage(error) }

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

  const supabase = await createClient()
  const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { name } } })
  if (error) return { error: authErrorMessage(error) }

  // With email confirmation on, Supabase creates the user but no session yet.
  if (!data.session) {
    return { notice: `Almost there! We sent a confirmation link to ${email}. Open it, then sign in.` }
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/login')
}
