import { LoginForm } from './LoginForm'

export const metadata = { title: 'Sign in' }

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ mode?: string }> }) {
  // The welcome slides end with "Create account", which links here with ?mode=signup.
  const { mode } = await searchParams
  return <LoginForm initialMode={mode === 'signup' ? 'signup' : 'login'} />
}
