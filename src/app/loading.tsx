export default function Loading() {
  return (
    <div className="p-4 pt-8 pb-24 max-w-lg mx-auto space-y-6 animate-pulse">
      {/* Top subtle indeterminate glowing progress line */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#FF4500] to-transparent animate-pulse z-[200]" />

      {/* Header skeleton */}
      <div className="space-y-2">
        <div className="h-7 w-48 bg-zinc-800/80 rounded-xl" />
        <div className="h-4 w-72 bg-zinc-900 rounded-lg" />
      </div>

      {/* Main Card skeleton */}
      <div className="p-5 rounded-3xl bg-[var(--color-surface)] border border-[var(--color-border)] space-y-4 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="h-4 w-28 bg-zinc-800 rounded-md" />
          <div className="h-4 w-16 bg-zinc-800 rounded-full" />
        </div>
        <div className="h-6 w-52 bg-zinc-700/60 rounded-xl" />
        <div className="h-12 w-full bg-zinc-800/60 rounded-2xl" />
      </div>

      {/* Grid skeleton */}
      <div className="grid grid-cols-2 gap-3">
        <div className="h-28 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)]" />
        <div className="h-28 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)]" />
      </div>

      {/* Secondary list skeleton */}
      <div className="space-y-3">
        <div className="h-16 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)]" />
        <div className="h-16 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)]" />
      </div>
    </div>
  )
}
