export default function Loading() {
  return (
    <div className="mx-auto max-w-lg animate-pulse space-y-6 p-4 pt-8 pb-page" aria-busy="true" aria-label="Loading">
      <div className="fixed inset-x-0 top-0 z-[200] h-1 bg-gradient-to-r from-transparent via-primary to-transparent" />

      <div className="space-y-2">
        <div className="h-7 w-48 rounded-xl bg-surface/80" />
        <div className="h-4 w-72 rounded-lg bg-sunken" />
      </div>

      <div className="space-y-4 rounded-2xl border border-border bg-surface p-5 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="h-4 w-28 rounded-md bg-surface" />
          <div className="h-4 w-16 rounded-full bg-surface" />
        </div>
        <div className="h-6 w-52 rounded-xl bg-surface-hover/60" />
        <div className="h-12 w-full rounded-2xl bg-surface/60" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="h-28 rounded-2xl border border-border bg-surface" />
        <div className="h-28 rounded-2xl border border-border bg-surface" />
      </div>

      <div className="space-y-3">
        <div className="h-16 rounded-2xl border border-border bg-surface" />
        <div className="h-16 rounded-2xl border border-border bg-surface" />
      </div>
    </div>
  )
}
