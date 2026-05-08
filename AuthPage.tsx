import { useState } from 'react';
import { useStore } from '../store/useStore';
import { Briefcase, Eye, EyeOff, User, LogIn, UserPlus, Star } from 'lucide-react';
import toast from 'react-hot-toast';
import { db } from '../db/database';

export default function AuthPage() {
  const { setUser, loginAsGuest } = useStore();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });

  const handleRegister = async () => {
    if (!form.name || !form.email || !form.password) {
      toast.error('Please fill all required fields');
      return;
    }
    if (form.password !== form.confirm) {
      toast.error('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      const existing = await db.users.where('email').equals(form.email).first();
      if (existing) { toast.error('Email already registered'); setLoading(false); return; }
      const initials = form.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
      const id = await db.users.add({
        name: form.name,
        email: form.email,
        avatarInitials: initials,
        isGuest: false,
        createdAt: new Date().toISOString(),
      });
      const user = await db.users.get(id);
      if (user) { setUser(user); toast.success('Welcome to JobTrackr! 🎉'); }
    } catch {
      toast.error('Registration failed');
    }
    setLoading(false);
  };

  const handleLogin = async () => {
    if (!form.email) { toast.error('Please enter your email'); return; }
    setLoading(true);
    try {
      const user = await db.users.where('email').equals(form.email).first();
      if (!user) { toast.error('Account not found. Please register.'); setLoading(false); return; }
      setUser(user);
      toast.success(`Welcome back, ${user.name}! 👋`);
    } catch {
      toast.error('Login failed');
    }
    setLoading(false);
  };

  const handleGuest = () => {
    loginAsGuest();
    toast.success('Continuing as Guest. Your data is saved locally.');
  };

  const f = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-indigo-500 rounded-full opacity-10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500 rounded-full opacity-10 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-600 rounded-2xl mb-4 shadow-xl">
            <Briefcase className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">JobTrackr</h1>
          <p className="text-indigo-300 mt-1 text-sm">Your career command centre</p>
        </div>

        {/* Card */}
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-2xl">
          {/* Tabs */}
          <div className="flex bg-white/10 rounded-xl p-1 mb-6">
            {(['login', 'register'] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
                  mode === m
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                {m === 'login' ? 'Sign In' : 'Create Account'}
              </button>
            ))}
          </div>

          <div className="space-y-4">
            {mode === 'register' && (
              <div>
                <label className="text-xs font-medium text-white/70 mb-1 block">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                  <input
                    type="text"
                    placeholder="John Doe"
                    value={form.name}
                    onChange={(e) => f('name', e.target.value)}
                    className="w-full bg-white/10 border border-white/20 rounded-xl pl-10 pr-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 text-sm"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="text-xs font-medium text-white/70 mb-1 block">Email Address</label>
              <div className="relative">
                <LogIn className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={(e) => f('email', e.target.value)}
                  className="w-full bg-white/10 border border-white/20 rounded-xl pl-10 pr-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-white/70 mb-1 block">Password</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => f('password', e.target.value)}
                  className="w-full bg-white/10 border border-white/20 rounded-xl pl-4 pr-10 py-3 text-white placeholder-white/30 focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 text-sm"
                />
                <button
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {mode === 'register' && (
              <div>
                <label className="text-xs font-medium text-white/70 mb-1 block">Confirm Password</label>
                <input
                  type={showPass ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={form.confirm}
                  onChange={(e) => f('confirm', e.target.value)}
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 text-sm"
                />
              </div>
            )}

            <button
              onClick={mode === 'login' ? handleLogin : handleRegister}
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : mode === 'login' ? (
                <>
                  <LogIn className="w-4 h-4" /> Sign In
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" /> Create Account
                </>
              )}
            </button>
          </div>

          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/20" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-transparent px-3 text-white/40 text-xs">or</span>
            </div>
          </div>

          <button
            onClick={handleGuest}
            className="w-full bg-white/10 hover:bg-white/20 border border-white/20 text-white font-medium py-3 rounded-xl transition-all flex items-center justify-center gap-2"
          >
            <Star className="w-4 h-4 text-yellow-400" />
            Continue as Guest
          </button>
          <p className="text-center text-white/40 text-xs mt-3">
            Guest mode stores data locally — no account needed
          </p>
        </div>

        <p className="text-center text-white/30 text-xs mt-6">
          All data stored securely on your device • Offline-first
        </p>
      </div>
    </div>
  );
}
