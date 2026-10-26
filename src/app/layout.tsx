import type { Metadata, Viewport } from 'next'
import type { ReactNode } from 'react'
import { Inter } from 'next/font/google'
import './globals.css'
import { BottomNav } from '@/components/BottomNav'
import { TimezoneSync } from '@/components/TimezoneSync'

const inter = Inter({ subsets: ['latin'] })

export const viewport: Viewport = {
  themeColor: '#FF4500',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: 'cover',
}

export const metadata: Metadata = {
  title: { default: 'GymBrogress', template: '%s · GymBrogress' },
  description: 'Track your gym progress and plan your workouts.',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'GymBrogress',
  },
  icons: {
    icon: [
      { url: '/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <main className="min-h-screen bg-background">{children}</main>
        <BottomNav />
        <TimezoneSync />
      </body>
    </html>
  )
}
