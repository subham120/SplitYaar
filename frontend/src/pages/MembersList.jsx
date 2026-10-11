import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { UserPlus, Loader2, Pencil, Check, X, Users } from 'lucide-react';
import { tripApi } from '../lib/api';
import { getIdentity } from '../lib/identity';
import SubNav from '../components/SubNav';

export default function MembersList() {
  const { code } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newUpi, setNewUpi] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editUpi, setEditUpi] = useState('');
  const [error, setError] = useState('');

  const identity = getIdentity(code);

  useEffect(() => { loadData(); }, [code]);

  const loadData = async () => {
    try {
      const res = await tripApi.get(code);
      setData(res.data);
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load group members');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setError('');

    try {
      await tripApi.addMember(code, { name: newName.trim(), upiId: newUpi.trim() || undefined });
      setNewName('');
      setNewUpi('');
      setAdding(false);
      loadData();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add member');
    }
  };

  const startEdit = (member) => {
    setEditingId(member._id);
    setEditName(member.name);
    setEditUpi(member.upiId || '');
  };

  const handleUpdate = async (memberId) => {
    setError('');
    try {
      await tripApi.updateMember(code, memberId, {
        name: editName.trim(),
        upiId: editUpi.trim() || null,
      });
      setEditingId(null);
      loadData();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update member');
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

  return (
    <>
      <SubNav trip={data.trip} code={code} />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-ink animate-fade-in flex items-center gap-2">
            <Users size={20} className="text-[#0071e3]" />
            <span>Members ({data.members.length})</span>
          </h2>
          {!adding && (
            <button onClick={() => setAdding(true)} className="btn-secondary text-sm inline-flex items-center gap-1.5">
              <UserPlus size={14} />
              <span>Add Member</span>
            </button>
          )}
        </div>

        {/* Add member form */}
        {adding && (
          <form onSubmit={handleAdd} className="card p-4 space-y-3 animate-scale-in">
            <input
              type="text"
              placeholder="Member name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="input"
              maxLength={40}
              autoFocus
            />
            <input
              type="text"
              placeholder="UPI ID (optional)"
              value={newUpi}
              onChange={(e) => setNewUpi(e.target.value)}
              className="input"
            />
            {error && <p className="text-sm text-negative m-0">{error}</p>}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => { setAdding(false); setError(''); }}
                className="btn-secondary flex-1 inline-flex items-center justify-center gap-1.5"
              >
                <X size={14} />
                <span>Cancel</span>
              </button>
              <button
                type="submit"
                className="btn-primary flex-1 inline-flex items-center justify-center gap-1.5"
              >
                <UserPlus size={14} />
                <span>Add Member</span>
              </button>
            </div>
          </form>
        )}

        {/* Members list */}
        <div className="card overflow-hidden divide-y divide-divider-soft stagger-children">
          {data.members.map((member) => {
            const isMe = member._id === identity?.memberId;
            const isEditing = editingId === member._id;

            return (
              <div key={member._id} className="px-4 py-3">
                {isEditing ? (
                  <div className="space-y-2 animate-fade-in">
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="input py-2 text-sm"
                      maxLength={40}
                    />
                    <input
                      type="text"
                      placeholder="UPI ID"
                      value={editUpi}
                      onChange={(e) => setEditUpi(e.target.value)}
                      className="input py-2 text-sm"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => setEditingId(null)}
                        className="btn-secondary flex-1 py-1.5 text-sm"
                      >
                        <X size={12} /> Cancel
                      </button>
                      <button
                        onClick={() => handleUpdate(member._id)}
                        className="btn-primary flex-1 py-1.5 text-sm"
                      >
                        <Check size={12} /> Save
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold text-white shrink-0"
                        style={{
                          background: `hsl(${member.name.charCodeAt(0) * 37 % 360}, 55%, 52%)`,
                        }}
                      >
                        {member.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-ink m-0 flex items-center gap-1.5">
                          {member.name}
                          {isMe && <span className="pill pill-primary text-[10px] py-0 px-1.5">You</span>}
                        </p>
                        {member.upiId && (
                          <p className="text-xs text-ink-muted-48 m-0 font-mono">{member.upiId}</p>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => startEdit(member)}
                      className="p-2 rounded-full hover:bg-canvas-parchment transition-colors"
                      style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                    >
                      <Pencil size={14} color="var(--color-ink-muted-48)" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
