import { cache } from 'react'
import { createClient } from './server'

export interface AuthUser {
  id: string
  email?: string
  user_metadata?: Record<string, unknown> & { name?: string }
}

/**
 * The current user, read once per request.
 * Uses getClaims(), which verifies the token locally with the project's cached public keys instead of
 * calling the Supabase auth server on every click. Projects still on the legacy symmetric JWT secret
 * fall back to a network check automatically.
 */
export const getAuthUser = cache(async (): Promise<AuthUser | null> => {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.getClaims()
  if (error || !data?.claims?.sub) return null

  const { sub, email, user_metadata } = data.claims
  return { id: sub, email, user_metadata }
})
