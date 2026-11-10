import { Page, PageHeader } from '@/components/ui/Page'
import { getWaitingProducts, requireAdmin } from '@/lib/data/products'
import { ReviewClient } from './ReviewClient'

export const metadata = { title: 'Products to check' }

export default async function ProductReviewPage() {
  await requireAdmin()
  const products = await getWaitingProducts()

  return (
    <Page>
      <PageHeader title="Products to check" subtitle="Compare the numbers with the photos, then approve it for everyone." />
      <ReviewClient products={products} />
    </Page>
  )
}
