'use client'

import Image from 'next/image'
import { useState, useTransition } from 'react'
import { Field } from '@/components/ui/AmountField'
import { Alert, Card } from '@/components/ui/Card'
import { buttonStyles, inputStyles } from '@/components/ui/styles'
import { Per100gFields } from '@/app/food/Per100gFields'
import { MAX_FOOD_NAME_LENGTH } from '@/lib/nutrition'
import { parsePer100g, type ProductAmounts } from '@/lib/products'
import type { ActionResult, Nutrition, ProductSubmission } from '@/lib/types'
import { approveProduct, rejectProduct } from './actions'

function amountsOf({ calories, protein, carbs, fat }: Nutrition): ProductAmounts {
  return { calories: String(calories), protein: String(protein), carbs: String(carbs), fat: String(fat) }
}

export function ReviewClient({ products }: { products: ProductSubmission[] }) {
  if (products.length === 0) {
    return (
      <Card>
        <p className="text-center text-sm text-muted">Nothing to check right now.</p>
      </Card>
    )
  }
  return (
    <div className="space-y-4">
      {products.map((product) => (
        <ReviewCard key={product.id} product={product} />
      ))}
    </div>
  )
}

function ReviewCard({ product }: { product: ProductSubmission }) {
  const [name, setName] = useState(product.name)
  const [amounts, setAmounts] = useState(() => amountsOf(product.per100g))
  const [confirmingReject, setConfirmingReject] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function run(action: () => Promise<ActionResult>) {
    setError(null)
    startTransition(async () => {
      try {
        const result = await action()
        if (!result.ok) setError(result.error)
      } catch {
        setError("Couldn't reach the server. Check your connection and try again.")
      }
    })
  }

  function approve() {
    const per100g = parsePer100g(amounts)
    if (!per100g) return setError('Fill in all four numbers.')
    run(() => approveProduct(product.id, { name, per100g }))
  }

  function reject() {
    // It can't be undone, so the first tap only asks.
    if (!confirmingReject) return setConfirmingReject(true)
    run(() => rejectProduct(product.id))
  }

  return (
    <Card className="space-y-3">
      <p className="text-xs text-muted">Barcode {product.barcode}</p>
      <div className="grid grid-cols-2 gap-2">
        <Photo url={product.frontPhotoUrl} label="Front of the pack" />
        <Photo url={product.labelPhotoUrl} label="Nutrition table and barcode" />
      </div>

      <Field label="Product">
        <input value={name} onChange={(e) => setName(e.target.value)} maxLength={MAX_FOOD_NAME_LENGTH} autoComplete="off" className={inputStyles} />
      </Field>
      <Per100gFields amounts={amounts} onChange={setAmounts} />

      {error && <Alert>{error}</Alert>}

      <div className="grid grid-cols-2 gap-2">
        <button type="button" onClick={reject} disabled={pending} className={`${buttonStyles.secondary} text-sm`}>
          {confirmingReject ? 'Tap again to reject' : 'Reject'}
        </button>
        <button type="button" onClick={approve} disabled={pending} className={`${buttonStyles.primary} text-sm`}>
          Approve
        </button>
      </div>
    </Card>
  )
}

function Photo({ url, label }: { url: string | null; label: string }) {
  if (!url) {
    return <p className="flex aspect-[3/4] items-center justify-center rounded-xl bg-sunken p-3 text-center text-xs text-muted">Couldn&apos;t load this photo</p>
  }
  return (
    <a href={url} target="_blank" rel="noreferrer" className="relative block aspect-[3/4] overflow-hidden rounded-xl bg-sunken">
      {/* Short-lived private links: they can't go through the image optimizer. */}
      <Image src={url} alt={label} fill unoptimized className="object-cover" />
    </a>
  )
}
