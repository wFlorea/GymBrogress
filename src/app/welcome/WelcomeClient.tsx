'use client'

import { useRef, useState } from 'react'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { markWelcomeSeen } from '@/lib/welcome'
import { WelcomePlate } from './WelcomePlate'

const SLIDES = [
  { title: 'Plan your week', text: 'Pick a split, build a routine for each day and see your whole week at a glance.' },
  { title: 'Track every set', text: 'Log weight and reps as you lift. The rest timer tells you when to go again.' },
  { title: 'See how far you’ve come', text: 'Streaks, workout history and progress charts keep score of every session.' },
]

export function WelcomeClient() {
  const scroller = useRef<HTMLDivElement>(null)
  // Scroll position in slides, kept fractional so the plate turns with the finger.
  const [progress, setProgress] = useState(0)
  const index = Math.round(progress)
  const isLast = index === SLIDES.length - 1

  function goTo(slide: number) {
    const el = scroller.current
    if (!el) return
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    el.scrollTo({ left: slide * el.clientWidth, behavior: reduceMotion ? 'auto' : 'smooth' })
  }

  function onScroll() {
    const el = scroller.current
    if (el) setProgress(el.scrollLeft / el.clientWidth)
  }

  return (
    <div className="bg-glow flex h-dvh flex-col overflow-hidden">
      <h1 className="sr-only">Welcome to GymBrogress</h1>

      <header className="mx-auto flex w-full max-w-md items-center justify-between px-4 pt-[max(1rem,env(safe-area-inset-top))]">
        <button
          type="button"
          onClick={() => goTo(index - 1)}
          aria-label="Previous slide"
          className={`flex h-10 w-10 items-center justify-center rounded-full text-white transition-colors hover:bg-white/10 ${
            index === 0 ? 'invisible' : ''
          }`}
        >
          <ChevronLeft size={24} />
        </button>
        <Link
          href="/login"
          onClick={markWelcomeSeen}
          className="rounded-full px-4 py-2 text-sm font-semibold text-muted transition-colors hover:text-white"
        >
          Sign in
        </Link>
      </header>

      <div className="relative mx-auto flex min-h-0 w-full max-w-md flex-1">
        <div className="pointer-events-none absolute inset-x-6 top-2 bottom-44 flex items-center justify-center motion-safe:animate-plate-in">
          <WelcomePlate progress={progress} />
        </div>

        <div
          ref={scroller}
          onScroll={onScroll}
          className="scrollbar-none flex w-full snap-x snap-mandatory overflow-x-auto overscroll-x-contain"
        >
          {SLIDES.map((slide, i) => (
            <section
              key={slide.title}
              aria-label={`${i + 1} of ${SLIDES.length}`}
              className="flex w-full shrink-0 snap-center flex-col justify-end px-8 pb-6 text-center"
            >
              <h2 className="font-display text-[2rem] font-bold leading-tight text-balance">{slide.title}</h2>
              <p className="mx-auto mt-3 max-w-[30ch] text-[15px] leading-relaxed text-muted">{slide.text}</p>
            </section>
          ))}
        </div>
      </div>

      <footer className="mx-auto w-full max-w-md px-8 pb-[max(2rem,env(safe-area-inset-bottom))]">
        <div className="mb-6 flex justify-center">
          {SLIDES.map((slide, i) => (
            <button
              key={slide.title}
              type="button"
              onClick={() => goTo(i)}
              aria-label={`Show slide ${i + 1}`}
              aria-current={i === index ? 'step' : undefined}
              className="group p-1.5"
            >
              <span
                className={`block h-1.5 rounded-full transition-all duration-300 ${
                  i === index ? 'w-6 bg-primary' : 'w-1.5 bg-white/20 group-hover:bg-white/40'
                }`}
              />
            </button>
          ))}
        </div>

        {isLast ? (
          <Link
            href="/login?mode=signup"
            onClick={markWelcomeSeen}
            className="flex h-13 w-full items-center justify-center rounded-full bg-primary font-semibold text-white shadow-lg shadow-primary/30 transition-all hover:bg-primary-hover active:scale-[0.98]"
          >
            Create account
          </Link>
        ) : (
          <button
            type="button"
            onClick={() => goTo(index + 1)}
            className="flex h-13 w-full items-center justify-center rounded-full border-2 border-primary bg-primary/5 font-semibold text-primary transition-all hover:bg-primary/15 active:scale-[0.98]"
          >
            Next
          </button>
        )}
      </footer>
    </div>
  )
}
