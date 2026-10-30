'use client'

import { useState, useTransition } from 'react'
import { Timer } from 'lucide-react'
import { Alert, Card } from '@/components/ui/Card'
import { Switch } from '@/components/ui/Switch'
import { pillStyles } from '@/components/ui/styles'
import { formatClock } from '@/lib/format'
import { REST_TIMER_OPTIONS } from '@/lib/sets'
import type { RestTimerSettings } from '@/lib/types'
import { saveRestTimer } from './actions'

/** Turns the tracker's rest countdown on or off and picks its length; saved as soon as it changes. */
export function RestTimerSetting({ initial }: { initial: RestTimerSettings }) {
  const [timer, setTimer] = useState(initial)
  const [error, setError] = useState<string | null>(null)
  const [, startSaving] = useTransition()

  function save(next: RestTimerSettings) {
    const previous = timer
    setTimer(next)
    setError(null)
    startSaving(async () => {
      const result = await saveRestTimer(next.on, next.seconds)
      if (!result.ok) {
        setTimer(previous)
        setError(result.error)
      }
    })
  }

  return (
    <Card>
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
          <Timer size={18} />
        </span>
        <div className="min-w-0 flex-1">
          <p id="rest-timer-label" className="font-semibold">Rest timer</p>
          <p className="text-xs text-muted">
            {timer.on ? 'Counts down after every set you tick off.' : 'Off. Ticking off a set starts no countdown.'}
          </p>
        </div>
        <Switch on={timer.on} onChange={(on) => save({ ...timer, on })} aria-labelledby="rest-timer-label" />
      </div>

      {timer.on && (
        <div role="radiogroup" aria-label="Rest time" className="mt-4 grid grid-cols-4 gap-2">
          {REST_TIMER_OPTIONS.map((seconds) => (
            <button
              key={seconds}
              type="button"
              role="radio"
              aria-checked={timer.seconds === seconds}
              onClick={() => save({ ...timer, seconds })}
              className={`${pillStyles(timer.seconds === seconds)} justify-center py-2 text-sm`}
            >
              {formatClock(seconds)}
            </button>
          ))}
        </div>
      )}

      {error && <Alert className="mt-3">{error}</Alert>}
    </Card>
  )
}
