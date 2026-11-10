import { PRODUCT_PHOTOS_BUCKET } from '@/lib/products'
import { createClient } from '@/utils/supabase/client'

/** Long enough to read a nutrition table. */
const MAX_PHOTO_SIDE = 1280
const PHOTO_QUALITY = 0.75

/** A smaller JPEG of the photo. Redrawing it also drops the file's metadata, like where it was taken. */
async function shrinkPhoto(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, MAX_PHOTO_SIDE / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)
  const context = canvas.getContext('2d')
  if (!context) throw new Error('No canvas to draw the photo on.')
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close()
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('The photo could not be encoded.'))), 'image/jpeg', PHOTO_QUALITY)
  })
}

/** Uploads a photo to the user's own folder and returns its path. Throws when it can't. */
export async function uploadProductPhoto(file: File): Promise<string> {
  const photo = await shrinkPhoto(file)
  const supabase = createClient()
  const { data } = await supabase.auth.getSession()
  if (!data.session) throw new Error('Not signed in.')

  const path = `${data.session.user.id}/${crypto.randomUUID()}.jpg`
  const { error } = await supabase.storage.from(PRODUCT_PHOTOS_BUCKET).upload(path, photo, { contentType: 'image/jpeg' })
  if (error) throw error
  return path
}
