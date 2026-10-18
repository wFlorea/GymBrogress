import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { DAYS_OF_WEEK, parseWeeklyPlan } from '@/lib/types'
import { Dumbbell, Flame, CheckCircle2, Calendar, ArrowRight, Coffee, Trophy } from 'lucide-react'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const userName = user?.user_metadata?.name || user?.email?.split('@')[0] || 'Champ'

  // Today's day of week (Monday = 0, Sunday = 6)
  const now = new Date()
  const dayOfWeek = (now.getDay() + 6) % 7
  const todayDayName = DAYS_OF_WEEK[dayOfWeek]
  const todayIso = now.toISOString().split('T')[0]

  // Format today date in Romanian (ex: "Joi, 15 Octombrie")
  const formattedToday = now.toLocaleDateString('ro-RO', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
  const capitalizedDate = formattedToday.charAt(0).toUpperCase() + formattedToday.slice(1)

  // 1. Fetch today's plan from weekly_plans
  const { data: planned } = await supabase
    .from('weekly_plans')
    .select('workout_name')
    .eq('user_id', user?.id)
    .eq('day_of_week', dayOfWeek)
    .maybeSingle()

  const { split: plannedSplit, exercises: plannedExercises } = parseWeeklyPlan(planned?.workout_name)

  // 2. Fetch today's workout log (if already started)
  const { data: todayLog } = await supabase
    .from('workout_logs')
    .select('id, workout_name, workout_sets(id, is_completed)')
    .eq('user_id', user?.id)
    .eq('date', todayIso)
    .maybeSingle()

  // 3. Calculate streak from all logs
  const { data: allLogs } = await supabase
    .from('workout_logs')
    .select('date')
    .eq('user_id', user?.id)
    .order('date', { ascending: false })

  const workoutDates = new Set((allLogs || []).map((l: { date: string }) => l.date))
  let streak = 0
  const cursorDate = new Date(now)

  // Check if today was worked out
  const todayStr = cursorDate.toISOString().split('T')[0]
  if (workoutDates.has(todayStr)) {
    streak++
    cursorDate.setDate(cursorDate.getDate() - 1)
  } else {
    // If not worked out today yet, check yesterday to preserve streak
    const yesterday = new Date(now)
    yesterday.setDate(yesterday.getDate() - 1)
    const yStr = yesterday.toISOString().split('T')[0]
    if (workoutDates.has(yStr)) {
      cursorDate.setTime(yesterday.getTime())
    }
  }

  // Count backwards consecutive days
  while (true) {
    const dStr = cursorDate.toISOString().split('T')[0]
    if (workoutDates.has(dStr)) {
      if (dStr !== todayStr) streak++
      cursorDate.setDate(cursorDate.getDate() - 1)
    } else {
      break
    }
  }

  // 4. Calculate total completed sets
  const { count: completedSetsCount } = await supabase
    .from('workout_sets')
    .select('*', { count: 'exact', head: true })
    .eq('is_completed', true)

  const plannedWorkoutName = todayLog?.workout_name || plannedSplit || ''
  const isRestDay = plannedWorkoutName.toLowerCase().includes('rest') || 
                    plannedWorkoutName.toLowerCase().includes('pauz') || 
                    plannedWorkoutName.toLowerCase().includes('odihn')

  const totalTodaySets = todayLog?.workout_sets?.length || 0
  const completedTodaySets = todayLog?.workout_sets?.filter((s: { is_completed: boolean }) => s.is_completed)?.length || 0

  return (
    <div className="p-4 pt-8 pb-24 max-w-lg mx-auto">
      {/* Header */}
      <div className="mb-6 flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-primary)] flex items-center gap-2">
            Salut, {userName}! <span className="text-2xl">💪</span>
          </h1>
          <p className="text-sm text-[var(--color-muted)] mt-1">{capitalizedDate}</p>
        </div>
        {streak > 0 && (
          <div className="flex items-center gap-1.5 bg-[#FF4500]/15 border border-[#FF4500]/30 px-3 py-1.5 rounded-full text-[var(--color-primary)] font-bold text-sm">
            <Flame size={18} className="fill-[var(--color-primary)]" />
            <span>{streak} zile</span>
          </div>
        )}
      </div>

      {/* Main Card: Today's Workout / Rest */}
      <div className="bg-[var(--color-surface)] p-5 rounded-2xl shadow-xl border border-[var(--color-border)] mb-6 transition-all">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)] flex items-center gap-1.5">
            <Calendar size={14} className="text-[var(--color-primary)]" /> {todayDayName}
          </span>
          {todayLog && (
            <span className="text-xs bg-[var(--color-success)]/15 text-[var(--color-success)] border border-[var(--color-success)]/30 px-2.5 py-0.5 rounded-full font-medium">
              În desfășurare
            </span>
          )}
        </div>

        {isRestDay ? (
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-bold flex items-center gap-2 text-[var(--color-foreground)]">
                <Coffee size={22} className="text-amber-500" /> Zi de Odihnă & Recuperare
              </h2>
              <p className="text-sm text-[var(--color-muted)] mt-1.5 leading-relaxed">
                Mușchii cresc în perioada de refacere! Asigură-te că dormi suficient, te hidratezi și mănânci echilibrat.
              </p>
            </div>
            <Link 
              href="/tracker"
              className="w-full bg-[var(--color-surface-hover)] text-sm text-[var(--color-muted)] hover:text-white font-medium py-3 rounded-xl border border-[var(--color-border)] hover:border-[var(--color-primary)] transition-all flex items-center justify-center gap-2"
            >
              Vrei să te antrenezi totuși? Deschide Tracker <ArrowRight size={16} />
            </Link>
          </div>
        ) : plannedWorkoutName ? (
          <div>
            <h2 className="text-xl font-bold mb-1.5 text-[var(--color-foreground)]">
              {plannedWorkoutName}
            </h2>
            <p className="text-sm text-[var(--color-muted)] mb-5">
              {todayLog 
                ? `Ai finalizat ${completedTodaySets} din ${totalTodaySets} seturi.` 
                : 'Ești gata pentru sesiunea de azi? Pregătește-te de progres!'}
            </p>

            <Link
              href="/tracker"
              className="w-full bg-[var(--color-primary)] text-white font-bold py-3.5 rounded-xl hover:bg-[var(--color-primary-hover)] transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#FF4500]/25 text-base active:scale-[0.98]"
            >
              <Dumbbell size={18} />
              {todayLog ? 'Continuă Antrenamentul' : 'Începe Antrenamentul'}
              <ArrowRight size={18} />
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-bold">Niciun antrenament programat azi</h2>
              <p className="text-sm text-[var(--color-muted)] mt-1">
                Configurează-ți săptămâna în Planner pentru a avea totul organizat.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Link
                href="/schedule"
                className="bg-[var(--color-surface-hover)] text-sm font-semibold py-3 px-4 rounded-xl text-center border border-[var(--color-border)] hover:border-[var(--color-primary)] transition-colors"
              >
                Alege Programul
              </Link>
              <Link
                href="/plan"
                className="bg-[var(--color-primary)] text-white text-sm font-bold py-3 px-4 rounded-xl text-center hover:bg-[var(--color-primary-hover)] transition-colors flex items-center justify-center gap-1.5 shadow-md shadow-[#FF4500]/20"
              >
                Plan Exerciții
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-[var(--color-surface)] p-4 rounded-2xl border border-[var(--color-border)] flex flex-col items-center justify-center text-center shadow-sm">
          <div className="w-10 h-10 rounded-full bg-[#FF4500]/15 flex items-center justify-center text-[var(--color-primary)] mb-2">
            <Flame size={22} className="fill-[var(--color-primary)]" />
          </div>
          <span className="text-3xl font-extrabold">{streak}</span>
          <span className="text-xs text-[var(--color-muted)] font-medium mt-1">Zile la rând</span>
        </div>

        <div className="bg-[var(--color-surface)] p-4 rounded-2xl border border-[var(--color-border)] flex flex-col items-center justify-center text-center shadow-sm">
          <div className="w-10 h-10 rounded-full bg-emerald-500/15 flex items-center justify-center text-emerald-400 mb-2">
            <CheckCircle2 size={22} />
          </div>
          <span className="text-3xl font-extrabold">{completedSetsCount ?? 0}</span>
          <span className="text-xs text-[var(--color-muted)] font-medium mt-1">Seturi completate</span>
        </div>
      </div>

      {/* Quick Navigation / Motivation Quote */}
      <div className="mt-6 bg-[var(--color-surface)]/60 p-4 rounded-2xl border border-[var(--color-border)] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[var(--color-surface)] flex items-center justify-center text-[var(--color-primary)] border border-[var(--color-border)]">
            <Trophy size={18} />
          </div>
          <div>
            <p className="text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wider">Program & Plan</p>
            <p className="text-sm font-medium">Vezi programul pe 7 zile</p>
          </div>
        </div>
        <Link 
          href="/schedule" 
          className="text-xs font-bold text-[var(--color-primary)] hover:underline flex items-center gap-1"
        >
          Deschide <ArrowRight size={14} />
        </Link>
      </div>
    </div>
  )
}
