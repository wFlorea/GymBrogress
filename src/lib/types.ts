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
}

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

/** Result of a server action called from a client component. */
export type ActionResult<T = undefined> = { ok: true; data: T } | { ok: false; error: string }
