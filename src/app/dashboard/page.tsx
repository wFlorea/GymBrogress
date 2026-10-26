import Link from 'next/link'
import {
  ArrowRight,
  BookOpen,
  Calendar,
  CalendarX,
  CheckCircle2,
  ClipboardList,
  Coffee,
  Dumbbell,
  Flame,
  RotateCcw,
} from 'lucide-react'
import type { ReactNode } from 'react'
import { Card } from '@/components/ui/Card'
import { Page } from '@/components/ui/Page'
import { buttonStyles } from '@/components/ui/styles'
import { DAYS_OF_WEEK, dayOfWeek, formatDate } from '@/lib/date'
import { EXERCISES } from '@/lib/exercises-data'
import { plural } from '@/lib/format'
import { resolveRoutine } from '@/lib/routines'
import { REST_DAY, getSplitOption } from '@/lib/splits'
import { MAX_RESTORES_PER_MONTH, computeStreakStats } from '@/lib/streak'
import { getRoutineTemplates, getWeeklyPlan } from '@/lib/data/plans'
import { getDisplayName, getToday, requireUser } from '@/lib/data/session'
import { getWorkoutHistory } from '@/lib/data/workouts'
import type { DaySummary } from '@/lib/types'

export default async function DashboardPage() {
  const [user, today, weeklyPlan, templates, history] = await Promise.all([
    requireUser(),
    getToday(),
    getWeeklyPlan(),
    getRoutineTemplates(),
    getWorkoutHistory(),
  ])

  const todayLog = history.find((day) => day.date === today)
  const split = todayLog?.split ?? weeklyPlan[dayOfWeek(today)]
  const exercises = resolveRoutine(split, templates)
  const { streak, skippedDays, restoresLeftThisMonth, missedYesterday } = computeStreakStats(
    history,
    weeklyPlan,
    today
  )
  const totalCompletedSets = history.reduce((sum, day) => sum + day.completedSets, 0)
  const trainedToday = (todayLog?.completedSets ?? 0) > 0

  return (
    <Page>
      {missedYesterday && !trainedToday && (
        <div className="mb-5 rounded-2xl border border-primary/40 bg-primary/15 p-3.5 text-center font-black text-primary">
          You skipped yesterday — make today count! 💪
        </div>
      )}

      <header className="mb-6 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-black text-primary">Hi, {getDisplayName(user)}! 💪</h1>
          <p className="mt-1 text-sm text-muted">{formatDate(today, { weekday: 'long', day: 'numeric', month: 'long' })}</p>
        </div>
        {streak > 0 && (
          <div className="flex shrink-0 items-center gap-1.5 rounded-full border border-primary/30 bg-primary/15 px-3 py-1.5 text-sm font-bold text-primary">
            <Flame size={18} className="fill-primary" />
            {plural(streak, 'day')}
          </div>
        )}
      </header>

      <Card className="mb-6 shadow-xl">
        <div className="mb-3 flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted">
            <Calendar size={14} className="text-primary" /> {DAYS_OF_WEEK[dayOfWeek(today)]}
          </span>
          {split !== REST_DAY && <WorkoutStatus day={todayLog} />}
        </div>

        {split === REST_DAY ? (
          <div className="space-y-4">
            <div>
              <h2 className="flex items-center gap-2 text-xl font-bold">
                <Coffee size={22} className="text-amber-500" /> Rest & recovery day
              </h2>
              <p className="mt-1.5 text-sm leading-relaxed text-muted">
                Muscles grow while you recover. Get enough sleep, stay hydrated and eat balanced meals.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <Link href="/schedule" className={`${buttonStyles.secondary} text-xs`}>
                <Calendar size={14} /> Change schedule
              </Link>
              <Link href="/tracker" className={`${buttonStyles.soft} text-xs`}>
                Train anyway <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        ) : (
          <div>
            <div className="mb-1.5 flex items-center justify-between gap-2">
              <h2 className="text-xl font-bold">
                {getSplitOption(split).emoji} {getSplitOption(split).name}
              </h2>
              <span className="shrink-0 rounded-lg bg-zinc-800 px-2 py-0.5 text-xs text-zinc-400">
                {plural(exercises.length, 'exercise')}
              </span>
            </div>
            <p className="mb-5 text-sm text-muted">{workoutSummary(todayLog)}</p>

            <Link href="/tracker" className={buttonStyles.primary}>
              <Dumbbell size={18} />
              {todayLog?.finished ? 'View workout' : todayLog?.totalSets ? 'Continue workout' : 'Start workout'}
              <ArrowRight size={18} />
            </Link>
          </div>
        )}
      </Card>

      <div className="grid grid-cols-2 gap-4">
        <Stat icon={<Flame size={22} className="fill-primary" />} tone="bg-primary/15 text-primary" value={streak} label="Day streak" />
        <Stat icon={<CalendarX size={20} />} tone="bg-zinc-700/40 text-zinc-300" value={skippedDays} label="Missed workouts" />
        <Stat
          icon={<RotateCcw size={20} />}
          tone="bg-blue-500/15 text-blue-400"
          value={
            <>
              {restoresLeftThisMonth}
              <span className="text-base text-muted">/{MAX_RESTORES_PER_MONTH}</span>
            </>
          }
          label="Streak restores left this month"
        />
        <Stat icon={<CheckCircle2 size={22} />} tone="bg-emerald-500/15 text-emerald-400" value={totalCompletedSets} label="Sets completed" />
      </div>

      <nav className="mt-6 grid grid-cols-3 gap-3" aria-label="Shortcuts">
        <QuickLink href="/schedule" icon={<Calendar size={17} />} tone="bg-blue-500/15 text-blue-400" title="Schedule" subtitle="Your training days" />
        <QuickLink href="/plan" icon={<ClipboardList size={17} />} tone="bg-primary/15 text-primary" title="Plan" subtitle="Routine per split" />
        <QuickLink href="/exercises" icon={<BookOpen size={17} />} tone="bg-emerald-500/15 text-emerald-400" title="Library" subtitle={plural(EXERCISES.length, 'exercise')} />
      </nav>
    </Page>
  )
}

