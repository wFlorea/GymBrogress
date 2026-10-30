'use client'

import { useOptimistic, useState, useTransition } from 'react'
import { Bookmark, Copy, Loader2, Minus, Plus, Target } from 'lucide-react'
import { GoalsForm } from '@/components/GoalsForm'
import { Alert, Card, cardStyles } from '@/components/ui/Card'
import { Meter } from '@/components/ui/Meter'
import { Modal } from '@/components/ui/Modal'
import { buttonStyles } from '@/components/ui/styles'
import { formatGrams, formatKcal, formatMl } from '@/lib/format'
import { MACROS, MAX_WATER_ML, MEALS, MEAL_EMOJIS, MEAL_LABELS, WATER_STEP_ML, sumNutrition, waterGoalMl } from '@/lib/nutrition'
import type {
  BodyStats,
  FoodEntry,
  FoodItem,
  IsoDate,
  Meal,
  Nutrition,
  NutritionGoals,
  PlanPace,
  SavedMeal,
  WeightPlan,
} from '@/lib/types'
import { copyMeal, deleteFoodEntry, saveWater } from './actions'
import { FoodSheet } from './FoodSheet'
import { MacroLine } from './MacroLine'
import { SaveMealForm } from './SaveMealForm'

/** What the food sheet is open for: adding to a meal, or editing a logged food. */
type Sheet = { meal: Meal; entry?: FoodEntry }

/** The day before the one shown: its name ("yesterday", "Tuesday") and the calories of each meal logged in it. */
interface PreviousDay {
  date: IsoDate
  name: string
  meals: Partial<Record<Meal, number>>
}

