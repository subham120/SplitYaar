import { useState } from 'react';
import { Copy, Check, QrCode, MessageCircle } from 'lucide-react';
import { formatCurrency } from '../lib/formatters';

export default function TotalSpendCard({ expenses = [], members = [], code, tripName, onShowQr }) {
  const [copied, setCopied] = useState(false);

  const totalPaise = expenses.reduce((sum, e) => sum + (e.amountPaise || 0), 0);
  const inviteUrl = `${window.location.origin}/join/${code}`;

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsApp = () => {
    const title = tripName ? `"${tripName}"` : 'our trip';
    const text = encodeURIComponent(
      `Join ${title} on SplitYaar!\nTrack and split group expenses with us:\n${inviteUrl}`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-xs border border-gray-100 animate-fade-in">
      <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
        Total Trip Spend
      </div>

      <div className="text-4xl sm:text-5xl font-extrabold text-gray-900 tracking-tight my-1.5">
        {formatCurrency(totalPaise).replace('.00', '')}
      </div>

      <div className="text-xs text-gray-400 font-medium">
        Split among {members.length} {members.length === 1 ? 'member' : 'members'} · {expenses.length} {expenses.length === 1 ? 'expense' : 'expenses'}
      </div>

      <hr className="my-5 border-gray-100" />

      <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3">
        Invite Friends
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        <button
          onClick={handleCopyLink}
          className="inline-flex items-center justify-center gap-2 py-2.5 px-3 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-semibold transition-colors"
          style={{ border: 'none', cursor: 'pointer' }}
        >
          {copied ? (
            <>
              <Check size={14} className="text-emerald-600" />
              <span className="text-emerald-700">Copied!</span>
            </>
          ) : (
            <>
              <Copy size={14} className="text-gray-600" />
              <span>Copy Link</span>
            </>
          )}
        </button>

        <button
          onClick={onShowQr}
          className="inline-flex items-center justify-center gap-2 py-2.5 px-3 rounded-full bg-[#0071e3] hover:bg-[#0077ed] text-white text-xs font-semibold shadow-xs transition-colors"
          style={{ border: 'none', cursor: 'pointer' }}
        >
          <QrCode size={14} />
          <span>Scan QR</span>
        </button>

        <button
          onClick={handleWhatsApp}
          className="inline-flex items-center justify-center gap-2 py-2.5 px-3 rounded-full bg-[#25D366] hover:bg-[#20bd5a] text-white text-xs font-semibold shadow-xs transition-colors"
          style={{ border: 'none', cursor: 'pointer' }}
        >
          <MessageCircle size={14} />
          <span>WhatsApp</span>
        </button>
      </div>
    </div>
  );
}
