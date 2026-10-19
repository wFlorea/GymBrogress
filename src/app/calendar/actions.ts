'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import {
  CalendarPlansMap,
  WorkStatus,
  SplitType,
  serializeCalendarWorkout,
  parseCalendarWorkout,
} from '@/lib/types'

export async function getCalendarPlans(): Promise<CalendarPlansMap> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return {}

  const { data: logs, error } = await supabase
    .from('workout_logs')
    .select('id, date, workout_name')
    .eq('user_id', user.id)

  if (error) {
    console.error('Error fetching calendar logs:', error)
    return {}
  }

  const map: CalendarPlansMap = {}
  for (const log of logs || []) {
    const parsed = parseCalendarWorkout(log.workout_name)
    // Only map if there is a custom split or a custom work status
    if (parsed.split !== null || parsed.workStatus !== 'none') {
      map[log.date] = {
        date: log.date,
        workStatus: parsed.workStatus,
        split: parsed.split,
      }
    }
  }

  return map
}

export async function saveCalendarDay(
  date: string,
  workStatus: WorkStatus,
  split: SplitType | null
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Nu ești autentificat.')

  const serialized = serializeCalendarWorkout(split, workStatus)

  // 1. Check if a workout_log record already exists for this date
  const { data: existing, error: checkError } = await supabase
    .from('workout_logs')
    .select('id')
    .eq('user_id', user.id)
    .eq('date', date)
    .maybeSingle()

  if (checkError) {
    console.error('Error checking existing log:', checkError)
  }

  if (existing) {
    // 2. Update existing log
    const { error: updateError } = await supabase
      .from('workout_logs')
      .update({ workout_name: serialized })
      .eq('id', existing.id)

    if (updateError) {
      console.error('Error updating calendar log:', updateError)
      throw new Error('Eroare la actualizarea calendarului.')
    }
  } else {
    // 3. Insert new log
    const { error: insertError } = await supabase
      .from('workout_logs')
      .insert({
        user_id: user.id,
        date,
        workout_name: serialized,
      })

    if (insertError) {
      console.error('Error inserting calendar log:', insertError)
      throw new Error('Eroare la salvarea în calendar.')
    }
  }

  revalidatePath('/calendar')
  revalidatePath('/schedule')
  revalidatePath('/tracker')
  revalidatePath('/dashboard')

  return { success: true }
}

export async function clearCalendarDay(date: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Nu ești autentificat.')

  // Check if existing log has sets
  const { data: existing } = await supabase
    .from('workout_logs')
    .select('id, workout_sets(id)')
    .eq('user_id', user.id)
    .eq('date', date)
    .maybeSingle()

  if (existing) {
    const hasSets = existing.workout_sets && existing.workout_sets.length > 0
    if (hasSets) {
      // If there are recorded sets, just clear split/workStatus to none
      await supabase
        .from('workout_logs')
        .update({ workout_name: serializeCalendarWorkout(null, 'none') })
        .eq('id', existing.id)
    } else {
      // Otherwise safe to remove the planned log completely
      await supabase
        .from('workout_logs')
        .delete()
        .eq('id', existing.id)
    }
  }

  revalidatePath('/calendar')
  revalidatePath('/schedule')
  revalidatePath('/tracker')
  revalidatePath('/dashboard')

  return { success: true }
}
