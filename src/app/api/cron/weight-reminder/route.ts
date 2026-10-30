import webpush, { WebPushError } from 'web-push'
import { addDays, todayIn } from '@/lib/date'
import { isPushEndpoint, reminderMonday } from '@/lib/push'
import { SITE_URL } from '@/lib/site'
import { createAdminClient } from '@/utils/supabase/admin'

/** How long a push service may hold the reminder for an offline device, in seconds: the rest of Monday, roughly. */
const TTL_SECONDS = 12 * 60 * 60

const PAYLOAD = JSON.stringify({
  title: 'Weekly check-in',
  body: 'New week, quick weigh-in? One tap if your weight hasn’t changed.',
  url: '/dashboard',
})

/** The push service forgot the subscription: the user blocked notifications or cleared the site's data. */
const isExpired = (result: PromiseSettledResult<unknown>) =>
  result.status === 'rejected' && result.reason instanceof WebPushError && [404, 410].includes(result.reason.statusCode)

/**
 * Sends the weekly check-in reminder to every device with reminders on whose user hasn't logged this week's weight,
 * and drops the subscriptions that expired. Only devices where it's Monday daytime get it (see `reminderMonday`), so
 * nobody is woken at night. Vercel Cron calls it once on Monday mornings, European time (see vercel.json; the Hobby
 * plan allows daily crons at most), with `Authorization: Bearer $CRON_SECRET`.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  const privateKey = process.env.VAPID_PRIVATE_KEY
  if (!publicKey || !privateKey) return Response.json({ error: 'VAPID keys are not set.' }, { status: 500 })
  webpush.setVapidDetails(SITE_URL, publicKey, privateKey)

  const supabase = createAdminClient()
  const now = new Date()
  // Every device's Monday is within a day of the one in UTC.
  const utcToday = todayIn('UTC', now)
  const [subscriptions, logged] = await Promise.all([
    supabase.from('push_subscriptions').select('id, user_id, endpoint, p256dh, auth, time_zone'),
    supabase
      .from('weight_logs')
      .select('user_id, week_start')
      .gte('week_start', addDays(utcToday, -1))
      .lte('week_start', addDays(utcToday, 1)),
  ])
  if (subscriptions.error || logged.error) {
    console.error('weight-reminder:', (subscriptions.error ?? logged.error)?.message)
    return Response.json({ error: 'Could not load the subscriptions.' }, { status: 500 })
  }

  const checkedIn = new Set(logged.data.map((row) => `${row.user_id} ${row.week_start}`))
  const due = subscriptions.data.filter((row) => {
    const week = reminderMonday(row.time_zone, now)
    // The table checks the endpoint too; checked again so a row that slipped past it is never posted to.
    return week !== null && !checkedIn.has(`${row.user_id} ${week}`) && isPushEndpoint(row.endpoint)
  })
  const results = await Promise.allSettled(
    due.map((row) =>
      webpush.sendNotification({ endpoint: row.endpoint, keys: { p256dh: row.p256dh, auth: row.auth } }, PAYLOAD, {
        TTL: TTL_SECONDS,
      })
    )
  )

  const expired = due.filter((_, i) => isExpired(results[i])).map((row) => row.id)
  if (expired.length > 0) {
    const { error: deleteError } = await supabase.from('push_subscriptions').delete().in('id', expired)
    if (deleteError) console.error('weight-reminder:', deleteError.message)
  }
  const failed = results.filter((result) => result.status === 'rejected' && !isExpired(result))
  failed.forEach((result) => console.error('weight-reminder:', (result as PromiseRejectedResult).reason))

  return Response.json({ sent: due.length - expired.length - failed.length, failed: failed.length, removed: expired.length })
}
