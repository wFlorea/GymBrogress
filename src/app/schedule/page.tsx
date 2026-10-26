import { Page, PageHeader } from '@/components/ui/Page'
import { resolveRoutine } from '@/lib/routines'
import { PLANNING_WEEKS, planningWindow } from '@/lib/schedule'
import { SPLIT_OPTIONS } from '@/lib/splits'
import { getDatePlans, getRoutineTemplates, getWeeklyPlan } from '@/lib/data/plans'
import { getToday } from '@/lib/data/session'
import type { SplitType } from '@/lib/types'
import { ScheduleClient } from './ScheduleClient'

export default async function SchedulePage() {
  const today = await getToday()
  const { weekStart, last } = planningWindow(today)
  const [weeklyPlan, datePlans, templates] = await Promise.all([
    getWeeklyPlan(),
    getDatePlans(weekStart, last),
    getRoutineTemplates(),
  ])

  const exerciseCounts = Object.fromEntries(
    SPLIT_OPTIONS.map((option) => [option.id, resolveRoutine(option.id, templates).length])
  ) as Record<SplitType, number>

  return (
    <Page>
      <PageHeader
        title="Schedule"
        subtitle={`Pick a workout for each day, up to ${PLANNING_WEEKS} weeks ahead. Days you don't change follow your repeating week.`}
      />
      <ScheduleClient today={today} weeklyPlan={weeklyPlan} datePlans={datePlans} exerciseCounts={exerciseCounts} />
    </Page>
  )
}
