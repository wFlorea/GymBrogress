import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { WELCOME_SEEN_COOKIE } from '@/lib/welcome'

/** Pages that work without an account; everything else needs a session. */
const PUBLIC_PATHS = ['/login', '/welcome']

const isPublic = (pathname: string) => PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`))

function redirectTo(request: NextRequest, pathname: string, from: NextResponse) {
  const url = request.nextUrl.clone()
  url.pathname = pathname
  url.search = ''
  const response = NextResponse.redirect(url)
  // Keep any refreshed session cookies.
  from.cookies.getAll().forEach((cookie) => response.cookies.set(cookie))
  return response
}

/** Refreshes the Supabase session on every request and keeps signed-out visitors on /welcome (first visit) or /login. */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        response = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
      },
    },
  })

  // Verifies the token locally with the project's public keys, without a network call per request.
  const { data } = await supabase.auth.getClaims()
  const signedIn = Boolean(data?.claims?.sub)
  const { pathname } = request.nextUrl

  if (!signedIn && !isPublic(pathname)) {
    const seenWelcome = request.cookies.has(WELCOME_SEEN_COOKIE)
    return redirectTo(request, seenWelcome ? '/login' : '/welcome', response)
  }
  if (signedIn && isPublic(pathname)) return redirectTo(request, '/dashboard', response)
  return response
}

export const config = {
  matcher: [
    // Everything except Next.js internals, static files (icons, images, the web manifest, robots.txt, the sitemap, the
    // service worker) and the crons, which check their own secret.
    '/((?!_next/static|_next/image|api/cron/|favicon.ico|manifest.webmanifest|robots.txt|sitemap.xml|sw.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
}
