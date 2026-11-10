'use client'

import { useState, useTransition } from 'react'
import { Loader2, UserX } from 'lucide-react'
import { Alert } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Modal'
import { buttonStyles } from '@/components/ui/styles'
import { removeBodyData } from './actions'

/** A Settings row that deletes the body details and weigh-ins, which also withdraws the consent to keep them. */
export function RemoveBodyData() {
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const [isRemoving, startRemoving] = useTransition()

  function close() {
    if (isRemoving) return
    setOpen(false)
    setError(null)
    setDone(false)
  }

  function remove() {
    setError(null)
    startRemoving(async () => {
      try {
        const result = await removeBodyData()
        if (result.ok) setDone(true)
        else setError(result.error)
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
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
          <UserX size={18} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-semibold">Remove my body data</span>
          <span className="text-xs text-muted">Withdraws your consent and deletes your details and weigh-ins</span>
        </span>
      </button>

      <Modal open={open} onClose={close} title="Remove your body data?">
        <div className="space-y-4 pt-4">
          {done ? (
            <Alert tone="success">Your body details and weigh-ins were deleted.</Alert>
          ) : (
            <>
              <p className="text-sm text-muted">
                This deletes your weight, height, age, sex, body fat, activity level, goal weight and every weigh-in, and
                you can’t undo it. Your workouts and food log stay.
              </p>
              {error && <Alert>{error}</Alert>}
              <button type="button" onClick={remove} disabled={isRemoving} className={`${buttonStyles.danger} w-full disabled:opacity-50`}>
                {isRemoving ? <Loader2 size={20} className="animate-spin" /> : <UserX size={20} />} Remove my body data
              </button>
            </>
          )}
        </div>
      </Modal>
    </>
  )
}
