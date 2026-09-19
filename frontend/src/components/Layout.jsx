import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import ThemeToggle from "./ThemeToggle";
import VectorIcon from "./VectorIcon.jsx";
import {
  ChatCircleIcon,
  FlaskIcon,
  BookOpenIcon,
  SquaresFourIcon,
  GraduationCapIcon,
  NotebookIcon,
  ClipboardTextIcon,
  ClockCounterClockwiseIcon,
  MicrophoneIcon,
  SignOutIcon,
  UserIcon,
  CaretLeftIcon,
  CaretRightIcon,
  HouseIcon,
  DotsThreeIcon,
  XIcon,
  GearIcon,
} from "@phosphor-icons/react";

export const NAV_GROUPS = [
  {
    title: "LEARN",
    items: [
      { path: "/dashboard", label: "Dashboard", icon: HouseIcon },
      { path: "/subjects", label: "Subjects", icon: SquaresFourIcon },
      { path: "/topics", label: "Topics", icon: BookOpenIcon },
    ],
  },
  {
    title: "PRACTICE",
    items: [
      { path: "/revision", label: "Revision", icon: GraduationCapIcon },
      { path: "/exams", label: "Mock Exams", icon: ClipboardTextIcon },
    ],
  },
  {
    title: "CREATE",
    items: [{ path: "/notes", label: "Notes", icon: NotebookIcon }],
  },
  {
    title: "EXPLORE",
    items: [{ path: "/lab", label: "Physics Lab", icon: FlaskIcon }],
  },
  {
    title: "VECTOR",
    items: [
      { path: "/chat", label: "AI Tutor", icon: ChatCircleIcon },
      { path: "/voice", label: "Voice Tutor", icon: MicrophoneIcon },
      { path: "/history", label: "History", icon: ClockCounterClockwiseIcon },
      { path: "/settings", label: "Settings", icon: GearIcon },
    ],
  },
];
const FLAT = NAV_GROUPS.flatMap((g) => g.items);
const MOBILE = [
  { path: "/dashboard", label: "Home", icon: HouseIcon },
  { path: "/chat", label: "Tutor", icon: ChatCircleIcon },
  { path: "/revision", label: "Revise", icon: GraduationCapIcon },
  { path: "/lab", label: "Lab", icon: FlaskIcon },
];

/**
 * Neo-brutalist Vector identity tile.
 *
 * An emerald tile carrying the "Vector V" — a bold hard-edged chevron over a
 * solid foundation bar. 2px black border, offset hard shadow, flat surface.
 * The mark reads as Vector's identity colour everywhere it appears.
 */
