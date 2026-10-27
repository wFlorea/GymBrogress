'use client'

import type { ReactNode } from 'react'
import { useFormStatus } from 'react-dom'
import { Loader2 } from 'lucide-react'
import { buttonStyles } from './styles'

/**
 * Submit button that disables itself and shows a spinner while its form is being sent.
 * Forms that submit through `onSubmit` instead of `action` pass their own `pending`.
 */
export function SubmitButton({
  children,
  pendingLabel,
  pending: pendingProp,
  className = buttonStyles.primary,
}: {
  children: ReactNode
  pendingLabel?: ReactNode
  pending?: boolean
  className?: string
}) {
  const status = useFormStatus()
  const pending = pendingProp ?? status.pending
  return (
    <button type="submit" disabled={pending} aria-busy={pending} className={`w-full ${className}`}>
      {pending ? (
        <>
          <Loader2 size={18} className="animate-spin" />
          {pendingLabel ?? children}
        </>
      ) : (
        children
      )}
    </button>
  )
}
