import { neon } from "@neondatabase/serverless";
import crypto from "crypto";
//#region src/lib/split.ts
/**
* Validates a custom split. The sum of all shares must exactly equal the total amount.
*/
function validateCustomSplit(amountPaise, shares) {
	const differencePaise = amountPaise - shares.reduce((acc, curr) => acc + curr.sharePaise, 0);
	return {
		isValid: differencePaise === 0,
		differencePaise
	};
}
//#endregion
//#region src/lib/settlement.ts
/**
* Computes the total paid, total owed, and net balance for each member of a trip.
*/
function computeNetBalances(members, expenses, shares) {
	const balances = {};
	members.forEach((member) => {
		balances[member.id] = {
			totalPaidPaise: 0,
			totalOwedPaise: 0
		};
	});
	expenses.forEach((expense) => {
		if (balances[expense.paidByMemberId]) balances[expense.paidByMemberId].totalPaidPaise += expense.amountPaise;
	});
	shares.forEach((share) => {
		if (balances[share.memberId]) balances[share.memberId].totalOwedPaise += share.sharePaise;
	});
	return members.map((member) => {
		const { totalPaidPaise, totalOwedPaise } = balances[member.id];
		return {
			memberId: member.id,
			totalPaidPaise,
			totalOwedPaise,
			netBalancePaise: totalPaidPaise - totalOwedPaise
		};
	});
}
/**
* Simplifies debts using a greedy min-cash-flow algorithm.
* Guarantees a minimum number of transaction rows to zero out all balances.
*/
function simplifyDebts(balances) {
	const debtors = balances.filter((b) => b.netBalancePaise < 0).map((b) => ({
		memberId: b.memberId,
		amount: -b.netBalancePaise
	}));
	const creditors = balances.filter((b) => b.netBalancePaise > 0).map((b) => ({
		memberId: b.memberId,
		amount: b.netBalancePaise
	}));
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
				amountPaise: settleAmount
			});
			debtor.amount -= settleAmount;
			creditor.amount -= settleAmount;
		}
		if (debtor.amount === 0) debtors.shift();
		if (creditor.amount === 0) creditors.shift();
	}
	return transactions;
}
//#endregion
//#region src/lib/store.ts
function getDb() {
	const url = process.env.DATABASE_URL;
	if (!url) throw new Error("DATABASE_URL environment variable is not set. See .env.example for setup instructions.");
	return neon(url);
}
function rowToTrip(row) {
	return {
		id: row.id,
		code: row.code,
		name: row.name,
		createdAt: row.created_at.toISOString(),
		createdByMemberId: row.created_by_member_id,
		status: row.status
	};
}
function rowToMember(row) {
	return {
		id: row.id,
		tripId: row.trip_id,
		name: row.name,
		upiId: row.upi_id ?? null,
		joinedAt: row.joined_at.toISOString()
	};
}
function rowToExpense(row) {
	return {
		id: row.id,
		tripId: row.trip_id,
		description: row.description,
		amountPaise: row.amount_paise,
		paidByMemberId: row.paid_by_member_id,
		category: row.category,
		splitType: row.split_type,
		date: typeof row.date === "string" ? row.date : row.date.toISOString().slice(0, 10),
		createdAt: row.created_at.toISOString(),
		updatedAt: row.updated_at.toISOString()
	};
}
function rowToShare(row) {
	return {
		id: row.id,
		expenseId: row.expense_id,
		memberId: row.member_id,
		sharePaise: row.share_paise
	};
}
async function generateTripCode() {
	const sql = getDb();
	const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
	for (let attempt = 0; attempt < 100; attempt++) {
		let code = "";
		for (let i = 0; i < 8; i++) code += chars.charAt(Math.floor(Math.random() * 36));
		if ((await sql`SELECT 1 FROM trips WHERE code = ${code} LIMIT 1`).length === 0) return code;
	}
	return crypto.randomUUID().slice(0, 8).toUpperCase();
}
async function createTrip(name, creatorName) {
	const sql = getDb();
	const tripId = crypto.randomUUID();
	const creatorMemberId = crypto.randomUUID();
	const code = await generateTripCode();
	const now = (/* @__PURE__ */ new Date()).toISOString();
	await sql`
    INSERT INTO trips (id, code, name, created_at, created_by_member_id, status)
    VALUES (${tripId}, ${code}, ${name.trim() || "Untitled Trip"}, ${now}, ${creatorMemberId}, 'active')
  `;
	await sql`
    INSERT INTO members (id, trip_id, name, upi_id, joined_at)
    VALUES (${creatorMemberId}, ${tripId}, ${creatorName.trim()}, NULL, ${now})
  `;
	return rowToTrip((await sql`SELECT * FROM trips WHERE id = ${tripId}`)[0]);
}
async function getTripByCode(code) {
	const sql = getDb();
	const tripRows = await sql`SELECT * FROM trips WHERE code = ${code.trim().toUpperCase()}`;
	if (tripRows.length === 0) return null;
	return fetchTripRelations(sql, rowToTrip(tripRows[0]));
}
async function getTripById(id) {
	const sql = getDb();
	const tripRows = await sql`SELECT * FROM trips WHERE id = ${id}`;
	if (tripRows.length === 0) return null;
	return fetchTripRelations(sql, rowToTrip(tripRows[0]));
}
async function fetchTripRelations(sql, trip) {
	const [memberRows, expenseRows] = await Promise.all([sql`SELECT * FROM members WHERE trip_id = ${trip.id} ORDER BY joined_at ASC`, sql`SELECT * FROM expenses WHERE trip_id = ${trip.id} ORDER BY date DESC, created_at DESC`]);
	const members = memberRows.map((r) => rowToMember(r));
	const expenses = expenseRows.map((r) => rowToExpense(r));
	let shares = [];
	if (expenses.length > 0) shares = (await sql`
      SELECT * FROM expense_shares WHERE expense_id = ANY(${expenses.map((e) => e.id)})
    `).map((r) => rowToShare(r));
	return {
		trip,
		members,
		expenses,
		shares
	};
}
async function addMember(tripId, name, upiId = null) {
	const sql = getDb();
	if ((await sql`SELECT 1 FROM trips WHERE id = ${tripId}`).length === 0) throw new Error("Trip not found");
	let memberName = name.trim();
	if (!memberName) throw new Error("Member name cannot be empty");
	const existingNames = (await sql`SELECT name FROM members WHERE trip_id = ${tripId}`).map((r) => r.name.toLowerCase());
	if (existingNames.includes(memberName.toLowerCase())) {
		let suffix = 2;
		while (existingNames.includes(`${memberName.toLowerCase()} ${suffix}`)) suffix++;
		memberName = `${memberName} ${suffix}`;
	}
	const memberId = crypto.randomUUID();
	const now = (/* @__PURE__ */ new Date()).toISOString();
	await sql`
    INSERT INTO members (id, trip_id, name, upi_id, joined_at)
    VALUES (${memberId}, ${tripId}, ${memberName}, ${upiId ? upiId.trim() : null}, ${now})
  `;
	return rowToMember((await sql`SELECT * FROM members WHERE id = ${memberId}`)[0]);
}
async function removeMember(tripId, memberId) {
	const sql = getDb();
	if ((await sql`SELECT 1 FROM trips WHERE id = ${tripId}`).length === 0) throw new Error("Trip not found");
	const tripData = await getTripById(tripId);
	if (tripData) {
		const mBal = computeNetBalances(tripData.members, tripData.expenses, tripData.shares).find((b) => b.memberId === memberId);
		if (mBal && mBal.netBalancePaise !== 0) throw new Error("Cannot remove member with a non-zero balance. Settle debts first.");
	}
	await sql`DELETE FROM expense_shares WHERE member_id = ${memberId}`;
	await sql`DELETE FROM members WHERE id = ${memberId} AND trip_id = ${tripId}`;
}
async function updateMemberUpi(tripId, memberId, upiId) {
	const sql = getDb();
	if ((await sql`SELECT * FROM members WHERE id = ${memberId} AND trip_id = ${tripId}`).length === 0) throw new Error("Member not found in this trip");
	if (upiId && !/^[\w.\-]+@[\w]+$/.test(upiId.trim())) throw new Error("Invalid UPI ID format (expected name@bank)");
	await sql`
    UPDATE members SET upi_id = ${upiId ? upiId.trim() : null}
    WHERE id = ${memberId} AND trip_id = ${tripId}
  `;
	return rowToMember((await sql`SELECT * FROM members WHERE id = ${memberId}`)[0]);
}
async function addExpense(tripId, expenseData, sharesData) {
	const sql = getDb();
	if ((await sql`SELECT 1 FROM trips WHERE id = ${tripId}`).length === 0) throw new Error("Trip not found");
	if (expenseData.amountPaise <= 0) throw new Error("Expense amount must be greater than zero");
	const { isValid, differencePaise } = validateCustomSplit(expenseData.amountPaise, sharesData);
	if (!isValid) throw new Error(`Split total does not match expense total. Difference: ${differencePaise / 100} Rupee(s)`);
	const expenseId = crypto.randomUUID();
	const now = (/* @__PURE__ */ new Date()).toISOString();
	await sql`
    INSERT INTO expenses (id, trip_id, description, amount_paise, paid_by_member_id, category, split_type, date, created_at, updated_at)
    VALUES (
      ${expenseId}, ${tripId}, ${expenseData.description}, ${expenseData.amountPaise},
      ${expenseData.paidByMemberId}, ${expenseData.category}, ${expenseData.splitType},
      ${expenseData.date}, ${now}, ${now}
    )
  `;
	for (const share of sharesData) await sql`
      INSERT INTO expense_shares (id, expense_id, member_id, share_paise)
      VALUES (${crypto.randomUUID()}, ${expenseId}, ${share.memberId}, ${share.sharePaise})
    `;
	return rowToExpense((await sql`SELECT * FROM expenses WHERE id = ${expenseId}`)[0]);
}
async function updateExpense(tripId, expenseId, expenseUpdates, sharesData) {
	const sql = getDb();
	const expRows = await sql`SELECT * FROM expenses WHERE id = ${expenseId} AND trip_id = ${tripId}`;
	if (expRows.length === 0) throw new Error("Expense not found");
	const existing = rowToExpense(expRows[0]);
	const newAmount = expenseUpdates.amountPaise !== void 0 ? expenseUpdates.amountPaise : existing.amountPaise;
	if (newAmount <= 0) throw new Error("Expense amount must be greater than zero");
	const { isValid, differencePaise } = validateCustomSplit(newAmount, sharesData);
	if (!isValid) throw new Error(`Split total does not match expense total. Difference: ${differencePaise / 100} Rupee(s)`);
	const now = (/* @__PURE__ */ new Date()).toISOString();
	const merged = {
		...existing,
		...expenseUpdates
	};
	await sql`
    UPDATE expenses SET
      description = ${merged.description},
      amount_paise = ${merged.amountPaise},
      paid_by_member_id = ${merged.paidByMemberId},
      category = ${merged.category},
      split_type = ${merged.splitType},
      date = ${merged.date},
      updated_at = ${now}
    WHERE id = ${expenseId} AND trip_id = ${tripId}
  `;
	await sql`DELETE FROM expense_shares WHERE expense_id = ${expenseId}`;
	for (const share of sharesData) await sql`
      INSERT INTO expense_shares (id, expense_id, member_id, share_paise)
      VALUES (${crypto.randomUUID()}, ${expenseId}, ${share.memberId}, ${share.sharePaise})
    `;
	return rowToExpense((await sql`SELECT * FROM expenses WHERE id = ${expenseId}`)[0]);
}
async function deleteExpense(tripId, expenseId) {
	const sql = getDb();
	if ((await sql`SELECT 1 FROM expenses WHERE id = ${expenseId} AND trip_id = ${tripId}`).length === 0) throw new Error("Expense not found");
	await sql`DELETE FROM expenses WHERE id = ${expenseId} AND trip_id = ${tripId}`;
}
//#endregion
export { getTripByCode as a, updateExpense as c, simplifyDebts as d, deleteExpense as i, updateMemberUpi as l, addMember as n, getTripById as o, createTrip as r, removeMember as s, addExpense as t, computeNetBalances as u };
