import React, { useState } from 'react';
import { PhoneCall, ArrowRight, Loader2, ShieldCheck, RefreshCw, Zap } from 'lucide-react';

interface LoginPageProps {
  onLoginSuccess: (user: any, token: string) => void;
  onNewUser: (phone: string, token: string, user: any) => void;
}

type Step = 'phone' | 'otp';

// Seeded demo accounts matching inMemoryDb.ts
const DEMO_USERS = [
  {
    role: 'USER',
    label: 'Normal User',
    name: 'Arjun Das',
    phone: '+919876543210',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
    color: 'emerald',
    icon: '👤',
    desc: 'Browse, make random calls & book events',
  },
  {
    role: 'CELEBRITY',
    label: 'Celebrity',
    name: 'Dulquer Salmaan',
    phone: '+917777777777',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
    color: 'amber',
    icon: '⭐',
    desc: 'Manage calls, media & earnings',
  },
  {
    role: 'ORGANIZATION',
    label: 'Organization',
    name: 'Kerala Music Fest',
    phone: '+916666666666',
    avatar: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=200&q=80',
    color: 'purple',
    icon: '🏢',
    desc: 'Create events & verify tickets',
  },
  {
    role: 'SUPPORT',
    label: 'Support Agent',
    name: 'Customer Care Desk 1',
    phone: '+918888888888',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80',
    color: 'blue',
    icon: '🎧',
    desc: 'Handle helpdesk tickets & chat',
  },
  {
    role: 'ADMIN',
    label: 'Super Admin',
    name: 'Super Admin',
    phone: '+919999999999',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    color: 'red',
    icon: '🛡️',
    desc: 'Platform management & moderation',
  },
];

