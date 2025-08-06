import { FaMoon, FaSun } from 'react-icons/fa';

interface ThemeSwitcherProps {
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
}

export default function ThemeSwitcher({ theme, setTheme }: ThemeSwitcherProps) {
  return (
    <div className="fixed bottom-0 right-0 z-50">
      <div className="flex flex-wrap justify-between items-center">
        {theme === 'dark' && (
          <button
            className="flex items-center justify-center w-12 h-12 m-2 text-yellow-400 bg-gray-600 border-none rounded-full shadow-lg cursor-pointer transition-all duration-300 hover:shadow-xl hover:brightness-110"
            onClick={() => setTheme('light')}
            aria-label="Switch to light mode"
          >
            <FaSun className="text-2xl" />
          </button>
        )}
        {theme === 'light' && (
          <button
            className="flex items-center justify-center w-12 h-12 m-2 text-yellow-400 bg-gray-600 border-none rounded-full shadow-lg cursor-pointer transition-all duration-300 hover:shadow-xl hover:brightness-110"
            onClick={() => setTheme('dark')}
            aria-label="Switch to dark mode"
          >
            <FaMoon className="text-2xl" />
          </button>
        )}
      </div>
    </div>
  );
}
