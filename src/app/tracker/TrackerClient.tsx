'use client'

import { useState, useTransition, useEffect, useRef } from 'react'
import { EXERCISES } from '@/lib/exercises-data'
import { addExerciseSet, updateSet, removeSet } from './actions'
import {
  Check,
  Trash2,
  Plus,
  Timer,
  X,
  Dumbbell,
  Search,
  Sparkles,
  Trophy,
  ArrowRight,
  Flame,
  RotateCcw,
} from 'lucide-react'
import Link from 'next/link'

type SetData = {
  id: string
  exercise_id: string
  exercise_name: string
  set_number: number
  actual_reps: number
  actual_weight: number
  is_completed: boolean
}

type PlannedItem = {
  id: string
  name: string
  muscle_group?: string
}

export function TrackerClient({
  logId,
  initialSets,
  plannedExercises = [],
}: {
  logId: string
  initialSets: SetData[]
  plannedExercises?: PlannedItem[]
}) {
  const [sets, setSets] = useState<SetData[]>(initialSets)
  const [showAddExerciseModal, setShowAddExerciseModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [isPending, startTransition] = useTransition()

  // Rest Timer State
  const [timerActive, setTimerActive] = useState(false)
  const [timerSecondsLeft, setTimerSecondsLeft] = useState(90)
  const [timerTotalSeconds, setTimerTotalSeconds] = useState(90)
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Finished Workout Summary Modal State
  const [showFinishModal, setShowFinishModal] = useState(false)

  // Synchronize initialSets when updated
  useEffect(() => {
    setSets(initialSets)
  }, [initialSets])

  // Rest Timer Countdown logic
  useEffect(() => {
    if (timerActive && timerSecondsLeft > 0) {
      timerIntervalRef.current = setTimeout(() => {
        setTimerSecondsLeft((prev) => prev - 1)
      }, 1000)
    } else if (timerActive && timerSecondsLeft === 0) {
      setTimerActive(false)
      // Play audio beep & trigger vibration
      try {
        if (typeof window !== 'undefined' && 'vibrate' in navigator) {
          navigator.vibrate([200, 100, 200])
        }
        playRestDoneSound()
      } catch (e) {
        console.error(e)
      }
    }

    return () => {
      if (timerIntervalRef.current) clearTimeout(timerIntervalRef.current)
    }
  }, [timerActive, timerSecondsLeft])

  const startRestTimer = (seconds = 90) => {
    if (timerIntervalRef.current) clearTimeout(timerIntervalRef.current)
    setTimerTotalSeconds(seconds)
    setTimerSecondsLeft(seconds)
    setTimerActive(true)
  }

  const addTimerSeconds = (extra = 30) => {
    setTimerSecondsLeft((prev) => prev + extra)
    setTimerTotalSeconds((prev) => Math.max(prev, timerSecondsLeft + extra))
  }

  const stopRestTimer = () => {
    if (timerIntervalRef.current) clearTimeout(timerIntervalRef.current)
    setTimerActive(false)
  }

  const playRestDoneSound = () => {
    try {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      if (!AudioContextClass) return
      const ctx = new AudioContextClass()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(880, ctx.currentTime) // A5
      gain.gain.setValueAtTime(0.3, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.6)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start()
      osc.stop(ctx.currentTime + 0.6)
    } catch {
      // Audio autoplay restrictions fallback
    }
  }

  // Group current sets by exercise_id
  const groupedSets = sets.reduce((acc, set) => {
    if (!acc[set.exercise_id]) {
      acc[set.exercise_id] = { name: set.exercise_name, sets: [] }
    }
    acc[set.exercise_id].sets.push(set)
    return acc
  }, {} as Record<string, { name: string; sets: SetData[] }>)

  // Ensure planned exercises also appear as tables even if they don't have sets yet
  plannedExercises.forEach((pe) => {
    if (!groupedSets[pe.id]) {
      groupedSets[pe.id] = { name: pe.name, sets: [] }
    }
  })

  // Handlers
  const handleAddSetToExercise = (exerciseId: string, exerciseName: string) => {
    const existingForThis = groupedSets[exerciseId]?.sets || []
    const lastSet = existingForThis[existingForThis.length - 1]
    const defaultWeight = lastSet ? lastSet.actual_weight : 0
    const defaultReps = lastSet ? lastSet.actual_reps : 10

    const tempId = 'temp-' + Date.now()
    const nextSetNumber = existingForThis.length + 1

    const optimisticSet: SetData = {
      id: tempId,
      exercise_id: exerciseId,
      exercise_name: exerciseName,
      set_number: nextSetNumber,
      actual_weight: defaultWeight,
      actual_reps: defaultReps,
      is_completed: false,
    }

    setSets((prev) => [...prev, optimisticSet])

    startTransition(async () => {
      try {
        const created = await addExerciseSet(logId, exerciseId, exerciseName, defaultWeight, defaultReps)
        if (created) {
          setSets((prev) => prev.map((s) => (s.id === tempId ? created : s)))
        }
      } catch (err) {
        console.error(err)
      }
    })
  }

  const handleAddExtraExercise = (exerciseId: string, exerciseName: string) => {
    setShowAddExerciseModal(false)
    handleAddSetToExercise(exerciseId, exerciseName)
  }

  const handleUpdateSet = (setId: string, field: 'actual_reps' | 'actual_weight', value: string) => {
    const numValue = field === 'actual_weight' ? parseFloat(value) || 0 : parseInt(value, 10) || 0

    // Optimistic UI update
    setSets((prev) => prev.map((s) => (s.id === setId ? { ...s, [field]: numValue } : s)))

    startTransition(() => {
      updateSet(setId, { [field]: numValue })
    })
  }

  const handleToggleComplete = (setId: string, currentCompleted: boolean) => {
    const nextStatus = !currentCompleted

    // Optimistic UI update
    setSets((prev) => prev.map((s) => (s.id === setId ? { ...s, is_completed: nextStatus } : s)))

    // Start rest timer automatically when checking a set as done!
    if (nextStatus) {
      startRestTimer(90)
    }

    startTransition(() => {
      updateSet(setId, { is_completed: nextStatus })
    })
  }

  const handleRemoveSet = (setId: string) => {
    setSets((prev) => prev.filter((s) => s.id !== setId))
    startTransition(() => {
      removeSet(setId)
    })
  }

  // Calculate totals
  const totalVolumeKg = sets
    .filter((s) => s.is_completed)
    .reduce((sum, s) => sum + (s.actual_weight || 0) * (s.actual_reps || 0), 0)
  const completedSetsCount = sets.filter((s) => s.is_completed).length

  const filteredLibrary = EXERCISES.filter((ex) =>
    ex.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const exercisesList = Object.entries(groupedSets)

  return (
    <div className="space-y-6 pb-28">
      {/* Exercise Tables (One Table per Planned Exercise) */}
      {exercisesList.length === 0 ? (
        <div className="bg-[var(--color-surface)] p-6 rounded-2xl border border-[var(--color-border)] text-center space-y-3">
          <Dumbbell size={32} className="mx-auto text-[var(--color-muted)]" />
          <h3 className="font-bold text-white text-base">Niciun exercițiu încă în sesiune</h3>
          <p className="text-xs text-[var(--color-muted)] max-w-xs mx-auto">
            Nu ai exerciții planificate pentru ziua de azi sau dorești un antrenament liber.
          </p>
          <div className="flex justify-center gap-3 pt-2">
            <Link
              href="/plan"
              className="px-4 py-2 bg-zinc-800 text-zinc-300 hover:text-white rounded-xl text-xs font-semibold border border-zinc-700"
            >
              Configurează în Plan
            </Link>
            <button
              type="button"
              onClick={() => setShowAddExerciseModal(true)}
              className="px-4 py-2 bg-[var(--color-primary)] text-white rounded-xl text-xs font-bold shadow-md shadow-[#FF4500]/20"
            >
              + Adaugă Exercițiu
            </button>
          </div>
        </div>
      ) : (
        exercisesList.map(([exerciseId, data], exerciseIndex) => {
          const exerciseSets = data.sets.sort((a, b) => a.set_number - b.set_number)

          return (
            <div
              key={exerciseId}
              className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] overflow-hidden shadow-lg transition-all"
            >
              {/* Exercise Header */}
              <div className="p-4 border-b border-[var(--color-border)]/60 flex items-center justify-between bg-zinc-900/50">
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-lg bg-[#FF4500]/15 flex items-center justify-center font-black text-xs text-[var(--color-primary)]">
                    {exerciseIndex + 1}
                  </span>
                  <div>
                    <h3 className="font-extrabold text-base text-white">{data.name}</h3>
                    <span className="text-[11px] text-[var(--color-muted)]">
                      {exerciseSets.filter((s) => s.is_completed).length} / {exerciseSets.length} seturi efectuate
                    </span>
                  </div>
                </div>
              </div>

              {/* Exercise Table Body */}
              <div className="p-4 space-y-2.5">
                {/* Table Column Labels */}
                <div className="grid grid-cols-12 gap-2 text-[11px] font-black uppercase tracking-wider text-[var(--color-muted)] px-2">
                  <div className="col-span-2 text-center">SET</div>
                  <div className="col-span-4 text-center">KG</div>
                  <div className="col-span-3 text-center">REPS</div>
                  <div className="col-span-3 text-center">GATA</div>
                </div>

                {/* Rows for each Set */}
                {exerciseSets.length === 0 ? (
                  <div className="text-center py-4 text-xs text-[var(--color-muted)]">
                    Apasă pe butonul de mai jos pentru a începe Setul 1.
                  </div>
                ) : (
                  exerciseSets.map((set) => (
                    <div
                      key={set.id}
                      className={`grid grid-cols-12 gap-2 items-center p-2.5 rounded-xl border transition-all ${
                        set.is_completed
                          ? 'bg-[#142316] border-emerald-800/60 text-white'
                          : 'bg-[#151515] border-[var(--color-border)]/70'
                      }`}
                    >
                      {/* Set Number */}
                      <div className="col-span-2 text-center font-extrabold text-sm text-[var(--color-muted)]">
                        {set.set_number}
                      </div>

                      {/* Weight (KG) */}
                      <div className="col-span-4">
                        <input
                          type="number"
                          step="any"
                          value={set.actual_weight === 0 ? '' : set.actual_weight}
                          onChange={(e) => handleUpdateSet(set.id, 'actual_weight', e.target.value)}
                          placeholder="0"
                          className="w-full bg-[#1e1e1e] border border-[var(--color-border)] rounded-lg py-2 text-center text-sm font-bold text-white focus:outline-none focus:border-[var(--color-primary)] transition-colors"
                        />
                      </div>

                      {/* Reps */}
                      <div className="col-span-3">
                        <input
                          type="number"
                          value={set.actual_reps === 0 ? '' : set.actual_reps}
                          onChange={(e) => handleUpdateSet(set.id, 'actual_reps', e.target.value)}
                          placeholder="0"
                          className="w-full bg-[#1e1e1e] border border-[var(--color-border)] rounded-lg py-2 text-center text-sm font-bold text-white focus:outline-none focus:border-[var(--color-primary)] transition-colors"
                        />
                      </div>

                      {/* Complete Checkbox & Delete */}
                      <div className="col-span-3 flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleToggleComplete(set.id, set.is_completed)}
                          className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                            set.is_completed
                              ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30'
                              : 'bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700'
                          }`}
                          title={set.is_completed ? 'Set completat' : 'Marchează ca efectuat'}
                        >
                          <Check size={18} strokeWidth={3} />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleRemoveSet(set.id)}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-500 hover:text-red-400 hover:bg-red-950/30 transition-colors"
                          title="Șterge setul"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))
                )}

                {/* + Adaugă Set Button */}
                <button
                  type="button"
                  onClick={() => handleAddSetToExercise(exerciseId, data.name)}
                  className="w-full mt-2 py-2.5 text-xs font-bold text-zinc-400 hover:text-white bg-zinc-900/60 hover:bg-zinc-800 rounded-xl border border-dashed border-zinc-700 transition-all flex items-center justify-center gap-1.5 active:scale-[0.99]"
                >
                  <Plus size={15} /> Adaugă Set {exerciseSets.length + 1}
                </button>
              </div>
            </div>
          )
        })
      )}

      {/* Action Buttons at bottom of Tracker */}
      <div className="space-y-3 pt-2">
        <button
          type="button"
          onClick={() => {
            setShowAddExerciseModal(true)
            setSearchQuery('')
          }}
          className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] hover:border-[var(--color-primary)] text-white font-bold py-3.5 rounded-2xl transition-all flex items-center justify-center gap-2 text-sm shadow-sm"
        >
          <Plus size={18} className="text-[var(--color-primary)]" />
          <span>Adaugă Exercițiu Extra</span>
        </button>

        {completedSetsCount > 0 && (
          <button
            type="button"
            onClick={() => setShowFinishModal(true)}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold py-4 rounded-2xl transition-all flex items-center justify-center gap-2 text-base shadow-lg shadow-emerald-600/30 active:scale-[0.98]"
          >
            <Trophy size={20} />
            <span>Finalizează Antrenamentul</span>
          </button>
        )}
      </div>

      {/* Floating Rest Timer Bar */}
      {timerActive && (
        <div className="fixed bottom-20 left-4 right-4 max-w-lg mx-auto z-40 bg-zinc-900/95 border border-[var(--color-primary)]/50 rounded-2xl p-3.5 shadow-2xl backdrop-blur-md flex items-center justify-between animate-in slide-in-from-bottom-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#FF4500]/20 flex items-center justify-center text-[var(--color-primary)]">
              <Timer size={22} className="animate-pulse" />
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-wider text-[var(--color-muted)] font-black block">
                Pauză între seturi
              </span>
              <span className="text-xl font-black text-white font-mono">
                {Math.floor(timerSecondsLeft / 60)}:
                {(timerSecondsLeft % 60).toString().padStart(2, '0')}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => addTimerSeconds(30)}
              className="px-2.5 py-1.5 rounded-xl bg-zinc-800 text-white text-xs font-bold hover:bg-zinc-700 transition-colors"
            >
              +30s
            </button>
            <button
              type="button"
              onClick={stopRestTimer}
              className="w-8 h-8 rounded-xl bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Finished Workout Summary Modal */}
      {showFinishModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-sm bg-[var(--color-surface)] border border-[var(--color-border)] rounded-3xl p-6 text-center shadow-2xl space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto text-3xl shadow-inner">
              🏆
            </div>
            <div>
              <h3 className="text-2xl font-black text-white">Bravo, Campionule!</h3>
              <p className="text-xs text-[var(--color-muted)] mt-1">
                Ai dus antrenamentul de azi la bun sfârșit cu succes.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 py-2">
              <div className="bg-[#181818] p-3 rounded-2xl border border-[var(--color-border)]">
                <span className="text-2xl font-black text-[var(--color-primary)]">{completedSetsCount}</span>
                <span className="text-[10px] text-[var(--color-muted)] block uppercase font-bold mt-0.5">
                  Seturi bifate
                </span>
              </div>
              <div className="bg-[#181818] p-3 rounded-2xl border border-[var(--color-border)]">
                <span className="text-2xl font-black text-emerald-400">{Math.round(totalVolumeKg)}</span>
                <span className="text-[10px] text-[var(--color-muted)] block uppercase font-bold mt-0.5">
                  Volum Total (KG)
                </span>
              </div>
            </div>

            <Link
              href="/dashboard"
              className="w-full bg-[var(--color-primary)] text-white font-extrabold py-3.5 rounded-2xl block hover:bg-[var(--color-primary-hover)] transition-all shadow-lg shadow-[#FF4500]/25"
            >
              Mergi la Dashboard
            </Link>
          </div>
        </div>
      )}

      {/* Add Extra Exercise Modal */}
      {showAddExerciseModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-lg bg-[var(--color-surface)] border-t sm:border border-[var(--color-border)] rounded-t-3xl sm:rounded-3xl p-5 max-h-[85vh] flex flex-col shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--color-border)]">
              <div>
                <h3 className="text-lg font-black text-white">Adaugă Exercițiu Extra</h3>
                <p className="text-xs text-[var(--color-muted)]">Alege un exercițiu din bibliotecă pentru azi</p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddExerciseModal(false)}
                className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <div className="relative my-3">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Caută exercițiu..."
                className="w-full rounded-xl pl-10 pr-4 py-2.5 bg-[#141414] border border-[var(--color-border)] text-white text-xs placeholder:text-[var(--color-muted)] focus:outline-none focus:border-[var(--color-primary)]"
              />
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-muted)]" />
            </div>

            <div className="overflow-y-auto py-2 space-y-2 pr-1 flex-1">
              {filteredLibrary.map((ex) => (
                <button
                  key={ex.id}
                  type="button"
                  onClick={() => handleAddExtraExercise(ex.id, ex.name)}
                  className="w-full text-left p-3 rounded-2xl bg-[#181818] border border-[var(--color-border)] hover:border-zinc-500 transition-all flex items-center justify-between group active:scale-[0.99]"
                >
                  <div>
                    <h4 className="font-bold text-sm text-white group-hover:text-[var(--color-primary)] transition-colors">
                      {ex.name}
                    </h4>
                    <span className="text-[10px] text-[var(--color-muted)] capitalize">
                      {ex.muscle_group}
                    </span>
                  </div>
                  <div className="w-8 h-8 rounded-xl bg-zinc-800 group-hover:bg-[var(--color-primary)] group-hover:text-white flex items-center justify-center text-zinc-400 transition-colors">
                    <Plus size={16} />
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
