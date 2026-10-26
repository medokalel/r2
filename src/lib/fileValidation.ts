export const MAX_UPLOAD_FILE_SIZE_MB = 10
export const MAX_UPLOAD_FILE_SIZE_BYTES = MAX_UPLOAD_FILE_SIZE_MB * 1024 * 1024

export function isValidFileSize(
  file: File,
  maxBytes = MAX_UPLOAD_FILE_SIZE_BYTES
): boolean {
  return file.size <= maxBytes
}

const IMAGE_TYPES = ['image/svg+xml', 'image/png', 'image/webp', 'image/jpeg']
const IMAGE_EXTENSIONS = /\.(svg|png|webp|jpe?g)$/i

/** Logos and marks: SVG, PNG, WEBP or JPG (by MIME type, or by extension when the browser gives none). */
export function isAcceptedImage(file: File): boolean {
  return IMAGE_TYPES.includes(file.type) || (!file.type && IMAGE_EXTENSIONS.test(file.name))
}
