'use client'

import { useState, useTransition } from 'react'
import { ArrowRight, Dumbbell, Loader2 } from 'lucide-react'
import { Alert } from '@/components/ui/Card'
import { buttonStyles } from '@/components/ui/styles'
import { WORKOUT_SPLIT_OPTIONS } from '@/lib/splits'
import type { WorkoutSplit } from '@/lib/types'
import { startWorkout } from './actions'

function useStartWorkout() {
  const [error, setError] = useState<string | null>(null)
  const [starting, setStarting] = useState<WorkoutSplit | null>(null)
  const [isPending, startTransition] = useTransition()

  function start(split: WorkoutSplit) {
    setError(null)
    setStarting(split)
    startTransition(async () => {
      try {
        const result = await startWorkout(split)
        if (!result.ok) setError(result.error)
      } catch {
        setError('Could not reach the server. Check your connection and try again.')
      }
    })
  }

  return { error, start, startingSplit: isPending ? starting : null }
}

/** Starts today's planned workout. */
export function StartWorkoutButton({ split }: { split: WorkoutSplit }) {
  const { error, start, startingSplit } = useStartWorkout()
  return (
    <div className="space-y-3">
      {error && <Alert>{error}</Alert>}
      <button type="button" onClick={() => start(split)} disabled={startingSplit !== null} className={`${buttonStyles.primary} w-full`}>
        {startingSplit ? <Loader2 size={18} className="animate-spin" /> : <Dumbbell size={18} />}
        Start workout
        <ArrowRight size={18} />
      </button>
    </div>
  )
}

/** Lets the user pick a workout on a rest day. */
export function StartWorkoutPicker() {
  const { error, start, startingSplit } = useStartWorkout()
  return (
    <div className="space-y-3">
      {error && <Alert>{error}</Alert>}
      <div className="grid grid-cols-2 gap-2">
        {WORKOUT_SPLIT_OPTIONS.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => start(option.id)}
            disabled={startingSplit !== null}
            className="flex items-center gap-2 rounded-xl border border-border bg-sunken p-3 text-left text-xs font-bold text-zinc-200 transition-colors hover:border-primary disabled:opacity-60"
          >
            <span className="text-lg" aria-hidden>
              {option.emoji}
            </span>
            <span className="flex-1">{option.name}</span>
            {startingSplit === option.id && <Loader2 size={14} className="animate-spin text-primary" />}
          </button>
        ))}
      </div>
    </div>
  )
}
