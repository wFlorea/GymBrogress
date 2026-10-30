import Link from 'next/link'
import { ChevronLeft, KeyRound } from 'lucide-react'
import { cardStyles } from '@/components/ui/Card'
import { MenuLink } from '@/components/ui/MenuLink'
import { Page, PageHeader, SectionTitle } from '@/components/ui/Page'
import { buttonStyles } from '@/components/ui/styles'
import { requireUser } from '@/lib/data/session'
import { getUserSettings } from '@/lib/data/settings'
import { PushReminder } from './PushReminder'
import { RestTimerSetting } from './RestTimerSetting'

export const metadata = { title: 'Settings' }

export default async function SettingsPage() {
  const [user, settings] = await Promise.all([requireUser(), getUserSettings()])

  return (
    <Page>
      <PageHeader
        title="Settings"
        action={
          <Link href="/profile" className={buttonStyles.chip}>
            <ChevronLeft size={13} /> Profile
          </Link>
        }
      />

      <section className="mb-8">
        <SectionTitle subtitle="While you train">Workout</SectionTitle>
        <RestTimerSetting initial={settings.restTimer} />
      </section>

      {process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && (
        <section className="mb-8">
          <SectionTitle>Notifications</SectionTitle>
          <PushReminder />
        </section>
      )}

      <section className="mb-8">
        <SectionTitle subtitle={user.email}>Account</SectionTitle>
        <nav aria-label="Account" className={`${cardStyles} divide-y divide-white/5 overflow-hidden`}>
          <MenuLink
            href="/password"
            icon={<KeyRound size={18} />}
            title="Change password"
            description="Pick a new password for signing in"
          />
        </nav>
      </section>
    </Page>
  )
}
