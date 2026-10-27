'use client'

import { useState, useTransition, type FormEvent } from 'react'
import { AmountField } from '@/components/ui/AmountField'
import { Alert } from '@/components/ui/Card'
import { SubmitButton } from '@/components/ui/SubmitButton'
import {
  ACTIVITY_LEVELS,
  MAX_HEIGHT_CM,
  MAX_WEIGHT_KG,
  MIN_HEIGHT_CM,
  MIN_WEIGHT_KG,
  bmiCategory,
  bmiOf,
} from '@/lib/body'
import { parseAmount } from '@/lib/nutrition'
import type { ActivityLevel, BodyStats } from '@/lib/types'
import { saveBodyStats } from './actions'
import { BodyFatDial } from './BodyFatDial'

/** The fields as typed. */
type Fields = Record<'weight' | 'height' | 'age', string>

const textOf = (value: number | null) => (value === null ? '' : String(value))

/** Weight, height and age, with the BMI they give worked out live, then the body fat and the activity level. */
export function BodyForm({ body, onSaved }: { body: BodyStats; onSaved: () => void }) {
  const [fields, setFields] = useState<Fields>({ weight: textOf(body.weight), height: textOf(body.height), age: textOf(body.age) })
  const [bodyFat, setBodyFat] = useState(body.bodyFat)
  const [activity, setActivity] = useState(body.activity)
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
      const result = await saveBodyStats({ weight, height, age, bodyFat, activity })
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

      <BodyFatDial value={bodyFat} onChange={setBodyFat} />
      <ActivityPicker activity={activity} onChange={setActivity} />

      {error && <Alert>{error}</Alert>}

      <SubmitButton pending={pending} pendingLabel="Saving…">
        Save details
      </SubmitButton>
    </form>
  )
}

function ActivityPicker({ activity, onChange }: { activity: ActivityLevel | null; onChange: (activity: ActivityLevel) => void }) {
  return (
    <fieldset>
      <legend className="mb-1.5 text-xs font-semibold text-muted">Activity level</legend>
      <div className="space-y-1.5">
        {ACTIVITY_LEVELS.map(({ key, label, description }) => {
          const selected = activity === key
          return (
            <label
              key={key}
              className={`press flex cursor-pointer items-center gap-3 rounded-xl border px-3.5 py-2.5 [--press-scale:0.98] has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-primary/60 ${
                selected ? 'border-primary bg-primary/10' : 'border-border bg-sunken hover:border-zinc-600'
              }`}
            >
              <input
                type="radio"
                name="activity"
                value={key}
                checked={selected}
                onChange={() => onChange(key)}
                className="sr-only"
              />
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold">{label}</span>
                <span className="block text-[11px] text-muted">{description}</span>
              </span>
              <span
                className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 ${
                  selected ? 'border-primary' : 'border-zinc-600'
                }`}
                aria-hidden
              >
                {selected && <span className="h-1.5 w-1.5 rounded-full bg-primary" />}
              </span>
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}
