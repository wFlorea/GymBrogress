'use client'

import { useState, useTransition } from 'react'
import { KeyRound, Loader2, MailCheck } from 'lucide-react'
import { sendPasswordLink } from './actions'

/**
 * A card row (Settings' "Account", the new-password page) that emails the user a link to set a new password; the
 * password can't be changed without one.
 */
export function SendPasswordLink({ email }: { email?: string }) {
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSending, startSending] = useTransition()

  function send() {
    setError(null)
    startSending(async () => {
      try {
        const result = await sendPasswordLink()
        if (result.ok) setSent(true)
        else setError(result.error)
      } catch {
        setError('Could not reach the server. Check your connection and try again.')
      }
    })
  }

  const description = sent
    ? `Sent! Open the link we emailed to ${email ?? 'you'}.`
    : (error ?? 'We’ll email you a link to set a new one')

  return (
    <button
      type="button"
      onClick={send}
      disabled={isSending || sent}
      className="flex w-full items-center gap-3 p-4 text-left transition-colors hover:bg-white/[0.03] disabled:hover:bg-transparent"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
        {isSending ? <Loader2 size={18} className="animate-spin" /> : sent ? <MailCheck size={18} /> : <KeyRound size={18} />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-semibold">Change password</span>
        <span role={error ? 'alert' : 'status'} className={`text-xs ${error ? 'text-error' : 'text-muted'}`}>
          {isSending ? 'Sending the link…' : description}
        </span>
      </span>
    </button>
  )
}
