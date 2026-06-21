import { getWeeklyPlans } from './actions'
import { PlannerClient } from './PlannerClient'

export default async function PlannerPage() {
  const plans = await getWeeklyPlans()

  return (
    <div className="p-4 pt-8 pb-20">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Plan Săptămânal</h1>
        <p className="text-[var(--color-muted)] text-sm mt-1">
          Apasă pe o zi pentru a adăuga sau edita antrenamentul.
        </p>
      </div>
      
      <PlannerClient initialPlans={plans} />
    </div>
  )
}
