import QRCode from 'qrcode';

/**
 * Builds an NPCI compliant UPI payment URI scheme link.
 * Format: upi://pay?pa=<vpa>&pn=<name>&am=<amount>&cu=INR&tn=<note>
 */
export function buildUpiLink(
  payeeVpa: string,
  payeeName: string,
  amountPaise: number,
  note: string
): string {
  const pa = encodeURIComponent(payeeVpa.trim());
  const pn = encodeURIComponent(payeeName.trim());
  const am = (amountPaise / 100).toFixed(2); // Convert to decimal rupees, e.g. "1250.00"
  const tn = encodeURIComponent(note.trim());
  
  return `upi://pay?pa=${pa}&pn=${pn}&am=${am}&cu=INR&tn=${tn}`;
}

/**
 * Generates a base64 Data URL (PNG) representing a QR Code of any link or text
 * for screens/scanning.
 */
export async function generateQrCodeDataUrl(text: string): Promise<string> {
  try {
    const dataUrl = await QRCode.toDataURL(text, {
      margin: 2,
      width: 320,
      color: {
        dark: '#1d1d1f', // Match Apple design "ink" color
        light: '#ffffff',
      },
    });
    return dataUrl;
  } catch (error) {
    console.error('Failed to generate QR code:', error);
    throw new Error('QR Code generation failed');
  }
}
