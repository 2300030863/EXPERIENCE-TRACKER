import QRCode from 'qrcode';
import { Capacitor } from '@capacitor/core';
import { AppLauncher } from '@capacitor/app-launcher';

/**
 * UPI Protocol and Platform Detection Utility
 * Standard NPCI URI Scheme: upi://pay?pa=...&pn=...&am=...&cu=INR&tn=...&tr=...
 */

export const UPI_ID_REGEX = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/;

/**
 * Detect client platform safely (Capacitor native, Mobile Web, Desktop)
 */
export function detectPlatform() {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return 'desktop';
  }

  // 1. Native Capacitor detection (highest precedence)
  try {
    if (Capacitor && typeof Capacitor.isNativePlatform === 'function' && Capacitor.isNativePlatform()) {
      const p = Capacitor.getPlatform();
      if (p === 'android' || p === 'ios') return p;
    }
  } catch (_) {}

  // 2. User-Agent mobile detection
  const ua = navigator.userAgent || navigator.vendor || window.opera || '';
  if (/android/i.test(ua)) {
    return 'android';
  }
  if (/iPad|iPhone|iPod/.test(ua) && !window.MSStream) {
    return 'ios';
  }

  // 3. Touch device detection fallback (e.g. tablet or mobile browser without standard UA)
  if (typeof navigator.maxTouchPoints === 'number' && navigator.maxTouchPoints > 2) {
    if (/Macintosh/.test(ua)) return 'ios'; // iPad Safari desktop mode
  }

  return 'desktop';
}

/**
 * Validate standard UPI Virtual Payment Address format
 */
export function isValidUpiId(upiId) {
  if (!upiId || typeof upiId !== 'string') return false;
  return UPI_ID_REGEX.test(upiId.trim());
}

/**
 * Build properly encoded standard UPI payment URI
 */
export function buildUpiPaymentUri({ upiId, recipientName, amount, note = '', referenceId = '' }) {
  if (!isValidUpiId(upiId)) {
    throw new Error('Invalid recipient UPI ID format');
  }

  const cleanName = typeof recipientName === 'string' ? recipientName.trim().slice(0, 100) : '';
  const numAmount = Number(amount);
  if (!Number.isFinite(numAmount) || numAmount <= 0) {
    throw new Error('Amount must be a positive number');
  }

  // NPCI standard note length (tn) is 50 chars in most UPI apps
  const cleanNote = typeof note === 'string' ? note.trim().slice(0, 50) : '';

  const params = [
    `pa=${encodeURIComponent(upiId.trim())}`,
    `pn=${encodeURIComponent(cleanName)}`,
    `am=${encodeURIComponent(numAmount.toFixed(2))}`,
    `cu=INR`,
  ];

  if (cleanNote) {
    params.push(`tn=${encodeURIComponent(cleanNote)}`);
  }
  if (referenceId) {
    params.push(`tr=${encodeURIComponent(String(referenceId).trim())}`);
  }

  return `upi://pay?${params.join('&')}`;
}

/**
 * Returns app-specific deep links alongside standard universal UPI URI
 */
export function getUpiAppLinks({ upiId, recipientName, amount, note = '', referenceId = '' }) {
  const genericUri = buildUpiPaymentUri({ upiId, recipientName, amount, note, referenceId });
  const queryPart = genericUri.replace('upi://pay?', '');

  // NPCI standard URI and OS-level schemes
  const gpayUri = `tez://upi/pay?${queryPart}`;
  const phonepeUri = `phonepe://pay?${queryPart}`;
  const paytmUri = `paytmmp://pay?${queryPart}`;
  const bhimUri = `upi://pay?${queryPart}`;
  const credUri = `cred://upi/pay?${queryPart}`;

  // Android Chrome package-specific intent URLs (for web Chrome fallback)
  const gpayAndroid = `intent://pay?${queryPart}#Intent;scheme=upi;package=com.google.android.apps.nbu.paisa.user;end`;
  const phonepeAndroid = `intent://pay?${queryPart}#Intent;scheme=upi;package=com.phonepe.app;end`;
  const paytmAndroid = `intent://pay?${queryPart}#Intent;scheme=upi;package=net.one97.paytm;end`;

  return {
    generic: genericUri,
    gpay: gpayUri,
    phonepe: phonepeUri,
    paytm: paytmUri,
    bhim: bhimUri,
    cred: credUri,
    intents: {
      gpay: gpayAndroid,
      phonepe: phonepeAndroid,
      paytm: paytmAndroid,
    },
  };
}

/**
 * Generate a scannable QR Code Data URL from a UPI payment URI
 */
export async function generateUpiQrDataUrl(upiUri, options = {}) {
  if (!upiUri) return null;
  try {
    return await QRCode.toDataURL(upiUri, {
      width: 200,
      margin: 1,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
      ...options,
    });
  } catch (err) {
    console.error('Failed to generate UPI QR data URL:', err);
    return null;
  }
}

/**
 * Clipboard helper with fallback
 */
export async function copyToClipboard(text) {
  if (!text) return false;
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch (_) {}

  try {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    return successful;
  } catch (_) {
    return false;
  }
}

/**
 * Universal UPI App Launcher
 * Safely handles:
 * 1. Native Capacitor Android/iOS apps via AppLauncher plugin
 * 2. Mobile web browsers (Android Chrome / iOS Safari)
 * 3. Desktop fallback without blocking
 */
export async function launchUpiApp({ url, fallbackUrl = null, appName = 'UPI App' }) {
  if (!url) return { success: false, reason: 'EMPTY_URL' };

  // 1. Native Capacitor platform (Android / iOS)
  if (typeof window !== 'undefined' && Capacitor && typeof Capacitor.isNativePlatform === 'function' && Capacitor.isNativePlatform()) {
    try {
      await AppLauncher.openUrl({ url });
      return { success: true, platform: 'native' };
    } catch (err) {
      console.warn(`AppLauncher failed for ${url}:`, err);
      // Fallback to generic UPI URI which triggers Android's system UPI app chooser
      if (fallbackUrl && fallbackUrl !== url) {
        try {
          await AppLauncher.openUrl({ url: fallbackUrl });
          return { success: true, platform: 'native_fallback' };
        } catch (fErr) {
          console.warn('AppLauncher generic fallback failed:', fErr);
        }
      }
      try {
        window.open(fallbackUrl || url, '_system');
        return { success: true, platform: 'native_system' };
      } catch (_) {}
    }
  }

  // 2. Web browser (Mobile or Desktop)
  try {
    const a = document.createElement('a');
    a.href = url;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    return { success: true, platform: 'web_anchor' };
  } catch (_) {
    try {
      window.location.href = url;
      return { success: true, platform: 'web_location' };
    } catch (_) {
      return { success: false, reason: 'TRIGGER_FAILED' };
    }
  }
}
