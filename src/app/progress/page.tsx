import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { Page, PageHeader } from '@/components/ui/Page'
import { buttonStyles } from '@/components/ui/styles'
import { addDays } from '@/lib/date'
import { getExercise } from '@/lib/exercises-data'
import { getExerciseHistory, getSetsPerMuscleGroup } from '@/lib/data/progress'
import { getToday } from '@/lib/data/session'
import { getUserSettings } from '@/lib/data/settings'
import { MuscleVolume, VOLUME_DAYS } from './MuscleVolume'
import { ProgressClient } from './ProgressClient'

export default async function ProgressPage() {
  const [history, settings, muscleSets] = await Promise.all([
    getExerciseHistory(),
    getUserSettings(),
    getToday().then((today) => getSetsPerMuscleGroup(addDays(today, 1 - VOLUME_DAYS))),
  ])

  return (
    <Page>
      <PageHeader
        title="Progress"
        subtitle="Your best lifts, and how much each muscle group trains."
        action={
          <Link href="/profile" className={buttonStyles.chip}>
            <ChevronLeft size={13} /> Profile
          </Link>
        }
      />
      {history.length > 0 && <MuscleVolume groups={muscleSets} />}
      <ProgressClient history={history} trackedIds={settings.trackedExerciseIds.filter((id) => getExercise(id))}
        unit={settings.weightUnit}
      />
    </Page>
  )
}
