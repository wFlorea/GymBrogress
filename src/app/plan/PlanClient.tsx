'use client'

import { useOptimistic, useState, useTransition } from 'react'
import { ArrowDown, ArrowUp, ArrowUpDown, Check, ChevronDown, Dumbbell, Loader2, Minus, Plus, RotateCcw, Trash2 } from 'lucide-react'
import { ExerciseBrowser } from '@/components/ExerciseBrowser'
import { Alert } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Modal'
import { buttonStyles } from '@/components/ui/styles'
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
  const [reordering, setReordering] = useState(false)
  const [isSavingOrder, startSavingOrder] = useTransition()

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

  function moveSplit(index: number, offset: -1 | 1) {
    setOrder((prev) => {
      const next = [...prev]
      const [split] = next.splice(index, 1)
      next.splice(index + offset, 0, split)
      return next
    })
  }

  function toggleReordering() {
    if (!reordering) {
      setExpanded(null)
      setReordering(true)
      return
    }
    setReordering(false)
    if (order.every((split, i) => split === splits[i])) return
    setError(null)
    startSavingOrder(async () => {
      const result = await saveSplitOrder(order)
      if (!result.ok) {
        setError(result.error)
        setOrder(splits)
      }
    })
  }

  const pickerOption = pickerSplit ? getSplitOption(pickerSplit) : null

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-muted">{reordering ? 'Move your routines up or down.' : ''}</p>
        <button type="button" onClick={toggleReordering} disabled={isSavingOrder} className={`${buttonStyles.chip} shrink-0`}>
          {isSavingOrder ? (
            <Loader2 size={13} className="animate-spin" />
          ) : reordering ? (
            <Check size={13} />
          ) : (
            <ArrowUpDown size={13} />
          )}
          {reordering ? 'Done' : 'Reorder'}
        </button>
      </div>

      {error && <Alert>{error}</Alert>}

      {reordering ? (
        <ol className="space-y-2" aria-label="Routine order">
          {order.map((split, index) => {
            const option = getSplitOption(split)
            return (
              <li key={split} className="flex items-center gap-3 rounded-2xl border border-primary/25 bg-surface p-3">
                <span className="text-xl" aria-hidden>
                  {option.emoji}
                </span>
                <span className="min-w-0 flex-1 text-sm font-black text-white">{option.name}</span>
                <button
                  type="button"
                  onClick={() => moveSplit(index, -1)}
                  disabled={index === 0}
                  aria-label={`Move ${option.name} up`}
                  className={`${buttonStyles.icon} disabled:opacity-30`}
                >
                  <ArrowUp size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => moveSplit(index, 1)}
                  disabled={index === order.length - 1}
                  aria-label={`Move ${option.name} down`}
                  className={`${buttonStyles.icon} disabled:opacity-30`}
                >
                  <ArrowDown size={16} />
                </button>
              </li>
            )
          })}
        </ol>
      ) : (
        <ul className="space-y-2.5">
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
                        {plural(items.length, 'exercise')}
                      </span>
                    )}
                    <ChevronDown size={18} className={`text-muted transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                  </div>
                </button>

                {isExpanded && (
                  <div className="space-y-2.5 p-4">
                    {items.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-border py-6 text-center">
                        <Dumbbell size={24} className="mx-auto mb-2 text-muted" />
                        <p className="text-xs text-muted">No exercises in {option.name} yet.</p>
                      </div>
                    ) : (
                      <ol className="space-y-2">
                        {items.map(({ exercise, sets }, index) => (
                          <li
                            key={exercise.id}
                            className="flex items-center gap-2.5 rounded-xl border border-border/80 bg-sunken p-3 transition-colors hover:border-zinc-600"
                          >
                            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-xs font-bold text-muted">
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
      )}

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
    'flex h-6 w-7 items-center justify-center rounded-md text-zinc-300 transition-colors hover:bg-zinc-700 hover:text-white active:scale-90 disabled:opacity-30 disabled:hover:bg-transparent'
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
