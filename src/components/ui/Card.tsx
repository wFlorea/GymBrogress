import type { ReactNode } from 'react'

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-2xl border border-border bg-surface p-5 shadow-sm ${className}`}>{children}</div>
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
