// Set changes are kept on the device first and sent to the server one by one, in order, so the tracker keeps
// working without signal: what can't be sent waits in localStorage and goes out once the connection is back,
// even if the app was closed in between. Every change can safely be sent twice.

import { getExercise } from '@/lib/exercises-data'
import type { ActionResult, SetValues, WorkoutSet } from '@/lib/types'
import { addSet, removeSet, updateSet, type SetPatch } from './actions'

export type SetChange =
  | { kind: 'create'; logId: string; setId: string; exerciseId: string; values: SetValues }
  | { kind: 'update'; logId: string; setId: string; patch: SetPatch }
  | { kind: 'delete'; logId: string; setId: string }

type Result = ActionResult<WorkoutSet | undefined>

const STORAGE_KEY = 'gymbrogress:set-changes'
const FIRST_RETRY_MS = 2_000
const MAX_RETRY_MS = 30_000

let queue: SetChange[] | null = null
/** The change on its way to the server; it stays first in the queue until the server answers. */
let sending: SetChange | null = null
let draining: Promise<void> | null = null
let offline = false
let retryTimer: ReturnType<typeof setTimeout> | undefined
let retryDelay = FIRST_RETRY_MS
const waiters = new Map<SetChange, ((result: Result) => void)[]>()
const listeners = new Set<() => void>()
const errorListeners = new Set<(message: string) => void>()

const isSetChange = (value: unknown): value is SetChange =>
  typeof value === 'object' &&
  value !== null &&
  ['create', 'update', 'delete'].includes((value as SetChange).kind) &&
  typeof (value as SetChange).logId === 'string' &&
  typeof (value as SetChange).setId === 'string'

/** The queue, read from localStorage the first time. */
function load(): SetChange[] {
  if (queue) return queue
  queue = []
  try {
    const saved: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]')
    if (Array.isArray(saved)) queue = saved.filter(isSetChange)
  } catch {
    // Unreadable or blocked storage: start empty.
  }
  window.addEventListener('online', () => void drain())
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') void drain()
  })
  return queue
}

function save() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(queue ?? []))
  } catch {
    // Without storage the changes still go out while the page stays open.
  }
  listeners.forEach((listener) => listener())
}

function setOffline(value: boolean) {
  if (offline === value) return
  offline = value
  listeners.forEach((listener) => listener())
}

function settle(change: SetChange, result: Result) {
  waiters.get(change)?.forEach((resolve) => resolve(result))
  waiters.delete(change)
}

function send(change: SetChange): Promise<Result> {
  switch (change.kind) {
    case 'create':
      return addSet(change.logId, change.setId, change.exerciseId, change.values)
    case 'update':
      return updateSet(change.setId, change.patch)
    case 'delete':
      return removeSet(change.setId)
  }
}

/** Sends the queue in order; stops at the first change that can't reach the server and tries again later. */
function drain(): Promise<void> {
  draining ??= (async () => {
    clearTimeout(retryTimer)
    retryTimer = undefined
    const changes = load()
    while (changes.length > 0) {
      const change = changes[0]
      sending = change
      let result: Result
      try {
        result = await send(change)
      } catch {
        sending = null
        setOffline(true)
        retryTimer = setTimeout(() => {
          retryTimer = undefined
          void drain()
        }, retryDelay)
        retryDelay = Math.min(retryDelay * 2, MAX_RETRY_MS)
        return
      }
      sending = null
      retryDelay = FIRST_RETRY_MS
      changes.shift()
      if (!result.ok && change.kind === 'create') {
        // The set was never made, so its later edits have nothing to change.
        for (const unneeded of changes.filter((c) => c.setId === change.setId)) {
          changes.splice(changes.indexOf(unneeded), 1)
          settle(unneeded, { ok: true, data: undefined })
        }
      }
      save()
      setOffline(false)
      if (!result.ok) errorListeners.forEach((listener) => listener(result.error))
      settle(change, result)
    }
  })().finally(() => {
    draining = null
  })
  return draining
}

/**
 * Adds a change to the queue and starts sending it. Resolves with the server's answer, which may come much later;
 * changes that turn out to be unneeded (edits to a set deleted before it reached the server) resolve as done.
 */
export function enqueue(change: SetChange): Promise<Result> {
  const changes = load()
  const done = new Promise<Result>((resolve) => {
    const last = changes.at(-1)
    if (change.kind === 'update' && last?.kind === 'update' && last.setId === change.setId && last !== sending) {
      // Typing in a set while offline adds up to one change, not one per keystroke.
      last.patch = { ...last.patch, ...change.patch }
      waiters.set(last, [...(waiters.get(last) ?? []), resolve])
    } else if (
      change.kind === 'delete' &&
      changes.some((c) => c.kind === 'create' && c.setId === change.setId && c !== sending)
    ) {
      // The set never reached the server: forget it instead of creating and deleting it.
      for (const unneeded of changes.filter((c) => c.setId === change.setId)) {
        changes.splice(changes.indexOf(unneeded), 1)
        settle(unneeded, { ok: true, data: undefined })
      }
      resolve({ ok: true, data: undefined })
    } else {
      changes.push(change)
      waiters.set(change, [resolve])
    }
  })
  save()
  // While a retry is waiting, the change goes out with it.
  if (retryTimer === undefined) void drain()
  return done
}

/** Sends everything in the queue now; resolves to true once nothing is left, false when offline. */
export async function sendChanges(): Promise<boolean> {
  if (load().length > 0) await drain()
  return load().length === 0
}

/** Changes to `logId`'s sets that haven't reached the server yet. */
export function pendingChanges(logId: string): SetChange[] {
  return load().filter((change) => change.logId === logId)
}

/** `sets` as they look with `changes` applied; applying a change twice changes nothing. */
export function applyChanges(sets: WorkoutSet[], changes: SetChange[]): WorkoutSet[] {
  return changes.reduce((current, change) => {
    switch (change.kind) {
      case 'create': {
        if (current.some((s) => s.id === change.setId)) return current
        const numbers = current.filter((s) => s.exercise_id === change.exerciseId).map((s) => s.set_number)
        return [
          ...current,
          {
            id: change.setId,
            exercise_id: change.exerciseId,
            exercise_name: getExercise(change.exerciseId)?.name ?? '',
            set_number: Math.max(0, ...numbers) + 1,
            is_completed: false,
            ...change.values,
          },
        ]
      }
      case 'update':
        return current.map((s) => (s.id === change.setId ? { ...s, ...change.patch } : s))
      case 'delete':
        return current.filter((s) => s.id !== change.setId)
    }
  }, sets)
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

/** Reports changes the server turned down, e.g. a set that was deleted on another device. */
export function onRejected(listener: (message: string) => void): () => void {
  errorListeners.add(listener)
  return () => {
    errorListeners.delete(listener)
  }
}

export const pendingCount = () => queue?.length ?? 0
export const isOffline = () => offline
