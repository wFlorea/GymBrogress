import { LoginForm, type Mode } from './LoginForm'

// One address for all the forms, so ?mode=signup isn't listed as a separate page.
export const metadata = { title: 'Sign in', alternates: { canonical: '/login' } }

const MODES: readonly Mode[] = ['login', 'signup', 'forgot']

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string; link?: string; account?: string }>
}) {
  // The welcome slides end with "Create account", which links here with ?mode=signup; a reset link that no longer
  // works comes back with ?mode=forgot&link=expired, and a deleted account with ?account=deleted.
  const { mode, link, account } = await searchParams
  const initialMode = MODES.find((m) => m === mode) ?? 'login'
  return <LoginForm initialMode={initialMode} linkExpired={link === 'expired'} accountDeleted={account === 'deleted'} />
}
