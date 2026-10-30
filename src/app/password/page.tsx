import { Page, PageHeader } from '@/components/ui/Page'
import { requireUser } from '@/lib/data/session'
import { PasswordForm } from './PasswordForm'

export const metadata = { title: 'New password' }

/** Where a password reset link lands (signed in by the link), and where Settings sends you to change it. */
export default async function PasswordPage() {
  await requireUser()
  return (
    <Page>
      <PageHeader title="New password" subtitle="Pick a new password for your account." />
      <PasswordForm />
    </Page>
  )
}
