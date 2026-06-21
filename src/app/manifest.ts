import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'GymBrogress Tracker',
    short_name: 'GymBrogress',
    description: 'Track your gym progress and plan workouts',
    start_url: '/dashboard',
    display: 'standalone',
    background_color: '#121212',
    theme_color: '#FF4500',
    icons: [
      {
        src: '/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}
