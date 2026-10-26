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
        {eyebrow && <p className="text-xs font-black uppercase tracking-wider text-muted">{eyebrow}</p>}
        <h1 className="mt-0.5 text-2xl font-black text-primary">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </header>
  )
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-muted">{children}</h2>
}
