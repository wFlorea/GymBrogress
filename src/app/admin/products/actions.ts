'use server'

import { revalidatePath } from 'next/cache'
import { dbFail, fail, ok } from '@/lib/data/action-result'
import { removeProductPhotos, requireAdmin } from '@/lib/data/products'
import { cleanProduct, type ProductDetails } from '@/lib/products'
import type { ActionResult } from '@/lib/types'
import { createAdminClient } from '@/utils/supabase/admin'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const PHOTO_COLUMNS = 'front_photo, label_photo'
const ALREADY_REVIEWED = 'That product has already been reviewed.'

type PhotoRow = { front_photo: string; label_photo: string }

const photoPaths = (rows: PhotoRow[]) => rows.flatMap((row) => [row.front_photo, row.label_photo])

function revalidateReview() {
  revalidatePath('/admin/products')
  revalidatePath('/profile')
}

/** Makes a sent-in product work for everyone, with any corrections, and clears everything sent for its barcode. */
export async function approveProduct(id: string, details: ProductDetails): Promise<ActionResult> {
  await requireAdmin()
  if (typeof id !== 'string' || !UUID.test(id)) return fail('Invalid product.')
  const product = cleanProduct(details)
  if (typeof product === 'string') return fail(product)

  const admin = createAdminClient()
  const { data: submission, error: readError } = await admin.from('product_submissions').select('barcode').eq('id', id).maybeSingle()
  if (readError) return dbFail('approveProduct', readError)
  if (!submission) return fail(ALREADY_REVIEWED)

  const { barcode } = submission
  const { error } = await admin.from('shared_products').upsert({ barcode, name: product.name, ...product.per100g })
  if (error) return dbFail('approveProduct', error, 'Could not save the product. Please try again.')

  const { data: sent, error: clearError } = await admin
    .from('product_submissions')
    .delete()
    .eq('barcode', barcode)
    .select(PHOTO_COLUMNS)
    .returns<PhotoRow[]>()
  if (clearError) return dbFail('approveProduct', clearError, 'The product was saved, but it could not be cleared from this list. Please try again.')

  await removeProductPhotos(photoPaths(sent))
  revalidateReview()
  return ok()
}

/** Throws a sent-in product away, with its photos. */
export async function rejectProduct(id: string): Promise<ActionResult> {
  await requireAdmin()
  if (typeof id !== 'string' || !UUID.test(id)) return fail('Invalid product.')

  const { data: sent, error } = await createAdminClient()
    .from('product_submissions')
    .delete()
    .eq('id', id)
    .select(PHOTO_COLUMNS)
    .returns<PhotoRow[]>()
  if (error) return dbFail('rejectProduct', error, 'Could not remove the product. Please try again.')

  await removeProductPhotos(photoPaths(sent))
  revalidateReview()
  return ok()
}
