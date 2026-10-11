import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { formatCurrency } from '../lib/formatters';

export default function MemberLedgerList({ members = [], balances = [], myMemberId, code }) {
  const getBalance = (memberId) => {
    return balances.find((b) => b.memberId === memberId);
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-xs border border-gray-100 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-gray-100">
        <h3 className="text-sm font-bold text-gray-900 m-0">
          Trip Ledger <span className="text-gray-400 font-normal">({members.length})</span>
        </h3>
        <Link
          to={`/trip/${code}/members`}
          className="inline-flex items-center gap-1 text-xs font-semibold text-[#0071e3] hover:text-[#0077ed] bg-blue-50/80 hover:bg-blue-100/80 border border-blue-200/60 px-3 py-1 rounded-full no-underline transition-colors"
        >
          <Plus size={12} />
          <span>Add Member</span>
        </Link>
      </div>

      {/* Rows */}
      <div className="divide-y divide-gray-100">
        {members.map((member) => {
          const bal = getBalance(member._id);
          const net = bal?.netBalancePaise || 0;
          const isMe = member._id === myMemberId;

          const totalPaid = bal ? bal.totalPaidPaise : 0;
          const totalShare = bal ? bal.totalOwedPaise : 0;

          return (
            <div
              key={member._id}
              className="flex items-center justify-between py-3.5 first:pt-4 last:pb-1"
            >
              <div className="flex items-center gap-3 min-w-0">
                {/* Avatar */}
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-gray-700 bg-gray-100 border border-gray-200 shrink-0"
                >
                  {member.name.charAt(0).toUpperCase()}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-bold text-gray-900 truncate">
                      {member.name}
                    </span>
                    {isMe && (
                      <span className="bg-[#0071e3] text-white text-[10px] font-bold px-1.5 py-0.5 rounded leading-none">
                        You
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-400 font-normal mt-0.5">
                    Paid: {formatCurrency(totalPaid).replace('.00', '')}
                  </div>
                </div>
              </div>

              <div className="text-right shrink-0">
                <div
                  className={`text-xs font-bold ${
                    net === 0
                      ? 'text-gray-400'
                      : net > 0
                        ? 'text-emerald-600'
                        : 'text-rose-600'
                  }`}
                >
                  {net === 0 ? (
                    'settled up'
                  ) : net > 0 ? (
                    `+${formatCurrency(net).replace('.00', '')}`
                  ) : (
                    `-${formatCurrency(Math.abs(net)).replace('.00', '')}`
                  )}
                </div>
                <div className="text-[11px] text-gray-400 font-normal mt-0.5">
                  Paid: {formatCurrency(totalPaid).replace('.00', '')} · Share: {formatCurrency(totalShare).replace('.00', '')}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
