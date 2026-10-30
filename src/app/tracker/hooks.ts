'use client'

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react'
import type { ActionResult, SetValues, WorkoutSet } from '@/lib/types'
import type { SetPatch } from './actions'
import {
  enqueue,
  isOffline,
  onRejected,
  pendingChanges,
  pendingCount,
  sendChanges,
  subscribe,
  type SetChange,
} from './outbox'

const SAVE_DELAY_MS = 600
const OFFLINE_MESSAGE = 'Could not reach the server. Check your connection and try again.'

/**
 * Saves set changes through the outbox, so they survive a lost connection: typing is debounced, and anything still
 * being typed is queued when the page is hidden or left. On mount, `onUnsent` gets the changes to this workout that
 * the server doesn't have yet (e.g. logged without signal before the app was closed), to show them.
 */
export function useSetPersistence(
  logId: string,
  onError: (message: string) => void,
  onUnsent: (changes: SetChange[]) => void
) {
  const queuedSaves = useRef(new Map<string, { timer: ReturnType<typeof setTimeout>; run: () => void }>())
  const pending = useSyncExternalStore(subscribe, pendingCount, () => 0)
  const offline = useSyncExternalStore(subscribe, isOffline, () => false)

  useEffect(() => onRejected(onError), [onError])

  useEffect(() => {
    const unsent = pendingChanges(logId)
    if (unsent.length > 0) onUnsent(unsent)
  }, [logId, onUnsent])

  /** Calls a server action that needs a connection and reports any failure through `onError`. */
  const run = useCallback(
    async <T>(action: () => Promise<ActionResult<T>>): Promise<ActionResult<T>> => {
      try {
        const result = await action()
        if (!result.ok) onError(result.error)
        return result
      } catch {
        onError(OFFLINE_MESSAGE)
        return { ok: false, error: OFFLINE_MESSAGE }
      }
    },
    [onError]
  )

  /** Creates a set with an id made here; resolves to the saved set, or null if the server turned it down. */
  const createSet = useCallback(
    async (setId: string, exerciseId: string, values: SetValues): Promise<WorkoutSet | null> => {
      const result = await enqueue({ kind: 'create', logId, setId, exerciseId, values })
      return result.ok ? (result.data ?? null) : null
    },
    [logId]
  )

  const cancelQueued = useCallback((setId: string) => {
    for (const [key, entry] of queuedSaves.current) {
      if (key.startsWith(`${setId}:`)) {
        clearTimeout(entry.timer)
        queuedSaves.current.delete(key)
      }
    }
  }, [])

  /** Saves a field after the user stops typing. */
  const saveLater = useCallback(
    (setId: string, field: keyof SetValues, value: number) => {
      const key = `${setId}:${field}`
      const queued = queuedSaves.current
      clearTimeout(queued.get(key)?.timer)
      const save = () => {
        queued.delete(key)
        void enqueue({ kind: 'update', logId, setId, patch: { [field]: value } })
      }
      queued.set(key, { timer: setTimeout(save, SAVE_DELAY_MS), run: save })
    },
    [logId]
  )

  /** Resolves to false only when the server turned the change down. */
  const saveNow = useCallback(
    async (setId: string, patch: SetPatch) => (await enqueue({ kind: 'update', logId, setId, patch })).ok,
    [logId]
  )

  const deleteSet = useCallback(
    async (setId: string) => {
      cancelQueued(setId)
      return (await enqueue({ kind: 'delete', logId, setId })).ok
    },
    [cancelQueued, logId]
  )

  /** Queues what is still being typed right away. */
  const queueTyping = useCallback(() => {
    const saves = [...queuedSaves.current.values()]
    for (const entry of saves) clearTimeout(entry.timer)
    for (const entry of saves) entry.run()
  }, [])

  /** Sends every change now; resolves to false when some could not reach the server. */
  const flush = useCallback(async () => {
    queueTyping()
    return sendChanges()
  }, [queueTyping])

  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') queueTyping()
    }
    document.addEventListener('visibilitychange', onVisibilityChange)
    window.addEventListener('pagehide', queueTyping)
    // Sends what is left from before, including other days' workouts.
    void sendChanges()
    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange)
      window.removeEventListener('pagehide', queueTyping)
      queueTyping()
    }
  }, [queueTyping])

  return { pending, offline, run, createSet, saveLater, saveNow, deleteSet, flush }
}

type AudioContextConstructor = typeof AudioContext

/** Rest countdown based on an end time, so it stays correct while the phone is locked. */
export function useRestTimer() {
  const [endsAt, setEndsAt] = useState<number | null>(null)
  const [total, setTotal] = useState(0)
  const [now, setNow] = useState(0)
  const audio = useRef<AudioContext | null>(null)

  useEffect(() => {
    if (endsAt === null) return
    const id = setInterval(() => {
      const time = Date.now()
      if (time < endsAt) {
        setNow(time)
        return
      }
      setEndsAt(null)
      if ('vibrate' in navigator) navigator.vibrate([200, 100, 200])
      beep(audio.current)
    }, 250)
    return () => clearInterval(id)
  }, [endsAt])

  const start = useCallback((seconds: number) => {
    // The audio context has to be created during a tap, or mobile browsers keep it muted.
    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: AudioContextConstructor }).webkitAudioContext
    if (!audio.current && Ctor) audio.current = new Ctor()
    void audio.current?.resume().catch(() => {})

    const time = Date.now()
    setNow(time)
    setTotal(seconds)
    setEndsAt(time + seconds * 1000)
  }, [])

  const addSeconds = useCallback((seconds: number) => {
    setEndsAt((end) => (end === null ? end : end + seconds * 1000))
    setTotal((t) => t + seconds)
  }, [])

  const stop = useCallback(() => setEndsAt(null), [])

  const secondsLeft = endsAt === null ? 0 : Math.max(0, Math.ceil((endsAt - now) / 1000))
  return { active: endsAt !== null, secondsLeft, total, start, addSeconds, stop }
}

function beep(ctx: AudioContext | null) {
  if (!ctx) return
  try {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(880, ctx.currentTime)
    gain.gain.setValueAtTime(0.3, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.6)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + 0.6)
  } catch {
    // Sound is a nice-to-have; the vibration and the UI still signal the end.
  }
}
