'use server'

import { createClient } from '@/utils/supabase/server'
import { getAuthUser } from '@/utils/supabase/auth-user'
import { revalidatePath } from 'next/cache'

export async function getWeeklyPlans() {
  const supabase = await createClient()
  
  const user = await getAuthUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('weekly_plans')
    .select('*')
    .eq('user_id', user.id)
    .order('day_of_week', { ascending: true })

  if (error) {
    console.error('Error fetching weekly plans:', error)
    return []
  }

  return data
}

export async function upsertWeeklyPlan(dayOfWeek: number, workoutName: string) {
  const supabase = await createClient()
  
  const user = await getAuthUser()
  if (!user) throw new Error('Not authenticated')

  // Check if a plan for this day already exists
  const { data: existingPlan } = await supabase
    .from('weekly_plans')
    .select('id')
    .eq('user_id', user.id)
    .eq('day_of_week', dayOfWeek)
    .single()

  let error;
  
  if (existingPlan) {
    // Update
    const { error: updateError } = await supabase
      .from('weekly_plans')
      .update({ workout_name: workoutName })
      .eq('id', existingPlan.id)
    error = updateError
  } else {
    // Insert
    const { error: insertError } = await supabase
      .from('weekly_plans')
      .insert({
        user_id: user.id,
        day_of_week: dayOfWeek,
        workout_name: workoutName
      })
    error = insertError
  }

  if (error) {
    console.error('Error upserting weekly plan:', error)
    throw new Error('Failed to save plan')
  }

  revalidatePath('/planner')
  revalidatePath('/dashboard')
  return { success: true }
}
