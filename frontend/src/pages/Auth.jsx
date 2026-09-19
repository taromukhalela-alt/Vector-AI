import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import {
  EnvelopeSimple, LockKey, User, ArrowRight,
  WarningCircle, ArrowLeft, Eye, EyeSlash,
} from '@phosphor-icons/react';

import VectorIcon from '../components/VectorIcon';

const Auth = ({ onNavigate }) => {
  const { login, register } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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
    <div className="min-h-dvh bg-[var(--paper)] font-sans text-[var(--ink)]">
      <div className="mx-auto grid min-h-dvh w-full max-w-6xl grid-cols-1 lg:grid-cols-[1.05fr_1fr]">
        <section className="hidden border-r-[3px] border-[var(--border)] bg-[var(--ink)] p-10 text-[var(--paper)] lg:flex lg:flex-col lg:justify-between">
          <Link to="/" className="inline-flex w-fit items-center gap-2 border-2 border-[var(--paper)] px-3 py-2 text-xs font-black uppercase tracking-widest text-[var(--paper)] hover:bg-white/10" aria-label="Back to home">
            <ArrowLeft className="h-4 w-4" weight="bold" aria-hidden="true" /> Vector.AI
          </Link>
          <div>
            <p className="font-mono text-xs font-bold uppercase tracking-[0.2em] opacity-70">CAPS Physical Sciences · Grades 10-12</p>
            <h1 className="mt-4 font-display text-6xl font-bold uppercase leading-[0.9] tracking-tight">Learn physics like it matters.</h1>
            <div className="mt-8 grid grid-cols-3 gap-3">
              {[['01', 'AI tutor that explains', 'bg-[var(--emerald)] text-[#0B1410]'], ['02', 'Notes that stick', 'bg-[var(--magenta)] text-white'], ['03', 'Lab you can touch', 'bg-[var(--lab-steel)] text-white']].map(([n, t, tone]) => (
                <div key={n} className={`border-2 border-[var(--paper)] p-3 ${tone}`}><p className="font-mono text-xs font-bold opacity-80">{n}</p><p className="mt-2 text-sm font-extrabold uppercase leading-tight">{t}</p></div>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between border-t-2 border-[var(--paper)] pt-5 text-xs font-bold uppercase tracking-widest opacity-80">
            <span>AI Tutor · Notes · Lab</span><span>ZA Curriculum</span>
          </div>
        </section>
        <section className="flex items-center justify-center p-5 sm:p-10">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease: 'easeOut' }} className="w-full max-w-md">
            <Link to="/" className="mb-6 inline-flex min-h-[44px] items-center gap-2 text-xs font-black uppercase tracking-widest text-[var(--ink-muted)] hover:text-[var(--ink)] lg:hidden"><ArrowLeft className="h-4 w-4" weight="bold" aria-hidden="true" /> Back</Link>
            <div className="neo-card p-6 sm:p-8">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center border-2 border-[var(--border)] bg-[var(--magenta)] shadow-[3px_3px_0_var(--border)]" aria-hidden="true"><VectorIcon className="h-6 w-6" color="#FFFFFF" accent="var(--ink)" /></div>
                <div><h1 className="text-2xl font-black uppercase leading-none">{isRegister ? 'Create account' : 'Welcome back'}</h1><p className="section-label mt-2">Vector AI · STEM OS</p></div>
              </div>
              <p className="mt-4 text-[14px] font-medium leading-relaxed text-[var(--ink-muted)]">{isRegister ? 'Start studying CAPS Physical Sciences with a tutor that remembers your progress.' : 'Sign in to continue your CAPS revision.'}</p>
              {error && (<div className="mt-5 flex items-start gap-2 border-2 border-[var(--danger)] bg-[var(--surface)] p-3 text-sm font-bold text-[var(--danger)]" role="alert"><WarningCircle className="mt-0.5 h-5 w-5 shrink-0" weight="bold" aria-hidden="true" /><span>{error}</span></div>)}
              <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-4">
                {isRegister && (<Field icon={User} name="name" autoComplete="name" label="Full name" type="text" placeholder="e.g. Thandi Mokoena" value={name} onChange={setName} />)}
                <Field icon={EnvelopeSimple} name="email" autoComplete="email" inputMode="email" label="Email" type="email" placeholder="you@example.com" value={email} onChange={setEmail} />
                <Field icon={LockKey} name="password" autoComplete={isRegister ? 'new-password' : 'current-password'} label="Password" type={showPassword ? 'text' : 'password'} placeholder={isRegister ? 'At least 8 characters' : 'Enter password'} value={password} onChange={setPassword}
                  trailing={(<button type="button" onClick={() => setShowPassword((c) => !c)} aria-label={showPassword ? 'Hide password' : 'Show password'} aria-pressed={showPassword} className="absolute right-2 top-1/2 min-h-[36px] min-w-[36px] -translate-y-1/2 border-2 border-[var(--border)] bg-[var(--surface)] p-1.5 hover:bg-[var(--surface-muted)]">{showPassword ? <EyeSlash className="h-4 w-4" weight="bold" aria-hidden="true" /> : <Eye className="h-4 w-4" weight="bold" aria-hidden="true" />}</button>)}
                />
                {isRegister && <p className="font-mono text-[11px] font-bold uppercase tracking-widest text-[var(--ink-muted)]">Passwords need at least 8 characters.</p>}
                <button type="submit" disabled={loading} className="neo-btn neo-btn-primary w-full px-6 py-4 text-base">{loading ? <span className="h-5 w-5 animate-spin border-[3px] border-white border-t-transparent" aria-hidden="true" /> : (<>{isRegister ? 'Create account' : 'Sign in'}<ArrowRight className="ml-2 h-5 w-5" weight="bold" aria-hidden="true" /></>)}</button>
              </form>
              <div className="mt-6 border-t-[3px] border-[var(--border)] pt-5 text-center">
                <button type="button" onClick={() => { setIsRegister(!isRegister); setError(''); }} className="min-h-[44px] text-sm font-bold text-[var(--ink-muted)] hover:text-[var(--ink)]">{isRegister ? 'Already have an account? ' : "Don't have an account? "}<span className="font-black uppercase underline decoration-[var(--magenta)] decoration-2 underline-offset-4">{isRegister ? 'Sign in' : 'Sign up'}</span></button>
              </div>
            </div>
            <p className="mt-5 text-center text-xs font-bold text-[var(--ink-muted)]">By continuing you agree to our Terms and Privacy.</p>
          </motion.div>
        </section>
      </div>
    </div>
  );
};

const Field = ({ icon: Icon, label, type, placeholder, value, onChange, name, autoComplete, inputMode, trailing }) => (
  <div className="space-y-2">
    <label className="section-label block" htmlFor={name}>{label}</label>
    <div className="relative">
      <Icon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--ink-muted)]" weight="bold" aria-hidden="true" />
      <input id={name} name={name} type={type} autoComplete={autoComplete} inputMode={inputMode} placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} required
        className={`neo-input px-3 py-3.5 pl-11 pr-3 text-[15px] font-semibold ${trailing ? 'pr-12' : ''}`} />
      {trailing}
    </div>
  </div>
);

export default Auth;
