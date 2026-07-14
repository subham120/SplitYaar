import { t as __exportAll } from "./rolldown-runtime_D7D4PA-g.mjs";
import { a as renderComponent, d as renderTemplate, h as maybeRenderHead, n as renderScript, w as createComponent } from "./server_Ck1Ey-Cv.mjs";
import "./compiler_DXTdqtzG.mjs";
import { t as $$Layout } from "./Layout_DK2QgEmx.mjs";
//#region src/pages/trip/new.astro
var new_exports = /* @__PURE__ */ __exportAll({
	default: () => $$New,
	file: () => $$file,
	url: () => $$url
});
var $$New = createComponent(($$result, $$props, $$slots) => {
	return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": "Create a New Trip — SplitYatra" }, { "default": ($$result) => renderTemplate`
  ${maybeRenderHead($$result)}<div class="bg-canvas-parchment py-section px-lg flex items-center justify-center min-h-[85vh]"><div class="max-w-[480px] w-full bg-white border border-hairline rounded-lg p-lg shadow-sm"><!-- Page Header --><div class="mb-lg text-center md:text-left"><h1 class="text-display-md font-display font-semibold text-ink tracking-tight mb-xxs">Create a New Trip</h1><p class="text-caption text-ink-muted-48 leading-relaxed">Set up a shared expense ledger for your group. No email verification or password required.</p></div><!-- Creation Form --><form id="create-trip-form" class="space-y-md"><!-- Trip Name Input --><div><label for="trip-name" class="block text-caption-strong text-ink font-semibold mb-xxs">Trip Name</label><input type="text" id="trip-name" name="name" placeholder="e.g. Goa Trip Dec 2026" required maxlength="50" autocomplete="off" class="w-full bg-canvas text-ink font-sans text-body border border-hairline rounded-pill px-lg py-[12px] focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 placeholder:text-zinc-300 transition-all"></div><!-- Creator Name Input --><div><label for="creator-name" class="block text-caption-strong text-ink font-semibold mb-xxs">Your Name</label><input type="text" id="creator-name" name="creatorName" placeholder="What should friends call you?" required maxlength="30" autocomplete="name" class="w-full bg-canvas text-ink font-sans text-body border border-hairline rounded-pill px-lg py-[12px] focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 placeholder:text-zinc-300 transition-all"></div><!-- Submit Button --><button type="submit" id="submit-btn" class="w-full bg-primary text-on-primary font-sans font-medium text-body py-[12px] rounded-pill hover:bg-primary-focus active:scale-95 transition-all select-none cursor-pointer text-center">Create Trip</button><!-- Error Message --><p id="error-msg" class="hidden text-caption text-red-600 bg-red-50 border border-red-200 rounded-sm p-sm mt-xs"></p></form></div></div>

  ${renderScript($$result, "D:/project/SplitYaar/src/pages/trip/new.astro?astro&type=script&index=0&lang.ts")}` })}`;
}, "D:/project/SplitYaar/src/pages/trip/new.astro", void 0);
var $$file = "D:/project/SplitYaar/src/pages/trip/new.astro";
var $$url = "/trip/new";
//#endregion
//#region \0virtual:astro:page:src/pages/trip/new@_@astro
var page = () => new_exports;
//#endregion
export { page };
