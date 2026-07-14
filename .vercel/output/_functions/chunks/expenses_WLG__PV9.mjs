import { t as __exportAll } from "./rolldown-runtime_D7D4PA-g.mjs";
import { a as getTripByCode, o as getTripById, t as addExpense } from "./store_hUDrmsS2.mjs";
//#region src/pages/api/trips/[id]/expenses.ts
var expenses_exports = /* @__PURE__ */ __exportAll({ POST: () => POST });
var POST = async ({ request, params }) => {
	try {
		const { id } = params;
		if (!id) return new Response(JSON.stringify({ error: "Trip ID is required" }), {
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
		if (!description || !description.trim()) return new Response(JSON.stringify({ error: "Description is required" }), {
			status: 400,
			headers: { "Content-Type": "application/json" }
		});
		if (amountPaise === void 0 || amountPaise <= 0) return new Response(JSON.stringify({ error: "Expense amount must be greater than zero" }), {
			status: 400,
			headers: { "Content-Type": "application/json" }
		});
		if (!paidByMemberId) return new Response(JSON.stringify({ error: "Payer ID is required" }), {
			status: 400,
			headers: { "Content-Type": "application/json" }
		});
		if (!category) return new Response(JSON.stringify({ error: "Category is required" }), {
			status: 400,
			headers: { "Content-Type": "application/json" }
		});
		if (!splitType) return new Response(JSON.stringify({ error: "Split type is required" }), {
			status: 400,
			headers: { "Content-Type": "application/json" }
		});
		if (!date) return new Response(JSON.stringify({ error: "Date is required" }), {
			status: 400,
			headers: { "Content-Type": "application/json" }
		});
		if (!shares || !Array.isArray(shares) || shares.length === 0) return new Response(JSON.stringify({ error: "Split shares are required" }), {
			status: 400,
			headers: { "Content-Type": "application/json" }
		});
		const expense = await addExpense(trueTripId, {
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
//#endregion
//#region \0virtual:astro:page:src/pages/api/trips/[id]/expenses@_@ts
var page = () => expenses_exports;
//#endregion
export { page };
