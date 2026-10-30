// Weights are kept in kg; these show them, and read typed ones back, in the unit picked in Settings.

import type { WeightUnit } from './types'

export const WEIGHT_UNITS: readonly WeightUnit[] = ['kg', 'lb']
export const WEIGHT_UNIT_LABELS: Record<WeightUnit, string> = { kg: 'Kilograms', lb: 'Pounds' }
export const DEFAULT_WEIGHT_UNIT: WeightUnit = 'kg'

const KG_PER_LB = 0.45359237

export function isWeightUnit(value: unknown): value is WeightUnit {
  return WEIGHT_UNITS.includes(value as WeightUnit)
}

/** A weight in kg, in `unit`. */
export function fromKg(kg: number, unit: WeightUnit): number {
  return unit === 'kg' ? kg : kg / KG_PER_LB
}

/** A weight in `unit`, in kg. */
export function toKg(weight: number, unit: WeightUnit): number {
  return unit === 'kg' ? weight : weight * KG_PER_LB
}

/** A weight in `unit` as precise as it's shown: kg to 0.01 (22.25 kg), lb to 0.1. */
export function roundWeight(weight: number, unit: WeightUnit): number {
  const places = unit === 'kg' ? 100 : 10
  return Math.round(weight * places) / places
}

/** A weight in kg as it's typed in `unit`, like "72.5" or "159.8"; empty for none. */
export function weightText(kg: number | null, unit: WeightUnit): string {
  return kg === null ? '' : String(roundWeight(fromKg(kg, unit), unit))
}
