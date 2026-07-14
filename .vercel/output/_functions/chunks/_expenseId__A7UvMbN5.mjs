import { t as __exportAll } from "./rolldown-runtime_D7D4PA-g.mjs";
import { a as getTripByCode, c as updateExpense, i as deleteExpense, o as getTripById } from "./store_hUDrmsS2.mjs";
//#region src/pages/api/trips/[id]/expenses/[expenseId].ts
var _expenseId__exports = /* @__PURE__ */ __exportAll({
	DELETE: () => DELETE,
	PUT: () => PUT
});
var PUT = async ({ request, params }) => {
	try {
		const { id, expenseId } = params;
		if (!id || !expenseId) return new Response(JSON.stringify({ error: "Trip ID and Expense ID are required" }), {
			status: 400,
			headers: { "Content-Type": "application/json" }
		});
		let tripData = await getTripById(id);
		if (!tripData) tripData = await getTripByCode(id);
		if (!tripData) return new Response(JSON.stringify({ error: "Trip not found" }), {
			status: 404,
			headers: { "Content-Type": "application/json" }
		});
		const trueTripId = tripData.trip.id;
		const { description, amountPaise, paidByMemberId, category, splitType, date, shares } = await request.json();
		if (amountPaise !== void 0 && amountPaise <= 0) return new Response(JSON.stringify({ error: "Expense amount must be greater than zero" }), {
			status: 400,
			headers: { "Content-Type": "application/json" }
		});
		if (!shares || !Array.isArray(shares) || shares.length === 0) return new Response(JSON.stringify({ error: "Split shares are required" }), {
			status: 400,
			headers: { "Content-Type": "application/json" }
		});
		const expense = await updateExpense(trueTripId, expenseId, {
			description,
			amountPaise,
			paidByMemberId,
			category,
			splitType,
			date
		}, shares);
		return new Response(JSON.stringify({ expense }), {
			status: 200,
			headers: { "Content-Type": "application/json" }
		});
	} catch (error) {
		const status = error.message.includes("Split total does not match") ? 400 : 500;
		return new Response(JSON.stringify({ error: error.message || "Internal Server Error" }), {
			status,
			headers: { "Content-Type": "application/json" }
		});
	}
};
var DELETE = async ({ params }) => {
	try {
		const { id, expenseId } = params;
		if (!id || !expenseId) return new Response(JSON.stringify({ error: "Trip ID and Expense ID are required" }), {
			status: 400,
			headers: { "Content-Type": "application/json" }
		});
		let tripData = await getTripById(id);
		if (!tripData) tripData = await getTripByCode(id);
		if (!tripData) return new Response(JSON.stringify({ error: "Trip not found" }), {
			status: 404,
			headers: { "Content-Type": "application/json" }
		});
		const trueTripId = tripData.trip.id;
		await deleteExpense(trueTripId, expenseId);
		return new Response(JSON.stringify({ success: true }), {
			status: 200,
			headers: { "Content-Type": "application/json" }
		});
	} catch (error) {
		return new Response(JSON.stringify({ error: error.message || "Internal Server Error" }), {
			status: 500,
			headers: { "Content-Type": "application/json" }
		});
	}
};
//#endregion
//#region \0virtual:astro:page:src/pages/api/trips/[id]/expenses/[expenseId]@_@ts
var page = () => _expenseId__exports;
//#endregion
export { page };
