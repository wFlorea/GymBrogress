import type { Metadata, Viewport } from 'next'
import type { ReactNode } from 'react'
import { Inter } from 'next/font/google'
import './globals.css'
import { BottomNav } from '@/components/BottomNav'
import { TimezoneSync } from '@/components/TimezoneSync'
import { SITE_URL } from '@/lib/site'
import { lora } from './fonts'

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
  metadataBase: new URL(SITE_URL),
  applicationName: 'GymBrogress',
  title: { default: 'GymBrogress', template: '%s · GymBrogress' },
  description:
    'GymBrogress (gym.florea.lol) is a gym tracker: plan your weekly split, log every set with a rest timer, keep your streak and track calories and macros.',
  // Link previews in chats and on social media.
  openGraph: {
    type: 'website',
    siteName: 'GymBrogress',
    images: [{ url: '/icon-512x512.png', width: 512, height: 512, alt: 'GymBrogress' }],
  },
  twitter: { card: 'summary' },
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
      <body className={`${inter.className} ${lora.variable}`}>
        <main className="min-h-screen bg-background">{children}</main>
        <BottomNav />
        <TimezoneSync />
      </body>
    </html>
  )
}
