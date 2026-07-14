import { t as __exportAll } from "./rolldown-runtime_D7D4PA-g.mjs";
import { a as getTripByCode, n as addMember, o as getTripById } from "./store_CGxwQav-.mjs";
//#region src/pages/api/trips/[id]/members.ts
var members_exports = /* @__PURE__ */ __exportAll({ POST: () => POST });
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
		const { name, upiId } = await request.json();
		if (!name || !name.trim()) return new Response(JSON.stringify({ error: "Member name is required" }), {
			status: 400,
			headers: { "Content-Type": "application/json" }
		});
		const member = await addMember(trueTripId, name, upiId);
		return new Response(JSON.stringify({ member }), {
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
//#region \0virtual:astro:page:src/pages/api/trips/[id]/members@_@ts
var page = () => members_exports;
//#endregion
export { page };
