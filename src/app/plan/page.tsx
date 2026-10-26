import { Page } from '@/components/ui/Page'
import { getRoutine, isCustomRoutine } from '@/lib/routines'
import { WORKOUT_SPLIT_OPTIONS, orderWorkoutSplits } from '@/lib/splits'
import { getRoutineTemplates } from '@/lib/data/plans'
import { getUserSettings } from '@/lib/data/settings'
import type { RoutineItem, WorkoutSplit } from '@/lib/types'
import { PlanClient } from './PlanClient'

export default async function PlanPage() {
  const [templates, settings] = await Promise.all([getRoutineTemplates(), getUserSettings()])

  const routines = Object.fromEntries(
    WORKOUT_SPLIT_OPTIONS.map((option) => [option.id, getRoutine(option.id, templates)])
  ) as Record<WorkoutSplit, RoutineItem[]>
  const customSplits = WORKOUT_SPLIT_OPTIONS.map((o) => o.id).filter((id) => isCustomRoutine(id, templates))

  return (
    <Page>
      <PlanClient splits={orderWorkoutSplits(settings.splitOrder)} routines={routines} customSplits={customSplits} />
    </Page>
  )
}
