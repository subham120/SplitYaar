import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Plus,
  ArrowRight,
  KeyRound,
  Zap,
  TrendingDown,
  QrCode,
  Smartphone,
  ShieldCheck,
} from 'lucide-react';

export default function Home() {
  const navigate = useNavigate();
  const [joinCode, setJoinCode] = useState('');
  const [showJoinInput, setShowJoinInput] = useState(false);

  const handleJoin = (e) => {
    e.preventDefault();
    if (joinCode.trim()) {
      navigate(`/join/${joinCode.trim().toUpperCase()}`);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f5f7] flex flex-col justify-between">
      {/* ─── Top Hero Section ─── */}
      <section className="pt-16 pb-16 px-6 sm:px-10 lg:px-16 text-center max-w-[1440px] mx-auto w-full">

        <h1 className="text-3xl sm:text-5xl lg:text-[52px] font-extrabold text-gray-900 tracking-tight leading-tight max-w-5xl mx-auto m-0">
          Built for how Indian groups spend.
        </h1>

        <p className="text-base sm:text-xl text-gray-500 max-w-3xl mx-auto mt-5 leading-relaxed font-normal">
          Forget spreadsheets and typing manually on WhatsApp.
          <br className="hidden sm:inline" />
          {' '}SplitYaar settles debts with the absolute minimum number of payments.
        </p>

        {/* Action Buttons & Join Code */}
        <div className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-3.5">
          <Link
            to="/create"
            className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full bg-[#0071e3] hover:bg-[#0077ed] text-white text-base font-semibold shadow-xs transition-all hover:shadow-md active:scale-[0.99] no-underline"
          >
            <Plus size={18} />
            <span>Create Free Trip</span>
          </Link>

          {!showJoinInput ? (
            <button
              onClick={() => setShowJoinInput(true)}
              className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full bg-white hover:bg-gray-50 text-gray-800 text-base font-semibold border border-gray-200/90 shadow-xs hover:border-gray-300 transition-all"
              style={{ cursor: 'pointer' }}
            >
              <KeyRound size={16} className="text-gray-500" />
              <span>Enter Trip Code</span>
            </button>
          ) : (
            <form onSubmit={handleJoin} className="flex items-center gap-2 animate-scale-in">
              <input
                type="text"
                placeholder="TRIP CODE"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                className="px-5 py-3 rounded-full bg-white border border-gray-300 text-base font-mono tracking-widest text-center text-gray-900 uppercase focus:outline-none focus:border-[#0071e3] w-40 shadow-xs"
                maxLength={10}
                autoFocus
              />
              <button
                type="submit"
                className="p-3 rounded-full bg-[#0071e3] hover:bg-[#0077ed] text-white transition-colors shadow-xs"
                style={{ border: 'none', cursor: 'pointer' }}
                title="Join"
              >
                <ArrowRight size={18} />
              </button>
            </form>
          )}
        </div>

        {/* ─── 3 Feature Cards ─── */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 text-left w-full">
          {/* Card 1 */}
          <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] transition-all hover:-translate-y-1 flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-500 mb-5">
                <Zap size={24} />
              </div>
              <h3 className="text-lg font-bold text-gray-900 m-0">
                Log in 15 seconds
              </h3>
              <p className="text-sm text-gray-500 leading-relaxed mt-3 mb-0">
                No account creation needed. Open the link, type the details, select who paid, and add it. Keep the flow smooth.
              </p>
            </div>
          </div>

          {/* Card 2 */}
          <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] transition-all hover:-translate-y-1 flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-pink-50 border border-pink-100 flex items-center justify-center text-pink-500 mb-5">
                <TrendingDown size={24} />
              </div>
              <h3 className="text-lg font-bold text-gray-900 m-0">
                Greedy Debt Settlement
              </h3>
              <p className="text-sm text-gray-500 leading-relaxed mt-3 mb-0">
                Our algorithm simplifies payments so that no matter how many transactions occur, everyone settles up in at most N-1 transactions.
              </p>
            </div>
          </div>

          {/* Card 3 */}
          <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] transition-all hover:-translate-y-1 flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-500 mb-5">
                <QrCode size={24} />
              </div>
              <h3 className="text-lg font-bold text-gray-900 m-0">
                UPI Integrated
              </h3>
              <p className="text-sm text-gray-500 leading-relaxed mt-3 mb-0">
                Scan a QR code or tap to open UPI apps (GPay, PhonePe, Paytm) directly with amount and notes pre-filled. Settle instantly.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Designed With Privacy (Dark Section) ─── */}
      <section className="bg-[#121214] text-white py-24 px-6 sm:px-10 lg:px-16 mt-12 w-full">
        <div className="max-w-[1440px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* Left info column */}
          <div className="lg:col-span-7">
            <span className="text-xs font-bold uppercase tracking-wider text-[#38bdf8] block mb-3">
              DESIGNED WITH PRIVACY
            </span>
            <h2 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-tight m-0">
              Your expense history is yours.
            </h2>
            <p className="text-base sm:text-lg text-gray-400 leading-relaxed mt-6 max-w-xl m-0 font-normal">
              SplitYaar does not save cookie profiles, track browser behavior, or ask for email contacts. All transaction logs are kept private to your trip's shared invite code.
            </p>
            <div className="mt-9">
              <Link
                to="/create"
                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full bg-[#0071e3] hover:bg-[#0077ed] text-white text-base font-semibold shadow-sm transition-all no-underline"
              >
                <Plus size={18} />
                <span>Create Free Trip</span>
              </Link>
            </div>
          </div>

          {/* Right UPI QR Illustration Mockup column */}
          <div className="lg:col-span-5 flex justify-center lg:justify-end">
            <div className="bg-[#1c1c1e] border border-white/10 rounded-3xl p-8 sm:p-10 max-w-sm w-full flex flex-col items-center justify-center text-center shadow-2xl relative overflow-hidden">
              {/* Subtle ambient lighting */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-[#0071e3]/15 rounded-full blur-3xl pointer-events-none" />

              {/* Subtle QR Illustration Box (non-scannable illustration) */}
              <div className="relative z-10 w-44 h-44 rounded-2xl bg-gradient-to-b from-white/10 to-white/5 border border-white/15 flex flex-col items-center justify-center shadow-inner">
                {/* Viewfinder corner brackets */}
                <div className="absolute top-2.5 left-2.5 w-3.5 h-3.5 border-t-2 border-l-2 border-[#38bdf8]/60 rounded-tl-xs" />
                <div className="absolute top-2.5 right-2.5 w-3.5 h-3.5 border-t-2 border-r-2 border-[#38bdf8]/60 rounded-tr-xs" />
                <div className="absolute bottom-2.5 left-2.5 w-3.5 h-3.5 border-b-2 border-l-2 border-[#38bdf8]/60 rounded-bl-xs" />
                <div className="absolute bottom-2.5 right-2.5 w-3.5 h-3.5 border-b-2 border-r-2 border-[#38bdf8]/60 rounded-br-xs" />

                {/* Subtle QR Code Icon Illustration */}
                <div className="w-20 h-20 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-300 shadow-sm">
                  <QrCode size={52} strokeWidth={1.5} className="text-gray-200" />
                </div>

                <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mt-2.5">
                  UPI QR Settle
                </span>
              </div>

              <h4 className="text-base font-bold text-white mt-6 mb-1 relative z-10">
                Scan to Settle Up
              </h4>
              <p className="text-xs text-gray-400 m-0 relative z-10">
                Direct UPI transfer · 0% fee
              </p>

              <div className="mt-4 flex items-center justify-center gap-2 relative z-10">
                <span className="text-[10px] text-gray-400 bg-white/5 border border-white/10 px-2 py-0.5 rounded-md font-medium">
                  GPay
                </span>
                <span className="text-[10px] text-gray-400 bg-white/5 border border-white/10 px-2 py-0.5 rounded-md font-medium">
                  PhonePe
                </span>
                <span className="text-[10px] text-gray-400 bg-white/5 border border-white/10 px-2 py-0.5 rounded-md font-medium">
                  Paytm
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── White Footer Section ─── */}
      <footer className="bg-white border-t border-gray-200/80 py-16 px-6 sm:px-10 lg:px-16 w-full">
        <div className="max-w-[1440px] mx-auto grid grid-cols-1 md:grid-cols-3 gap-12">
          {/* Column 1: Brand */}
          <div>
            <h5 className="text-sm font-bold text-gray-900 uppercase tracking-wider m-0">
              SplitYaar
            </h5>
            <p className="text-xs text-gray-500 leading-relaxed mt-3.5 m-0 max-w-sm">
              A premium, privacy-focused expense splitter built for Indian roommate groups and travelers. No accounts, no ads, no trackers.
            </p>
          </div>

          {/* Column 2: Features */}
          <div>
            <h5 className="text-sm font-bold text-gray-900 uppercase tracking-wider m-0">
              Features
            </h5>
            <ul className="mt-3.5 space-y-2.5 list-none p-0 m-0 text-xs text-gray-600">
              <li className="flex items-center gap-2">
                <Zap size={14} className="text-amber-500 shrink-0" />
                <span>Greedy Debt Simplification</span>
              </li>
              <li className="flex items-center gap-2">
                <Smartphone size={14} className="text-blue-500 shrink-0" />
                <span>Mobile-first Interface</span>
              </li>
              <li className="flex items-center gap-2">
                <QrCode size={14} className="text-emerald-500 shrink-0" />
                <span>UPI Auto Pay & QR Codes</span>
              </li>
              <li className="flex items-center gap-2">
                <ShieldCheck size={14} className="text-indigo-500 shrink-0" />
                <span>Privacy First (Zero Login)</span>
              </li>
            </ul>
          </div>

          {/* Column 3: Instructions */}
          <div>
            <h5 className="text-sm font-bold text-gray-900 uppercase tracking-wider m-0">
              Instructions
            </h5>
            <p className="text-xs text-gray-500 leading-relaxed mt-3.5 m-0 max-w-sm">
              Create a trip, add friend names, and log expenses. Share the private trip code with your group. Settle up seamlessly via GPay, PhonePe, or Paytm.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
