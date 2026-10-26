/** The app's mark: a weight plate seen from the front. Takes the text colour. */
export function PlateMark({ size = 48, className = '' }: { size?: number; className?: string }) {
  return (
    <svg viewBox="0 0 48 48" width={size} height={size} fill="none" stroke="currentColor" aria-hidden className={className}>
      <circle cx="24" cy="24" r="21" strokeWidth="3" />
      <circle cx="24" cy="24" r="14" strokeWidth="1.5" opacity="0.5" />
      <circle cx="24" cy="24" r="5" strokeWidth="3" />
    </svg>
  )
}
