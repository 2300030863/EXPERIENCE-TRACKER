import { isValidUpiId, UPI_ID_REGEX } from './upi'

/**
 * Parses and strictly validates a raw QR code string according to NPCI UPI specifications.
 * 
 * Supports:
 * - Standard: upi://pay?pa=recipient@bank&pn=Recipient%20Name&am=500.00&cu=INR&tn=Dinner
 * - Case-insensitive: UPI://PAY?...
 * - URL encoded forms
 * 
 * Rejects:
 * - Non-UPI URLs (https://, bitcoin:, mailto:, random strings)
 * - Missing or malformed payee address (pa)
 * - Non-INR currencies (when currency is specified)
 * - Negative or invalid amounts
 */
export function parseUpiQr(rawText) {
  if (!rawText || typeof rawText !== 'string') {
    return {
      isValid: false,
      error: 'Empty or invalid QR code data',
    }
  }

  const trimmed = rawText.trim()

  // 1. Must start with upi://pay (case-insensitive)
  if (!/^upi:\/\/pay/i.test(trimmed)) {
    // Check if it's an arbitrary web URL or other protocol
    if (/^(https?|ftp|mailto|tel|sms|bitcoin|ethereum):/i.test(trimmed)) {
      return {
        isValid: false,
        error: 'Unsupported QR format: Only Indian UPI payment QR codes are supported.',
      }
    }
    return {
      isValid: false,
      error: 'Invalid QR Code: Not a recognized UPI payment code.',
    }
  }

  // 2. Extract query parameters safely
  let queryString = ''
  const qIndex = trimmed.indexOf('?')
  if (qIndex !== -1) {
    queryString = trimmed.substring(qIndex + 1)
  } else {
    return {
      isValid: false,
      error: 'Malformed UPI QR code: Missing payment parameters.',
    }
  }

  let params
  try {
    params = new URLSearchParams(queryString)
  } catch (_) {
    return {
      isValid: false,
      error: 'Could not parse UPI QR parameters.',
    }
  }

  // Helper to extract case-insensitive query parameter
  const getParam = (name) => {
    for (const [key, value] of params.entries()) {
      if (key.toLowerCase() === name.toLowerCase()) {
        return value
      }
    }
    return null
  }

  // 3. Extract and Validate Payee Address (pa) - Mandatory
  const rawPa = getParam('pa')
  if (!rawPa) {
    return {
      isValid: false,
      error: 'Invalid UPI QR: Missing payee UPI ID (pa).',
    }
  }

  const upiId = decodeURIComponent(rawPa).trim()
  if (!isValidUpiId(upiId)) {
    return {
      isValid: false,
      error: `Invalid UPI ID format in QR: "${upiId}". Expected format: username@bank`,
    }
  }

  // 4. Extract Payee Name (pn)
  const rawPn = getParam('pn')
  let recipientName = rawPn ? decodeURIComponent(rawPn).trim() : ''
  if (!recipientName) {
    // Fallback to username part of UPI ID if name not provided in QR
    recipientName = upiId.split('@')[0] || 'UPI Merchant'
  }

  // 5. Extract and Validate Currency (cu)
  const rawCu = getParam('cu')
  const currency = rawCu ? decodeURIComponent(rawCu).trim().toUpperCase() : 'INR'
  if (currency !== 'INR') {
    return {
      isValid: false,
      error: `Unsupported currency: ${currency}. Only INR is supported.`,
    }
  }

  // 6. Extract Amount (am) - Optional on static merchant QRs
  const rawAm = getParam('am')
  let amount = null
  let hasFixedAmount = false

  if (rawAm) {
    const parsedAmount = parseFloat(decodeURIComponent(rawAm).trim())
    if (Number.isFinite(parsedAmount) && parsedAmount > 0) {
      if (parsedAmount > 100000) {
        return {
          isValid: false,
          error: `Amount in QR (₹${parsedAmount}) exceeds the NPCI maximum limit of ₹1,00,000`,
        }
      }
      amount = Math.round(parsedAmount * 100) / 100
      hasFixedAmount = true
    } else {
      return {
        isValid: false,
        error: 'Invalid or negative amount specified in QR code.',
      }
    }
  }

  // 7. Extract Note (tn)
  const rawTn = getParam('tn')
  const note = rawTn ? decodeURIComponent(rawTn).trim().slice(0, 50) : ''

  // 8. Extract Merchant Category Code (mc) and Reference (tr)
  const rawMc = getParam('mc')
  const merchantCode = rawMc ? decodeURIComponent(rawMc).trim() : null
  const rawTr = getParam('tr')
  const referenceId = rawTr ? decodeURIComponent(rawTr).trim() : null

  return {
    isValid: true,
    upiId,
    recipientName,
    amount,
    hasFixedAmount,
    currency: 'INR',
    note,
    merchantCode,
    referenceId,
    rawPayload: trimmed,
  }
}
