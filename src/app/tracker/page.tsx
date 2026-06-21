import { getTodayWorkoutLog } from './actions'
import { TrackerClient } from './TrackerClient'

export default async function TrackerPage() {
  const log = await getTodayWorkoutLog()

  if (!log) {
    return (
      <div className="p-4 pt-8 pb-20 flex flex-col items-center justify-center min-h-[80vh]">
        <p className="text-[var(--color-muted)] text-center">Trebuie să fii autentificat pentru a folosi tracker-ul.</p>
      </div>
    )
  }

  // Format date correctly
  const dateObj = new Date(log.date)
  const dateString = dateObj.toLocaleDateString('ro-RO', { weekday: 'long', month: 'long', day: 'numeric' })
  const formattedDate = dateString.charAt(0).toUpperCase() + dateString.slice(1)

  return (
    <div className="p-4 pt-8 pb-20">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[var(--color-primary)]">{log.workout_name}</h1>
        <p className="text-[var(--color-muted)] text-sm mt-1 capitalize">
          {formattedDate}
        </p>
      </div>
      
      <TrackerClient logId={log.id} initialSets={log.workout_sets || []} />
    </div>
  )
}
