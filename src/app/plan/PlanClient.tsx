'use client'

import { startTransition as startSavingOrder, useOptimistic, useState, useTransition } from 'react'
import { ChevronDown, Dumbbell, Loader2, Minus, Plus, RotateCcw, Trash2 } from 'lucide-react'
import { ExerciseBrowser } from '@/components/ExerciseBrowser'
import { Alert } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Modal'
import { DragHandle, SortableItem, SortableList } from '@/components/ui/Sortable'
import { MUSCLE_GROUP_EMOJIS, MUSCLE_GROUP_LABELS, getExercise } from '@/lib/exercises-data'
import { plural } from '@/lib/format'
import { DEFAULT_SETS_PER_EXERCISE, MAX_SETS_PER_EXERCISE, MIN_SETS_PER_EXERCISE } from '@/lib/sets'
import { getSplitOption } from '@/lib/splits'
import type { ActionResult, Exercise, RoutineItem, WorkoutSplit } from '@/lib/types'
import { resetRoutine, saveRoutine, saveSplitOrder } from './actions'

type Routines = Record<WorkoutSplit, RoutineItem[]>

export function PlanClient({
  splits,
  routines,
  customSplits,
}: {
  /** Workout splits in the user's order. */
  splits: WorkoutSplit[]
  routines: Routines
  customSplits: WorkoutSplit[]
}) {
  const [expanded, setExpanded] = useState<WorkoutSplit | null>(null)
  const [pickerSplit, setPickerSplit] = useState<WorkoutSplit | null>(null)
  const [savingSplit, setSavingSplit] = useState<WorkoutSplit | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [order, setOrder] = useState(splits)

  const [optimisticRoutines, setOptimisticRoutine] = useOptimistic(
    routines,
    (state, { split, items }: { split: WorkoutSplit; items: RoutineItem[] }) => ({ ...state, [split]: items })
  )

  function run(split: WorkoutSplit, optimisticItems: RoutineItem[] | null, action: () => Promise<ActionResult>) {
    setError(null)
    setSavingSplit(split)
    startTransition(async () => {
      if (optimisticItems) setOptimisticRoutine({ split, items: optimisticItems })
      const result = await action()
      if (!result.ok) setError(result.error)
    })
  }

  function saveItems(split: WorkoutSplit, items: RoutineItem[]) {
    run(split, items, () => saveRoutine(split, items))
  }

  function addExercise(split: WorkoutSplit, exercise: Exercise) {
    const items = optimisticRoutines[split]
    if (!items.some((item) => item.exerciseId === exercise.id)) {
      saveItems(split, [...items, { exerciseId: exercise.id, sets: DEFAULT_SETS_PER_EXERCISE }])
    }
  }

  function removeExercise(split: WorkoutSplit, exerciseId: string) {
    saveItems(
      split,
      optimisticRoutines[split].filter((item) => item.exerciseId !== exerciseId)
    )
  }

  function changeSets(split: WorkoutSplit, exerciseId: string, sets: number) {
    saveItems(
      split,
      optimisticRoutines[split].map((item) => (item.exerciseId === exerciseId ? { ...item, sets } : item))
    )
  }

  /** Exercises keep their sets when they're moved; the Workout page lists them in this order. */
  function reorderExercises(split: WorkoutSplit, exerciseIds: string[]) {
    const byId = new Map(optimisticRoutines[split].map((item) => [item.exerciseId, item]))
    saveItems(
      split,
      exerciseIds.flatMap((id) => byId.get(id) ?? [])
    )
  }

  function reorderSplits(next: WorkoutSplit[]) {
    setOrder(next)
    setError(null)
    startSavingOrder(async () => {
      const result = await saveSplitOrder(next)
      if (!result.ok) {
        setError(result.error)
        setOrder(splits)
      }
    })
  }

  const pickerOption = pickerSplit ? getSplitOption(pickerSplit) : null

  return (
    <div className="space-y-4">
      {error && <Alert>{error}</Alert>}

      <ul className="space-y-2.5" aria-label="Your routines">
        <SortableList ids={order} itemName={(split) => getSplitOption(split).name} onReorder={reorderSplits}>
          {order.map((split) => {
            const option = getSplitOption(split)
            const items = optimisticRoutines[split].flatMap((item) => {
              const exercise = getExercise(item.exerciseId)
              return exercise ? [{ exercise, sets: item.sets }] : []
            })
            const isExpanded = expanded === split
            const isCustom = customSplits.includes(split)
            const isSaving = isPending && savingSplit === split

            return (
              <SortableItem
                key={split}
                id={split}
                className={`overflow-hidden rounded-2xl border bg-surface shadow-sm transition-colors ${
                  isExpanded ? 'border-primary' : 'border-primary/25'
                }`}
              >
                <div
                  className={`flex items-center bg-gradient-to-r from-surface to-sunken/60 pl-1.5 ${
                    isExpanded ? 'border-b border-border/60' : ''
                  }`}
                >
                  <DragHandle label={`Move ${option.name}`} />
                  <button
                    type="button"
                    onClick={() => setExpanded(isExpanded ? null : split)}
                    aria-expanded={isExpanded}
                    className="flex min-w-0 flex-1 items-center justify-between gap-3 py-4 pl-1 pr-4 text-left"
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
                        <span className="rounded-xl border border-foreground/15 bg-surface/90 px-2.5 py-1 text-xs font-bold text-foreground/80">
                          {plural(items.length, 'exercise')}
                        </span>
                      )}
                      <ChevronDown size={18} className={`text-muted transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                    </div>
                  </button>
                </div>

                {isExpanded && (
                  <div className="space-y-2.5 p-3 sm:p-4">
                    {items.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-border py-6 text-center">
                        <Dumbbell size={24} className="mx-auto mb-2 text-muted" />
                        <p className="text-xs text-muted">No exercises in {option.name} yet.</p>
                      </div>
                    ) : (
                      <ol className="space-y-2" aria-label={`${option.name} exercises`}>
                        <SortableList
                          ids={items.map(({ exercise }) => exercise.id)}
                          itemName={(id) => getExercise(id)?.name ?? id}
                          onReorder={(ids) => reorderExercises(split, ids)}
                        >
                          {items.map(({ exercise, sets }, index) => (
                            <SortableItem
                              key={exercise.id}
                              id={exercise.id}
                              className="flex items-center gap-1.5 rounded-xl border border-border/80 bg-sunken py-3 pl-1 pr-2 transition-colors hover:border-foreground/25 sm:gap-2.5 sm:pr-3"
                            >
                              <DragHandle label={`Move ${exercise.name}`} />
                              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-surface text-xs font-bold text-muted">
                                {index + 1}
                              </span>
                              <div className="min-w-0 flex-1">
                                <h4 className="text-sm font-bold text-white">{exercise.name}</h4>
                                <span className="text-[10px] text-muted">
                                  {MUSCLE_GROUP_EMOJIS[exercise.muscle_group]} {MUSCLE_GROUP_LABELS[exercise.muscle_group]}
                                </span>
                              </div>

                              <SetStepper
                                value={sets}
                                exerciseName={exercise.name}
                                onChange={(value) => changeSets(split, exercise.id, value)}
                              />

                              <button
                                type="button"
                                onClick={() => removeExercise(split, exercise.id)}
                                aria-label={`Remove ${exercise.name}`}
                                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-red-400 transition-colors hover:bg-red-950/40 hover:text-red-300"
                              >
                                <Trash2 size={16} />
                              </button>
                            </SortableItem>
                          ))}
                        </SortableList>
                      </ol>
                    )}

                    <button
                      type="button"
                      onClick={() => setPickerSplit(split)}
                      className="press mt-2 flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-primary/40 py-3 text-xs font-bold text-primary hover:bg-primary/10 [--press-scale:0.97]"
                    >
                      <Plus size={16} /> Add exercise to {option.name}
                    </button>

                    {isCustom && (
                      <button
                        type="button"
                        onClick={() => run(split, null, () => resetRoutine(split))}
                        className="flex w-full items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold text-foreground/60 transition-colors hover:text-white"
                      >
                        <RotateCcw size={13} /> Reset to default exercises
                      </button>
                    )}
                  </div>
                )}
              </SortableItem>
            )
          })}
        </SortableList>
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
            isAdded={(id) => optimisticRoutines[pickerSplit].some((item) => item.exerciseId === id)}
            onAdd={(exercise) => addExercise(pickerSplit, exercise)}
          />
        )}
      </Modal>
    </div>
  )
}

/** Number of sets for an exercise, with plus above minus to its right. */
function SetStepper({
  value,
  exerciseName,
  onChange,
}: {
  value: number
  exerciseName: string
  onChange: (value: number) => void
}) {
  const stepButton =
    'press flex h-6 w-7 items-center justify-center rounded-md text-foreground/80 hover:bg-surface-hover hover:text-white [--press-scale:0.8] disabled:opacity-30 disabled:hover:bg-transparent'
  return (
    <div className="flex shrink-0 items-center gap-0.5 rounded-xl border border-border bg-surface py-0.5 pl-2 pr-0.5">
      <div className="w-7 text-center leading-none" aria-live="polite">
        <span className="block text-base font-black text-white">{value}</span>
        <span className="text-[9px] font-bold uppercase text-muted">{value === 1 ? 'set' : 'sets'}</span>
      </div>
      <div className="flex flex-col">
        <button
          type="button"
          onClick={() => onChange(value + 1)}
          disabled={value >= MAX_SETS_PER_EXERCISE}
          aria-label={`One more set of ${exerciseName}`}
          className={stepButton}
        >
          <Plus size={14} strokeWidth={3} />
        </button>
        <button
          type="button"
          onClick={() => onChange(value - 1)}
          disabled={value <= MIN_SETS_PER_EXERCISE}
          aria-label={`One less set of ${exerciseName}`}
          className={stepButton}
        >
          <Minus size={14} strokeWidth={3} />
        </button>
      </div>
    </div>
  )
}
