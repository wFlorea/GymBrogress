/** Set once a visitor has been through the welcome slides, so later signed-out visits go straight to /login. */
export const WELCOME_SEEN_COOKIE = 'welcome-seen'

/** Remembers for a year that this browser has seen the welcome slides. */
export function markWelcomeSeen() {
  document.cookie = `${WELCOME_SEEN_COOKIE}=1; path=/; max-age=31536000; samesite=lax`
}
