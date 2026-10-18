'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Calendar, ClipboardList, Dumbbell, PlaySquare, User } from 'lucide-react'

export function BottomNav() {
  const pathname = usePathname()

  if (pathname === '/login') return null

  const navItems = [
    { name: 'Acasă', href: '/dashboard', icon: Home },
    { name: 'Schedule', href: '/schedule', icon: Calendar },
    { name: 'Plan', href: '/plan', icon: ClipboardList },
    { name: 'Tracker', href: '/tracker', icon: Dumbbell },
    { name: 'Video', href: '/exercises', icon: PlaySquare },
    { name: 'Profil', href: '/profile', icon: User },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[var(--color-surface)] border-t border-[var(--color-border)] pb-safe">
      <div className="flex justify-around items-center h-16">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname.startsWith(item.href)
          
          return (
            <Link 
              key={item.href} 
              href={item.href}
              className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${
                isActive ? 'text-[var(--color-primary)]' : 'text-[var(--color-muted)] hover:text-white transition-colors'
              }`}
            >
              <Icon size={19} className={isActive ? 'stroke-[2.5px]' : ''} />
              <span className="text-[9px] sm:text-[10px] font-semibold">{item.name}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
