// ─────────────────────────────────────────────────────────────────────────────
// Layout.jsx — Emerald Nexus (refined)
// Floating navbar + bottom mobile nav. Editorial spacing, tighter contrast,
// emerald accent as the single point of color. Drop into src/components/.
// ─────────────────────────────────────────────────────────────────────────────
import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from './ThemeToggle';
import {
  MessageSquare, FlaskConical, BookOpen, History as HistoryIcon,
  Mic, FileText, LogOut, Menu, X, User, ChevronDown, Gauge,
} from 'lucide-react';

const tabs = [
  { path: '/dashboard', label: 'Dashboard',     shortLabel: 'Dashboard', icon: Gauge },
  { path: '/chat',      label: 'AI Tutor',      shortLabel: 'Tutor',     icon: MessageSquare },
  { path: '/lab',       label: 'Visual Lab',    shortLabel: 'Lab',       icon: FlaskConical },
  { path: '/notes',     label: 'Study Notes',   shortLabel: 'Notes',     icon: FileText },
  { path: '/voice',     label: 'Voice Tutor',   shortLabel: 'Voice',     icon: Mic },
  { path: '/history',   label: 'History',       shortLabel: 'History',   icon: HistoryIcon },
  { path: '/topics',    label: 'CAPS Syllabus', shortLabel: 'CAPS',      icon: BookOpen },
];

const BrandMark = ({ className }) => (
  <svg viewBox="0 0 64 64" className={className} xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Vector AI">
    <defs>
      <linearGradient id="v-grad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#34d399" />
        <stop offset="100%" stopColor="#059669" />
      </linearGradient>
    </defs>
    <rect width="64" height="64" rx="18" fill="#050807" />
    <rect x="1" y="1" width="62" height="62" rx="17" fill="none" stroke="rgba(16,185,129,0.25)" />
    <path d="M22 14 L42 14 L30 32 H44 L18 60 L26 36 H12 L22 14 Z" fill="url(#v-grad)" />
  </svg>
);