function workoutSummary(day: DaySummary | undefined): string {
  if (!day || day.totalSets === 0) return 'Ready for today’s session? Time to make progress!'
  const progress = `${day.completedSets} of ${plural(day.totalSets, 'set')}`
  return day.finished ? `Great work! You completed ${progress}.` : `You have completed ${progress}.`
}

function WorkoutStatus({ day }: { day: DaySummary | undefined }) {
  const [label, tone] = day?.finished
    ? ['Completed', 'border-success/30 bg-success/15 text-success']
    : day && day.totalSets > 0
      ? ['In progress', 'border-primary/30 bg-primary/15 text-primary']
      : ['Not started', 'border-border bg-zinc-800 text-zinc-400']
  return <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${tone}`}>{label}</span>
}

function Stat({ icon, tone, value, label }: { icon: ReactNode; tone: string; value: ReactNode; label: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-surface p-4 text-center shadow-sm">
      <div className={`mb-2 flex h-10 w-10 items-center justify-center rounded-full ${tone}`}>{icon}</div>
      <span className="text-3xl font-extrabold">{value}</span>
      <span className="mt-1 text-xs font-medium text-muted">{label}</span>
    </div>
  )
}

function QuickLink({
  href,
  icon,
  tone,
  title,
  subtitle,
}: {
  href: string
  icon: ReactNode
  tone: string
  title: string
  subtitle: string
}) {
  return (
    <Link
      href={href}
      className="flex flex-col justify-between rounded-2xl border border-border bg-surface/70 p-3.5 transition-all hover:border-primary hover:bg-surface"
    >
      <div className={`mb-2 flex h-8 w-8 items-center justify-center rounded-lg ${tone}`}>{icon}</div>
      <span className="block text-xs font-black text-white">{title}</span>
      <span className="text-[10px] text-muted">{subtitle}</span>
    </Link>
  )
}
