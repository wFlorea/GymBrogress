'use server'

import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { dbFail, fail, ok } from '@/lib/data/action-result'
import { getSession } from '@/lib/data/session'
import { isValidTimeZone, TIMEZONE_COOKIE } from '@/lib/date'
import { isPushEndpoint } from '@/lib/push'
import { isRestSeconds } from '@/lib/sets'
import type { ActionResult, WeightUnit } from '@/lib/types'
import { isWeightUnit } from '@/lib/units'
import { createAdminClient } from '@/utils/supabase/admin'

const BASE64URL = /^[A-Za-z0-9_-]+=*$/

const isKey = (value: unknown): value is string => typeof value === 'string' && value.length <= 256 && BASE64URL.test(value)

/**
 * Saves this device's push subscription (`PushSubscription.toJSON()`), so it gets the weekly check-in reminder, with
 * the browser's time zone so the reminder comes in its daytime.
 */
export async function savePushSubscription(subscription: PushSubscriptionJSON): Promise<ActionResult> {
  if (typeof subscription !== 'object' || subscription === null) return fail('Invalid subscription.')
  const { endpoint, keys } = subscription
  if (!isPushEndpoint(endpoint) || !isKey(keys?.p256dh) || !isKey(keys?.auth)) {
    return fail('This browser’s notifications aren’t supported.')
  }

  const timeZone = (await cookies()).get(TIMEZONE_COOKIE)?.value
  const { user, supabase } = await getSession()
  const { error } = await supabase.from('push_subscriptions').upsert(
    {
      user_id: user.id,
      endpoint,
      p256dh: keys.p256dh,
      auth: keys.auth,
      time_zone: timeZone && timeZone.length <= 64 && isValidTimeZone(timeZone) ? timeZone : null,
    },
    { onConflict: 'user_id,endpoint' }
  )
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

/** Turns the rest timer between sets on or off, and sets how long it runs. */
export async function saveRestTimer(on: boolean, seconds: number): Promise<ActionResult> {
  if (typeof on !== 'boolean' || !isRestSeconds(seconds)) return fail('Invalid rest timer.')

  const { user, supabase } = await getSession()
  const { error } = await supabase
    .from('user_settings')
    .upsert(
      { user_id: user.id, rest_timer_on: on, rest_timer_seconds: seconds, updated_at: new Date().toISOString() },
      { onConflict: 'user_id' }
    )
  if (error) return dbFail('saveRestTimer', error, 'Could not save the rest timer. Please try again.')
  revalidatePath('/tracker')
  return ok()
}

/** Shows and takes weights in kg or lb across the app. */
export async function saveWeightUnit(unit: WeightUnit): Promise<ActionResult> {
  if (!isWeightUnit(unit)) return fail('Pick kg or lb.')

  const { user, supabase } = await getSession()
  const { error } = await supabase
    .from('user_settings')
    .upsert({ user_id: user.id, weight_unit: unit, updated_at: new Date().toISOString() }, { onConflict: 'user_id' })
  if (error) return dbFail('saveWeightUnit', error, 'Could not save the unit. Please try again.')
  revalidatePath('/', 'layout')
  return ok()
}

/**
 * Deletes the signed-in user's account with everything in it (every table cascades from the auth user), then signs
 * out. Only resolves when it failed; otherwise it ends on the sign-in page.
 */
export async function deleteAccount(): Promise<ActionResult> {
  const { user, supabase } = await getSession()
  let admin
  try {
    admin = createAdminClient()
  } catch (error) {
    console.error('deleteAccount:', error)
    return fail('Deleting accounts isn’t set up yet. Please try again later.')
  }
  const { error } = await admin.auth.admin.deleteUser(user.id)
  if (error) return dbFail('deleteAccount', error, 'Could not delete your account. Please try again.')

  // The user is gone, so the server may refuse the sign-out; the session cookies are cleared either way.
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/login?account=deleted')
}
