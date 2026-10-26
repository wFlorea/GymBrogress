// Shared by the login form and its server actions ('use server' files can only export functions).

export const MIN_PASSWORD_LENGTH = 6
export const MAX_NAME_LENGTH = 50

/** What a login or signup attempt tells the form. */
export type AuthState = { error?: string; notice?: string } | null
