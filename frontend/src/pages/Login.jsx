import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, ArrowLeft, LogIn, UserPlus, ShieldCheck } from 'lucide-react';
import { authApi } from '../lib/api';
import { setToken, setUser } from '../lib/identity';

export default function Login() {
  const navigate = useNavigate();
  const [isRegister, setIsRegister] = useState(false);
  const [form, setForm] = useState({ email: '', password: '', name: '', upiId: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      let res;
      if (isRegister) {
        if (!form.name.trim()) {
          setError('Name is required');
          setLoading(false);
          return;
        }
        res = await authApi.register({
          email: form.email,
          password: form.password,
          name: form.name.trim(),
          upiId: form.upiId.trim() || undefined,
        });
      } else {
        res = await authApi.login({
          email: form.email,
          password: form.password,
        });
      }

      setToken(res.data.token);
      setUser(res.data.user);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-sm mx-auto px-4 py-8">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1 text-sm text-ink-muted-48 mb-6 hover:text-ink transition-colors"
        style={{ background: 'none', border: 'none', cursor: 'pointer' }}
      >
        <ArrowLeft size={16} /> Back
      </button>

      <div className="text-center mb-8 animate-fade-in">
        <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-200/60 flex items-center justify-center mx-auto mb-3 text-[#0071e3]">
          <ShieldCheck size={28} />
        </div>
        <h1 className="text-2xl font-bold text-ink mt-2">
          {isRegister ? 'Create Account' : 'Welcome Back'}
        </h1>
        <p className="text-sm text-ink-muted-48 mt-1">
          {isRegister ? 'Sign up to sync your groups' : 'Sign in to your account'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 animate-fade-in-up">
        {isRegister && (
          <>
            <div>
              <label className="block text-sm font-medium text-ink mb-1.5">Name *</label>
              <input
                type="text"
                placeholder="Your name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="input"
                maxLength={40}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink mb-1.5">
                UPI ID <span className="text-ink-muted-48 font-normal">(optional)</span>
              </label>
              <input
                type="text"
                placeholder="name@upi"
                value={form.upiId}
                onChange={(e) => setForm({ ...form, upiId: e.target.value })}
                className="input"
              />
            </div>
          </>
        )}

        <div>
          <label className="block text-sm font-medium text-ink mb-1.5">Email *</label>
          <input
            type="email"
            placeholder="you@email.com"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="input"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-ink mb-1.5">Password *</label>
          <input
            type="password"
            placeholder="••••••••"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className="input"
            minLength={6}
            required
          />
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
          ) : isRegister ? (
            <UserPlus size={18} />
          ) : (
            <LogIn size={18} />
          )}
          <span>{loading ? 'Please wait...' : isRegister ? 'Create Account' : 'Sign In'}</span>
        </button>
      </form>

      <p className="text-center text-sm text-ink-muted-48 mt-6">
        {isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
        <button
          onClick={() => { setIsRegister(!isRegister); setError(''); }}
          className="font-medium underline"
          style={{ color: 'var(--color-primary)', background: 'none', border: 'none', cursor: 'pointer' }}
        >
          {isRegister ? 'Sign In' : 'Sign Up'}
        </button>
      </p>
    </div>
  );
}
