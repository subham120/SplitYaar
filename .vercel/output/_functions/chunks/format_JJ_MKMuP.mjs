import { C as createAstro, _ as addAttribute, d as renderTemplate, h as maybeRenderHead, w as createComponent } from "./server_Ck1Ey-Cv.mjs";
import "./compiler_DXTdqtzG.mjs";
//#region src/components/SubNav.astro
createAstro("https://astro.build");
var $$SubNav = createComponent(($$result, $$props, $$slots) => {
	const Astro = $$result.createAstro($$props, $$slots);
	Astro.self = $$SubNav;
	const { code, activeTab, tripName } = Astro.props;
	const links = [
		{
			id: "dashboard",
			label: "Dashboard",
			href: `/trip/${code}`
		},
		{
			id: "history",
			label: "History",
			href: `/trip/${code}/history`
		},
		{
			id: "members",
			label: "Members",
			href: `/trip/${code}/members`
		},
		{
			id: "settlement",
			label: "Settle Up",
			href: `/trip/${code}/settlement`
		}
	];
	return renderTemplate`${maybeRenderHead($$result)}<div class="sticky top-[44px] bg-canvas-parchment/80 backdrop-blur-md border-b border-hairline h-[52px] flex items-center z-40 select-none"><div class="max-w-[1440px] w-full mx-auto px-lg flex items-center justify-between gap-xs sm:gap-md"><!-- Left: Trip Title & Short Code --><div class="flex items-center gap-xs truncate min-w-0"><span class="font-display text-[15px] sm:text-tagline font-semibold text-ink truncate max-w-[100px] xs:max-w-[160px] sm:max-w-[300px]">${tripName}</span><span class="text-fine-print font-mono bg-zinc-200 text-ink-muted-80 px-xs py-[2px] rounded-xs text-[10px] font-semibold tracking-wide shrink-0">${code}</span></div><!-- Right: Nav links --><nav class="flex items-center gap-xs sm:gap-lg overflow-x-auto no-scrollbar scroll-smooth">${links.map((link) => {
		const isActive = link.id === activeTab;
		return renderTemplate`<a${addAttribute(link.href, "href")}${addAttribute(`text-[12px] sm:text-button-utility transition-colors font-medium whitespace-nowrap py-[4px] px-[6px] border-b-2 ${isActive ? "text-primary border-primary font-semibold" : "text-ink-muted-48 border-transparent hover:text-ink"}`, "class")}>${link.label}</a>`;
	})}</nav></div></div>`;
}, "D:/project/SplitYaar/src/components/SubNav.astro", void 0);
//#endregion
//#region src/lib/format.ts
/**
* Formats a paise integer into Indian Rupee (₹) format with Indian digit grouping (e.g., ₹1,25,000).
* If the amount ends in complete rupees, it hides the decimal paise part for layout elegance.
*/
function formatINR(paise) {
	const rupees = paise / 100;
	return new Intl.NumberFormat("en-IN", {
		style: "currency",
		currency: "INR",
		minimumFractionDigits: paise % 100 === 0 ? 0 : 2,
		maximumFractionDigits: 2
	}).format(rupees);
}
/**
* Parses a YYYY-MM-DD ISO date string and formats it cleanly for Indian users (e.g., "14 Jul 2026").
* Uses local construction to avoid timezone shifts common with UTC string parsing.
*/
function formatISTDate(dateStr) {
	const parts = dateStr.split("-");
	if (parts.length !== 3) return dateStr;
	const year = parseInt(parts[0], 10);
	const month = parseInt(parts[1], 10) - 1;
	const day = parseInt(parts[2], 10);
	if (isNaN(year) || isNaN(month) || isNaN(day)) return dateStr;
	return new Date(year, month, day).toLocaleDateString("en-IN", {
		day: "numeric",
		month: "short",
		year: "numeric"
	});
}
//#endregion
export { formatISTDate as n, $$SubNav as r, formatINR as t };
