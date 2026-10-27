'use client'

import { useState, useTransition, type FormEvent } from 'react'
import { ChevronLeft, Trash2 } from 'lucide-react'
import { Alert } from '@/components/ui/Card'
import { SubmitButton } from '@/components/ui/SubmitButton'
import { buttonStyles, inputStyles } from '@/components/ui/styles'
import { formatGrams, formatKcal } from '@/lib/format'
import { MACROS, MAX_FOOD_GRAMS, MAX_FOOD_NAME_LENGTH, MEAL_LABELS, nutritionFor, parseAmount } from '@/lib/nutrition'
import type { CatalogFood, FoodEntry, FoodItem, IsoDate, Meal } from '@/lib/types'
import { addFoodEntry, updateFoodEntry } from './actions'
import { MealPicker } from './FoodForm'

/** Logs a food from the database by weight, with its calories and macros worked out live. */
export function PortionForm({
  date,
  meal: initialMeal,
  food,
  entry,
  initialGrams,
  onBack,
  onSaved,
  onDelete,
}: {
  date: IsoDate
  meal: Meal
  food: CatalogFood
  /** The logged food being edited. */
  entry?: FoodEntry
  /** The weight to start from; otherwise 100 g. */
  initialGrams?: number
  onBack?: () => void
  onSaved: (id: string | null) => void
  onDelete?: () => void
}) {
  const [meal, setMeal] = useState(initialMeal)
  const [amount, setAmount] = useState(String(initialGrams ?? 100))
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const parsed = parseAmount(amount)
  const grams = parsed === null || Number.isNaN(parsed) ? null : Math.round(parsed * 10) / 10
  const nutrition = nutritionFor(food.per100g, grams ?? 0)

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (grams === null || grams <= 0) return setError('Enter how many grams you had, like 150 or 72.5.')
    if (grams > MAX_FOOD_GRAMS) return setError(`That's over ${MAX_FOOD_GRAMS.toLocaleString('en-GB')} g. Log it in smaller parts.`)

    const name = food.brand ? `${food.name} (${food.brand})` : food.name
    const item: FoodItem = { name: name.slice(0, MAX_FOOD_NAME_LENGTH).trim(), ...nutrition, grams }
    setError(null)
    startTransition(async () => {
      const result = entry ? await updateFoodEntry(entry.id, meal, item) : await addFoodEntry(date, meal, item)
      if (!result.ok) return setError(result.error)
      onSaved(result.data ?? null)
    })
  }

  return (
    <form onSubmit={submit} className="min-h-0 space-y-4 overflow-y-auto pt-4">
      <div className="flex items-center gap-3">
        {onBack && (
          <button type="button" onClick={onBack} aria-label="Back to search" className={buttonStyles.icon}>
            <ChevronLeft size={18} />
          </button>
        )}
        <div className="min-w-0">
          <p className="truncate font-semibold text-white">{food.name}</p>
          <p className="truncate text-xs text-muted">
            {food.brand && `${food.brand}, `}
            {formatKcal(food.per100g.calories)} per 100 g
          </p>
        </div>
      </div>

      <label className="block">
        <span className="mb-1.5 block text-xs font-semibold text-muted">Amount</span>
        <span className="relative block">
          <input
            type="text"
            inputMode="decimal"
            autoComplete="off"
            autoFocus={!entry}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            onFocus={(e) => e.target.select()}
            className={`${inputStyles} pr-16 text-base font-semibold tabular-nums`}
          />
          <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm text-muted">grams</span>
        </span>
      </label>

      <div className="rounded-2xl border border-border bg-sunken p-4" aria-live="polite">
        <p className="flex items-baseline gap-1.5">
          <span className="font-display text-3xl font-bold leading-none tabular-nums">
            {nutrition.calories.toLocaleString('en-GB')}
          </span>
          <span className="text-sm text-muted">kcal{grams !== null && grams > 0 && ` in ${formatGrams(grams)}`}</span>
        </p>
        <dl className="mt-4 grid grid-cols-3 gap-3">
          {MACROS.map(({ key, label, bar }) => (
            <div key={key} className="min-w-0">
              <dt className="flex items-center gap-1.5 text-[11px] text-muted">
                <span className={`h-2 w-2 shrink-0 rounded-full ${bar}`} aria-hidden />
                {label}
              </dt>
              <dd className="mt-0.5 text-sm font-bold tabular-nums">{formatGrams(nutrition[key])}</dd>
            </div>
          ))}
        </dl>
      </div>

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
