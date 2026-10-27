'use client'

import { useRef, type KeyboardEvent, type PointerEvent } from 'react'
import { MAX_BODY_FAT, MIN_BODY_FAT } from '@/lib/body'

/** Where the dot sits before the user has set a value. */
const START_BODY_FAT = 20
const RANGE = MAX_BODY_FAT - MIN_BODY_FAT

// The dial, in SVG units.
const SIZE = 220
const CENTER = SIZE / 2
const RADIUS = 92
const CIRCUMFERENCE = 2 * Math.PI * RADIUS
/** How far inside the ring a press still grabs it, so pressing the figure doesn't move the dot. */
const GRAB_DEPTH = 36

const STEP_KEYS: Record<string, number> = { ArrowUp: 1, ArrowRight: 1, ArrowDown: -1, ArrowLeft: -1, PageUp: 5, PageDown: -5 }

const clampBodyFat = (value: number) => Math.min(Math.max(value, MIN_BODY_FAT), MAX_BODY_FAT)

/**
 * Body fat, picked by dragging a dot around a ring. The ring fills clockwise from the top as the % goes up, and the
 * figure in the middle fills out with it. Null = not set yet.
 */
export function BodyFatDial({ value, onChange }: { value: number | null; onChange: (value: number | null) => void }) {
  const dragging = useRef(false)
  const shown = value ?? START_BODY_FAT
  const share = (shown - MIN_BODY_FAT) / RANGE
  const angle = share * 2 * Math.PI
  const knob = { x: CENTER + RADIUS * Math.sin(angle), y: CENTER - RADIUS * Math.cos(angle) }

  /** The value at the pointer's angle, and whether the pointer is on the ring. */
  function pointerAt(event: PointerEvent<SVGSVGElement>) {
    const box = event.currentTarget.getBoundingClientRect()
    const x = ((event.clientX - box.left) / box.width) * SIZE - CENTER
    const y = ((event.clientY - box.top) / box.height) * SIZE - CENTER
    // Turns clockwise from the top, 0 to 1.
    const turn = (Math.atan2(x, -y) / (2 * Math.PI) + 1) % 1
    return { value: Math.round(MIN_BODY_FAT + turn * RANGE), onRing: Math.hypot(x, y) >= RADIUS - GRAB_DEPTH }
  }

  function startDragging(event: PointerEvent<SVGSVGElement>) {
    const pointer = pointerAt(event)
    if (!pointer.onRing) return
    dragging.current = true
    event.currentTarget.setPointerCapture(event.pointerId)
    onChange(pointer.value)
  }

  function drag(event: PointerEvent<SVGSVGElement>) {
    if (!dragging.current) return
    let next = pointerAt(event).value
    // Dragging on past the top stops at the end instead of jumping to the other one.
    if (value !== null && Math.abs(next - value) > RANGE / 2) {
      next = value > MIN_BODY_FAT + RANGE / 2 ? MAX_BODY_FAT : MIN_BODY_FAT
    }
    if (next !== value) onChange(next)
  }

  function stopDragging() {
    dragging.current = false
  }

  function step(event: KeyboardEvent<SVGSVGElement>) {
    const next =
      event.key === 'Home'
        ? MIN_BODY_FAT
        : event.key === 'End'
          ? MAX_BODY_FAT
          : event.key in STEP_KEYS
            ? clampBodyFat(shown + STEP_KEYS[event.key])
            : null
    if (next === null) return
    event.preventDefault()
    onChange(next)
  }

  return (
    <div>
      <div className="mb-1.5 flex h-5 items-center justify-between">
        <p className="text-xs font-semibold text-muted">Body fat</p>
        {value !== null && (
          <button type="button" onClick={() => onChange(null)} className="text-xs font-semibold text-muted hover:text-white">
            Clear
          </button>
        )}
      </div>
      <div className="flex flex-col items-center rounded-2xl border border-border bg-sunken px-4 pb-4 pt-5">
        <svg
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          className="w-full max-w-52 cursor-pointer touch-none select-none rounded-full outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
          role="slider"
          tabIndex={0}
          aria-label="Body fat"
          aria-valuemin={MIN_BODY_FAT}
          aria-valuemax={MAX_BODY_FAT}
          aria-valuenow={value ?? undefined}
          aria-valuetext={value === null ? 'Not set' : `${value}%`}
          onPointerDown={startDragging}
          onPointerMove={drag}
          onPointerUp={stopDragging}
          onPointerCancel={stopDragging}
          onKeyDown={step}
        >
          <circle cx={CENTER} cy={CENTER} r={RADIUS} fill="none" strokeWidth={8} className="stroke-white/10" />
          {value !== null && value > MIN_BODY_FAT && (
            <circle
              cx={CENTER}
              cy={CENTER}
              r={RADIUS}
              fill="none"
              strokeWidth={8}
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={CIRCUMFERENCE * (1 - share)}
              transform={`rotate(-90 ${CENTER} ${CENTER})`}
              className="stroke-primary"
            />
          )}
          <BodyFigure
            bodyFat={shown}
            x={CENTER - 46}
            y={CENTER - 62}
            width={92}
            height={124}
            // Faded as a whole, so the overlapping parts don't show through each other.
            className={`fill-white ${value === null ? 'opacity-25' : ''}`}
          />
          <circle cx={knob.x} cy={knob.y} r={17} className="fill-primary/20" />
          <circle cx={knob.x} cy={knob.y} r={10} strokeWidth={4} className="fill-white stroke-primary" />
        </svg>
        <p className="mt-3 font-display text-4xl font-bold leading-none tabular-nums">{value === null ? '–' : `${value}%`}</p>
        <p className="mt-2 text-[11px] text-muted">
          {value === null ? 'Not set. Drag the dot around the circle.' : 'Drag the dot to change it.'}
        </p>
      </div>
    </div>
  )
}

