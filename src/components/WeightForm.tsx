'use client'

import { useState, useTransition, type FormEvent } from 'react'
import { Check, Loader2, Pencil } from 'lucide-react'
import { logWeeklyWeight } from '@/app/dashboard/actions'
import { AmountField } from '@/components/ui/AmountField'
import { Alert } from '@/components/ui/Card'
import { SubmitButton } from '@/components/ui/SubmitButton'
import { buttonStyles } from '@/components/ui/styles'
import { formatWeight } from '@/lib/format'
import type { WeightUnit } from '@/lib/types'
import { toKg, weightText } from '@/lib/units'
import { parseAmount } from '@/lib/nutrition'

/**
 * This week's weigh-in: one tap logs the last weight again, or "New weight" opens a field that starts at it.
 * Without a last weight, or when `editing` this week's, the field shows straight away.
 */
export function WeightForm({
  lastWeight,
  editing = false,
  unit,
  onSaved,
}: {
  lastWeight: number | null
  editing?: boolean
  unit: WeightUnit
  onSaved?: () => void
}) {
  const [typing, setTyping] = useState(editing || lastWeight === null)
  const [text, setText] = useState(weightText(lastWeight, unit))
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function save(weight: number) {
    setError(null)
    startTransition(async () => {
      const result = await logWeeklyWeight(weight)
      if (!result.ok) return setError(result.error)
      onSaved?.()
    })
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const weight = parseAmount(text)
    if (weight === null || Number.isNaN(weight)) return setError(`Enter your weight in ${unit}, like ${unit === 'kg' ? '72.5' : '160'}.`)
    save(toKg(weight, unit))
  }

  return (
    <div className="space-y-3">
      {typing || lastWeight === null ? (
        <form onSubmit={submit} className="space-y-3">
          <AmountField label="Your weight this week" unit={unit} value={text} onChange={setText} placeholder={unit === 'kg' ? '72.5' : '160'} />
          <SubmitButton pending={pending} pendingLabel="Saving…">
            <Check size={18} /> Save weight
          </SubmitButton>
        </form>
      ) : (
        <div className="grid grid-cols-[1fr_auto] gap-2">
          <button type="button" onClick={() => save(lastWeight)} disabled={pending} className={buttonStyles.primary}>
            {pending ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
            Same, {formatWeight(lastWeight, unit)}
          </button>
          <button
            type="button"
            onClick={() => setTyping(true)}
            disabled={pending}
            className={`${buttonStyles.secondary} text-sm`}
          >
            <Pencil size={14} /> New weight
          </button>
        </div>
      )}
      {error && <Alert>{error}</Alert>}
    </div>
  )
}
