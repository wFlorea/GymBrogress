import { getWeeklyPlans } from '@/app/schedule/actions'
import { PlanClient } from './PlanClient'

export default async function PlanPage() {
  const plans = await getWeeklyPlans()

  return (
    <div className="p-4 pt-8 pb-24 max-w-lg mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-[var(--color-primary)]">Plan Exerciții</h1>
        <p className="text-[var(--color-muted)] text-sm mt-1">
          Alege exercițiile pe care vrei să le faci în fiecare zi de antrenament.
        </p>
      </div>

      <PlanClient initialPlans={plans} />
    </div>
  )
}
