import type { WeightUnit } from './types'
import { fromKg, roundWeight } from './units'

/** "1 set", "3 sets", "1 exercise", "2 exercises" */
export function plural(count: number, singular: string, pluralForm = `${singular}s`): string {
  return `${count} ${count === 1 ? singular : pluralForm}`
}

/** "850 kcal", "1,240 kcal" */
export function formatKcal(calories: number): string {
  return `${Math.round(calories).toLocaleString('en-GB')} kcal`
}

/** "12 g", "12.5 g" */
export function formatGrams(grams: number): string {
  return `${grams.toLocaleString('en-GB', { maximumFractionDigits: 1 })} g`
}

/** A weight kept in kg, in `unit`: "20 kg", "22.25 kg", "135 lb", "180.4 lb" */
export function formatWeight(kg: number, unit: WeightUnit): string {
  return `${roundWeight(fromKg(kg, unit), unit).toLocaleString('en-GB')} ${unit}`
}

/** "250 ml", "1,750 ml" */
export function formatMl(ml: number): string {
  return `${ml.toLocaleString('en-GB')} ml`
}

/** A change in weight kept in kg, in `unit`: "+0.4 kg", "-1.2 lb", "0 kg" */
export function signedWeight(changeKg: number, unit: WeightUnit): string {
  // `|| 0` turns -0 into 0.
  const rounded = Math.round(fromKg(changeKg, unit) * 10) / 10 || 0
  return `${rounded > 0 ? '+' : ''}${rounded.toLocaleString('en-GB')} ${unit}`
}

/** "0:45", "1:30", "3:00" */
export function formatClock(seconds: number): string {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`
}
