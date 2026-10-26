'use client'

import { useOptimistic, useState, useTransition } from 'react'
import Link from 'next/link'
import { ChevronRight, Dumbbell, Plus, Star } from 'lucide-react'
import { ExerciseBrowser } from '@/components/ExerciseBrowser'
import { Alert, EmptyState } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Modal'
import { SectionTitle } from '@/components/ui/Page'
import { buttonStyles } from '@/components/ui/styles'
import { formatDate } from '@/lib/date'
import { MUSCLE_GROUP_EMOJIS, getExercise } from '@/lib/exercises-data'
import { formatKg } from '@/lib/format'
import type { ExerciseHistory } from '@/lib/types'
import { setTracked } from './actions'

export function ProgressClient({ history, trackedIds }: { history: ExerciseHistory[]; trackedIds: string[] }) {
  const [pickerOpen, setPickerOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [, startTransition] = useTransition()
  const [optimisticTracked, setOptimisticTracked] = useOptimistic(
    trackedIds,
    (state, { exerciseId, tracked }: { exerciseId: string; tracked: boolean }) => {
      const others = state.filter((id) => id !== exerciseId)
      return tracked ? [...others, exerciseId] : others
    }
  )

  const historyById = new Map(history.map((entry) => [entry.exerciseId, entry]))
  const isTracked = (exerciseId: string) => optimisticTracked.includes(exerciseId)

  function toggle(exerciseId: string, tracked: boolean) {
    setError(null)
    startTransition(async () => {
      setOptimisticTracked({ exerciseId, tracked })
      const result = await setTracked(exerciseId, tracked)
      if (!result.ok) setError(result.error)
    })
  }

  const row = (exerciseId: string) => (
    <ExerciseRow
      key={exerciseId}
      exerciseId={exerciseId}
      entry={historyById.get(exerciseId)}
      tracked={isTracked(exerciseId)}
      onToggle={() => toggle(exerciseId, !isTracked(exerciseId))}
    />
  )

  return (
    <div className="space-y-6">
      {error && <Alert>{error}</Alert>}

      <section>
        <div className="flex items-start justify-between gap-3">
          <SectionTitle>Tracked</SectionTitle>
          <button type="button" onClick={() => setPickerOpen(true)} className={`${buttonStyles.chip} -mt-1`}>
            <Plus size={13} /> Add
          </button>
        </div>
        {optimisticTracked.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border px-4 py-5 text-center text-xs leading-relaxed text-muted">
            Pin the lifts you care about most: tap the <Star size={12} className="inline align-[-1px]" /> next to an
            exercise, or add one.
          </p>
        ) : (
          <ul className="space-y-2">{optimisticTracked.map(row)}</ul>
        )}
      </section>

      <section>
        <SectionTitle>All exercises</SectionTitle>
        {history.length === 0 ? (
          <EmptyState
            icon={<Dumbbell size={32} />}
            title="No lifts yet"
            description="Tick off sets in your workouts and every exercise you do shows up here."
          >
            <Link href="/tracker" className={`${buttonStyles.soft} text-xs`}>
              Start a workout
            </Link>
          </EmptyState>
        ) : (
          <ul className="space-y-2">{history.map((entry) => row(entry.exerciseId))}</ul>
        )}
      </section>

      <Modal open={pickerOpen} onClose={() => setPickerOpen(false)} title="Track an exercise">
        <ExerciseBrowser scrollable isAdded={isTracked} onAdd={(exercise) => toggle(exercise.id, true)} />
      </Modal>
    </div>
  )
}

function ExerciseRow({
  exerciseId,
  entry,
  tracked,
  onToggle,
}: {
  exerciseId: string
  entry: ExerciseHistory | undefined
  tracked: boolean
  onToggle: () => void
}) {
  const exercise = getExercise(exerciseId)
  const name = exercise?.name ?? entry?.name ?? 'Exercise'
  const details = entry
    ? `${entry.bestWeight > 0 ? `Best ${formatKg(entry.bestWeight)}` : 'Bodyweight'} · ${formatDate(entry.lastDate, {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })}`
    : 'Not done yet'

  return (
    <li className="flex items-center rounded-2xl border border-border bg-surface pr-2 transition-colors hover:border-primary">
      <Link href={`/progress/${exerciseId}`} className="flex min-w-0 flex-1 items-center gap-3 p-3.5">
        <span className="text-xl" aria-hidden>
          {exercise ? MUSCLE_GROUP_EMOJIS[exercise.muscle_group] : '🏋️'}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-bold text-white">{name}</span>
          <span className="text-[11px] text-muted">{details}</span>
        </span>
        <ChevronRight size={16} className="shrink-0 text-muted" />
      </Link>
      <button
        type="button"
        onClick={onToggle}
        aria-pressed={tracked}
        aria-label={tracked ? `Stop tracking ${name}` : `Track ${name}`}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-muted transition-colors hover:bg-zinc-800 hover:text-white active:scale-90"
      >
        <Star size={18} className={tracked ? 'fill-primary text-primary' : ''} />
      </button>
    </li>
  )
}
