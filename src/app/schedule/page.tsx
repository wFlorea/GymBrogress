import { getWeeklyPlans } from './actions'
import { ScheduleClient } from './ScheduleClient'

export default async function SchedulePage() {
  const plans = await getWeeklyPlans()

  return (
    <div className="p-4 pt-8 pb-24 max-w-lg mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-[var(--color-primary)]">Program Săptămânal</h1>
        <p className="text-[var(--color-muted)] text-sm mt-1">
          Alege ce grupe musculare lucrezi în fiecare zi din săptămână.
        </p>
      </div>

      <ScheduleClient initialPlans={plans} />
    </div>
  )
}
