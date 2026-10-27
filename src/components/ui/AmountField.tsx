import type { ReactNode } from 'react'
import { inputStyles } from './styles'

/** A form field with its label above it. */
export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block min-w-0">
      <span className="mb-1.5 block text-xs font-semibold text-muted">{label}</span>
      {children}
    </label>
  )
}

/** A number field with its unit ("g", "kcal") inside, on the right. The value stays text, as typed. */
export function AmountField({
  label,
  unit,
  value,
  onChange,
  placeholder,
}: {
  label: string
  unit: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
}) {
  // Room on the right for the unit.
  const unitPadding = unit.length === 1 ? 'pr-7' : unit.length === 2 ? 'pr-10' : 'pr-12'
  return (
    <Field label={label}>
      <span className="relative block">
        <input
          type="text"
          inputMode="decimal"
          autoComplete="off"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`${inputStyles} pl-3 tabular-nums ${unitPadding}`}
        />
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted">{unit}</span>
      </span>
    </Field>
  )
}
