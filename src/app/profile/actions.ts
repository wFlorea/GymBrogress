'use server'

import { dbFail, fail, ok } from '@/lib/data/action-result'
import { getSession } from '@/lib/data/session'
import { isPushEndpoint } from '@/lib/push'
import type { ActionResult } from '@/lib/types'

const BASE64URL = /^[A-Za-z0-9_-]+=*$/

const isKey = (value: unknown): value is string => typeof value === 'string' && value.length <= 256 && BASE64URL.test(value)

/** Saves this device's push subscription (`PushSubscription.toJSON()`), so it gets the weekly check-in reminder. */
export async function savePushSubscription(subscription: PushSubscriptionJSON): Promise<ActionResult> {
  if (typeof subscription !== 'object' || subscription === null) return fail('Invalid subscription.')
  const { endpoint, keys } = subscription
  if (!isPushEndpoint(endpoint) || !isKey(keys?.p256dh) || !isKey(keys?.auth)) {
    return fail('This browser’s notifications aren’t supported.')
  }

  const { user, supabase } = await getSession()
  const { error } = await supabase
    .from('push_subscriptions')
    .upsert({ user_id: user.id, endpoint, p256dh: keys.p256dh, auth: keys.auth }, { onConflict: 'user_id,endpoint' })
  if (error) return dbFail('savePushSubscription', error, 'Could not turn on reminders. Please try again.')
  return ok()
}

/** Stops the weekly check-in reminder on the device with this push endpoint. */
export async function deletePushSubscription(endpoint: string): Promise<ActionResult> {
  if (typeof endpoint !== 'string' || endpoint.length > 2048) return fail('Invalid subscription.')

  const { user, supabase } = await getSession()
  const { error } = await supabase.from('push_subscriptions').delete().eq('user_id', user.id).eq('endpoint', endpoint)
  if (error) return dbFail('deletePushSubscription', error, 'Could not turn off reminders. Please try again.')
  return ok()
}
