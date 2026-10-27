'use client'

import { useState, useTransition, type FormEvent } from 'react'
import { saveGoals } from '@/app/dashboard/actions'
import { PaceDial } from '@/components/PaceDial'
import { PlanSlider } from '@/components/PlanSlider'
import { AmountField } from '@/components/ui/AmountField'
import { Alert } from '@/components/ui/Card'
import { SubmitButton } from '@/components/ui/SubmitButton'
import { goalWeightText, maintenanceCaloriesFor } from '@/lib/body'
import { formatKcal, formatKg } from '@/lib/format'
import {
  FAT_SHARE,
  MACROS,
  MIN_CALORIE_GOAL,
  PROTEIN_PER_KG,
  WEIGHT_PLANS,
  caloriesFromMacros,
  goalsForCalories,
  macrosForCalories,
  parseAmount,
  planCalories,
  weeklyWeightChange,
} from '@/lib/nutrition'
import type { BodyStats, Nutrition, NutritionGoals, PlanPace, WeightPlan } from '@/lib/types'

type Macro = Exclude<keyof Nutrition, 'calories'>
/** The fields as typed. */
type Fields = Record<keyof Nutrition | 'goalWeight', string>

const textOf = (value: number | null) => (value === null ? '' : String(value))

/**
 * The goal weight, the weight plan, and the daily calorie and macro goals. Picking a plan or its pace fills in the
 * calories and macros from the user's maintenance (see `planCalories`). When the user's weight is known, typing the
 * calories fills in the macros (see `macrosForCalories`); changing a macro adds the calories back up from the macros.
 */
export function GoalsForm({
  body,
  goalWeight,
  goals,
  weightPlan,
  planPace,
  onSaved,
}: {
  /** The user's body stats: the weight for the protein, all of them for the maintenance calories. */
  body: BodyStats
  goalWeight: number | null
  goals: NutritionGoals
  weightPlan: WeightPlan
  planPace: PlanPace
  onSaved: () => void
}) {
  const [fields, setFields] = useState<Fields>({
    goalWeight: textOf(goalWeight),
    calories: textOf(goals.calories),
    protein: textOf(goals.protein),
    carbs: textOf(goals.carbs),
    fat: textOf(goals.fat),
  })
  const [plan, setPlan] = useState(weightPlan)
  const [pace, setPace] = useState(planPace)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const { weight } = body
  const target = parseAmount(fields.goalWeight)
  const maintenance = maintenanceCaloriesFor(body)
  const planned = maintenance === null ? null : planCalories(maintenance, plan, pace)

  /** Switches to a plan and pace, and fills in the calories and macros they give when the maintenance is known. */
  function choosePlan(nextPlan: WeightPlan, nextPace: PlanPace) {
    setPlan(nextPlan)
    setPace(nextPace)
    if (maintenance === null || weight === null) return
    const next = goalsForCalories(planCalories(maintenance, nextPlan, nextPace), weight)
    setFields((f) => ({
      ...f,
      calories: String(next.calories),
      protein: String(next.protein),
      carbs: String(next.carbs),
      fat: String(next.fat),
    }))
  }

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
      const result = await saveGoals(target, plan, pace, next)
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
        <PlanSlider value={plan} onChange={(next) => choosePlan(next, pace)} />
        {plan !== 'maintain' && (
          <PaceDial
            label={`${WEIGHT_PLANS.find((option) => option.key === plan)?.label} pace`}
            value={pace}
            onChange={(next) => choosePlan(plan, next)}
          >
            {maintenance !== null && planned !== null && (
              <p className="mt-3 text-center text-[11px] leading-relaxed text-muted">
                <span className="font-semibold text-white">{formatKcal(planned)} a day</span>,{' '}
                {formatKcal(Math.abs(planned - maintenance))} {plan === 'cut' ? 'under' : 'over'} your maintenance: about{' '}
                {Math.abs(weeklyWeightChange(planned, maintenance)).toLocaleString('en-GB', { maximumFractionDigits: 1 })} kg a
                week {plan === 'cut' ? 'off' : 'on'}.
              </p>
            )}
          </PaceDial>
        )}
        <p className="text-[11px] leading-relaxed text-muted">
          {maintenance === null
            ? 'Add your weight, height, age, sex and activity level on the dashboard, and your plan fills in the calories below.'
            : `Your maintenance is ${formatKcal(maintenance)} a day. Your plan fills in the calories below.`}
        </p>
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
