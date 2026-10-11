import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { tripApi } from '../lib/api';
import { getIdentity } from '../lib/identity';
import SubNav from '../components/SubNav';
import TotalSpendCard from '../components/TotalSpendCard';
import PersonalBalanceCard from '../components/PersonalBalanceCard';
import MemberLedgerList from '../components/MemberLedgerList';
import RecentExpensesList from '../components/RecentExpensesList';
import QrCodeModal from '../components/QrCodeModal';
import MonthlySummaryModal from '../components/MonthlySummaryModal';

export default function GroupDashboard() {
  const { code } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showQr, setShowQr] = useState(false);
  const [showSummary, setShowSummary] = useState(false);

  const identity = getIdentity(code);

  const loadData = useCallback(async () => {
    try {
      const res = await tripApi.get(code);
      setData(res.data);
    } catch {
      navigate('/', { replace: true });
    } finally {
      setLoading(false);
    }
  }, [code, navigate]);

  useEffect(() => {
    const currentIdentity = getIdentity(code);
    if (!currentIdentity) {
      navigate(`/join/${code}`, { replace: true });
      return;
    }
    loadData();
  }, [code, loadData, navigate]);

  if (loading || !data) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 size={24} className="animate-spin text-[#0071e3]" />
      </div>
    );
  }

  const myBalance = data.balances?.find((b) => b.memberId === identity?.memberId);
  const inviteUrl = `${window.location.origin}/join/${code}`;

  return (
    <>
      <SubNav trip={data.trip} code={code} />

      <main className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 py-6 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column (Main Spend, Settlement Banner, Ledger) */}
          <div className="lg:col-span-8 space-y-6">
            {/* Total Trip Spend + Invite Friends */}
            <TotalSpendCard
              expenses={data.expenses}
              members={data.members}
              code={code}
              tripName={data.trip?.name}
              onShowQr={() => setShowQr(true)}
            />

            {/* Personal Settlement Banner */}
            <PersonalBalanceCard
              memberName={identity?.memberName}
              balance={myBalance}
            />

            {/* Trip Ledger with Member Balances */}
            <MemberLedgerList
              members={data.members}
              balances={data.balances}
              myMemberId={identity?.memberId}
              code={code}
            />
          </div>

          {/* Right Column (Recent Expenses + Add Expense CTA) */}
          <div className="lg:col-span-4">
            <RecentExpensesList
              expenses={data.expenses}
              members={data.members}
              code={code}
            />
          </div>
        </div>
      </main>

      {/* QR Modal */}
      {showQr && (
        <QrCodeModal
          title="Scan to Join Group"
          value={inviteUrl}
          subtitle={`Anyone who scans this QR can join "${data.trip.name}"`}
          onClose={() => setShowQr(false)}
        />
      )}

      {/* Monthly Summary Modal */}
      {showSummary && (
        <MonthlySummaryModal
          trip={data.trip}
          members={data.members}
          expenses={data.expenses}
          balances={data.balances}
          onClose={() => setShowSummary(false)}
        />
      )}
    </>
  );
}
