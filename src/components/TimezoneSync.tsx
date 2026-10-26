'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { TIMEZONE_COOKIE } from '@/lib/date'

const ONE_YEAR = 60 * 60 * 24 * 365

/** Tells the server the browser's time zone, so "today" is the user's today, not the server's. */
export function TimezoneSync() {
  const router = useRouter()

  useEffect(() => {
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone
    if (!timeZone) return
    const saved = document.cookie
      .split('; ')
      .find((c) => c.startsWith(`${TIMEZONE_COOKIE}=`))
      ?.slice(TIMEZONE_COOKIE.length + 1)
    if (saved && decodeURIComponent(saved) === timeZone) return

    document.cookie = `${TIMEZONE_COOKIE}=${encodeURIComponent(timeZone)}; path=/; max-age=${ONE_YEAR}; samesite=lax`
    router.refresh()
  }, [router])

  return null
}
