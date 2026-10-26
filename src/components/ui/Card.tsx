import type { ReactNode } from 'react'

/**
 * The card look without padding, for links and lists that set their own.
 * (Card's `p-5` can't be overridden with another `p-*` class.)
 */
export const cardStyles = 'rounded-2xl border border-white/5 bg-surface shadow-lg shadow-black/25'

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`${cardStyles} p-5 ${className}`}>{children}</div>
}

/** One number in a `<dl>` row of stats; the label sits under the value. */
export function StatItem({ value, label, className = '' }: { value: ReactNode; label: ReactNode; className?: string }) {
  return (
    <div className="flex flex-col-reverse">
      <dt className="mt-0.5 text-[11px] text-muted">{label}</dt>
      <dd className={`text-xl font-bold ${className}`}>{value}</dd>
    </div>
  )
}

export function EmptyState({
  icon,
  title,
  description,
  children,
}: {
  icon: ReactNode
  title: string
  description?: ReactNode
  children?: ReactNode
}) {
  return (
    <Card className="space-y-3 text-center">
      <div className="mx-auto flex justify-center text-muted">{icon}</div>
      <h3 className="text-base font-bold text-white">{title}</h3>
      {description && <p className="mx-auto max-w-xs text-xs text-muted">{description}</p>}
      {children && <div className="flex justify-center gap-3 pt-2">{children}</div>}
    </Card>
  )
}

const ALERT_TONES = {
  error: 'border-error/40 bg-error/10 text-red-300',
  success: 'border-success/40 bg-success/10 text-emerald-200',
  info: 'border-primary/40 bg-primary/15 text-primary',
} as const

export function Alert({
  tone = 'error',
  children,
  className = '',
}: {
  tone?: keyof typeof ALERT_TONES
  children: ReactNode
  className?: string
}) {
  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className={`animate-fade-in rounded-xl border p-3 text-xs font-semibold ${ALERT_TONES[tone]} ${className}`}
    >
      {children}
    </div>
  )
}
