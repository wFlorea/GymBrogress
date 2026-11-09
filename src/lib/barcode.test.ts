import { describe, expect, it } from 'vitest'
import { normalizeBarcode } from './barcode'

describe('normalizeBarcode', () => {
  it('accepts EAN-13 and EAN-8 as they are', () => {
    expect(normalizeBarcode('3017620422003')).toBe('3017620422003')
    expect(normalizeBarcode('96385074')).toBe('96385074')
  })

  it('pads 12-digit UPC codes to 13', () => {
    expect(normalizeBarcode('036000291452')).toBe('0036000291452')
  })

  it('ignores spaces, as typed from the pack', () => {
    expect(normalizeBarcode(' 3 017620 422003 ')).toBe('3017620422003')
  })

  it('rejects a wrong check digit', () => {
    expect(normalizeBarcode('3017620422004')).toBeNull()
  })

  it('rejects anything else', () => {
    expect(normalizeBarcode('')).toBeNull()
    expect(normalizeBarcode('12345')).toBeNull()
    expect(normalizeBarcode('30176204220031')).toBeNull()
    expect(normalizeBarcode('301762042200a')).toBeNull()
  })
})
