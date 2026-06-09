import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, User, Sparkles, AlertCircle } from 'lucide-react';

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
      if (res.success) {
        onNavigate('chat');
      } else {
        setError(res.message);
      }
    } else {
      if (!email.trim() || !password.trim()) {
        setError('All fields are required');
        setLoading(false);
        return;
      }
      const res = await login(email, password);
      if (res.success) {
        onNavigate('chat');
      } else {
        setError(res.message);
      }
    }
    setLoading(false);
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-zinc-950 text-zinc-100 font-sans p-6 overflow-hidden">
      {/* Background patterns */}
      <div 
        className="absolute inset-0 bg-[linear-gradient(rgba(16,185,129,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(16,185,129,0.03)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none z-0"
      />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-emerald-500/5 blur-[120px] pointer-events-none z-0" />

      {/* Main card */}
      <div className="w-full max-w-md bg-zinc-900/55 backdrop-blur-xl border border-zinc-800/80 rounded-2xl p-8 shadow-2xl z-10 relative">
        {/* Top Header */}
        <div className="text-center mb-8">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/25 anim-glow">
              V
            </div>
          <h2 className="font-extrabold text-xl uppercase tracking-wider">
            {isRegister ? 'Create Account' : 'Welcome Back'}
          </h2>
          <p className="text-xs text-zinc-400 mt-1.5 font-medium tracking-wide">
            {isRegister ? 'Access CAPS-aligned physics & chemistry tools' : 'Sign in to access your dashboard and notes'}
          </p>
        </div>

        {/* Error alert */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-start gap-3">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="font-medium leading-relaxed">{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Full Name</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input
                  type="text"
                  placeholder="e.g. Taro Mukhalela"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 focus:border-emerald-500/50 rounded-xl py-3 pl-10 pr-4 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none transition-all"
                  required
                />
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                type="email"
                placeholder="e.g. taro@vectorai.co.za"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 focus:border-emerald-500/50 rounded-xl py-3 pl-10 pr-4 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none transition-all"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 focus:border-emerald-500/50 rounded-xl py-3 pl-10 pr-4 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none transition-all"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-zinc-950 font-bold rounded-xl py-3 text-xs tracking-wider uppercase shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/20 active:translate-y-0.5 hover:-translate-y-0.5 transition-all mt-6 flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                {isRegister ? 'Register' : 'Login'}
                <Sparkles className="w-3.5 h-3.5 fill-current" />
              </>
            )}
          </button>
        </form>

        {/* Footer switch link */}
        <div className="text-center mt-6">
          <button
            onClick={() => {
              setIsRegister(!isRegister);
              setError('');
            }}
            className="text-xs text-zinc-400 hover:text-emerald-400 transition-colors font-medium cursor-pointer"
          >
            {isRegister ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Auth;
