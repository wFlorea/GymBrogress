'use client'

import { useEffect, useId, useState, type ReactNode } from 'react'
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
  // Stays true while the sheet animates out after `open` turns false.
  const [shown, setShown] = useState(open)
  if (open && !shown) setShown(true)
  const closing = shown && !open

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

  if (!shown) return null

  return (
    <div
      className={`fixed inset-0 z-50 flex items-end justify-center bg-black/80 backdrop-blur-xs sm:items-center sm:p-4 ${
        closing ? 'pointer-events-none animate-fade-out' : 'animate-fade-in'
      }`}
      onClick={onClose}
    >
      {/* The ::after strip fills the gap under the sheet while its spring overshoots. */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(e) => e.stopPropagation()}
        onAnimationEnd={(e) => {
          // Unmount once the exit animation (sheet-out or dialog-out) is done.
          if (closing && e.target === e.currentTarget && e.animationName.endsWith('-out')) setShown(false)
        }}
        className={`relative flex max-h-[88vh] w-full max-w-lg flex-col rounded-t-3xl border-t border-border bg-surface p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] shadow-2xl after:absolute after:inset-x-0 after:top-full after:h-12 after:bg-surface sm:rounded-3xl sm:border sm:pb-5 sm:after:hidden ${
          closing ? 'animate-sheet-out sm:animate-dialog-out' : 'animate-sheet-in sm:animate-dialog-in'
        }`}
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
            className="press flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-zinc-400 hover:text-white [--press-scale:0.85]"
          >
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
