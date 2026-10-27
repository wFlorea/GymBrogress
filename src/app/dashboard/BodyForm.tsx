'use client'

import { useState, useTransition, type FormEvent } from 'react'
import { AmountField } from '@/components/ui/AmountField'
import { Alert } from '@/components/ui/Card'
import { SubmitButton } from '@/components/ui/SubmitButton'
import {
  ACTIVITY_LEVELS,
  MAX_AGE,
  MAX_HEIGHT_CM,
  MAX_WEIGHT_KG,
  MIN_AGE,
  MIN_HEIGHT_CM,
  MIN_WEIGHT_KG,
  SEXES,
  bmiCategory,
  bmiOf,
  maintenanceCaloriesFor,
} from '@/lib/body'
import { formatKcal } from '@/lib/format'
import { MACROS, WEIGHT_PLANS, parseAmount, recommendedGoals } from '@/lib/nutrition'
import type { ActivityLevel, BodyStats, Nutrition, PlanPace, Sex, WeightPlan } from '@/lib/types'
import { saveBodyStats } from './actions'
import { BodyFatDial } from './BodyFatDial'

/** The fields as typed. */
type Fields = Record<'weight' | 'height' | 'age', string>

const textOf = (value: number | null) => (value === null ? '' : String(value))

/** The amount when it's a number from `min` to `max`, else null. */
const withinRange = (value: number | null, min: number, max: number) =>
  value !== null && value >= min && value <= max ? value : null

/**
 * Sex, weight, height and age, with the BMI they give worked out live, then the body fat and the activity level, and
 * the daily calories and macros all of it gives (saved as the daily goals).
 */
export function BodyForm({
  body,
  weightPlan,
  planPace,
  onSaved,
}: {
  body: BodyStats
  /** The plan the daily goals follow; it's changed in the goals form. */
  weightPlan: WeightPlan
  planPace: PlanPace
  onSaved: () => void
}) {
  const [fields, setFields] = useState<Fields>({ weight: textOf(body.weight), height: textOf(body.height), age: textOf(body.age) })
  const [sex, setSex] = useState(body.sex)
  const [bodyFat, setBodyFat] = useState(body.bodyFat)
  const [activity, setActivity] = useState(body.activity)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const weight = parseAmount(fields.weight)
  const height = parseAmount(fields.height)
  const age = parseAmount(fields.age)
  const validWeight = withinRange(weight, MIN_WEIGHT_KG, MAX_WEIGHT_KG)
  const validHeight = withinRange(height, MIN_HEIGHT_CM, MAX_HEIGHT_CM)
  const validAge = age !== null && Number.isInteger(age) ? withinRange(age, MIN_AGE, MAX_AGE) : null
  const bmi = validWeight !== null && validHeight !== null ? bmiOf(validWeight, validHeight) : null
  const stats = { weight: validWeight, height: validHeight, age: validAge, sex, bodyFat, activity }
  const maintenance = maintenanceCaloriesFor(stats)
  const goals = recommendedGoals(stats, weightPlan, planPace)
  const missing = [
    validWeight === null && 'weight',
    validHeight === null && 'height',
    validAge === null && 'age',
    sex === null && 'sex',
    activity === null && 'activity level',
  ].filter((name) => name !== false)

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if ([weight, height, age].some((amount) => Number.isNaN(amount))) return setError('Use numbers only, like 72.5 or 180.')
    if (age !== null && !Number.isInteger(age)) return setError('Enter your age in whole years.')

    setError(null)
    startTransition(async () => {
      const result = await saveBodyStats({ weight, height, age, sex, bodyFat, activity })
      if (!result.ok) return setError(result.error)
      onSaved()
    })
  }

  return (
    <form onSubmit={submit} className="min-h-0 space-y-4 overflow-y-auto pt-4">
      <p className="text-xs leading-relaxed text-muted">
        Your weight and height give your BMI; with your age, sex and activity level they give your daily calories. Leave a
        field empty to skip it.
      </p>
      <SexPicker sex={sex} onChange={setSex} />
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
      <DailyCalories goals={goals} maintenance={maintenance} weightPlan={weightPlan} planPace={planPace} missing={missing} />

      {error && <Alert>{error}</Alert>}

      <SubmitButton pending={pending} pendingLabel="Saving…">
        Save details
      </SubmitButton>
    </form>
  )
}

function SexPicker({ sex, onChange }: { sex: Sex | null; onChange: (sex: Sex) => void }) {
  return (
    <fieldset>
      <legend className="mb-1.5 text-xs font-semibold text-muted">Sex</legend>
      <div className="grid grid-cols-2 gap-2">
        {SEXES.map(({ key, label }) => {
          const selected = sex === key
          return (
            <label
              key={key}
              className={`press flex cursor-pointer items-center justify-center rounded-xl border px-3.5 py-2.5 text-sm font-semibold [--press-scale:0.98] has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-primary/60 ${
                selected ? 'border-primary bg-primary/10' : 'border-border bg-sunken hover:border-zinc-600'
              }`}
            >
              <input type="radio" name="sex" value={key} checked={selected} onChange={() => onChange(key)} className="sr-only" />
              {label}
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}

/** The daily calories and macros from the stats as typed and the weight plan, or what's still missing for them. */
function DailyCalories({
  goals,
  maintenance,
  weightPlan,
  planPace,
  missing,
}: {
  goals: Nutrition | null
  maintenance: number | null
  weightPlan: WeightPlan
  planPace: PlanPace
  missing: string[]
}) {
  const plan = WEIGHT_PLANS.find((option) => option.key === weightPlan)
  return (
    <div className="rounded-2xl border border-border bg-sunken p-4" aria-live="polite">
      {goals === null ? (
        <p className="text-sm text-muted">
          Add your {new Intl.ListFormat('en-GB').format(missing)} to see your daily calories.
        </p>
      ) : (
        <>
          <p className="flex items-baseline gap-2">
            <span className="font-display text-3xl font-bold leading-none tabular-nums">
              {goals.calories.toLocaleString('en-GB')}
            </span>
            <span className="text-sm text-muted">kcal a day</span>
          </p>
          <p className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs">
            {MACROS.map(({ key, label, text }) => (
              <span key={key}>
                <span className={`font-semibold tabular-nums ${text}`}>{goals[key]} g</span>{' '}
                <span className="text-muted">{label.toLowerCase()}</span>
              </span>
            ))}
          </p>
          <p className="mt-2 text-[11px] leading-relaxed text-muted">
            {weightPlan === 'maintain' || maintenance === null
              ? 'Your maintenance: your BMR times your activity level, to the nearest 100 kcal.'
              : `Your ${plan?.label.toLowerCase()}: your maintenance of ${formatKcal(maintenance)} ${weightPlan === 'cut' ? 'less' : 'plus'} ${planPace}%, to the nearest 100 kcal.`}{' '}
            Saving sets these as your daily goals; you can change them and your plan under Goal.
          </p>
        </>
      )}
    </div>
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
