import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, Trash2, Users, UserCheck, SlidersHorizontal, Check, Plus } from 'lucide-react';
import { tripApi } from '../lib/api';
import { getIdentity } from '../lib/identity';
import { CATEGORIES, rupeeToPaise, formatCurrency, todayISO } from '../lib/formatters';
import CategoryIcon from '../components/CategoryIcon';

export default function AddEditExpense() {
  const { code, id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  const identity = getIdentity(code);

  const [form, setForm] = useState({
    description: '',
    amount: '',
    paidByMemberId: '',
    category: 'food',
    splitType: 'equal_all',
    date: todayISO(),
    selectedMembers: [],
    customShares: {},
  });

  useEffect(() => {
    loadData();
  }, [code, id]);

  const loadData = async () => {
    try {
      const { data } = await tripApi.get(code);
      setMembers(data.members);

      if (!isEdit) {
        setForm((f) => ({
          ...f,
          paidByMemberId: identity?.memberId || data.members[0]?._id || '',
          selectedMembers: data.members.map((m) => m._id),
        }));
      } else {
        const expRes = await tripApi.getExpense(code, id);
        const exp = expRes.data.expense;
        const shares = expRes.data.shares;

        setForm({
          description: exp.description,
          amount: (exp.amountPaise / 100).toString(),
          paidByMemberId: exp.paidByMemberId,
          category: exp.category,
          splitType: exp.splitType,
          date: exp.date,
          selectedMembers: shares.map((s) => s.memberId),
          customShares: shares.reduce((acc, s) => {
            acc[s.memberId] = (s.sharePaise / 100).toString();
            return acc;
          }, {}),
        });
      }
    } catch {
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const amountPaise = rupeeToPaise(form.amount);

    if (!form.description.trim() || !amountPaise || amountPaise < 1 || !form.paidByMemberId || !form.date) {
      setError('Please fill in all required fields');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const payload = {
        description: form.description.trim(),
        amountPaise,
        paidByMemberId: form.paidByMemberId,
        category: form.category,
        splitType: form.splitType,
        date: form.date,
      };

      if (form.splitType === 'equal_selected') {
        if (!form.selectedMembers.length) {
          setError('Please select at least one member to split with');
          setSaving(false);
          return;
        }
        payload.shares = form.selectedMembers.map((mid) => ({ memberId: mid }));
      } else if (form.splitType === 'custom') {
        const shares = Object.entries(form.customShares).map(([memberId, amt]) => ({
          memberId,
          sharePaise: rupeeToPaise(amt),
        }));
        const customTotal = shares.reduce((sum, s) => sum + s.sharePaise, 0);
        if (customTotal !== amountPaise) {
          setError(`Custom shares total (${formatCurrency(customTotal)}) must equal expense amount (${formatCurrency(amountPaise)})`);
          setSaving(false);
          return;
        }
        payload.shares = shares;
      }

      if (isEdit) {
        await tripApi.updateExpense(code, id, payload);
      } else {
        await tripApi.createExpense(code, payload);
      }

      navigate(`/trip/${code}`, { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save expense');
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this expense?')) return;
    setDeleting(true);
    try {
      await tripApi.deleteExpense(code, id);
      navigate(`/trip/${code}`, { replace: true });
    } catch {
      setError('Failed to delete');
      setDeleting(false);
    }
  };

  const toggleMember = (mid) => {
    setForm((f) => {
      const selected = f.selectedMembers.includes(mid)
        ? f.selectedMembers.filter((id) => id !== mid)
        : [...f.selectedMembers, mid];
      return { ...f, selectedMembers: selected };
    });
  };

  // Live split preview
  const amountPaise = rupeeToPaise(form.amount || '0');
  const splitCount = form.splitType === 'equal_all'
    ? members.length
    : form.selectedMembers.length;
  const perPerson = splitCount > 0 ? Math.floor(amountPaise / splitCount) : 0;

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 size={24} className="animate-spin" color="var(--color-primary)" />
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 text-sm text-ink-muted-48 hover:text-ink transition-colors"
          style={{ background: 'none', border: 'none', cursor: 'pointer' }}
        >
          <ArrowLeft size={16} /> Back
        </button>
        {isEdit && (
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="flex items-center gap-1 text-sm transition-colors"
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-negative)' }}
          >
            <Trash2 size={14} /> {deleting ? 'Deleting...' : 'Delete'}
          </button>
        )}
      </div>

      <h1 className="text-2xl font-bold text-ink mb-6 animate-fade-in">
        {isEdit ? 'Edit Expense' : 'Add Expense'}
      </h1>

      <form onSubmit={handleSubmit} className="space-y-5 animate-fade-in-up">
        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-ink mb-1.5">Description *</label>
          <input
            type="text"
            placeholder="e.g. Dinner at Hotel Saravana"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="input"
            maxLength={100}
          />
        </div>

        {/* Amount */}
        <div>
          <label className="block text-sm font-medium text-ink mb-1.5">Amount (₹) *</label>
          <input
            type="number"
            step="0.01"
            min="0.01"
            placeholder="0.00"
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
            onWheel={(e) => e.target.blur()}
            className="input text-2xl font-bold text-center"
            style={{ letterSpacing: '1px' }}
          />
        </div>

        {/* Paid by */}
        <div>
          <label className="block text-sm font-medium text-ink mb-1.5">Paid by *</label>
          <select
            value={form.paidByMemberId}
            onChange={(e) => setForm({ ...form, paidByMemberId: e.target.value })}
            className="input"
          >
            {members.map((m) => (
              <option key={m._id} value={m._id}>
                {m.name} {m._id === identity?.memberId ? '(You)' : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-ink mb-2">Category</label>
          <div className="flex flex-wrap gap-1.5">
            {Object.entries(CATEGORIES).map(([key, { label }]) => (
              <button
                key={key}
                type="button"
                onClick={() => setForm({ ...form, category: key })}
                className="pill py-1.5 px-3 text-xs inline-flex items-center gap-1.5 transition-all"
                style={{
                  background: form.category === key ? 'var(--color-primary)' : 'var(--color-canvas)',
                  color: form.category === key ? 'white' : 'var(--color-ink-muted-80)',
                  border: `1px solid ${form.category === key ? 'var(--color-primary)' : 'var(--color-hairline)'}`,
                  cursor: 'pointer',
                }}
              >
                <CategoryIcon category={key} size={13} />
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Date */}
        <div>
          <label className="block text-sm font-medium text-ink mb-1.5">Date *</label>
          <input
            type="date"
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
            className="input"
          />
        </div>

        {/* Split type */}
        <div>
          <label className="block text-sm font-medium text-ink mb-2">Split Type</label>
          <div className="flex gap-2">
            {[
              { key: 'equal_all', label: 'Equal (All)', icon: Users },
              { key: 'equal_selected', label: 'Equal (Selected)', icon: UserCheck },
              { key: 'custom', label: 'Custom', icon: SlidersHorizontal },
            ].map(({ key, label, icon: IconComponent }) => (
              <button
                key={key}
                type="button"
                onClick={() => setForm({ ...form, splitType: key })}
                className="pill py-2 px-3 text-xs flex-1 justify-center inline-flex items-center gap-1.5 transition-all"
                style={{
                  background: form.splitType === key ? 'var(--color-primary)' : 'var(--color-canvas)',
                  color: form.splitType === key ? 'white' : 'var(--color-ink-muted-80)',
                  border: `1px solid ${form.splitType === key ? 'var(--color-primary)' : 'var(--color-hairline)'}`,
                  cursor: 'pointer',
                }}
              >
                <IconComponent size={13} />
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Member selection (equal_selected) */}
        {form.splitType === 'equal_selected' && (
          <div className="card p-3 space-y-2 animate-fade-in">
            <p className="text-xs font-medium text-ink-muted-48 m-0">Select members to split with</p>
            {members.map((m) => (
              <label key={m._id} className="flex items-center gap-2 py-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.selectedMembers.includes(m._id)}
                  onChange={() => toggleMember(m._id)}
                  className="accent-primary w-4 h-4"
                />
                <span className="text-sm text-ink">{m.name}</span>
              </label>
            ))}
          </div>
        )}

        {/* Custom shares */}
        {form.splitType === 'custom' && (
          <div className="card p-3.5 space-y-2.5 animate-fade-in">
            <p className="text-xs font-medium text-ink-muted-48 m-0">Enter each person's share (₹)</p>
            <div className="divide-y divide-divider-soft">
              {members.map((m) => {
                const isCurrent = m._id === identity?.memberId;
                return (
                  <div key={m._id} className="flex items-center justify-between gap-3 py-2 first:pt-1 last:pb-1">
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold text-white shrink-0"
                        style={{ background: `hsl(${m.name.charCodeAt(0) * 37 % 360}, 55%, 52%)` }}
                      >
                        {m.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-sm font-medium text-ink truncate">
                        {m.name} {isCurrent && <span className="text-xs text-ink-muted-48">(You)</span>}
                      </span>
                    </div>

                    <div className="relative shrink-0" style={{ width: '110px' }}>
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-ink-muted-48 pointer-events-none font-medium">
                        ₹
                      </span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        value={form.customShares[m._id] || ''}
                        onChange={(e) => setForm({
                          ...form,
                          customShares: { ...form.customShares, [m._id]: e.target.value },
                        })}
                        onWheel={(e) => e.target.blur()}
                        className="input text-sm text-right font-medium"
                        style={{
                          width: '100%',
                          padding: '5px 8px 5px 18px',
                          height: '32px',
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {amountPaise > 0 && (
              <div className="flex justify-between text-xs pt-1 border-t border-divider-soft">
                <span className="text-ink-muted-48">Total shares</span>
                <span
                  className="font-medium"
                  style={{
                    color: Object.values(form.customShares).reduce((s, v) => s + rupeeToPaise(v || '0'), 0) === amountPaise
                      ? 'var(--color-positive)'
                      : 'var(--color-negative)',
                  }}
                >
                  {formatCurrency(Object.values(form.customShares).reduce((s, v) => s + rupeeToPaise(v || '0'), 0))}
                  {' / '}
                  {formatCurrency(amountPaise)}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Live split preview */}
        {form.splitType !== 'custom' && amountPaise > 0 && splitCount > 0 && (
          <div className="card p-3 text-center animate-fade-in">
            <p className="text-xs text-ink-muted-48 m-0">
              {formatCurrency(perPerson)} per person · {splitCount} {splitCount === 1 ? 'person' : 'people'}
            </p>
          </div>
        )}

        {error && (
          <div className="pill pill-negative py-2 px-3 w-full text-sm">{error}</div>
        )}

        <button
          type="submit"
          className="btn-primary w-full py-3.5 inline-flex items-center justify-center gap-2"
          disabled={saving}
        >
          {saving ? (
            <Loader2 size={18} className="animate-spin" />
          ) : isEdit ? (
            <Check size={18} />
          ) : (
            <Plus size={18} />
          )}
          <span>{saving ? 'Saving...' : isEdit ? 'Update Expense' : 'Add Expense'}</span>
        </button>
      </form>
    </div>
  );
}
