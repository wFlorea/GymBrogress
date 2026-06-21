'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Calendar, Dumbbell, PlaySquare, User } from 'lucide-react'

export function BottomNav() {
  const pathname = usePathname()

  if (pathname === '/login') return null

  const navItems = [
    { name: 'Acasă', href: '/dashboard', icon: Home },
    { name: 'Plan', href: '/planner', icon: Calendar },
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
              <Icon size={20} className={isActive ? 'stroke-[2.5px]' : ''} />
              <span className="text-[10px] font-medium">{item.name}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
