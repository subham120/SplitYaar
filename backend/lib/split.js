/**
 * Remainder-safe split calculation.
 * All monetary values in integer paise (₹1 = 100 paise).
 */

/**
 * Splits an amount equally among the given members.
 * Remainder paise are assigned to the payer (if included), else the first member.
 * @param {number} amountPaise - Total amount in paise
 * @param {string[]} memberIds - Array of member ID strings to split among
 * @param {string} payerId - ID of the member who paid
 * @returns {Array} Array of { memberId, sharePaise }
 */
export function calculateEqualSplit(amountPaise, memberIds, payerId) {
  if (!memberIds.length) throw new Error('Cannot split among 0 members');

  const baseShare = Math.floor(amountPaise / memberIds.length);
  const remainder = amountPaise - (baseShare * memberIds.length);

  const shares = memberIds.map((memberId) => ({
    memberId,
    sharePaise: baseShare,
  }));

  // Assign remainder paise to payer if included, else first member
  if (remainder > 0) {
    const payerIdx = memberIds.indexOf(payerId);
    if (payerIdx !== -1) {
      shares[payerIdx].sharePaise += remainder;
    } else {
      shares[0].sharePaise += remainder;
    }
  }

  return shares;
}
