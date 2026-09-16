import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from './ThemeToggle';
import { MessageSquare, FlaskConical, BookOpen, Layers, GraduationCap, NotebookPen, ClipboardCheck, History as HIcon, Mic, LogOut, User, ChevronLeft, ChevronRight, LayoutDashboard, MoreHorizontal, X } from 'lucide-react';
export const NAV_GROUPS = [
  { title: 'LEARN', items: [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/subjects', label: 'Subjects', icon: Layers },
    { path: '/topics', label: 'Topics', icon: BookOpen }]},
  { title: 'PRACTICE', items: [
    { path: '/revision', label: 'Revision', icon: GraduationCap },
    { path: '/exams', label: 'Mock Exams', icon: ClipboardCheck }]},
  { title: 'CREATE', items: [{ path: '/notes', label: 'Notes', icon: NotebookPen }]},
  { title: 'EXPLORE', items: [{ path: '/lab', label: 'Physics Lab', icon: FlaskConical }]},
  { title: 'VECTOR', items: [
    { path: '/chat', label: 'AI Tutor', icon: MessageSquare },
    { path: '/voice', label: 'Voice Tutor', icon: Mic },
    { path: '/history', label: 'History', icon: HIcon }]},
];
const FLAT = NAV_GROUPS.flatMap((g) => g.items);
const MOBILE = [
  { path: '/dashboard', label: 'Home', icon: LayoutDashboard },
  { path: '/chat', label: 'Tutor', icon: MessageSquare },
  { path: '/revision', label: 'Revise', icon: GraduationCap },
  { path: '/lab', label: 'Lab', icon: FlaskConical },
];
export const BrandMark = ({ c }) => (
  <div className={`flex items-center justify-center border-2 border-[var(--border)] bg-[var(--emerald)] text-white shadow-[2px_2px_0_var(--border)] ${c || 'h-10 w-10'}`} aria-hidden="true"><span className="text-xl font-black leading-none">V</span></div>
);
const NavBtn = ({ p, label, Icon, active, collapsed, onGo }) => (
  <button onClick={() => onGo(p)} aria-current={active ? 'page' : undefined} title={collapsed ? label : undefined} className={`flex w-full items-center gap-3 border-b-2 border-[var(--border)] px-3 py-3 text-[13px] font-extrabold uppercase tracking-wide last:border-b-0 ${active ? 'bg-[var(--emerald)] text-white' : 'text-[var(--ink)] hover:bg-[var(--surface-muted)]'} ${collapsed ? 'justify-center px-0' : ''}`}>
    <Icon className="h-5 w-5 shrink-0" strokeWidth={active ? 2.75 : 2} aria-hidden="true" />
    {!collapsed && <span className="truncate">{label}</span>}
  </button>
);
const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [userMenu, setUserMenu] = useState(false);
  useEffect(() => {
    const onR = () => setCollapsed(window.innerWidth >= 768 && window.innerWidth < 1080);
    onR(); window.addEventListener('resize', onR);
    return () => window.removeEventListener('resize', onR);
  }, []);
  useEffect(() => { setUserMenu(false); setMoreOpen(false); }, [location.pathname]);
  const go = (p) => { navigate(p); setMoreOpen(false); };
  const moreActive = FLAT.filter((t) => !MOBILE.some((m) => m.path === t.path)).some((t) => location.pathname === t.path);
  const initial = (user?.name || user?.email || 'V').trim().charAt(0).toUpperCase() || 'V';
  return (
    <div className="flex h-dvh overflow-hidden bg-[var(--paper)] font-sans text-[var(--ink)]">
      <aside className={`hidden shrink-0 flex-col border-r-[3px] border-[var(--border)] bg-[var(--surface)] md:flex ${collapsed ? 'w-[var(--sidebar-w-collapsed)]' : 'w-[var(--sidebar-w)]'}`}>
        <div className="flex h-20 items-center border-b-[3px] border-[var(--border)] px-4">
          <button onClick={() => go('/dashboard')} className="flex w-full items-center gap-3 text-left" aria-label="Go to dashboard">
            <BrandMark />
            {!collapsed && <span className="text-xl font-black uppercase">Vector<span className="text-[var(--emerald)]">.</span>AI</span>}
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto px-3 py-5" aria-label="Main">
          {NAV_GROUPS.map((g) => (
            <div key={g.title} className="mb-5 last:mb-0">
              {!collapsed && <p className="section-label mb-2 px-2">{g.title}</p>}
              <div className="flex flex-col overflow-hidden border-2 border-[var(--border)] bg-[var(--paper)]">
                {g.items.map((it) => (<NavBtn key={it.path} p={it.path} label={it.label} Icon={it.icon} collapsed={collapsed} onGo={go} active={location.pathname === it.path} />))}
              </div>
            </div>
          ))}
        </nav>
        <div className="border-t-[3px] border-[var(--border)] p-3">
          <div className="relative">
            <button onClick={() => setUserMenu((v) => !v)} aria-expanded={userMenu} className="flex w-full items-center gap-3 border-2 border-[var(--border)] bg-[var(--paper)] p-2 text-left shadow-[2px_2px_0_var(--border)]">
              <span className="flex h-9 w-9 items-center justify-center border-2 border-[var(--border)] bg-[var(--ink)] text-sm font-black text-[var(--paper)]" aria-hidden="true">{initial}</span>
              {!collapsed && <span className="min-w-0 flex-1"><span className="block truncate text-sm font-extrabold">{user?.name || 'Learner'}</span><span className="block truncate text-[11px] font-bold uppercase text-[var(--ink-muted)]">{user?.email || 'Vector'}</span></span>}
              {!collapsed && (userMenu ? <ChevronLeft className="h-4 w-4" aria-hidden="true" /> : <ChevronRight className="h-4 w-4" aria-hidden="true" />)}
            </button>
            {userMenu && (
              <div className="absolute bottom-[calc(100%+8px)] left-0 right-0 z-30 border-2 border-[var(--border)] bg-[var(--surface)] p-2 shadow-[4px_4px_0_var(--border)]">
                <div className="flex items-center gap-2 border-2 border-[var(--border)] bg-[var(--paper)] p-2 text-xs font-bold text-[var(--ink-muted)]"><User className="h-4 w-4" aria-hidden="true" /><span className="truncate">{user?.email || 'Signed in'}</span></div>
                <div className="mt-2 flex items-center justify-between border-2 border-[var(--border)] bg-[var(--paper)] px-2 py-1.5"><span className="text-[11px] font-black uppercase">Theme</span><ThemeToggle /></div>
                <button onClick={logout} className="neo-btn neo-btn-danger mt-2 w-full px-3 py-2.5 text-xs"><LogOut className="mr-2 h-4 w-4" aria-hidden="true" />Sign out</button>
              </div>
            )}
          </div>
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="no-print flex h-16 shrink-0 items-center justify-between gap-3 border-b-[3px] border-[var(--border)] bg-[var(--surface)] px-4 md:px-8">
          <div className="flex items-center gap-3">
            <button onClick={() => go('/dashboard')} className="flex items-center gap-2 md:hidden" aria-label="Dashboard"><BrandMark c="h-9 w-9" /><span className="text-lg font-black uppercase">Vector.AI</span></button>
            <p className="section-label hidden truncate md:block">CAPS Physical Sciences · Grades 10-12</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="neo-tag neo-tag-emerald hidden sm:inline-flex">CAPS Aligned</span>
            <ThemeToggle />
          </div>
        </header>
        <main className="min-h-0 flex-1 overflow-y-auto px-4 pb-28 pt-6 md:px-8 md:pb-12 md:pt-8"><div className="page-enter mx-auto w-full max-w-6xl">{children}</div></main>
        <nav className="no-print fixed inset-x-0 bottom-0 z-30 grid h-[var(--mobile-tab-h)] grid-cols-5 border-t-[3px] border-[var(--border)] bg-[var(--surface)] md:hidden" aria-label="Mobile">
          {MOBILE.map((t) => { const a = location.pathname === t.path; const I = t.icon; return (<button key={t.path} onClick={() => go(t.path)} aria-current={a ? 'page' : undefined} className={`flex h-full flex-col items-center justify-center gap-1 border-r-2 border-[var(--border)] text-[10px] font-black uppercase last:border-r-0 ${a ? 'bg-[var(--emerald)] text-white' : 'text-[var(--ink)]'}`}><I className="h-6 w-6" strokeWidth={a ? 2.75 : 2} aria-hidden="true" /><span>{t.label}</span></button>); })}
          <button onClick={() => setMoreOpen(true)} aria-label="All tools" className="flex h-full flex-col items-center justify-center gap-1 text-[10px] font-black uppercase"><MoreHorizontal className="h-6 w-6" aria-hidden="true" /><span>More</span></button>
        </nav>
      </div>
      {moreOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <button className="absolute inset-0 bg-black/60" onClick={() => setMoreOpen(false)} aria-label="Close menu" />
          <section className="absolute inset-x-0 bottom-0 max-h-[85dvh] overflow-y-auto border-t-[3px] border-[var(--border)] bg-[var(--surface)] p-5" aria-label="All tools">
            <div className="mb-5 flex items-center justify-between border-b-[3px] border-[var(--border)] pb-4">
              <div className="flex items-center gap-3"><BrandMark /><h2 className="text-xl font-black uppercase">All tools</h2></div>
              <button onClick={() => setMoreOpen(false)} className="border-2 border-[var(--border)] p-2 shadow-[2px_2px_0_var(--border)]" aria-label="Close"><X className="h-6 w-6" aria-hidden="true" /></button>
            </div>
            {NAV_GROUPS.map((g) => (
              <div key={g.title} className="mb-5"><p className="section-label mb-2">{g.title}</p>
                <div className="grid grid-cols-2 gap-3">
                  {g.items.map((it) => { const a = location.pathname === it.path; const I = it.icon; return (<button key={it.path} onClick={() => go(it.path)} className={`flex min-h-[92px] flex-col justify-between border-2 border-[var(--border)] p-3 text-left shadow-[3px_3px_0_var(--border)] ${a ? 'bg-[var(--emerald)] text-white' : 'bg-[var(--paper)]'}`}><I className={`h-7 w-7 ${a ? 'text-white' : 'text-[var(--emerald)]'}`} aria-hidden="true" /><span className="mt-2 text-[13px] font-black uppercase">{it.label}</span></button>); })}
                </div>
              </div>
            ))}
          </section>
        </div>
      )}
    </div>
  );
};
export default Layout;
