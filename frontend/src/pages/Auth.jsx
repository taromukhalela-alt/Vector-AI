import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { Mail, Lock, User, ArrowRight, AlertCircle, Zap, ArrowLeft } from 'lucide-react';

const Auth = ({ onNavigate }) => {
  const { login, register } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (isRegister) {
      if (!name.trim() || !email.trim() || !password.trim()) {
        setError('All fields are required');
        setLoading(false);
        return;
      }
      if (password.length < 8) {
        setError('Password must be at least 8 characters');
        setLoading(false);
        return;
      }
      const res = await register(name, email, password);
      if (res.success) onNavigate('chat');
      else setError(res.message);
    } else {
      if (!email.trim() || !password.trim()) {
        setError('All fields are required');
        setLoading(false);
        return;
      }
      const res = await login(email, password);
      if (res.success) onNavigate('chat');
      else setError(res.message);
    }
    setLoading(false);
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-zinc-950 text-zinc-100 font-sans p-6 overflow-hidden">
      {/* Back to landing */}
      <Link
        to="/"
        className="absolute top-8 left-8 z-20 flex items-center gap-2 text-zinc-500 hover:text-zinc-100 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        <span className="text-xs font-bold uppercase tracking-widest">Back</span>
      </Link>
      {/* Ambient backdrop */}
      <div
        className="absolute inset-0 pointer-events-none z-0 opacity-[0.35]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)',
          backgroundSize: '56px 56px',
          WebkitMaskImage: 'radial-gradient(ellipse 70% 60% at 50% 30%, black 30%, transparent 90%)',
          maskImage: 'radial-gradient(ellipse 70% 60% at 50% 30%, black 30%, transparent 90%)',
        }}
      />
      <div className="absolute top-[30%] left-1/2 -translate-x-1/2 w-[640px] h-[640px] rounded-full bg-emerald-500/[0.07] blur-[140px] pointer-events-none z-0" />

      {/* Card */}
      <div className="w-full max-w-[420px] relative z-10">
        {/* Brand row above card */}
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-[0_8px_24px_-8px_rgba(16,185,129,0.6)]">
            <Zap className="w-4 h-4 text-zinc-950" strokeWidth={2.75} />
          </div>
          <div className="leading-none">
            <div className="font-semibold text-[15px] tracking-tight text-zinc-50">Vector AI</div>
            <div className="text-[10px] tracking-[0.18em] text-emerald-400/90 font-medium uppercase mt-1">STEM OS</div>
          </div>
        </div>

        <div className="relative rounded-2xl bg-zinc-900/40 backdrop-blur-xl border border-white/[0.06] p-8 shadow-[0_1px_0_0_rgba(255,255,255,0.04)_inset,0_24px_48px_-24px_rgba(0,0,0,0.8)]">
          <div className="mb-7">
            <h1 className="text-[22px] font-semibold tracking-tight text-zinc-50">
              {isRegister ? 'Create your account' : 'Welcome back'}
            </h1>
            <p className="text-[13px] text-zinc-400 mt-1.5 leading-relaxed">
              {isRegister
                ? 'Start mastering CAPS-aligned physics & chemistry today.'
                : 'Sign in to continue your study sessions.'}
            </p>
          </div>

          {error && (
            <div className="mb-5 px-3.5 py-3 rounded-lg bg-red-500/[0.08] border border-red-500/20 text-red-300 text-[12.5px] flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span className="leading-relaxed">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {isRegister && (
              <Field icon={User} label="Full name" type="text" placeholder="Taro Mukhalela" value={name} onChange={setName} />
            )}
            <Field icon={Mail} label="Email" type="email" placeholder="you@example.com" value={email} onChange={setEmail} />
            <Field icon={Lock} label="Password" type="password" placeholder="••••••••" value={password} onChange={setPassword} />

            <button
              type="submit"
              disabled={loading}
              className="group w-full mt-2 h-11 rounded-lg bg-emerald-500 hover:bg-emerald-400 disabled:opacity-60 text-zinc-950 font-semibold text-[13px] flex items-center justify-center gap-2 transition-all shadow-[0_8px_24px_-8px_rgba(16,185,129,0.5)] hover:shadow-[0_12px_28px_-8px_rgba(16,185,129,0.6)] cursor-pointer"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  {isRegister ? 'Create account' : 'Sign in'}
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" strokeWidth={2.5} />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-white/[0.05] text-center">
            <button
              onClick={() => { setIsRegister(!isRegister); setError(''); }}
              className="text-[12.5px] text-zinc-400 hover:text-emerald-400 transition-colors cursor-pointer"
            >
              {isRegister ? 'Already have an account? ' : "Don't have an account? "}
              <span className="text-zinc-100 font-medium">{isRegister ? 'Sign in' : 'Sign up'}</span>
            </button>
          </div>
        </div>

        <p className="text-center text-[11px] text-zinc-600 mt-6">
          By continuing you agree to our Terms & Privacy.
        </p>
      </div>
    </div>
  );
};

const Field = ({ icon: Icon, label, type, placeholder, value, onChange }) => (
  <div className="space-y-1.5">
    <label className="text-[11px] font-medium text-zinc-400 block">{label}</label>
    <div className="relative">
      <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[15px] h-[15px] text-zinc-500" strokeWidth={1.8} />
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-11 bg-white/[0.03] border border-white/[0.07] focus:border-emerald-500/40 focus:bg-white/[0.04] focus:ring-4 focus:ring-emerald-500/[0.08] rounded-lg pl-10 pr-3.5 text-[13.5px] text-zinc-100 placeholder:text-zinc-600 outline-none transition-all"
        required
      />
    </div>
  </div>
);

export default Auth;
