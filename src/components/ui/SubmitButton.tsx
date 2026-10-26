'use client'

import type { ReactNode } from 'react'
import { useFormStatus } from 'react-dom'
import { Loader2 } from 'lucide-react'
import { buttonStyles } from './styles'

/** Submit button that disables itself and shows a spinner while its form is being sent. */
export function SubmitButton({
  children,
  pendingLabel,
  className = buttonStyles.primary,
}: {
  children: ReactNode
  pendingLabel?: ReactNode
  className?: string
}) {
  const { pending } = useFormStatus()
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
