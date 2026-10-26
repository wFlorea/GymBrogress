'use client'

import { useEffect, useState } from 'react'
import { Flame } from 'lucide-react'

const REST_SECONDS = 90
const RIM_RADIUS = 105
// The non-breaking space survives where the circle closes; a normal trailing space would be trimmed.
const RIM_TEXT = 'GYMBROGRESS • 20 KG • '.repeat(3)
const TIMER_RADIUS = 142
const TIMER_LENGTH = 2 * Math.PI * TIMER_RADIUS

/** Slide 1: a push/pull/legs week around the plate. Monday is "today". */
const WEEK = [
  { day: 'M', train: true },
  { day: 'T', train: true },
  { day: 'W', train: false },
  { day: 'T', train: true },
  { day: 'F', train: true },
  { day: 'S', train: true },
  { day: 'S', train: false },
]

/** Slide 3: weekly volume as bars around the plate, growing clockwise. */
const BARS = Array.from({ length: 28 }, (_, i) => {
  const wobble = i % 3 === 1 ? -4 : i % 4 === 0 ? 3 : 0
  return 8 + 30 * (i / 27) ** 1.3 + wobble
})

/** A point on a circle around the plate's centre; -90° is the top. Rounded so server and browser render the same. */
function polar(radius: number, degrees: number) {
  const radians = (degrees * Math.PI) / 180
  const round = (n: number) => Math.round(n * 100) / 100
  return { x: round(radius * Math.cos(radians)), y: round(radius * Math.sin(radians)) }
}

/**
 * The welcome screen's picture: a weight plate that turns as the slides are swiped.
 * `progress` is the scroll position in slides (0 → first, 1.5 → halfway between the second and third).
 */
export function WelcomePlate({ progress }: { progress: number }) {
  const restLeft = useRestCountdown(Math.round(progress) === 1)
  // Each slide's drawing fades out as the next one comes in.
  const shown = (slide: number) => ({ opacity: Math.max(0, 1 - Math.abs(progress - slide) * 1.5) })

  return (
    <svg viewBox="-180 -180 360 360" aria-hidden className="h-full w-full max-w-[24rem] overflow-visible">
      <defs>
        <radialGradient id="plate-glow">
          <stop offset="0%" style={{ stopColor: 'var(--color-primary)', stopOpacity: 0.3 }} />
          <stop offset="100%" style={{ stopColor: 'var(--color-primary)', stopOpacity: 0 }} />
        </radialGradient>
        <radialGradient id="plate-metal" cx="38%" cy="30%" r="80%">
          <stop offset="0%" style={{ stopColor: 'var(--color-surface-hover)' }} />
          <stop offset="100%" style={{ stopColor: 'var(--color-sunken)' }} />
        </radialGradient>
        <path
          id="plate-rim"
          d={`M 0 ${-RIM_RADIUS} A ${RIM_RADIUS} ${RIM_RADIUS} 0 1 1 0 ${RIM_RADIUS} A ${RIM_RADIUS} ${RIM_RADIUS} 0 1 1 0 ${-RIM_RADIUS}`}
        />
      </defs>

      <circle r="180" fill="url(#plate-glow)" />

      {/* The plate: raised rim with lettering that turns with the swipe, a recessed face with grooves. */}
      <circle r="122" fill="url(#plate-metal)" className="stroke-white/10" strokeWidth="1" />
      <g transform={`rotate(${Math.round(-progress * 1000) / 10})`}>
        <text className="fill-white/25 text-[10px] font-bold">
          <textPath href="#plate-rim" textLength={2 * Math.PI * RIM_RADIUS} lengthAdjust="spacing">
            {RIM_TEXT}
          </textPath>
        </text>
      </g>
      <circle r="96" className="fill-background/50 stroke-black/60" strokeWidth="2" />
      <circle r="84" fill="none" className="stroke-white/5" />
      <circle r="62" fill="none" className="stroke-white/5" />

      <g style={shown(0)}>
        {WEEK.map(({ day, train }, i) => {
          const { x, y } = polar(150, -90 + (i * 360) / WEEK.length)
          return (
            <g key={i} transform={`translate(${x} ${y})`}>
              {i === 0 && <circle r="19" fill="none" className="stroke-primary/50" strokeWidth="1.5" />}
              <circle r="14" className={train ? 'fill-primary' : 'fill-none stroke-border'} strokeWidth="1.5" />
              <text textAnchor="middle" dy="0.35em" className={`text-[11px] font-bold ${train ? 'fill-white' : 'fill-muted'}`}>
                {day}
              </text>
            </g>
          )
        })}
        <CenterText label="Today" value="Push" detail="6 exercises" serif />
      </g>

      <g style={shown(1)}>
        <circle r={TIMER_RADIUS} fill="none" className="stroke-white/5" strokeWidth="8" />
        <circle
          r={TIMER_RADIUS}
          fill="none"
          transform="rotate(-90)"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={TIMER_LENGTH}
          strokeDashoffset={TIMER_LENGTH * (1 - restLeft / REST_SECONDS)}
          className="stroke-primary motion-safe:transition-[stroke-dashoffset] motion-safe:duration-1000 motion-safe:ease-linear"
        />
        <CenterText
          label="Rest"
          value={`${Math.floor(restLeft / 60)}:${String(restLeft % 60).padStart(2, '0')}`}
          detail="Set 3 of 4"
        />
      </g>

      <g style={shown(2)}>
        {BARS.map((length, i) => {
          const angle = -78 + (i * 336) / (BARS.length - 1)
          const from = polar(132, angle)
          const to = polar(132 + length, angle)
          const recent = i >= BARS.length - 5
          return (
            <line
              key={i}
              x1={from.x}
              y1={from.y}
              x2={to.x}
              y2={to.y}
              strokeWidth="5"
              strokeLinecap="round"
              className={recent ? 'stroke-primary' : 'stroke-white'}
              style={recent ? undefined : { opacity: 0.1 + 0.3 * (i / BARS.length) }}
            />
          )
        })}
        <Flame x={-12} y={-50} size={24} className="fill-primary/25 text-primary" />
        <CenterText value="12" detail="day streak" serif />
      </g>
    </svg>
  )
}

function CenterText({ label, value, detail, serif = false }: { label?: string; value: string; detail: string; serif?: boolean }) {
  return (
    <>
      {label && (
        <text y="-24" textAnchor="middle" className="fill-muted text-[11px]">
          {label}
        </text>
      )}
      <text y="14" textAnchor="middle" className={`fill-white font-bold ${serif ? 'font-display text-[36px]' : 'text-[38px] tabular-nums'}`}>
        {value}
      </text>
      <text y="38" textAnchor="middle" className="fill-muted text-[11px]">
        {detail}
      </text>
    </>
  )
}

/** Seconds left on the pretend rest timer; it only ticks while its slide is showing and starts over at zero. */
function useRestCountdown(running: boolean) {
  const [left, setLeft] = useState(REST_SECONDS)
  useEffect(() => {
    if (!running) return
    const id = setInterval(() => setLeft((s) => (s <= 1 ? REST_SECONDS : s - 1)), 1000)
    return () => clearInterval(id)
  }, [running])
  return left
}
