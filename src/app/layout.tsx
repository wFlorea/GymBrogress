import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { BottomNav } from '@/components/BottomNav'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'GymBrogress',
  description: 'Track your gym progress and plan your workouts.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ro">
      <body className={`${inter.className} pb-16`}>
        <main className="min-h-screen bg-[var(--background)]">
          {children}
        </main>
        <BottomNav />
      </body>
    </html>
  )
}
