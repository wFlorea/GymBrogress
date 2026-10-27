'use client'

import { useOptimistic, useState, useTransition } from 'react'
import { Plus, Target } from 'lucide-react'
import { GoalsForm } from '@/components/GoalsForm'
import { Alert, Card, cardStyles } from '@/components/ui/Card'
import { Meter } from '@/components/ui/Meter'
import { Modal } from '@/components/ui/Modal'
import { buttonStyles } from '@/components/ui/styles'
import { formatGrams, formatKcal } from '@/lib/format'
import { MACROS, MEALS, MEAL_EMOJIS, MEAL_LABELS, sumNutrition } from '@/lib/nutrition'
import type { FoodEntry, FoodItem, IsoDate, Meal, Nutrition, NutritionGoals } from '@/lib/types'
import { deleteFoodEntry } from './actions'
import { FoodSheet } from './FoodSheet'
import { MacroLine } from './MacroLine'

/** What the food sheet is open for: adding to a meal, or editing a logged food. */
type Sheet = { meal: Meal; entry?: FoodEntry }

export function FoodClient({
  date,
  entries,
  recentFoods,
  goals,
  weight,
  goalWeight,
}: {
  date: IsoDate
  entries: FoodEntry[]
  recentFoods: FoodItem[]
  goals: NutritionGoals
  /** The user's weight and goal weight in kg, for the goals form. */
  weight: number | null
  goalWeight: number | null
}) {
  // `sheet` outlives `sheetOpen` so the sheet keeps its content while it slides away.
  const [sheet, setSheet] = useState<Sheet | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [goalsOpen, setGoalsOpen] = useState(false)
  // Bumped on every open, so the forms start fresh.
  const [formKey, setFormKey] = useState(0)
  const [error, setError] = useState<string | null>(null)
  // The food added last, so its row floats in.
  const [justAdded, setJustAdded] = useState<string | null>(null)
  const [, startTransition] = useTransition()
  const [optimisticEntries, removeEntry] = useOptimistic(entries, (state, id: string) => state.filter((e) => e.id !== id))

  function openSheet(next: Sheet) {
    setError(null)
    setSheet(next)
    setFormKey((key) => key + 1)
    setSheetOpen(true)
  }

  function openGoals() {
    setFormKey((key) => key + 1)
    setGoalsOpen(true)
  }

  function remove(entry: FoodEntry) {
    setSheetOpen(false)
    setError(null)
    startTransition(async () => {
      removeEntry(entry.id)
      const result = await deleteFoodEntry(entry.id)
      if (!result.ok) setError(result.error)
    })
  }

  return (
    <div className="space-y-4">
      {error && <Alert>{error}</Alert>}

      <DailySummary totals={sumNutrition(optimisticEntries)} goals={goals} onEditGoals={openGoals} />

      {MEALS.map((meal) => (
        <MealCard
          key={meal}
          meal={meal}
          entries={optimisticEntries.filter((entry) => entry.meal === meal)}
          justAdded={justAdded}
          onAdd={() => openSheet({ meal })}
          onEdit={(entry) => openSheet({ meal: entry.meal, entry })}
        />
      ))}

      <Modal open={sheetOpen} onClose={() => setSheetOpen(false)} title={sheet?.entry ? 'Edit food' : 'Add food'}>
        {sheet && (
          <FoodSheet
            key={formKey}
            date={date}
            meal={sheet.meal}
            entry={sheet.entry}
            recentFoods={recentFoods}
            onSaved={(id) => {
              if (id) setJustAdded(id)
              setSheetOpen(false)
            }}
            onDelete={sheet.entry ? () => remove(sheet.entry!) : undefined}
          />
        )}
      </Modal>

      <Modal open={goalsOpen} onClose={() => setGoalsOpen(false)} title="Your goals">
        <GoalsForm key={formKey} weight={weight} goalWeight={goalWeight} goals={goals} onSaved={() => setGoalsOpen(false)} />
      </Modal>
    </div>
  )
}

