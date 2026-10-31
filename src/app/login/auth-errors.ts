import 'server-only'
import type { AuthError } from '@supabase/supabase-js'

/** Turns a Supabase auth error into a message that is safe and useful to show. */
export function authErrorMessage(error: AuthError): string {
  switch (error.code) {
    case 'invalid_credentials':
      return 'Wrong email or password.'
    case 'email_not_confirmed':
      return 'Confirm your email first: open the link we sent you when you signed up.'
    case 'email_address_not_authorized':
      return 'We couldn’t send an email to that address. Please try again later.'
    case 'user_already_exists':
    case 'email_exists':
      return 'An account with this email already exists. Sign in instead.'
    case 'weak_password':
      return error.message
    case 'same_password':
      return 'That’s your current password. Pick a new one.'
    case 'reauthentication_needed':
      return 'For your security, send yourself a new link from Settings → Change password.'
    case 'over_request_rate_limit':
    case 'over_email_send_rate_limit':
      return 'Too many attempts. Wait a minute and try again.'
    default:
      console.error('[auth]', error.code, error.message)
      return 'Something went wrong. Please try again.'
  }
}
