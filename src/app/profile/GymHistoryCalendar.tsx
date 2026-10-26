'use client'

import { useState, type ReactNode } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cardStyles } from '@/components/ui/Card'
import { addDays, addMonths, dayOfWeek, daysInMonth, firstOfMonth, formatDate, monthOf } from '@/lib/date'
import { plural } from '@/lib/format'
import type { IsoDate } from '@/lib/types'

const WEEKDAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

/** Read-only month view: days with at least one completed set are highlighted. */
export function GymHistoryCalendar({ today, gymDates }: { today: IsoDate; gymDates: IsoDate[] }) {
  const [monthOffset, setMonthOffset] = useState(0)
  const attended = new Set(gymDates)

  const monthStart = addMonths(today, monthOffset)
  const leadingBlanks = dayOfWeek(monthStart)
  const dates = Array.from({ length: daysInMonth(monthStart) }, (_, i) => addDays(monthStart, i))
  const monthCount = dates.filter((date) => attended.has(date)).length
  const isCurrentMonth = monthStart === firstOfMonth(today)
  const firstLoggedMonth = gymDates.length > 0 ? monthOf([...gymDates].sort()[0]) : monthOf(today)

  return (
    <div className={`${cardStyles} p-4`}>
      <div className="mb-4 flex items-center justify-between">
        <MonthButton
          label="Previous month"
          disabled={monthOf(monthStart) <= firstLoggedMonth}
          onClick={() => setMonthOffset((m) => m - 1)}
        >
          <ChevronLeft size={18} />
        </MonthButton>
        <div className="text-center" aria-live="polite">
          <span className="block font-bold">{formatDate(monthStart, { month: 'long', year: 'numeric' })}</span>
          <span className="text-xs text-muted">{plural(monthCount, 'gym day')}</span>
        </div>
        <MonthButton label="Next month" disabled={isCurrentMonth} onClick={() => setMonthOffset((m) => m + 1)}>
          <ChevronRight size={18} />
        </MonthButton>
      </div>

      <div className="grid grid-cols-7 gap-1.5 text-center">
        {WEEKDAY_LABELS.map((label, i) => (
          <span key={i} className="pb-1 text-[10px] font-bold text-muted" aria-hidden>
            {label}
          </span>
        ))}

        {Array.from({ length: leadingBlanks }, (_, i) => (
          <span key={`blank-${i}`} />
        ))}

        {dates.map((date) => {
          const wentToGym = attended.has(date)
          return (
            <span
              key={date}
              aria-label={`${formatDate(date, { day: 'numeric', month: 'long' })}${wentToGym ? ', trained' : ''}`}
              className={`flex aspect-square items-center justify-center rounded-full text-xs font-semibold ${
                wentToGym
                  ? 'bg-primary text-white shadow-[0_0_12px_-3px_var(--color-primary)]'
                  : date > today
                    ? 'text-white/20'
                    : 'bg-white/5 text-zinc-400'
              } ${date === today ? 'ring-2 ring-white/70' : ''}`}
            >
              {Number(date.slice(8))}
            </span>
          )
        })}
      </div>

      <div className="mt-4 flex items-center justify-center gap-4 text-[10px] text-muted">
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-full bg-primary" /> Trained
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-full bg-white/5" /> No workout
        </span>
      </div>
    </div>
  )
}

function MonthButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string
  disabled: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="rounded-full p-1.5 text-zinc-400 transition-colors hover:bg-white/5 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent"
    >
      {children}
    </button>
  )
}