const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenu, setUserMenu] = useState(false);

  const activeTab = tabs.find(t => t.path === location.pathname);

  const goToPath = (path) => {
    navigate(path);
    setMobileMenuOpen(false);
  };

  return (
    <div
      className="relative flex h-dvh flex-col overflow-hidden bg-zinc-950 text-zinc-100 light:bg-[#fafaf9] light:text-zinc-900"
      style={{ fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif" }}
    >
      {/* Ambient backdrop — subtle emerald aurora */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-70 dark:opacity-70 light:opacity-40"
        style={{
          background:
            'radial-gradient(800px 400px at 12% -10%, rgba(16,185,129,0.10), transparent 60%),' +
            'radial-gradient(700px 500px at 100% 0%, rgba(45,212,191,0.06), transparent 55%),' +
            'radial-gradient(1100px 600px at 50% 110%, rgba(6,95,70,0.08), transparent 60%)',
        }}
      />

      {/* ── Floating Navbar ── */}
      <nav
        className="floating-bar anim-fade-down border border-white/[0.06] bg-zinc-950/80 backdrop-blur-xl light:border-zinc-200/60 light:bg-white/80"
        style={{
          top: 'var(--float-gap)',
          boxShadow:
            '0 1px 0 rgba(255,255,255,0.04) inset, 0 8px 32px rgba(0,0,0,0.45), 0 0 0 1px rgba(16,185,129,0.04)',
        }}
      >
        <div className="flex h-[var(--navbar-h)] items-center justify-between gap-2 px-3">
          {/* Brand */}
          <button
            onClick={() => goToPath('/dashboard')}
            className="group flex shrink-0 items-center gap-2.5 rounded-xl px-1 py-1 transition-all hover:bg-white/[0.03]"
          >
            <div className="relative">
              <BrandMark className="h-8 w-8" />
              <span className="absolute -inset-0.5 -z-10 rounded-2xl bg-emerald-500/20 opacity-0 blur-md transition-opacity group-hover:opacity-100" />
            </div>
            <div className="hidden sm:block text-left">
              <span className="block text-[13px] font-semibold leading-none tracking-tight text-zinc-50 light:text-zinc-900">
                Vector<span className="text-emerald-400">.</span>AI
              </span>
              <span className="mt-1 block text-[9px] font-semibold uppercase tracking-[0.22em] text-emerald-400/90">
                {activeTab?.label || 'STEM Operating System'}
              </span>
            </div>
          </button>

          {/* Desktop tabs */}
          <div
            className="hidden items-center gap-0.5 rounded-2xl border border-white/[0.05] bg-white/[0.02] p-1 md:flex light:border-zinc-200/70 light:bg-zinc-100/60"
          >
            {tabs.map((item) => {
              const Icon = item.icon;
              const active = location.pathname === item.path;
              return (
                <button
                  key={item.path}
                  onClick={() => goToPath(item.path)}
                  title={item.label}
                  aria-current={active ? 'page' : undefined}
                  className={[
                    'group relative flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-[11px] font-semibold tracking-tight transition-all duration-200',
                    active
                      ? 'text-emerald-300 light:text-emerald-700'
                      : 'text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.04] light:text-zinc-500 light:hover:text-zinc-900 light:hover:bg-white',
                  ].join(' ')}
                  style={
                    active
                      ? {
                          background:
                            'linear-gradient(135deg, rgba(16,185,129,0.18), rgba(6,95,70,0.10))',
                          boxShadow:
                            '0 0 0 1px rgba(16,185,129,0.28) inset, 0 6px 18px -8px rgba(16,185,129,0.45)',
                        }
                      : undefined
                  }
                >
                  <Icon className="h-3.5 w-3.5" strokeWidth={active ? 2.4 : 1.9} />
                  <span className="hidden lg:inline">{item.shortLabel}</span>
                  {active && (
                    <span
                      className="absolute -bottom-[3px] left-1/2 h-[3px] w-6 -translate-x-1/2 rounded-full bg-emerald-400"
                      style={{ boxShadow: '0 0 10px rgba(16,185,129,0.7)' }}
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* Right cluster */}
          <div className="flex shrink-0 items-center gap-1.5">
            <ThemeToggle />

            <div className="relative">
              <button
                onClick={() => setUserMenu(v => !v)}
                className={[
                  'flex items-center gap-1.5 rounded-xl border p-1 transition-all',
                  userMenu
                    ? 'border-white/10 bg-white/[0.06] light:border-zinc-300 light:bg-white'
                    : 'border-transparent hover:border-white/10 hover:bg-white/[0.04] light:hover:border-zinc-200 light:hover:bg-white',
                ].join(' ')}
                aria-label="Open account menu"
              >
                {user?.avatar ? (
                  <img
                    src={user.avatar}
                    alt=""
                    className="h-7 w-7 rounded-lg border border-white/10 object-cover"
                  />
                ) : (
                  <div
                    className="flex h-7 w-7 items-center justify-center rounded-lg border border-emerald-500/25"
                    style={{
                      background:
                        'linear-gradient(135deg, rgba(16,185,129,0.20), rgba(6,95,70,0.08))',
                    }}
                  >
                    <User className="h-3.5 w-3.5 text-emerald-300" />
                  </div>
                )}
                <ChevronDown
                  className="hidden h-3 w-3 text-zinc-500 transition-transform duration-200 sm:block"
                  style={{ transform: userMenu ? 'rotate(180deg)' : 'rotate(0deg)' }}
                />
              </button>

              {userMenu && (
                <>
                  <div className="fixed inset-0 z-[150]" onClick={() => setUserMenu(false)} />
                  <div
                    className="anim-scale-in absolute right-0 top-full z-[200] mt-2 w-60 overflow-hidden rounded-2xl border border-white/[0.08] bg-zinc-950/95 p-1.5 shadow-2xl backdrop-blur-xl light:border-zinc-200/70 light:bg-white/95"
                  >
                    <div className="mb-1 flex items-center gap-3 border-b border-white/[0.06] px-3 py-3 light:border-zinc-200">
                      <div
                        className="flex h-9 w-9 items-center justify-center rounded-xl border border-emerald-500/25"
                        style={{
                          background:
                            'linear-gradient(135deg, rgba(16,185,129,0.22), rgba(6,95,70,0.08))',
                        }}
                      >
                        <User className="h-4 w-4 text-emerald-300" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-xs font-semibold text-zinc-50 light:text-zinc-900">
                          {user?.name || 'Learner'}
                        </p>
                        <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-400">
                          CAPS Student
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => { logout(); setUserMenu(false); }}
                      className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-red-400 transition hover:bg-red-500/10"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      Sign out
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Hamburger */}
            <button
              onClick={() => setMobileMenuOpen(v => !v)}
              className="rounded-xl p-1.5 transition md:hidden hover:bg-white/[0.06] light:hover:bg-zinc-100"
              aria-label="Toggle navigation"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </nav>

      {/* ── Mobile Drawer ── */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[150] md:hidden" onClick={() => setMobileMenuOpen(false)}>
          <div className="absolute inset-0 bg-zinc-950/70 backdrop-blur-sm" />
          <div
            className="anim-slide-right absolute right-3 space-y-1 rounded-2xl border border-white/[0.08] bg-zinc-950/95 p-2 shadow-2xl backdrop-blur-xl light:border-zinc-200/70 light:bg-white/95"
            style={{
              top: 'calc(var(--navbar-h) + var(--float-gap) + 14px)',
              minWidth: '220px',
            }}
            onClick={e => e.stopPropagation()}
          >
            {tabs.map((item) => {
              const Icon = item.icon;
              const active = location.pathname === item.path;
              return (
                <button
                  key={item.path}
                  onClick={() => goToPath(item.path)}
                  className={[
                    'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition',
                    active
                      ? 'text-emerald-300'
                      : 'text-zinc-300 hover:bg-white/[0.04] light:text-zinc-700 light:hover:bg-zinc-100',
                  ].join(' ')}
                  style={
                    active
                      ? {
                          background:
                            'linear-gradient(135deg, rgba(16,185,129,0.16), rgba(6,95,70,0.08))',
                          boxShadow: '0 0 0 1px rgba(16,185,129,0.25) inset',
                        }
                      : undefined
                  }
                >
                  <Icon className="h-4 w-4" strokeWidth={active ? 2.4 : 1.9} />
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Page Content ── */}
      <main
        className="flex min-h-0 flex-1 flex-col overflow-hidden"
        style={{
          paddingTop: 'calc(var(--navbar-h) + var(--float-gap) * 2)',
          paddingBottom: 'calc(80px + env(safe-area-inset-bottom))',
        }}
      >
        <div className="anim-fade-in d-100 min-h-0 flex-1">{children}</div>
      </main>

      {/* ── Mobile Bottom Nav ── */}
      <nav
        className="fixed inset-x-0 bottom-0 z-[120] border-t border-white/[0.06] bg-zinc-950/95 backdrop-blur-xl md:hidden light:border-zinc-200/70 light:bg-white/95"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        aria-label="Mobile navigation"
      >
        <div className="flex h-[68px] items-stretch">
          {tabs.map((item) => {
            const Icon = item.icon;
            const active = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => goToPath(item.path)}
                aria-current={active ? 'page' : undefined}
                className="relative flex flex-1 select-none flex-col items-center justify-center gap-1 transition active:scale-95"
              >
                {active && (
                  <span
                    className="absolute inset-x-3 top-0 h-[2px] rounded-full bg-emerald-400"
                    style={{ boxShadow: '0 0 12px rgba(16,185,129,0.8)' }}
                  />
                )}
                <Icon
                  className={[
                    'h-5 w-5 transition',
                    active
                      ? 'text-emerald-400'
                      : 'text-zinc-500 light:text-zinc-400',
                  ].join(' ')}
                  strokeWidth={active ? 2.4 : 1.9}
                />
                <span
                  className={[
                    'text-[9.5px] font-semibold uppercase tracking-[0.14em] transition',
                    active
                      ? 'text-emerald-400'
                      : 'text-zinc-500 light:text-zinc-500',
                  ].join(' ')}
                >
                  {item.shortLabel}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export default Layout;
