import Link from 'next/link'
import { Compass } from 'lucide-react'
import { EmptyState } from '@/components/ui/Card'
import { Page } from '@/components/ui/Page'
import { buttonStyles } from '@/components/ui/styles'

export default function NotFound() {
  return (
    <Page className="flex min-h-[70vh] flex-col justify-center">
      <EmptyState
        icon={<Compass size={36} />}
        title="Page not found"
        description="This page doesn’t exist or has moved."
      >
        <Link href="/dashboard" className={`${buttonStyles.soft} text-xs`}>
          Go to dashboard
        </Link>
      </EmptyState>
    </Page>
  )
}
