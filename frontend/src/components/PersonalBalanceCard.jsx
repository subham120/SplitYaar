import { PartyPopper, Coins, TrendingDown } from 'lucide-react';
import { formatCurrency } from '../lib/formatters';

export default function PersonalBalanceCard({ memberName, balance }) {
  if (!balance) return null;

  const net = balance.netBalancePaise;
  const isSettled = net === 0;
  const isPositive = net > 0;

  if (isSettled) {
    return (
      <div className="bg-[#ecfdf5] border border-[#a7f3d0] rounded-2xl p-4 flex items-center gap-4 animate-fade-in shadow-xs">
        <div className="w-11 h-11 rounded-full bg-[#d1fae5] text-emerald-700 flex items-center justify-center shrink-0">
          <PartyPopper size={22} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">
              Hey {memberName}
            </span>
            <span className="bg-[#a7f3d0] text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
              Settled
            </span>
          </div>
          <h4 className="text-sm sm:text-base font-bold text-gray-900 m-0">
            You are all settled up!
          </h4>
          <p className="text-xs text-gray-500 m-0 mt-0.5">
            Everything splits cleanly back to zero.
          </p>
        </div>
      </div>
    );
  }

  if (isPositive) {
    return (
      <div className="bg-[#f0fdf4] border border-[#bbf7d0] rounded-2xl p-4 flex items-center gap-4 animate-fade-in shadow-xs">
        <div className="w-11 h-11 rounded-full bg-[#dcfce7] text-emerald-700 flex items-center justify-center shrink-0">
          <Coins size={22} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">
              Hey {memberName}
            </span>
            <span className="bg-[#bbf7d0] text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
              Owed
            </span>
          </div>
          <h4 className="text-sm sm:text-base font-bold text-gray-900 m-0">
            You are owed <span className="text-emerald-600">{formatCurrency(net)}</span>
          </h4>
          <p className="text-xs text-gray-500 m-0 mt-0.5">
            Paid: {formatCurrency(balance.totalPaidPaise)} · Your share: {formatCurrency(balance.totalOwedPaise)}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#fff1f2] border border-[#fecdd3] rounded-2xl p-4 flex items-center gap-4 animate-fade-in shadow-xs">
      <div className="w-11 h-11 rounded-full bg-[#ffe4e6] text-rose-700 flex items-center justify-center shrink-0">
        <TrendingDown size={22} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">
            Hey {memberName}
          </span>
          <span className="bg-[#fecdd3] text-rose-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
            You Owe
          </span>
        </div>
        <h4 className="text-sm sm:text-base font-bold text-gray-900 m-0">
          You owe <span className="text-rose-600">{formatCurrency(Math.abs(net))}</span>
        </h4>
        <p className="text-xs text-gray-500 m-0 mt-0.5">
          Paid: {formatCurrency(balance.totalPaidPaise)} · Your share: {formatCurrency(balance.totalOwedPaise)}
        </p>
      </div>
    </div>
  );
}
