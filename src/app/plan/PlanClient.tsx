'use client'

import { useOptimistic, useState, useTransition } from 'react'
import { ChevronDown, Dumbbell, Loader2, Plus, RotateCcw, Trash2 } from 'lucide-react'
import { ExerciseBrowser } from '@/components/ExerciseBrowser'
import { Alert } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Modal'
import { MUSCLE_GROUP_EMOJIS, MUSCLE_GROUP_LABELS, getExercise } from '@/lib/exercises-data'
import { plural } from '@/lib/format'
import { WORKOUT_SPLIT_OPTIONS, getSplitOption } from '@/lib/splits'
import type { ActionResult, Exercise, WorkoutSplit } from '@/lib/types'
import { resetRoutine, saveRoutine } from './actions'

type Routines = Record<WorkoutSplit, string[]>

export function PlanClient({ routines, customSplits }: { routines: Routines; customSplits: WorkoutSplit[] }) {
  const [expanded, setExpanded] = useState<WorkoutSplit | null>(null)
  const [pickerSplit, setPickerSplit] = useState<WorkoutSplit | null>(null)
  const [savingSplit, setSavingSplit] = useState<WorkoutSplit | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const [optimisticRoutines, setOptimisticRoutine] = useOptimistic(
    routines,
    (state, { split, ids }: { split: WorkoutSplit; ids: string[] }) => ({ ...state, [split]: ids })
  )

  function run(split: WorkoutSplit, optimisticIds: string[] | null, action: () => Promise<ActionResult>) {
    setError(null)
    setSavingSplit(split)
    startTransition(async () => {
      if (optimisticIds) setOptimisticRoutine({ split, ids: optimisticIds })
      const result = await action()
      if (!result.ok) setError(result.error)
    })
  }

  function saveIds(split: WorkoutSplit, ids: string[]) {
    run(split, ids, () => saveRoutine(split, ids))
  }

  function addExercise(split: WorkoutSplit, exercise: Exercise) {
    const ids = optimisticRoutines[split]
    if (!ids.includes(exercise.id)) saveIds(split, [...ids, exercise.id])
  }

  const pickerOption = pickerSplit ? getSplitOption(pickerSplit) : null

  return (
    <div className="space-y-4">
      {error && <Alert>{error}</Alert>}

      <ul className="space-y-2.5">
        {WORKOUT_SPLIT_OPTIONS.map((option) => {
          const split = option.id
          const exercises = optimisticRoutines[split].map(getExercise).filter((e): e is Exercise => e !== undefined)
          const isExpanded = expanded === split
          const isCustom = customSplits.includes(split)
          const isSaving = isPending && savingSplit === split

          return (
            <li
              key={split}
              className={`overflow-hidden rounded-2xl border bg-surface shadow-sm transition-all ${
                isExpanded ? 'border-primary' : 'border-primary/25'
              }`}
            >
              <button
                type="button"
                onClick={() => setExpanded(isExpanded ? null : split)}
                aria-expanded={isExpanded}
                className={`flex w-full items-center justify-between gap-3 bg-gradient-to-r from-surface to-sunken/60 p-4 text-left ${
                  isExpanded ? 'border-b border-border/60' : ''
                }`}
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="text-2xl" aria-hidden>
                    {option.emoji}
                  </span>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-black text-white">{option.name}</h3>
                      {isCustom && (
                        <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-bold uppercase text-primary">
                          Custom
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-xs text-muted">{option.description}</p>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  {isSaving ? (
                    <Loader2 size={16} className="animate-spin text-primary" aria-label="Saving" />
                  ) : (
                    <span className="rounded-xl border border-zinc-700 bg-zinc-800/90 px-2.5 py-1 text-xs font-bold text-zinc-300">
                      {plural(exercises.length, 'exercise')}
                    </span>
                  )}
                  <ChevronDown size={18} className={`text-muted transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                </div>
              </button>

              {isExpanded && (
                <div className="space-y-2.5 p-4">
                  {exercises.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-border py-6 text-center">
                      <Dumbbell size={24} className="mx-auto mb-2 text-muted" />
                      <p className="text-xs text-muted">No exercises in {option.name} yet.</p>
                    </div>
                  ) : (
                    <ol className="space-y-2">
                      {exercises.map((exercise, index) => (
                        <li
                          key={exercise.id}
                          className="flex items-center justify-between gap-3 rounded-xl border border-border/80 bg-sunken p-3 transition-colors hover:border-zinc-600"
                        >
                          <div className="flex min-w-0 items-center gap-3">
                            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-xs font-bold text-muted">
                              {index + 1}
                            </span>
                            <div className="min-w-0">
                              <h4 className="text-sm font-bold text-white">{exercise.name}</h4>
                              <span className="text-[10px] text-muted">
                                {MUSCLE_GROUP_EMOJIS[exercise.muscle_group]} {MUSCLE_GROUP_LABELS[exercise.muscle_group]}
                              </span>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              saveIds(
                                split,
                                optimisticRoutines[split].filter((id) => id !== exercise.id)
                              )
                            }
                            aria-label={`Remove ${exercise.name}`}
                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-red-400 transition-colors hover:bg-red-950/40 hover:text-red-300"
                          >
                            <Trash2 size={16} />
                          </button>
                        </li>
                      ))}
                    </ol>
                  )}

                  <button
                    type="button"
                    onClick={() => setPickerSplit(split)}
                    className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-primary/40 py-3 text-xs font-bold text-primary transition-all hover:bg-primary/10 active:scale-[0.99]"
                  >
                    <Plus size={16} /> Add exercise to {option.name}
                  </button>

                  {isCustom && (
                    <button
                      type="button"
                      onClick={() => run(split, null, () => resetRoutine(split))}
                      className="flex w-full items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold text-zinc-400 transition-colors hover:text-white"
                    >
                      <RotateCcw size={13} /> Reset to default exercises
                    </button>
                  )}
                </div>
              )}
            </li>
          )
        })}
      </ul>

      <Modal
        open={pickerSplit !== null}
        onClose={() => setPickerSplit(null)}
        title="Add to routine"
        eyebrow={
          pickerOption && (
            <>
              <span aria-hidden>{pickerOption.emoji}</span> {pickerOption.name}
            </>
          )
        }
      >
        {pickerSplit && pickerOption && (
          <ExerciseBrowser
            scrollable
            recommended={pickerOption.targetMuscleGroups}
            isAdded={(id) => optimisticRoutines[pickerSplit].includes(id)}
            onAdd={(exercise) => addExercise(pickerSplit, exercise)}
          />
        )}
      </Modal>
    </div>
  )
}
