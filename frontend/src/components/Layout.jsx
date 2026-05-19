import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from './ThemeToggle';
import { 
  MessageSquare, FlaskConical, BookOpen, History as HistoryIcon, 
  Mic, FileText, Gauge, LogOut, Menu, X, User 
} from 'lucide-react';

const Layout = ({ currentTab, onTabChange, children }) => {
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const menuItems = [
    { id: 'chat', label: 'AI Tutor', icon: MessageSquare },
    { id: 'lab', label: 'Visual Lab', icon: FlaskConical },
    { id: 'notes', label: 'Study Notes', icon: FileText },
    { id: 'voice', label: 'Voice Tutor', icon: Mic },
    { id: 'history', label: 'History', icon: HistoryIcon },
    { id: 'topics', label: 'CAPS Syllabus', icon: BookOpen },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100 font-sans">
      {/* Sidebar for Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-zinc-100 dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 shrink-0">
        <div className="p-5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {/* Logo */}
            <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-emerald-500/20">
              V
            </div>
            <div>
              <h1 className="font-bold text-sm leading-tight tracking-tight">Vector AI</h1>
              <p className="text-[10px] text-zinc-400 font-medium tracking-wide uppercase">STEM OS</p>
            </div>
          </div>
          <ThemeToggle />
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer ${
                  isActive
                    ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/10'
                    : 'text-zinc-600 hover:bg-zinc-200 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'stroke-[2.5px]' : ''}`} />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Footer Profile & Logout */}
        <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-100/50 dark:bg-zinc-900/50">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-3 min-w-0">
              {user?.avatar ? (
                <img src={user.avatar} alt="avatar" className="w-9 h-9 rounded-full border border-zinc-200 dark:border-zinc-800" />
              ) : (
                <div className="w-9 h-9 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center">
                  <User className="w-4 h-4 text-zinc-400" />
                </div>
              )}
              <div className="min-w-0">
                <p className="text-xs font-semibold truncate dark:text-zinc-200">{user?.name || 'Taro Mukhalela'}</p>
                <p className="text-[10px] text-zinc-400 truncate font-medium">CAPS Learner</p>
              </div>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-zinc-200 hover:bg-red-500/10 hover:text-red-500 dark:bg-zinc-800 dark:hover:bg-red-500/15 dark:hover:text-red-400 rounded-lg text-xs font-semibold text-zinc-700 dark:text-zinc-300 transition-all cursor-pointer border border-zinc-300/30 dark:border-zinc-700/30"
          >
            <LogOut className="w-3.5 h-3.5" />
            Logout
          </button>
        </div>
      </aside>

      {/* Mobile Top Bar */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <header className="md:hidden flex items-center justify-between px-4 py-3 bg-zinc-100 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded bg-emerald-500 flex items-center justify-center text-white font-bold text-sm">
              V
            </div>
            <h1 className="font-bold text-sm tracking-tight">Vector AI</h1>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </header>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden fixed inset-x-0 top-[53px] bottom-0 bg-zinc-950/80 backdrop-blur-sm z-50 transition-all">
            <nav className="bg-zinc-100 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 p-4 space-y-2">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      onTabChange(item.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-emerald-500 text-white shadow-md'
                        : 'text-zinc-700 hover:bg-zinc-200 dark:text-zinc-400 dark:hover:bg-zinc-800'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </button>
                );
              })}
              <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center">
                    <User className="w-4 h-4 text-zinc-400" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold">{user?.name || 'Taro Mukhalela'}</p>
                    <p className="text-[10px] text-zinc-400">CAPS Learner</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                  className="flex items-center gap-1.5 py-1.5 px-3 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg text-xs font-semibold transition-all cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Logout
                </button>
              </div>
            </nav>
          </div>
        )}

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto relative bg-zinc-50 dark:bg-zinc-950">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
