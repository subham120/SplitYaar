const BASE_URL = 'http://localhost:4321';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion Failed: ${message}`);
  }
  console.log(`[PASS] ${message}`);
}

async function runApiTests() {
  console.log('--- STARTING ENDPOINT API TESTS ---');

  // Step 1: Check if server is running
  try {
    const rootRes = await fetch(BASE_URL);
    if (!rootRes.ok && rootRes.status >= 500) {
      throw new Error();
    }
  } catch (e) {
    console.error(`\n[ERROR] Astro dev server is not running on ${BASE_URL}.`);
    console.error('Please run `npm run dev` or `astro dev --background` in a separate terminal before running this test.\n');
    process.exit(1);
  }

  // Helper for requests
  const req = async (path: string, method = 'GET', body: any = null) => {
    const url = `${BASE_URL}${path}`;
    const options: RequestInit = {
      method,
      headers: { 'Content-Type': 'application/json' },
    };
    if (body) {
      options.body = JSON.stringify(body);
    }
    const res = await fetch(url, options);
    const isJson = res.headers.get('content-type')?.includes('application/json');
    const data = isJson ? await res.json() : await res.text();
    return { status: res.status, data };
  };

  // Step 2: Create Trip (POST /api/trips)
  console.log('Testing: POST /api/trips');
  const createTripRes = await req('/api/trips', 'POST', {
    name: 'Goa 2026',
    creatorName: 'Aman',
  });
  assert(createTripRes.status === 200, 'Create trip status should be 200');
  const trip = createTripRes.data.trip;
  assert(!!trip.id && !!trip.code, 'Trip should have id and shareable code');
  const tripId = trip.id;
  const tripCode = trip.code;
  console.log(`Created Trip: ${trip.name} with Code: ${tripCode}`);

  // Step 3: Fetch Trip by Code (GET /api/trips/[id])
  console.log(`Testing: GET /api/trips/${tripCode}`);
  const getTripRes = await req(`/api/trips/${tripCode}`);
  assert(getTripRes.status === 200, 'Get trip status should be 200');
  assert(getTripRes.data.trip.id === tripId, 'Returned trip ID should match');
  assert(getTripRes.data.members.length === 1, 'Trip should have exactly 1 member (creator)');
  const amanId = getTripRes.data.members[0].id;
  assert(getTripRes.data.members[0].name === 'Aman', 'Creator name should be Aman');

  // Step 4: Add Member Priya (POST /api/trips/[id]/members)
  console.log('Testing: POST /api/trips/[id]/members (Priya)');
  const addPriyaRes = await req(`/api/trips/${tripId}/members`, 'POST', { name: 'Priya' });
  assert(addPriyaRes.status === 200, 'Add Priya status should be 200');
  const priyaId = addPriyaRes.data.member.id;
  assert(addPriyaRes.data.member.name === 'Priya', 'Member name should be Priya');

  // Step 5: Add Member Rahul (POST /api/trips/[id]/members)
  console.log('Testing: POST /api/trips/[id]/members (Rahul)');
  const addRahulRes = await req(`/api/trips/${tripId}/members`, 'POST', { name: 'Rahul' });
  assert(addRahulRes.status === 200, 'Add Rahul status should be 200');
  const rahulId = addRahulRes.data.member.id;

  // Step 6: Add Member Sneha (POST /api/trips/[id]/members)
  console.log('Testing: POST /api/trips/[id]/members (Sneha)');
  const addSnehaRes = await req(`/api/trips/${tripId}/members`, 'POST', { name: 'Sneha' });
  assert(addSnehaRes.status === 200, 'Add Sneha status should be 200');
  const snehaId = addSnehaRes.data.member.id;

  // Step 7: Update UPI VPA Priya (POST /api/trips/[id]/members/[memberId]/upi)
  console.log('Testing: POST /api/trips/[id]/members/[memberId]/upi (Valid VPA)');
  const updateUpiRes = await req(`/api/trips/${tripId}/members/${priyaId}/upi`, 'POST', {
    upiId: 'priya@okicici',
  });
  assert(updateUpiRes.status === 200, 'Update UPI status should be 200');
  assert(updateUpiRes.data.member.upiId === 'priya@okicici', 'UPI ID should be saved');

  // Step 8: Update UPI VPA with invalid format
  console.log('Testing: POST /api/trips/[id]/members/[memberId]/upi (Invalid VPA)');
  const updateInvalidUpiRes = await req(`/api/trips/${tripId}/members/${priyaId}/upi`, 'POST', {
    upiId: 'invalid_vpa_no_symbol',
  });
  assert(updateInvalidUpiRes.status === 400, 'Update invalid UPI should return 400 Bad Request');
  assert(!!updateInvalidUpiRes.data.error, 'Should contain error message');

  // Step 9: Add Expense 1 - Cab (POST /api/trips/[id]/expenses)
  // Aman pays 1200, split equally among Aman, Priya, Rahul
  console.log('Testing: POST /api/trips/[id]/expenses (Expense 1 - Cab)');
  const addExp1Res = await req(`/api/trips/${tripId}/expenses`, 'POST', {
    description: 'Cab fare',
    amountPaise: 1200,
    paidByMemberId: amanId,
    category: 'travel',
    splitType: 'equal_all',
    date: '2026-07-14',
    shares: [
      { memberId: amanId, sharePaise: 400 },
      { memberId: priyaId, sharePaise: 400 },
      { memberId: rahulId, sharePaise: 400 },
    ],
  });
  assert(addExp1Res.status === 200, 'Add expense 1 status should be 200');
  const cabExpId = addExp1Res.data.expense.id;

  // Step 10: Add Expense 2 - Snacks (POST /api/trips/[id]/expenses)
  // Priya pays 900, split equally among Priya, Rahul, Sneha
  console.log('Testing: POST /api/trips/[id]/expenses (Expense 2 - Snacks)');
  const addExp2Res = await req(`/api/trips/${tripId}/expenses`, 'POST', {
    description: 'Evening snacks',
    amountPaise: 900,
    paidByMemberId: priyaId,
    category: 'food',
    splitType: 'equal_all',
    date: '2026-07-14',
    shares: [
      { memberId: priyaId, sharePaise: 300 },
      { memberId: rahulId, sharePaise: 300 },
      { memberId: snehaId, sharePaise: 300 },
    ],
  });
  assert(addExp2Res.status === 200, 'Add expense 2 status should be 200');
  const snacksExpId = addExp2Res.data.expense.id;

  // Step 11: Validate balances via GET /api/trips/[id]
  console.log('Testing: GET /api/trips/[id] (Validate net balances)');
  const checkBalRes = await req(`/api/trips/${tripId}`);
  assert(checkBalRes.status === 200, 'Get trip by ID status should be 200');
  const bals = checkBalRes.data.netBalances;
  
  const netAman = bals.find((b: any) => b.memberId === amanId).netBalancePaise;
  const netPriya = bals.find((b: any) => b.memberId === priyaId).netBalancePaise;
  const netRahul = bals.find((b: any) => b.memberId === rahulId).netBalancePaise;
  const netSneha = bals.find((b: any) => b.memberId === snehaId).netBalancePaise;

  assert(netAman === 800, 'Aman balance should be +800');
  assert(netPriya === 200, 'Priya balance should be +200');
  assert(netRahul === -700, 'Rahul balance should be -700');
  assert(netSneha === -300, 'Sneha balance should be -300');

  // Step 12: Validate Settlement (GET /api/trips/[id]/settlement)
  console.log('Testing: GET /api/trips/[id]/settlement');
  const settleRes = await req(`/api/trips/${tripId}/settlement`);
  assert(settleRes.status === 200, 'Get settlement status should be 200');
  const txs = settleRes.data.transactions;
  assert(txs.length === 3, 'Should generate exactly 3 settlement transactions');
  
  const txRahulAman = txs.find((t: any) => t.fromMemberId === rahulId && t.toMemberId === amanId);
  const txSnehaPriya = txs.find((t: any) => t.fromMemberId === snehaId && t.toMemberId === priyaId);
  const txSnehaAman = txs.find((t: any) => t.fromMemberId === snehaId && t.toMemberId === amanId);

  assert(txRahulAman.amountPaise === 700, 'Rahul to Aman should be 700');
  assert(txSnehaPriya.amountPaise === 200, 'Sneha to Priya should be 200');
  assert(txSnehaAman.amountPaise === 100, 'Sneha to Aman should be 100');

  // Step 13: Try deleting a member with a non-zero balance
  console.log('Testing: DELETE /api/trips/[id]/members/[memberId] (Expect block 400)');
  const delBlockedRes = await req(`/api/trips/${tripId}/members/${snehaId}`, 'DELETE');
  assert(delBlockedRes.status === 400, 'Should block deleting Sneha with -300 balance');
  assert(delBlockedRes.data.error.includes('non-zero balance'), 'Should output balance error');

  // Step 14: Delete expenses to restore 0 balances (DELETE /api/trips/[id]/expenses/[expenseId])
  console.log('Testing: DELETE /api/trips/[id]/expenses/[expenseId] (Delete both)');
  const delExp2 = await req(`/api/trips/${tripId}/expenses/${snacksExpId}`, 'DELETE');
  assert(delExp2.status === 200, 'Delete expense 2 status should be 200');
  
  const delExp1 = await req(`/api/trips/${tripId}/expenses/${cabExpId}`, 'DELETE');
  assert(delExp1.status === 200, 'Delete expense 1 status should be 200');

  // Step 15: Verify balances are zero
  const checkBalZeroRes = await req(`/api/trips/${tripId}`);
  const netSnehaZero = checkBalZeroRes.data.netBalances.find((b: any) => b.memberId === snehaId).netBalancePaise;
  assert(netSnehaZero === 0, 'Sneha balance should return to 0');

  // Step 16: Delete Sneha (DELETE /api/trips/[id]/members/[memberId])
  console.log('Testing: DELETE /api/trips/[id]/members/[memberId] (Success 200)');
  const delSuccessRes = await req(`/api/trips/${tripId}/members/${snehaId}`, 'DELETE');
  assert(delSuccessRes.status === 200, 'Should succeed deleting Sneha with 0 balance');

  // Verify member count is now 3
  const finalCheckRes = await req(`/api/trips/${tripId}`);
  assert(finalCheckRes.data.members.length === 3, 'Trip should have 3 members remaining');

  console.log('--- ALL API ENDPOINT TESTS PASSED SUCCESSFULLY ---');
}

runApiTests().catch((err) => {
  console.error('[FAIL] API endpoint test execution encountered an error:', err);
  process.exit(1);
});
