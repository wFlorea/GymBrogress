'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { CalendarDays, ClipboardList, Dumbbell, Home, User } from 'lucide-react'

const NAV_ITEMS = [
  { name: 'Home', href: '/dashboard', icon: Home },
  { name: 'Schedule', href: '/schedule', icon: CalendarDays },
  { name: 'Plan', href: '/plan', icon: ClipboardList },
  { name: 'Workout', href: '/tracker', icon: Dumbbell },
  { name: 'Profile', href: '/profile', icon: User },
]

/** Sections (with their sub-pages) that belong to a tab without being under its path. */
const TAB_ALIASES: Record<string, string> = { '/exercises': '/profile', '/progress': '/profile' }

function tabPath(pathname: string): string {
  const section = `/${pathname.split('/')[1] ?? ''}`
  return TAB_ALIASES[section] ?? pathname
}

export function BottomNav() {
  const pathname = usePathname()
  if (pathname === '/login' || pathname === '/welcome') return null

  const current = tabPath(pathname)

  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-surface/95 pb-safe shadow-2xl backdrop-blur-md"
    >
      <div className="mx-auto flex h-16 max-w-lg items-center justify-around">
        {NAV_ITEMS.map(({ name, href, icon: Icon }) => {
          const isActive = current === href || current.startsWith(`${href}/`)
          return (
            <Link
              key={href}
              href={href}
              aria-current={isActive ? 'page' : undefined}
              className={`relative flex h-full w-full flex-col items-center justify-center gap-1 transition-transform active:scale-90 ${
                isActive
                  ? 'font-bold text-primary before:absolute before:top-0 before:h-0.5 before:w-8 before:rounded-full before:bg-primary before:shadow-[0_0_12px_var(--color-primary)]'
                  : 'text-muted transition-colors hover:text-white'
              }`}
            >
              <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[10px] tracking-tight">{name}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
