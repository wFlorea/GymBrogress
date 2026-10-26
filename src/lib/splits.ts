import type { SplitOption, SplitType, WorkoutSplit } from './types'

export const REST_DAY = 'Rest Day' satisfies SplitType

export const SPLIT_OPTIONS: SplitOption[] = [
  {
    id: 'Push',
    name: 'Push Day',
    emoji: '🔥',
    description: 'Chest, shoulders and triceps',
    targetMuscleGroups: ['chest', 'shoulders', 'arms'],
  },
  {
    id: 'Pull',
    name: 'Pull Day',
    emoji: '⚡',
    description: 'Back, biceps and rear delts',
    targetMuscleGroups: ['back', 'arms', 'shoulders'],
  },
  {
    id: 'Legs',
    name: 'Leg Day',
    emoji: '🦵',
    description: 'Quads, hamstrings, glutes and calves',
    targetMuscleGroups: ['legs', 'core'],
  },
  {
    id: 'Upper',
    name: 'Upper Body',
    emoji: '💪',
    description: 'Full upper body: chest, back, shoulders, arms',
    targetMuscleGroups: ['chest', 'back', 'shoulders', 'arms'],
  },
  {
    id: 'Lower',
    name: 'Lower Body',
    emoji: '🏋️',
    description: 'Lower body plus lower back and core',
    targetMuscleGroups: ['legs', 'core', 'back'],
  },
  {
    id: 'Chest',
    name: 'Chest Day',
    emoji: '🛡️',
    description: 'Chest focus with triceps',
    targetMuscleGroups: ['chest', 'arms'],
  },
  {
    id: 'Back',
    name: 'Back Day',
    emoji: '🦅',
    description: 'Back focus with biceps',
    targetMuscleGroups: ['back', 'arms'],
  },
  {
    id: 'Arms',
    name: 'Arms Day',
    emoji: '💪',
    description: 'Biceps, triceps and forearms',
    targetMuscleGroups: ['arms'],
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
    targetMuscleGroups: ['chest', 'back', 'legs', 'shoulders', 'arms', 'core'],
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
