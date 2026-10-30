'use client'

import { useOptimistic, useState, useTransition } from 'react'
import { Loader2, Trash2 } from 'lucide-react'
import { Alert } from '@/components/ui/Card'
import { sumNutrition } from '@/lib/nutrition'
import type { IsoDate, Meal, SavedMeal } from '@/lib/types'
import { deleteSavedMeal, logSavedMeal } from './actions'
import { MacroLine } from './MacroLine'

/** The user's saved meals in the add-food sheet: one tap logs every food in it. */
export function SavedMealList({
  savedMeals,
  date,
  meal,
  onLogged,
}: {
  savedMeals: SavedMeal[]
  date: IsoDate
  meal: Meal
  onLogged: () => void
}) {
  const [shown, removeShown] = useOptimistic(savedMeals, (state, id: string) => state.filter((saved) => saved.id !== id))
  // A delete needs a second tap, so a slip of the thumb doesn't lose a meal.
  const [confirming, setConfirming] = useState<string | null>(null)
  const [logging, setLogging] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLogging, startLogging] = useTransition()
  const [, startDeleting] = useTransition()

  function log(saved: SavedMeal) {
    setError(null)
    setConfirming(null)
    setLogging(saved.id)
    startLogging(async () => {
      const result = await logSavedMeal(saved.id, date, meal)
      if (!result.ok) return setError(result.error)
      onLogged()
    })
  }

  function remove(saved: SavedMeal) {
    if (confirming !== saved.id) return setConfirming(saved.id)
    setError(null)
    setConfirming(null)
    startDeleting(async () => {
      removeShown(saved.id)
      const result = await deleteSavedMeal(saved.id)
      if (!result.ok) setError(result.error)
    })
  }

  if (shown.length === 0) return null

  return (
    <section aria-label="Saved meals">
      <h3 className="mb-1 px-1 text-xs font-semibold text-muted">Saved meals</h3>
      {error && <Alert>{error}</Alert>}
      <ul className="-mx-1">
        {shown.map((saved) => {
          const totals = sumNutrition(saved.foods)
          const busy = isLogging && logging === saved.id
          return (
            <li key={saved.id} className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => log(saved)}
                disabled={isLogging}
                aria-busy={busy}
                className="flex min-w-0 flex-1 items-center gap-3 rounded-xl px-2 py-2.5 text-left transition-colors hover:bg-white/[0.04] disabled:opacity-60"
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-white">{saved.name}</span>
                  <MacroLine food={totals} />
                </span>
                <span className="shrink-0 text-right">
                  <span className="block text-sm font-bold tabular-nums">
                    {busy ? (
                      <Loader2 size={16} className="ml-auto animate-spin" aria-label="Logging" />
                    ) : (
                      <>
                        {totals.calories.toLocaleString('en-GB')}
                        <span className="ml-0.5 text-xs font-normal text-muted">kcal</span>
                      </>
                    )}
                  </span>
                  <span className="block text-[11px] text-muted">
                    {saved.foods.length} {saved.foods.length === 1 ? 'food' : 'foods'}
                  </span>
                </span>
              </button>
              <button
                type="button"
                onClick={() => remove(saved)}
                onBlur={() => setConfirming((id) => (id === saved.id ? null : id))}
                aria-label={confirming === saved.id ? `Tap again to delete ${saved.name}` : `Delete ${saved.name}`}
                className={`press flex h-9 shrink-0 items-center justify-center rounded-xl text-xs font-bold transition-colors [--press-scale:0.88] ${
                  confirming === saved.id ? 'bg-error/15 px-3 text-error' : 'w-9 text-muted hover:text-error'
                }`}
              >
                {confirming === saved.id ? 'Delete?' : <Trash2 size={16} />}
              </button>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
