'use client'

import { useState, useTransition, type FormEvent } from 'react'
import { AmountField } from '@/components/ui/AmountField'
import { Alert } from '@/components/ui/Card'
import { SubmitButton } from '@/components/ui/SubmitButton'
import { MAX_HEIGHT_CM, MAX_WEIGHT_KG, MIN_HEIGHT_CM, MIN_WEIGHT_KG, bmiCategory, bmiOf } from '@/lib/body'
import { parseAmount } from '@/lib/nutrition'
import type { BodyStats } from '@/lib/types'
import { saveBodyStats } from './actions'

/** The fields as typed. */
type Fields = Record<keyof BodyStats, string>

const textOf = (value: number | null) => (value === null ? '' : String(value))

/** Weight, height and age, with the BMI they give worked out live. */
export function BodyForm({ body, onSaved }: { body: BodyStats; onSaved: () => void }) {
  const [fields, setFields] = useState<Fields>({ weight: textOf(body.weight), height: textOf(body.height), age: textOf(body.age) })
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const weight = parseAmount(fields.weight)
  const height = parseAmount(fields.height)
  const inRange = (value: number | null, min: number, max: number): value is number =>
    value !== null && value >= min && value <= max
  const bmi =
    inRange(weight, MIN_WEIGHT_KG, MAX_WEIGHT_KG) && inRange(height, MIN_HEIGHT_CM, MAX_HEIGHT_CM) ? bmiOf(weight, height) : null

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const age = parseAmount(fields.age)
    if ([weight, height, age].some((amount) => Number.isNaN(amount))) return setError('Use numbers only, like 72.5 or 180.')
    if (age !== null && !Number.isInteger(age)) return setError('Enter your age in whole years.')

    setError(null)
    startTransition(async () => {
      const result = await saveBodyStats({ weight, height, age })
      if (!result.ok) return setError(result.error)
      onSaved()
    })
  }

  return (
    <form onSubmit={submit} className="min-h-0 space-y-4 overflow-y-auto pt-4">
      <p className="text-xs leading-relaxed text-muted">Your weight and height give your BMI. Leave a field empty to skip it.</p>
      <div className="grid grid-cols-3 gap-2">
        <AmountField label="Weight" unit="kg" value={fields.weight} onChange={(value) => setFields((f) => ({ ...f, weight: value }))} placeholder="72.5" />
        <AmountField label="Height" unit="cm" value={fields.height} onChange={(value) => setFields((f) => ({ ...f, height: value }))} placeholder="180" />
        <AmountField label="Age" unit="yrs" value={fields.age} onChange={(value) => setFields((f) => ({ ...f, age: value }))} placeholder="25" />
      </div>

      <div className="rounded-2xl border border-border bg-sunken p-4" aria-live="polite">
        {bmi === null ? (
          <p className="text-sm text-muted">Enter your weight and height to see your BMI.</p>
        ) : (
          <p className="flex items-baseline gap-2">
            <span className="font-display text-3xl font-bold leading-none tabular-nums">{bmi.toFixed(1)}</span>
            <span className="text-sm text-muted">BMI, {bmiCategory(bmi).label.toLowerCase()}</span>
          </p>
        )}
      </div>

      {error && <Alert>{error}</Alert>}

      <SubmitButton pending={pending} pendingLabel="Saving…">
        Save details
      </SubmitButton>
    </form>
  )
}
