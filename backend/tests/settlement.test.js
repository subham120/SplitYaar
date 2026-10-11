import { describe, test, expect } from '@jest/globals';
import { computeNetBalances, simplifyDebts } from '../lib/settlement.js';

// Helper to create mock member objects
const member = (id) => ({ _id: { toString: () => id } });

describe('computeNetBalances', () => {
  test('basic 2-person split', () => {
    const members = [member('a'), member('b')];
    const expenses = [
      { paidByMemberId: { toString: () => 'a' }, amountPaise: 1000 },
    ];
    const shares = [
      { memberId: { toString: () => 'a' }, sharePaise: 500 },
      { memberId: { toString: () => 'b' }, sharePaise: 500 },
    ];

    const result = computeNetBalances(members, expenses, shares);
    const balA = result.find((b) => b.memberId === 'a');
    const balB = result.find((b) => b.memberId === 'b');

    expect(balA.netBalancePaise).toBe(500);  // paid 1000, owes 500 → net +500
    expect(balB.netBalancePaise).toBe(-500); // paid 0, owes 500 → net -500
  });

  test('3-person with multiple expenses', () => {
    const members = [member('a'), member('b'), member('c')];
    const expenses = [
      { paidByMemberId: { toString: () => 'a' }, amountPaise: 900 },
      { paidByMemberId: { toString: () => 'b' }, amountPaise: 300 },
    ];
    const shares = [
      { memberId: { toString: () => 'a' }, sharePaise: 300 },
      { memberId: { toString: () => 'b' }, sharePaise: 300 },
      { memberId: { toString: () => 'c' }, sharePaise: 300 },
      { memberId: { toString: () => 'a' }, sharePaise: 100 },
      { memberId: { toString: () => 'b' }, sharePaise: 100 },
      { memberId: { toString: () => 'c' }, sharePaise: 100 },
    ];

    const result = computeNetBalances(members, expenses, shares);
    const balA = result.find((b) => b.memberId === 'a');
    const balB = result.find((b) => b.memberId === 'b');
    const balC = result.find((b) => b.memberId === 'c');

    // a: paid 900, owes 400 → +500
    expect(balA.netBalancePaise).toBe(500);
    // b: paid 300, owes 400 → -100
    expect(balB.netBalancePaise).toBe(-100);
    // c: paid 0, owes 400 → -400
    expect(balC.netBalancePaise).toBe(-400);

    // Total should be zero
    const total = result.reduce((sum, b) => sum + b.netBalancePaise, 0);
    expect(total).toBe(0);
  });

  test('factors in settlements', () => {
    const members = [member('a'), member('b')];
    const expenses = [
      { paidByMemberId: { toString: () => 'a' }, amountPaise: 1000 },
    ];
    const shares = [
      { memberId: { toString: () => 'a' }, sharePaise: 500 },
      { memberId: { toString: () => 'b' }, sharePaise: 500 },
    ];
    const settlements = [
      { fromMemberId: { toString: () => 'b' }, toMemberId: { toString: () => 'a' }, amountPaise: 200 },
    ];

    const result = computeNetBalances(members, expenses, shares, settlements);
    const balA = result.find((b) => b.memberId === 'a');
    const balB = result.find((b) => b.memberId === 'b');

    // a: +500 base, -200 received settlement → +300
    expect(balA.netBalancePaise).toBe(300);
    // b: -500 base, +200 paid settlement → -300
    expect(balB.netBalancePaise).toBe(-300);
  });

  test('all settled returns zeros', () => {
    const members = [member('a'), member('b')];
    const expenses = [
      { paidByMemberId: { toString: () => 'a' }, amountPaise: 1000 },
    ];
    const shares = [
      { memberId: { toString: () => 'a' }, sharePaise: 500 },
      { memberId: { toString: () => 'b' }, sharePaise: 500 },
    ];
    const settlements = [
      { fromMemberId: { toString: () => 'b' }, toMemberId: { toString: () => 'a' }, amountPaise: 500 },
    ];

    const result = computeNetBalances(members, expenses, shares, settlements);
    const balA = result.find((b) => b.memberId === 'a');
    const balB = result.find((b) => b.memberId === 'b');

    expect(balA.netBalancePaise).toBe(0);
    expect(balB.netBalancePaise).toBe(0);
  });
});

describe('simplifyDebts', () => {
  test('simple 2-person debt', () => {
    const balances = [
      { memberId: 'a', netBalancePaise: 500 },
      { memberId: 'b', netBalancePaise: -500 },
    ];

    const txns = simplifyDebts(balances);
    expect(txns).toHaveLength(1);
    expect(txns[0]).toEqual({
      fromMemberId: 'b',
      toMemberId: 'a',
      amountPaise: 500,
    });
  });

  test('3-person chain simplification', () => {
    const balances = [
      { memberId: 'a', netBalancePaise: 500 },
      { memberId: 'b', netBalancePaise: -100 },
      { memberId: 'c', netBalancePaise: -400 },
    ];

    const txns = simplifyDebts(balances);
    // Should produce at most 2 transactions
    expect(txns.length).toBeLessThanOrEqual(2);
    // Total paid should equal total owed
    const totalPaid = txns.reduce((s, t) => s + t.amountPaise, 0);
    expect(totalPaid).toBe(500);
  });

  test('all balanced returns empty', () => {
    const balances = [
      { memberId: 'a', netBalancePaise: 0 },
      { memberId: 'b', netBalancePaise: 0 },
    ];

    const txns = simplifyDebts(balances);
    expect(txns).toHaveLength(0);
  });

  test('complex 4-person scenario', () => {
    const balances = [
      { memberId: 'a', netBalancePaise: 1000 },
      { memberId: 'b', netBalancePaise: -300 },
      { memberId: 'c', netBalancePaise: -400 },
      { memberId: 'd', netBalancePaise: -300 },
    ];

    const txns = simplifyDebts(balances);
    // Total debits should equal total credits
    const totalDebits = txns.reduce((s, t) => s + t.amountPaise, 0);
    expect(totalDebits).toBe(1000);
    // Should minimize transactions (≤ 3 for 4 people)
    expect(txns.length).toBeLessThanOrEqual(3);
  });

  test('preserves integer paise (no floating point)', () => {
    const balances = [
      { memberId: 'a', netBalancePaise: 333 },
      { memberId: 'b', netBalancePaise: -333 },
    ];

    const txns = simplifyDebts(balances);
    txns.forEach((t) => {
      expect(Number.isInteger(t.amountPaise)).toBe(true);
    });
  });
});
