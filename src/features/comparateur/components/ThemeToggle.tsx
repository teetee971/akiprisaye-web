import { useTheme } from '../../../context/ThemeContext';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button 
      className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors text-2xl"
      onClick={toggleTheme}
      aria-label={`Basculer vers le thème ${theme === 'light' ? 'sombre' : 'clair'}`}
    >
      {theme === 'light' ? '🌙' : '☀️'}
    </button>
  );
}
