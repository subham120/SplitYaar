/**
 * Convert paise to rupee display string.
 * @param {number} paise - Amount in paise
 * @returns {string} Formatted currency string like "₹123.45"
 */
export function formatCurrency(paise) {
  const rupees = Math.abs(paise) / 100;
  return `₹${rupees.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Convert rupee string input to paise integer.
 * @param {string|number} rupees - Amount in rupees
 * @returns {number} Amount in paise
 */
export function rupeeToPaise(rupees) {
  if (rupees === null || rupees === undefined || rupees === '') return 0;
  const val = parseFloat(rupees);
  if (Number.isNaN(val) || !Number.isFinite(val)) return 0;
  return Math.max(0, Math.round(val * 100));
}

/**
 * Format date string to human-readable form.
 * @param {string} dateStr - ISO date or YYYY-MM-DD string
 * @returns {string} e.g. "21 Sep 2026"
 */
export function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = dateStr.includes('T') ? new Date(dateStr) : new Date(dateStr + 'T00:00:00');
  if (Number.isNaN(d.getTime())) return String(dateStr);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

/**
 * Get today's date as YYYY-MM-DD
 */
export function todayISO() {
  return new Date().toISOString().split('T')[0];
}

/**
 * Builds an NPCI-compliant UPI deep-link URI.
 * @param {string} payeeVpa - Payee's UPI VPA (e.g. "name@upi")
 * @param {string} payeeName - Display name of the payee
 * @param {number} amountPaise - Amount in paise
 * @param {string} note - Transaction note
 * @returns {string} UPI URI string
 */
export function buildUpiLink(payeeVpa, payeeName, amountPaise, note = 'SplitYaar settlement') {
  const pa = encodeURIComponent((payeeVpa || '').trim());
  const pn = encodeURIComponent((payeeName || '').trim());
  const am = (Math.max(0, amountPaise) / 100).toFixed(2);
  const tn = encodeURIComponent((note || '').trim());
  return `upi://pay?pa=${pa}&pn=${pn}&am=${am}&cu=INR&tn=${tn}`;
}

/**
 * Category definitions with labels, Lucide icon names, and colors.
 */
export const CATEGORIES = {
  food: { label: 'Food', iconName: 'Utensils', color: '#ff9500' },
  travel: { label: 'Travel', iconName: 'Plane', color: '#0066cc' },
  stay: { label: 'Stay', iconName: 'Hotel', color: '#5856d6' },
  sightseeing: { label: 'Sightseeing', iconName: 'Camera', color: '#34c759' },
  shopping: { label: 'Shopping', iconName: 'ShoppingBag', color: '#ff2d55' },
  alcohol: { label: 'Drinks', iconName: 'Beer', color: '#af52de' },
  misc: { label: 'Misc', iconName: 'Package', color: '#8e8e93' },
  groceries: { label: 'Groceries', iconName: 'ShoppingCart', color: '#30d158' },
  rent: { label: 'Rent', iconName: 'Home', color: '#007aff' },
  utilities: { label: 'Utilities', iconName: 'Zap', color: '#ffcc00' },
  maintenance: { label: 'Maintenance', iconName: 'Wrench', color: '#ff9f0a' },
  chai_snacks: { label: 'Chai & Snacks', iconName: 'Coffee', color: '#a0522d' },
  subscriptions: { label: 'Subscriptions', iconName: 'Tv', color: '#5ac8fa' },
};

/**
 * Group type definitions with Lucide icon names.
 */
export const GROUP_TYPES = {
  trip: { label: 'Trip', iconName: 'Luggage' },
  flatmates: { label: 'Flatmates', iconName: 'Home' },
  daily: { label: 'Daily', iconName: 'Sun' },
  couple: { label: 'Couple', iconName: 'Heart' },
  other: { label: 'Other', iconName: 'Folder' },
};
