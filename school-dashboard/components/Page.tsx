import Head from 'next/head';
import React, { useEffect, useState } from 'react';
import { ToastBar, Toaster, toast } from 'react-hot-toast';
import Header from './navagation/Header';
import { SmallGradientButton } from './styles/Button';
import ThemeSwitcher from './styles/ThemeSwitcher';

interface PageProps {
  children: React.ReactNode;
}

export default function Page({ children }: PageProps) {
  // get theme from local storage
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  // set theme to local storage and update document class
  const setLocalTheme = (newTheme: 'light' | 'dark') => {
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);

    // Update document class for Tailwind dark mode and DaisyUI theme
    if (typeof document !== 'undefined') {
      if (newTheme === 'dark') {
        document.documentElement.classList.add('dark');
        document.documentElement.setAttribute('data-theme', 'ncujhs-dark');
      } else {
        document.documentElement.classList.remove('dark');
        document.documentElement.setAttribute('data-theme', 'ncujhs-light');
      }
    }
  };

  // get theme from local storage if it exists and on client
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const localTheme = localStorage.getItem('theme');
      if (localTheme && (localTheme === 'light' || localTheme === 'dark')) {
        setTheme(localTheme);
        // Set initial document class and DaisyUI theme
        if (localTheme === 'dark') {
          document.documentElement.classList.add('dark');
          document.documentElement.setAttribute('data-theme', 'ncujhs-dark');
        } else {
          document.documentElement.classList.remove('dark');
          document.documentElement.setAttribute('data-theme', 'ncujhs-light');
        }
      } else {
        // Default to light mode
        document.documentElement.setAttribute('data-theme', 'ncujhs-light');
      }
    }
  }, []);

  return (
    <div className="min-h-screen bg-[var(--backgroundColor)] text-[var(--textColor)]">
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>NCUJHS Dashboard</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Header />
      <ThemeSwitcher theme={theme} setTheme={setLocalTheme} />
      <Toaster
        position="top-right"
        toastOptions={{
          className: 'toast-custom',
          style: {
            background: 'linear-gradient(135deg, rgba(118, 13, 8, 0.95), rgba(56, 182, 255, 0.95))',
            border: '2px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '12px',
            padding: '12px 16px',
            color: '#ffffff',
            fontWeight: '500',
            letterSpacing: '0.5px',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15), 0 4px 12px rgba(118, 13, 8, 0.3)',
            backdropFilter: 'blur(8px)',
            maxWidth: '400px',
            fontSize: '14px',
            fontFamily: 'radnika_next, system-ui, sans-serif',
          },
          success: {
            duration: 4000,
            icon: '✅',
            style: {
              background: 'linear-gradient(135deg, rgba(118, 13, 8, 0.95), rgba(56, 182, 255, 0.95))',
              border: '2px solid rgba(56, 182, 255, 0.4)',
            },
            ariaProps: {
              role: 'status',
              'aria-live': 'polite',
            },
          },
          error: {
            duration: 5000,
            icon: '❌',
            style: {
              background: 'linear-gradient(135deg, rgba(118, 13, 8, 0.95), rgba(56, 182, 255, 0.95))',
              border: '2px solid rgba(118, 13, 8, 0.4)',
            },
            ariaProps: {
              role: 'alert',
              'aria-live': 'assertive',
            },
          },
          loading: {
            icon: '⏳',
            style: {
              background: 'linear-gradient(135deg, rgba(118, 13, 8, 0.95), rgba(56, 182, 255, 0.95))',
              border: '2px solid rgba(56, 182, 255, 0.3)',
            },
          },
        }}
      >
        {(t) => (
          <ToastBar toast={t}>
            {({ icon, message }) => (
              <div className="flex items-center gap-3 w-full">
                <div className="flex-shrink-0 text-lg">
                  {icon}
                </div>
                <div className="flex-1 text-white font-medium">
                  {message}
                </div>
                {t.type !== 'loading' && (
                  <button
                    onClick={() => toast.dismiss(t.id)}
                    className="flex-shrink-0 ml-2 text-white/80 hover:text-white text-lg font-bold transition-all duration-200 hover:scale-110 focus:outline-none w-6 h-6 flex items-center justify-center rounded-full hover:bg-white/10"
                    aria-label="Close notification"
                  >
                    ×
                  </button>
                )}
              </div>
            )}
          </ToastBar>
        )}
      </Toaster>
      <div className="max-w-[var(--maxWidth)] mx-auto p-8">{children}</div>
    </div>
  );
}
