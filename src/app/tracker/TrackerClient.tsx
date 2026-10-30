'use client'

import { useCallback, useEffect, useRef, useState, useTransition } from 'react'
import Link from 'next/link'
import { Check, CloudOff, Dumbbell, Loader2, Plus, RotateCcw, Timer, Trash2, Trophy, X } from 'lucide-react'
import { ExerciseBrowser } from '@/components/ExerciseBrowser'
import { Alert, EmptyState } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Modal'
import { buttonStyles } from '@/components/ui/styles'
import { MUSCLE_GROUP_LABELS, getExercise } from '@/lib/exercises-data'
import { formatClock, formatKg, plural } from '@/lib/format'
import { DEFAULT_SETS_PER_EXERCISE, MAX_REPS, MAX_WEIGHT_KG } from '@/lib/sets'
import { getSplitOption } from '@/lib/splits'
import type { Exercise, PlannedExercise, RestTimerSettings, SetValues, WorkoutDay, WorkoutSet } from '@/lib/types'
import { addExerciseToWorkout, finishWorkout, syncWithPlan } from './actions'
import { useRestTimer, useSetPersistence } from './hooks'
import { applyChanges, type SetChange } from './outbox'

const UNSENT_MESSAGE = 'You’re offline. Your sets are saved on this phone; try again once you’re back online.'
/** How long the note about a new personal best stays up. */
const RECORD_NOTE_MS = 5000

/** A set heavier than anything lifted before for its exercise. */
interface NewRecord {
  setId: string
  exerciseName: string
  weight: number
  previous: number
}

/** Numbers an exercise's sets 1, 2, 3… in the order they are listed. */
function renumber(sets: WorkoutSet[], exerciseId: string): WorkoutSet[] {
  let number = 0
  return sets.map((s) => (s.exercise_id === exerciseId ? { ...s, set_number: ++number } : s))
}

/** Puts a set whose delete failed back in its old place. */
function restoreSet(sets: WorkoutSet[], set: WorkoutSet): WorkoutSet[] {
  const index = sets.findIndex((s) => s.exercise_id === set.exercise_id && s.set_number >= set.set_number)
  const next = index === -1 ? [...sets, set] : [...sets.slice(0, index), set, ...sets.slice(index)]
  return renumber(next, set.exercise_id)
}

