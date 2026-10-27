'use client'

import { useRef, type KeyboardEvent, type PointerEvent, type ReactNode, type SVGProps } from 'react'
import { Rabbit, Snail } from 'lucide-react'
import { PLAN_PACES } from '@/lib/nutrition'
import type { PlanPace } from '@/lib/types'

// The dial, in SVG units: the same ring as the body fat dial, open at the bottom like a speedometer.
const SIZE = 220
const CENTER = SIZE / 2
const RADIUS = 92
/** The ring runs clockwise from START to END, in degrees from the top; the paces sit evenly along it. */
const START = -135
const END = 135
const STOP_ANGLE = (END - START) / (PLAN_PACES.length - 1)
/** How far inside the ring a press still grabs it, so pressing the animal doesn't move the dot. */
const GRAB_DEPTH = 36
const ICON_SIZE = 84

const STEP_KEYS: Record<string, number> = { ArrowUp: 1, ArrowRight: 1, ArrowDown: -1, ArrowLeft: -1 }

const angleOf = (index: number) => START + index * STOP_ANGLE

function pointOn(angle: number) {
  const radians = (angle * Math.PI) / 180
  return { x: CENTER + RADIUS * Math.sin(radians), y: CENTER - RADIUS * Math.cos(radians) }
}

/** The ring from START to `angle`, as a path. */
function arcTo(angle: number) {
  const from = pointOn(START)
  const to = pointOn(angle)
  return `M ${from.x} ${from.y} A ${RADIUS} ${RADIUS} 0 ${angle - START > 180 ? 1 : 0} 1 ${to.x} ${to.y}`
}

/**
 * How fast a cut or bulk goes, picked by dragging a dot around a ring that snaps to the four paces. The animal in the
 * middle gets faster with the pace: snail, fox, rabbit, cheetah. `children` goes under the pace.
 */
export function PaceDial({
  label,
  value,
  onChange,
  children,
}: {
  /** "Cut pace", "Bulk pace" */
  label: string
  value: PlanPace
  onChange: (pace: PlanPace) => void
  children?: ReactNode
}) {
  const dragging = useRef(false)
  const index = PLAN_PACES.findIndex((pace) => pace.value === value)
  const current = PLAN_PACES[index]
  const knob = pointOn(angleOf(index))
  const Animal = ANIMALS[value]

  function choose(next: number) {
    const pace = PLAN_PACES[Math.min(Math.max(next, 0), PLAN_PACES.length - 1)].value
    if (pace !== value) onChange(pace)
  }

  /** The pace nearest the pointer (null in the gap at the bottom), and whether the pointer is on the ring. */
  function pointerAt(event: PointerEvent<SVGSVGElement>) {
    const box = event.currentTarget.getBoundingClientRect()
    const x = ((event.clientX - box.left) / box.width) * SIZE - CENTER
    const y = ((event.clientY - box.top) / box.height) * SIZE - CENTER
    const angle = (Math.atan2(x, -y) * 180) / Math.PI
    const inGap = angle < START || angle > END
    return {
      index: inGap ? null : Math.round((angle - START) / STOP_ANGLE),
      // Pressed in the gap, the nearer end.
      end: angle > 0 ? PLAN_PACES.length - 1 : 0,
      onRing: Math.hypot(x, y) >= RADIUS - GRAB_DEPTH,
    }
  }

  function startDragging(event: PointerEvent<SVGSVGElement>) {
    const pointer = pointerAt(event)
    if (!pointer.onRing) return
    dragging.current = true
    event.currentTarget.setPointerCapture(event.pointerId)
    choose(pointer.index ?? pointer.end)
  }

  function drag(event: PointerEvent<SVGSVGElement>) {
    if (!dragging.current) return
    // Across the gap the pace stays put, so it doesn't jump from one end to the other.
    const { index: next } = pointerAt(event)
    if (next !== null) choose(next)
  }

  function stopDragging() {
    dragging.current = false
  }

  function step(event: KeyboardEvent<SVGSVGElement>) {
    const next =
      event.key === 'Home'
        ? 0
        : event.key === 'End'
          ? PLAN_PACES.length - 1
          : event.key in STEP_KEYS
            ? index + STEP_KEYS[event.key]
            : null
    if (next === null) return
    event.preventDefault()
    choose(next)
  }

  return (
    <div>
      <p className="mb-1.5 text-xs font-semibold text-muted">{label}</p>
      <div className="flex flex-col items-center rounded-2xl border border-border bg-sunken px-4 pb-4 pt-5">
        <svg
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          className="w-full max-w-52 cursor-pointer touch-none select-none rounded-full outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
          role="slider"
          tabIndex={0}
          aria-label={label}
          aria-valuemin={PLAN_PACES[0].value}
          aria-valuemax={PLAN_PACES[PLAN_PACES.length - 1].value}
          aria-valuenow={value}
          aria-valuetext={`${value}%, ${current.label.toLowerCase()}`}
          onPointerDown={startDragging}
          onPointerMove={drag}
          onPointerUp={stopDragging}
          onPointerCancel={stopDragging}
          onKeyDown={step}
        >
          <path d={arcTo(END)} fill="none" strokeWidth={8} strokeLinecap="round" className="stroke-white/10" />
          {index > 0 && (
            <path d={arcTo(angleOf(index))} fill="none" strokeWidth={8} strokeLinecap="round" className="stroke-primary" />
          )}
          {PLAN_PACES.map((pace, i) => {
            const stop = pointOn(angleOf(i))
            return (
              <circle
                key={pace.value}
                cx={stop.x}
                cy={stop.y}
                r={3}
                className={i <= index ? 'fill-white/70' : 'fill-white/25'}
              />
            )
          })}
          <g key={value} className="animate-pop origin-center [transform-box:fill-box]">
            <Animal
              x={CENTER - ICON_SIZE / 2}
              y={CENTER - ICON_SIZE / 2}
              width={ICON_SIZE}
              height={ICON_SIZE}
              strokeWidth={1.75}
              className="text-white"
            />
          </g>
          <circle cx={knob.x} cy={knob.y} r={17} className="fill-primary/20" />
          <circle cx={knob.x} cy={knob.y} r={10} strokeWidth={4} className="fill-white stroke-primary" />
        </svg>
        <p className="mt-3 font-display text-4xl font-bold leading-none tabular-nums">{value}%</p>
        <p className="mt-2 text-xs font-semibold">
          {current.label} <span className="font-normal text-muted">· {current.description.toLowerCase()}</span>
        </p>
        {children}
      </div>
    </div>
  )
}

