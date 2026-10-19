'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Calendar, CalendarDays, ClipboardList, Dumbbell, User } from 'lucide-react'

export function BottomNav() {
  const pathname = usePathname()

  if (pathname === '/login') return null

  const navItems = [
    { name: 'Acasă', href: '/dashboard', icon: Home },
    { name: 'Schedule', href: '/schedule', icon: Calendar },
    { name: 'Calendar', href: '/calendar', icon: CalendarDays },
    { name: 'Plan', href: '/plan', icon: ClipboardList },
    { name: 'Tracker', href: '/tracker', icon: Dumbbell },
    { name: 'Profil', href: '/profile', icon: User },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 bg-[var(--color-surface)]/95 backdrop-blur-md border-t border-[var(--color-border)] pb-safe shadow-2xl">
      <div className="flex justify-around items-center h-16 max-w-lg mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname.startsWith(item.href)
          
          return (
            <Link 
              key={item.href} 
              href={item.href}
              className={`flex flex-col items-center justify-center w-full h-full space-y-1 active:scale-90 transition-transform ${
                isActive ? 'text-[var(--color-primary)] font-bold' : 'text-[var(--color-muted)] hover:text-white transition-colors'
              }`}
            >
              <Icon size={19} className={isActive ? 'stroke-[2.5px]' : ''} />
              <span className="text-[9px] sm:text-[10px] tracking-tight">{item.name}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