const COLOR_MAP: Record<string, { card: string; badge: string; ring: string }> = {
  emerald: {
    card: 'hover:border-emerald-500/50 hover:bg-emerald-500/5',
    badge: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    ring: 'ring-emerald-500/40',
  },
  amber: {
    card: 'hover:border-amber-500/50 hover:bg-amber-500/5',
    badge: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    ring: 'ring-amber-500/40',
  },
  purple: {
    card: 'hover:border-purple-500/50 hover:bg-purple-500/5',
    badge: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
    ring: 'ring-purple-500/40',
  },
  blue: {
    card: 'hover:border-blue-500/50 hover:bg-blue-500/5',
    badge: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    ring: 'ring-blue-500/40',
  },
  red: {
    card: 'hover:border-red-500/50 hover:bg-red-500/5',
    badge: 'bg-red-500/15 text-red-400 border-red-500/30',
    ring: 'ring-red-500/40',
  },
};

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess, onNewUser }) => {
  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState<string | null>(null); // phone of demo being loaded
  const [error, setError] = useState('');
  const [testOtp, setTestOtp] = useState('');

  // ---- OTP Flow ----
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length < 7) {
      setError('Please enter a valid phone number.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('http://localhost:4000/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: cleaned }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send OTP');
      setTestOtp(data.testOtp || '');
      setStep('otp');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (otp.length < 4) {
      setError('Please enter the OTP.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('http://localhost:4000/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phone.replace(/\D/g, ''), otp }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Invalid OTP');
      if (data.isNewUser) {
        onNewUser(phone.replace(/\D/g, ''), data.token, data.user);
      } else {
        onLoginSuccess(data.user, data.token);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ---- One-click demo login ----
  const handleDemoLogin = async (demoPhone: string) => {
    setError('');
    setDemoLoading(demoPhone);
    const cleaned = demoPhone.replace(/\D/g, '');
    try {
      // send-otp (just to register in otpStore, not strictly needed for seeded users)
      await fetch('http://localhost:4000/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: cleaned }),
      });
      // verify with static test OTP
      const res = await fetch('http://localhost:4000/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: cleaned, otp: '123456' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Demo login failed');
      onLoginSuccess(data.user, data.token);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setDemoLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center px-4 py-10">
      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/4 w-64 h-64 bg-teal-500/8 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-lg">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-2xl shadow-emerald-500/30 mb-4">
            <PhoneCall className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-teal-200 bg-clip-text text-transparent">
            Friend Connect
          </h1>
          <p className="text-slate-400 mt-1 text-sm">Connect with people around you</p>
        </div>

        {/* OTP Login Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl mb-6">
          {step === 'phone' ? (
            <>
              <h2 className="text-lg font-bold text-white mb-1">Sign in with Phone</h2>
              <p className="text-slate-400 text-sm mb-5">Enter your number to receive a one-time code.</p>

              <form onSubmit={handleSendOtp} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 transition-all text-base"
                    autoFocus
                  />
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
                      <span>Send OTP</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </>
          ) : (
            <>
              <div className="flex items-center space-x-3 mb-5">
                <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Verify OTP</h2>
                  <p className="text-slate-400 text-xs">Sent to {phone}</p>
                </div>
              </div>

              {testOtp && (
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg px-3 py-2 mb-4">
                  <span className="text-amber-400 text-xs font-mono">🧪 Dev OTP: <strong>{testOtp}</strong></span>
                </div>
              )}

              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
                    One-Time Password
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="123456"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 transition-all text-xl tracking-[0.4em] font-mono text-center"
                    autoFocus
                    maxLength={6}
                  />
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
                      <ShieldCheck className="w-4 h-4" />
                      <span>Verify & Sign In</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => { setStep('phone'); setOtp(''); setError(''); }}
                  className="w-full flex items-center justify-center space-x-1.5 text-slate-400 hover:text-slate-200 text-sm py-2 transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Change number / Resend</span>
                </button>
              </form>
            </>
          )}
        </div>

        {/* ── Demo Accounts Section ── */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
          <div className="flex items-center space-x-2 mb-4">
            <div className="flex items-center space-x-1.5">
              <Zap className="w-4 h-4 text-amber-400" />
              <span className="text-sm font-bold text-white">Quick Demo Login</span>
            </div>
            <span className="ml-auto text-xs text-slate-500 bg-slate-800 border border-slate-700 rounded-full px-2 py-0.5">
              No OTP needed
            </span>
          </div>

          <p className="text-slate-500 text-xs mb-4">
            Explore the app as any user type. All demo accounts use OTP <code className="text-amber-400 font-mono">123456</code>.
          </p>

          <div className="grid grid-cols-1 gap-2.5">
            {DEMO_USERS.map((demo) => {
              const c = COLOR_MAP[demo.color];
              const isLoading = demoLoading === demo.phone;
              return (
                <button
                  key={demo.phone}
                  onClick={() => handleDemoLogin(demo.phone)}
                  disabled={!!demoLoading}
                  className={`group flex items-center space-x-3 w-full text-left px-4 py-3 rounded-xl border border-slate-700/60 bg-slate-800/40 transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed ${c.card} ${isLoading ? `ring-2 ${c.ring}` : ''}`}
                >
                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    <img
                      src={demo.avatar}
                      alt={demo.name}
                      className="w-10 h-10 rounded-full object-cover bg-slate-700"
                    />
                    <span className="absolute -bottom-0.5 -right-0.5 text-sm leading-none">
                      {demo.icon}
                    </span>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-semibold text-white truncate">{demo.name}</span>
                      <span className={`flex-shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${c.badge}`}>
                        {demo.label}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5 truncate">{demo.desc}</p>
                  </div>

                  {/* Arrow / Spinner */}
                  <div className="flex-shrink-0 text-slate-600 group-hover:text-slate-300 transition-colors">
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
                    ) : (
                      <ArrowRight className="w-4 h-4" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <p className="text-center text-slate-600 text-xs mt-6">
          By continuing, you agree to our Terms of Service & Privacy Policy.
        </p>
      </div>
    </div>
  );
};
