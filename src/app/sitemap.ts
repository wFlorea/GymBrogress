import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/site'

/** The pages search engines can show; everything else needs an account. */
export default function sitemap(): MetadataRoute.Sitemap {
  return [{ url: `${SITE_URL}/welcome` }, { url: `${SITE_URL}/login` }]
}
