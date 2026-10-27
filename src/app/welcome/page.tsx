import type { Metadata } from 'next'
import { SITE_URL } from '@/lib/site'
import { WelcomeClient } from './WelcomeClient'

// The page signed-out visitors and search engines land on, so it's the one search results show.
export const metadata: Metadata = {
  title: { absolute: 'GymBrogress · Workout and calorie tracker' },
  alternates: { canonical: '/welcome' },
}

/** The site's name for search results, with the other names people search it by. */
const siteData = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'GymBrogress',
  alternateName: ['Gym Florea', 'gym.florea.lol'],
  url: `${SITE_URL}/`,
}

export default function WelcomePage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(siteData) }} />
      <WelcomeClient />
    </>
  )
}
