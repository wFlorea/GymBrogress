import 'server-only'
import { createClient } from '@supabase/supabase-js'

/** A Supabase client with the service role key: it bypasses RLS, so only use it in trusted jobs such as crons. */
export function createAdminClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!key) throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set.')
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
