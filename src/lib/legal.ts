// Who runs the app, and the consents people give. The legal pages themselves are /privacy and /terms.

export const OPERATOR = {
  name: 'Nedelcu Florin Cristian',
  email: 'cristiannedelcu321@gmail.com',
  country: 'Romania',
} as const

/** Shown on the legal pages. Change both when their text changes. */
export const LEGAL_UPDATED = '9 November 2026'
/** Saved with each account, so we can tell which terms it accepted. */
export const LEGAL_VERSION = '2026-11-09'

/**
 * When the user agreed that we keep their body details (health data under the GDPR, which needs explicit consent).
 * Kept in the account's user_metadata, so it goes with the account.
 */
export const HEALTH_CONSENT_KEY = 'health_consent_at'

export function hasHealthConsent(metadata: Record<string, unknown> | undefined): boolean {
  return typeof metadata?.[HEALTH_CONSENT_KEY] === 'string'
}
