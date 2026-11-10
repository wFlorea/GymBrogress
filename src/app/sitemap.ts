import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/site'

/** The pages search engines can show; everything else needs an account. */
export default function sitemap(): MetadataRoute.Sitemap {
  return ['/welcome', '/login', '/privacy', '/terms'].map((path) => ({ url: `${SITE_URL}${path}` }))
}
