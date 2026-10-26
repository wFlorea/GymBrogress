'use client'

import { useLayoutEffect, useRef, type ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import { tabPath } from '@/components/BottomNav'

type Enter = 'tab' | 'forward' | 'back'

// The page being left. Kept at module level because Next mounts a new template for each page.
let lastPathname: string | null = null

/** How deep a page sits in its tab: /profile is 1, /progress is 2, /progress/ex-001 is 3. */
function depth(pathname: string): number {
  const segments = pathname.split('/').filter(Boolean).length
  return tabPath(pathname) === pathname ? segments : segments + 1
}

function enterDirection(from: string, to: string): Enter {
  if (tabPath(from).split('/')[1] !== tabPath(to).split('/')[1]) return 'tab'
  const change = depth(to) - depth(from)
  return change > 0 ? 'forward' : change < 0 ? 'back' : 'tab'
}

/** Animates every page in (the motion lives in globals.css). The first page of a visit shows without it. */
export default function Template({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const ref = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    if (lastPathname && lastPathname !== pathname) ref.current!.dataset.enter = enterDirection(lastPathname, pathname)
    lastPathname = pathname
  }, [pathname])

  return (
    <div ref={ref} className="overflow-x-clip">
      {children}
    </div>
  )
}
