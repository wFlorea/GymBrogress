import type { ReactNode } from 'react'
import Link from 'next/link'
import { BookOpen, ChevronRight, LogOut, TrendingUp } from 'lucide-react'
import { logout } from '@/app/login/actions'
import { Card, StatItem, cardStyles } from '@/components/ui/Card'
import { Page, SectionTitle } from '@/components/ui/Page'
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
  const totalSets = history.reduce((sum, day) => sum + day.completedSets, 0)

  return (
    <Page>
      <header className="mb-6 flex flex-col items-center pt-2 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary font-display text-[2rem] font-bold text-white shadow-[0_0_40px_-8px_var(--color-primary)] ring-4 ring-primary/25">
          {name.charAt(0).toUpperCase()}
        </div>
        <h1 className="mt-4 max-w-full truncate font-display text-[1.75rem] font-bold leading-tight">{name}</h1>
        {user.email && <p className="max-w-full truncate text-sm text-muted">{user.email}</p>}
      </header>

      <Card className="mb-8 py-4">
        <dl className="grid grid-cols-3 text-center">
          <StatItem value={gymDates.length} label="Workouts" />
          <StatItem value={thisMonth} label="This month" />
          <StatItem value={totalSets} label="Sets done" />
        </dl>
      </Card>

      <section className="mb-8">
        <SectionTitle subtitle="Days you completed at least one set">Gym history</SectionTitle>
        <GymHistoryCalendar today={today} gymDates={gymDates} />
      </section>

      <nav aria-label="More" className={`${cardStyles} mb-8 divide-y divide-white/5 overflow-hidden`}>
        <MenuLink
          href="/progress"
          icon={<TrendingUp size={18} />}
          title="Progress"
          description="Your heaviest lifts, workout by workout"
        />
        <MenuLink
          href="/exercises"
          icon={<BookOpen size={18} />}
          title="Exercise library"
          description={`${plural(EXERCISES.length, 'exercise')} with technique tips`}
        />
      </nav>

      <form action={logout}>
        <SubmitButton className={buttonStyles.danger} pendingLabel="Signing out…">
          <LogOut size={20} /> Sign out
        </SubmitButton>
      </form>
    </Page>
  )
}

function MenuLink({ href, icon, title, description }: { href: string; icon: ReactNode; title: string; description: string }) {
  return (
    <Link href={href} className="flex items-center gap-3 p-4 transition-colors hover:bg-white/[0.03]">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block font-semibold">{title}</span>
        <span className="text-xs text-muted">{description}</span>
      </span>
      <ChevronRight size={18} className="shrink-0 text-muted" />
    </Link>
  )
}
