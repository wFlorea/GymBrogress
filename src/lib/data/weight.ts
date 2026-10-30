import 'server-only'
import { cache } from 'react'
import { cookies } from 'next/headers'
import type { IsoDate, WeightEntry } from '@/lib/types'
import { getSession } from './session'

/** Cookie holding the Monday of the week the user closed the check-in reminder in. */
export const CHECK_IN_DISMISSED_COOKIE = 'checkin_dismissed'

/** The user's weekly weigh-ins, oldest first. */
export const getWeightLog = cache(async (): Promise<WeightEntry[]> => {
  const { user, supabase } = await getSession()
  const { data, error } = await supabase
    .from('weight_logs')
    .select('week_start, weight_kg')
    .eq('user_id', user.id)
    .order('week_start')
  if (error) throw new Error(`Could not load your weight history: ${error.message}`)

  // DECIMAL columns arrive as strings.
  return data.map((row) => ({ week: row.week_start, weight: Number(row.weight_kg) }))
})

/** Whether the user closed the check-in reminder on this device during the week starting `week`. */
export async function isCheckInDismissed(week: IsoDate): Promise<boolean> {
  return (await cookies()).get(CHECK_IN_DISMISSED_COOKIE)?.value === week
}
