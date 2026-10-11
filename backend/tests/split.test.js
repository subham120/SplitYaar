import { describe, test, expect } from '@jest/globals';
import { calculateEqualSplit } from '../lib/split.js';

describe('calculateEqualSplit', () => {
  test('splits evenly when divisible', () => {
    const result = calculateEqualSplit(3000, ['a', 'b', 'c'], 'a');
    expect(result).toEqual([
      { memberId: 'a', sharePaise: 1000 },
      { memberId: 'b', sharePaise: 1000 },
      { memberId: 'c', sharePaise: 1000 },
    ]);
  });

  test('assigns remainder to payer', () => {
    const result = calculateEqualSplit(1000, ['a', 'b', 'c'], 'b');
    // 1000 / 3 = 333 base, remainder 1
    expect(result).toEqual([
      { memberId: 'a', sharePaise: 333 },
      { memberId: 'b', sharePaise: 334 }, // payer gets +1
      { memberId: 'c', sharePaise: 333 },
    ]);
    // Verify total
    const total = result.reduce((sum, s) => sum + s.sharePaise, 0);
    expect(total).toBe(1000);
  });

  test('assigns remainder to first member when payer not included', () => {
    const result = calculateEqualSplit(100, ['x', 'y', 'z'], 'other');
    // 100 / 3 = 33 base, remainder 1
    expect(result[0].sharePaise).toBe(34);
    expect(result[1].sharePaise).toBe(33);
    expect(result[2].sharePaise).toBe(33);
  });

  test('single member gets full amount', () => {
    const result = calculateEqualSplit(5000, ['solo'], 'solo');
    expect(result).toEqual([{ memberId: 'solo', sharePaise: 5000 }]);
  });

  test('throws for 0 members', () => {
    expect(() => calculateEqualSplit(1000, [], 'a')).toThrow('Cannot split among 0 members');
  });

  test('handles large amounts correctly', () => {
    const amount = 999999; // ₹9,999.99
    const members = ['a', 'b', 'c', 'd', 'e', 'f', 'g'];
    const result = calculateEqualSplit(amount, members, 'a');
    const total = result.reduce((sum, s) => sum + s.sharePaise, 0);
    expect(total).toBe(amount);
  });

  test('handles 1 paisa split', () => {
    const result = calculateEqualSplit(1, ['a', 'b'], 'a');
    // 1 / 2 = 0 base, remainder 1
    expect(result[0].sharePaise).toBe(1); // payer gets remainder
    expect(result[1].sharePaise).toBe(0);
  });
});
