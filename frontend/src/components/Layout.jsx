import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from './ThemeToggle';
import {
  MessageSquare, FlaskConical, BookOpen, History as HistoryIcon,
  Mic, FileText, LogOut, Menu, X, User, Wifi, Zap, ChevronDown
} from 'lucide-react';

const Layout = ({ currentTab, onTabChange, children }) => {
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [now, setNow] = useState(new Date());
  const [userMenu, setUserMenu] = useState(false);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const tabs = [
    { id: 'chat',    label: 'AI Tutor',      icon: MessageSquare },
    { id: 'lab',     label: 'Visual Lab',     icon: FlaskConical },
    { id: 'notes',   label: 'Study Notes',    icon: FileText },
    { id: 'voice',   label: 'Voice Tutor',    icon: Mic },
    { id: 'history', label: 'History',        icon: HistoryIcon },
    { id: 'topics',  label: 'CAPS Syllabus',  icon: BookOpen },
  ];

  const clock = now.toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
  const date = now.toLocaleDateString('en-ZA', { weekday: 'short', day: 'numeric', month: 'short' });
  const activeLabel = tabs.find(t => t.id === currentTab)?.label || '';

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-zinc-100 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-sans relative">

      {/* ═══ FLOATING NAVBAR ═══ */}
      <nav className="floating-bar top-[var(--float-gap)] anim-fade-down glass-backdrop bg-white/70 dark:bg-zinc-900/65 border border-zinc-200/50 dark:border-zinc-800/40 shadow-lg shadow-black/[.04] dark:shadow-black/20">
        <div className="flex items-center justify-between px-3 h-[var(--navbar-h)]">

          {/* Logo */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/25 anim-glow">
              <Zap className="w-4 h-4" />
            </div>
            <div className="hidden sm:block">
              <span className="font-extrabold text-sm tracking-tight block leading-none">Vector AI</span>
              <span className="text-[9px] tracking-[.18em] text-emerald-500 font-bold uppercase block mt-0.5">STEM OS</span>
            </div>
          </div>

          {/* Desktop Tab Pills */}
          <div className="hidden md:flex items-center gap-0.5 bg-zinc-200/50 dark:bg-zinc-800/40 rounded-xl p-1">
            {tabs.map((item) => {
              const Icon = item.icon;
              const active = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all duration-300 cursor-pointer whitespace-nowrap ${
                    active
                      ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
                      : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-300/40 dark:hover:bg-zinc-700/40'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${active ? 'stroke-[2.5px]' : ''}`} />
                  <span className="hidden lg:inline">{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* Right */}
          <div className="flex items-center gap-1.5 shrink-0">
            <ThemeToggle />

            {/* User */}
            <div className="relative">
              <button
                onClick={() => setUserMenu(!userMenu)}
                className="flex items-center gap-1.5 p-1.5 rounded-xl hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50 transition-all cursor-pointer"
              >
                {user?.avatar ? (
                  <img src={user.avatar} alt="" className="w-7 h-7 rounded-lg border border-zinc-300/50 dark:border-zinc-700/50" />
                ) : (
                  <div className="w-7 h-7 rounded-lg bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center">
                    <User className="w-3.5 h-3.5 text-zinc-400" />
                  </div>
                )}
                <ChevronDown className="w-3 h-3 text-zinc-400 hidden sm:block" />
              </button>

              {userMenu && (
                <>
                  <div className="fixed inset-0 z-[150]" onClick={() => setUserMenu(false)} />
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white/90 dark:bg-zinc-900/90 glass-backdrop border border-zinc-200/60 dark:border-zinc-800/50 rounded-xl shadow-2xl p-1.5 z-[200] anim-scale-in">
                    <div className="px-3 py-2 border-b border-zinc-200/40 dark:border-zinc-800/40 mb-1">
                      <p className="text-xs font-bold truncate">{user?.name || 'Learner'}</p>
                      <p className="text-[10px] text-zinc-400 font-medium">CAPS Student</p>
                    </div>
                    <button
                      onClick={() => { logout(); setUserMenu(false); }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-red-500 hover:bg-red-500/10 rounded-lg transition-all cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      Sign Out
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-1.5 rounded-lg hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50 cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </nav>

      {/* ═══ MOBILE DRAWER ═══ */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-[90]" onClick={() => setMobileMenuOpen(false)}>
          <div className="absolute inset-0 bg-zinc-950/50 backdrop-blur-sm" />
          <div
            className="relative mx-3 mt-[76px] bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border border-zinc-200/50 dark:border-zinc-800/40 rounded-2xl shadow-2xl p-2.5 space-y-0.5 anim-scale-in"
            onClick={e => e.stopPropagation()}
          >
            {tabs.map((item) => {
              const Icon = item.icon;
              const active = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => { onTabChange(item.id); setMobileMenuOpen(false); }}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                    active
                      ? 'bg-emerald-500 text-white shadow-md'
                      : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200/40 dark:hover:bg-zinc-800/40'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ═══ MAIN CONTENT ═══ */}
      <main
        className="flex-1 overflow-y-auto"
        style={{
          paddingTop: 'calc(var(--navbar-h) + var(--float-gap) * 2 + 4px)',
        }}
      >
        <div className="h-full anim-fade-in d-150">{children}</div>
      </main>

      {/* ═══ SEPARATED STATUS BAR ═══ */}
      <footer className="relative w-full bg-white/95 dark:bg-zinc-900/95 border-t border-zinc-200/50 dark:border-zinc-800/40 shadow-sm shadow-black/[.05]">
        <div className="flex items-center justify-between px-4 h-[var(--status-h)] text-[10px] font-semibold tracking-wider uppercase select-none">

          {/* Left: connection + tab */}
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-emerald-500">
              <Wifi className="w-3 h-3" />
              <span className="hidden sm:inline">Online</span>
            </span>
            <span className="text-zinc-400 dark:text-zinc-500 hidden sm:inline">
              <span className="text-zinc-300 dark:text-zinc-700 mx-1">│</span>
              {activeLabel}
            </span>
          </div>

          {/* Center: branding */}
          <span className="text-zinc-400 dark:text-zinc-600 hidden md:flex items-center gap-1.5">
            <Zap className="w-3 h-3 text-emerald-500" />
            Built by Taro Mukhalela
          </span>

          {/* Right: clock */}
          <div className="flex items-center gap-3 text-zinc-500 dark:text-zinc-400">
            <span className="hidden sm:inline">{date}</span>
            <span className="font-mono tracking-widest text-emerald-500">{clock}</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
