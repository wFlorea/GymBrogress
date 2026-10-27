// Body stats limits, activity levels and BMI maths.
import type { ActivityLevel } from './types'

export const MIN_WEIGHT_KG = 20
export const MAX_WEIGHT_KG = 400
export const MIN_HEIGHT_CM = 100
export const MAX_HEIGHT_CM = 250
export const MIN_AGE = 13
export const MAX_AGE = 120
/** Body fat, in %. */
export const MIN_BODY_FAT = 5
export const MAX_BODY_FAT = 50

export const ACTIVITY_LEVELS: { key: ActivityLevel; label: string; description: string }[] = [
  { key: 'sedentary', label: 'Sedentary', description: 'Desk job, minimal movement' },
  { key: 'light', label: 'Lightly active', description: 'Light exercise 1–3 days/week' },
  { key: 'moderate', label: 'Moderately active', description: 'Moderate exercise 3–5 days/week' },
  { key: 'very', label: 'Very active', description: 'Hard exercise 6–7 days/week' },
  { key: 'extra', label: 'Extra active', description: 'Intense daily training or physical job' },
]

export function isActivityLevel(value: unknown): value is ActivityLevel {
  return ACTIVITY_LEVELS.some((level) => level.key === value)
}

/** The WHO adult BMI ranges; each runs up to (not including) `below`. */
export const BMI_CATEGORIES = [
  { below: 18.5, label: 'Underweight' },
  { below: 25, label: 'Healthy weight' },
  { below: 30, label: 'Overweight' },
  { below: Infinity, label: 'Obese' },
] as const

/** Body mass index: weight in kg over height in metres squared, to one decimal. */
export function bmiOf(weightKg: number, heightCm: number): number {
  const metres = heightCm / 100
  return Math.round((weightKg / (metres * metres)) * 10) / 10
}

export function bmiCategory(bmi: number) {
  return BMI_CATEGORIES.find((category) => bmi < category.below) ?? BMI_CATEGORIES[BMI_CATEGORIES.length - 1]
}

/** "5 kg to gain", "2.5 kg to lose", "You're at your goal" */
export function goalWeightText(weightKg: number, goalKg: number): string {
  const difference = Math.round((goalKg - weightKg) * 10) / 10
  if (difference === 0) return "You're at your goal"
  const amount = Math.abs(difference).toLocaleString('en-GB', { maximumFractionDigits: 1 })
  return `${amount} kg to ${difference > 0 ? 'gain' : 'lose'}`
}
