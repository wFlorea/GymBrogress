'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { AlertTriangle, RotateCcw } from 'lucide-react'
import { EmptyState } from '@/components/ui/Card'
import { Page } from '@/components/ui/Page'
import { buttonStyles } from '@/components/ui/styles'

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <Page className="flex min-h-[70vh] flex-col justify-center">
      <EmptyState
        icon={<AlertTriangle size={36} className="text-primary" />}
        title="Something went wrong"
        description="We couldn’t load this page. Check your connection and try again."
      >
        <Link href="/dashboard" className={`${buttonStyles.secondary} text-xs`}>
          Go to dashboard
        </Link>
        <button type="button" onClick={reset} className={`${buttonStyles.soft} text-xs`}>
          <RotateCcw size={14} /> Try again
        </button>
      </EmptyState>
    </Page>
  )
}
