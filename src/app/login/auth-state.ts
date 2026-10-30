// Shared by the login and password forms and their server actions ('use server' files can only export functions).

export const MIN_PASSWORD_LENGTH = 6
export const MAX_NAME_LENGTH = 50

/** Where a password reset link ends up, and where a signed-in user changes their password. */
export const NEW_PASSWORD_PATH = '/password'

/** What a login, signup or password attempt tells the form. */
export type AuthState = { error?: string; notice?: string } | null

export function field(formData: FormData, name: string): string {
  const value = formData.get(name)
  return typeof value === 'string' ? value : ''
}
