'use client'

import { useState, useTransition, type FormEvent } from 'react'
import Link from 'next/link'
import { Camera, Check, ChevronLeft } from 'lucide-react'
import { Field } from '@/components/ui/AmountField'
import { Alert } from '@/components/ui/Card'
import { SubmitButton } from '@/components/ui/SubmitButton'
import { buttonStyles, inputStyles } from '@/components/ui/styles'
import { MAX_FOOD_NAME_LENGTH } from '@/lib/nutrition'
import { NO_PRODUCT_AMOUNTS, cleanProduct, parsePer100g } from '@/lib/products'
import { WAITING_PRODUCT_DAYS } from '@/lib/retention'
import type { CatalogFood } from '@/lib/types'
import { submitProduct } from './actions'
import { Per100gFields } from './Per100gFields'
import { uploadProductPhoto } from './photos'

/** Sends in a product whose barcode wasn't found, then carries on to logging it. */
export function AddProductForm({
  barcode,
  initialName,
  onBack,
  onSubmitted,
}: {
  barcode: string
  initialName: string
  onBack: () => void
  onSubmitted: (food: CatalogFood) => void
}) {
  const [name, setName] = useState(initialName)
  const [amounts, setAmounts] = useState(NO_PRODUCT_AMOUNTS)
  const [frontPhoto, setFrontPhoto] = useState<File | null>(null)
  const [labelPhoto, setLabelPhoto] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const per100g = parsePer100g(amounts)
    if (!per100g) return setError("Fill in all four numbers from the label's per 100 g column.")
    const product = cleanProduct({ name, per100g })
    if (typeof product === 'string') return setError(product)
    if (!frontPhoto || !labelPhoto) return setError('Add both photos, so we can check the product.')

    setError(null)
    startTransition(async () => {
      let photos: string[]
      try {
        photos = await Promise.all([uploadProductPhoto(frontPhoto), uploadProductPhoto(labelPhoto)])
      } catch (uploadError) {
        console.error('uploadProductPhoto:', uploadError)
        return setError("Couldn't send the photos. Check your connection and try again.")
      }
      try {
        const result = await submitProduct({ barcode, ...product, frontPhoto: photos[0], labelPhoto: photos[1] })
        if (!result.ok) return setError(result.error)
        onSubmitted(result.data)
      } catch {
        setError("Couldn't send the product. Check your connection and try again.")
      }
    })
  }

  return (
    <form onSubmit={submit} className="min-h-0 space-y-4 overflow-y-auto pt-4">
      <div className="flex items-end gap-3">
        <button type="button" onClick={onBack} aria-label="Back to scanner" className={`${buttonStyles.icon} mb-1.5`}>
          <ChevronLeft size={18} />
        </button>
        <div className="min-w-0 flex-1">
          <Field label="Product">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              maxLength={MAX_FOOD_NAME_LENGTH}
              placeholder="e.g. Butter croissant"
              autoComplete="off"
              className={inputStyles}
            />
          </Field>
        </div>
      </div>

      <Per100gFields amounts={amounts} onChange={setAmounts} />

      <div className="grid grid-cols-2 gap-2">
        <PhotoPicker label="Front of the pack" file={frontPhoto} onPick={setFrontPhoto} />
        <PhotoPicker label="Nutrition table and barcode" file={labelPhoto} onPick={setLabelPhoto} />
      </div>
      <p className="text-[11px] leading-relaxed text-muted">
        Barcode {barcode}. You can log it right away, and once we&apos;ve checked it, it works for everyone. Only we see your
        photos, and they&apos;re deleted after the check, or after {WAITING_PRODUCT_DAYS} days at the latest. By sending this, you agree that its name, barcode and nutrition
        values can be shared with everyone using the app (
        <Link href="/terms" target="_blank" className="font-semibold text-primary hover:underline">
          Terms
        </Link>
        ).
      </p>

      {error && <Alert>{error}</Alert>}

      <SubmitButton pending={pending} pendingLabel="Sending…">
        Send and continue
      </SubmitButton>
    </form>
  )
}

function PhotoPicker({ label, file, onPick }: { label: string; file: File | null; onPick: (file: File) => void }) {
  return (
    <label className="flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-control bg-sunken p-4 text-center text-xs text-muted hover:border-primary has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-primary/60">
      {file ? <Check size={20} className="text-primary" /> : <Camera size={20} />}
      <span>{label}</span>
      {file && <span className="text-[11px] text-primary">Added, tap to change</span>}
      <input
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(e) => {
          const picked = e.target.files?.[0]
          if (picked) onPick(picked)
        }}
      />
    </label>
  )
}
