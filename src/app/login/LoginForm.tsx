'use client'

import { useState } from 'react'
import { login, signup } from './actions'
import { Eye, EyeOff, Lock, Mail, AlertCircle, CheckCircle2, UserPlus, LogIn, User } from 'lucide-react'

export function LoginForm({ serverMessage }: { serverMessage?: string }) {
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [clientError, setClientError] = useState<string | null>(null)

  const isPasswordMismatch = mode === 'signup' && confirmPassword.length > 0 && password !== confirmPassword
  const isPasswordMatch = mode === 'signup' && confirmPassword.length > 0 && password === confirmPassword

  const handleModeChange = (newMode: 'login' | 'signup') => {
    setMode(newMode)
    setClientError(null)
    setConfirmPassword('')
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    setClientError(null)

    if (mode === 'signup') {
      if (!name.trim()) {
        e.preventDefault()
        setClientError('Te rugăm să introduci un nume sau nickname.')
        return
      }

      if (password.length < 6) {
        e.preventDefault()
        setClientError('Parola trebuie să aibă cel puțin 6 caractere.')
        return
      }

      if (password !== confirmPassword) {
        e.preventDefault()
        setClientError('Parolele introduse nu coincid! Te rugăm să le verifici.')
        return
      }
    }
  }

  const displayedMessage = clientError || serverMessage

  return (
    <div className="flex-1 flex flex-col w-full px-6 sm:max-w-md justify-center min-h-screen bg-[var(--color-background)] mx-auto py-12">
      {/* Brand Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-extrabold text-[var(--color-primary)] tracking-tight">
          GymBrogress
        </h1>
        <p className="text-[var(--color-muted)] text-sm mt-2">
          Urmărește-ți progresul și antrenează-te ca un pro.
        </p>
      </div>

      {/* Card */}
      <div className="bg-[var(--color-surface)] p-6 rounded-2xl border border-[var(--color-border)] shadow-xl">
        {/* Mode Selector Tabs */}
        <div className="grid grid-cols-2 p-1 bg-[#121212] rounded-xl mb-6 border border-[var(--color-border)]">
          <button
            type="button"
            onClick={() => handleModeChange('login')}
            className={`py-2.5 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${
              mode === 'login'
                ? 'bg-[var(--color-surface)] text-white shadow-md'
                : 'text-[var(--color-muted)] hover:text-white'
            }`}
          >
            <LogIn size={16} /> Intră în cont
          </button>
          <button
            type="button"
            onClick={() => handleModeChange('signup')}
            className={`py-2.5 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${
              mode === 'signup'
                ? 'bg-[var(--color-surface)] text-white shadow-md'
                : 'text-[var(--color-muted)] hover:text-white'
            }`}
          >
            <UserPlus size={16} /> Creează cont
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Name / Nickname (Only in Signup Mode) */}
          {mode === 'signup' && (
            <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2 duration-200">
              <label className="text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)]" htmlFor="name">
                Nume / Nickname
              </label>
              <div className="relative">
                <input
                  id="name"
                  name="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="ex: Alex sau Champ"
                  required
                  className="w-full rounded-xl pl-10 pr-4 py-3 bg-[#121212] border border-[var(--color-border)] text-white placeholder:text-[var(--color-muted)] focus:outline-none focus:border-[var(--color-primary)] transition-colors text-sm"
                />
                <User size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-muted)]" />
              </div>
            </div>
          )}

          {/* Email */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)]" htmlFor="email">
              Adresă Email
            </label>
            <div className="relative">
              <input
                id="email"
                name="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="exemplu@email.com"
                required
                className="w-full rounded-xl pl-10 pr-4 py-3 bg-[#121212] border border-[var(--color-border)] text-white placeholder:text-[var(--color-muted)] focus:outline-none focus:border-[var(--color-primary)] transition-colors text-sm"
              />
              <Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-muted)]" />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)]" htmlFor="password">
              Parolă
            </label>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                className="w-full rounded-xl pl-10 pr-11 py-3 bg-[#121212] border border-[var(--color-border)] text-white placeholder:text-[var(--color-muted)] focus:outline-none focus:border-[var(--color-primary)] transition-colors text-sm"
              />
              <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-muted)]" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[var(--color-muted)] hover:text-white transition-colors"
                title={showPassword ? 'Ascunde parola' : 'Afișează parola'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {mode === 'signup' && (
              <p className="text-[11px] text-[var(--color-muted)]">
                Minim 6 caractere.
              </p>
            )}
          </div>

          {/* Confirm Password (Only in Signup Mode) */}
          {mode === 'signup' && (
            <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2 duration-200">
              <label className="text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)]" htmlFor="confirmPassword">
                Confirmă Parola (Introdu din nou)
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className={`w-full rounded-xl pl-10 pr-11 py-3 bg-[#121212] border text-white placeholder:text-[var(--color-muted)] focus:outline-none transition-colors text-sm ${
                    isPasswordMismatch 
                      ? 'border-red-500 focus:border-red-500' 
                      : isPasswordMatch 
                        ? 'border-emerald-500 focus:border-emerald-500' 
                        : 'border-[var(--color-border)] focus:border-[var(--color-primary)]'
                  }`}
                />
                <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-muted)]" />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[var(--color-muted)] hover:text-white transition-colors"
                  title={showConfirmPassword ? 'Ascunde parola' : 'Afișează parola'}
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              {/* Match Feedback Badge */}
              {isPasswordMismatch && (
                <div className="flex items-center gap-1.5 text-xs text-red-400 mt-1">
                  <AlertCircle size={14} />
                  <span>Parolele nu coincid!</span>
                </div>
              )}
              {isPasswordMatch && (
                <div className="flex items-center gap-1.5 text-xs text-emerald-400 mt-1">
                  <CheckCircle2 size={14} />
                  <span>Parolele coincid perfect.</span>
                </div>
              )}
            </div>
          )}

          {/* Error Message */}
          {displayedMessage && (
            <div className="mt-2 p-3 bg-red-950/40 border border-red-800/60 rounded-xl text-red-400 text-xs flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0" />
              <span>{displayedMessage}</span>
            </div>
          )}

          {/* Submit Button */}
          {mode === 'login' ? (
            <button
              formAction={login}
              className="mt-2 w-full bg-[var(--color-primary)] rounded-xl py-3.5 text-white font-bold hover:bg-[var(--color-primary-hover)] transition-all shadow-lg shadow-[#FF4500]/25 active:scale-[0.98] text-sm flex items-center justify-center gap-2"
            >
              <LogIn size={18} /> Intră în cont
            </button>
          ) : (
            <button
              formAction={signup}
              disabled={isPasswordMismatch || password.length < 6 || !name.trim()}
              className={`mt-2 w-full rounded-xl py-3.5 font-bold transition-all shadow-lg text-sm flex items-center justify-center gap-2 ${
                isPasswordMismatch || password.length < 6 || !name.trim()
                  ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700'
                  : 'bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)] shadow-[#FF4500]/25 active:scale-[0.98]'
              }`}
            >
              <UserPlus size={18} /> Înregistrează contul
            </button>
          )}
        </form>
      </div>
    </div>
  )
}
