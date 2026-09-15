import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from './ThemeToggle';
import { MessageSquare, FlaskConical, BookOpen, History as HistoryIcon, Mic, FileText, LogOut, User, ChevronLeft, ChevronRight, Gauge, MoreHorizontal, X } from 'lucide-react';

const tabs = [
  { path: '/dashboard', label: 'Dashboard', shortLabel: 'Home', icon: Gauge },
  { path: '/chat', label: 'AI Tutor', shortLabel: 'Tutor', icon: MessageSquare },
  { path: '/lab', label: 'Visual Lab', shortLabel: 'Lab', icon: FlaskConical },
  { path: '/notes', label: 'Study Notes', shortLabel: 'Notes', icon: FileText },
  { path: '/voice', label: 'Voice Tutor', shortLabel: 'Voice', icon: Mic },
  { path: '/history', label: 'History', shortLabel: 'History', icon: HistoryIcon },
  { path: '/topics', label: 'CAPS Syllabus', shortLabel: 'Topics', icon: BookOpen },
];

const BrandMark = ({ className }) => (
  <div className={`neo-mark flex items-center justify-center border-2 border-[var(--clr-border)] bg-[var(--clr-accent)] text-[var(--clr-text-1)] shadow-[3px_3px_0_var(--clr-border)] ${className || 'h-8 w-8'}`} aria-hidden="true">
    <span className="text-lg font-black leading-none">↗</span>
  </div>
);

