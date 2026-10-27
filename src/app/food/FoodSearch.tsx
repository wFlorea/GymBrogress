'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { Loader2, PenLine, Search } from 'lucide-react'
import { buttonStyles, inputStyles } from '@/components/ui/styles'
import { searchCommonFoods } from '@/lib/foods-data'
import { formatGrams } from '@/lib/format'
import type { CatalogFood, FoodItem } from '@/lib/types'
import { searchFoodProducts } from './actions'
import { MacroLine } from './MacroLine'

/** Product searches wait this long after the last keystroke. */
const PRODUCT_SEARCH_DELAY = 350

type ProductResult = { foods: CatalogFood[]; error: null } | { foods: null; error: string }

/** Finds a food to log: recent foods, the built-in common foods, and packaged products from Open Food Facts. */
export function FoodSearch({
  query,
  onQueryChange,
  recentFoods,
  onPick,
  onPickRecent,
  onManual,
}: {
  query: string
  onQueryChange: (query: string) => void
  recentFoods: FoodItem[]
  onPick: (food: CatalogFood) => void
  onPickRecent: (food: FoodItem) => void
  onManual: () => void
}) {
  const text = query.trim()
  const commonFoods = searchCommonFoods(text)
  // Product results by search text, so going back to an earlier search doesn't ask again.
  const [products, setProducts] = useState<Record<string, ProductResult>>({})
  const searchesProducts = text.length >= 2
  const productResult = searchesProducts ? products[text] : undefined

  useEffect(() => {
    if (!searchesProducts || products[text]) return
    // A newer search cancels this one, so slow answers can't replace newer results.
    let cancelled = false
    const timer = setTimeout(async () => {
      const result = await searchFoodProducts(text)
      if (cancelled) return
      setProducts((all) => ({
        ...all,
        [text]: result.ok ? { foods: result.data, error: null } : { foods: null, error: result.error },
      }))
    }, PRODUCT_SEARCH_DELAY)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [text, searchesProducts, products])

  function retry() {
    setProducts((all) => {
      const rest = { ...all }
      delete rest[text]
      return rest
    })
  }

  return (
    <div className="flex h-[min(70vh,36rem)] min-h-0 flex-col pt-4">
      <label className="relative block shrink-0">
        <span className="sr-only">Search foods</span>
        <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
        <input
          type="search"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Search foods, like oats or Greek yogurt"
          enterKeyHint="search"
          autoComplete="off"
          autoFocus
          maxLength={60}
          className={`${inputStyles} pl-10`}
        />
      </label>

      <div className="-mx-2 mt-3 min-h-0 flex-1 space-y-4 overflow-y-auto px-2 pb-1">
        {!text && recentFoods.length > 0 && (
          <Section title="Recent">
            {recentFoods.map((food) => (
              <FoodRow
                key={food.name}
                name={food.name}
                nutrition={food}
                detail={food.grams === null ? undefined : formatGrams(food.grams)}
                onClick={() => onPickRecent(food)}
              />
            ))}
          </Section>
        )}
        {!text && recentFoods.length === 0 && (
          <p className="px-1 py-6 text-center text-sm text-muted">
            Search for what you ate and pick how much. The calories and macros are filled in for you.
          </p>
        )}

        {commonFoods.length > 0 && (
          <Section title="Common foods">
            {commonFoods.map((food) => (
              <CatalogRow key={food.id} food={food} onClick={() => onPick(food)} />
            ))}
          </Section>
        )}

        {searchesProducts && (
          <Section title="Products">
            {!productResult ? (
              <p className="flex items-center gap-2 px-3 py-2 text-xs text-muted" role="status">
                <Loader2 size={14} className="animate-spin" /> Searching products…
              </p>
            ) : productResult.error !== null ? (
              <div className="flex items-center justify-between gap-3 px-3 py-2 text-xs text-error" role="alert">
                <span>{productResult.error}</span>
                <button type="button" onClick={retry} className={buttonStyles.chip}>
                  Try again
                </button>
              </div>
            ) : productResult.foods.length === 0 ? (
              <p className="px-3 py-2 text-xs text-muted">No products found for “{text}”.</p>
            ) : (
              productResult.foods.map((food) => <CatalogRow key={food.id} food={food} onClick={() => onPick(food)} />)
            )}
          </Section>
        )}

        <button type="button" onClick={onManual} className={`${buttonStyles.secondary} w-full text-sm`}>
          <PenLine size={16} /> {text ? `Enter “${text}” manually` : 'Enter a food manually'}
        </button>

        <p className="px-1 text-[10px] leading-relaxed text-muted">
          Common foods from USDA FoodData Central. Products from{' '}
          <a href="https://world.openfoodfacts.org" target="_blank" rel="noreferrer" className="underline">
            Open Food Facts
          </a>{' '}
          (ODbL), added by its contributors, so check the label when it matters.
        </p>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section aria-label={title}>
      <h3 className="mb-1 px-1 text-xs font-semibold text-muted">{title}</h3>
      <ul className="-mx-1">{children}</ul>
    </section>
  )
}

/** A food from the database, with its nutrition per 100 g. */
function CatalogRow({ food, onClick }: { food: CatalogFood; onClick: () => void }) {
  return <FoodRow name={food.name} brand={food.brand} nutrition={food.per100g} detail="per 100 g" onClick={onClick} />
}

function FoodRow({
  name,
  brand,
  nutrition,
  detail,
  onClick,
}: {
  name: string
  brand?: string
  nutrition: CatalogFood['per100g']
  detail?: string
  onClick: () => void
}) {
  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        className="flex w-full items-center gap-3 rounded-xl px-2 py-2.5 text-left transition-colors hover:bg-white/[0.04]"
      >
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold text-white">
            {name}
            {brand && <span className="ml-1.5 font-normal text-muted">{brand}</span>}
          </span>
          <MacroLine food={nutrition} />
        </span>
        <span className="shrink-0 text-right">
          <span className="block text-sm font-bold tabular-nums">
            {Math.round(nutrition.calories).toLocaleString('en-GB')}
            <span className="ml-0.5 text-xs font-normal text-muted">kcal</span>
          </span>
          {detail && <span className="block text-[11px] text-muted">{detail}</span>}
        </span>
      </button>
    </li>
  )
}
