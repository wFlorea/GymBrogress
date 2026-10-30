'use client'

import { useState, useTransition } from 'react'
import { Loader2, Trash2 } from 'lucide-react'
import { Alert } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Modal'
import { buttonStyles, inputStyles } from '@/components/ui/styles'
import { deleteAccount } from './actions'

const CONFIRM_WORD = 'DELETE'

/** A Settings row that deletes the account for good, after the user types DELETE. */
export function DeleteAccount() {
  const [open, setOpen] = useState(false)
  const [typed, setTyped] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isDeleting, startDeleting] = useTransition()
  const confirmed = typed.trim().toUpperCase() === CONFIRM_WORD

  function close() {
    if (isDeleting) return
    setOpen(false)
    setTyped('')
    setError(null)
  }

  function remove() {
    setError(null)
    startDeleting(async () => {
      try {
        // Only answers when it failed; otherwise it redirects to the sign-in page and there's no result to read.
        const result = await deleteAccount()
        if (result && !result.ok) setError(result.error)
      } catch {
        setError('Could not reach the server. Check your connection and try again.')
      }
    })
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center gap-3 p-4 text-left transition-colors hover:bg-white/[0.03]"
      >
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-error/15 text-error">
          <Trash2 size={18} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-semibold text-error">Delete account</span>
          <span className="text-xs text-muted">Your account and everything you logged, for good</span>
        </span>
      </button>

      <Modal open={open} onClose={close} title="Delete your account?">
        <div className="space-y-4 pt-4">
          <p className="text-sm text-muted">
            This deletes your workouts, routines, food log, weigh-ins and settings, and you can’t undo it. Export your
            data first if you want to keep a copy.
          </p>
          <label className="block space-y-1.5">
            <span className="text-xs font-semibold text-muted">Type {CONFIRM_WORD} to confirm</span>
            <input
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
              className={inputStyles}
            />
          </label>
          {error && <Alert>{error}</Alert>}
          <button
            type="button"
            onClick={remove}
            disabled={!confirmed || isDeleting}
            className={`${buttonStyles.danger} w-full disabled:opacity-50`}
          >
            {isDeleting ? <Loader2 size={20} className="animate-spin" /> : <Trash2 size={20} />} Delete my account
          </button>
        </div>
      </Modal>
    </>
  )
}
