import { t as __exportAll } from "./rolldown-runtime_D7D4PA-g.mjs";
import { C as createAstro, _ as addAttribute, a as renderComponent, d as renderTemplate, h as maybeRenderHead, n as renderScript, v as defineScriptVars, w as createComponent } from "./server_Ck1Ey-Cv.mjs";
import "./compiler_DXTdqtzG.mjs";
import { a as getTripByCode, d as simplifyDebts, u as computeNetBalances } from "./store_hUDrmsS2.mjs";
import { t as $$Layout } from "./Layout_pPVGDrUr.mjs";
import { r as $$SubNav, t as formatINR } from "./format_JJ_MKMuP.mjs";
import QRCode from "qrcode";
//#region src/lib/upi.ts
/**
* Builds an NPCI compliant UPI payment URI scheme link.
* Format: upi://pay?pa=<vpa>&pn=<name>&am=<amount>&cu=INR&tn=<note>
*/
function buildUpiLink(payeeVpa, payeeName, amountPaise, note) {
	return `upi://pay?pa=${encodeURIComponent(payeeVpa.trim())}&pn=${encodeURIComponent(payeeName.trim())}&am=${(amountPaise / 100).toFixed(2)}&cu=INR&tn=${encodeURIComponent(note.trim())}`;
}
/**
* Generates a base64 Data URL (PNG) representing a QR Code of the UPI link
* for desktop screens/scanning.
*/
async function generateQrCodeDataUrl(upiLink) {
	try {
		return await QRCode.toDataURL(upiLink, {
			margin: 2,
			width: 300,
			color: {
				dark: "#1d1d1f",
				light: "#ffffff"
			}
		});
	} catch (error) {
		console.error("Failed to generate UPI QR code:", error);
		throw new Error("QR Code generation failed");
	}
}
//#endregion
//#region src/pages/trip/[code]/settlement.astro
var settlement_exports = /* @__PURE__ */ __exportAll({
	default: () => $$Settlement,
	file: () => $$file,
	url: () => $$url
});
createAstro("https://astro.build");
var $$Settlement = createComponent(async ($$result, $$props, $$slots) => {
	const Astro = $$result.createAstro($$props, $$slots);
	Astro.self = $$Settlement;
	const { code } = Astro.params;
	if (!code) return Astro.redirect("/");
	const tripData = await getTripByCode(code);
	if (!tripData) return Astro.redirect("/");
	const { trip, members, expenses, shares } = tripData;
	const rawTransactions = simplifyDebts(computeNetBalances(members, expenses, shares));
	const transactions = await Promise.all(rawTransactions.map(async (t) => {
		const fromMember = members.find((m) => m.id === t.fromMemberId);
		const toMember = members.find((m) => m.id === t.toMemberId);
		let upiLink = "";
		let qrDataUrl = "";
		if (toMember.upiId) {
			upiLink = buildUpiLink(toMember.upiId, toMember.name, t.amountPaise, `Settle up: ${trip.name}`);
			try {
				qrDataUrl = await generateQrCodeDataUrl(upiLink);
			} catch (e) {
				console.error("QR code generation failed for settlement", e);
			}
		}
		return {
			...t,
			fromName: fromMember.name,
			toName: toMember.name,
			toUpiId: toMember.upiId,
			upiLink,
			qrDataUrl
		};
	}));
	return renderTemplate`${renderComponent($$result, "Layout", $$Layout, {
		"title": `Settle Up — ${trip.name}`,
		"noindex": true
	}, { "default": async ($$result) => renderTemplate`
  
  <script>(function(){${defineScriptVars({ code })}
    if (!localStorage.getItem(\`split_yatra_member_\${code}\`)) {
      window.location.replace(\`/trip/\${code}/join\`);
    }
  })();<\/script>${renderComponent($$result, "SubNav", $$SubNav, {
		"code": code,
		"activeTab": "settlement",
		"tripName": trip.name
	})}

  ${maybeRenderHead($$result)}<div class="bg-canvas-parchment min-h-[90vh] pb-[60px] pt-lg px-lg"><div class="max-w-[640px] w-full mx-auto space-y-lg">${transactions.length === 0 ? renderTemplate`<div class="bg-white border border-hairline rounded-lg p-xxl text-center flex flex-col items-center justify-center min-h-[360px] shadow-sm select-none"><span class="text-[64px] block mb-sm">🎉</span><h2 class="text-display-md font-display font-semibold text-ink tracking-tight mb-xs">Everyone is Settled!</h2><p class="text-lead text-ink-muted-48 leading-relaxed max-w-[400px]">No outstanding balances remain. All debts have been squared away.</p><a${addAttribute(`/trip/${code}`, "href")} class="mt-lg bg-primary text-on-primary font-sans font-medium text-body px-xl py-md rounded-pill hover:bg-primary-focus active:scale-95 transition-all select-none cursor-pointer">Go to Dashboard</a></div>` : renderTemplate`<div class="space-y-sm"><div class="bg-white border border-hairline rounded-lg p-lg shadow-sm"><h2 class="text-body-strong font-semibold text-ink mb-xxs">Settlement Plan</h2><p class="text-caption text-ink-muted-48 leading-relaxed mb-lg">We've calculated the minimum transfers required to settle all debts.</p><div class="space-y-md">${transactions.map((tx, idx) => {
		return renderTemplate`<div class="settlement-row bg-surface-pearl border border-hairline rounded-lg p-md flex flex-col sm:flex-row sm:items-center justify-between gap-md transition-all"${addAttribute(idx, "data-tx-idx")}><!-- Debtor and Creditor info --><div class="truncate"><div class="flex items-center gap-xs text-body-strong text-ink font-semibold"><span class="truncate">${tx.fromName}</span><span class="text-zinc-400 font-normal">&rarr;</span><span class="truncate text-primary">${tx.toName}</span></div><span class="text-caption text-ink-muted-48 block mt-[2px]">Amount: <span class="font-bold text-ink">${formatINR(tx.amountPaise)}</span></span></div><!-- Actions --><div class="flex items-center gap-sm shrink-0"><!-- Visual Settlement Checkbox --><label class="flex items-center gap-[6px] text-caption font-medium select-none cursor-pointer"><input type="checkbox" class="settle-checklist-cb w-4 h-4 rounded-xs border-hairline text-primary focus:ring-primary cursor-pointer"${addAttribute(idx, "data-target-row")}><span class="text-ink-muted-48 checkbox-label">Paid</span></label><!-- Pay Button (Mobile UPI or desktop modal launcher) -->${tx.toUpiId ? renderTemplate`<button type="button" class="pay-btn bg-primary text-on-primary text-[12px] font-sans font-medium px-lg py-xs rounded-pill hover:bg-primary-focus active:scale-95 transition-all select-none cursor-pointer shrink-0"${addAttribute(tx.upiLink, "data-upi-link")}${addAttribute(tx.qrDataUrl, "data-qr-url")}${addAttribute(tx.toName, "data-payee")}${addAttribute(formatINR(tx.amountPaise), "data-amount")}>Pay UPI</button>` : renderTemplate`<button type="button" class="nudge-btn border border-primary text-primary text-[12px] font-sans font-medium px-lg py-xs rounded-pill hover:bg-zinc-50 active:scale-95 transition-all select-none cursor-pointer shrink-0"${addAttribute(tx.toName, "data-payee-name")}>Nudge UPI</button>`}</div></div>`;
	})}</div></div></div>`}</div></div>

  
  <div id="qr-modal" class="hidden fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-lg"><div class="bg-white border border-hairline rounded-lg p-lg max-w-[360px] w-full text-center flex flex-col items-center shadow-2xl relative animate-fadeIn"><!-- Close button inside modal --><button id="close-modal-btn" class="absolute right-md top-md w-8 h-8 rounded-full bg-zinc-100 hover:bg-zinc-200 text-ink flex items-center justify-center active:scale-90 transition-all select-none cursor-pointer"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"></path><path d="m6 6 12 12"></path></svg></button><h3 class="text-body-strong font-semibold text-ink mb-xxs" id="modal-payee-title">Pay Friend</h3><p class="text-caption text-ink-muted-48 mb-md" id="modal-amount-title">Amount: ₹0.00</p><!-- QR Image slot --><div class="bg-zinc-50 border border-hairline rounded-md p-sm mb-md w-[240px] h-[240px] flex items-center justify-center"><img id="modal-qr-img" src="" alt="UPI Payment QR Code" class="w-full h-full object-contain"></div><p class="text-fine-print text-ink-muted-48 leading-relaxed max-w-[280px]">Scan this QR code with any UPI app (GPay, PhonePe, Paytm) to make payment.</p></div></div>

  
  ${renderScript($$result, "D:/project/SplitYaar/src/pages/trip/[code]/settlement.astro?astro&type=script&index=0&lang.ts")}` })}`;
}, "D:/project/SplitYaar/src/pages/trip/[code]/settlement.astro", void 0);
var $$file = "D:/project/SplitYaar/src/pages/trip/[code]/settlement.astro";
var $$url = "/trip/[code]/settlement";
//#endregion
//#region \0virtual:astro:page:src/pages/trip/[code]/settlement@_@astro
var page = () => settlement_exports;
//#endregion
export { page };
