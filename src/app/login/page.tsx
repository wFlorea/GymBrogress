import { login, signup } from './actions'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ message: string }>
}) {
  const { message } = await searchParams

  return (
    <div className="flex-1 flex flex-col w-full px-8 sm:max-w-md justify-center gap-2 min-h-screen bg-[var(--color-background)] mx-auto pt-20">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-[var(--color-primary)]">GymBrogress</h1>
        <p className="text-[var(--color-muted)] mt-2">Urmărește-ți progresul ca un pro.</p>
      </div>

      <form className="flex-1 flex flex-col w-full justify-center gap-4 text-[var(--color-foreground)]">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium" htmlFor="email">
            Email
          </label>
          <input
            className="rounded-md px-4 py-3 bg-[var(--color-surface)] border border-[var(--color-border)] mb-2"
            name="email"
            placeholder="email@exemplu.com"
            required
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium" htmlFor="password">
            Parolă
          </label>
          <input
            className="rounded-md px-4 py-3 bg-[var(--color-surface)] border border-[var(--color-border)] mb-4"
            type="password"
            name="password"
            placeholder="••••••••"
            required
          />
        </div>

        <button
          formAction={login}
          className="bg-[var(--color-primary)] rounded-md px-4 py-3 text-white font-bold mb-2 hover:bg-[var(--color-primary-hover)] transition-colors"
        >
          Intră în cont
        </button>
        <button
          formAction={signup}
          className="border border-[var(--color-border)] rounded-md px-4 py-3 text-[var(--color-foreground)] hover:bg-[var(--color-surface)] transition-colors mb-2"
        >
          Creează cont nou
        </button>

        {message && (
          <p className="mt-4 p-4 bg-[var(--color-surface)] text-[var(--color-error)] text-center rounded-md border border-[var(--color-border)]">
            {message}
          </p>
        )}
      </form>
    </div>
  )
}
