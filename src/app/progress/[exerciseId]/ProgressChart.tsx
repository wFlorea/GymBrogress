'use client'

import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react'
import { formatMonth } from '@/lib/date'
import { formatKg } from '@/lib/format'
import type { MonthlyBest } from '@/lib/types'

const HEIGHT = 240
const PAD = { top: 28, right: 18, bottom: 40, left: 40 }
/** Room each month label needs on the x axis. */
const LABEL_WIDTH = 52

/** A round axis maximum just above `value`, split into about four steps. */
function niceScale(value: number): { max: number; step: number } {
  if (value <= 0) return { max: 20, step: 5 }
  const rough = value / 4
  const magnitude = 10 ** Math.floor(Math.log10(rough))
  const step = [1, 2, 2.5, 5, 10].map((m) => m * magnitude).find((s) => s >= rough)!
  return { max: Math.ceil(value / step) * step, step }
}

const formatTick = (value: number) => value.toLocaleString('en-GB', { maximumFractionDigits: 1 })

/**
 * Line chart of the heaviest set in each month. `months` is the whole x axis (every month since
 * the account was made); months without a workout have no point and the line joins their neighbours.
 */
export function ProgressChart({ months, points, label }: { months: string[]; points: MonthlyBest[]; label: string }) {
  const container = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(340)
  const [active, setActive] = useState<number | null>(null)

  useEffect(() => {
    const element = container.current
    if (!element) return
    const observer = new ResizeObserver(([entry]) => setWidth(Math.round(entry.contentRect.width)))
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  const plotWidth = width - PAD.left - PAD.right
  const plotHeight = HEIGHT - PAD.top - PAD.bottom
  const monthIndex = new Map(months.map((month, i) => [month, i]))
  const x = (i: number) => PAD.left + (months.length === 1 ? plotWidth / 2 : (i / (months.length - 1)) * plotWidth)
  const scale = niceScale(Math.max(...points.map((p) => p.maxWeight)))
  const y = (value: number) => PAD.top + plotHeight - (value / scale.max) * plotHeight
  const ticks = Array.from({ length: Math.round(scale.max / scale.step) + 1 }, (_, i) => i * scale.step)

  const coords = points.map((p) => ({ ...p, cx: x(monthIndex.get(p.month) ?? 0), cy: y(p.maxWeight) }))
  const line = coords.map((c, i) => `${i === 0 ? 'M' : 'L'}${c.cx},${c.cy}`).join(' ')
  const first = coords[0]
  const last = coords.at(-1)!
  const area = coords.length > 1 ? `${line} L${last.cx},${y(0)} L${first.cx},${y(0)} Z` : null

  // Label every n-th month, counting back from the current one so it is always labelled.
  const labelEvery = Math.max(1, Math.ceil(months.length / Math.max(1, Math.floor(plotWidth / LABEL_WIDTH))))
  const labelled = months.filter((_, i) => (months.length - 1 - i) % labelEvery === 0)

  function pick(event: PointerEvent<SVGSVGElement>) {
    const left = event.currentTarget.getBoundingClientRect().left
    const pointerX = event.clientX - left
    let nearest = 0
    coords.forEach((c, i) => {
      if (Math.abs(c.cx - pointerX) < Math.abs(coords[nearest].cx - pointerX)) nearest = i
    })
    setActive(nearest)
  }

  function onKeyDown(event: KeyboardEvent<SVGSVGElement>) {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return
    event.preventDefault()
    const step = event.key === 'ArrowLeft' ? -1 : 1
    setActive((i) => Math.min(coords.length - 1, Math.max(0, i === null ? coords.length - 1 : i + step)))
  }

  const shown = active === null ? null : coords[active]
  const tooltipBelow = shown !== null && shown.cy < PAD.top + 44

  return (
    <div ref={container} className="relative select-none">
      <svg
        width={width}
        height={HEIGHT}
        role="img"
        aria-label={label}
        tabIndex={0}
        onPointerDown={pick}
        onPointerMove={pick}
        onPointerLeave={(e) => e.pointerType === 'mouse' && setActive(null)}
        onKeyDown={onKeyDown}
        onBlur={() => setActive(null)}
        className="block touch-pan-y rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
      >
        {ticks.map((tick) => (
          <g key={tick}>
            <line x1={PAD.left} x2={width - PAD.right} y1={y(tick)} y2={y(tick)} className="stroke-border" strokeWidth={1} />
            <text x={PAD.left - 8} y={y(tick)} dy="0.32em" textAnchor="end" className="fill-muted text-[10px] tabular-nums">
              {formatTick(tick)}
            </text>
          </g>
        ))}

        {labelled.map((month, i) => {
          const isJanuary = month.endsWith('-01')
          return (
            <text key={month} x={x(monthIndex.get(month)!)} y={HEIGHT - PAD.bottom + 16} textAnchor="middle" className="fill-muted text-[10px]">
              {formatMonth(month, { month: 'short' })}
              {(i === 0 || isJanuary) && (
                <tspan x={x(monthIndex.get(month)!)} dy="1.2em" className="text-[9px]">
                  {month.slice(0, 4)}
                </tspan>
              )}
            </text>
          )
        })}

        {area && <path d={area} className="fill-primary/10" />}
        {coords.length > 1 && (
          <path d={line} fill="none" className="stroke-primary" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
        )}

        {shown && (
          <line x1={shown.cx} x2={shown.cx} y1={PAD.top - 8} y2={y(0)} className="stroke-zinc-500" strokeWidth={1} />
        )}

        {coords.map((c, i) => (
          <circle
            key={c.month}
            cx={c.cx}
            cy={c.cy}
            r={active === i ? 6 : 4}
            className="fill-primary stroke-surface"
            strokeWidth={2}
          />
        ))}

        {active === null && (
          <text
            x={last.cx}
            y={last.cy - 12}
            textAnchor={last.cx > width - PAD.right - 24 ? 'end' : 'middle'}
            className="fill-white text-[11px] font-bold"
          >
            {formatKg(last.maxWeight)}
          </text>
        )}
      </svg>

      {shown && (
        <div
          className="pointer-events-none absolute z-10 whitespace-nowrap rounded-lg border border-border bg-sunken px-2.5 py-1.5 text-center shadow-lg"
          style={{
            left: Math.min(Math.max(shown.cx, 48), width - 48),
            top: shown.cy,
            transform: tooltipBelow ? 'translate(-50%, 14px)' : 'translate(-50%, calc(-100% - 14px))',
          }}
        >
          <span className="block text-sm font-black text-white">{formatKg(shown.maxWeight)}</span>
          <span className="block text-[10px] font-bold text-muted">{formatMonth(shown.month, { month: 'long', year: 'numeric' })}</span>
        </div>
      )}
    </div>
  )
}
