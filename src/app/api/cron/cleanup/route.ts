import { PRODUCT_PHOTOS_BUCKET } from '@/lib/products'
import { WAITING_PRODUCT_DAYS, cutoff, isStaleSignup, strayPhotos } from '@/lib/retention'
import { createAdminClient } from '@/utils/supabase/admin'

type Admin = ReturnType<typeof createAdminClient>

const PAGE_SIZE = 1000

/** Removes sign-ups that were never confirmed. Collected first, because deleting while paging would skip users. */
async function removeStaleSignups(admin: Admin, now: Date): Promise<number> {
  const stale: string[] = []
  for (let page = 1; ; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: PAGE_SIZE })
    if (error) throw new Error(error.message)
    stale.push(...data.users.filter((user) => isStaleSignup(user, now)).map((user) => user.id))
    if (data.users.length < PAGE_SIZE) break
  }

  let removed = 0
  for (const id of stale) {
    const { error } = await admin.auth.admin.deleteUser(id)
    if (error) console.error('cleanup:', error.message)
    else removed++
  }
  return removed
}

/** Removes products nobody checked in time: the photos first, so a failure leaves the row to retry next week. */
async function removeExpiredSubmissions(admin: Admin, now: Date): Promise<number> {
  const { data, error } = await admin
    .from('product_submissions')
    .select('id, front_photo, label_photo')
    .lt('created_at', cutoff(WAITING_PRODUCT_DAYS, now))
  if (error) throw new Error(error.message)
  if (data.length === 0) return 0

  const { error: photoError } = await admin.storage
    .from(PRODUCT_PHOTOS_BUCKET)
    .remove(data.flatMap((row) => [row.front_photo, row.label_photo]))
  if (photoError) throw new Error(photoError.message)

  const { error: deleteError } = await admin.from('product_submissions').delete().in('id', data.map((row) => row.id))
  if (deleteError) throw new Error(deleteError.message)
  return data.length
}

/** Every photo a waiting product points to. Throws rather than return part of them, which would delete the rest. */
async function waitingPhotos(admin: Admin): Promise<Set<string>> {
  const paths = new Set<string>()
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await admin
      .from('product_submissions')
      .select('front_photo, label_photo')
      .order('id')
      .range(from, from + PAGE_SIZE - 1)
    if (error) throw new Error(error.message)
    data.forEach((row) => paths.add(row.front_photo).add(row.label_photo))
    if (data.length < PAGE_SIZE) return paths
  }
}

/** One level of the photo bucket: the user folders at the top, the photos inside a folder. */
async function listFolder(admin: Admin, folder: string) {
  const entries = []
  for (let offset = 0; ; offset += PAGE_SIZE) {
    const { data, error } = await admin.storage.from(PRODUCT_PHOTOS_BUCKET).list(folder, { limit: PAGE_SIZE, offset })
    if (error) throw new Error(error.message)
    entries.push(...data)
    if (data.length < PAGE_SIZE) return entries
  }
}

/** Removes uploaded photos that never became part of a product, such as when the form failed after the upload. */
async function removeStrayPhotos(admin: Admin, now: Date): Promise<number> {
  const waiting = await waitingPhotos(admin)
  const folders = await listFolder(admin, '')

  const files = []
  for (const folder of folders) {
    // Supabase lists folders as entries without an id.
    if (folder.id) continue
    const inFolder = await listFolder(admin, folder.name)
    files.push(...inFolder.map((file) => ({ path: `${folder.name}/${file.name}`, createdAt: file.created_at })))
  }

  const stray = strayPhotos(files, waiting, now)
  if (stray.length === 0) return 0
  const { error } = await admin.storage.from(PRODUCT_PHOTOS_BUCKET).remove(stray)
  if (error) throw new Error(error.message)
  return stray.length
}

/** Runs one step; a failure is logged and shows as null, and doesn't stop the other steps. */
async function attempt(step: () => Promise<number>): Promise<number | null> {
  try {
    return await step()
  } catch (error) {
    console.error('cleanup:', error)
    return null
  }
}

/**
 * Deletes data nobody is using, on the schedule the Privacy page promises (see `lib/retention.ts`). Vercel Cron calls
 * it once a week (see vercel.json) with `Authorization: Bearer $CRON_SECRET`.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createAdminClient()
  const now = new Date()
  const signups = await attempt(() => removeStaleSignups(admin, now))
  const products = await attempt(() => removeExpiredSubmissions(admin, now))
  // After the expired products, whose photos are already gone by now.
  const photos = await attempt(() => removeStrayPhotos(admin, now))

  const failed = [signups, products, photos].includes(null)
  return Response.json({ signups, products, photos }, { status: failed ? 500 : 200 })
}
