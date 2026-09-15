import { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';

const ThemeToggle = () => {
  const [theme, setTheme] = useState(() => {
    const stored = localStorage.getItem('theme');
    if (stored === 'dark' || stored === 'light') return stored;
    if (window.matchMedia?.('(prefers-color-scheme: dark)').matches) return 'dark';
    return 'light';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.remove('dark');
      root.classList.add('light');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  return (
    <button
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className="flex items-center justify-center border-2 border-[var(--clr-border)] bg-[var(--clr-accent)] p-2 text-[var(--clr-text-1)] shadow-[3px_3px_0_var(--clr-border)] transition-all hover:-translate-y-0.5 hover:bg-[var(--clr-primary)] active:translate-y-0"
      aria-label="Toggle Theme"
    >
      {theme === 'dark' ? (
        <Sun className="h-4 w-4 text-black transition-transform duration-300" />
      ) : (
        <Moon className="h-4 w-4 text-black transition-transform duration-300" />
      )}
    </button>
  );
};

export default ThemeToggle;
