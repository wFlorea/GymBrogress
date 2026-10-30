import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronLeft, TrendingUp } from 'lucide-react'
import { Card, EmptyState, StatItem } from '@/components/ui/Card'
import { LineChart } from '@/components/ui/LineChart'
import { Page, PageHeader } from '@/components/ui/Page'
import { PlateMark } from '@/components/ui/PlateMark'
import { buttonStyles } from '@/components/ui/styles'
import { formatDate } from '@/lib/date'
import { MUSCLE_GROUP_LABELS, getExercise } from '@/lib/exercises-data'
import { formatKg } from '@/lib/format'
import { ONE_REP_MAX_REPS } from '@/lib/sets'
import { getWorkoutBests } from '@/lib/data/progress'

const shortDate = (date: string) => formatDate(date, { day: 'numeric', month: 'short' })
const longDate = (date: string) => formatDate(date, { day: 'numeric', month: 'long', year: 'numeric' })

export default async function ExerciseProgressPage({ params }: { params: Promise<{ exerciseId: string }> }) {
  const { exerciseId } = await params
  const exercise = getExercise(exerciseId)
  if (!exercise) notFound()

  const bests = await getWorkoutBests(exerciseId)

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
          description={`Tick off a set of ${exercise.name} in a workout and your heaviest lift from each workout shows up here.`}
        />
      </Page>
    )
  }

  const first = bests[0]
  const latest = bests.at(-1)!
  const best = bests.reduce((top, b) => (b.maxWeight > top.maxWeight ? b : top))
  const change = Math.round((latest.maxWeight - first.maxWeight) * 100) / 100
  const oneRepMaxes = bests.flatMap((b) => (b.oneRepMax === null ? [] : [b.oneRepMax]))
  const strongest = oneRepMaxes.length > 0 ? Math.max(...oneRepMaxes) : null
  // With one workout there is nothing to compare or draw a line through.
  const hasTrend = bests.length > 1
  const summary = `${exercise.name}, heaviest set per workout: ${formatKg(first.maxWeight)} on ${longDate(first.date)}, ${formatKg(latest.maxWeight)} on ${longDate(latest.date)}.`

  return (
    <Page>
      {header}

      <Card className="relative mb-4 overflow-hidden">
        <PlateMark size={180} className="pointer-events-none absolute -right-14 -top-12 text-white/[0.05]" />
        <div className="relative">
          <p className="text-sm text-muted">Personal best</p>
          <p className="mt-1 font-display text-[2.75rem] font-bold leading-none">
            {best.maxWeight > 0 ? formatKg(best.maxWeight) : 'Bodyweight'}
          </p>
          <p className="mt-2 text-xs text-muted">Set on {longDate(best.date)}</p>
        </div>
        {(hasTrend || strongest !== null) && (
          <dl
            className={`relative mt-5 grid border-t border-white/5 pt-4 ${
              hasTrend && strongest !== null ? 'grid-cols-3' : hasTrend ? 'grid-cols-2' : 'grid-cols-1'
            }`}
          >
            {strongest !== null && <StatItem value={formatKg(strongest)} label="Est. one-rep max" />}
            {hasTrend && (
              <>
                <StatItem value={formatKg(first.maxWeight)} label={`First, ${shortDate(first.date)}`} />
                <StatItem
                  value={`${change > 0 ? '+' : ''}${formatKg(change)}`}
                  label="First to latest"
                  className={change > 0 ? 'text-success' : ''}
                />
              </>
            )}
          </dl>
        )}
        {strongest !== null && (
          <p className="relative mt-3 text-[11px] text-muted">
            The one-rep max is estimated from your sets of {ONE_REP_MAX_REPS} reps or fewer.
          </p>
        )}
      </Card>

      <Card>
        <h2 className="font-semibold">Heaviest set per workout</h2>
        {!hasTrend ? (
          <p className="mt-1 text-xs leading-relaxed text-muted">
            One workout logged so far. The line appears after your next one.
          </p>
        ) : (
          <>
            <p className="mb-4 text-xs text-muted">In kilograms. Tap or drag along the chart to see each workout.</p>
            <LineChart points={bests.map((b) => ({ date: b.date, value: b.maxWeight }))} label={summary} />
            <details className="mt-3 border-t border-white/5 pt-3">
              <summary className="cursor-pointer text-xs font-bold text-muted hover:text-white">Show as table</summary>
              <table className="mt-2 w-full text-left text-xs">
                <thead className="text-muted">
                  <tr>
                    <th scope="col" className="py-1 font-bold">Workout</th>
                    <th scope="col" className="py-1 text-right font-bold">Heaviest set</th>
                    <th scope="col" className="py-1 text-right font-bold">Est. 1RM</th>
                  </tr>
                </thead>
                <tbody className="tabular-nums">
                  {[...bests].reverse().map((b) => (
                    <tr key={b.date} className="border-t border-white/5">
                      <td className="py-1.5 text-foreground/80">{longDate(b.date)}</td>
                      <td className="py-1.5 text-right font-bold text-white">{formatKg(b.maxWeight)}</td>
                      <td className="py-1.5 text-right text-muted">{b.oneRepMax === null ? '–' : formatKg(b.oneRepMax)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </details>
          </>
        )}
      </Card>
    </Page>
  )
}
