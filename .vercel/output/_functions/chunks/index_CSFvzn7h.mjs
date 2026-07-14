import { t as __exportAll } from "./rolldown-runtime_D7D4PA-g.mjs";
import { r as createTrip } from "./store_hUDrmsS2.mjs";
//#region src/pages/api/trips/index.ts
var trips_exports = /* @__PURE__ */ __exportAll({ POST: () => POST });
var POST = async ({ request }) => {
	try {
		const { name, creatorName } = await request.json();
		if (!name || !name.trim()) return new Response(JSON.stringify({ error: "Trip name is required" }), {
			status: 400,
			headers: { "Content-Type": "application/json" }
		});
		if (!creatorName || !creatorName.trim()) return new Response(JSON.stringify({ error: "Creator name is required" }), {
			status: 400,
			headers: { "Content-Type": "application/json" }
		});
		const trip = await createTrip(name, creatorName);
		return new Response(JSON.stringify({ trip }), {
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
//#region \0virtual:astro:page:src/pages/api/trips/index@_@ts
var page = () => trips_exports;
//#endregion
export { page };
