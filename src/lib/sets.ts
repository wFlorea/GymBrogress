// Defaults and limits for logged sets, shared by the tracker screen and its server actions.

export const DEFAULT_SETS_PER_EXERCISE = 3
export const MIN_SETS_PER_EXERCISE = 1
export const MAX_SETS_PER_EXERCISE = 5
export const DEFAULT_REPS = 10
export const MAX_REPS = 1000
export const MAX_WEIGHT_KG = 1000

export function isValidSetCount(value: unknown): value is number {
  return Number.isInteger(value) && (value as number) >= MIN_SETS_PER_EXERCISE && (value as number) <= MAX_SETS_PER_EXERCISE
}