export function TrackerClient({
  day,
  plannedExercises,
  restTimer,
  personalBests,
}: {
  day: WorkoutDay
  plannedExercises: PlannedExercise[]
  /** From Settings: whether ticking off a set starts the rest countdown, and its length. */
  restTimer: RestTimerSettings
  /** The heaviest weight ticked off so far for each exercise, in kg. */
  personalBests: Record<string, number>
}) {
  const [sets, setSets] = useState(day.sets)
  const [finished, setFinished] = useState(day.finished_at !== null)
  const [error, setError] = useState<string | null>(null)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [summaryOpen, setSummaryOpen] = useState(false)
  const [isSyncing, startSync] = useTransition()
  const [isFinishing, startFinish] = useTransition()
  const [addingId, setAddingId] = useState<string | null>(null)
  const [isAdding, startAdding] = useTransition()
  const timer = useRestTimer()
  const showUnsent = useCallback((unsent: SetChange[]) => setSets((prev) => applyChanges(prev, unsent)), [])
  const persistence = useSetPersistence(day.id, setError, showUnsent)
  // Raised as sets are ticked off, so each record is celebrated once.
  const bests = useRef(personalBests)
  const [record, setRecord] = useState<NewRecord | null>(null)
  const recordTimer = useRef<ReturnType<typeof setTimeout>>(undefined)
  useEffect(() => () => clearTimeout(recordTimer.current), [])
  const split = getSplitOption(day.split)

  const setsByExercise = new Map<string, WorkoutSet[]>()
  for (const exercise of plannedExercises) setsByExercise.set(exercise.id, [])
  for (const set of sets) setsByExercise.set(set.exercise_id, [...(setsByExercise.get(set.exercise_id) ?? []), set])
  const exerciseIds = [...setsByExercise.keys()]

  const completed = sets.filter((s) => s.is_completed)
  const completedIds = new Set(completed.map((s) => s.exercise_id))
  // Planned exercises with nothing ticked off yet and fewer sets than the routine asks for, e.g. after it changed.
  const behindCount = plannedExercises.filter(
    (e) => !completedIds.has(e.id) && setsByExercise.get(e.id)!.length < e.sets
  ).length
  const volumeKg = completed.reduce((sum, s) => sum + s.actual_weight * s.actual_reps, 0)

  const patchLocal = (setId: string, patch: Partial<WorkoutSet>) =>
    setSets((prev) => prev.map((s) => (s.id === setId ? { ...s, ...patch } : s)))

  /** Adds an exercise's first sets, as many as the routine plans, filled in from last time. */
  function addExerciseSets(exerciseId: string) {
    const setCount = plannedExercises.find((e) => e.id === exerciseId)?.sets ?? DEFAULT_SETS_PER_EXERCISE
    setError(null)
    setAddingId(exerciseId)
    startAdding(async () => {
      const result = await persistence.run(() => addExerciseToWorkout(day.id, exerciseId, setCount))
      if (result.ok) setSets((prev) => [...prev, ...result.data])
    })
  }

  function addSetTo(exerciseId: string) {
    const last = setsByExercise.get(exerciseId)?.at(-1)
    if (!last) return addExerciseSets(exerciseId)
    setError(null)
    const values: SetValues = { actual_reps: last.actual_reps, actual_weight: last.actual_weight }
    const setId = crypto.randomUUID()
    setSets((prev) => [
      ...prev,
      {
        id: setId,
        exercise_id: exerciseId,
        exercise_name: getExercise(exerciseId)?.name ?? '',
        set_number: last.set_number + 1,
        is_completed: false,
        ...values,
      },
    ])
    void persistence.createSet(setId, exerciseId, values).then((created) =>
      setSets((prev) =>
        created
          ? prev.map((s) => (s.id === setId ? { ...s, set_number: created.set_number } : s))
          : prev.filter((s) => s.id !== setId)
      )
    )
  }

  function changeValue(set: WorkoutSet, field: keyof SetValues, input: string) {
    const parsed = field === 'actual_weight' ? Math.round(parseFloat(input) * 100) / 100 : parseInt(input, 10)
    const max = field === 'actual_weight' ? MAX_WEIGHT_KG : MAX_REPS
    const value = Number.isFinite(parsed) ? Math.min(Math.max(parsed, 0), max) : 0
    patchLocal(set.id, { [field]: value })
    persistence.saveLater(set.id, field, value)
  }

  function toggleCompleted(set: WorkoutSet) {
    setError(null)
    const isCompleted = !set.is_completed
    patchLocal(set.id, { is_completed: isCompleted })
    if (isCompleted && restTimer.on) timer.start(restTimer.seconds)
    if (isCompleted) celebrateRecord(set)
    void persistence.saveNow(set.id, { is_completed: isCompleted }).then((saved) => {
      if (!saved) patchLocal(set.id, { is_completed: set.is_completed })
    })
  }

  function celebrateRecord(set: WorkoutSet) {
    const previous = bests.current[set.exercise_id] ?? 0
    if (set.actual_weight <= previous) return
    bests.current = { ...bests.current, [set.exercise_id]: set.actual_weight }
    // The first weighted set of an exercise has nothing to beat yet.
    if (previous === 0) return
    clearTimeout(recordTimer.current)
    setRecord({
      setId: set.id,
      exerciseName: getExercise(set.exercise_id)?.name ?? set.exercise_name,
      weight: set.actual_weight,
      previous,
    })
    recordTimer.current = setTimeout(() => setRecord(null), RECORD_NOTE_MS)
  }

  function deleteSet(set: WorkoutSet) {
    setError(null)
    setSets((prev) => renumber(prev.filter((s) => s.id !== set.id), set.exercise_id))
    void persistence.deleteSet(set.id).then((deleted) => {
      if (!deleted) setSets((prev) => restoreSet(prev, set))
    })
  }

  function addExercise(exercise: Exercise) {
    setPickerOpen(false)
    addSetTo(exercise.id)
  }

  function sync() {
    setError(null)
    startSync(async () => {
      if (!(await persistence.flush())) return setError(UNSENT_MESSAGE)
      const result = await persistence.run(() => syncWithPlan(day.id))
      if (result.ok) setSets(result.data)
    })
  }

  function finish() {
    setError(null)
    startFinish(async () => {
      if (!(await persistence.flush())) return setError(UNSENT_MESSAGE)
      const result = await persistence.run(() => finishWorkout(day.id))
      if (result.ok) {
        setFinished(true)
        setSummaryOpen(true)
      }
    })
  }

  return (
    <div className={`space-y-5 ${timer.active ? 'pb-20' : ''}`}>
      <div className="rounded-2xl border border-border bg-surface p-3.5">
        <div className="flex items-center justify-between gap-3 text-xs">
          <span className="flex items-center gap-2 font-bold text-foreground/80">
            <Dumbbell size={16} className="text-primary" /> {plural(exerciseIds.length, 'exercise')}
          </span>
          <span className="font-bold text-muted">
            {completed.length} / {plural(sets.length, 'set')} done
          </span>
        </div>
        <div
          className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-surface"
          role="progressbar"
          aria-label="Sets completed"
          aria-valuemin={0}
          aria-valuemax={sets.length}
          aria-valuenow={completed.length}
        >
          <div
            className="h-full rounded-full bg-primary transition-[width] duration-700 ease-spring"
            style={{ width: `${sets.length ? (completed.length / sets.length) * 100 : 0}%` }}
          />
        </div>
      </div>

      {behindCount > 0 && (
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-primary/30 bg-primary/10 p-3.5">
          <p className="text-xs text-foreground/80">
            {plural(behindCount, 'exercise')} from your {split.name} routine {behindCount === 1 ? 'has' : 'have'} fewer
            sets than planned.
          </p>
          <button type="button" onClick={sync} disabled={isSyncing} className={`${buttonStyles.chip} shrink-0`}>
            <RotateCcw size={13} className={isSyncing ? 'animate-spin' : ''} /> Sync with plan
          </button>
        </div>
      )}

      {persistence.offline && persistence.pending > 0 && (
        <div role="status" className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-3.5 text-xs text-foreground/80">
          <CloudOff size={18} className="shrink-0 text-muted" />
          <span>
            No connection. {plural(persistence.pending, 'change')} saved on this phone, sent as soon as you’re back
            online.
          </span>
        </div>
      )}

      {error && <Alert>{error}</Alert>}

      {finished && (
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-success/30 bg-success/10 p-3.5">
          <span className="flex items-center gap-2 text-sm font-bold text-emerald-300">
            <Trophy size={18} /> Workout finished
          </span>
          <button type="button" onClick={() => setSummaryOpen(true)} className={`${buttonStyles.chip} shrink-0`}>
            View summary
          </button>
        </div>
      )}

      {exerciseIds.length === 0 ? (
        <EmptyState
          icon={<Dumbbell size={32} />}
          title="No exercises in this session"
          description="Add exercises to your routine in Plan, or add one just for today."
        >
          <Link href="/plan" className={`${buttonStyles.secondary} text-xs`}>
            Open Plan
          </Link>
          <button type="button" onClick={() => setPickerOpen(true)} className={`${buttonStyles.soft} text-xs`}>
            <Plus size={14} /> Add exercise
          </button>
        </EmptyState>
      ) : (
        exerciseIds.map((exerciseId, index) => (
          <ExerciseCard
            key={exerciseId}
            index={index}
            exerciseId={exerciseId}
            sets={setsByExercise.get(exerciseId)!}
            plannedSets={plannedExercises.find((e) => e.id === exerciseId)?.sets ?? DEFAULT_SETS_PER_EXERCISE}
            isAdding={isAdding && addingId === exerciseId}
            onAddSet={() => addSetTo(exerciseId)}
            onChange={changeValue}
            onToggle={toggleCompleted}
            onDelete={deleteSet}
          />
        ))
      )}

      {isAdding && addingId && !setsByExercise.has(addingId) && (
        <div className="flex items-center justify-center gap-2 rounded-2xl border border-dashed border-border py-5 text-xs font-bold text-muted">
          <Loader2 size={16} className="animate-spin text-primary" /> Adding {getExercise(addingId)?.name}…
        </div>
      )}

      <div className="space-y-3 pt-1">
        <button
          type="button"
          onClick={() => setPickerOpen(true)}
          disabled={isAdding}
          className={`${buttonStyles.secondary} w-full text-sm`}
        >
          <Plus size={18} className="text-primary" /> Add another exercise
        </button>

        {!finished && completed.length > 0 && (
          <button
            type="button"
            onClick={finish}
            disabled={isFinishing}
            className="press flex w-full animate-float-in items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-4 text-base font-extrabold text-white shadow-lg shadow-emerald-600/30 hover:bg-emerald-500 disabled:opacity-60"
          >
            {isFinishing ? <Loader2 size={20} className="animate-spin" /> : <Trophy size={20} />} Finish workout
          </button>
        )}
      </div>

      {record && <RecordNote key={record.setId} record={record} onClose={() => setRecord(null)} />}

      {timer.active && (
        <RestTimerBar
          secondsLeft={timer.secondsLeft}
          total={timer.total}
          onAdd={() => timer.addSeconds(30)}
          onStop={timer.stop}
        />
      )}

      <Modal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        title="Add exercise"
        eyebrow={
          <>
            <span aria-hidden>{split.emoji}</span> Today’s {split.name}
          </>
        }
      >
        <ExerciseBrowser
          scrollable
          recommended={split.targetMuscleGroups}
          isAdded={(id) => setsByExercise.has(id)}
          onAdd={addExercise}
        />
      </Modal>

      <Modal open={summaryOpen} onClose={() => setSummaryOpen(false)} title="Great job, champ!">
        <div className="space-y-4 pt-4 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success/20 text-3xl" aria-hidden>
            🏆
          </div>
          <p className="text-sm text-muted">You finished today’s {split.name} workout.</p>
          <div className="grid grid-cols-3 gap-2">
            <SummaryStat value={completed.length} label="Sets done" />
            <SummaryStat value={new Set(completed.map((s) => s.exercise_id)).size} label="Exercises" />
            <SummaryStat value={Math.round(volumeKg).toLocaleString('en-GB')} label="Volume (kg)" />
          </div>
          <Link href="/dashboard" className={`${buttonStyles.primary} w-full`}>
            Back to dashboard
          </Link>
        </div>
      </Modal>
    </div>
  )
}

