import { LoginForm, type LinkResult, type Mode } from './LoginForm'

// One address for all the forms, so ?mode=signup isn't listed as a separate page.
export const metadata = { title: 'Sign in', alternates: { canonical: '/login' } }

const MODES: readonly Mode[] = ['login', 'signup', 'forgot']
const LINK_RESULTS: readonly LinkResult[] = ['expired', 'confirmed']

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string; link?: string; account?: string }>
}) {
  // The welcome slides end with "Create account", which links here with ?mode=signup; an email link that couldn't sign
  // the user in comes back with ?link=expired or ?link=confirmed (and ?mode=forgot for a password link), and a
  // deleted account with ?account=deleted.
  const { mode, link, account } = await searchParams
  const initialMode = MODES.find((m) => m === mode) ?? 'login'
  return (
    <LoginForm
      initialMode={initialMode}
      link={LINK_RESULTS.find((result) => result === link)}
      accountDeleted={account === 'deleted'}
    />
  )
}
