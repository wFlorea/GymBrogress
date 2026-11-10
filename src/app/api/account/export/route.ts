import { getSession, getToday } from '@/lib/data/session'
import { HEALTH_CONSENT_KEY } from '@/lib/legal'

/** Everything the app keeps about the signed-in user, as a JSON file to download (Settings → Export my data). */
export async function GET() {
  const [{ user, supabase }, today] = await Promise.all([getSession(), getToday()])
  const [settings, weeklyPlans, routines, workouts, food, savedMeals, water, weighIns, productSubmissions, pushDevices] = await Promise.all([
    supabase.from('user_settings').select('*').eq('user_id', user.id).maybeSingle(),
    supabase.from('weekly_plans').select('*').eq('user_id', user.id),
    supabase.from('routine_templates').select('*').eq('user_id', user.id),
    supabase.from('workout_logs').select('*, workout_sets(*)').eq('user_id', user.id).order('date'),
    supabase.from('food_entries').select('*').eq('user_id', user.id).order('date'),
    supabase.from('saved_meals').select('*').eq('user_id', user.id).order('name'),
    supabase.from('water_logs').select('*').eq('user_id', user.id).order('date'),
    supabase.from('weight_logs').select('*').eq('user_id', user.id).order('week_start'),
    supabase.from('product_submissions').select('*').eq('user_id', user.id).order('created_at'),
    // Without the device's encryption keys, which are secrets and of no use to the user.
    supabase.from('push_subscriptions').select('endpoint, time_zone, created_at').eq('user_id', user.id).order('created_at'),
  ])
  const error = [settings, weeklyPlans, routines, workouts, food, savedMeals, water, weighIns, productSubmissions, pushDevices].find(
    (result) => result.error,
  )?.error
  if (error) {
    console.error('account export:', error.message)
    return Response.json({ error: 'Could not export your data. Please try again.' }, { status: 500 })
  }

  const data = {
    exportedAt: new Date().toISOString(),
    account: {
      id: user.id,
      email: user.email ?? null,
      name: user.user_metadata?.name ?? null,
      termsAcceptedAt: user.user_metadata?.terms_accepted_at ?? null,
      termsVersion: user.user_metadata?.terms_version ?? null,
      healthConsentAt: user.user_metadata?.[HEALTH_CONSENT_KEY] ?? null,
    },
    settings: settings.data,
    weeklyPlans: weeklyPlans.data,
    routines: routines.data,
    workouts: workouts.data,
    food: food.data,
    savedMeals: savedMeals.data,
    water: water.data,
    weighIns: weighIns.data,
    productSubmissions: productSubmissions.data,
    pushDevices: pushDevices.data,
  }
  return new Response(JSON.stringify(data, null, 2), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Disposition': `attachment; filename="gymbrogress-${today}.json"`,
      'Cache-Control': 'no-store',
    },
  })
}
