import { createClient } from '@/utils/supabase/server'
import { logout } from '@/app/login/actions'
import { NotificationButton } from './NotificationButton'
import { Bell, LogOut, Settings, User } from 'lucide-react'

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div className="p-4 pt-8 pb-20">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Profilul Meu</h1>
        <p className="text-[var(--color-muted)] text-sm mt-1">
          Gestionează-ți contul și setările.
        </p>
      </div>

      {/* User Card */}
      <div className="bg-[var(--color-surface)] p-4 rounded-xl border border-[var(--color-border)] mb-6 flex items-center gap-4">
        <div className="w-12 h-12 bg-[var(--color-primary)] rounded-full flex items-center justify-center text-white font-bold text-xl">
          {user?.email?.charAt(0).toUpperCase() || 'U'}
        </div>
        <div>
          <h2 className="font-bold">Brogresser</h2>
          <p className="text-[var(--color-muted)] text-sm">{user?.email}</p>
        </div>
      </div>

      {/* Settings List */}
      <div className="space-y-3 mb-8">
        <div className="bg-[var(--color-surface)] p-4 rounded-xl border border-[var(--color-border)] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Bell size={20} className="text-[var(--color-primary)]" />
            <span className="font-medium">Notificări Zilnice</span>
          </div>
          <NotificationButton />
        </div>

        <div className="bg-[var(--color-surface)] p-4 rounded-xl border border-[var(--color-border)] flex items-center justify-between opacity-50 cursor-not-allowed">
          <div className="flex items-center gap-3">
            <Settings size={20} className="text-[var(--color-muted)]" />
            <span className="font-medium">Setări Tema</span>
          </div>
          <span className="text-xs text-[var(--color-muted)]">În curând</span>
        </div>
      </div>

      {/* Logout */}
      <form action={logout}>
        <button className="w-full bg-red-900/20 text-red-500 border border-red-900/50 font-bold py-4 rounded-xl hover:bg-red-900/40 transition-colors flex items-center justify-center gap-2">
          <LogOut size={20} /> Deconectare
        </button>
      </form>
    </div>
  )
}
