/** "1 set", "3 sets", "1 exercise", "2 exercises" */
export function plural(count: number, singular: string, pluralForm = `${singular}s`): string {
  return `${count} ${count === 1 ? singular : pluralForm}`
}

/** "20 kg", "22.5 kg" */
export function formatKg(weight: number): string {
  return `${weight.toLocaleString('en-GB', { maximumFractionDigits: 2 })} kg`
}
