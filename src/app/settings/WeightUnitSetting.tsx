'use client'

import { useState, useTransition } from 'react'
import { Weight } from 'lucide-react'
import { Alert, Card } from '@/components/ui/Card'
import { pillStyles } from '@/components/ui/styles'
import { WEIGHT_UNITS, WEIGHT_UNIT_LABELS } from '@/lib/units'
import type { WeightUnit } from '@/lib/types'
import { saveWeightUnit } from './actions'

/** Picks kg or lb for every weight in the app; saved as soon as it changes. */
export function WeightUnitSetting({ initial }: { initial: WeightUnit }) {
  const [unit, setUnit] = useState(initial)
  const [error, setError] = useState<string | null>(null)
  const [, startSaving] = useTransition()

  function save(next: WeightUnit) {
    if (next === unit) return
    const previous = unit
    setUnit(next)
    setError(null)
    startSaving(async () => {
      const result = await saveWeightUnit(next)
      if (!result.ok) {
        setUnit(previous)
        setError(result.error)
      }
    })
  }

  return (
    <Card>
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
          <Weight size={18} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-semibold">Weight</p>
          <p className="text-xs text-muted">{WEIGHT_UNIT_LABELS[unit]}, for lifts and body weight</p>
        </div>
        <div role="radiogroup" aria-label="Weight unit" className="flex shrink-0 gap-1.5">
          {WEIGHT_UNITS.map((option) => (
            <button
              key={option}
              type="button"
              role="radio"
              aria-checked={unit === option}
              onClick={() => save(option)}
              className={`${pillStyles(unit === option)} w-12 justify-center py-2 text-sm`}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      {error && <Alert className="mt-3">{error}</Alert>}
    </Card>
  )
}
