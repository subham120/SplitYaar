import { t as __exportAll } from "./rolldown-runtime_D7D4PA-g.mjs";
import { C as createAstro, _ as addAttribute, a as renderComponent, d as renderTemplate, h as maybeRenderHead, v as defineScriptVars, w as createComponent } from "./server_Ck1Ey-Cv.mjs";
import "./compiler_DXTdqtzG.mjs";
import { a as getTripByCode } from "./store_hUDrmsS2.mjs";
import { t as $$Layout } from "./Layout_pPVGDrUr.mjs";
//#region src/pages/trip/[code]/join.astro
var join_exports = /* @__PURE__ */ __exportAll({
	default: () => $$Join,
	file: () => $$file,
	url: () => $$url
});
createAstro("https://astro.build");
var $$Join = createComponent(async ($$result, $$props, $$slots) => {
	const Astro = $$result.createAstro($$props, $$slots);
	Astro.self = $$Join;
	const { code } = Astro.params;
	if (!code) return Astro.redirect("/");
	const tripData = await getTripByCode(code);
	const trip = tripData?.trip;
	const members = tripData?.members || [];
	return renderTemplate`${renderComponent($$result, "Layout", $$Layout, {
		"title": trip ? `Join ${trip.name} — SplitYatra` : "Trip Not Found — SplitYatra",
		"noindex": true
	}, { "default": async ($$result) => renderTemplate`
  ${maybeRenderHead($$result)}<div class="bg-canvas-parchment py-section px-lg flex items-center justify-center min-h-[85vh]"><div class="max-w-[480px] w-full bg-white border border-hairline rounded-lg p-lg shadow-sm">${!trip ? renderTemplate`<div class="text-center py-xl"><span class="text-[48px] block mb-md">⚠️</span><h1 class="text-display-md font-display font-semibold text-ink tracking-tight mb-sm">Trip Not Found</h1><p class="text-body text-ink-muted-48 leading-relaxed mb-xl">The trip code <span class="font-mono font-semibold text-ink">${code}</span> does not exist or may have been deleted.</p><a href="/" class="bg-primary text-on-primary font-sans font-medium text-body px-xl py-md rounded-pill hover:bg-primary-focus active:scale-95 transition-all inline-block">Go Back Home</a></div>` : renderTemplate`<div><!-- Header --><div class="mb-lg text-center md:text-left"><span class="text-primary font-semibold tracking-wide uppercase text-caption-strong mb-xxs block">You've Been Invited</span><h1 class="text-display-md font-display font-semibold text-ink tracking-tight mb-xxs">Join ${trip.name}</h1><p class="text-caption text-ink-muted-48 leading-relaxed">Identify yourself to split expenses, log payments, and view settlement ledgers.</p></div><!-- Section A: Register New Name --><div class="mb-xl"><h3 class="text-body-strong text-ink font-semibold mb-sm">New to the Trip?</h3><form id="join-register-form" class="space-y-sm"><div><label for="new-member-name" class="sr-only">Your Name</label><input type="text" id="new-member-name" name="name" placeholder="Enter your name" required maxlength="30" class="w-full bg-canvas text-ink font-sans text-body border border-hairline rounded-pill px-lg py-[12px] focus:outline-none focus:border-primary placeholder:text-zinc-300"></div><button type="submit" id="register-btn" class="w-full bg-primary text-on-primary font-sans font-medium text-body py-[12px] rounded-pill hover:bg-primary-focus active:scale-95 transition-all select-none cursor-pointer">Register & Join Trip</button></form><p id="register-error" class="hidden text-caption text-red-600 mt-xs"></p></div><!-- Divider -->${members.length > 0 && renderTemplate`<div class="relative flex py-sm items-center mb-lg"><div class="flex-grow border-t border-hairline"></div><span class="flex-shrink mx-md text-fine-print text-ink-muted-48 uppercase tracking-widest font-semibold">Or</span><div class="flex-grow border-t border-hairline"></div></div>`}<!-- Section B: Claim Existing Unclaimed Name -->${members.length > 0 && renderTemplate`<div><h3 class="text-body-strong text-ink font-semibold mb-sm">Are you already on the list?</h3><p class="text-caption text-ink-muted-48 mb-md leading-relaxed">Click your name below to claim your dashboard session.</p><div class="grid grid-cols-2 gap-sm" id="unclaimed-members-list">${members.map((member) => renderTemplate`<button type="button"${addAttribute(member.id, "data-member-id")}${addAttribute(member.name, "data-member-name")} class="claim-member-btn text-left p-sm border border-hairline rounded-md hover:border-primary bg-surface-pearl text-ink font-medium text-caption select-none cursor-pointer transition-all active:scale-95 truncate hover:bg-white">👤 ${member.name}</button>`)}</div></div>`}</div>`}</div></div>

  <script>(function(){${defineScriptVars({
		code,
		tripName: trip?.name || ""
	})}
    const registerForm = document.getElementById('join-register-form');
    const registerBtn = document.getElementById('register-btn');
    const regError = document.getElementById('register-error');
    const unclaimedContainer = document.getElementById('unclaimed-members-list');

    // Helper: Set identity and redirect
    function selectMember(memberId) {
      // 1. Save member ID
      localStorage.setItem(\`split_yatra_member_\${code}\`, memberId);

      // 2. Add trip to local dropdown index
      const localTrips = JSON.parse(localStorage.getItem('split_yatra_trips') || '[]');
      const alreadyExists = localTrips.some((t) => t.code === code);
      if (!alreadyExists) {
        localTrips.push({ code, name: tripName });
        localStorage.setItem('split_yatra_trips', JSON.stringify(localTrips));
      }

      // 3. Redirect to dashboard
      window.location.href = \`/trip/\${code}\`;
    }

    // A. Register New Member submit event
    if (registerForm && registerBtn && regError) {
      registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        registerBtn.disabled = true;
        registerBtn.textContent = 'Joining...';
        regError.classList.add('hidden');

        const input = document.getElementById('new-member-name');
        const name = input ? input.value.trim() : '';

        try {
          const res = await fetch(\`/api/trips/\${code}/members\`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name }),
          });

          const result = await res.json();
          if (!res.ok) {
            throw new Error(result.error || 'Failed to join trip');
          }

          const { member } = result;
          selectMember(member.id);
        } catch (error) {
          registerBtn.disabled = false;
          registerBtn.textContent = 'Register & Join Trip';
          regError.textContent = error.message || 'An unexpected error occurred';
          regError.classList.remove('hidden');
        }
      });
    }

    // B. Claim Member click event
    if (unclaimedContainer) {
      unclaimedContainer.addEventListener('click', (e) => {
        const btn = (e.target).closest('.claim-member-btn');
        if (!btn) return;

        const memberId = btn.getAttribute('data-member-id');
        if (memberId) {
          selectMember(memberId);
        }
      });
    }
  })();<\/script>` })}`;
}, "D:/project/SplitYaar/src/pages/trip/[code]/join.astro", void 0);
var $$file = "D:/project/SplitYaar/src/pages/trip/[code]/join.astro";
var $$url = "/trip/[code]/join";
//#endregion
//#region \0virtual:astro:page:src/pages/trip/[code]/join@_@astro
var page = () => join_exports;
//#endregion
export { page };
