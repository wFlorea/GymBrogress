import { LoginForm } from './LoginForm'

// One address for both forms, so ?mode=signup isn't listed as a separate page.
export const metadata = { title: 'Sign in', alternates: { canonical: '/login' } }

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ mode?: string }> }) {
  // The welcome slides end with "Create account", which links here with ?mode=signup.
  const { mode } = await searchParams
  return <LoginForm initialMode={mode === 'signup' ? 'signup' : 'login'} />
}
