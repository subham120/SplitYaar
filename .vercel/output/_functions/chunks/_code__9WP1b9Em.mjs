import { t as __exportAll } from "./rolldown-runtime_D7D4PA-g.mjs";
import { C as createAstro, _ as addAttribute, a as renderComponent, d as renderTemplate, h as maybeRenderHead, v as defineScriptVars, w as createComponent } from "./server_Ck1Ey-Cv.mjs";
import "./compiler_DXTdqtzG.mjs";
import { a as getTripByCode, u as computeNetBalances } from "./store_hUDrmsS2.mjs";
import { t as $$Layout } from "./Layout_pPVGDrUr.mjs";
import { n as formatISTDate, r as $$SubNav, t as formatINR } from "./format_JJ_MKMuP.mjs";
//#region src/pages/trip/[code].astro
var _code__exports = /* @__PURE__ */ __exportAll({
	default: () => $$Code,
	file: () => $$file,
	url: () => $$url
});
createAstro("https://astro.build");
var $$Code = createComponent(async ($$result, $$props, $$slots) => {
	const Astro = $$result.createAstro($$props, $$slots);
	Astro.self = $$Code;
	const { code } = Astro.params;
	if (!code) return Astro.redirect("/");
	const tripData = await getTripByCode(code);
	if (!tripData) return Astro.redirect("/trip/new");
	const { trip, members, expenses, shares } = tripData;
	const netBalances = computeNetBalances(members, expenses, shares);
	const totalSpendPaise = expenses.reduce((acc, curr) => acc + curr.amountPaise, 0);
	const recentExpenses = [...expenses].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);
	return renderTemplate`${renderComponent($$result, "Layout", $$Layout, {
		"title": `${trip.name} Dashboard — SplitYatra`,
		"noindex": true
	}, { "default": async ($$result) => renderTemplate`
  
  <script>(function(){${defineScriptVars({ code })}
    if (!localStorage.getItem(\`split_yatra_member_\${code}\`)) {
      window.location.replace(\`/trip/\${code}/join\`);
    }
  })();<\/script>${renderComponent($$result, "SubNav", $$SubNav, {
		"code": code,
		"activeTab": "dashboard",
		"tripName": trip.name
	})}

  ${maybeRenderHead($$result)}<div class="bg-canvas-parchment min-h-[90vh] pb-[100px] sm:pb-xxl"><div class="max-w-[1440px] w-full mx-auto px-lg pt-lg grid grid-cols-1 lg:grid-cols-3 gap-lg"><!-- Left 2 Columns: Overall & Members --><div class="lg:col-span-2 space-y-lg"><!-- Invite & Overall Spend Card --><div class="bg-white border border-hairline rounded-lg p-lg shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-md"><div><span class="text-caption text-ink-muted-48 uppercase tracking-wider font-semibold">Total Trip Spend</span><div class="text-display-lg font-display text-ink font-semibold tracking-tight leading-none mt-[4px]">${formatINR(totalSpendPaise)}</div><p class="text-caption text-ink-muted-48 mt-[6px]">Split among ${members.length} member${members.length === 1 ? "" : "s"}.</p></div><div class="w-full md:w-auto bg-surface-pearl border border-hairline rounded-md p-sm flex items-center justify-between gap-md max-w-sm"><div class="truncate"><span class="text-[11px] uppercase text-ink-muted-48 block font-semibold">Share Trip Link</span><span class="font-mono text-caption text-ink font-semibold truncate block select-all" id="share-link-text">...loading...</span></div><button id="share-invite-btn" class="bg-primary text-on-primary text-[12px] font-sans font-medium px-md py-xs rounded-pill hover:bg-primary-focus active:scale-95 transition-all select-none cursor-pointer shrink-0">Share</button></div></div><!-- Personal Balance Banner (Hydrated on Client) --><div id="personal-balance-card" class="bg-white border border-hairline rounded-lg p-lg shadow-sm animate-pulse"><div class="h-16 bg-zinc-100 rounded-md"></div></div><!-- Group Member Ledger --><div class="bg-white border border-hairline rounded-lg p-lg shadow-sm"><h2 class="text-body-strong font-semibold text-ink mb-md">Trip Ledger</h2><div class="space-y-sm">${netBalances.map((mBal) => {
		const member = members.find((m) => m.id === mBal.memberId);
		const name = member ? member.name : "Unknown";
		const upi = member?.upiId;
		let balText = "";
		let balClass = "text-ink-muted-48";
		if (mBal.netBalancePaise > 0) {
			balText = `is owed ${formatINR(mBal.netBalancePaise)}`;
			balClass = "text-green-600 font-semibold";
		} else if (mBal.netBalancePaise < 0) {
			balText = `owes ${formatINR(Math.abs(mBal.netBalancePaise))}`;
			balClass = "text-red-500 font-semibold";
		} else balText = "is settled up";
		return renderTemplate`<div class="member-ledger-row flex items-center justify-between p-sm border-b border-divider-soft last:border-0 hover:bg-surface-pearl rounded-sm transition-colors"${addAttribute(mBal.memberId, "data-member-id")}><div class="truncate pr-sm"><span class="text-body-strong text-ink font-semibold flex items-center gap-xs"><span class="truncate">${name}</span><span class="member-you-badge hidden text-fine-print bg-primary text-white px-xs py-[2px] rounded-xs text-[10px]">You</span></span>${upi && renderTemplate`<span class="text-caption text-ink-muted-48 block truncate">upi: ${upi}</span>`}</div><div class="text-right shrink-0"><div${addAttribute(balClass, "class")}>${balText}</div><div class="text-fine-print text-ink-muted-48">Paid: ${formatINR(mBal.totalPaidPaise)} &middot; Share: ${formatINR(mBal.totalOwedPaise)}</div></div></div>`;
	})}</div></div></div><!-- Right Column: Recent Expenses --><div class="space-y-lg"><div class="bg-white border border-hairline rounded-lg p-lg shadow-sm flex flex-col justify-between min-h-[350px]"><div><div class="flex items-center justify-between mb-lg"><h2 class="text-body-strong font-semibold text-ink">Recent Expenses</h2><a${addAttribute(`/trip/${code}/history`, "href")} class="text-primary text-caption hover:underline">View All</a></div>${recentExpenses.length === 0 ? renderTemplate`<div class="text-center py-xl text-ink-muted-48 flex flex-col items-center"><span class="text-[44px] mb-xs">💸</span><p class="text-caption">No expenses recorded yet.</p><a${addAttribute(`/trip/${code}/expense/new`, "href")} class="text-primary text-caption mt-sm font-semibold hover:underline">Add your first expense</a></div>` : renderTemplate`<div class="space-y-md">${recentExpenses.map((exp) => {
		const payer = members.find((m) => m.id === exp.paidByMemberId);
		const payerName = payer ? payer.name : "Unknown";
		return renderTemplate`<a${addAttribute(`/trip/${code}/expense/${exp.id}/edit`, "href")} class="flex items-center justify-between p-sm border border-hairline hover:border-primary rounded-md bg-surface-pearl text-left transition-all active:scale-98 select-none"><div class="truncate pr-sm"><span class="text-caption-strong text-ink font-semibold block truncate">${exp.description}</span><span class="text-fine-print text-ink-muted-48 block">Paid by ${payerName} &middot; ${formatISTDate(exp.date)}</span><!-- Category Tag --><span class="inline-block text-[9px] uppercase font-bold tracking-wider px-[6px] py-[2px] rounded-xs mt-[4px] bg-zinc-200 text-ink-muted-80 font-sans">${exp.category}</span></div><div class="text-body-strong text-ink font-semibold shrink-0">${formatINR(exp.amountPaise)}</div></a>`;
	})}</div>`}</div><!-- Add Expense Button (Desktop version) --><a${addAttribute(`/trip/${code}/expense/new`, "href")} class="hidden sm:block text-center bg-primary text-on-primary font-sans font-medium text-body w-full py-[12px] rounded-pill hover:bg-primary-focus active:scale-95 transition-all select-none cursor-pointer mt-lg">+ Add Expense</a></div></div></div></div>

  
  <div class="sm:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-[90%] max-w-[340px]"><a${addAttribute(`/trip/${code}/expense/new`, "href")} class="flex items-center justify-center gap-xs bg-primary text-on-primary font-sans font-semibold text-body py-[14px] rounded-pill shadow-xl active:scale-95 transition-all select-none cursor-pointer text-center"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"></path><path d="M12 5v14"></path></svg>Add Expense</a></div>

  
  <script>(function(){${defineScriptVars({
		code,
		netBalances,
		members
	})}
    // Resolve identity
    const currentMemberId = localStorage.getItem(\`split_yatra_member_\${code}\`);
    
    // Set share link text
    const linkEl = document.getElementById('share-link-text');
    if (linkEl) {
      linkEl.textContent = \`\${window.location.origin}/trip/\${code}\`;
    }

    // WhatsApp invite share integration
    const shareBtn = document.getElementById('share-invite-btn');
    if (shareBtn) {
      shareBtn.addEventListener('click', () => {
        const text = encodeURIComponent(
          \`Hey! Join our expense ledger on SplitYatra to split our bills: \${window.location.origin}/trip/\${code} (Code: \${code})\`
        );
        window.open(\`https://api.whatsapp.com/send?text=\${text}\`, '_blank');
      });
    }

    // Hydrate 'You' badges in Ledger list
    if (currentMemberId) {
      const rows = document.querySelectorAll('.member-ledger-row');
      rows.forEach((row) => {
        if (row.getAttribute('data-member-id') === currentMemberId) {
          const badge = row.querySelector('.member-you-badge');
          if (badge) badge.classList.remove('hidden');
        }
      });
    }

    // Hydrate Personalized Balance Hero Card
    const personalCard = document.getElementById('personal-balance-card');
    if (personalCard && currentMemberId) {
      const myBal = netBalances.find((b) => b.memberId === currentMemberId);
      const myMember = members.find((m) => m.id === currentMemberId);
      const myName = myMember ? myMember.name : 'User';

      let markup = '';

      if (!myBal || myBal.netBalancePaise === 0) {
        markup = \`
          <div class="flex items-center gap-md">
            <span class="text-[36px]">🎉</span>
            <div>
              <span class="text-caption text-ink-muted-48 uppercase font-semibold">Hey \${myName}</span>
              <h3 class="text-body-strong font-semibold text-ink text-[19px]">You are all settled up!</h3>
              <p class="text-caption text-ink-muted-48">Everything splits cleanly back to zero.</p>
            </div>
          </div>
        \`;
      } else if (myBal.netBalancePaise > 0) {
        // Format manually for Client
        const rupees = (myBal.netBalancePaise / 100);
        const amtStr = new Intl.NumberFormat('en-IN', {
          style: 'currency',
          currency: 'INR',
          minimumFractionDigits: myBal.netBalancePaise % 100 === 0 ? 0 : 2
        }).format(rupees);

        markup = \`
          <div class="flex items-center gap-md bg-green-50 border border-green-200 rounded-md p-md">
            <span class="text-[36px]">📈</span>
            <div>
              <span class="text-caption text-green-700 uppercase font-semibold">Hey \${myName}</span>
              <h3 class="text-display-md text-green-600 font-semibold leading-none tracking-tight my-[4px]">\${amtStr}</h3>
              <p class="text-caption text-green-800">is owed to you overall from this trip.</p>
            </div>
          </div>
        \`;
      } else {
        const rupees = Math.abs(myBal.netBalancePaise / 100);
        const amtStr = new Intl.NumberFormat('en-IN', {
          style: 'currency',
          currency: 'INR',
          minimumFractionDigits: myBal.netBalancePaise % 100 === 0 ? 0 : 2
        }).format(rupees);

        markup = \`
          <div class="flex items-center gap-md bg-red-50 border border-red-200 rounded-md p-md">
            <span class="text-[36px]">📉</span>
            <div>
              <span class="text-caption text-red-700 uppercase font-semibold">Hey \${myName}</span>
              <h3 class="text-display-md text-red-500 font-semibold leading-none tracking-tight my-[4px]">\${amtStr}</h3>
              <p class="text-caption text-red-800">is what you owe overall to settle up.</p>
            </div>
          </div>
        \`;
      }

      personalCard.className = "bg-white border border-hairline rounded-lg p-lg shadow-sm";
      personalCard.innerHTML = markup;
    }
  })();<\/script>` })}`;
}, "D:/project/SplitYaar/src/pages/trip/[code].astro", void 0);
var $$file = "D:/project/SplitYaar/src/pages/trip/[code].astro";
var $$url = "/trip/[code]";
//#endregion
//#region \0virtual:astro:page:src/pages/trip/[code]@_@astro
var page = () => _code__exports;
//#endregion
export { page };
