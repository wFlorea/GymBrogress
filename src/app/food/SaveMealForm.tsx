'use client'

import { useState, useTransition, type FormEvent } from 'react'
import { Alert } from '@/components/ui/Card'
import { SubmitButton } from '@/components/ui/SubmitButton'
import { inputStyles } from '@/components/ui/styles'
import { formatKcal } from '@/lib/format'
import { MAX_SAVED_MEAL_FOODS, MAX_SAVED_MEAL_NAME_LENGTH, MEAL_LABELS, sumNutrition } from '@/lib/nutrition'
import type { FoodEntry, Meal } from '@/lib/types'
import { saveMeal } from './actions'

/** Saves the foods of a logged meal under a name, so they can be logged again in one tap from the add-food sheet. */
export function SaveMealForm({ meal, entries, onSaved }: { meal: Meal; entries: FoodEntry[]; onSaved: () => void }) {
  const [name, setName] = useState(MEAL_LABELS[meal])
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const tooMany = entries.length > MAX_SAVED_MEAL_FOODS

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    const foods = entries.map(({ name, calories, protein, carbs, fat, grams }) => ({ name, calories, protein, carbs, fat, grams }))
    startTransition(async () => {
      const result = await saveMeal(name, foods)
      if (!result.ok) return setError(result.error)
      onSaved()
    })
  }

  return (
    <form onSubmit={submit} className="min-h-0 space-y-4 overflow-y-auto pt-4">
      <label className="block space-y-1.5">
        <span className="text-xs font-semibold text-muted">Name</span>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          maxLength={MAX_SAVED_MEAL_NAME_LENGTH}
          placeholder="e.g. Usual breakfast"
          autoComplete="off"
          className={inputStyles}
        />
      </label>

      <div className="rounded-xl bg-sunken px-4 py-3">
        <ul className="space-y-1.5 text-sm">
          {entries.map((entry) => (
            <li key={entry.id} className="flex justify-between gap-3">
              <span className="min-w-0 truncate">{entry.name}</span>
              <span className="shrink-0 tabular-nums text-muted">{formatKcal(entry.calories)}</span>
            </li>
          ))}
        </ul>
        <p className="mt-2.5 flex justify-between gap-3 border-t border-white/5 pt-2.5 text-sm font-bold">
          <span>Total</span>
          <span className="tabular-nums">{formatKcal(sumNutrition(entries).calories)}</span>
        </p>
      </div>
      <p className="text-[11px] leading-relaxed text-muted">
        {tooMany
          ? `A saved meal can hold up to ${MAX_SAVED_MEAL_FOODS} foods.`
          : 'Find it at the top of the add-food sheet, and log all of it in one tap.'}
      </p>

      {error && <Alert>{error}</Alert>}

      <SubmitButton pending={pending} pendingLabel="Saving…">
        Save meal
      </SubmitButton>
    </form>
  )
}
