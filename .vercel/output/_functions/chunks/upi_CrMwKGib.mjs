import { t as __exportAll } from "./rolldown-runtime_D7D4PA-g.mjs";
import { a as getTripByCode, l as updateMemberUpi, o as getTripById } from "./store_CGxwQav-.mjs";
//#region src/pages/api/trips/[id]/members/[memberId]/upi.ts
var upi_exports = /* @__PURE__ */ __exportAll({ POST: () => POST });
var POST = async ({ request, params }) => {
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
		const { upiId } = await request.json();
		const member = await updateMemberUpi(trueTripId, memberId, upiId);
		return new Response(JSON.stringify({ member }), {
			status: 200,
			headers: { "Content-Type": "application/json" }
		});
	} catch (error) {
		const status = error.message.includes("Invalid UPI ID") ? 400 : 500;
		return new Response(JSON.stringify({ error: error.message || "Internal Server Error" }), {
			status,
			headers: { "Content-Type": "application/json" }
		});
	}
};
//#endregion
//#region \0virtual:astro:page:src/pages/api/trips/[id]/members/[memberId]/upi@_@ts
var page = () => upi_exports;
//#endregion
export { page };
