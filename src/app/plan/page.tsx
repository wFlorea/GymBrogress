import { Page, PageHeader } from '@/components/ui/Page'
import { getRoutineIds, isCustomRoutine } from '@/lib/routines'
import { WORKOUT_SPLIT_OPTIONS } from '@/lib/splits'
import { getRoutineTemplates } from '@/lib/data/plans'
import type { WorkoutSplit } from '@/lib/types'
import { PlanClient } from './PlanClient'

export default async function PlanPage() {
  const templates = await getRoutineTemplates()

  const routines = Object.fromEntries(
    WORKOUT_SPLIT_OPTIONS.map((option) => [option.id, getRoutineIds(option.id, templates)])
  ) as Record<WorkoutSplit, string[]>
  const customSplits = WORKOUT_SPLIT_OPTIONS.map((o) => o.id).filter((id) => isCustomRoutine(id, templates))

  return (
    <Page>
      <PageHeader
        title="Routines"
        subtitle="Choose the exercises for each workout type. Whenever a day in your schedule uses that workout, these exercises load automatically."
      />
      <PlanClient routines={routines} customSplits={customSplits} />
    </Page>
  )
}
