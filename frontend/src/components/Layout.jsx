import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from './ThemeToggle';
import {
  MessageSquare, FlaskConical, BookOpen, History as HistoryIcon,
  Mic, FileText, LogOut, Menu, X, User, Zap, ChevronDown,
  Minimize2, Maximize2
} from 'lucide-react';

const tabs = [
  { path: '/chat', label: 'AI Tutor', icon: MessageSquare },
  { path: '/lab', label: 'Visual Lab', icon: FlaskConical },
  { path: '/notes', label: 'Study Notes', icon: FileText },
  { path: '/voice', label: 'Voice Tutor', icon: Mic },
  { path: '/history', label: 'History', icon: HistoryIcon },
  { path: '/topics', label: 'CAPS Syllabus', icon: BookOpen },
];

const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenu, setUserMenu] = useState(false);
  const [compactNav, setCompactNav] = useState(() => (
    typeof window !== 'undefined'
      ? localStorage.getItem('vector_layout_compact_nav') !== 'false'
      : true
  ));

  const activeLabel = tabs.find(t => t.path === location.pathname)?.label || 'STEM OS';

  const goToPath = (path) => {
    navigate(path);
    setMobileMenuOpen(false);
  };

  const toggleCompactNav = () => {
    setCompactNav((current) => {
      const next = !current;
      localStorage.setItem('vector_layout_compact_nav', String(next));
      return next;
    });
  };

  return (
    <div className="relative flex h-dvh flex-col overflow-hidden bg-zinc-100 font-sans text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <nav className="floating-bar top-[var(--float-gap)] anim-fade-down glass-backdrop border border-zinc-200/60 bg-white/85 shadow-md shadow-black/[.03] dark:border-zinc-800/60 dark:bg-zinc-950/80 dark:shadow-black/10">
        <div className="flex h-[var(--navbar-h)] items-center justify-between gap-2 px-2.5">
          <div className="flex min-w-0 shrink-0 items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-400 to-teal-500 text-white shadow-sm shadow-emerald-500/20">
              <Zap className="h-4 w-4" />
            </div>
            <div className="hidden min-w-0 sm:block">
              <span className="block text-sm font-extrabold leading-none tracking-tight">Vector AI</span>
              <span className="mt-0.5 block truncate text-[9px] font-bold uppercase tracking-[.14em] text-emerald-500">{activeLabel}</span>
            </div>
          </div>

          <div className="hidden items-center gap-0.5 rounded-lg border border-zinc-200/70 bg-zinc-200/35 p-1 dark:border-zinc-800/60 dark:bg-zinc-900/60 md:flex">
            {tabs.map((item) => {
              const Icon = item.icon;
              const active = location.pathname === item.path;
              return (
                <button
                  key={item.path}
                  onClick={() => goToPath(item.path)}
                  title={item.label}
                  className={`flex items-center justify-center gap-1.5 rounded-md px-2.5 py-1.5 text-[11px] font-semibold whitespace-nowrap transition-all duration-200 ${
                    active
                      ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/15'
                      : 'text-zinc-500 hover:bg-zinc-300/40 hover:text-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700/40 dark:hover:text-zinc-200'
                  }`}
                >
                  <Icon className={`h-3.5 w-3.5 ${active ? 'stroke-[2.5px]' : ''}`} />
                  {!compactNav && <span className="hidden xl:inline">{item.label}</span>}
                </button>
              );
            })}
          </div>

          <div className="flex shrink-0 items-center gap-1.5">
            <button
              onClick={toggleCompactNav}
              className="hidden h-8 w-8 items-center justify-center rounded-lg text-zinc-500 transition hover:bg-zinc-200/60 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100 md:flex"
              title={compactNav ? 'Expand navigation labels' : 'Minimize navigation labels'}
            >
              {compactNav ? <Maximize2 className="h-3.5 w-3.5" /> : <Minimize2 className="h-3.5 w-3.5" />}
            </button>
            <ThemeToggle />

            <div className="relative">
              <button
                onClick={() => setUserMenu(!userMenu)}
                className="flex items-center gap-1.5 rounded-lg p-1.5 transition hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50"
                title="Account"
              >
                {user?.avatar ? (
                  <img src={user.avatar} alt="" className="h-7 w-7 rounded-lg border border-zinc-300/50 dark:border-zinc-700/50" />
                ) : (
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-200 dark:bg-zinc-800">
                    <User className="h-3.5 w-3.5 text-zinc-400" />
                  </div>
                )}
                <ChevronDown className="hidden h-3 w-3 text-zinc-400 sm:block" />
              </button>

              {userMenu && (
                <>
                  <div className="fixed inset-0 z-[150]" onClick={() => setUserMenu(false)} />
                  <div className="anim-scale-in absolute right-0 top-full z-[200] mt-2 w-48 rounded-xl border border-zinc-200/60 bg-white/95 p-1.5 shadow-2xl dark:border-zinc-800/50 dark:bg-zinc-900/95">
                    <div className="mb-1 border-b border-zinc-200/40 px-3 py-2 dark:border-zinc-800/40">
                      <p className="truncate text-xs font-bold">{user?.name || 'Learner'}</p>
                      <p className="text-[10px] font-medium text-zinc-400">CAPS Student</p>
                    </div>
                    <button
                      onClick={() => { logout(); setUserMenu(false); }}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-red-500 transition hover:bg-red-500/10"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      Sign Out
                    </button>
                  </div>
                </>
              )}
            </div>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="rounded-lg p-1.5 transition hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50 md:hidden"
              title="Navigation"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </nav>

      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[150] md:hidden" onClick={() => setMobileMenuOpen(false)}>
          <div className="absolute inset-0 bg-zinc-950/50 backdrop-blur-sm" />
          <div
            className="anim-scale-in relative mx-3 mt-[76px] space-y-0.5 rounded-xl border border-zinc-200/50 bg-white/95 p-2.5 shadow-2xl backdrop-blur-xl dark:border-zinc-800/40 dark:bg-zinc-900/95"
            onClick={e => e.stopPropagation()}
          >
            {tabs.map((item) => {
              const Icon = item.icon;
              const active = location.pathname === item.path;
              return (
                <button
                  key={item.path}
                  onClick={() => goToPath(item.path)}
                  className={`flex w-full items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-semibold transition ${
                    active
                      ? 'bg-emerald-500 text-white shadow-sm'
                      : 'text-zinc-600 hover:bg-zinc-200/40 dark:text-zinc-400 dark:hover:bg-zinc-800/40'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <main
        className="flex min-h-0 flex-1 flex-col overflow-hidden pb-[calc(var(--mobile-tab-h)+env(safe-area-inset-bottom))] md:pb-0"
        style={{ paddingTop: 'calc(var(--navbar-h) + var(--float-gap) * 2 + 4px)' }}
      >
        <div className="anim-fade-in d-150 min-h-0 flex-1">{children}</div>
      </main>

      <nav className="fixed inset-x-2 bottom-2 z-[120] rounded-xl border border-zinc-200/60 bg-white/90 pb-[env(safe-area-inset-bottom)] shadow-xl shadow-black/10 backdrop-blur-md dark:border-zinc-800/60 dark:bg-zinc-950/90 md:hidden">
        <div className="grid grid-cols-6 gap-0.5 p-1">
          {tabs.map((item) => {
            const Icon = item.icon;
            const active = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => goToPath(item.path)}
                className={`flex min-w-0 flex-col items-center justify-center gap-0.5 rounded-lg px-1 py-1.5 text-[8px] font-bold uppercase tracking-wide transition-all ${
                  active
                    ? 'bg-emerald-500 text-zinc-950 shadow-sm shadow-emerald-500/20'
                    : 'text-zinc-500 hover:bg-zinc-200/60 dark:text-zinc-400 dark:hover:bg-zinc-800/60'
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="max-w-full truncate">{item.label.replace('CAPS ', '').replace(' Tutor', '')}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export default Layout;
