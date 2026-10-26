import type { ReactNode } from 'react'
import Link from 'next/link'
import { BookOpen, CalendarCheck, ChevronRight, Dumbbell, LogOut } from 'lucide-react'
import { logout } from '@/app/login/actions'
import { Card } from '@/components/ui/Card'
import { Page, PageHeader, SectionTitle } from '@/components/ui/Page'
import { SubmitButton } from '@/components/ui/SubmitButton'
import { buttonStyles } from '@/components/ui/styles'
import { monthOf } from '@/lib/date'
import { EXERCISES } from '@/lib/exercises-data'
import { plural } from '@/lib/format'
import { getDisplayName, getToday, requireUser } from '@/lib/data/session'
import { getWorkoutHistory } from '@/lib/data/workouts'
import { GymHistoryCalendar } from './GymHistoryCalendar'

export default async function ProfilePage() {
  const [user, today, history] = await Promise.all([requireUser(), getToday(), getWorkoutHistory()])

  const name = getDisplayName(user)
  const gymDates = history.filter((day) => day.completedSets > 0).map((day) => day.date)
  const thisMonth = gymDates.filter((date) => monthOf(date) === monthOf(today)).length

  return (
    <Page>
      <PageHeader title="Profile" subtitle="Your account and training history." />

      <Card className="mb-6 flex items-center gap-4 p-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary text-xl font-bold text-white shadow-md shadow-primary/20">
          {name.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0">
          <h2 className="truncate text-lg font-bold">{name}</h2>
          {user.email && <p className="truncate text-sm text-muted">{user.email}</p>}
        </div>
      </Card>

      <div className="mb-6 grid grid-cols-2 gap-3">
        <Stat icon={<Dumbbell size={18} />} value={gymDates.length} label="Workouts logged" />
        <Stat icon={<CalendarCheck size={18} />} value={thisMonth} label="This month" />
      </div>

      <section className="mb-6">
        <SectionTitle>Gym history</SectionTitle>
        <GymHistoryCalendar today={today} gymDates={gymDates} />
      </section>

      <Link
        href="/exercises"
        className="mb-8 flex items-center justify-between rounded-2xl border border-border bg-surface p-4 transition-colors hover:border-primary"
      >
        <span className="flex items-center gap-3">
          <BookOpen size={20} className="text-primary" />
          <span>
            <span className="block font-medium">Exercise library</span>
            <span className="text-xs text-muted">{plural(EXERCISES.length, 'exercise')} with technique tips</span>
          </span>
        </span>
        <ChevronRight size={18} className="text-muted" />
      </Link>

      <form action={logout}>
        <SubmitButton className={buttonStyles.danger} pendingLabel="Signing out…">
          <LogOut size={20} /> Sign out
        </SubmitButton>
      </form>
    </Page>
  )
}

function Stat({ icon, value, label }: { icon: ReactNode; value: number; label: string }) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-4">
      <span className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15 text-primary">{icon}</span>
      <span className="block text-2xl font-extrabold">{value}</span>
      <span className="text-xs text-muted">{label}</span>
    </div>
  )
}
