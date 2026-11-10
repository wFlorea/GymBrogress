import type { ReactNode } from 'react'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { Page, PageHeader } from '@/components/ui/Page'
import { buttonStyles } from '@/components/ui/styles'
import { LEGAL_UPDATED, OPERATOR } from '@/lib/legal'

export const legalLinkStyles = 'font-semibold text-primary underline'

export function ContactEmail() {
  return (
    <a href={`mailto:${OPERATOR.email}`} className={`${legalLinkStyles} break-all`}>
      {OPERATOR.email}
    </a>
  )
}

/** A page of legal text, open to everyone. "Back" lands signed-out visitors on the sign-in page. */
export function LegalPage({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Page>
      <PageHeader
        title={title}
        eyebrow={`Last updated ${LEGAL_UPDATED}`}
        action={
          <Link href="/settings" className={buttonStyles.chip}>
            <ChevronLeft size={13} /> Back
          </Link>
        }
      />
      <div className="space-y-7 text-sm leading-relaxed text-foreground/85">{children}</div>
    </Page>
  )
}

export function LegalSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-2">
      <h2 className="text-base font-semibold text-white">{title}</h2>
      {children}
    </section>
  )
}

export function LegalList({ children }: { children: ReactNode }) {
  return <ul className="list-disc space-y-1.5 pl-5">{children}</ul>
}

/** Links to the legal pages. They open in a new tab, so a half-filled form isn't lost. */
export function LegalLinks() {
  return (
    <p className="text-center text-xs text-muted">
      <Link href="/terms" target="_blank" className="hover:text-white">
        Terms
      </Link>
      <span aria-hidden> · </span>
      <Link href="/privacy" target="_blank" className="hover:text-white">
        Privacy
      </Link>
    </p>
  )
}