const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenu, setUserMenu] = useState(false);

  useEffect(() => {
    const onResize = () => setCollapsed(window.innerWidth >= 768 && window.innerWidth < 1080);
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const goToPath = (path) => { navigate(path); setMobileMenuOpen(false); };
  const mobileNavItems = tabs.slice(0, 4);
  const isMoreActive = tabs.slice(4).some((tab) => tab.path === location.pathname);

  return (
    <div className="flex h-dvh overflow-hidden bg-[var(--clr-bg)] text-[var(--clr-text-1)]">
      <aside className={`hidden md:flex shrink-0 flex-col border-r border-[var(--clr-border)] bg-[var(--clr-surface)] transition-[width] duration-200 ${collapsed ? 'w-[var(--sidebar-w-collapsed)]' : 'w-[var(--sidebar-w)]'}`}>
        <div className="flex h-20 items-center border-b border-[var(--clr-border)] px-4">
          <button onClick={() => goToPath('/dashboard')} className="flex items-center gap-3 rounded-lg text-left" aria-label="Go to Vector dashboard">
            <BrandMark className="h-9 w-9 shrink-0" />
            {!collapsed && <span className="text-base font-bold tracking-tight">Vector<span className="text-[var(--clr-primary)]">.</span>AI</span>}
            {!collapsed && <span className="redesign-tag ml-auto">new</span>}
          </button>
        </div>
        <nav className="flex-1 space-y-1 px-3 py-5" aria-label="Main navigation">
          <p className={`mb-3 px-3 text-[10px] font-bold uppercase tracking-[.16em] text-[var(--clr-text-3)] ${collapsed ? 'sr-only' : ''}`}>Workspace</p>
          {tabs.map(({ path, label, icon: Icon }) => {
            const active = location.pathname === path;
            return <button key={path} onClick={() => goToPath(path)} aria-current={active ? 'page' : undefined} title={collapsed ? label : undefined} className={`sidebar-item group flex w-full items-center gap-3 px-3 text-sm font-medium transition-colors ${active ? 'bg-[var(--clr-primary)]/10 text-[var(--clr-primary)]' : 'text-[var(--clr-text-2)] hover:bg-[var(--clr-surface-2)] hover:text-[var(--clr-text-1)]'} ${collapsed ? 'justify-center' : ''}`}><Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={active ? 2.3 : 1.8} />{!collapsed && <span>{label}</span>}</button>;
          })}
        </nav>
        <div className="space-y-2 border-t border-[var(--clr-border)] p-3">
          <ThemeToggle className={collapsed ? 'mx-auto' : ''} />
          <button onClick={() => setCollapsed(!collapsed)} className="hidden w-full items-center gap-3 rounded-lg px-3 py-2 text-xs font-semibold text-[var(--clr-text-3)] hover:bg-[var(--clr-surface-2)] lg:flex">{collapsed ? <ChevronRight className="mx-auto h-4 w-4" /> : <><ChevronLeft className="h-4 w-4" /> Collapse sidebar</>}</button>
          <div className="relative pt-1">
            <button onClick={() => setUserMenu(!userMenu)} className="flex w-full items-center gap-3 rounded-lg p-2 text-left hover:bg-[var(--clr-surface-2)]" aria-expanded={userMenu}>
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--clr-surface-3)]"><User className="h-4 w-4 text-[var(--clr-primary)]" /></div>
              {!collapsed && <div className="min-w-0"><p className="truncate text-xs font-semibold">{user?.name || 'Learner'}</p><p className="text-[10px] text-[var(--clr-text-3)]">Grade 12 Student</p></div>}
            </button>
            {userMenu && <div className="absolute bottom-full left-0 z-20 mb-2 w-full rounded-lg border border-[var(--clr-border)] bg-[var(--clr-surface)] p-1 shadow-[var(--shadow-md)]"><button onClick={() => { logout(); setUserMenu(false); }} className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-500/10"><LogOut className="h-4 w-4" /> Sign out</button></div>}
          </div>
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <main className="min-h-0 flex-1 overflow-y-auto page-enter">{children}</main>
        <nav className="flex h-[var(--mobile-tab-h)] shrink-0 items-center border-t border-[var(--clr-border)] bg-[var(--clr-surface)] md:hidden" aria-label="Mobile navigation">
          {mobileNavItems.map(({ path, shortLabel, icon: Icon }) => { const active = location.pathname === path; return <button key={path} onClick={() => goToPath(path)} aria-current={active ? 'page' : undefined} className={`flex h-full flex-1 flex-col items-center justify-center gap-1 text-[10px] font-semibold ${active ? 'text-[var(--clr-primary)]' : 'text-[var(--clr-text-3)]'}`}><Icon className="h-5 w-5" /><span>{shortLabel}</span></button>; })}
          <button onClick={() => setMobileMenuOpen(true)} className={`flex h-full flex-1 flex-col items-center justify-center gap-1 text-[10px] font-semibold ${isMoreActive ? 'text-[var(--clr-primary)]' : 'text-[var(--clr-text-3)]'}`}><MoreHorizontal className="h-5 w-5" /><span>More</span></button>
        </nav>
      </div>
      {mobileMenuOpen && <div className="fixed inset-0 z-40 md:hidden"><button className="absolute inset-0 bg-black/40" onClick={() => setMobileMenuOpen(false)} aria-label="Close menu" /><section className="absolute bottom-0 left-0 right-0 max-h-[80dvh] overflow-y-auto rounded-t-2xl border-t border-[var(--clr-border)] bg-[var(--clr-surface)] p-5 shadow-[var(--shadow-md)]"><div className="mb-5 flex items-center justify-between"><div className="flex items-center gap-2"><BrandMark className="h-8 w-8" /><h2 className="text-base font-bold">More workspace tools</h2></div><button onClick={() => setMobileMenuOpen(false)} className="rounded-lg p-2 hover:bg-[var(--clr-surface-2)]" aria-label="Close menu"><X className="h-5 w-5" /></button></div><div className="grid grid-cols-2 gap-2">{tabs.slice(4).map(({ path, label, icon: Icon }) => <button key={path} onClick={() => goToPath(path)} className="flex min-h-20 flex-col items-start justify-between rounded-lg border border-[var(--clr-border)] bg-[var(--clr-surface-2)] p-3 text-left text-sm font-semibold hover:border-[var(--clr-border-bright)]"><Icon className="h-5 w-5 text-[var(--clr-primary)]" /><span>{label}</span></button>)}</div><div className="mt-5 border-t border-[var(--clr-border)] pt-4"><ThemeToggle /><button onClick={() => { logout(); setMobileMenuOpen(false); }} className="mt-3 flex w-full items-center gap-2 rounded-lg border border-red-500/20 px-3 py-3 text-sm font-semibold text-red-600"><LogOut className="h-4 w-4" /> Sign out</button></div></section></div>}
    </div>
  );
};

export default Layout;
