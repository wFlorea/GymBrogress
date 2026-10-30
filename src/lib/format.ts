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

/** "20 kg", "22.5 kg" */
export function formatKg(weight: number): string {
  return `${weight.toLocaleString('en-GB', { maximumFractionDigits: 2 })} kg`
}

/** "250 ml", "1,750 ml" */
export function formatMl(ml: number): string {
  return `${ml.toLocaleString('en-GB')} ml`
}

/** "+0.4 kg", "-1.2 kg", "0 kg" */
export function signedKg(change: number): string {
  // `|| 0` turns -0 into 0.
  const rounded = Math.round(change * 10) / 10 || 0
  return `${rounded > 0 ? '+' : ''}${formatKg(rounded)}`
}

/** "0:45", "1:30", "3:00" */
export function formatClock(seconds: number): string {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`
}
