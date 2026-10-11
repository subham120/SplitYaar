import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Loader2, ArrowRight, ExternalLink, Check, RotateCcw, CheckCircle2, HandCoins } from 'lucide-react';
import { tripApi } from '../lib/api';
import { getIdentity } from '../lib/identity';
import { formatCurrency, formatDate, todayISO, buildUpiLink } from '../lib/formatters';
import SubNav from '../components/SubNav';
import QrCodeModal from '../components/QrCodeModal';

export default function SettleUp() {
  const { code } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [settling, setSettling] = useState(null);
  const [settleLoading, setSettleLoading] = useState(false);
  const [showUpiQr, setShowUpiQr] = useState(null);
  const [settled, setSettled] = useState(new Set());
  const [error, setError] = useState('');

  const identity = getIdentity(code);

  useEffect(() => { loadData(); }, [code]);

  const loadData = async () => {
    try {
      const res = await tripApi.get(code);
      setData(res.data);
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load group details');
    } finally {
      setLoading(false);
    }
  };

  const getMemberName = (id) => data?.members?.find((m) => m._id === id)?.name || 'Unknown';
  const getMember = (id) => data?.members?.find((m) => m._id === id);

  const handleSettle = async (txn) => {
    setSettleLoading(true);
    setError('');
    try {
      await tripApi.createSettlement(code, {
        fromMemberId: txn.fromMemberId,
        toMemberId: txn.toMemberId,
        amountPaise: txn.amountPaise,
        date: todayISO(),
      });
      setSettled((prev) => new Set([...prev, `${txn.fromMemberId}-${txn.toMemberId}`]));
      setSettling(null);
      loadData();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to record settlement');
    } finally {
      setSettleLoading(false);
    }
  };

  const handleRevertSettlement = async (settlementId) => {
    if (!confirm('Revert this settlement and restore the balance?')) return;
    try {
      await tripApi.deleteSettlement(code, settlementId);
      loadData();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to revert settlement');
    }
  };

  const handleUpiPay = (txn) => {
    const toMember = getMember(txn.toMemberId);
    if (toMember?.upiId) {
      const upiLink = buildUpiLink(toMember.upiId, toMember.name, txn.amountPaise, `SplitYaar: ${data.trip.name}`);
      setShowUpiQr(upiLink);
    }
  };

  if (loading || !data) {
    return (
      <>
        <SubNav trip={null} code={code} />
        <div className="flex justify-center items-center min-h-[40vh]">
          <Loader2 size={24} className="animate-spin" color="var(--color-primary)" />
        </div>
      </>
    );
  }

  const debts = data.simplifiedDebts || [];
  const allSettled = debts.length === 0;

  return (
    <>
      <SubNav trip={data.trip} code={code} />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-4">
        <h2 className="text-xl font-bold text-ink animate-fade-in flex items-center gap-2">
          <HandCoins size={20} className="text-[#0071e3]" />
          <span>Settle Up</span>
        </h2>

        {error && (
          <div className="pill pill-negative py-2.5 px-4 w-full text-sm animate-shake">{error}</div>
        )}

        {allSettled ? (
          <div className="card p-8 text-center animate-fade-in-up">
            <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto mb-3 text-emerald-600">
              <CheckCircle2 size={36} />
            </div>
            <h3 className="text-lg font-semibold text-ink mb-1">All Settled!</h3>
            <p className="text-sm text-ink-muted-48">Everyone is square. No payments needed.</p>
          </div>
        ) : (
          <>
            <p className="text-sm text-ink-muted-48 animate-fade-in">
              Simplified to {debts.length} {debts.length === 1 ? 'payment' : 'payments'}
            </p>

            <div className="space-y-3 stagger-children">
              {debts.map((txn, i) => {
                const txnKey = `${txn.fromMemberId}-${txn.toMemberId}`;
                const isSettled = settled.has(txnKey);
                const fromName = getMemberName(txn.fromMemberId);
                const toName = getMemberName(txn.toMemberId);
                const toMember = getMember(txn.toMemberId);
                const isPayer = txn.fromMemberId === identity?.memberId;
                const isPayee = txn.toMemberId === identity?.memberId;

                return (
                  <div key={i} className="card overflow-hidden">
                    <div className="flex items-center justify-between p-4">
                      <div className="flex items-center gap-2">
                        {/* From avatar */}
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold text-white shrink-0"
                          style={{ background: `hsl(${fromName.charCodeAt(0) * 37 % 360}, 55%, 52%)` }}
                        >
                          {fromName.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-sm text-ink font-medium">
                          {fromName} {isPayer && <span className="text-xs text-ink-muted-48">(You)</span>}
                        </span>

                        <ArrowRight size={14} color="var(--color-ink-muted-48)" />

                        {/* To avatar */}
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold text-white shrink-0"
                          style={{ background: `hsl(${toName.charCodeAt(0) * 37 % 360}, 55%, 52%)` }}
                        >
                          {toName.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-sm text-ink font-medium">
                          {toName} {isPayee && <span className="text-xs text-ink-muted-48">(You)</span>}
                        </span>
                      </div>

                      <span className="text-lg font-bold text-ink shrink-0">
                        {formatCurrency(txn.amountPaise)}
                      </span>
                    </div>

                    {/* Action buttons */}
                    {!isSettled && (
                      <div className="flex flex-col sm:flex-row gap-2 px-4 pb-3">
                        {toMember?.upiId && (
                          <button
                            onClick={() => handleUpiPay(txn)}
                            className="btn-primary flex-1 text-sm py-2"
                          >
                            <ExternalLink size={14} /> Pay via UPI
                          </button>
                        )}

                        {/* ONLY the payee (receiver) can confirm receipt */}
                        {isPayee ? (
                          <button
                            onClick={() => settling === i ? handleSettle(txn) : setSettling(i)}
                            disabled={settleLoading}
                            className="btn-secondary flex-1 text-sm py-2"
                          >
                            {settleLoading && settling === i ? (
                              <Loader2 size={14} className="animate-spin" />
                            ) : settling === i ? (
                              <><Check size={14} /> Confirm Received</>
                            ) : (
                              'Mark as Received'
                            )}
                          </button>
                        ) : (
                          <div className="flex-1 flex items-center justify-center text-xs text-ink-muted-48 py-2 px-3 bg-canvas-parchment rounded-lg text-center">
                            {isPayer
                              ? `Waiting for ${toName} to confirm receipt`
                              : `Only ${toName} can confirm payment`}
                          </div>
                        )}
                      </div>
                    )}

                    {isSettled && (
                      <div className="px-4 pb-3">
                        <span className="pill pill-positive text-sm py-1 px-3 inline-flex items-center gap-1.5">
                          <Check size={14} /> Settled
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Past settlements */}
        {data.settlements?.length > 0 && (
          <div className="mt-8">
            <h3 className="text-sm font-semibold text-ink-muted-48 uppercase tracking-wider mb-3">
              Settlement History
            </h3>
            <div className="card overflow-hidden divide-y divide-divider-soft">
              {data.settlements.map((s) => (
                <div key={s._id} className="flex items-center justify-between px-4 py-3">
                  <div className="text-sm">
                    <span className="font-medium text-ink">{getMemberName(s.fromMemberId)}</span>
                    <span className="text-ink-muted-48"> paid </span>
                    <span className="font-medium text-ink">{getMemberName(s.toMemberId)}</span>
                    <span className="text-xs text-ink-muted-48 block">{formatDate(s.date)}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-positive">{formatCurrency(s.amountPaise)}</span>
                    <button
                      onClick={() => handleRevertSettlement(s._id)}
                      className="p-1.5 rounded hover:bg-canvas-parchment text-ink-muted-48 hover:text-negative transition-colors"
                      title="Revert settlement"
                      style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                    >
                      <RotateCcw size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* UPI QR Modal */}
      {showUpiQr && (
        <QrCodeModal
          title="Pay via UPI"
          value={showUpiQr}
          subtitle="Scan with GPay, PhonePe, or Paytm"
          onClose={() => setShowUpiQr(null)}
        />
      )}
    </>
  );
}
