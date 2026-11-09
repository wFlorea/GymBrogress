// Barcodes on food packs: EAN-8, UPC-A (12 digits) and EAN-13.
const BARCODE = /^(\d{8}|\d{12}|\d{13})$/

/** Whether the last digit fits the ones before it (GS1 check digit: weights 1 and 3 alternating from the right). */
function hasValidCheckDigit(digits: string): boolean {
  let sum = 0
  for (let i = 0; i < digits.length; i++) {
    const fromRight = digits.length - 1 - i
    sum += Number(digits[i]) * (fromRight % 2 === 1 ? 3 : 1)
  }
  return sum % 10 === 0
}

/** The barcode as plain digits, with 12-digit UPC codes padded to 13; null when it can't be a food barcode. */
export function normalizeBarcode(text: string): string | null {
  const digits = text.replace(/\s/g, '')
  if (!BARCODE.test(digits) || !hasValidCheckDigit(digits)) return null
  return digits.length === 12 ? `0${digits}` : digits
}
