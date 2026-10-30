import type { ReactNode } from 'react'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'

/**
 * A row in a card of links (Profile's "More", Settings' "Account"); stack them with `divide-y`. A `download` row is a
 * plain link to a file, not a page.
 */
export function MenuLink({
  href,
  icon,
  title,
  description,
  download = false,
}: {
  href: string
  icon: ReactNode
  title: string
  description: string
  download?: boolean
}) {
  const Row = download ? 'a' : Link
  return (
    <Row href={href} download={download || undefined} className="flex items-center gap-3 p-4 transition-colors hover:bg-white/[0.03]">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block font-semibold">{title}</span>
        <span className="text-xs text-muted">{description}</span>
      </span>
      <ChevronRight size={18} className="shrink-0 text-muted" />
    </Row>
  )
}
