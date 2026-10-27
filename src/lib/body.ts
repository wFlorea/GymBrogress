// Body stats limits, activity levels, BMI and daily calorie maths.
import type { ActivityLevel, BodyStats, Sex } from './types'

export const MIN_WEIGHT_KG = 20
export const MAX_WEIGHT_KG = 400
export const MIN_HEIGHT_CM = 100
export const MAX_HEIGHT_CM = 250
export const MIN_AGE = 13
export const MAX_AGE = 120
/** Body fat, in %. */
export const MIN_BODY_FAT = 5
export const MAX_BODY_FAT = 50

export const SEXES: { key: Sex; label: string }[] = [
  { key: 'male', label: 'Male' },
  { key: 'female', label: 'Female' },
]

export function isSex(value: unknown): value is Sex {
  return SEXES.some((sex) => sex.key === value)
}

/** `multiplier` turns the BMR into the calories burned in a day at that level. */
export const ACTIVITY_LEVELS: { key: ActivityLevel; label: string; description: string; multiplier: number }[] = [
  { key: 'sedentary', label: 'Sedentary', description: 'Desk job, minimal movement', multiplier: 1.2 },
  { key: 'light', label: 'Lightly active', description: 'Light exercise 1–3 days/week', multiplier: 1.375 },
  { key: 'moderate', label: 'Moderately active', description: 'Moderate exercise 3–5 days/week', multiplier: 1.55 },
  { key: 'very', label: 'Very active', description: 'Hard exercise 6–7 days/week', multiplier: 1.725 },
  { key: 'extra', label: 'Extra active', description: 'Intense daily training or physical job', multiplier: 1.9 },
]

export function isActivityLevel(value: unknown): value is ActivityLevel {
  return ACTIVITY_LEVELS.some((level) => level.key === value)
}

/** Basal metabolic rate in kcal a day, by the Mifflin–St Jeor equation. */
export function bmrOf(weightKg: number, heightCm: number, age: number, sex: Sex): number {
  return 10 * weightKg + 6.25 * heightCm - 5 * age + (sex === 'male' ? 5 : -161)
}

/**
 * The calories the user burns in a day (their maintenance): their BMR times their activity level's multiplier, to the
 * nearest hundred. Null until weight, height, age, sex and activity level are all entered.
 */
export function maintenanceCaloriesFor({ weight, height, age, sex, activity }: BodyStats): number | null {
  const level = ACTIVITY_LEVELS.find((option) => option.key === activity)
  if (weight === null || height === null || age === null || sex === null || !level) return null
  return Math.round((bmrOf(weight, height, age, sex) * level.multiplier) / 100) * 100
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
