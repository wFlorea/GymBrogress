'use client'

import { useState, useMemo } from 'react'
import {
  DAYS_OF_WEEK,
  SPLIT_OPTIONS,
  SplitType,
  WorkStatus,
  CalendarPlansMap,
  RoutineTemplatesMap,
  getExercisesForSplit,
} from '@/lib/types'
import Link from 'next/link'
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Layers,
  ArrowRight,
  Lock,
  Sparkles,
  Dumbbell,
  Coffee,
} from 'lucide-react'

export function ScheduleClient({
  calendarPlans,
  routineTemplates,
}: {
  calendarPlans: CalendarPlansMap
  routineTemplates: RoutineTemplatesMap
}) {
  // Week navigation offset (0 = current week, -1 = last week, +1 = next week)
  const [weekOffset, setWeekOffset] = useState<number>(0)

  // Current date
  const now = useMemo(() => new Date(), [])
  const todayIso = useMemo(() => {
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  }, [now])

  // Compute Monday of the displayed week
  const mondayOfWeek = useMemo(() => {
    const currentDay = (now.getDay() + 6) % 7 // Monday = 0
    const m = new Date(now)
    m.setDate(now.getDate() - currentDay + weekOffset * 7)
    return m
  }, [now, weekOffset])

  // Generate the 7 days of this week (Monday to Sunday)
  const weekDays = useMemo(() => {
    const days = []
    for (let i = 0; i < 7; i++) {
      const d = new Date(mondayOfWeek)
      d.setDate(mondayOfWeek.getDate() + i)
      const dateIso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

      const dayName = DAYS_OF_WEEK[i]
      const formattedDate = d.toLocaleDateString('ro-RO', { day: 'numeric', month: 'short' })
      const isToday = dateIso === todayIso

      // Lookup in calendar plans
      const plan = calendarPlans[dateIso]
      const workStatus: WorkStatus = plan?.workStatus || 'none'
      const split: SplitType = plan?.split || 'Rest Day'

      const splitConfig =
        SPLIT_OPTIONS.find((s) => s.id === split) || SPLIT_OPTIONS.find((s) => s.id === 'Rest Day')!
      const isRest = splitConfig.id === 'Rest Day'
      const exercises = getExercisesForSplit(split, routineTemplates)

      days.push({
        dayName,
        dateIso,
        formattedDate,
        isToday,
        workStatus,
        split,
        splitConfig,
        isRest,
        hasCustomPlan: !!plan,
        exercises,
      })
    }
    return days
  }, [mondayOfWeek, todayIso, calendarPlans, routineTemplates])

  // Week range label (e.g. "19 Oct - 25 Oct 2026")
  const weekRangeLabel = useMemo(() => {
    const sunday = new Date(mondayOfWeek)
    sunday.setDate(mondayOfWeek.getDate() + 6)

    const startStr = mondayOfWeek.toLocaleDateString('ro-RO', { day: 'numeric', month: 'short' })
    const endStr = sunday.toLocaleDateString('ro-RO', { day: 'numeric', month: 'short', year: 'numeric' })
    return `${startStr} – ${endStr}`
  }, [mondayOfWeek])

  // Quick stats for this week
  const weekStats = useMemo(() => {
    let work = 0
    let off = 0
    let workouts = 0
    let rest = 0

    weekDays.forEach((d) => {
      if (d.workStatus === 'work') work++
      else if (d.workStatus === 'off') off++

      if (d.isRest) rest++
      else workouts++
    })

    return { work, off, workouts, rest }
  }, [weekDays])

  return (
    <div className="space-y-6">
      {/* Top Switcher: Schedule vs Calendar */}
      <div className="grid grid-cols-2 p-1 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl">
        <button
          type="button"
          className="py-2.5 px-4 rounded-xl font-bold text-xs bg-[var(--color-primary)] text-white shadow-md shadow-[#FF4500]/20 flex items-center justify-center gap-1.5"
        >
          <CalendarIcon size={14} />
          <span>Săptămânal</span>
        </button>

        <Link
          href="/calendar"
          className="py-2.5 px-4 rounded-xl font-bold text-xs text-zinc-400 hover:text-white hover:bg-zinc-800/60 transition-colors flex items-center justify-center gap-1.5"
        >
          <Layers size={14} />
          <span>Calendar Lună</span>
          <span className="text-[9px] bg-emerald-500/20 text-emerald-400 font-extrabold px-1.5 py-0.5 rounded-full border border-emerald-500/30">
            EDITABIL
          </span>
        </Link>
      </div>

      {/* Info Notice Banner */}
      <div className="bg-[var(--color-surface)] p-4 sm:p-5 rounded-3xl border border-[var(--color-border)] shadow-md space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/15 flex items-center justify-center text-blue-400 shrink-0 mt-0.5">
              <Lock size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-sm text-white">Program Săptămânal (Vizualizare)</h2>
                <span className="text-[10px] bg-zinc-800 text-zinc-400 font-bold px-2 py-0.5 rounded-full">
                  Read-Only
                </span>
              </div>
              <p className="text-xs text-[var(--color-muted)] mt-1 leading-relaxed">
                Zilele de mai jos sunt preluate direct din <strong>Calendar</strong>. Pentru a schimba tura de muncă sau antrenamentul, modifică direct din calendar.
              </p>
            </div>
          </div>
        </div>

        <Link
          href="/calendar"
          className="w-full py-3 bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2 shadow-md shadow-[#FF4500]/20"
        >
          <Layers size={15} />
          <span>Deschide Calendarul pentru Modificări</span>
          <ArrowRight size={15} />
        </Link>
      </div>

      {/* Week Navigator */}
      <div className="flex items-center justify-between p-3 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)]">
        <button
          type="button"
          onClick={() => setWeekOffset(weekOffset - 1)}
          className="p-2 rounded-xl bg-zinc-800 text-zinc-300 hover:text-white transition-colors"
          title="Săptămâna anterioară"
        >
          <ChevronLeft size={18} />
        </button>

        <div className="text-center">
          <span className="text-[10px] uppercase font-bold text-[var(--color-muted)] tracking-wider block">
            {weekOffset === 0 ? 'Săptămâna Curentă' : weekOffset === 1 ? 'Săptămâna Viitoare' : 'Săptămână'}
          </span>
          <span className="text-sm font-extrabold text-white">{weekRangeLabel}</span>
        </div>

        <button
          type="button"
          onClick={() => setWeekOffset(weekOffset + 1)}
          className="p-2 rounded-xl bg-zinc-800 text-zinc-300 hover:text-white transition-colors"
          title="Săptămâna viitoare"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Weekly Stats */}
      <div className="grid grid-cols-4 gap-2 text-center">
        <div className="bg-[#15151c] p-2.5 rounded-xl border border-[var(--color-border)]">
          <span className="text-sm font-black text-blue-400 block">{weekStats.work}</span>
          <span className="text-[9px] uppercase font-bold text-zinc-400 block mt-0.5">La Muncă</span>
        </div>
        <div className="bg-[#15151c] p-2.5 rounded-xl border border-[var(--color-border)]">
          <span className="text-sm font-black text-emerald-400 block">{weekStats.off}</span>
          <span className="text-[9px] uppercase font-bold text-zinc-400 block mt-0.5">Zile Libere</span>
        </div>
        <div className="bg-[#15151c] p-2.5 rounded-xl border border-[var(--color-border)]">
          <span className="text-sm font-black text-[#FF4500] block">{weekStats.workouts}</span>
          <span className="text-[9px] uppercase font-bold text-zinc-400 block mt-0.5">Antrenamente</span>
        </div>
        <div className="bg-[#15151c] p-2.5 rounded-xl border border-[var(--color-border)]">
          <span className="text-sm font-black text-amber-400 block">{weekStats.rest}</span>
          <span className="text-[9px] uppercase font-bold text-zinc-400 block mt-0.5">Odihnă</span>
        </div>
      </div>

      {/* 7 Days Read-Only List */}
      <div className="space-y-2.5">
        {weekDays.map((day) => {
          return (
            <Link
              key={day.dateIso}
              href="/calendar"
              className={`p-4 rounded-2xl border transition-all block relative overflow-hidden group ${
                day.isToday
                  ? 'border-[#FF4500] bg-[#FF4500]/10 shadow-md shadow-[#FF4500]/15'
                  : day.isRest
                  ? 'bg-[var(--color-surface)]/70 border-[var(--color-border)] hover:border-zinc-500'
                  : 'bg-[var(--color-surface)] border-[#FF4500]/30 hover:border-[var(--color-primary)]'
              }`}
            >
              <div className="flex items-center justify-between">
                {/* Left: Day & Date & Split Info */}
                <div className="flex items-center gap-3.5">
                  <div
                    className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0 ${
                      day.isRest
                        ? 'bg-zinc-800/80 text-zinc-400'
                        : 'bg-[#FF4500]/20 text-white shadow-inner'
                    }`}
                  >
                    {day.splitConfig.emoji}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-base text-white">{day.dayName}</span>
                      <span className="text-xs text-[var(--color-muted)] font-semibold">
                        ({day.formattedDate})
                      </span>
                      {day.isToday && (
                        <span className="text-[9px] bg-[#FF4500] text-white font-black px-2 py-0.5 rounded-full uppercase">
                          Azi
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 mt-1">
                      {/* Work Badge */}
                      {day.workStatus === 'work' && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-950/70 text-blue-300 border border-blue-800/50 flex items-center gap-1">
                          <span>💼</span> La Muncă
                        </span>
                      )}
                      {day.workStatus === 'off' && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-950/70 text-emerald-300 border border-emerald-800/50 flex items-center gap-1">
                          <span>🏖️</span> Zi Liberă
                        </span>
                      )}

                      {/* Workout exercises count */}
                      {!day.isRest && day.exercises.length > 0 && (
                        <span className="text-[10px] text-zinc-400 bg-zinc-800/90 px-2 py-0.5 rounded-md">
                          {day.exercises.length} exerciții
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Split Badge & Arrow */}
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs font-bold px-3 py-1.5 rounded-full border ${
                      day.isRest
                        ? 'bg-zinc-800 text-zinc-400 border-zinc-700'
                        : 'bg-[#FF4500]/15 text-[var(--color-primary)] border-[#FF4500]/30'
                    }`}
                  >
                    {day.splitConfig.name}
                  </span>
                  <ChevronRight
                    size={18}
                    className="text-[var(--color-muted)] group-hover:text-white group-hover:translate-x-0.5 transition-all"
                  />
                </div>
              </div>
            </Link>
          )
        })}
      </div>

      {/* Footer Action */}
      <div className="pt-2">
        <Link
          href="/calendar"
          className="w-full bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white font-bold py-4 rounded-2xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#FF4500]/25 text-sm"
        >
          <Layers size={17} />
          <span>Modifică zilele în Calendar</span>
          <ArrowRight size={17} />
        </Link>
      </div>
    </div>
  )
}