const lerp = (lean: number, full: number, t: number) => lean + (full - lean) * t
const round = (value: number) => Math.round(value * 10) / 10

/** Room between the arms and the body. */
const ARM_GAP = 2
const SHOULDER_Y = 25
/** The arms hang a little out even on the leanest figure (radians). */
const MIN_ARM_TILT = 0.06

/**
 * The figure for a body fat share `t` (0 = leanest, 1 = highest), drawn around the line x = 50 in a 100 × 136 box.
 * Widths are half-widths from that line. The arms tilt out just enough to clear the chest, belly and hips beside them.
 */
function figureShape(t: number) {
  const shoulder = lerp(13, 16, t)
  const chest = lerp(12.5, 20, t)
  const belly = lerp(10.5, 27, t)
  const hip = lerp(12, 25, t)
  const crotch = lerp(76, 82, t)
  const knee = { centre: lerp(7, 11, t), half: lerp(4.5, 8, t) }
  const ankle = { centre: lerp(7, 8.5, t), half: lerp(3.8, 5.5, t) }
  const armWidth = lerp(5.5, 9.5, t)
  const armLength = lerp(47, 49, t)

  const right = (w: number) => round(50 + w)
  const left = (w: number) => round(50 - w)
  const torso = [
    `M 50 24 L ${right(shoulder - 3)} 24 Q ${right(shoulder)} 24 ${right(shoulder)} 27`,
    `C ${right(shoulder)} 31 ${right(chest)} 32 ${right(chest)} 38`,
    `C ${right(chest)} 45 ${right(belly)} 46 ${right(belly)} 54`,
    `C ${right(belly)} 62 ${right(hip)} 63 ${right(hip)} 70`,
    `L ${right(hip)} 74 L ${left(hip)} 74 L ${left(hip)} 70`,
    `C ${left(hip)} 63 ${left(belly)} 62 ${left(belly)} 54`,
    `C ${left(belly)} 46 ${left(chest)} 45 ${left(chest)} 38`,
    `C ${left(chest)} 32 ${left(shoulder)} 31 ${left(shoulder)} 27`,
    `Q ${left(shoulder)} 24 ${left(shoulder - 3)} 24 Z`,
  ].join(' ')

  // One leg; `side` 1 is the right one, -1 the left. The two meet in the middle down to the crotch.
  const leg = (side: 1 | -1) => {
    const x = (w: number) => round(50 + side * w)
    const outerKnee = knee.centre + knee.half
    const innerKnee = knee.centre - knee.half
    const outerAnkle = ankle.centre + ankle.half
    const innerAnkle = ankle.centre - ankle.half
    return [
      `M ${x(0)} 68 L ${x(hip)} 68`,
      `C ${x(hip)} 82 ${x(outerKnee)} 90 ${x(outerKnee)} 102`,
      `C ${x(outerKnee)} 112 ${x(outerAnkle)} 118 ${x(outerAnkle)} 128`,
      `Q ${x(outerAnkle)} 134 ${x(ankle.centre)} 134 Q ${x(innerAnkle)} 134 ${x(innerAnkle)} 128`,
      `C ${x(innerAnkle)} 118 ${x(innerKnee)} 112 ${x(innerKnee)} 102`,
      `C ${x(innerKnee)} 92 ${x(0)} ${round(crotch + 6)} ${x(0)} ${round(crotch)} Z`,
    ].join(' ')
  }

  // From the middle line to the arm's centre at the shoulder.
  const armOffset = shoulder + ARM_GAP + armWidth / 2
  let tilt = MIN_ARM_TILT
  for (const [y, half] of [
    [38, chest],
    [54, belly],
    [70, hip],
  ]) {
    const drop = y - SHOULDER_Y
    if (drop > armLength) continue
    // A little extra room, as a slanted arm is wider across than its width.
    tilt = Math.max(tilt, Math.atan((half + (armWidth / 2 + ARM_GAP) * 1.1 - armOffset) / drop))
  }

  return {
    headRadius: lerp(8.5, 9.5, t),
    torso,
    legs: `${leg(1)} ${leg(-1)}`,
    arm: { offset: armOffset, width: armWidth, length: armLength, tilt: (tilt * 180) / Math.PI },
  }
}

function BodyFigure({
  bodyFat,
  className,
  ...box
}: {
  bodyFat: number
  className: string
  x: number
  y: number
  width: number
  height: number
}) {
  const { headRadius, torso, legs, arm } = figureShape((bodyFat - MIN_BODY_FAT) / RANGE)

  return (
    <svg viewBox="0 0 100 136" {...box} className={className} aria-hidden>
      <circle cx={50} cy={12.5} r={headRadius} />
      <path d={torso} />
      <path d={legs} />
      {([1, -1] as const).map((side) => (
        <rect
          key={side}
          x={-arm.width / 2}
          width={arm.width}
          height={arm.length}
          rx={arm.width / 2}
          transform={`translate(${round(50 + side * arm.offset)} ${SHOULDER_Y}) rotate(${round(-side * arm.tilt)})`}
        />
      ))}
    </svg>
  )
}
