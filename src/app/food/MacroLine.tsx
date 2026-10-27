import { formatGrams } from '@/lib/format'
import { MACROS } from '@/lib/nutrition'
import type { Nutrition } from '@/lib/types'

/** "P 30 g  C 45 g  F 12 g", each letter in its macro's colour. */
export function MacroLine({ food }: { food: Nutrition }) {
  return (
    <span className="mt-0.5 flex flex-wrap gap-x-2.5 text-[11px] text-muted">
      {MACROS.map(({ key, label, short, text }) => (
        <span key={key}>
          <abbr title={label} className={`font-bold no-underline ${text}`}>
            {short}
          </abbr>{' '}
          {formatGrams(food[key])}
        </span>
      ))}
    </span>
  )
}
