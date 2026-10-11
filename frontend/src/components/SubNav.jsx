import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Copy, Check, LayoutDashboard, ReceiptText, Users, HandCoins } from 'lucide-react';

export default function SubNav({ trip, code }) {
  const [copied, setCopied] = useState(false);
  const location = useLocation();

  const tabs = [
    { label: 'Dashboard', path: `/trip/${code}`, icon: LayoutDashboard },
    { label: 'History', path: `/trip/${code}/history`, icon: ReceiptText },
    { label: 'Members', path: `/trip/${code}/members`, icon: Users },
    { label: 'Settle Up', path: `/trip/${code}/settle`, icon: HandCoins },
  ];

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white sticky top-12 z-40 border-b border-gray-200/80 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 py-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        {/* Group name + code pill */}
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight m-0">
            {trip?.name || 'Loading...'}
          </h1>
          <button
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded text-xs font-mono font-medium transition-colors border border-gray-200/80"
            title="Copy Trip Code"
            style={{ cursor: 'pointer' }}
          >
            <span>{code}</span>
            {copied ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} className="text-gray-400" />}
          </button>
        </div>

        {/* Apple-style segmented tab navigation */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
          {tabs.map((tab) => {
            const isActive = location.pathname === tab.path;
            const Icon = tab.icon;
            return (
              <Link
                key={tab.path}
                to={tab.path}
                className={`px-3.5 py-1.5 text-xs rounded-full whitespace-nowrap no-underline transition-all inline-flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-[#0071e3] text-white font-semibold shadow-xs'
                    : 'text-gray-500 hover:text-gray-900 font-medium'
                }`}
              >
                <Icon size={13} className={isActive ? 'text-white' : 'text-gray-400'} />
                <span>{tab.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
