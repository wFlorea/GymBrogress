import type { ReactNode } from 'react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronLeft, TrendingUp } from 'lucide-react'
import { Card, EmptyState } from '@/components/ui/Card'
import { Page, PageHeader } from '@/components/ui/Page'
import { buttonStyles } from '@/components/ui/styles'
import { formatMonth, monthOf, monthsBetween } from '@/lib/date'
import { MUSCLE_GROUP_LABELS, getExercise } from '@/lib/exercises-data'
import { formatKg } from '@/lib/format'
import { getAccountStartMonth, getMonthlyBests } from '@/lib/data/progress'
import { getToday } from '@/lib/data/session'
import { ProgressChart } from './ProgressChart'

export default async function ExerciseProgressPage({ params }: { params: Promise<{ exerciseId: string }> }) {
  const { exerciseId } = await params
  const exercise = getExercise(exerciseId)
  if (!exercise) notFound()

  const [bests, startMonth, today] = await Promise.all([getMonthlyBests(exerciseId), getAccountStartMonth(), getToday()])
  const currentMonth = monthOf(today)
  // From the month the account was made (or the first workout, if that is earlier) up to now.
  const firstMonth = [startMonth, bests[0]?.month, currentMonth].filter((m): m is string => Boolean(m)).sort()[0]
  const months = monthsBetween(firstMonth, currentMonth)

  const backLink = (
    <Link href="/progress" className={buttonStyles.chip}>
      <ChevronLeft size={13} /> Progress
    </Link>
  )
  const header = <PageHeader eyebrow={MUSCLE_GROUP_LABELS[exercise.muscle_group]} title={exercise.name} action={backLink} />

  if (bests.length === 0) {
    return (
      <Page>
        {header}
        <EmptyState
          icon={<TrendingUp size={32} />}
          title="No progress to show yet"
          description={`Tick off a set of ${exercise.name} in a workout and your heaviest lift each month shows up here.`}
        />
      </Page>
    )
  }

  const first = bests[0]
  const latest = bests.at(-1)!
  const best = bests.reduce((top, b) => (b.maxWeight > top.maxWeight ? b : top))
  const change = Math.round((latest.maxWeight - first.maxWeight) * 100) / 100
  const summary = `${exercise.name}, heaviest set per month: ${formatKg(first.maxWeight)} in ${formatMonth(first.month)}, ${formatKg(latest.maxWeight)} in ${formatMonth(latest.month)}.`

  return (
    <Page>
      {header}

      <div className="mb-4 grid grid-cols-3 gap-2">
        <Stat label="Best" value={formatKg(best.maxWeight)} detail={formatMonth(best.month)} />
        <Stat label="First" value={formatKg(first.maxWeight)} detail={formatMonth(first.month)} />
        <Stat
          label="Change"
          value={`${change > 0 ? '+' : ''}${formatKg(change)}`}
          detail="first to latest"
          valueClassName={change > 0 ? 'text-success' : 'text-white'}
        />
      </div>

      <Card className="p-4">
        <h2 className="text-sm font-bold text-white">Heaviest set per month</h2>
        <p className="mb-3 text-[11px] text-muted">Kilograms · tap or drag along the chart for each month</p>
        <ProgressChart months={months} points={bests} label={summary} />

        <details className="mt-3 border-t border-border/60 pt-3">
          <summary className="cursor-pointer text-xs font-bold text-muted hover:text-white">Show as table</summary>
          <table className="mt-2 w-full text-left text-xs">
            <thead className="text-muted">
              <tr>
                <th scope="col" className="py-1 font-bold">Month</th>
                <th scope="col" className="py-1 text-right font-bold">Heaviest set</th>
              </tr>
            </thead>
            <tbody className="tabular-nums">
              {[...bests].reverse().map((b) => (
                <tr key={b.month} className="border-t border-border/40">
                  <td className="py-1.5 text-zinc-300">{formatMonth(b.month, { month: 'long', year: 'numeric' })}</td>
                  <td className="py-1.5 text-right font-bold text-white">{formatKg(b.maxWeight)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </details>
      </Card>
    </Page>
  )
}

function Stat({
  label,
  value,
  detail,
  valueClassName = 'text-white',
}: {
  label: string
  value: ReactNode
  detail: string
  valueClassName?: string
}) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-3">
      <span className="block text-[10px] font-bold uppercase tracking-wider text-muted">{label}</span>
      <span className={`mt-1 block text-lg font-black leading-tight ${valueClassName}`}>{value}</span>
      <span className="text-[10px] text-muted">{detail}</span>
    </div>
  )
}
