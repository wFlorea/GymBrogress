import { getWeeklyPlans } from '@/app/schedule/actions'
import { getRoutineTemplates } from '@/app/plan/actions'
import { getCalendarPlans } from './actions'
import { CalendarClient } from './CalendarClient'

export const dynamic = 'force-dynamic'

export default async function CalendarPage() {
  const [calendarPlans, weeklyPlans, routineTemplates] = await Promise.all([
    getCalendarPlans(),
    getWeeklyPlans(),
    getRoutineTemplates(),
  ])

  return (
    <div className="p-4 pt-8 pb-24 max-w-lg mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-[var(--color-primary)]">Calendar Flexibil</h1>
        <p className="text-[var(--color-muted)] text-sm mt-1">
          Planifică-ți tura de muncă (La Muncă / Liber) și zilele de antrenament pentru luna în curs și luna următoare.
        </p>
      </div>

      <CalendarClient
        initialCalendarPlans={calendarPlans}
        weeklyPlans={weeklyPlans}
        routineTemplates={routineTemplates}
      />
    </div>
  )
}
