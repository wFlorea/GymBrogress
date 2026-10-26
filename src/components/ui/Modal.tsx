'use client'

import { useEffect, useId, type ReactNode } from 'react'
import { X } from 'lucide-react'

/** Bottom sheet on phones, centred dialog on larger screens. Closes on Escape or a backdrop tap. */
export function Modal({
  open,
  onClose,
  title,
  eyebrow,
  children,
}: {
  open: boolean
  onClose: () => void
  title: ReactNode
  eyebrow?: ReactNode
  children: ReactNode
}) {
  const titleId = useId()

  useEffect(() => {
    if (!open) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex animate-fade-in items-end justify-center bg-black/80 backdrop-blur-xs sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[88vh] w-full max-w-lg animate-slide-up flex-col rounded-t-3xl border-t border-border bg-surface p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] shadow-2xl sm:rounded-3xl sm:border sm:pb-5"
      >
        <div className="flex items-center justify-between gap-3 border-b border-border pb-3">
          <div className="min-w-0">
            {eyebrow && (
              <p className="flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-muted">{eyebrow}</p>
            )}
            <h2 id={titleId} className="text-lg font-black text-white">
              {title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-zinc-400 transition-colors hover:text-white"
          >
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
