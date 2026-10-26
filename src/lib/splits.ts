import type { SplitOption, SplitType, WorkoutSplit } from './types'

export const REST_DAY = 'Rest Day' satisfies SplitType

export const SPLIT_OPTIONS: SplitOption[] = [
  {
    id: 'Push',
    name: 'Push Day',
    emoji: '🔥',
    description: 'Chest, shoulders and triceps',
    targetMuscleGroups: ['chest', 'shoulders', 'triceps'],
  },
  {
    id: 'Pull',
    name: 'Pull Day',
    emoji: '⚡',
    description: 'Back, biceps and rear delts',
    targetMuscleGroups: ['back', 'biceps', 'shoulders', 'forearms'],
  },
  {
    id: 'Legs',
    name: 'Leg Day',
    emoji: '🦵',
    description: 'Quads, hamstrings, glutes and calves',
    targetMuscleGroups: ['quads', 'hamstrings', 'glutes', 'calves', 'core'],
  },
  {
    id: 'Upper',
    name: 'Upper Body',
    emoji: '💪',
    description: 'Full upper body: chest, back, shoulders, arms',
    targetMuscleGroups: ['chest', 'back', 'shoulders', 'biceps', 'triceps', 'forearms'],
  },
  {
    id: 'Lower',
    name: 'Lower Body',
    emoji: '🏋️',
    description: 'Quads, hamstrings, glutes, calves and core',
    targetMuscleGroups: ['quads', 'hamstrings', 'glutes', 'calves', 'core'],
  },
  {
    id: 'Chest',
    name: 'Chest Day',
    emoji: '🛡️',
    description: 'Chest focus with triceps',
    targetMuscleGroups: ['chest', 'triceps'],
  },
  {
    id: 'Back',
    name: 'Back Day',
    emoji: '🦅',
    description: 'Back focus with biceps',
    targetMuscleGroups: ['back', 'biceps'],
  },
  {
    id: 'Arms',
    name: 'Arms Day',
    emoji: '💪',
    description: 'Biceps, triceps and forearms',
    targetMuscleGroups: ['biceps', 'triceps', 'forearms'],
  },
  {
    id: 'Shoulders',
    name: 'Shoulders Day',
    emoji: '🚀',
    description: 'Front, side and rear delts plus traps',
    targetMuscleGroups: ['shoulders'],
  },
  {
    id: 'Cardio & Core',
    name: 'Cardio & Core',
    emoji: '🏃',
    description: 'Conditioning and abs',
    targetMuscleGroups: ['cardio', 'core'],
  },
  {
    id: 'Full Body',
    name: 'Full Body',
    emoji: '🌟',
    description: 'Every major muscle group in one session',
    targetMuscleGroups: ['chest', 'back', 'shoulders', 'biceps', 'triceps', 'core', 'glutes', 'quads', 'hamstrings', 'calves'],
  },
  {
    id: REST_DAY,
    name: 'Rest Day',
    emoji: '🧘',
    description: 'Rest, recovery and muscle growth',
    targetMuscleGroups: [],
  },
]

export const WORKOUT_SPLIT_OPTIONS = SPLIT_OPTIONS.filter(
  (s): s is SplitOption & { id: WorkoutSplit } => s.id !== REST_DAY
)

const SPLIT_BY_ID = new Map(SPLIT_OPTIONS.map((s) => [s.id, s]))

export function getSplitOption(split: SplitType): SplitOption {
  return SPLIT_BY_ID.get(split) ?? SPLIT_BY_ID.get(REST_DAY)!
}

export function isSplitType(value: unknown): value is SplitType {
  return typeof value === 'string' && SPLIT_BY_ID.has(value as SplitType)
}

export function isWorkoutSplit(value: unknown): value is WorkoutSplit {
  return isSplitType(value) && value !== REST_DAY
}

/** Workout splits in the user's order; splits missing from `order` follow in the default order. */
export function orderWorkoutSplits(order: WorkoutSplit[]): WorkoutSplit[] {
  const all = WORKOUT_SPLIT_OPTIONS.map((s) => s.id)
  return [...new Set([...order.filter(isWorkoutSplit), ...all])]
}
