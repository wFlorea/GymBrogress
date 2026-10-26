'use client'

import { useState } from 'react'
import { Check, Plus, Search, Sparkles, X } from 'lucide-react'
import {
  EXERCISES,
  MUSCLE_GROUPS,
  MUSCLE_GROUP_EMOJIS,
  MUSCLE_GROUP_LABELS,
  searchExercises,
} from '@/lib/exercises-data'
import type { Exercise, MuscleGroup } from '@/lib/types'
import { inputStyles, pillStyles } from './ui/styles'

type Filter = 'recommended' | 'all' | MuscleGroup

/**
 * Searchable, filterable exercise list. Used by the library page (read-only)
 * and by the Plan and Workout pickers (with `onAdd`).
 */
export function ExerciseBrowser({
  recommended,
  isAdded,
  onAdd,
  scrollable = false,
}: {
  /** Muscle groups of the current split; adds a "Recommended" filter, selected by default. */
  recommended?: MuscleGroup[]
  isAdded?: (exerciseId: string) => boolean
  onAdd?: (exercise: Exercise) => void
  /** Scroll the list inside its container (for modals). */
  scrollable?: boolean
}) {
  const hasRecommended = recommended !== undefined && recommended.length > 0
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<Filter>(hasRecommended ? 'recommended' : 'all')

  const matchesFilter = (e: Exercise) =>
    filter === 'all' || (filter === 'recommended' ? recommended!.includes(e.muscle_group) : e.muscle_group === filter)
  const results = searchExercises(query, matchesFilter)

  return (
    <div className={scrollable ? 'flex min-h-0 flex-1 flex-col' : ''}>
      <div className="relative my-3">
        <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search exercises (e.g. bench press, squat, row)"
          aria-label="Search exercises"
          className={`${inputStyles} py-2.5 pl-10 pr-9 text-xs`}
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery('')}
            aria-label="Clear search"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
          >
            <X size={14} />
          </button>
        )}
      </div>

      <div className="scrollbar-none -mx-1 flex items-center gap-1.5 overflow-x-auto px-1 pb-2" role="group" aria-label="Filter by muscle group">
        {hasRecommended && (
          <button type="button" onClick={() => setFilter('recommended')} className={pillStyles(filter === 'recommended')} aria-pressed={filter === 'recommended'}>
            <Sparkles size={12} /> Recommended
          </button>
        )}
        <button type="button" onClick={() => setFilter('all')} className={pillStyles(filter === 'all')} aria-pressed={filter === 'all'}>
          All ({EXERCISES.length})
        </button>
        {MUSCLE_GROUPS.map((group) => (
          <button key={group} type="button" onClick={() => setFilter(group)} className={pillStyles(filter === group)} aria-pressed={filter === group}>
            <span aria-hidden>{MUSCLE_GROUP_EMOJIS[group]}</span>
            {MUSCLE_GROUP_LABELS[group]}
          </button>
        ))}
      </div>

      <ul className={`space-y-2 py-2 ${scrollable ? 'flex-1 overflow-y-auto pr-1' : ''}`}>
        {results.length === 0 ? (
          <li className="py-10 text-center text-xs text-muted">No exercises match your search.</li>
        ) : (
          results.map((exercise) => {
            const added = isAdded?.(exercise.id) ?? false
            return (
              <li
                key={exercise.id}
                className={`flex items-center justify-between gap-3 rounded-2xl border p-3 transition-colors ${
                  added ? 'border-success/30 bg-success/10' : 'border-border bg-sunken'
                }`}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-bold text-white">{exercise.name}</h3>
                    <span className="rounded bg-zinc-800 px-2 py-0.5 text-[10px] text-zinc-400">
                      {MUSCLE_GROUP_LABELS[exercise.muscle_group]}
                    </span>
                  </div>
                  <p className={`mt-1 text-xs text-muted ${onAdd ? 'line-clamp-1' : ''}`}>{exercise.description}</p>
                </div>

                {onAdd && (
                  <button
                    type="button"
                    onClick={() => onAdd(exercise)}
                    disabled={added}
                    aria-label={added ? `${exercise.name} already added` : `Add ${exercise.name}`}
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-all ${
                      added
                        ? 'cursor-default bg-success/20 text-success'
                        : 'bg-primary text-white shadow-md shadow-primary/20 hover:bg-primary-hover active:scale-95'
                    }`}
                  >
                    {added ? <Check size={18} strokeWidth={3} /> : <Plus size={18} />}
                  </button>
                )}
              </li>
            )
          })
        )}
      </ul>
    </div>
  )
}
