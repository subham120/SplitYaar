import QRCode from 'qrcode';

/**
 * Builds a NPCI-compliant UPI deep-link URI.
 * @param {string} payeeVpa - Payee's UPI VPA (e.g. "name@upi")
 * @param {string} payeeName - Display name of the payee
 * @param {number} amountPaise - Amount in paise
 * @param {string} note - Transaction note
 * @returns {string} UPI URI string
 */
export function buildUpiLink(payeeVpa, payeeName, amountPaise, note) {
  const pa = encodeURIComponent(payeeVpa.trim());
  const pn = encodeURIComponent(payeeName.trim());
  const am = (amountPaise / 100).toFixed(2);
  const tn = encodeURIComponent(note.trim());
  return `upi://pay?pa=${pa}&pn=${pn}&am=${am}&cu=INR&tn=${tn}`;
}

/**
 * Generates a base64 data URL for a QR code.
 * @param {string} text - Text to encode
 * @returns {Promise<string>} Base64 data URL
 */
export async function generateQrCodeDataUrl(text) {
  return await QRCode.toDataURL(text, {
    margin: 2,
    width: 320,
    color: { dark: '#1d1d1f', light: '#ffffff' },
  });
}
