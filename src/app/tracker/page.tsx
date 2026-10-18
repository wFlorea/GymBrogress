import { getTodayWorkoutLog, startAdHocWorkout } from './actions'
import { TrackerClient } from './TrackerClient'
import Link from 'next/link'
import { Calendar, Dumbbell, Coffee, ArrowRight } from 'lucide-react'

export default async function TrackerPage() {
  const log = await getTodayWorkoutLog()

  if (!log) {
    return (
      <div className="p-4 pt-12 pb-20 flex flex-col items-center justify-center min-h-[70vh] text-center max-w-sm mx-auto">
        <Dumbbell size={40} className="text-[var(--color-muted)] mb-3" />
        <h2 className="text-xl font-bold text-white mb-2">Autentificare necesară</h2>
        <p className="text-[var(--color-muted)] text-sm mb-6">
          Trebuie să fii conectat la contul tău pentru a folosi tracker-ul de antrenament.
        </p>
        <Link
          href="/login"
          className="bg-[var(--color-primary)] text-white font-bold py-3 px-6 rounded-xl text-sm"
        >
          Mergi la Login
        </Link>
      </div>
    )
  }

  // Format today's date in Romanian
  const now = new Date()
  const dateString = now.toLocaleDateString('ro-RO', { weekday: 'long', month: 'long', day: 'numeric' })
  const formattedDate = dateString.charAt(0).toUpperCase() + dateString.slice(1)

  // Handle Rest Day view
  if (log.isRestDay) {
    return (
      <div className="p-4 pt-8 pb-24 max-w-lg mx-auto space-y-6">
        <div>
          <span className="text-xs uppercase tracking-wider text-[var(--color-muted)] font-black">
            {formattedDate}
          </span>
          <h1 className="text-2xl font-black text-white mt-1">Zi de Odihnă</h1>
        </div>

        <div className="bg-[var(--color-surface)] p-6 rounded-3xl border border-[var(--color-border)] text-center space-y-4 shadow-xl">
          <div className="w-16 h-16 rounded-full bg-amber-500/15 flex items-center justify-center mx-auto text-3xl">
            🧘‍♂️
          </div>
          <div>
            <h2 className="text-xl font-black text-[var(--color-primary)]">Odihnă, Campionule!</h2>
            <p className="text-sm text-[var(--color-muted)] mt-2 leading-relaxed">
              Conform programului tău din <strong>Schedule</strong>, astăzi este zi de refacere și regenerare musculară. Odihna și nutriția construiesc mușchii!
            </p>
          </div>

          <div className="pt-2 border-t border-[var(--color-border)]/60 flex flex-col gap-2.5">
            <Link
              href="/schedule"
              className="w-full bg-[var(--color-surface-hover)] border border-[var(--color-border)] text-white font-bold py-3 rounded-xl text-xs flex items-center justify-center gap-1.5 hover:border-[var(--color-primary)] transition-colors"
            >
              <span>Modifică Programul în Schedule</span>
              <ArrowRight size={14} />
            </Link>

            <form action={startAdHocWorkout}>
              <button
                type="submit"
                className="w-full bg-[var(--color-primary)] text-white font-bold py-3 rounded-xl text-xs hover:bg-[var(--color-primary-hover)] transition-colors shadow-md shadow-[#FF4500]/20"
              >
                Vreau să mă antrenez totuși (Ad-hoc)
              </button>
            </form>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 pt-8 pb-24 max-w-lg mx-auto">
      {/* Header */}
      <div className="mb-6 flex justify-between items-start">
        <div>
          <span className="text-xs uppercase tracking-wider text-[var(--color-muted)] font-black">
            {formattedDate}
          </span>
          <h1 className="text-2xl font-black text-[var(--color-primary)] mt-0.5">
            {log.splitName || log.workout_name}
          </h1>
        </div>
        <Link
          href="/plan"
          className="text-xs bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-white px-3 py-1.5 rounded-full font-bold flex items-center gap-1"
        >
          <span>Vezi Planul</span>
          <ArrowRight size={13} />
        </Link>
      </div>

      {/* Tracker Client Component */}
      <TrackerClient
        logId={log.id}
        initialSets={log.workout_sets || []}
        plannedExercises={log.plannedExercises || []}
      />
    </div>
  )
}
