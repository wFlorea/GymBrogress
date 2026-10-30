'use client'

import { useOptimistic, useState, useTransition } from 'react'
import Link from 'next/link'
import { Dumbbell, Plus, Star } from 'lucide-react'
import { ExerciseBrowser } from '@/components/ExerciseBrowser'
import { Alert, EmptyState, cardStyles } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Modal'
import { SectionTitle } from '@/components/ui/Page'
import { buttonStyles } from '@/components/ui/styles'
import { formatDate } from '@/lib/date'
import { MUSCLE_GROUP_EMOJIS, getExercise } from '@/lib/exercises-data'
import { formatWeight } from '@/lib/format'
import type { ExerciseHistory, WeightUnit } from '@/lib/types'
import { setTracked } from './actions'

interface RowProps {
  exerciseId: string
  entry: ExerciseHistory | undefined
  tracked: boolean
  onToggle: () => void
  unit: WeightUnit
}

export function ProgressClient({
  history,
  trackedIds,
  unit,
}: {
  history: ExerciseHistory[]
  trackedIds: string[]
  unit: WeightUnit
}) {
  const [pickerOpen, setPickerOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // The lift tracked last, so its card floats into the grid.
  const [newlyTracked, setNewlyTracked] = useState<string | null>(null)
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
    if (tracked) setNewlyTracked(exerciseId)
    startTransition(async () => {
      setOptimisticTracked({ exerciseId, tracked })
      const result = await setTracked(exerciseId, tracked)
      if (!result.ok) setError(result.error)
    })
  }

  const rowProps = (exerciseId: string): RowProps => ({
    exerciseId,
    entry: historyById.get(exerciseId),
    tracked: isTracked(exerciseId),
    onToggle: () => toggle(exerciseId, !isTracked(exerciseId)),
    unit,
  })

  return (
    <div className="space-y-8">
      {error && <Alert>{error}</Alert>}

      <section>
        <div className="flex items-start justify-between gap-3">
          <SectionTitle subtitle="Your best lift for each pinned exercise">Tracked</SectionTitle>
          <button type="button" onClick={() => setPickerOpen(true)} className={buttonStyles.chip}>
            <Plus size={13} /> Add
          </button>
        </div>
        {optimisticTracked.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-white/10 px-4 py-5 text-center text-xs leading-relaxed text-muted">
            Pin the lifts you care about most: tap the <Star size={12} className="inline align-[-1px]" /> next to an
            exercise, or add one.
          </p>
        ) : (
          <ul className="grid grid-cols-2 gap-3">
            {optimisticTracked.map((id) => (
              <TrackedCard key={id} {...rowProps(id)} isNew={id === newlyTracked} />
            ))}
          </ul>
        )}
      </section>

      <section>
        <SectionTitle subtitle="Every exercise you have logged a set of">All exercises</SectionTitle>
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
          <ul className={`${cardStyles} divide-y divide-white/5 overflow-hidden`}>
            {history.map((entry) => (
              <ExerciseRow key={entry.exerciseId} {...rowProps(entry.exerciseId)} />
            ))}
          </ul>
        )}
      </section>

      <Modal open={pickerOpen} onClose={() => setPickerOpen(false)} title="Track an exercise">
        <ExerciseBrowser scrollable isAdded={isTracked} onAdd={(exercise) => toggle(exercise.id, true)} />
      </Modal>
    </div>
  )
}

function exerciseInfo(exerciseId: string, entry: ExerciseHistory | undefined) {
  const exercise = getExercise(exerciseId)
  return {
    name: exercise?.name ?? entry?.name ?? 'Exercise',
    emoji: exercise ? MUSCLE_GROUP_EMOJIS[exercise.muscle_group] : '🏋️',
    lastDone: entry
      ? `Last done ${formatDate(entry.lastDate, { day: 'numeric', month: 'short', year: 'numeric' })}`
      : 'Not done yet',
  }
}

/** Tracked lifts get a card each, with the best weight as the headline. */
function TrackedCard({ exerciseId, entry, tracked, onToggle, unit, isNew }: RowProps & { isNew: boolean }) {
  const { name, emoji, lastDone } = exerciseInfo(exerciseId, entry)

  return (
    <li className={`relative ${isNew ? 'animate-float-in' : ''}`}>
      <Link
        href={`/progress/${exerciseId}`}
        className={`${cardStyles} press flex h-full flex-col p-4 hover:border-primary/60 [--press-scale:0.97]`}
      >
        <Emoji emoji={emoji} />
        <span className="mt-3 line-clamp-2 text-sm font-semibold text-white">{name}</span>
        <span className="mt-auto pt-3">
          {entry &&
            (entry.bestWeight > 0 ? (
              <span className="block font-display text-2xl font-bold leading-none">{formatWeight(entry.bestWeight, unit)}</span>
            ) : (
              <span className="block text-sm font-semibold">Bodyweight</span>
            ))}
          <span className="mt-1 block text-[11px] text-muted">{lastDone}</span>
        </span>
      </Link>
      <StarButton name={name} tracked={tracked} onToggle={onToggle} className="absolute right-2 top-2" />
    </li>
  )
}

function ExerciseRow({ exerciseId, entry, tracked, onToggle, unit }: RowProps) {
  const { name, emoji, lastDone } = exerciseInfo(exerciseId, entry)

  return (
    <li className="flex items-center pr-2">
      <Link
        href={`/progress/${exerciseId}`}
        className="flex min-w-0 flex-1 items-center gap-3 py-3 pl-4 pr-2 transition-colors hover:bg-white/[0.03]"
      >
        <Emoji emoji={emoji} />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold text-white">{name}</span>
          <span className="text-[11px] text-muted">{lastDone}</span>
        </span>
        {entry && entry.bestWeight > 0 ? (
          <span className="shrink-0 text-sm font-bold tabular-nums">{formatWeight(entry.bestWeight, unit)}</span>
        ) : (
          <span className="shrink-0 text-xs text-muted">Bodyweight</span>
        )}
      </Link>
      <StarButton name={name} tracked={tracked} onToggle={onToggle} />
    </li>
  )
}

function Emoji({ emoji }: { emoji: string }) {
  return (
    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/5 text-lg" aria-hidden>
      {emoji}
    </span>
  )
}

function StarButton({
  name,
  tracked,
  onToggle,
  className = '',
}: {
  name: string
  tracked: boolean
  onToggle: () => void
  className?: string
}) {
  // Only pop the star when it's tapped, not for lifts that were already tracked.
  const [toggled, setToggled] = useState(false)

  return (
    <button
      type="button"
      onClick={() => {
        setToggled(true)
        onToggle()
      }}
      aria-pressed={tracked}
      aria-label={tracked ? `Stop tracking ${name}` : `Track ${name}`}
      className={`press flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-muted hover:bg-white/5 hover:text-white [--press-scale:0.8] ${className}`}
    >
      <Star size={18} className={tracked ? `fill-primary text-primary ${toggled ? 'animate-pop' : ''}` : ''} />
    </button>
  )
}
