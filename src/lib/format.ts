/**
 * Formats a paise integer into Indian Rupee (₹) format with Indian digit grouping (e.g., ₹1,25,000).
 * If the amount ends in complete rupees, it hides the decimal paise part for layout elegance.
 */
export function formatINR(paise: number): string {
  const rupees = paise / 100;
  
  // Format with dynamic decimals: hide .00 if there are no paise
  const formatter = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: paise % 100 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  });

  return formatter.format(rupees);
}

/**
 * Parses a YYYY-MM-DD ISO date string and formats it cleanly for Indian users (e.g., "14 Jul 2026").
 * Uses local construction to avoid timezone shifts common with UTC string parsing.
 */
export function formatISTDate(dateStr: string): string {
  const parts = dateStr.split('-');
  if (parts.length !== 3) {
    return dateStr;
  }
  
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1; // JS Date month is 0-indexed
  const day = parseInt(parts[2], 10);

  if (isNaN(year) || isNaN(month) || isNaN(day)) {
    return dateStr;
  }

  const date = new Date(year, month, day);
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Returns today's calendar date formatted as YYYY-MM-DD in Indian Standard Time (UTC+05:30).
 * Prevents midnight timezone rollover bugs.
 */
export function getTodayISTDate(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}
