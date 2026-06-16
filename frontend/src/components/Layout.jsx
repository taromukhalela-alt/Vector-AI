import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from './ThemeToggle';
import {
  MessageSquare, FlaskConical, BookOpen, History as HistoryIcon,
  Mic, FileText, LogOut, Menu, X, User, ChevronLeft, ChevronRight, Gauge,
  MoreHorizontal
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
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenu, setUserMenu] = useState(false);

  // Auto-collapse sidebar on smaller desktop screens
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024 && window.innerWidth >= 768) setCollapsed(true);
      else if (window.innerWidth >= 1024) setCollapsed(false);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const goToPath = (path) => {
    navigate(path);
    setMobileMenuOpen(false);
  };

  // Mobile bottom nav items (max 5)
  const mobileNavItems = tabs.slice(0, 4);
  const isMoreActive = tabs.slice(4).some(t => t.path === location.pathname);

  return (
    <div className="relative flex h-dvh overflow-hidden bg-zinc-950 text-zinc-100 light:bg-[#fafaf9] light:text-zinc-900">
      {/* Ambient backdrop */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-70"
        style={{
          background:
            'radial-gradient(800px 400px at 12% -10%, rgba(16,185,129,0.08), transparent 60%),' +
            'radial-gradient(1100px 600px at 50% 110%, rgba(6,95,70,0.06), transparent 60%)',
        }}
      />

      {/* ── Desktop Sidebar ── */}
      <aside
        className={`hidden md:flex flex-col border-r border-white/[0.06] bg-zinc-950/50 backdrop-blur-xl transition-all duration-300 ease-in-out light:border-zinc-200 light:bg-white/50 ${
          collapsed ? 'w-[var(--sidebar-w-collapsed)]' : 'w-[var(--sidebar-w)]'
        }`}
      >
        {/* Brand */}
        <div className="flex h-16 items-center px-4">
          <button
            onClick={() => goToPath('/dashboard')}
            className="flex items-center gap-3 overflow-hidden"
          >
            <BrandMark className="h-8 w-8 shrink-0" />
            {!collapsed && (
              <span className="anim-fade-in whitespace-nowrap text-sm font-bold tracking-tight">
                Vector<span className="text-emerald-400">.</span>AI
              </span>
            )}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-3 py-4">
          {tabs.map((item) => {
            const Icon = item.icon;
            const active = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => goToPath(item.path)}
                className={`sidebar-item group relative w-full ${
                  active 
                    ? 'bg-emerald-500/10 text-emerald-400 light:bg-emerald-50 light:text-emerald-700' 
                    : 'text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-100 light:text-zinc-500 light:hover:bg-zinc-100 light:hover:text-zinc-900'
                }`}
              >
                <Icon className={`h-5 w-5 shrink-0 ${active ? 'stroke-[2.5px]' : 'stroke-[1.8px]'}`} />
                {!collapsed && <span className="anim-fade-in whitespace-nowrap">{item.label}</span>}
                {active && !collapsed && (
                  <div className="absolute left-0 h-5 w-1 rounded-r-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                )}
                {collapsed && (
                  <div className="absolute left-full ml-2 hidden rounded-lg bg-zinc-900 px-2.5 py-1.5 text-xs font-semibold whitespace-nowrap group-hover:block z-50 border border-white/10 shadow-xl">
                    {item.label}
                  </div>
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="border-t border-white/[0.06] p-3 space-y-2 light:border-zinc-200">
          <ThemeToggle className={collapsed ? 'mx-auto' : ''} />
          
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex w-full items-center gap-3 rounded-xl px-3 py-2 text-zinc-500 hover:bg-white/[0.04] transition-all light:hover:bg-zinc-100"
          >
            {collapsed ? <ChevronRight className="h-5 w-5 mx-auto" /> : <><ChevronLeft className="h-5 w-5" /> <span className="text-xs font-semibold uppercase tracking-wider">Collapse</span></>}
          </button>

          {/* User Menu */}
          <div className="relative pt-2">
            <button
              onClick={() => setUserMenu(!userMenu)}
              className={`flex w-full items-center gap-3 rounded-xl p-1.5 transition-all ${
                userMenu ? 'bg-white/[0.08] light:bg-zinc-100' : 'hover:bg-white/[0.04] light:hover:bg-zinc-100'
              }`}
            >
              <div className="h-8 w-8 shrink-0 rounded-lg bg-emerald-500/20 flex items-center justify-center border border-emerald-500/20">
                <User className="h-4 w-4 text-emerald-400" />
              </div>
              {!collapsed && (
                <div className="anim-fade-in flex-1 overflow-hidden text-left">
                  <p className="truncate text-xs font-semibold">{user?.name || 'Learner'}</p>
                  <p className="text-[10px] text-zinc-500 uppercase tracking-tight">Grade 12 Student</p>
                </div>
              )}
            </button>
            
            {userMenu && (
              <>
                <div className="fixed inset-0 z-[150]" onClick={() => setUserMenu(false)} />
                <div className={`anim-scale-in absolute bottom-full z-[200] mb-2 w-56 overflow-hidden rounded-2xl border border-white/[0.08] bg-zinc-950/95 p-1.5 shadow-2xl backdrop-blur-xl light:border-zinc-200 light:bg-white/95 ${collapsed ? 'left-0' : 'left-0'}`}>
                   <button
                    onClick={() => { logout(); setUserMenu(false); }}
                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-xs font-semibold text-red-400 hover:bg-red-500/10 transition"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign out
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </aside>

      {/* ── Mobile Layout ── */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Content Area */}
        <main className="flex-1 overflow-hidden flex flex-col relative">
          <div className="flex-1 overflow-y-auto page-enter">
            {children}
          </div>
        </main>

        {/* Mobile Bottom Nav (Polished) */}
        <nav className="flex h-16 items-center border-t border-white/[0.06] bg-zinc-950/90 backdrop-blur-xl md:hidden pb-safe light:border-zinc-200 light:bg-white/90">
          {mobileNavItems.map((item) => {
            const Icon = item.icon;
            const active = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => goToPath(item.path)}
                className={`flex flex-1 flex-col items-center justify-center gap-1 transition-all ${
                  active ? 'text-emerald-400' : 'text-zinc-500'
                }`}
              >
                <div className={`relative p-1 rounded-lg transition-all ${active ? 'bg-emerald-500/10' : ''}`}>
                  <Icon className={`h-5 w-5 ${active ? 'stroke-[2.5px]' : 'stroke-[1.8px]'}`} />
                </div>
                <span className={`text-[10px] font-bold tracking-tight ${active ? 'text-emerald-400' : 'text-zinc-500'}`}>
                  {item.shortLabel}
                </span>
              </button>
            );
          })}
          <button
            onClick={() => setMobileMenuOpen(true)}
            className={`flex flex-1 flex-col items-center justify-center gap-1 transition-all ${
              isMoreActive ? 'text-emerald-400' : 'text-zinc-500'
            }`}
          >
            <div className={`relative p-1 rounded-lg transition-all ${isMoreActive ? 'bg-emerald-500/10' : ''}`}>
              <MoreHorizontal className="h-5 w-5" />
            </div>
            <span className={`text-[10px] font-bold tracking-tight ${isMoreActive ? 'text-emerald-400' : 'text-zinc-500'}`}>
              More
            </span>
          </button>
        </nav>
      </div>

      {/* Mobile Actions Bottom Sheet */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[400] md:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm anim-fade-in" onClick={() => setMobileMenuOpen(false)} />
          <div className="anim-fade-up absolute bottom-0 left-0 right-0 max-h-[80dvh] overflow-y-auto rounded-t-[32px] border-t border-white/10 bg-zinc-900 p-6 shadow-[0_-12px_40px_rgba(0,0,0,0.6)]">
            <div className="mx-auto mb-6 h-1.5 w-12 rounded-full bg-white/10" />
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-2.5">
                <BrandMark className="h-8 w-8" />
                <h3 className="font-bold tracking-tight">System Menu</h3>
              </div>
              <button onClick={() => setMobileMenuOpen(false)} className="rounded-full bg-white/5 p-2">
                <X className="h-5 w-5 text-zinc-400" />
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-3 mb-8">
              {tabs.map((item) => {
                const Icon = item.icon;
                const active = location.pathname === item.path;
                return (
                  <button
                    key={item.path}
                    onClick={() => goToPath(item.path)}
                    className={`flex flex-col items-start gap-3 rounded-2xl p-4 transition-all border ${
                      active 
                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                        : 'bg-white/[0.03] border-white/[0.06] text-zinc-400'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="text-xs font-bold">{item.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="space-y-3 pt-6 border-t border-white/[0.06]">
              <div className="flex items-center justify-between px-2">
                <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Theme</span>
                <ThemeToggle />
              </div>
              <button
                onClick={() => { logout(); setMobileMenuOpen(false); }}
                className="flex w-full items-center gap-3 rounded-2xl px-4 py-4 text-sm font-bold text-red-400 bg-red-500/5 border border-red-500/10 active:bg-red-500/10 transition"
              >
                <LogOut className="h-5 w-5" />
                Sign out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Layout;
