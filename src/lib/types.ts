// Shared types. Constants and helpers live next to their feature:
// splits.ts, exercises-data.ts, routines.ts, date.ts, streak.ts.

/** A calendar date in `YYYY-MM-DD` form. */
export type IsoDate = string

export type MuscleGroup =
  | 'chest'
  | 'back'
  | 'shoulders'
  | 'biceps'
  | 'triceps'
  | 'forearms'
  | 'core'
  | 'glutes'
  | 'quads'
  | 'hamstrings'
  | 'calves'
  | 'cardio'

export interface Exercise {
  id: string
  name: string
  muscle_group: MuscleGroup
  description: string
}

/** Split ids, as stored in the database. */
export type SplitType =
  | 'Push'
  | 'Pull'
  | 'Legs'
  | 'Upper'
  | 'Lower'
  | 'Arms'
  | 'Chest'
  | 'Back'
  | 'Shoulders'
  | 'Cardio & Core'
  | 'Full Body'
  | 'Rest Day'

export type WorkoutSplit = Exclude<SplitType, 'Rest Day'>

export interface SplitOption {
  id: SplitType
  name: string
  emoji: string
  description: string
  /** Most relevant first; the exercise pickers recommend exercises in this order. */
  targetMuscleGroups: MuscleGroup[]
}

/** One exercise of a routine and how many sets to do. */
export interface RoutineItem {
  exerciseId: string
  sets: number
}

/** An exercise as planned in a routine. */
export interface PlannedExercise extends Exercise {
  sets: number
}

/** The user's routine per split; splits without an entry use the default routine. */
export type RoutineTemplates = Partial<Record<WorkoutSplit, RoutineItem[]>>

export interface UserSettings {
  /** Order of the routines in Plan; splits missing from it follow in the default order. */
  splitOrder: WorkoutSplit[]
  /** Exercises pinned on the Progress page. */
  trackedExerciseIds: string[]
  nutritionGoals: NutritionGoals
  body: BodyStats
  /** The weight the user is aiming for, in kg. */
  goalWeight: number | null
  weightPlan: WeightPlan
  planPace: PlanPace
}

/** What the user's weight should do: cut (eat under maintenance), maintain, or bulk (eat over it). */
export type WeightPlan = 'cut' | 'maintain' | 'bulk'

/** How far a cut or bulk moves the daily calories from maintenance, in %. */
export type PlanPace = 5 | 10 | 15 | 20

/** What the user entered about their body; null = not entered. */
export interface BodyStats {
  /** kg */
  weight: number | null
  /** cm */
  height: number | null
  age: number | null
  sex: Sex | null
  /** % */
  bodyFat: number | null
  activity: ActivityLevel | null
}

export type Sex = 'male' | 'female'

/** How much the user moves in a week, from least to most. */
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'very' | 'extra'

/** Splits planned for specific dates (overrides of the weekly plan). */
export type DatePlans = Record<IsoDate, SplitType>

/** Split for each weekday, index 0 = Monday … 6 = Sunday. */
export type WeeklyPlan = SplitType[]

export interface WorkoutSet {
  id: string
  exercise_id: string
  exercise_name: string
  set_number: number
  actual_reps: number
  actual_weight: number
  is_completed: boolean
}

export type SetValues = Pick<WorkoutSet, 'actual_reps' | 'actual_weight'>

export interface WorkoutDay {
  id: string
  date: IsoDate
  split: SplitType
  finished_at: string | null
  sets: WorkoutSet[]
}

/** One day of history, as needed by streaks and stats. */
export interface DaySummary {
  date: IsoDate
  split: SplitType
  totalSets: number
  completedSets: number
  totalExercises: number
  /** Exercises whose sets are all ticked off. */
  completedExercises: number
  finished: boolean
}

/** An exercise the user has completed at least one set of. */
export interface ExerciseHistory {
  exerciseId: string
  name: string
  bestWeight: number
  lastDate: IsoDate
}

/** Heaviest completed set of an exercise in one workout. */
export interface WorkoutBest {
  date: IsoDate
  maxWeight: number
}

export type Meal = 'breakfast' | 'lunch' | 'dinner' | 'snack'

/** Calories (kcal) and macros (grams) of a food, a meal or a whole day. */
export interface Nutrition {
  calories: number
  protein: number
  carbs: number
  fat: number
}

/** A food and what's in it, as it goes into the log. */
export interface FoodItem extends Nutrition {
  name: string
  /** How much was eaten, for foods picked from the food database; null for foods typed in by hand. */
  grams: number | null
}

/** A food from the food database (the built-in common foods or Open Food Facts), with its nutrition per 100 g. */
export interface CatalogFood {
  id: string
  name: string
  brand?: string
  per100g: Nutrition
}

/** One food in the food log. */
export interface FoodEntry extends FoodItem {
  id: string
  date: IsoDate
  meal: Meal
}

/** Daily targets; null where the user hasn't set one. */
export type NutritionGoals = Record<keyof Nutrition, number | null>

/** Result of a server action called from a client component. */
export type ActionResult<T = undefined> = { ok: true; data: T } | { ok: false; error: string }
