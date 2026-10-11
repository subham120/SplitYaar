import { describe, test, expect } from '@jest/globals';
import { calculateEqualSplit } from '../lib/split.js';
import { computeNetBalances, simplifyDebts } from '../lib/settlement.js';

describe('Validation and Edge Cases', () => {
  test('rejects splitting among zero members', () => {
    expect(() => calculateEqualSplit(500, [], 'payer')).toThrow('Cannot split among 0 members');
  });

  test('single member split has exact balance of zero', () => {
    const members = [{ _id: 'm1', name: 'Solo' }];
    const expenses = [{ _id: 'e1', amountPaise: 5000, paidByMemberId: 'm1' }];
    const shares = [{ expenseId: 'e1', memberId: 'm1', sharePaise: 5000 }];

    const balances = computeNetBalances(members, expenses, shares, []);
    expect(balances).toEqual([
      { memberId: 'm1', totalPaidPaise: 5000, totalOwedPaise: 5000, netBalancePaise: 0 },
    ]);

    const debts = simplifyDebts(balances);
    expect(debts).toEqual([]);
  });

  test('handles 7-person split with non-divisible paise without losing any paise', () => {
    const amount = 1000; // ₹10.00 split 7 ways: 142*7 = 994, remainder 6
    const memberIds = ['m1', 'm2', 'm3', 'm4', 'm5', 'm6', 'm7'];
    const result = calculateEqualSplit(amount, memberIds, 'm3');

    const total = result.reduce((sum, s) => sum + s.sharePaise, 0);
    expect(total).toBe(1000);

    // Payer m3 gets remainder
    const payerShare = result.find((s) => s.memberId === 'm3');
    expect(payerShare.sharePaise).toBe(142 + 6); // 148 paise
  });

  test('settlement adjusts balances to zero in multi-step settlement', () => {
    const members = [
      { _id: 'm1', name: 'Alice' },
      { _id: 'm2', name: 'Bob' },
    ];
    // Alice paid ₹100 split equally
    const expenses = [{ _id: 'e1', amountPaise: 10000, paidByMemberId: 'm1' }];
    const shares = [
      { expenseId: 'e1', memberId: 'm1', sharePaise: 5000 },
      { expenseId: 'e1', memberId: 'm2', sharePaise: 5000 },
    ];
    // Bob pays Alice ₹50
    const settlements = [
      { _id: 's1', fromMemberId: 'm2', toMemberId: 'm1', amountPaise: 5000 },
    ];

    const balances = computeNetBalances(members, expenses, shares, settlements);
    expect(balances[0].netBalancePaise).toBe(0);
    expect(balances[1].netBalancePaise).toBe(0);

    const debts = simplifyDebts(balances);
    expect(debts).toHaveLength(0);
  });

  test('net balance sum across all group members is always strictly zero', () => {
    const members = [
      { _id: 'a', name: 'A' },
      { _id: 'b', name: 'B' },
      { _id: 'c', name: 'C' },
      { _id: 'd', name: 'D' },
    ];
    const expenses = [
      { _id: 'e1', amountPaise: 3500, paidByMemberId: 'a' },
      { _id: 'e2', amountPaise: 1200, paidByMemberId: 'b' },
    ];
    const shares = [
      ...calculateEqualSplit(3500, ['a', 'b', 'c', 'd'], 'a').map((s) => ({ expenseId: 'e1', ...s })),
      ...calculateEqualSplit(1200, ['b', 'c'], 'b').map((s) => ({ expenseId: 'e2', ...s })),
    ];
    const settlements = [
      { _id: 's1', fromMemberId: 'c', toMemberId: 'a', amountPaise: 500 },
    ];

    const balances = computeNetBalances(members, expenses, shares, settlements);
    const sum = balances.reduce((acc, b) => acc + b.netBalancePaise, 0);
    expect(sum).toBe(0);
  });
});
