import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Page, PageHeader } from '@/components/ui/Page'
import { buttonStyles } from '@/components/ui/styles'
import { addDays, formatDate, isIsoDate } from '@/lib/date'
import { getFoodEntries, getRecentFoods } from '@/lib/data/food'
import { getToday } from '@/lib/data/session'
import { getUserSettings } from '@/lib/data/settings'
import type { IsoDate } from '@/lib/types'
import { FoodClient } from './FoodClient'

export default async function FoodPage({ searchParams }: { searchParams: Promise<{ date?: string | string[] }> }) {
  const [{ date: requested }, today] = await Promise.all([searchParams, getToday()])
  // Earlier days can be viewed and filled in later; days that haven't happened can't.
  const date = isIsoDate(requested) && requested <= today ? requested : today
  const [entries, recentFoods, settings] = await Promise.all([getFoodEntries(date), getRecentFoods(), getUserSettings()])

  return (
    <Page>
      <PageHeader title="Food" subtitle="Log what you eat to see your calories and macros." />
      <DaySwitcher date={date} today={today} />
      <FoodClient
        key={date}
        date={date}
        entries={entries}
        recentFoods={recentFoods}
        goals={settings.nutritionGoals}
        body={settings.body}
        goalWeight={settings.goalWeight}
        weightPlan={settings.weightPlan}
        planPace={settings.planPace}
      />
    </Page>
  )
}

const dayHref = (date: IsoDate, today: IsoDate) => (date === today ? '/food' : `/food?date=${date}`)

function DaySwitcher({ date, today }: { date: IsoDate; today: IsoDate }) {
  const name = date === today ? 'Today' : date === addDays(today, -1) ? 'Yesterday' : formatDate(date, { weekday: 'long' })

  return (
    <nav aria-label="Day" className="mb-5 flex items-center justify-between gap-3">
      <Link href={dayHref(addDays(date, -1), today)} replace scroll={false} aria-label="Previous day" className={buttonStyles.icon}>
        <ChevronLeft size={18} />
      </Link>
      <div className="text-center" aria-live="polite">
        <span className="block font-bold">{name}</span>
        <span className="text-xs text-muted">{formatDate(date, { day: 'numeric', month: 'long', year: 'numeric' })}</span>
      </div>
      {date < today ? (
        <Link href={dayHref(addDays(date, 1), today)} replace scroll={false} aria-label="Next day" className={buttonStyles.icon}>
          <ChevronRight size={18} />
        </Link>
      ) : (
        <span aria-hidden className={`${buttonStyles.icon} opacity-30`}>
          <ChevronRight size={18} />
        </span>
      )}
    </nav>
  )
}
