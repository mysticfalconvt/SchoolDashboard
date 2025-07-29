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
          <div className="flex items-center justify-center w-12 h-12 m-2 text-yellow-400 bg-gray-600 rounded-full shadow-lg cursor-pointer transition-all duration-300 hover:shadow-xl">
            <div
              className="flex items-center justify-center w-full h-full"
              onClick={() => {
                setTheme('light');
              }}
            >
              <FaSun className="text-2xl" />
            </div>
          </div>
        )}
        {theme === 'light' && (
          <div className="flex items-center justify-center w-12 h-12 m-2 text-yellow-400 bg-gray-600 rounded-full shadow-lg cursor-pointer transition-all duration-300 hover:shadow-xl">
            <div
              className="flex items-center justify-center w-full h-full"
              onClick={() => {
                setTheme('dark');
              }}
            >
              <FaMoon className="text-2xl" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
