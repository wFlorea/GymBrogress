'use client'

import { useState, useTransition, useMemo, useEffect } from 'react'
import {
  DAYS_OF_WEEK,
  SPLIT_OPTIONS,
  SplitType,
  WorkStatus,
  CalendarPlansMap,
  RoutineTemplatesMap,
  getExercisesForSplit,
  parseWeeklyPlan,
} from '@/lib/types'
import { saveCalendarDay, clearCalendarDay } from './actions'
import Link from 'next/link'
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Briefcase,
  Palmtree,
  Sparkles,
  Dumbbell,
  Layers,
  X,
  Check,
  RotateCcw,
  AlertCircle,
} from 'lucide-react'

type WeeklyPlanRecord = {
  id: string
  day_of_week: number
  workout_name: string
}

export function CalendarClient({
  initialCalendarPlans,
  weeklyPlans,
  routineTemplates,
}: {
  initialCalendarPlans: CalendarPlansMap
  weeklyPlans: WeeklyPlanRecord[]
  routineTemplates: RoutineTemplatesMap
}) {
  const [calendarPlans, setCalendarPlans] = useState<CalendarPlansMap>(initialCalendarPlans)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [modalWorkStatus, setModalWorkStatus] = useState<WorkStatus>('none')
  const [modalSplit, setModalSplit] = useState<SplitType | 'weekly_default'>('weekly_default')
  const [saveStatus, setSaveStatus] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  // Sync state whenever server revalidates props
  useEffect(() => {
    setCalendarPlans(initialCalendarPlans)
  }, [initialCalendarPlans])

  // Base dates: Current Month (0) vs Next Month (1)
  const [monthOffset, setMonthOffset] = useState<0 | 1>(0)

  const currentDateObj = useMemo(() => new Date(), [])
  const targetDateObj = useMemo(() => {
    const d = new Date(currentDateObj.getFullYear(), currentDateObj.getMonth() + monthOffset, 1)
    return d
  }, [currentDateObj, monthOffset])

  const targetYear = targetDateObj.getFullYear()
  const targetMonth = targetDateObj.getMonth() // 0-indexed

  // Month Title in Romanian (e.g. "Octombrie 2026")
  const monthName = targetDateObj.toLocaleDateString('ro-RO', { month: 'long' })
  const capitalizedMonth = monthName.charAt(0).toUpperCase() + monthName.slice(1)

  // Days in target month
  const totalDaysInMonth = new Date(targetYear, targetMonth + 1, 0).getDate()

  // First day of month (Monday = 0 ... Sunday = 6)
  const firstDayWeekday = (new Date(targetYear, targetMonth, 1).getDay() + 6) % 7

  // Today string YYYY-MM-DD
  const todayIso = useMemo(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  }, [])

  // Helper to get weekly default split for a weekday index (0 = Monday, 6 = Sunday)
  const getWeeklyDefaultSplit = (dayOfWeek: number): SplitType => {
    const record = weeklyPlans.find((p) => p.day_of_week === dayOfWeek)
    if (!record) return 'Rest Day'
    return parseWeeklyPlan(record.workout_name).split as SplitType
  }

  // Monthly aggregated statistics
  const monthStats = useMemo(() => {
    let workDays = 0
    let offDays = 0
    let workoutDays = 0
    let restDays = 0

    for (let day = 1; day <= totalDaysInMonth; day++) {
      const dateStr = `${targetYear}-${String(targetMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      const dayOfWeek = (new Date(targetYear, targetMonth, day).getDay() + 6) % 7
      const customPlan = calendarPlans[dateStr]

      // Work status
      if (customPlan?.workStatus === 'work') workDays++
      else if (customPlan?.workStatus === 'off') offDays++

      // Split
      const activeSplit = customPlan?.split || getWeeklyDefaultSplit(dayOfWeek)
      const isRest =
        activeSplit.toLowerCase().includes('rest') ||
        activeSplit.toLowerCase().includes('odihn') ||
        activeSplit.toLowerCase().includes('pauz')

      if (isRest) restDays++
      else workoutDays++
    }

    return { workDays, offDays, workoutDays, restDays }
  }, [calendarPlans, targetYear, targetMonth, totalDaysInMonth, weeklyPlans])

  // Open modal for a clicked date
  const handleDayClick = (dayNumber: number) => {
    const dateStr = `${targetYear}-${String(targetMonth + 1).padStart(2, '0')}-${String(dayNumber).padStart(2, '0')}`
    const existing = calendarPlans[dateStr]

    setSelectedDate(dateStr)
    setModalWorkStatus(existing?.workStatus || 'none')
    setModalSplit(existing?.split ? existing.split : 'weekly_default')
  }

  const handleSaveModal = () => {
    if (!selectedDate) return
    const splitToSave = modalSplit === 'weekly_default' ? null : modalSplit

    // Optimistic UI update
    setCalendarPlans((prev) => ({
      ...prev,
      [selectedDate]: {
        date: selectedDate,
        workStatus: modalWorkStatus,
        split: splitToSave,
      },
    }))

    const dateToSave = selectedDate
    const statusToSave = modalWorkStatus
    setSelectedDate(null)

    startTransition(async () => {
      try {
        await saveCalendarDay(dateToSave, statusToSave, splitToSave)
        setSaveStatus(`Ziua ${dateToSave} a fost salvată!`)
        setTimeout(() => setSaveStatus(null), 3000)
      } catch (err: any) {
        console.error('Eroare la salvare:', err)
        alert(err?.message || 'Eroare la salvarea zilei.')
      }
    })
  }

  const handleResetDay = () => {
    if (!selectedDate) return
    const dateToReset = selectedDate

    setCalendarPlans((prev) => {
      const next = { ...prev }
      delete next[dateToReset]
      return next
    })

    setSelectedDate(null)

    startTransition(async () => {
      try {
        await clearCalendarDay(dateToReset)
        setSaveStatus(`Ziua a fost resetată la valorile implicite.`)
        setTimeout(() => setSaveStatus(null), 3000)
      } catch (err: any) {
        console.error('Eroare la resetare:', err)
        alert(err?.message || 'Eroare la resetarea zilei.')
      }
    })
  }

  // Details for modal
  const selectedDateObj = selectedDate ? new Date(selectedDate) : null
  const selectedDayOfWeek = selectedDateObj ? (selectedDateObj.getDay() + 6) % 7 : 0
  const weeklyDefaultSplitForModal = getWeeklyDefaultSplit(selectedDayOfWeek)

  const previewSplit = modalSplit === 'weekly_default' ? weeklyDefaultSplitForModal : modalSplit
  const previewSplitConfig =
    SPLIT_OPTIONS.find((s) => s.id === previewSplit) || SPLIT_OPTIONS.find((s) => s.id === 'Rest Day')!
  const previewExercises = getExercisesForSplit(previewSplit, routineTemplates)

  return (
    <div className="space-y-6">
      {/* Toast notification */}
      {saveStatus && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-[#161d26] text-white px-4 py-2.5 rounded-2xl border border-emerald-500/50 shadow-2xl flex items-center gap-2 text-xs font-bold animate-in fade-in slide-in-from-top-2">
          <Check size={16} className="text-emerald-400" />
          <span>{saveStatus}</span>
        </div>
      )}

      {/* Top Switcher: Schedule vs Calendar */}
      <div className="grid grid-cols-2 p-1 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl">
        <Link
          href="/schedule"
          className="py-2.5 px-4 rounded-xl font-bold text-xs text-zinc-400 hover:text-white hover:bg-zinc-800/60 transition-colors flex items-center justify-center gap-1.5"
        >
          <CalendarIcon size={14} />
          <span>Săptămânal</span>
        </Link>

        <button
          type="button"
          className="py-2.5 px-4 rounded-xl font-bold text-xs bg-[var(--color-primary)] text-white shadow-md shadow-[#FF4500]/20 flex items-center justify-center gap-1.5"
        >
          <Layers size={14} />
          <span>Calendar Lună</span>
        </button>
      </div>

      {/* Month Navigator & Summary Banner */}
      <div className="bg-[var(--color-surface)] p-4 sm:p-5 rounded-3xl border border-[var(--color-border)] shadow-md space-y-4">
        {/* Month Selector Buttons */}
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-widest text-[#FF4500]">
              Planificare Lunară Flexibilă
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-white">
              {capitalizedMonth} {targetYear}
            </h2>
          </div>

          <div className="flex items-center gap-1 bg-[#161616] p-1 rounded-2xl border border-[var(--color-border)]">
            <button
              type="button"
              onClick={() => setMonthOffset(0)}
              className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all ${
                monthOffset === 0
                  ? 'bg-[var(--color-primary)] text-white shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Luna Curentă
            </button>
            <button
              type="button"
              onClick={() => setMonthOffset(1)}
              className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all ${
                monthOffset === 1
                  ? 'bg-[var(--color-primary)] text-white shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Luna Următoare
            </button>
          </div>
        </div>

        {/* Monthly Quick Stats Strip */}
        <div className="grid grid-cols-4 gap-2 pt-2 border-t border-[var(--color-border)]/60 text-center">
          <div className="bg-[#15151c] p-2 sm:p-2.5 rounded-xl border border-[var(--color-border)]/80">
            <span className="text-sm sm:text-base font-black text-blue-400 block">{monthStats.workDays}</span>
            <span className="text-[9px] uppercase font-bold text-zinc-400 block mt-0.5">La Muncă</span>
          </div>

          <div className="bg-[#15151c] p-2 sm:p-2.5 rounded-xl border border-[var(--color-border)]/80">
            <span className="text-sm sm:text-base font-black text-emerald-400 block">{monthStats.offDays}</span>
            <span className="text-[9px] uppercase font-bold text-zinc-400 block mt-0.5">Zile Libere</span>
          </div>

          <div className="bg-[#15151c] p-2 sm:p-2.5 rounded-xl border border-[var(--color-border)]/80">
            <span className="text-sm sm:text-base font-black text-[#FF4500] block">{monthStats.workoutDays}</span>
            <span className="text-[9px] uppercase font-bold text-zinc-400 block mt-0.5">Antrenamente</span>
          </div>

          <div className="bg-[#15151c] p-2 sm:p-2.5 rounded-xl border border-[var(--color-border)]/80">
            <span className="text-sm sm:text-base font-black text-amber-400 block">{monthStats.restDays}</span>
            <span className="text-[9px] uppercase font-bold text-zinc-400 block mt-0.5">Odihnă</span>
          </div>
        </div>
      </div>

      {/* Interactive Calendar Grid */}
      <div className="bg-[var(--color-surface)] p-3 sm:p-5 rounded-3xl border border-[var(--color-border)] shadow-xl">
        {/* Days of week header */}
        <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2 text-center">
          {['Lun', 'Mar', 'Mie', 'Joi', 'Vin', 'Sâm', 'Dum'].map((day) => (
            <div key={day} className="text-[11px] font-black text-[var(--color-muted)] uppercase py-1">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Cells */}
        <div className="grid grid-cols-7 gap-1 sm:gap-2">
          {/* Empty cells before 1st of month */}
          {Array.from({ length: firstDayWeekday }).map((_, i) => (
            <div key={`empty-${i}`} className="min-h-[64px] sm:min-h-[82px] rounded-xl bg-transparent" />
          ))}

          {/* Month days 1..totalDaysInMonth */}
          {Array.from({ length: totalDaysInMonth }).map((_, i) => {
            const dayNum = i + 1
            const dateStr = `${targetYear}-${String(targetMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`
            const dayOfWeek = (new Date(targetYear, targetMonth, dayNum).getDay() + 6) % 7
            const isToday = dateStr === todayIso
            const customPlan = calendarPlans[dateStr]

            const workStatus = customPlan?.workStatus || 'none'
            const activeSplit = customPlan?.split || getWeeklyDefaultSplit(dayOfWeek)
            const splitConfig =
              SPLIT_OPTIONS.find((s) => s.id === activeSplit) || SPLIT_OPTIONS.find((s) => s.id === 'Rest Day')!
            const isRest = splitConfig.id === 'Rest Day'
            const isCustomSplit = !!customPlan?.split

            return (
              <button
                key={dateStr}
                type="button"
                onClick={() => handleDayClick(dayNum)}
                className={`min-h-[66px] sm:min-h-[84px] p-1.5 sm:p-2 rounded-xl sm:rounded-2xl border text-left flex flex-col justify-between transition-all relative overflow-hidden active:scale-95 ${
                  isToday
                    ? 'border-[#FF4500] bg-[#FF4500]/10 shadow-md shadow-[#FF4500]/20'
                    : isCustomSplit
                    ? 'border-[#FF4500]/70 bg-[#171720]'
                    : workStatus !== 'none'
                    ? 'border-blue-500/50 bg-[#131722]'
                    : 'border-[var(--color-border)]/70 bg-[#121216] hover:border-zinc-500'
                }`}
              >
                {/* Day Header (Number + Work status icon) */}
                <div className="flex items-center justify-between w-full">
                  <span
                    className={`text-xs font-black rounded-full w-5 h-5 flex items-center justify-center ${
                      isToday
                        ? 'bg-[#FF4500] text-white font-black'
                        : 'text-zinc-200'
                    }`}
                  >
                    {dayNum}
                  </span>

                  {workStatus === 'work' && (
                    <span className="text-[10px] text-blue-400" title="La Muncă">
                      💼
                    </span>
                  )}
                  {workStatus === 'off' && (
                    <span className="text-[10px] text-emerald-400" title="Zi Liberă">
                      🏖️
                    </span>
                  )}
                </div>

                {/* Workout Split Badge */}
                <div className="mt-1">
                  <div
                    className={`text-[9px] sm:text-[10px] font-bold rounded-lg px-1 sm:px-1.5 py-0.5 truncate flex items-center gap-0.5 ${
                      isRest
                        ? 'bg-zinc-800/80 text-zinc-400'
                        : isCustomSplit
                        ? 'bg-[#FF4500]/25 text-[#FF4500] font-black border border-[#FF4500]/40'
                        : 'bg-zinc-800 text-zinc-300'
                    }`}
                  >
                    <span className="shrink-0">{splitConfig.emoji}</span>
                    <span className="truncate">{splitConfig.id}</span>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Quick Legend */}
      <div className="p-3.5 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] text-xs text-zinc-400 flex flex-wrap items-center justify-between gap-2">
        <span className="font-bold text-zinc-300">Legendă:</span>
        <div className="flex items-center gap-3 text-[11px]">
          <span className="flex items-center gap-1">
            <span>💼</span> Muncă
          </span>
          <span className="flex items-center gap-1">
            <span>🏖️</span> Liber
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-[#FF4500]" /> Personalizat
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-zinc-600" /> Săptămânal
          </span>
        </div>
      </div>

      {/* Date Configuration Modal */}
      {selectedDate && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-[var(--color-surface)] border-t sm:border border-[var(--color-border)] rounded-t-3xl sm:rounded-3xl p-5 max-h-[88vh] flex flex-col shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[var(--color-border)]">
              <div>
                <span className="text-xs uppercase tracking-wider text-[var(--color-muted)] font-bold">
                  {DAYS_OF_WEEK[selectedDayOfWeek]}
                </span>
                <h3 className="text-xl font-extrabold text-white">
                  {selectedDateObj?.toLocaleDateString('ro-RO', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDate(null)}
                className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="overflow-y-auto py-4 space-y-5 flex-1 pr-1">
              {/* Section 1: Work Shift Status */}
              <div>
                <label className="text-xs font-black uppercase tracking-wider text-zinc-400 block mb-2">
                  1. Program Muncă / Serviciu
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setModalWorkStatus('work')}
                    className={`py-3 px-3 rounded-xl border font-bold text-xs flex flex-col items-center justify-center gap-1.5 transition-all ${
                      modalWorkStatus === 'work'
                        ? 'bg-blue-950/60 border-blue-500 text-blue-300 shadow-md ring-1 ring-blue-500'
                        : 'bg-[#181818] border-[var(--color-border)] text-zinc-400 hover:text-white'
                    }`}
                  >
                    <span className="text-lg">💼</span>
                    <span>La Muncă</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setModalWorkStatus('off')}
                    className={`py-3 px-3 rounded-xl border font-bold text-xs flex flex-col items-center justify-center gap-1.5 transition-all ${
                      modalWorkStatus === 'off'
                        ? 'bg-emerald-950/60 border-emerald-500 text-emerald-300 shadow-md ring-1 ring-emerald-500'
                        : 'bg-[#181818] border-[var(--color-border)] text-zinc-400 hover:text-white'
                    }`}
                  >
                    <span className="text-lg">🏖️</span>
                    <span>Zi Liberă</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setModalWorkStatus('none')}
                    className={`py-3 px-3 rounded-xl border font-bold text-xs flex flex-col items-center justify-center gap-1.5 transition-all ${
                      modalWorkStatus === 'none'
                        ? 'bg-zinc-800 border-zinc-500 text-white shadow-md ring-1 ring-zinc-400'
                        : 'bg-[#181818] border-[var(--color-border)] text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    <span className="text-lg">⚪</span>
                    <span>Nespecificat</span>
                  </button>
                </div>
              </div>

              {/* Section 2: Workout Selection */}
              <div>
                <label className="text-xs font-black uppercase tracking-wider text-zinc-400 block mb-2">
                  2. Antrenament Planificat
                </label>

                {/* Default weekly option */}
                <button
                  type="button"
                  onClick={() => setModalSplit('weekly_default')}
                  className={`w-full p-3 rounded-xl border text-left flex items-center justify-between mb-2 transition-all ${
                    modalSplit === 'weekly_default'
                      ? 'bg-[#FF4500]/20 border-[var(--color-primary)] text-white ring-1 ring-[#FF4500]'
                      : 'bg-[#161616] border-[var(--color-border)] text-zinc-400 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-xl">🗓️</span>
                    <div>
                      <div className="text-xs font-bold text-white flex items-center gap-1.5">
                        <span>Program Săptămânal Implicit</span>
                        <span className="text-[10px] text-[#FF4500] font-bold">({weeklyDefaultSplitForModal})</span>
                      </div>
                      <span className="text-[11px] text-[var(--color-muted)]">
                        Preia automat ce ai setat în Schedule pentru {DAYS_OF_WEEK[selectedDayOfWeek]}
                      </span>
                    </div>
                  </div>

                  {modalSplit === 'weekly_default' && (
                    <div className="w-5 h-5 rounded-full bg-[var(--color-primary)] flex items-center justify-center text-white shrink-0">
                      <Check size={12} strokeWidth={3} />
                    </div>
                  )}
                </button>

                {/* Custom Split Grid */}
                <div className="grid grid-cols-2 gap-2 mt-2 max-h-56 overflow-y-auto pr-1">
                  {SPLIT_OPTIONS.map((opt) => {
                    const isSelected = modalSplit === opt.id

                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setModalSplit(opt.id)}
                        className={`p-2.5 rounded-xl border text-left flex items-center justify-between transition-all ${
                          isSelected
                            ? 'bg-[#FF4500]/25 border-[var(--color-primary)] text-white shadow-sm ring-1 ring-[#FF4500]'
                            : 'bg-[#161616] border-[var(--color-border)] text-zinc-300 hover:border-zinc-500'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <span className="text-base">{opt.emoji}</span>
                          <span className="text-xs font-bold truncate">{opt.name}</span>
                        </div>
                        {isSelected && <Check size={14} className="text-[#FF4500] shrink-0" strokeWidth={3} />}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Section 3: Exercise Preview */}
              <div className="p-3.5 rounded-2xl bg-[#141418] border border-[var(--color-border)]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-black uppercase text-zinc-300 flex items-center gap-1.5">
                    <Dumbbell size={14} className="text-[#FF4500]" />
                    <span>Exerciții în {previewSplitConfig.name}</span>
                  </span>
                  <span className="text-[10px] text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded-full">
                    {previewExercises.length} exerciții
                  </span>
                </div>

                {previewExercises.length === 0 ? (
                  <p className="text-xs text-[var(--color-muted)] italic">
                    {previewSplitConfig.id === 'Rest Day'
                      ? '🧘 Odihnă și recuperare musculară.'
                      : 'Nu sunt exerciții în această rutină.'}
                  </p>
                ) : (
                  <div className="space-y-1 mt-2">
                    {previewExercises.slice(0, 4).map((ex, idx) => (
                      <div key={ex.id + '-' + idx} className="text-xs text-zinc-300 flex items-center gap-2">
                        <span className="text-[#FF4500] font-bold text-[10px]">✦</span>
                        <span className="truncate">{ex.name}</span>
                      </div>
                    ))}
                    {previewExercises.length > 4 && (
                      <span className="text-[10px] text-zinc-500 font-bold block pt-1">
                        + încă {previewExercises.length - 4} exerciții din Plan
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="pt-3 border-t border-[var(--color-border)] flex items-center gap-2">
              <button
                type="button"
                onClick={handleResetDay}
                disabled={isPending}
                className="py-3 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-xs flex items-center gap-1.5 transition-colors disabled:opacity-50"
                title="Resetează la setările implicite"
              >
                <RotateCcw size={14} />
                <span>Resetează</span>
              </button>

              <button
                type="button"
                onClick={handleSaveModal}
                disabled={isPending}
                className="flex-1 py-3 bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-[#FF4500]/25 active:scale-[0.98] disabled:opacity-50"
              >
                {isPending ? 'Se salvează...' : 'Salvează Ziua'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
