import 'server-only'
import { headers } from 'next/headers'
import { SITE_URL } from '@/lib/site'

/**
 * Where a link in one of Supabase's emails sends the user: `/auth/confirm` signs them in, then opens `next`. Points
 * back to this site (localhost in development); Supabase only follows links to its allowed redirect URLs.
 */
export async function emailLinkTo(next: string): Promise<string> {
  const origin = (await headers()).get('origin') ?? SITE_URL
  return `${origin}/auth/confirm?next=${next}`
}
