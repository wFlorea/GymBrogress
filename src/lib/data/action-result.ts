import type { ActionResult } from '@/lib/types'

export function ok(): ActionResult
export function ok<T>(data: T): ActionResult<T>
export function ok<T>(data?: T): ActionResult<T | undefined> {
  return { ok: true, data }
}

export function fail(error: string): { ok: false; error: string } {
  return { ok: false, error }
}

/** Logs the database error for the server and returns a message that is safe to show. */
export function dbFail(context: string, error: { message: string }, message = 'Something went wrong. Please try again.') {
  console.error(`${context}:`, error.message)
  return fail(message)
}
