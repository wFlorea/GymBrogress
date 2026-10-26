import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { Page, PageHeader } from '@/components/ui/Page'
import { buttonStyles } from '@/components/ui/styles'
import { getExercise } from '@/lib/exercises-data'
import { getExerciseHistory } from '@/lib/data/progress'
import { getUserSettings } from '@/lib/data/settings'
import { ProgressClient } from './ProgressClient'

export default async function ProgressPage() {
  const [history, settings] = await Promise.all([getExerciseHistory(), getUserSettings()])

  return (
    <Page>
      <PageHeader
        title="Progress"
        subtitle="Your heaviest lift of every month."
        action={
          <Link href="/profile" className={buttonStyles.chip}>
            <ChevronLeft size={13} /> Profile
          </Link>
        }
      />
      <ProgressClient history={history} trackedIds={settings.trackedExerciseIds.filter((id) => getExercise(id))} />
    </Page>
  )
}
