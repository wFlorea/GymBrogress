import Link from 'next/link'
import { ArrowRight, BookOpen, Calendar, ChevronRight, ClipboardList, Coffee, Dumbbell, Flame } from 'lucide-react'
import type { ReactNode } from 'react'
import { Card, StatItem, cardStyles } from '@/components/ui/Card'
import { Meter } from '@/components/ui/Meter'
import { Page, SectionTitle } from '@/components/ui/Page'
import { PlateMark } from '@/components/ui/PlateMark'
import { buttonStyles } from '@/components/ui/styles'
import { DAYS_OF_WEEK, addDays, dayOfWeek, formatDate, mondayOf } from '@/lib/date'
import { EXERCISES } from '@/lib/exercises-data'
import { formatGrams, formatKcal, plural } from '@/lib/format'
import { MACROS, sumNutrition } from '@/lib/nutrition'
import { resolveRoutine } from '@/lib/routines'
import { REST_DAY, getSplitOption } from '@/lib/splits'
import { MAX_RESTORES_PER_MONTH, computeStreakStats } from '@/lib/streak'
import { getFoodEntries } from '@/lib/data/food'
import { getRoutineTemplates, getWeeklyPlan } from '@/lib/data/plans'
import { getDisplayName, getToday, requireUser } from '@/lib/data/session'
import { getUserSettings } from '@/lib/data/settings'
import { getWorkoutHistory } from '@/lib/data/workouts'
import type { DaySummary, IsoDate, Nutrition } from '@/lib/types'
import { BodyCard } from './BodyCard'

interface ChartDay {
  date: IsoDate
  label: string
  sets: number
}

