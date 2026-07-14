import type { ExpenseShare } from './types';

/**
 * Calculates equal splits for a given amount and a list of member IDs.
 * Leftover paise (remainder) are assigned to the payer if they are in the split,
 * otherwise to the first member in the split list, to prevent rounding drift.
 */
export function calculateEqualSplit(
  amountPaise: number,
  memberIds: string[],
  payerId: string
): Omit<ExpenseShare, 'id' | 'expenseId'>[] {
  if (memberIds.length === 0) {
    throw new Error('Cannot split an expense among zero members.');
  }

  const baseShare = Math.floor(amountPaise / memberIds.length);
  const remainder = amountPaise - (baseShare * memberIds.length);

  const shares = memberIds.map((memberId) => ({
    memberId,
    sharePaise: baseShare,
  }));

  // Distribute remainder
  if (remainder > 0) {
    // If the payer is part of the split, assign the remainder to them
    const payerIndex = memberIds.indexOf(payerId);
    if (payerIndex !== -1) {
      shares[payerIndex].sharePaise += remainder;
    } else {
      // Otherwise, assign to the first member in the split list
      shares[0].sharePaise += remainder;
    }
  }

  return shares;
}

/**
 * Validates a custom split. The sum of all shares must exactly equal the total amount.
 */
export function validateCustomSplit(
  amountPaise: number,
  shares: { memberId: string; sharePaise: number }[]
): { isValid: boolean; differencePaise: number } {
  const sumShares = shares.reduce((acc, curr) => acc + curr.sharePaise, 0);
  const differencePaise = amountPaise - sumShares;
  return {
    isValid: differencePaise === 0,
    differencePaise,
  };
}
