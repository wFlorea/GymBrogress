import { getRoutineTemplates } from './actions'
import { PlanClient } from './PlanClient'

export default async function PlanPage() {
  const templates = await getRoutineTemplates()

  return (
    <div className="p-4 pt-8 pb-24 max-w-lg mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-[var(--color-primary)]">Rutine & Plan Exerciții</h1>
        <p className="text-[var(--color-muted)] text-sm mt-1">
          Configurează exercițiile generale pentru fiecare tip de antrenament (Push, Pull, Legs etc.). Când schimbi ziua în Schedule sau Calendar, exercițiile se încarcă automat!
        </p>
      </div>

      <PlanClient initialTemplates={templates} />
    </div>
  )
}
