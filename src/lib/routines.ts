import { getExercise } from './exercises-data'
import { DEFAULT_SETS_PER_EXERCISE } from './sets'
import { REST_DAY } from './splits'
import type { PlannedExercise, RoutineItem, RoutineTemplates, SplitType, WorkoutSplit } from './types'

/** Exercises used for a split until the user customises it in Plan. */
export const DEFAULT_ROUTINES: Record<WorkoutSplit, string[]> = {
  Push: ['ex-002', 'ex-001', 'ex-006', 'ex-034', 'ex-035', 'ex-046'],
  Pull: ['ex-012', 'ex-013', 'ex-015', 'ex-037', 'ex-041', 'ex-043'],
  Legs: ['ex-021', 'ex-022', 'ex-023', 'ex-025', 'ex-026', 'ex-030'],
  Upper: ['ex-001', 'ex-012', 'ex-034', 'ex-015', 'ex-042', 'ex-046'],
  Lower: ['ex-021', 'ex-023', 'ex-024', 'ex-026', 'ex-051', 'ex-030'],
  Arms: ['ex-041', 'ex-042', 'ex-044', 'ex-049', 'ex-048', 'ex-046', 'ex-063'],
  Chest: ['ex-001', 'ex-002', 'ex-008', 'ex-006', 'ex-010'],
  Back: ['ex-011', 'ex-013', 'ex-012', 'ex-015', 'ex-016'],
  Shoulders: ['ex-033', 'ex-034', 'ex-035', 'ex-037', 'ex-038'],
  'Cardio & Core': ['ex-057', 'ex-054', 'ex-051', 'ex-052', 'ex-053'],
  'Full Body': ['ex-021', 'ex-001', 'ex-013', 'ex-033', 'ex-023', 'ex-051'],
}

export function getRoutine(split: SplitType, templates: RoutineTemplates): RoutineItem[] {
  if (split === REST_DAY) return []
  return templates[split] ?? DEFAULT_ROUTINES[split].map((exerciseId) => ({ exerciseId, sets: DEFAULT_SETS_PER_EXERCISE }))
}

export function resolveRoutine(split: SplitType, templates: RoutineTemplates): PlannedExercise[] {
  return getRoutine(split, templates).flatMap(({ exerciseId, sets }) => {
    const exercise = getExercise(exerciseId)
    return exercise ? [{ ...exercise, sets }] : []
  })
}

export function isCustomRoutine(split: WorkoutSplit, templates: RoutineTemplates): boolean {
  return templates[split] !== undefined
}
