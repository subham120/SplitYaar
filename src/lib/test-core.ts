import { calculateEqualSplit, validateCustomSplit } from './split';
import { computeNetBalances, simplifyDebts } from './settlement';
import { buildUpiLink } from './upi';
import type { Member, Expense, ExpenseShare } from './types';

// Helper assertion function
function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion Failed: ${message}`);
  }
  console.log(`[PASS] ${message}`);
}

async function runTests() {
  console.log('--- STARTING CORE LOGIC TESTS ---');

  // Test Case 1: Equal split with non-divisible amounts (e.g., ₹100 split 3 ways)
  // Total: 100 paise (₹1). Members: A, B, C. Payer: A.
  const shares1 = calculateEqualSplit(100, ['A', 'B', 'C'], 'A');
  assert(shares1.length === 3, 'Split length should be 3');
  
  const shareA = shares1.find(s => s.memberId === 'A');
  const shareB = shares1.find(s => s.memberId === 'B');
  const shareC = shares1.find(s => s.memberId === 'C');
  
  assert(!!shareA && !!shareB && !!shareC, 'All members must have a share');
  assert(shareA!.sharePaise === 34, 'Payer A should receive the 1 paisa remainder (34 paise)');
  assert(shareB!.sharePaise === 33, 'Member B should receive base share (33 paise)');
  assert(shareC!.sharePaise === 33, 'Member C should receive base share (33 paise)');
  
  const sum1 = shares1.reduce((sum, s) => sum + s.sharePaise, 0);
  assert(sum1 === 100, 'Sum of shares must equal exactly 100 paise');

  // Test Case 2: Custom split validation
  const validCustom = validateCustomSplit(1000, [
    { memberId: 'A', sharePaise: 400 },
    { memberId: 'B', sharePaise: 600 }
  ]);
  assert(validCustom.isValid === true, 'Custom split summing to total must be valid');

  const invalidCustom = validateCustomSplit(1000, [
    { memberId: 'A', sharePaise: 350 },
    { memberId: 'B', sharePaise: 600 }
  ]);
  assert(invalidCustom.isValid === false, 'Custom split not summing to total must be invalid');
  assert(invalidCustom.differencePaise === 50, 'Custom split difference should be 50 paise');

  // Test Case 3: Balances and Settlement Simplification
  // Trip details: 4 members: Aman, Priya, Rahul, Sneha
  const members: Member[] = [
    { id: 'aman', tripId: 't1', name: 'Aman', upiId: null, joinedAt: '' },
    { id: 'priya', tripId: 't1', name: 'Priya', upiId: null, joinedAt: '' },
    { id: 'rahul', tripId: 't1', name: 'Rahul', upiId: null, joinedAt: '' },
    { id: 'sneha', tripId: 't1', name: 'Sneha', upiId: null, joinedAt: '' }
  ];

  // Expense 1: Aman pays 1200 paise, split equally among Aman, Priya, Rahul
  const exp1: Expense = {
    id: 'e1',
    tripId: 't1',
    description: 'Cab',
    amountPaise: 1200,
    paidByMemberId: 'aman',
    category: 'travel',
    splitType: 'equal_all',
    date: '2026-07-14',
    createdAt: '',
    updatedAt: ''
  };
  const expShares1: ExpenseShare[] = [
    { id: 's1', expenseId: 'e1', memberId: 'aman', sharePaise: 400 },
    { id: 's2', expenseId: 'e1', memberId: 'priya', sharePaise: 400 },
    { id: 's3', expenseId: 'e1', memberId: 'rahul', sharePaise: 400 }
  ];

  // Expense 2: Priya pays 900 paise, split equally among Priya, Rahul, Sneha
  const exp2: Expense = {
    id: 'e2',
    tripId: 't1',
    description: 'Snacks',
    amountPaise: 900,
    paidByMemberId: 'priya',
    category: 'food',
    splitType: 'equal_all',
    date: '2026-07-14',
    createdAt: '',
    updatedAt: ''
  };
  const expShares2: ExpenseShare[] = [
    { id: 's4', expenseId: 'e2', memberId: 'priya', sharePaise: 300 },
    { id: 's5', expenseId: 'e2', memberId: 'rahul', sharePaise: 300 },
    { id: 's6', expenseId: 'e2', memberId: 'sneha', sharePaise: 300 }
  ];

  const expenses = [exp1, exp2];
  const allShares = [...expShares1, ...expShares2];

  const balances = computeNetBalances(members, expenses, allShares);

  // Expected Balances:
  // Aman: paid 1200, owed 400. Net: +800 paise
  // Priya: paid 900, owed 700. Net: +200 paise
  // Rahul: paid 0, owed 700. Net: -700 paise
  // Sneha: paid 0, owed 300. Net: -300 paise
  const balAman = balances.find(b => b.memberId === 'aman')!;
  const balPriya = balances.find(b => b.memberId === 'priya')!;
  const balRahul = balances.find(b => b.memberId === 'rahul')!;
  const balSneha = balances.find(b => b.memberId === 'sneha')!;

  assert(balAman.netBalancePaise === 800, 'Aman net balance should be +800 paise');
  assert(balPriya.netBalancePaise === 200, 'Priya net balance should be +200 paise');
  assert(balRahul.netBalancePaise === -700, 'Rahul net balance should be -700 paise');
  assert(balSneha.netBalancePaise === -300, 'Sneha net balance should be -300 paise');

  const transactions = simplifyDebts(balances);
  
  // Greedy settlement yields:
  // Sort debtors: Rahul (700), Sneha (300)
  // Sort creditors: Aman (800), Priya (200)
  // 1. Rahul pays Aman 700 paise (Aman has 100 left, Rahul is done)
  // 2. Sneha pays Priya 200 paise (Priya is done, Sneha has 100 left)
  // 3. Sneha pays Aman 100 paise (Both done)
  assert(transactions.length === 3, 'Greedy solver should yield exactly 3 transactions');
  
  const tx1 = transactions.find(t => t.fromMemberId === 'rahul' && t.toMemberId === 'aman');
  const tx2 = transactions.find(t => t.fromMemberId === 'sneha' && t.toMemberId === 'priya');
  const tx3 = transactions.find(t => t.fromMemberId === 'sneha' && t.toMemberId === 'aman');

  assert(!!tx1 && tx1.amountPaise === 700, 'Transaction 1: Rahul pays Aman 700 paise');
  assert(!!tx2 && tx2.amountPaise === 200, 'Transaction 2: Sneha pays Priya 200 paise');
  assert(!!tx3 && tx3.amountPaise === 100, 'Transaction 3: Sneha pays Aman 100 paise');

  const sumNetZero = balances.reduce((sum, b) => sum + b.netBalancePaise, 0);
  assert(sumNetZero === 0, 'Sum of all net balances must be exactly 0 paise');

  // Test Case 4: UPI Link Generation
  const upiLink = buildUpiLink('aman@upi', 'Aman Sharma', 125050, 'Goa Trip 2026');
  assert(
    upiLink === 'upi://pay?pa=aman%40upi&pn=Aman%20Sharma&am=1250.50&cu=INR&tn=Goa%20Trip%202026',
    'UPI link should format and encode correctly'
  );

  console.log('--- ALL CORE LOGIC TESTS PASSED ---');
}

runTests().catch(err => {
  console.error('[FAIL] Test execution encountered an error:', err);
  process.exit(1);
});
