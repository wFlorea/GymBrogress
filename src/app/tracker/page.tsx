import Link from 'next/link'
import { ArrowRight, Calendar, ClipboardList, Coffee, Dumbbell } from 'lucide-react'
import { Card, EmptyState } from '@/components/ui/Card'
import { Page, PageHeader } from '@/components/ui/Page'
import { buttonStyles } from '@/components/ui/styles'
import { dayOfWeek, formatDate } from '@/lib/date'
import { MUSCLE_GROUP_LABELS } from '@/lib/exercises-data'
import { plural } from '@/lib/format'
import { resolveRoutine } from '@/lib/routines'
import { REST_DAY, getSplitOption } from '@/lib/splits'
import { getRoutineTemplates, getWeeklyPlan } from '@/lib/data/plans'
import { getExerciseHistory } from '@/lib/data/progress'
import { getToday } from '@/lib/data/session'
import { getUserSettings } from '@/lib/data/settings'
import { getWorkoutDay } from '@/lib/data/workouts'
import { StartWorkoutButton, StartWorkoutPicker } from './StartWorkout'
import { TrackerClient } from './TrackerClient'

const planLink = (
  <Link href="/plan" className="flex items-center gap-1 rounded-full border border-foreground/15 bg-surface px-3 py-1.5 text-xs font-bold text-foreground/80 hover:text-white">
    <ClipboardList size={13} /> Plan
  </Link>
)

export default async function TrackerPage() {
  const today = await getToday()
  const [day, weeklyPlan, templates, settings, history] = await Promise.all([
    getWorkoutDay(today),
    getWeeklyPlan(),
    getRoutineTemplates(),
    getUserSettings(),
    getExerciseHistory(),
  ])

  const split = day?.split ?? weeklyPlan[dayOfWeek(today)]
  const option = getSplitOption(split)
  const exercises = resolveRoutine(split, templates)
  const dateLabel = formatDate(today, { weekday: 'long', day: 'numeric', month: 'long' })

  if (day && day.sets.length > 0) {
    return (
      <Page>
        <PageHeader eyebrow={dateLabel} title={`${option.emoji} ${option.name}`} action={planLink} />
        <TrackerClient
          key={day.id}
          day={day}
          plannedExercises={exercises}
          restTimer={settings.restTimer}
          personalBests={Object.fromEntries(history.map((entry) => [entry.exerciseId, entry.bestWeight]))}
        />
      </Page>
    )
  }

  if (split === REST_DAY) {
    return (
      <Page>
        <PageHeader eyebrow={dateLabel} title="Rest day" />
        <Card className="space-y-5 shadow-xl">
          <div className="space-y-2 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/15 text-amber-500">
              <Coffee size={30} />
            </div>
            <h2 className="text-xl font-black text-white">Recover well, champ!</h2>
            <p className="text-sm leading-relaxed text-muted">
              Your schedule has no workout today. Rest and good food are what build muscle.
            </p>
          </div>
          <div className="space-y-2 border-t border-border/60 pt-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted">Want to train anyway?</h3>
            <StartWorkoutPicker />
          </div>
          <Link href="/schedule" className={`${buttonStyles.secondary} text-xs`}>
            <Calendar size={14} /> Change schedule
          </Link>
        </Card>
      </Page>
    )
  }

  return (
    <Page>
      <PageHeader eyebrow={dateLabel} title={`${option.emoji} ${option.name}`} action={planLink} />
      {exercises.length === 0 ? (
        <EmptyState
          icon={<Dumbbell size={32} />}
          title={`Your ${option.name} routine is empty`}
          description="Add exercises to it in Plan, then come back to start your workout."
        >
          <Link href="/plan" className={`${buttonStyles.soft} text-xs`}>
            Open Plan <ArrowRight size={14} />
          </Link>
        </EmptyState>
      ) : (
        <Card className="space-y-5 shadow-xl">
          <div>
            <h2 className="text-lg font-black text-white">Ready to train?</h2>
            <p className="mt-1 text-xs text-muted">
              {plural(exercises.length, 'exercise')}, filled in with what you lifted last time. You can change sets and
              add exercises as you go.
            </p>
          </div>
          <ol className="space-y-2">
            {exercises.map((exercise, index) => (
              <li key={exercise.id} className="flex items-center gap-3 rounded-xl border border-border/80 bg-sunken p-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-surface text-xs font-bold text-muted">
                  {index + 1}
                </span>
                <span className="min-w-0 flex-1 text-sm font-bold text-white">{exercise.name}</span>
                <span className="shrink-0 text-right text-[10px] leading-tight text-muted">
                  <span className="block font-bold text-foreground/80">{plural(exercise.sets, 'set')}</span>
                  {MUSCLE_GROUP_LABELS[exercise.muscle_group]}
                </span>
              </li>
            ))}
          </ol>
          <StartWorkoutButton split={split} />
        </Card>
      )}
    </Page>
  )
}
