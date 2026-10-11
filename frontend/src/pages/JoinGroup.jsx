import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { UserPlus, Loader2, SearchX, Users, X, Check } from 'lucide-react';
import { tripApi } from '../lib/api';
import { getIdentity, setIdentity } from '../lib/identity';

export default function JoinGroup() {
  const { code } = useParams();
  const navigate = useNavigate();
  const [members, setMembers] = useState([]);
  const [tripName, setTripName] = useState('');
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [newName, setNewName] = useState('');
  const [showNewForm, setShowNewForm] = useState(false);
  const [error, setError] = useState('');

  // Check if already joined
  useEffect(() => {
    const identity = getIdentity(code);
    if (identity) {
      navigate(`/trip/${code}`, { replace: true });
      return;
    }
    loadGroup();
  }, [code]);

  const loadGroup = async () => {
    try {
      const { data } = await tripApi.get(code);
      setMembers(data.members);
      setTripName(data.trip.name);
    } catch {
      setError('Group not found');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectMember = (member) => {
    setIdentity(code, member._id, member.name);
    navigate(`/trip/${code}`, { replace: true });
  };

  const handleJoinNew = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;

    setJoining(true);
    try {
      const { data } = await tripApi.addMember(code, { name: newName.trim() });
      setIdentity(code, data.member._id, data.member.name);
      navigate(`/trip/${code}`, { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to join');
      setJoining(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 size={24} className="animate-spin" color="var(--color-primary)" />
      </div>
    );
  }

  if (error && !members.length) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center animate-fade-in">
        <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3 text-gray-400">
          <SearchX size={28} />
        </div>
        <h2 className="text-xl font-bold text-ink mb-2">Group Not Found</h2>
        <p className="text-sm text-ink-muted-48">Check the code and try again</p>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <div className="text-center mb-8 animate-fade-in">
        <div className="w-14 h-14 rounded-full bg-blue-50 border border-blue-200/60 flex items-center justify-center mx-auto mb-3 text-[#0071e3]">
          <Users size={28} />
        </div>
        <h1 className="text-2xl font-bold text-ink mb-1">Join {tripName}</h1>
        <p className="text-sm text-ink-muted-48">Who are you?</p>
      </div>

      {/* Existing members */}
      <div className="space-y-2 mb-6 stagger-children">
        {members.map((member) => (
          <button
            key={member._id}
            onClick={() => handleSelectMember(member)}
            className="card w-full flex items-center gap-3 p-4 text-left transition-all hover:shadow-md"
            style={{ border: 'none', cursor: 'pointer' }}
          >
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold text-white shrink-0"
              style={{
                background: `hsl(${member.name.charCodeAt(0) * 37 % 360}, 55%, 52%)`,
              }}
            >
              {member.name.charAt(0).toUpperCase()}
            </div>
            <span className="text-sm font-medium text-ink">{member.name}</span>
          </button>
        ))}
      </div>

      {/* Join as new */}
      {!showNewForm ? (
        <button
          onClick={() => setShowNewForm(true)}
          className="btn-secondary w-full inline-flex items-center justify-center gap-2 animate-fade-in"
        >
          <UserPlus size={16} />
          <span>Join as new member</span>
        </button>
      ) : (
        <form onSubmit={handleJoinNew} className="card p-4 space-y-3 animate-scale-in">
          <input
            type="text"
            placeholder="Enter your name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="input"
            maxLength={40}
            autoFocus
          />
          {error && <p className="text-sm text-negative m-0">{error}</p>}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setShowNewForm(false)}
              className="btn-secondary flex-1 inline-flex items-center justify-center gap-1.5"
            >
              <X size={14} />
              <span>Cancel</span>
            </button>
            <button
              type="submit"
              className="btn-primary flex-1 inline-flex items-center justify-center gap-1.5"
              disabled={joining}
            >
              {joining ? <Loader2 size={16} className="animate-spin" /> : <Check size={14} />}
              <span>{joining ? 'Joining...' : 'Join'}</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
