/** An on/off toggle. Name it with `aria-labelledby` (or `aria-label`). */
export function Switch({
  on,
  onChange,
  disabled,
  ...label
}: {
  on: boolean
  onChange: (on: boolean) => void
  disabled?: boolean
  'aria-label'?: string
  'aria-labelledby'?: string
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      disabled={disabled}
      onClick={() => onChange(!on)}
      {...label}
      className={`relative h-7 w-12 shrink-0 rounded-full transition-colors disabled:opacity-60 ${on ? 'bg-primary' : 'bg-foreground/15'}`}
    >
      <span className={`absolute left-1 top-1 h-5 w-5 rounded-full bg-white shadow transition-transform ${on ? 'translate-x-5' : ''}`} />
    </button>
  )
}
