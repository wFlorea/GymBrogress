import { getCalendarPlans } from '@/app/calendar/actions'
import { getRoutineTemplates } from '@/app/plan/actions'
import { ScheduleClient } from './ScheduleClient'

export const dynamic = 'force-dynamic'

export default async function SchedulePage() {
  const [calendarPlans, routineTemplates] = await Promise.all([
    getCalendarPlans(),
    getRoutineTemplates(),
  ])

  return (
    <div className="p-4 pt-8 pb-24 max-w-lg mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-[var(--color-primary)]">Program Săptămânal</h1>
        <p className="text-[var(--color-muted)] text-sm mt-1">
          Vizualizarea săptămânii curente, sincronizată automat cu planificarea din Calendar.
        </p>
      </div>

      <ScheduleClient
        calendarPlans={calendarPlans}
        routineTemplates={routineTemplates}
      />
    </div>
  )
}
