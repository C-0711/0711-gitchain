/**
 * DPP QR Code Generator
 * Generates QR codes with embedded verification data
 */

import QRCode from 'qrcode'
import { DigitalProductPassport, generateDPPQRData } from './container-to-dpp'

export interface QRCodeOptions {
  width?: number
  margin?: number
  color?: {
    dark?: string
    light?: string
  }
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H'
}

const DEFAULT_OPTIONS: QRCodeOptions = {
  width: 256,
  margin: 2,
  color: {
    dark: '#000000',
    light: '#ffffff',
  },
  errorCorrectionLevel: 'M',
}

/**
 * Generate QR code as Data URL (base64 PNG)
 */
export async function generateQRCodeDataURL(
  dpp: DigitalProductPassport,
  options: QRCodeOptions = {}
): Promise<string> {
  const qrData = generateDPPQRData(dpp)
  const opts = { ...DEFAULT_OPTIONS, ...options }
  
  try {
    const dataUrl = await QRCode.toDataURL(qrData, {
      width: opts.width,
      margin: opts.margin,
      color: opts.color,
      errorCorrectionLevel: opts.errorCorrectionLevel,
    })
    return dataUrl
  } catch (error) {
    throw new Error(`Failed to generate QR code: ${error}`)
  }
}

/**
 * Generate QR code as SVG string
 */
export async function generateQRCodeSVG(
  dpp: DigitalProductPassport,
  options: QRCodeOptions = {}
): Promise<string> {
  const qrData = generateDPPQRData(dpp)
  const opts = { ...DEFAULT_OPTIONS, ...options }
  
  try {
    const svg = await QRCode.toString(qrData, {
      type: 'svg',
      width: opts.width,
      margin: opts.margin,
      color: opts.color,
      errorCorrectionLevel: opts.errorCorrectionLevel,
    })
    return svg
  } catch (error) {
    throw new Error(`Failed to generate QR SVG: ${error}`)
  }
}

/**
 * Generate QR code as PNG buffer
 */
export async function generateQRCodeBuffer(
  dpp: DigitalProductPassport,
  options: QRCodeOptions = {}
): Promise<Buffer> {
  const qrData = generateDPPQRData(dpp)
  const opts = { ...DEFAULT_OPTIONS, ...options }
  
  try {
    const buffer = await QRCode.toBuffer(qrData, {
      width: opts.width,
      margin: opts.margin,
      color: opts.color,
      errorCorrectionLevel: opts.errorCorrectionLevel,
    })
    return buffer
  } catch (error) {
    throw new Error(`Failed to generate QR buffer: ${error}`)
  }
}

/**
 * Generate branded QR code with 0711 logo overlay
 */
export async function generateBrandedQRCode(
  dpp: DigitalProductPassport,
  logoUrl?: string,
  options: QRCodeOptions = {}
): Promise<string> {
  // For branded QR, use higher error correction to allow logo overlay
  const qrDataUrl = await generateQRCodeDataURL(dpp, {
    ...options,
    errorCorrectionLevel: 'H', // 30% error correction allows logo
    width: options.width || 512,
  })
  
  // If no logo, return plain QR
  if (!logoUrl) return qrDataUrl
  
  // Note: Logo overlay requires canvas manipulation
  // In production, use sharp or canvas library
  return qrDataUrl
}

/**
 * Parse verification URL from QR data
 */
export function parseQRVerificationURL(qrData: string): {
  passportId: string
  hash: string
  baseUrl: string
} | null {
  try {
    const url = new URL(qrData)
    const passportId = url.searchParams.get('id')
    const hash = url.searchParams.get('hash')
    
    if (!passportId || !hash) return null
    
    return {
      passportId,
      hash,
      baseUrl: `${url.protocol}//${url.host}${url.pathname}`,
    }
  } catch {
    return null
  }
}
