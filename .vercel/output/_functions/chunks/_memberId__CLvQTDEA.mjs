import { t as __exportAll } from "./rolldown-runtime_D7D4PA-g.mjs";
import { a as getTripByCode, o as getTripById, s as removeMember } from "./store_CGxwQav-.mjs";
//#region src/pages/api/trips/[id]/members/[memberId].ts
var _memberId__exports = /* @__PURE__ */ __exportAll({ DELETE: () => DELETE });
var DELETE = async ({ params }) => {
	try {
		const { id, memberId } = params;
		if (!id || !memberId) return new Response(JSON.stringify({ error: "Trip ID and Member ID are required" }), {
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
		await removeMember(trueTripId, memberId);
		return new Response(JSON.stringify({ success: true }), {
			status: 200,
			headers: { "Content-Type": "application/json" }
		});
	} catch (error) {
		const status = error.message.includes("non-zero balance") ? 400 : 500;
		return new Response(JSON.stringify({ error: error.message || "Internal Server Error" }), {
			status,
			headers: { "Content-Type": "application/json" }
		});
	}
};
//#endregion
//#region \0virtual:astro:page:src/pages/api/trips/[id]/members/[memberId]@_@ts
var page = () => _memberId__exports;
//#endregion
export { page };
