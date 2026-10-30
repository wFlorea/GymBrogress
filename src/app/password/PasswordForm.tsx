'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { Alert, Card } from '@/components/ui/Card'
import { SubmitButton } from '@/components/ui/SubmitButton'
import { buttonStyles, inputStyles } from '@/components/ui/styles'
import { MIN_PASSWORD_LENGTH } from '@/app/login/auth-state'
import { updatePassword } from './actions'

export function PasswordForm() {
  const [state, action] = useActionState(updatePassword, null)

  if (state?.notice) {
    return (
      <Card className="space-y-4">
        <Alert tone="success">{state.notice}</Alert>
        <Link href="/dashboard" className={buttonStyles.primary}>
          Go to the dashboard
        </Link>
      </Card>
    )
  }

  return (
    <Card>
      <form action={action} className="space-y-4">
        <label className="block space-y-1.5">
          <span className="text-xs font-semibold text-muted">New password</span>
          <input
            name="password"
            type="password"
            autoComplete="new-password"
            minLength={MIN_PASSWORD_LENGTH}
            required
            className={inputStyles}
          />
          <span className="block text-[11px] text-muted">At least {MIN_PASSWORD_LENGTH} characters.</span>
        </label>
        <label className="block space-y-1.5">
          <span className="text-xs font-semibold text-muted">Confirm new password</span>
          <input
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            minLength={MIN_PASSWORD_LENGTH}
            required
            className={inputStyles}
          />
        </label>
        {state?.error && <Alert>{state.error}</Alert>}
        <SubmitButton pendingLabel="Saving…">Save password</SubmitButton>
      </form>
    </Card>
  )
}
