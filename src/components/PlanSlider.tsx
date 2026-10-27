'use client'

import { useRef, type KeyboardEvent, type PointerEvent } from 'react'
import { Dumbbell, Equal, Flame, type LucideIcon } from 'lucide-react'
import { WEIGHT_PLANS } from '@/lib/nutrition'
import type { WeightPlan } from '@/lib/types'

const PLAN_ICONS: Record<WeightPlan, LucideIcon> = { cut: Flame, maintain: Equal, bulk: Dumbbell }

const STEP_KEYS: Record<string, number> = { ArrowUp: 1, ArrowRight: 1, ArrowDown: -1, ArrowLeft: -1 }

/** Where stop `index` sits across the slider, in %: the middle of its third. */
const stopPercent = (index: number) => ((index * 2 + 1) / (WEIGHT_PLANS.length * 2)) * 100

/** Cut, maintain or bulk, picked by sliding (or tapping) along a track with a stop for each. */
export function PlanSlider({ value, onChange }: { value: WeightPlan; onChange: (plan: WeightPlan) => void }) {
  const dragging = useRef(false)
  const index = WEIGHT_PLANS.findIndex((plan) => plan.key === value)
  const current = WEIGHT_PLANS[index]
  const CurrentIcon = PLAN_ICONS[value]
  const middle = stopPercent(1)
  const thumb = stopPercent(index)

  function choose(next: number) {
    const plan = WEIGHT_PLANS[Math.min(Math.max(next, 0), WEIGHT_PLANS.length - 1)].key
    if (plan !== value) onChange(plan)
  }

  /** The stop under the pointer: whichever third of the slider it's in. */
  function stopAt(event: PointerEvent<HTMLDivElement>) {
    const box = event.currentTarget.getBoundingClientRect()
    return Math.floor(((event.clientX - box.left) / box.width) * WEIGHT_PLANS.length)
  }

  function startDragging(event: PointerEvent<HTMLDivElement>) {
    dragging.current = true
    event.currentTarget.setPointerCapture(event.pointerId)
    choose(stopAt(event))
  }

  function drag(event: PointerEvent<HTMLDivElement>) {
    if (dragging.current) choose(stopAt(event))
  }

  function stopDragging() {
    dragging.current = false
  }

  function step(event: KeyboardEvent<HTMLDivElement>) {
    const next =
      event.key === 'Home'
        ? 0
        : event.key === 'End'
          ? WEIGHT_PLANS.length - 1
          : event.key in STEP_KEYS
            ? index + STEP_KEYS[event.key]
            : null
    if (next === null) return
    event.preventDefault()
    choose(next)
  }

  return (
    <div>
      <p className="mb-1.5 text-xs font-semibold text-muted">Plan</p>
      <div className="rounded-2xl border border-border bg-sunken px-2 pb-3 pt-4">
        <div
          className="cursor-pointer touch-none select-none rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
          role="slider"
          tabIndex={0}
          aria-label="Plan"
          aria-valuemin={0}
          aria-valuemax={WEIGHT_PLANS.length - 1}
          aria-valuenow={index}
          aria-valuetext={current.label}
          onPointerDown={startDragging}
          onPointerMove={drag}
          onPointerUp={stopDragging}
          onPointerCancel={stopDragging}
          onKeyDown={step}
        >
          <div className="relative h-12">
            <span
              className="absolute top-1/2 h-1 -translate-y-1/2 rounded-full bg-white/10"
              style={{ left: `${stopPercent(0)}%`, right: `${100 - stopPercent(WEIGHT_PLANS.length - 1)}%` }}
            />
            {/* Fills from Maintain, in the middle, out to the plan. */}
            <span
              className="absolute top-1/2 h-1 -translate-y-1/2 rounded-full bg-primary transition-[left,right] duration-500 ease-spring"
              style={{ left: `${Math.min(middle, thumb)}%`, right: `${100 - Math.max(middle, thumb)}%` }}
            />
            {WEIGHT_PLANS.map(({ key }, i) => {
              const Icon = PLAN_ICONS[key]
              return (
                <span
                  key={key}
                  className="absolute top-1/2 flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-surface text-muted"
                  style={{ left: `${stopPercent(i)}%` }}
                  aria-hidden
                >
                  <Icon size={18} />
                </span>
              )
            })}
            <span
              className="absolute top-1/2 flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-primary text-white shadow-lg shadow-primary/30 transition-[left] duration-500 ease-spring"
              style={{ left: `${thumb}%` }}
              aria-hidden
            >
              <CurrentIcon key={value} size={22} className="animate-pop" />
            </span>
          </div>
          <div className="mt-2 grid grid-cols-3 text-center text-xs font-semibold" aria-hidden>
            {WEIGHT_PLANS.map(({ key, label }) => (
              <span key={key} className={key === value ? 'text-white' : 'text-muted'}>
                {label}
              </span>
            ))}
          </div>
        </div>
        <p className="mt-2 text-center text-[11px] text-muted">{current.description}.</p>
      </div>
    </div>
  )
}
