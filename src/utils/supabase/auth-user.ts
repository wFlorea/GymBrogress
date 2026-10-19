import { cache } from 'react'
import { createClient } from './server'

/**
 * Cached per-request user lookup.
 * De-duplicates multiple getUser() calls within the same Server Component render pass.
 */
export const getAuthUser = cache(async () => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
})
