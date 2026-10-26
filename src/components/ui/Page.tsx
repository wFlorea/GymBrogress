import type { ReactNode } from 'react'

/** Standard page column: mobile width, clears the bottom navigation. */
export function Page({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`mx-auto max-w-lg p-4 pt-8 pb-page ${className}`}>{children}</div>
}

export function PageHeader({
  title,
  eyebrow,
  subtitle,
  action,
}: {
  title: ReactNode
  eyebrow?: ReactNode
  subtitle?: ReactNode
  action?: ReactNode
}) {
  return (
    <header className="mb-6 flex items-start justify-between gap-3">
      <div className="min-w-0">
        {eyebrow && <p className="text-xs font-medium text-muted">{eyebrow}</p>}
        <h1 className="mt-0.5 font-display text-[1.75rem] font-bold leading-tight text-white">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </header>
  )
}

export function SectionTitle({ children, subtitle }: { children: ReactNode; subtitle?: ReactNode }) {
  return (
    <div className="mb-3">
      <h2 className="text-lg font-semibold text-white">{children}</h2>
      {subtitle && <p className="text-xs text-muted">{subtitle}</p>}
    </div>
  )
}
