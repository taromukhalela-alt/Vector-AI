import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from './ThemeToggle';
import {
  MessageSquare, FlaskConical, BookOpen, History as HistoryIcon,
  Mic, FileText, LogOut, Menu, X, User, Zap, ChevronDown,
} from 'lucide-react';

const tabs = [
  { path: '/chat',    label: 'AI Tutor',     shortLabel: 'Tutor',    icon: MessageSquare },
  { path: '/lab',     label: 'Visual Lab',   shortLabel: 'Lab',      icon: FlaskConical },
  { path: '/notes',   label: 'Study Notes',  shortLabel: 'Notes',    icon: FileText },
  { path: '/voice',   label: 'Voice Tutor',  shortLabel: 'Voice',    icon: Mic },
  { path: '/history', label: 'History',      shortLabel: 'History',  icon: HistoryIcon },
  { path: '/topics',  label: 'CAPS Syllabus', shortLabel: 'CAPS',   icon: BookOpen },
];

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
    <div className="relative flex h-dvh flex-col overflow-hidden bg-zinc-950 text-zinc-100" style={{ fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif" }}>

      {/* ── Floating Navbar ── */}
      <nav
        className="floating-bar anim-fade-down"
        style={{
          top: 'var(--float-gap)',
          background: 'rgba(12,12,14,0.85)',
          borderColor: 'rgba(255,255,255,0.08)',
          boxShadow: '0 4px 24px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.04)',
        }}
      >
        <div className="flex h-[var(--navbar-h)] items-center justify-between gap-2 px-3">

          {/* Brand */}
          <div className="flex shrink-0 items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/25 anim-glow">
              <Zap className="w-4 h-4 text-zinc-950" strokeWidth={2.5} />
            </div>
            <div className="hidden sm:block">
              <span className="block text-sm font-extrabold leading-none tracking-tight text-zinc-50">Vector AI</span>
              <span className="mt-0.5 block text-[9px] font-bold uppercase tracking-[.16em] text-emerald-400">
                {activeTab?.label || 'STEM OS'}
              </span>
            </div>
          </div>

          {/* Desktop Tab Navigation */}
          <div className="hidden md:flex items-center gap-0.5 rounded-xl p-1"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            {tabs.map((item) => {
              const Icon = item.icon;
              const active = location.pathname === item.path;
              return (
                <button
                  key={item.path}
                  id={`nav-${item.path.slice(1)}`}
                  onClick={() => goToPath(item.path)}
                  title={item.label}
                  aria-current={active ? 'page' : undefined}
                  className="relative flex items-center gap-1.5 rounded-lg px-3 py-2 text-[11px] font-semibold whitespace-nowrap transition-all duration-200 cursor-pointer"
                  style={active ? {
                    background: 'linear-gradient(135deg, rgba(16,185,129,0.18), rgba(45,212,191,0.10))',
                    color: '#10b981',
                    boxShadow: '0 0 12px rgba(16,185,129,0.12)',
                    border: '1px solid rgba(16,185,129,0.20)',
                  } : {
                    color: '#71717a',
                    background: 'transparent',
                    border: '1px solid transparent',
                  }}
                  onMouseEnter={e => { if (!active) { e.currentTarget.style.color = '#d4d4d8'; e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; } }}
                  onMouseLeave={e => { if (!active) { e.currentTarget.style.color = '#71717a'; e.currentTarget.style.background = 'transparent'; } }}
                >
                  <Icon className="h-3.5 w-3.5" strokeWidth={active ? 2.5 : 2} />
                  <span className="hidden lg:inline">{item.shortLabel}</span>
                  {active && (
                    <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-3 h-0.5 rounded-full"
                      style={{ background: '#10b981', boxShadow: '0 0 4px #10b981' }}
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* Right Controls */}
          <div className="flex shrink-0 items-center gap-1">
            <ThemeToggle />

            {/* User Menu */}
            <div className="relative">
              <button
                id="user-menu-btn"
                onClick={() => setUserMenu(!userMenu)}
                className="flex items-center gap-1.5 rounded-xl p-1.5 transition-all cursor-pointer"
                style={{ background: userMenu ? 'rgba(255,255,255,0.08)' : 'transparent' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; }}
                onMouseLeave={e => { if (!userMenu) e.currentTarget.style.background = 'transparent'; }}
                title="Account"
                aria-label="Open account menu"
              >
                {user?.avatar ? (
                  <img src={user.avatar} alt="" className="h-7 w-7 rounded-lg border" style={{ borderColor: 'rgba(255,255,255,0.10)' }} />
                ) : (
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg"
                    style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.20), rgba(45,212,191,0.12))', border: '1px solid rgba(16,185,129,0.20)' }}
                  >
                    <User className="h-3.5 w-3.5 text-emerald-400" />
                  </div>
                )}
                <ChevronDown className="hidden h-3 w-3 text-zinc-500 sm:block transition-transform duration-200"
                  style={{ transform: userMenu ? 'rotate(180deg)' : 'rotate(0deg)' }}
                />
              </button>

              {userMenu && (
                <>
                  <div className="fixed inset-0 z-[150]" onClick={() => setUserMenu(false)} />
                  <div className="anim-scale-in absolute right-0 top-full z-[200] mt-2 w-52 rounded-xl p-1.5 shadow-2xl"
                    style={{ background: 'rgba(18,18,22,0.97)', border: '1px solid rgba(255,255,255,0.09)', backdropFilter: 'blur(20px)' }}
                  >
                    <div className="mb-1 border-b px-3 py-2.5" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
                      <p className="truncate text-xs font-bold text-zinc-100">{user?.name || 'Learner'}</p>
                      <p className="text-[10px] font-semibold text-emerald-400 mt-0.5">CAPS Student</p>
                    </div>
                    <button
                      onClick={() => { logout(); setUserMenu(false); }}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-red-400 transition-all cursor-pointer hover:bg-red-500/10"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      Sign Out
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Mobile hamburger */}
            <button
              id="mobile-menu-btn"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="rounded-xl p-1.5 transition-all md:hidden cursor-pointer"
              style={{ background: mobileMenuOpen ? 'rgba(255,255,255,0.08)' : 'transparent' }}
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
            className="anim-slide-right absolute right-3 space-y-1 rounded-2xl p-3 shadow-2xl"
            style={{
              top: 'calc(var(--navbar-h) + var(--float-gap) + 14px)',
              background: 'rgba(14,14,16,0.97)',
              border: '1px solid rgba(255,255,255,0.09)',
              backdropFilter: 'blur(20px)',
              minWidth: '200px',
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
                  className="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all cursor-pointer"
                  style={active ? {
                    background: 'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(45,212,191,0.08))',
                    color: '#10b981',
                    border: '1px solid rgba(16,185,129,0.18)',
                  } : {
                    color: '#71717a',
                    background: 'transparent',
                    border: '1px solid transparent',
                  }}
                >
                  <Icon className="h-4 w-4" strokeWidth={active ? 2.5 : 2} />
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Page Content ── */}
      <main
        className="flex min-h-0 flex-1 flex-col overflow-hidden pb-[calc(var(--mobile-tab-h)+env(safe-area-inset-bottom))] md:pb-0"
        style={{ paddingTop: 'calc(var(--navbar-h) + var(--float-gap) * 2 + 4px)' }}
      >
        <div className="anim-fade-in d-100 min-h-0 flex-1">{children}</div>
      </main>

      {/* ── Mobile Bottom Nav ── */}
      <nav
        className="fixed inset-x-2 bottom-2 z-[120] rounded-2xl pb-[env(safe-area-inset-bottom)] shadow-2xl md:hidden"
        style={{
          background: 'rgba(12,12,14,0.92)',
          border: '1px solid rgba(255,255,255,0.08)',
          backdropFilter: 'blur(20px)',
          boxShadow: '0 -4px 32px rgba(0,0,0,0.5)',
        }}
        aria-label="Mobile navigation"
      >
        <div className="grid grid-cols-6 gap-0.5 p-1.5">
          {tabs.map((item) => {
            const Icon = item.icon;
            const active = location.pathname === item.path;
            return (
              <button
                key={item.path}
                id={`mobile-nav-${item.path.slice(1)}`}
                onClick={() => goToPath(item.path)}
                aria-current={active ? 'page' : undefined}
                className="flex min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-1 py-2 text-[8px] font-bold uppercase tracking-wide transition-all duration-200 cursor-pointer"
                style={active ? {
                  background: 'linear-gradient(135deg, rgba(16,185,129,0.20), rgba(45,212,191,0.10))',
                  color: '#10b981',
                  boxShadow: '0 0 10px rgba(16,185,129,0.15)',
                } : { color: '#52525b' }}
              >
                <Icon className="h-4 w-4 shrink-0" strokeWidth={active ? 2.5 : 2} />
                <span className="max-w-full truncate">{item.shortLabel}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export default Layout;
