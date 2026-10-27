/** A thin bar filled to `value` out of `max`; it stays full once `value` goes past `max`. */
export function Meter({
  value,
  max,
  label,
  valueText,
  barClassName = 'bg-primary',
  className = '',
}: {
  value: number
  max: number
  label: string
  /** What a screen reader announces, e.g. "1,240 of 2,200 kcal". */
  valueText: string
  barClassName?: string
  className?: string
}) {
  const percent = max > 0 ? Math.min(100, (value / max) * 100) : 0
  return (
    <div
      role="meter"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={Math.min(value, max)}
      aria-valuetext={valueText}
      className={`h-2 overflow-hidden rounded-full bg-white/10 ${className}`}
    >
      <div
        className={`h-full rounded-full transition-[width] duration-700 ease-spring ${barClassName}`}
        style={{ width: `${percent}%` }}
      />
    </div>
  )
}