export default async function DashboardPage() {
  const [user, today, weeklyPlan, templates, history, foodToday, settings] = await Promise.all([
    requireUser(),
    getToday(),
    getWeeklyPlan(),
    getRoutineTemplates(),
    getWorkoutHistory(),
    getToday().then(getFoodEntries),
    getUserSettings(),
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

  const setsByDate = new Map(history.map((day) => [day.date, day.completedSets]))
  const week: ChartDay[] = DAYS_OF_WEEK.map((name, i) => {
    const date = addDays(mondayOf(today), i)
    return { date, label: name.slice(0, 3), sets: setsByDate.get(date) ?? 0 }
  })
  const weekSets = week.reduce((sum, day) => sum + day.sets, 0)

  return (
    <Page>
      {missedYesterday && !trainedToday && (
        <div className="mb-5 rounded-2xl border border-primary/40 bg-primary/15 p-3.5 text-center font-black text-primary">
          You skipped yesterday — make today count! 💪
        </div>
      )}

      <header className="mb-6 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm text-muted">Welcome,</p>
          <h1 className="truncate font-display text-[2rem] font-bold leading-tight">{getDisplayName(user)}</h1>
          <p className="mt-0.5 text-xs text-muted">{formatDate(today, { weekday: 'long', day: 'numeric', month: 'long' })}</p>
        </div>
        {streak > 0 && (
          <div className="mt-1 flex shrink-0 items-center gap-1.5 rounded-full border border-primary/30 bg-primary/15 px-3 py-1.5 text-sm font-bold text-primary">
            <Flame size={18} className="fill-primary" />
            {plural(streak, 'day')}
          </div>
        )}
      </header>

      <Card className="mb-8">
        <h2 className="font-semibold">This week</h2>
        <p className="mb-5 text-xs text-muted">
          {plural(weekSets, 'set')} done, {totalCompletedSets} all time
        </p>
        <WeekChart days={week} today={today} />
        <dl className="mt-5 grid grid-cols-3 border-t border-white/5 pt-4 text-center">
          <StatItem value={streak} label="Day streak" />
          <StatItem value={skippedDays} label="Missed workouts" />
          <StatItem value={`${restoresLeftThisMonth}/${MAX_RESTORES_PER_MONTH}`} label="Restores left" />
        </dl>
      </Card>

      <SectionTitle subtitle={DAYS_OF_WEEK[dayOfWeek(today)]}>Today</SectionTitle>
      <Card className="relative mb-8 overflow-hidden">
        <PlateMark size={180} className="pointer-events-none absolute -right-14 -top-12 text-white/[0.05]" />

        {split === REST_DAY ? (
          <div className="relative space-y-4">
            <div>
              <h3 className="flex items-center gap-2 font-display text-2xl font-bold">
                <Coffee size={22} className="text-amber-500" /> Rest day
              </h3>
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
          <div className="relative">
            <WorkoutStatus day={todayLog} />
            <h3 className="mt-3 font-display text-2xl font-bold">
              {getSplitOption(split).emoji} {getSplitOption(split).name}
            </h3>
            <p className="mt-1 text-sm text-muted">
              {plural(exercises.length, 'exercise')}. {workoutSummary(todayLog)}
            </p>

            <Link href="/tracker" className={`${buttonStyles.primary} mt-5`}>
              <Dumbbell size={18} />
              {todayLog?.finished ? 'View workout' : todayLog?.totalSets ? 'Continue workout' : 'Start workout'}
            </Link>
          </div>
        )}
      </Card>

      <SectionTitle subtitle="What you've eaten today">Food</SectionTitle>
      <FoodToday totals={sumNutrition(foodToday)} goal={settings.nutritionGoals.calories} />

      <SectionTitle subtitle="Your BMI and your goal">Body</SectionTitle>
      <BodyCard
        body={settings.body}
        goalWeight={settings.goalWeight}
        goals={settings.nutritionGoals}
        weightPlan={settings.weightPlan}
        planPace={settings.planPace}
      />

      <SectionTitle subtitle="Set up your training">Shortcuts</SectionTitle>
      <nav className="grid grid-cols-3 gap-3" aria-label="Shortcuts">
        <QuickLink href="/schedule" icon={<Calendar size={18} />} title="Schedule" subtitle="Your training days" />
        <QuickLink href="/plan" icon={<ClipboardList size={18} />} title="Plan" subtitle="Routine per split" />
        <QuickLink href="/exercises" icon={<BookOpen size={18} />} title="Library" subtitle={plural(EXERCISES.length, 'exercise')} />
      </nav>
    </Page>
  )
}

function workoutSummary(day: DaySummary | undefined): string {
  if (!day || day.totalSets === 0) return 'Ready when you are.'
  const progress = `${day.completedExercises} of ${plural(day.totalExercises, 'exercise')}`
  return day.finished ? `Great work! You completed ${progress}.` : `You have completed ${progress}.`
}

/** Completed sets for each day of this week. Today's bar is the accent; only it carries a number. */
function WeekChart({ days, today }: { days: ChartDay[]; today: IsoDate }) {
  const max = Math.max(1, ...days.map((day) => day.sets))
  const empty = days.every((day) => day.sets === 0)

  return (
    <div className="relative">
      {empty && (
        <p className="absolute inset-x-0 top-10 text-center text-xs text-muted">No sets logged yet this week.</p>
      )}
      <ol className="flex items-end justify-between gap-1" aria-label="Sets completed each day this week">
        {days.map((day) => {
          const isToday = day.date === today
          return (
            <li key={day.date} title={`${day.label}: ${plural(day.sets, 'set')}`} className="flex flex-1 flex-col items-center">
              {/* Bars top out at 80% so today's number fits above the tallest one. */}
              <div className="flex h-28 w-full flex-col items-center justify-end">
                {isToday && day.sets > 0 && <span className="mb-1 text-[11px] font-bold">{day.sets}</span>}
                <span
                  className={`w-2.5 rounded-t-full ${
                    day.sets === 0
                      ? 'h-1 rounded-full bg-white/10'
                      : isToday
                        ? 'bg-linear-to-t from-primary/30 to-primary shadow-[0_0_14px_-2px_var(--color-primary)]'
                        : 'bg-linear-to-t from-white/5 to-white/70'
                  }`}
                  style={day.sets > 0 ? { height: `${(day.sets / max) * 80}%` } : undefined}
                />
              </div>
              <span className={`mt-2 text-[11px] ${isToday ? 'font-bold text-white' : 'text-muted'}`}>
                {day.label}
                <span className="sr-only">: {plural(day.sets, 'set')}</span>
              </span>
            </li>
          )
        })}
      </ol>
    </div>
  )
}

function WorkoutStatus({ day }: { day: DaySummary | undefined }) {
  const [label, tone] = day?.finished
    ? ['Completed', 'border-success/30 bg-success/15 text-success']
    : day && day.totalSets > 0
      ? ['In progress', 'border-primary/30 bg-primary/15 text-primary']
      : ['Not started', 'border-border bg-zinc-800 text-zinc-400']
  return <span className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-medium ${tone}`}>{label}</span>
}

/** Today's calories against the goal; opens the food log. */
function FoodToday({ totals, goal }: { totals: Nutrition; goal: number | null }) {
  return (
    <Link href="/food" className={`${cardStyles} press mb-8 block p-5 hover:border-primary/60 [--press-scale:0.98]`}>
      <span className="flex items-center justify-between gap-3">
        <span className="flex items-baseline gap-1.5">
          <span className="font-display text-2xl font-bold tabular-nums">{totals.calories.toLocaleString('en-GB')}</span>
          <span className="text-sm text-muted">{goal === null ? 'kcal' : `/ ${formatKcal(goal)}`}</span>
        </span>
        <ChevronRight size={18} className="shrink-0 text-muted" />
      </span>
      {goal !== null && (
        <Meter
          value={totals.calories}
          max={goal}
          label="Calories today"
          valueText={`${formatKcal(totals.calories)} of ${formatKcal(goal)}`}
          className="mt-3"
        />
      )}
      <span className="mt-3 block text-xs text-muted">
        {totals.calories === 0
          ? 'Nothing logged yet. Tap to add your first meal.'
          : MACROS.map(({ key, label }) => `${formatGrams(totals[key])} ${label.toLowerCase()}`).join(', ')}
      </span>
    </Link>
  )
}

function QuickLink({ href, icon, title, subtitle }: { href: string; icon: ReactNode; title: string; subtitle: string }) {
  return (
    <Link
      href={href}
      className={`${cardStyles} flex flex-col p-3.5 transition-colors hover:border-primary/60`}
    >
      <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-primary/15 text-primary">{icon}</span>
      <span className="block text-sm font-semibold text-white">{title}</span>
      <span className="text-[11px] leading-snug text-muted">{subtitle}</span>
    </Link>
  )
}
