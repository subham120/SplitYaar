import { t as __exportAll } from "./rolldown-runtime_D7D4PA-g.mjs";
import { C as createAstro, _ as addAttribute, a as renderComponent, d as renderTemplate, h as maybeRenderHead, n as renderScript, v as defineScriptVars, w as createComponent } from "./server_Ck1Ey-Cv.mjs";
import "./compiler_DXTdqtzG.mjs";
import { a as getTripByCode } from "./store_hUDrmsS2.mjs";
import { t as $$Layout } from "./Layout_pPVGDrUr.mjs";
import { n as formatISTDate, r as $$SubNav, t as formatINR } from "./format_JJ_MKMuP.mjs";
//#region src/pages/trip/[code]/history.astro
var history_exports = /* @__PURE__ */ __exportAll({
	default: () => $$History,
	file: () => $$file,
	url: () => $$url
});
createAstro("https://astro.build");
var $$History = createComponent(async ($$result, $$props, $$slots) => {
	const Astro = $$result.createAstro($$props, $$slots);
	Astro.self = $$History;
	const { code } = Astro.params;
	if (!code) return Astro.redirect("/");
	const tripData = await getTripByCode(code);
	if (!tripData) return Astro.redirect("/");
	const { trip, members, expenses, shares } = tripData;
	const sortedExpenses = [...expenses].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
	return renderTemplate`${renderComponent($$result, "Layout", $$Layout, {
		"title": `Expense History — ${trip.name}`,
		"noindex": true
	}, { "default": async ($$result) => renderTemplate`
  
  <script>(function(){${defineScriptVars({ code })}
    if (!localStorage.getItem(\`split_yatra_member_\${code}\`)) {
      window.location.replace(\`/trip/\${code}/join\`);
    }
  })();<\/script>${renderComponent($$result, "SubNav", $$SubNav, {
		"code": code,
		"activeTab": "history",
		"tripName": trip.name
	})}

  ${maybeRenderHead($$result)}<div class="bg-canvas-parchment min-h-[90vh] pb-[60px] pt-lg px-lg"><div class="max-w-[1440px] w-full mx-auto space-y-lg"><!-- Filters header card --><div class="bg-white border border-hairline rounded-lg p-lg shadow-sm"><h2 class="text-body-strong font-semibold text-ink mb-md">Filter Expenses</h2><div class="flex flex-col sm:flex-row gap-md"><!-- Category Filter --><div class="flex-1"><label for="filter-category" class="block text-caption-strong text-ink font-semibold mb-xxs">Category</label><div class="relative"><select id="filter-category" class="w-full bg-canvas text-ink font-sans text-body border border-hairline rounded-pill px-lg py-[9px] focus:outline-none focus:border-primary appearance-none cursor-pointer"><option value="all">All Categories</option><option value="food">🍔 Food</option><option value="travel">🚗 Travel</option><option value="stay">🏨 Stay</option><option value="sightseeing">🎟️ Sightseeing/Tickets</option><option value="shopping">🛒 Shopping</option><option value="alcohol">🍺 Alcohol</option><option value="misc">📦 Miscellaneous</option></select><div class="pointer-events-none absolute right-lg top-1/2 -translate-y-1/2 text-ink-muted-48"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m6 9 6 6 6-6"></path></svg></div></div></div><!-- Payer Filter --><div class="flex-1"><label for="filter-payer" class="block text-caption-strong text-ink font-semibold mb-xxs">Paid By</label><div class="relative"><select id="filter-payer" class="w-full bg-canvas text-ink font-sans text-body border border-hairline rounded-pill px-lg py-[9px] focus:outline-none focus:border-primary appearance-none cursor-pointer"><option value="all">All Members</option>${members.map((m) => renderTemplate`<option${addAttribute(m.id, "value")}>${m.name}</option>`)}</select><div class="pointer-events-none absolute right-lg top-1/2 -translate-y-1/2 text-ink-muted-48"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m6 9 6 6 6-6"></path></svg></div></div></div></div></div><!-- Expense History Log List --><div class="space-y-sm" id="expense-log-list">${sortedExpenses.length === 0 ? renderTemplate`<div class="bg-white border border-hairline rounded-lg p-xxl text-center text-ink-muted-48"><span class="text-[56px] block mb-sm">📭</span><h3 class="text-body-strong font-semibold text-ink mb-xxs">No Expenses Found</h3><p class="text-caption mb-md">This trip doesn't have any logged entries matching current filters.</p><a${addAttribute(`/trip/${code}/expense/new`, "href")} class="bg-primary text-on-primary font-sans font-medium text-body px-xl py-xs rounded-pill hover:bg-primary-focus active:scale-95 transition-all inline-block select-none cursor-pointer">Add Expense</a></div>` : sortedExpenses.map((exp) => {
		const payer = members.find((m) => m.id === exp.paidByMemberId);
		const payerName = payer ? payer.name : "Unknown";
		const expShares = shares.filter((s) => s.expenseId === exp.id);
		return renderTemplate`<div class="expense-item-row bg-white border border-hairline hover:border-zinc-300 rounded-lg p-lg cursor-pointer transition-all select-none flex flex-col gap-md"${addAttribute(exp.category, "data-category")}${addAttribute(exp.paidByMemberId, "data-payer-id")}><!-- Row Header Summary --><div class="flex items-center justify-between gap-md"><div class="truncate"><h3 class="text-body-strong text-ink font-semibold truncate leading-snug">${exp.description}</h3><p class="text-fine-print text-ink-muted-48 mt-[2px]">Paid by <span class="font-semibold text-ink-muted-80">${payerName}</span> &middot; ${formatISTDate(exp.date)}</p><span class="inline-block text-[9px] uppercase font-bold tracking-wider px-[6px] py-[2px] rounded-xs mt-[6px] bg-zinc-100 text-ink-muted-80 font-sans">${exp.category}</span></div><div class="text-right shrink-0 flex items-center gap-md"><div><div class="text-[19px] font-semibold text-ink">${formatINR(exp.amountPaise)}</div><span class="text-[10px] text-ink-muted-48 block">Tap to expand</span></div><!-- Indicator caret --><div class="text-ink-muted-48 transition-transform rotate-0 caret-icon"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"></path></svg></div></div></div><!-- Row Expandable Details (Hidden by Default) --><div class="hidden border-t border-divider-soft pt-md mt-xxs space-y-md expandable-details animate-slideDown"><div><h4 class="text-caption-strong text-ink font-semibold mb-xs">Split Details (${exp.splitType.replace("_", " ")})</h4><div class="grid grid-cols-1 sm:grid-cols-2 gap-xs">${expShares.map((share) => {
			const memberObj = members.find((m) => m.id === share.memberId);
			return renderTemplate`<div class="flex justify-between items-center bg-surface-pearl border border-hairline rounded-sm px-sm py-[6px] text-caption"><span class="text-ink-muted-80 truncate pr-sm">👤 ${memberObj ? memberObj.name : "Unknown"}</span><span class="font-semibold text-ink shrink-0">${formatINR(share.sharePaise)}</span></div>`;
		})}</div></div><!-- CTA actions inside drawer --><div class="flex justify-end gap-sm pt-xs"><a${addAttribute(`/trip/${code}/expense/${exp.id}/edit`, "href")} class="border border-primary text-primary text-[12px] font-sans font-medium px-lg py-xs rounded-pill hover:bg-zinc-50 active:scale-95 transition-all text-center select-none cursor-pointer">✏️ Edit / Delete</a></div></div></div>`;
	})}</div></div></div>

  
  ${renderScript($$result, "D:/project/SplitYaar/src/pages/trip/[code]/history.astro?astro&type=script&index=0&lang.ts")}` })}`;
}, "D:/project/SplitYaar/src/pages/trip/[code]/history.astro", void 0);
var $$file = "D:/project/SplitYaar/src/pages/trip/[code]/history.astro";
var $$url = "/trip/[code]/history";
//#endregion
//#region \0virtual:astro:page:src/pages/trip/[code]/history@_@astro
var page = () => history_exports;
//#endregion
export { page };
