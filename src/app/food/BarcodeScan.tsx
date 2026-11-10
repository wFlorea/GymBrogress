'use client'

import { useCallback, useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { ChevronLeft, Loader2 } from 'lucide-react'
import { Alert } from '@/components/ui/Card'
import { buttonStyles, inputStyles } from '@/components/ui/styles'
import { normalizeBarcode } from '@/lib/barcode'
import type { CatalogFood } from '@/lib/types'
import { lookupFoodBarcode } from './actions'
import { useBarcodeCamera, type CameraProblem } from './scanner'

type Phase =
  | { step: 'scanning' }
  | { step: 'looking'; code: string }
  | { step: 'unknown'; code: string }
  | { step: 'incomplete'; code: string; name: string }
  | { step: 'failed'; code: string; error: string }

const CAMERA_PROBLEMS: Record<CameraProblem, string> = {
  denied: 'Camera access is off. Allow it for this site in your browser settings, or type the number below.',
  unavailable: "Couldn't open the camera. Type the number printed under the barcode instead.",
  scanner: "The scanner couldn't start. Type the number printed under the barcode instead.",
}

/** Finds a packaged food by its barcode, from the camera or typed in. */
export function BarcodeScan({
  onBack,
  onFound,
  onManual,
  onAddProduct,
}: {
  onBack: () => void
  onFound: (food: CatalogFood) => void
  /** Opens the manual form, starting from this name. */
  onManual: (name: string) => void
  /** Opens the form that adds this barcode to the database, starting from this name. */
  onAddProduct: (barcode: string, name: string) => void
}) {
  const [phase, setPhase] = useState<Phase>({ step: 'scanning' })
  const [typed, setTyped] = useState('')
  const [typedError, setTypedError] = useState<string | null>(null)
  const onCode = useCallback((code: string) => setPhase({ step: 'looking', code }), [])
  const { videoRef, problem } = useBarcodeCamera(phase.step === 'scanning', onCode)
  const lookingFor = phase.step === 'looking' ? phase.code : null

  useEffect(() => {
    if (!lookingFor) return
    // Going back cancels this, so a slow answer can't open a form on the screen you've moved to.
    let cancelled = false
    lookupFoodBarcode(lookingFor)
      .then((result) => {
        if (cancelled) return
        if (!result.ok) setPhase({ step: 'failed', code: lookingFor, error: result.error })
        else if (result.data.status === 'found') onFound(result.data.food)
        else if (result.data.status === 'incomplete') setPhase({ step: 'incomplete', code: lookingFor, name: result.data.name })
        else setPhase({ step: 'unknown', code: lookingFor })
      })
      .catch(() => {
        if (!cancelled) {
          setPhase({ step: 'failed', code: lookingFor, error: "Couldn't reach the product database. Check your connection and try again." })
        }
      })
    return () => {
      cancelled = true
    }
  }, [lookingFor, onFound])

  function findTyped(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const code = normalizeBarcode(typed)
    if (!code) return setTypedError("That doesn't look like a barcode. Check the digits and try again.")
    setTypedError(null)
    setPhase({ step: 'looking', code })
  }

  const scanAgain = (
    <button type="button" onClick={() => setPhase({ step: 'scanning' })} className={`${buttonStyles.secondary} w-full text-sm`}>
      Scan again
    </button>
  )

  return (
    <div className="flex h-[min(70vh,36rem)] min-h-0 flex-col pt-4">
      <div className="mb-3 flex shrink-0 items-center gap-3">
        <button type="button" onClick={onBack} aria-label="Back to search" className={buttonStyles.icon}>
          <ChevronLeft size={18} />
        </button>
        <h3 className="font-semibold">Scan a barcode</h3>
      </div>

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto">
        {phase.step === 'scanning' && (
          <>
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-sunken">
              {/* Stays mounted when hidden: the camera needs it as soon as a retry starts. */}
              <video
                ref={videoRef}
                muted
                playsInline
                aria-label="Camera view"
                className={problem ? 'hidden' : 'h-full w-full object-cover'}
              />
              {problem ? (
                <p className="flex h-full items-center justify-center p-6 text-center text-sm text-muted">{CAMERA_PROBLEMS[problem]}</p>
              ) : (
                <div aria-hidden className="pointer-events-none absolute inset-x-6 top-1/2 h-24 -translate-y-1/2 rounded-xl border-2 border-primary/80" />
              )}
            </div>
            {!problem && <p className="text-center text-xs text-muted">Hold the barcode inside the box.</p>}

            <form onSubmit={findTyped} className="flex gap-2">
              <label className="min-w-0 flex-1">
                <span className="sr-only">Barcode number</span>
                <input
                  value={typed}
                  onChange={(e) => {
                    setTyped(e.target.value)
                    setTypedError(null)
                  }}
                  inputMode="numeric"
                  enterKeyHint="search"
                  autoComplete="off"
                  maxLength={16}
                  placeholder="Or type the number"
                  className={inputStyles}
                />
              </label>
              <button type="submit" className={`${buttonStyles.secondary} shrink-0 px-5 text-sm`}>
                Find
              </button>
            </form>
            {typedError && <Alert>{typedError}</Alert>}
          </>
        )}

        {phase.step === 'looking' && (
          <p className="flex items-center justify-center gap-2 py-16 text-sm text-muted" role="status">
            <Loader2 size={16} className="animate-spin" /> Looking up {phase.code}…
          </p>
        )}

        {phase.step === 'unknown' && (
          <Outcome title="Not in the database yet" text="Add it with two photos of the pack, and once we've checked it, it works for everyone.">
            <button type="button" onClick={() => onAddProduct(phase.code, '')} className={`${buttonStyles.primary} w-full`}>
              Add this product
            </button>
            <button type="button" onClick={() => onManual('')} className={`${buttonStyles.secondary} w-full text-sm`}>
              Enter it manually
            </button>
            {scanAgain}
          </Outcome>
        )}

        {phase.step === 'incomplete' && (
          <Outcome title={phase.name} text="We found this product, but not its full nutrition details. Add them with two photos of the pack.">
            <button type="button" onClick={() => onAddProduct(phase.code, phase.name)} className={`${buttonStyles.primary} w-full`}>
              Add this product
            </button>
            <button type="button" onClick={() => onManual(phase.name)} className={`${buttonStyles.secondary} w-full text-sm`}>
              Enter it manually
            </button>
            {scanAgain}
          </Outcome>
        )}

        {phase.step === 'failed' && (
          <Outcome title="Couldn't look that up" text={phase.error}>
            <button type="button" onClick={() => setPhase({ step: 'looking', code: phase.code })} className={`${buttonStyles.primary} w-full`}>
              Try again
            </button>
            {scanAgain}
          </Outcome>
        )}
      </div>

      <p className="mt-3 shrink-0 px-1 text-[10px] leading-relaxed text-muted">
        Products from{' '}
        <a href="https://world.openfoodfacts.org" target="_blank" rel="noreferrer" className="underline">
          Open Food Facts
        </a>{' '}
        (ODbL), so check the label when it matters.
      </p>
    </div>
  )
}

function Outcome({ title, text, children }: { title: string; text: string; children: ReactNode }) {
  return (
    <div className="space-y-5 py-6 text-center">
      <div>
        <h4 className="font-semibold text-white">{title}</h4>
        <p className="mt-1 text-sm leading-relaxed text-muted">{text}</p>
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  )
}
