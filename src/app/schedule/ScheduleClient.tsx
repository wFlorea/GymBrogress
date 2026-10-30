'use client'

import { useOptimistic, useState, useTransition, type ReactNode } from 'react'
import { Check, ChevronDown, ChevronLeft, ChevronRight, Loader2, Lock, RotateCcw } from 'lucide-react'
import { Alert } from '@/components/ui/Card'
import { DAYS_OF_WEEK, addDays, formatDate } from '@/lib/date'
import { plural } from '@/lib/format'
import { PLANNING_WEEKS, planningWindow, splitForDate } from '@/lib/schedule'
import { REST_DAY, SPLIT_OPTIONS, getSplitOption } from '@/lib/splits'
import type { ActionResult, DatePlans, IsoDate, SplitType, WeeklyPlan } from '@/lib/types'
import { resetScheduleDay, saveScheduleDay, saveWeeklyDefault } from './actions'

const WEEK_LABELS = ['This week', 'Next week', 'In 2 weeks', 'In 3 weeks']

type Mode = 'dates' | 'week'

export function ScheduleClient({
  today,
  weeklyPlan,
  datePlans,
  exerciseCounts,
}: {
  today: IsoDate
  weeklyPlan: WeeklyPlan
  datePlans: DatePlans
  exerciseCounts: Record<SplitType, number>
}) {
  const [mode, setMode] = useState<Mode>('dates')
  const [weekOffset, setWeekOffset] = useState(0)
  const [openKey, setOpenKey] = useState<string | null>(null)
  const [savingKey, setSavingKey] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const [plans, setOptimisticPlan] = useOptimistic(
    datePlans,
    (state, { date, split }: { date: IsoDate; split: SplitType | null }) => {
      const next = { ...state }
      if (split) next[date] = split
      else delete next[date]
      return next
    }
  )
  const [week, setOptimisticWeekday] = useOptimistic(
    weeklyPlan,
    (state, { day, split }: { day: number; split: SplitType }) => state.map((s, i) => (i === day ? split : s))
  )

  function save(key: string, applyOptimistic: () => void, action: () => Promise<ActionResult<unknown>>) {
    setOpenKey(null)
    setError(null)
    setSavingKey(key)
    startTransition(async () => {
      applyOptimistic()
      const result = await action()
      if (!result.ok) setError(result.error)
    })
  }

  const describe = (split: SplitType) =>
    split === REST_DAY ? 'Rest' : `${getSplitOption(split).name} · ${plural(exerciseCounts[split], 'exercise')}`

  const { weekStart } = planningWindow(today)
  const shownWeekStart = addDays(weekStart, weekOffset * 7)
  const weekDates = Array.from({ length: 7 }, (_, i) => addDays(shownWeekStart, i))
  const workoutCount = weekDates.filter((date) => splitForDate(date, plans, week) !== REST_DAY).length

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-1 rounded-2xl border border-border bg-surface p-1" role="tablist">
        {(
          [
            ['dates', 'Dates'],
            ['week', 'Repeating week'],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={mode === value}
            onClick={() => {
              setMode(value)
              setOpenKey(null)
            }}
            className={`rounded-xl py-2 text-xs font-bold transition-colors ${
              mode === value ? 'bg-primary text-white' : 'text-foreground/60 hover:text-white'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {error && <Alert>{error}</Alert>}

      {mode === 'dates' ? (
        <>
          <div className="flex items-center justify-between rounded-2xl border border-border bg-surface p-3">
            <WeekButton direction="previous" hidden={weekOffset === 0} onClick={() => setWeekOffset((w) => w - 1)} />
            <div className="text-center">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-muted">{WEEK_LABELS[weekOffset]}</span>
              <span className="text-sm font-extrabold text-white">
                {formatDate(weekDates[0], { day: 'numeric', month: 'short' })} –{' '}
                {formatDate(weekDates[6], { day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
            </div>
            <WeekButton
              direction="next"
              hidden={weekOffset === PLANNING_WEEKS - 1}
              onClick={() => setWeekOffset((w) => w + 1)}
            />
          </div>

          <div className="flex items-center justify-between px-1 text-xs font-bold">
            <span className="uppercase tracking-wider text-muted">
              Week {weekOffset + 1} of {PLANNING_WEEKS}
            </span>
            <span className="text-primary">{plural(workoutCount, 'workout')}</span>
          </div>

          <ul className="space-y-2.5">
            {weekDates.map((date, day) => {
              const split = splitForDate(date, plans, week)
              const isCustom = plans[date] !== undefined && plans[date] !== week[day]
              return (
                <DayRow
                  key={date}
                  split={split}
                  title={DAYS_OF_WEEK[day]}
                  detail={formatDate(date, { day: 'numeric', month: 'short' })}
                  description={describe(split)}
                  isToday={date === today}
                  isPast={date < today}
                  isCustom={isCustom}
                  isOpen={openKey === date}
                  isSaving={isPending && savingKey === date}
                  onToggle={() => setOpenKey(openKey === date ? null : date)}
                >
                  <SplitPicker
                    selected={split}
                    onSelect={(next) =>
                      next === split
                        ? setOpenKey(null)
                        : save(date, () => setOptimisticPlan({ date, split: next }), () => saveScheduleDay(date, next))
                    }
                  />
                  {isCustom && (
                    <button
                      type="button"
                      onClick={() =>
                        save(date, () => setOptimisticPlan({ date, split: null }), () => resetScheduleDay(date))
                      }
                      className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-foreground/15 py-2.5 text-xs font-bold text-foreground/60 transition-colors hover:text-white"
                    >
                      <RotateCcw size={13} /> Reset to weekly default ({getSplitOption(week[day]).name})
                    </button>
                  )}
                </DayRow>
              )
            })}
          </ul>
        </>
      ) : (
        <>
          <p className="px-1 text-xs text-muted">
            Your default week. Any date without its own plan uses the workout set here.
          </p>
          <ul className="space-y-2.5">
            {week.map((split, day) => {
              const key = `weekday-${day}`
              return (
                <DayRow
                  key={key}
                  split={split}
                  title={DAYS_OF_WEEK[day]}
                  description={describe(split)}
                  isOpen={openKey === key}
                  isSaving={isPending && savingKey === key}
                  onToggle={() => setOpenKey(openKey === key ? null : key)}
                >
                  <SplitPicker
                    selected={split}
                    onSelect={(next) =>
                      next === split
                        ? setOpenKey(null)
                        : save(key, () => setOptimisticWeekday({ day, split: next }), () => saveWeeklyDefault(day, next))
                    }
                  />
                </DayRow>
              )
            })}
          </ul>
        </>
      )}
    </div>
  )
}

function WeekButton({ direction, hidden, onClick }: { direction: 'previous' | 'next'; hidden: boolean; onClick: () => void }) {
  if (hidden) return <span className="w-[34px]" />
  const Icon = direction === 'previous' ? ChevronLeft : ChevronRight
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`${direction === 'previous' ? 'Previous' : 'Next'} week`}
      className="rounded-xl bg-surface p-2 text-foreground/80 transition-colors hover:text-white"
    >
      <Icon size={18} />
    </button>
  )
}

function DayRow({
  split,
  title,
  detail,
  description,
  isToday = false,
  isPast = false,
  isCustom = false,
  isOpen,
  isSaving,
  onToggle,
  children,
}: {
  split: SplitType
  title: string
  detail?: string
  description: string
  isToday?: boolean
  isPast?: boolean
  isCustom?: boolean
  isOpen: boolean
  isSaving: boolean
  onToggle: () => void
  children: ReactNode
}) {
  const isRest = split === REST_DAY
  return (
    <li
      className={`overflow-hidden rounded-2xl border transition-all ${
        isPast
          ? 'border-border bg-surface/50 opacity-50'
          : isToday
            ? 'border-primary bg-primary/10'
            : isRest
              ? 'border-border bg-surface/70'
              : 'border-primary/30 bg-surface'
      }`}
    >
      <button
        type="button"
        disabled={isPast}
        onClick={onToggle}
        aria-expanded={isOpen}
        className="flex w-full items-center justify-between gap-3 p-4 text-left disabled:cursor-not-allowed"
      >
        <div className="flex min-w-0 items-center gap-3.5">
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xl ${
              isRest ? 'bg-surface/80' : 'bg-primary/20'
            }`}
            aria-hidden
          >
            {getSplitOption(split).emoji}
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className="text-base font-extrabold text-white">{title}</span>
              {detail && <span className="text-xs font-semibold text-muted">{detail}</span>}
              {isToday && (
                <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-black uppercase text-white">Today</span>
              )}
              {isCustom && (
                <span className="rounded-full border border-foreground/25 px-2 py-0.5 text-[10px] font-bold uppercase text-foreground/80">
                  Custom
                </span>
              )}
            </div>
            <span className="text-xs text-muted">{description}</span>
          </div>
        </div>

        {isPast ? (
          <Lock size={16} className="shrink-0 text-muted" aria-label="Past day" />
        ) : isSaving ? (
          <Loader2 size={18} className="shrink-0 animate-spin text-primary" aria-label="Saving" />
        ) : (
          <ChevronDown size={18} className={`shrink-0 text-muted transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        )}
      </button>

      {isOpen && <div className="px-3 pb-3">{children}</div>}
    </li>
  )
}

function SplitPicker({ selected, onSelect }: { selected: SplitType; onSelect: (split: SplitType) => void }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {SPLIT_OPTIONS.map((option) => {
        const isSelected = option.id === selected
        return (
          <button
            key={option.id}
            type="button"
            onClick={() => onSelect(option.id)}
            aria-pressed={isSelected}
            className={`flex items-center gap-2 rounded-xl border p-2.5 text-xs font-bold transition-colors ${
              isSelected
                ? 'border-primary bg-primary/15 text-white'
                : 'border-border bg-sunken/60 text-foreground/80 hover:border-foreground/35'
            }`}
          >
            <span className="text-base" aria-hidden>
              {option.emoji}
            </span>
            <span className="flex-1 text-left">{option.name}</span>
            {isSelected && <Check size={14} className="text-primary" />}
          </button>
        )
      })}
    </div>
  )
}
