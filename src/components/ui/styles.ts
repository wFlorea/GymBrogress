// Shared class names for the app's buttons and fields, so every screen looks the same.
// `secondary` and `soft` have no font size: add `text-xs` or `text-sm` where they are used.

export const buttonStyles = {
  primary:
    'press flex items-center justify-center gap-2 rounded-full bg-primary py-3.5 px-4 font-bold text-white shadow-lg shadow-primary/25 hover:bg-primary-hover disabled:opacity-60',
  secondary:
    'press flex items-center justify-center gap-2 rounded-full border border-border bg-surface-hover py-3 px-4 font-bold text-zinc-200 hover:border-primary hover:text-white disabled:opacity-60',
  soft: 'press flex items-center justify-center gap-2 rounded-full border border-primary/30 bg-primary/15 py-3 px-4 font-bold text-primary hover:bg-primary/25 disabled:opacity-60',
  chip: 'press flex items-center gap-1.5 rounded-full border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs font-bold text-zinc-300 hover:text-white [--press-scale:0.9] disabled:opacity-50',
  icon: 'press flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white [--press-scale:0.88]',
  danger:
    'press flex items-center justify-center gap-2 rounded-full border border-error/40 bg-error/10 py-3.5 px-4 font-bold text-error hover:bg-error/20',
} as const

export const inputStyles =
  'w-full rounded-xl border border-border bg-sunken px-4 py-3 text-sm text-white placeholder:text-muted transition-colors focus:border-primary focus:outline-none'

export function pillStyles(active: boolean) {
  return `press flex items-center gap-1 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-bold [--press-scale:0.9] ${
    active ? 'bg-primary text-white' : 'bg-zinc-800 text-zinc-400 hover:text-white'
  }`
}
