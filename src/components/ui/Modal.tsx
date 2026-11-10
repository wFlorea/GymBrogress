'use client'

import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { X } from 'lucide-react'

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

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
  const dialogRef = useRef<HTMLDivElement>(null)
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

  // For keyboards and screen readers: focus moves into the dialog, Tab stays inside it, and focus goes back on close.
  useEffect(() => {
    const dialog = dialogRef.current
    if (!open || !dialog) return
    const previous = document.activeElement
    // A field inside with autoFocus has already taken it.
    if (!dialog.contains(previous)) dialog.focus({ preventScroll: true })

    const keepTabInside = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return
      const focusable = [...dialog.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((el) => el.getClientRects().length > 0)
      const first = focusable[0] ?? dialog
      const last = focusable.at(-1) ?? dialog
      const active = document.activeElement
      if (!dialog.contains(active)) {
        e.preventDefault()
        first.focus()
      } else if (e.shiftKey && (active === first || active === dialog)) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && active === last) {
        e.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', keepTabInside)
    return () => {
      document.removeEventListener('keydown', keepTabInside)
      if (previous instanceof HTMLElement && previous.isConnected) previous.focus({ preventScroll: true })
    }
  }, [open])

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
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        onAnimationEnd={(e) => {
          // Unmount once the exit animation (sheet-out or dialog-out) is done.
          if (closing && e.target === e.currentTarget && e.animationName.endsWith('-out')) setShown(false)
        }}
        className={`relative flex max-h-[88vh] w-full max-w-lg flex-col rounded-t-3xl outline-none border-t border-border bg-surface p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] shadow-2xl after:absolute after:inset-x-0 after:top-full after:h-12 after:bg-surface sm:rounded-3xl sm:border sm:pb-5 sm:after:hidden ${
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
            className="press flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface text-foreground/60 hover:text-white [--press-scale:0.85]"
          >
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
