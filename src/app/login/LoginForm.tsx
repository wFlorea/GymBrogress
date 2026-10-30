'use client'

import { useActionState, useState, type ComponentProps, type ReactNode } from 'react'
import { AlertCircle, CheckCircle2, Eye, EyeOff, Lock, Mail, User, type LucideIcon } from 'lucide-react'
import { Alert } from '@/components/ui/Card'
import { PlateMark } from '@/components/ui/PlateMark'
import { SubmitButton } from '@/components/ui/SubmitButton'
import { login, requestPasswordReset, signup } from './actions'
import { MAX_NAME_LENGTH, MIN_PASSWORD_LENGTH } from './auth-state'

export type Mode = 'login' | 'signup' | 'forgot'

// Pill-shaped, like the buttons.
const pillInputStyles =
  'h-13 w-full rounded-full border border-transparent bg-black/40 pl-12 pr-5 text-sm text-white shadow-inner placeholder:text-muted transition-colors focus:border-primary focus:outline-none'

export function LoginForm({ initialMode = 'login', linkExpired = false }: { initialMode?: Mode; linkExpired?: boolean }) {
  const [mode, setMode] = useState<Mode>(initialMode)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loginState, loginAction] = useActionState(login, null)
  const [signupState, signupAction] = useActionState(signup, null)
  const [resetState, resetAction] = useActionState(requestPasswordReset, null)

  const isSignup = mode === 'signup'
  const isForgot = mode === 'forgot'
  const state = isSignup ? signupState : isForgot ? resetState : loginState
  const action = isSignup ? signupAction : isForgot ? resetAction : loginAction
  const passwordsChecked = isSignup && confirmPassword.length > 0
  const passwordsMatch = password === confirmPassword
  const canSignUp = name.trim().length > 0 && password.length >= MIN_PASSWORD_LENGTH && passwordsMatch

  function switchMode(next: Mode) {
    setMode(next)
    setConfirmPassword('')
  }

  return (
    <div className="bg-glow relative min-h-dvh overflow-hidden">
      {/* Faint plates cut off at the edges, like weights left on the floor. */}
      <PlateMark size={140} className="pointer-events-none absolute -left-16 top-[18%] text-white/[0.04]" />
      <PlateMark size={180} className="pointer-events-none absolute -right-20 bottom-[12%] text-white/[0.04]" />

      <div className="relative mx-auto flex min-h-dvh w-full flex-col justify-center px-8 py-12 sm:max-w-md">
        <div className="mb-10 text-center">
          <PlateMark size={56} className="mx-auto text-primary" />
          <h1 className="mt-4 font-display text-[2rem] font-bold">GymBrogress</h1>
          <p className="mt-1 text-sm italic text-muted">
            {isForgot
              ? 'Forgot your password? We’ll email you a link to set a new one.'
              : 'Plan your training and track every set.'}
          </p>
        </div>

        <form action={action} className="flex flex-col gap-4">
          {isSignup && (
            <Field
              label="Name or nickname"
              icon={User}
              name="name"
              autoComplete="nickname"
              value={name}
              onChange={(e) => setName(e.target.value)}
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
            required
          />

          {!isForgot && (
            <Field
              label="Password"
              icon={Lock}
              name="password"
              secret
              autoComplete={isSignup ? 'new-password' : 'current-password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={isSignup ? MIN_PASSWORD_LENGTH : undefined}
              hint={isSignup ? `At least ${MIN_PASSWORD_LENGTH} characters.` : undefined}
              required
            />
          )}

          {mode === 'login' && (
            <button
              type="button"
              onClick={() => switchMode('forgot')}
              className="-mt-1 self-end px-5 text-xs font-semibold text-muted transition-colors hover:text-primary"
            >
              Forgot password?
            </button>
          )}

          {isSignup && (
            <Field
              label="Confirm password"
              icon={Lock}
              name="confirmPassword"
              secret
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
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

          {isForgot && linkExpired && !resetState && (
            <Alert>That link has expired or was already used. Send yourself a new one.</Alert>
          )}
          {state?.error && <Alert>{state.error}</Alert>}
          {state?.notice && <Alert tone="success">{state.notice}</Alert>}

          <div className="mt-4">
            {isSignup ? (
              <SignupButton disabled={!canSignUp} />
            ) : isForgot ? (
              <SubmitButton pendingLabel="Sending…">Send reset link</SubmitButton>
            ) : (
              <SubmitButton pendingLabel="Signing in…">
                Sign in
              </SubmitButton>
            )}
          </div>
        </form>

        <p className="mt-10 text-center text-sm text-muted">
          {isSignup ? 'Have an account? ' : isForgot ? 'Remembered it? ' : 'New here? '}
          <button
            type="button"
            onClick={() => switchMode(mode === 'login' ? 'signup' : 'login')}
            className="font-semibold text-primary hover:underline"
          >
            {mode === 'login' ? 'Create account' : 'Sign in'}
          </button>
        </p>
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
        className="flex h-13 w-full cursor-not-allowed items-center justify-center rounded-full bg-surface font-semibold text-muted"
      >
        Create account
      </button>
    )
  }
  return (
    <SubmitButton pendingLabel="Creating account…">
      Create account
    </SubmitButton>
  )
}

// A ring, so it doesn't fight the focus border colour.
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
      {/* The placeholder shows the label; this keeps it for screen readers. */}
      <label htmlFor={name} className="sr-only">
        {label}
      </label>
      <div className="relative">
        <input
          id={name}
          name={name}
          type={secret && !revealed ? 'password' : secret ? 'text' : type}
          aria-describedby={hint ? hintId : undefined}
          aria-invalid={tone === 'invalid' || undefined}
          className={`${pillInputStyles} ${secret ? 'pr-12' : ''} ${tone ? TONE_RINGS[tone] : ''}`}
          placeholder={label}
          {...input}
        />
        <Icon size={18} className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-muted" />
        {secret && (
          <button
            type="button"
            onClick={() => setRevealed(!revealed)}
            aria-label={revealed ? 'Hide password' : 'Show password'}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-muted transition-colors hover:text-white"
          >
            {revealed ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>
      {hint && (
        <div id={hintId} className="px-5 text-[11px] text-muted">
          {hint}
        </div>
      )}
    </div>
  )
}