export const BrandMark = ({ c = "h-10 w-10" }) => (
  <div
    className={`flex shrink-0 items-center justify-center border-2 border-[var(--border)] bg-[var(--emerald)] shadow-[2px_2px_0_var(--border)] ${c}`}
    aria-hidden="true"
  >
    <VectorIcon
      className="h-[56%] w-[56%]"
      color="#FFFFFF"
      accent="var(--ink)"
    />
  </div>
);
const NavBtn = ({ p, label, Icon, active, collapsed, onGo }) => (
  <button
    onClick={() => onGo(p)}
    aria-current={active ? "page" : undefined}
    title={collapsed ? label : undefined}
    className={`flex w-full items-center gap-3 border-b-2 border-[var(--border)] px-3 py-3 text-[13px] font-extrabold uppercase tracking-wide last:border-b-0 ${active ? "bg-[var(--emerald)] text-[#0B1410]" : "text-[var(--ink)] hover:bg-[var(--surface-muted)]"} ${collapsed ? "justify-center px-0" : ""}`}
  >
    <Icon
      className="h-5 w-5 shrink-0"
      weight={active ? "fill" : "bold"}
      aria-hidden="true"
    />
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
    const onR = () =>
      setCollapsed(window.innerWidth >= 768 && window.innerWidth < 1080);
    onR();
    window.addEventListener("resize", onR);
    return () => window.removeEventListener("resize", onR);
  }, []);
  useEffect(() => { setUserMenu(false); setMoreOpen(false); }, [location.pathname]);
  const go = (p) => { navigate(p); setMoreOpen(false); };
  const moreActive = FLAT.filter((t) => !MOBILE.some((m) => m.path === t.path)).some((t) => location.pathname === t.path);
  const initial = (user?.name || user?.email || 'V').trim().charAt(0).toUpperCase() || 'V';
  return (
    <div className="flex h-dvh overflow-hidden bg-[var(--paper)] font-sans text-[var(--ink)]">
      <aside
        className={`hidden shrink-0 flex-col border-r-[3px] border-[var(--border)] bg-[var(--surface)] md:flex ${collapsed ? "w-20" : "w-64"}`}
      >
        <div className="flex h-20 items-center border-b-[3px] border-[var(--border)] px-4">
          <button
            onClick={() => go("/dashboard")}
            className="flex w-full items-center gap-3 text-left"
            aria-label="Go to dashboard"
          >
            <BrandMark />
            {!collapsed && (
              <span className="font-display text-xl font-bold uppercase">
                Vector<span className="text-[var(--magenta)]">.</span>AI
              </span>
            )}
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto px-3 py-5" aria-label="Main">
          {NAV_GROUPS.map((g) => (
            <div key={g.title} className="mb-5 last:mb-0">
              {!collapsed && (
                <p className="section-label mb-2 px-2">{g.title}</p>
              )}
              <div className="flex flex-col overflow-hidden border-2 border-[var(--border)] bg-[var(--paper)]">
                {g.items.map((it) => (
                  <NavBtn
                    key={it.path}
                    p={it.path}
                    label={it.label}
                    Icon={it.icon}
                    collapsed={collapsed}
                    onGo={go}
                    active={location.pathname === it.path}
                  />
                ))}
              </div>
            </div>
          ))}
        </nav>
        <div className="border-t-[3px] border-[var(--border)] p-3">
          <div className="relative">
            <button
              onClick={() => setUserMenu((v) => !v)}
              aria-expanded={userMenu}
              aria-haspopup="menu"
              className="flex w-full items-center gap-3 border-2 border-[var(--border)] bg-[var(--paper)] p-2 text-left shadow-[2px_2px_0_var(--border)]"
            >
              <span
                className="flex h-9 w-9 items-center justify-center border-2 border-[var(--border)] bg-[var(--magenta)] text-sm font-black text-white"
                aria-hidden="true"
              >
                {initial}
              </span>
              {!collapsed && (
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-extrabold">
                    {user?.name || "Learner"}
                  </span>
                  <span className="block truncate text-[11px] font-bold uppercase text-[var(--ink-muted)]">
                    {user?.email || "Vector"}
                  </span>
                </span>
              )}
              {!collapsed &&
                (userMenu ? (
                  <CaretLeftIcon
                    className="h-4 w-4"
                    weight="bold"
                    aria-hidden="true"
                  />
                ) : (
                  <CaretRightIcon
                    className="h-4 w-4"
                    weight="bold"
                    aria-hidden="true"
                  />
                ))}
            </button>
            <AnimatePresence>
              {userMenu && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  transition={{ duration: 0.18, ease: "easeOut" }}
                  role="menu"
                  className="absolute bottom-[calc(100%+8px)] left-0 right-0 z-30 border-2 border-[var(--border)] bg-[var(--surface)] p-2 shadow-[4px_4px_0_var(--border)]"
                >
                  <div className="flex items-center gap-2 border-2 border-[var(--border)] bg-[var(--paper)] p-2 text-xs font-bold text-[var(--ink-muted)]">
                    <UserIcon
                      className="h-4 w-4"
                      weight="bold"
                      aria-hidden="true"
                    />
                    <span className="truncate">
                      {user?.email || "Signed in"}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center justify-between border-2 border-[var(--border)] bg-[var(--paper)] px-2 py-1.5">
                    <span className="text-[11px] font-black uppercase">
                      Theme
                    </span>
                    <ThemeToggle />
                  </div>
                  <button
                    onClick={logout}
                    className="neo-btn neo-btn-danger mt-2 w-full px-3 py-2.5 text-xs"
                  >
                    <SignOutIcon
                      className="mr-2 h-4 w-4"
                      weight="bold"
                      aria-hidden="true"
                    />
                    Sign out
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="no-print flex h-16 shrink-0 items-center justify-between gap-3 border-b-[3px] border-[var(--border)] bg-[var(--surface)] px-4 md:px-7">
          <div className="flex items-center gap-3">
            <button
              onClick={() => go("/dashboard")}
              className="flex items-center gap-2 md:hidden"
              aria-label="Dashboard"
            >
              <BrandMark c="h-9 w-9" />
              <span className="font-display text-lg font-bold uppercase">
                Vector.AI
              </span>
            </button>
            <p className="section-label hidden truncate md:block">
              CAPS Physical Sciences · Grades 10-12
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="neo-tag neo-tag-emerald hidden sm:inline-flex">
              CAPS Aligned
            </span>
            <span className="neo-tag neo-tag-magenta hidden lg:inline-flex">
              STEM OS
            </span>
            <ThemeToggle />
          </div>
        </header>
        <main className="app-shell-main">
          <div className="app-page">{children}</div>
        </main>
        <nav
          className="no-print fixed inset-x-0 bottom-0 z-30 grid h-[var(--mobile-tab-h)] grid-cols-5 border-t-[3px] border-[var(--border)] bg-[var(--surface)] md:hidden"
          aria-label="Mobile"
        >
          {MOBILE.map((t) => {
            const a = location.pathname === t.path;
            const I = t.icon;
            return (
              <button
                key={t.path}
                onClick={() => go(t.path)}
                aria-current={a ? "page" : undefined}
                className={`flex h-full min-h-[56px] flex-col items-center justify-center gap-1 border-r-2 border-[var(--border)] text-[10px] font-black uppercase last:border-r-0 ${a ? "bg-[var(--emerald)] text-[#0B1410]" : "text-[var(--ink)]"}`}
              >
                <I
                  className="h-6 w-6"
                  weight={a ? "fill" : "bold"}
                  aria-hidden="true"
                />
                <span>{t.label}</span>
              </button>
            );
          })}
          <button
            onClick={() => setMoreOpen(true)}
            aria-label="All tools"
            aria-expanded={moreOpen}
            className={`flex h-full min-h-[56px] flex-col items-center justify-center gap-1 text-[10px] font-black uppercase ${moreActive ? "bg-[var(--magenta)] text-white" : ""}`}
          >
            <DotsThreeIcon className="h-6 w-6" weight="bold" aria-hidden="true" />
            <span>More</span>
          </button>
        </nav>
      </div>
      <AnimatePresence>
        {moreOpen && (
          <div className="fixed inset-0 z-40 md:hidden">
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60"
              onClick={() => setMoreOpen(false)}
              aria-label="Close menu"
            />
            <motion.section
              initial={{ y: 48, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 48, opacity: 0 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              className="absolute inset-x-0 bottom-0 max-h-[85dvh] overflow-y-auto border-t-[3px] border-[var(--border)] bg-[var(--surface)] p-5"
              aria-label="All tools"
            >
              <div className="mb-5 flex items-center justify-between border-b-[3px] border-[var(--border)] pb-4">
                <div className="flex items-center gap-3">
                  <BrandMark />
                  <h2 className="text-xl font-black uppercase">All tools</h2>
                </div>
                <button
                  onClick={() => setMoreOpen(false)}
                  className="border-2 border-[var(--border)] p-2 shadow-[2px_2px_0_var(--border)]"
                  aria-label="Close"
                >
                  <XIcon className="h-6 w-6" weight="bold" aria-hidden="true" />
                </button>
              </div>
              {NAV_GROUPS.map((g) => (
                <div key={g.title} className="mb-5">
                  <p className="section-label mb-2">{g.title}</p>
                  <div className="grid grid-cols-2 gap-3">
                    {g.items.map((it) => {
                      const a = location.pathname === it.path;
                      const I = it.icon;
                      return (
                        <button
                          key={it.path}
                          onClick={() => go(it.path)}
                          aria-current={a ? "page" : undefined}
                          className={`flex min-h-[92px] flex-col justify-between border-2 border-[var(--border)] p-3 text-left shadow-[3px_3px_0_var(--border)] ${a ? "bg-[var(--emerald)] text-[#0B1410]" : "bg-[var(--paper)]"}`}
                        >
                          <I
                            className="h-7 w-7"
                            weight={a ? "fill" : "bold"}
                            aria-hidden="true"
                          />
                          <span className="mt-2 text-[13px] font-black uppercase">
                            {it.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </motion.section>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
export default Layout;
