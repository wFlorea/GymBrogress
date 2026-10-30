import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { LineChart } from '@/components/ui/LineChart'
import { Meter } from '@/components/ui/Meter'
import { buttonStyles } from '@/components/ui/styles'
import { goalProgress, goalWeightText } from '@/lib/body'
import { formatDate } from '@/lib/date'
import { formatKg, plural, signedKg } from '@/lib/format'
import type { WeightEntry } from '@/lib/types'

/** The weekly weigh-ins as a chart with the goal weight as a line, and how much of the way there the user is. */
export function WeightTrend({ entries, goal }: { entries: WeightEntry[]; goal: number | null }) {
  const start = entries[0]
  const latest = entries.at(-1)!
  const change = `${signedKg(latest.weight - start.weight)} since ${formatDate(start.week, { day: 'numeric', month: 'short' })}`
  const progress = goal === null ? null : goalProgress(start.weight, latest.weight, goal)
  const percent = progress === null ? 0 : Math.round(progress * 100)

  return (
    <Card className="mb-3">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-semibold">Weight trend</h2>
          <p className="text-xs text-muted">{goal === null ? change : `${goalWeightText(latest.weight, goal)}, ${change}`}</p>
        </div>
        <Link href="/profile" className={`${buttonStyles.chip} shrink-0 whitespace-nowrap`}>
          History <ChevronRight size={13} />
        </Link>
      </div>
      <LineChart
        points={entries.map((entry) => ({ date: entry.week, value: entry.weight }))}
        label={`Weight over ${plural(entries.length, 'week')}, from ${formatKg(start.weight)} to ${formatKg(latest.weight)}${
          goal === null ? '' : `, with a goal of ${formatKg(goal)}`
        }`}
        fitToData
        tooltipPrefix="Week of "
        goal={goal}
        height={200}
      />
      {goal === null ? (
        <p className="mt-3 text-xs text-muted">Set a goal weight below to see how close you are.</p>
      ) : (
        progress !== null && (
          <div className="mt-4 border-t border-white/5 pt-4">
            <Meter
              value={percent}
              max={100}
              label="Way to your goal weight"
              valueText={`${percent}% of the way from ${formatKg(start.weight)} to ${formatKg(goal)}`}
            />
            <p className="mt-2 flex justify-between gap-3 text-xs text-muted">
              <span>Started at {formatKg(start.weight)}</span>
              <span className="font-bold text-white">{percent}% of the way</span>
            </p>
          </div>
        )
      )}
    </Card>
  )
}
