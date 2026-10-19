'use client'

import { useState, useTransition } from 'react'
import {
  DAYS_OF_WEEK,
  SPLIT_OPTIONS,
  parseWeeklyPlan,
  SplitType,
  getExercisesForSplit,
} from '@/lib/types'
import { updateDaySplit } from './actions'
import Link from 'next/link'
import {
  Calendar,
  ChevronRight,
  Check,
  X,
  ArrowRight,
  Layers,
  Sparkles,
  ClipboardList,
} from 'lucide-react'

type PlanRecord = {
  id: string
  day_of_week: number
  workout_name: string
}

export function ScheduleClient({ initialPlans }: { initialPlans: PlanRecord[] }) {
  const [plans, setPlans] = useState<PlanRecord[]>(initialPlans)
  const [selectedDayIndex, setSelectedDayIndex] = useState<number | null>(null)
  const [isPending, startTransition] = useTransition()

  // Get current split for a given day
  const getDayPlan = (dayIndex: number) => {
    const record = plans.find((p) => p.day_of_week === dayIndex)
    if (!record) return { split: 'Rest Day', exercises: [] }
    return parseWeeklyPlan(record.workout_name)
  }

  const handleSelectSplit = (splitId: SplitType) => {
    if (selectedDayIndex === null) return
    const dayIndex = selectedDayIndex

    // Optimistic state update with exercises pulled from default/saved templates
    const autoExercises = splitId === 'Rest Day' ? [] : getExercisesForSplit(splitId)
    const updatedWorkoutName = JSON.stringify({
      split: splitId,
      exercises: autoExercises,
    })

    const newPlans = [...plans]
    const existingIndex = newPlans.findIndex((p) => p.day_of_week === dayIndex)
    if (existingIndex >= 0) {
      newPlans[existingIndex] = { ...newPlans[existingIndex], workout_name: updatedWorkoutName }
    } else {
      newPlans.push({ id: 'temp-' + dayIndex, day_of_week: dayIndex, workout_name: updatedWorkoutName })
    }
    setPlans(newPlans)
    setSelectedDayIndex(null)

    // Server update
    startTransition(async () => {
      try {
        await updateDaySplit(dayIndex, splitId)
      } catch (err) {
        console.error(err)
      }
    })
  }

  const activeDayName = selectedDayIndex !== null ? DAYS_OF_WEEK[selectedDayIndex] : ''
  const currentSplitForActiveDay = selectedDayIndex !== null ? getDayPlan(selectedDayIndex).split : ''

  return (
    <div className="space-y-6">
      {/* View Switcher: Weekly Schedule vs Monthly Calendar */}
      <div className="grid grid-cols-2 p-1 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl">
        <button
          type="button"
          className="py-2.5 px-4 rounded-xl font-bold text-xs bg-[var(--color-primary)] text-white shadow-md shadow-[#FF4500]/20 flex items-center justify-center gap-1.5"
        >
          <Calendar size={14} />
          <span>Săptămânal</span>
        </button>

        <Link
          href="/calendar"
          className="py-2.5 px-4 rounded-xl font-bold text-xs text-zinc-400 hover:text-white hover:bg-zinc-800/60 transition-colors flex items-center justify-center gap-1.5"
        >
          <Layers size={14} />
          <span>Calendar Lună</span>
          <span className="text-[9px] bg-emerald-500/20 text-emerald-400 font-extrabold px-1.5 py-0.5 rounded-full border border-emerald-500/30">
            NOU
          </span>
        </Link>
      </div>

      {/* Informative Banner */}
      <div className="bg-[var(--color-surface)] p-4 rounded-2xl border border-[var(--color-border)] flex items-start gap-3 shadow-md">
        <div className="w-10 h-10 rounded-xl bg-[#FF4500]/15 flex items-center justify-center text-[var(--color-primary)] shrink-0 mt-0.5">
          <Calendar size={20} />
        </div>
        <div>
          <h2 className="font-bold text-sm text-white">Programul Tău Săptămânal</h2>
          <p className="text-xs text-[var(--color-muted)] mt-1 leading-relaxed">
            Alege tipul de antrenament pentru fiecare zi. Când selectezi o grupă (ex: Push sau Legs), exercițiile din <strong>Plan</strong> se asociază instant fără tastare manuală!
          </p>
        </div>
      </div>

      {/* Days List */}
      <div className="space-y-2.5">
        {DAYS_OF_WEEK.map((dayName, index) => {
          const { split: splitName, exercises } = getDayPlan(index)
          const splitConfig =
            SPLIT_OPTIONS.find((s) => s.id === splitName || s.name === splitName) ||
            SPLIT_OPTIONS.find((s) => s.id === 'Rest Day')!
          const isRest = splitConfig.id === 'Rest Day'

          return (
            <div
              key={dayName}
              onClick={() => setSelectedDayIndex(index)}
              className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between active:scale-[0.99] ${
                isRest
                  ? 'bg-[var(--color-surface)]/70 border-[var(--color-border)] hover:border-zinc-600'
                  : 'bg-[var(--color-surface)] border-[#FF4500]/30 hover:border-[var(--color-primary)] shadow-sm'
              }`}
            >
              <div className="flex items-center gap-3.5">
                <div
                  className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0 ${
                    isRest ? 'bg-zinc-800/80 text-zinc-400' : 'bg-[#FF4500]/20 text-white shadow-inner'
                  }`}
                >
                  {splitConfig.emoji}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-base text-white">{dayName}</span>
                    {!isRest && exercises.length > 0 && (
                      <span className="text-[10px] text-zinc-400 bg-zinc-800/90 px-2 py-0.5 rounded-full">
                        {exercises.length} ex.
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-[var(--color-muted)] mt-0.5 block line-clamp-1">
                    {splitConfig.description}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={`text-xs font-bold px-3 py-1.5 rounded-full border ${
                    isRest
                      ? 'bg-zinc-800 text-zinc-400 border-zinc-700'
                      : 'bg-[#FF4500]/15 text-[var(--color-primary)] border-[#FF4500]/30'
                  }`}
                >
                  {splitConfig.name}
                </span>
                <ChevronRight size={18} className="text-[var(--color-muted)]" />
              </div>
            </div>
          )
        })}
      </div>

      {/* Next Step Action Buttons */}
      <div className="pt-2 grid grid-cols-2 gap-3">
        <Link
          href="/plan"
          className="bg-[var(--color-surface)] border border-[var(--color-border)] hover:border-[var(--color-primary)] text-white font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-1.5 text-xs text-center"
        >
          <ClipboardList size={15} className="text-[var(--color-primary)]" />
          <span>Personalizează în Plan</span>
        </Link>
        <Link
          href="/calendar"
          className="bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-1.5 text-xs text-center shadow-lg shadow-[#FF4500]/25"
        >
          <Layers size={15} />
          <span>Planifică Luna în Calendar</span>
        </Link>
      </div>

      {/* Split Selection Modal */}
      {selectedDayIndex !== null && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-[var(--color-surface)] border-t sm:border border-[var(--color-border)] rounded-t-3xl sm:rounded-3xl p-5 max-h-[85vh] flex flex-col shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[var(--color-border)]">
              <div>
                <span className="text-xs uppercase tracking-wider text-[var(--color-muted)] font-bold">
                  Selectează antrenamentul
                </span>
                <h3 className="text-xl font-extrabold text-white">Program pentru {activeDayName}</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDayIndex(null)}
                className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal List */}
            <div className="overflow-y-auto py-3 space-y-2 pr-1 mt-2">
              {SPLIT_OPTIONS.map((opt) => {
                const isSelected = currentSplitForActiveDay === opt.id || currentSplitForActiveDay === opt.name
                const isRest = opt.id === 'Rest Day'

                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleSelectSplit(opt.id)}
                    className={`w-full text-left p-3.5 rounded-2xl border transition-all flex items-center justify-between active:scale-[0.99] ${
                      isSelected
                        ? 'bg-[#FF4500]/20 border-[var(--color-primary)] text-white shadow-md'
                        : 'bg-[#181818] border-[var(--color-border)] hover:border-zinc-600 text-zinc-300'
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <span className="text-2xl shrink-0">{opt.emoji}</span>
                      <div>
                        <div className="font-bold text-sm text-white flex items-center gap-2">
                          {opt.name}
                          {isRest && (
                            <span className="text-[10px] bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-full font-normal">
                              Pauză
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[var(--color-muted)] mt-0.5 line-clamp-1">
                          {opt.description}
                        </p>
                      </div>
                    </div>

                    {isSelected && (
                      <div className="w-6 h-6 rounded-full bg-[var(--color-primary)] flex items-center justify-center text-white shrink-0">
                        <Check size={14} strokeWidth={3} />
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
