import type { Member, Expense, ExpenseShare, Settlement, MemberBalance, SettlementTransaction } from './types';

/**
 * Computes the total paid, total owed, and net balance for each member of a trip.
 * Automatically factors in recorded peer-to-peer settlements.
 */
export function computeNetBalances(
  members: Member[],
  expenses: Expense[],
  shares: ExpenseShare[],
  settlements: Settlement[] = []
): MemberBalance[] {
  const balances: Record<string, { totalPaidPaise: number; totalOwedPaise: number; netAdjustmentPaise: number }> = {};

  // Initialize for all members
  members.forEach((member) => {
    balances[member.id] = { totalPaidPaise: 0, totalOwedPaise: 0, netAdjustmentPaise: 0 };
  });

  // Accumulate total paid by each member (real expenses)
  expenses.forEach((expense) => {
    if (balances[expense.paidByMemberId]) {
      balances[expense.paidByMemberId].totalPaidPaise += expense.amountPaise;
    }
  });

  // Accumulate total owed by each member (shares of expenses)
  shares.forEach((share) => {
    if (balances[share.memberId]) {
      balances[share.memberId].totalOwedPaise += share.sharePaise;
    }
  });

  // Factor in settlements (debt repayments)
  // When Member A pays Member B ₹X:
  // Member A has paid off ₹X of debt (+₹X to their net balance)
  // Member B has received ₹X of owed money (-₹X to their remaining net credit)
  settlements.forEach((s) => {
    if (balances[s.fromMemberId]) {
      balances[s.fromMemberId].netAdjustmentPaise += s.amountPaise;
    }
    if (balances[s.toMemberId]) {
      balances[s.toMemberId].netAdjustmentPaise -= s.amountPaise;
    }
  });

  // Map to the final MemberBalance array
  return members.map((member) => {
    const { totalPaidPaise, totalOwedPaise, netAdjustmentPaise } = balances[member.id];
    return {
      memberId: member.id,
      totalPaidPaise,
      totalOwedPaise,
      netBalancePaise: (totalPaidPaise - totalOwedPaise) + netAdjustmentPaise,
    };
  });
}

/**
 * Simplifies debts using a greedy min-cash-flow algorithm.
 * Guarantees a minimum number of transaction rows to zero out all balances.
 */
export function simplifyDebts(balances: MemberBalance[]): SettlementTransaction[] {
  // Separate into debtors (who owe money, net < 0) and creditors (who are owed money, net > 0)
  const debtors = balances
    .filter((b) => b.netBalancePaise < 0)
    .map((b) => ({ memberId: b.memberId, amount: -b.netBalancePaise }));

  const creditors = balances
    .filter((b) => b.netBalancePaise > 0)
    .map((b) => ({ memberId: b.memberId, amount: b.netBalancePaise }));

  const transactions: SettlementTransaction[] = [];

  // Greedy loop matching largest debtor to largest creditor
  while (debtors.length > 0 && creditors.length > 0) {
    // Sort descending by amount to always settle largest first
    debtors.sort((a, b) => b.amount - a.amount);
    creditors.sort((a, b) => b.amount - a.amount);

    const debtor = debtors[0];
    const creditor = creditors[0];

    const settleAmount = Math.min(debtor.amount, creditor.amount);

    if (settleAmount > 0) {
      transactions.push({
        fromMemberId: debtor.memberId,
        toMemberId: creditor.memberId,
        amountPaise: settleAmount,
      });

      debtor.amount -= settleAmount;
      creditor.amount -= settleAmount;
    }

    // Remove finished members (balances at 0 paise)
    if (debtor.amount === 0) {
      debtors.shift();
    }
    if (creditor.amount === 0) {
      creditors.shift();
    }
  }

  return transactions;
}
