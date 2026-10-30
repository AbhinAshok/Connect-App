import React, { useState } from 'react';
import { User, Camera, Loader2, CheckCircle2, Sparkles } from 'lucide-react';

interface SignupPageProps {
  phone: string;
  token: string;
  initialUser: any;
  onSignupComplete: (user: any, token: string) => void;
}

const AVATAR_SEEDS = ['felix', 'luna', 'nova', 'orion', 'rio', 'sky', 'ace', 'ivy', 'leo', 'zoe'];

export const SignupPage: React.FC<SignupPageProps> = ({ phone, token, initialUser, onSignupComplete }) => {
  const [name, setName] = useState(initialUser?.name || '');
  const [avatarSeed, setAvatarSeed] = useState(AVATAR_SEEDS[Math.floor(Math.random() * AVATAR_SEEDS.length)]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const avatarUrl = `https://api.dicebear.com/7.x/bottts/svg?seed=${avatarSeed}`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!name.trim() || name.trim().length < 2) {
      setError('Name must be at least 2 characters.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:4000/api/auth/profile/${initialUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: name.trim(), avatarUrl }),
      });
      const updated = await res.json();
      if (!res.ok) throw new Error(updated.error || 'Profile update failed');
      onSignupComplete(updated, token);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const randomizeAvatar = () => {
    const remaining = AVATAR_SEEDS.filter((s) => s !== avatarSeed);
    setAvatarSeed(remaining[Math.floor(Math.random() * remaining.length)]);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center px-4">
      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center space-x-2 mb-2">
            <Sparkles className="w-5 h-5 text-emerald-400" />
            <span className="text-emerald-400 font-semibold text-sm">New Account</span>
          </div>
          <h1 className="text-3xl font-bold text-white text-center">Set up your profile</h1>
          <p className="text-slate-400 mt-1 text-sm text-center">
            Linked to <span className="font-mono text-slate-300">{phone}</span>
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Avatar picker */}
            <div className="flex flex-col items-center space-y-3">
              <div className="relative group">
                <div className="w-24 h-24 rounded-full border-2 border-emerald-500/50 p-1 bg-slate-800 overflow-hidden">
                  <img
                    src={avatarUrl}
                    alt="Avatar preview"
                    className="w-full h-full rounded-full object-cover"
                  />
                </div>
                <button
                  type="button"
                  onClick={randomizeAvatar}
                  className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-emerald-500 hover:bg-emerald-400 flex items-center justify-center shadow-lg transition-all"
                  title="Randomize avatar"
                >
                  <Camera className="w-4 h-4 text-white" />
                </button>
              </div>
              <p className="text-slate-500 text-xs">Tap the camera to change your avatar</p>
            </div>

            {/* Avatar style chooser */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">
                Choose Avatar Style
              </label>
              <div className="grid grid-cols-5 gap-2">
                {AVATAR_SEEDS.map((seed) => (
                  <button
                    key={seed}
                    type="button"
                    onClick={() => setAvatarSeed(seed)}
                    className={`w-full aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                      avatarSeed === seed
                        ? 'border-emerald-500 scale-105 shadow-lg shadow-emerald-500/20'
                        : 'border-slate-700 hover:border-slate-500'
                    }`}
                    title={seed}
                  >
                    <img
                      src={`https://api.dicebear.com/7.x/bottts/svg?seed=${seed}`}
                      alt={seed}
                      className="w-full h-full object-cover bg-slate-800"
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Name input */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
                Display Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  maxLength={40}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 transition-all"
                  autoFocus
                />
              </div>
            </div>

            {error && (
              <p className="text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-xl transition-all shadow-lg shadow-emerald-500/20"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Create My Account</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

