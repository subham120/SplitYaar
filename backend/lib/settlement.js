/**
 * Net Balance Computation & Min-Cash-Flow Debt Simplification
 * All monetary values in integer paise (₹1 = 100 paise).
 */

/**
 * Calculates net balances for all members, factoring in expenses and debt settlements.
 * @param {Array} members - Array of member documents
 * @param {Array} expenses - Array of expense documents
 * @param {Array} shares - Array of expense share documents
 * @param {Array} settlements - Array of settlement documents
 * @returns {Array} Array of { memberId, totalPaidPaise, totalOwedPaise, netBalancePaise }
 */
export function computeNetBalances(members, expenses, shares, settlements = []) {
  const balances = {};

  members.forEach((m) => {
    balances[m._id.toString()] = { totalPaidPaise: 0, totalOwedPaise: 0, netAdjustmentPaise: 0 };
  });

  expenses.forEach((exp) => {
    const pId = exp.paidByMemberId.toString();
    if (balances[pId]) balances[pId].totalPaidPaise += exp.amountPaise;
  });

  shares.forEach((s) => {
    const mId = s.memberId.toString();
    if (balances[mId]) balances[mId].totalOwedPaise += s.sharePaise;
  });

  // Factor in settlements (debt repayments)
  settlements.forEach((s) => {
    const fromId = s.fromMemberId.toString();
    const toId = s.toMemberId.toString();
    if (balances[fromId]) balances[fromId].netAdjustmentPaise += s.amountPaise;
    if (balances[toId]) balances[toId].netAdjustmentPaise -= s.amountPaise;
  });

  return members.map((m) => {
    const id = m._id.toString();
    const { totalPaidPaise, totalOwedPaise, netAdjustmentPaise } = balances[id];
    return {
      memberId: id,
      totalPaidPaise,
      totalOwedPaise,
      netBalancePaise: (totalPaidPaise - totalOwedPaise) + netAdjustmentPaise,
    };
  });
}

/**
 * Greedy algorithm that minimizes the number of P2P payments needed to settle all debts.
 * @param {Array} balances - Output of computeNetBalances()
 * @returns {Array} Array of { fromMemberId, toMemberId, amountPaise }
 */
export function simplifyDebts(balances) {
  const debtors = balances
    .filter((b) => b.netBalancePaise < 0)
    .map((b) => ({ memberId: b.memberId, amount: -b.netBalancePaise }));

  const creditors = balances
    .filter((b) => b.netBalancePaise > 0)
    .map((b) => ({ memberId: b.memberId, amount: b.netBalancePaise }));

  const transactions = [];

  while (debtors.length > 0 && creditors.length > 0) {
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

    if (debtor.amount === 0) debtors.shift();
    if (creditor.amount === 0) creditors.shift();
  }

  return transactions;
}
