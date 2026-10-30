'use client'

import { useEffect, useState } from 'react'
import { Bell } from 'lucide-react'
import { Alert, Card } from '@/components/ui/Card'
import { deletePushSubscription, savePushSubscription } from './actions'

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY

type Status = 'loading' | 'install' | 'unsupported' | 'denied' | 'off' | 'on'

const NOTES: Partial<Record<Status, string>> = {
  install: 'On iPhone, add GymBrogress to your Home Screen first (Share, then Add to Home Screen) and open it from there.',
  unsupported: 'This browser can’t show notifications.',
  denied: 'Notifications are blocked for this site. Allow them in your browser settings to get the reminder.',
}

/** The applicationServerKey as bytes, from its base64url text. */
function keyBytes(base64url: string): Uint8Array<ArrayBuffer> {
  const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(base64url.length / 4) * 4, '=')
  return Uint8Array.from(atob(base64), (char) => char.charCodeAt(0))
}

async function currentSubscription(): Promise<PushSubscription | null> {
  const registration = await navigator.serviceWorker.getRegistration('/')
  return (await registration?.pushManager.getSubscription()) ?? null
}

async function detectStatus(): Promise<Status> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
    // iOS only offers push to web apps added to the Home Screen.
    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
    return ios ? 'install' : 'unsupported'
  }
  if (Notification.permission === 'denied') return 'denied'
  const subscription = await currentSubscription()
  // Saved again on every visit, in case the server dropped it.
  if (subscription) void savePushSubscription(subscription.toJSON())
  return subscription ? 'on' : 'off'
}

/** Opt-in for a push notification on Monday mornings while this week's weight isn't logged. */
export function PushReminder() {
  const [status, setStatus] = useState<Status>('loading')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    detectStatus().then(setStatus, () => setStatus('unsupported'))
  }, [])

  if (!VAPID_PUBLIC_KEY) return null

  async function turnOn() {
    const permission = await Notification.requestPermission()
    if (permission !== 'granted') {
      setStatus(permission === 'denied' ? 'denied' : 'off')
      return
    }
    const registration = await navigator.serviceWorker.register('/sw.js')
    await navigator.serviceWorker.ready
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: keyBytes(VAPID_PUBLIC_KEY!),
    })
    const result = await savePushSubscription(subscription.toJSON())
    if (!result.ok) {
      await subscription.unsubscribe()
      setError(result.error)
      return
    }
    setStatus('on')
  }

  async function turnOff() {
    const subscription = await currentSubscription()
    if (subscription) {
      const result = await deletePushSubscription(subscription.endpoint)
      if (!result.ok) {
        setError(result.error)
        return
      }
      await subscription.unsubscribe()
    }
    setStatus('off')
  }

  async function toggle() {
    setBusy(true)
    setError(null)
    try {
      await (status === 'on' ? turnOff() : turnOn())
    } catch {
      setError('Something went wrong with notifications. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  const note = NOTES[status]
  const on = status === 'on'

  return (
    <Card className="mt-3">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
          <Bell size={18} />
        </span>
        <div className="min-w-0 flex-1">
          <p id="push-reminder-label" className="font-semibold">Weekly reminder</p>
          <p className="text-xs text-muted">
            {note ?? 'A notification on Monday morning if you haven’t checked in yet. Just for this device.'}
          </p>
        </div>
        {!note && (
          <button
            type="button"
            role="switch"
            aria-checked={on}
            aria-labelledby="push-reminder-label"
            disabled={status === 'loading' || busy}
            onClick={toggle}
            className={`relative h-7 w-12 shrink-0 rounded-full transition-colors disabled:opacity-60 ${on ? 'bg-primary' : 'bg-zinc-700'}`}
          >
            <span
              className={`absolute left-1 top-1 h-5 w-5 rounded-full bg-white shadow transition-transform ${on ? 'translate-x-5' : ''}`}
            />
          </button>
        )}
      </div>
      {error && <Alert className="mt-3">{error}</Alert>}
    </Card>
  )
}