/** Calories eaten against the goal, then each macro. */
function DailySummary({ totals, goals, onEditGoals }: { totals: Nutrition; goals: NutritionGoals; onEditGoals: () => void }) {
  const calorieGoal = goals.calories
  const left = calorieGoal === null ? null : calorieGoal - totals.calories
  const hasGoals = Object.values(goals).some((goal) => goal !== null)

  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-semibold">Calories</h2>
          <p className="text-xs text-muted">
            {left === null
              ? 'Set a goal to see what you have left'
              : left >= 0
                ? `${formatKcal(left)} left`
                : `${formatKcal(-left)} over your goal`}
          </p>
        </div>
        <button type="button" onClick={onEditGoals} className={`${buttonStyles.chip} shrink-0 whitespace-nowrap`}>
          <Target size={13} /> {hasGoals ? 'Goals' : 'Set goals'}
        </button>
      </div>

      <p className="mt-4 flex items-baseline gap-1.5">
        <span className="font-display text-[2.5rem] font-bold leading-none tabular-nums">
          {totals.calories.toLocaleString('en-GB')}
        </span>
        <span className="text-sm text-muted">{calorieGoal === null ? 'kcal' : `/ ${formatKcal(calorieGoal)}`}</span>
      </p>
      {calorieGoal !== null && (
        <Meter
          value={totals.calories}
          max={calorieGoal}
          label="Calories"
          valueText={`${formatKcal(totals.calories)} of ${formatKcal(calorieGoal)}`}
          className="mt-3"
        />
      )}

      <dl className="mt-5 grid grid-cols-3 gap-4 border-t border-white/5 pt-4">
        {MACROS.map(({ key, label, bar }) => {
          const goal = goals[key]
          return (
            <div key={key} className="min-w-0">
              <dt className="flex items-center gap-1.5 text-[11px] text-muted">
                <span className={`h-2 w-2 shrink-0 rounded-full ${bar}`} aria-hidden />
                {label}
              </dt>
              <dd className="mt-1 text-sm font-bold tabular-nums">
                {formatGrams(totals[key])}
                {goal !== null && <span className="font-normal text-muted"> / {goal}</span>}
              </dd>
              {goal !== null && (
                <dd>
                  <Meter
                    value={totals[key]}
                    max={goal}
                    label={label}
                    valueText={`${formatGrams(totals[key])} of ${formatGrams(goal)}`}
                    barClassName={bar}
                    className="mt-2 h-1.5"
                  />
                </dd>
              )}
            </div>
          )
        })}
      </dl>
    </Card>
  )
}

function MealCard({
  meal,
  entries,
  justAdded,
  onAdd,
  onEdit,
}: {
  meal: Meal
  entries: FoodEntry[]
  justAdded: string | null
  onAdd: () => void
  onEdit: (entry: FoodEntry) => void
}) {
  const calories = entries.reduce((sum, entry) => sum + entry.calories, 0)

  return (
    <section aria-label={MEAL_LABELS[meal]} className={`${cardStyles} overflow-hidden`}>
      <div className="flex items-center gap-3 p-4">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/5 text-lg" aria-hidden>
          {MEAL_EMOJIS[meal]}
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="font-semibold text-white">{MEAL_LABELS[meal]}</h2>
          <p className="text-xs text-muted">{entries.length > 0 ? formatKcal(calories) : 'Nothing logged yet'}</p>
        </div>
        <button
          type="button"
          onClick={onAdd}
          aria-label={`Add food to ${MEAL_LABELS[meal]}`}
          className="press flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary text-white shadow-md shadow-primary/20 hover:bg-primary-hover [--press-scale:0.85]"
        >
          <Plus size={18} />
        </button>
      </div>

      {entries.length > 0 && (
        <ul className="divide-y divide-white/5 border-t border-white/5">
          {entries.map((entry) => (
            <li key={entry.id} className={entry.id === justAdded ? 'animate-float-in' : ''}>
              <button
                type="button"
                onClick={() => onEdit(entry)}
                className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-white/[0.03]"
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-white">{entry.name}</span>
                  <MacroLine food={entry} />
                </span>
                <span className="shrink-0 text-right">
                  <span className="block text-sm font-bold tabular-nums">
                    {entry.calories.toLocaleString('en-GB')}
                    <span className="ml-0.5 text-xs font-normal text-muted">kcal</span>
                  </span>
                  {entry.grams !== null && <span className="block text-[11px] text-muted">{formatGrams(entry.grams)}</span>}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
