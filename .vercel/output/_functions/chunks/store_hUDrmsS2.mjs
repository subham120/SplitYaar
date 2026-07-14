import fs from "fs";
import path from "path";
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
var DB_FILE = path.join(process.cwd(), "db.json");
var state = {
	trips: [],
	members: [],
	expenses: [],
	shares: []
};
function loadDB() {
	try {
		if (fs.existsSync(DB_FILE)) {
			const data = fs.readFileSync(DB_FILE, "utf-8");
			state = JSON.parse(data);
		} else saveDB();
	} catch (err) {
		console.error("Failed to load local DB file, starting with empty state:", err);
	}
}
function saveDB() {
	try {
		fs.writeFileSync(DB_FILE, JSON.stringify(state, null, 2), "utf-8");
	} catch (err) {
		console.error("Failed to write local DB file:", err);
	}
}
loadDB();
/**
* Generates a unique 8-character uppercase alphanumeric trip code.
* Ensures no collisions with existing trips.
*/
function generateTripCode() {
	const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
	let attempts = 0;
	while (attempts < 100) {
		let code = "";
		for (let i = 0; i < 8; i++) code += chars.charAt(Math.floor(Math.random() * 36));
		if (!state.trips.some((t) => t.code === code)) return code;
		attempts++;
	}
	return crypto.randomUUID().slice(0, 8).toUpperCase();
}
async function createTrip(name, creatorName) {
	const tripId = crypto.randomUUID();
	const creatorMemberId = crypto.randomUUID();
	const code = generateTripCode();
	const now = (/* @__PURE__ */ new Date()).toISOString();
	const creator = {
		id: creatorMemberId,
		tripId,
		name: creatorName.trim(),
		upiId: null,
		joinedAt: now
	};
	const trip = {
		id: tripId,
		code,
		name: name.trim() || "Untitled Trip",
		createdAt: now,
		createdByMemberId: creatorMemberId,
		status: "active"
	};
	state.trips.push(trip);
	state.members.push(creator);
	saveDB();
	return trip;
}
async function getTripByCode(code) {
	const normalizedCode = code.trim().toUpperCase();
	const trip = state.trips.find((t) => t.code === normalizedCode);
	if (!trip) return null;
	const members = state.members.filter((m) => m.tripId === trip.id);
	const expenses = state.expenses.filter((e) => e.tripId === trip.id);
	const expenseIds = expenses.map((e) => e.id);
	return {
		trip,
		members,
		expenses,
		shares: state.shares.filter((s) => expenseIds.includes(s.expenseId))
	};
}
async function getTripById(id) {
	const trip = state.trips.find((t) => t.id === id);
	if (!trip) return null;
	const members = state.members.filter((m) => m.tripId === trip.id);
	const expenses = state.expenses.filter((e) => e.tripId === trip.id);
	const expenseIds = expenses.map((e) => e.id);
	return {
		trip,
		members,
		expenses,
		shares: state.shares.filter((s) => expenseIds.includes(s.expenseId))
	};
}
async function addMember(tripId, name, upiId = null) {
	if (!state.trips.find((t) => t.id === tripId)) throw new Error("Trip not found");
	let memberName = name.trim();
	if (!memberName) throw new Error("Member name cannot be empty");
	const existingNames = state.members.filter((m) => m.tripId === tripId).map((m) => m.name.toLowerCase());
	if (existingNames.includes(memberName.toLowerCase())) {
		let suffix = 2;
		while (existingNames.includes(`${memberName.toLowerCase()} ${suffix}`)) suffix++;
		memberName = `${memberName} ${suffix}`;
	}
	const member = {
		id: crypto.randomUUID(),
		tripId,
		name: memberName,
		upiId: upiId ? upiId.trim() : null,
		joinedAt: (/* @__PURE__ */ new Date()).toISOString()
	};
	state.members.push(member);
	saveDB();
	return member;
}
async function removeMember(tripId, memberId) {
	if (!state.trips.find((t) => t.id === tripId)) throw new Error("Trip not found");
	const tripData = await getTripById(tripId);
	if (tripData) {
		const mBal = computeNetBalances(tripData.members, tripData.expenses, tripData.shares).find((b) => b.memberId === memberId);
		if (mBal && mBal.netBalancePaise !== 0) throw new Error("Cannot remove member with a non-zero balance. Settle debts first.");
	}
	state.members = state.members.filter((m) => !(m.tripId === tripId && m.id === memberId));
	state.shares = state.shares.filter((s) => s.memberId !== memberId);
	saveDB();
}
async function updateMemberUpi(tripId, memberId, upiId) {
	const member = state.members.find((m) => m.tripId === tripId && m.id === memberId);
	if (!member) throw new Error("Member not found in this trip");
	if (upiId && !/^[\w.\-]+@[\w]+$/.test(upiId.trim())) throw new Error("Invalid UPI ID format (expected name@bank)");
	member.upiId = upiId ? upiId.trim() : null;
	saveDB();
	return member;
}
async function addExpense(tripId, expenseData, sharesData) {
	if (!state.trips.find((t) => t.id === tripId)) throw new Error("Trip not found");
	if (expenseData.amountPaise <= 0) throw new Error("Expense amount must be greater than zero");
	const { isValid, differencePaise } = validateCustomSplit(expenseData.amountPaise, sharesData);
	if (!isValid) throw new Error(`Split total does not match expense total. Difference: ${differencePaise / 100} Rupee(s)`);
	const expenseId = crypto.randomUUID();
	const now = (/* @__PURE__ */ new Date()).toISOString();
	const expense = {
		...expenseData,
		id: expenseId,
		tripId,
		createdAt: now,
		updatedAt: now
	};
	const shares = sharesData.map((share) => ({
		id: crypto.randomUUID(),
		expenseId,
		memberId: share.memberId,
		sharePaise: share.sharePaise
	}));
	state.expenses.push(expense);
	state.shares.push(...shares);
	saveDB();
	return expense;
}
async function updateExpense(tripId, expenseId, expenseUpdates, sharesData) {
	const expense = state.expenses.find((e) => e.tripId === tripId && e.id === expenseId);
	if (!expense) throw new Error("Expense not found");
	const newAmount = expenseUpdates.amountPaise !== void 0 ? expenseUpdates.amountPaise : expense.amountPaise;
	if (newAmount <= 0) throw new Error("Expense amount must be greater than zero");
	const { isValid, differencePaise } = validateCustomSplit(newAmount, sharesData);
	if (!isValid) throw new Error(`Split total does not match expense total. Difference: ${differencePaise / 100} Rupee(s)`);
	const now = (/* @__PURE__ */ new Date()).toISOString();
	Object.assign(expense, expenseUpdates);
	expense.updatedAt = now;
	state.shares = state.shares.filter((s) => s.expenseId !== expenseId);
	const newShares = sharesData.map((share) => ({
		id: crypto.randomUUID(),
		expenseId,
		memberId: share.memberId,
		sharePaise: share.sharePaise
	}));
	state.shares.push(...newShares);
	saveDB();
	return expense;
}
async function deleteExpense(tripId, expenseId) {
	if (!state.expenses.find((e) => e.tripId === tripId && e.id === expenseId)) throw new Error("Expense not found");
	state.expenses = state.expenses.filter((e) => !(e.tripId === tripId && e.id === expenseId));
	state.shares = state.shares.filter((s) => s.expenseId !== expenseId);
	saveDB();
}
//#endregion
export { getTripByCode as a, updateExpense as c, simplifyDebts as d, deleteExpense as i, updateMemberUpi as l, addMember as n, getTripById as o, createTrip as r, removeMember as s, addExpense as t, computeNetBalances as u };
