import { Alert, cardStyles } from '@/components/ui/Card'
import { Page, PageHeader } from '@/components/ui/Page'
import { requireUser } from '@/lib/data/session'
import { isFreshEmailSession } from '@/app/login/auth-state'
import { createClient } from '@/utils/supabase/server'
import { PasswordForm } from './PasswordForm'
import { SendPasswordLink } from './SendPasswordLink'

export const metadata = { title: 'New password' }

/**
 * Where a password link from an email lands (signed in by the link). Without a fresh one, it offers to send one:
 * a signed-in session alone can't change the password.
 */
export default async function PasswordPage() {
  const [user, supabase] = await Promise.all([requireUser(), createClient()])
  const { data } = await supabase.auth.getClaims()

  if (!isFreshEmailSession(data?.claims.amr)) {
    return (
      <Page>
        <PageHeader title="New password" subtitle="For your security, a new password starts with an email." />
        <div className="space-y-4">
          <Alert tone="info">Open the link we email you, then pick your new password here.</Alert>
          <div className={`${cardStyles} overflow-hidden`}>
            <SendPasswordLink email={user.email} />
          </div>
        </div>
      </Page>
    )
  }

  return (
    <Page>
      <PageHeader title="New password" subtitle="Pick a new password for your account." />
      <PasswordForm />
    </Page>
  )
}
