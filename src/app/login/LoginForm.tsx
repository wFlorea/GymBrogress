'use client'

import { useActionState, useState, type ComponentProps, type ReactNode } from 'react'
import { AlertCircle, CheckCircle2, Eye, EyeOff, Lock, LogIn, Mail, User, UserPlus, type LucideIcon } from 'lucide-react'
import { Alert } from '@/components/ui/Card'
import { SubmitButton } from '@/components/ui/SubmitButton'
import { inputStyles } from '@/components/ui/styles'
import { login, signup } from './actions'
import { MAX_NAME_LENGTH, MIN_PASSWORD_LENGTH } from './auth-state'

type Mode = 'login' | 'signup'

export function LoginForm() {
  const [mode, setMode] = useState<Mode>('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loginState, loginAction] = useActionState(login, null)
  const [signupState, signupAction] = useActionState(signup, null)

  const isSignup = mode === 'signup'
  const state = isSignup ? signupState : loginState
  const passwordsChecked = isSignup && confirmPassword.length > 0
  const passwordsMatch = password === confirmPassword
  const canSignUp = name.trim().length > 0 && password.length >= MIN_PASSWORD_LENGTH && passwordsMatch

  function switchMode(next: Mode) {
    setMode(next)
    setConfirmPassword('')
  }

  return (
    <div className="mx-auto flex min-h-screen w-full flex-col justify-center px-6 py-12 sm:max-w-md">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-extrabold tracking-tight text-primary">GymBrogress</h1>
        <p className="mt-2 text-sm text-muted">Plan your training and track every set.</p>
      </div>

      <div className="rounded-2xl border border-border bg-surface p-6 shadow-xl">
        <div className="mb-6 grid grid-cols-2 rounded-xl border border-border bg-background p-1" role="tablist">
          <ModeTab active={!isSignup} icon={LogIn} onClick={() => switchMode('login')}>
            Sign in
          </ModeTab>
          <ModeTab active={isSignup} icon={UserPlus} onClick={() => switchMode('signup')}>
            Create account
          </ModeTab>
        </div>

        <form action={isSignup ? signupAction : loginAction} className="flex flex-col gap-4">
          {isSignup && (
            <Field
              label="Name or nickname"
              icon={User}
              name="name"
              autoComplete="nickname"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Alex"
              maxLength={MAX_NAME_LENGTH}
              required
            />
          )}

          <Field
            label="Email"
            icon={Mail}
            name="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
          />

          <Field
            label="Password"
            icon={Lock}
            name="password"
            secret
            autoComplete={isSignup ? 'new-password' : 'current-password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            minLength={isSignup ? MIN_PASSWORD_LENGTH : undefined}
            hint={isSignup ? `At least ${MIN_PASSWORD_LENGTH} characters.` : undefined}
            required
          />

          {isSignup && (
            <Field
              label="Confirm password"
              icon={Lock}
              name="confirmPassword"
              secret
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              tone={passwordsChecked ? (passwordsMatch ? 'valid' : 'invalid') : undefined}
              hint={
                passwordsChecked &&
                (passwordsMatch ? (
                  <span className="flex items-center gap-1.5 text-emerald-400">
                    <CheckCircle2 size={14} /> Passwords match.
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 text-red-400">
                    <AlertCircle size={14} /> Passwords don’t match.
                  </span>
                ))
              }
              required
            />
          )}

          {state?.error && <Alert>{state.error}</Alert>}
          {state?.notice && <Alert tone="success">{state.notice}</Alert>}

          <div className="mt-2">
            {isSignup ? (
              <SignupButton disabled={!canSignUp} />
            ) : (
              <SubmitButton pendingLabel="Signing in…">
                <LogIn size={18} /> Sign in
              </SubmitButton>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}

function SignupButton({ disabled }: { disabled: boolean }) {
  if (disabled) {
    return (
      <button
        type="submit"
        disabled
        className="flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-xl border border-zinc-700 bg-zinc-800 py-3.5 font-bold text-zinc-500"
      >
        <UserPlus size={18} /> Create account
      </button>
    )
  }
  return (
    <SubmitButton pendingLabel="Creating account…">
      <UserPlus size={18} /> Create account
    </SubmitButton>
  )
}

function ModeTab({
  active,
  icon: Icon,
  onClick,
  children,
}: {
  active: boolean
  icon: LucideIcon
  onClick: () => void
  children: string
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-bold transition-all ${
        active ? 'bg-surface text-white shadow-md' : 'text-muted hover:text-white'
      }`}
    >
      <Icon size={16} /> {children}
    </button>
  )
}

// A ring, so it doesn't fight the border colours in inputStyles.
const TONE_RINGS = {
  valid: 'ring-1 ring-emerald-500',
  invalid: 'ring-1 ring-red-500',
} as const

function Field({
  label,
  icon: Icon,
  name,
  hint,
  secret = false,
  tone,
  type = 'text',
  ...input
}: Omit<ComponentProps<'input'>, 'id'> & {
  label: string
  icon: LucideIcon
  name: string
  hint?: ReactNode
  secret?: boolean
  tone?: keyof typeof TONE_RINGS
}) {
  const [revealed, setRevealed] = useState(false)
  const hintId = `${name}-hint`

  return (
    <div className="space-y-1.5">
      <label htmlFor={name} className="text-xs font-semibold uppercase tracking-wider text-muted">
        {label}
      </label>
      <div className="relative">
        <input
          id={name}
          name={name}
          type={secret && !revealed ? 'password' : secret ? 'text' : type}
          aria-describedby={hint ? hintId : undefined}
          aria-invalid={tone === 'invalid' || undefined}
          className={`${inputStyles} pl-10 ${secret ? 'pr-11' : ''} ${tone ? TONE_RINGS[tone] : ''}`}
          {...input}
        />
        <Icon size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
        {secret && (
          <button
            type="button"
            onClick={() => setRevealed(!revealed)}
            aria-label={revealed ? 'Hide password' : 'Show password'}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted transition-colors hover:text-white"
          >
            {revealed ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>
      {hint && (
        <div id={hintId} className="text-[11px] text-muted">
          {hint}
        </div>
      )}
    </div>
  )
}
