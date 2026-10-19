import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import {
  DAYS_OF_WEEK,
  parseWeeklyPlan,
  parseCalendarWorkout,
  getExercisesForSplit,
} from '@/lib/types'
import { getRoutineTemplates } from '@/app/plan/actions'
import {
  Dumbbell,
  Flame,
  CheckCircle2,
  Calendar,
  ArrowRight,
  Coffee,
  Trophy,
  Layers,
  ClipboardList,
} from 'lucide-react'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const userName = user?.user_metadata?.name || user?.email?.split('@')[0] || 'Campioanule'

  // Today's day of week (Monday = 0, Sunday = 6)
  const now = new Date()
  const dayOfWeek = (now.getDay() + 6) % 7
  const todayDayName = DAYS_OF_WEEK[dayOfWeek]
  const todayIso = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`

  // Format today date in Romanian (ex: "Luni, 19 Octombrie")
  const formattedToday = now.toLocaleDateString('ro-RO', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
  const capitalizedDate = formattedToday.charAt(0).toUpperCase() + formattedToday.slice(1)

  // 1. Fetch today's workout log (which also holds calendar shift / workout plan)
  const { data: todayLog } = await supabase
    .from('workout_logs')
    .select('id, workout_name, workout_sets(id, is_completed)')
    .eq('user_id', user?.id)
    .eq('date', todayIso)
    .maybeSingle()

  const parsedLog = parseCalendarWorkout(todayLog?.workout_name)

  // 2. Fetch user routine templates from DB
  const userTemplates = await getRoutineTemplates()

  // 3. Fetch today's plan from weekly_plans as default
  const { data: planned } = await supabase
    .from('weekly_plans')
    .select('workout_name')
    .eq('user_id', user?.id)
    .eq('day_of_week', dayOfWeek)
    .maybeSingle()

  const weeklySplit = parseWeeklyPlan(planned?.workout_name).split

  // Prioritize calendar override if user set a specific split for today
  const activeSplit = parsedLog.split || weeklySplit || ''
  const isRestDay =
    !activeSplit ||
    activeSplit.toLowerCase().includes('rest') ||
    activeSplit.toLowerCase().includes('pauz') ||
    activeSplit.toLowerCase().includes('odihn')

  const todayExercises = getExercisesForSplit(activeSplit, userTemplates)

  // 4. Calculate streak from all logs
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

  // 5. Calculate total completed sets
  const { count: completedSetsCount } = await supabase
    .from('workout_sets')
    .select('*', { count: 'exact', head: true })
    .eq('is_completed', true)

  const plannedWorkoutName = activeSplit || ''
  const totalTodaySets = todayLog?.workout_sets?.length || 0
  const completedTodaySets =
    todayLog?.workout_sets?.filter((s: { is_completed: boolean }) => s.is_completed)?.length || 0

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

      {/* Work Status Banner if set in Calendar */}
      {parsedLog.workStatus && parsedLog.workStatus !== 'none' && (
        <div className="mb-4 p-3.5 rounded-2xl bg-[#14141c] border border-[#232332] flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">
              {parsedLog.workStatus === 'work' ? '💼' : '🏖️'}
            </span>
            <div>
              <span className="text-xs font-bold text-white block">
                {parsedLog.workStatus === 'work'
                  ? 'Azi ești la muncă'
                  : 'Azi este zi liberă'}
              </span>
              <span className="text-[10px] text-[var(--color-muted)]">
                Conform planificării din Calendar
              </span>
            </div>
          </div>

          <Link
            href="/calendar"
            className="text-[11px] font-bold text-[var(--color-primary)] hover:underline flex items-center gap-1"
          >
            Calendar <ArrowRight size={12} />
          </Link>
        </div>
      )}

      {/* Main Card: Today's Workout / Rest */}
      <div className="bg-[var(--color-surface)] p-5 rounded-2xl shadow-xl border border-[var(--color-border)] mb-6 transition-all">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)] flex items-center gap-1.5">
            <Calendar size={14} className="text-[var(--color-primary)]" /> {todayDayName}
            {parsedLog.split && (
              <span className="text-[10px] bg-[#FF4500]/20 text-[#FF4500] px-2 py-0.5 rounded-full font-bold ml-1">
                Calendar
              </span>
            )}
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
            <div className="grid grid-cols-2 gap-2 pt-1">
              <Link
                href="/calendar"
                className="bg-[var(--color-surface-hover)] text-xs text-zinc-300 font-semibold py-3 px-3 rounded-xl border border-[var(--color-border)] hover:border-[var(--color-primary)] transition-all flex items-center justify-center gap-1 text-center"
              >
                <Layers size={14} /> Schimbă în Calendar
              </Link>
              <Link
                href="/tracker"
                className="bg-[#FF4500]/15 text-xs text-[var(--color-primary)] font-bold py-3 px-3 rounded-xl border border-[#FF4500]/30 hover:bg-[#FF4500]/25 transition-all flex items-center justify-center gap-1 text-center"
              >
                Antrenează-te totuși <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        ) : plannedWorkoutName ? (
          <div>
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold mb-1.5 text-[var(--color-foreground)]">
                {plannedWorkoutName}
              </h2>
              {todayExercises.length > 0 && (
                <span className="text-xs text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded-lg">
                  {todayExercises.length} exerciții
                </span>
              )}
            </div>
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
                Configurează-ți săptămâna în Schedule sau Calendar pentru a avea totul organizat.
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
                href="/calendar"
                className="bg-[var(--color-primary)] text-white text-sm font-bold py-3 px-4 rounded-xl text-center hover:bg-[var(--color-primary-hover)] transition-colors flex items-center justify-center gap-1.5 shadow-md shadow-[#FF4500]/20"
              >
                Calendar Flexibil
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

      {/* Quick Navigation Cards */}
      <div className="mt-6 grid grid-cols-2 gap-3">
        <Link
          href="/calendar"
          className="bg-[var(--color-surface)]/70 hover:bg-[var(--color-surface)] p-4 rounded-2xl border border-[var(--color-border)] hover:border-[var(--color-primary)] transition-all flex flex-col justify-between"
        >
          <div className="w-8 h-8 rounded-lg bg-blue-500/15 text-blue-400 flex items-center justify-center mb-2">
            <Layers size={17} />
          </div>
          <div>
            <span className="text-xs font-black text-white block">Calendar Lună</span>
            <span className="text-[10px] text-[var(--color-muted)]">Planifică ture & liber</span>
          </div>
        </Link>

        <Link
          href="/plan"
          className="bg-[var(--color-surface)]/70 hover:bg-[var(--color-surface)] p-4 rounded-2xl border border-[var(--color-border)] hover:border-[var(--color-primary)] transition-all flex flex-col justify-between"
        >
          <div className="w-8 h-8 rounded-lg bg-[#FF4500]/15 text-[#FF4500] flex items-center justify-center mb-2">
            <ClipboardList size={17} />
          </div>
          <div>
            <span className="text-xs font-black text-white block">Rutine în Plan</span>
            <span className="text-[10px] text-[var(--color-muted)]">Exerciții Push, Pull etc.</span>
          </div>
        </Link>
      </div>
    </div>
  )
}
