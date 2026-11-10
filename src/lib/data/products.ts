import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'
import { PRODUCT_PHOTOS_BUCKET } from '@/lib/products'
import type { CatalogFood, Nutrition, ProductSubmission } from '@/lib/types'
import { createAdminClient } from '@/utils/supabase/admin'
import type { AuthUser } from '@/utils/supabase/auth-user'
import { requireUser } from './session'

const PRODUCT_COLUMNS = 'name, calories, protein, carbs, fat'
/** How long a photo link on the review page works, in seconds. */
const PHOTO_LINK_SECONDS = 60 * 60

type ProductRow = Nutrition & { name: string }

function per100gOf({ calories, protein, carbs, fat }: ProductRow): Nutrition {
  return { calories, protein, carbs, fat }
}

/** Whether this is the account that reviews products (the `ADMIN_EMAIL` env var). */
export function isAdmin(user: AuthUser): boolean {
  const admin = process.env.ADMIN_EMAIL?.trim().toLowerCase()
  return Boolean(admin) && user.email?.toLowerCase() === admin
}

/** For pages only the reviewer can open: anyone else gets a plain 404. */
export async function requireAdmin(): Promise<AuthUser> {
  const user = await requireUser()
  if (!isAdmin(user)) notFound()
  return user
}

/**
 * A product added through the app: an approved one, or one this user sent that's still waiting.
 * A failed read counts as no product, so scanning falls back to Open Food Facts.
 */
export async function findAddedProduct(supabase: SupabaseClient, userId: string, barcode: string): Promise<CatalogFood | null> {
  const [shared, mine] = await Promise.all([
    supabase.from('shared_products').select(PRODUCT_COLUMNS).eq('barcode', barcode).maybeSingle<ProductRow>(),
    supabase.from('product_submissions').select(PRODUCT_COLUMNS).eq('user_id', userId).eq('barcode', barcode).maybeSingle<ProductRow>(),
  ])
  if (shared.error) console.error('findAddedProduct:', shared.error.message)
  if (mine.error) console.error('findAddedProduct:', mine.error.message)

  const row = shared.data ?? mine.data
  return row ? { id: `product-${barcode}`, name: row.name, per100g: per100gOf(row) } : null
}

/** Everything waiting for review, oldest first. */
export async function getWaitingProducts(): Promise<ProductSubmission[]> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('product_submissions')
    .select(`id, barcode, created_at, front_photo, label_photo, ${PRODUCT_COLUMNS}`)
    .order('created_at')
    .returns<(ProductRow & { id: string; barcode: string; created_at: string; front_photo: string; label_photo: string })[]>()
  if (error) throw new Error(`getWaitingProducts: ${error.message}`)
  if (data.length === 0) return []

  const paths = data.flatMap((row) => [row.front_photo, row.label_photo])
  const { data: links, error: linkError } = await admin.storage.from(PRODUCT_PHOTOS_BUCKET).createSignedUrls(paths, PHOTO_LINK_SECONDS)
  if (linkError) console.error('getWaitingProducts:', linkError.message)
  const linkOf = (path: string) => links?.find((link) => link.path === path)?.signedUrl ?? null

  return data.map((row) => ({
    id: row.id,
    barcode: row.barcode,
    name: row.name,
    per100g: per100gOf(row),
    frontPhotoUrl: linkOf(row.front_photo),
    labelPhotoUrl: linkOf(row.label_photo),
    submittedAt: row.created_at,
  }))
}

/** How many products are waiting. A failure counts as none, so it can't break the page showing it. */
export async function countWaitingProducts(): Promise<number> {
  try {
    const { count, error } = await createAdminClient().from('product_submissions').select('id', { count: 'exact', head: true })
    if (error) throw new Error(error.message)
    return count ?? 0
  } catch (error) {
    console.error('countWaitingProducts:', error)
    return 0
  }
}

/** Deletes photos. A failure is only logged: it leaves a stray file, and shouldn't undo what was just saved. */
export async function removeProductPhotos(paths: string[]): Promise<void> {
  if (paths.length === 0) return
  try {
    const { error } = await createAdminClient().storage.from(PRODUCT_PHOTOS_BUCKET).remove(paths)
    if (error) throw new Error(error.message)
  } catch (error) {
    console.error('removeProductPhotos:', error)
  }
}

/** Deletes every photo in a user's folder, for account deletion. Returns the error, if any. */
export async function removeUserProductPhotos(admin: SupabaseClient, userId: string): Promise<Error | null> {
  const bucket = admin.storage.from(PRODUCT_PHOTOS_BUCKET)
  const { data, error } = await bucket.list(userId, { limit: 1000 })
  if (error) return error
  if (data.length === 0) return null
  const { error: removeError } = await bucket.remove(data.map((file) => `${userId}/${file.name}`))
  return removeError
}