export function FoodClient({
  date,
  entries,
  previousDay,
  recentFoods,
  savedMeals,
  water,
  goals,
  body,
  goalWeight,
  weightPlan,
  planPace,
}: {
  date: IsoDate
  entries: FoodEntry[]
  previousDay: PreviousDay
  recentFoods: FoodItem[]
  savedMeals: SavedMeal[]
  /** Water drunk on `date`, in ml. */
  water: number
  goals: NutritionGoals
  /** The user's body stats, goal weight and weight plan, for the goals form. */
  body: BodyStats
  goalWeight: number | null
  weightPlan: WeightPlan
  planPace: PlanPace
}) {
  // `sheet` outlives `sheetOpen` so the sheet keeps its content while it slides away.
  const [sheet, setSheet] = useState<Sheet | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [goalsOpen, setGoalsOpen] = useState(false)
  // Like `sheet`, `saving` outlives `savingOpen`.
  const [saving, setSaving] = useState<Meal | null>(null)
  const [savingOpen, setSavingOpen] = useState(false)
  const [copying, setCopying] = useState<Meal | null>(null)
  const [isCopying, startCopying] = useTransition()
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

  function openSaving(meal: Meal) {
    setSaving(meal)
    setFormKey((key) => key + 1)
    setSavingOpen(true)
  }

  function copy(meal: Meal) {
    setError(null)
    setCopying(meal)
    startCopying(async () => {
      const result = await copyMeal(previousDay.date, date, meal)
      if (!result.ok) setError(result.error)
    })
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
      <WaterCard date={date} water={water} goal={waterGoalMl(body.weight)} onError={setError} />

      {MEALS.map((meal) => {
        const previous = previousDay.meals[meal]
        return (
          <MealCard
            key={meal}
            meal={meal}
            entries={optimisticEntries.filter((entry) => entry.meal === meal)}
            justAdded={justAdded}
            copyFrom={previous === undefined ? null : { name: previousDay.name, calories: previous }}
            copying={isCopying && copying === meal}
            onAdd={() => openSheet({ meal })}
            onEdit={(entry) => openSheet({ meal: entry.meal, entry })}
            onCopy={() => copy(meal)}
            onSave={() => openSaving(meal)}
          />
        )
      })}

      <Modal open={sheetOpen} onClose={() => setSheetOpen(false)} title={sheet?.entry ? 'Edit food' : 'Add food'}>
        {sheet && (
          <FoodSheet
            key={formKey}
            date={date}
            meal={sheet.meal}
            entry={sheet.entry}
            recentFoods={recentFoods}
            savedMeals={savedMeals}
            onSaved={(id) => {
              if (id) setJustAdded(id)
              setSheetOpen(false)
            }}
            onDelete={sheet.entry ? () => remove(sheet.entry!) : undefined}
          />
        )}
      </Modal>

      <Modal open={savingOpen} onClose={() => setSavingOpen(false)} title="Save meal">
        {saving && (
          <SaveMealForm
            key={formKey}
            meal={saving}
            entries={optimisticEntries.filter((entry) => entry.meal === saving)}
            onSaved={() => setSavingOpen(false)}
          />
        )}
      </Modal>

      <Modal open={goalsOpen} onClose={() => setGoalsOpen(false)} title="Your goals">
        <GoalsForm
          key={formKey}
          body={body}
          goalWeight={goalWeight}
          goals={goals}
          weightPlan={weightPlan}
          planPace={planPace}
          onSaved={() => setGoalsOpen(false)}
        />
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

/** Water drunk on the day against a goal from the user's weight, a glass at a time. */
function WaterCard({
  date,
  water,
  goal,
  onError,
}: {
  date: IsoDate
  water: number
  goal: number
  onError: (error: string | null) => void
}) {
  const [shown, setShown] = useOptimistic(water)
  const [, startTransition] = useTransition()

  function change(by: number) {
    const ml = Math.min(MAX_WATER_ML, Math.max(0, shown + by))
    onError(null)
    startTransition(async () => {
      setShown(ml)
      const result = await saveWater(date, ml)
      if (!result.ok) onError(result.error)
    })
  }

  return (
    <Card>
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/5 text-lg" aria-hidden>
          💧
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="font-semibold">Water</h2>
          <p className="truncate text-xs tabular-nums text-muted">
            {shown.toLocaleString('en-GB')} of {formatMl(goal)}
          </p>
        </div>
        <button
          type="button"
          onClick={() => change(-WATER_STEP_ML)}
          disabled={shown === 0}
          aria-label={`Remove ${formatMl(WATER_STEP_ML)}`}
          className={`${buttonStyles.icon} disabled:opacity-30`}
        >
          <Minus size={18} />
        </button>
        <button
          type="button"
          onClick={() => change(WATER_STEP_ML)}
          disabled={shown >= MAX_WATER_ML}
          className={`${buttonStyles.chip} shrink-0 whitespace-nowrap`}
        >
          <Plus size={13} /> {formatMl(WATER_STEP_ML)}
        </button>
      </div>
      <Meter value={shown} max={goal} label="Water" valueText={`${formatMl(shown)} of ${formatMl(goal)}`} className="mt-3" />
    </Card>
  )
}

function MealCard({
  meal,
  entries,
  justAdded,
  copyFrom,
  copying,
  onAdd,
  onEdit,
  onCopy,
  onSave,
}: {
  meal: Meal
  entries: FoodEntry[]
  justAdded: string | null
  /** The same meal the day before, which an empty meal can be filled from. */
  copyFrom: { name: string; calories: number } | null
  copying: boolean
  onAdd: () => void
  onEdit: (entry: FoodEntry) => void
  onCopy: () => void
  onSave: () => void
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
        {entries.length > 0 && (
          <button type="button" onClick={onSave} aria-label={`Save ${MEAL_LABELS[meal]} as a meal`} className={buttonStyles.icon}>
            <Bookmark size={16} />
          </button>
        )}
        <button
          type="button"
          onClick={onAdd}
          aria-label={`Add food to ${MEAL_LABELS[meal]}`}
          className="press flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary text-white shadow-md shadow-primary/20 hover:bg-primary-hover [--press-scale:0.85]"
        >
          <Plus size={18} />
        </button>
      </div>

      {entries.length === 0 && copyFrom && (
        <button
          type="button"
          onClick={onCopy}
          disabled={copying}
          aria-busy={copying}
          className="flex w-full items-center gap-2.5 border-t border-white/5 px-4 py-3 text-left text-sm font-semibold text-foreground/80 transition-colors hover:bg-white/[0.03] hover:text-white disabled:opacity-60"
        >
          {copying ? <Loader2 size={16} className="shrink-0 animate-spin text-muted" /> : <Copy size={16} className="shrink-0 text-muted" />}
          <span className="min-w-0 flex-1 truncate">
            Copy {copyFrom.name}’s {MEAL_LABELS[meal].toLowerCase()}
          </span>
          <span className="shrink-0 text-xs font-normal tabular-nums text-muted">{formatKcal(copyFrom.calories)}</span>
        </button>
      )}

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
