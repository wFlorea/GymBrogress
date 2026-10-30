'use client'

import { useState } from 'react'
import { findCommonFood } from '@/lib/foods-data'
import { nutritionFor, per100gOf } from '@/lib/nutrition'
import type { CatalogFood, FoodEntry, FoodItem, IsoDate, Meal, SavedMeal } from '@/lib/types'
import { FoodForm } from './FoodForm'
import { FoodSearch } from './FoodSearch'
import { PortionForm } from './PortionForm'
import { SavedMealList } from './SavedMealList'

/** Where the sheet is: searching, picking an amount of a database food, or typing a food in by hand. */
type View =
  | { step: 'search' }
  | { step: 'portion'; food: CatalogFood; grams?: number }
  | { step: 'manual'; prefill?: FoodItem; name?: string }

/** A logged food as a database food again, so its amount can be changed. */
function catalogFoodOf(food: FoodItem & { grams: number }): CatalogFood {
  // The common food it came from has the exact values; the totals do for the rest.
  const common = findCommonFood(food.name)
  if (common && Math.abs(nutritionFor(common.per100g, food.grams).calories - food.calories) <= 1) return common
  return { id: `logged-${food.name}`, name: food.name, per100g: per100gOf(food, food.grams) }
}

function viewOf(food: FoodItem): View {
  return food.grams === null
    ? { step: 'manual', prefill: food }
    : { step: 'portion', food: catalogFoodOf({ ...food, grams: food.grams }), grams: food.grams }
}

/** The add-food sheet: search the food database, then pick how much; or edit a logged food. */
export function FoodSheet({
  date,
  meal,
  entry,
  recentFoods,
  savedMeals,
  onSaved,
  onDelete,
}: {
  date: IsoDate
  meal: Meal
  entry?: FoodEntry
  recentFoods: FoodItem[]
  savedMeals: SavedMeal[]
  onSaved: (id: string | null) => void
  onDelete?: () => void
}) {
  const [view, setView] = useState<View>(entry ? viewOf(entry) : { step: 'search' })
  const [query, setQuery] = useState('')
  const back = entry ? undefined : () => setView({ step: 'search' })

  if (view.step === 'portion') {
    return (
      <PortionForm
        date={date}
        meal={meal}
        food={view.food}
        entry={entry}
        initialGrams={view.grams}
        onBack={back}
        onSaved={onSaved}
        onDelete={onDelete}
      />
    )
  }

  if (view.step === 'manual') {
    return (
      <FoodForm
        date={date}
        meal={meal}
        entry={entry}
        prefill={view.prefill}
        initialName={view.name}
        onBack={back}
        onSaved={onSaved}
        onDelete={onDelete}
      />
    )
  }

  return (
    <FoodSearch
      query={query}
      onQueryChange={setQuery}
      recentFoods={recentFoods}
      saved={savedMeals.length > 0 && <SavedMealList savedMeals={savedMeals} date={date} meal={meal} onLogged={() => onSaved(null)} />}
      onPick={(food) => setView({ step: 'portion', food })}
      onPickRecent={(food) => setView(viewOf(food))}
      onManual={() => setView({ step: 'manual', name: query.trim() })}
    />
  )
}
