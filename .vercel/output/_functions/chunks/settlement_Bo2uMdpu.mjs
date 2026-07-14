import { t as __exportAll } from "./rolldown-runtime_D7D4PA-g.mjs";
import { a as getTripByCode, d as simplifyDebts, o as getTripById, u as computeNetBalances } from "./store_hUDrmsS2.mjs";
//#region src/pages/api/trips/[id]/settlement.ts
var settlement_exports = /* @__PURE__ */ __exportAll({ GET: () => GET });
var GET = async ({ params }) => {
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
		const { members, expenses, shares } = tripData;
		const transactions = simplifyDebts(computeNetBalances(members, expenses, shares));
		return new Response(JSON.stringify({ transactions }), {
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
//#region \0virtual:astro:page:src/pages/api/trips/[id]/settlement@_@ts
var page = () => settlement_exports;
//#endregion
export { page };
