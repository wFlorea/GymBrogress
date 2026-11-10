import { AmountField } from '@/components/ui/AmountField'
import { MACROS } from '@/lib/nutrition'
import type { ProductAmounts } from '@/lib/products'

/** The four numbers from a label's "per 100 g" column. */
export function Per100gFields({ amounts, onChange }: { amounts: ProductAmounts; onChange: (amounts: ProductAmounts) => void }) {
  return (
    <div className="space-y-3">
      <AmountField
        label="Calories per 100 g"
        unit="kcal"
        value={amounts.calories}
        onChange={(calories) => onChange({ ...amounts, calories })}
        placeholder="0"
      />
      <div className="grid grid-cols-3 gap-2">
        {MACROS.map(({ key, label }) => (
          <AmountField
            key={key}
            label={label}
            unit="g"
            value={amounts[key]}
            onChange={(value) => onChange({ ...amounts, [key]: value })}
            placeholder="0"
          />
        ))}
      </div>
    </div>
  )
}
