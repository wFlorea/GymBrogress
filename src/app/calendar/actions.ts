'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import {
  CalendarPlansMap,
  CalendarDayPlan,
  WorkStatus,
  SplitType,
  RoutineTemplatesMap,
  DEFAULT_ROUTINE_TEMPLATES,
  getExercisesForSplit,
  serializeWeeklyPlan,
} from '@/lib/types'

export async function getCalendarPlans(): Promise<CalendarPlansMap> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return {}

  const plans = (user.user_metadata?.calendar_plans as CalendarPlansMap) || {}
  return plans
}

export async function saveCalendarDay(
  date: string,
  workStatus: WorkStatus,
  split: SplitType | null
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const currentPlans = await getCalendarPlans()

  const updatedPlans: CalendarPlansMap = {
    ...currentPlans,
    [date]: {
      date,
      workStatus,
      split,
    },
  }

  // Persist in user metadata
  const { error } = await supabase.auth.updateUser({
    data: { calendar_plans: updatedPlans },
  })

  if (error) {
    console.error('Error saving calendar day:', error)
    throw new Error('Nu s-a putut salva ziua în calendar.')
  }

  // If the edited date is TODAY, sync today's workout log if appropriate
  const today = new Date().toISOString().split('T')[0]
  if (date === today && split) {
    try {
      const userTemplates =
        (user.user_metadata?.routine_templates as RoutineTemplatesMap) || DEFAULT_ROUTINE_TEMPLATES
      const exercises = getExercisesForSplit(split, userTemplates)

      // Check if a workout log already exists for today
      const { data: existingLog } = await supabase
        .from('workout_logs')
        .select('id, workout_name')
        .eq('user_id', user.id)
        .eq('date', today)
        .maybeSingle()

      if (existingLog) {
        await supabase
          .from('workout_logs')
          .update({ workout_name: split })
          .eq('id', existingLog.id)
      }
    } catch (logErr) {
      console.error('Error updating today workout log from calendar:', logErr)
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
  if (!user) throw new Error('Not authenticated')

  const currentPlans = await getCalendarPlans()
  const updatedPlans = { ...currentPlans }
  delete updatedPlans[date]

  const { error } = await supabase.auth.updateUser({
    data: { calendar_plans: updatedPlans },
  })

  if (error) {
    console.error('Error clearing calendar day:', error)
    throw new Error('Nu s-a putut reseta ziua.')
  }

  revalidatePath('/calendar')
  revalidatePath('/schedule')
  revalidatePath('/tracker')
  revalidatePath('/dashboard')

  return { success: true }
}
