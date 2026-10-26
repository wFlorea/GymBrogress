import 'server-only'
import { cache } from 'react'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { getAuthUser, type AuthUser } from '@/utils/supabase/auth-user'
import { createClient } from '@/utils/supabase/server'
import { isValidTimeZone, TIMEZONE_COOKIE, todayIn } from '@/lib/date'
import type { IsoDate } from '@/lib/types'

/** The signed-in user; sends the visitor to /login otherwise. */
export async function requireUser(): Promise<AuthUser> {
  const user = await getAuthUser()
  if (!user) redirect('/login')
  return user
}

/** The signed-in user plus a Supabase client acting as them. */
export async function getSession() {
  const [user, supabase] = await Promise.all([requireUser(), createClient()])
  return { user, supabase }
}

/** Today's date in the user's time zone (falls back to UTC until the browser reports it). */
export const getToday = cache(async (): Promise<IsoDate> => {
  const timeZone = (await cookies()).get(TIMEZONE_COOKIE)?.value
  return todayIn(timeZone && isValidTimeZone(timeZone) ? timeZone : 'UTC')
})

export function getDisplayName(user: AuthUser): string {
  const name = user.user_metadata?.name
  if (typeof name === 'string' && name.trim()) return name.trim()
  return user.email?.split('@')[0] || 'Champ'
}
