'use client'

import { useState, useTransition, type FormEvent } from 'react'
import { ChevronLeft, Trash2 } from 'lucide-react'
import { AmountField, Field } from '@/components/ui/AmountField'
import { Alert } from '@/components/ui/Card'
import { SubmitButton } from '@/components/ui/SubmitButton'
import { buttonStyles, inputStyles, pillStyles } from '@/components/ui/styles'
import { formatKcal } from '@/lib/format'
import { MACROS, MAX_FOOD_NAME_LENGTH, MEALS, MEAL_LABELS, caloriesFromMacros, parseAmount } from '@/lib/nutrition'
import type { FoodEntry, FoodItem, IsoDate, Meal, Nutrition } from '@/lib/types'
import { addFoodEntry, updateFoodEntry } from './actions'

/** The amount fields as typed. */
type Amounts = Record<keyof Nutrition, string>
type ParsedAmounts = Record<keyof Nutrition, number | null>

const NO_AMOUNTS: Amounts = { calories: '', protein: '', carbs: '', fat: '' }

function amountsOf(values: ParsedAmounts): Amounts {
  const text = (value: number | null) => (value === null ? '' : String(value))
  return { calories: text(values.calories), protein: text(values.protein), carbs: text(values.carbs), fat: text(values.fat) }
}

/** Empty fields are null; returns null when any field isn't a number. */
function parseAmounts(amounts: Amounts): ParsedAmounts | null {
  const parsed = {
    calories: parseAmount(amounts.calories),
    protein: parseAmount(amounts.protein),
    carbs: parseAmount(amounts.carbs),
    fat: parseAmount(amounts.fat),
  }
  return Object.values(parsed).some((value) => Number.isNaN(value)) ? null : parsed
}

/** Adds a food typed in by hand, or edits (and can delete) one logged that way. */
export function FoodForm({
  date,
  meal: initialMeal,
  entry,
  prefill,
  initialName = '',
  onBack,
  onSaved,
  onDelete,
}: {
  date: IsoDate
  meal: Meal
  entry?: FoodEntry
  /** A food to start from, like one logged before. */
  prefill?: FoodItem
  initialName?: string
  onBack?: () => void
  /** Called with the new entry's id after adding, or null after an edit. */
  onSaved: (id: string | null) => void
  onDelete?: () => void
}) {
  const start = entry ?? prefill
  const [meal, setMeal] = useState(initialMeal)
  const [name, setName] = useState(start?.name ?? initialName)
  const [amounts, setAmounts] = useState<Amounts>(start ? amountsOf(start) : NO_AMOUNTS)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const parsed = parseAmounts(amounts)
  const fromMacros = parsed ? caloriesFromMacros({ protein: parsed.protein ?? 0, carbs: parsed.carbs ?? 0, fat: parsed.fat ?? 0 }) : 0
  // Calories left empty are worked out from the macros.
  const countsFromMacros = parsed?.calories === null && fromMacros > 0

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!parsed) return setError('Use numbers only, like 120 or 12.5.')
    if (parsed.calories === null && !countsFromMacros) return setError('Enter the calories, or the protein, carbs and fat.')

    const food: FoodItem = {
      name,
      calories: parsed.calories ?? fromMacros,
      protein: parsed.protein ?? 0,
      carbs: parsed.carbs ?? 0,
      fat: parsed.fat ?? 0,
      grams: null,
    }
    setError(null)
    startTransition(async () => {
      const result = entry ? await updateFoodEntry(entry.id, meal, food) : await addFoodEntry(date, meal, food)
      if (!result.ok) return setError(result.error)
      onSaved(result.data ?? null)
    })
  }

  return (
    <form onSubmit={submit} className="min-h-0 space-y-4 overflow-y-auto pt-4">
      <div className="flex items-end gap-3">
        {onBack && (
          <button type="button" onClick={onBack} aria-label="Back to search" className={`${buttonStyles.icon} mb-1.5`}>
            <ChevronLeft size={18} />
          </button>
        )}
        <div className="min-w-0 flex-1">
          <Field label="Food">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              maxLength={MAX_FOOD_NAME_LENGTH}
              placeholder="e.g. Chicken and rice"
              autoComplete="off"
              className={inputStyles}
            />
          </Field>
        </div>
      </div>

      <AmountField
        label="Calories"
        unit="kcal"
        value={amounts.calories}
        onChange={(calories) => setAmounts((a) => ({ ...a, calories }))}
        placeholder={countsFromMacros ? String(fromMacros) : '0'}
      />
      <div className="grid grid-cols-3 gap-2">
        {MACROS.map(({ key, label }) => (
          <AmountField
            key={key}
            label={label}
            unit="g"
            value={amounts[key]}
            onChange={(value) => setAmounts((a) => ({ ...a, [key]: value }))}
            placeholder="0"
          />
        ))}
      </div>
      <p className="text-[11px] leading-relaxed text-muted">
        {countsFromMacros
          ? `With calories left empty, this counts as ${formatKcal(fromMacros)} from the macros.`
          : 'Leave calories empty to count them from the macros.'}
      </p>

      <MealPicker meal={meal} onChange={setMeal} />

      {error && <Alert>{error}</Alert>}

      <div className="flex gap-2 pt-1">
        {onDelete && (
          <button type="button" onClick={onDelete} aria-label="Delete food" className={`${buttonStyles.danger} shrink-0 px-5`}>
            <Trash2 size={18} />
          </button>
        )}
        <SubmitButton pending={pending} pendingLabel="Saving…">
          {entry ? 'Save changes' : `Add to ${MEAL_LABELS[meal]}`}
        </SubmitButton>
      </div>
    </form>
  )
}

/** Which meal a food goes in. */
export function MealPicker({ meal, onChange }: { meal: Meal; onChange: (meal: Meal) => void }) {
  return (
    <div>
      <p className="mb-1.5 text-xs font-semibold text-muted">Meal</p>
      <div className="flex flex-wrap gap-1.5" role="group" aria-label="Meal">
        {MEALS.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => onChange(option)}
            aria-pressed={meal === option}
            className={pillStyles(meal === option)}
          >
            {MEAL_LABELS[option]}
          </button>
        ))}
      </div>
    </div>
  )
}
