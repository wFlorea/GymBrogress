'use client'

import { useState } from 'react'
import { Pencil, Plus } from 'lucide-react'
import { WeightForm } from '@/components/WeightForm'
import { Card, StatItem } from '@/components/ui/Card'
import { LineChart } from '@/components/ui/LineChart'
import { Modal } from '@/components/ui/Modal'
import { buttonStyles } from '@/components/ui/styles'
import { WEIGHT_CHART_AFTER as CHART_AFTER } from '@/lib/body'
import { formatDate } from '@/lib/date'
import { formatWeight, plural, signedWeight } from '@/lib/format'
import type { IsoDate, WeightEntry, WeightUnit } from '@/lib/types'

const shortDate = (date: IsoDate) => formatDate(date, { day: 'numeric', month: 'short' })

/**
 * The weekly weigh-ins: the latest, a chart once there are a month of them (a table before that), and a sheet to
 * check in or change this week's.
 */
export function WeightHistory({
  entries,
  thisWeek,
  currentWeight,
  unit,
}: {
  /** Oldest first. */
  entries: WeightEntry[]
  /** The Monday of this week. */
  thisWeek: IsoDate
  /** The weight in the body stats, offered for a first check-in. */
  currentWeight: number | null
  unit: WeightUnit
}) {
  const [open, setOpen] = useState(false)
  // Bumped on every open, so the form starts fresh.
  const [formKey, setFormKey] = useState(0)

  const first = entries[0]
  const latest = entries.at(-1)
  const checkedIn = latest?.week === thisWeek
  const toGo = CHART_AFTER - entries.length

  function openForm() {
    setFormKey((key) => key + 1)
    setOpen(true)
  }

  return (
    <>
      <Card>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] text-muted">
              {checkedIn ? 'This week' : latest ? `Last check-in, week of ${shortDate(latest.week)}` : 'No check-ins yet'}
            </p>
            <p className="font-display text-[2rem] font-bold leading-tight tabular-nums">
              {latest ? formatWeight(latest.weight, unit) : '–'}
            </p>
          </div>
          <button type="button" onClick={openForm} className={`${buttonStyles.chip} shrink-0 whitespace-nowrap`}>
            {checkedIn ? <Pencil size={13} /> : <Plus size={13} />} {checkedIn ? 'Edit' : 'Check in'}
          </button>
        </div>

        {toGo > 0 ? (
          <>
            <div className="mt-4 flex gap-1" aria-hidden>
              {Array.from({ length: CHART_AFTER }, (_, i) => (
                <span key={i} className={`h-1.5 flex-1 rounded-full ${i < entries.length ? 'bg-primary' : 'bg-white/10'}`} />
              ))}
            </div>
            <p className="mt-2 text-xs text-muted">
              Your chart appears after {CHART_AFTER} weekly check-ins, a month of them. {plural(toGo, 'check-in')} to go.
            </p>
            {entries.length > 0 && <WeightTable entries={entries} unit={unit} className="mt-3" />}
          </>
        ) : (
          <>
            <dl className="mt-4 grid grid-cols-2 border-t border-white/5 pt-4 text-center">
              <StatItem value={signedWeight(latest!.weight - first.weight, unit)} label={`Since ${shortDate(first.week)}`} />
              <StatItem value={entries.length} label="Check-ins" />
            </dl>
            <p className="mb-4 mt-5 text-xs text-muted">In kilograms. Tap or drag along the chart to see each week.</p>
            <LineChart
              unit={unit}
              points={entries.map((entry) => ({ date: entry.week, value: entry.weight }))}
              label={`Weight over ${plural(entries.length, 'week')}, from ${formatWeight(first.weight, unit)} to ${formatWeight(latest!.weight, unit)}`}
              fitToData
              tooltipPrefix="Week of "
            />
            <details className="mt-3 border-t border-white/5 pt-3">
              <summary className="cursor-pointer text-xs font-bold text-muted hover:text-white">Show as table</summary>
              <WeightTable entries={entries} unit={unit} className="mt-2" />
            </details>
          </>
        )}
      </Card>

      <Modal open={open} onClose={() => setOpen(false)} title="This week’s weight">
        <div className="pt-4">
          <WeightForm
            key={formKey}
            lastWeight={(checkedIn ? latest?.weight : (currentWeight ?? latest?.weight)) ?? null}
            editing={checkedIn}
            unit={unit}
            onSaved={() => setOpen(false)}
          />
        </div>
      </Modal>
    </>
  )
}

/** Every check-in, newest first, with the change from the one before. */
function WeightTable({ entries, unit, className = '' }: { entries: WeightEntry[]; unit: WeightUnit; className?: string }) {
  return (
    <table className={`w-full text-left text-xs ${className}`}>
      <thead className="text-muted">
        <tr>
          <th scope="col" className="py-1 font-bold">Week of</th>
          <th scope="col" className="py-1 text-right font-bold">Weight</th>
          <th scope="col" className="py-1 text-right font-bold">Change</th>
        </tr>
      </thead>
      <tbody className="tabular-nums">
        {entries
          .map((entry, i) => ({ ...entry, previous: entries[i - 1] }))
          .reverse()
          .map(({ week, weight, previous }) => (
            <tr key={week} className="border-t border-white/5">
              <td className="py-1.5 text-foreground/80">{formatDate(week, { day: 'numeric', month: 'short', year: 'numeric' })}</td>
              <td className="py-1.5 text-right font-bold text-white">{formatWeight(weight, unit)}</td>
              <td className="py-1.5 text-right text-muted">{previous ? signedWeight(weight - previous.weight, unit) : '–'}</td>
            </tr>
          ))}
      </tbody>
    </table>
  )
}
