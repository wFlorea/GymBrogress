'use client'

import { useState, useTransition, type FormEvent } from 'react'
import { saveGoals } from '@/app/dashboard/actions'
import { AmountField } from '@/components/ui/AmountField'
import { Alert } from '@/components/ui/Card'
import { SubmitButton } from '@/components/ui/SubmitButton'
import { goalWeightText } from '@/lib/body'
import { formatKg } from '@/lib/format'
import {
  FAT_SHARE,
  MACROS,
  MIN_CALORIE_GOAL,
  PROTEIN_PER_KG,
  caloriesFromMacros,
  macrosForCalories,
  parseAmount,
} from '@/lib/nutrition'
import type { Nutrition, NutritionGoals } from '@/lib/types'

type Macro = Exclude<keyof Nutrition, 'calories'>
/** The fields as typed. */
type Fields = Record<keyof Nutrition | 'goalWeight', string>

const textOf = (value: number | null) => (value === null ? '' : String(value))

/**
 * The goal weight and the daily calorie and macro goals. When the user's weight is known, typing the calories fills in
 * the macros (see `macrosForCalories`); changing a macro adds the calories back up from the macros.
 */
export function GoalsForm({
  weight,
  goalWeight,
  goals,
  onSaved,
}: {
  /** The user's weight in kg, for the protein. */
  weight: number | null
  goalWeight: number | null
  goals: NutritionGoals
  onSaved: () => void
}) {
  const [fields, setFields] = useState<Fields>({
    goalWeight: textOf(goalWeight),
    calories: textOf(goals.calories),
    protein: textOf(goals.protein),
    carbs: textOf(goals.carbs),
    fat: textOf(goals.fat),
  })
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const target = parseAmount(fields.goalWeight)

  function changeCalories(value: string) {
    const calories = parseAmount(value)
    // Below a real goal (while it's still being typed, say) the macros stay as they are.
    if (weight === null || calories === null || Number.isNaN(calories) || calories < MIN_CALORIE_GOAL) {
      return setFields((f) => ({ ...f, calories: value }))
    }
    const { protein, carbs, fat } = macrosForCalories(calories, weight)
    setFields((f) => ({ ...f, calories: value, protein: String(protein), carbs: String(carbs), fat: String(fat) }))
  }

  function changeMacro(key: Macro, value: string) {
    setFields((f) => {
      const next = { ...f, [key]: value }
      const [protein, carbs, fat] = MACROS.map((macro) => parseAmount(next[macro.key]))
      // Calories follow once the macros are numbers; an empty one counts as 0.
      if ([protein, carbs, fat].some((amount) => Number.isNaN(amount))) return next
      if (protein === null && carbs === null && fat === null) return next
      return { ...next, calories: String(caloriesFromMacros({ protein: protein ?? 0, carbs: carbs ?? 0, fat: fat ?? 0 })) }
    })
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const [calories, protein, carbs, fat] = (['calories', 'protein', 'carbs', 'fat'] as const).map((key) =>
      parseAmount(fields[key])
    )
    if ([target, calories, protein, carbs, fat].some((amount) => Number.isNaN(amount))) {
      return setError('Use numbers only, like 2200 or 72.5.')
    }

    const round = (value: number | null) => (value === null ? null : Math.round(value))
    const next: NutritionGoals = { calories: round(calories), protein: round(protein), carbs: round(carbs), fat: round(fat) }
    setError(null)
    startTransition(async () => {
      const result = await saveGoals(target, next)
      if (!result.ok) return setError(result.error)
      onSaved()
    })
  }

  return (
    <form onSubmit={submit} className="min-h-0 space-y-4 overflow-y-auto pt-4">
      <p className="text-xs leading-relaxed text-muted">What you&apos;re aiming for. Leave a field empty to skip that goal.</p>

      <div>
        <AmountField
          label="Goal weight"
          unit="kg"
          value={fields.goalWeight}
          onChange={(goalWeight) => setFields((f) => ({ ...f, goalWeight }))}
          placeholder={weight === null ? 'e.g. 70' : String(weight)}
        />
        {weight !== null && (
          <p className="mt-1.5 text-[11px] text-muted">
            You weigh {formatKg(weight)} now
            {target !== null && !Number.isNaN(target) && target > 0 && `: ${goalWeightText(weight, target)}`}.
          </p>
        )}
      </div>

      <div className="space-y-3 border-t border-white/5 pt-4">
        <h3 className="text-sm font-semibold text-white">Each day</h3>
        <AmountField label="Calories" unit="kcal" value={fields.calories} onChange={changeCalories} placeholder="e.g. 2200" />
        <div className="grid grid-cols-3 gap-2">
          {MACROS.map(({ key, label }) => (
            <AmountField key={key} label={label} unit="g" value={fields[key]} onChange={(value) => changeMacro(key, value)} />
          ))}
        </div>
        <p className="text-[11px] leading-relaxed text-muted">
          {weight === null
            ? 'Add your weight on the dashboard and the macros fill in from your calories.'
            : `Protein is ${PROTEIN_PER_KG} g per kg you weigh, fat is ${FAT_SHARE * 100}% of the calories and carbs are the rest. Change a macro and the calories follow.`}
        </p>
      </div>

      {error && <Alert>{error}</Alert>}

      <SubmitButton pending={pending} pendingLabel="Saving…">
        Save goals
      </SubmitButton>
    </form>
  )
}
