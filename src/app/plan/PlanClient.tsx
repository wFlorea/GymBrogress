'use client'

import { useState, useTransition } from 'react'
import {
  DAYS_OF_WEEK,
  SPLIT_OPTIONS,
  parseWeeklyPlan,
  serializeWeeklyPlan,
  PlannedExerciseItem,
  MUSCLE_GROUP_LABELS,
  MUSCLE_GROUP_EMOJIS,
  MuscleGroup,
} from '@/lib/types'
import { EXERCISES } from '@/lib/exercises-data'
import { addExerciseToPlan, removeExerciseFromPlan } from './actions'
import Link from 'next/link'
import {
  Plus,
  Trash2,
  Search,
  X,
  Dumbbell,
  ArrowRight,
  Coffee,
  Check,
  Filter,
  Sparkles,
} from 'lucide-react'

type PlanRecord = {
  id: string
  day_of_week: number
  workout_name: string
}

export function PlanClient({ initialPlans }: { initialPlans: PlanRecord[] }) {
  const [plans, setPlans] = useState<PlanRecord[]>(initialPlans)
  const [activeModalDay, setActiveModalDay] = useState<number | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedMuscleFilter, setSelectedMuscleFilter] = useState<'recommended' | 'all' | MuscleGroup>('recommended')
  const [isPending, startTransition] = useTransition()

  // Helper to extract plan for a day
  const getDayPlan = (dayIndex: number) => {
    const record = plans.find((p) => p.day_of_week === dayIndex)
    if (!record) return { split: 'Rest Day', exercises: [] }
    return parseWeeklyPlan(record.workout_name)
  }

  const handleAddExercise = (dayIndex: number, ex: { id: string; name: string; muscle_group: MuscleGroup }) => {
    const newItem: PlannedExerciseItem = {
      id: ex.id,
      name: ex.name,
      muscle_group: ex.muscle_group,
    }

    // Optimistic UI update
    const current = getDayPlan(dayIndex)
    if (current.exercises.some((e) => e.id === ex.id)) return

    const updatedExercises = [...current.exercises, newItem]
    const updatedWorkoutName = serializeWeeklyPlan(current.split, updatedExercises)

    const newPlans = [...plans]
    const idx = newPlans.findIndex((p) => p.day_of_week === dayIndex)
    if (idx >= 0) {
      newPlans[idx] = { ...newPlans[idx], workout_name: updatedWorkoutName }
    } else {
      newPlans.push({ id: 'temp-' + dayIndex, day_of_week: dayIndex, workout_name: updatedWorkoutName })
    }
    setPlans(newPlans)

    // DB Call
    startTransition(async () => {
      try {
        await addExerciseToPlan(dayIndex, newItem)
      } catch (err) {
        console.error(err)
      }
    })
  }

  const handleRemoveExercise = (dayIndex: number, exerciseId: string) => {
    // Optimistic UI update
    const current = getDayPlan(dayIndex)
    const updatedExercises = current.exercises.filter((e) => e.id !== exerciseId)
    const updatedWorkoutName = serializeWeeklyPlan(current.split, updatedExercises)

    const newPlans = [...plans]
    const idx = newPlans.findIndex((p) => p.day_of_week === dayIndex)
    if (idx >= 0) {
      newPlans[idx] = { ...newPlans[idx], workout_name: updatedWorkoutName }
    }
    setPlans(newPlans)

    // DB Call
    startTransition(async () => {
      try {
        await removeExerciseFromPlan(dayIndex, exerciseId)
      } catch (err) {
        console.error(err)
      }
    })
  }

  // Active modal details
  const activeDayName = activeModalDay !== null ? DAYS_OF_WEEK[activeModalDay] : ''
  const activePlan = activeModalDay !== null ? getDayPlan(activeModalDay) : null
  const activeSplitConfig = SPLIT_OPTIONS.find((s) => s.id === activePlan?.split || s.name === activePlan?.split)

  // Filter exercises in modal
  const filteredExercises = EXERCISES.filter((ex) => {
    // Search filter
    const matchesSearch =
      ex.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ex.description.toLowerCase().includes(searchTerm.toLowerCase())
    if (!matchesSearch) return false

    // Category / Muscle filter
    if (selectedMuscleFilter === 'all') return true
    if (selectedMuscleFilter === 'recommended') {
      if (!activeSplitConfig || activeSplitConfig.targetMuscleGroups.length === 0) return true
      return activeSplitConfig.targetMuscleGroups.includes(ex.muscle_group)
    }
    return ex.muscle_group === selectedMuscleFilter
  })

  return (
    <div className="space-y-6">
      {/* Quick intro note */}
      <div className="bg-[var(--color-surface)] p-4 rounded-2xl border border-[var(--color-border)] shadow-md flex items-center justify-between">
        <div>
          <h2 className="font-bold text-sm text-white">Planul tău de exerciții</h2>
          <p className="text-xs text-[var(--color-muted)] mt-0.5">
            Adaugă exercițiile dorite pentru fiecare sesiune planificată.
          </p>
        </div>
        <Link
          href="/schedule"
          className="text-xs font-bold text-[var(--color-primary)] hover:underline flex items-center gap-1 bg-[#FF4500]/10 px-3 py-1.5 rounded-xl border border-[#FF4500]/20"
        >
          Schimbă Zilele
        </Link>
      </div>

      {/* 7 Days Workout Planner */}
      <div className="space-y-4">
        {DAYS_OF_WEEK.map((dayName, dayIndex) => {
          const { split, exercises } = getDayPlan(dayIndex)
          const splitConfig = SPLIT_OPTIONS.find((s) => s.id === split || s.name === split) || SPLIT_OPTIONS.find((s) => s.id === 'Rest Day')!
          const isRest = splitConfig.id === 'Rest Day'

          return (
            <div
              key={dayName}
              className={`rounded-2xl border transition-all overflow-hidden shadow-sm ${
                isRest
                  ? 'bg-[var(--color-surface)]/60 border-[var(--color-border)]'
                  : 'bg-[var(--color-surface)] border-[#FF4500]/25'
              }`}
            >
              {/* Day Card Header */}
              <div className="p-4 flex items-center justify-between border-b border-[var(--color-border)]/60">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{splitConfig.emoji}</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-black text-base text-white">{dayName}</h3>
                      <span
                        className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                          isRest
                            ? 'bg-zinc-800 text-zinc-400'
                            : 'bg-[#FF4500]/15 text-[var(--color-primary)]'
                        }`}
                      >
                        {splitConfig.name}
                      </span>
                    </div>
                    <p className="text-xs text-[var(--color-muted)] mt-0.5">{splitConfig.description}</p>
                  </div>
                </div>

                {!isRest && (
                  <span className="text-xs font-bold text-zinc-400 bg-zinc-800/80 px-2.5 py-1 rounded-xl">
                    {exercises.length} {exercises.length === 1 ? 'exercițiu' : 'exerciții'}
                  </span>
                )}
              </div>

              {/* Day Card Body */}
              <div className="p-4">
                {isRest ? (
                  /* Rest Day Special View */
                  <div className="py-4 px-2 text-center flex flex-col items-center justify-center">
                    <span className="text-3xl mb-1.5">🧘‍♂️</span>
                    <h4 className="font-extrabold text-base text-[var(--color-primary)]">
                      Odihnă, Campionule!
                    </h4>
                    <p className="text-xs text-[var(--color-muted)] mt-1 max-w-xs">
                      Astăzi mușchii tăi se regenerează și cresc. Asigură-te că te odihnești și te hidratezi!
                    </p>
                  </div>
                ) : (
                  /* Workout Exercises View */
                  <div className="space-y-2.5">
                    {exercises.length === 0 ? (
                      <div className="text-center py-5 border border-dashed border-[var(--color-border)] rounded-xl">
                        <Dumbbell size={24} className="mx-auto text-[var(--color-muted)] mb-2" />
                        <p className="text-xs text-[var(--color-muted)]">
                          Nu ai adăugat încă niciun exercițiu pentru {dayName}.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {exercises.map((item, idx) => (
                          <div
                            key={item.id + '-' + idx}
                            className="bg-[#161616] p-3 rounded-xl border border-[var(--color-border)]/80 flex items-center justify-between hover:border-zinc-600 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <span className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-bold text-[var(--color-muted)]">
                                {idx + 1}
                              </span>
                              <div>
                                <h5 className="font-bold text-sm text-white">{item.name}</h5>
                                <span className="text-[10px] text-[var(--color-muted)] flex items-center gap-1">
                                  {MUSCLE_GROUP_EMOJIS[item.muscle_group || 'chest']}{' '}
                                  {MUSCLE_GROUP_LABELS[item.muscle_group || 'chest']}
                                </span>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleRemoveExercise(dayIndex, item.id)}
                              className="w-8 h-8 rounded-lg flex items-center justify-center text-red-400 hover:bg-red-950/40 hover:text-red-300 transition-colors"
                              title="Șterge exercițiul"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Add Exercise Button */}
                    <button
                      type="button"
                      onClick={() => {
                        setActiveModalDay(dayIndex)
                        setSearchTerm('')
                        setSelectedMuscleFilter('recommended')
                      }}
                      className="w-full mt-3 py-3 border border-dashed border-[#FF4500]/40 text-[var(--color-primary)] font-bold text-xs rounded-xl hover:bg-[#FF4500]/10 transition-all flex items-center justify-center gap-1.5 active:scale-[0.99]"
                    >
                      <Plus size={16} /> Adaugă Exercițiu
                    </button>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Quick link to Tracker */}
      <div className="pt-2">
        <Link
          href="/tracker"
          className="w-full bg-[var(--color-primary)] text-white font-bold py-4 rounded-2xl hover:bg-[var(--color-primary-hover)] transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#FF4500]/25 active:scale-[0.98] text-sm"
        >
          <span>Deschide Tracker-ul de Azi</span>
          <ArrowRight size={18} />
        </Link>
      </div>

      {/* Exercise Picker Modal */}
      {activeModalDay !== null && activePlan && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-[var(--color-surface)] border-t sm:border border-[var(--color-border)] rounded-t-3xl sm:rounded-3xl p-5 max-h-[88vh] flex flex-col shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[var(--color-border)]">
              <div>
                <span className="text-xs uppercase tracking-wider text-[var(--color-muted)] font-bold">
                  {activeDayName} • {activePlan.split}
                </span>
                <h3 className="text-xl font-extrabold text-white">Adaugă în Rutină</h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveModalDay(null)}
                className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Search Input */}
            <div className="relative my-3">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Caută exercițiu (ex: Bench Press, Squat, Ramat)..."
                className="w-full rounded-xl pl-10 pr-4 py-2.5 bg-[#141414] border border-[var(--color-border)] text-white text-xs placeholder:text-[var(--color-muted)] focus:outline-none focus:border-[var(--color-primary)]"
              />
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-muted)]" />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none text-xs">
              <button
                type="button"
                onClick={() => setSelectedMuscleFilter('recommended')}
                className={`px-3 py-1.5 rounded-full font-bold whitespace-nowrap transition-colors flex items-center gap-1 ${
                  selectedMuscleFilter === 'recommended'
                    ? 'bg-[var(--color-primary)] text-white'
                    : 'bg-zinc-800 text-zinc-400 hover:text-white'
                }`}
              >
                <Sparkles size={12} /> Recomandate
              </button>
              <button
                type="button"
                onClick={() => setSelectedMuscleFilter('all')}
                className={`px-3 py-1.5 rounded-full font-bold whitespace-nowrap transition-colors ${
                  selectedMuscleFilter === 'all'
                    ? 'bg-[var(--color-primary)] text-white'
                    : 'bg-zinc-800 text-zinc-400 hover:text-white'
                }`}
              >
                Toate ({EXERCISES.length})
              </button>
              {(['chest', 'back', 'legs', 'shoulders', 'arms', 'core', 'cardio'] as MuscleGroup[]).map((mg) => (
                <button
                  key={mg}
                  type="button"
                  onClick={() => setSelectedMuscleFilter(mg)}
                  className={`px-2.5 py-1.5 rounded-full font-medium whitespace-nowrap transition-colors flex items-center gap-1 ${
                    selectedMuscleFilter === mg
                      ? 'bg-[var(--color-primary)] text-white'
                      : 'bg-zinc-800 text-zinc-400 hover:text-white'
                  }`}
                >
                  <span>{MUSCLE_GROUP_EMOJIS[mg]}</span>
                  <span>{MUSCLE_GROUP_LABELS[mg]}</span>
                </button>
              ))}
            </div>

            {/* Exercises List */}
            <div className="overflow-y-auto py-2 space-y-2 pr-1 flex-1">
              {filteredExercises.length === 0 ? (
                <div className="text-center py-10 text-[var(--color-muted)] text-xs">
                  Nu a fost găsit niciun exercițiu pentru criteriile alese.
                </div>
              ) : (
                filteredExercises.map((ex) => {
                  const isAlreadyAdded = activePlan.exercises.some((e) => e.id === ex.id)

                  return (
                    <div
                      key={ex.id}
                      className={`p-3 rounded-2xl border transition-all flex items-center justify-between ${
                        isAlreadyAdded
                          ? 'bg-[#182318] border-emerald-800/60 opacity-80'
                          : 'bg-[#181818] border-[var(--color-border)] hover:border-zinc-600'
                      }`}
                    >
                      <div className="flex-1 pr-3">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-sm text-white">{ex.name}</h4>
                          <span className="text-[10px] bg-zinc-800 px-2 py-0.5 rounded text-zinc-400">
                            {MUSCLE_GROUP_LABELS[ex.muscle_group]}
                          </span>
                        </div>
                        <p className="text-xs text-[var(--color-muted)] mt-1 line-clamp-1">
                          {ex.description}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleAddExercise(activeModalDay, ex)}
                        disabled={isAlreadyAdded}
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all ${
                          isAlreadyAdded
                            ? 'bg-emerald-900/40 text-emerald-400 cursor-default'
                            : 'bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)] active:scale-95 shadow-md shadow-[#FF4500]/20'
                        }`}
                        title={isAlreadyAdded ? 'Deja adăugat' : 'Adaugă exercițiu'}
                      >
                        {isAlreadyAdded ? <Check size={18} strokeWidth={3} /> : <Plus size={18} />}
                      </button>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
