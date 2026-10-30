// Defaults and limits for logged sets, shared by the tracker screen and its server actions.

import type { RestSeconds } from './types'

export const DEFAULT_SETS_PER_EXERCISE = 3
export const MIN_SETS_PER_EXERCISE = 1
export const MAX_SETS_PER_EXERCISE = 5
export const DEFAULT_REPS = 10
export const MAX_REPS = 1000
export const MAX_WEIGHT_KG = 1000

export function isValidSetCount(value: unknown): value is number {
  return Number.isInteger(value) && (value as number) >= MIN_SETS_PER_EXERCISE && (value as number) <= MAX_SETS_PER_EXERCISE
}

/** The rest timer lengths to pick from in Settings. */
export const REST_TIMER_OPTIONS: readonly RestSeconds[] = [60, 90, 120, 180]
export const DEFAULT_REST_SECONDS: RestSeconds = 90

export function isRestSeconds(value: unknown): value is RestSeconds {
  return REST_TIMER_OPTIONS.includes(value as RestSeconds)
}
