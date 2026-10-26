'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { ActionResult, WorkoutSet } from '@/lib/types'
import { addSet, removeSet, updateSet, type SetPatch, type SetValues } from './actions'

const SAVE_DELAY_MS = 600
const OFFLINE_MESSAGE = 'Could not reach the server. Check your connection; your last change may not be saved.'

/** Temporary ids for sets that are still being created on the server. */
export const isTempId = (id: string) => id.startsWith('temp-')

/**
 * Saves set changes in the background: typing is debounced, sets added on the spot get their
 * real id later, and anything still waiting is sent when the page is hidden or left.
 */
export function useSetPersistence(logId: string, onError: (message: string) => void) {
  const pendingCreates = useRef(new Map<string, Promise<string | null>>())
  const resolvedIds = useRef(new Map<string, string>())
  const queuedSaves = useRef(new Map<string, { timer: ReturnType<typeof setTimeout>; run: () => void }>())

  /** Calls a server action and reports any failure through `onError`. */
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

  /**
   * Runs `action` with the set's database id, waiting for the set to be created if needed.
   * Resolves to false only when the action itself failed.
   */
  const withRealId = useCallback(
    async (setId: string, action: (id: string) => Promise<ActionResult<unknown>>): Promise<boolean> => {
      const realId = !isTempId(setId)
        ? setId
        : (resolvedIds.current.get(setId) ?? (await pendingCreates.current.get(setId)) ?? null)
      // A set whose creation failed is already gone, so there is nothing left to do.
      if (!realId) return true
      return (await run(() => action(realId))).ok
    },
    [run]
  )

  const createSet = useCallback(
    async (tempId: string, exerciseId: string, values: SetValues): Promise<WorkoutSet | null> => {
      const creation = run(() => addSet(logId, exerciseId, values)).then((result) => (result.ok ? result.data : null))
      pendingCreates.current.set(
        tempId,
        creation.then((set) => set?.id ?? null)
      )
      const set = await creation
      pendingCreates.current.delete(tempId)
      if (set) resolvedIds.current.set(tempId, set.id)
      return set
    },
    [run, logId]
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
        void withRealId(setId, (id) => updateSet(id, { [field]: value }))
      }
      queued.set(key, { timer: setTimeout(save, SAVE_DELAY_MS), run: save })
    },
    [withRealId]
  )

  const saveNow = useCallback(
    (setId: string, patch: SetPatch) => withRealId(setId, (id) => updateSet(id, patch)),
    [withRealId]
  )

  const deleteSet = useCallback(
    (setId: string) => {
      cancelQueued(setId)
      return withRealId(setId, removeSet)
    },
    [cancelQueued, withRealId]
  )

  /** Sends every queued save right away and waits for sets that are still being created. */
  const flush = useCallback(async () => {
    const saves = [...queuedSaves.current.values()]
    for (const entry of saves) clearTimeout(entry.timer)
    for (const entry of saves) entry.run()
    await Promise.all(pendingCreates.current.values())
  }, [])

  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') void flush()
    }
    const onPageHide = () => void flush()
    document.addEventListener('visibilitychange', onVisibilityChange)
    window.addEventListener('pagehide', onPageHide)
    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange)
      window.removeEventListener('pagehide', onPageHide)
      void flush()
    }
  }, [flush])

  return { run, createSet, saveLater, saveNow, deleteSet, flush }
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
