import { useEffect, useRef, useState } from 'react'
import type { BarcodeDetector as ZXingDetector } from 'barcode-detector/ponyfill'
import { normalizeBarcode } from '@/lib/barcode'

/** The barcodes on food packs. */
const FORMATS = ['ean_13', 'ean_8', 'upc_a'] as const
/** How often a camera frame is checked for a barcode. */
const SCAN_INTERVAL = 200
/** Frames in a row that can fail before the scanner gives up. */
const MAX_DETECT_FAILURES = 10

export type CameraProblem = 'denied' | 'unavailable' | 'scanner'

interface Detector {
  detect(source: HTMLVideoElement): Promise<{ rawValue: string }[]>
}

/** The browser's own barcode reader where it has one for these formats (Android), or ZXing in WebAssembly (iPhone). */
async function createDetector(): Promise<Detector> {
  const native = (window as unknown as { BarcodeDetector?: typeof ZXingDetector }).BarcodeDetector
  if (native) {
    const supported = await native.getSupportedFormats()
    if (FORMATS.every((format) => supported.includes(format))) return new native({ formats: [...FORMATS] })
  }
  const { BarcodeDetector, prepareZXingModule } = await import('barcode-detector/ponyfill')
  // Loads the WebAssembly now, so a failed download shows up here rather than as frames that never scan.
  await prepareZXingModule({ fireImmediately: true })
  return new BarcodeDetector({ formats: [...FORMATS] })
}

/** While `active`, films through the rear camera into the returned video and calls `onCode` with the first barcode. */
export function useBarcodeCamera(active: boolean, onCode: (code: string) => void) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [problem, setProblem] = useState<CameraProblem | null>(null)

  useEffect(() => {
    const video = videoRef.current
    if (!active || !video) return

    let stopped = false
    let stream: MediaStream | null = null
    let timer: ReturnType<typeof setTimeout> | undefined
    let failures = 0

    function stopCamera() {
      stream?.getTracks().forEach((track) => track.stop())
      stream = null
    }

    async function scan(detector: Detector) {
      try {
        if (video!.readyState >= video!.HAVE_CURRENT_DATA) {
          const barcodes = await detector.detect(video!)
          failures = 0
          if (stopped) return
          const code = barcodes.map(({ rawValue }) => normalizeBarcode(rawValue)).find(Boolean)
          if (code) {
            navigator.vibrate?.(60)
            return onCode(code)
          }
        }
      } catch (error) {
        console.error('Barcode scan:', error)
        failures += 1
        if (failures >= MAX_DETECT_FAILURES) {
          stopCamera()
          return setProblem('scanner')
        }
      }
      if (!stopped) timer = setTimeout(() => scan(detector), SCAN_INTERVAL)
    }

    async function start() {
      // Missing on pages that aren't HTTPS, and in browsers without camera access.
      if (!navigator.mediaDevices?.getUserMedia) return setProblem('unavailable')
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
        })
        if (stopped) return stopCamera()
        video!.srcObject = stream
        await video!.play()
      } catch (error) {
        if (stopped) return
        stopCamera()
        return setProblem(error instanceof DOMException && error.name === 'NotAllowedError' ? 'denied' : 'unavailable')
      }

      try {
        const detector = await createDetector()
        if (stopped) return
        setProblem(null)
        await scan(detector)
      } catch (error) {
        console.error('Barcode scanner:', error)
        if (stopped) return
        stopCamera()
        setProblem('scanner')
      }
    }

    start()
    return () => {
      stopped = true
      clearTimeout(timer)
      stopCamera()
      video.srcObject = null
    }
  }, [active, onCode])

  return { videoRef, problem }
}
