import { NextResponse, type NextRequest } from 'next/server'
import type { EmailOtpType } from '@supabase/supabase-js'
import { NEW_PASSWORD_PATH } from '@/app/login/auth-state'
import { createClient } from '@/utils/supabase/server'

const OTP_TYPES: readonly EmailOtpType[] = ['signup', 'invite', 'magiclink', 'recovery', 'email_change', 'email']

const isOtpType = (value: string | null): value is EmailOtpType => OTP_TYPES.includes(value as EmailOtpType)

/** Only paths on this site, so the link can't send anyone elsewhere. */
const safeNext = (value: string | null) => (value?.startsWith('/') && !value.startsWith('//') ? value : '/dashboard')

/**
 * Signs the user in from an email link, then opens `next` (the new-password page for password links, the dashboard for
 * sign-up confirmations). Takes both link styles: `code` from Supabase's default email (works in the browser that
 * asked for it) and `token_hash` + `type` from an email template that links here (works in any browser).
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const code = searchParams.get('code')
  const tokenHash = searchParams.get('token_hash')
  const type = searchParams.get('type')
  const next = safeNext(searchParams.get('next'))

  const supabase = await createClient()
  let failed = true
  if (code) {
    failed = Boolean((await supabase.auth.exchangeCodeForSession(code)).error)
  } else if (tokenHash && isOtpType(type)) {
    failed = Boolean((await supabase.auth.verifyOtp({ type, token_hash: tokenHash })).error)
  }

  const url = request.nextUrl.clone()
  url.search = ''
  if (!failed) {
    url.pathname = next
  } else if (next === NEW_PASSWORD_PATH) {
    url.pathname = '/login'
    url.searchParams.set('mode', 'forgot')
    url.searchParams.set('link', 'expired')
  } else {
    // Supabase only sends a `code` once it has confirmed the email; it just didn't sign them in here (opened in
    // another browser than the one they signed up in). Without a code, the link itself was refused.
    url.pathname = '/login'
    url.searchParams.set('link', code ? 'confirmed' : 'expired')
  }
  return NextResponse.redirect(url)
}
