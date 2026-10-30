'use client'

import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react'
import { addDays, daysBetween, formatDate } from '@/lib/date'
import { formatKg } from '@/lib/format'
import type { IsoDate } from '@/lib/types'

/** A weight in kg on a date. */
export interface ChartPoint {
  date: IsoDate
  value: number
}

const HEIGHT = 240
const PAD = { top: 28, right: 24, bottom: 40, left: 40 }
/** Room each date label needs on the x axis. */
const LABEL_WIDTH = 52
/** Below this many pixels per point the dots would crowd the line, so only the line is drawn. */
const DOT_SPACING = 12
/** Room above and below the line when the axis fits the data, in kg, so a flat line doesn't sit on an edge. */
const FIT_PADDING = 0.5

/** Round axis bounds around `low` to `high`, split into about four steps. */
function niceScale(low: number, high: number): { min: number; max: number; step: number } {
  if (high <= 0) return { min: 0, max: 20, step: 5 }
  const rough = (high - low) / 4
  const magnitude = 10 ** Math.floor(Math.log10(rough))
  const step = [1, 2, 2.5, 5, 10].map((m) => m * magnitude).find((s) => s >= rough)!
  return { min: Math.floor(low / step) * step, max: Math.ceil(high / step) * step, step }
}

const formatTick = (value: number) => value.toLocaleString('en-GB', { maximumFractionDigits: 2 })

/**
 * Line chart of weights over time. The x axis is time, from the first point to the latest, so gaps
 * show as longer stretches of line. The y axis starts at 0, or with `fitToData` wraps the values
 * closely so small changes, like a body weight's, stay visible.
 */
export function LineChart({
  points,
  label,
  fitToData = false,
  tooltipPrefix = '',
}: {
  points: ChartPoint[]
  label: string
  fitToData?: boolean
  /** Put before the date in the tooltip, like "Week of ". */
  tooltipPrefix?: string
}) {
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
  const start = points[0].date
  const span = daysBetween(start, points.at(-1)!.date)
  const x = (date: string) => PAD.left + (span === 0 ? plotWidth / 2 : (daysBetween(start, date) / span) * plotWidth)
  const values = points.map((p) => p.value)
  const scale = fitToData
    ? niceScale(Math.min(...values) - FIT_PADDING, Math.max(...values) + FIT_PADDING)
    : niceScale(0, Math.max(...values))
  const y = (value: number) => PAD.top + plotHeight - ((value - scale.min) / (scale.max - scale.min)) * plotHeight
  const bottom = y(scale.min)
  const ticks = Array.from(
    { length: Math.round((scale.max - scale.min) / scale.step) + 1 },
    (_, i) => scale.min + i * scale.step
  )

  const coords = points.map((p) => ({ ...p, cx: x(p.date), cy: y(p.value) }))
  const line = coords.map((c, i) => `${i === 0 ? 'M' : 'L'}${c.cx},${c.cy}`).join(' ')
  const first = coords[0]
  const last = coords.at(-1)!
  const area = coords.length > 1 ? `${line} L${last.cx},${bottom} L${first.cx},${bottom} Z` : null
  const showDots = coords.length <= plotWidth / DOT_SPACING

  // Evenly spaced dates from the first workout to the latest, as many as fit.
  const tickCount = Math.max(2, Math.min(span + 1, Math.floor(plotWidth / LABEL_WIDTH)))
  const dateTicks = [
    ...new Set(Array.from({ length: tickCount }, (_, i) => addDays(start, Math.round((i * span) / (tickCount - 1))))),
  ]

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
        <defs>
          <linearGradient id="line-chart-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="var(--color-primary)" stopOpacity={0.3} />
            <stop offset="1" stopColor="var(--color-primary)" stopOpacity={0} />
          </linearGradient>
        </defs>

        {ticks.map((tick) => (
          <g key={tick}>
            <line x1={PAD.left} x2={width - PAD.right} y1={y(tick)} y2={y(tick)} className="stroke-white/5" strokeWidth={1} />
            <text x={PAD.left - 8} y={y(tick)} dy="0.32em" textAnchor="end" className="fill-muted text-[10px] tabular-nums">
              {formatTick(tick)}
            </text>
          </g>
        ))}

        {dateTicks.map((date, i) => {
          const newYear = i === 0 || date.slice(0, 4) !== dateTicks[i - 1].slice(0, 4)
          return (
            <text key={date} x={x(date)} y={HEIGHT - PAD.bottom + 16} textAnchor="middle" className="fill-muted text-[10px]">
              {formatDate(date, { day: 'numeric', month: 'short' })}
              {newYear && (
                <tspan x={x(date)} dy="1.2em" className="text-[9px]">
                  {date.slice(0, 4)}
                </tspan>
              )}
            </text>
          )
        })}

        {area && <path d={area} fill="url(#line-chart-fill)" />}
        {coords.length > 1 && (
          <path d={line} fill="none" className="stroke-primary" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
        )}

        {shown && (
          <line x1={shown.cx} x2={shown.cx} y1={PAD.top - 8} y2={bottom} className="stroke-white/30" strokeWidth={1} />
        )}

        {coords.map(
          (c, i) =>
            (showDots || i === active || c === last) && (
              <circle
                key={c.date}
                cx={c.cx}
                cy={c.cy}
                r={active === i ? 6 : 4}
                className="fill-primary stroke-surface"
                strokeWidth={2}
              />
            )
        )}

        {active === null && (
          <text
            x={last.cx}
            y={last.cy - 12}
            textAnchor={last.cx > width - PAD.right - 24 ? 'end' : 'middle'}
            className="fill-white text-[11px] font-bold"
          >
            {formatKg(last.value)}
          </text>
        )}
      </svg>

      {shown && (
        <div
          className="pointer-events-none absolute z-10 whitespace-nowrap rounded-xl border border-white/10 bg-sunken px-3 py-1.5 text-center shadow-lg shadow-black/40"
          style={{
            left: Math.min(Math.max(shown.cx, 56), width - 56),
            top: shown.cy,
            transform: tooltipBelow ? 'translate(-50%, 14px)' : 'translate(-50%, calc(-100% - 14px))',
          }}
        >
          <span className="block text-sm font-black text-white">{formatKg(shown.value)}</span>
          <span className="block text-[10px] font-bold text-muted">
            {tooltipPrefix}
            {formatDate(shown.date, { day: 'numeric', month: 'long', year: 'numeric' })}
          </span>
        </div>
      )}
    </div>
  )
}
