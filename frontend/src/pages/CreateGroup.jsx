import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, Plus } from 'lucide-react';
import { tripApi } from '../lib/api';
import { setIdentity, getUser } from '../lib/identity';
import { GROUP_TYPES } from '../lib/formatters';
import { GroupTypeIcon } from '../components/CategoryIcon';

export default function CreateGroup() {
  const navigate = useNavigate();
  const user = getUser();
  const [form, setForm] = useState({
    name: '',
    creatorName: user?.name || '',
    creatorUpiId: user?.upiId || '',
    groupType: 'trip',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.creatorName.trim()) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { data } = await tripApi.create({
        name: form.name.trim(),
        creatorName: form.creatorName.trim(),
        creatorUpiId: form.creatorUpiId.trim() || undefined,
        groupType: form.groupType,
      });

      setIdentity(data.trip.code, data.member._id, data.member.name);
      navigate(`/trip/${data.trip.code}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create group');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1 text-sm text-ink-muted-48 mb-6 hover:text-ink transition-colors"
        style={{ background: 'none', border: 'none', cursor: 'pointer' }}
      >
        <ArrowLeft size={16} /> Back
      </button>

      <h1 className="text-2xl font-bold text-ink mb-1 animate-fade-in">Create a Group</h1>
      <p className="text-sm text-ink-muted-48 mb-6 animate-fade-in">
        Start splitting expenses with your friends
      </p>

      <form onSubmit={handleSubmit} className="space-y-5 animate-fade-in-up">
        {/* Group Name */}
        <div>
          <label className="block text-sm font-medium text-ink mb-1.5">Group Name *</label>
          <input
            type="text"
            placeholder="e.g. Goa Trip 2026"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="input"
            maxLength={60}
          />
        </div>

        {/* Group Type */}
        <div>
          <label className="block text-sm font-medium text-ink mb-2">Group Type</label>
          <div className="flex flex-wrap gap-2">
            {Object.entries(GROUP_TYPES).map(([key, { label }]) => (
              <button
                key={key}
                type="button"
                onClick={() => setForm({ ...form, groupType: key })}
                className="pill py-2 px-4 text-sm inline-flex items-center gap-2 transition-all"
                style={{
                  background: form.groupType === key ? 'var(--color-primary)' : 'var(--color-canvas)',
                  color: form.groupType === key ? 'white' : 'var(--color-ink-muted-80)',
                  border: `1px solid ${form.groupType === key ? 'var(--color-primary)' : 'var(--color-hairline)'}`,
                  cursor: 'pointer',
                }}
              >
                <GroupTypeIcon type={key} size={15} />
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Creator Name */}
        <div>
          <label className="block text-sm font-medium text-ink mb-1.5">Your Name *</label>
          <input
            type="text"
            placeholder="e.g. Rahul"
            value={form.creatorName}
            onChange={(e) => setForm({ ...form, creatorName: e.target.value })}
            className="input"
            maxLength={40}
          />
        </div>

        {/* UPI ID */}
        <div>
          <label className="block text-sm font-medium text-ink mb-1.5">
            Your UPI ID <span className="text-ink-muted-48 font-normal">(optional)</span>
          </label>
          <input
            type="text"
            placeholder="e.g. rahul@upi"
            value={form.creatorUpiId}
            onChange={(e) => setForm({ ...form, creatorUpiId: e.target.value })}
            className="input"
          />
          <p className="text-xs text-ink-muted-48 mt-1">For receiving UPI payments during settle-up</p>
        </div>

        {error && (
          <div className="pill pill-negative py-2 px-3 w-full text-sm">{error}</div>
        )}

        <button
          type="submit"
          className="btn-primary w-full py-3.5 inline-flex items-center justify-center gap-2"
          disabled={loading}
        >
          {loading ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <Plus size={18} />
          )}
          <span>{loading ? 'Creating...' : 'Create Group'}</span>
        </button>
      </form>
    </div>
  );
}