function ExerciseCard({
  index,
  exerciseId,
  sets,
  plannedSets,
  isAdding,
  onAddSet,
  onChange,
  onToggle,
  onDelete,
}: {
  index: number
  exerciseId: string
  sets: WorkoutSet[]
  /** Sets added at once when the exercise has none yet. */
  plannedSets: number
  isAdding: boolean
  onAddSet: () => void
  onChange: (set: WorkoutSet, field: keyof SetValues, input: string) => void
  onToggle: (set: WorkoutSet) => void
  onDelete: (set: WorkoutSet) => void
}) {
  const exercise = getExercise(exerciseId)
  const name = exercise?.name ?? sets[0]?.exercise_name ?? 'Exercise'
  const ordered = [...sets].sort((a, b) => a.set_number - b.set_number)
  const doneCount = ordered.filter((s) => s.is_completed).length
  const allDone = ordered.length > 0 && doneCount === ordered.length
  // Celebrate finishing the exercise only when it happens here, not for exercises already done on load.
  const [toggled, setToggled] = useState(false)

  return (
    <section
      className={`overflow-hidden rounded-2xl border bg-surface shadow-lg transition-colors ${
        allDone ? 'border-success/40' : 'border-border'
      }`}
      aria-label={name}
    >
      <header className="flex items-center gap-3 border-b border-border/60 bg-sunken/50 p-4">
        <span
          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-black ${
            allDone ? 'bg-success/20 text-success' : 'bg-primary/15 text-primary'
          }`}
        >
          {allDone ? <Check size={15} strokeWidth={3} className={toggled ? 'animate-pop' : ''} /> : index + 1}
        </span>
        <div className="min-w-0">
          <h3 className="text-base font-extrabold text-white">{name}</h3>
          <span className="text-[11px] text-muted">
            {exercise && `${MUSCLE_GROUP_LABELS[exercise.muscle_group]} · `}
            {doneCount} / {plural(ordered.length, 'set')} done
          </span>
        </div>
      </header>

      <div className="space-y-2.5 p-4">
        <div className="grid grid-cols-12 gap-2 px-2 text-[11px] font-black uppercase tracking-wider text-muted" aria-hidden>
          <span className="col-span-2 text-center">Set</span>
          <span className="col-span-4 text-center">Kg</span>
          <span className="col-span-3 text-center">Reps</span>
          <span className="col-span-3 text-center">Done</span>
        </div>

        {ordered.length === 0 ? (
          <p className="py-4 text-center text-xs text-muted">No sets yet. They start from what you lifted last time.</p>
        ) : (
          ordered.map((set, i) => (
            <SetRow
              key={set.id}
              number={i + 1}
              set={set}
              onChange={onChange}
              onToggle={(s) => {
                setToggled(true)
                onToggle(s)
              }}
              onDelete={onDelete}
            />
          ))
        )}

        <button
          type="button"
          onClick={onAddSet}
          disabled={isAdding}
          className="press mt-2 flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-foreground/15 bg-sunken/60 py-2.5 text-xs font-bold text-foreground/60 hover:bg-surface hover:text-white [--press-scale:0.97] disabled:opacity-60"
        >
          {isAdding ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}
          {ordered.length === 0 ? `Add ${plural(plannedSets, 'set')}` : `Add set ${ordered.length + 1}`}
        </button>
      </div>
    </section>
  )
}

const numberInput =
  'w-full rounded-lg border border-border bg-surface-hover/60 py-2 text-center text-sm font-bold text-white transition-colors placeholder:text-muted/60 focus:border-primary focus:outline-none'

function SetRow({
  number,
  set,
  onChange,
  onToggle,
  onDelete,
}: {
  number: number
  set: WorkoutSet
  onChange: (set: WorkoutSet, field: keyof SetValues, input: string) => void
  onToggle: (set: WorkoutSet) => void
  onDelete: (set: WorkoutSet) => void
}) {
  // Only pop the tick when it's tapped, not for sets that were already done.
  const [toggled, setToggled] = useState(false)

  return (
    <div
      className={`grid grid-cols-12 items-center gap-2 rounded-xl border p-2.5 transition-colors ${
        set.is_completed ? 'border-success/40 bg-success/10' : 'border-border/70 bg-sunken'
      }`}
    >
      <span className="col-span-2 text-center text-sm font-extrabold text-muted">{number}</span>
      <div className="col-span-4">
        <input
          type="number"
          inputMode="decimal"
          min={0}
          max={MAX_WEIGHT_KG}
          step="any"
          value={set.actual_weight === 0 ? '' : set.actual_weight}
          onChange={(e) => onChange(set, 'actual_weight', e.target.value)}
          onFocus={(e) => e.target.select()}
          placeholder="0"
          aria-label={`Set ${number} weight in kg`}
          className={numberInput}
        />
      </div>
      <div className="col-span-3">
        <input
          type="number"
          inputMode="numeric"
          min={0}
          max={MAX_REPS}
          step={1}
          value={set.actual_reps === 0 ? '' : set.actual_reps}
          onChange={(e) => onChange(set, 'actual_reps', e.target.value)}
          onFocus={(e) => e.target.select()}
          placeholder="0"
          aria-label={`Set ${number} reps`}
          className={numberInput}
        />
      </div>
      <div className="col-span-3 flex items-center justify-center gap-1.5">
        <button
          type="button"
          onClick={() => {
            setToggled(true)
            onToggle(set)
          }}
          aria-pressed={set.is_completed}
          aria-label={`Set ${number} done`}
          className={`press flex h-9 w-9 items-center justify-center rounded-xl [--press-scale:0.82] ${
            set.is_completed
              ? 'bg-success text-white shadow-md shadow-success/30'
              : 'bg-surface text-foreground/60 hover:bg-surface-hover hover:text-white'
          }`}
        >
          <Check size={18} strokeWidth={3} className={toggled && set.is_completed ? 'animate-pop' : ''} />
        </button>
        <button
          type="button"
          onClick={() => onDelete(set)}
          aria-label={`Delete set ${number}`}
          className="press flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:bg-red-950/30 hover:text-red-400 [--press-scale:0.85]"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  )
}

/** Pops up at the top when a set beats the exercise's personal best. */
function RecordNote({ record, onClose }: { record: NewRecord; onClose: () => void }) {
  return (
    <div
      role="status"
      className="fixed inset-x-4 top-[calc(1rem+env(safe-area-inset-top))] z-50 mx-auto flex max-w-lg animate-float-in items-center gap-3 rounded-2xl border border-primary/50 bg-sunken/95 p-3.5 shadow-2xl backdrop-blur-md"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/20 text-primary">
        <Trophy size={22} className="animate-pop" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[10px] font-black uppercase tracking-wider text-muted">New personal best</span>
        <span className="block truncate font-black text-white">
          {record.exerciseName}, {formatKg(record.weight)}
        </span>
        <span className="block text-[11px] text-muted">Up from {formatKg(record.previous)}</span>
      </span>
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="press flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-surface text-foreground/60 hover:text-white [--press-scale:0.85]"
      >
        <X size={16} />
      </button>
    </div>
  )
}

function RestTimerBar({
  secondsLeft,
  total,
  onAdd,
  onStop,
}: {
  secondsLeft: number
  total: number
  onAdd: () => void
  onStop: () => void
}) {
  return (
    <div className="fixed inset-x-4 bottom-[calc(5rem+env(safe-area-inset-bottom))] z-40 mx-auto max-w-lg animate-float-in overflow-hidden rounded-2xl border border-primary/50 bg-sunken/95 shadow-2xl backdrop-blur-md">
      <div className="flex items-center justify-between p-3.5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20 text-primary">
            <Timer size={22} className="animate-pulse" />
          </div>
          <div role="timer" aria-label="Rest time left">
            <span className="block text-[10px] font-black uppercase tracking-wider text-muted">Rest between sets</span>
            <span className="font-mono text-xl font-black text-white">{formatClock(secondsLeft)}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onAdd}
            className="press rounded-xl bg-surface px-2.5 py-1.5 text-xs font-bold text-white hover:bg-surface-hover [--press-scale:0.88]"
          >
            +30s
          </button>
          <button
            type="button"
            onClick={onStop}
            aria-label="Skip rest"
            className="press flex h-8 w-8 items-center justify-center rounded-xl bg-surface text-foreground/60 hover:text-white [--press-scale:0.85]"
          >
            <X size={16} />
          </button>
        </div>
      </div>
      <div className="h-1 bg-surface">
        <div
          className="h-full bg-primary transition-[width] duration-1000 ease-linear"
          style={{ width: `${total ? (secondsLeft / total) * 100 : 0}%` }}
        />
      </div>
    </div>
  )
}

function SummaryStat({ value, label }: { value: number | string; label: string }) {
  return (
    <div className="rounded-2xl border border-border bg-sunken p-3">
      <span className="block text-2xl font-black text-primary">{value}</span>
      <span className="mt-0.5 block text-[10px] font-bold uppercase text-muted">{label}</span>
    </div>
  )
}
