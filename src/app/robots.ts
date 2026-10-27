import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/site'

/** Lets search engines crawl the site and tells them where the sitemap is. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/' },
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
