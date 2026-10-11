import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Loader2, ChevronDown, ChevronUp, AlertCircle, Search, Pencil } from 'lucide-react';
import { tripApi } from '../lib/api';
import { getIdentity } from '../lib/identity';
import { formatCurrency, formatDate, CATEGORIES } from '../lib/formatters';
import SubNav from '../components/SubNav';
import CategoryIcon from '../components/CategoryIcon';

export default function ExpenseHistory() {
  const { code } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [payerFilter, setPayerFilter] = useState('all');
  const [expandedId, setExpandedId] = useState(null);
  const [error, setError] = useState('');

  const identity = getIdentity(code);

  useEffect(() => {
    loadData();
  }, [code]);

  const loadData = async () => {
    try {
      const res = await tripApi.get(code);
      setData(res.data);
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load expense history');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <>
        <SubNav trip={null} code={code} />
        <div className="flex justify-center items-center min-h-[40vh]">
          <Loader2 size={24} className="animate-spin" color="var(--color-primary)" />
        </div>
      </>
    );
  }

  if (error || !data) {
    return (
      <>
        <SubNav trip={null} code={code} />
        <div className="max-w-md mx-auto px-4 py-16 text-center animate-fade-in">
          <div className="w-14 h-14 rounded-full bg-amber-50 border border-amber-200/60 flex items-center justify-center mx-auto mb-3 text-amber-500">
            <AlertCircle size={28} />
          </div>
          <h3 className="text-base font-semibold text-ink mb-2">Unable to Load History</h3>
          <p className="text-sm text-ink-muted-48 mb-4">{error || 'Group not found'}</p>
          <button onClick={loadData} className="btn-secondary text-sm">
            Try Again
          </button>
        </div>
      </>
    );
  }

  const getMemberName = (id) => data.members.find((m) => m._id === id)?.name || 'Unknown';

  // Filter expenses
  let filtered = data.expenses;
  if (categoryFilter !== 'all') {
    filtered = filtered.filter((e) => e.category === categoryFilter);
  }
  if (payerFilter !== 'all') {
    filtered = filtered.filter((e) => e.paidByMemberId === payerFilter);
  }

  // Group by month
  const byMonth = {};
  filtered.forEach((exp) => {
    const month = exp.date.slice(0, 7);
    if (!byMonth[month]) byMonth[month] = [];
    byMonth[month].push(exp);
  });

  const months = Object.keys(byMonth).sort().reverse();

  return (
    <>
      <SubNav trip={data.trip} code={code} />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 pb-24 space-y-4">
        <h2 className="text-xl font-bold text-ink animate-fade-in">Expense History</h2>

        {/* Filters */}
        <div className="flex gap-2 overflow-x-auto pb-1 animate-fade-in">
          {/* Category filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="input py-2 px-3 text-sm w-auto"
            style={{ minWidth: '120px' }}
          >
            <option value="all">All Categories</option>
            {Object.entries(CATEGORIES).map(([key, { label }]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>

          {/* Payer filter */}
          <select
            value={payerFilter}
            onChange={(e) => setPayerFilter(e.target.value)}
            className="input py-2 px-3 text-sm w-auto"
            style={{ minWidth: '120px' }}
          >
            <option value="all">All Payers</option>
            {data.members.map((m) => (
              <option key={m._id} value={m._id}>
                {m.name} {m._id === identity?.memberId ? '(You)' : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Expenses by month */}
        {months.length === 0 ? (
          <div className="card p-8 text-center animate-fade-in">
            <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3 text-gray-400">
              <Search size={28} />
            </div>
            <p className="text-sm text-ink-muted-48 m-0">No expenses match your filters</p>
          </div>
        ) : (
          <div className="space-y-6 stagger-children">
            {months.map((month) => {
              const monthExpenses = byMonth[month];
              const monthTotal = monthExpenses.reduce((s, e) => s + e.amountPaise, 0);
              const label = new Date(month + '-01').toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });

              return (
                <div key={month}>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-semibold text-ink-muted-48 uppercase tracking-wider m-0">
                      {label}
                    </h3>
                    <span className="text-sm font-medium text-ink">{formatCurrency(monthTotal)}</span>
                  </div>

                  <div className="card overflow-hidden divide-y divide-divider-soft">
                    {monthExpenses.map((expense) => {
                      const cat = CATEGORIES[expense.category] || CATEGORIES.misc;
                      const isExpanded = expandedId === expense._id;

                      return (
                        <div key={expense._id}>
                          <button
                            onClick={() => setExpandedId(isExpanded ? null : expense._id)}
                            className="w-full flex items-center justify-between px-4 py-3 transition-colors hover:bg-surface-pearl text-left"
                            style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border"
                                style={{
                                  backgroundColor: `${cat.color}15`,
                                  borderColor: `${cat.color}30`,
                                  color: cat.color,
                                }}
                              >
                                <CategoryIcon category={expense.category} size={16} />
                              </div>
                              <div>
                                <p className="text-sm font-medium text-ink m-0">{expense.description}</p>
                                <p className="text-xs text-ink-muted-48 m-0">
                                  {getMemberName(expense.paidByMemberId)} · {formatDate(expense.date)}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-ink">
                                {formatCurrency(expense.amountPaise)}
                              </span>
                              {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                            </div>
                          </button>

                          {/* Expanded details */}
                          {isExpanded && (
                            <div className="px-4 pb-3 animate-fade-in">
                              <div className="bg-canvas-parchment rounded-md p-3 space-y-1.5">
                                <p className="text-xs font-medium text-ink-muted-48">Split Details</p>
                                {expense.shares?.map((share) => (
                                  <div key={share._id} className="flex justify-between text-xs">
                                    <span className="text-ink-muted-80">{getMemberName(share.memberId)}</span>
                                    <span className="font-medium text-ink">{formatCurrency(share.sharePaise)}</span>
                                  </div>
                                ))}
                              </div>
                              <div className="flex gap-2 mt-2">
                                <Link
                                  to={`/trip/${code}/expense/${expense._id}/edit`}
                                  className="btn-secondary text-xs py-1.5 flex-1 text-center inline-flex items-center justify-center gap-1.5"
                                >
                                  <Pencil size={12} />
                                  <span>Edit</span>
                                </Link>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