type IconProps = SVGProps<SVGSVGElement>

/** Drawn to match the icon set's snail and rabbit: side on, facing right, on a 24 × 24 grid. */
function Fox(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" aria-hidden {...props}>
      <path d="M13 7.5 14 2l3 3.5h1.5L23 9c-1.2 1.6-3 2-4.5 1.5.6 3.6.2 7.3-1.3 10.5H10c-2 0-3-1.6-2.6-3.6C8 14 11.5 12 13 7.5Z" />
      <path d="M15 21v-5" />
      <path d="M18 8h.01" />
      <path d="M9.5 21C4.5 21.5 1 19 1 14.5 1 11 3 8.8 5.5 8.5c-1 3.5 0 7 2.9 8.9" />
    </svg>
  )
}

/** Mid-stride, with a couple of spots. */
function Cheetah(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" aria-hidden {...props}>
      <path d="M16.5 7C12.5 5.5 8.5 5.8 5.5 8c-1 1-1 2.4 0 3 3 0 5.5-.7 8-.2 1.5.3 3 .6 4-.3l1.5-1c1.5.3 3-.2 3.8-1.2-.4-1.5-1.6-2.6-3.3-2.8l-.6-1.6Z" />
      <path d="m16 11 3 4 2.5 2" />
      <path d="m14 11 1.5 4.5 2 2.5" />
      <path d="M6 11 3.5 14 1.5 17" />
      <path d="m8.5 11-1 4L5 18" />
      <path d="M5.5 8C3.5 7.5 2 6.5 1 4.5" />
      <path d="M20.5 8.3h.01" />
      <path d="M9.5 8.3h.01" />
      <path d="M12.5 8h.01" />
    </svg>
  )
}

const ANIMALS: Record<PlanPace, (props: IconProps) => ReactNode> = { 5: Snail, 10: Fox, 15: Rabbit, 20: Cheetah }
