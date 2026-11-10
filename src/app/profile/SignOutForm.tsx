'use client'

import { LogOut } from 'lucide-react'
import { logout } from '@/app/login/actions'
import { clearOutbox } from '@/app/tracker/outbox'
import { SubmitButton } from '@/components/ui/SubmitButton'
import { buttonStyles } from '@/components/ui/styles'

/** Signs out, and clears the sets still waiting on this device first. */
export function SignOutForm() {
  return (
    <form action={logout} onSubmit={() => clearOutbox()}>
      <SubmitButton className={buttonStyles.danger} pendingLabel="Signing out…">
        <LogOut size={20} /> Sign out
      </SubmitButton>
    </form>
  )
}
